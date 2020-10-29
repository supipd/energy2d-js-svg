

//*******************************************************
//
//   Part
//
// *******************************************************

model2d.Part = function(options, nr, model) {
    if (!options)
        options = {};
    
    this.model = model;
    this.nr = nr;   // part index
    
    // source properties
    this.thermal_conductivity = options.thermal_conductivity != undefined ? options.thermal_conductivity : 1;
    this.specific_heat = options.specific_heat != undefined ? options.specific_heat : 1300;
    this.density = options.density != undefined ? options.density : 25;
    this.temperature = options.temperature != undefined ? options.temperature : 0;
    this.constant_temperature = options.constant_temperature != undefined ? options.constant_temperature : false;
    this.power = options.power != undefined ? options.power : 0;
    this.wind_speed = options.wind_speed != undefined ? options.wind_speed : 0;
    this.wind_angle = options.wind_angle != undefined ? options.wind_angle : 0;
    
    // optical properties (ray solver not implemented)
    this.transmission = options.transmission != undefined ? options.transmission : 0;
    this.reflection = options.reflection != undefined ? options.reflection : 0;
    this.absorption = options.absorption != undefined ? options.absorption : 1;
    this.emissivity = options.emissivity != undefined ? options.emissivity : 0;

    this.elasticity = options.elasticity != undefined ? options.elasticity : 1;
    this.scattering = options.scattering != undefined ? options.scattering : false;
    this.scattering_visible = options.scattering_visible != undefined ? options.scattering_visible : true;
    this.temperature_coefficient = options.temperature_coefficient != undefined ? options.temperature_coefficient : 0;
    this.reference_temperature = options.reference_temperature != undefined ? options.reference_temperature : 0;
    
    // visual properties
    this.visible = options.visible != undefined ? options.visible : true;
    this.filled = options.filled != undefined ? options.filled : true;
    this.draggable = options.draggable != undefined ? options.draggable : true; 
    this.color = options.color;
    this.texture = options.texture; 
    this.label = options.label;
    this.uid = options.uid || '_part_'+(new Date).valueOf();

    this.powerSwitch = true;

    
    // shape
    this.shape = {
        annulus : options.annulus,
        rectangle : options.rectangle,
        ellipse : options.ellipse,
        ring : options.ring,
        polygon : options.polygon,
        blob : options.blob,
    }

    this.svgElement = model2d.genShapeGeometry(this, model);
    var ds = model2d.segmentizeShapePerimeter(this, model, true);  // generate SVG
    this.segments = ds.segments;
    this.clockwise = ds.clockwise;
    this.area = ds.area;

    this.occupationIndexes = {};                        

//    var scale_x = model.svg.scale_x;
//    var scale_y = model.svg.scale_y;    
//    var bBox = this.svgElement.getBBox();
//    this.bBoxRect = {   x: bBox.x / scale_x, y: bBox.y / scale_y, 
//                        w: bBox.width / scale_x, h: bBox.height / scale_y   };
};

//model2d.Part.prototype.contains = function(x, y, tolerateRoundOffError, jinx) {
//    // pure rectangle ... bBoxRect ... converted bounding box
//    var isX = (x >= this.bBoxRect.x) && (x <= this.bBoxRect.x + this.bBoxRect.w);
//    var isY = (y >= this.bBoxRect.y) && (y <= this.bBoxRect.y + this.bBoxRect.h);
//    // return isX && isY;
//    var c = isX && isY
//    ,   cc = jinx in this.occupationIndexes
//    ;
//    if (c != cc) {
//        console.log(x,y,jinx, c,cc);
//    }
//    return c;
//}

    // s1, s2 ... Segment {s:{x,y}, e:{x,y}, c:{x,y}}
model2d.Part.prototype.intersectsLine = function(s1, s2) {
//?    Point2D.Float p1 = s1.getCenter();
//?    Point2D.Float p2 = s2.getCenter();
//?    if (p1.distanceSq(p2) < 0.000001f * model.getLx())
//?        return true;
//????
    var segments = this.segments
    ,   len = segments.length
    ,   G = model2d.G
    ,   centerLine = {s:{x:s1.c.x, y:s1.c.y}, e:{x:s2.c.x, y:s2.c.y}}
    ,   seg, intersection
    ,   oneMine = (s1.part == this) || (s2.part == this)
    ,   bothMine = (s1.part == this) && (s2.part == this)
    ;
// must be identified joins, whidh goes through part, which is not transparent
    if (oneMine && this.transmission == 0) {
        if (model2d.containsLine(this.svgElement, centerLine, this.model)) {
            return true;
        }
    }
    for(var i = 0; i < len; i++) {
        seg = segments[i];
        oneMine = (seg === s1) || (seg === s2);
        if (oneMine) { // filter measured segments
            continue;
        } 
DEBUGABLE_BY_VIEW && (seg.svgLine.style.strokeWidth = 6, seg.svgLine.style.stroke = 'yellow');
        intersection = G.intersection( seg, centerLine );
DEBUGABLE_BY_VIEW && (seg.svgLine.style.strokeWidth = '', seg.svgLine.style.stroke = '');
        if (intersection.colinear) {    // filter "colinear" segments
            continue;
        }
        if (intersection.intersect) {
            return true;
        }
    }
    return false;
}

