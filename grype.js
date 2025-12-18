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
	/** @type {HTMLTextAreaElement} */
	hiddenTextarea;

	/** @type {SVGLineElement} */
	caret;
	/** @type {SVGPathElement} */
	selectionPath;

	pathThickness = 9;
	fontSize = 5;

	constructor() {
		this.id = `grype-path-${crypto.randomUUID()}`;

		this.element = svg("g");

		this.pathElement = svg("path", {
			id: this.id,
			stroke: "rgba(128,128,128,0.3)",
			"stroke-width": this.pathThickness,
			fill: "none"
		});

		this.textPathElement = svg("textPath", { href: `#${this.id}` });
		this.textElement = svg("text", {
			"font-size": this.fontSize,
			"dominant-baseline": "middle",
			fill: "black"
		});
		this.hiddenTextarea = html("textarea", {
			style: "position:absolute; left:-9999px; top:-9999px;"
		});

		this.textElement.append(this.textPathElement);
		this.element.append(this.textElement);
		this.element.append(this.pathElement);

		// caret
		this.caret = svg("line", {
			stroke: "black",
			"stroke-width": "0.5",
			visibility: "hidden"
		});
		this.element.append(this.caret);

		// selection highlight
		this.selectionPath = svg("path", {
			fill: "rgba(0,120,215,0.3)",
			stroke: "none",
			visibility: "hidden"
		});
		this.element.insertBefore(this.selectionPath, this.textElement);

		this.textPathElement.append("This is only a test");

		// TODO: proper place in DOM
		document.body.append(this.hiddenTextarea);

		this.pathElement.addEventListener("click", (e) => {
			this.hiddenTextarea.value = this.textPathElement.textContent || "";
			this.hiddenTextarea.focus();
			// TODO: set cursor position/selection according to mouse gestures
			this.hiddenTextarea.setSelectionRange(
				this.hiddenTextarea.value.length,
				this.hiddenTextarea.value.length
			);
			this.updateVisuals();
		});

		this.hiddenTextarea.addEventListener("input", (e) => {
			this.textPathElement.textContent = this.hiddenTextarea.value;
			this.updateVisuals();
		});

		this.hiddenTextarea.addEventListener("selectionchange", () => {
			this.updateVisuals();
		});

		// Why?
		this.hiddenTextarea.addEventListener("keyup", () => this.updateVisuals());
		// Why?
		this.hiddenTextarea.addEventListener("mouseup", () => this.updateVisuals());
	}

	/** Update caret + selection */
	updateVisuals() {
		// UNVETTED AI GENERATED CODE
		// FIXME: spaces aren't handled correctly
		const text = this.textPathElement;
		const path = this.pathElement;

		const start = this.hiddenTextarea.selectionStart ?? 0;
		const end = this.hiddenTextarea.selectionEnd ?? start;

		// ---- CARET ----
		if (start === end) {
			const len = text.getSubStringLength(0, start);
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
		if (start !== end) {
			const fromLen = text.getSubStringLength(0, start);
			const toLen = text.getSubStringLength(0, end);

			this.selectionPath.setAttribute(
				"d",
				this.buildSelectionPath(path, fromLen, toLen)
			);
			this.selectionPath.setAttribute("visibility", "visible");
		} else {
			this.selectionPath.setAttribute("visibility", "hidden");
		}
	}

	buildSelectionPath(path, from, to) {
		// UNVETTED AI GENERATED CODE
		const steps = Math.max(2, Math.ceil((to - from) / 2));
		const half = this.fontSize / 2;

		const top = [];
		const bottom = [];

		for (let i = 0; i <= steps; i++) {
			const t = from + (to - from) * (i / steps);
			const pt = path.getPointAtLength(t);

			const eps = 0.01;
			const p1 = path.getPointAtLength(Math.max(0, t - eps));
			const p2 = path.getPointAtLength(t + eps);
			const a = Math.atan2(p2.y - p1.y, p2.x - p1.x);

			const nx = Math.sin(a) * half;
			const ny = -Math.cos(a) * half;

			top.push([pt.x + nx, pt.y + ny]);
			bottom.push([pt.x - nx, pt.y - ny]);
		}

		let d = `M ${top[0][0]} ${top[0][1]}`;
		for (let i = 1; i < top.length; i++) d += ` L ${top[i][0]} ${top[i][1]}`;
		for (let i = bottom.length - 1; i >= 0; i--)
			d += ` L ${bottom[i][0]} ${bottom[i][1]}`;
		return d + " Z";
	}

	updatePath(cellSize) {
		let d = "";
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
		}
		this.pathElement.setAttribute("d", d);
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
		this.item.hiddenTextarea.focus();
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
			// xmlns: "http://www.w3.org/2000/svg",
			// "xmlns:xlink": "http://www.w3.org/1999/xlink",
		});
		this.element = html("div");
		this.element.append(this.svg);

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
