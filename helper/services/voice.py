from datetime import datetime
import logging
from fastapi import UploadFile
from pydantic import BaseModel
from audio import wav_to_np
from setup import Registry
from pywhispercpp.model import Segment

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

    def _new_segment_callback(self, segment: Segment):
        logger.info(f"New segment: {segment}")
