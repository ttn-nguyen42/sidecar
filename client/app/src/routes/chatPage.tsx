import { createFileRoute, Link } from '@tanstack/react-router';
import style from './chatPage.module.css';
import { ChatDimensions } from './dimensions';
import { AnimationDuration } from '../state/const';
import DAFKeepAlive from '../state/DAFKeepAlive';

const ChatPage = () => {
    return <div
        className={`${style.chat} opacity-100 transition-opacity duration-${AnimationDuration.DEFAULT}`}
        style={{ height: ChatDimensions.height, width: ChatDimensions.width }}>
        <div>
            <h1>Chat</h1>
        </div>
        <button><Link to="/">Menu</Link></button>
    </div >;
};


export const Route = createFileRoute('/chatPage')({
    component: () => <DAFKeepAlive><ChatPage /></DAFKeepAlive>,
})


export default ChatPage;