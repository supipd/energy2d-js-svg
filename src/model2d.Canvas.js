

// *******************************************************
//
//   Graphics Canvas
//
// *******************************************************

/**
* HSV to RGB color conversion
*
* H runs from 0 to 360 degrees
* S and V run from 0 to 100
* 
* Ported from the excellent java algorithm by Eugene Vishnevsky at:
* http://www.cs.rit.edu/~ncs/color/t_convert.html
* 
* http://snipplr.com/view.php?codeview&id=14590
*
*/
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
        r = v;
        g = t;
        b = p;
        break;

        case 1:
        r = q;
        g = v;
        b = p;
        break;

        case 2:
        r = p;
        g = v;
        b = t;
        break;

        case 3:
        r = p;
        g = q;
        b = v;
        break;

        case 4:
        r = t;
        g = p;
        b = v;
        break;

        default: // case 5:
        r = v;
        g = p;
        b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
var red_color_table   = [];
var blue_color_table  = [];
var green_color_table = [];

//    model2d.setupRGBAColorTables('IRON_RGB');
//    STEP
//    model2d.setupRGBAColorTables();
//    STEP
model2d.colorPalette = {
	// the following color scales model after FLIR I-series IR cameras
	rgb: {
        RAINBOW_RGB : [ [ 0, 0, 128 ], [ 20, 50, 120 ], [ 20, 100, 200 ], [ 10, 150, 150 ], [ 120, 180, 50 ], [ 220, 200, 10 ], [ 240, 160, 36 ], [ 225, 50, 50 ], [ 230, 85, 110 ], [ 250, 250, 250 ], [ 255, 255, 255 ] ]
    ,	IRON_RGB : [ [ 40, 20, 100 ], [ 80, 20, 150 ], [ 150, 20, 150 ], [ 200, 50, 120 ], [ 220, 80, 80 ], [ 230, 120, 30 ], [ 240, 200, 20 ], [ 240, 220, 80 ], [ 255, 255, 125 ], [ 250, 250, 250 ], [ 255, 255, 255 ] ]
    ,	GRAY_RGB : [ [ 50, 50, 50 ], [ 75, 75, 75 ], [ 100, 100, 100 ], [ 125, 125, 125 ], [ 150, 150, 150 ], [ 175, 175, 175 ], [ 200, 200, 200 ], [ 225, 225, 225 ], [ 250, 250, 250 ], [ 255, 255, 255 ] ]
    }
,   getColor: function(type, min, max, val) {
        var rgbScale = this.rgb[type] || this.rgb.RAINBOW_RGB
        ,   scale = rgbScale.length / (max - min)
        ,   v = (val - min) * scale
        ;
        if (v > rgbScale.length - 2)
            v = rgbScale.length - 2;
        else if (v < 0)
            v = 0;
        var iv = Math.floor(v); 
        v -= iv;
        var rc = Math.floor(rgbScale[iv][0] * (1 - v) + rgbScale[iv + 1][0] * v)
        ,   gc = Math.floor(rgbScale[iv][1] * (1 - v) + rgbScale[iv + 1][1] * v)
        ,   bc = Math.floor(rgbScale[iv][2] * (1 - v) + rgbScale[iv + 1][2] * v)
        ,   num = (255 << 24) | (rc << 16) | (gc << 8) | bc
        ;
//        return {rc:rc, gc:gc, bc:bc, num:num, hex: num.toString(16)
////        ,   css: loaderE2D.ConvertColorNumbers(num.toString(16)).value  // f.e. value: "#010101"
//        };
        return[rc,gc,bc];
	}
}	
model2d.setupRGBAColorTables = function(type) {
    var rgb = [];
    for(var i = 0; i < 256; i++) {
        switch(type) {
            case 'RAINBOW_RGB':
            case 'IRON_RGB':
            case 'GRAY_RGB':
                rgb = model2d.colorPalette.getColor(type, 0, 256, 255-i);
                break;
            default:
                rgb = hsvToRgb(i, 100, 90);
                break;
        }
        red_color_table[i]   = rgb[0];
        blue_color_table[i]  = rgb[1];
        green_color_table[i] = rgb[2];
    }
};

