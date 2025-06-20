import { createFileRoute, Link } from '@tanstack/react-router'
import style from "./settingsPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';

const SettingsPage = () => {
    return <div className={style.settings}>
        <button><Link to="/">Menu</Link></button>
    </div>;
};

export const Route = createFileRoute('/settingsPage')({
    component: () => <DAFKeepAlive><SettingsPage /></DAFKeepAlive>,
})

export default SettingsPage;        