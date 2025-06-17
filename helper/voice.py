
from fastapi import APIRouter, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from services.voice import VoiceService
from setup import registry
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice")
service = VoiceService(registry)


@router.post("")
async def transcribe(file: UploadFile):
    try:
        response = await service.transcribe(file)
    except Exception as e:
        logger.error(f"Error transcribing file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    return response


@router.get("/devices")
def getDevices():
    return service.list_devices()


class LiveTranscribeRequest(BaseModel):
    type: str
    deviceId: int | None = None
    timestamp: str


class LiveTranscribeResponse(BaseModel):
    type: str
    data: str | None = None


@router.websocket("/live")
async def live_transcribe(ws: WebSocket):
    logger.debug("WebSocket connection initiated")
    await ws.accept()
    logger.debug("WebSocket connection accepted")
    await run_state(ws)


async def run_state(ws: WebSocket):
    async def on_data(text: str):
        logger.debug(f"Transcribed text: {text}")
        try:
            await ws.send_json(
                LiveTranscribeResponse(
                    type="vc_data", data=text).model_dump_json(),
                mode="text"
            )
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected during on_data")
            await ws.close(code=1000, reason="Transcription stopped")
        return

    async def on_error(e: Exception):
        logger.error(f"Error in live transcription: {e}")
        await ws.close(code=1011, reason="Internal server error")

    cancel_record = None

    try:
        while True:
            try:
                payload = await ws.receive_text()
                request = LiveTranscribeRequest.model_validate_json(payload)
                logger.debug(f"Received request: {request}")

                if is_start(request=request):
                    logger.info("Starting live transcription")
                    cancel_record = service.start_record(
                        device_id=request.deviceId or 0, on_data=on_data, on_error=on_error)
                    await ws.send_json(
                        LiveTranscribeResponse(
                            type="vc_start_ok", data="Recording started").model_dump_json(),
                        mode="text"
                    )
                elif is_stop(request=request):
                    logger.info("Stopping live transcription")
                    if cancel_record:
                        await cancel_record()
                        cancel_record = None
                    break
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(e)
                await ws.send_json(LiveTranscribeResponse(type="vc_stop"))
                break
    finally:
        logger.debug("Cleaning up WebSocket connection")
        if cancel_record:
            await cancel_record()
        logger.info("WebSocket connection closed")


def is_start(request: LiveTranscribeRequest) -> bool:
    return request.type == "vc_start"


def is_stop(request: LiveTranscribeRequest) -> bool:
    return request.type == "vc_stop"
