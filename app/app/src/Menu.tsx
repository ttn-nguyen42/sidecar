import type { Component } from "solid-js";
import styles from "./Menu.module.css";
import { Button } from "@/components/ui/button";
import { TbGridDots } from 'solid-icons/tb'
import { RiSystemSettingsLine } from 'solid-icons/ri'
import { MessageCircle, AudioLines, Languages, NotebookText, SquareKanban, BotMessageSquare, Bolt } from 'lucide-solid';

export interface MenuProps {
    selectedItem: string;
    byItem: {
        chat: (() => void) | null;
        settings: (() => void) | null;
        voice: (() => void) | null;
        translate: (() => void) | null;
        notes: (() => void) | null;
        tasks: (() => void) | null;
        cUse: (() => void) | null;
    };
}

const Menu: Component<MenuProps> = (props) => {
    return <div class={styles.menu}>
        <TbGridDots size={24} />
        <Button
            class={styles.button}
            variant={props.selectedItem === "chat" ? "secondary" : "ghost"}
            onClick={() => props.byItem.chat?.()}
            size="icon"
        >
            <MessageCircle />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "voice" ? "secondary" : "ghost"}
            onClick={() => props.byItem.voice?.()}
            size="icon"
        >
            <AudioLines />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "translate" ? "secondary" : "ghost"}
            onClick={() => props.byItem.translate?.()}
            size="icon"
        >
            <Languages />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "notes" ? "secondary" : "ghost"}
            onClick={() => props.byItem.notes?.()}
            size="icon"
        >
            <NotebookText />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "tasks" ? "secondary" : "ghost"}
            onClick={() => props.byItem.tasks?.()}
            size="icon"
        >
            <SquareKanban />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "cUse" ? "secondary" : "ghost"}
            onClick={() => props.byItem.cUse?.()}
            size="icon"
        >
            <BotMessageSquare />
        </Button>
        <Button
            class={styles.button}
            variant={props.selectedItem === "settings" ? "secondary" : "ghost"}
            onClick={() => props.byItem.settings?.()}
            size="icon"
        >
            <Bolt />
        </Button>
    </div>;
};

export default Menu;