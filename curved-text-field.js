import { html, svg } from "./helpers.js";

export class CurvedTextField {
	/** @type {string} */
	id;
	/** @type {SVGGElement} */
	element;
	/** @type {SVGPathElement} */
	pathElement;
	/** @type {SVGTextElement} */
	textElement;
	/** @type {SVGTextPathElement} */
	textPathElement;
	/** @type {HTMLInputElement} */
	hiddenInput;
	/** @type {HTMLDivElement} */
	hiddenMeasurementElement;

	/** @type {SVGLineElement} */
	caret;
	/** @type {SVGPathElement} */
	selectionPath;

	pathThickness = 9;
	fontSize = 5;

	cursorBlinkInterval = 500; // ms
	cursorBlinkTimerId = -1;

	constructor() {
		this.id = `curved-text-field-${crypto.randomUUID()}`;

		this.element = svg("g");

		this.pathElement = svg("path", {
			id: this.id,
			stroke: "white",
			"stroke-width": this.pathThickness,
			fill: "none",
			filter: "url(#simple-border)",
		});

		this.textPathElement = svg("textPath", {
			href: `#${this.id}`,
			style: "white-space: pre",
		});
		this.textElement = svg("text", {
			"font-size": this.fontSize,
			"dominant-baseline": "middle",
			fill: "black",
			"pointer-events": "none",
			style: "user-select: none;",
		});
		const sharedStyles = "font-size: 10px; font-family: monospace;";
		const debug = location.search.includes("curved-text-field-debug");
		this.hiddenInput = html("input", {
			style: `position:fixed; left:-9999px; top:-9999px; opacity: ${debug ? 0.5 : 0}; padding: 5px; touch-action: none; background: yellow; border: 0; margin: 0; ${sharedStyles}`,
		});
		this.hiddenMeasurementElement = html("div", {
			style: `position:fixed; left:-9999px; top:-9999px; visibility:hidden; white-space: pre; ${sharedStyles}`,
		});

		this.caret = svg("line", {
			stroke: "black",
			"stroke-width": "0.5",
			visibility: "hidden",
			"pointer-events": "none",
		});

		this.selectionPath = svg("path", {
			stroke: "rgba(0,120,215,0.3)",
			"stroke-width": this.pathThickness * 0.6,
			fill: "none",
			visibility: "hidden",
			"pointer-events": "none",
		});

		const selectionHandlePath = svg("path", {
			d: "M 0 0 L 10 0 A 10 10 90 1 1 0 10 Z",
			fill: "rgba(0,120,215,0.8)",
		});
		const selectionHandleSVG = svg("svg", {
			width: "20",
			height: "20",
			style: "position: fixed; transform-origin: 0% 0%; touch-action: none;",
		});
		selectionHandleSVG.append(selectionHandlePath);
		this.selectionHandles = [selectionHandleSVG, selectionHandleSVG.cloneNode(true)];
		this.usingTouch = false;

		this.textElement.append(this.textPathElement);
		this.element.append(
			this.pathElement,
			this.textElement,
			this.caret,
			this.selectionPath,
		);

		// TODO: proper place in DOM
		// (foreignObject so it can be in the same group?)
		document.body.append(this.hiddenInput);
		document.body.append(this.hiddenMeasurementElement);

		let anchorIndex = -1;
		let caretIndex = -1;
		const setSelection = () => {
			this.hiddenInput.setSelectionRange(
				Math.min(anchorIndex, caretIndex),
				Math.max(anchorIndex, caretIndex),
				caretIndex < anchorIndex ? "backward" : "forward"
			);
		};

		// This function handles both pointermove and dragover
		// and doesn't wait for pointerdown, because we need to update
		// before pointerdown for the event to target the native input,
		// though this might be impossible for touch.
		// (One thing to try: if we make the input large enough to cover the whole path,
		// if we update its position on pointerdown, will the native input handling use
		// the updated position? If so, we can clip the input with clip-path so that
		// it only accepts pointer events along the path.)
		const onPointerMove = (event) => {
			// console.log(event.type);
			if (this.draggingSelectionHandle) {
				event.preventDefault();
				// TODO: figure out the correct selection side logic
				// hard to test due to the bug where the selection collapses
				const newIndex = this.getTextIndex(event);
				if ((this.draggingSelectionHandleIndex === 0) !== (this.hiddenInput.selectionStart < this.hiddenInput.selectionEnd)) {
					// if ((this.draggingSelectionHandleIndex === 0) !== (this.hiddenInput.selectionStart > this.hiddenInput.selectionEnd)) {
					// if ((this.draggingSelectionHandleIndex === 0) === (this.hiddenInput.selectionStart < this.hiddenInput.selectionEnd)) {
					// if ((this.draggingSelectionHandleIndex === 0) === (this.hiddenInput.selectionStart > this.hiddenInput.selectionEnd)) {
					// if (this.hiddenInput.selectionStart < this.hiddenInput.selectionEnd) {
					if (caretIndex != newIndex) {
						anchorIndex = newIndex;
					}
				} else {
					if (anchorIndex != newIndex) {
						caretIndex = newIndex;
					}
				}
				setSelection();
			} else {
				this.positionHiddenInput(event);
			}
			this.updateVisuals();
		};
		// const onPointerDown = (event) => {
		// 	// event.preventDefault();
		// 	// this.hiddenInput.focus({ preventScroll: true });
		// 	this.positionHiddenInput(event);
		// 	// this.hiddenInput.setPointerCapture(event.pointerId);

		// 	// I'm potentially replacing a lot of this behavior with native selection handling

		// 	// caretIndex = getTextIndex(event);
		// 	// if (!event.shiftKey) {
		// 	// 	anchorIndex = caretIndex;
		// 	// }

		// 	// setSelection();
		// 	// this.updateVisuals();
		// 	const onPointerUp = (event) => {
		// 		console.log(event.type);
		// 		// event.preventDefault();
		// 		window.removeEventListener("pointermove", onPointerMove);
		// 		window.removeEventListener("dragover", onPointerMove);
		// 		window.removeEventListener("pointerup", onPointerUp);
		// 	};
		// 	window.addEventListener("pointermove", onPointerMove);
		// 	window.addEventListener("dragover", onPointerMove);
		// 	window.addEventListener("pointerup", onPointerUp);
		// 	window.addEventListener("pointercancel", onPointerUp);
		// };

		// this.pathElement.addEventListener("pointerdown", onPointerDown);
		// this.hiddenInput.addEventListener("pointerdown", onPointerDown);

		this.usingTouch = false;
		const onPointerDown = (event) => {
			this.draggingFromPath = true;
			this.usingTouch = event.pointerType === "touch";
			this.positionHiddenInput(event);
		};
		const onPointerUp = (event) => {
			this.draggingFromPath = false;
			this.draggingSelectionHandle = false;
			this.draggingSelectionHandleIndex = -1;
		};
		this.pathElement.addEventListener("pointerdown", onPointerDown);
		this.hiddenInput.addEventListener("pointerdown", onPointerDown);
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerUp);
		window.addEventListener("pointermove", onPointerMove);
		window.addEventListener("dragover", onPointerMove);

