import { type Component } from "solid-js";

interface ChatProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const Chat: Component<ChatProps> = (props) => {
    return <div>
        <h1>Chat</h1>
    </div>;
}

export default Chat;