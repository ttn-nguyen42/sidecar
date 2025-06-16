import { createSignal, onMount, type Component } from "solid-js";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import styles from "./voice.module.css";
import { Speech, AudioLines } from 'lucide-solid'
import { Expand75, Collapsed, MiddleExpanded, FullExpanded } from "@/resize";

interface VoiceProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number, cb?: () => void) => void;
    setBodyBackground: (color: string) => void;
}

const Voice: Component<VoiceProps> = (props) => {
    const [isRecording, setIsRecording] = createSignal(false);
    const [selectedDevice, setSelectedDevice] = createSignal<string>("");
    const [isSelectOpen, setIsSelectOpen] = createSignal(false);

    const audioDevices = [
        "Default Audio Device",
        "Built-in Microphone",
        "External USB Microphone",
        "Bluetooth Headset",
        "Webcam Microphone"
    ];

    onMount(() => {
        setSelectedDevice("Default Audio Device");
    });

    const toggleRecording = () => {
        if (isRecording()) {
            setIsRecording(false);
            props.setBottomSpaceHeight(MiddleExpanded);
            props.setWindowHeight(MiddleExpanded);
            props.setBodyBackground("transparent");
        } else {
            setIsRecording(true);
            props.setBottomSpaceHeight(Expand75);
            props.setWindowHeight(Expand75);
            props.setBodyBackground("#ffffff");
        }
    };


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
            >
                {isRecording() ?
                    <AudioLines size={18} class="animate-pulse" /> :
                    <Speech size={18} />
                }
                {isRecording() ? 'Stop' : 'Start'}
            </Button>
            <Select
                options={audioDevices}
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
            >
                <SelectTrigger class={styles.audioSelect}>
                    <SelectValue<string>>
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
            <div class={styles.conversation}>
                Hi
            </div>
        )}
    </div>;
};

export default Voice;