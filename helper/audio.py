import io
import logging

import numpy as np
import wave
from pywhispercpp.constants import WHISPER_SAMPLE_RATE

logger = logging.getLogger(__name__)


def wav_to_np(data: bytes) -> np.ndarray:
    """Converts a WAV file to a Whisper-compatible numpy array

    Args:
        data (bytes): The WAV file data

    Returns:
        np.ndarray: The Whisper-compatible numpy array

    Raises:
        Exception: If the WAV file is not mono or stereo
        Exception: If the WAV file is not 16-bit
        Exception: If the WAV file is not {WHISPER_SAMPLE_RATE} Hz
    """
    with wave.open(io.BytesIO(data), 'rb') as wf:
        num_channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        num_frames = wf.getnframes()

        if num_channels not in (1, 2):
            raise Exception(f"WAV file must be mono or stereo")

        if sample_rate != WHISPER_SAMPLE_RATE:
            raise Exception(f"WAV file must be {WHISPER_SAMPLE_RATE} Hz")

        if sample_width != 2:
            raise Exception(f"WAV file must be 16-bit")

        raw = wf.readframes(num_frames)
        wf.close()
        audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32)
        if num_channels == 1:
            pcmf32 = audio / 32768.0
        else:
            audio = audio.reshape(-1, 2)
            # Averaging the two channels
            pcmf32 = (audio[:, 0] + audio[:, 1]) / 65536.0
        return pcmf32
