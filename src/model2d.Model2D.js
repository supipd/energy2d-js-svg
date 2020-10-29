

model2d.Model2D = function(options, array_type, svgPartsSpace) {

    if (!options) {
        options = model2d.default_config;
    };

    if (!options.model) {
        options.model = {};
    };

    if (!array_type) {
        array_type = "regular";
    };
    model2d.array_type = array_type;

    var opt = options.model;

    //this.opt = opt;
    this.modelWidth = opt.model_width != undefined ? opt.model_width : 10;
    this.modelHeight = opt.model_height != undefined ? opt.model_height : 10;

    this.timeStep = opt.timestep != undefined ? opt.timestep : 0.1;
    this.measurementInterval = opt.measurement_interval != undefined ? opt.measurement_interval : 100;    
    this.controlInterval = opt.controlInterval != undefined ? opt.controlInterval : 100;    
    this.viewUpdateInterval = opt.view_update_interval != undefined ? opt.view_update_interval : 20;
    this.sunny = opt.sunny != undefined ? opt.sunny : false; //  ==> radiative
    this.sunAngle = opt.sun_angle != undefined ? opt.sun_angle : 1.5707964;                
    this.solarPowerDensity = opt.solar_power_density != undefined ? opt.solar_power_density : 20000;
    this.solarRayCount = opt.solar_ray_count != undefined ? opt.solar_ray_count : 24;
    this.solarRaySpeed = opt.solar_ray_speed != undefined ? opt.solar_ray_speed : 0.001;   
    this.photonEmissionInterval = opt.photon_emission_interval != undefined ? opt.photon_emission_interval : 5;
    this.radiosityInterval = opt.radiosity_interval != undefined ? opt.radiosity_interval : 5;
    this.perimeterStepSize = opt.perimeter_step_size != undefined ? opt.perimeter_step_size : 0.05;

    this.convective = opt.convective != undefined ? opt.convective : true;
    this.thermalExpansionCoefficient = opt.thermal_expansion_coefficient != undefined ? opt.thermal_expansion_coefficient 
			: ( opt.thermal_buoyancy != undefined ? opt.thermal_buoyancy : 0.00025 );
    this.buoyancyApproximation = opt.buoyancy_approximation != undefined ? opt.buoyancy_approximation : 1;

    this.BUOYANCY_AVERAGE_ALL = 0;	//model2d.BUOYANCY_AVERAGE_ALL;
    this.BUOYANCY_AVERAGE_COLUMN = 1;	//model2d.BUOYANCY_AVERAGE_COLUMN;

    this.indexOfStep = 0;

	this.zHeatDiffusivity = opt.z_heat_diffusivity != undefined ? opt.z_heat_diffusivity : 0;
	this.zHeatDiffusivityOnlyForFluid = opt.z_heat_diffusivity_only_for_fluid != undefined ? opt.z_heat_diffusivity_only_for_fluid : false;
	this.gravitationalAcceleration = opt.gravitational_acceleration != undefined ? opt.gravitational_acceleration : -1;
	this.thermophoreticCoefficient = opt.thermophoretic_coefficient != undefined ? opt.thermophoretic_coefficient : 0;
	this.particleDrag = opt.particle_drag != undefined ? opt.particle_drag : -1;
	this.particleHardness = opt.particle_hardness != undefined ? opt.particle_hardness : -1;

    this.backgroundConductivity = opt.background_conductivity != undefined ? opt.background_conductivity : /*10 * */model2d.AIR_THERMAL_CONDUCTIVITY;
    this.backgroundViscosity = opt.background_viscosity != undefined ? opt.background_viscosity : /*10 * */model2d.AIR_VISCOSITY;
    this.backgroundSpecificHeat = opt.background_specific_heat != undefined ? opt.background_specific_heat : model2d.AIR_SPECIFIC_HEAT;
    this.backgroundDensity = opt.background_density != undefined ? opt.background_density : model2d.AIR_DENSITY;
    this.backgroundTemperature = opt.background_temperature != undefined ? opt.background_temperature : 0.0;
    this.maximumHeatCapacity = -1;

    this.gravityType = opt.gravity_type != undefined ? opt.gravity_type : model2d.GRAVITY_UNIFORM;

//    this.boundary_settings = 
//        {   temperature_at_border: { upper: 0, lower: 0, left: 0, right: 0 } 
//            // by default all fluxes are zero, meaning that the borders are completely insulative
//        ,   flux_at_border: { upper: 0, lower: 0, left: 0, right: 0 } 
//            // by default all MassBoundary_REFLECTIVE
//        ,   mass_flow_at_border: { upper: 0, lower: 0, left: 0, right: 0 } 
//        };
//    Object.assign(this.boundary_settings, options.model.boundary);

    // little complication with boundary
    this.thermalBoundary = { temperature_at_border: { upper: 0, lower: 0, left: 0, right: 0 } };
    this.massBoundary = { mass_flow_at_border: { upper: 0, lower: 0, left: 0, right: 0 } };
    if (options.model.boundary) {
        if (options.model.boundary.temperature_at_border) {
            this.thermalBoundary = { temperature_at_border: options.model.boundary.temperature_at_border };
        }
        if (options.model.boundary.flux_at_border) {
            this.thermalBoundary = { flux_at_border: options.model.boundary.flux_at_border };
        }
        if (options.model.boundary.mass_flow_at_border) {
            this.massBoundary = { mass_flow_at_border: options.model.boundary.mass_flow_at_border };
        }
    }
      
    this.nx = model2d.NX;
    this.ny = model2d.NY;
    this.nx1 = this.nx - 1;
    this.ny1 = this.ny - 1;
    

    // length in x direction (unit: meter)
    this.lx = this.modelWidth;  //10;   // modelWidth

    // length in y direction (unit: meter)
    this.ly = this.modelHeight; //10;   // modelHeight

    this.deltaX = this.lx / this.nx;
    this.deltaY = this.ly / this.ny;

// ----------------------------------
    this.svg = {
        group: svgPartsSpace
    };
    model2d.setSvgParams(this);
// ----------------------------------

    // booleans
    this.running;
    this.notifyReset;

    // optimization flags (booleans)
    this.hasPartPower = false;
    this.radiative = false; // not fully implemented yet
    this.perimeterStepSize = 0.05;

    // temperature array

    this.t = createArray(model2d.ARRAY_SIZE, 0);

    // internal temperature boundary array
    this.tb = createArray(model2d.ARRAY_SIZE, 0);

    for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.t[i] = this.backgroundTemperature;
        this.tb[i] = NaN;
    }
    
    // velocity x-component array (m/s)
    this.u = createArray(model2d.ARRAY_SIZE, 0);
    
    // velocity y-component array (m/s)
    this.v = createArray(model2d.ARRAY_SIZE, 0);

    // internal heat generation array
    this.q = createArray(model2d.ARRAY_SIZE, 0);
    
    // wind speed
    this.uWind = createArray(model2d.ARRAY_SIZE, 0);
    this.vWind = createArray(model2d.ARRAY_SIZE, 0);
    
    // conductivity array
    this.conductivity = createArray(model2d.ARRAY_SIZE, 0);
    for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.conductivity[i] = this.backgroundConductivity;
    }
    
    // specific heat capacity array
    this.specificHeat = createArray(model2d.ARRAY_SIZE, 0);
    for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.specificHeat[i] = this.backgroundSpecificHeat;
    }
    
    // density array
    this.density = createArray(model2d.ARRAY_SIZE, 0);
    for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.density[i] = this.backgroundDensity;
    }
    
    // fluid cell array
    this.fluidity = createArray(model2d.ARRAY_SIZE, 0);
    for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
        this.fluidity[i] = true;
    }


    // ------------------------- 
    this.links = options.links || [];
    this.view = new model2d.View2D(this, options.view);


    // ------------------------- 
    this.heatSolver = new model2d.HeatSolver2D(this);
    this.fluidSolver = new model2d.FluidSolver2D(this);
    this.photonSolver = new model2d.PhotonSolver2D(this);
    this.radiositySolver = new model2d.RadiositySolver2D(this);
    this.particleSolver = new model2d.ParticleSolver2D(this);

    // parts
    this.parts = [];
    if (opt.structure && opt.structure.part) {
        opt.structure.part = (Array.isArray(opt.structure.part) ? opt.structure.part : [opt.structure.part])
        opt.structure.part.forEach((part, idx) => {
            this.parts.push(new model2d.Part(part, idx, this));
        })
    }

    // elements e.g. Photons  
    this.particles = [];
    if (opt.structure && opt.structure.particle) {
        opt.structure.particle = (Array.isArray(opt.structure.particle) ? opt.structure.particle : [opt.structure.particle])
        opt.structure.particle.forEach((particle, idx) => {
            this.particles.push(new model2d.Particle(particle, idx, this));
        })
    }
    this.photons = [];

    // sensor 
    this.sensor = opt.sensor || {}; 
    // ------------------------- 
    this.thermometers = []; //opt.sensor && opt.sensor.thermometer || [];
    this.anemometers = []; //opt.sensor && opt.sensor.anemometer || []
    this.heatFluxSensors = []; //opt.sensor && opt.sensor.heat_flux_sensor || []

    // controller
    this.controller = opt.controller || {}; 
    // ------------------------- 
    this.thermostats = []; //opt.controller && opt.controller.thermostat || [];

    // environment
    this.environment = opt.environment || {}; 
    // ------------------------- 
    this.clouds = []; //opt.environment && opt.environment.cloud || [];
    if (opt.environment && opt.environment.cloud) {
        opt.environment.cloud = (Array.isArray(opt.environment.cloud) ? opt.environment.cloud : [opt.environment.cloud])
        opt.environment.cloud.forEach((cloud, idx) => {
            this.clouds.push(new model2d.Cloud(cloud, idx, this));
        })
    }
    this.trees = []; //opt.environment && opt.environment.tree || [];
    if (opt.environment && opt.environment.tree) {
        opt.environment.tree = (Array.isArray(opt.environment.tree) ? opt.environment.tree : [opt.environment.tree])
        opt.environment.tree.forEach((tree, idx) => {
            this.trees.push(new model2d.Tree(tree, idx, this));
        })
    }
    this.fans = []; //opt.environment && opt.environment.fan || [];
    if (opt.environment && opt.environment.fan) {
        opt.environment.fan = (Array.isArray(opt.environment.fan) ? opt.environment.fan : [opt.environment.fan])
        opt.environment.fan.forEach(fan => {
            this.fans.push(new model2d.Fan(fan, this));
        })
    }
    this.heliostats = []; //opt.environment && opt.environment.heliostat || [];
    if (opt.environment && opt.environment.heliostat) {
        opt.environment.heliostat = (Array.isArray(opt.environment.heliostat) ? opt.environment.heliostat : [opt.environment.particle_feeder])
        opt.environment.heliostat.forEach((heliostat, idx) => {
            this.heliostats.push(new model2d.Heliostat(heliostat, idx, this));
        })
    }
    this.particleFeeders = []; //opt.environment && opt.environment.particle_feeder || [];
    if (opt.environment && opt.environment.particle_feeder) {
        opt.environment.particle_feeder = (Array.isArray(opt.environment.particle_feeder) ? opt.environment.particle_feeder : [opt.environment.particle_feeder])
        opt.environment.particle_feeder.forEach((particle_feeder, idx) => {
            this.particleFeeders.push(new model2d.ParticleFeeder(particle_feeder, idx, this));
        })
    }


    // preparing activity of solvers
    this.setGridCellSize();
    this.setupFieldOccupations();
    this.checkPartRadiation();

    // activating solvers
    this.heatSolver.activate();
    this.fluidSolver.activate();
    this.photonSolver.activate();
    this.radiositySolver.activate();
    this.particleSolver.activate();


    // initial arrays preparing
                //this.setupMaterialProperties();
    this.refreshPowerArray();   // contains this.checkPartPower();

    this.refreshTemperatureBoundaryArray();
    this.refreshMaterialPropertyArrays();


    // parts = Collections.synchronizedList(new ArrayList<Part>());
    // thermometers = Collections.synchronizedList(new ArrayList<Thermometer>());

    // visualizationListeners = new ArrayList<VisualizationListener>();
    // propertyChangeListeners = new ArrayList<PropertyChangeListener>();


};

