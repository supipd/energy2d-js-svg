
// *******************************************************
//
//   RadiositySolver2D ... This solves the radiosity equation.
//
// *******************************************************

model2d.RadiositySolver2D = function(model) {

    this.model = model;
    
	this.segments = [];
	this.patchSize;
	this.patchSizePercentage = model.perimeterStepSize; //0.05;
	this.reflection = [];  //[][];
	this.absorption = [];  //[][];
	this.relaxationSteps = 2; // relaxation may not be needed much as we are already solving a time-dependent problem
}

model2d.RadiositySolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

    if (model.radiative) {
        this.segmentizePerimeters();
    }
}

//model2d.RadiositySolver2D.prototype.measure = function(/*HeatFluxSensor*/ sensor) {
//    var measurement = 0;
//    var dx = this.patchSize * 0.5 * Math.cos(-sensor.angle);
//    var dy = patchSize * 0.5 * Math.sin(-sensor.angle);
//    var x1 = sensor.getX() - dx;
//    var x2 = sensor.getX() + dx;
//    var y1 = sensor.getY() - dy;
//    var y2 = sensor.getY() + dy;
//    var /*Segment*/ ss = new Segment(x1, y1, x2, y2, null);
//    this.segments.forEach(s => {
//        if (this.isVisible(s, ss)) {
//            var vf = s.getViewFactor(ss);
//            if (vf > 1) // FIXME: Why is our view factor larger than 1 when two patches are very close?
//                vf = 1;
//            this.measurement += s.radiation * vf;
//        }
//    });
//    return measurement;
//}

model2d.RadiositySolver2D.prototype.solve = function() {

    var n = this.segments.length;
    if (n <= 0)
        return;

    var/*Segment*/ s;

    // compute emission of each segment using Stefan's Law (offset by the background radiation)
    for (var i = 0; i < n; i++) {
        s = this.segments[i];
        if (s.part.emissivity > 0) {
            var c = s.c;
            var temp;
            if (s.part.constantTemperature) {
                temp = s.part.temperature + 273;
            } else {
                temp = this.model.getTemperatureAt(c.x, c.y, /*Sensor.NINE_POINT*/9) + 273; // FIXME: This needs to take the stencil points inwardly
            }
            temp *= temp;
            s.emission = s.part.emissivity * model2d.STEFAN_CONSTANT * temp * temp;
            temp = this.model.backgroundTemperature + 273;
            temp *= temp;
            s.emission -= s.part.emissivity * model2d.STEFAN_CONSTANT * temp * temp;
        }
    }

    // apply Gauss-Seidel relaxation to get outgoing radiation for each segment (solving the radiosity matrix equation)
    for (var k = 0; k < this.relaxationSteps; k++) {
        for (var i = 0; i < n; i++) {
            s = this.segments[i];
            s.radiation = s.emission;
            for (var j = 0; j < n; j++) {
                if (j != i)
                    s.radiation -= this.reflection[i*n+j] * this.segments[j].radiation;
            }
            s.radiation /= this.reflection[i*n+i];
        }
    }

    // get the radiation from other segments that ends up being absorbed by each segment
    for (var i = 0; i < n; i++) {
        s = this.segments[i];
        s.absorption = 0;
        for (var j = 0; j < n; j++) {
            if (j != i)
                s.absorption += this.absorption[i*n+j] * this.segments[j].radiation;
        }
    }

    var gx = this.model.nx / this.model.lx;
    var gy = this.model.ny / this.model.ly;
    var power;
    var length;
    var dx, dy;
    for (var i = 0; i < n; i++) {
        s = this.segments[i];
        length = model2d.G.lineLength(s);
        var m = length * Math.max(gx, gy);
        if (m > 1) {
            power = (s.absorption - s.emission) / (m - 1);
            // equally divide and add energy to the power density array (the last round of radiation energy has been stored as thermal energy by the heat solver)
            dx = (s.x2 - s.x1) / m;
            dy = (s.y2 - s.y1) / m;
            // somehow we have to bypass the end points to avoid duplicating energy around a corner
            for (var a = 1; a < m; a++)
                this.model.changePowerAt(s.s.x + dx * a, s.y1 + dy * a, power);
        }
    }
}

// populate the reflection matrix and the absorption matrix using visibility and view factors
model2d.RadiositySolver2D.prototype.computeReflectionAndAbsorptionMatrices = function() {

    var G = model2d.G;
    
    var n = this.segments.length;
    var ni, nij, nj, nji;
    var/*Segment*/ s1, s2;
    var vf;
    for (var i = 0; i < n; i++) {
        ni = n * i;
        for (var j = 0; j < n; j++) {
            nij = ni + j;
            this.reflection[nij] = i == j ? 1 : 0; // the diagonal elements must be one because a segment is a line (hence the view factor must be zero)
            this.absorption[nij] = 0; // the diagonal elements must be zero as a segment cannot absorb its own radiation
        }
    }
    for (var i = 0; i < n - 1; i++) {
        ni = n * i;
        nj = n * j;
        s1 = this.segments[i];
        for (var j = i + 1; j < n; j++) {
            nij = ni + j;
            nji = nj + i;
            s2 = this.segments[j];
            if (this.isVisible(s1, s2)) {
                vf = G.viewFactor(s1, s2);
                if (vf > 1) // FIXME: Why is our view factor larger than 1 when two patches are very close?
                    vf = 1;
                // the order of s1 and s2 is important below
                var lengthRatio = G.lineLength(s1) / G.lineLength(s2); // apply the reciprocity rule
                this.reflection[nij] = -s1.part.reflection * vf;
                this.reflection[nji] = -s2.part.reflection * vf * lengthRatio;
                this.absorption[nij] = s1.part.absorption * vf;
                this.absorption[nji] = s2.part.absorption * vf * lengthRatio;
            }
        }
    }
}

model2d.RadiositySolver2D.prototype.segmentizePerimeters = function() {
    this.segments = [];
    this.patchSize = this.model.lx * this.patchSizePercentage;
    for(var i=0; i<this.model.parts.length; i++) {
        var part = this.model.parts[i];
        if (part.transmission > 0.9999)
            continue;
        //this.segmentizePerimeter(part);
        this.segments = this.segments.concat(part.segments);
    }
    var n = this.segments.length;
    this.reflection = createArray(n, 0);
    this.absorption = createArray(n, 0);
    this.computeReflectionAndAbsorptionMatrices();
}

// can the two segments see each other?
model2d.RadiositySolver2D.prototype.isVisible = function(s1, s2) {
    for(var i=0; i<this.model.parts.length; i++) {
        var part = this.model.parts[i];
        if (part.transmission > 0.9999) // TODO: We just handle the complete transparent case here
            continue;
        if (part.intersectsLine(s1, s2))
            return false;
    }
    return true;
}