model2d.initCanvas = function(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;   
};
model2d.cleanCanvasCtx = function(canvas, clean) {
    var ctx = canvas.getContext('2d');
    if (clean) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return ctx;
};

//TODO: move all properties and functions connected with drawing to another module
model2d.MAX_DISPLAY_TEMP = 50;
model2d.MIN_DISPLAY_TEMP = 0;

model2d.displayTemperatureCanvas = function(canvas, model, clean = true) {
    if (model.nx != canvas.width || model.ny != canvas.height) 
        throw "canvas dimensions have to be the same as model grid dimensions.";
    if (red_color_table.length == 0) {
        model2d.setupRGBAColorTables();
    };
    var max_hue = red_color_table.length - 1;
    
    var nx = model.nx;
    var ny = model.ny;
    
    var ctx = model2d.cleanCanvasCtx(canvas, clean);
    ctx.fillStyle = "rgb(0,0,0)";
    
    // constants, as looking for min and max temperature caused that  
    // areas with constant temperatures were chaning their color
    var min = model2d.MIN_DISPLAY_TEMP; // model2d.getMinAnyArray(t);
    var max = 20;   //model2d.MAX_DISPLAY_TEMP; //model2d.getMaxAnyArray(t);
    
    var scale = max_hue / (max - min);
    var hue;
    var imageData = ctx.getImageData(0, 0, nx, ny);
    var data = imageData.data;
    var t = model.t;
    var iny;
    var pix_index = 0;
    var pix_stride = 4 * nx;
    for (var i = 0; i < nx; i++) {
        iny = i * ny;
        pix_index = 4 * i;
        for (var j = 0; j < ny; j++) {
            hue =  max_hue - Math.round(scale * (t[iny + j] - min));
            if (hue < 0) hue = 0;
            else if (hue > max_hue) hue = max_hue;
            data[pix_index]     = red_color_table[hue];
            data[pix_index + 1] = blue_color_table[hue];
            data[pix_index + 2] = green_color_table[hue];
            data[pix_index + 3] = 255;
            pix_index += pix_stride;
        }
    };
    ctx.putImageData(imageData, 0, 0);
};

model2d.displayTemperatureCanvasWithSmoothing = function(canvas, model, clean = true) {
    if (red_color_table.length == 0) {
        model2d.setupRGBAColorTables();
    };
    var max_hue = red_color_table.length - 1;
    
    var ctx = model2d.cleanCanvasCtx(canvas, clean);
    ctx.fillStyle = "rgb(0,0,0)";

    var width = canvas.width;
    var height = canvas.height;
    
    var nx = model.nx;
    var ny = model.ny;
    
    var dx = nx / width;
    var dy = ny / height;

    var t = model.t;
    
    // constants, as looking for min and max temperature caused that  
    // areas with constant temperatures were chaning their color
    var min = model2d.MIN_DISPLAY_TEMP; // model2d.getMinAnyArray(t);
    var max = model2d.MAX_DISPLAY_TEMP; //model2d.getMaxAnyArray(t);
    
    var scale = max_hue / (max - min);
    var avg_temp, hue;
    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var x, x0, x1, s0, s1, y, y0, y1, t0, t1, x0stride, x1stride;
    var pix_index = 0;
    var pix_stride = 4 * width;
    for (var i = 0; i < width; i++) {
        x = i * dx;
        x0 = Math.floor(x);
        x1 = x0 + 1 < nx ? x0 + 1 : x0;
        s1 = x - x0;
        s0 = 1 - s1;
        x0stride = x0 * ny;
        x1stride = x1 * ny;
        pix_index = 4 * i;
        for (var j = 0; j < height; j++) {
            y = j * dy;
            y0 = Math.floor(y);
            y1 = y0 + 1 < ny ? y0 + 1 : y0;
            t1 = y - y0;
            t0 = 1 - t1;
            avg_temp = s0 * (t0 * t[x0stride + y0] + t1 * t[x0stride + y1]) +
                       s1 * (t0 * t[x1stride + y0] + t1 * t[x1stride + y1]);
            hue =  max_hue - Math.round(scale * (avg_temp - min));
            if (hue < 0) hue = 0;
            else if (hue > max_hue) hue = max_hue;
            data[pix_index]     = red_color_table[hue];
            data[pix_index + 1] = blue_color_table[hue];
            data[pix_index + 2] = green_color_table[hue];
            data[pix_index + 3] = 255;
            pix_index += pix_stride;
        }
    };
    ctx.putImageData(imageData, 0, 0);
};


