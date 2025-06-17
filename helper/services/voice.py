import asyncio
from datetime import datetime
import logging
from fastapi import UploadFile
from pydantic import BaseModel
from audio import AudioRecorder, wav_to_np, get_inputs
from setup import Registry
from pywhispercpp.model import Segment
from typing import Callable, Awaitable

logger = logging.getLogger(__name__)


class TranscribeResponse(BaseModel):
    text: str
    duration: float

    def __repr__(self):
        return f"TranscribeResponse(text={self.text}, duration={self.duration})"


class VoiceService():
    def __init__(self, registry: Registry) -> None:
        self.registry = registry
        self.model = registry.get_voice()
        return

    async def transcribe(self, file: UploadFile) -> TranscribeResponse:
        data = await file.read()
        np_data = wav_to_np(data)

        start = datetime.now()
        logger.info(f"Transcribing file: {file.filename}")
        segments = self.model.transcribe(
            np_data, new_segment_callback=self._new_segment_callback, print_progress=False)
        text = ""
        for s in segments:
            text += s.text
        end = datetime.now()

        return TranscribeResponse(text=text, duration=(end - start).total_seconds())

    async def transcribe_bytes(self, data: bytes) -> TranscribeResponse:
        np_data = wav_to_np(data)
        logger.info(f"Transcribing bytes: {len(data)}")

        start = datetime.now()
        segments = self.model.transcribe(
            np_data, new_segment_callback=self._new_segment_callback, print_progress=False)
        end = datetime.now()
        text = ""
        for s in segments:
            text += s.text
        return TranscribeResponse(text=text, duration=(end - start).total_seconds())

    def _new_segment_callback(self, segment: Segment):
        logger.info(f"New segment: {segment}")

    def start_record(self, device_id: int, on_data: Callable[[str], Awaitable[None]], on_error: Callable[[Exception], Awaitable[None]]) -> Callable[[], Awaitable[None]]:
        aqueue = asyncio.Queue()
        on_data_recv = self.sync_on_data(aqueue)
        on_error_recv = self.sync_on_error(aqueue)

        devices = get_inputs()
        logger.info(f"Using audio input ID: {device_id}")

        ok = False
        for d in devices:
            if d['index'] == device_id:
                ok = True
                break
        if not ok:
            raise Exception("Unknown audio device")

        logger.info(f"Available devices: {devices}")

        recorder = AudioRecorder(
            registry=self.registry, on_data=on_data_recv, on_error=on_error_recv)
        recorder.start(device=device_id)

        task = asyncio.create_task(
            self.consume_queue(aqueue, on_data, on_error))
        logger.info("Audio recording started")

        cancel = self.canceler(recorder, aqueue, task)

        return cancel

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
