module Tools {
	export function stringFromBuffer(buffer: ArrayBuffer, offset: number, length: number): string {
		var nameArray = new Uint8Array(buffer, offset, length);
		
		for(length=0; length < nameArray.length; length++)
			if(nameArray[length] == 0)
				break;
				
		return String.fromCharCode.apply(null, new Uint8Array(buffer, offset, length));
	}
}