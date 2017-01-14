/// <reference path="main.ts" />

class EditingMode {
	panning: boolean;
	
	constructor() {
		this.panning = false;
	}
	
	public onMouseMove(event: MouseEvent) {
		var rect = DEOTG.renderer2d.context.canvas.getBoundingClientRect();
		var posx = event.clientX - rect.left;
		var posy = event.clientY - rect.top;
		
		DEOTG.mouseMapPosition = DEOTG.renderer2d.canvasToMap(new Vector(posx, posy));
		
		if(this.panning) {
			var diffx = DEOTG.lastMousePosition.x - event.clientX;
			var diffy = DEOTG.lastMousePosition.y - event.clientY;
			DEOTG.renderer2d.positionView(DEOTG.renderer2d.offset.x + (diffx/DEOTG.renderer2d.scale), DEOTG.renderer2d.offset.y - (diffy/DEOTG.renderer2d.scale));
		}
		
		DEOTG.lastMousePosition = new Vector(event.clientX, event.clientY);
	}
	
	public onMouseWheel(event: MouseEvent, delta: number) {
		if(delta < 0)
			DEOTG.renderer2d.zoomIntoPoint(DEOTG.renderer2d.getMousePosition(event), 0.9);
		else
			DEOTG.renderer2d.zoomIntoPoint(DEOTG.renderer2d.getMousePosition(event), 1.1);
			
		DEOTG.currentMode.onRedraw();
	}
	
	
	public onMouseDown(event: MouseEvent) {
		if(event.buttons & 4)
			this.panning = true;
	}
	
	public onMouseUp(event: MouseEvent) {
		this.panning = false;
	}
	
	public onRedraw() {
		
	}
}