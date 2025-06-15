import { app, BrowserWindow, screen, ipcMain } from "electron/main";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.argv.includes("--mode=dev");

let win;
const createWindow = () => {
  win = new BrowserWindow({
    width: 360,
    height: 48,
    frame: false,
    alwaysOnTop: true,
    alwaysOnTopLevel: "floating",
    // transparent: true,
    fullscreenable: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setVisibleOnAllWorkspaces(true);

  if (isDev) {
    win.loadURL("http://127.0.0.1:3000");
  } else {
    win.loadFile(path.join(__dirname, "../../solidjs_dist/index.html"));
  }
};

app.commandLine.appendSwitch("auto-detect", "false");
app.commandLine.appendSwitch("no-proxy-server");

app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("resize-window", (event, { width, height }) => {
  if (win) {
    const [currentX, currentY] = win.getPosition();
    
    win.setBounds({ x: currentX, y: currentY, width, height }, true);
    event.sender.send("window-resized", { width, height });
  }
});
