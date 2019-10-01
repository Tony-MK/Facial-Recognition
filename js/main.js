'use strict';


import { cameraIniti,detectButton,peopleDiv,controlButtons,recognizeToggle,video,canvas,setStatus,clearCanvas } from "./header.js"
import { Person } from "./person.js"

var Initializated = false;



let isDetecting = false;
let isRecongizingFaces = false;


addPersonButton.onclick = () => {
	addPersonButton.load
}
detectButton.onclick = () =>{
	if(isDetecting){detectButton.innerHTML = "Resume Detecting Faces";isDetecting = false}
	else{detectButton.innerHTML = "Stop Detecting Faces";isDetecting = true;runFaceDectection();}
	
}

recognizeToggle.onclick = () => {isRecongizingFaces = !isRecongizingFaces;}

import { resultParser } from "./result_parser.js"


const MODEL_PATH = '/js/face-api.js/weights/';

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
	maxNumScales: 1,
	scaleFactor: 0.01, 
	scoreThresholds: [0.8, 0.9, 0.95],
	minFaceSize: 10000,
}
 
const MtcnnOptions = new faceapi.MtcnnOptions(DEFAULT_MTCNN_OPTIONS);


var FacialExperssionConfindenceLimit = 0.8

var models = {
	"SSD MobileNet": faceapi.loadSsdMobilenetv1Model,
	"Face Landmarks": faceapi.loadFaceLandmarkModel,
	"Face Recognition": faceapi.loadFaceRecognitionModel,
	"Face Expression": faceapi.loadFaceExpressionModel,
	"MCTNN":faceapi.loadMtcnnModel,
}



var modelsToLoad = [
	"SSD MobileNet",
	"Face Landmarks",
	"Age and Gender",
	"Face Expression",
	"Face Recognition",
	"MCTNN"
]

var people = []
// Maxiuim Euclidean Distance between two different face labels
var maxFaceLabelDistance = 0.6;

var runFaceDectection = async () => {
	while (isDetecting) {await detectFaces()}
}

var extractFaces = async () => {
	const results = await faceapi.detectAllFaces(video,MtcnnOptions)
			.withFaceLandmarks()
			.withFaceExpressions()
			.withFaceDescriptors()
			.withAgeAndGender()
	console.log(results)

}
async function detectFaces(){

	const results = await faceapi.detectAllFaces(video,MtcnnOptions)
			.withFaceLandmarks()
			.withFaceExpressions()
			.withFaceDescriptors()
			.withAgeAndGender()
	await renderResults(results)
	renderPeople();
}

var calculateEuclideanDistance = (x,y) => {
	let dist = 0;
	for (var i = x.length - 1; i >= 0; i--) {dist += Math.pow(x[i] - y[i],2)}
	return Math.sqrt(dist);
}

function addPersonFromResult(result){
	let imgs = faceapi.extractFaces(video,result.detection)
	console.table(imgs);
	people.shift(new Person(result.personName,URL.createObjectURL(imgs[0])));
}

function recogonizeFaces(results){
	var numberofUnknownPeople = 0
	results.forEach((result)=> {
		let person;
		for(var index in people){
			person = people[index]
			if (person.isTheSame(result.descriptor)){
				person.update(result);
				result.gender,result.genderProbability = person.getGender();
				result.age = person.age;
				result.personName = person.name;
				recoginzedFaces.shift(result)
				return;
			}
		}
		numberofUnknownPeople += 1;
		result.personName = `Unknown ${numberofUnknownPeople}`
	});
	return results
}

function renderResults(results){
	clearCanvas();
	if (!validateResults(results)){return}
	if (isRecongizingFaces){results = recogonizeFaces(results)}
	faceapi.resizeResults(results, canvas).forEach((result) => {displayResult(result)});
	setStatus("Ready for Facial Dectection", "success");
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
	// Drawing Box
	await new faceapi.draw.DrawBox(result.detection.box,{color:"blue"}).draw(canvas);
   	
   	//Rendering Confidence
   	await new faceapi.draw.DrawTextField(
		[`${faceapi.round(result.detection.classScore*100)} %`],
		result.detection.box.topLeft,
	    {color:"blue"},
	).draw(canvas);

	// Rendering Detection Details
	let rParser = new resultParser(result)
   	await new faceapi.draw.DrawTextField(
   		[`${result.personName} ${rParser.parseAge()} year old ${rParser.parseExpression()} ${rParser.parseGender()} and born on ${rParser.parseBirthDate()}`],
   	result.detection.box.bottomLeft
   	).draw(canvas)
}

var renderPeople = () =>{
	peopleDiv.innerHTML = ""
	people.forEach(person => {peopleDiv.innerHTML += person.generateHTML()});
}

var initi = async () => {

	modelsToLoad.forEach(async (modelName) => {
		if (models[modelName] !== undefined){
			if (modelName === "SSD MobileNet"){
				models[modelName](MODEL_PATH).then(()=>{
					setStatus(`Successfully Loaded ${modelName} Model `,"success");
					people.push(new Person("Antony","/labeled_faces/Antony.jpg",maxFaceLabelDistance))
				})
			}
			else{
				setStatus(`Successfully Loaded ${modelName} Model `,"success");
					await models[modelName](MODEL_PATH).then(()=>{
						setStatus(`Successfully Loaded ${modelName} Model `,"success");
					})
				}
		}
		else if (modelName === "Age and Gender"){
			await faceapi.nets.ageGenderNet.load(MODEL_PATH).then(()=>{
				setStatus(`Successfully Loaded ${modelName} Model `,"success");
			})
		}else{
			console.warn("Cannot load model: "+modelName)
		}
	})


	setStatus("Initializating Camera....", "info");
	await cameraIniti();
	setStatus("Initalizing Facial Dectection...", "info");
	await detectFaces();
	clearCanvas();
 	setStatus("Loading Modules...", "info");
	
}

initi();





