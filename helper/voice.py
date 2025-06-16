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
    id: int
    data: bytes

    @staticmethod
    def from_bytes(data: bytes) -> 'LiveTranscribePayload':
        # Read 8 bytes of header, ID (4 bytes) and length (4 bytes)
        if len(data) < 8:
            raise ValueError("Data too short to contain ID and length")
        id = int.from_bytes(data[:4], 'big')
        length = int.from_bytes(data[4:8], 'big')
        if len(data) < 8 + length:
            raise ValueError(
                f"Data length does not match specified length, {length} bytes expected, {len(data) - 8} bytes received")
        payload_data = data[8:8 + length]
        return LiveTranscribePayload(id=id, data=payload_data)


class LiveTranscribeResponse(BaseModel):
    id: int
    text: str


@router.websocket("/live")
async def live_transcribe(ws: WebSocket):
    await ws.accept()
    while True:
        try:
            payload = LiveTranscribePayload.from_bytes(await ws.receive_bytes())
            data = payload.data
            logger.info(f"Received ID {payload.id} data size: {len(data)}")

            # res = await service.transcribe_bytes(data)
            logger.info(f"Transcription done ID: {payload.id}")

            await ws.send_text(LiveTranscribeResponse(id=payload.id, text="RECEIVED").model_dump_json())
        except Exception as e:
            logger.error(f"Error transcribing bytes: {e}")
            await ws.close(code=1006, reason="Internal server error")
