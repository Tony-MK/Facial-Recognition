'use strict';
const MILLISECONDS_IN_YEAR = 31556926000;
const MALE = "male"
const FEMALE = "female"
const DEFAULT_MAX_EUCLIDEAN_DISTANCE = 0.6
const NO_VALUE_FOUND = "N/A"

function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}

class Person {


	calculateEuclideanDistance = (descriptor) => {
		let dist = 0;
		for (var i = 127; i >= 0; i--) {dist += Math.pow(descriptor[i] - this.descriptor[i],2)}
		return Math.sqrt(dist);
	}

	isTheSame = (descriptor,distance) =>{return this.calculateEuclideanDistance(descriptor) < distance}



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
		this.descriptor.forEach((val,i) => {this.descriptor[i] = (newDescriptor[i]+val)/2})
	}

	updateExpressions = (newExpressions) => {
		if (this.expressions === undefined){this.expressions = newExpressions;return};
		for(var expression in newExpressions){
			this.expressions[expression] += (this.expressions[expression] + newExpressions[expression])/2
		}
	}

	getGender = () => { 
		if(this.genders[MALE] > this.genders[FEMALE]){return MALE}
		if(this.genders[MALE] < this.genders[FEMALE]){return FEMALE}
	}
	getExpression = () => {
		let expression,probability;
		for(var exp in this.expressions){
			if (this.expressions[exp] > 0.501){return exp,this.expressions[exp];}
			else if (probability === undefined || expression[exp] > probability ){
				expression  = exp;
				probability = expression[exp];
			}
		}
		return expression
	}

	expressionToString = () => {
		let expression,probability = this.getExpression();
		if (expression === undefined){expression = NO_VALUE_FOUND,probability = 100;}
		else {probability = this.expressions[expression]}
		return `${expression} (${probability})`
	}
	ageToString = () => {
		if(this.age === null){return NO_VALUE_FOUND;}
		return `${Math.round(this.age)}`
	}

	genderToString = () => {
		let probability, gender = this.getGender()
		if (gender === undefined){gender = NO_VALUE_FOUND,probability = 100}
		else{probability = this.genders[gender]}
		return `${gender[0].toUpperCase() + gender.slice(1,gender.length)} (${Math.round(probability*100)} %)`
	}

	birthdateToString = () => {
		if(this.age === null){return NO_VALUE_FOUND;}
		var birthDate = new Date(Date.now()-(this.age*MILLISECONDS_IN_YEAR)).toDateString().split(" ")
		return `${birthDate[1]} ${birthDate[3]}`
	}

	generateHTML = () => {
		return `<div class="col-sm-6 person"> 

				 	<img class="img-fluid" src="${this.image.src}"/>

			 		<input type="text" id="${this.id}" value="${this.name}"/>
			 		<p><b>AGE:</b> ${this.ageToString()}</p>
			 		<p><b>GENDER:</b> ${this.genderToString()}</p>
			 		<p><b>MOOD:</b> ${this.expressionToString()}</p>
			 		<p><b>BIRTHDATE:</b> ${this.birthdateToString()}</p>
				 </div>`
	}

	setInputListener = () => {
		document.getElementById(`${this.id}`).addEventListener("keydown",(event) => {
			this.name  = event.srcElement.value;
		});
	}

	async update(result){
		if (result.descriptor !== undefined){await this.updateDescriptor(result.descriptor)}
		if (result.gender !== undefined){await this.updateGender(result.gender,result.genderProbability);}
		if (result.age !== undefined){await this.updateAge(result.age);}
		if (result.expressions !== undefined) await this.updateExpressions(result.experssions);
	}

	async generateDescription(image){
		const result = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
		if (result){
			this.updateDescriptor(result.descriptor)
			return result;
		}
		throw new Error(`No Face Dectected for ${this.name}`) 
	}

	constructor(name,image,age,descriptor,expressions,gender,genderProbability){
		this.name = name;
		this.id = create_UUID()
		this.image = image
		this.age = age;
		this.descriptor = descriptor;
		if (this.descriptor == undefined){this.generateDescription(this.image);}

		this.expressions = expressions;
		this.genders = {"male":0,"female":0};
		if (typeof(genderProbability) === "number"){
			this.genders[gender] = genderProbability;
		}
	}
}




export { Person }