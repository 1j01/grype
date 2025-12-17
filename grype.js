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

class GrypeItem {
	/** @type {SVGGElement} */
	element;
	constructor() {
		this.element = E("g");
	}
	/** @returns {Point[]} */
	getGridPositions() {
		return [];
	}
}

class GrypeWindingItem extends GrypeItem {
	/** @type {Point[]} */
	gridPositions = [];
	/** @type {SVGPathElement} */
	pathElement = E("path");
	constructor() {
		super();
		this.element.append(this.pathElement);
	}
	getGridPositions() {
		return this.gridPositions;
	}
}

class GrypeRectangularItem extends GrypeItem {
	constructor() {
		super();
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}
	getGridPositions() {
		/** @type {Point[]} */
		const positions = [];
		for (let y = this.y; y < this.y + this.height; y++) {
			for (let x = this.x; x < this.x + this.width; x++) {
				positions.push({ x, y });
			}
		}
		return positions;
	}
}

class GrypeImageItem extends GrypeRectangularItem {
	constructor() {
		super();
		this.imageElement = E("image");
		this.element.append(this.imageElement);
	}
}

class GrypeTextItem extends GrypeWindingItem {
	constructor() {
		super();
		this.textPathElement = E("textPath");
		this.element.append(this.textPathElement);
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
			viewBox: "0 0 100 100"
		});
		this.creating = null;
		this.svg.addEventListener("pointerdown", this.onPointerDown.bind(this));
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
		const key = this.gridKey(pos);
		if (this.grid[key]) return;
		// placeholder code
		this.creating = pos;
		this.grid[key] = true;
		const rect = E("rect", {
			x: pos.x * this.cellSize.x,
			y: pos.y * this.cellSize.y,
			width: this.cellSize.x,
			height: this.cellSize.y
		});
		this.element.append(rect);
	}
}
