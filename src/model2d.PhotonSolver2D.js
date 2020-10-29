
// *******************************************************
//
//   ProtonSolver2D
//
// *******************************************************

// float lx, float ly
model2d.PhotonSolver2D = function(/*lx, ly*/ model) {
 
    this.model = model;
   
    this.sunAngle = Math.PI * 0.5;
    
    this.rayCount = this.DEFAULT_RAY_COUNT; //24;
    this.solarPowerDensity = 2000;
    this.rayPower = this.solarPowerDensity;
    
    this.raySpeed = model.solarRaySpeed || 0.1;
    this.spacing = 0.5;   // ???
    
    this.q = model.q;
    
    this.i2dx = null;
    this.i2dy == null;
    this.idxsq = null;
    this.idysq = null;
    this.deltaX = null;
    this.deltaY = null;
    
    this.relaxationSteps = 5;
    this.thermalExpansionCoefficient = 0.00025;
    this.gravity = 0;
    this.buoyancyApproximation = 1;  // model2d.BUOYANCY_AVERAGE_COLUMN;
    this.viscosity = 10 * model2d.AIR_VISCOSITY;
    this.timeStep = 0.1;

    this.uWind = null;
    this.vWind = null;

    this.lx = model.lx;
    this.ly = model.ly;

    this.nx = model.nx;
    this.ny = model.ny;
    this.nx1 = this.nx - 1;
    this.ny1 = this.ny - 1;
    this.nx2 = this.nx - 2;
    this.ny2 = this.ny - 2;
    
    this.u0 = createArray(model2d.ARRAY_SIZE, 0);
    this.v0 = createArray(model2d.ARRAY_SIZE, 0);
    this.vorticity = createArray(model2d.ARRAY_SIZE, 0);
    this.stream = createArray(model2d.ARRAY_SIZE, 0);
};

model2d.PhotonSolver2D.prototype.DEFAULT_RAY_COUNT = 24;
model2d.PhotonSolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

    this.setSolarPowerDensity(model.solarPowerDensity);
    this.setSolarRayCount(model.solarRayCount);
}

model2d.PhotonSolver2D.prototype.setSolarPowerDensity = function(solarPowerDensity) {
    this.solarPowerDensity = solarPowerDensity;
    this.rayPower = solarPowerDensity * this.DEFAULT_RAY_COUNT / this.rayCount;
};

model2d.PhotonSolver2D.prototype.setSolarRayCount = function(solarRayCount) {
    this.rayCount = solarRayCount;
    this.rayPower = this.solarPowerDensity * this.DEFAULT_RAY_COUNT / this.rayCount;
};

model2d.PhotonSolver2D.prototype.solarRaySpeed = function(solarRaySpeed) {
    this.solarRaySpeed = solarRaySpeed;
};

model2d.PhotonSolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
};

// loat x, float y, List<Part> parts
model2d.PhotonSolver2D.prototype.isContained = function(x, y, parts) {
    var parts_length = parts.length;
    for (var i = 0; i < parts_length; i++) {
        var part = parts[i];
        if ( (part.transmission < 0.9999) 
          && model2d.containsPoint(part.svgElement, x, y, false, this.model)
          ) {
            return true;
        }
    } 
    return false;
};

// float sunAngle
model2d.PhotonSolver2D.prototype.setSunAngle = function(sunAngle) {
    this.sunAngle = Math.PI - sunAngle;
};
model2d.PhotonSolver2D.prototype.getSunAngle = function() {
  return Math.PI - this.sunAngle;
};


