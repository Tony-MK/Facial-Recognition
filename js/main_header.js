'use strict';


const video = document.getElementById("inputVideo");
const canvas = document.getElementById("overlay");
const statusDiv = document.getElementById("statusDiv");
const detectButton = document.getElementById("detectButton");
const clearButton = document.getElementById("clearButton");
const snapshotButton = document.getElementById("snapShotButton")
let date = new Date();


function openCamera(){
	if (navigator.vendor.indexOf("Google") > -1){
		navigator.getUserMedia({video:{}},s=>{video.srcObject = s},(err) =>{console.error(err)})
	}else if (navigator.userAgent.indexOf("Mozilla/") == 0){
		navigator.mozGetUserMedia({video:{}},s=>{video.srcObject=s},(err) =>{console.error(err)})
	}else{
		document.getElementById("content").innerHTML = `<h2 class="error">Navigator Error </h2><p>Failed to get user media ${navigator.vendor}</p>`;
		console.error(`${navigator.vendor.indexOf("Google")} is not found as a vendor`)
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

var setStatus = (status,type) => {
	statusDiv.innerHTML = `
		<h4 class="${(type === undefined || typeof(type) !== "string") ? "text-info":"text-"+type}">
			${(type === "error") ? "ERROR: "+status: status} <p class"text-info"> (${date.toTimeString().split(" ")[0]} )</p>
		</h4>`;
}

export { cameraIniti,date,snapshotButton,detectButton,video,canvas,setStatus,clearCanvas,clearStatus}


clearButton.onclick = () =>{ 
	clearCanvas();
}

video.onresize = () => {
	canvas.width = video.offsetWidth;
	canvas.height = video.offsetHeight;
}

window.onresize = () =>{
	video.onresize();
}