model2d.displayParts = function(canvas, parts, scene_width, scene_height) {
    var ctx = model2d.cleanCanvasCtx(canvas, true);
    ctx.fillStyle = "gray";
    ctx.strokeStyle = "black";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;
    
    var scale_x = (canvas.width - 1) / scene_width;
    var scale_y = (canvas.height - 1) / scene_height;

    var part, px, py, pw, ph;
    var length = parts.length;
    for (var i = 0; i < length; i++) {
        part = parts[i];
        
        if (part.visible) {
            if (part.rectangle) {
               px = part.rectangle.x * scale_x;
               py = part.rectangle.y * scale_y;
               pw = part.rectangle.width * scale_x;
               ph = part.rectangle.height * scale_y;
               ctx.beginPath();
               ctx.moveTo(px, py);
               ctx.lineTo(px + pw, py);
               ctx.lineTo(px + pw, py + ph);
               ctx.lineTo(px, py + ph);
               ctx.lineTo(px, py);
            }

            ctx.stroke();
            if (part.filled)
                ctx.fill();
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
            g.draw(a);  */
        } 
    }
//console.log('displayParts',canvas.width, canvas.height, scale_x, scale_y, canvas);
};

model2d.displayVectorField = function(canvas, u, v, nx, ny, spacing, clean = true) {  

    var ctx = model2d.cleanCanvasCtx(canvas, clean);
    ctx.strokeStyle = "rgb(175,175,175)";
    ctx.lineWidth = 1;

    var dx = canvas.width / nx;
    var dy = canvas.height / ny;
    
    var x0, y0;
    var uij, vij;
    
    var iny, ijny;
    for (var i = 0; i < nx; i += spacing) {
        iny = i * ny;
        x0 = (i + 0.5) * dx; // + 0.5 to move arrow into field center
        for (var j = 0; j < ny; j += spacing) {
            ijny = iny + j;
            y0 = (j + 0.5) * dy; // + 0.5 to move arrow into field center
            uij = u[ijny];
            vij = v[ijny];
            if (uij * uij + vij * vij > 1e-15) {
                model2d.drawVector(ctx, x0, y0, uij, vij);
            }
        }
    }
};


model2d.VECTOR_SCALE = 100;
model2d.WING_COS = Math.cos(0.523598776);
model2d.WING_SIN = Math.sin(0.523598776);
model2d.drawVector = function(canvas_ctx, x, y, vx, vy) {
    canvas_ctx.beginPath(); 
    var r = 1.0 / Math.sqrt(vx*vx + vy*vy);
    var arrowx = vx * r;
    var arrowy = vy * r;
    var x1 = x + arrowx * 8 + vx * model2d.VECTOR_SCALE;
    var y1 = y + arrowy * 8 + vy * model2d.VECTOR_SCALE;
    canvas_ctx.moveTo(x, y);  
    canvas_ctx.lineTo(x1, y1);
    
    r = 4;
    var wingx = r * (arrowx * model2d.WING_COS + arrowy * model2d.WING_SIN);
    var wingy = r * (arrowy * model2d.WING_COS - arrowx * model2d.WING_SIN);
    canvas_ctx.lineTo(x1 - wingx, y1 - wingy);
    canvas_ctx.moveTo(x1, y1);
    
    wingx = r * (arrowx * model2d.WING_COS - arrowy * model2d.WING_SIN);
    wingy = r * (arrowy * model2d.WING_COS + arrowx * model2d.WING_SIN);
    canvas_ctx.lineTo(x1 - wingx, y1 - wingy);
    
    canvas_ctx.stroke();
};

