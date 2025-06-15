declare global {
    interface Window {
        electronAPI?: {
            resizeWindow: (width: number, height: number, direction: string) => void;
            onWindowResized: (cb: () => void) => void;
        };
    }
}

const resizeExpand = (cb?: () => void) => {
    window.electronAPI?.onWindowResized(() => {
        cb && cb();
    });
    window.electronAPI?.resizeWindow(384, 360, 'left');
};

const resizeCollapse = (cb?: () => void) => {
    window.electronAPI?.onWindowResized(() => {
        cb && cb();
    });
    window.electronAPI?.resizeWindow(64, 360, 'right');
};

export { resizeExpand, resizeCollapse };