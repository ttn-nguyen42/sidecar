import { type Component } from "solid-js";

interface SettingsProps {
    setBottomSpaceHeight: (h: number) => void;
    setWindowHeight: (h: number) => void;
}

const Settings: Component<SettingsProps> = (props) => {
    return <div>
        <h1>Settings</h1>
    </div>
}

export default Settings;