model2d.displayVelocityLengthCanvas = function(canvas, model) {
    if (model.nx != canvas.width || model.ny != canvas.height) 
        throw "canvas dimensions have to be the same as model grid dimensions.";
    if (red_color_table.length == 0) {
        model2d.setupRGBAColorTables();
    };
    var max_hue = red_color_table.length - 1;
    
    var ctx = model2d.cleanCanvasCtx(canvas, true);
    ctx.fillStyle = "rgb(0,0,0)";

    var columns = model.nx;
    var rows = model.ny;
   
    var hue;
    var ycols;

    var u = model.u;
    var v = model.v;
    
    var min = 0;
    
    // look for max value
    var max = Number.MIN_VALUE;
    var length = u.length;
    var test;
    for(var i = 0; i < length; i++) {
        test = u[i]*u[i] + v[i]*v[i];
        if (test > max)
            max = test;
    }
    var scale = red_color_table.length / (max - min);
    var velocity;
    var imageData = ctx.getImageData(0, 0, 100, 100);
    var data = imageData.data;
    var pix_index = 0;
    var pix_stride = 4 * rows;
    for (var y = 0; y < rows; y++) {
        ycols = y * rows;
        pix_index = 4 * y;
        for (var x = 0; x < columns; x++) {
            velocity = u[ycols + x]*u[ycols + x] + v[ycols + x]*v[ycols + x];
            hue =  max_hue - Math.round(scale * velocity - min);
            if (hue < 0) hue = 0;
            else if (hue > max_hue) hue = max_hue;
            data[pix_index]     = red_color_table[hue];
            data[pix_index + 1] = blue_color_table[hue];
            data[pix_index + 2] = green_color_table[hue];
            data[pix_index + 3] = 255;
            pix_index += pix_stride;
        }
    };
    ctx.putImageData(imageData, 0, 0);
};


model2d.displayTemperatureTable = function(destination, model) {
    var columns = model.nx;
    var rows = model.ny;
    var temp;
    var tableStr = "";
    for (var x = 0; x < columns; x++) {
        for (var y = 0; y < rows; y++) {
            temp = model.t[y * columns + x];
            tableStr += sprintf("%2.0f ", temp);
        }
        tableStr += '\n';
    }
    destination.innerHTML = tableStr;
};



// ---------------------------------------------------------

//    Isotherms
//    iii = new model2d.ContourMap(canvasVelocityLenDestination, e2dUI.model)
//    iii.render(e2dUI.model.t)
model2d.ContourMap = function(canvas, model, clean = true) {

    this.model = model;
    this.canvas = canvas;

    this.canvas_ctx = model2d.cleanCanvasCtx(canvas, clean);
    this.canvas_ctx.lineWidth = 0.3;

    this.resolution = 1;
    this.color = 'black';
    this.canvas_ctx.strokeStyle = this.color;
    this.canvas_ctx.stroke();

    this.nx = model.nx;
    this.ny = model.ny;
    this.step = 1;
}
model2d.ContourMap.prototype = {
    render: function(func) {

		this.func = func;

		var step = this.step;

		this.canvas_ctx.strokeStyle = this.color;
		for (var x = 0; x < this.nx - step; x += step) {
			for (var y = 0; y < this.ny - step; y += step) {
				this.connect(x, y, x + step, y, x, y + step, x + step, y + step);
				this.connect(x, y, x + step, y, x, y, x, y + step);
				this.connect(x, y, x + step, y, x + step, y, x + step, y + step);
				this.connect(x, y, x, y + step, x + step, y, x + step, y + step);
				this.connect(x, y, x, y + step, x, y + step, x + step, y + step);
				this.connect(x + step, y, x + step, y + step, x, y + step, x + step, y + step);
			}
		}
//        this.canvas_ctx.stroke();
	}
,   connect: function(x1, y1, x2, y2, x3, y3, x4, y4) {
	    var func = this.func
	    ,   nx = this.nx
		,   f1 = func[x1 * nx + y1]
		,   f2 = func[x2 * nx + y2]
		,   f3 = func[x3 * nx + y3]
		,   f4 = func[x4 * nx + y4]
		,   fmin = Math.min(Math.min(f1, f2), Math.min(f3, f4))
		,   fmax = Math.max(Math.max(f1, f2), Math.max(f3, f4))
		,   imin = Math.floor (fmin / this.resolution)
		,   imax = Math.floor (fmax / this.resolution)
		;
		if (imin != imax) {
			var pa = {x:0, y:0}
			,   pb = {x:0, y:0}
			,   v
			;
			for (var i = imin; i <= imax; i++) {
				v = i * this.resolution;
				if (model2d.between(f1, f2, v) && model2d.between(f3, f4, v)) {
					this.interpolate(f1, f2, x1, y1, x2, y2, v, pa);
					this.interpolate(f3, f4, x3, y3, x4, y4, v, pb);
					//this.line.setLine(pa, pb);
    this.canvas_ctx.beginPath(); 
					this.canvas_ctx.moveTo(pa.x, pa.y);
					this.canvas_ctx.lineTo(pb.x, pb.y);    //g.draw(line);
        this.canvas_ctx.stroke();
				}
			}
		}
	}
,   interpolate: function(f1, f2, x1, y1, x2, y2, v, p) {
		var r2 = (v - f1) / (f2 - f1)
		,   r1 = 1 - r2
		,   h = 0.5 * this.step
		;
		p.x = ((x1 + h) * r1 + (x2 + h) * r2) * this.canvas.width / this.nx;
		p.y = ((y1 + h) * r1 + (y2 + h) * r2) * this.canvas.height / this.ny;
	}
}

