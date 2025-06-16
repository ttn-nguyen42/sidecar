import { type Component } from "solid-js";

interface TasksProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const Tasks: Component<TasksProps> = (props) => {
    return <div>
        <h1>Tasks</h1>
    </div>
}

export default Tasks;