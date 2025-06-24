import { createFileRoute } from '@tanstack/react-router'
import style from "./taskBoardPage.module.css";
import DAFKeepAlive from '../state/DAFKeepAlive';
import TopBar from '../components/atomic/TopBar';

const TaskBoardPage = () => {
    return <div className={style.taskBoardPage}>
        <TopBar left={<></>} right={
            <p className='text-sm text-gray-500'>Started 3 days ago</p>
        } />
    </div>;
};

export const Route = createFileRoute('/taskBoardPage')({
    component: () => <DAFKeepAlive><TaskBoardPage /></DAFKeepAlive>,
})

export default TaskBoardPage;