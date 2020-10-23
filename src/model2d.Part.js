

//*******************************************************
//
//   Part
//
// *******************************************************

model2d.Part = function(options, nr, model) {
    if (!options)
        options = {};
    
    this.model = model;
    
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
    this.nr = nr;   // part index

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

    this.svgElement = model2d.genShapeGeometry(this/*.shape*/, model/*.svg*/);
    var ds = model2d.segmentizeShapePerimeter(this/*part*/, model, true);  // generate SVG
    this.segments = ds.segments;

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
    ;
    for(var i = 0; i < len; i++) {
        if (G.isIntersecting( segments[i], centerLine )) {
            return true;
        }
    }
    return false;
}