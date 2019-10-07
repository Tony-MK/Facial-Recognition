'use strict';
import { canvas,canvasContext,controlButtons,cameraIniti,clearCanvas,clearStatus,detectButton,detectionView,pauseDetectButton,video,videoInput,startUpView,setStatus} from "./header.js"
import { Person } from "./person.js"
import { resultParser } from "./result_parser.js"

const MODEL_PATH = '/js/vendor/face-api.js/weights/';
const DEFAULT_MTCNN_OPTIONS = {
  //  number of scaled versions of the input image passed through the CNN of the first stage, lower numbers will result in lower inference time, but will also be less accurate
  maxNumScales: 10,
  // scale factor used to calculate the scale steps of the image pyramid used in stage 1
  scaleFactor: 0.709,
  // the score threshold values used to filter the bounding boxes of stage 1, 2 and 3
  scoreThresholds: [0.6, 0.7, 0.7],
  // mininum face size to expect, the higher the faster processing will be,but smaller faces won't be detected,limiting the search space to larger faces for webcam detection
  minFaceSize: 50,
}

const mtcnnForwardParams = {
	maxNumScales: 15,
	scaleFactor: 0.709, 
	scoreThresholds:  [0.6, 0.7, 0.7],
	minFaceSize: 25,
}
let MtcnnOptions = new faceapi.MtcnnOptions(mtcnnForwardParams);
let maxFaceLabelDistance = 0.4; // Maxiuim Euclidean Distance between two different face labels
let Initializated = false;
let runningFaceDectection = false;
let isRecongizingFaces = true;
let extractFaces  = true;
let renderOnCanvas = true;
let renderConfidence = true;
let renderSentence = false;

window.people = {}

//Settings
document.querySelector('input[name="extractSetting"]').onclick = () => {extractFaces = !extractFaces;}
document.querySelector('input[name="recognizeSetting"]').onclick = () => {isRecongizingFaces = !isRecongizingFaces;}

document.querySelector('input[name="renderOnCanvas"]').onclick = () => {renderOnCanvas = !renderOnCanvas;}
document.querySelector('input[name="renderSentence"]').onclick = () => {renderSentence = !renderSentence;}
document.querySelector('input[name="renderConfidence"]').onclick = () => {renderConfidence = !renderConfidence;}
document.getElementById("webCamButton").onclick = () => {cameraIniti();}


const isVideoEnded = (video.currentTime == video.duration)

var getCurrentFrame = (callback) =>{
	video.pause()
	canvasContext.drawImage(video,0,0);
	canvas.toBlob((blob) => {
		let frame = document.createElement("img")
		frame.src = URL.createObjectURL(blob);
		callback(frame);
	});
	clearCanvas();
	if(video.currentTime < video.duration){
		video.play();
	}
}

var playVideo = () => {
	if(video.currentTime < video.duration){
		video.play();
	}
}

video.addEventListener("timeupdate",async () => {
	if(runningFaceDectection){
		video.pause();
		await renderResults(await faceapi.detectAllFaces(video,MtcnnOptions).withFaceLandmarks().withFaceExpressions().withFaceDescriptors().withAgeAndGender())
		playVideo();
	}
},false);

pauseDetectButton.onclick = () => {
	if(runningFaceDectection){
		detectButton.removeAttribute("hidden")
		pauseDetectButton.setAttribute("hidden","true");
		runningFaceDectection = false;
	}
}
detectButton.onclick = () =>{
	if(runningFaceDectection){return;}
	pauseDetectButton.removeAttribute("hidden")
	detectButton.setAttribute("hidden","true");
	runningFaceDectection = true;

}



var runFaceDectection = async () => {
	while (runningFaceDectection) {
		await renderResults(await faceapi.detectAllFaces(video,MtcnnOptions)
			.withFaceLandmarks()
			.withFaceExpressions()
			.withFaceDescriptors()
			.withAgeAndGender()
		)
	}
}



