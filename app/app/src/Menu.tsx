import type { Component } from "solid-js";
import styles from "./Menu.module.css";
import { Button } from "@/components/ui/button";
import { HiOutlineChatBubbleBottomCenterText } from 'solid-icons/hi'

export interface MenuProps {
    byItem: {
        chat: (() => void) | null;
        settings: (() => void) | null;
        voice: (() => void) | null;
        notes: (() => void) | null;
        reminders: (() => void) | null;
    };
}

const Menu: Component<MenuProps> = (props) => {
    return <div class={styles.menu}>
        <Button class={styles.button} variant="ghost" onClick={() => props.byItem.chat?.()}>
            <HiOutlineChatBubbleBottomCenterText size={32} />
        </Button>
    </div>;
};

export default Menu;