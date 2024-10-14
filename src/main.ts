import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
const h1 = document.createElement("h1");
h1.innerHTML = APP_NAME;
app.append(h1);

const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
app.append(canvas);
 