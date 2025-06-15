import { createSignal, type Component } from "solid-js";

import styles from "./App.module.css";
import Menu from "./Menu";
import Chat from "./spaces/Chat";
import { resizeCollapse, resizeExpand } from "./resize";


const App: Component = () => {
    const [item, setItem] = createSignal<string>("");
    const [showLeftSpace, setShowLeftSpace] = createSignal(false);

    const openResize = (itemName: string) => {
        if (item() === itemName) {
            resizeCollapse(() => {
                setShowLeftSpace(false);
                setItem("");
            });
        } else {
            resizeExpand(() => {
                setShowLeftSpace(true);
                setItem(itemName);
            });
        }
    }

    return (
        <div class={styles.app}>
            {showLeftSpace() && <div class={styles.leftSpace}>
                {item() === "chat" && <Chat />}
            </div>}
            <div class={styles.menuContainer}>
                <Menu byItem={{
                    chat: () => { openResize("chat") },
                    settings: () => { openResize("settings") },
                    voice: () => { openResize("voice") },
                    notes: () => { openResize("notes") },
                    reminders: () => { openResize("reminders") },
                }} />
            </div>
        </div>
    );
};

export default App;
