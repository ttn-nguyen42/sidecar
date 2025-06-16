import { type Component, createSignal } from "solid-js";

interface CUseProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const CUse: Component<CUseProps> = (props) => {
    const [count, setCount] = createSignal(0);

    return <div>
        <button onClick={() => setCount(count() + 1)}>Click me</button>
        <p>Count: {count()}</p>
    </div>;
}

export default CUse;