		const onHandlePointerDown = (event) => {
			event.preventDefault();
			this.draggingSelectionHandle = true;
			this.draggingSelectionHandleIndex = this.selectionHandles.indexOf(event.currentTarget);
		};
		for (const handle of this.selectionHandles) {
			handle.addEventListener("pointerdown", onHandlePointerDown);
		}

		this.hiddenInput.addEventListener("focus", (event) => {
			this.updateVisuals();
			this.startCursorBlink();
		});
		this.hiddenInput.addEventListener("blur", (event) => {
			this.hideCursor();
			this.updateVisuals();
		});

		this.hiddenInput.addEventListener("input", (event) => {
			this.textPathElement.textContent = this.hiddenInput.value;
			this.expandIfNeededHook?.();
			this.startCursorBlink();
			this.updateVisuals();
		});

		this.hiddenInput.addEventListener("selectionchange", (event) => {
			this.startCursorBlink();
			this.updateVisuals();
			anchorIndex = this.hiddenInput.selectionDirection === "backward" ? this.hiddenInput.selectionEnd ?? -1 : this.hiddenInput.selectionStart ?? -1;
			caretIndex = this.hiddenInput.selectionDirection === "backward" ? this.hiddenInput.selectionStart ?? -1 : this.hiddenInput.selectionEnd ?? -1;
		});

