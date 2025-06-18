import asyncio
import logging
from audio import AudioRecorder, get_inputs
from services.config import ConfigKey, ConfigService
from setup import Registry
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)



class VoiceService():
    def __init__(self, registry: Registry, config_service: ConfigService) -> None:
        self.registry = registry
        self.config_service = config_service
        return

    def start_record(self, device_id: int, on_data: Callable[[str], Awaitable[None]], on_error: Callable[[Exception], Awaitable[None]]) -> Callable[[], Awaitable[None]]:
        aqueue = asyncio.Queue()
        on_data_recv = self.sync_on_data(aqueue)
        on_error_recv = self.sync_on_error(aqueue)

        device_id = self._resolve_device_id(device_id)

        recorder = AudioRecorder(
            registry=self.registry, on_data=on_data_recv, on_error=on_error_recv)
        recorder.start(device=device_id)

        task = asyncio.create_task(
            self.consume_queue(aqueue, on_data, on_error))
        logger.info("Audio recording started")

        cancel = self.canceler(recorder, aqueue, task)

        return cancel

    def _resolve_device_id(self, device_id: int | None) -> int:
        devices = get_inputs()
        logger.info(f"Using audio input ID: {device_id}")

        if device_id is not None:
            ok = False

            for d in devices:
                if d['index'] == device_id:
                    ok = True
                    break
            if not ok:
                raise Exception("Unknown audio device")
        else:
            default_device_name = self.config_service.get(
                ConfigKey.DEFAULT_AUDIO_DEVICE_NAME)

            for d in devices:
                if d['name'] == default_device_name:
                    logger.info(f"Using default audio device: {d['name']}")
                    return d['index']

            if len(devices) > 0:
                logger.info(f"Using first audio device: {devices[0]['name']}")
                return devices[0]['index']

            raise Exception("No audio devices found")

    async def consume_queue(self, q: asyncio.Queue, on_data: Callable[[str], Awaitable[None]], on_error: Callable[[Exception], Awaitable[None]]):
        while True:
            try:
                msg_type, payload = await q.get()
                if msg_type is None:
                    logger.info("Queue has been shut down")
                    break
                if msg_type == 'data':
                    await on_data(payload)
                elif msg_type == 'error':
                    await on_error(payload)
            except asyncio.CancelledError:
                logger.info("Queue consumer cancelled")
                break

    def canceler(self, recorder, aqueue: asyncio.Queue, task: asyncio.Task) -> Callable[[], Awaitable[None]]:
        async def _cancel():
            logger.info("Cancelling audio recording")
            recorder.stop()
            await aqueue.put((None, None))  # Sentinel to shut down consumer
            if not task.done():
                task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        return _cancel

    def sync_on_data(self, q: asyncio.Queue) -> Callable[[str], None]:
        def on_data_recv(data: str) -> None:
            logger.debug(f"Received data: {data}")
            q.put_nowait(('data', data))
        return on_data_recv

    def sync_on_error(self, q: asyncio.Queue) -> Callable[[Exception], None]:
        def on_error_recv(error: Exception) -> None:
            logger.error(f"Error in audio recording: {error}")
            q.put_nowait(('error', error))
        return on_error_recv

    def list_devices(self):
        return get_inputs()
