'use strict';
import { canvas,canvasContext,controlButtons,cameraIniti,clearCanvas,setSourceName,clearStatus,detectButton,detectionView,pauseDetectButton,video,videoInput,startUpView,setStatus} from "./header.js"
import { Person } from "./person.js"
import { resultParser } from "./result_parser.js"
import { SSD_MOBILE_NET,MTCNN,TINY_FACE_DECTECTOR,modelOptions} from "./model_options.js"

const MODELS_DIRECTORY = '/js/vendor/face-api.js/weights/';
export let maxFaceLabelDistance = 0.25; // Maxiuim Euclidean Distance between two different face labels


var currentFaceDectetionModel = SSD_MOBILE_NET;

let runningFaceDectection = false;
let isRecongizingFaces = true;
let isDectectingExpressions = true;
let isDectectingAgeAndGender = true;
let isExtractingFaces  = true;
let renderOnCanvas = true;
let renderConfidence = true;
let renderSentence = false;

window.people = {}

//Settings
document.querySelector('input[name="extractSetting"]').onclick = () => {isExtractingFaces = !isExtractingFaces;}
document.querySelector('input[name="recognizeSetting"]').onclick = () => {isRecongizingFaces = !isRecongizingFaces;}
document.querySelector('input[name="ageGenderSetting"]').onclick = () => {isDectectingAgeAndGender = !isDectectingAgeAndGender;}
document.querySelector('input[name="expressionSetting"]').onclick = () => {isDectectingExpressions = !isDectectingExpressions;}


document.querySelector('input[name="renderOnCanvas"]').onclick = () => {renderOnCanvas = !renderOnCanvas;}
document.querySelector('input[name="renderSentence"]').onclick = () => {renderSentence = !renderSentence;}
document.querySelector('input[name="renderConfidence"]').onclick = () => {renderConfidence = !renderConfidence;}
document.getElementById("webCamButton").onclick = cameraIniti


pauseDetectButton.onclick = () => {
	if(runningFaceDectection){
		detectButton.removeAttribute("hidden")
		pauseDetectButton.setAttribute("hidden","true");
		runningFaceDectection = false;
		setStatus("On Pause...", "info");

	}
}
detectButton.onclick = () =>{
	if(runningFaceDectection){return;}
	setStatus("Dectecting Faces...", "success");
	pauseDetectButton.removeAttribute("hidden")
	detectButton.setAttribute("hidden","true");
	runningFaceDectection = true;

}

var loadVideo = (event) =>{
	if (event.target.files && event.target.files[0]){
		
		video.removeAttribute("srcOject");
		video.setAttribute("src","./videos/"+event.target.files[0].name);
		setSourceName(event.target.files[0].name);
	}
}

document.getElementById("webcamSelect").onclick = (e) => {
	cameraIniti();
	initDectetion();
}
document.getElementById("videoSelect").onclick = (e) => {
	videoInput.change(event => {
			loadVideo(event);
			initDectetion();
			videoInput.change(loadVideo)
	});
	videoInput.click();
}


var getCurrentFrame = (callback) =>{
	video.pause()
	canvasContext.drawImage(video,0,0);
	canvas.toBlob((blob) => {
		let frame = document.createElement("img")
		frame.src = URL.createObjectURL(blob);
		callback(frame);
	});
	clearCanvas();
	playVideo();
}

var playVideo = () => {
	if(video.currentTime < video.duration){
		video.play();
	}
}


