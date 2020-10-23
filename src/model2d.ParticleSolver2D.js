
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

    this.particles = model.particles;
    this.parts = model.parts;
    this.u = model.u;
    this.v = model.v;
    this.t = model.t;
    
    this.nx = model.nx;
    this.ny = model.ny;
    
}

model2d.ParticleSolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

}

model2d.ParticleSolver2D.prototype.move = function(/*Model2D*/ model) {
    lx = model.lx;
    ly = model.ly;
    timeStep = model.timeStep;
    convective = model.convective;
    var fluidDensity = model.backgroundDensity;
    var fluidConductivity = model.backgroundConductivity;
//    synchronized (particles) {
//        for (Iterator<Particle> it = particles.iterator(); it.hasNext();) {
//            Particle p = it.next();
        this.particles.forEach( (p, ip) => {        
            if (this.interactWithBoundary(p, model.getMassBoundary()))
                this.particles.splice(i,1);  //  it.remove();
        });
        this.particles.forEach( p => {  //for (Particle p : particles) {
            p.fx = p.fy = 0.0;
            p.predict(timeStep);
            this.interactWithFluid(p, fluidDensity);
        });
        if (epsilon > 0)
            this.computeParticleCollisions();
        this.particles.forEach( p => {  //for (Particle p : particles) {
            p.correct(timeStep);
            p.fx /= p.mass;
            p.fy /= p.mass;
            this.interactWithParts(p);
            if (!isNaN(p.temperature)) {
                var txy = this.particleFluidTransfer * fluidConductivity * (p.temperature - model.getTemperatureAt(p.rx, p.ry));
                var n = Math.max(1, (int) (8 * nx * p.radius / lx)); // discretize contact surface into n slices
                for (var i = 0; i < n; i++) {
                    var theta = 2 * Math.PI / n * i;
                    model.changeTemperatureAt(p.rx + p.radius * Math.cos(theta), p.ry + p.radius * Math.sin(theta), txy);
                }
            }
        });
//    }
}

