import { createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import styles from "./voice.module.css";
import { Speech, AudioLines } from 'lucide-solid'
import { FullWidth, resizeTo, Expand75, MiddleExpanded } from "@/resize";

const Voice = () => {
    const [isRecording, setIsRecording] = createSignal(false);

    const toggleRecording = () => {
        if (isRecording()) {
            setIsRecording(false);
            resizeTo(FullWidth, MiddleExpanded, () => {

            });
        } else {
            setIsRecording(true);
            resizeTo(FullWidth, Expand75, () => {

            });
        }
    };

    return <div class={styles.voice}>
        <div class={styles.voiceBar}>
            <Button
                variant="default"
                size="default"
                class={`${isRecording() ? 'bg-red-600 text-white hover:bg-red-600' : 'bg-black text-white hover:bg-black/90'} flex items-center gap-2 w-24`}
                onClick={toggleRecording}
            >
                {isRecording() ?
                    <AudioLines size={18} class="animate-pulse" /> :
                    <Speech size={18} />
                }
                {isRecording() ? 'Stop' : 'Start'}
            </Button>
        </div>
        {!isRecording() && (
            <div class={styles.voiceText}>
                <p>Powered by whisper.cpp</p>
            </div>
        )}
    </div>
}

export default Voice;