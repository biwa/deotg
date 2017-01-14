/// <reference path="Linedef.ts" />
/// <reference path="Vector.ts" />

class Vertex {
	linedefs: Linedef[];
	
	constructor(public position: Vector) {
		this.linedefs = [];
	}
}