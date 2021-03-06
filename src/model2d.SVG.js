
/*global*/ svgNS = "http://www.w3.org/2000/svg";

DECS_M = 1000;
function rounder( num, decs_m ) {
	decs_m = (isDef(decs_m) && isNbr(decs_m)) ? decs_m : DECS_M; 
	var val = parseFloat(num);
	return isNbr(val) ? Math.round( val * decs_m ) / decs_m : val; 
}

model2d.setSvgParams = function(model) {

    var svg = model.svg;
    var svgG = svg.group;

    var scene_width = model.lx;
    var scene_height = model.ly;

    var dataSize = svgG.ownerSVGElement.dataset.sizes 
    ,   sizes = JSON5.parseOr(dataSize, {
            width: parseFloat(svgG.ownerSVGElement.getAttribute('width'))
        ,   height: parseFloat(svgG.ownerSVGElement.getAttribute('height'))
        })
    ,   svg_width = sizes.width
    ,   svg_height = sizes.height
    ,   scale_x = (svg_width - 1) / scene_width
    ,   scale_y = (svg_height - 1) / scene_height
    ;
    model.svg.scale_x = scale_x;
    model.svg.scale_y = scale_y;
// ------------------------------------
    var svgRoot = svgG.ownerSVGElement;

    svgRoot.removeEventListener('mousemove', model2d.measuring.listen);
    model2d.measuring.model = model;
    svgRoot.addEventListener('mousemove', model2d.measuring.listen);
}

model2d.measuring = {
    last_x: 0
,   last_y: 0
,   model: null
,   listen: function(evt) {
        var svgRoot = evt.currentTarget
        ,   pt = svgRoot.createSVGPoint()
        ,   cursorPoint = function(evt) {
                pt.x = evt.clientX; pt.y = evt.clientY;
                return pt.matrixTransform(svgRoot.getScreenCTM().inverse());
            }
        ,   loc = cursorPoint(evt)
        ;
        model2d.measuring.update(loc.x,loc.y);
    }
,   update: function (x, y) {

        var model = this.model
        ,   frme = document.forms.central.elements
        ,   isX = (typeof x == 'number')
        ,   auto = frme.meas_auto.checked
        ,   fix = frme.meas_fix.checked
        ;
        if (! model || fix || ! isX && ! auto) {
            return;
        } 
        var x = isX ? x : this.last_x
        ,   isY = (typeof y == 'number')
        ,   y = isY ? y : this.last_y
        ;
        var M = model;
        
        frme.meas_svg_x.value = x;
        frme.meas_svg_y.value = y;
        frme.meas_model_x.value = rounder(x / M.svg.scale_x, 10000);
        frme.meas_model_y.value = rounder(x / M.svg.scale_y, 10000);
        var ie = Math.round(x / M.svg.scale_x / M.deltaX)
        ,   je = Math.round(y / M.svg.scale_y / M.deltaY)
        ,   i = Math.min(M.nx1, Math.max(0, ie))
        ,   j = Math.min(M.ny1, Math.max(0, je))
        ,   inx = i * M.nx
        ,   jinx = inx + j
        ;
        frme.meas_grid_i.value = i;
        frme.meas_grid_j.value = j;
        frme.meas_t.value = M.t[jinx];
        frme.meas_tb.value = M.tb[jinx];
        frme.meas_u.value = M.u[jinx];
        frme.meas_v.value = M.v[jinx];
        frme.meas_uWind.value = M.uWind[jinx];
        frme.meas_vWind.value = M.vWind[jinx];
        frme.meas_q.value = M.q[jinx];
        frme.meas_specificHeat.value = M.specificHeat[jinx];
        frme.meas_conductivity.value = M.conductivity[jinx];
        frme.meas_density.value = M.density[jinx];
        frme.meas_fluidity.value = M.fluidity[jinx];
        frme.meas_vorticity.value = M.fluidity[jinx]
            ? (0.5 * ( ((M.u[jinx + 1] - M.u[jinx - 1]) / M.deltaY) - ((M.v[jinx + M.nx] - M.v[jinx - M.nx]) / M.deltaX) ))
            : 0;
        frme.meas_heat_flux_x.value = -M.conductivity[jinx] * (M.t[jinx + M.nx] - M.t[jinx - M.nx]) / (2 * M.deltaX);
        frme.meas_heat_flux_y.value = -M.conductivity[jinx] * (M.t[jinx + 1] - M.t[jinx - 1]) / (2 * M.deltaY);
        frme.meas_thermal_energy.value = M.t[jinx] * M.density[jinx] * M.specificHeat[jinx] * M.deltaX * M.deltaY;

        if (isX) {  // check parts only on mouse move
            var infos = {}; 
            M.parts.forEach(part => {
                if (jinx in part.occupationIndexes) {    //  if (part.contains(x, y, this.convective, jinx)) {
                   infos['part_nr_'+part.nr] = models_library[e2dUI.model_name].model.structure.part[part.nr];
                }
            });
            if (typeof part_info != 'undefined') {    // window.part_info textarea id
                part_info.value = JSON.stringify(infos, null, ' ');
            }
        }
        this.last_x = x;
        this.last_y = y;
    }
}

