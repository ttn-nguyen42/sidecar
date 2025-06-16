

const getWs = (url: string) => {
    return new WebSocket(url);
};

const packBytes = async (id: number, data: Blob) => {
    const buffer = new Uint8Array(8 + data.size);
    const view = new DataView(buffer.buffer);
    view.setUint32(0, id, true); // Set the ID in little-endian format
    view.setUint32(4, data.size, true); // Set the length of the data in little-endian format
    const arrayBuffer = await data.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    buffer.set(byteArray, 8);
    return buffer.buffer;
};

export { getWs, packBytes };