/**
 * the part on the top sets the properties of a cell
 */
model2d.Model2D.prototype.refreshMaterialPropertyArrays = function() {
    var x, y, windSpeed;
    var initial = this.indexOfStep == 0;
    this.maximumHeatCapacity = this.backgroundDensity * this.backgroundSpecificHeat;
    var heatCapacity = 0;

    var inx, jinx;

    var specificHeat = this.specificHeat;
    var conductivity = this.conductivity;
    var density = this.density;
    var fluidity = this.fluidity;
    var uWind = this.uWind;
    var vWind = this.vWind;

    for (var i = 0; i < this.nx; i++) {
        x = i * this.deltaX;
        inx = i * this.nx;
        for (var j = 0; j < this.ny; j++) {
            y = j * this.deltaY;
            jinx = inx + j;
// constructor initialized            conductivity[jinx] = this.backgroundConductivity;
// constructor initialized            specificHeat[jinx] = this.backgroundSpecificHeat;
// constructor initialized            density[jinx] = this.backgroundDensity;
// constructor initialized            fluidity[jinx] = true;
// constructor initialized            uWind[jinx] = vWind[jinx] = 0;

            var part;
            for(p = 0; p < this.parts.length; p++) {
                part = this.parts[p];
                // FIXME: for some reason, the fluid solver doesn't like the way we treat round-off error on the grid.
                // So if the model is convective, revert to using the original contains(...) method for setting the properties on the grid.
                if (jinx in part.occupationIndexes) {    //  if (part.contains(x, y, this.convective, jinx)) {
                    conductivity[jinx] = part.thermal_conductivity;
                    specificHeat[jinx] = part.specific_heat;
                    density[jinx] = part.density;
                    fluidity[jinx] = false;
                    break;
                }
            }
            // The rest properties of parts should use the new contains(...) method, as is in any other place
            for(p = 0; p < this.parts.length; p++) {
                part = this.parts[p];
                if (jinx in part.occupationIndexes) {    //  if (part.contains(x, y, false, jinx)) {
                    if (!initial && part.constant_temperature)
                        t[jinx] = part.temperature;
                    if ((windSpeed = part.wind_speed) != 0) { // parts used to support wind speed, we now prefer using fans
                        uWind[jinx] = windSpeed * Math.cos(part.wind_angle);
                        vWind[jinx] = windSpeed * Math.sin(part.wind_angle);
                    }
                    break;
                }
            }
            var fan;
            for (var f=0; f < this.fans.length; f++) {
                fan = this.fans[f];
                if (jinx in fan.occupationIndexes) {    //  if (fan.contains(x, y, false)) {
                    if ((windSpeed = fan.speed) != 0) {
                        uWind[jinx] = windSpeed * Math.cos(fan.angle);
                        vWind[jinx] = windSpeed * Math.sin(fan.angle);
                    }
                    break;
                }
            }
            heatCapacity = this.specificHeat[jinx] * this.density[jinx];
            if (this.maximumHeatCapacity < heatCapacity)
                this.maximumHeatCapacity = heatCapacity;
        }
    }
    if (initial) {
        this.setInitialTemperature();
        this.setInitialVelocity();
    }
}