model2d.G = {
    vectLength: function (vect) {
        return Math.hypot(vect.x, vect.y);
    }
,   lineLength: function(line) {
        return Math.hypot(line.e.x - line.s.x, line.e.y - line.s.y);
    }
,   normalize: function(vect) {
        var r = this.vectLength(vect);
        return { x: vect.x / r, y: vect.y / r }
    }
,   dotProduct: function(vect1, vect2) {
        return vect1.x * vect2.x + vect1.y * vect2.y;
    }
,   normalVector: function(line) {
        return {x: line.s.y - line.e.y, y: line.e.x - line.s.x}
    }
,   distToPoint: function(point, x, y) {
        var dx = x - point.x;
        var dy = y - point.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
// point - { x, y }
// line - { sx, sy, ex, ey }
,   distToSegment: function(point, line) {
        var dx = line.e.x - line.s.x;
        var dy = line.e.y - line.s.y;
        var l2 = dx * dx + dy * dy;

        if (l2 == 0)
            return this.distToPoint(point, line.s.x, line.s.y);

        var t = ((point.x - line.s.x) * dx + (point.y - line.s.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));

        return this.distToPoint(point, line.s.x + t * dx, line.s.y + t * dy);
    }
//  https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
//,   isColinear(point, line) {
//        var dx = line.e.x - line.s.x
//        ,   dy = line.e.y - line.s.y
//        ,   px = point.x - line.s.x
//        ,   py = point.y - line.s.y
//        ,   ccw = (px * dy) - (py * dx) // px / dx = py / dy
//        ;
//        return ccw == 0;
//    }
//,   isIntersecting: function (line1, line2) {
//        var CCW = function (p1, p2, p3) {
//                return (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
//            }
//        ,   p1 = line1.s
//        ,   p2 = line1.e
//        ,   p3 = line2.s
//        ,   p4 = line2.e
//        ,   c1on34 = CCW(p1, p3, p4)
//        ,   c2on34 = CCW(p2, p3, p4)
//        ,   c1on23 = CCW(p1, p2, p3)
//        ,   c1on24 = CCW(p1, p2, p4)
//        ;       
//        return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
//    }
,   intersection: function (line1, line2, countIntersectionPoint = false) {
        var CCW = function (p1, p2, p3) {
                return (p3.y - p1.y) * (p2.x - p1.x) /*>*/- (p2.y - p1.y) * (p3.x - p1.x);
            }
        ,   p1 = line1.s
        ,   p2 = line1.e
        ,   p3 = line2.s
        ,   p4 = line2.e
        ,   c1on34 = CCW(p1, p3, p4)
        ,   c2on34 = CCW(p2, p3, p4)
        ,   c1on23 = CCW(p1, p2, p3)
        ,   c1on24 = CCW(p1, p2, p4)
        ,   colinear = (c1on34 == 0) && (c2on34 == 0)
        ,   b1on34 = c1on34 > 0
        ,   b2on34 = c2on34 > 0
        ,   b1on23 = c1on23 > 0
        ,   b1on24 = c1on24 > 0
        ,   intersect = (b1on34 != b2on34) && (b1on23 != b1on24)

        ,   result = null;
        ;
        //  http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
        if (countIntersectionPoint) {
            // if the lines intersect, the result contains the x and y of the intersection 
            // (treating the lines as infinite) 
            // and booleans for whether line segment 1 or line segment 2 contain the point
            var denominator, a, b, numerator1, numerator2;
            result = {
                x: null,
                y: null,
                onLine1: false,
                onLine2: false
            };
            denominator = ((line2.e.y - line2.s.y) * (line1.e.x - line1.s.x)) - ((line2.e.x - line2.s.x) * (line1.e.y - line1.s.y));// test:
// test: ... needed more time to analyze ...
//if (denominator != c1on24) {
//    console.log("denominator != c1on24");
//}
            if (denominator == 0) {
                return result;
            }
            a = line1.s.y - line2.s.y;
            b = line1.s.x - line2.s.x;
            numerator1 = ((line2.e.x - line2.s.x) * a) - ((line2.e.y - line2.s.y) * b);
            numerator2 = ((line1.e.x - line1.s.x) * a) - ((line1.e.y - line1.s.y) * b);
// test: ... needed more time to analyze ...
//if (numerator1 != c1on34) {
//    console.log("numerator1 != c1on34");
//}
//if (numerator2 != c1on23) {
//    console.log("numerator2 != c1on23");
//}
            a = numerator1 / denominator;
            b = numerator2 / denominator;

            // if we cast these lines infinitely in both directions, they intersect here:
            result.x = line1.s.x + (a * (line1.e.x - line1.s.x));
            result.y = line1.s.y + (a * (line1.e.y - line1.s.y));

        //        // it is worth noting that this should be the same as:
        //        x = line2.s.x + (b * (line2.e.x - line2.s.x));
        //        y = line2.s.x + (b * (line2.e.y - line2.s.y));
        //        
            // if line1 is a segment and line2 is infinite, they intersect if:
            if (a > 0 && a < 1) {
                result.onLine1 = true;
            }
            // if line2 is a segment and line1 is infinite, they intersect if:
            if (b > 0 && b < 1) {
                result.onLine2 = true;
            }
            // if line1 and line2 are segments, they intersect if both of the above are true
        }
               
        return { colinear: colinear, intersect : intersect, result: result };
    }
,   viewFactor(line1, line2) {
		// calculate the center of this segment
		var p1 = line1.c;
		// calculate the center of the other segment
		var p2 = line2.c;
		var r = {x: p2.x - p1.x, y: p2.y - p1.y};
		var r2 = r.x * r.x + r.y * r.y;
		r = this.normalize(r);
		var n1 = this.normalVector(line1);
		n1 = this.normalize(n1);
		var n2 = this.normalVector(line2);
		n2 = this.normalize(n2);
		var dot = -this.dotProduct(r, n1) * this.dotProduct(r, n2);
		dot = Math.abs(dot); // Force this to be positive because sometimes the normal vectors might not point outwards
		var vf = dot * this.lineLength(line2) / (Math.PI * Math.sqrt(r2)); // view factor equation is different in 2D    
if (isNaN(vf))  {
    console.log('vf NaN');
}          
		return dot * this.lineLength(line2) / (Math.PI * Math.sqrt(r2)); // view factor equation is different in 2D    
    }
}

model2d.genShapeGeometry = function(part/*shape*/, model/*svg*/) {

    var svgG = model.svg.group;
    var scale_x = model.svg.scale_x;
    var scale_y = model.svg.scale_y;

    var svgElemGroup = svgG.ownerDocument.createElementNS(svgNS, 'g');
    var svgElement;
    var shape = part.shape;
// Rectangle2D
    if (shape.rectangle) {
        //  <rectangle x="6.0" y="3.2000003" width="4.0" height="0.2"/>
        var px = shape.rectangle.x * scale_x
        ,   py = shape.rectangle.y * scale_y
        ,   pw = shape.rectangle.width * scale_x
        ,   ph = shape.rectangle.height * scale_y
        ,   tx = px + 0.5 * pw
        ,   ty = py + 0.5 * ph
        ,   tv = pw < ph * 0.25
        ;
        //   <rect x="120" width="100" height="100" rx="15" />
        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'rect');
        svgElement.setAttribute('x',px);
        svgElement.setAttribute('y',py);
        svgElement.setAttribute('width',pw);
        svgElement.setAttribute('height',ph);
        svgElement.dataset.labeldef = JSON.stringify({
            tx: tx, ty: ty, tv: tv
        })
    }
// Ellipse2D 
    else if (shape.ellipse) {
        //  <ellipse x="5.0" y="5.0" a="1.0" b="1.0"/>
        var px = shape.ellipse.x * scale_x
        ,   py = shape.ellipse.y * scale_y
        ,   pa = shape.ellipse.a * scale_x
        ,   pb = shape.ellipse.b * scale_y
        ,   tx = px + 0.5 * pa
        ,   ty = py + 0.5 * pb
        ,   tv = pa < pb * 0.25
        ;
        //  <ellipse cx="100" cy="50" rx="100" ry="50" />
        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'ellipse');
        svgElement.setAttribute('cx',px);
        svgElement.setAttribute('cy',py);
        svgElement.setAttribute('rx',pa / 2);
        svgElement.setAttribute('ry',pb / 2);
        svgElement.dataset.labeldef = JSON.stringify({
            tx: tx, ty: ty, tv: tv
        })
    }
