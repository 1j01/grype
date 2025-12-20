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
		this.hiddenInput = html("input", {
			style: "position:absolute; left:-9999px; top:-9999px;"
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

		let anchorIndex = -1;
		let caretIndex = -1;
		const setSelection = () => {
			this.hiddenInput.setSelectionRange(
				Math.min(anchorIndex, caretIndex),
				Math.max(anchorIndex, caretIndex),
				caretIndex < anchorIndex ? "backward" : "forward"
			);
		};
		const getTextIndex = (event) => {
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
		};
		this.pathElement.addEventListener("pointerdown", (event) => {
			event.preventDefault();
			this.hiddenInput.focus({ preventScroll: true });
			caretIndex = getTextIndex(event);
			if (!event.shiftKey) {
				anchorIndex = caretIndex;
			}
			setSelection();
			this.updateVisuals();
			const onPointerMove = (event) => {
				event.preventDefault();
				caretIndex = getTextIndex(event);
				setSelection();
				this.updateVisuals();
			};
			const onPointerUp = (event) => {
				event.preventDefault();
				window.removeEventListener("pointermove", onPointerMove);
				window.removeEventListener("pointerup", onPointerUp);
			};
			window.addEventListener("pointermove", onPointerMove);
			window.addEventListener("pointerup", onPointerUp);
			window.addEventListener("pointercancel", onPointerUp);
		});


		this.hiddenInput.addEventListener("focus", (event) => {
			this.hiddenInput.value = this.textPathElement.textContent || "";
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

		// ---- CARET ----
		if (start === end && focused) {
			// getSubStringLength can throw IndexSizeError if args are 0, 0
			const len = start > 0 ? text.getSubStringLength(0, start) : 0;
			const point = path.getPointAtLength(len);

			const epsilon = 0.01;
			const pointSlightlyBefore = path.getPointAtLength(Math.max(0, len - epsilon));
			const pointSlightlyAfter = path.getPointAtLength(len + epsilon);

			const angle = Math.atan2(pointSlightlyAfter.y - pointSlightlyBefore.y, pointSlightlyAfter.x - pointSlightlyBefore.x);
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
