'use strict';

export {
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
}

var calculateEuclideanDistance = (x,y) => {
	let dist = 0;
	for (var i = x.length - 1; i >= 0; i--) {dist += Math.pow(x[i] - y[i],2)}
	return Math.sqrt(dist);
}


const video = document.getElementById("inputVideo");
const canvas = document.getElementById("overlay");
const statusDiv = document.getElementById("statusDiv");
const videoDiv = document.getElementById("videoDiv");

const controlButtons = document.getElementById("controlButtons")
const detectButton = document.getElementById("startButton");
const detectionView = document.getElementById("detectionView");

const clearButton = document.getElementById("clearButton"); clearButton.onclick = () =>{clearCanvas();}
const addPersonButton = document.getElementById("addPerson")
const imageInput = $("#imageInput")

const peopleDiv = document.getElementById('recognizedPeople')


var buttons = []
var activePanel = "detection";
var panelButtons = ["detection","recongition","settings"]

var enablePanel = (panelName) => {
	disablePanel(activePanel);
	document.getElementById(panelName+"Button").setAttribute("class","active")
	document.getElementById(panelName+"Panel").removeAttribute("hidden")
	activePanel = panelName;
}

var disablePanel = (panelName) => {
	document.getElementById(panelName+"Button").removeAttribute("class");
	document.getElementById(panelName+"Panel").setAttribute("hidden", "true");
}

enablePanel(activePanel)
panelButtons.forEach((id,index)=> {
	document.getElementById(id+"Button").onclick = (e) => {enablePanel(e.srcElement.parentNode.id.slice(0,e.srcElement.parentNode.id.indexOf("Button")));}
})


video.onresize = () => {
	canvas.width = video.offsetWidth;
	canvas.height = video.offsetHeight;
	videoDiv.height = canvas.height;
	videoDiv.width = canvas.width
}

window.onresize = () =>{
	video.onresize();
}




function openCamera(){
	if (navigator.getUserMedia){
		navigator.getUserMedia({video:{}},s=>{video.srcObject = s},(err) =>{console.error(err)})
	}else if (navigator.mediaDevices.getUserMedia){
		navigator.mediaDevices.getUserMedia({video:{}},s=>{video.srcObject=s},(err) =>{console.error(err)})
	}else{
		document.getElementById("content").innerHTML = `<h2 class="error">Navigator Error </h2><p>Failed to get user media ${navigator.vendor}</p>`;
		console.info(navigator)
		throw new Error(`Failed to get user media devices from navigator.`);
	}
}

function cameraIniti(){
	if (navigator){openCamera();return}
	document.getElementById("content").innerHTML = `<h2 class="error">Navigator is Not Supported</h2><p>Your browser is old and have navigator module. To solve this issue, kindly upgrade your browser</p>`;
}

var clearCanvas = () => {
	// Clearing Drawings on  Canvas 
	canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);
}

var clearStatus = () =>{
	statusDiv.innerHTML = ""
}

var setStatus = (status,type,elem) => {
	if (elem === undefined){
		statusDiv.innerHTML = `
			<p> ${(new Date()).toTimeString().split(" ")[0]} : 
				<b class="${(type === undefined || typeof(type) !== "string") ? "text-info":"text-"+type}">${(type === "error") ? "ERROR: "+status: status}</b>
			</p>`;
	}
}






