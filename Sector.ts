/// <reference path="Sidedef.ts" />
/// <reference path="poly2tri.d.ts" />

class Polygon {
	points: Vector[];
	
	constructor(points: Vertex[]) {
		this.points = [];
		
		for(var i=0; i < points.length; i++) {
			this.points.push(new Vector(points[i].position.x, points[i].position.y));
		}
	}
	
	public pointInside(point: Vector): boolean {
		var c = false;
		for(var i=0, j=this.points.length-1; i < this.points.length; j = i++) {
			if(((this.points[i].y>point.y) != (this.points[j].y>point.y)) &&
				(point.x < (this.points[j].x-this.points[i].x) * (point.y-this.points[i].y) / (this.points[j].y-this.points[i].y) + this.points[i].x)) {
					c = !c;
				}
		}
		
		return c;
	}
	
	public isClockwise() {
		var sum = 0;
		
		for(var i=0, j=this.points.length-1; i < this.points.length; j = i++) {
			sum += (this.points[i].x - this.points[j].x) * (this.points[i].y + this.points[j].y); 
		}
		
		if(sum < 0)
			return false;
			
		return true;
	}
	
	public makeClockwise() {
		if(!this.isClockwise()) {
			this.points.reverse();
		}
	}
	
	public makeCounterClockwise() {
		if(this.isClockwise()) {
			this.points.reverse();
		}
	}
}

class PolygonGroup {
	outer: Polygon;
	inner: Polygon[];
	
	constructor(outer: Polygon, inner: Polygon[]) {
		this.outer = outer;
		this.inner = inner;
	}
}

class Sector {
	floorHeight: number;
	ceilingHeight: number;
	floorTexture: string;
	ceilingTexture: string;
	lightLevel: number;
	type: number;
	tag: number;
	sidedefs: Sidedef[];
	index: number;
	triangles: poly2tri.Triangle[];
	polygons: PolygonGroup[];
	
	constructor() {
		this.sidedefs = [];
		this.triangles = [];
		this.polygons = [];
	}
	
	// See http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
	public pointInside(p: Vector): boolean {
		var c = false;
		
		for(var i=0; i < this.sidedefs.length; i++) {
			var v1 = this.sidedefs[i].line.start.position;
			var v2 = this.sidedefs[i].line.end.position;
			
			if(
				 ((v2.y > p.y) != (v1.y > p.y)) &&
				 (p.x < (v1.x-v2.x) * (p.y-v2.y) / (v1.y-v2.y) + v2.x)
			)
				c = !c;
		}
		
		return c;
	}
	

	
	private getOuterPolygon(polygons: Polygon[]): number {
		for(var i=0; i < polygons.length; i++) {
			var isOuter = true;
			
			for(var j=0; j < polygons.length; j++) {
				if(i != j && polygons[j].pointInside(polygons[i].points[0])) {
					isOuter = false;
					break;
				}
			}
			
			if(isOuter)
				return i;
		}
		
		return -1;
	}
	
	private getInnerPolygons(polygons: Polygon[], outer: Polygon): Polygon[] {
		var inner: Polygon[] = [];
		
		for(var i=0; i < polygons.length; i++) {
			if(outer.pointInside(polygons[i].points[0])) {
				var isInner = true;
				
				for(var j=0; j < polygons.length; j++) {
					if(i != j && polygons[j].pointInside(polygons[i].points[0])) {
						isInner = false;
						break;
					}
				}
				
				if(isInner) {
					inner.push(polygons[i]);
				}
			}
		}
		
		return inner;
	}
	
	private createPolygonGroups(polygons: Polygon[]) {
		while(polygons.length > 0) {
			var outerIndex = this.getOuterPolygon(polygons);
			var outer = polygons[outerIndex];
			
			polygons.splice(outerIndex, 1);
		
			var inner = this.getInnerPolygons(polygons, outer);
			
			for(var i=0; i < inner.length; i++) {
				polygons.splice(polygons.indexOf(inner[i]), 1);
			}
			
			this.polygons.push(new PolygonGroup(outer, inner));
		}
	}
	
