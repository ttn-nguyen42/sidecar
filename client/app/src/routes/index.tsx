import { createFileRoute, Link } from "@tanstack/react-router"

import style from "./index.module.css";
import { ChatDimensions, MenuDimensions, TaskBoardDimensions } from "../state/dimensions";
import { useState } from "react";
import DAFKeepAlive from "../state/DAFKeepAlive";
import { resizeTo } from "../state/view";

const MenuPage = () => {
    const [counter, setCounter] = useState(0);

    const toChat = () => {
        resizeTo(ChatDimensions.height, ChatDimensions.width)
    }

    const toTaskBoard = () => {
        resizeTo(TaskBoardDimensions.height, TaskBoardDimensions.width)
    }

    return <div
        className={style.menu}
        style={{ height: MenuDimensions.height, width: MenuDimensions.width }}>
        <button><Link to="/chatPage" onClick={toChat}>Chat</Link></button>
        <button><Link to="/notePage">Note</Link></button>
        <button><Link to="/taskBoardPage" onClick={toTaskBoard}>Task</Link></button>
        <button><Link to="/settingsPage">Settings</Link></button>
        <button onClick={() => setCounter(counter + 1)}>{counter}</button>
        <p>{counter}</p>
    </div>;
};

export const Route = createFileRoute('/')({
    component: () => <DAFKeepAlive>
        <MenuPage />
    </DAFKeepAlive>,
})

export default MenuPage;