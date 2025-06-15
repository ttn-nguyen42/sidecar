import { app, BrowserWindow, screen, ipcMain } from "electron/main";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.argv.includes("--mode=dev");

let win;
const createWindow = () => {
  win = new BrowserWindow({
    width: 64,
    height: 360,
    frame: false,
    alwaysOnTop: true,
    alwaysOnTopLevel: "floating",
    transparent: true,
    fullscreenable: false,
    resizable: false,
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

ipcMain.on("resize-window", (event, { width, height, direction }) => {
  if (win) {
    const [currentX, currentY] = win.getPosition();
    const [currentWidth, currentHeight] = win.getSize();
    let newX = currentX;
    if (direction === "left") {
      // Expand left: move x so right edge stays fixed
      newX = currentX - (width - currentWidth);
    } else if (direction === "right") {
      // Retract right: move x so right edge stays fixed
      newX = currentX + (currentWidth - width);
    }
    win.setBounds({ x: newX, y: currentY, width, height }, true);
    // Notify renderer that resizing is done
    event.sender.send("window-resized", { width, height, direction });
  }
});
