

// *******************************************************
//
//   HeatSolver2D
//
// *******************************************************

model2d.HeatSolver2D = function(/*nx, ny,*/ model) {

    this.model = model;
    
    this.zHeatDiffusivityOnlyForFluid = model.zHeatDiffusivityOnlyForFluid;
    this.zHeatDiffusivity = model.zHeatDiffusivity;
    this.backgroundTemperature = model.backgroundTemperature;

    // Float arrays
    this.conductivity = model.conductivity;
    this.specificHeat = model.specificHeat;
    this.density = model.density;
    this.u = model.u;
    this.v = model.v;
    this.tb = model.tb;
    this.power = model.q;
    
    // Boolean array
    this.fluidity = model.fluidity;
    
    this.nx = model.nx;
    this.ny = model.ny;
    this.nx1 = this.nx - 1;
    this.ny1 = this.ny - 1;
    this.nx2 = this.nx - 2;
    this.ny2 = this.ny - 2;

    this.timeStep = 0.1;
    this.relaxationSteps = 5;
    
    // array that stores the previous temperature results
    this.t0 = createArray(model2d.ARRAY_SIZE, 0);

};

model2d.HeatSolver2D.prototype.activate = function() {
    var model = this.model;

    this.timeStep = model.timeStep;

    if (model.boundary_settings.temperature_at_border)
        this.boundary = new model2d.DirichletHeatBoundary(model.boundary_settings);
    else
        this.boundary = new model2d.NeumannHeatBoundary(model.boundary_settings);
}

model2d.HeatSolver2D.prototype.setGridCellSize = function(deltaX, deltaY) {
    this.deltaX = deltaX;
    this.deltaY = deltaY;
};

model2d.HeatSolver2D.prototype.solve = function(convective, t, q) {
    model2d.copyArray(this.t0, t);
   
    var nx = this.nx;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    
    var inx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    var conductivity = this.conductivity;
    var specificHeat = this.specificHeat;
    var density = this.density;

    var tb = this.tb;
    var t0 = this.t0;
    
    var hx = 0.5 / (this.deltaX * this.deltaX);
    var hy = 0.5 / (this.deltaY * this.deltaY);
    var rij, sij, axij, bxij, ayij, byij;
    var invTimeStep = 1.0 / this.timeStep;

    var solveZ = !!this.zHeatDiffusivity;

    for (var k = 0; k < this.relaxationSteps; k++) {
        for (var i = 1; i < nx1; i++) {
            inx = i * nx;
            for (var j = 1; j < ny1; j++) {
                jinx = inx + j;
                if (isNaN(tb[jinx])) {

                    jinx_minus_nx = jinx - nx;
                    jinx_plus_nx = jinx + nx;
                    jinx_minus_1 = jinx - 1;
                    jinx_plus_1 = jinx + 1;
                    
                    // how do we deal with vacuum? if(density[i][j]==0 || density[i-1][j]==0||density[i+1][j]==0||density[i][j-1]==0||density[i][j+1]==0) continue;
                    sij = specificHeat[jinx] * density[jinx] * invTimeStep;
                    rij = conductivity[jinx];
                    axij = hx * (rij + conductivity[jinx_minus_nx]);
                    bxij = hx * (rij + conductivity[jinx_plus_nx]);
                    ayij = hy * (rij + conductivity[jinx_minus_1]);
                    byij = hy * (rij + conductivity[jinx_plus_1]);
                    t[jinx] = ( t0[jinx] * sij 
                                + q[jinx] 
                                + axij * t[jinx_minus_nx] 
                                + bxij * t[jinx_plus_nx] 
                                + ayij * t[jinx_minus_1] 
                                + byij * t[jinx_plus_1]
                              ) / (sij + axij + bxij + ayij + byij);
                    // use a simple proportional control only at the last step of relaxation if applicable
                    if (solveZ && k == this.relaxationSteps - 1) {
                        if (!this.zHeatDiffusivityOnlyForFluid || (this.zHeatDiffusivityOnlyForFluid && this.fluidity[jinx]))
                            t[jinx] -= this.zHeatDiffusivity * this.timeStep * (t0[jinx] - this.backgroundTemperature);
                    }
                } else {
                    t[jinx] = tb[jinx];
                }
            }
        }
        this.applyBoundary(t);
    }
    if (convective) {
        this.advect(t);
    }
};

model2d.HeatSolver2D.prototype.advect = function(t) {
    this.macCormack(t);
};

