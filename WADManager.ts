/// <reference path="GraphicsManager.ts" />
/// <reference path="WADFile.ts" />

class WADManager {
	iwad: WAD;
	pwad: WAD;
	resources: WAD[];
	
	constructor() {
		this.iwad = null;
		this.pwad = null;
		this.resources = [];
	}
	
	addIWAD(data: ArrayBuffer) {
		this.iwad = new WAD(data);
	}
	
	addPWAD(data: ArrayBuffer) {
		this.pwad = new WAD(data);
	}
	
	addResourceWAD(data: ArrayBuffer) {
		var wad = new WAD(data);
		this.resources.push(wad);
	}
	
	public getWADList(): WAD[] {
		var wads = [ this.iwad ];
		
		wads.push.apply(wads, this.resources);
		
		wads.push(this.pwad);
		
		return wads;
	}
	
	public getLump(name: string): Lump {
		var wads = this.getWADList();
		
		for(var i=wads.length-1; i >= 0; i--) {
			for(var k=0; k < wads[i].lumps.length; k++) {
				if(wads[i].lumps[k].name === name)
					return wads[i].lumps[k];
			}
		}
		
		return null;
	}
	
	public loadFlats(gm: GraphicsManager) {
		var wads = this.getWADList();
		var groups = [
			{ start: "F_START", end: "F_END" },
			{ start: "F_START", end: "FF_END" },
			{ start: "FF_START", end: "F_END" },
			{ start: "FF_START", end: "FF_END" }
		];
		
		for(var g=0; g < groups.length; g++) {
			for(var i=0; i < wads.length; i++) {
				var lumps = wads[i].getLumpsBetween(groups[g].start, groups[g].end, function(lump, index) { if(lump.data.byteLength == 0) return true; return false; });
				
				for(var k=0; k < lumps.length; k++) {
					gm.loadFlat(wads[i], lumps[k].name);
				}
			}
		}
	}
}