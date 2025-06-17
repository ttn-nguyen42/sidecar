const listDevices = async (url) => {
  try {
    const response = await fetch(url + "/voice/devices");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const devices = await response.json();
    return devices.map(device => ({
      index: device.index,
      name: device.name,
    }));
  } catch (error) {
    console.error("Error fetching voice devices:", error);
    throw error;
  }
};

export default { listDevices };
