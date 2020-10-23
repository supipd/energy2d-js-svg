
// *******************************************************
//
//   ProtonSolver2D
//
// *******************************************************

// float lx, float ly
model2d.PhotonSolver2D = function(/*lx, ly*/ model) {
 
    this.model = model;
   
    this.sunAngle = Math.PI * 0.5;
    
    this.rayCount = 24;
    this.solarPowerDensity = 2000;
    this.rayPower = this.solarPowerDensity;
    
    this.raySpeed = 0.1;
    
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

model2d.PhotonSolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

}

model2d.PhotonSolver2D.prototype.setSolarPowerDensity = function(solarPowerDensity) {
    this.solarPowerDensity = solarPowerDensity;
    this.rayPower = solarPowerDensity * 24 / this.rayCount;
};

model2d.PhotonSolver2D.prototype.setSolarRayCount = function(solarRayCount) {
    this.rayCount = solarRayCount;
    this.rayPower = this.solarPowerDensity * 24 / this.rayCount;
};

model2d.PhotonSolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
};

// loat x, float y, List<Part> parts
model2d.PhotonSolver2D.prototype.isContained = function(x, y, parts) {
    var parts_length = parts.length;
    for (var i = 0; i < parts_length; i++) {
        if (model2d.contains(parts[i].svgElement, x, y)) {
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
  return Math.PI - sunAngle;
};


// Model2D model
model2d.PhotonSolver2D.prototype.radiate = function(model2d) {
    // synchronized (model2d.getParts()) {
    //   for (Part p : model2d.getParts()) {
    //     if (p.getEmissivity() > 0)
    //       p.radiate(model2d);
    //   }
    // }
};


model2d.PhotonSolver2D.prototype.solve = function(model2d) {
  this.photons = model2d.photons;
  if (this.photons.length == 0)
    return;

  var photon = null;

  var timeStep = this.timeStep;
  var nx = model2d.nx;
  var ny = model2d.ny;

  // Since a photon is emitted at a given interval, its energy
  // has to be divided evenly for internal power generation at
  // each second. The following factor takes this into account.
  var factor = 1.0 / (timeStep * model2d.photonEmissionInterval);
  var idx = 1.0 / this.deltaX;
  var idy = 1.0 / this.deltaY;
  var i, j;
  
  var nx_minus_1 = nx - 1;
  var ny_minus_1 = ny - 1;

  // boolean remove;

  var photonCount = this.photons.length;
  for (var i = 0; i < photonCount; i++) {
      photon = photons[i];
      photon.move(timeStep);
      // if (model.getPartCount() > 0) {
      //     remove = false;
      //     synchronized (model.getParts()) {
      //         for (Part part : model.getParts()) {
      //             if (Math.abs(part.getReflection() - 1) < 0.001f) {
      //                 if (part.reflect(p, timeStep))
      //                     break;
      //             } else if (Math.abs(part.getAbsorption() - 1) < 0.001f) {
      //                 if (part.absorb(p)) {
      //                     i = Math.min(nx, Math.round(p.getX() * idx));
      //                     j = Math.min(ny, Math.round(p.getY() * idy));
      //                     q[i][j] = p.getEnergy() * factor;
      //                     remove = true;
      //                     break;
      //                 }
      //             }
      //         }
      //     }
      //     if (remove)
      //         it.remove();
      // }
  }
  this.applyBoundary(photons);
};



// List<Photon> photons
model2d.PhotonSolver2D.prototype.applyBoundary = function(photons) {
    var photonCount = this.photons.length;
    var lx = this.lx;
    var ly = this.ly;
    var remainingPhotons = [];
    for (var i = 0; i < photonCount; i++) {
        photon = photons[i];
        if (photon.isContained(0, lx, 0, ly)) {
            remainingPhotons.push(photon);
        }
    }
    photons = remainingPhotons;
};


// List<Photon> photons, List<Part> parts
model2d.PhotonSolver2D.prototype.sunShine = function(photons, parts) {
  if (this.sunAngle < 0)
    return;
  var s = Math.abs(Math.sin(this.sunAngle));
  var c = Math.abs(Math.cos(this.sunAngle));

  var lx = this.lx;
  var ly = this.ly;

  var spacing = s * ly < c * lx ? ly / c : lx / s;
  spacing /= this.rayCount;
  this.shootAtAngle(spacing / s, spacing / c, photons, parts);
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
    return; // TODO UNBLOCK !!!
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