model2d.Model2D.prototype.setInitialVelocity = function() {
    var inx, jinx;

    var fluidity = this.fluidity;
    var uWind = this.uWind;
    var vWind = this.vWind;
    var u = this.u;
    var v = this.v;

    for (var i = 0; i < this.nx; i++) {
        inx = i * this.nx;
        for (var j = 0; j < this.ny; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {
                u[jinx] = v[jinx] = 0;
            } else {
                u[jinx] = uWind[jinx];
                v[jinx] = vWind[jinx];
            }
        }
    }
}

model2d.Model2D.prototype.setInitialTemperature = function() {
    var inx, jinx;

    var t = this.t;

    if ( ! this.parts || ! this.parts.length) {
// constructor initialized        for (var i = 0; i < this.nx; i++) {
// constructor initialized            inx = i * this.nx;
// constructor initialized            for (var j = 0; j < this.ny; j++) {
// constructor initialized                jinx = inx + j;
// constructor initialized                t[jinx] = this.backgroundTemperature;
// constructor initialized            }
// constructor initialized        }
    } else {
        var x, y;
        var count;
        for (var i = 0; i < this.nx; i++) {
            x = i * this.deltaX;
            inx = i * this.nx;
            for (var j = 0; j < this.ny; j++) {
                y = j * this.deltaY;
                jinx = inx + j;
                count = 0;
                t[jinx] = 0;
                this.parts.forEach(p => { // a cell gets the average temperature from the overlapping parts
                    if (jinx in p.occupationIndexes) {  //  if (p.contains(x, y, false)) {
                        count++;
                        t[jinx] += p.temperature;
                    }
                })
                if (count > 0) {
                    t[jinx] /= count;
                } else {
                    t[jinx] = this.backgroundTemperature;
                }
            }
        }
    }
    this.clearSensorData();
}

