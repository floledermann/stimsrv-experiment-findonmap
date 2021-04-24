(function(window) {
    var Experiment = function(config) {
        
        // auto new
        if (this instanceof Experiment) return new Experiment(config);
    
        config = merge({
            preventDefaults: ['contextmenu'],
            captureEvents: ['click','dblclick','touchstart','touchend','mousedown'],
            storage: Experiment.storage.CsvTextStorage({debug:true, name: config.name})
        }, config);
        
        if (config.preventDefaults) {
            for (var i=0; i<config.preventDefaults.length; i++) {
                document.addEventListener(config.preventDefaults[i], function(event) {
                    event.preventDefault();
                });
            }
        }
        
        this.starting_time = Date.now();
        this.starting_time_task = Date.now();
        this.currentTask = null;

        var experiment = this;
        var currentTaskIndex = 0;
        
        this.run = function() {
            
            // Start timer
            this.starting_time = Date.now();
            this.starting_time_task = Date.now();
            
            this.logEvent({type:"session_start"});
            
            for (var i=0; i<config.captureEvents.length; i++) {
                document.addEventListener(config.captureEvents[i], logDomEvent);
            }
                       
            function nextTask() {
                experiment.currentTask = config.tasks[currentTaskIndex++];
                experiment.starting_time_task = Date.now();
                var cb = nextTask;
                if (currentTaskIndex >= config.tasks.length) {
                    cb = function() {
                        config.storage.save();
                    };
                }
                var taskConfig = merge(config.taskDefault, experiment.currentTask);
                var task = new taskConfig.type(experiment, taskConfig, cb);
                task.run();
            }
            
            nextTask();
        }
        
        this.getMainContainer = function() {
            return getOrCreateElement("experimentMain", 'div');
        }
        
        this.getModalContainer = function() {
            return getOrCreateElement("experimentModal", 'div');
        }
        
        this.showModal = function(content, config, callback) {
            config = merge({
                buttons: ["OK"]
            }, config);
            
            createHTMLDialog(this.getModalContainer(), content, config, callback);               
        }
        
        this.hideModal = function() {
            this.getModalContainer().style.display = 'none';
        }
        
        this.getDialogContainer = function() {
            return getOrCreateElement("experimentDialog", 'div');
        }
        
        this.showDialog = function(content, config, callback) {
            config = merge({
                buttons: ["Done"]
            }, config);
            
            createHTMLDialog(this.getDialogContainer(), content, config, callback);     
        }
        
        var createHTMLDialog = function(container, content, config, callback) {
                        
            container.innerHTML = content;
            
            for (var i=0; i<config.buttons.length; i++) {
                var button = document.createElement('button');
                button.__id = i;
                button.innerHTML = config.buttons[i];
                button.addEventListener("click", function(event) {
                    experiment.logEvent({type: 'button_click'});
                    experiment.hideModal();
                    callback(event.target.__id, event.target);
                    event.stopPropagation();
                }.bind(this));               
                container.appendChild(button);
            }
            
            container.style.display = 'block';
            
        }.bind(this);
        
        function logEvent(event) {
        
            var time = Date.now();
            
            event.time_abs = time;
            event.time_rel = time - this.starting_time;
            event.time_task = time - this.starting_time_task;
            
            event.experiment = config.name;
            // TODO
            event.experiment_id = 23;
            event.task = currentTaskIndex;
            
            config.storage.store(event);
        };

       function logDomEvent (e) {
            var event = {
                type: "window_" + e.type
            };
            var current_time = new Date().getTime();
            var timer = current_time - starting_time;
            if (e.pageX) {
                event.x = e.pageX;
                event.y = e.pageY;
                logEvent(event);
            }
            var touches = e.touches;
            if (!touches || touches.length == 0) {
                touches =  e.changedTouches;
            }
            if (touches) {
                for (var i=0; i<touches.length; i++) {
                    var touch = touches[i];
                    event.x = touch.pageX;
                    event.y = touch.pageY;
                    event.touch_n = (i+1);
                    logEvent(event);     
                }
            }
        }
        
        this.logEvent = logEvent;     
        this.logDomEvent = logDomEvent;
        return this;
   
    };   

// ============================================
// Tasks
// ============================================

    Experiment.task = {};
        
    Experiment.task.ModalScreen = function(experiment, config, finishedCB) {
        config = merge({
            text: "Modal Screen",
            buttons: ["OK"]
        }, config);
        
        this.run = function() {           
            experiment.showModal(config.text, config, function() {
                experiment.logEvent({type: 'task_completed'});
                finishedCB();
            });
        }
                
        return this;
    }
    
    var globalMap = null;
    var resetMapFunction = null;
    
    Experiment.task.LocateTarget = function(experiment, config, finishedCB) {
        
        config = merge({
            minZoom: 0,
            maxZoom: 18,
            initialPosition: [0,0],
            initialZoom: 3,
            tileURL: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            captureEvents: ["click","dblclick","mousedown","mouseup","mousemove","dragstart","dragend","touchstart","touchend","touchmove","zoomstart","zoomend"],
            captureDomEvents: ["touchstart","touchend","touchmove","dragstart","dragend"],
            //captureDomEvents: [],
            precision: 6
        }, config);
    
        var map = getMap();       
        resetMap();
        resetMapFunction = resetMap;
        var inDrag = false;
        
        // clear dialog
        experiment.showDialog("",{buttons:[]});
        
        experiment.showModal(
            'Please find: <strong>' + config.targetName + '</strong>',
            {buttons:["START"]},
            function() {
                experiment.logEvent({type:'task_intro_ok'});
                experiment.showDialog(
                    'Please find: <strong>' + config.targetName + '</strong>',
                    { buttons: ["I found it", "I cannot find it"] },
                    function(buttonId) {
                        if (buttonId == 0) {
                            experiment.showDialog(
                                "Please click on the map where you found <em>" + config.targetName + "</em>",
                                { buttons: [] }
                            );
                            document.getElementById("experimentMap").style.cursor = "pointer";
                            globalMap.on("click", mapClick);
                            experiment.logEvent({type:'task_foundit'});
                            function mapClick(event) {
                                globalMap.off("click", mapClick);
                                document.getElementById("experimentMap").style.cursor = "";
                                var b = config.targetBounds;
                                var targetArea = L.latLngBounds([b[1],b[0]],[b[3],b[2]]);
                                if (targetArea.contains(event.latlng)) {
                                    experiment.logEvent({type:'task_result_success'});
                                }
                                else {
                                    experiment.logEvent({type:'task_result_miss'});
                                }
                                finishedCB();
                            };
                        }
                        else {
                            experiment.logEvent({type:'task_result_giveup'});
                            finishedCB();
                        }
                    }
                );
            }
        );
        
        // this function rounds lat/lng number to decimal places specified in config.precision
        var mul = Math.pow(10,config.precision);
        function _precision(num) {
            return Math.round(num * mul)/mul;
        }
                                
        function getMap() {
            if (!globalMap) {
                var mapDiv = document.getElementById("experimentMap");
                
                if (!mapDiv) {
                
                    mapDiv = document.createElement('div');
                    mapDiv.id = 'experimentMap';
                    mapDiv.style.width = '100%';
                    mapDiv.style.height = '100%';
                    
                    experiment.getMainContainer().appendChild(mapDiv);
                }    

                for (var i=0; i<config.captureDomEvents.length; i++) {
                    mapDiv.addEventListener(config.captureDomEvents[i], experiment.logDomEvent);
                }
                
                globalMap = L.map(mapDiv);

                var layer = L.tileLayer(config.tileURL, {
                    minZoom: config.minZoom,
                    maxZoom: config.maxZoom,
                    bounceAtZoomLimits: false,
                    attribution: "&copy; <a href='https://www.mapbox.com/map-feedback/'>Mapbox</a> &copy <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                });
                layer.addTo(globalMap);


                globalMap.zoomControl.setPosition('topright');
                
                var ResetMapControl = L.Control.extend(
                {
                    options: {
                        position: 'topright',
                    },
                    onAdd: function (map) {
                        var controlDiv = L.DomUtil.create('div', 'leaflet-draw-toolbar leaflet-bar');
                        L.DomEvent
                            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
                            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
                            .addListener(controlDiv, 'click', function () {
                                experiment.logEvent({type: 'button_resetMap'});
                                resetMapFunction();
                            });

                        var controlUI = L.DomUtil.create('a', 'reset-map-button', controlDiv);
                        controlUI.title = 'Reset Map';
                        controlUI.innerHTML = "Reset Map";
                        controlUI.href = '#';
                        controlUI.style.width = "auto";
                        controlUI.style.padding = "10px 15px";
                        return controlDiv;
                    }
                });
                globalMap.addControl(new ResetMapControl());
                
                // TODO: support changing these for every mapTask!
                for (var i=0; i<config.captureEvents.length; i++) {
                    globalMap.on(config.captureEvents[i], logMapEvent);
                }

                // Show message when the zoom control buttons are clicked
                var zoomInButton = document.getElementsByClassName("leaflet-control-zoom-in");
                zoomInButton[0].addEventListener("click", function() {
                    experiment.logEvent({type: 'button_zoomIn'});
                });
                var zoomOutButton = document.getElementsByClassName("leaflet-control-zoom-out");
                zoomOutButton[0].addEventListener("click", function() {
                    experiment.logEvent({type: 'button_zoomOut'});
                });
        

            }
            return globalMap;
        }
        
        function resetMap() {
            globalMap.setView(config.initialPosition, config.initialZoom, {zoom:{animate:false}});
        }
        
        // Log mouse and touch events
        function logMapEvent(e) {
        
            var eventType = e.type;
            
            // only capture mouse movements during dragging
            if (eventType == "mousemove") {
                if (inDrag) {
                    eventType = "dragmove";
                }
                else {
                    return;                   
                }
            }
            if (eventType == "mousedown") {
                inDrag = true;
            }
            if (eventType == "mouseup") {
                inDrag = false;
            }

            // store basic map state in event
            try {
                var center = globalMap.getCenter();
                var event = {
                    zoom: globalMap.getZoom(),
                    map_center_lat: _precision(center.lat),
                    map_center_lng: _precision(center.lng)
                };
            }
            catch (err) {
                // the map has not been set up yet!
                var event = {};
            }           
            
            event.type = "map_" + eventType;

            if (e.latlng) {
                event.lat = _precision(e.latlng.lat);
                event.lng = _precision(e.latlng.lng);
            }
            
            
            // TODO: location of mouse coords can be reprojected using
            // globalMap.mouseEventToLatLng(e.originalEvent)

            if (e.originalEvent && e.originalEvent.pageX) {
                event.x = e.originalEvent.pageX;
                event.y = e.originalEvent.pageY;
            }
            if (e.originalEvent && e.originalEvent.touches) {
                for (var i=0; i<e.touches.length; i++) {
                    var touch = e.originalEvent.touches[i];
                    event.x = touch.pageX;
                    event.y = touch.pageY;
                    event.touch_n = (i+1);
                    experiment.logEvent(event);   
                }
            }

            experiment.logEvent(event);
        }
        
        this.run = function() {
        };
        
        return this;
    };

// ============================================
// Event data storage
// ============================================
    
    Experiment.storage = {};
    
    Experiment.storage.CsvTextStorage = function(config) {
    
        config = merge({
            output_fields: ["task","type","time_task","time_rel","time_abs","x","y","touch_n","zoom","map_center_lat","map_center_lng","lat","lng"],
            name: "experiment"
        }, config);
        
        var events = [];
        
        return {
            store: function(json) {
                events.push(json);
                
                if (config.debug) {
                    var line = config.output_fields.map(function(val) {
                        return (json[val] !== undefined) ? json[val] : "";
                    });
                    console.log(line.join(","));
                }
                
            },
            save: function() {
                var output = config.output_fields.join(",");
                output += "\n";
                for (var i=0; i<events.length; i++) {
                    var event = events[i];
                    var line = config.output_fields.map(function(val) {
                        return event[val] || "";
                    });
                    output += line.join(",");
                    output += "\n";
                }
                console.log(output);
                
                var datestring = (new Date()).toISOString().split(".")[0].replace("T"," ").replace(/:/g,".");
                download(output, config.name + "_" + datestring + ".csv", "text/csv");
            }
        }
        
        function download(data, filename, type) {
            var a = document.createElement("a"),
                file = new Blob([data], {type: type});
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);  
                }, 0); 
            }
        }
        
    };
    
    window.Experiment = Experiment;
    
    // helper functions
    
    function merge() {

        function mergeObj(obj) {
            for ( var prop in obj ) {
                if ( obj.hasOwnProperty(prop) ) {
                    merged[prop] = obj[prop];
                }
            }
        };

        var merged = {};

        for (i=0; i<arguments.length; i++ ) {
            mergeObj(arguments[i]);
        }

        return merged;
    }
    
    function getOrCreateElement(id, tagName, parent) {
        var el = document.getElementById(id);
        if (!el) {
            el = document.createElement(tagName);
            el.id = id;
            (parent||document.body).appendChild(el);
        }
        return el;
    }
})(window);

