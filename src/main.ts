import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const app = document.querySelector<HTMLDivElement>("#app")!;

type Point = {x: number, y: number};

class Command{
    points: Point[] = [];
    constructor(x:number, y:number){
        this.points.push({x:x, y:y});
    }
    // Draw the command on the provided canvas context
    display(ctx:CanvasRenderingContext2D){
        ctx.beginPath();
        if (this.points.length < 0){
            return
        }
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.stroke();
    }
    // Include a new point in the command
    drag(x:number, y:number){
        this.points.push({x:x, y:y});
    }
}

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
const lines:Command[] = []; // Array to store the lines that have been drawn
let currentCommand:Command | undefined = undefined; // The current line being drawn
const undoneLines:Command[] = []; // Array to store the lines that have been undone
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    // Start a new line
    currentCommand = new Command(cursor.x, cursor.y); // Start a new line with the current cursor position
    lines.push(currentCommand);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentCommand = undefined; // Clear the current line
    canvas.dispatchEvent(redrawEvent);
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentCommand!.drag(cursor.x, cursor.y); // Add the current cursor position to the current line

        canvas.dispatchEvent(redrawEvent);
    }
});

// Redraw the canvas when the redraw event is triggered. Uses the lines array, which stores all the lines that have been drawn as an array of points
canvas.addEventListener("redraw", () => {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);

    for (const line of lines) {
        line.display(drawingContext);
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
    undoneLines.length = 0; 
});

// Creates a button to undo the last line drawn
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

// Undo the last line drawn when the button is clicked
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        if (lastLine) {
            undoneLines.push(lastLine);
        }
        canvas.dispatchEvent(redrawEvent);
    }
});

// Creates a button to redo the last line that was undone
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

// Redo the last line that was undone when the button is clicked
redoButton.addEventListener("click", () => {
    if (undoneLines.length > 0) {
        const lastUndoneLine = undoneLines.pop();
        if (lastUndoneLine) {
            lines.push(lastUndoneLine);
        }
        canvas.dispatchEvent(redrawEvent);
    }
});