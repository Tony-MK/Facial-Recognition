

const export video = document.getElementById("inputVideo");
const export canvas = document.getElementById("overlay");
const export statusDiv = document.getElementById("statusDiv");
const detectButton = document.getElementById("detectButton");
const clearButton = document.getElementById("clearButton");
const snapshotButton = document.getElementById("snapShotButton")

let export isDetecting = false;


function export cameraIniti(){
	setStatus("Loading Camera....", "info");
	if (navigator){
		if (navigator.vendor.indexOf("Google") > -1){
			navigator.getUserMedia({video:{}},s=>{video.srcObject = s},(err) =>{console.error(err)})
			return
		}else if (navigator.userAgent.indexOf("Mozilla/") == 0){
			navigator.mozGetUserMedia({video:{}},s=>{video.srcObject=s},(err) =>{console.error(err)})
			return
		}
		document.getElementById("content").innerHTML = `<h2 class="error">Navigator Error </h2><p>Failed to get user media ${navigator.vendor}</p>`;
		console.error(`${navigator.vendor.indexOf("Google")} is not found as a vendor`)
	}else{
		document.getElementById("content").innerHTML = '<h2 class="error">Navigator is Not Supported</h2><p>Your browser is old and have navigator module. To solve this issue, kindly upgrade your browser</p>';
		
	}
}


snapshotButton.onclick = () =>{
	setStatus("Taking SnapShot...", "success")
	dectectFaces();
}


detectButton.onclick = () =>{
	if(isDetecting){detectButton.innerHTML = "Start Detecting Faces"}
	else{detectButton.innerHTML = "Stop Detecting Faces"}
	isDetecting = !isDetecting;
	runFaceDectection();
}

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