// Annulus
    else if (shape.ring) {
        //  <ring x="0.1" y="0.1" inner="0.12" outer="0.14"/>
        var px = shape.ring.x * scale_x
        ,   py = shape.ring.y * scale_y
        ,   pi = shape.ring.inner / 2 * scale_x
        ,   po = shape.ring.outer / 2 * scale_x
        ;
/* https://stackoverflow.com/a/57267715

You can do this as per the SVG spec by using a path with two components and fill-rule="evenodd". 
The two components are semi-circular arcs which join to form a circle 
(in the "d" attribute below, they each end with a 'z'). 
The area inside the inner circle does not count as part of the shape, 
hence interactivity is good.

To decode the below a little, 
the "340 260" is the top middle of the outer circle, 
the "290 290" is the radius of the outer circle (twice), 
the "340 840" is the bottom middle of the outer circle, 
the "340 492" is the top middle of the inner circle, 
the "58 58" is the radius of the inner circle (twice) 
and the "340 608" is the bottom middle of the inner circle.

<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" d="M340 260A290 290 0 0 1 340 840A290 290 0 0 1 340 260zM340 492A58 58 0 0 1 340 608A58 58 0 0 1 340 492z" stroke-width="4" stroke="rgb(0,0,0)" fill="rgb(0,0,255)">
        <title>This will only display on the donut</title>
    </path>
</svg>
*/
        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'path');
        svgElement.setAttribute('fill-rule',"evenodd");
        var d = `
M${px} ${py - po}
A${po} ${po} 0 0 1 ${px} ${py + po}
A${po} ${po} 0 0 1 ${px} ${py - po} Z
M${px} ${py - pi}
A${pi} ${pi} 0 0 1 ${px} ${py + pi}
A${pi} ${pi} 0 0 1 ${px} ${py - pi} Z
`;
        svgElement.setAttribute('d',d);            
    } 
// EllipticalAnnulus
    else if (shape.annulus) {
        //  <annulus x="0.050001" y="0.050001003" innerA="0.0185" innerB="0.0185" outerA="0.045" outerB="0.045"/>
        var px = shape.annulus.x * scale_x
        ,   py = shape.annulus.y * scale_y
        ,   pia = shape.annulus.innerA * scale_x
        ,   pib = shape.annulus.innerB * scale_x
        ,   poa = shape.annulus.outerA * scale_x
        ,   pob = shape.annulus.outerB * scale_x
        ;

        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'path');
        svgElement.setAttribute('fill-rule',"evenodd");
        var d = `
M${px} ${py - pob}
A${poa} ${pob} 0 0 1 ${px} ${py + pob}
A${poa} ${pob} 0 0 1 ${px} ${py - pob} Z
M${px} ${py - pib}
A${pia} ${pib} 0 0 1 ${px} ${py + pib}
A${pia} ${pib} 0 0 1 ${px} ${py - pib} Z
`;
        svgElement.setAttribute('d',d);            
    } 
// Polygon2D
    else if (shape.polygon) {
        //  <polygon count="8" vertices="6.1878304, 3.5925932, 5.3878303, 3.5925932, 5.3878303, 3.3925934, 5.5878305, 3.3925934, 5.5878305, -0.0074071884, 5.98783, -0.0074071884, 5.98783, 3.3925934, 6.1878304, 3.3925934"/>
        var vertices = shape.polygon.vertices.split(/\s*,\s+/);
        var n = vertices.length / 2;   //shape.polygon.count;

        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'path');
        var d = '', x, y;
        var cx = 0, cy = 0;
        for (var i = 0; i < n; i++) {
            x = vertices[2*i] * scale_x;
            y = vertices[2*i+1] * scale_y;
            d+=`${i ? 'L':'M'} ${x} ${y}`;
            cx+= x; 
            cy+= y;
        }
        d+='Z';
        svgElement.setAttribute('d',d);

        var tx = cx / n;
        var ty = cy / n;        
        svgElement.dataset.labeldef = JSON.stringify({
            tx: tx, ty: ty, tv: false
        })
    }
// Blob2D
    else if (shape.blob) {
        //  <blob count="10" points="1.3798938, 4.3145504, 1.7798939, 6.7145505, 3.6798935, 7.3145504, 7.779894, 6.914551, 7.379894, 3.1145506, 4.379894, 3.5145504, 5.179894, 5.914551, 3.8798938, 6.0145507, 3.3798938, 5.3145504, 2.979894, 3.5145504"/>
        //                                  x       y
        var points = shape.blob.points.split(/\s*,\s+/);
        var n = points.length / 2;   //shape.polygon.count;

        var x, y;
        var xArr = [], yArr = [];
        var cx = 0, cy = 0;
        for (var i = 0; i < n; i++) {
            x = points[2*i] * scale_x;
            xArr.push(x);
            y = points[2*i+1] * scale_y;
            yArr.push(y);
            cx+= x; 
            cy+= y;
        }
        xArr.push(xArr[0]);  // close blob
        yArr.push(yArr[0]);
        var d = model2d.generateBlobPathD(xArr, yArr);

        svgElement = svgG.ownerDocument.createElementNS(svgNS, 'path');
        svgElement.setAttributeNS(null,"d", d);

        var tx = cx / n;
        var ty = cy / n;        
        svgElement.dataset.labeldef = JSON.stringify({
            tx: tx, ty: ty, tv: false
        })
    }

    svgElemGroup.id = `shape_${part.nr}_${part.uid}`;
    svgElemGroup.appendChild(svgElement);
    svgG.appendChild(svgElemGroup);
    return svgElement;
}

