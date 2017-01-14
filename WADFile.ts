/// <reference path="Tools.ts" />
/// <reference path="Map.ts" />
/// <reference path="MapIO.ts" />

enum WADType {
	None,
	IWAD,
	PWAD
}

class Lump {
	constructor(public name: string, public data: ArrayBuffer) {}
}

class WAD {
	type: WADType;
	lumps: Lump[];
	mapIO: MapIO[];
	
	constructor(data: ArrayBuffer) {
		// Check if the supplied file is a IWAD or PWAD
		var identifier = Tools.stringFromBuffer(data, 0, 4);
		
		if(identifier == "IWAD") this.type = WADType.IWAD;
		else if(identifier == "PWAD") this.type = WADType.PWAD;
		else this.type = WADType.None;
		
		if(this.type == WADType.None)
			return;
			
		this.lumps = [];
		
		this.mapIO = [];
		this.mapIO[MapType.Doom] = new DoomMapIO(this);
		this.mapIO[MapType.Hexen] = new HexenMapIO(this);
		
		this.loadFile(data);
	}
	
	private loadFile(data: ArrayBuffer): void {
		var dv = new DataView(data);
		var numLumps = dv.getInt32(4, true);
		var directoryOffset = dv.getInt32(8, true);
		
		for(var i=0; i < numLumps; i++) {
			// Each directory entry is 16 bytes long: 4 bytes position in file,
			// 4 bytes size of lump, 8 bytes for lump name
			var dirEntryOffset = i*16 + directoryOffset;
			
			var lumpName = Tools.stringFromBuffer(dv.buffer, dirEntryOffset+8, 8);
			var lumpOffset = dv.getInt32(dirEntryOffset, true);
			var lumpSize = dv.getInt32(dirEntryOffset+4, true);
			var lumpData = dv.buffer.slice(lumpOffset, lumpOffset+lumpSize);
			
			this.lumps.push(new Lump(lumpName, lumpData));
		}
	}
	
	public getLumpIndex(name: string): number[] {
		var indexes: number[] = [];
		
		for(var i=0; i < this.lumps.length; i++) {
			if(this.lumps[i].name === name)
				indexes.push(i);
		}
		
		return indexes;
	}
	
	public getLump(name: string): Lump {
		for(var i=0; i < this.lumps.length; i++) {
			if(this.lumps[i].name === name)
				return this.lumps[i];
		}
		
		return null;
	}
	
	public getLumpsBetween(start: string, end: string, ignore?: (lump: Lump, index: number) => boolean): Lump[] {
		var lumps: Lump[] = [];
		
		var startIndex = -1;
		var endIndex = -1;
		
		if(!ignore)
			ignore = function(a, b) { return false; };
		
		try {
			startIndex = this.getLumpIndex(start)[0];
			endIndex = this.getLumpIndex(end)[0];
		} catch(e) {
			console.log(e);
			return lumps;
		}

		for(var i=startIndex; i <= endIndex; i++) {
			if(ignore(this.lumps[i], i) == false)
				lumps.push(this.lumps[i]);
		}
		
		return lumps;
	}
	
	public getMapNames(): string[] {
		var maps: string[] = [];
		
		for(var i=0; i < this.lumps.length; i++) {
			if(this.lumps[i].name.match(/^MAP\d\d$/) || this.lumps[i].name.match(/^E\dM\d$/))
				maps.push(this.lumps[i].name);
		}
		
		return maps;
	} 
}