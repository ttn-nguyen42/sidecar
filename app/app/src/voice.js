import MediaStreamRecorder from "msr";

const listDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const audio = devices.filter((d) => d.kind === "audioinput");
  return audio;
};

const getRecorder = async (device, onData) => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: device.deviceId,
    },
  });
  const rec = new MediaStreamRecorder(stream);
  rec.mimeType = "audio/wav";
  rec.ondataavailable = onData;
  return rec;
};

export default { listDevices, getRecorder };