function findBestMatch(descriptor,callback){
	let bestMatch,nMatches = 0;
	for(var personID in window.people){
		const distance = window.people[personID].calculateAverageEuclideanDistance(descriptor);
		if (distance < maxFaceLabelDistance){
			nMatches+= 1;
			if (bestMatch === undefined){
				bestMatch = {"person":window.people[personID],"distance":distance};
				continue;
			}
			if(bestMatch.distance < dist){
				bestMatch = {"person":window.people[personID],"distance":distance}
			};
			console.warning("Found ",nMatches," Face Matches with distance for ",distance, ". Best Match :",bestMatch.person.name);
		}
	}
	return bestMatch;
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

async function renderResults(results){
	clearCanvas();
	if (!validateResults(results)){return}
	let faces = undefined;
	if (extractFaces){
		detectionView.innerHTML = "";
		faces = await faceapi.extractFaces(video,results.map((res) => res.detection))
		if (faces.length > 0){
			detectionView.innerHTML += `<div class="row dectections"><p>${video.currentTime} </p></div>`
		}
	}



	faceapi.resizeResults(results, canvas).forEach((result,index) => {
		if (isRecongizingFaces){
			const match = findBestMatch(result.descriptor);
			if (match !== undefined){
				match.person.update(result);

				if (renderOnCanvas){
					result.euclideanDistance = match.distance;
					result.gender = match.person.getGender();
					result.genderProbability = match.person[result.gender]
					result.age = match.person.age;
					result.personName = match.person.name;
					displayResult(result);
				}

				if (faces !== undefined){setDectectionToContentHTML(faces[index],result)}; 
				return;
			}
		}

		if (renderOnCanvas){displayResult(result)}
		if (extractFaces){setDectectionToContentHTML(faces[index],result)}; 
		return;
	

	});
	setStatus("Ready for Facial Dectection", "success");
}
var setDectectionToContentHTML = (face,result) =>{
	let rParser =  new resultParser(result);
	detectionView.innerHTML += `
		<div class="col-sm-6 person"> 
	 		<img class="img-fluid" src="${face.toDataURL()}"/>
	 		<p><b>NAME:</b> ${result.personName === undefined ? "Unknown Person" :result.personName} </p>
	 		<p><b>AGE:</b> ${rParser.parseAge()}</p>
	 		<p><b>GENDER:</b> ${rParser.parseGender()}</p>
	 		<p><b>MOOD:</b> ${rParser.parseExpression()}</p>
	 		<p><b>BIRTHDATE:</b> ${rParser.parseBirthDate()}</p>
	 	</div>`
}
var loadModels = async () => {
	await faceapi.loadMtcnnModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded MCTNN Model `,"success")})
	await faceapi.loadSsdMobilenetv1Model(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded SSD Moblie Net Model `,"success")})
	await faceapi.loadFaceLandmarkModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Landmark Model `,"success")})
	await faceapi.loadFaceRecognitionModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Recongition Model `,"success")})
	await faceapi.loadFaceExpressionModel(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Face Expression Model `,"success")})
	await faceapi.nets.ageGenderNet.load(MODEL_PATH).then(()=>{setStatus(`Successfully Loaded Age and Gender Model `,"success")});
	setStatus("Await Video Source...", "info");

}

var initDectetion = async () => {
	await setStatus("Initalizing Dectetion...", "info");
	await document.getElementsByTagName("section")[0].removeAttribute("hidden")
	startUpView.hidden = "true";
	
	await faceapi.detectSingleFace(video,MtcnnOptions);


	await clearCanvas();
	await setStatus("Ready...", "success")

}




setStatus("Initalizing Appilcation...", "info");
loadModels();




document.getElementById("webcamSelect").onclick = (e) => {cameraIniti();initDectetion()}
document.getElementById("videoSelect").onclick = (e) => {
	videoInput.change(event => {
		if (event.target.files && event.target.files[0]){
			video.src = "./videos/"+event.target.files[0].name;
			initDectetion();
			videoInput.change(event => {if (event.target.files && event.target.files[0]){video.src = "./videos/"+event.target.files[0].name;}});
		}
	});
	videoInput.click();
	
}