model2d.DIST_RESOLUTION = 0.01;
model2d.segmentizeShapePerimeter = function(part, model, groupIt = false) {

    var G = this.G;

    var patchSizePercentage = model.patchSizePercentage || 0.05
    ,   lx = model.lx
    ,   ly = model.ly
    ,   scale_x = model.svg.scale_x
    ,   scale_y = model.svg.scale_y
    ,   svgElement = part.svgElement
    ,   area = 0;
    ;

    var offset = 0
    ,   patchSize = lx * patchSizePercentage * scale_x
    ,   totalLength = svgElement.getTotalLength()
    ,   delta = Math.min(patchSize, totalLength)
    ,   pt0, pt1, pt2, line, lineSvg, distance
    ,   segments = []
    ; 
/* missing functionality getTangentAtLength (but exist in libraries like f.e. segmentize-svg)
istead using own simpler back/traced divide-by-two algorithm controlled by distance checking ???
TODO
*/
    pt0 = svgElement.getPointAtLength(offset);
    var d =`M${pt0.x} ${pt0.y}`;
    do {        
        if (delta == 0) {   // ???
            throw 'segmentizeShapePerimeter ... Delta goes to 0';
        }
        pt1 = svgElement.getPointAtLength(offset + delta / 2);
        pt2 = svgElement.getPointAtLength(offset + delta);
        lineSvg = {   s:{x: pt0.x, y: pt0.y}
                  ,   e:{x: pt2.x, y: pt2.y}
                  }
        line = {    s:{x: pt0.x / scale_x, y: pt0.y / scale_y}
                ,   e:{x: pt2.x / scale_x, y: pt2.y / scale_y}
                ,   c:{x: 0.5 * (pt0.x + pt2.x) / scale_x, y: 0.5 * (pt0.y + pt2.y) / scale_y}
                ,   part: part
                };
        distance = G.distToSegment(pt1, lineSvg);   // in svg units 
        if (distance < model2d.DIST_RESOLUTION * scale_x) {
            var len = G.lineLength(line);
            if (len > 0) {  //< model2d.MINIMAL_SEGMENT_RATIO * lx) {
                d+=`L${pt2.x} ${pt2.y}`;
                segments.push(line);
//  https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
//  Sum over the edges, (x2 - x1)(y2 + y1). 
//  If the result is positive the curve is clockwise, 
//  if it's negative the curve is counter-clockwise. 
//  (The result is twice the enclosed area, with a +/- convention.)
//  A minor caveat: this answer assumes a normal Cartesian coordinate system
                area+= (pt2.x - pt0.x) * (pt2.y + pt0.y);
            } else {
console.log('segment length = 0 ! Why ?')
            }
            pt0 = pt2;
            offset+= delta;
            delta = Math.min(patchSize, totalLength - offset);
        } else {
            delta /= 2; 
        }
    } while( offset < totalLength );

    if (groupIt) {
        var doc = svgElement.ownerDocument
        ,   gLines = svgElement.parentNode.appendChild(doc.createElementNS(svgNS,'g'))
        ;
        gLines.innerHTML = '';
        gLines.setAttribute('stroke','white');
        gLines.classList.add('segments');
        gLines.setAttribute('style','display:none');
        segments.forEach(seg => {
            var line = gLines.appendChild(doc.createElementNS(svgNS,'line'));
            line.setAttribute('x1', seg.s.x * scale_x);line.setAttribute('y1', seg.s.y * scale_y);
            line.setAttribute('x2', seg.e.x * scale_x);line.setAttribute('y2', seg.e.y * scale_y);
            line.setAttribute('marker-start', "url(#StartMarker)");
            line.setAttribute('marker-end', "url(#EndMarker)");
        })
    }
    return {d: d, segments: segments, area: Math.abs(area / 2), clockwise: area < 0};
}

model2d.drawerViewFactorMesh = {    // SINGLETON
    model: null
,   scale_x: 1
,   scale_y: 1
,   init: function(model) {
        this.model = model;

        this.scale_x = this.model.svg.scale_x;
        this.scale_y = this.model.svg.scale_y;

        var svgG = this.model.svg.group
        ,	gRadiosity = svgG.querySelector('#radiosity')
                        || svgG.appendChild(svgG.ownerDocument.createElementNS(svgNS,'g'))
        ,	gSegments = gRadiosity.querySelector('#segments')
                        || gRadiosity.appendChild(svgG.ownerDocument.createElementNS(svgNS,'g'))
        ,	gSegmentsJoins = gRadiosity.querySelector('#segmentsJoins')
                        || gRadiosity.appendChild(svgG.ownerDocument.createElementNS(svgNS,'g'))
        ;
        gSegments.innerHTML = "";
        gSegmentsJoins.innerHTML = "";

        gRadiosity.id = "radiosity";
        gSegments.id = 'segments';
        gSegments.setAttribute('style','stroke-width:0.5;stroke:white');
        gSegmentsJoins.id = 'segmentsJoins';
        gSegmentsJoins.setAttribute('style','stroke-width:0.5;stroke:white;stroke-dasharray:1');

        this.gRadiosity = gRadiosity;
        this.gSegments = gSegments;
        this.gSegmentsJoins = gSegmentsJoins;
    }
,   genSegment: function(seg) {
        var line = this.gSegments.appendChild(this.gSegments.ownerDocument.createElementNS(svgNS,'line'))
        ;
        line.setAttribute('x1', seg.s.x * this.scale_x);
        line.setAttribute('y1', seg.s.y * this.scale_y);
        line.setAttribute('x2', seg.e.x * this.scale_x);
        line.setAttribute('y2', seg.e.y * this.scale_y);
        //        g.setColor(Color.BLACK);
        //        g.fill(new Ellipse2D.Float(x1 - 2, y1 - 2, 4, 4));
        //  use SVG marker-start, marker-end
        return line;    //seg.svgLine = line;
    }
,   genSegmentsJoin: function(s1, s2, viewFactorMin, viewFactorMax) {
        viewFactorMin = viewFactorMin || 0;
        viewFactorMax = viewFactorMax || 1;

        var line = this.gSegmentsJoins.appendChild(this.gSegmentsJoins.ownerDocument.createElementNS(svgNS,'line'));
        line.setAttribute('x1', s1.c.x * this.scale_x);
        line.setAttribute('y1', s1.c.y * this.scale_y);
        line.setAttribute('x2', s2.c.x * this.scale_x);
        line.setAttribute('y2', s2.c.y * this.scale_y);
//                    g.setColor(new Color(255, 255, 255, (int) (55 + 200 * (vf - viewFactorMin) / (viewFactorMax - viewFactorMin))));
//                    g.draw(new Line2D.Float(x1, y1, x2, y2));
        return line;
    }
,   redraw: function(model) {
        if (model) {
            this.init(model);

            var segments = model.radiositySolver.segments;
            segments.forEach(seg => {
                this.genSegment(seg);
            })

            var segmentJoins = model.radiositySolver.segmentJoins;
            var viewFactorMax = -Number.MAX_VALUE;
            var viewFactorMin = Number.MAX_VALUE;
            segmentJoins.forEach(seg => {
                if (seg.vf > viewFactorMax)
                    viewFactorMax = seg.vf;
                if (seg.vf < viewFactorMin)
                    viewFactorMin = seg.vf;
            })
            segmentJoins.forEach(seg => {
                this.genSegment(seg, viewFactorMin, viewFactorMax);
            })
        }
    }
,   generate: function(model, force) {
        if (! this.gRadiosity || force) {
            this.redraw(model);
        }
        return this.gRadiosity;
    }
}

