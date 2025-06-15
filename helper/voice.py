from fastapi import APIRouter, HTTPException, UploadFile
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
