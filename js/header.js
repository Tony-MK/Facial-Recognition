'use strict';

export {
	canvas,
	cameraIniti,
	pauseDetectButton,
	clearCanvas,
	clearStatus,
	canvasContext,
	controlButtons,
	recognitionView,
	detectButton,
	detectionView,
	video,
	videoInput,
	startUpView,
	setStatus,
	setSourceName,
}

import {Person} from "./person.js"
import {maxFaceLabelDistance} from "./main.js"
var isNewPerson = (result) => {
	for(var personID in window.people){
		if(window.people[personID].isTheSame(result.descriptor,maxFaceLabelDistance)){
			window.people[personID].update(result);
			return false;
		}
	}
	return true;
}


var createPerson = (result,face) => {
	if(isNewPerson(result)){
		const faceImage = document.createElement("img")
		faceImage.src = face.toDataURL("image/png");
		const person = new Person("Unknown",faceImage,result.age,result.descriptor,result.expressions,result.gender,result.genderProbability)
		window.people[person.id] = person;
	}
}
var createPeopleFromImageFile = async (image_file) =>{

	let image = document.createElement("img")
	image.src = URL.createObjectURL(image_file);

	const results = await faceapi.detectAllFaces(image)
		.withFaceLandmarks()
		.withFaceExpressions()
		.withFaceDescriptors()
		.withAgeAndGender()

	const faces = await faceapi.extractFaces(image,results.map((res) => res.detection));
	results.forEach((result,index) => {createPerson(index,faces[index])})
		
}




// Views
const detectionView = document.getElementById("detectionView");
const recognitionView = document.getElementById('recognitionView');
const startUpView = document.getElementById("startUpView");

// Canvas - Render Facial Dectection 
const canvas = document.getElementById("overlay");
var canvasContext = canvas.getContext('2d')
canvas.onmouseenter = () => {canvas.style.zIndex = video.style.zIndex -2;}

// Playback Media
const video = document.getElementById("playback")
video.onmouseleave = () => {canvas.style.zIndex = 1000;};

const statusDiv = document.getElementById("statusDiv");
const videoDiv = document.getElementById("videoDiv");
const sourceName = document.getElementById("sourceName"); 
var setSourceName = (name) => { sourceName.innerHTML = name}
const controlButtons = document.getElementById("controlButtons")
const detectButton = document.getElementById("startButton");
const pauseDetectButton = document.getElementById("pauseButton")



const videoInput = $("#videoInput");
document.getElementById("videoUpload").addEventListener("click" ,() => {videoInput.click()});


const imageInput = $("#imageInput");
imageInput.change(event => {
	if (event.target.files){
		for (var i = 0; i < event.target.files.length ; i++) {
			createPeopleFromImageFile(event.target.files[i]);
		}
	}
});


// Buttons

document.getElementById("addPerson").addEventListener("click",()=>{imageInput.click()});
document.getElementById("clearButton").onclick = () =>{clearCanvas();}


//Panels
var activePanel = "detection";
var enablePanel = (panelName) => {
	document.getElementById(panelName+"Button").setAttribute("class","active")
	document.getElementById(panelName+"Panel").removeAttribute("hidden")
	
}

var disablePanel = (panelName) => {
	document.getElementById(panelName+"Button").removeAttribute("class");
	document.getElementById(panelName+"Panel").setAttribute("hidden", "true");
}


["detection","recongition","settings"].forEach((id,index)=> {
	document.getElementById(id+"Button").onclick = (e) => {
		disablePanel(activePanel);
		activePanel = e.srcElement.parentNode.id.slice(0,e.srcElement.parentNode.id.indexOf("Button"));
		enablePanel(activePanel);
	}
});

enablePanel(activePanel) /// ATIVATES ACTIVE PANEL WHEN DOCUMENT IS LOADED


video.onresize = () => {
	canvas.width = video.offsetWidth;
	canvas.height = video.offsetHeight;
	//faceapi.matchDimensions(,canvas) // Resizes Canvas to video  size
	videoDiv.width = video.offsetWidth;
	videoDiv.height = video.offsetHeight;

}
window.onresize = () =>{video.onresize()}

var onSucessStream =  stream => {
	video.removeAttribute("src");
	video.srcObject = stream;
	setSourceName("Web Camera")
}
var handleCrictalError = (error,details) =>{
	document.body.innerHTML += `
			<h2 class="error">${error}</h2>
			<p> ${details}</p>`;

}

const webCamOptions = {
	format: "mp4"
}
var cameraIniti = () =>{
	if (navigator){
		if (navigator.getUserMedia){
			navigator.getUserMedia({video:webCamOptions},onSucessStream,(err) =>{console.error(err)})
		}else if (navigator.mediaDevices.getUserMedia){
			navigator.mediaDevices.getUserMedia({video:webCamOptions},onSucessStream,(err) =>{console.error(err)})
		}else{
			console.info(navigator)
			handleCrictalError("Media Error", "Failed to get user media ${navigator.vendor}");
			throw new Error(`Failed to get user media devices from navigator.`);
		}
	}
	else{
		handleCrictalError("Camera Error","Web Cameras are not supported by your browser To solve this issue, try upgrading your browser to the latest version");	
	}
}


var setStatus = (status,type,elem) => {
	if (elem === undefined){
		statusDiv.innerHTML = `
			<p> ${(new Date()).toTimeString().split(" ")[0]} : 
				<b class="${(type === undefined || typeof(type) !== "string") ? "text-info":"text-"+type}">${(type === "error") ? "ERROR: "+status: status}</b>
			</p>`;
	}
}


var clearCanvas = () => {canvasContext.clearRect(0,0,canvas.width,canvas.height); }// Clearing Detecetion on  Canvas
var clearStatus = () =>{statusDiv.innerHTML = setStatus("Ready","success")} // Clearing Status 





