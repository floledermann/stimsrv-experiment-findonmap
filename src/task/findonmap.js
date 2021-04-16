
const parameterController = require("stimsrv/controller/parameterController");

const htmlButtons = require("stimsrv/ui/htmlButtons");

const resource = require("stimsrv/util/resource");

const slippyMapRenderer = require("./slippymap.js").renderer;

let findOnMapRenderer = function(config) {
  
  let slippyMap = slippyMapRenderer(config);
  
  let modal = null;
  let dialog = null;
  
  let modalLabel = null;
  let modalButton = null;
  
  let dialogLabel = null;
  let foundItButton = null;
  let cannotFindItButton = null;
  
  function appendChild(parent, tagName, className, style) {
    let el = parent.ownerDocument.createElement(tagName);
    el.className = className;
    Object.assign(el.style, style);
    parent.appendChild(el);
    return el;
  }
  
  let stimsrv = null;
  
  return {
    
    initialize: function(parent, _stimsrv, context) {
      
      stimsrv = _stimsrv;
      
      slippyMap.initialize(parent, _stimsrv, context);
      
      let document = parent.ownerDocument;
      
      modal = appendChild(parent, "div", "modal", {
        display: "none",
        width: "100%",
        height: "100%",
        position: "absolute",
        zIndex: "500",
        backgroundColor: "rgba(255,255,255,1.0)",
        color: "#444444",
        paddingTop: "40vh",
        textAlign: "center",
      });
      
      modalLabel = appendChild(modal, "span", "label");
      modalButton = appendChild(modal, "button");
      modalButton.innerHTML = "Start";
      modalButton.addEventListener("click", function(event) {
        //experiment.logEvent({type: 'button_click'});
        modal.style.display = "none";
        dialog.style.display = "block";
        event.stopPropagation();
      });               
            
      dialog = appendChild(parent, "div", "dialog", {
        display: "none",
        position: "absolute",
        top: "20px",
        zIndex: "500",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: "3px 90px",
        border: "1px solid rgba(0,0,0,0.15)",
        borderRadius: "10px",
        color: "#444444",
      });
      
      dialogLabel = appendChild(dialog, "span", "label");
      
      foundItButton = appendChild(dialog, "button");
      foundItButton.innerHTML = "I found it!";
      
      cannotFindItButton = appendChild(dialog, "button");
      cannotFindItButton.innerHTML = "I cannot find it!";
      cannotFindItButton.addEventListener("click", function(event) {
        stimsrv.response({givenUp: true});
        dialog.style.display = "none";
        event.stopPropagation();
      });               
      
    },
    render: function(condition) {
      
      slippyMap.render(condition);
      
      modalLabel.innerHTML = "Please find: <strong>" + condition.target.name + "</strong>";
      modal.style.display = "block";

      dialogLabel.innerHTML = "Please find: <strong>" + condition.target.name + "</strong>";
      dialog.style.display = "none";

    }
  }    
}

const DEFAULTS = {
  tiles: null, // tiles must be specified by experiment
  minZoom: 0,
  maxZoom: 20,
  initialPosition: [0,0],
  initialZoom: 6,
}

// ignore __dirname in browser
let dirname = "";
try { dirname = __dirname; } catch(e) {}

function findOnMapTask(config) {
  
  config = Object.assign({}, DEFAULTS, config);
  // do we want to use separate parameters object?
  //config.parameters = Object.assign({}, DEFAULTS.parameters, config.parameters);
  
  if (!(config.tiles?.tileURL)) {
    console.error("Slippymap task: config.tiles.tileURL must be specified!");
  }

  let renderer = findOnMapRenderer(config);
  
  let monitorMap = slippyMapRenderer(Object.assign({},config,{interaction: false}));
    
  return {
    name: "slippymap",
    description: "Interactive (slippy) map",
    ui: function(context) {
      return {
        interfaces: {
          display: renderer,
          response: null,
          monitor: renderer,
          control: null,
        }
      }
    },
    controller: parameterController({parameters: config}),
    resources: resource(dirname, "resources")
  }
}

module.exports = findOnMapTask;