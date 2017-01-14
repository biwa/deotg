/// <reference path="Linedef.ts" />
/// <reference path="Sector.ts" />
/// <reference path="Sidedef.ts" />
/// <reference path="Thing.ts" />
/// <reference path="Vertex.ts" />

enum MapType {
	None,
	Doom,
	Hexen,
	UDMF
}

class MapSet {
	linedefs: Linedef[];
	sectors: Sector[];
	sidedefs: Sidedef[];
	things: Thing[];
	vertices: Vertex[];
	
	constructor() {
		this.linedefs = [];
		this.sectors = [];
		this.sidedefs = [];
		this.things = [];
		this.vertices = [];
	}
	
	public centerMap() {
		var maxx = this.vertices[0].position.x;
		var maxy = this.vertices[0].position.y;
		var minx = maxx;
		var miny = maxy;
	
		for(var i=0; i < this.vertices.length; i++) {
			var v = this.vertices[i];
			
			if(v.position.x > maxx) maxx = v.position.x;
			if(v.position.x < minx) minx = v.position.x;
			
			if(v.position.y > maxy) maxy = v.position.y;
			if(v.position.y < miny) miny = v.position.y;
		}
		
		DEOTG.renderer2d.zoomToArea(new Vector(minx, maxy), new Vector(maxx, miny), 100);
		DEOTG.currentMode.onRedraw();		
	}
}