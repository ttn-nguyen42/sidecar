import styles from "./translate.module.css";
import { Button } from "@/components/ui/button";

const Translate = () => {
    return <div class={styles.translate}>
        <Button variant="default" class="bg-black text-white hover:bg-black/90">Start</Button>
    </div>
}

export default Translate;