		// Why?
		this.hiddenInput.addEventListener("keyup", (event) => this.updateVisuals());
		// Why?
		this.hiddenInput.addEventListener("mouseup", (event) => this.updateVisuals());
	}

	getTextIndex(event) {
		let closestIndex = 0;
		let closestDist = Infinity;
		for (let i = 0; i <= this.textPathElement.textContent.length; i++) {
			// getSubStringLength can throw IndexSizeError if args are 0, 0
			const len = i > 0 ? this.textPathElement.getSubStringLength(0, i) : 0;
			const pt = this.pathElement.getPointAtLength(len);
			const point = this.toSVGSpace(event);
			const dx = pt.x - point.x;
			const dy = pt.y - point.y;
			const dist = Math.sqrt(dx * dx + dy * dy);
			if (dist < closestDist) {
				closestDist = dist;
				closestIndex = i;
			}
		}
		return closestIndex;
	}

	positionHiddenInput(event) {
		const point = this.toSVGSpace(event);
		// Hide the input when pointer not interacting with or hovering over visual text field,
		// so that you can click other things on the page.
		// TODO: handle overlapped CurvedTextFields (ensure z-index of native inputs matches z-index of visual text fields)
		if (!this.draggingFromPath && !this.draggingSelectionHandle && !this.pathElement.isPointInStroke(point)) {
			// will this cause scrolling problems?
			this.hiddenInput.style.left = `-9999px`;
			this.hiddenInput.style.top = `-9999px`;
			return;
		}
		const paddingLeft = parseFloat(getComputedStyle(this.hiddenInput).paddingLeft || "0");
		const paddingTop = parseFloat(getComputedStyle(this.hiddenInput).paddingTop || "0");
		const caretIndex = this.getTextIndex(event);
		this.hiddenMeasurementElement.textContent = this.hiddenInput.value.slice(0, caretIndex);
		const rect = this.hiddenMeasurementElement.getBoundingClientRect();
		const offsetX = rect.width + paddingLeft;
		const offsetY = rect.height / 2 + paddingTop;
		this.hiddenInput.style.left = `${event.clientX - offsetX}px`;
		this.hiddenInput.style.top = `${event.clientY - offsetY}px`;

		// make input wide enough so it never scrolls
		// TODO: make sure this doesn't expand indefinitely
		// (we could use the hiddenMeasurementElement for this as well, but with full text)
		this.hiddenInput.style.width = `${this.hiddenInput.scrollWidth + 50}px`;

		this.hiddenInput.style.transformOrigin = `${offsetX}px ${offsetY}px`;
		const hideHandles = true;
		if (hideHandles) {
			// `line-height` can push the selection handles off screen, but not the caret handle
			// `transform: scaleY` can push both off screen
			// A caveat to either approach is that it can cause the page to scroll
			// TODO: non-arbitrary scaling factor (something like "screen size / hiddenInput height"... or maybe "offsetY / hiddenInput height")
			// TODO: try rotate(180deg) to place handles offscreen ABOVE to hopefully prevent scrolling (in some cases, not universally) depending on how it works
			this.hiddenInput.style.transform = `scaleY(30)`;
		} else {
			// rotate the input so that mobile browsers show selection start/end handles
			// at least INITIALLY in the correct places; unfortunately we can't get
			// the pointer position while dragging the handles, but this at least approximates
			// the desired behavior locally.
			this.hiddenInput.style.transform = `rotate(${this.textPathElement.getRotationOfChar(caretIndex)}deg)`;
		}
	}

	toSVGSpace(event) {
		const svg = this.element.ownerSVGElement;
		let point = svg.createSVGPoint();
		point.x = event.clientX;
		point.y = event.clientY;
		return point.matrixTransform(svg.getScreenCTM().inverse());
	}

	startCursorBlink() {
		clearTimeout(this.cursorBlinkTimerId);
		this.caret.style.opacity = "1";
		const blink = () => {
			this.caret.style.opacity = this.caret.style.opacity === "1" ? "0" : "1";
			this.cursorBlinkTimerId = setTimeout(blink, this.cursorBlinkInterval);
		};
		this.cursorBlinkTimerId = setTimeout(blink, this.cursorBlinkInterval);
	}

	hideCursor() {
		clearTimeout(this.cursorBlinkTimerId);
		this.caret.style.opacity = "0";
	}

	/** Update caret + selection */
	updateVisuals() {
		// FIXME: inaccuracy in Chrome accumulates around curves
		// getEndPositionOfChar()/getStartPositionOfChar() are more accurate,
		// but don't work with ligatures (e.g. "ff" can be rendered as one glyph, and it
		// will return the same position for both indices)
		// and they don't naturally work with the selection rendering approach used here.
		// Worst case scenario, we might need something like a binary search to find path lengths
		// that correspond to character boundaries. And the path is non-linear,
		// so we can't assume that a measured position being closer means the index is closer.

		const text = this.textPathElement;
		const path = this.pathElement;

		const start = this.hiddenInput.selectionStart ?? 0;
		const end = this.hiddenInput.selectionEnd ?? start;
		const focused = document.activeElement === this.hiddenInput;

		const getRotationAtLength = (path, length) => {
			const epsilon = 0.01;
			const pointSlightlyBefore = path.getPointAtLength(Math.max(0, length - epsilon));
			const pointSlightlyAfter = path.getPointAtLength(length + epsilon);

			return Math.atan2(pointSlightlyAfter.y - pointSlightlyBefore.y, pointSlightlyAfter.x - pointSlightlyBefore.x);
		};

		// ---- CARET ----
		if (start === end && focused) {
			// getSubStringLength can throw IndexSizeError if args are 0, 0
			const len = start > 0 ? text.getSubStringLength(0, start) : 0;
			const point = path.getPointAtLength(len);
			const angle = getRotationAtLength(path, len);
			const caretHeight = this.fontSize;

			const dx = Math.sin(angle) * caretHeight / 2;
			const dy = -Math.cos(angle) * caretHeight / 2;

			this.caret.setAttribute("x1", point.x - dx);
			this.caret.setAttribute("y1", point.y - dy);
			this.caret.setAttribute("x2", point.x + dx);
			this.caret.setAttribute("y2", point.y + dy);
			this.caret.setAttribute("visibility", "visible");
		} else {
			this.caret.setAttribute("visibility", "hidden");
		}

		// ---- SELECTION ----
		if (start !== end && focused) {
			const fromLen = text.getSubStringLength(0, start);
			const toLen = text.getSubStringLength(0, end);

			this.selectionPath.setAttribute("d", this.pathElement.getAttribute("d"));
			this.selectionPath.setAttribute("stroke-dasharray", `0 ${fromLen} ${toLen - fromLen} ${this.pathElement.getTotalLength()}`);
			this.selectionPath.setAttribute("visibility", "visible");
		} else {
			this.selectionPath.setAttribute("visibility", "hidden");
		}

		// ---- SELECTION HANDLES (TOUCH) ----
		if (start !== end && focused && this.usingTouch) {
			const screenCTM = this.element.ownerSVGElement.getScreenCTM();

			for (let i = 0; i < this.selectionHandles.length; i++) {
				const handle = this.selectionHandles[i];

				const pathOffset = text.getSubStringLength(0, i === 0 ? start : end);
				const point = path.getPointAtLength(pathOffset).matrixTransform(screenCTM);
				const angle = getRotationAtLength(path, pathOffset);

				const svgScaleFactor = screenCTM.a;
				const handleY = parseFloat(this.selectionPath.getAttribute("stroke-width")) / 2 * svgScaleFactor;
				const scaleX = i === 0 ? -1 : 1;

				handle.style.left = `${point.x}px`;
				handle.style.top = `${point.y}px`;
				handle.style.transform = `rotate(${angle * 180 / Math.PI}deg) scaleX(${scaleX}) translateY(${handleY}px)`;

				if (!handle.parentElement) {
					document.body.append(handle);
				}
			}
		} else {
			for (const handle of this.selectionHandles) {
				if (handle.parentElement) {
					handle.parentElement.removeChild(handle);
				}
			}
		}
	}

	/** 
	 * @param {string} pathData SVG path data
	 * @param {number} [cutOffEndLength] visually clips the end of the path while allowing text to flow to the end
	 */
	setPathData(pathData, cutOffEndLength = 0) {
		this.pathElement.setAttribute("d", pathData);

		if (cutOffEndLength > 0) {
			this.pathElement.setAttribute("stroke-dasharray", `${this.pathElement.getTotalLength() - cutOffEndLength} ${cutOffEndLength + 9001}`);
		} else {
			this.pathElement.removeAttribute("stroke-dasharray");
		}
	}
}