model2d.PhotonSolver2D.prototype.solve = function(model) {
    this.photons = model.photons;
    if (this.photons.length == 0)
        return;

    var photon = null;

    var timeStep = model.timeStep;
    var nx = model.nx;
    var ny = model.ny;

    // Since a photon is emitted at a given interval, its energy
    // has to be divided evenly for internal power generation at
    // each second. The following factor takes this into account.
    var factor = 1.0 / (timeStep * model.photonEmissionInterval);
    var idx = 1.0 / this.deltaX;
    var idy = 1.0 / this.deltaY;
    var i, j;

    var nx_minus_1 = nx - 1;
    var ny_minus_1 = ny - 1;

    var remove = false;

    var photonCount = this.photons.length;

    for (var ip = 0; ip < photonCount; ip++) {
        photon = this.photons[ip];
        photon.move(timeStep);

        remove = false;
        for (var p = 0; p < this.model.parts.length; p++) {
            var part = this.model.parts[p];
            if (part.scattering) {
                if (part.scattering_visible) {
                    if (part.reflect(photon, true))
                        break;
                } else {    // assuming heating caused by scattering can be neglected, 
                            // we can just remove the photon to make the scene less messy
                    if (model2d.containsPoint(part.svgElement, photon.rx, photon.ry, false, this.model)) {
                      remove = true;
                      break;
                    }
                }
            } else {
                if (Math.abs(part.reflection - 1) < 0.001) { // in current implementation, reflection is either 1 or 0
                    if (part.reflect(photon, false))
                        break;
                } else if (Math.abs(part.absorption - 1) < 0.001) { // in current implementation, absorption is either 1 or 0
                    if (model2d.containsPoint(part.svgElement, photon.rx, photon.ry, false, this.model)) {
                        i = Math.max(0, Math.min(nx-1, Math.round(photon.rx * idx)));
                        j = Math.max(Math.min(ny-1, Math.round(photon.ry * idy)));
                        this.q[i * nx + j] = photon.energy * factor;
                        remove = true;
                        break;
                    }
                }              
            }
        }
// the rule is that clouds absorb light
        for (var c = 0; c < this.model.clouds.length; c++) {
            if (this.model.clouds[c].contains(photon.rx, photon.ry)) {
                remove = true;
                break;
            }
        }
// the rule is that trees absorb light
        for (var t = 0; t < this.model.trees.length; t++) {
            if (this.model.trees[t].contains(photon.rx, photon.ry)) {
                remove = true;
                break;
            }
        }
// a heliostat reflects or absorbs light depending on its type, mirror or PV
        for (var h = 0; h < this.model.heliostats; h++) {
            if (h.reflect(photon))
                break;
        }
        if (remove) {
            this.photons.splice(ip,1);
            ip--; photonCount--;
        }
    }
    this.applyBoundary(this.photons);
};


// List<Photon> photons
model2d.PhotonSolver2D.prototype.applyBoundary = function(photons) {
    var photonCount = this.photons.length;
    for (var ip = 0; ip < photonCount; ip++) {
         if ( ! this.photons[ip].isContained(0, this.lx, 0, this.ly) ) {
            this.photons.splice(ip,1);
            ip--; photonCount--;
        }
    }
};


// List<Photon> photons, List<Part> parts
model2d.PhotonSolver2D.prototype.sunShine = function(photons, parts) {
  if (this.sunAngle < 0)
    return;
  var s = Math.abs(Math.sin(this.sunAngle));
  var c = Math.abs(Math.cos(this.sunAngle));

  var lx = this.lx;
  var ly = this.ly;

  this.spacing = s * ly < c * lx ? ly / c : lx / s;
  this.spacing /= this.rayCount;
  this.shootAtAngle(this.spacing / s, this.spacing / c, photons, parts);
};


// float dx, float dy, List<Photon> photons, List<Part> parts
model2d.PhotonSolver2D.prototype.shootAtAngle = function(dx, dy, photons, parts) {
    var lx = this.lx;
    var ly = this.ly;
    var sunAngle = this.sunAngle;
    var rayPower = this.rayPower;
    var raySpeed = this.raySpeed;
    var m = this.lx / dx;
    var n = this.ly / dy;
    var x, y;

    if (this.sunAngle >= 0 && this.sunAngle < 0.5 * Math.PI) {
        y = 0;
        for (var i = 1; i <= m; i++) {
            x = dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = 0;
        for (var i = 0; i <= n; i++) {
            y = dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle < 0 && sunAngle >= -0.5 * Math.PI) {
        y = ly;
        for (var i = 1; i <= m; i++) {
            x = dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = 0;
        for (var i = 0; i <= n; i++) {
            y = ly - dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle < Math.PI + 0.001 && sunAngle >= 0.5 * Math.PI) {
        y = 0;
        for (var i = 0; i <= m; i++) {
            x = lx - dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
        x = lx;
        for (var i = 1; i <= n; i++) {
            y = dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    } else if (sunAngle >= -Math.PI && sunAngle < -0.5 * Math.PI) {
        y = ly;
        for (var i = 0; i <= m; i++) {
            x = lx - dx * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, thisr.ayPower, sunAngle, raySpeed));
        }
        x = lx;
        for (var i = 1; i <= n; i++) {
            y = ly - dy * i;
            if (!this.isContained(x, y, parts))
            photons.push(new model2d.Photon(x, y, rayPower, sunAngle, raySpeed));
        }
    }
};