//    StreamLines
//    sss = new model2d.FieldLines(canvasVelocityLayer, e2dUI.model, false)
//    sss.renderVectors(e2dUI.model.u, e2dUI.model.v)
//    HeatFluxLines
//    hhh = new model2d.FieldLines(canvasVelocityLayer, e2dUI.model, false)
//    hhh.renderVectors(e2dUI.model.t, -1)
model2d.FieldLines = function(canvas, model, clean = true) {

    this.model = model;
    this.canvas = canvas;

    this.canvas_ctx = model2d.cleanCanvasCtx(canvas, clean);
    this.canvas_ctx.lineWidth = 0.3;

    this.color = 'black';
    this.canvas_ctx.strokeStyle = this.color;
    this.canvas_ctx.stroke();

	this.arrowSpacing = 16; // in pixels
	this.arrowLength = .75;
	this.arrowDirection = 1;

	this.minimumMagnitude = 0.0001;

	this.fluxLineSpacing = 2 * this.arrowSpacing; // in pixels

	this.minColor = "rgb(0, 0, 255)";
	this.maxColor = "rgb(255, 255, 255)";

    this.nx = model.nx;
    this.ny = model.ny;

    this.setSizing(canvas.width, canvas.height);
}
model2d.FieldLines.prototype = {
	numColors: 16
,	spectrum: [
	    [  0,  0,255],[ 17, 17,255],[ 34, 34,255],[ 51, 51,255]
	,   [ 68, 68,255],[ 85, 85,255],[102,102,255],[119,119,255]
	,   [136,136,255],[153,153,255],[170,170,255],[187,187,255]
	,   [204,204,255],[221,221,255],[238,238,255],[255,255,255]
	]
,   setSizing: function(w, h) {
		this.dx = w / this.nx;
		this.dy = h / this.ny;
		this.mx = Math.round(w / this.fluxLineSpacing + 1);
		this.my = Math.round(h / this.fluxLineSpacing + 1);
		this.maxLength = Math.max(w, h);	
		this.size = {width: w, height: h};
    }
,   render: function(vectorORscalar) {

		this.map = createArray(this.mx * this.my, false);

		var x = 0, y = 0;
		for (var i = 0; i < this.mx; i++) {
			for (var j = 0; j < this.my; j++) {
				if (!this.map[i * this.mx + j]) {
					// place a seed point in the center of the region
					x = (i + 0.5) * this.fluxLineSpacing;
					y = (j + 0.5) * this.fluxLineSpacing;
					// draw flux lines forward and backward through the seed point
					if (vectorORscalar == 'vector') {
						this.drawFluxLine(x, y, 1, 'vector');
						this.drawFluxLine(x, y, -1, 'vector');
					} else {
						this.drawFluxLine(x, y, 1, 'scalar');
						this.drawFluxLine(x, y, -1, 'scalar');
					}
				}
			}
		}
    }
	// draw field lines for a 2D vector function
,	renderVectors(funx, funy) {

		this.funx = funx;
		this.funy = funy;

        this.render('vector');
	}
,	renderScalars(func, arrowDirection) {

		this.func = func;
		this.arrowDirection = arrowDirection;

        this.render('scalar');
	}
	/*
	 * @x, @y pixel location of point to start at
	 * 
	 * @sign +1 to travel with the field, -1 to travel against it
	 */
,   drawFluxLine: function(x, y, sign, vectorORscalar) {

		var i, j;
		var magnitude = 0;
		var newX = 0, newY = 0;
		var arrowScale = sign * this.arrowLength * this.arrowSpacing;

		for (var k = 0; k < this.maxLength; k++) {

			i = Math.round(x / this.dx);
			j = Math.round(y / this.dy);
			if (i <= 0 || i >= this.nx - 1 || j <= 0 || j >= this.ny - 1)
				continue;

            if (vectorORscalar == 'vector') {
				var vx = this.funx[i * this.nx + j];
				var vy = this.funy[i * this.nx + j];
            } else {
				var vx = (this.func[(i + 1) * this.nx + j] - this.func[(i - 1) * this.nx + j]) / 2;
				var vy = (this.func[i * this.nx + j + 1] - this.func[i * this.nx + j - 1]) / 2;
			}
            magnitude = Math.hypot(vx, vy);
			if (magnitude < this.minimumMagnitude)
				break;
			vx *= sign;
			vy *= sign;
			vx /= magnitude;
			vy /= magnitude;

			newX = x + vx;
			newY = y + vy;
            this.canvas_ctx.strokeStyle = (this.color == null ? this.getColor(magnitude) : this.color);
			this.canvas_ctx.moveTo(Math.round(x), Math.round(y)); 
		    this.canvas_ctx.lineTo(Math.round(newX), Math.round(newY));
			// every few pixels, draw an arrow
			if (k > 0 && (k % (5 * this.arrowSpacing) == 0)) {
				this.drawArrow(x, y, x + arrowScale * vx, y + arrowScale * vy);
			}
			x = newX;
			y = newY;
			if (x < 0 || x >= this.size.width || y < 0 || y >= this.size.height)
				// we're outside the image's boundaries
				break;

			// mark this part of the image as occupied by a flux line
			this.map[Math.round(x / this.fluxLineSpacing) * this.mx + Math.round(y / this.fluxLineSpacing)] = true;
		}

	}
	// draw field lines for the gradient of a scalar function
,   getColor: function(magnitude) {
		var colorIndex = Math.floor((Math.log10(magnitude) + 3) / 3.6 * numColors);
		// clamp the result
		if (colorIndex < 0)
			colorIndex = 0;
		else if (colorIndex >= numColors)
			colorIndex = numColors - 1;
		return this.spectrum[colorIndex];
	}
	// (x1,y1) is the origin of the arrow; (x2,y2) is the tip of the arrow
,   drawArrow: function(x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		var f = 1 / 3.0; // length of arrow head over length of arrow stem
		var f2 = 1 / 6.0; // half-width of arrow head over length of arrow stem
		var x3 = x2 - f * dx - f2 * dy;
		var y3 = y2 - f * dy + f2 * dx;
		var x4 = x2 - f * dx + f2 * dy;
		var y4 = y2 - f * dy - f2 * dx;
		this.canvas_ctx.beginPath();
		this.canvas_ctx.moveTo(Math.round(x1), Math.round(y1)); 
		this.canvas_ctx.lineTo(Math.round(x2), Math.round(y2));
		this.canvas_ctx.moveTo(Math.round(x3), Math.round(y3)); 
		this.canvas_ctx.lineTo(Math.round(x2), Math.round(y2));
		this.canvas_ctx.moveTo(Math.round(x4), Math.round(y4)); 
		this.canvas_ctx.lineTo(Math.round(x2), Math.round(y2));
		this.canvas_ctx.stroke();
	}

}