model2d.Model2D.prototype.setupFieldOccupations = function() {
//    this.parts.forEach( part => {
//        part.occupationIndexes = this.getFieldsOccupiedByPart(part);
//    })
//    this.fans.forEach( fan => {
//        fan.occupationIndexes = this.getFieldsOccupiedByPart(fan);
//    })

    var x, y;
    var inx, jinx;

    for(var i = 0; i < this.nx; i++) {
        x = i * this.deltaX;
        inx = i * this.nx;
        for(var j = 0; j < this.ny; j++) {
            y = j * this.deltaY;
            jinx = inx + j;
            this.parts.forEach( part => {
                if (model2d.containsPoint(part.svgElement, x, y, false, this)) {
                    part.occupationIndexes[jinx] = 1;    //.push(jinx);
                }
            })
            this.fans.forEach( fan => {
                if (model2d.containsPoint(fan.svgElement, x, y, false, this)) {
                    fan.occupationIndexes[jinx] = 1;    //.push(jinx);
                }
            })
        }
    }
}

model2d.Model2D.prototype.clearSensorData = function() {
    //  TODO
}

model2d.Model2D.prototype.reset = function() {
    var array_size = model2d.ARRAY_SIZE;
    for (var i = 0; i < array_size; i++) {
        
        for (var i = 0; i < model2d.ARRAY_SIZE; i++) {
            this.t[i] = this.backgroundTemperature;
            this.tb[i] = NaN;
        }

        // velocity x-component array (m/s)
        this.u[i] = 0;

        // velocity y-component array (m/s)
        this.v[i] = 0;

        // internal heat generation array
        this.q[i] = 0;

        // wind speed
        this.uWind[i] = 0;
        this.vWind[i] = 0;
        
        this.u0[i] = 0;
        this.v0[i] = 0;

        this.vorticity[i] = 0;
        this.stream[i] = 0;
    }
};

