import { CurvedTextField } from "./curved-text-field.js";
import { html, svg } from "./helpers.js";

/**
 * @typedef {{x: number, y: number}} Point
 */

export class GrypeItem {
	/** @type {Grype} */
	grype;
	/** @type {Point[]} */
	gridPositions = [];
	/** @type {SVGGElement} */
	element;
	/** @param {Grype} grype */
	constructor(grype) {
		this.grype = grype;
		this.element = svg("g");
	}
}

class GrypeTextItem extends GrypeItem {
	/** @type {string} */
	id;
	/** @type {CurvedTextField} */
	curvedTextField;

	/** @param {Grype} grype */
	constructor(grype) {
		super(grype);
		this.curvedTextField = new CurvedTextField();
		this.element.append(this.curvedTextField.element);
		// This is a bit ugly, and registering a second "input" event might work,
		// but I don't want to mess with the execution order while I'm extracting this class.
		this.curvedTextField.expandIfNeededHook = this.expandIfNeeded.bind(this);
	}

	expandIfNeeded() {
		let textLength = this.curvedTextField.textPathElement.getComputedTextLength();
		let pathLength = this.curvedTextField.pathElement.getTotalLength();
		// TODO: safety limit?
		while (textLength > pathLength - this.extraSegmentLength) {
			// extend path by adding an extra grid cell, turning if needed
			const lastPos = this.gridPositions[this.gridPositions.length - 1];
			let secondLastPos = this.gridPositions[this.gridPositions.length - 2];
			let newPos;
			if (this.gridPositions.length === 1) {
				// extend to the right since the default direction is left to right
				newPos = { x: lastPos.x + 1, y: lastPos.y };
				secondLastPos = { x: lastPos.x - 1, y: lastPos.y };
			} else {
				const dx = lastPos.x - secondLastPos.x;
				const dy = lastPos.y - secondLastPos.y;
				newPos = { x: lastPos.x + dx, y: lastPos.y + dy };
			}
			if (this.grype.grid[this.grype.gridKey(newPos)]) {
				// collision - try turning CCW
				const dx = lastPos.x - secondLastPos.x;
				const dy = lastPos.y - secondLastPos.y;
				newPos = { x: lastPos.x - dy, y: lastPos.y + dx };
			}
			if (this.grype.grid[this.grype.gridKey(newPos)]) {
				// collision - try turning CW
				const dx = lastPos.x - secondLastPos.x;
				const dy = lastPos.y - secondLastPos.y;
				newPos = { x: lastPos.x + dy, y: lastPos.y - dx };
			}
			if (this.grype.grid[this.grype.gridKey(newPos)]) {
				// can't expand
				// TODO: prevent (undo) typing or at least notify user
				console.log("Cannot expand path further - no free adjacent grid cells");
				break;
			}
			if (Math.abs(newPos.x - lastPos.x) + Math.abs(newPos.y - lastPos.y) < 1) {
				// safety check, in case multiple of the same position was added
				// as has happened when grid occupancy was not working during development
				break;
			}
			this.gridPositions.push(newPos);
			this.grype.updateGridOccupancy(this);
			this.updatePath(this.grype.cellSize);
			textLength = this.curvedTextField.textPathElement.getComputedTextLength();
			pathLength = this.curvedTextField.pathElement.getTotalLength();
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

		this.curvedTextField.setPathData(d, this.extraSegmentLength);
	}
}

class GrypeImageItem extends GrypeItem {
	/** @type {{x: number, y: number, width: number, height: number}} */
	gridRegion;
	/** @type {SVGImageElement} */
	imageElement;

	/** @param {Grype} grype */
	constructor(grype) {
		super(grype);
		this.imageElement = svg("image");
		this.element.append(this.imageElement);
		this.onPointerDown = this.onPointerDown.bind(this);
		this.onPointerMove = this.onPointerMove.bind(this);
		this.onPointerUp = this.onPointerUp.bind(this);
		this.onPointerCancel = this.onPointerCancel.bind(this);
		this.element.addEventListener("pointerdown", this.onPointerDown);
		// Allow getter to work. Fields take precedence over getters.
		// https://stackoverflow.com/a/77093264
		delete this.gridPositions;
	}

	/** @param {string} url */
	setImageURL(url) {
		this.imageElement.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
	}

	updatePosition() {
		this.imageElement.setAttribute("width", `${this.gridRegion.width * this.grype.cellSize.x}`);
		this.imageElement.setAttribute("height", `${this.gridRegion.height * this.grype.cellSize.y}`);
		this.imageElement.setAttribute("x", `${this.gridRegion.x * this.grype.cellSize.x}`);
		this.imageElement.setAttribute("y", `${this.gridRegion.y * this.grype.cellSize.y}`);
	}

