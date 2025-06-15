import type { Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./App.module.css";

const App: Component = () => {
    return (
        <div class={styles.app}>
            <h1>Hello, world1</h1>
        </div>
    );
};

export default App;
