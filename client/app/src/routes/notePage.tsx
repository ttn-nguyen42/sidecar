import { createFileRoute, Link } from "@tanstack/react-router";
import style from "./notePage.module.css";
import DAFKeepAlive from "../state/DAFKeepAlive";

const NotePage = () => {
    return <div className={style.notePage}>
        <button><Link to="/">Menu</Link></button>
    </div>;
};

export const Route = createFileRoute('/notePage')({
    component: () => <DAFKeepAlive><NotePage /></DAFKeepAlive>,
})

export default NotePage;