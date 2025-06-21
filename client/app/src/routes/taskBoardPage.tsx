import { createFileRoute, Link } from '@tanstack/react-router'
import style from "./taskBoardPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';

const TaskBoardPage = () => {
    return <div className={style.taskBoardPage}><Link to='/chatPage'>Back</Link></div>;
};

export const Route = createFileRoute('/taskBoardPage')({
    component: () => <DAFKeepAlive><TaskBoardPage /></DAFKeepAlive>,
})

export default TaskBoardPage;