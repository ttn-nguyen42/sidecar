import { createSignal, onMount, onCleanup, type Component } from "solid-js";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import styles from "./voice.module.css";
import { Speech, AudioLines } from 'lucide-solid'
import { Expand75, MiddleExpanded } from "@/resize";
import VoiceHelper from "@/voice";
import { getWs, packBytes } from "@/socket";

interface VoiceProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number, cb?: () => void) => void;
    setBodyBackground: (color: string) => void;
}

const Voice: Component<VoiceProps> = (props) => {
    const [isRecording, setIsRecording] = createSignal(false);
    const [selectedDevice, setSelectedDevice] = createSignal<string>("");
    const [isSelectOpen, setIsSelectOpen] = createSignal(false);
    const [audioDevices, setAudioDevices] = createSignal<MediaDeviceInfo[]>([]);
    const [recordingDuration, setRecordingDuration] = createSignal<number>(0);
    const [isConnected, setIsConnected] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string>("");
    const [textData, setTextData] = createSignal<string>("");
    const [timeInterval, setTimeInterval] = createSignal<NodeJS.Timeout | null>(null);

    onMount(async () => {
        const devices = await VoiceHelper.listDevices();
        if (devices.length > 0) {
            setSelectedDevice(devices[0].deviceId);
        } else {
            alert("No audio devices found. Please connect a microphone.");
        }
        setAudioDevices(devices);
    });

    var recorder: any = null;
    var socket: WebSocket = null as any;
    var id = 0;

    const configureSocket = (socket: WebSocket) => {
        socket.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        socket.onmessage = (event: MessageEvent) => {
            const data = JSON.stringify({ 'id': id, 'data': event.data });
            id += 1;
            setTextData(data);
        };

        socket.onerror = (event: Event) => {
            setErrorMessage("WebSocket error occurred: " + event);
            stopRecording();
        };

        socket.onclose = (event) => {
            if (!event.wasClean) {
                const msg = `WebSocket closed unexpectedly: ${event.code}`;
                console.error(msg);
                setErrorMessage(msg);
                alert(msg);
            } else {
                console.log("WebSocket closed cleanly:", event);
            }
            stopRecording();
        };

    }

    const startRecording = async () => {
        recorder = await VoiceHelper.getRecorder(selectedDevice(), onData);
        recorder.onerror = onError;
        recorder.start(2000);
        setIsRecording(true);
        const startTime = Date.now();

        socket = getWs("ws://localhost:8768/voice/live");
        configureSocket(socket);

        setTimeInterval(setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            setRecordingDuration(elapsedSeconds);
        }, 1000));
        setRecordingDuration(0);

        props.setBottomSpaceHeight(Expand75);
        props.setWindowHeight(Expand75);
        props.setBodyBackground("transparent");
    };

    const onData = async (blob: Blob) => {
        const data = await packBytes(id, blob);
        id += 1;
        socket.send(data);
    };

    const onError = (e: any) => {
        stopRecording();
        setErrorMessage(e.message);
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stop();
        }
        if (socket) {
            socket.close();
        }

        const interval = timeInterval();
        if (interval != null) {
            clearInterval(interval);
        }

        setIsRecording(false);
        setIsConnected(false);
        setErrorMessage("");
        setTextData("");
        setRecordingDuration(0);

        props.setBottomSpaceHeight(MiddleExpanded);
        props.setWindowHeight(MiddleExpanded);
        props.setBodyBackground("transparent");
    };

    const toggleRecording = () => {
        if (isRecording()) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    onCleanup(() => {
        stopRecording();
    });

    const handleSelectOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            props.setWindowHeight(MiddleExpanded + 5 * 16, () => {
                setIsSelectOpen(true);
            });
        } else {
            setIsSelectOpen(false);
            props.setWindowHeight(MiddleExpanded, () => {

            });
        }
    };

    return <div class={styles.voice}>
        <div class={styles.voiceBar}>
            <Button
                variant="default"
                size="default"
                class={`${isRecording() ? styles.stopButton : styles.startButton} flex items-center gap-2 w-24`}
                onClick={toggleRecording}
                disabled={audioDevices().length === 0 || selectedDevice() === ""}
            >
                {isRecording() ?
                    <AudioLines size={18} class="animate-pulse" /> :
                    <Speech size={18} />
                }
                {isRecording() ? 'Stop' : 'Start'}
            </Button>
            <Select
                options={audioDevices().map(device => device.label)}
                value={selectedDevice()}
                open={isSelectOpen()}
                onChange={setSelectedDevice}
                onOpenChange={handleSelectOpenChange}

                placeholder="Select Audio Device..."
                itemComponent={props => (
                    <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
                )}
                disabled={isRecording()}
                class={styles.selectAudioDevice}
                disallowEmptySelection={true}
            >
                <SelectTrigger class={styles.audioSelect}>
                    <SelectValue<string> class={styles.selectValueText}>
                        {state => state.selectedOption()}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent class={styles.selectContent} />
            </Select>
        </div>
        {!isRecording() && (
            <div class={styles.voiceControls}>
                <div class={styles.voiceText}>
                    <p>Powered by whisper.cpp</p>
                </div>
            </div>
        )}
        {isRecording() && (
            <div class={styles.voiceControls}>
                <div class={styles.voiceText}>
                    <p>Recording: {formatDuration(recordingDuration())}</p>
                </div>
                <div class={styles.connectionStatus}>
                    {isConnected() ? "Connected" : "Disconnected"}
                </div>
            </div>
        )}
        {errorMessage() != "" && (
            <div class={styles.errorMessage}>
                {errorMessage()}
            </div>
        )}
        {textData() != "" && (
            <div class={styles.voiceText}>
                <p>{textData()}</p>
            </div>
        )}
    </div>;
};

export default Voice;