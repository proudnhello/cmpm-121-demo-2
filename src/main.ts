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
const drawingContext = canvas.getContext("2d")!;

const cursor = {active: false, x: 0, y: 0}; // Cursor to keep track of the mouse position for drawing
const lines:{x:number, y:number}[][] = []; // Array to store the lines that have been drawn
let currentLine = []; // The current line being drawn
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    // Start a new line
    currentLine = [{x: cursor.x, y: cursor.y}];
    lines.push(currentLine);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = [];
    canvas.dispatchEvent(redrawEvent);
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine.push({x: cursor.x, y: cursor.y});

        canvas.dispatchEvent(redrawEvent);
    }
});

// Redraw the canvas when the redraw event is triggered
canvas.addEventListener("redraw", () => {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);

    for (const line of lines) {
        drawingContext.beginPath();
        drawingContext.moveTo(line[0].x, line[0].y);

        for (let i = 1; i < line.length; i++) {
            drawingContext.lineTo(line[i].x, line[i].y);
        }

        drawingContext.stroke();
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
    lines.length = 0; // This empties the array. It is the same as lines = [], if lines was a let instead of a const
});