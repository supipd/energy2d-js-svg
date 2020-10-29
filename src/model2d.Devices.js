

// *******************************************************
//
//   Elements
//
// *******************************************************

model2d.Text = function(x, y, text, model) {

    this.model = model;
    
	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.text = text;

    this.x = x;
    this.y = y;
    this.shape = null;

    this.svgElement = null;
    this.bBoxRect = {x:0, y:0, w:0, h:0};
}

model2d.Picture = function(x, y, image, model) {

    this.model = model;
    
	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.image = image;

    this.x = x;
    this.y = y;
    this.shape = null;

    this.svgElement = null;
    this.bBoxRect = {x:0, y:0, w:0, h:0};
}



// *******************************************************
//
//   Actuators
//
// *******************************************************

// *******************************************************
//   Fan
// A fan that increases the speed of fluid flowing through it.
// *******************************************************
model2d.Fan = function(fan/*x, y, w, h, speed, angle*/, model) {

    this.model = model;
    
	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.speed = fan.speed;
    this.angle = fan.angle;

    this.x = fan.x;
    this.y = fan.y;
    this.w = fan.width;
    this.h = fan.height;

    this.svgElement = this.createShape(model.svg);
    this.occupationIndexes = {};
//    this.bBoxRect = {x:this.x, y:this.y, w:this.w, h:this.h};
}

model2d.Fan.prototype.createShape = function(svg) {
    var svgG = svg.group;
    var scale_x = svg.scale_x;
    var scale_y = svg.scale_y;

    rect = svgG.ownerDocument.createElementNS(svgNS, 'rect');
    rect.setAttribute('x',this.x * scale_x);
    rect.setAttribute('y',this.y * scale_y);
    rect.setAttribute('width',this.w * scale_x);
    rect.setAttribute('height',this.h * scale_y);

    var svgElement = svgG.appendChild(rect);
    return svgElement;
}

//model2d.Fan.prototype.contains = function(x, y, tolerateRoundOffError, jinx) {    // REPLACE BY occupation !!!
//    // pure rectangle
//    var isX = (x >= this.bBoxRect.x) && (x <= this.bBoxRect.x + this.bBoxRect.w);
//    var isY = (y >= this.bBoxRect.y) && (y <= this.bBoxRect.y + this.bBoxRect.h);
////    return isX && isY;
//    var c = isX && isY
//    ,   cc = jinx in this.occupationIndexes
//    ;
//    if (c != cc) {
//        console.log(x,y,jinx, c,cc);
//    }
//    return c;
//}

//model2d.Fan.prototype.occuped = function(jinx) {    // USE WITHOUT function call !!!
//	return jinx in this.occupationIndexes;
//}

/*
model2d.Fan.prototype.getShape = function(r, speed, angle, delta) {    // r ... Rectangle2D.Float 

    if (r.height > r.width) {
        var d1 = 0.5 * r.height * delta;
        var d2 = d1 * 2;
        var deg = Math.toDegrees(0.5 * Math.asin(r.height / Math.hypot(r.width, r.height)));
        var a = new Area(new Arc2D.Float(r.x + r.width / 4, r.y + d1, r.width / 2, r.height - d2, deg, 180 - 2 * deg, Arc2D.PIE));
        a.add(new Area(new Arc2D.Float(r.x + r.width / 4, r.y + d1, r.width / 2, r.height - d2, -deg, 2 * deg - 180, Arc2D.PIE)));
        a.add(new Area(new Rectangle2D.Float(speed * Math.cos(angle) >= 0 ? r.x : r.x + r.width * 0.5f, r.y + r.height * (0.5f - 0.025f), r.width * 0.5f, 0.05f * r.height)));
        return a;
    }
    var d1 = 0.5f * r.width * delta;
    var d2 = d1 * 2;
    var deg = (float) (Math.toDegrees(0.5 * Math.asin(r.width / Math.hypot(r.width, r.height))));
    Area a = new Area(new Arc2D.Float(r.x + d1, r.y + r.height / 4, r.width - d2, r.height / 2, deg, -2 * deg, Arc2D.PIE));
    a.add(new Area(new Arc2D.Float(r.x + d1, r.y + r.height / 4, r.width - d2, r.height / 2, 180 - deg, 2 * deg, Arc2D.PIE)));
    a.add(new Area(new Rectangle2D.Float(r.x + r.width * (0.5f - 0.025f), speed * Math.sin(angle) > 0 ? r.y : r.y + r.height * 0.5f, 0.05f * r.width, r.height * 0.5f)));
    return a;
}
*/

