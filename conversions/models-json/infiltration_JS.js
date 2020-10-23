var models_library = models_library || {};
models_library.infiltration = {
 "links": {},
 "model": {
  "timestep": 0.1,
  "sun_angle": 1.5707964,
  "solar_power_density": 20000,
  "solar_ray_count": 24,
  "solar_ray_speed": 0.001,
  "photon_emission_interval": 5,
  "gravitational_acceleration": 9.8,
  "thermophoretic_coefficient": 0,
  "particle_drag": 0.01,
  "particle_hardness": 0.000001,
  "z_heat_diffusivity": 0,
  "background_conductivity": 0.2,
  "background_density": 1,
  "background_specific_heat": 100,
  "background_viscosity": 0.0001,
  "thermal_expansion_coefficient": 0.0002,
  "buoyancy_approximation": 0,
  "boundary": {
   "temperature_at_border": {
    "upper": 0,
    "lower": 0,
    "left": 0,
    "right": 0
   },
   "mass_flow_at_border": {
    "upper": 1,
    "lower": 1,
    "left": 1,
    "right": 1
   }
  },
  "structure": {
   "part": [
    {
     "rectangle": {
      "x": 0.95000005,
      "y": 6,
      "width": 0.5,
      "height": 2
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 12,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Wall"
    },
    {
     "rectangle": {
      "x": -0.099999905,
      "y": 8,
      "width": 10.2,
      "height": 2
     },
     "elasticity": 1,
     "thermal_conductivity": 0.001,
     "specific_heat": 3000,
     "density": 50,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 10,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Ground"
    },
    {
     "rectangle": {
      "x": 4.5,
      "y": 2.75,
      "width": 1,
      "height": 5.25
     },
     "elasticity": 1,
     "thermal_conductivity": 0.001,
     "specific_heat": 2000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 12,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Wall"
    },
    {
     "rectangle": {
      "x": 0.78333336,
      "y": 2.25,
      "width": 2.2166667,
      "height": 0.5
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 7,
      "texture_width": 4,
      "texture_height": 4
     }
    },
    {
     "rectangle": {
      "x": 2.25,
      "y": 7.475,
      "width": 1.5,
      "height": 0.45
     },
     "elasticity": 1,
     "thermal_conductivity": 1,
     "specific_heat": 10,
     "density": 1,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 60,
     "constant_temperature": false,
     "power": 1000,
     "label": "Heater"
    },
    {
     "rectangle": {
      "x": 3.2,
      "y": 2.25,
      "width": 3.6,
      "height": 0.5
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 7,
      "texture_width": 4,
      "texture_height": 4
     },
     "label": "Roof"
    },
    {
     "rectangle": {
      "x": 6.25,
      "y": 7.475,
      "width": 1.5,
      "height": 0.45
     },
     "elasticity": 1,
     "thermal_conductivity": 1,
     "specific_heat": 10,
     "density": 1,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 60,
     "constant_temperature": false,
     "power": 1000,
     "label": "Heater"
    },
    {
     "rectangle": {
      "x": 8.55,
      "y": 6,
      "width": 0.5,
      "height": 2
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 12,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Wall"
    },
    {
     "rectangle": {
      "x": 6.8,
      "y": 2.25,
      "width": 2.4,
      "height": 0.5
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 7,
      "texture_width": 4,
      "texture_height": 4
     }
    },
    {
     "rectangle": {
      "x": 8.55,
      "y": 2.9666667,
      "width": 0.5,
      "height": 0.78333336
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 12,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Wall"
    },
    {
     "rectangle": {
      "x": 0.95000005,
      "y": 2.75,
      "width": 0.5,
      "height": 1
     },
     "elasticity": 1,
     "thermal_conductivity": 0.01,
     "specific_heat": 1000,
     "density": 25,
     "transmission": 0,
     "reflection": 0,
     "scattering": false,
     "absorption": 1,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "texture": {
      "texture_fg": -1000000,
      "texture_bg": "-7f7f80",
      "texture_style": 12,
      "texture_width": 10,
      "texture_height": 10
     },
     "label": "Wall"
    },
    {
     "rectangle": {
      "x": 1.125,
      "y": 3.675,
      "width": 0.15,
      "height": 2.35
     },
     "elasticity": 1,
     "thermal_conductivity": 0.1,
     "specific_heat": 1300,
     "density": 25,
     "transmission": 1,
     "reflection": 0,
     "scattering": false,
     "absorption": 0,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "color": "ccccff",
     "label": "Window"
    },
    {
     "rectangle": {
      "x": 8.725,
      "y": 3.675,
      "width": 0.15,
      "height": 2.35
     },
     "elasticity": 1,
     "thermal_conductivity": 0.1,
     "specific_heat": 1300,
     "density": 25,
     "transmission": 1,
     "reflection": 0,
     "scattering": false,
     "absorption": 0,
     "emissivity": 0,
     "temperature": 0,
     "constant_temperature": false,
     "color": "ccccff",
     "label": "Window"
    }
   ]
  },
  "environment": {},
  "sensor": {
   "anemometer": [
    {
     "label": "A1",
     "x": 3.1084657,
     "y": 1.8121691
    },
    {
     "label": "A2",
     "x": 9.563492,
     "y": 2.857143
    }
   ]
  },
  "controller": {}
 },
 "view": {
  "grid": true,
  "snap_to_grid": true,
  "grid_size": 10,
  "graph_data_type": 2,
  "fahrenheit_used": true,
  "perimeter_step_size": 0.05,
  "ruler": true,
  "color_palette_type": 0,
  "color_palette_x": 0,
  "color_palette_y": 0,
  "color_palette_w": 0,
  "color_palette_h": 0,
  "minimum_temperature": 0,
  "maximum_temperature": 50,
  "graph_xlabel": "Time",
  "graph_ylabel": "Wind speed (m/s)",
  "graph_ymin": 0.001975522,
  "graph_ymax": 0.3436307,
  "text": {
   "string": "Where are the energy leaks?",
   "face": "Verdana",
   "size": 14,
   "style": 1,
   "color": "ffffff",
   "border": true,
   "x": 3.4060845,
   "y": 9.68254
  }
 }
}