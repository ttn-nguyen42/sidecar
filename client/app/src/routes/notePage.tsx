import { createFileRoute } from "@tanstack/react-router";
import style from "./notePage.module.css";
import DAFKeepAlive from "../state/DAFKeepAlive";

const NotePage = () => {
    return <div className={style.notePage}>NotePage</div>;
};

export const Route = createFileRoute('/notePage')({
    component: () => <DAFKeepAlive><NotePage /></DAFKeepAlive>,
})

export default NotePage;