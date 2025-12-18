import { html, svg } from "./helpers.js";

/**
 * @typedef {{x: number, y: number}} Point
 */

class GrypeTextItem {
	/** @type {Point[]} */
	gridPositions = [];

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
		this.id = `grype-path-${crypto.randomUUID()}`;

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
			const svg = this.element.ownerSVGElement;
			for (let i = 0; i <= this.textPathElement.textContent.length; i++) {
				const len = this.textPathElement.getSubStringLength(0, i);
				const pt = this.pathElement.getPointAtLength(len);
				let point = svg.createSVGPoint();
				point.x = event.clientX;
				point.y = event.clientY;
				point = point.matrixTransform(svg.getScreenCTM().inverse());
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
			this.hiddenInput.focus();
			anchorIndex = caretIndex = getTextIndex(event);
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
			this.expandIfNeeded();
			this.startCursorBlink();
			this.updateVisuals();
		});

		this.hiddenInput.addEventListener("selectionchange", (event) => {
			this.startCursorBlink();
			this.updateVisuals();
		});

		// Why?
		this.hiddenInput.addEventListener("keyup", (event) => this.updateVisuals());
		// Why?
		this.hiddenInput.addEventListener("mouseup", (event) => this.updateVisuals());
	}

	expandIfNeeded() {
		const textLength = this.textPathElement.getComputedTextLength();
		const pathLength = this.pathElement.getTotalLength();
		if (textLength > pathLength - this.extraSegmentLength) {
			// extend path by adding an extra grid cell, turning if needed
			const lastPos = this.gridPositions[this.gridPositions.length - 1];
			const secondLastPos = this.gridPositions[this.gridPositions.length - 2];
			let newPos;
			if (this.gridPositions.length === 1) {
				// extend to the right since the default direction is left to right
				newPos = { x: lastPos.x + 1, y: lastPos.y };
			} else {
				// TODO: collision detection
				// turn if needed, reject input if expansion is not possible
				const dx = lastPos.x - secondLastPos.x;
				const dy = lastPos.y - secondLastPos.y;
				newPos = { x: lastPos.x + dx, y: lastPos.y + dy };
			}
			this.gridPositions.push(newPos);
			// TODO: use metrics from Grype
			// TODO: add to Grype grid
			this.updatePath({ x: 10, y: 10 });
		}
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
		// UNVETTED AI GENERATED CODE
		const text = this.textPathElement;
		const path = this.pathElement;

		const start = this.hiddenInput.selectionStart ?? 0;
		const end = this.hiddenInput.selectionEnd ?? start;
		const focused = document.activeElement === this.hiddenInput;

		// ---- CARET ----
		if (start === end && focused) {
			// getSubStringLength can throw IndexSizeError if args are 0, 0
			const len = start > 0 ? text.getSubStringLength(0, start) : 0;
			const pt = path.getPointAtLength(len);

			const eps = 0.01;
			const p1 = path.getPointAtLength(Math.max(0, len - eps));
			const p2 = path.getPointAtLength(len + eps);

			const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
			const h = this.fontSize;

			const dx = Math.sin(angle) * h / 2;
			const dy = -Math.cos(angle) * h / 2;

			this.caret.setAttribute("x1", pt.x - dx);
			this.caret.setAttribute("y1", pt.y - dy);
			this.caret.setAttribute("x2", pt.x + dx);
			this.caret.setAttribute("y2", pt.y + dy);
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

	updatePath(cellSize) {
		let d = "";
		this.extraSegmentLength = 0;
		for (let index = 0; index < this.gridPositions.length; index++) {
			const pos = this.gridPositions[index];
			let nextPos = this.gridPositions[index + 1];
			let prevPos = this.gridPositions[index - 1];
			if (!nextPos && !prevPos) {
				// single grid cell: left to right orientation
				prevPos = { x: pos.x - 1, y: pos.y };
				nextPos = { x: pos.x + 1, y: pos.y };
			} else if (!nextPos) {
				// last grid cell: extrapolate
				nextPos = { x: pos.x + (pos.x - prevPos.x), y: pos.y + (pos.y - prevPos.y) };
			} else if (!prevPos) {
				// first grid cell: extrapolate
				prevPos = { x: pos.x + (pos.x - nextPos.x), y: pos.y + (pos.y - nextPos.y) };
			}

			const fromX = (pos.x + prevPos.x + 1) / 2 * cellSize.x;
			const fromY = (pos.y + prevPos.y + 1) / 2 * cellSize.y;
			const toX = (pos.x + nextPos.x + 1) / 2 * cellSize.x;
			const toY = (pos.y + nextPos.y + 1) / 2 * cellSize.y;
			const cpX = (pos.x + 0.5) * cellSize.x;
			const cpY = (pos.y + 0.5) * cellSize.y;

			if (index === 0) {
				d += `M ${fromX} ${fromY} `;
			}
			d += `Q ${cpX} ${cpY} ${toX} ${toY} `;
			if (index === this.gridPositions.length - 1) {
				// For expandIfNeeded, we need the path to be longer than the visible part
				// because text length measurement only counts rendered letters.
				// So we add a line at the end.
				const extraX = toX + (toX - fromX);
				const extraY = toY + (toY - fromY);
				d += `L ${extraX} ${extraY} `;
				this.extraSegmentLength = Math.hypot(extraX - toX, extraY - toY);
			}
		}

		this.pathElement.setAttribute("d", d);
		// Visually cut off the extra length added for expandIfNeeded
		this.pathElement.setAttribute("stroke-dasharray", `${this.pathElement.getTotalLength() - this.extraSegmentLength} ${this.extraSegmentLength + 9001}`);
	}
}

class GrypeTool {
	/** @type {Grype} */
	grype;
	/** @param {Grype} grype */
	constructor(grype) {
		this.grype = grype;
	}
	/** @param {Point} gridPos */
	gestureStart(gridPos) { }
	/** @param {Point} gridPos */
	gestureUpdate(gridPos) { }
	finish() { }
	cancel() { }
}

class GrypeAddTextItemTool extends GrypeTool {
	/** @type {GrypeTextItem | null} */
	item = null;
	/**
	 * @param {Point} gridPos
	 */
	gestureStart(gridPos) {
		const key = this.grype.gridKey(gridPos);
		if (this.grype.grid[key]) return;
		if (this.item) {
			console.log("Shouldn't happen - mouse stuck?");
			return;
		}
		this.item = new GrypeTextItem();
		this.item.gridPositions.push(gridPos);
		this.grype.svg.append(this.item.element);
		this.grype.grid[key] = this.item;
		this.item.updatePath(this.grype.cellSize);
		this.item.hiddenInput.focus();
	}
	/**
	 * @param {Point} gridPos
	 */
	gestureUpdate(gridPos) {
		if (!this.item) return;
		const key = this.grype.gridKey(gridPos);
		if (this.grype.grid[key]) return;
		// TODO: pathfind, adding intermediate points
		// don't create intersections
		this.item.gridPositions.push(gridPos);
		this.grype.grid[key] = this.item;
		this.item.updatePath(this.grype.cellSize);
		this.item.updateVisuals();
	}
	finish() {
		this.item = null;
	}
	cancel() {
		// TODO: delete the item
		this.item = null;
	}
}

export class Grype {
	constructor() {
		this.gridSize = { x: 10, y: 10 };
		this.cellSize = { x: 10, y: 10 };
		this.grid = {};
		this.svg = svg("svg", {
			width: "100%",
			height: "100%",
			viewBox: "0 0 100 100",
		});
		this.element = html("div", {
			style: "background: rgb(216, 216, 216)",
		});
		this.element.append(this.svg);

		this.defsElement = svg("defs");
		this.defsElement.innerHTML = `
		<filter id="simple-border" filterUnits="userSpaceOnUse">
			<feMorphology operator="dilate" in="SourceAlpha" radius="0.3" />
			<feComponentTransfer>
				<feFuncR type="table" tableValues="0" />
				<feFuncG type="table" tableValues="0" />
				<feFuncB type="table" tableValues="0" />
			</feComponentTransfer>
			<feComposite in="SourceGraphic" operator="over" />
		</filter>
		`;
		this.svg.append(this.defsElement);

		this.dotsGroup = svg("g");
		this.svg.append(this.dotsGroup);
		for (let y = 1; y < this.gridSize.y; y++) {
			for (let x = 1; x < this.gridSize.x; x++) {
				const dot = svg("circle", {
					cx: `${x * this.cellSize.x}`,
					cy: `${y * this.cellSize.y}`,
					r: "0.5",
					fill: "gray",
				});
				this.dotsGroup.append(dot);
			}
		}

		this.tools = {
			addTextItem: new GrypeAddTextItemTool(this),
		};

		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.onPointerCancel = this.onPointerCancel.bind(this);

		this.svg.addEventListener("pointerdown", this.onPointerDown);
	}
	gridPos(event) {
		let point = this.svg.createSVGPoint();
		point.x = event.clientX;
		point.y = event.clientY;
		point = point.matrixTransform(this.svg.getScreenCTM().inverse());
		const x = Math.floor(point.x / this.cellSize.x);
		const y = Math.floor(point.y / this.cellSize.y);
		return { x, y };
	}
	gridKey(pos) {
		return `${pos.x},${pos.y}`;
	}
	onPointerDown(event) {
		if (event.button !== 0) return;
		const pos = this.gridPos(event);
		if (this.gridKey(pos) in this.grid) {
			// allow text selection on existing items...
			// or focus at least
			return;
		}
		event.preventDefault();
		try {
			window.getSelection().removeAllRanges();
		} catch (e) {
			console.error("removeAllRanges failed:", e);
		}
		try {
			event.target.setPointerCapture(event.pointerId);
		} catch (e) {
			console.error("setPointerCapture failed:", e);
		}
		this.tools.addTextItem.gestureStart(pos);
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerCancel);
	}
	onPointerMove(event) {
		const pos = this.gridPos(event);
		this.tools.addTextItem.gestureUpdate(pos);
	}
	onPointerUp(event) {
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerCancel);
		this.tools.addTextItem.finish();
	}
	onPointerCancel(event) {
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerCancel);
		this.tools.addTextItem.cancel();
	}
};
