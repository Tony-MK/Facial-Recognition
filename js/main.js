'use strict';


import { 
	addPersonButton,
	canvas,
	calculateEuclideanDistance,
	cameraIniti,
	clearCanvas,
	clearStatus,
	clearButton,
	controlButtons,
	peopleDiv,
	detectButton,
	detectionView,
	video,
	setStatus,
	imageInput
} from "./header.js"

import { Person } from "./person.js"

let maxFaceLabelDistance = 0.3; // Maxiuim Euclidean Distance between two different face labels

let Initializated = false;
let isDetecting = false;
let isRecongizingFaces = true;
let extractFaces  = true;
let renderInformation = true;
let renderConfidence = true;
let renderSentence = false;
window.people = {}

//Settings
document.querySelector('input[name="renderInformation"]').onclick = () => {renderInformation = !renderInformation;}
document.querySelector('input[name="extractSetting"]').onclick = () => {extractFaces = !extractFaces;}
document.querySelector('input[name="recognizeSetting"]').onclick = () => {isRecongizingFaces = !isRecongizingFaces;}
document.querySelector('input[name="renderSentence"]').onclick = () => {renderSentence = !renderSentence;}
document.querySelector('input[name="renderConfidence"]').onclick = () => {renderConfidence = !renderConfidence;}


var readFile = (file,onload) => {
	var reader = new FileReader();
	reader.onload = onload;
	reader.readAsDataURL(file);
}

addPersonButton.addEventListener("click",()=>{imageInput.click()});
imageInput.change(async (event) => {
	let prevHTML = addPersonButton.innerHTML ;
	if (event.target.files){
		for (var i = event.target.files.length - 1; i >= 0; i--) {
			addPersonButton.innerHTML = `Reading ${event.target.files[i].name}`;
			let image = document.createElement("img")
			image.src = URL.createObjectURL(event.target.files[i]);
			addPersonButton.innerHTML = `Finding Faces in ${event.target.files[i].name}`;

			const results = await faceapi.detectAllFaces(image)
				.withFaceLandmarks()
				.withFaceExpressions()
				.withFaceDescriptors()
				.withAgeAndGender()

			addPersonButton.innerHTML = `Extracting Faces in ${event.target.files[i].name}`;
			const faces = await faceapi.extractFaces(image,results.map((res) => res.detection));
			for (var i = faces.length - 1; i >= 0; i--) {
				let isCopy = false;
				for(var personID in window.people){
					if(window.people[personID].isTheSame(results[i].descriptor,maxFaceLabelDistance)){
						addPersonButton.innerHTML = `ERROR: Face ${i+1}/${faces.length} is similiar to ${window.people[personID].name}`;
						window.people[personID].update(results[i]);
						isCopy = true;
						break;
					}
				}
				if (isCopy){continue;}

				let faceImage = document.createElement("img")
				faceImage.src = faces[i].toDataURL("image/png")

				var person = new Person(
						"Unkwnown Person",
						faceImage,
						results[i].age,
						results[i].descriptor,
						results[i].expressions,
						results[i].gender,
						results[i].genderProbability
					)
				addPersonButton.innerHTML = "Successfully added person";
				window.people[person.id] = person
			}
		}
	}
	addPersonButton.innerHTML = prevHTML;
	renderPeople()
});
detectButton.onclick = () =>{
	if(isDetecting){
		detectButton.innerHTML = "Resume Detecting Faces";
		detectButton.setAttribute("class","btn-success");
		isDetecting = false;
		return;
	}
	detectButton.setAttribute("class","btn-warning");
	detectButton.innerHTML = "Stop Detecting Faces";
	runFaceDectection();	
}




import { resultParser } from "./result_parser.js"


const MODEL_PATH = '/js/vendor/face-api.js/weights/';

const DEFAULT_MTCNN_OPTIONS = {
// number of scaled versions of the input image passed through the CNN
  // of the first stage, lower numbers will result in lower inference time,
  // but will also be less accurate
  maxNumScales: 10,
  // scale factor used to calculate the scale steps of the image
  // pyramid used in stage 1
  scaleFactor: 0.709,
  // the score threshold values used to filter the bounding
  // boxes of stage 1, 2 and 3
  scoreThresholds: [0.6, 0.7, 0.7],
  // mininum face size to expect, the higher the faster processing will be,
  // but smaller faces won't be detected
  // limiting the search space to larger faces for webcam detection
  minFaceSize: 200,
}

const mtcnnForwardParams = {
	maxNumScales: 10,
	scaleFactor: 0.01, 
	scoreThresholds: [0.8, 0.9, 0.95],
	minFaceSize: 10000,
}
const MtcnnOptions = new faceapi.MtcnnOptions(DEFAULT_MTCNN_OPTIONS);

