import { createSignal, type Component } from "solid-js";

import styles from "./App.module.css";
import Menu from "./Menu";
import Chat from "./spaces/Chat";
import Settings from "./spaces/Settings";
import Voice from "./spaces/Voice";
import Notes from "./spaces/Notes";
import Tasks from "./spaces/Tasks";
import CUse from "./spaces/CUse";
import Translate from "./spaces/Translate";
import { resizeTo, FullExpanded, ShortExpanded, Collapsed, FullWidth, MiddleExpanded } from "./resize";

const App: Component = () => {
    const [item, setItem] = createSignal<string>("");
    const [showBottomSpace, setShowBottomSpace] = createSignal(false);

    const openResize = (itemName: string, height: number) => {
        if (item() === itemName) {
            resizeTo(FullWidth, Collapsed, () => {
                setShowBottomSpace(false);
                setItem("");
            });
        } else {
            setItem(itemName);
            resizeTo(FullExpanded, height, () => {
                setShowBottomSpace(true);
            });
        }
    }

    return (
        <div class={styles.app}>
            <div class={styles.menuContainer}>
                <Menu
                    selectedItem={item()}
                    byItem={{
                        chat: () => { openResize("chat", FullExpanded) },
                        settings: () => { openResize("settings", FullExpanded) },
                        voice: () => { openResize("voice", MiddleExpanded) },
                        notes: () => { openResize("notes", FullExpanded) },
                        tasks: () => { openResize("tasks", FullExpanded) },
                        cUse: () => { openResize("cUse", FullExpanded) },
                        translate: () => { openResize("translate", MiddleExpanded) },
                    }}
                />
            </div>
            {showBottomSpace() && <div class={styles.bottomSpace}>
                {item() === "chat" && <Chat />}
                {item() === "voice" && <Voice />}
                {item() === "translate" && <Translate />}
                {item() === "notes" && <Notes />}
                {item() === "tasks" && <Tasks />}
                {item() === "cUse" && <CUse />}
                {item() === "settings" && <Settings />}
            </div>}
        </div>
    );
};

export default App;