model2d.containsPoint = function(svgElement, x, y, tolerateRoundOffError, model) {
    if (! svgElement) {
        return false;
    }
    var point = svgElement.ownerSVGElement.createSVGPoint();
    point.x = x * model.svg.scale_x; point.y = y * model.svg.scale_y; 

    return  svgElement.isPointInFill(point);    // || svgElement.isPointInStroke(point);
}

model2d.containsLine = function(svgElement, centerLine, model) {
// https://math.stackexchange.com/questions/175896/finding-a-point-along-a-line-a-certain-distance-away-from-another-point
    if (! svgElement) {
        return false;
    }
    var d = this.G.lineLength(centerLine)
    ,   delta = model.lx / model.nx // in model scale 1 computational grid box size 
    ,   t = delta / d   // from line start
// FIXME ... distance delta recognition
    ,   point = svgElement.ownerSVGElement.createSVGPoint()
    ;
    point.x = ((1-t)*centerLine.s.x + t*centerLine.e.x) * model.svg.scale_x; 
    point.y = ((1-t)*centerLine.s.y + t*centerLine.e.y) * model.svg.scale_y;
    if (svgElement.isPointInFill(point)) {
        return true;
    }
    t = (d - delta) / d;  // from line end
    point.x = ((1-t)*centerLine.s.x + t*centerLine.e.x) * model.svg.scale_x; 
    point.y = ((1-t)*centerLine.s.y + t*centerLine.e.y) * model.svg.scale_y;
    return  svgElement.isPointInFill(point);
}

model2d.usedPatterns = {}; 

model2d.displaySvgParts = function(model/*parts, scene_width, scene_height*/) {

// already in Model2D constructor    model2d.setSvgParams(model);

    var svgG = model.svg.group;
    var scale_x = model.svg.scale_x;
    var scale_y = model.svg.scale_y;

    var parts = model.parts;

    var defs = svgG.ownerSVGElement.querySelector('defs');
    var patterns = defs.querySelectorAll('pattern');

    //svgG.innerHTML = ''; // NO clean ... work with prepared parts

    for (var i=0; i<patterns.length; i++) {
        var pattern = patterns[i];
        pattern.parentNode.removeChild(pattern);
    }
    this.usedPatterns = {};


    var fillStyle = "gray";
    var strokeStyle = "black";
    var lineCap = "round";
    var lineWidth = 2;
    
    var part, px, py, pw, ph, tx, ty, tv /*vertical text*/;

    for (var i = 0; i < parts.length; i++) {
        part = parts[i];
        
        var svgElement = part.svgElement;
        if ( ! svgElement) {
            continue;   // ???
        }
        if ( ! part.visible) {
            svgElement.style.display = 'none';
        } else {
            if (part.color) {
                svgElement.setAttribute('fill', loaderE2D.ConvertColorNumbers(part.color).value);
            } else if (part.texture) {
                var tex = part.texture
                ,   fg = loaderE2D.ConvertColorNumbers(tex.texture_fg).value
                ,   bg = loaderE2D.ConvertColorNumbers(tex.texture_bg).value
                ,   patternId = this.genPatternId(tex.texture_style, tex.texture_width, tex.texture_height, fg, bg)
                ;
                if (! this.usedPatterns[patternId]) {
                    this.createPattern(defs, part.filled, tex.texture_style, tex.texture_width, tex.texture_height, fg, bg);
                }
                svgElement.setAttribute('fill', `url(#${patternId})`);
            }
            var labeldef = svgElement.dataset.labeldef;
            if (part.label && labeldef) {
                var ldef = JSON.parse(labeldef);
                var txt = svgG.ownerDocument.createElementNS(svgNS, 'text');
                txt.setAttribute('x',ldef.tx);
                txt.setAttribute('y',ldef.ty);
                txt.textContent = part.label;
                txt.setAttribute('style','stroke-width:1');
//                txt.id = `label_${part.nr}_${part.uid}`;
//                svgG.appendChild(txt);
                svgElement.parentNode.appendChild(txt);
            }
        }
        if (part.wind_speed != 0) {
/*            FillPattern fp = p.getFillPattern();
            Color bgColor = g.getColor();
            if (fp instanceof ColorFill) {
                bgColor = ((ColorFill) fp).getColor();
            } else if (fp instanceof Texture) {
                bgColor = new Color(((Texture) fp).getBackground());
            }
            bgColor = bgColor.darker();
            bgColor = new Color(bgColor.getRed(), bgColor.getGreen(), bgColor.getBlue(), 128);
            Color fgColor = MiscUtil.getContrastColor(bgColor, 255);
            float rotation = fanRotationSpeedScaleFactor * p.getWindSpeed() * model.getTime();
            // float rotation = (float) (Math.PI / 12.0);
            var r = p.getShape().getBounds2D(); // Rectangle2D
            px = r.x * scale_x;
            py = r.y * scale_y;
            pw = r.width * scale_x;
            ph = r.height * scale_y;
            Area a = Fan.getShape(new Rectangle2D.Float(x, y, w, h), p.getWindSpeed(), p.getWindAngle(), (float) Math.abs(Math.sin(rotation)));
            g.setColor(bgColor);
            g.fill(a);
            g.setColor(fgColor);
            g.draw(a);
*/
        } 
    }

    model.fans.forEach(fan => {
        fan.createShape(model.svg);
    })
//console.log('displaySvgParts',canvas.width, canvas.height, scale_x, scale_y, canvas);
}