model2d.HeatSolver2D.prototype.macCormack  = function(t) {
    var tx = 0.5 * this.timeStep / this.deltaX;
    var ty = 0.5 * this.timeStep / this.deltaY;
    
    var nx = this.nx;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    
    var inx, inx_minus_nx, jinx, jinx_plus_nx, jinx_minus_nx, jinx_plus_1, jinx_minus_1;
    
    var fluidity = this.fluidity;

    var t0 = this.t0;
    var u = this.u;
    var v = this.v;

    for (var i = 1; i < nx1; i++) {
        inx = i * nx;
        inx_minus_nx = inx - nx;
        for (var j = 1; j < ny1; j++) {
            jinx = inx + j;
            jinx_minus_nx = jinx - nx;
            jinx_plus_nx = jinx + nx;
            jinx_minus_1 = jinx - 1;
            jinx_plus_1 = jinx + 1;
            if (fluidity[jinx]) {
                t0[jinx] = t[jinx] - tx
                * (u[jinx_plus_nx] * t[jinx_plus_nx] - u[jinx_minus_nx] * t[jinx_minus_nx]) - ty
                * (v[jinx_plus_1] * t[jinx_plus_1] - v[jinx_minus_1] * t[jinx_minus_1]);
            }
        }
    }
    this.applyBoundary(t0);

    for (var i = 1; i < nx1; i++) {
        inx = i * nx;
        for (var j = 1; j < ny1; j++) {
            jinx = inx + j;
            if (fluidity[jinx]) {
                jinx_minus_nx = jinx - nx;
                jinx_plus_nx = jinx + nx;
                jinx_minus_1 = jinx - 1;
                jinx_plus_1 = jinx + 1;
                
                t[jinx] = 0.5 * (t[jinx] + t0[jinx]) - 0.5 * tx * u[jinx]
                * (t0[jinx_plus_nx] - t0[jinx_minus_nx]) - 0.5 * ty * v[jinx]
                * (t0[jinx_plus_1] - t0[jinx_minus_1]);
            }
        }
    }
    this.applyBoundary(t);
};

model2d.HeatSolver2D.prototype.applyBoundary  = function(t) {
    var nx = this.nx;
    var ny = this.ny;
    var nx1 = this.nx1;
    var ny1 = this.ny1;
    var nx2 = this.nx2;
    var ny2 = this.ny2;
    var conductivity = this.conductivity;
    var deltaX = this.deltaX;
    var deltaY = this.deltaY;
    var b = this.boundary;
    var tN, tS, tW, tE, fN, fS, fW, fE;
    var inx, inx_ny1;
    if (    (b instanceof model2d.DirichletHeatBoundary)
        ||  (b instanceof model2d.ComplexDirichletThermalBoundary)    ) {
        tN = b.getTemperatureAtBorder(model2d.Boundary_UPPER);
        tS = b.getTemperatureAtBorder(model2d.Boundary_LOWER);
        tW = b.getTemperatureAtBorder(model2d.Boundary_LEFT);
        tE = b.getTemperatureAtBorder(model2d.Boundary_RIGHT);
        for (var i = 0; i < nx; i++) {
            inx = i * nx;
            t[inx] = tN;
            t[inx + ny1] = tS;
        }
        for (var j = 0; j <  ny; j++) {
            t[j] = tW;
            t[nx1 * nx + j] = tE;
        }
    } else if (b instanceof model2d.NeumannHeatBoundary) {
        fN = b.getFluxAtBorder(model2d.Boundary_UPPER);
        fS = b.getFluxAtBorder(model2d.Boundary_LOWER);
        fW = b.getFluxAtBorder(model2d.Boundary_LEFT);
        fE = b.getFluxAtBorder(model2d.Boundary_RIGHT);
        for (var i = 0; i < this.nx; i++) {
            inx = i * nx;
            inx_ny1 = inx + ny1;
            t[inx] = t[inx + 1] + fN * deltaY / conductivity[inx];
            t[inx_ny1] = t[inx + ny2] - fS * deltaY / conductivity[inx_ny1];
        }
        for (var j = 0; j < ny; j++) {
            t[j] = t[nx + j] - fW * deltaX / conductivity[j];
            t[nx1 * nx + j] = t[nx2 * nx + j] + fE * deltaX / conductivity[nx1 * nx + j];
        }
    }
};

