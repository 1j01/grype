# Grype

A grid where you can draw winding text fields and type into them.

Text follows the winding path of the field, including going backwards / upside down.

## Features
- [ ] Purpose
- [x] Create serpentine text fields
- [x] Blinking caret
- [x] Selection highlight
- [x] Click to place cursor / select text
  - [ ] Shift+click to select text without changing anchor
  - [ ] Bidirectional text support
- [x] Keyboard navigation (arrow keys, shift+arrows for selection, home/end) (native browser behavior)
- [x] Text copy/cut/paste/delete/undo/redo (native browser behavior)
- [x] Text fields expand as you type
  - [ ] Turn when if needed (preferring CCW)
  - [ ] Prevent typing if expansion is not possible
- [ ] Spell check (not planned; couldn't be browser native... unless we used CSS shaders to transform the actual input for display?)
- [ ] Paste images into the grid
  - [ ] Resize handles
  - [ ] Drag to reposition
- [ ] A way to delete created items
- [ ] A way to split text items?
- [ ] Save/load
- [ ] Pan/zoom
- [ ] ???
- [ ] Profit

## Known issues
- You can create overlapping and self-intersecting paths (kinda fun though)
- Page is scrolled towards the hidden input when typing
- The viewport isn't as expected (page shouldn't be scrollable in the first place)
- Text fields only expand by one cell at a time, even if you paste a bunch of ﷽﷽﷽ characters
- Dilate filter for borders is inefficient (MAY cause lag, not sure how bad)
- Context menu doesn't work correctly (I recall reading an article about how CodeMirror handled this, but I can't find it now; but basically we need to put something editable under the cursor)
- Stylistically:
  - I pictured the text fields being a little boxier around turns (though the text shouldn't turn any sharper)
  - padding for text in text field (along the text axis)
  - margin for text field (along the text axis) (borders currently overlap)
- Code quality:
  - I don't like the name `updateVisuals`
  - `// allow text selection on existing items...` block is outdated (at least comment, maybe behavior)

## Project name

Project name: Grype ("grid type")  
Tagline: "if you have gripes with this tool, just know that it didn't have a purpose in creating it"  
