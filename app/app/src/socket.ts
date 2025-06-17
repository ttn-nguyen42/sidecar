

const getWs = (url: string) => {
    return new WebSocket(url);
};

const getVoiceChatStartRequest = (deviceId: number) => {
    return {
        type: VoiceChatMessageType.VC_START,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
    }
}

enum VoiceChatMessageType {
    VC_START = "vc_start",
    VC_DATA = "vc_data",
}

export { getWs, getVoiceChatStartRequest, VoiceChatMessageType };