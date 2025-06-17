import io
import logging
import queue

import numpy as np
import wave
from pywhispercpp.constants import WHISPER_SAMPLE_RATE
from pywhispercpp.model import Segment
from typing import Callable

from torch import Tensor
import torch

from setup import Registry
import sounddevice as sd
from silero_vad import get_speech_timestamps
logger = logging.getLogger(__name__)


class AudioConstants:
    SAMPLE_RATE = WHISPER_SAMPLE_RATE
    # How many silence continuous silence blocks before inference
    SILENCE_THRESHOLD = 8

    # The inference won't be running until the data queue is having at least `q_threshold` elements
    Q_THRESHOLD = 16
    BLOCK_DURATION = 30
    CHANNELS = 1
    BLOCK_SIZE = int(SAMPLE_RATE * BLOCK_DURATION/1000)


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


class AudioRecorder:
    def __init__(self, registry: Registry, on_data: Callable[[str], None], on_error: Callable[[Exception], None]):
        self.on_data = on_data
        self.on_error = on_error
        self.q = queue.Queue()
        self.vad = registry.get_vad()
        self.model = registry.get_voice()
        self.on_data = on_data
        self.on_error = on_error
        self.stream = None
        self.silenced_for = 0

    def start(self, device):
        self.stream = sd.InputStream(
            samplerate=AudioConstants.SAMPLE_RATE,
            channels=AudioConstants.CHANNELS,
            blocksize=AudioConstants.BLOCK_SIZE,
            callback=self._callback,
            device=device
        )
        self.stream.start()

    def stop(self):
        logger.info("Stopping audio recording")
        if self.stream is not None:
            self.stream.stop()
            self.stream.close()
            self.stream = None

    def _callback(self, indata: np.ndarray, frames: int, time, status):
        if status:
            logger.error(f"Audio stream error: {status}")
        try:
            f16np = self._normalize(indata)
            tensor = self._to_torch(f16np)
            has_speech = self._find_speech(tensor)
            if not has_speech:
                if self.silenced_for >= AudioConstants.SILENCE_THRESHOLD:
                    # Ensure that if user talks too little, or accidental sounds
                    # we would not transcribe audio
                    if self.q.qsize() >= AudioConstants.Q_THRESHOLD:
                        logger.info(
                            "Silence threshold reached, processing queue")
                        self.silenced_for = 0
                        self._transcribe()
                self.silenced_for += 1
            else:
                self.silenced_for = 0
                self.q.put(f16np)
        except Exception as e:
            logger.error(f"Error handling audio block: {e}")
            self.on_error(e)

    def _transcribe(self):
        audio_chunks = []
        while not self.q.empty():
            f16np = self.q.get()
            audio_chunks.append(f16np)
        if not audio_chunks:
            logger.info("No audio chunks to process")
            return
        merged = np.concatenate(audio_chunks)

        # Appending zeros to the audio data as a workaround for small audio packets (small commands)
        merged = np.concatenate(
            [merged, np.zeros(int(AudioConstants.SAMPLE_RATE) + 10)])

        def _segcall(segment: Segment):
            self.on_data(segment.text)

        return self.model.transcribe(media=merged, new_segment_callback=_segcall)

    def _normalize(self, raw: np.ndarray) -> np.ndarray:
        ranged = (raw + 1) / 2  # [-1, 1] to [0, 1]
        f16np = np.fromiter(ranged, np.float16)
        return f16np

    def _to_torch(self, f16np: np.ndarray) -> Tensor:
        return torch.from_numpy(f16np)

    def _find_speech(self, audio: Tensor) -> bool:
        timestamps = get_speech_timestamps(
            audio=audio,
            model=self.vad,
            threshold=0.5,
            sampling_rate=AudioConstants.SAMPLE_RATE,
        )
        if not timestamps or len(timestamps) == 0:
            return False

        return True


def get_inputs() -> list:
    """Get a list of available audio input devices."""
    devices = sd.query_devices()
    input_devices = []
    for d in devices:
        d = dict(d)
        if d['max_input_channels'] != 0:
            input_devices.append(d)
    return input_devices
