/// <reference path="Map.ts" />
/// <reference path="WADFile.ts" />

interface MapIO {
	read(name: string): MapSet;
}

class MapGeometryConnector {
	protected connectLinedefsAndVertices(linedefs: Linedef[], vertices: Vertex[]) {
		for(var i=0; i < linedefs.length; i++) {
			var start = linedefs[i].startVertexID;
			var end = linedefs[i].endVertexID;
			
			linedefs[i].start = vertices[start];
			linedefs[i].end = vertices[end];
			
			if(vertices[start].linedefs.indexOf(linedefs[i]) < 0)
				vertices[start].linedefs.push(linedefs[i]);
				
			if(vertices[end].linedefs.indexOf(linedefs[i]) < 0)
				vertices[end].linedefs.push(linedefs[i]);
		}
	}
	
	protected connectLinedefsAndSidedefs(linedefs: Linedef[], sidedefs: Sidedef[]) {
		for(var i=0; i < linedefs.length; i++) {
			var front = linedefs[i].frontSidedefID;
			var back = linedefs[i].backSidedefID;
			
			linedefs[i].front = sidedefs[front];
			sidedefs[front].line = linedefs[i];
			
			// console.log("Linedef " + i + ": " + front + " / " + back)

			if(back === -1) {
				linedefs[i].back = null;
			} else {
				linedefs[i].back = sidedefs[back];
				sidedefs[back].line = linedefs[i];
			}
		}
	}
	
	protected connectSidedefsAndSectors(sidedefs: Sidedef[], sectors: Sector[]) {
		for(var i=0; i < sidedefs.length; i++) {
			var id = sidedefs[i].sectorID;
			
			if(sectors[id].sidedefs.indexOf(sidedefs[i]) < 0)
				sectors[id].sidedefs.push(sidedefs[i]);
				
			sidedefs[i].sector = sectors[id];
		}
	}

	protected connectSidedefsWithLinedefsAndSectors(sidedefs: Sidedef[], linedefs: Linedef[], sectors: Sector[], outSidedefs: Sidedef[]) {
		for(var i=0; i < linedefs.length; i++) {
			var frontID = linedefs[i].frontSidedefID;
			var backID = linedefs[i].backSidedefID;
			var sectorID;
			
			var frontSd = sidedefs[frontID].clone();
			linedefs[i].front = frontSd;
			frontSd.line = linedefs[i];
			sectorID = frontSd.sectorID;
			frontSd.sector = sectors[sectorID];
			
			if(sectors[sectorID].sidedefs.indexOf(frontSd) < 0)
				sectors[sectorID].sidedefs.push(frontSd);
			
			if(backID == -1)
				linedefs[i].back = null;
			else {
				var backSd = sidedefs[backID].clone();
				linedefs[i].back = backSd;
				backSd.line = linedefs[i];
				
				sectorID = backSd.sectorID;
				backSd.sector = sectors[sectorID];
				
				if(sectors[sectorID].sidedefs.indexOf(backSd) < 0)
					sectors[sectorID].sidedefs.push(backSd);
			}
		}
	}
}

class DoomMapIO extends MapGeometryConnector implements MapIO  {
	constructor(public wad: WAD) {
		super();
	}
	
	read(name: string): MapSet {
		var map = new MapSet();
		
		var mapIndexes = this.wad.getLumpIndex(name);
		
		if(mapIndexes.length == 0)
			throw new Error("Lump " + name + " not found!");
		else if(mapIndexes.length > 1)
			throw new Error("Lump " + name + " is not unique!");

		var mi = mapIndexes[0];
		
		map.things = this.readThings(mi+1);
		map.vertices = this.readVertices(mi+4);
		map.linedefs = this.readLinedefs(mi+2);
		map.sectors = this.readSectors(mi+8);
		var sidedefs = this.readSidedefs(mi+3);
		
		super.connectLinedefsAndVertices(map.linedefs, map.vertices);
		super.connectSidedefsWithLinedefsAndSectors(sidedefs, map.linedefs, map.sectors, map.sidedefs);
				
		// super.connectLinedefsAndSidedefs(map.linedefs, map.sidedefs);
		// super.connectSidedefsAndSectors(map.sidedefs, map.sectors);
		
		// Remove unused vertices
		for(var i=map.vertices.length-1; i >= 0; i--)
			if(map.vertices[i].linedefs.length == 0)
				map.vertices.splice(i, 1);
				
		for(var i=0; i < map.sectors.length; i++) {
			map.sectors[i].triangulate();
		}
		
		return map;
	}
	
