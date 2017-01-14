/// <reference path="Vector.ts" />

class Thing {
	angle: number;
	position: Vector;
	type: number;
	flags: { [flag: string]: boolean; } = {};
	
	// Hexen. Start height of the thing is stored in the position
	id: number;
	special: number;
	arguments: number[];
	
	constructor() {
		this.position = new Vector(0, 0);
		this.type = 0;
		this.angle = 0;
		this.arguments = [ 0, 0, 0, 0, 0];
	}
}