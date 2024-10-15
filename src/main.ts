import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const app = document.querySelector<HTMLDivElement>("#app")!;

// Page setup

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

// Creates a divider between the canvas and the buttons, so that they appears velow the canvas
const canvasButtonDivider = document.createElement("div");
canvasButtonDivider.innerHTML = "<br>";
app.append(canvasButtonDivider);

// Creates a button to clear the canvas
const clearButton = document.createElement("button");
clearButton.innerHTML = "Clear";
app.append(clearButton);

// Creates a button to undo the last line drawn
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
app.append(undoButton);

// Creates a button to redo the last line that was undone
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
app.append(redoButton);

// Creates a div to hold the thickness buttons below the canvas
const toolButtons = document.createElement("div");
app.append(toolButtons);

// Creates a button to set the thickness to the larger size
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
app.append(thickButton);

// Creates a button to set the thickness to the smaller size
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
app.append(thinButton);

// Adds a div to seperate the emojis from the brushes
const brushToEmojiDiv = document.createElement("div");
app.append(brushToEmojiDiv)

// Add the first emoji button
const pirateButton = document.createElement("button");
pirateButton.innerHTML = "🏴‍☠️";
app.append(pirateButton);

// Add the second emoji button
const ablienButton = document.createElement("button");  
ablienButton.innerHTML = "👽"
app.append(ablienButton);

// Add the third emoji button
const unicornButton = document.createElement("button");
unicornButton.innerHTML = "🦄"
app.append(unicornButton);

type Point = {x: number, y: number};

// Classes/interfaces

interface CanBeDisplayed{
    display(ctx:CanvasRenderingContext2D):void;
    drag(x:number, y:number):void;
    initialize(x:number, y:number, thickness?:number):void;
}

function makeLineCommand(x:number, y:number, ctx:CanvasRenderingContext2D, thickness:number = 1){
    return {
        points: [{x:x, y:y}],
        thickness: thickness,
        display: function(){
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
        },
        drag: function(x:number, y:number){
            this.points.push({x:x, y:y});
        },
        initialize: function(x:number, y:number, thickness:number = 1){
            this.points.push({x:x, y:y});
            this.thickness = thickness;
        }
    }
}

class CursorCommand{
    x: number;
    y: number;
    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }

    display(ctx:CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.lineWidth = thickness;
        // Thickness/100 is used for the w and h so that the cursor essentially draws a point based on the thickness
        ctx.rect(this.x, this.y, thickness/100, thickness/100);
        ctx.stroke();
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

// Variables

const lines:CanBeDisplayed[] = []; // Array to store the lines that have been drawn
let currentLine:CanBeDisplayed | undefined = undefined; // The current line being drawn
const undoneLines:CanBeDisplayed[] = []; // Array to store the lines that have been undone
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas, happens when there's a change in the lines array
const toolMovedEvent = new Event("tool-moved"); 
let cursorCommand: CursorCommand | undefined = undefined
let thickness = 1; // The thickness of the line being drawn    

// Functions and Event Listeners

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    cursorCommand = undefined;
    canvas.dispatchEvent(toolMovedEvent);
    // Start a new line
    currentLine = makeLineCommand(event.offsetX, event.offsetY, drawingContext, thickness); // Start a new line with the current cursor position
    lines.push(currentLine);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", (event) => {
    cursorCommand = new CursorCommand(event.offsetX, event.offsetY);
    currentLine = undefined; // Clear the current line
    canvas.dispatchEvent(redrawEvent);
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    // if a line is being drawn, add the current cursor position to the current line
    canvas.dispatchEvent(toolMovedEvent);
    if (currentLine) {
        cursorCommand = undefined;
        currentLine!.drag(event.offsetX, event.offsetY); // Add the current cursor position to the current line
        canvas.dispatchEvent(redrawEvent);
    }else{ // Otherwise, draw a preview of the point that would be drawn if the mouse was clicked
        cursorCommand = new CursorCommand(event.offsetX, event.offsetY);
        canvas.dispatchEvent(toolMovedEvent);
    }
});

// Stop drawing when the mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
    cursorCommand = undefined;
    currentLine = undefined;
    canvas.dispatchEvent(toolMovedEvent);
});

// Start providing a preview of the point that would be drawn if the mouse was clicked when the mouse enters the canvas
canvas.addEventListener("mouseenter", (event) => {
    cursorCommand = new CursorCommand(event.offsetX, event.offsetY);
    canvas.dispatchEvent(toolMovedEvent);
});

// Redraw the canvas when the redraw event is triggered. Uses the lines array, which stores all the lines that have been drawn as an array of points
function redrawCanvas() {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);

    for (const line of lines) {
        line.display(drawingContext);
    }

    if (cursorCommand){
        cursorCommand.display(drawingContext);
    }
}
canvas.addEventListener("redraw", redrawCanvas);
canvas.addEventListener("tool-moved", redrawCanvas);

// Clear the canvas when the button is clicked
clearButton.addEventListener("click", () => {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0; // This empties the array. It is the same as lines = [], if lines was a let instead of a const
    undoneLines.length = 0; 
});

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

// Creates a button set for size tools
const sizeToolButtons = new ToolButtonSet();

// Set the thickness of the line being drawn when the button is clicked
thinButton.addEventListener("click", () => {
    thickness = 1;
    sizeToolButtons.setActive(thinButton);
    canvas.dispatchEvent(toolMovedEvent);
});

// Set the thickness of the line being drawn when the button is clicked
thickButton.addEventListener("click", () => {
    thickness = 5;
    sizeToolButtons.setActive(thickButton);
    canvas.dispatchEvent(toolMovedEvent);
});
