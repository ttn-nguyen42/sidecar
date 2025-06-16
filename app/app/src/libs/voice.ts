const getUserMedia = async (kind: string) => {
  var cfg = {};
  if (kind === "audio") {
    cfg = { audio: true };
  } else if (kind === "video") {
    cfg = { video: true };
  }
  const stream = await navigator.mediaDevices.getUserMedia(cfg);
  return stream;
};

const getDevices = async (kind: string) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === kind);
};

export { getUserMedia, getDevices };