var getFaceDectections = async (callback) =>{
	// ALL
	if(isDectectingExpressions && isDectectingAgeAndGender && isRecongizingFaces){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withFaceLandmarks()
			.withFaceDescriptors()
			.withFaceExpressions()
			.withAgeAndGender().then(results => callback(results));
			
	// TWO
	}else if (isDectectingExpressions && isRecongizingFaces && !isDectectingAgeAndGender){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withFaceExpressions()
			.withFaceLandmarks()
			.withFaceDescriptors().then(results => callback(results));

	}else if(isDectectingAgeAndGender && isRecongizingFaces && !isDectectingExpressions){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withAgeAndGender()
			.withFaceLandmarks()
			.withFaceDescriptors().then(results => callback(results));

	}else if(isDectectingExpressions && isDectectingAgeAndGender && !isRecongizingFaces){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withFaceLandmarks()
			.withFaceDescriptors()
			.withFaceExpressions().then(results => callback(results));

	// ONE 
	}else if (isDectectingExpressions && !isRecongizingFaces && !isDectectingAgeAndGender){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withFaceExpressions();

	}else if(isDectectingAgeAndGender && !isRecongizingFaces && !isDectectingExpressions){
		await faceapi.detectAllFaces(video,options)
			.withAgeAndGender().then(results => callback(results));

	}else if(isRecongizingFaces && !isDectectingAgeAndGender && !isDectectingExpressions){
		await faceapi.detectAllFaces(video,modelOptions[currentFaceDectetionModel])
			.withFaceLandmarks()
			.withFaceDescriptors().then(results => callback(results));

	}else{
		setStatus("Dectection Error","error")
		throw new Error(`Cannot Get Face Detection Results isDectectingExpressions: ${isDectectingExpressions} isRecongizingFaces: ${isRecongizingFaces} isDectectingAgeAndGender: ${isDectectingAgeAndGender}`);
	}
}


video.addEventListener("timeupdate",() => {
	if(runningFaceDectection){getFaceDectections(renderResults)}
},false);



function findBestMatch(descriptor,callback){
	let bestMatch = undefined
	let nMatches = 0;
	for(var personID in window.people){
		console.log(personID)
		const distance = window.people[personID].calculateAverageEuclideanDistance(descriptor);
		console.info("Distance:", distance,maxFaceLabelDistance)
		if (distance < maxFaceLabelDistance){
			nMatches+= 1;
			if (bestMatch === undefined){
				bestMatch = {"person":window.people[personID],"distance":distance};
				continue;
			}
			if(bestMatch.distance < distance){
				bestMatch = {"person":window.people[personID],"distance":distance}
			};
			console.warning("Found ",nMatches," Face Matches with distance for ",distance, ". Best Match :",bestMatch.person.name);
		}
	}
	return bestMatch;
}

function validateResults(results){
	if(typeof(results) !== "object"){
		console.log("Failed to Dectect Faces because Dectection Results is type of "+typeof(results))
		return false
	}else if (results.length == 0){
		setStatus("Failed to Dectect any Face","warning");
		return false
	}
	setStatus(`Dectected ${results.length} Faces`, "success");

	return true
}

async function renderResultAsSentence(result,rParser) {
	// Rendering Detection Details as Sentence
	await new faceapi.draw.DrawTextField([
		`${result.personName === undefined ? "":result.personName+` (${Math.round(computeDistanceDifferencePercentage(result.euclideanDistance))} %)`}
			${result.age === undefined? "": rParser.parseAge()+"year old ("+rParser.parseBirthDate()+")"} 
			${rParser.parseExpression()} ${rParser.parseGender()}`
		],
		result.detection.box.bottomLeft,
		boxOptions
	).draw(canvas);
}


function computeDistanceDifferencePercentage(distance){
	return (distance/maxFaceLabelDistance)*100

}
async function displayResult(result){


	let boxOptions = {color:"red"}
	if (result.personName !== undefined && result.personName !== "Unknown" ){
		boxOptions.color = "blue"
  	}

	// Drawing Box around Faces
	await new faceapi.draw.DrawBox(
		result.detection.box,
		boxOptions
	).draw(canvas);
   	
   	//Rendering Confidence

   	if (renderConfidence){
   		
   		await new faceapi.draw.DrawTextField(
   			[`${faceapi.round(result.detection.classScore*100)} %`],
   			result.detection.box.topRight,
   			boxOptions,
   		).draw(canvas);
  	 }


	
	let rParser = new resultParser(result)
	if (renderSentence){
		renderResultAsSentence(result,rParser)
		return
	}


	let textArray = [];
	if (result.personName !== undefined){
		textArray.push(`NAME:${result.personName} (${faceapi.round(computeDistanceDifferencePercentage(result.euclideanDistance))} %)`);
	}
	if(result.age !== undefined){
		textArray.push(`AGE: ${rParser.parseAge()} (${rParser.parseBirthDate()})`);
	}
	if(result.expressions !== undefined){
		textArray.push(`MOOD: ${rParser.parseExpression()}`);
	}
	if (result.gender !== undefined){
		textArray.push(`GENDER: ${rParser.parseGender()}`);
	}

	await new faceapi.draw.DrawTextField(
		textArray,
		result.detection.box.topLeft,
		boxOptions
	).draw(canvas);
}

