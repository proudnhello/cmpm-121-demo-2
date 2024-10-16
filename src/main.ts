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
canvasButtonDivider.append(clearButton);

// Creates a button to undo the last line drawn
const undoButton = document.createElement("button");
undoButton.innerHTML = "Undo";
canvasButtonDivider.append(undoButton);

// Creates a button to redo the last line that was undone
const redoButton = document.createElement("button");
redoButton.innerHTML = "Redo";
canvasButtonDivider.append(redoButton);

// Creates a div to hold the thickness buttons below the canvas
const toolButtons = document.createElement("div");
app.append(toolButtons);

// Creates a button to set the thickness to the larger size
const thickButton = document.createElement("button");
thickButton.innerHTML = "Thick";
toolButtons.append(thickButton);

// Creates a button to set the thickness to the smaller size
const thinButton = document.createElement("button");
thinButton.innerHTML = "Thin";
toolButtons.append(thinButton);

// Adds a div to contain the emoji buttons
const emojiDiv = document.createElement("div");
app.append(emojiDiv)

// Add a 

// Defines the emoji buttons
// All keys are strings, so as to make it proper JSON
// Thank you to github copilot for the syntax of ...null as HTMLButtonElement | null
// Each emoji object has an emoji and a corresponding button, which will be useful for setting up listeners later
let emojiObject = [
    {"emoji": "🏴‍☠️", "button": null as HTMLButtonElement | null},
    {"emoji": "👽", "button": null as HTMLButtonElement | null},
    {"emoji": "🦄", "button": null as HTMLButtonElement | null}
]

function updateEmojiButtons(){
    for (let i = 0; i < emojiObject.length; i++){
        // If the button exists, don't do anything
        if (emojiObject[i].button){
            continue;
        }
        // Otherwise, create the button and add it to the emoji div
        emojiObject[i].button = document.createElement("button");
        emojiObject[i].button!.innerHTML = emojiObject[i].emoji;
        emojiDiv.append(emojiObject[i].button!);
        // Add a listener to the button to set the current emoji to the emoji of the button
        emojiObject[i].button!.addEventListener("click", () => {
            currentEmoji = emojiObject[i].emoji;
            currentCommandConstructor = makeEmojiCommand;
            canvas.dispatchEvent(toolMovedEvent);
            sizeToolButtons.setActive(emojiObject[i].button!);
        });
    }
}

updateEmojiButtons(); // Create the initial emoji buttons

type Point = {x: number, y: number};

// Classes/interfaces

// Interface for objects that can be displayed on the canvas. May or may not be draggable
interface CanBeDisplayed{
    display(ctx:CanvasRenderingContext2D):void;
    drag?(x:number, y:number):void;
}

// An interface for a constructor that creates a CanBeDisplayed object. May or may not have a thickness and emoji, needs at least one
interface ComandConstructor{
    (x:number, y:number, ctx:CanvasRenderingContext2D, thickness?:number, emoji?:string):CanBeDisplayed;
}

// Makes a line command object that can be displayed on the canvas
function makeLineCommand(x:number, y:number, ctx:CanvasRenderingContext2D, thickness:number = 1){
    return {
        // Line command object
        // Add the initial point to the points array
        points: [{x:x, y:y}],
        // Set the thickness of the line
        thickness: thickness,

        // Display the line on the canvas
        display: function(){
            ctx.beginPath();
            ctx.lineWidth = this.thickness;
            if (this.points.length < 0){
                return
            }
            // Iterate over the points array and draw a line between each point
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
        },
        // Add a point to the points array when the mouse is dragged
        drag: function(x:number, y:number){
            this.points.push({x:x, y:y});
        }
    }
}

// Makes an emoji command object that can be displayed on the canvas
function makeEmojiCommand(x:number, y:number, ctx:CanvasRenderingContext2D, thickness?: number, emoji?:string){
    return {
        // Emoji command object
        // Set the x and y position of the emoji, and the emoji itself (can actually be any string, but shhhhh)
        x: x,
        y: y,
        emoji: emoji,
        // Display the emoji on the canvas, with the emoji at the x and y position
        display: function(){
            ctx.font = `24px sans-serif`;
            ctx.fillText(this.emoji!, this.x-12, this.y+12);
        },
        // Change the x and y position of the emoji when the mouse is dragged
        drag: function(x:number, y:number){
            this.x = x;
            this.y = y;
        }
    }
}