	public triangulate() {
		var sds: Sidedef[] = [];
		var points: Vertex[] = [];
		var maxIterations = 10;
		var polygons: Polygon[] = [];
		
		//console.log("----- Triangulating " + this.index + " -----");
		
		for(var i=0; i < this.sidedefs.length; i++) {
			if(this.sidedefs[i].getOther() == null || this.sidedefs[i].getOther().sector != this)
				sds.push(this.sidedefs[i]);
		}
		
		//console.log("sds.length: " + sds.length);
		
		for(var i=0; i < sds.length; i++) {
			//console.log(sds[i].line.start.position.toString() + " -> " + sds[i].line.end.position.toString());
		}
		
		//console.log("----------");
		
		while(sds.length > 0) {
			var startSd = sds[0];
			var currentSd = startSd;
			var currentLd = startSd.line;
			var originVertex = startSd.line.end;
			var previousVertex = startSd.line.start;
			
			points.push(startSd.line.start);
			points.push(startSd.line.end);
			
			// alert("Starting with ld " + currentSd.line.index);
			
			do {
				var bla = "";
				
				for(var i=0; i < sds.length; i++) {
					bla += "ld " + sds[i].line.index + "\n";
				}
				
				// alert("open list:\n" + bla)
				
				//console.log("Origin vertex: " + originVertex.position.toString() + "(" + originVertex.linedefs.length + " linedefs)");
				// alert("Origin vertex: " + originVertex.position.toString() + "(" + originVertex.linedefs.length + " linedefs)");
				
				var angle = null;
				var nextLd: Linedef = null;
				
				for(var i=0; i < originVertex.linedefs.length; i++) {
					var otherVertex:Vertex = null;
					
					//console.log("Trying linedef " + originVertex.linedefs[i].index);
					//alert("Trying linedef " + originVertex.linedefs[i].index);
					
					/*
					alert(
						"Checking if a sd of ld " + originVertex.linedefs[i].index + " is in open list\n" +
						"sds.indexOf(originVertex.linedefs[i].front) < 0 -> " + (sds.indexOf(originVertex.linedefs[i].front) < 0) + "\n" +
						"(originVertex.linedefs[i].back == null || (originVertex.linedefs[i].back != null && sds.indexOf(originVertex.linedefs[i].back) < 0)) -> " + (originVertex.linedefs[i].back == null || (originVertex.linedefs[i].back != null && sds.indexOf(originVertex.linedefs[i].back) < 0)) + "\n" +
						"result: " + (sds.indexOf(originVertex.linedefs[i].front) < 0 && (originVertex.linedefs[i].back != null && sds.indexOf(originVertex.linedefs[i].back) < 0))
					);
					*/
					
					if(sds.indexOf(originVertex.linedefs[i].front) < 0 && (originVertex.linedefs[i].back == null || (originVertex.linedefs[i].back != null && sds.indexOf(originVertex.linedefs[i].back) < 0))) {
						//console.log("Not in open list. Discarding...");
						// alert("Not in open list. Discarding...");
						continue;
					}
					
					if(	originVertex.linedefs[i] == currentLd ||
						(originVertex.linedefs[i].front.sector != this &&
						((originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this) || originVertex.linedefs[i].back == null))
					) {
						//console.log("Discarding...");
						// alert("Discarding...");
						continue;
					}

					
					if(originVertex.position.x == originVertex.linedefs[i].start.position.x && originVertex.position.y == originVertex.linedefs[i].start.position.y)
						otherVertex = originVertex.linedefs[i].end;
					else
						otherVertex = originVertex.linedefs[i].start;
					
					var v1 = new Vector(previousVertex.position.x - originVertex.position.x, previousVertex.position.y - originVertex.position.y);
					var v2 = new Vector(otherVertex.position.x - originVertex.position.x, otherVertex.position.y - originVertex.position.y);
					
					//v1 = previousVertex.position;
					//v2 = otherVertex.position;
					
					var a = Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
					
					if(a < 0) a += 2 * Math.PI;
					
					//console.log("Angle between " + previousVertex.position.toString() + " and " + otherVertex.position.toString() + ": " + (a * (180.0 / Math.PI)));
					
					if(angle == null || a < angle) {
						angle = a;
						nextLd = originVertex.linedefs[i];
						//console.log("Using...");
						// alert("Using...");
					}
				}
				
				
					
					/*
					console.log("Checking " + originVertex.linedefs[i].start.position.toString() + " -> " + originVertex.linedefs[i].end.position.toString());
					
					console.log("originVertex.linedefs[i] == currentLd => " + (originVertex.linedefs[i] == currentLd));
					//console.log("originVertex.linedefs[i].front.sector != this => " + (originVertex.linedefs[i].front.sector != this));
					// console.log("(originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this) => " + ((originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)));
					console.log("(originVertex.linedefs[i].front.sector != this && (originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)) => " + (originVertex.linedefs[i].front.sector != this && (originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)));
					
					console.log("##### " + (originVertex.linedefs[i] == currentLd ||
						(originVertex.linedefs[i].front.sector != this &&
						(originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this))));
					
					
					console.log("Using...");
					*/
				
				// alert("Removing ld " + currentSd.line.index + " (index: " + sds.indexOf(currentSd) + ")");
				sds.splice(sds.indexOf(currentSd), 1);
				
				if(nextLd == null) {
					this.triangles = [];
					// alert("No more linedefs");
					break;
				}
			
				/*
				console.log(originVertex.linedefs[i].front.sector);
				console.log(this);
				*/
				
				if(nextLd.front.sector == this) {
					currentSd = nextLd.front;
					//console.log("Setting currentSd to front");
					// alert("Setting currentSd to front (ld: " + currentSd.line.index + ")");
				} else {
					currentSd = nextLd.back;
					//console.log("Setting currentSd to back");
					// alert("Setting currentSd to back (ld: " + currentSd.line.index + ")");
				}
					
				currentLd = currentSd.line;
				
				previousVertex = originVertex;
				
				if(nextLd.start == originVertex)
					originVertex = nextLd.end;
				else
					originVertex = nextLd.start;
				
				//console.log("Adding " + originVertex.position.toString());
				// alert("Adding " + originVertex.position.toString());
				points.push(originVertex);
			} while(true);
			
			points.pop();
			
			//console.log("----- Points -----");
			//console.log(points);
			
			var p = new Polygon(points);
			
			//console.log("----- Polygon -----");
			//console.log(p);
			
			polygons.push(p);
			
			points = [];
			
			//alert("bla: " + sds.indexOf(currentSd));
			//sds.splice(sds.indexOf(currentSd), 1);
		}
		
		// console.log(polygons);
		
		//console.log("----- Polygons of sector " + this.index + " ----- (" + polygons.length + ")");		
		//console.log(polygons);		
		
		
		this.createPolygonGroups(polygons);
		
		// Make the outer polygon clockwise and the holes counter-clockwise
		for(var i=0; i < this.polygons.length; i++) {
			this.polygons[i].outer.makeClockwise();
			
			for(var j=0; j < this.polygons[i].inner.length; j++) {
				this.polygons[i].inner[j].makeCounterClockwise();
			}
		}
		
		for(var i=0; i < this.polygons.length; i++) {
			var contour: poly2tri.Point[] = [];
			
			//console.log("Triangulating " + i);
			
			for(var j=0; j < this.polygons[i].outer.points.length; j++) {
				//console.log("Adding point " + j)
				contour.push(new poly2tri.Point(
					this.polygons[i].outer.points[j].x,
					this.polygons[i].outer.points[j].y
				));
			}
			
			var swctx = new poly2tri.SweepContext(contour);

			for(var j=0; j < this.polygons[i].inner.length; j++) {
				var hole: poly2tri.Point[] = [];
				
				for(var k=0; k < this.polygons[i].inner[j].points.length; k++) {
					hole.push(new poly2tri.Point(
						this.polygons[i].inner[j].points[k].x,
						this.polygons[i].inner[j].points[k].y
					));
				}
				
				swctx.addHole(hole);
			}
			
			//swctx.triangulate();
			//this.triangles = this.triangles.concat(swctx.getTriangles());			
		}
		
		//console.log("Done triangulating (" + this.triangles.length + " triangles)");
		//console.log("----------");
	}
}