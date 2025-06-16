declare global {
    interface Window {
        electronAPI?: {
            resizeWindow: (width: number, height: number) => void;
            onWindowResized: (cb: () => void) => void;
        };
    }
}

const FullExpanded = 360;
const ShortExpanded = 86;
const MiddleExpanded = 128;
const Expand75 = 270;
const Collapsed = 48;
const FullWidth = 360;

const resizeTo = (width: number, height: number, cb?: () => void) => {
    window.electronAPI?.onWindowResized(() => {
        cb && cb();
    });
    window.electronAPI?.resizeWindow(width, height);
};

export { resizeTo, FullExpanded, ShortExpanded, MiddleExpanded, Collapsed, FullWidth, Expand75 };