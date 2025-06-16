import { type Component } from "solid-js";

interface NotesProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const Notes: Component<NotesProps> = (props) => {
    return <div>
        <h1>Notes</h1>
    </div>
}

export default Notes;