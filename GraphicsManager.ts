/// <reference path="WADFile.ts" />

class Color {
	r: number;
	g: number;
	b: number;
	
	constructor(r: number, g: number, b: number) {
		this.r = r;
		this.g = g;
		this.b = b;
	}
	
	public getColorStringRGB(): string {
		return "rgb(" + this.r + "," + this.g + "," + this.b +")";
	}
}

class Graphic {
	canvas: HTMLCanvasElement;
	context: CanvasRenderingContext2D;
	imageData: ImageData;
	width: number;
	height: number;
	canvasWithLighting: { [index: number]: HTMLCanvasElement };
	
	constructor(width: number, height: number) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.width = width;
		this.canvas.height = this.height = height;
		this.context = this.canvas.getContext('2d');
		this.imageData = this.context.getImageData(0, 0, width, height);
		this.canvasWithLighting = {};
	}
	
	public setPixelColor(x: number, y: number, c: Color) {
		var offset = ((this.width * y) + x) * 4;
		this.imageData.data[offset] = c.r;
		this.imageData.data[offset + 1] = c.g;
		this.imageData.data[offset + 2] = c.b;
		this.imageData.data[offset + 3] = 255;
	}
	
	public update() {
		this.context.putImageData(this.imageData, 0, 0);
	}
	
	public getWithLighting(light: number): HTMLCanvasElement {
		if(light in this.canvasWithLighting) {
			return this.canvasWithLighting[light];
		}
		
		this.canvasWithLighting[light] = document.createElement('canvas');
		this.canvasWithLighting[light].width = this.width;
		this.canvasWithLighting[light].height = this.height;
		
		var context = this.canvasWithLighting[light].getContext('2d');
		context.putImageData(this.imageData, 0, 0);
		context.fillStyle = "rgba(0, 0, 0, " + (1 - (light/255.0)) + ")";
		context.fillRect(0, 0, this.width, this.height);
		
		return this.canvasWithLighting[light];
	}
}

class GraphicsManager {
	palette: Color[];
	flats: { [name: string]: Graphic };
	
	constructor() {
		this.palette = [];
		this.flats = {};
		
		for(var i=0; i < 256; i++)
			this.palette.push(new Color(i, i, i));
	}
	
	// public loadPalette(wad: WAD, lumpName: string) {
	public loadPalette(data: ArrayBuffer) {
		var dv = new DataView(data);
		
		for(var i=0; i < 256; i++) {
			var offset = i*3;
			this.palette[i].r = dv.getUint8(offset);
			this.palette[i].g = dv.getUint8(offset+1);
			this.palette[i].b = dv.getUint8(offset+2);
		}
	}
	
	public loadFlat(wad: WAD, lumpName: string): Graphic {
		var lump = wad.getLump(lumpName);
		var dv = new DataView(lump.data);
		
		var width = 64;
		var height = 64;
		
		// Hexen has some flats that are 64x128
		if(dv.byteLength == 8192)
			height = 128;
			
		
		var g = new Graphic(width, height);
		
		for(var y=0, i=0; y < height; y++) {
			for(var x=0; x < width; x++, i++) {
				var c = dv.getUint8(i);
				g.setPixelColor(x, y, this.palette[c]);
			}
		}
		
		g.update();
		
		this.flats[lumpName] = g;

		return g;
	}
}