import { createFileRoute } from '@tanstack/react-router'
import style from "./taskBoardPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';

const TaskBoardPage = () => {
    return <div className={style.taskBoardPage}>TaskBoardPage</div>;
};

export const Route = createFileRoute('/taskBoardPage')({
    component: () => <DAFKeepAlive><TaskBoardPage /></DAFKeepAlive>,
})

export default TaskBoardPage;