model2d.Model2D.prototype.setGridCellSize = function() {
    this.heatSolver.setGridCellSize(this.deltaX, this.deltaY);
    this.fluidSolver.setGridCellSize(this.deltaX, this.deltaY);
    this.photonSolver.setGridCellSize(this.deltaX, this.deltaY);
};

model2d.Model2D.prototype.nextStep = function() {

    // photon simulation of solar inputs
    if (this.sunny) {
        if (this.indexOfStep % this.photonEmissionInterval == 0) {
            this.photonSolver.sunShine(this.photons, this.parts);
            this.refreshPowerArray();
        }
    }
    this.photonSolver.solve(this);

    // radiation solver
    if (this.radiative) {
        if (this.indexOfStep % this.radiosityInterval == 0) {
            this.refreshPowerArray();
            this.radiositySolver.solve();
        }
    }

    // convection solver
    if (this.convective) {
        this.fluidSolver.solve(this.u, this.v);
        if (this.fans.length)
            this.applyFans();
    }

    // conduction solver
    this.heatSolver.solve(this.convective, this.t, this.q);

    // particle solver
    if (this.particles.length)
        this.particleSolver.move(this);

    this.particleFeeders.forEach(pf =>{
        if (this.indexOfStep % Math.round(pf.period / this.timeStep) == 0) {
            pf.feed(this);
        }
    })

    // other animations
    this.clouds.forEach( c => {
//        c.move(this.heatSolver.timeStep, this.lx);
    })

    model2d.measuring.update(null, null, this);
    this.indexOfStep++;    
};

