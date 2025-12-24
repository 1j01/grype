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
  - [x] Context menu copy/cut/paste/select all (native browser behavior)
  - [x] Unicode support (including emoji, combining marks)
  - [ ] Spell check (not planned; couldn't be browser native... unless we used CSS shaders to transform the actual input for display?)
  - [x] Mobile style text selection (long press, start/end handles)
  - [x] Double click to select word, triple click to select all (native browser behavior)
  - [x] Drag selected text within field or to other fields (native browser behavior)
  - [x] Available as a reusable component (`CurvedTextField` class)
- [x] Text fields expand as you type
  - [x] Turn when needed (preferring CCW)
  - [ ] Prevent typing if expansion is not possible
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

Curved Text Fields:

- Can't focus field reliably in Firefox (regression)
- Page is scrolled towards the hidden input when typing (can be avoided by setting some subset of the styles `position: fixed; top: 0; left: 0; width: 100%; height: 100svh; overflow: hidden;` on the container element)
- Slight inaccuracy accumulates over curves, seen in selection highlight, caret position, or editing after placing cursor (Chrome-family browsers only; Firefox works fine)
- Dilate filter for borders is inefficient (MAY cause lag, not sure how bad)
- Text selection can be jittery because of the hidden input is always at least one frame behind mouse movement; I've lessened this by scaling the hidden input horizontally, but it can't be perfect AFAIK.
- Text selection can get stuck collapsed when the selection is collapsed to a caret; I don't understand this... it seems like a browser bug, though it happens on different browsers. That doesn't mean it's NOT a browser bug, but if it is, it's a bug in multiple browsers. This MAY also be lessened by scaling the hidden input horizontally, to some extent, but it's hard to tell.
- Selection handles for touch may be hard to grab (TODO: expand hitbox beyond visible area, maybe especially upwards)
- Native selection handles can still be shown; they can't be styled away, but I *have* found a way to push them offscreen (currently pushed by a fixed distance, not always enough)
- Stylistically:
  - I pictured the text fields being a little boxier around turns (though the text shouldn't turn any sharper)
  - padding for text in text field (along the text axis)
  - margin for text field (along the text axis) (borders currently overlap)

"Grype" demo app:

- You can create overlapping and self-intersecting paths (kinda fun though)
- The viewport is scaled based on width only, requiring scrolling if height > width, and zoom is ineffective (only resizing the width of the viewport scales the content)
- Ctrl+Z doesn't undo text field expansion or creation
- Code quality:
  - I don't like the name `updateVisuals`
  - `// allow text selection on existing items...` block is outdated (at least comment, maybe behavior)
  - `#simple-border` filter is created in grype.js, referenced in curved-text-field.js (should avoid dilate filter entirely though)

## Project name

I started with the project name Grype ("grid type" / "gripe")  
Tagline: "if you have gripes with this tool, just know that it didn't have a purpose in creating it"  

But this project has evolved to be more about the text field than the (currently useless) grid based app, so I think a better name would be Serpentype. Not that that wasn't the core of the project, but you know, it can do more than grids! It accepts arbitrary paths.

## Future Directions

anyways here's some possible directions for the project:

- city builder? you can kinda make roads with this, and with emoji I'm curious what you could already make with it
- esoteric programming language - one of them visual ones, what with code going in different directions - but with more normal/fluid syntax than most of them ones have, typically, perhaps (most [2D esolangs](https://esolangs.org/wiki/Category:Two-dimensional_languages) are rigid in a way due to their tile-like nature, but we could have a hybrid using the two levels of grid and text)
- typographic art tool: maybe add more structures you can create text in, like circles, fractals, maybe add distortion to the grid, stretching rows and columns, and effects like (I've doodled this before, don't remember what I called it:) slanted text where only the top or bottom is slanted and the other side is flat (stretching text in the middle, giving a sort of triangle of text), or even effects like [fluster](https://jsfiddle.net/1j01/x0frgjcm/5/); [here's a fiddle of mine where I was focusing on random geometric structures](https://jsfiddle.net/1j01/xwp4aLrd/9/); maybe even [physics](https://jsfiddle.net/1j01/j6bvnzdL/)? [idk](https://jsfiddle.net/1j01/fz9qg3tk/)
- art board / mood board tool: create winding captions around images
- conlang writing system (note to self: e.g. disarchanic runes)
- chat/collaboration tool of some kind
- mind mapping / diagramming (see also: [Minmap](https://github.com/1j01/mind-map))
- puzzle game (think Baba is You meets Rush Hour, [Snakeshift](https://1j01.itch.io/snakeshift), [crossword puzzles](https://crosshare.org/isaiahodhner), and/or Scribblenauts)
- tron typing action game: type different words to turn or go straight; try to box in your opponent(s); lobby system where you can create rooms and configure width/height, max players, time limit, and win conditions: either most letters, most words, or last standing. It would be different from Tron in that you can control your speed, so you would never crash unless you were forced to or made a mistake in which word you chose to type.
- library for curved text inputs that can be embedded in other web projects
  - TODO: rename repo to "serpentype" or "curved-text-field", treat "grype" as a demo app, split feature list between grype app and curved text field component, make a homepage with docs for the component (ideally searchable with a weirdly shaped search input), add features like placeholder text, scrolling within the input, readonly support, styling with CSS, integration with React, publish to npm, etc.

(see also: [diverge](https://github.com/1j01/diverge))

