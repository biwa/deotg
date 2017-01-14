class Vector {
	constructor(public x: number, public y: number, public z?: number) {
		if(!z)
			this.z = 0;
	}
	
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
	
	public add(v: Vector): Vector {
		return new Vector(this.x + v.x, this.y, v.y);
	}
	
	public subtract(v: Vector): Vector {
		return new Vector(this.x - v.x, this.y - v.y);
	}
	
	public divide(v: Vector): Vector;
	public divide(v: number): Vector;	
	public divide(v): Vector {
		if(typeof v == "object")
			return new Vector(this.x / v.x, this.y / v.y);
		
		if(typeof v == "number")
			return new Vector(this.x / v, this.y / v);
	}
	
	public multiply(v: Vector): Vector;
	public multiply(v: number): Vector;
	public multiply(v): Vector {
		if(typeof v == "object")
			return new Vector(this.x * v.x, this.y * v.y);
			
		if(typeof v == "number")
			return new Vector(this.x * v, this.y * v);
	}
}