model2d.Model2D.prototype.applyFans = function() {
    var x, y;
    var jinx;

    var u = this.u;
    var v = this.v;
    var uWind = this.uWind;
    var vWind = this.vWind;

    for (var i = 0; i < this.nx; i++) {
        x = i * this.deltaX;
        for (var j = 0; j < this.ny; j++) {
            y = j * this.deltaY;
            jinx = i*this.nx+j;
            this.fans.forEach( f => {
                if (jinx in f.occupationIndexes) {  //  if (f.contains(x, y, false)) {
                    if (f.speed) {
                        u[jinx] = uWind[jinx];
                        v[jinx] = vWind[jinx];
                    }
                }
            })
        }
    }
}

// boolean sunny
model2d.Model2D.prototype.setSunny = function(sunny) {
    this.sunny = sunny;
    if (sunny) {
        this.radiative = true;
    } else {
        this.photons = [];
    }
};

/**
 * synchronize the sun's angle with the clock, assuming sunrise at 6:00 and sunset at 18:00.
 */
model2d.Model2D.prototype.moveSun = function(sunrise, sunset) {
    var hour = Math.floor(getTime() / 3600);
    hour += (i % 24) - i;
    photonSolver.setSunAngle((hour - sunrise) / (sunset - sunrise) * Math.PI);
    this.refreshPowerArray();
    if (this.sunAngle >= 0 && this.sunAngle <= Math.PI)
        this.refreshHeliostats();
}

model2d.Model2D.prototype.setSunAngle = function(sunAngle) {
    this.photonSolver.setSunAngle(sunAngle);
    if (this.heliostats.length) {
        this.heliostats.forEach(h => {
            h.setAngle();           
        })
    }
    if (Math.abs(sunAngle - this.photonSolver.sunAngle) > 0.001)
        this.photons = [];
}

model2d.Model2D.prototype.getSunAngle = function() {
    return this.photonSolver.getSunAngle();
}


model2d.Model2D.prototype.refreshPowerArray = function() {
    var nx = this.nx;
    var ny = this.ny;
    
    var deltaX = this.deltaX;
    var deltaY = this.deltaY;

    var q = this.q;
    
    this.checkPartPower();

    var x, y, power;
    var inx, jinx, count;

    for (var i = 0; i < nx; i++) {
        x = i * deltaX;
        inx = i * nx;
        for (var j = 0; j < ny; j++) {
            y = j * deltaY;            
            jinx = inx + j;
            q[jinx] = 0;
            if (this.hasPartPower) {
                this.parts.forEach(p => {
                    if (p.power && (jinx in p.occupationIndexes)) { //  p.contains(p.svgElement, x, y, false)) {
                        power = p.power;
                        if (p.temperature_coefficient) {
                            power *= 1 + p.temperature_coefficient * (this.t[jinx] - p.reference_temperature);
                        }
                        q[jinx] += power;
                        count++;
                    }
                })
            }
        }
    }
};

