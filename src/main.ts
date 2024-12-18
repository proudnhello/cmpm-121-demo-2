import "./style.css";

const APP_NAME = "TS Paint";
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = 256;
const PREVIEW_WIDTH = 50;
const PREVIEW_HEIGHT = 50;
const EXPORT_WIDTH = 1024;
const EXPORT_HEIGHT = 1024;
const THIN_THINKNESS = 1;
const THICK_THICKNESS = 5;
const EMOJI_SIZE = 24; 
const app = document.querySelector<HTMLDivElement>("#app")!;

// Page setup

function createButton(text: string, parent: HTMLElement, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.innerHTML = text;
    button.addEventListener("click", onClick);
    parent.append(button);
    return button;
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

// Creates a divider between the canvas and the buttons, so that they appears velow the canvas
const canvasButtonDivider = document.createElement("div");
canvasButtonDivider.innerHTML = "<br>";
app.append(canvasButtonDivider);

// Creates a button to clear the canvas
createButton("Clear", canvasButtonDivider, clearCanvas);

// Creates a button to undo the last line drawn
createButton("Undo", canvasButtonDivider, undoMove);

// Creates a button to redo the last line that was undone
createButton("Redo", canvasButtonDivider, redoMove);

// Creates a div to hold the thickness buttons below the canvas
const toolButtons = document.createElement("div");
app.append(toolButtons);

// Creates a button to set the thickness to the larger size
const thickButton = createButton("Thick", toolButtons, () => setThickness(THICK_THICKNESS, thickButton));

// Creates a button to set the thickness to the smaller size
const thinButton = createButton("Thin", toolButtons, () => setThickness(THIN_THINKNESS, thinButton));

// Create a button to add a new emoji
createButton("Custom Sticker", toolButtons, createEmoji);

// Adds a div to contain the emoji buttons
const emojiDiv = document.createElement("div");
app.append(emojiDiv)


const colorText = document.createElement("p");
colorText.innerHTML = "Draw Color";
app.append(colorText);

const ColorPicker = document.createElement("input");
ColorPicker.type = "color";
app.append(ColorPicker);


const rotationText = document.createElement("p");
rotationText.innerHTML = "Rotation";
app.append(rotationText);

// Adds a range input to control the rotation of the emoji
const rotationRange = document.createElement("input");
rotationRange.type = "range";
rotationRange.min = "0";
rotationRange.max = "360";
rotationRange.step = "1";
rotationRange.value = "0";
app.append(rotationRange);

// Adds a div to contain the small preview of the selected tool
const previewDiv = document.createElement("div");
app.append(previewDiv);

// Adds a canvas to show a preview of the selected tool
const previewCanvas = document.createElement("canvas");
previewCanvas.width = PREVIEW_WIDTH;
previewCanvas.height = PREVIEW_HEIGHT;
previewCanvas.classList.add("previewCanvas");
previewDiv.append(previewCanvas);

// Adds a div to contain the export button
const exportDiv = document.createElement("div");
app.append(exportDiv);

// Adds a button to export the canvas as an image
createButton("Export", exportDiv, exportCanvas);

function previewCustomSticker(emojiIndex: number) {
    currentEmoji = emojiObject[emojiIndex].emoji;
    currentCommandConstructor = makeEmojiCommand;
    canvas.dispatchEvent(toolMovedEvent);
    sizeToolButtons.setActive(emojiObject[emojiIndex].button!);
    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    placeSticker(previewContext, previewCanvas.width/2, previewCanvas.width/2, currentEmoji, rotation);
}

// Defines the emoji buttons
// All keys are strings, so as to make it proper JSON
// Thank you to github copilot for the syntax of ...null as HTMLButtonElement | null
// Each emoji object has an emoji and a corresponding button, which will be useful for setting up listeners later
const emojiObject = [
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
        emojiObject[i].button = createButton(emojiObject[i].emoji, emojiDiv, () => previewCustomSticker(i));
    }
}

function placeSticker(ctx: CanvasRenderingContext2D, x:number, y:number, emoji:string, rotation:number){
    const angleInRadians = rotation * Math.PI / 180;

    ctx.save();

    // The emoji must be offset by half its size. So, the vector that represents that has a magnitude of sqrt((EMOJI_SIZE/2)^2)
    // It is at a 135 degree angle, b/c x is negative and y is positive
    const offsetMagnitude = Math.sqrt((EMOJI_SIZE/2)**2);
    const offsetAngle = 135 * Math.PI / 180;

    // Now, we can find the new angle of the offset vector by adding the rotation angle to the offset angle
    const newAngle = angleInRadians + offsetAngle;

    // Using trigonometry, we can find the x and y components of the offset vector
    const xOffset = offsetMagnitude * Math.cos(newAngle);
    const yOffset = offsetMagnitude * Math.sin(newAngle);

    ctx.translate(x+xOffset, y+yOffset);
    ctx.rotate(angleInRadians);

    ctx.font = EMOJI_SIZE + `px sans-serif`;
    // -(EMOJI_SIZE/3) is used to center the emoji. I don't know why it's 4, I assume I've done my trigonometry wrong, but it works
    // Annoyingly, not all emojis are the same size or centered, so this doesn't work for all emojis. But it works (or is close) for most
    ctx.fillText(emoji, -(EMOJI_SIZE/3), 0);

    ctx.restore();
}

