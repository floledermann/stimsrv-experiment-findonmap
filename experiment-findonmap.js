
const pause = require("stimsrv/task/pause");

const sequence = require("stimsrv/controller/sequence");

const findonmap = require("./src/task/findonmap.js");   

const locations = require("./target-locations.js");

const tileURL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

pause.defaults({
  background: "#eeeeff",
  textcolor: "#000000",
  buttondisplay: "response",
  style: "max-width: 30em; text-align: justify;"
});

// stimsrv experiment definition
module.exports = {
  
  name: "Find on map",
  description: "This experiment asks the user to find locations on a map, and tracks their map interactions",
  
  tasks: [
  /*
    pause({
      message: "Welcome to his experiment.\nPress 'Continue' when you are ready to start.",
    }),  
    
    pause({
      message: "In this experiment, you will be asked to find ten places on an interactive map. To do so, you may move the map (by 'dragging' with the mouse or sliding with your finger), and zoom in and out (by using the mouse wheel, pinching with two fingers, or by using the provided buttons). If you feel you cannot find a place on the map, you can press the button labeled 'I cannot find the place'.\n\nPress 'Continue' when you are ready to start.",
    }),
 */
    findonmap({
      tiles: {
        tileURL: tileURL,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      },
      minZoom: 12,
      maxZoom: 19,
      initialPosition: sequence(locations.map(l => l.initialPosition)),
      initialZoom: 15,
      target: sequence(locations),
    }),
    
    pause({
      message: {
        display: "The experiment was completed successfully.\nThank you for your participation!",
        monitor: "Experiment ended."
      },
      button: "Store Results & Restart",
      buttondisplay: "control"
    }),
  ]
  
}