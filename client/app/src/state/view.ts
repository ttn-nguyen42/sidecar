declare global {
  interface Window {
    electronAPI?: {
      resizeWindow: (width: number, height: number) => void;
      onWindowResized: (cb: () => void) => void;
    };
  }
}

const resizeTo = (width: number, height: number, cb?: () => void) => {
  window.electronAPI?.onWindowResized(() => {
    cb && cb();
  });
  window.electronAPI?.resizeWindow(width, height);
};

export { resizeTo };
