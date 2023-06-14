import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import path from 'node:path';
import * as loudness from '@matthey/loudness';
import Store from 'electron-store';

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
	win = new BrowserWindow({
		width: 960,
		height: 620,
		resizable: true,
		autoHideMenuBar: true,
		frame: true,
		movable: true,
		backgroundColor: '#fff',
		icon: path.join(process.env.PUBLIC, 'logo.png'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			autoplayPolicy: 'no-user-gesture-required',
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	win.webContents.on('did-finish-load', () => {
		win?.webContents.focus();
	});

	ipcMain.on('reset-main-volume', (_event, volume) => {
		loudness.setVolume(volume);
		loudness.setMuted(false);
	});

	ipcMain.on('enter-fullscreen', () => {
		win?.webContents.executeJavaScript('document.getElementById("fullscreenview").requestFullscreen()', true);
	});

	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
	} else {
		win.loadFile(path.join(process.env.DIST, 'index.html'));
	}
}

app.on('window-all-closed', () => {
	win = null;
});

app.whenReady().then(() => {
	Store.initRenderer();
	createWindow();
});
