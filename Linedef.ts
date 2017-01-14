/// <reference path="Sidedef.ts" />
/// <reference path="Vertex.ts" />

class Linedef {
	start: Vertex;
	end: Vertex;
	startVertexID: number;
	endVertexID: number;
	flags: { [flag: string]: boolean; };
	special: number;
	tag: number;
	frontSidedefID: number;
	backSidedefID: number;
	front: Sidedef;
	back: Sidedef;
	index: number;
	
	// Hexen
	arguments: number[];
	
	constructor() {
		this.flags = {};
		this.start = null;
		this.end = null;
		this.front = null;
		this.back = null;
		this.arguments = [ 0, 0, 0, 0, 0]
		this.index = -1;
	}
}