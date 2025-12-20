# Grype

A grid where you can draw winding text fields and type into them.

Text follows the winding path of the field, including going backwards / upside down.

[Try it out here](https://1j01.github.io/grype/)

## Features
- [ ] Purpose
- [x] Create serpentine text fields
- [x] Blinking caret
- [x] Selection highlight
- [x] Click to place cursor / select text
  - [x] Shift+click to select text without changing anchor
  - [ ] Bidirectional text support
- [x] Keyboard navigation (arrow keys, shift+arrows for selection, home/end) (native browser behavior)
- [x] Text copy/cut/paste/delete/undo/redo (native browser behavior)
- [x] Text fields expand as you type
  - [x] Turn when needed (preferring CCW)
  - [ ] Prevent typing if expansion is not possible
- [x] Unicode support (including emoji, combining marks)
- [ ] Spell check (not planned; couldn't be browser native... unless we used CSS shaders to transform the actual input for display?)
- [ ] Mobile style text selection (long press, start/end handles)
- [ ] Double click to select word, triple click to select all
- [ ] Drag selected text within field or to other fields
- [x] Paste images into the grid
  - [ ] Resize handles
  - [x] Drag to reposition
- [ ] A way to delete created items
- [ ] A way to split text items?
- [ ] A way to change the shape of text items after creation
- [ ] Save/load
- [ ] Pan/zoom
- [ ] ???
- [ ] Profit

## Known issues
- You can create overlapping and self-intersecting paths (kinda fun though)
- Page is scrolled towards the hidden input when typing
- The viewport is scaled based on width only, requiring scrolling if height > width, and zoom is ineffective (only resizing the width of the viewport scales the content)
- Dilate filter for borders is inefficient (MAY cause lag, not sure how bad)
- Context menu doesn't work correctly (I recall reading an article about how CodeMirror handled this, but I can't find it now; but basically we need to put something editable under the cursor)
- Ctrl+Z doesn't undo text field expansion or creation
- Slight inaccuracy accumulates over curves, seen in selection highlight, caret position, or editing after placing cursor (Chrome-family browsers only; Firefox works fine)
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

## Future Directions

anyways here's some possible directions for the project:

- city builder? you can kinda make roads with this, and with emoji I'm curious what you could already make with it
- esoteric programming language - one of them visual ones, what with code going in different directions - but with more normal/fluid syntax than most of them ones have, typically, perhaps (most [2D esolangs](https://esolangs.org/wiki/Category:Two-dimensional_languages) are rigid in a way due to their tile-like nature, but we could have a hybrid using the two levels of grid and text)
- typographic art tool: maybe add more structures you can create text in, like circles, fractals, maybe add distortion to the grid, stretching rows and columns, and effects like (I've doodled this before, don't remember what I called it:) slanted text where only the top or bottom is slanted and the other side is flat (stretching text in the middle, giving a sort of triangle of text), or even effects like [fluster](https://jsfiddle.net/1j01/x0frgjcm/5/); [here's a fiddle of mine where I was focusing on random geometric structures](https://jsfiddle.net/1j01/xwp4aLrd/9/); maybe even [physics](https://jsfiddle.net/1j01/j6bvnzdL/)? [idk](https://jsfiddle.net/1j01/fz9qg3tk/)
- art board / mood board tool: create winding captions around images
- conlang writing system (note to self: e.g. disarchanic runes)
- chat/collaboration tool of some kind
- mind mapping / diagramming
- puzzle game (think Baba is You meets Rush Hour, [Snakeshift](https://1j01.itch.io/snakeshift), [crossword puzzles](https://crosshare.org/isaiahodhner))
- library for curved text inputs that can be embedded in other web projects

(see also: [diverge](https://github.com/1j01/diverge))

