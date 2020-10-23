

// *******************************************************
//
//   Photons
//
// *******************************************************

// float x, float y, float energy, float c
model2d.Photon = function(rx, ry, energy, angle, c) {
    this.rx = rx;
    this.ry = ry;
    this.energy = energy;
    this.c = c;
    this.setAngle(angle);
};


model2d.Photon.prototype.setAngle = function(angle) {
    this.vx =  Math.cos(angle) * this.c;
    this.vy =  Math.sin(angle) * this.c;
};

// float xmin, float xmax, float ymin, float ymax
model2d.Photon.prototype.isContained = function(xmin, xmax, ymin, ymax) {
    return this.rx >= xmin && this.rx <= xmax && this.ry >= ymin && this.ry <= ymax;
};

// float dt
model2d.Photon.prototype.move = function(dt) {
    this.rx += this.vx * dt;
    this.ry += this.vy * dt;
};