// *******************************************************
//   Heliostat
// *******************************************************
model2d.Heliostat = function(x, y, w, h, type, target, angle, model) {

    this.model = model;

	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.type = type;
    this.target = target;
    this.angle = angle;
    
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.shape = null;
    this.svgElement = null;
}
/*
model2d.Heliostat.prototype.getShape = function(r, angle) { // r ... Rectangle2D.Float
    // the positions and sizes of the circles must ensure that r is the bounding box
    var a = new Area(new Rectangle2D.Float(r.x + r.width * 0.45f, r.y + r.height * 0.5f, r.width * 0.1f, r.height * 0.5f));
    Area mirror = new Area(new Rectangle2D.Float(r.x, r.y + r.height * 0.45f, r.width, r.height * 0.1f));
    mirror.add(new Area(new Rectangle2D.Float(r.x + 0.3f * r.width, r.y + r.height * 0.54f, r.width * 0.4f, r.height * 0.05f)));
    mirror.transform(AffineTransform.getRotateInstance(angle, r.x + r.width * 0.5, r.y + r.height * 0.5));
    a.add(mirror);
    return a;
}
*/

model2d.Heliostat.prototype.MIRROR = 0;

model2d.Heliostat.prototype.PHOTOVOLTAIC = 1;

model2d.Heliostat.prototype.setAngle = function() {
    var theta;
    if (this.target != null) {
        /*Point2D.Float*/var c1 = target.getCenter();       // TODO
        /*Point2D.Float*/var c2 = this.getCenter();       // TODO
        var dx = c1.x - c2.x;
        var dy = c1.y - c2.y;
        theta = 0.5 * (Math.acos(dx / Math.hypot(dx, dy)) + this.model.getSunAngle());
    } else {
        theta = model.getSunAngle();
    }
    this.angle = Math.PI * 0.5 - theta;
}

model2d.Heliostat.prototype.reflect = function(p) {    // Photon 
    /*Rectangle2D.Float*/var shape = this.svgElement.getBoundingClientRect();   //getShape();
    var lenx = 0.5 * shape.width * Math.cos(angle);
    var leny = 0.5 * shape.width * Math.sin(angle);
    var cenx = 0.5 * shape.width + shape.x;
    var ceny = 0.5 * shape.height + shape.y;
    /*Line2D.Float*/var line = new Line2D.Float(cenx - lenx, ceny - leny, cenx + lenx, ceny + leny);
    var dt = model.timeStep;
    var predictedX = p.rx + p.vx * dt;
    var predictedY = p.ry + p.vy * dt;
    var hit = line.intersectsLine(p.rx, p.ry, predictedX, predictedY);  // TODO
    if (hit) {
        var d12 = 1.0 / Math.hypot(line.x1 - line.x2, line.y1 - line.y2);
        var sin = (line.y2 - line.y1) * d12;
        var cos = (line.x2 - line.x1) * d12;
        var u = p.vx * cos + p.vy * sin; // velocity component parallel to the line
        var w = p.vy * cos - p.vx * sin; // velocity component perpendicular to the line
        p.setVx(u * cos + w * sin);
        p.setVy(u * sin - w * cos);
        return true;
    } 
    return false;
}

// *******************************************************
//   Cloud
// *******************************************************
model2d.Cloud = function(x, y, w, h, speed, model) {

    this.model = model;
    
	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.speed = speed;
    
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.shape = null;
    this.svgElement = null;
}

// *******************************************************
//   Tree
// *******************************************************
model2d.Tree = function(x, y, w, h, type, model) {

    this.model = model;
    
	this.selected;
	this.draggable = true;
	this.visible = true;
	this.label;
	this.uid;

    this.type = type;
    
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.shape = null;
    this.svgElement = null;
}


