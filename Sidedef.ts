/// <reference path="Linedef.ts" />
/// <reference path="Sector.ts" />

class Sidedef {
	xOffset: number;
	yOffset: number;
	upperTexture: string;
	lowerTexture: string;
	middleTexture: string;
	sectorID: number;
	sector: Sector;
	line: Linedef;
	
	constructor() {
		this.sector = null;
		this.line = null;
	}
	
	public clone(): Sidedef {
		var sd = new Sidedef();
		
		sd.xOffset = this.xOffset;
		sd.yOffset = this.yOffset;
		sd.upperTexture = this.upperTexture;
		sd.lowerTexture = this.lowerTexture;
		sd.middleTexture = this.middleTexture;
		sd.sectorID = this.sectorID;
		sd.sector = this.sector;
		sd.line = this.line;
		
		return sd;
	}
	
	public getOther(): Sidedef {
		if(this.line.front == this)
			return this.line.back;
		
		return this.line.front;
	}
}