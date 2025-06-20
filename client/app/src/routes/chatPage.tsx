import { createFileRoute, Link } from '@tanstack/react-router';
import style from './chatPage.module.css';
import { ChatDimensions, MenuDimensions } from '../state/dimensions';
import { AnimationDuration } from '../state/const';
import DAFKeepAlive from '../state/DAFKeepAlive';
import { resizeTo } from '../state/view';

const ChatPage = () => {
    const toMenu = () => {
        resizeTo(MenuDimensions.width, MenuDimensions.height)
    }

    return <div
        style={{ height: ChatDimensions.height, width: ChatDimensions.width }}>
        <div>
            <h1>Chat</h1>
        </div>
        <button><Link to="/" onClick={toMenu}>Menu</Link></button>
    </div >;
};


export const Route = createFileRoute('/chatPage')({
    component: () => <DAFKeepAlive>
        <ChatPage />
    </DAFKeepAlive>
})


export default ChatPage;