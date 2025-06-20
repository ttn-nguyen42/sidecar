import { moveToChat } from "./router";

import style from "./menu.module.css";
import { useNavigate } from "react-router";
import { MenuDimensions } from "./dimensions";
import { useEffect, useState } from "react";
import { AnimationDuration } from "../state/const";

const MenuPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const toChat = () => {
        setIsVisible(false);
        moveToChat(navigate)
    }

    return <div
        className={`${style.menu} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${AnimationDuration.DEFAULT}`}
        style={{ height: MenuDimensions.height, width: MenuDimensions.width }}>
        <button onClick={toChat}>Chat</button>
    </div>;
};


export default MenuPage;