import { createSignal } from "solid-js";

const CUse = () => {
    const [count, setCount] = createSignal(0);

    return <div>
        <button onClick={() => setCount(count() + 1)}>Click me</button>
        <p>Count: {count()}</p>
    </div>
}

export default CUse;