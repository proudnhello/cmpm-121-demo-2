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

// Cursor to keep track of the mouse position for drawing
const cursor = {active: false, x: 0, y: 0};

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        const drawingContext = canvas.getContext("2d")!;
        drawingContext.beginPath();
        drawingContext.moveTo(cursor.x, cursor.y);
        drawingContext.lineTo(event.offsetX, event.offsetY);
        drawingContext.stroke();
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
    }
});

// Creates a divider between the canvas and the buttons, so that they appears velow the canvas
const canvasButtonDivider = document.createElement("div");
canvasButtonDivider.innerHTML = "<br>";
app.append(canvasButtonDivider);

// Creates a button to clear the canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

// Clear the canvas when the button is clicked
clearButton.addEventListener("click", () => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});