	private readThings(index: number): Thing[] {
		var things: Thing[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Doom thing is 10 bytes long
		for(var i=0; i < dv.buffer.byteLength/10; i++) {
			var offset = i*10;

			var t = new Thing();

			t.position = new Vector(dv.getInt16(offset, true), dv.getInt16(offset+2, true));
			t.angle = dv.getInt16(offset+4, true);
			t.type = dv.getInt16(offset+6, true);
			
			var flags = dv.getInt16(offset+4, true);
			
			for(var f=0; f < 16; f++) {
				var flag = 1<<f;
				t.flags[flag.toString()] = ((flags & flag) != 0);
			}
			
			things.push(t);
		}
		
		return things;
	}
	
	private readVertices(index: number): Vertex[] {
		var vertices: Vertex[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Doom vertex is 4 bytes long
		for(var i=0; i < dv.buffer.byteLength/4; i++) {
			var offset = i*4;
			
			vertices.push(new Vertex(new Vector(dv.getInt16(offset, true), dv.getInt16(offset+2, true))));
		}
		
		return vertices;
	}
	
	private readLinedefs(index: number): Linedef[] {
		var linedefs: Linedef[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Doom linedef is 14 bytes long
		for(var i=0; i < dv.buffer.byteLength/14; i++) {
			var offset = i*14;
			
			var ld = new Linedef();
			
			ld.startVertexID = dv.getUint16(offset, true);
			ld.endVertexID = dv.getUint16(offset+2, true);
			ld.special = dv.getInt16(offset+6, true);
			ld.tag = dv.getInt16(offset+8, true);
			ld.frontSidedefID = dv.getUint16(offset+10, true);
			ld.backSidedefID = dv.getUint16(offset+12, true);
			
			if(ld.frontSidedefID == 65535)
				ld.frontSidedefID = -1;
			 
			if(ld.backSidedefID == 65535)
				ld.backSidedefID = -1;

			var flags = dv.getInt16(offset+4, true);

			for(var f=0; f < 16; f++) {
				var flag = 1<<f;
				ld.flags[flag.toString()] = ((flags & flag) != 0);
			}
			
			ld.index = i;
			
			linedefs.push(ld);
		}		
		
		return linedefs;
	}
	
	private readSectors(index: number): Sector[] {
		var sectors: Sector[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Doom sector is 26 bytes long
		for(var i=0; i < dv.buffer.byteLength/26; i++) {
			var offset = i*26;
			
			var s = new Sector();
			
			s.floorHeight = dv.getInt16(offset, true);
			s.ceilingHeight = dv.getInt16(offset+2, true);
			s.floorTexture = Tools.stringFromBuffer(dv.buffer, offset+4, 8);
			s.ceilingTexture = Tools.stringFromBuffer(dv.buffer, offset+12, 8);
			s.lightLevel = dv.getInt16(offset+20, true);
			s.type = dv.getInt16(offset+22, true);
			s.tag = dv.getInt16(offset+24, true);
			s.index = i;
			
			sectors.push(s);
		}
		
		return sectors;
	}
	
	private readSidedefs(index: number): Sidedef[] {
		var sidedefs: Sidedef[] = [];

		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);

		// Each Doom sidedef is 30 bytes long
		for(var i=0; i < dv.buffer.byteLength/30; i++) {
			var offset = i*30;
			
			var sd = new Sidedef();
			
			sd.xOffset = dv.getInt16(offset, true);
			sd.yOffset = dv.getInt16(offset+2, true);
			sd.upperTexture = Tools.stringFromBuffer(dv.buffer, offset+4, 8);
			sd.lowerTexture = Tools.stringFromBuffer(dv.buffer, offset+12, 8);
			sd.middleTexture = Tools.stringFromBuffer(dv.buffer, offset+20, 8);
			sd.sectorID = dv.getUint16(offset+28, true);
			
			sidedefs.push(sd);
		}
		
		return sidedefs;
	}
}

class HexenMapIO extends MapGeometryConnector implements MapIO  {
	constructor(public wad: WAD) {
		super();
	}
	
	read(name: string): MapSet {
		var map = new MapSet();
		
		var mapIndexes = this.wad.getLumpIndex(name);
		
		if(mapIndexes.length == 0)
			throw new Error("Lump " + name + " not found!");
		else if(mapIndexes.length > 1)
			throw new Error("Lump " + name + " is not unique!");

		var mi = mapIndexes[0];

		map.things = this.readThings(mi+1);
		map.vertices = this.readVertices(mi+4);
		map.linedefs = this.readLinedefs(mi+2);
		map.sectors = this.readSectors(mi+8);
		map.sidedefs = this.readSidedefs(mi+3);

		super.connectLinedefsAndVertices(map.linedefs, map.vertices);
		super.connectLinedefsAndSidedefs(map.linedefs, map.sidedefs);
		super.connectSidedefsAndSectors(map.sidedefs, map.sectors);

		// Remove unused vertices
		for(var i=map.vertices.length-1; i >= 0; i--)
			if(map.vertices[i].linedefs.length == 0)
				map.vertices.splice(i, 1);
		
		return map;
	}

	private readThings(index: number): Thing[] {
		var things: Thing[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);

		// Each Hexen thing is 20 bytes long
		for(var i=0; i < dv.buffer.byteLength/20; i++) {
			var offset = i*20;

			var t = new Thing();

			t.id = dv.getInt16(offset, true);
			t.position = new Vector(dv.getInt16(offset+2, true), dv.getInt16(offset+4, true), dv.getInt16(offset+6, true));
			t.angle = dv.getInt16(offset+8, true);
			t.type = dv.getInt16(offset+10, true);

			var flags = dv.getInt16(offset+12, true);
			
			for(var f=0; f < 16; f++) {
				var flag = 1<<f;
				t.flags[flag.toString()] = ((flags & flag) != 0);
			}
			
			t.special = dv.getUint8(offset+14);
			
			for(var a=0; a < 5; a++) {
				t.arguments[a] = dv.getUint8(offset + 15 + a);
			}
			
			things.push(t);
		}
		
		return things;
	}
	
	private readVertices(index: number): Vertex[] {
		var vertices: Vertex[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Hexen vertex is 4 bytes long
		for(var i=0; i < dv.buffer.byteLength/4; i++) {
			var offset = i*4;
			
			vertices.push(new Vertex(new Vector(dv.getInt16(offset, true), dv.getInt16(offset+2, true))));
		}
		
		return vertices;
	}
	
	private readLinedefs(index: number): Linedef[] {
		var linedefs: Linedef[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Hexen linedef is 16 bytes long
		for(var i=0; i < dv.buffer.byteLength/16; i++) {
			var offset = i*16;
			
			var ld = new Linedef();
			
			ld.startVertexID = dv.getUint16(offset, true);
			ld.endVertexID = dv.getUint16(offset+2, true);
			ld.special = dv.getUint8(offset+6);
			
			for(var a=0; a < 5; a++)
				ld.arguments[a] = dv.getUint8(offset + 7 + a);
			
			ld.frontSidedefID = dv.getInt16(offset+12, true);
			ld.backSidedefID = dv.getInt16(offset+14, true);

			var flags = dv.getInt16(offset+4, true);

			for(var f=0; f < 16; f++) {
				var flag = 1<<f;
				ld.flags[flag.toString()] = ((flags & flag) != 0);
			}
			
			ld.index = i;
			
			linedefs.push(ld);
		}		
		
		return linedefs;
	}
	
	private readSectors(index: number): Sector[] {
		var sectors: Sector[] = [];
		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);
		
		// Each Doom sector is 26 bytes long
		for(var i=0; i < dv.buffer.byteLength/26; i++) {
			var offset = i*26;
			
			var s = new Sector();
			
			s.floorHeight = dv.getInt16(offset, true);
			s.ceilingHeight = dv.getInt16(offset+2, true);
			s.floorTexture = Tools.stringFromBuffer(dv.buffer, offset+4, 8);
			s.ceilingTexture = Tools.stringFromBuffer(dv.buffer, offset+12, 8);
			s.lightLevel = dv.getInt16(offset+20, true);
			s.type = dv.getInt16(offset+22, true);
			s.tag = dv.getInt16(offset+24, true);
			s.index = i;
			
			sectors.push(s);
		}
		
		return sectors;
	}
	
	private readSidedefs(index: number): Sidedef[] {
		var sidedefs: Sidedef[] = [];

		var lump = this.wad.lumps[index];
		var dv = new DataView(lump.data);

		// Each Doom sidedef is 30 bytes long
		for(var i=0; i < dv.buffer.byteLength/30; i++) {
			var offset = i*30;
			
			var sd = new Sidedef();
			
			sd.xOffset = dv.getInt16(offset, true);
			sd.yOffset = dv.getInt16(offset+2, true);
			sd.upperTexture = Tools.stringFromBuffer(dv.buffer, offset+4, 8);
			sd.lowerTexture = Tools.stringFromBuffer(dv.buffer, offset+12, 8);
			sd.middleTexture = Tools.stringFromBuffer(dv.buffer, offset+20, 8);
			sd.sectorID = dv.getInt16(offset+28, true);
			
			sidedefs.push(sd);
		}
		
		return sidedefs;
	}
}