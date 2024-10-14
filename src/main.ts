import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const app = document.querySelector<HTMLDivElement>("#app")!;

type Point = {x: number, y: number};

class Line{
    points: Point[] = [];
    thickness: number = 1;
    constructor(x:number, y:number, thickness:number = 1){
        this.points.push({x:x, y:y});
        this.thickness = thickness;
    }
    // Draw the command on the provided canvas context
    display(ctx:CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.lineWidth = this.thickness;
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

// A class to hold a set of mutually exlusive buttons that can be toggled on and off
// ie, only one button in the set can be active at a time, and clicking one button will deactivate the others
class ToolButtonSet{
    activeButton : HTMLButtonElement | null = null;
    constructor(){
    }
    // Set a button to be active and deactivate the others
    setActive(button:HTMLButtonElement){
        if (this.activeButton){
            this.activeButton.classList.remove("activeTool");
        }
        this.activeButton = button;
        this.activeButton.classList.add("activeTool");
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
const lines:Line[] = []; // Array to store the lines that have been drawn
let currentLine:Line | undefined = undefined; // The current line being drawn
const undoneLines:Line[] = []; // Array to store the lines that have been undone
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas
let thickness = 1; // The thickness of the line being drawn

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    cursor.active = true;
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    // Start a new line
    currentLine = new Line(cursor.x, cursor.y, thickness); // Start a new line with the current cursor position
    lines.push(currentLine);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", () => {
    cursor.active = false;
    currentLine = undefined; // Clear the current line
    canvas.dispatchEvent(redrawEvent);
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    if (cursor.active) {
        cursor.x = event.offsetX;
        cursor.y = event.offsetY;
        currentLine!.drag(cursor.x, cursor.y); // Add the current cursor position to the current line

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

// Creates a div to hold the thickness buttons below the canvas
const toolButtons = document.createElement("div");
app.append(toolButtons);

// Creates a button set for size tools
const sizeToolButtons = new ToolButtonSet();

// Creates a button to set the thickness to the larger size
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
app.append(thickButton);
thickButton.addEventListener("click", () => {
    thickness = 5;
    sizeToolButtons.setActive(thickButton);
});

// Creates a button to set the thickness to the smaller size
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
app.append(thinButton);
thinButton.addEventListener("click", () => {
    thickness = 1;
    sizeToolButtons.setActive(thinButton);
});