// Creates a cursor command object that acts as the preview of the point that would be drawn if the mouse was clicked
function makeCursorCommand(x:number, y:number, ctx:CanvasRenderingContext2D, thickness:number = 1, emoji:string){
    return {
        x: x,
        y: y,
        display: function(){
            // Draw the rectangle that would be drawn if the mouse was clicked if it's a line
            // Use the current command contructor to determine if it's a line or an emoji, b/c that's what would be drawn if the mouse was clicked
            if(currentCommandConstructor === makeLineCommand){
                ctx.beginPath();
                ctx.lineWidth = thickness;
                ctx.rect(this.x, this.y, thickness/100, thickness/100);
                ctx.stroke();
            // Otherwise, place down the emoji
            }else{
                ctx.font = `24px sans-serif`;
                ctx.fillText(emoji, this.x-12, this.y+12);
            }
        }
    }
}

// The interface for button sets. Essentially, a button set is a group of buttons where only one can be active at a time
// The active button will use the "activeTool" class, and setting a button to active will remove the class from the previous active button
interface ButtonSet{
    activeButton:HTMLButtonElement | null;
    setActive(button:HTMLButtonElement):void;
}

// Create a button set
function makeButtonSet():ButtonSet{
    return {
        activeButton: null,
        setActive: function(button:HTMLButtonElement){
            if (this.activeButton){
                this.activeButton.classList.remove("activeTool");
            }
            this.activeButton = button;
            this.activeButton!.classList.add("activeTool");
        }
    }
}

// Variables

const lines:CanBeDisplayed[] = []; // Array to store the things that have been drawn
let currentPlacer:CanBeDisplayed | undefined = undefined; // The current thing being drawn
const undoneLines:CanBeDisplayed[] = []; // Array to store the things that have been undone
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas, happens when there's a change in the lines array
const toolMovedEvent = new Event("tool-moved"); // Event to trigger a redraw of the canvas, happens when the cursor moves
let cursorCommand: CanBeDisplayed | undefined = makeCursorCommand(0, 0, drawingContext, 1, "🏴‍☠️"); // The command to draw the preview of the selected tool
let currentCommandConstructor: ComandConstructor = makeLineCommand; // The current command constructor, which determines if the current tool is a line or an emoji
let currentEmoji: string = "🏴‍☠️"; // The current emoji
let thickness = 1; // The thickness of the line being drawn

// Functions and Event Listeners

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    // Remove the preview by making cursor comamnd undefined
    cursorCommand = undefined;
    canvas.dispatchEvent(toolMovedEvent); // Techinally unnecessary rn, as the later redraw event will do the same thing
    // Start a new thing with the current cursor position
    currentPlacer = currentCommandConstructor(event.offsetX, event.offsetY, drawingContext, thickness, currentEmoji) 
    // Add the current thing to the lines array
    lines.push(currentPlacer!);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", (event) => {
    // If the mouse is released, stop drawing by making the current placer undefined
    // Then draw the preview of the point by setting the cursor command
    cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, drawingContext, thickness, currentEmoji);
    currentPlacer = undefined;
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse leaves the canvas
canvas.addEventListener("mouseleave", () => {
    currentPlacer = undefined;
    cursorCommand = undefined;
    canvas.dispatchEvent(toolMovedEvent);
});

// Start providing a preview of the point that would be drawn if the mouse was clicked when the mouse enters the canvas
canvas.addEventListener("mouseenter", (event) => {
    // If the mouse enters the canvas, draw the preview of the point 
    cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, drawingContext, thickness, currentEmoji);
    canvas.dispatchEvent(toolMovedEvent);
});

// Clear the canvas when the button is clicked
clearButton.addEventListener("click", () => {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0; // This empties the array. It is the same as lines = [], if lines was a let instead of a const
    undoneLines.length = 0; 
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    // if a line is being drawn, call the drag method on the current placer (assuming it exists)
    if (currentPlacer) {
        cursorCommand = undefined;
        currentPlacer!.drag!(event.offsetX, event.offsetY); // Add the current cursor position to the current line
        canvas.dispatchEvent(redrawEvent);
    }else{ // Otherwise, draw a preview of the point that would be drawn if the mouse was clicked
        cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, drawingContext, thickness, currentEmoji);
        canvas.dispatchEvent(toolMovedEvent);
    }
    canvas.dispatchEvent(toolMovedEvent);
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
const sizeToolButtons = makeButtonSet();

// Set the thickness of the line being drawn when the button is clicked
thinButton.addEventListener("click", () => {
    thickness = 1;
    currentCommandConstructor = makeLineCommand;
    sizeToolButtons.setActive(thinButton);
    canvas.dispatchEvent(toolMovedEvent);
});

// Set the thickness of the line being drawn when the button is clicked
thickButton.addEventListener("click", () => {
    thickness = 5;
    currentCommandConstructor = makeLineCommand;
    sizeToolButtons.setActive(thickButton);
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