// *******************************************************
//   Particle
// *******************************************************
model2d.Particle = function(options, nr, model) {

    this.model = model;
      
    // from manipulable
    Object.assign(this, {
        selected: false
    ,   draggable: true
    ,   visible: true
    ,   label: ""
    ,   uid: `Particle_${nr}_${(new Date).valueOf()}`   // unique particle index
    })

    // SVG properties
    this.shape = null;
    this.svgElement = null;
  
    // setup defaults
    Object.assign(this, {
            mass: 0.1
        ,   radius: 0.04
        ,   rx: 0,   ry: 0
        ,   vx: 0,   vy: 0
        ,   ax: 0,   ay: 0
        ,   fx: 0,   fy: 0
        ,   theta: 0,   omega: 0,   alpha: 0
        ,   temperature: NaN
        ,   movable: true
        ,   rx0: NaN,   ry0: NaN
        ,   vx0: NaN,   vy0: NaN
        ,   theta0: NaN,    omega0: NaN
        //	private FillPattern fillPattern;
        ,   color: '#ffffff', velocityColor: '#000000'
    })

    // ovewrite by instance definition
    Object.assign(this, options);

    this.updateShape();
}
model2d.Particle.prototype.distanceSq = function(x, y) {
    var dx = this.rx - x
    ,   dy = this.ry - y
    ;
    return dx * dx + dy * dy;
}
model2d.Particle.prototype.predict = function(dt) {
		if (!this.movable)
			return;
		var dt2 = 0.5 * dt * dt;
		this.rx += this.vx * dt + this.ax * dt2;
		this.ry += this.vy * dt + this.ay * dt2;
		this.vx += this.ax * dt;
		this.vy += this.ay * dt;
		this.theta += this.omega * dt + this.alpha * dt2;
		this.omega += this.alpha * dt;
		this.theta %= Math.PI * 2;
}
model2d.Particle.prototype.correct = function(dt) {
		if (!this.movable)
			return;
		this.vx += 0.5 * dt * (this.fx - this.ax);
		this.vy += 0.5 * dt * (this.fy - this.ay);
		this.ax = this.fx;
		this.ay = this.fy;
		this.fx *= this.mass;
		this.fy *= this.mass;
		this.updateShape();
		// TODO: theta and omega
}
//  creates / updates SVG particle
model2d.Particle.prototype.updateShape = function() {
    model2d.particleDrawer.update(this, this.model);
}
model2d.Particle.prototype.removeShape = function() {
    model2d.particleDrawer.remove(this);
}

// *******************************************************
//   ParticleFeeder
// *******************************************************
model2d.ParticleFeeder = function(options, nr, model) {

    this.model = model;
    
    // from manipulable
    Object.assign(this, {
        selected: false
    ,   draggable: true
    ,   visible: true
    ,   label: ""
    ,   uid: 'ParticleFeeder_' + nr
    })

    // SVG properties
    this.shape = null;
    this.svgElement = null;

    // setup defaults
    Object.assign(this, {
        period: 100 // feed a particle every $period seconds
    ,   maximum: 100
    ,   mass: 0.1
    ,   radius: 0.04
    ,   color: 'white'
    ,   velocityColor: 'black'
    ,   randomSpeed: 0.01
    })

    // ovewrite by instance definition
    Object.assign(this, options);

}
model2d.ParticleFeeder.prototype.RELATIVE_WIDTH = 0.02;
model2d.ParticleFeeder.prototype.RELATIVE_HEIGHT = 0.02;
model2d.ParticleFeeder.prototype.feed = function(model) {

    var particles = model.particles;
    if (particles.length >= this.maximum)
        return;

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        if (p.distanceSq(this.x, this.y) <= 4 * p.radius * this.radius)
            return;
    }
    var p = new model2d.Particle({
            rx: this.x
        ,   ry: this.y
        ,   mass: this.mass
        ,   radius: this.radius
        ,   vx: (Math.random() - 0.5) * this.randomSpeed                
        ,   vy: (Math.random() - 0.5) * this.randomSpeed
        ,   color: this.color
        ,   velocityColor: this.velocityColor
    }, particles.length, model);

    this.model.particles.push(p);
}

// *******************************************************
//
//   Sensors
//
// *******************************************************



