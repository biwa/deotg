/// <reference path="EditingMode.ts" />
/// <reference path="jquery.d.ts" />

class SectorsMode extends EditingMode {
	highlightedSector: Sector;
	
	constructor() {
		super();
		
		this.highlightedSector = null;
	}
	
	public onMouseMove(event: MouseEvent) {
		super.onMouseMove(event);
		
		var redraw = false;
		
		this.onRedraw();
		
		if(!this.panning) {
			var newHighlight: Sector = null;
			
			for(var i=0; i < DEOTG.map.sectors.length; i++) {
				if(DEOTG.map.sectors[i].pointInside(DEOTG.mouseMapPosition)) {
					
					 newHighlight = DEOTG.map.sectors[i];
					
					break;
				}
			}
			
			if(newHighlight != this.highlightedSector) {
				redraw = true;
			}
			
			this.highlightedSector = newHighlight;
			
			if(redraw)
				this.onRedraw();
			
			this.showSectorInfoOverlay();			
		}
	}
	
	public onMouseWheel(event: MouseEvent, delta: number) {
		super.onMouseWheel(event, delta);
	}
	
	public onRedraw() {
		DEOTG.renderer2d.clear();
		DEOTG.renderer2d.drawSectors(DEOTG.map.sectors);
		DEOTG.renderer2d.drawLinedefs(DEOTG.map.linedefs);
		DEOTG.renderer2d.drawVertices(DEOTG.map.vertices);
		DEOTG.renderer2d.drawThings(DEOTG.map.things);
		
		if(this.highlightedSector != null)
			this.drawHighlightedSector();
	}
	
	public drawHighlightedSector() {
		var sector = this.highlightedSector;
		
		DEOTG.renderer2d.drawSectorSidedefs(sector, new Color(192, 192, 0), 2);
		
		/*
		DEOTG.renderer2d.context.font = '12pt Calibri';
		DEOTG.renderer2d.context.fillStyle = 'black';
		
		DEOTG.renderer2d.context.fillText("Sector: " + sector.index, 10, 16);
		
		DEOTG.renderer2d.context.fillText("Floor: " + sector.floorHeight, 10, 36);
		DEOTG.renderer2d.showFlat(DEOTG.graphicsManager.flats[sector.floorTexture], 10, 42);
		
		DEOTG.renderer2d.context.fillText("Ceiling: " + sector.ceilingHeight, 10, 123);
		DEOTG.renderer2d.showFlat(DEOTG.graphicsManager.flats[sector.ceilingTexture], 10, 129);
		*/
	}
	
	public showSectorInfoOverlay() {
		var o = $('#sectorInfoOverlay');
		
		if(this.highlightedSector == null) {
			o.hide();
			return;
		}
		
		o.find('#number').html(this.highlightedSector.index.toString());
		o.find('#light').html(this.highlightedSector.lightLevel.toString());
		o.find('#tag').html(this.highlightedSector.tag.toString());
		o.find('#type').html(this.highlightedSector.type.toString());
		
		o.find('#floorHeight').html(this.highlightedSector.floorHeight.toString());
		o.find('#floorImage').attr("src", DEOTG.graphicsManager.flats[this.highlightedSector.floorTexture].canvas.toDataURL());
		o.find('#floorName').html(this.highlightedSector.floorTexture);
		
		o.find('#ceilingHeight').html(this.highlightedSector.ceilingHeight.toString());
		o.find('#ceilingImage').attr("src", DEOTG.graphicsManager.flats[this.highlightedSector.ceilingTexture].canvas.toDataURL());
		o.find('#ceilingName').html(this.highlightedSector.ceilingTexture);
		
		o.show();
	}
}