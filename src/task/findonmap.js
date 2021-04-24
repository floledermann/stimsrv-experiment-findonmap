
const parameterController = require("stimsrv/controller/parameterController");

const htmlButtons = require("stimsrv/ui/htmlButtons");

const resource = require("stimsrv/util/resource");

const slippyMapRenderer = require("./slippymap.js").renderer;

const html = `
<style>
.modal {
  display: none;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 500;
  background-color: rgba(255,255,255,1.0);
  color: #444444;
  padding-top: 40vh;
  text-align: center;
}

.dialog {
  display: none;
  position: absolute;
  top: 20px;
  z-index: 500;
  background-color: rgba(255,255,255,0.9);
  padding: 3px 90px;
  border: 1px solid rgba(0,0,0,0.15);
  border-radius: 10px;
  color: #444444;
}
</style>
<div class="modal"><span class="label"></span><button>Start</button></div>
<div class="dialog"><span class="label"></span><button class="found">I found it</button><button class="notfound">I cannot find it</button></div>
`;

let findOnMapRenderer = function(config) {

  let slippyMap = slippyMapRenderer(config);

  let modal = null;
  let modalLabel = null;

  let dialog = null;
  let dialogLabel = null;
  let foundItButton = null;

  let currentTarget = null;
  // Leaflet reference
  let L = null;

  return {

    initialize: function(parent, stimsrv, context) {

      if (!L) L = require("leaflet");

      slippyMap.initialize(parent, stimsrv, context);
      let map = slippyMap.getMap();

      parent.insertAdjacentHTML('beforeend', html);

      modal = parent.querySelector(".modal");
      modalLabel = modal.querySelector(".label");

      dialog = parent.querySelector(".dialog");
      dialogLabel = dialog.querySelector(".label");

      modal.querySelector("button").addEventListener("click", function(event) {
        modal.style.display = "none";
        dialog.style.display = "block";
      });

      foundItButton = dialog.querySelector("button.found");
      foundItButton.addEventListener("click", function(event) {

        dialogLabel.innerHTML = "Please click on the map where you found " + currentTarget.name + ".";
        foundItButton.style.display = "none";
        map.getContainer().style.cursor = "pointer";

        map.on("click", mapClick);

        function mapClick(event) {
          map.off("click", mapClick);
          let b = currentTarget.bounds;
          let targetArea = L.latLngBounds([b[1],b[0]],[b[3],b[2]]);
          if (targetArea.contains(event.latlng)) {
            stimsrv.response({success:true, clickCoords: event.latlng});
          }
          else {
            stimsrv.response({success:false, clickCoords: event.latlng});
          }
        }
      });

      dialog.querySelector("button.notfound").addEventListener("click", function(event) {
        stimsrv.response({givenUp: true, success:false});
        dialog.style.display = "none";
      });

    },
    render: function(condition) {

      slippyMap.render(condition);

      currentTarget = condition.target;

      foundItButton.style.display = "inline";
      slippyMap.getMap().getContainer().style.cursor = null;

      modalLabel.innerHTML = "Please find: <strong>" + condition.target.name + "</strong> in " + condition.target.townName;
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

function findOnMapTask(config) {

  config = Object.assign({}, DEFAULTS, config);

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
    resources: monitorMap.resources
  }
}

module.exports = findOnMapTask;