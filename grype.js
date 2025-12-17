export class Grype {
	constructor() {
		this.gridSize = { x: 10, y: 10 };
		this.cellSize = { x: 10, y: 10 };
		this.grid = {};
		this.element = this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		this.svg.setAttribute("width", "100%");
		this.svg.setAttribute("height", "100%");
		this.svg.setAttribute("viewBox", "0 0 100 100");

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
		if (this.grid[this.gridKey(this.gridPos(event))]) return;
		// placeholder code
		const pos = this.gridPos(event);
		this.creating = pos;
		this.grid[this.gridKey(pos)] = true;
		const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		rect.setAttribute("x", pos.x * this.cellSize.x);
		rect.setAttribute("y", pos.y * this.cellSize.y);
		rect.setAttribute("width", this.cellSize.x);
		rect.setAttribute("height", this.cellSize.y);
		this.element.appendChild(rect);
	}
}