updateEmojiButtons(); // Create the initial emoji buttons

// Classes/interfaces

// Interface for objects that can be displayed on the canvas. May or may not be draggable
interface CanBeDisplayed{
    display(ctx:CanvasRenderingContext2D):void;
    drag?(x:number, y:number):void;
}

// An interface for a constructor that creates a CanBeDisplayed object. May or may not have a thickness and emoji, needs at least one
interface ComandConstructor{
    (x:number, y:number, extraInfo:number, text:string, rotation:number, color: string):CanBeDisplayed;
}

// Makes a line command object that can be displayed on the canvas
function makeLineCommand(x:number, y:number, thickness:number = THICK_THICKNESS, text:string, rotation:number, drawColor:string){
    return {
        // Line command object
        // Add the initial point to the points array
        points: [{x:x, y:y}],
        // Set the thickness of the line
        thickness: thickness,
        drawColor: drawColor,

        // Display the line on the canvas
        display: function(ctx:CanvasRenderingContext2D){
            ctx.beginPath();
            ctx.strokeStyle = this.drawColor;
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
function makeEmojiCommand(x:number, y:number, thickness: number, emoji:string, rotation:number, drawColor:string){
    return {
        // Emoji command object
        // Set the x and y position of the emoji, and the emoji itself (can actually be any string, but shhhhh)
        x: x,
        y: y,
        emoji: emoji,
        // Display the emoji on the canvas, with the emoji at the x and y position
        display: function(ctx:CanvasRenderingContext2D){
            placeSticker(ctx, this.x, this.y, this.emoji, rotation);
        },
        // Change the x and y position of the emoji when the mouse is dragged
        drag: function(x:number, y:number){
            this.x = x;
            this.y = y;
        }
    }
}

// Creates a cursor command object that acts as the preview of the point that would be drawn if the mouse was clicked
function makeCursorCommand(x:number, y:number, thickness:number = THICK_THICKNESS, emoji:string, rotation:number, drawColor:string = "black"){
    return {
        x: x,
        y: y,
        display: function(ctx:CanvasRenderingContext2D){
            // Draw the rectangle that would be drawn if the mouse was clicked if it's a line
            // Use the current command contructor to determine if it's a line or an emoji, b/c that's what would be drawn if the mouse was clicked
            if(currentCommandConstructor === makeLineCommand){
                ctx.beginPath();
                ctx.lineWidth = thickness;
                ctx.strokeStyle = drawColor;
                
                // 100 is the scale factor, so that the thickness is the same as the line being drawn. Any arbitarily large number would work
                ctx.rect(this.x, this.y, thickness/100, thickness/100);
                ctx.stroke();
            // Otherwise, place down the emoji
            }else{
                placeSticker(ctx, this.x, this.y, emoji, rotation);
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

let rotation = 0; // The rotation of the emoji
const lines:CanBeDisplayed[] = []; // Array to store the things that have been drawn
let currentPlacer:CanBeDisplayed | undefined = undefined; // The current thing being drawn
const undoneLines:CanBeDisplayed[] = []; // Array to store the things that have been undone
const redrawEvent = new Event("redraw"); // Event to trigger a redraw of the canvas, happens when there's a change in the lines array
const toolMovedEvent = new Event("tool-moved"); // Event to trigger a redraw of the canvas, happens when the cursor moves
let cursorCommand: CanBeDisplayed | undefined = makeCursorCommand(0, 0, THICK_THICKNESS, "🏴‍☠️", rotation, "black"); // The command to draw the preview of the selected tool
let currentCommandConstructor: ComandConstructor = makeLineCommand; // The current command constructor, which determines if the current tool is a line or an emoji
let currentEmoji: string = "🏴‍☠️"; // The current emoji
let thickness = 1; // The thickness of the line being drawn
let currentDrawColor = "black"// The color of the line being drawn
const previewContext = previewCanvas.getContext("2d")!;
// Creates a button set for size tools
const sizeToolButtons = makeButtonSet();

// Functions and Event Listeners

function setThickness(newThickness:number, button:HTMLButtonElement) {
    thickness = newThickness;
    currentCommandConstructor = makeLineCommand;
    sizeToolButtons.setActive(button);
    canvas.dispatchEvent(toolMovedEvent);
}

function setColor(newColor:string) {
    currentDrawColor = newColor;
    currentCommandConstructor = makeLineCommand;
    canvas.dispatchEvent(toolMovedEvent);
}

function clearCanvas() {
    drawingContext.clearRect(0, 0, canvas.width, canvas.height);
    lines.length = 0; // This empties the array. It is the same as lines = [], if lines was a let instead of a const
    undoneLines.length = 0; 
}

// Start drawing when the mouse is pressed down
canvas.addEventListener("mousedown", (event) => {
    // Remove the preview by making cursor comamnd undefined
    cursorCommand = undefined;
    canvas.dispatchEvent(toolMovedEvent); // Techinally unnecessary rn, as the later redraw event will do the same thing
    // Start a new thing with the current cursor position
    currentPlacer = currentCommandConstructor(event.offsetX, event.offsetY, thickness, currentEmoji, rotation, currentDrawColor) 
    // Add the current thing to the lines array
    lines.push(currentPlacer!);
    canvas.dispatchEvent(redrawEvent);
});

// Stop drawing when the mouse is released
canvas.addEventListener("mouseup", (event) => {
    // If the mouse is released, stop drawing by making the current placer undefined
    // Then draw the preview of the point by setting the cursor command
    cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, thickness, currentEmoji, rotation, currentDrawColor);
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
    cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, thickness, currentEmoji, rotation, currentDrawColor);
    canvas.dispatchEvent(toolMovedEvent);
});

// Draw a line when the mouse is moved
canvas.addEventListener("mousemove", (event) => {
    // if a line is being drawn, call the drag method on the current placer (assuming it exists)
    if (currentPlacer) {
        cursorCommand = undefined;
        currentPlacer!.drag!(event.offsetX, event.offsetY); // Add the current cursor position to the current line
        canvas.dispatchEvent(redrawEvent);
    }else{ // Otherwise, draw a preview of the point that would be drawn if the mouse was clicked
        cursorCommand = makeCursorCommand(event.offsetX, event.offsetY, thickness, currentEmoji, rotation, currentDrawColor);
        canvas.dispatchEvent(toolMovedEvent);
    }
    canvas.dispatchEvent(toolMovedEvent);
});

// Undo the last line drawn when the button is clicked
function undoMove() {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        if (lastLine) {
            undoneLines.push(lastLine);
        }
        canvas.dispatchEvent(redrawEvent);
    }
}

// Redo the last line that was undone when the button is clicked
function redoMove() {
    if (undoneLines.length > 0) {
        const lastUndoneLine = undoneLines.pop();
        if (lastUndoneLine) {
            lines.push(lastUndoneLine);
        }
        canvas.dispatchEvent(redrawEvent);
    }
}

// When the add emoji button is clicked, add a new emoji to the emoji buttons array, and update the emoji buttons
function createEmoji() {
    const stickerText:string = prompt("Custom Sticker Text:", "Put text here")!;
    emojiObject.push({"emoji": stickerText, "button": null});
    updateEmojiButtons();
}

// Export the canvas as an image when the button is clicked
function exportCanvas() {
    // Create a canvas element to hold the image
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = EXPORT_WIDTH;
    exportCanvas.height = EXPORT_HEIGHT;
    const exportContext = exportCanvas.getContext("2d")!;
    exportContext.scale(EXPORT_WIDTH/CANVAS_WIDTH, EXPORT_HEIGHT/CANVAS_HEIGHT);

    app.append(exportCanvas);

    // Draw the canvas onto the export canvas
    redrawCanvas(exportContext);

    app.append(exportCanvas);

    // Save the image as a png
    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = "sketchpad.png";
    anchor.click();

    // Remove the anchor
    anchor.remove();
    exportCanvas.remove();
};

// Add event listeners to the rotation slider
rotationRange.addEventListener("input", (event) => {
    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    rotation = parseInt((event.target as HTMLInputElement).value);
    placeSticker(previewContext, previewCanvas.width/2, previewCanvas.width/2, currentEmoji, rotation);
    canvas.dispatchEvent(toolMovedEvent);
});

// Add event listeners to the color picker
ColorPicker.addEventListener("input", (event) => {
    currentDrawColor = (event.target as HTMLInputElement).value;
    setColor(currentDrawColor);
    canvas.dispatchEvent(toolMovedEvent);
});

// Redraw the canvas when the redraw event is triggered. Uses the lines array, which stores all the lines that have been drawn as an array of points
function redrawCanvas(ctx:CanvasRenderingContext2D){
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    for (const line of lines) {
        line.display(ctx);
    } 

    if (cursorCommand){
        cursorCommand.display(ctx);
    }
}

canvas.addEventListener("redraw", redrawCanvas.bind(null, drawingContext));
canvas.addEventListener("tool-moved", redrawCanvas.bind(null, drawingContext));