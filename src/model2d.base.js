"use strict";

//     model2d.js 0.1.0
//     (c) 2010 The Concord Consortium
//     created by Stephen Bannasch
//     model2d.js may be freely distributed under the LGPL license.

//function genNamespaceModel2d() {  //(function() {


var model2d = {};
//var root = this;
model2d.VERSION = '0.1.0';

// Constants
    // Stefan's constant unit J/(s*m^2*K^-4)
model2d.STEFAN_CONSTANT = 5.67E-08;

model2d.AIR_THERMAL_CONDUCTIVITY = 0.025;       // Air's thermal conductivity = 0.025 W/(m*K)
model2d.AIR_SPECIFIC_HEAT = 1012;               // Air's specific heat = 1012 J/(kg*K)
model2d.AIR_DENSITY = 1.204;                    // Air's density = 1.204 kg/m^3 at 25 C


/*
 * By default, air's kinematic viscosity = 1.568 x 10^-5 m^2/s at 27 C is
 * used. It can be set to zero for inviscid fluid.
 */
model2d.AIR_VISCOSITY = 0.00001568;


model2d.BUOYANCY_AVERAGE_ALL = 0;
model2d.BUOYANCY_AVERAGE_COLUMN = 1;
model2d.GRAVITY_UNIFORM = 0;
model2d.GRAVITY_CENTRIC = 1;

model2d.Boundary_UPPER = 0;
model2d.Boundary_RIGHT = 1;
model2d.Boundary_LOWER = 2;
model2d.Boundary_LEFT = 3;

model2d.MassBoundary_REFLECTIVE = 0;
model2d.MassBoundary_THROUGH = 1;
model2d.MassBoundary_STOP = 2;
model2d.MassBoundary_PERIODIC = 3;

model2d.NX = 100;
model2d.NY = 100;
model2d.ARRAY_SIZE = model2d.NX * model2d.NY;

model2d.array_type = "regular";

function createArray(size, fill) {
    size = size || model2d.ARRAY_SIZE;
    fill = fill || 0;
    var a;
    if (model2d.array_type === "typed") {
        a = new Float64Array(size);
    } else {
        a = new Array(size);
    }
    if (a[size-1] == fill) {
        return a;
    } else {
        for (var i = 0; i < size; i++) {
            a[i] = fill;
        }
    } 
    return a;
}

model2d.default_config = {
    model:{
        timestep: 0.1,
        measurement_interval: 100,
        viewupdate_interval: 20,
        sunny: true,
        sun_angle: 1.5707964,
        solar_power_density: 20000,
        solar_ray_count: 24,
        solar_ray_speed: 0.001,
        photon_emission_interval: 5,
        convective: true,
        background_conductivity: 0.25,
        thermal_buoyancy: 0.00025,
        buoyancy_approximation: 1,
        background_density: 1,

        boundary:{
            temperature_at_border:{
                upper: 0,
                lower: 0,
                left: 0,
                right: 0
            }
        },

        sensor:{
            thermometer:[
                {
                    x: 0.75,
                    y: 6
                },
                {
                    x: 1.75,
                    y: 6
                },
                {
                    x: 8,
                    y: 6
                }
            ]
        },

        structure:{
            part:[
                {
                    rectangle:{
                        x: 4.5,
                        y: 4.5,
                        width: 1,
                        height: 1
                    },
                    thermal_conductivity: 1,
                    specific_heat: 1300,
                    density: 25,
                    transmission: 0,
                    reflection: 0,
                    absorption: 1,
                    emissivity: 0,
                    temperature: 50,
                    constant_temperature: true,
                    filled: false
                }
            ]
        }
    },

    view:{
        minimum_temperature: 0,
        maximum_temperature: 50,
    }
};

//
// Utilities
//

model2d.copyArray = function(destination, source) {
    var source_length = source.length;
    for (var i = 0; i < source_length; i++) {
        destination[i] = source[i];
    }
};

/** @return true if x is between a and b. */
// float a, float b, float x
model2d.between = function(a, b, x) {
    return x < Math.max(a, b) && x > Math.min(a, b);
};

// float[] array
model2d.getMax = function(array) {
    return Math.max.apply( Math, array );
};

// float[] array
model2d.getMin = function(array) {
    return Math.min.apply( Math, array );
};

// FloatxxArray[] array
model2d.getMaxTypedArray = function(array) {
    var max = Number.MIN_VALUE;
    var length = array.length;
    var test;
    for (var i = 0; i < length; i++) {
        test = array[i];
        max = test > max ? test : max;
    }
    return max;
};

// FloatxxArray[] array
model2d.getMinTypedArray = function(array) {
    var min = Number.MAX_VALUE;
    var length = array.length;
    var test;
    for (var i = 0; i < length; i++) {
        test = array[i];
        min = test < min ? test : min;
    }
    return min;
};

// float[] array
model2d.getMaxAnyArray = function(array) {
    try {
        return Math.max.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var max = Number.MIN_VALUE;
            var length = array.length;
            var test;
            for (var i = 0; i < length; i++) {
                test = array[i];
                max = test > max ? test : max;
            }
            return max;
        }
    }
};

// float[] array
model2d.getMinAnyArray = function(array) {
    try {
        return Math.min.apply( Math, array );
    }
    catch (e) {
        if (e instanceof TypeError) {
            var min = Number.MAX_VALUE;
            var length = array.length;
            var test;
            for (var i = 0; i < length; i++) {
                test = array[i];
                min = test < min ? test : min;
            }
            return min;
        }
    }
};

model2d.getAverage = function(array) {
    var acc = 0;
    var length = array.length;
    for (var i = 0; i < length; i++) {
        acc += array[i];
    };
    return acc / length;
};

