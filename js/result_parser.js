'use strict';

const MILLISECONDS_IN_YEAR = 31556926000;
const NO_VALUE_FOUND = "N/A"

function resultParser(result){

	this.res = result

	this.parseBirthDate = () => {
		if (this.res.age !== undefined && typeof(this.res.age) === "number"){
			var birthDate = new Date(Date.now()-(this.res.age*MILLISECONDS_IN_YEAR))
			birthDate = birthDate.toDateString().split(" ")
			return `${birthDate[1]} ${birthDate[3]}`
		}
		return NO_VALUE_FOUND;
	}
	this.parseExpression = () => {
		if (this.res.expressions === undefined){return NO_VALUE_FOUND}
		let likelyExp = this.res.expressions.asSortedArray()[0]
		return `${likelyExp.expression[0].toUpperCase()+likelyExp.expression.slice(1,likelyExp.expression.length)} (${Math.round(likelyExp.probability*100)} %)`
	}
	this.parseGender = () => {

		if (this.res.gender == undefined){return NO_VALUE_FOUND}
		return `${this.res.gender[0].toUpperCase()+this.res.gender.slice(1,this.res.gender.length)} (${Math.round(this.res.genderProbability*100)} %)`
	}

 	this.parseAge = () => {
		if(typeof(this.res.age) === "number" ){return `${Math.round(this.res.age)}`}
		return NO_VALUE_FOUND;
	}

}

export { resultParser}
