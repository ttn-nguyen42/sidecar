import { createFileRoute, Link } from "@tanstack/react-router"

import style from "./index.module.css";
import { MenuDimensions } from "./dimensions";
import { AnimationDuration } from "../state/const";
import { useState } from "react";
import KeepAlive from "react-activation";
import DAFKeepAlive from "../state/DAFKeepAlive";

const MenuPage = () => {
    const [counter, setCounter] = useState(0);
    return <div
        className={`${style.menu} opacity-100 transition-opacity duration-${AnimationDuration.DEFAULT}`}
        style={{ height: MenuDimensions.height, width: MenuDimensions.width }}>
        <button><Link to="/chatPage">Chat</Link></button>
        <button><Link to="/notePage">Note</Link></button>
        <button><Link to="/taskBoardPage">Task</Link></button>
        <button><Link to="/settingsPage">Settings</Link></button>
        <button onClick={() => setCounter(counter + 1)}>{counter}</button>
        <p>{counter}</p>
    </div>;
};

export const Route = createFileRoute('/')({
    component: () => <DAFKeepAlive><MenuPage /></DAFKeepAlive>,
})

export default MenuPage;