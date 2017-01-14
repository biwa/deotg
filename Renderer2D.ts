/// <reference path="GraphicsManager.ts" />
/// <reference path="Linedef.ts" />
/// <reference path="Vector.ts" />

class Renderer2D {
	context: CanvasRenderingContext2D;
	scale: number;
	translate: Vector;
	offset: Vector;
	
	public static VERTEX_SIZE: number = 5;
	
	public getMousePosition(event: MouseEvent): Vector {
		var rect = this.context.canvas.getBoundingClientRect();
		
		return new Vector(event.clientX-rect.left, event.clientY-rect.top);
	}

	constructor(canvasID: string) {
		this.context = (<HTMLCanvasElement>document.getElementById(canvasID)).getContext('2d');
		this.scale = 1;
		this.translate = new Vector(0, 0);
		this.offset = new Vector(0, 0);
	}
	
	public setSize(width: number, height: number) {
		this.context.canvas.width = width;
		this.context.canvas.height = height;
		//this.context.fillStyle = "#000000";
		//this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}
	
	public mapToCanvas(position: Vector): Vector;
	public mapToCanvas(x: number, y: number): Vector;
	public mapToCanvas(a: any, b?: any): Vector {
		if(typeof(a) == "object") {
			return new Vector(
				Math.round((a.x + this.translate.x) * this.scale) + 0.5*0,
				Math.round((a.y + this.translate.y) * (-this.scale)) + 0.5*0
			);
		}
		else if(typeof(a) == "number") {
				return new Vector(
					Math.round((a + this.translate.x) * this.scale) + 0.5*0,
					Math.round((b + this.translate.y) * (-this.scale)) + 0.5*0
				);
		}
	}
	
	public canvasToMap(position: Vector): Vector {
		var scaleInverse = 1.0 / this.scale;
		
		// -translatex
		// - trynslatey
		// scaleinv
		// -scaleinv
		return new Vector(
			(position.x * scaleInverse) - this.translate.x,
			(position.y * (-scaleInverse)) - this.translate.y
		)
	}
	
	public clear() {
		// this.context.fillStyle = "#000000";
		// this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
	}
	
	public drawLinedefs(linedefs: Linedef[]) {
		var lines: { [color: string]: Linedef[] } = {};
		var color;
		var colorAction;

		// 2-sided lines		
		color = "#909090";
		colorAction = "#408040";
		lines[color] = [];
		lines[colorAction] = [];
		
		for(var i=0; i < linedefs.length; i++) {
			if(linedefs[i].flags["4"] == false)
				continue;
			
			if(linedefs[i].special != 0)
				lines[colorAction].push(linedefs[i]);
			else
				lines[color].push(linedefs[i]);
		}
		
		// 1-sided lines
		color = "#ffffff";
		colorAction = "#90ff09";
		lines[color] = [];
		lines[colorAction] = [];
		
		for(var i=0; i < linedefs.length; i++) {
			if(linedefs[i].flags["4"] == true)
				continue;
				
			if(linedefs[i].special != 0)
				lines[colorAction].push(linedefs[i]);
			else
				lines[color].push(linedefs[i]);
		}

		// Draw the lines
		this.context.lineWidth = 1.5;
		
		for(color in lines) {
			this.context.beginPath();
			this.context.strokeStyle = color;
			
			for(var i=0; i < lines[color].length; i++) {
				var start = this.mapToCanvas(lines[color][i].start.position);
				var end = this.mapToCanvas(lines[color][i].end.position);
				
				this.context.moveTo(start.x, start.y);
				this.context.lineTo(end.x, end.y);
			}
			
			this.context.stroke();
		}
	}
	
	public drawSectorSidedefs(sector: Sector, color: Color, size: number) {
		this.context.beginPath();
		this.context.strokeStyle = color.getColorStringRGB();
		this.context.lineWidth = size;
		
		for(var i=0; i < sector.sidedefs.length; i++) {
			var start = this.mapToCanvas(sector.sidedefs[i].line.start.position);
			var end = this.mapToCanvas(sector.sidedefs[i].line.end.position);
			
			this.context.moveTo(start.x, start.y);
			this.context.lineTo(end.x, end.y);
			
		}
		
		this.context.stroke();
	}
	
	public drawVertices(vertices: Vertex[]) {
		var size = Renderer2D.VERTEX_SIZE;
		
		if(size * this.scale < size)
			size *= this.scale;
			
		if(size < 1)
			return;
	
		var radius = size/2;
		
		this.context.beginPath();
		this.context.fillStyle = '#8080ff';
		
		for(var i=0; i < vertices.length; i++) {
			var p = this.mapToCanvas(vertices[i].position);
			
			this.context.rect(p.x - radius, p.y - radius, size, size);
		}
		
		this.context.fill();		
	}
	
	public drawThings(things: Thing[]) {
		var thingGroups: { [type: number]: Thing[] } = {};
		
		for(var i=0; i < things.length; i++) {
			if(!(things[i].type in thingGroups))
				thingGroups[things[i].type] = [];
			
			thingGroups[things[i].type].push(things[i]);
		}

		for(var type in thingGroups) {
			var size = 32;
			var color = "#ff8080";
			
			var thingInfo = DEOTG.getThingTypeInfo(type);	

			if(thingInfo != null) {
				size = thingInfo.size;
				color = thingInfo.color;
			}
			
			size *= this.scale;
				
			var radius = size / 2;		
		
			this.context.beginPath();
			this.context.fillStyle = color;

			for(var i=0; i < thingGroups[type].length; i++) {
				var p = this.mapToCanvas(thingGroups[type][i].position);

				this.context.rect(p.x - radius, p.y - radius, size, size);
			}
			
			this.context.fill();
		}
	}
	
	public drawSectors(sectors: Sector[]) {
		this.context.msImageSmoothingEnabled = false;
					
		// for(var i=0; i < sectors.length; i++) {
		for(var i=sectors.length-1; i >= 0; i--) {
			//var pattern = this.context.createPattern(DEOTG.graphicsManager.flats[sectors[i].floorTexture].canvas, "repeat");
			var pattern = this.context.createPattern(DEOTG.graphicsManager.flats[sectors[i].floorTexture].getWithLighting(sectors[i].lightLevel), "repeat");
			this.context.fillStyle = pattern;
			
			this.context.save();
			this.context.scale(this.scale, this.scale);
			this.context.translate(this.translate.x, -this.translate.y);

			this.context.beginPath();
			
			for(var j=0; j < sectors[i].polygons.length; j++) {
				this.context.moveTo(sectors[i].polygons[j].outer.points[0].x, -sectors[i].polygons[j].outer.points[0].y);
				
				for(var k=1; k < sectors[i].polygons[j].outer.points.length; k++) {
					this.context.lineTo(sectors[i].polygons[j].outer.points[k].x, -sectors[i].polygons[j].outer.points[k].y);
				}
				
				this.context.closePath();
				
				for(var k=0; k < sectors[i].polygons[j].inner.length; k++) {
					this.context.moveTo(sectors[i].polygons[j].inner[k].points[0].x, -sectors[i].polygons[j].inner[k].points[0].y);
					
					for(var l=1; l < sectors[i].polygons[j].inner[k].points.length; l++) {
						this.context.lineTo(sectors[i].polygons[j].inner[k].points[l].x, -sectors[i].polygons[j].inner[k].points[l].y);
					}
					
					this.context.closePath();
				}
			}

			/*
			for(var t=0; t < sectors[i].triangles.length; t++) {
				var points = sectors[i].triangles[t].getPoints();
				
				// Doom uses a cartesian coordinate system, but the canvas doesn't,
				// to invert the y-axis
				this.context.moveTo(points[0].x, -points[0].y);
				this.context.lineTo(points[1].x, -points[1].y);
				this.context.lineTo(points[2].x, -points[2].y);
				
				this.context.closePath();
			}
			*/
			
			this.context.fill();
			//this.context.stroke();
			this.context.restore();
		}
	}
	
	public zoomToArea(topLeft: Vector, bottomRight: Vector, padding: number) {
		var width = Math.abs(topLeft.x - bottomRight.x) + (padding * 2);
		var height = Math.abs(topLeft.y - bottomRight.y) + (padding * 2);
		
		if(this.context.canvas.width/width < this.context.canvas.height/height)
			this.scale = this.context.canvas.width/width;
		else
			this.scale = this.context.canvas.height/height;
		
		this.offset = new Vector(width/2 + topLeft.x - padding, height/2 + bottomRight.y - padding);
		
		this.updateTransformation();
	}
	
	public zoomIntoPoint(point: Vector, delta: number) {
		var newScale = this.scale * delta;
		var size = new Vector(this.context.canvas.width, this.context.canvas.height);
		var zoomPoint = (point.divide(size)).subtract(new Vector(0.5, 0.5));
		var diff = ((size.divide(newScale)).subtract(size.divide(this.scale))).multiply(zoomPoint);
		
		this.positionView(this.offset.x - diff.x, this.offset.y + diff.y);
		this.scaleView(newScale);
		
		this.updateTransformation();
	}
	
	public scaleView(scale: number) {
		this.scale = scale;
		
		this.updateTransformation();
	}
	
	public positionView(x: number, y: number) {
		this.offset.x = x;
		this.offset.y = y;
		
		this.updateTransformation();
	}
	
	private updateTransformation() {
		var scaleInverse = 1.0 / this.scale;
		this.translate.x = -this.offset.x + (this.context.canvas.width/2) * scaleInverse;
		this.translate.y = -this.offset.y - (this.context.canvas.height/2) * scaleInverse;
	}
	
	public showPalette(palette: Color[]) {
		for(var i=0; i < 256; i++) {
			var x = (i%16) * 16;
			var y = ((i/16)|0) * 16; 
			this.context.beginPath();
			this.context.rect(x, y, 16, 16);
			this.context.fillStyle = palette[i].getColorStringRGB();
			this.context.fill();
		}
	}
	
	public showFlat(flat: Graphic, x: number, y: number) {
		this.context.drawImage(flat.context.canvas, x, y);
	}
}