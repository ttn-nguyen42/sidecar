import { type Component } from "solid-js";
import styles from "./translate.module.css";
import { Button } from "@/components/ui/button";

interface TranslateProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const Translate: Component<TranslateProps> = (props) => {
    return <div class={styles.translate}>
        <Button variant="default" class="bg-black text-white hover:bg-black/90">Start</Button>
    </div>;
}

export default Translate;