//  This is a simple Dirichlet thermal boundary that has the same temperature on each side.
model2d.DirichletHeatBoundary = function(boundary_settings) {
    // by default all temperatures are zero
    var settings;
    if (boundary_settings) {
        settings = boundary_settings.temperature_at_border;
    } else {
        settings = { upper: 0, lower: 0, left: 0, right: 0 };
    }
    this.temperature_at_border = createArray(4, 0); // unit: centigrade
    this.setTemperatureAtBorder(model2d.Boundary_UPPER, settings.upper);
    this.setTemperatureAtBorder(model2d.Boundary_LOWER, settings.lower);
    this.setTemperatureAtBorder(model2d.Boundary_LEFT, settings.left);
    this.setTemperatureAtBorder(model2d.Boundary_RIGHT, settings.right);
};

model2d.DirichletHeatBoundary.prototype.getTemperatureAtBorder  = function(side) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    return this.temperature_at_border[side];
};

model2d.DirichletHeatBoundary.prototype.setTemperatureAtBorder  = function(side, value) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    this.temperature_at_border[side] = value;
};

//  If you need different temperatures within each side, use ComplexDirichletThermalBoundary.
model2d.ComplexDirichletThermalBoundary = function(nx, ny) {
    // unit: centigrade
    this.temperatureLeft = new Array(ny).fill(0);
    this.temperatureRight = new Array(ny).fill(0);
    this.temperatureUpper = new Array(nx).fill(0);
    this.temperatureLower = new Array(nx).fill(0);
    this.setTemperatureAtBorder(model2d.Boundary_UPPER, settings.upper);
    this.setTemperatureAtBorder(model2d.Boundary_LOWER, settings.lower);
    this.setTemperatureAtBorder(model2d.Boundary_LEFT, settings.left);
    this.setTemperatureAtBorder(model2d.Boundary_RIGHT, settings.right);
};

model2d.ComplexDirichletThermalBoundary.prototype.getTemperatureAtBorder  = function(side) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    switch (side) {
    case LEFT:
        return this.temperatureLeft;
    case RIGHT:
        return this.temperatureRight;
    case UPPER:
        return this.temperatureUpper;
    default:
        return this.temperatureLower;
    }
};

model2d.ComplexDirichletThermalBoundary.prototype.setTemperatureAtBorder  = function(side, values) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    switch (side) {
    case LEFT:
        if (values.length != this.temperatureLeft.length)
            throw ("array lengths do not match: left boundary temperatures");
        for (i = 0; i < this.temperatureLeft.length; i++)
            this.temperatureLeft[i] = values[i];
        break;
    case RIGHT:
        if (values.length != this.temperatureRight.length)
            throw ("array lengths do not match: right boundary temperatures");
        for (i = 0; i < this.temperatureRight.length; i++)
            this.temperatureRight[i] = values[i];
        break;
    case UPPER:
        if (values.length != this.temperatureUpper.length)
            throw ("array lengths do not match: upper boundary temperatures");
        for (i = 0; i < this.temperatureUpper.length; i++)
            this.temperatureUpper[i] = values[i];
        break;
    case LOWER:
        if (values.length != this.temperatureLower.length)
            throw ("array lengths do not match: lower boundary temperatures");
        for (i = 0; i < this.temperatureLower.length; i++)
            this.temperatureLower[i] = values[i];
        break;
    }
};


model2d.NeumannHeatBoundary = function(boundary_settings) {
    var settings;
    if (boundary_settings) {
        settings = boundary_settings.flux_at_border;
    } else {
        settings = { upper: 0, lower: 0, left: 0, right: 0 };
    }
    this.flux_at_border = createArray(4, 0); // heat flux: unit w/m^2
    this.setFluxAtBorder(model2d.Boundary_UPPER, settings.upper);
    this.setFluxAtBorder(model2d.Boundary_LOWER, settings.lower);
    this.setFluxAtBorder(model2d.Boundary_LEFT, settings.left);
    this.setFluxAtBorder(model2d.Boundary_RIGHT, settings.right);
};

model2d.NeumannHeatBoundary.prototype.getFluxAtBorder  = function(side) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    return this.flux_at_border[side];
};

model2d.NeumannHeatBoundary.prototype.setFluxAtBorder  = function(side, value) {
    if (side < model2d.Boundary_UPPER || side > model2d.Boundary_LEFT)
        throw ("side parameter illegal");
    this.flux_at_border[side] = value;
};


