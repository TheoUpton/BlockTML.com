# BlockTML

A browser-based, block-based HTML editor built in vanilla JavaScript, no frameworks, no libraries.

**Try it live at [blocktml.com/code](https://blocktml.com/code)**

---

## What is it?

BlockTML is a browser-based, block-based HTML editor built entirely in vanilla JavaScript. It lets you construct HTML visually by placing and arranging elements, while keeping the output transparent — what you build is real, valid HTML, not an abstraction of it.

The project started as an exploration of whether visual tools could bridge the gap between block-based coding environments and actual HTML, making the language more approachable without hiding what's happening underneath. It is a work in progress with planned features still to come.

---

## Features

**Creating blocks**  
Blocks are created by dragging from the template panel onto the editor. A shadow indicates where the block will be placed. Releasing a block outside the editor discards it — a dedicated discard area is planned for clarity.

**Smart attribute system**  
Hovering over an element reveals a `+` button that allows new attributes to be added. Only valid attributes for that specific element are accepted, with value inputs validated against expected type in real time.

**Reordering blocks**  
Blocks can be picked up and moved within the editor, including blocks that contain nested children. The editor updates in real time to show where the block will land.

**Undo and redo**  
Every action is recorded and can be reversed. Use Ctrl+Z to undo and Ctrl+Shift+Z or Ctrl+Y to redo.

**Files and folders**  
Multiple HTML files and folders can be created within a project. New files are created by opening the folder panel, clicking the add button, and entering a filename including the `.html` extension. Note: the folder list requires closing and reopening to reflect newly created files, automatic refresh is not yet implemented.

**Tabs**  
Files can be opened as tabs by selecting them from the folder panel. Tab closing and reordering are not yet implemented.

**Live preview**  
Pages are rendered locally in an iframe with no server required. Click the home icon to load `index.html`, or use the refresh button to reload the file shown in the navbar.

**Multi-page navigation**  
Anchor links using POSIX paths (e.g. `/folder/file.html`) work within the preview. Clicks are intercepted and resolved against the virtual file system, so multi-page projects navigate as they would in a real browser.

---

## Technical highlights

**Centralised event dispatch**
- A single event handler listens on the document rather than individual elements
- Events are dispatched by checking the target element for a corresponding named method (`globalLeftClick`, `globalPointerDrag`, etc.), walking up the DOM if needed
- Elements never add or remove their own listeners, they just implement named methods, so removed elements are genuinely garbage collected
- Handles mouse, touch, and pointer input through a unified pipeline
- Methods can be dynamically reassigned mid-interaction without the handler needing to know
- A separate listening objects registry allows inter-object communication without direct coupling

**Command pattern for undo/redo**
- Every action is stored as a reversible command pair, undo and redo, on a stack
- Commands store a path to the object, the method, and the arguments rather than a direct reference; paths are resolved at execution time so deleted objects are not retained in memory
- An inProgress system accumulates multi-stage actions into a single committed command
- Supports regular calls, getters, setters, and Reflect-based construction to accommodate extending native HTML elements

**Element-specific attribute validation**
- Valid attributes defined per element to match the HTML spec
- Value inputs filtered in real time by expected type: enumerated strings, integers, URLs, booleans, etc.

**CSS Custom States**
- Block status and content type managed via the `ElementInternals` API rather than class or attribute toggles

**Custom data structures**
- `SortedArray`, `SortedMap`, `NestedMap`, and `CountMap` implemented from scratch with binary search for O(log n) insertion and lookup

---

## Current scope

Currently supports **HTML only**. CSS and JavaScript support are planned.

---

## Built with

- Vanilla JavaScript
- HTML and CSS
- Web Components (`customElements`, Shadow DOM, `ElementInternals`)