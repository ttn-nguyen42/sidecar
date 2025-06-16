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
import { resizeTo, FullExpanded, ShortExpanded, Collapsed, FullWidth, MiddleExpanded, MenuHeight } from "./resize";
import "./app.css";

const App: Component = () => {
    const [item, setItem] = createSignal<string>("");
    const [showBottomSpace, setShowBottomSpace] = createSignal(false);
    const [bottomSpaceHeight, setBottomSpaceHeight] = createSignal(MiddleExpanded);

    const setWindowHeight = (height: number, cb?: () => void) => {
        resizeTo(FullWidth, height, cb);
    };

    const openResize = (itemName: string, height: number) => {
        if (item() === itemName) {
            setItem("");
            resizeTo(FullWidth, Collapsed, () => {
                setShowBottomSpace(false);
            });
        } else {
            setItem(itemName);
            setBottomSpaceHeight(height);
            setShowBottomSpace(true);
            resizeTo(FullWidth, height, () => {

            });
        }
    }

    // Electron on macOS has a bug where the bottom border is clipped if backgroundColor is not set
    const setBodyBackground = (color: string) => {
        document.body.style.backgroundColor = color;
    };

    function renderBottomSpaceContent() {
        switch (item()) {
            case "chat":
                return <Chat
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            case "voice":
                return <Voice
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight}
                    setBodyBackground={setBodyBackground} />;
            case "translate":
                return <Translate
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            case "notes":
                return <Notes
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            case "tasks":
                return <Tasks
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            case "cUse":
                return <CUse
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            case "settings":
                return <Settings
                    setBottomSpaceHeight={setBottomSpaceHeight}
                    setWindowHeight={setWindowHeight} />;
            default:
                return null;
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
            {showBottomSpace() && (
                <div
                    class={styles.bottomSpace}
                    style={{ height: `${bottomSpaceHeight() - MenuHeight}px` }}
                >
                    {renderBottomSpaceContent()}
                </div>
            )}
        </div>
    );
};

export default App;

