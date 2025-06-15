from fastapi import APIRouter, HTTPException, UploadFile, WebSocket
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


class LiveTranscribePayload(BaseModel):
    id: str
    data: bytes


class LiveTranscribeResponse(BaseModel):
    id: str
    text: str


@router.websocket("/live")
async def live_transcribe(ws: WebSocket):
    await ws.accept()
    while True:
        try:
            payload = LiveTranscribePayload.model_validate_json(await ws.receive_text())
            data = payload.data
            logger.info(f"Received ID {payload.id} data size: {len(data)}")

            res = await service.transcribe_bytes(data)
            logger.info(f"Transcription done ID: {payload.id}")

            await ws.send_text(LiveTranscribeResponse(id=payload.id, text=res).model_dump_json())
        except Exception as e:
            logger.error(f"Error transcribing bytes: {e}")
            await ws.close(code=1006, reason="Internal server error")
