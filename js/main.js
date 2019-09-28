'use strict';
import { cameraIniti,date,snapshotButton,detectButton,video,canvas,setStatus,clearCanvas,clearStatus } from "./main_header.js"

snapshotButton.onclick = () =>{
	setStatus("Taking SnapShot...", "success")
	dectectFaces();
}

let isDetecting = false;
detectButton.onclick = () =>{
	if(isDetecting){detectButton.innerHTML = "Start Detecting Faces"}
	else{detectButton.innerHTML = "Stop Detecting Faces"}
	isDetecting = !isDetecting;
	runFaceDectection();
}


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
	"Age and Gender",
	"Face Expression",
	"MCTNN"
]


var runFaceDectection = async () => {
	setStatus("Dectecting Faces...", "success")
	do {
		await dectectFaces();
	}
	while (isDetecting)
}


var dectectFaces = async() => {
	const results = await faceapi.detectAllFaces(video,MtcnnOptions)
		.withFaceExpressions()
		.withAgeAndGender()
	await displayResults(results,"Mtcnn").then(()=>{
		setStatus("Ready for Face Dectection", "success");
	})
	
}

function validateResults(results){
	setStatus("Validating Dectection Results....")	
	if(results == undefined){
		setStatus("Failed to Dectect Faces because Dectection Results is type of undefined.", "error")
		return false
	}else if (results.length == 0){
		setStatus("No Faces Dectected.","warning");
		return false
	}
	return true
}



async function displayResults(results){
	clearCanvas();
	if (validateResults(results)){
		setStatus("Found "+results.length.toString()+" Faces.","info");
		//setStatus("Resizing Faces....");

		results = faceapi.resizeResults(results, canvas)
		//setStatus("Rendering Detections....");

      	for (var i = results.length - 1; i >= 0; i--) {
      		setStatus(`Rendering Face ${i} out of ${results.length}`);
      		// Drawing Box
      		await new faceapi.draw.DrawBox(results[i].detection.box,{color:"blue"}).draw(canvas);
		   	
		   	//Rendering Confidence
		   	await new faceapi.draw.DrawTextField(
				[`${faceapi.round(results[i].detection.classScore*100)} %`],
				results[i].detection.box.topLeft,
			    {color:"blue"},
			).draw(canvas);

			// Rendering Detection Details
			let rParser = new resultParser(results[i])
		   	await new faceapi.draw.DrawTextField(
		   		[`${rParser.parseAge()} year old ${rParser.parseExpression(0)} ${rParser.parseGender()} and born on ${rParser.parseBirthDate()}`],
		   	results[i].detection.box.bottomLeft
		   	).draw(canvas)
		   	
		 }
    }
	
}


var initi =  ()=> {

	modelsToLoad.forEach(async (modelName) => {
		if (models[modelName] !== undefined){await models[modelName](MODEL_PATH)}
		else if (modelName === "Age and Gender"){await faceapi.nets.ageGenderNet.load(MODEL_PATH)}
		else{console.warn("Cannot load model: "+modelName)}
		setStatus(`Successfully Loaded ${modelName} Model `,"success");
	})
	setStatus("Initializating Camera....", "info");
	cameraIniti();
	setStatus("Initalizing Face Dectection...", "success");
	dectectFaces();
	clearCanvas();
}




initi();


