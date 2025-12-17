/**
 * @typedef {{x: number, y: number}} Point
 */

/** 
 * @template {keyof SVGElementTagNameMap} K
 * @param {K} tagName
 * @param {Object<string, string>} [attrs]
 * @returns {SVGElementTagNameMap[K]}
 */
const E = (tagName, attrs = {}) => {
	const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
	for (const [key, value] of Object.entries(attrs)) {
		element.setAttribute(key, value);
	}
	return element;
};

class GrypeTextItem {
	/**
	 * @type {Point[]}
	 */
	gridPositions = [];

	/**
	 * @type {SVGGElement}
	 */
	element;

	/**
	 * @type {SVGPathElement}
	 */
	pathElement;

	/**
	 * @type {SVGTextPathElement}
	 */
	textPathElement;

	/**
	 * @type {SVGTextElement}
	 */
	textElement;


	constructor() {
		this.id = `grype-path-${crypto.randomUUID()}`;
		this.element = E("g");
		this.pathElement = E("path", { id: this.id, stroke: "black", fill: "none" });
		this.textPathElement = E("textPath", { href: `#${this.id}` });
		this.textElement = E("text", { "font-size": "2" });

		this.textElement.append(this.textPathElement);
		this.element.append(this.textElement);
		this.element.append(this.pathElement);
		this.textPathElement.append("This is only a test");
	}

	/** @param {Point} cellSize */
	updatePath(cellSize) {
		let d = "";
		// TODO: turn corners smoothly
		// TODO: offset start and end to borders, prefering left-to-right for a single cell
		this.gridPositions.forEach((pos, index) => {
			const centerX = pos.x * cellSize.x + cellSize.x / 2;
			const centerY = pos.y * cellSize.y + cellSize.y / 2;
			if (index === 0) {
				d += `M ${centerX} ${centerY} `;
			} else {
				d += `L ${centerX} ${centerY} `;
			}
		});
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
		this.element = this.svg = E("svg", {
			width: "100%",
			height: "100%",
			viewBox: "0 0 100 100",
			// xmlns: "http://www.w3.org/2000/svg",
			// "xmlns:xlink": "http://www.w3.org/1999/xlink",
		});

		this.dotsGroup = E("g");
		this.svg.append(this.dotsGroup);
		for (let y = 1; y < this.gridSize.y; y++) {
			for (let x = 1; x < this.gridSize.x; x++) {
				const dot = E("circle", {
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
		const pos = this.gridPos(event);
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
