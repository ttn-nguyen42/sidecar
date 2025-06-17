declare var MediaStreamRecorder: any;

declare module '@/voice' {
    export interface VoiceHelper {
        listDevices: (url: string) => Promise<Device[]>;
        getRecorder: (deviceId: string, onData: (data: Blob) => void) => Promise<any>;
    }
    const inst: VoiceHelper;

    export interface Device {
        name: string;
        index: number;
    }
    export default inst;
}