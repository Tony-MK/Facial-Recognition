'use strict';


//JQuery $
import {$,jQuery} from "./vendor/jquery-3.4.1.mjs"
window.$ = $
window.jQuery = jQuery

// HTML Elements
window.video = document.getElementById("inputVideo");
window.canvas = document.getElementById("overlay");
window.statusDiv = document.getElementById("statusDiv");
window.videoDiv = document.getElementById("videoDiv");
window.detectButton = document.getElementById("startDetectionButton");
window.clearButton = document.getElementById("clearButton");
window.addPersonButton = $.("#addPerson")
window.recognizeToggle = document.querySelector('input[name="recognizeToggle"]')
window.peopleDiv = document.getElementById('people')
window.controlButtons = document.getElementById("controlButtons")

console.info("Creating Global Variables");