model2d.genPatternId = function(type, w, h, c1, c2) {
    return `texture_${type}_${w}_${h}_${c1}_${c2}`;
}

model2d.createPattern = function(defs, filled, type, w, h, c1, c2) {
    var patternId = this.genPatternId(type, w, h, c1, c2);
    if (! this.usedPatterns[patternId]) {
        var patternContent;
        var bg_fill_style = filled ? `style="fill:${c2};stroke:${c2};"` : `style="fill:none;stroke:none;"`
        switch(type) {
            case 1: { //  POLKA
                var x = w/4, y = h/4;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<ellipse cx="${x}" cy="${y}" rx="${x}" ry="${y}" style="fill:${c1};stroke:${c1};" />
</pattern>
`;
                break; }
            case 2: { //  MOSAIC
                var x = w/2, y = h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${x}" height="${y}" style="fill:${c1};stroke:${c1};" />
<rect x="${x}" y="${y}" width="${x}" height="${y}" style="fill:${c1};stroke:${c1};" />
<rect x="${x}" y="0" width="${x}" height="${y}" style="fill:${c2};stroke:${c2};" />
<rect x="0" y="${y}" width="${x}" height="${y}" style="fill:${c2};stroke:${c2};" />
</pattern>
`;
                break; }
            case 3: { //  POSITIVE
                var x = w/2 + 2, y = h/2 + 2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0.5" y1="${y}" x2="3.5" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
<line x1="2" y1="${y-1.5}" x2="2" y2="${y+1.5}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x}" y1="0.5" x2="${x}" y2="3.5" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x-1.5}" y1="2" x2="${x+1.5}" y2="2" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 4: { //  NEGATIVE
                var x = w/2 + 2, y = h/2 + 2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0.5" y1="${y}" x2="3.5" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x-1.5}" y1="2" x2="${x+1.5}" y2="2" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 6: { //  CIRCULAR
                var x = w/2 + 2, y = h/2 + 2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">`;
                for (var i = 0; i < w / 2; i++) {
                    for (var j = 0; j < h / 2; j++) {
                        patternContent+= `
<rect x="${2*i}" y="${2*j}" width="1" height="1" style="fill:${c1};stroke:${c1};" />
<rect x="${2*i+1}" y="${2*j+1}" width="1" height="1" style="fill:${c1};stroke:${c1};" />
<rect x="${2*i+1}" y="${2*j}" width="1" height="1" style="fill:${c2};stroke:${c2};" />
<rect x="${2*i}" y="${2*j+1}" width="1" height="1" style="fill:${c2};stroke:${c2};" />
`;
                    }
                }
                patternContent+= `
<line x1="1" y1="${h/2}" x2="3" y2="${h/2}" style="fill:${c2};stroke:${c2};"></line>
<line x1="2" y1="${h/2-1}" x2="2" y2="${h/2+1}" style="fill:${c2};stroke:${c2};"></line>
<line x1="${w/2}" y1="1" x2="${w/2}" y2="3" style="fill:${c2};stroke:${c2};"></line>
<line x1="${w/2-1}" y1="2" x2="${w/2+1}" y2="2" style="fill:${c2};stroke:${c2};"></line>
</pattern>
`;
                break; }
            case 14: { //  FINE_SCREEN
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
`;
                for (var i = 0; i < w / 2; i++) {
                    for (var j = 0; j < h / 2; j++) {
                        patternContent+= `
<rect x="${2*i}" y="${2*j}" width="2" height="2" style="fill:${c1};stroke:${c2};" />
`;
                    }
                }
                patternContent+= `
</pattern>
`;
                break; }
            case 15: { //  CONCRETE
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<g style="fill:none;stroke:${c1};">
<ellipse cx="6.5" cy="10.5" rx="3" ry="2.5" />
<ellipse cx="17.5" cy="23" rx="2.5" ry="3" />
<ellipse cx="27" cy="12" rx="2" ry="2" />
<ellipse cx="29" cy="30.5" rx="2" ry="1.5" />
<ellipse cx="4.5" cy="28.5" rx="1.5" ry="2.5" />
<rect x="4" y="14" width="1" height="1" />
<rect x="17" y="32" width="1" height="1" />
<rect x="5" y="26" width="1" height="1" />
<rect x="13" y="27" width="1" height="1" />
<rect x="24" y="24" width="1" height="1" />
<rect x="21" y="2" width="1" height="1" />
<rect x="17" y="5" width="1" height="1" />
<rect x="22" y="15" width="1" height="1" />
<rect x="9" y="27" width="1" height="1" />
<rect x="31" y="8" width="1" height="1" />
<rect x="11" y="15" width="1" height="1" />
<rect x="18" y="11" width="1" height="1" />
<rect x="23" y="8" width="1" height="1" />
<rect x="3" y="5" width="1" height="1" />
<rect x="8" y="17" width="1" height="1" />
<rect x="31" y="19" width="1" height="1" />
<rect x="11" y="31" width="1" height="1" />
<rect x="8" y="4" width="1" height="1" />
<rect x="3" y="19" width="1" height="1" />
<rect x="22" y="27" width="1" height="1" />
<rect x="3" y="33" width="1" height="1" />
<rect x="23" y="17" width="1" height="1" />
</g>
</pattern>
`;
                break; }
            case 16: { //  DOT_ARRAY
                var x = w/2+1, y = h/2+1;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<rect x="1" y="${y}" width="1" height="1" style="fill:${c1};stroke:${c1};" />
<rect x="${x}" y="1" width="1" height="1" style="fill:${c1};stroke:${c1};" />
</pattern>
`;
                break; }
            case 5: { //  STARRY
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
`;
                for (var i = 0; i < w / 2; i++) {
                    for (var j = 0; j < h / 2; j++) {
                        patternContent+= `
<rect x="${2*i+1}" y="${2*j}" width="1" height="1" style="fill:${c1};stroke:${c2};" />
<rect x="${2*i}" y="${2*j+1}" width="1" height="1" style="fill:${c1};stroke:${c2};" />
`;
                    }
                }
                var x = w/2+2, y = h/2+2;
                patternContent+= `
<line x1="1" y1="${y}" x2="3" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
<line x1="2" y1="${y-1}" x2="2" y2="${y+1}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x}" y1="1" x2="${x}" y2="3" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x-1}" y1="2" x2="${x+1}" y2="2" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 7: { //  HORIZONTAL_STRIPE
                var y = h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="${y}" x2="${w}" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 8: { //  VERTICAL_STRIPE
                var x = w/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="${x}" y1="0" x2="${x}" y2="${h}" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 9: { //  DIAGONAL_UP_STRIPE
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="${h-1}" x2="${w-1}" y2="0" style="fill:${c1};stroke:${c1};stroke-width:1"></line>
</pattern>
`;
                break; }
            case 10: { //  DIAGONAL_DOWN_STRIPE
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="0" x2="${w}" y2="${h}" style="fill:${c1};stroke:${c1};stroke-width:1"></line>
</pattern>
`;
                break; }
            case 11: { //  GRID
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${w/2}" y1="0" x2="${w/2}" y2="${h}" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 12: { //  HORIZONTAL_BRICK
                var x = w/2, y = h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="0" x2="${w}" y2="0" style="fill:${c1};stroke:${c1};"></line>
<line x1="0" y1="${y}" x2="${w}" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
<line x1="0" y1="0" x2="0" y2="${y}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${x}" y1="${y}" x2="${x}" y2="${h}" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 17: { //  SINGLE_CIRCLE
                var x=w/2, y=h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<ellipse cx="${x}" cy="${y}" rx="${x}" ry="${y}" style="fill:none;stroke:${c1};" />
</pattern>
`;
                break; }
            case 18: { //  DOUBLE_CIRCLES
                var x = w/4, y = h/4
                ,   dx = x + x < w / 2 ? x + x + 2 : w / 2
                ,   dy = y + y < h / 2 ? y + y + 2 : h / 2
                ;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<ellipse cx="${w/2}" cy="${h/2}" rx="${x}" ry="${y}" style="fill:none;stroke:${c1};" />
<ellipse cx="${w/2}" cy="${h/2}" rx="${2*x}" ry="${2*y}" style="fill:none;stroke:${c1};" />
</pattern>
`;
                break; }
            case 19: { //  HORIZONTAL_LATTICE
                var x = w/2, y = h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<ellipse cx="${x/2}" cy="${y/2}" rx="${x/2}" ry="${y/2}" style="fill:none;stroke:${c1};" />
<line x1="${x}" y1="${y/2}" x2="${w}" y2="${y/2}" style="fill:${c1};stroke:${c1};stroke-width:1"></line>
<line x1="${x/2}" y1="${y}" x2="${x/2}" y2="${h}" style="fill:${c1};stroke:${c1};stroke-width:1"></line>
</pattern>
`;
                break; }
            case 21: { //  DICE
                var x = w/2, y = h/2;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<rect x="0" y="0" width="${w}" height="${h}" style="fill:none;stroke:${c1};" />
<ellipse cx="${w/2}" cy="${h/2}" rx="2.5" ry="2.5" style="fill:${c1};stroke:${c1};" />
</pattern>
`;
                break; }
            case 20: { //  TRIANGLE_HALF
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<path d="M 0 0 L ${w} 0 L 0 ${h} L 0 0" style="fill:${c1};stroke:${c1};" />
</pattern>
`;
                break; }
            case 22: { //  DIAGONAL_CROSS
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<line x1="0" y1="0" x2="${w}" y2="${h}" style="fill:${c1};stroke:${c1};"></line>
<line x1="${w}" y1="0" x2="0" y2="${h}" style="fill:${c1};stroke:${c1};"></line>
</pattern>
`;
                break; }
            case 23: { //  STONE_WALL
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
<g style="fill:${c1};stroke:${c1};">
<line x1="5" y1="0" x2="6" y2="7"/>
<line x1="6" y1="7" x2="0" y2="10"/>
<line x1="6" y1="7" x2="16" y2="9"/>
<line x1="16" y1="9" x2="23" y2="0"/>
<line x1="16" y1="9" x2="15" y2="18"/>
<line x1="15" y1="18" x2="20" y2="22"/>
<line x1="15" y1="18" x2="4" y2="25"/>
<line x1="4" y1="25" x2="0" y2="20"/>
<line x1="4" y1="25" x2="8" y2="30"/>
<line x1="9" y1="30" x2="4" y2="35"/>
<line x1="4" y1="35" x2="0" y2="33"/>
<line x1="9" y1="30" x2="19" y2="31"/>
<line x1="19" y1="31" x2="23" y2="35"/>
<line x1="19" y1="31" x2="20" y2="22"/>
<line x1="20" y1="22" x2="29" y2="18"/>
<line x1="29" y1="18" x2="31" y2="11"/>
<line x1="31" y1="11" x2="19" y2="6"/>
<line x1="31" y1="11" x2="35" y2="9"/>
<line x1="35" y1="20" x2="29" y2="27"/>
<line x1="29" y1="27" x2="35" y2="33"/>
<line x1="35" y1="9" x2="29" y2="0"/>
<line x1="29" y1="0" x2="23" y2="0"/>
<line x1="35" y1="33" x2="29" y2="35"/>
<line x1="35" y1="19" x2="29" y2="18"/>
</g>
</pattern>
`;
                break; }
            case 13: { //  INSULATION
                var a = w/3, b = h/3, u = 0;
                patternContent = `<pattern id="${patternId}" patternUnits="userSpaceOnUse" width="${w}" height="${h}">
<rect x="0" y="0" width="${w}" height="${h}" ${bg_fill_style} />
`;
                for (var i = 0; i < 3; i++) {
//      _
//    /   \
//    \   /
//     \ /
//      |
// \ _ /\ _ /
//      
//   |----|
                    patternContent+= `
<path style="fill:none;stroke:${c1};" d="
 M ${u-a/2} ${h-b/2} 
 A 1 1 0 0 0 ${u+a/2} ${h-b/2}
 L ${u+a} ${b/2} 
 A 1 1 0 0 0 ${u} ${b/2}
 L ${u+a/2} ${h-b/2} 
 A 1 1 0 0 0 ${u+a+a/2} ${h-b/2}
"/>
`;
                    u += a;
                }
                patternContent+= `</pattern>`;
                break; }
               
        }
        defs.innerHTML+= patternContent;
        this.usedPatterns[patternId] = true;
    }
    return patternId;
}

