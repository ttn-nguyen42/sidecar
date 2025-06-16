declare var MediaStreamRecorder: any;

declare module '@/voice' {
    export interface VoiceHelper {
        listDevices: () => Promise<MediaDeviceInfo[]>;
        getRecorder: (deviceId: string, onData: (data: Blob) => void) => Promise<any>;
        getWavWorker: () => Worker;
    }
    const inst: VoiceHelper;
    export default inst;
}