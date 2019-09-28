'use strict';

const MILLISECONDS_IN_YEAR = 31556926000;
const NO_VALUE_FOUND = "N/A"

function resultParser(result){

	this.res = result

	this.parseBirthDate = () => {
		if (typeof(this.res.age) === "number"){
			var birthDate = new Date(Date.now()-(this.res.age*MILLISECONDS_IN_YEAR))
			birthDate = birthDate.toDateString().split(" ")
			return `${birthDate[1]} of ${birthDate[3]}`
		}
		return NO_VALUE_FOUND;
	}

	this.parseExpression = (index) => {
		const expression = Object.keys(result.expressions)[index]
		return `${expression[0].toUpperCase()+expression.slice(1,expression.length)} (${Math.floor(this.res.expressions[expression]*100)} %)`
	}
	this.parseGender = () => {
		if (this.res.gender == undefined){return NO_VALUE_FOUND}
		return `${this.res.gender[0].toUpperCase()+this.res.gender.slice(1,this.res.gender.length)} (${Math.floor(this.res.genderProbability*100)} %)`
	}

 	this.parseAge = () => {
		if(typeof(this.res.age) === "number" ){return `${Math.floor(this.res.age)}`}
		return NO_VALUE_FOUND;
	}

}

export { resultParser}
