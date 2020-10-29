
// *******************************************************
//
//   ParticleSolver2D
//
// *******************************************************

model2d.ParticleSolver2D = function(model) {

    this.model = model;

    this.epsilon = 0.000001;
    this.rCutOffSquare = 2;
	this.g = 9.8;
	this.drag = 0.01;
	this.thermophoreticCoefficient = 0;
	this.particleFluidTransfer = 0.05; // temporary parameter
	this.attractive = 0;

    this.timeStep = 0.1;
    this.convective = model.convective;

    this.u = model.u;
    this.v = model.v;
    this.t = model.t;
}
model2d.ParticleSolver2D.prototype.INTERNAL_GRAVITY_UNIT = 0.0001;
model2d.ParticleSolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

    this.boundary = model.massBoundary;
    this.parts = model.parts;
    this.particles = model.particles;
}

model2d.ParticleSolver2D.prototype.move = function(/*Model2D*/ M) {
    var timeStep = M.timeStep;
    var convective = M.convective;
    var fluidDensity = M.backgroundDensity;
    var fluidConductivity = M.backgroundConductivity;

    this.particles.forEach( (p, ip) => {        
        if (this.interactWithBoundary(p, M.fluidSolver.boundary)) {
            p.removeShape();
            this.particles.splice(ip,1);  //  it.remove();
        }
    });
    this.particles.forEach( p => {
        p.fx = p.fy = 0.0;
        p.predict(timeStep);
        this.interactWithFluid(p, fluidDensity);
    });
    if (this.epsilon > 0)
        this.computeParticleCollisions();
    this.particles.forEach( p => {
        p.correct(timeStep);
        p.fx /= p.mass;
        p.fy /= p.mass;
        this.interactWithParts(p);
        if (!isNaN(p.temperature)) {
            var txy = this.particleFluidTransfer * fluidConductivity * (p.temperature - M.getTemperatureAt(p.rx, p.ry));
            var n = Math.max(1, Math.floor(8 * M.nx * p.radius / M.lx)); // discretize contact surface into n slices
            for (var i = 0; i < n; i++) {
                var theta = 2 * Math.PI / n * i;
                M.changeTemperatureAt(p.rx + p.radius * Math.cos(theta), p.ry + p.radius * Math.sin(theta), txy);
            }
        }
    });
}

model2d.ParticleSolver2D.prototype.interactWithFluid = function(p, fluidDensity) {
    var M = this.model;

    var volume = Math.PI * p.radius * p.radius;
    var buoyantForce = this.INTERNAL_GRAVITY_UNIT * this.g * (p.mass - fluidDensity * volume);
    if (this.convective) {
        var i = Math.floor(p.rx / M.lx * M.nx);
        var j = Math.floor(p.ry / M.ly * M.ny);
        if (i < 0)
            i = 0;
        else if (i >= M.nx)
            i = M.nx - 1;
        if (j < 0)
            j = 0;
        else if (j >= M.ny)
            j = M.ny - 1;
        p.fx += this.drag * (this.u[i * M.nx + j] - p.vx);
        p.fy += this.drag * (this.v[i * M.nx + j] - p.vy) + buoyantForce;
        // Newton's Third Law: Add the buoyant force back to the fluid
        this.v[i * M.nx + j] -= buoyantForce * this.timeStep;
    } else {
        p.fx += -this.drag * p.vx;
        p.fy += -this.drag * p.vy + buoyantForce;
    }
    if (this.thermophoreticCoefficient > 0) {
        var i = Math.floor(p.rx / M.lx * M.nx);
        var j = Math.floor(p.ry / M.ly * M.ny);
        if (i < 0)
            i = 0;
        else if (i >= M.nx)
            i = nx - 1;
        if (j < 0)
            j = 0;
        else if (j >= M.ny)
            j = M.ny - 1;
        if (Math.abs(t[i * M.nx + j]) > 0.1) {
            var i1 = Math.floor((p.rx - p.radius) / M.lx * M.nx);
            var i2 = Math.floor((p.rx + p.radius) / M.lx * M.nx);
            var j1 = Math.floor((p.ry - p.radius) / M.ly * M.ny);
            var j2 = Math.floor((p.ry + p.radius) / M.ly * M.ny);
            if (i1 < 0)
                i1 = 0;
            else if (i1 >= M.nx)
                i1 = M.nx - 1;
            if (i2 < 0)
                i2 = 0;
            else if (i2 >= M.nx)
                i2 = M.nx - 1;
            if (j1 < 0)
                j1 = 0;
            else if (j1 >= M.ny)
                j1 = M.ny - 1;
            if (j2 < 0)
                j2 = 0;
            else if (j2 >= ny)
                j2 = M.ny - 1;
            p.fx -= this.thermophoreticCoefficient / p.mass * (t[i2 * M.nx + j] - t[i1 * M.nx + j]) / t[i * M.nx + j];
            p.fy -= this.thermophoreticCoefficient / p.mass * (t[i * M.nx + j2] - t[i * M.nx + j1]) / t[i * M.nx + j];
        }
    }
}