/**
* Smooth Bezier Spline Through Prescribed Points
*
* Copied from the interacive SVG demo at:
* https://www.particleincell.com/2012/bezier-splines/
* 
* https://www.particleincell.com/wp-content/uploads/2012/06/bezier-spline.js
*
*/
model2d.generateBlobPathD = function( x, y ) {

    //computes control points given knots K, this is the brain of the operation
    var computeControlPoints = function (K) {
        var p1=new Array();
        var p2=new Array();
        var n = K.length-1;

        //rhs vector
        var a=new Array();
        var b=new Array();
        var c=new Array();
        var r=new Array();

        var i;

        //left most segment
        a[0]=0;
        b[0]=2;
        c[0]=1;
        r[0] = K[0]+2*K[1];

        //internal segments
        for (i = 1; i < n - 1; i++)
        {
            a[i]=1;
            b[i]=4;
            c[i]=1;
            r[i] = 4 * K[i] + 2 * K[i+1];
        }

        //right segment
        a[n-1]=2;
        b[n-1]=7;
        c[n-1]=0;
        r[n-1] = 8*K[n-1]+K[n];

        //solves Ax=b with the Thomas algorithm (from Wikipedia)
        for (i = 1; i < n; i++)
        {
            m = a[i]/b[i-1];
            b[i] = b[i] - m * c[i - 1];
            r[i] = r[i] - m*r[i-1];
        }

        p1[n-1] = r[n-1]/b[n-1];
        for (i = n - 2; i >= 0; --i)
            p1[i] = (r[i] - c[i] * p1[i+1]) / b[i];

        //we have p1, now compute p2
        for (i=0;i<n-1;i++)
            p2[i]=2*K[i+1]-p1[i+1];

        p2[n-1]=0.5*(K[n]+p1[n-1]);

        return {p1:p1, p2:p2};
    }

	//computes control points p1 and p2 for x and y direction
	var px = computeControlPoints(x);
	var py = computeControlPoints(y);

    var d = '';
	for (var i = 0; i < x.length - 1; i++) {
	    if (i == 0) {
            d+=`M ${x[i]} ${y[i]} C ${px.p1[i]} ${py.p1[i]} ${px.p2[i]} ${py.p2[i]} ${x[i+1]} ${y[i+1]}`;
	    } else {
	        d+=` S ${px.p2[i]} ${py.p2[i]} ${x[i+1]} ${y[i+1]}`;
	    }
    }
    return d;
}


