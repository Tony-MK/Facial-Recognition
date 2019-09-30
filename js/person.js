'use strict';


class Person {

	labeledImages = {}

	constructor(name,imageUrl){
		this.name = name;
		this.labelFace(imageUrl)
	}


	async labelFace(imageUrl){
		console.log("Attempting to Label Face for "+this.name)

		const image = await faceapi.fetchImage(imageUrl);

		const result = await faceapi.detectSingleFace(image)
			.withFaceLandmarks()
			.withFaceDescriptor()

		if (result){
			console.log("Found Labeled Face for "+this.name)
			this.labeledImages[imageUrl] = image
			this.faceDescription = new faceapi.LabeledFaceDescriptors(this.name,[result.descriptor]);
			return 
		}

		throw new Error(`No Face Dectected for ${name}`) 
	}
}


export { Person }