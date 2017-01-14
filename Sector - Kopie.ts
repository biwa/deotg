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
				if(polygons[j].pointInside(polygons[i].points[0])) {
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
		
		console.log("----- Triangulating " + this.index + " -----");
		
		for(var i=0; i < this.sidedefs.length; i++) {
			if(this.sidedefs[i].getOther() == null || this.sidedefs[i].getOther().sector != this)
				sds.push(this.sidedefs[i]);
		}
		
		console.log("sds.length: " + sds.length);
		
		for(var i=0; i < sds.length; i++) {
			console.log(sds[i].line.start.position.toString() + " -> " + sds[i].line.end.position.toString());
		}
		
		console.log("----------");
		
		while(sds.length > 0) {
			var startSd = sds[0];
			var currentSd = startSd;
			var currentLd = startSd.line;
			var originVertex = startSd.line.end;
			
			points.push(startSd.line.start);
			points.push(startSd.line.end);
			
			do {
				console.log("Origin vertex: " + originVertex.position.toString());
				for(var i=0; i < originVertex.linedefs.length; i++) {
					maxIterations--;
					
					//if(maxIterations == 0)
					//	return;
					
					
					console.log("Checking " + originVertex.linedefs[i].start.position.toString() + " -> " + originVertex.linedefs[i].end.position.toString());
					
					console.log("originVertex.linedefs[i] == currentLd => " + (originVertex.linedefs[i] == currentLd));
					//console.log("originVertex.linedefs[i].front.sector != this => " + (originVertex.linedefs[i].front.sector != this));
					// console.log("(originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this) => " + ((originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)));
					console.log("(originVertex.linedefs[i].front.sector != this && (originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)) => " + (originVertex.linedefs[i].front.sector != this && (originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this)));
					
					console.log("##### " + (originVertex.linedefs[i] == currentLd ||
						(originVertex.linedefs[i].front.sector != this &&
						(originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this))));
					
					if(	originVertex.linedefs[i] == currentLd ||
						(originVertex.linedefs[i].front.sector != this &&
						((originVertex.linedefs[i].back != null && originVertex.linedefs[i].back.sector != this) || originVertex.linedefs[i].back == null))
					) { console.log("Discarding..."); continue; }
					
					console.log("Using...");
					
					sds.splice(sds.indexOf(currentSd), 1);
					
					console.log(originVertex.linedefs[i].front.sector);
					console.log(this);
					
					
					if(originVertex.linedefs[i].front.sector == this) {
						currentSd = originVertex.linedefs[i].front;
						console.log("Setting currentSd to front");
					}
					else {
						currentSd = originVertex.linedefs[i].back;
						console.log("Setting currentSd to back");
					}
						
					currentLd = currentSd.line;
					
					if(originVertex.linedefs[i].start == originVertex)
						originVertex = originVertex.linedefs[i].end;
					else
						originVertex = originVertex.linedefs[i].start;
					
					console.log("Adding " + originVertex.position.toString());
					points.push(originVertex);
					
					break;
				}
			} while(originVertex != points[0]);
			
			points.pop();
			
			console.log("----- Points -----");
			console.log(points);
			
			var p = new Polygon(points);
			
			console.log("----- Polygon -----");
			console.log(p);
			
			polygons.push(p);
			
			points = [];
			
			sds.splice(sds.indexOf(currentSd), 1);
		}
		
		console.log("----- Polygons ----- (" + polygons.length + ")");
		console.log(polygons);
		
		this.createPolygonGroups(polygons);
		
		console.log(this.polygons);
		
		for(var i=0; i < this.polygons.length; i++) {
			var contour: poly2tri.Point[] = [];
			
			console.log("Triangulating " + i);
			
			for(var j=0; j < this.polygons[i].outer.points.length; j++) {
				console.log("Adding point " + j)
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
			
			swctx.triangulate();
			this.triangles = this.triangles.concat(swctx.getTriangles());			
		}
		
		console.log("Done triangulating (" + this.triangles.length + " triangles)");
		console.log("----------");
	}
}