var runFaceDectection = async () => {
	isDetecting = true;
	while (isDetecting) {
		await renderResults(await faceapi.detectAllFaces(video,MtcnnOptions)
			.withFaceLandmarks()
			.withFaceExpressions()
			.withFaceDescriptors()
			.withAgeAndGender()
		)
	}
}



function findBestMatch(descriptor){
	let bestMatch,leastDist,nMatches;
	for(var index in window.people){
		const dist = window.people[index].calculateEuclideanDistance(descriptor);
		if (dist < maxFaceLabelDistance){
			nMatches++;
			if (leastDist === undefined || leastDist < dist ){
				console.warning("Found ",nMatches,"Matches for ",bestMatch.name,"Dist: ",dist);
				bestMatch = window.people[index];
				leastDist = dist;
			}
		}
	}
	return bestMatch,leastDist
}
function recogonizeFace(result){
	let person,distance = findBestMatch(result.descriptor);
	if (person !== undefined){
		person.update(result);
		result.euclideanDistance = distance;
		result.gender,result.genderProbability = person.getGender();
		result.age = person.age;
		result.personName = person.name;
	}
	return result
}

function validateResults(results){
	if(results == undefined){
		setStatus("Failed to Dectect Faces because Dectection Results is type of undefined", "error")
		return false
	}else if (results.length == 0){
		setStatus("No Faces Dectected","warning");
		return false
	}
	return true
}

async function displayResult(result){
	if(!renderInformation){return}
	// Drawing Box around Faces
	await new faceapi.draw.DrawBox(result.detection.box,{color:"blue"}).draw(canvas);
   	
   	if (renderConfidence){
   		//Rendering Confidence
   		await new faceapi.draw.DrawTextField([`${faceapi.round(result.detection.classScore*100)} %`],result.detection.box.topRight,{color:"blue"}).draw(canvas);
  	 }

	// Rendering Detection Details
	let textArray,rParser = new resultParser(result)
	if (renderSentence){
		await new faceapi.draw.DrawTextField(
			[`${result.personName === undefined ? "":result.personName+` (${result.euclideanDistance}) `}${rParser.parseAge()} year old ${rParser.parseExpression()} ${rParser.parseGender()} and born on ${rParser.parseBirthDate()}`],
			result.detection.box.bottomLeft,
			{color:"blue"}
		).draw(canvas);
		return;

	}
	textArray = [];

	if (result.personName !== undefined){
		textArray.push(`NAME:${result.personName} (${Math.round(result.euclideanDistance* 100) /100})`);
	}
	textArray.push(`AGE: ${rParser.parseAge()} (${rParser.parseBirthDate()})`);
		textArray.push(`MOOD: ${rParser.parseExpression()}`);
		textArray.push(`GENDER: ${rParser.parseGender()}`);
	await new faceapi.draw.DrawTextField(textArray,result.detection.box.topLeft,{color:"blue"}).draw(canvas);
}

async function  renderResults(results){
	clearCanvas();
	if (!validateResults(results)){return}
	let faces = undefined;
	if (extractFaces){
		detectionView.innerHTML = "";
		faces = await faceapi.extractFaces(video,results.map((res) => res.detection))
	}
	faceapi.resizeResults(results, canvas).forEach(async (result,index) => {
		if (isRecongizingFaces){displayResult(recogonizeFace(result));return}
			displayResult(result);

		if (faces !== undefined){
			let rParser =  new resultParser(result);

			detectionView.innerHTML += `
				<div class="col-sm-6 person"> 
			 		<img class="img-fluid" src="${faces[index].toDataURL()}"/>
			 		<p><b>AGE:</b> ${rParser.parseAge()}</p>
			 		<p><b>GENDER:</b> ${rParser.parseGender()}</p>
			 		<p><b>MOOD:</b> ${rParser.parseExpression()}</p>
			 		<p><b>BIRTHDATE:</b> ${rParser.parseBirthDate()}</p>
			 	</div>`
		}

	});
	setStatus("Ready for Facial Dectection", "success");
}


var renderPeople = () =>{
	peopleDiv.innerHTML = ""
	for(var personID in people){
		peopleDiv.innerHTML += people[personID].generateHTML()
		people[personID].setInputListener()
	}
}

var initi = async () => {
	console.log(faceapi.nets)
	await faceapi.loadMtcnnModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded MCTNN Model `,"success")})
	await faceapi.loadSsdMobilenetv1Model(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded SSD Moblie Net Model `,"success")})
	await faceapi.loadFaceLandmarkModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Landmark Model `,"success")})
	await faceapi.loadFaceRecognitionModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Recongition Model `,"success")})
	await faceapi.loadFaceExpressionModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Expression Model `,"success")})
	await faceapi.nets.ageGenderNet.load(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Age and Gender Model `,"success")});

	await cameraIniti();
	setStatus("Initalizing Dectetion...", "info");

	await faceapi.detectAllFaces(video,MtcnnOptions)
	clearCanvas();
	
}
setStatus("Initalizing Appilcation...", "info");

initi();