model2d.ParticleSolver2D.prototype.interactWithFluid = function(/*Particle*/ p, /*float*/ fluidDensity) {
    var volume = Math.PI * p.radius * p.radius;
    var buoyantForce = model2d.INTERNAL_GRAVITY_UNIT * g * (p.mass - fluidDensity * volume);
    if (this.convective) {
        var i = Math.floor(p.rx / lx * nx);
        var j = Math.floor(p.ry / ly * ny);
        if (i < 0)
            i = 0;
        else if (i >= nx)
            i = nx - 1;
        if (j < 0)
            j = 0;
        else if (j >= ny)
            j = ny - 1;
        p.fx += drag * (u[i][j] - p.vx);
        p.fy += drag * (v[i][j] - p.vy) + buoyantForce;
        // Newton's Third Law: Add the buoyant force back to the fluid
        v[i][j] -= buoyantForce * this.timeStep;
    } else {
        p.fx += -drag * p.vx;
        p.fy += -drag * p.vy + buoyantForce;
    }
    if (this.thermophoreticCoefficient > 0) {
        var i = Math.floor(p.rx / lx * nx);
        var j = Math.floor(p.ry / ly * ny);
        if (i < 0)
            i = 0;
        else if (i >= nx)
            i = nx - 1;
        if (j < 0)
            j = 0;
        else if (j >= ny)
            j = ny - 1;
        if (Math.abs(t[i][j]) > 0.1) {
            var i1 = Math.floor((p.rx - p.radius) / lx * nx);
            var i2 = Math.floor((p.rx + p.radius) / lx * nx);
            var j1 = Math.floor((p.ry - p.radius) / ly * ny);
            var j2 = Math.floor((p.ry + p.radius) / ly * ny);
            if (i1 < 0)
                i1 = 0;
            else if (i1 >= nx)
                i1 = nx - 1;
            if (i2 < 0)
                i2 = 0;
            else if (i2 >= nx)
                i2 = nx - 1;
            if (j1 < 0)
                j1 = 0;
            else if (j1 >= ny)
                j1 = ny - 1;
            if (j2 < 0)
                j2 = 0;
            else if (j2 >= ny)
                j2 = ny - 1;
            p.fx -= this.thermophoreticCoefficient / p.mass * (t[i2][j] - t[i1][j]) / t[i][j];
            p.fy -= this.thermophoreticCoefficient / p.mass * (t[i][j2] - t[i][j1]) / t[i][j];
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
    var dt2 = this.timeStep * this.timeStep * 0.5;
    var predictedX = p.rx + p.vx * this.timeStep + p.ax * dt2;
    var predictedY = p.ry + p.vy * this.timeStep + p.ay * dt2;
/*    if (boundary instanceof SimpleMassBoundary) {
        SimpleMassBoundary b = (SimpleMassBoundary) boundary;
        switch (b.getFlowTypeAtBorder(Boundary.RIGHT)) {
        case MassBoundary.REFLECTIVE:
            if (predictedX + p.radius > lx)
                p.vx = -Math.abs(p.vx);
            break;
        case MassBoundary.STOP:
            if (predictedX + p.radius > lx)
                p.vx = 0;
            break;
        case MassBoundary.PERIODIC:
            if (predictedX > lx)
                p.rx -= lx - p.radius;
            break;
        case MassBoundary.THROUGH:
            if (predictedX - p.radius > lx)
                return true;
        }
        switch (b.getFlowTypeAtBorder(Boundary.LEFT)) {
        case MassBoundary.REFLECTIVE:
            if (predictedX - p.radius < 0)
                p.vx = Math.abs(p.vx);
            break;
        case MassBoundary.STOP:
            if (predictedX - p.radius < 0)
                p.vx = 0;
            break;
        case MassBoundary.PERIODIC:
            if (predictedX < 0)
                p.rx += lx - p.radius;
            break;
        case MassBoundary.THROUGH:
            if (predictedX + p.radius < 0)
                return true;
        }
        switch (b.getFlowTypeAtBorder(Boundary.LOWER)) {
        case MassBoundary.REFLECTIVE:
            if (predictedY + p.radius > ly)
                p.vy = -Math.abs(p.vy);
            break;
        case MassBoundary.STOP:
            if (predictedY + p.radius > ly)
                p.vy = 0;
            break;
        case MassBoundary.PERIODIC:
            if (predictedY > ly)
                p.ry -= ly - p.radius;
            break;
        case MassBoundary.THROUGH:
            if (predictedY - p.radius > ly)
                return true;
        }
        switch (b.getFlowTypeAtBorder(Boundary.UPPER)) {
        case MassBoundary.REFLECTIVE:
            if (predictedY - p.radius < 0)
                p.vy = Math.abs(p.vy);
            break;
        case MassBoundary.STOP:
            if (predictedY - p.radius < 0)
                p.vy = 0;
            break;
        case MassBoundary.PERIODIC:
            if (predictedY < 0)
                p.ry += ly - p.radius;
            break;
        case MassBoundary.THROUGH:
            if (predictedY + p.radius < 0)
                return true;
        }
    } */
    return false;
}

// use Lennard-Jones potential to implement interactions of round particles (by default, a short cutoff is used to turn off the attraction)
model2d.ParticleSolver2D.prototype.computeParticleCollision = function() {

    var n = this.particles.length;
    if (n <= 0)
        return;

//    synchronized (particles) {
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
//    }
}

model2d.ParticleSolver2D.prototype.reset = function() {
//    synchronized (particles) {
//        for (Iterator<Particle> it = particles.iterator(); it.hasNext();) {
//            Particle p = it.next();
        this.particles.forEach( (p, ip) => {        
            if (!p.restoreState())
                this.particles.splice(i,1);  //  it.remove();
        });
//    }
}


