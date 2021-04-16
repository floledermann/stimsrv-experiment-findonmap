
const parameterController = require("stimsrv/controller/parameterController");
const valOrFunc = require("stimsrv/util/valOrFunc");

const resource = require("stimsrv/util/resource");

let pick = require("stimsrv/util/pickProperties");

const leafletMapOptions = [
  "attributionControl","zoomControl","closePopupOnClick","zoomSnap","zoomDelta",
  "boxZoom","doubleClickZoom","dragging","crs","minZoom","maxZoom","maxBounds",
  "zoomAnimation","zoomAnimationThreshold","fadeAnimation","markerZoomAnimation",
  "inertia","inertiaDeceleration","inertiaMaxSpeed","easeLinearity","maxBoundsViscosity",
  "keyboard","keyboardPanDelta","scrollWheelZoom","wheelDebounceTime","wheelPxPerZoomLevel",
  "tap","tapTolerance","touchZoom","bounceAtZoomLimits"
]

let slippyMapRenderer = function(config) {
  
  // Leaflet reference
  let L = null;
  let map = null;
  
  return {
    initialize: function(parent, stimsrv, context) {
      
      if (!L) L = require("leaflet");
      
      parent.innerHTML = `<link rel="stylesheet" href="/static/task/slippymap/leaflet.css"/>  `;
      
      let document = parent.ownerDocument;
      
      let mapEl = document.createElement("div");
      mapEl.className = "slippymap";
      mapEl.id = "slippymap";
      mapEl.style.width = "100%";
      mapEl.style.height = "100%";
      parent.appendChild(mapEl);
      
      let mapOptions = pick(config, leafletMapOptions);
      if (config.interaction === false) {
        Object.assign(mapOptions, {
          boxZoom: false,
          doubleClickZoom: false,
          dragging: false,
          zoomControl: false,
          scrollWheelZoom: false,
          touchZoom: false,
          keyboard: false
        });
      }
      
      map = L.map('slippymap', mapOptions);
      L.tileLayer(config.tiles.tileURL, config.tiles).addTo(map);
      
      map.attributionControl.setPrefix("");
            
      let zoom = valOrFunc(config.initialZoom, context);
      if (zoom && typeof zoom == "number") {
        map.setZoom(config.initialZoom);
      }
      
      let initialPosition = valOrFunc(config.initialPosition, context);
      if (initialPosition && Array.isArray(initialPosition)) {
        map.setView(config.initialPosition);
      }
      
    },
    render: function(condition) {
      if (condition.initialZoom) map.setZoom(condition.initialZoom);
      if (condition.initialPosition) map.setView(condition.initialPosition);     
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

function slippyMapTask(config) {
  
  config = Object.assign({}, DEFAULTS, config);
  // do we want to use separate parameters object?
  //config.parameters = Object.assign({}, DEFAULTS.parameters, config.parameters);
  
  if (!(config.tiles?.tileURL)) {
    console.error("Slippymap task: config.tiles.tileURL must be specified!");
  }

  let renderer = slippyMapRenderer(config);
  
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

slippyMapTask.renderer = slippyMapRenderer;

module.exports = slippyMapTask;