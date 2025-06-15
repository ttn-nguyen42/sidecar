import type { Component } from "solid-js";
import { createSignal } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";

declare global {
  interface Window {
    electronAPI?: {
      resizeWindow: (width: number, height: number) => void;
    };
  }
}

const App: Component = () => {
    const buttons = ["B1", "B2", "B3", "B4", "B5"];
    const [showLeft, setShowLeft] = createSignal(false);
    return (
        <div class={styles.app}>
            {showLeft() && <div class={styles.leftSpace}>Hi</div>}
            <div class={styles.menu}>
                {buttons.map((label) => (
                    <button
                        class={styles.button}
                        onClick={() => {
                            if (label === "B1") {
                                setShowLeft(true);
                                window.electronAPI?.resizeWindow(520, 360);
                            }
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default App;
