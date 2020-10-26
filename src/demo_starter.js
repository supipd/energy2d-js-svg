
  function myRequire(src, callback) {
    if (src.constructor == Array) {
      var libraries = src;
    } else {
      var libraries = [src];
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    // IE
    script.onreadystatechange = function() {
      if (script.readyState === 'loaded' || script.readyState == 'complete') {
        script.onreadystatechange = null;
        libraries.shift();
        if (libraries.length > 0) {
          myRequire(libraries, callback)
        }
        else if (callback) {
          callback();            
        }
      }
    }
    // Not IE
    script.onload = function() {
      libraries.shift();
      if (libraries.length > 0) {
        myRequire(libraries, callback)
      }
      else if (callback) {
        callback();            
      }
    }
    script.src = libraries[0];
    document.getElementsByTagName("head")[0].appendChild(script);
  };

const DEBUG_STEP_COUNT_LIMIT = 858;  //NaN;
var DEBUGABLE_BY_VIEW = false;


//DOM globals ( by id - automatically in HTML, but not XHTML !)      
    canvasTemperatureLayer = document.getElementById("canvasTemperatureLayer");
    canvasPartsLayer = document.getElementById("canvasPartsLayer");
    svgPartsLayer = document.getElementById("svgPartsLayer");
    svgPartsSpace = document.getElementById("svgPartsSpace");
    svgTemperatureLayer = document.getElementById("svgTemperatureLayer");
    svgVelocityLayer = document.getElementById("svgVelocityLayer");
    canvasVelocityLayer = document.getElementById("canvasVelocityLayer");
    canvasVelocityLenDestination = document.getElementById("canvasVelocityLenDestination");
    tdata = document.getElementById("tdata");
    step_count = document.getElementById("step_count");
    alerter = document.getElementById("alerter");
    part_info = document.getElementById("part_info");

        // get DOM elements ... all needed in ONE form, divided to fieldsets

// central global form elements
    cFelems = document.forms.central.elements

e2dUI = {
    model: null
,   model_name: undefined

// timing variables
,   one_before_that_sample_time: null
,   last_sample_time: null
,   sample_time: null
,   average_sample_time_ms: null

,   init: function() {
	    var me = this;

	    this.fillPreparedModels();

        // setup model selectors callbacks
        cFelems.examples_select.onclick/*onchange*/ = function() {
            me.model_name = this.value;
            me.loadModelState(me.model_name, this.name);    // examples_select
        };
        cFelems.models_select.onclick/*onchange*/ = function() {
            me.model_name = this.value;
            me.loadModelState(me.model_name, this.name);    // models_select
        };
		// showing
        cFelems.show_layers.onchange = function(evt) {
        	me.visibilityChanger(evt);
        }
        // simulation
        cFelems.simulation.onchange = function(evt) {
        	me.simulChanger(evt);
        }
        // rendering
        cFelems.choose_array_type.onchange = function() {
            me.loadModelState(me.model_name);
        };
        cFelems.hq_smoothing.onchange = function() {
            me.setupRendering();
        };       
        cFelems.hq_smoothing_grid.onchange = function() {
            if (cFelems.hq_smoothing.checked) {
                var grid_dim = cFelems.hq_smoothing_grid.value;
                model2d.initCanvas(canvasTemperatureLayer, grid_dim, grid_dim);
                me.displayTemperatureFunc(canvasTemperatureLayer, me.model);
            }
        };

        // loading default model 
        this.model_name = 'default';
        models_library[this.model_name] = model2d.default_config;
        this.loadModelState(this.model_name);

	    this.one_before_that_sample_time = new Date();
	    this.last_sample_time = new Date();
	    this.sample_time = new Date();
	    this.average_sample_time_ms = this.sample_time - this.last_sample_time;

        // display initial state
        step_count.innerHTML = 'frame: ' + this.model.indexOfStep;

        // setup rendering
        model2d.setupRGBAColorTables(); 

        // keyboard events
		document.addEventListener('keydown', (event) => this.keyboardHandler(event), false);

    }
,   keyboardHandler: function(evt) {
	  switch(event.key.toLowerCase()) {
	  	case 's':    // stop or step
	  	    if (cFelems.simul.value != 'stop') {
	  	    	cFelems.simul.value = 'stop';
	  	    } else {
	  	    	cFelems.simul.value = 'step';
	  	    }
	  	    this.simulChanger();
	  	    break;
	  	case 'r':    // reset
            cFelems.simul.value = 'reset';
	  	    this.simulChanger();
	  	    break;
	  	case 'g':    // go
            cFelems.simul.value = 'go';
	  	    this.simulChanger();
	  	    break;
	  	case 'a':    // auto cursor
            cFelems.meas_auto.checked = ! cFelems.meas_auto.checked;
	  	    break;
	  	case 'f':    // fix cursor
            cFelems.meas_fix.checked = ! cFelems.meas_fix.checked;
	  	    break;
	  }
	}
,   fillPreparedModels: function() {
		var names_array;

		// fill initial states menu (and sort)
		names_array = [];
		for (var name in models_index) // global from modeels_index.js
			names_array.push(name);
		names_array.sort();

		var optGroupModelsIndex = cFelems.models_select.querySelector('optgroup[label="models index"]')
		names_array.forEach(name => optGroupModelsIndex.appendChild(new Option(name)) )
		cFelems.models_select.size = 15;    //size <= 30 ? size : 30;

		names_array = examples_index.list; // global from examples_indeex.js
		names_array.sort();

		var optGroupExamplesIndex = cFelems.examples_select.querySelector('optgroup[label="examples index"]')
		names_array.forEach(name => optGroupExamplesIndex.appendChild(new Option(name)) )
		cFelems.examples_select.size = 15;    //size <= 30 ? size : 30;
	}
,   visibilityChanger: function(evt) {
		var el = evt.target
		,   name = el.name
		;
		switch(name) {
			case 'show_svgGrid':    this.todoAlerter();el.checked = !el.checked;
				break;
			case 'show_svgColorPalette':    this.todoAlerter();el.checked = !el.checked;
				break;
			case 'show_svgBorderTickmarks':    this.todoAlerter();el.checked = !el.checked;
				break;

			case 'show_svgTemperatureLayer':
				svgTemperatureLayer.style.display = el.checked ? '':'none';
				break;
			case 'select_ColorPalette':
				model2d.setupRGBAColorTables(el.value);
				if (! this.paintInterval) {
                    this.renderResults();
				}
				break;

			case 'show_svgPartsLayer':
				svgPartsLayer.style.display = el.checked ? '':'none';
				break;
			case 'opacity_svgPartsLayer':
				svgPartsLayer.style.opacity = el.value;
				break;

			case 'show_svgVelocityLayer':
				svgVelocityLayer.style.display = el.checked ? '':'none';
				break;
			case 'show_Velocity':
			case 'show_Isotherm':
			case 'show_HeatFlux':
			case 'show_Streams':
			case 'show_Factors':
				if (! this.paintInterval) {
                    this.renderResults();
				}
			    break;
		}
	}
,   paintInterval: null
,   simulChanger: function() {
		var simul = cFelems.simul
		,   stopper = () => {    // arrow function to ensure this !
			    if (this.paintInterval) {
				    clearInterval(this.paintInterval); this.paintInterval = null;
				}
		    }
		;
		switch(simul.value) {
			case 'stop':
			    stopper();
				break;
			case 'reset':
			    stopper();
				this.loadModelState(this.model_name);
				simul.value = 'stop';
				break;
			case 'step':
			    stopper();
				this.renderModelStep();
				simul.value = 'stop';
				break;
			case 'go':
			    if ( ! this.paintInterval) {
    				this.paintInterval = setInterval(() => this.renderModelStep(), 0);
			    }
				break;
		}
	}
,   loadModelState: function (state_name, list_name) {
		if (!state_name) {    // || state_name == "default") {
			this.setupModel();
		}
		else if (models_library[state_name]) {
			// if model is already loaded, use it
			this.setupModel(models_library[state_name]);
		}
		else {
			var me = this;
			switch(list_name) {
				case 'examples_select':
				    loaderE2D.LoadProjectUrlE2D(examples_index.path, state_name);
					break;
				case 'models_select':
				default:
					// require and try to load again 
					myRequire("conversions/" + models_index[state_name], function() {
					  me.loadModelState(state_name);    
					});
					break;
			}
		}
	}
,   setupModel: function(options) {

		if (cFelems.choose_array_type.elements[0].checked) {
			array_selection = "regular";
		} else {
			array_selection = "typed";
		}
		// ----------------
		// clean SVG
		svgPartsSpace.innerHTML = '';  
		// only place to create model
		this.model = new model2d.Model2D(options, array_selection, svgPartsSpace);
console.log(this.model);            

        this.setupRendering();
	}
,   displayTemperatureFuncCall: undefined
,   displayTemperatureFunc: function(cTL, m) {
	//    var countNaN = 0; 
	//    model.t.forEach(te => countNaN+=isNaN(te));
	//    if (countNaN) {
	//        console.warn('temperature countNaN', countNaN);
	//    }
	//    BroCastSend({
	//        appname: 'energo2d-js'
	//    ,   state: 'temperature_data'
	//    ,   temperature: m.t 
	//    }); 
	    if (this.displayTemperatureFuncCall) {   
		    this.displayTemperatureFuncCall(cTL, m);
		}
	}
,   rendererContourMap: undefined
,   rendererFieldLines: undefined
,   setupRendering: function() {

	    var model = this.model
	    ,   viewSettings = model.view.settings    // TODO 
	    ;

        // initialize temperature pixels layer CANVAS
		if (cFelems.hq_smoothing.checked){
			this.displayTemperatureFuncCall = model2d.displayTemperatureCanvasWithSmoothing;
			var grid_dim = cFelems.hq_smoothing_grid.value;
			model2d.initCanvas(canvasTemperatureLayer, grid_dim, grid_dim);
		}
		else {
			this.displayTemperatureFuncCall = model2d.displayTemperatureCanvas;
			model2d.initCanvas(canvasTemperatureLayer, model.nx, model.ny);
		}

        // initialize parts layers CANVAS and SVG
		model2d.initCanvas(canvasPartsLayer, canvasPartsLayer.clientWidth, canvasPartsLayer.clientHeight);
// replaced by SVG (but some can want it :-)		model2d.displayParts(canvasPartsLayer, model.parts, model.lx, model.ly);

		model2d.displaySvgParts(model);

        // initialize vector drawing layer CANVAS
		model2d.initCanvas(canvasVelocityLayer, canvasVelocityLayer.width, canvasVelocityLayer.height);    //, canvasVelocityLayer.clientWidth, canvasVelocityLayer.clientHeight);
		// initialize renderers
		this.rendererContourMap = new model2d.ContourMap(canvasVelocityLayer, model, false);
		this.rendererFieldLines = new model2d.FieldLines(canvasVelocityLayer, model, false);

        // initialize debug pixels drawing layer CANVAS
		model2d.initCanvas(canvasVelocityLenDestination, model.nx, model.ny);

		this.renderResults();
	}
,   renderModelStep: function() {

	    var model = this.model;
		var steps_per_frame = cFelems.steps_per_frame.value;

		this.sample_time = new Date();
		for (var i = 0; i < steps_per_frame; i++) {
			model.nextStep();
			if ( !isNaN(DEBUG_STEP_COUNT_LIMIT) ) {
				this.checkNANinArrays(model);
			}
		}
		this.average_sample_time_ms = (
		    this.average_sample_time_ms * 1.75 
		    +  (this.last_sample_time - this.one_before_that_sample_time) * 0.25) / 2
		;
		this.one_before_that_sample_time = this.last_sample_time;
		this.last_sample_time = this.sample_time;

		step_count.innerHTML = 'step: ' + model.indexOfStep + ', model step rate: ' 
		    + sprintf("%3.1f", steps_per_frame / this.average_sample_time_ms * 1000) + ' fps';

		this.renderResults();
    }
,   renderResults: function() {

	    var model = this.model;

        // temperature layer always independantly on visiblity
        this.displayTemperatureFunc(canvasTemperatureLayer, model);

        model2d.cleanCanvasCtx(canvasVelocityLayer, true);

		if (cFelems.show_Velocity.checked) {
			model2d.displayVectorField(canvasVelocityLayer, model.u, model.v, model.nx, model.ny, 4, false);
	    }
		if (cFelems.show_Isotherm.checked) {
			this.rendererContourMap.render(e2dUI.model.t);
	    }
		if (cFelems.show_HeatFlux.checked) {
			this.rendererFieldLines.renderScalars(e2dUI.model.t,-1);
	    }
		if (cFelems.show_Streams.checked) {
			this.rendererFieldLines.renderVectors(e2dUI.model.u, e2dUI.model.v);
	    }
	    // --------------------
		var gRadiosity = model2d.drawerViewFactorMesh.generate(this.model, false);    // not forceRedraw
        gRadiosity && (gRadiosity.style.display = (cFelems.show_Factors.checked ? '' : 'none'));
	    // --------------------
		if (cFelems.show_velocity_length.checked) {
			model2d.displayVelocityLengthCanvas(canvasVelocityLenDestination, model);
	    }
		if (cFelems.show_temp_data_table.checked) {
			model2d.displayTemperatureTable(tdata, model);
	    }
	}
,   checkNANinArrays: function(model) {

	    var model = this.model;

		var idxNaN = model.t.findIndex(te => isNaN(te));
		if (idxNaN > -1) {
console.log('model.t(temperature) contains NaN', idxNaN, ' at step ', model.indexOfStep);
		}
		idxNaN = model.u.findIndex(te => isNaN(te));
		if (idxNaN > -1) {
console.log('model.u(velocity x-component) contains NaN', idxNaN, ' at step ', model.indexOfStep);
		}
		idxNaN = model.v.findIndex(te => isNaN(te));
		if (idxNaN > -1) {
console.log('model.v(velocity y-component) contains NaN', idxNaN, ' at step ', model.indexOfStep);
		}
		idxNaN = model.q.findIndex(te => isNaN(te));
		if (idxNaN > -1) {
console.log('model.q(internal heat generation) contains NaN', idxNaN, ' at step ', model.indexOfStep);
		}
		if (model.indexOfStep == DEBUG_STEP_COUNT_LIMIT) {
console.log('model.indexOfStep reach DEBUG_STEP_COUNT_LIMIT', model.indexOfStep, ">=", DEBUG_STEP_COUNT_LIMIT);
		}
	}
,   addE2dModel: function (e2d_name) {
		this.model_name = e2d_name;
		for(var i = 0; i < cFelems.examples_select.options.length; i++) {
			if (cFelems.examples_select.options[i].text == this.model_name) {
				return;
			}
		}
		var optGroupE2d = cFelems.examples_select.querySelector('optgroup[label="e2d xml loaded"]');
		optGroupE2d.appendChild(new Option(this.model_name));
		cFelems.examples_select.value = this.model_name;
	}
,   todoAlerterTimer: null
,   todoAlerter: function() {
		if (this.todoAlerterTimer) {
			clearTimeout(this.todoAlerterTimer);
			this.todoAlerterTimer = null;
		}
		alerter.style.display = 'block';
		this.todoAlerterTimer = setTimeout(() => {
			alerter.style.display = 'none';
			this.todoAlerterTimer = null;
		}, 1000);
	} 
}
        

window.onload = function() {
    e2dUI.init();
}



///<section name="broadcaster">
// Connection to a broadcast channel
const broCaster = new BroadcastChannel('test_channel');
function BroCastSend( msg ) {
	// Example of sending of a very simple message
	broCaster.postMessage( msg );
}
// A handler that only logs the event to the console:
broCaster.onmessage = function (ev) { 
    var win = ev && ev.data && ( ev.data.appname == 'energo2d-js');
    if (win && ev.data) {    
		console.log(ev); 
        if (typeof broCasterCallback == 'function') {
        	broCasterCallback(ev.data);
        }
	} else {
		console.log(`BroadCaster: unknown communication !`);
	}
}
function BroCastClose() {
	// Disconnect the channel
	broCaster.close();
}
function broCasterCallback( data ) {
/*	switch(data.state) {
		case "temperature_data":
//		    console.log('temperature_data', data.temperature);
		    var teSum = 0, mtSum = 0;
		    e2dUI.model.t.forEach(te => teSum+=te);
		    data.temperature.forEach(te => mtSum+=te);
		    if (mtSum != teSum) {
		        console.warn('mtSum != teSum', mtSum, teSum);
		    }
		    break;
// ...		    
	}    */
}
///</section>

