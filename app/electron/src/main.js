import { app, BrowserWindow, screen } from "electron/main";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.argv.includes("--mode=dev");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 64,
    height: 360,
    frame: false,
    alwaysOnTop: true,
    alwaysOnTopLevel: "floating",
    transparent: true,
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
