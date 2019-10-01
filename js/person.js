'use strict';

const MALE = "male"
const FEMALE = "female"
const DEFAULT_MAX_EUCLIDEAN_DISTANCE = 0.6
const NO_VALUE_FOUND = "N/A"


class Person {

	isTheSame = (descriptor) =>{return this.calculateEuclideanDistance(descriptor) < this.maxEuclideanDistance}

	calculateEuclideanDistance = (descriptor) => {
		let dist = 0;
		for (var i = 127; i >= 0; i--) {dist += Math.pow(this.descriptor[i] - this.descriptor[i],2)}
		return Math.sqrt(dist);
	}


	updateAge = (age) => {
		if (this.age === null){this.age = age;return;}
		this.age = (this.age+age)/2;
	}

	updateGender = (gender,probability) => {
		if (this.genders[gender] === 0){this.genders[gender] = probability;return}
		this.genders[gender] = (this.genders[gender]+probability)/2
	}

	updateDescriptor = (newDescriptor) => {
		if (this.descriptor === undefined){this.descriptor = newDescriptor;return}
		descriptor.forEach((val,i) => {this.descriptor[i] = (this.newDescriptor[i]+val)/2})
	}

	updateExpressions = (newExpressions) => {
		if (this.expressions === undefined){this.expressions = newExpressions;return};
		for(var expression in newExpressions){
			this.expressions[expression] += (this.expressions[expression] + newExpressions[expression])/2
		}
	}

	getMostLikleyExpression = () => {
		if (this.expressions === undefined){getMostLikleyExpression
			let expression = NO_VALUE_FOUND;
			let probability = 0;
			for(var exp in this.expressions){
				if (this.expressions[exp] > probability){
					expression = exp;
					this.expressions[exp] = probability;
				}
			}
			return expression,probability
		}
		return NO_VALUE_FOUND,100
	}

	getGender = () => { 
		if(this.genders[MALE] < this.genders[FEMALE]){return FEMALE, this.gender[FEMALE]}
		if(this.genders[MALE] > this.genders[FEMALE]){return MALE, this.gender[MALE]}
		return NO_VALUE_FOUND, 100

	}
	
	expressionToString = () => {
		let expression,probability = this.getExpression()
		return `${expression.toUpperCase()+expression.slice(1,expression.length)} (${Math.round(probability*100)} %)`
	}

	ageToString = () => {
		if(this.age === null){return NO_VALUE_FOUND;}
		return `${Math.round(this.age)}`
	}

	genderToString = () => {
		let gender,probability = this.getGender()
		return `${gender[0].toUpperCase()+gender.slice(1,gender.length)} (${Math.round(genderProbability*100)} %)`
	}

	birthdateToString = () => {
		if(this.age === null){return NO_VALUE_FOUND;}
		var birthDate = new Date(Date.now()-(this.age*MILLISECONDS_IN_YEAR)).toDateString().split(" ")
		return `${birthDate[1]} of ${birthDate[3]}`
	}

	generateHTML = () => {
		return `<div class="col-sm-3"> 
			 	<img class="img-fluid" src="${this.image.src}"> <img/>
			 	<p class="">${this.name}</div> 
			 </div>`
	}

	async update(result){
		if (result.descriptor !== undefined){await this.updateDescriptor(result.descriptor)}
		if (result.gender !== undefined){await this.updateGender(result.gender,result.genderProbability);}
		if (result.age !== undefined){await this.updateAge(result.age);}
		if (result.expressions !== undefined) await this.updateExpressions(result.experssions);
	}


	

	async generateDescription(image){
		console.log("Labeling Face for ",this.name)
		const result = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
		if (result){
			console.log("Found Labeled Face for "+this.name)
			this.updateDescriptor(result.descriptor)
			return;
		}
		throw new Error(`No Face Dectected for ${this.name}`) 
	}

	async setImage(imageUrl){
		const image = await faceapi.fetchImage(imageUrl);
		this.generateDescription(image);
		this.image = image
	}

	setMaxEuclideanDistance = (distance) => {
		switch(typeof(distance)){
			case "number":
				this.maxEuclideanDistance = distance;
				break;
			case "undefined":
				this.maxEuclideanDistance = DEFAULT_MAX_EUCLIDEAN_DISTANCE;
				break;
			default:
				throw new Error(`Unexpected type ${typeof(distance)} (${distance}) for maxEuclideanDistance. Expected maxEuclideanDistance to be a number or undefined.`);
				break;
		}
	}
	constructor(name,imageUrl,maxEuclideanDistance,age,descriptor,expressions,gender,genderProbability){
		this.name = name;
		this.setMaxEuclideanDistance(maxEuclideanDistance);
		this.setImage(imageUrl);

		this.age = age;
		this.descriptor = descriptor;
		this.expressions = expressions;
		this.genders = {"male":0,"female":0};
		if (typeof(genderProbability) === "number"){
			this.genders[gender] = genderProbability;
		}
	}
}


export { Person }