model2d.drawPhotons = function(model) {
    if (model.photons.length) {

        var svgG = model.svg.group
        ,   scale_x = model.svg.scale_x
        ,   scale_y = model.svg.scale_y
        ,   gPhotons = svgG.querySelector("g#photons") 
        ,   photons = model.photons
        ,   photonLength = model.photonSolver.spacing //Math.max(5, model.timeStep * 0.1)    // ???
        ,   x,y,r 
        ;
        if (!gPhotons) {
            gPhotons = svgG.appendChild(svgG.ownerDocument.createElementNS(svgNS,'g'));
            gPhotons.id = "photons";
            gPhotons.setAttribute('style','stroke-width:0.5;stroke:aliceblue;opacity:0.5;');
        }
        gPhotons.innerHTML = "";    // TODO ... instead creating move lines !

        photons.forEach( photon => {
            var line = gPhotons.appendChild(gPhotons.ownerDocument.createElementNS(svgNS,'line'))
            ;
            r = 1.0 / Math.hypot(photon.vx, photon.vy);

            line.setAttribute('x1', (photon.rx - photonLength * photon.vx * r) * scale_x);
            line.setAttribute('y1', (photon.ry - photonLength * photon.vy * r) * scale_y);
            line.setAttribute('x2', photon.rx * scale_x);
            line.setAttribute('y2', photon.ry * scale_y);
        })

    }
}

model2d.particleDrawer = {
    update: function(particle, model) {
        var svgG = model.svg.group
        ,   scale_x = model.svg.scale_x
        ,   scale_y = model.svg.scale_y
        ,   gParticles = svgG.querySelector("g#particles") 
        ;
        if (!gParticles) {
            gParticles = svgG.appendChild(svgG.ownerDocument.createElementNS(svgNS,'g'));
            gParticles.id = "particles";
    //        gParticles.setAttribute('style','stroke-width:0.5;stroke:aliceblue;opacity:0.5;');
        }
        var svgElement = gParticles.querySelector(`circle[data-name=${particle.uid}]`);
        if (!svgElement) {
            svgElement = gParticles.appendChild(svgG.ownerDocument.createElementNS(svgNS,'circle'));
            svgElement.setAttribute('style',`stroke:${particle.color};fill:${particle.color}`);   
            svgElement.dataset.name = particle.uid;
            particle.svgElement = svgElement;
        }
        svgElement.setAttribute('cx',particle.rx * scale_x);
        svgElement.setAttribute('cy',particle.ry * scale_y);
        svgElement.setAttribute('r',particle.radius * scale_x);
    }
,   remove: function(particle) {
        if (particle.svgElement) {
            particle.svgElement.parentNode.removeChild(particle.svgElement);
        }
    }
}