model2d.Part.prototype.reflect = function(p, scatter) {
    var dt = this.model.timeStep;
    var predictedX = p.rx + p.vx * dt;
    var predictedY = p.ry + p.vy * dt;
    if (p instanceof model2d.Particle) {
        var dt2 = 0.5 * dt * dt;
        predictedX += p.ax * dt2;
        predictedY += p.ay * dt2;
    }
    var svgElement = this.svgElement;

    var predictedToBeInShape = model2d.containsPoint(this.svgElement, predictedX, predictedY, false, this.model);
//    return predictedToBeInShape;
    if (predictedToBeInShape) {
        var G = model2d.G
        ,   line = {s:{x: p.rx, y: p.ry}, e:{x: predictedX, y: predictedY}}
        ,   segment, intersectInfo 
        ;
        for(var i = 0; i < this.segments.length; i++) {
            segment = this.segments[i];
            intersectInfo = G.intersection(segment, line, true);
            if (intersectInfo.intersect) {
                this.reflectFromLine(p, segment, predictedX, predictedY, scatter);
                break;
            }
        }
    }    
}

model2d.Part.prototype.reflectFromLine = function(p, line, predictedX, predictedY, scatter) {
//		if (line.s.x == line.e.x && line.s.y == line.e.y)
//			return false;
//		boolean hit = false;
//		if (p instanceof Photon) { // a photon doesn't have any size, use its center to detect collision
//			hit = line.intersectsLine(p.getRx(), p.getRy(), predictedX, predictedY);
//		} else if (p instanceof Particle) {
//			Particle particle = (Particle) p;
//			float r = particle.radius;
//			hit = Line2D.ptSegDistSq(line.x1, line.y1, line.x2, line.y2, predictedX, predictedY) <= r * r;
//		}
//		if (hit) {
			var d12 = Math.hypot(line.s.x - line.e.x, line.s.y - line.e.y);
			var sin = (this.clockwise ? line.e.y - line.s.y : line.s.y - line.e.y) / d12;
			var cos = (this.clockwise ? line.e.x - line.s.x : line.s.x - line.e.x) / d12;
			if (scatter) {
				var angle = -Math.PI * Math.random(); // remember internally the y-axis points downward
				var cos1 = Math.cos(angle);
				var sin1 = Math.sin(angle);
				var cos2 = cos1 * cos - sin1 * sin;
				var sin2 = sin1 * cos + cos1 * sin;
				p.vx = p.speed * cos2;
				p.vy = p.speed * sin2;
			} else {
				var u; // velocity component parallel to the line
				var w; // velocity component perpendicular to the line
				if (p instanceof model2d.Particle) {
					u = p.vx * cos + p.vy * sin;
					w = p.vy * cos - p.vx * sin;
					w *= this.elasticity;
					if (Math.abs(w) < 0.01)
						w = -Math.abs(w); // force the w component to point outwards
					p.vx = u * cos + w * sin;
					p.vy = u * sin - w * cos;
				} else {
					u = p.vx * cos + p.vy * sin;
					w = p.vy * cos - p.vx * sin;
					p.vx = u * cos + w * sin;
					p.vy = u * sin - w * cos;
				}
				if (p instanceof model2d.Particle && this.elasticity < 1) {
					var hitX = predictedX + (p.radius + 0.5 * this.model.lx / this.model.nx) * sin;
					var hitY = predictedY - (p.radius + 0.5 * this.model.ly / this.model.ny) * cos;
					var energy = 0.5 * p.mass * w * w * (1 - this.elasticity * this.elasticity);
					var volume = this.model.lx * this.model.ly / (this.model.nx * this.model.ny);
					this.model.changeTemperatureAt(hitX, hitY, energy / (this.specific_heat * this.density * volume));
				}
			}
//			return true;
//		}
//		return false;
}
