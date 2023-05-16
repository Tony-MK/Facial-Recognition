'use strict';


const SSD_MOBILE_NET = "SSD Mobile Net Version 1"
const MTCNN = "Multi-Task Cascaded Convolutional Neural Network"
const TINY_FACE_DECTECTOR = "Tiny Face Detector"

var modelOptions = {

 	SSD_MOBILE_NET : new faceapi.SsdMobilenetv1Options({
	  minConfidence: 0.5,// confidence Thershold - default: 0.5
	  maxResults: 20,// maximum number of faces to return - default: 100
	}),



	TINY_FACE_DECTECTOR : new faceapi.TinyFaceDetectorOptions({
		 // The smaller the faster but less precise in detecting smaller faces, must be divisible by 32, common sizes are 128, 160, 224, 320, 416, 512, 608.
		 // For face tracking via webcam,I would recommend using smaller sizes, e.g. 128, 160, for detecting smaller faces use larger sizes, e.g. 512, 608
		  inputSize: 416,// size at which image is processed - default: 416
		  scoreThreshold: 0.5, //  minimum confidence threshold -  default: 0.5
	}),

 	MTCNN : new faceapi.MtcnnOptions({
		maxNumScales: 15,
		scaleFactor: 0.709, 
		scoreThresholds:  [0.6, 0.7, 0.7],
		minFaceSize: 25,
	}),

}

export { SSD_MOBILE_NET,MTCNN,TINY_FACE_DECTECTOR,modelOptions}
