

const getWs = (url: string) => {
    return new WebSocket(url);
};

const getVoiceChatStartRequest = (deviceId: string) => {
    return {
        type: VoiceChatMessageType.VC_START,
        deviceId: deviceId,
        timestamp: new Date().toISOString(),
    }
}

const getVoiceChatStopRequest = () => {
    return {
        type: VoiceChatMessageType.VC_STOP,
        timestamp: new Date().toISOString(),
    }
}

enum VoiceChatMessageType {
    VC_START = "vc_start",
    VC_START_OK = "vc_start_ok",
    VC_STOP = "vc_stop",
    VC_STOP_OK = "vc_stop_ok",
    VC_DATA = "vc_data",
}

export { getWs, getVoiceChatStartRequest, getVoiceChatStopRequest, VoiceChatMessageType };