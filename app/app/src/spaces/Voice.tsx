import { createSignal, onMount, onCleanup, type Component } from "solid-js";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import styles from "./voice.module.css";
import { Speech, AudioLines } from 'lucide-solid'
import { Expand75, MiddleExpanded } from "@/resize";
import VoiceHelper, { Device } from "@/voice";
import { getVoiceChatStartRequest, getWs, VoiceChatMessageType } from "@/socket";
import { Badge } from "@/components/ui/badge";

interface VoiceProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number, cb?: () => void) => void;
    setBodyBackground: (color: string) => void;
}

const Voice: Component<VoiceProps> = (props) => {
    const [isRecording, setIsRecording] = createSignal(false);
    const [selectedDevice, setSelectedDevice] = createSignal<string | null>(null);
    const [isSelectOpen, setIsSelectOpen] = createSignal(false);
    const [audioDevices, setAudioDevices] = createSignal<string[]>([]);
    const [recordingDuration, setRecordingDuration] = createSignal<number>(0);
    const [isConnected, setIsConnected] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string>("");
    const [textData, setTextData] = createSignal<string>("");
    const [timeInterval, setTimeInterval] = createSignal<NodeJS.Timeout | null>(null);

    var devices: Device[] = [];

    onMount(async () => {
        devices = await VoiceHelper.listDevices("http://localhost:8768");
        const deviceList = devices.map(device => device.name);
        setAudioDevices(deviceList);
        console.log("Available audio devices:", deviceList);
        if (deviceList.length > 0) {
            setSelectedDevice(deviceList[0]);
        } else {
            alert("No audio devices found. Please connect a microphone.");
        }
    });

    var socket: WebSocket = null as any;

    const configureSocket = (socket: WebSocket) => {
        socket.onopen = () => {
            const device = devices.find(d => d.name === selectedDevice());
            const startRequest = getVoiceChatStartRequest(device?.index ?? 0);
            socket.send(JSON.stringify(startRequest));
            setIsConnected(true);
        };

        socket.onmessage = async (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            console.log("Message type:", data.type);
            if (data.type === VoiceChatMessageType.VC_DATA) {
                setTextData(prev => prev + " " + data.data);
            } else {
                console.warn("Unknown message type:", data.type);
            }
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
                if (event.code !== 1000) {
                    setErrorMessage("WebSocket closed with code: " + event.code);
                    alert("WebSocket closed with code: " + event.code);
                }

            }
            stopRecording();
        };

    }

    const startRecording = async () => {
        setIsRecording(true);
        setErrorMessage("");
        setTextData("");

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

    const stopRecording = () => {
        if (socket) {
            socket.close(1000, "Recording stopped by user");
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
                disabled={audioDevices().length === 0 || selectedDevice() == null}
            >
                {isRecording() ?
                    <AudioLines size={18} class="animate-pulse" /> :
                    <Speech size={18} />
                }
                {isRecording() ? 'Stop' : 'Start'}
            </Button>
            <Select
                options={audioDevices()}
                value={selectedDevice()}
                open={isSelectOpen()}
                onChange={(value) => { console.log("Selected device:", value); setSelectedDevice(value); }}
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
                        {state => state.selectedOption() ?? "Select Audio Device..."}
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
                    {isConnected() ? <Badge class="bg-green-600">Connected</Badge> : <Badge class="bg-red-600">Disconnected</Badge>}
                </div>
            </div>
        )}
        {errorMessage() != "" && (
            <div class={styles.errorMessage}>
                {errorMessage()}
            </div>
        )}
        {isRecording() && (
            <div class={styles.conversation}>
                <p>{textData()}</p>
            </div>
        )}
    </div>;
};

export default Voice;