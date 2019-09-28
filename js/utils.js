
var export parseBirthDate = (res) => {
	if (typeof(res.age) === "number"){
		var birthDate = new Date()
		birthDate.setTime(Date.now()-(res.age*MILLISECONDS_IN_YEAR))
		return `DATE OF BIRTH: ${birthDate.toDateString()}`
	}
	return "DATE OF BIRTH: N/A"
}

var parseResultDetails = (res) => {
	var details = []
	details.push(parseAge(res));
	details.push(parseGender(res));
	details.push(parseBirthDate(res));
	return pushFacialExpressions(res,details)
}


var pushFacialExpressions = (res,details) => {
	for(var exp in res.expressions){
		if (res.expressions[exp] > FacialExperssionConfindenceLimit){
			details.push(`MOOD: ${exp[0].toUpperCase()+exp.slice(1,exp.length)} (${faceapi.round(res.expressions[exp]*100)} %)`);
			break;
		}
	}
	return details
}

var parseGender = (res) => {
	if (res.gender == undefined){return `GENDER: N/A`}
	return `GENDER: ${res.gender[0].toUpperCase()+res.gender.slice(1,res.gender.length)} (${faceapi.round(res.genderProbability*100)} %)`
}

var parseAge = (res) => {
	if(typeof(res.age) === "number" ){
		return 	`AGE: ${faceapi.round(res.age, 0)}`
	}
	return `AGE: N/A`;
}


var clearCanvas = () => {
	// Clearing Drawings on  Canvas 
	canvasContext.clearRect(0,0,canvas.width,canvas.height);
}

var clearStatus = () =>{
	statusDiv.innerHTML = ""
}
var setStatus = (text) =>{
	statusDiv.innerHTML = `<p class="info">${text}</p>`
} 
var logStatus = (text,type) => {
	logs.innerHTML = `
		<p class="${(type === undefined || typeof(type) !== "string") ? "info":type}">${date.toTimeString().split(" ")[0]} 
			: ${(type === "error") ? "ERROR: "+text: text}</p>`+logs.innerHTML;
}
