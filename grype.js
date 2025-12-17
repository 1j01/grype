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

		/* @type {GrypeTextItem | null} */
		this.creating = null;

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
		const key = this.gridKey(pos);
		if (this.grid[key]) return;
		if (this.creating) {
			console.log("Shouldn't happen - mouse stuck?");
			return;
		}
		const id = `grype-path-${crypto.randomUUID()}`;
		this.creating = {
			gridPositions: [pos],
			pathElement: E("path", { id, stroke: "black", fill: "none" }),
			textPathElement: E("textPath", { href: `#${id}` }),
			textElement: E("text", { "font-size": "2" })
		};
		this.creating.textElement.append(this.creating.textPathElement);
		this.svg.append(this.creating.textElement);
		this.svg.append(this.creating.pathElement);
		this.creating.textPathElement.append("This is only a test");

		this.grid[key] = this.creating;
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerCancel);
	}
	onPointerMove(event) {
		const pos = this.gridPos(event);
		const key = this.gridKey(pos);
		if (this.grid[key]) return;
		// TODO: pathfind, adding intermediate points
		// don't create intersections
		this.creating.gridPositions.push(pos);
		this.grid[key] = this.creating;
		this.updatePath(this.creating);
	}
	onPointerUp(event) {
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerCancel);
		this.creating = null;
	}
	onPointerCancel(event) {
		// TODO: delete the item this.creating
		this.onPointerUp(event);
	}
	updatePath(item) {
		const d = item.gridPositions
			.map((pos, i) => {
				if (i === 0) return `M${pos.x * this.cellSize.x},${pos.y * this.cellSize.y}`;
				return `L${pos.x * this.cellSize.x},${pos.y * this.cellSize.y}`;
			})
			.join(" ");
		item.pathElement.setAttribute("d", d);
	}
};
