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
    window.electronAPI?.resizeWindow(360, 360, 'down');
};

const resizeCollapse = (cb?: () => void) => {
    window.electronAPI?.onWindowResized(() => {
        cb && cb();
    });
    window.electronAPI?.resizeWindow(360, 48, 'up');
};

export { resizeExpand, resizeCollapse };