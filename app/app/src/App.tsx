import { createSignal, type Component } from "solid-js";

import styles from "./App.module.css";
import Menu from "./Menu";
import Chat from "./spaces/Chat";
import { resizeCollapse, resizeExpand } from "./resize";


const App: Component = () => {
    const [item, setItem] = createSignal<string>("");
    const [showBottomSpace, setShowBottomSpace] = createSignal(false);

    const openResize = (itemName: string) => {
        if (item() === itemName) {
            resizeCollapse(() => {
                setShowBottomSpace(false);
                setItem("");
            });
        } else {
            setShowBottomSpace(true);
            resizeExpand(() => {
                setItem(itemName);
            });
        }
    }

    return (
        <div class={styles.app}>
            <div class={styles.menuContainer}>
                <Menu byItem={{
                    chat: () => { openResize("chat") },
                    settings: () => { openResize("settings") },
                    voice: () => { openResize("voice") },
                    notes: () => { openResize("notes") },
                    reminders: () => { openResize("reminders") },
                }} />
            </div>
            {showBottomSpace() && <div class={styles.bottomSpace}>
                {item() === "chat" && <Chat />}
            </div>}
        </div>
    );
};

export default App;
