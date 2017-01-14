/// <reference path="DoomThings.ts" />
/// <reference path="EditingMode.ts" />
/// <reference path="GraphicsManager.ts" />
/// <reference path="Map.ts" />
/// <reference path="Renderer2D.ts" />
/// <reference path="ThingType.ts" />
/// <reference path="WADManager.ts" />

class DoomEdOTG {
	wadManager: WADManager;
	graphicsManager: GraphicsManager;
	renderer2d: Renderer2D;
	mouseMapPosition: Vector;
	mousePosition: Vector;
	lastMousePosition: Vector;
	map: MapSet;
	currentMode: EditingMode;
	
	constructor() {
		this.wadManager = new WADManager();
		this.graphicsManager = new GraphicsManager();
		this.renderer2d = new Renderer2D("mapCanvas");
		this.mouseMapPosition = new Vector(0, 0);
		this.mousePosition = new Vector(0, 0);
		this.lastMousePosition = new Vector(0, 0);
		this.map = null;
		this.currentMode = null;
	}
	
	public getThingTypeInfo(thing: number): ThingType {
		for(var group in DoomThings) {
			for(var type in DoomThings[group].types) {
				if(type === thing) {
					var name = DoomThings[group].types[type].name;
					var color = DoomThings[group].types[type].color ? DoomThings[group].types[type].color : DoomThings[group].defaults.color;
					var size = DoomThings[group].types[type].size ? DoomThings[group].types[type].size : DoomThings[group].defaults.size;
					
					return {
						name: name,
						color: color,
						size: size
					}
				}
			}
		}
		
		return null;
	}
}