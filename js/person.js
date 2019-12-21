'use strict';
const MILLISECONDS_IN_YEAR = 31556926000;
const MALE = "male"
const FEMALE = "female"
const DEFAULT_MAX_EUCLIDEAN_DISTANCE = 0.6
const NO_VALUE_FOUND = "N/A"
const EXPRESSION_MAJORITY_FRACTION = 0.5000001
function create_UUID(){
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
import { recognitionView } from "./header.js"

class Person {
	descriptor = [];

	calculateEuclideanDistance = (descriptionIndex,targetDescriptor) => {
		let distance = 0;
		for (var embedingIndex = 127; embedingIndex >= 0; embedingIndex--) {
			distance += Math.pow(targetDescriptor[embedingIndex] - this.descriptor[descriptionIndex][embedingIndex],2)
		}
		return Math.sqrt(distance);
	}
	calculateAverageEuclideanDistance = async (descriptor) => {
		let avergeDistance = 0;
		for (var i = this.descriptor.length - 1; i >= 0; i--) {
			avergeDistance += this.calculateEuclideanDistance(i,descriptor)
		}
		return avergeDistance/this.descriptor.length ;
	}

	isTheSame = (descriptor,distance) =>{
		return this.calculateEuclideanDistance(descriptor) < distance
	}

	updateAge = (age) => {
		if (this.age === undefined){
			this.age = age
		}
		else{
			this.age = (this.age+age)/2
		}
	}

	updateGender = (gender,probability) => {
		if (this.genders[gender] === 0){
			this.genders[gender] = probability;
		}else{
			this.genders[gender] = (this.genders[gender]+probability)/2;
		}
	}

	areDescriptorsEqual(descriptionIndex,targetDescriptor){
		for (var embedingIndex = 127; embedingIndex >= 0; embedingIndex--) {
			if(targetDescriptor[embedingIndex] != this.descriptor[descriptionIndex][embedingIndex]){return false;}
		}
		return true
	}
	isNewDescriptor = (targetDescriptor) => {
		for (var i = this.descriptor.length - 1; i >= 0; i--) {
			if (this.areDescriptorsEqual(i,targetDescriptor)){return false;}
		}
		return true
	}

	updateDescriptors = (newDescriptor) => {
		this.descriptor.shift(newDescriptor)
	};


	updateExpressions = (newExpressions) => {
		this.expressions = newExpressions;
		for(var exp in newExpressions){
			this.overallExperssions[exp] = (this.overallExperssions[exp] + newExpressions[exp])/2
		}
	}

	getGender = () => { 
		if(this.genders[MALE] > this.genders[FEMALE]){
			return MALE
		}else if(this.genders[MALE] < this.genders[FEMALE]){
			return FEMALE
		}
	}
	getLikelyExpression = (expressions) => {
		let expression,probability;
		for(var exp in expressions){
			if (expressions[exp] > EXPRESSION_MAJORITY_FRACTION){
				return exp,expressions[exp];
			}
			else if (probability === undefined || expression[exp] > probability ){
				expression  = exp;
				probability = expression[exp];
			}
		}
		return expression
	}

	getExpression = () =>{
		return this.getLikelyExpression(this.expressions)
	}
	
	getOverallExpression = () =>{ 
		return this.getLikelyExpression(this.overallExpressions)
	}
	
	parseExpression = () => {
		let expression = this.getLikelyExpression(this.expressions)
		if (expression === undefined){
			return`${NO_VALUE_FOUND}`;
		}
		return `${expression} (${this.expressions[expression]}) `;
	}
	parseExpression = () => {
		let expression = this.getLikelyExpression(this.expressions);
		if (expression === undefined){
			return`${NO_VALUE_FOUND}`;
		}
		return `${expression} (${this.expressions[expression]}) `;
	}

	parseGender = () => {
		let gender = this.getGender()
		if (gender === undefined){
			return NO_VALUE_FOUND;
		}
		return `${gender[0].toUpperCase() + gender.slice(1,gender.length)} (${Math.round(this.genders[gender]*100)}%)`
	}

	parseAge = () => {
		if(this.age === undefined){
			return NO_VALUE_FOUND;
		}
		return `${Math.round(this.age)}`
	}

	

	parseBirthYear = () => {
		if(this.age === undefined){
			return NO_VALUE_FOUND;
		}
		return new Date(Date.now()-(this.age*MILLISECONDS_IN_YEAR)).toDateString().split(" ")[3]
	}
	generateCanvas = () => {return 0;}
	generateContent = () => {
		return `	
				<img class="img-fluid" src="${this.image.src}"/>
		 		<input type="text" id="${this.id}" value="${this.name}"/>
		 		<hr>
		 		<p><b>AGE: </b> ${this.parseAge()} (${this.parseBirthYear()})</p>
		 		<p><b>GENDER: </b> ${this.parseGender()}</p>
		 		<p><b>EXPRESSION: </b> ${this.parseExpression()}</p>
			 `
	}
	renderContent = () => {
		recognitionView.innerHTML += `<div id="${this.id}_div" class="col-sm-6 person"> ${this.generateContent()} </div>`;
		this.Element = document.getElementById(this.id+"_div")
		document.getElementById(`${this.id}`).addEventListener("keydown",(event) => {this.name  = event.srcElement.value});
	}
	update(result){
		if (result.descriptor !== undefined){this.updateDescriptors(result.descriptor)}
		if (result.gender !== undefined){this.updateGender(result.gender,result.genderProbability);}
		if (result.age !== undefined){this.updateAge(result.age);}
		if (result.expressions !== undefined){this.updateExpressions(result.experssions);}
		this.Element.innerHTML = this.generateContent()
	}

	async generateDescription(image){
		const result = await faceapi.detectSingleFace(image).withFaceLandmarks().withFaceDescriptor()
		if (result){
			this.updateDescriptors(result.descriptor)
			return result;
		}
		throw new Error(`No Face Dectected for ${this.name}`) 
	}

	constructor(name,image,age,descriptor,expressions,gender,genderProbability){
		if (image !== undefined){
			this.generateDescription(image);
		}
		if(descriptor !== undefined){
			this.updateDescriptors(descriptor)
		}

		this.name = name;
		this.id = create_UUID()
		this.image = image
		this.age = age;
		this.expressions = expressions;
		this.genders = {"male":0,"female":0};
		if (typeof(genderProbability) === "number"){
			this.genders[gender] = genderProbability;
		}
	}
}




export { Person }