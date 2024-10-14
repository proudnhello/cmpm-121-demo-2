import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const app = document.querySelector<HTMLDivElement>("#app")!;

// Creates the title of the app on the page
document.title = APP_NAME;
const pageTitle = document.createElement("h1");
pageTitle.innerHTML = APP_NAME;
app.append(pageTitle);

// Creates the canvas that the user will draw on
const canvas = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
app.append(canvas);
 