model2d.Model2D.prototype.refreshTemperatureBoundaryArray = function() {
    var nx = this.nx;
    var ny = this.ny;
    
    var deltaX = this.deltaX;
    var deltaY = this.deltaY;

    var tb = this.tb;
    
    var inx, jinx;
    var x, y;

    for (var i = 0; i < nx; i++) {
        inx = i * nx;
        x = i * deltaX;
        for (var j = 0; j < ny; j++) {
            
            jinx = inx + j;
            // jinx_minus_nx = jinx - nx;
            // jinx_plus_nx = jinx + nx;
            // jinx_minus_1 = jinx - 1;
            // jinx_plus_1 = jinx + 1;
            
            y = j * deltaY;
            tb[jinx] = 0;
            
            var count = 0;

            this.parts.forEach(p => {
                if (p.constant_temperature && (jinx in p.occupationIndexes)) { //  p.contains(p.svgElement, x, y)) {
                    tb[jinx] = p.temperature;
                    count++;    //break;
                }
            })
            if (count > 0) {
                tb[jinx]/= count; 
            } else {
                tb[jinx] = NaN;
            }
        }
    }
};

model2d.Model2D.prototype.reallyReset = function() {
    this.setInitialTemperature();
    this.setInitialVelocity();
    this.photons.clear();
    this.heatSolver.reset();
    this.fluidSolver.reset();
};

model2d.Model2D.prototype.checkPartPower = function() {
    this.hasPartPower = false;
    for(var i=0; i<this.parts.length; i++) {
        var part = this.parts[i];
        if (part.power) {
            this.hasPartPower = true;
            break;
        }
    }
    return this.hasPartPower;
};

model2d.Model2D.prototype.checkPartRadiation = function() {
    this.radiative = this.sunny;
    if (!this.radiative) {
        for(var i=0; i<this.parts.length; i++) {
            var part = this.parts[i];
            if (part.emissivity) {
                this.radiative = true;
                break;
            }
        }
    }
    return this.radiative;
};

model2d.Model2D.prototype.getTemperatureAt = function(x, y, stencil) {
    var nx = this.nx;
    var ny = this.ny;
    var t = this.t;

    var i = Math.min(nx - 1, Math.round(x / this.deltaX));
    if (i < 0)
        i = 0;
    var j = Math.min(ny - 1, Math.round(y / this.deltaY));
    if (j < 0)
        j = 0;

    var temp = t[i*nx+j];
    var count = 1;

    if (stencil >= 5) { //Sensor.FIVE_POINT:
        if (i > 0) {
            temp += t[(i - 1)*nx+j];
            count++;
        }
        if (i < nx - 1) {
            temp += t[(i + 1)*nx+j];
            count++;
        }
        if (j > 0) {
            temp += t[i*nx+j - 1];
            count++;
        }
        if (j < ny - 1) {
            temp += t[i*nx+j + 1];
            count++;
        }
    }
    if (stencil >= 9) { //Sensor.NINE_POINT:
        if (i > 0 && j > 0) {
            temp += t[(i - 1)*nx+j - 1];
            count++;
        }
        if (i > 0 && j < ny - 1) {
            temp += t[(i - 1)*nx+j + 1];
            count++;
        }
        if (i < nx - 1 && j > 0) {
            temp += t[(i + 1)*nx+j - 1];
            count++;
        }
        if (i < nx - 1 && j < ny - 1) {
            temp += t[(i + 1)*nx+j + 1];
            count++;
        }
    }
    return temp / count;
}

model2d.Model2D.prototype.changePowerAt = function(x, y, power) {
    var nx = this.nx;
    var ny = this.ny;
    var t = this.t;

    var i = Math.min(nx - 1, Math.round(x / this.deltaX));
    if (i < 0)
        i = 0;
    var j = Math.min(ny - 1, Math.round(y / this.deltaY));
    if (j < 0)
        j = 0;
    this.q[i * nx + j] = power; 
}

model2d.Model2D.prototype.changeTemperatureAt = function(x, y, increment) {
    var i = Math.min(this.nx - 1, Math.round(x / this.deltaX));
    if (i < 0)
        return;
    var j = Math.min(this.ny - 1, Math.round(y / this.deltaY));
    if (j < 0)
        return;
    this.t[i *this.nx + j] += increment;
}
