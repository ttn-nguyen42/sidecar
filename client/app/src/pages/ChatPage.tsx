
import style from './chatPage.module.css';
import { useNavigate } from 'react-router';
import { moveToMenu } from './router';
import { ChatDimensions } from './dimensions';
import { useEffect, useState } from 'react';
import { AnimationDuration } from '../state/const';

const ChatPage = () => {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const toMenu = () => {
        setIsVisible(false);
        moveToMenu(navigate)
    }

    return <div
        className={`${style.chat} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${AnimationDuration.DEFAULT}`}
        style={{ height: ChatDimensions.height, width: ChatDimensions.width }}>
        <button onClick={toMenu}>Menu</button>
    </div >;
};



export default ChatPage;