var parseSeconds = (seconds) => {
	const mins = Math.floor(video.currentTime/60)
	return ` ${mins} Minutes and ${Math.round((seconds-mins)*100)/100} Seconds`
}
async function renderResults(results){
	clearCanvas();
	if (!validateResults(results)){
		return
	}

	const faces = await faceapi.extractFaces(video,results.map((res) => res.detection))


	faceapi.resizeResults(results, canvas).forEach(async (result,index) => {

		await displayResult(result)


		if (isRecongizingFaces){

			const match = findBestMatch(result.descriptor);
			if (match !== undefined){
				match.person.update(result);
				result.euclideanDistance = match.distance;
				result.gender = match.person.getGender();
				result.genderProbability = match.person[result.gender]
				result.age = match.person.age;
				result.personName = match.person.name;
			}
		}

		

		if (isExtractingFaces){

			if (index === 0){
				detectionView.innerHTML = ""
			}

			setDectectionToContentHTML(faces[index],result)
		};

		
		
		return;
	

	});

	
	setStatus("Ready...", "success");
}
var setDectectionToContentHTML = (face,result) =>{
	let rParser =  new resultParser(result);
	detectionView.innerHTML += `
		<div class="person row"> 
			<div class="col-sm-3">
	 			<img class="img-fluid" src="${face.toDataURL()}"/>
	 		</div>
	 		<hr>
	 		<div class="col-sm-9">
		 		<p><b>NAME:</b> ${result.personName === undefined ? "Unknown Person" :result.personName} </p>
		 		<p><b>AGE:</b> ${rParser.parseAge()}</p>
		 		<p><b>GENDER:</b> ${rParser.parseGender()}</p>
		 		<p><b>MOOD:</b> ${rParser.parseExpression()}</p>
		 		<p><b>BIRTHDATE:</b> ${rParser.parseBirthDate()}</p>
		 	</div>
	 	</div>`
}

var loadModels = async() => {
	setStatus("Loading Models....", "info")
	await faceapi.loadMtcnnModel(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded MCTNN Model","success")});
	await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded Tiny Face Landmark Model","success")});
	await faceapi.loadSsdMobilenetv1Model(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded SSD Moblie Net Model`","success")});
	await faceapi.loadFaceLandmarkModel(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded Face Landmark Model","success")});
	await faceapi.loadFaceRecognitionModel(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded Face Recongition Model","success")});
	await faceapi.loadFaceExpressionModel(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded Face Expression Model","success")});
	await faceapi.nets.ageGenderNet.load(MODELS_DIRECTORY).then(()=>{setStatus("Successfully Loaded Age and Gender Model","success")});
}
	
var initDectetion =  () => {
	document.getElementsByTagName("section")[0].removeAttribute("hidden")
	startUpView.hidden = "true";
	setStatus("Initalizing Facial Dectetion...", "info");
	faceapi.detectSingleFace(video,modelOptions[currentFaceDectetionModel]).then(()=>{
		console.info("Test Resutls:",result)
		clearCanvas();
		setStatus("Ready...", "success")
	});
}

var init = () =>{
	setStatus("Initalizing App...", "info");
	loadModels().then(() => {
		setStatus("App Successfully Loaded","success");
	});
}


init();