	get gridPositions() {
		const { x, y, width, height } = this.gridRegion;
		let positions = [];
		for (let iy = 0; iy < height; iy++) {
			for (let ix = 0; ix < width; ix++) {
				positions.push({ x: x + ix, y: y + iy });
			}
		}
		return positions;
	}

	onPointerDown(event) {
		event.preventDefault();
		this.element.setPointerCapture(event.pointerId);
		this.gestureStartPos = this.grype.toSVGSpace(event);
		this.gestureStartGridRegion = { ...this.gridRegion };

		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerCancel);
	}
	onPointerMove(event) {
		event.preventDefault();
		const currentPos = this.grype.toSVGSpace(event);
		// TODO: collision detection
		// TODO: the offset rounding doesn't feel quite right
		const dx = currentPos.x - this.gestureStartPos.x;
		const dy = currentPos.y - this.gestureStartPos.y;
		this.gridRegion.x = Math.round(this.gestureStartGridRegion.x + dx / this.grype.cellSize.x);
		this.gridRegion.y = Math.round(this.gestureStartGridRegion.y + dy / this.grype.cellSize.y);
		this.updatePosition();
		this.grype.updateGridOccupancy(this);
	}
	onPointerUp(event) {
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerCancel);
	}
	onPointerCancel(event) {
		this.onPointerUp(event);
		this.gridRegion = { ...this.gestureStartGridRegion };
		this.updatePosition();
		this.grype.updateGridOccupancy(this);
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
		this.item = new GrypeTextItem(this.grype);
		this.item.gridPositions.push(gridPos);
		this.grype.svg.append(this.item.element);
		this.grype.updateGridOccupancy(this.item);
		this.item.updatePath(this.grype.cellSize);
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
		this.grype.updateGridOccupancy(this.item);
		this.item.updatePath(this.grype.cellSize);
		this.item.curvedTextField.updateVisuals();
	}
	finish() {
		this.item.curvedTextField.hiddenInput.focus({ preventScroll: true });
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
		this.gridKeysByItem = new Map();
		this.svg = svg("svg", {
			width: "100%",
			height: "100%",
			viewBox: "0 0 100 100",
		});
		this.element = html("div", {
			style: "background: rgb(216, 216, 216); touch-action: none;",
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
		this.onPaste = this.onPaste.bind(this);

		this.svg.addEventListener("pointerdown", this.onPointerDown);
		window.addEventListener("paste", this.onPaste);
	}
	toSVGSpace(event) {
		let point = this.svg.createSVGPoint();
		point.x = event.clientX;
		point.y = event.clientY;
		return point.matrixTransform(this.svg.getScreenCTM().inverse());
	}
	gridPosNonInteger(event) {
		const { x, y } = this.toSVGSpace(event);
		return { x: x / this.cellSize.x, y: y / this.cellSize.y };
	}
	gridPos(event) {
		const { x, y } = this.gridPosNonInteger(event);
		return { x: Math.floor(x), y: Math.floor(y) };
	}
	gridKey(pos) {
		return `${pos.x},${pos.y}`;
	}
	/** @param {GrypeItem} item */
	updateGridOccupancy(item) {
		for (const key of this.gridKeysByItem.get(item) ?? []) {
			delete this.grid[key];
		}
		const newGridKeys = item.gridPositions.map(this.gridKey);
		for (const key of newGridKeys) {
			this.grid[key] = item;
		}
		this.gridKeysByItem.set(item, newGridKeys);
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
	onPaste(event) {
		const file = event.clipboardData.files[0];
		if (file && file.type.startsWith("image/")) {
			event.preventDefault(); // don't paste file path
			const reader = new FileReader();
			reader.onload = (loadEvent) => {
				const img = new Image();
				img.onload = () => {
					// const tool = this.tools.addImageItem;
					// console.log(event.clientX, event.clientY); nope, undefined, have to track it separately
					const gridPos = { x: 0, y: 0 }; // TODO: cursor position
					// TODO: try multiple placements
					const key = this.gridKey(gridPos);
					if (this.grid[key]) return;
					const item = new GrypeImageItem(this);
					item.gridRegion = {
						x: gridPos.x,
						y: gridPos.y,
						width: 1,
						height: 1,
						// TODO: calculate based on image size with max dimensions, preserving aspect ratio
						// width: Math.ceil(img.width / this.cellSize.x),
						// height: Math.ceil(img.height / this.cellSize.y),
					};
					item.setImageURL(loadEvent.target.result);
					item.updatePosition();
					this.svg.append(item.element);
					this.updateGridOccupancy(item);
				};
				img.src = loadEvent.target.result;
			};
			reader.readAsDataURL(file);
		}
	}
};