model2d.ParticleSolver2D.prototype.interactWithParts = function(/*Particle*/ p) {
//    synchronized (parts) {
        //for (Part part : parts) {
        for (var i=0; i<this.parts.length; i++) {
            var part = this.parts[i];
            if (part.reflect(p, false))
                break;
        }
//    }
}

model2d.ParticleSolver2D.prototype.interactWithBoundary = function(/*Particle*/ p, /*MassBoundary*/ boundary) {
    var M = this.model;

    var dt2 = this.timeStep * this.timeStep * 0.5;
    var predictedX = p.rx + p.vx * this.timeStep + p.ax * dt2;
    var predictedY = p.ry + p.vy * this.timeStep + p.ay * dt2;
//    if (boundary instanceof SimpleMassBoundary) {
//        SimpleMassBoundary b = (SimpleMassBoundary) boundary;
    var boundary = this.boundary;
    switch (boundary.mass_flow_at_border.right) {
        case model2d.MassBoundary_REFLECTIVE:
            if (predictedX + p.radius > M.lx)
                p.vx = -Math.abs(p.vx);
            break;
        case model2d.MassBoundary_STOP:
            if (predictedX + p.radius > M.lx)
                p.vx = 0;
            break;
        case model2d.MassBoundary_PERIODIC:
            if (predictedX > M.lx)
                p.rx -= M.lx - p.radius;
            break;
        case model2d.MassBoundary_THROUGH:
            if (predictedX - p.radius > M.lx)
                return true;
    }
    switch (boundary.mass_flow_at_border.left) {
        case model2d.MassBoundary_REFLECTIVE:
            if (predictedX - p.radius < 0)
                p.vx = Math.abs(p.vx);
            break;
        case model2d.MassBoundary_STOP:
            if (predictedX - p.radius < 0)
                p.vx = 0;
            break;
        case model2d.MassBoundary_PERIODIC:
            if (predictedX < 0)
                p.rx += lx - p.radius;
            break;
        case model2d.MassBoundary_THROUGH:
            if (predictedX + p.radius < 0)
                return true;
    }
    switch (boundary.mass_flow_at_border.lower) {
        case model2d.MassBoundary_REFLECTIVE:
            if (predictedY + p.radius > M.ly)
                p.vy = -Math.abs(p.vy);
            break;
        case model2d.MassBoundary_STOP:
            if (predictedY + p.radius > M.ly)
                p.vy = 0;
            break;
        case model2d.MassBoundary_PERIODIC:
            if (predictedY > M.ly)
                p.ry -= M.ly - p.radius;
            break;
        case model2d.MassBoundary_THROUGH:
            if (predictedY - p.radius > M.ly)
                return true;
    }
    switch (boundary.mass_flow_at_border.upper) {
        case model2d.MassBoundary_REFLECTIVE:
            if (predictedY - p.radius < 0)
                p.vy = Math.abs(p.vy);
            break;
        case model2d.MassBoundary_STOP:
            if (predictedY - p.radius < 0)
                p.vy = 0;
            break;
        case model2d.MassBoundary_PERIODIC:
            if (predictedY < 0)
                p.ry += ly - p.radius;
            break;
        case model2d.MassBoundary_THROUGH:
            if (predictedY + p.radius < 0)
                return true;
    }
//    }
    return false;
}

// use Lennard-Jones potential to implement interactions of round particles (by default, a short cutoff is used to turn off the attraction)
model2d.ParticleSolver2D.prototype.computeParticleCollisions = function() {

    var n = this.particles.length;
    if (n <= 0)
        return;

    for (var i = 0; i < n - 1; i++) {
        var/*Particle*/ pi = this.particles[i];
        var fxi = pi.fx;
        var fyi = pi.fy;

        for (var  j = i + 1; j < n; j++) {
            var/*Particle*/ pj = this.particles[j];
            var rxij = pi.rx - pj.rx;
            var ryij = pi.ry - pj.ry;
            var rijsq = rxij * rxij + ryij * ryij;

            if (rijsq < this.rCutOffSquare * 4.0 * pi.radius * pj.radius) {
                var sigma = pi.radius + pj.radius;
                sigma *= sigma;
                var sr2 = sigma / rijsq;
                /* check if this pair gets too close */
                if (sr2 > 10.0) {
                    sr2 = 10.0;
                    rijsq = sigma * sigma;
                }
                var sr6 = sr2 * sr2 * sr2;
                var sr12 = sr6 * sr6;
                var fij = 6 * this.epsilon / rijsq * (2 * sr12 - this.attractive * sr6);
                var fxij = fij * rxij;
                var fyij = fij * ryij;
                fxi += fxij;
                fyi += fyij;
                pj.fx -= fxij;
                pj.fy -= fyij;
            }
        }
        pi.fx = fxi;
        pi.fy = fyi;
    }
}

model2d.ParticleSolver2D.prototype.reset = function() {
    this.particles.forEach( (p, ip) => {        
        if (!p.restoreState())
            this.particles.splice(i,1);  //  it.remove();
    });
}


