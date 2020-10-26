

// *******************************************************
//
//   View
//
// *******************************************************

// float x, float y, float energy, float c
model2d.View2D = function(model, options) {

	this.model = model;
	this.settings = Object.assign(this.defaultSettings, options);
	model.view = this;
}

model2d.View2D.prototype.CONST = {
	SELECT_MODE: 0,
	RECTANGLE_MODE: 1,
	ELLIPSE_MODE: 2,
	POLYGON_MODE: 3,
	BLOB_MODE: 4,
	ANNULUS_MODE: 5,
	THERMOMETER_MODE: 11,
	HEAT_FLUX_SENSOR_MODE: 12,
	ANEMOMETER_MODE: 13,
	HEATING_MODE: 21,
	PARTICLE_MODE: 31,
	PARTICLE_FEEDER_MODE: 32,
	FAN_MODE: 33,
	HELIOSTAT_MODE: 34,
	CLOUD_MODE: 35,
	TREE_MODE: 36,

	HEATMAP_NONE: 0,
	HEATMAP_TEMPERATURE: 1,
	HEATMAP_THERMAL_ENERGY: 2,
	MOUSE_READ_DEFAULT: 0,
	MOUSE_READ_TEMPERATURE: 1,
	MOUSE_READ_THERMAL_ENERGY: 2,
	MOUSE_READ_VELOCITY: 3,
	MOUSE_READ_HEAT_FLUX: 4,
	MOUSE_READ_COORDINATES: 5,

	RAINBOW: 0,
	IRON: 1,
	GRAY: 2,

	UPPER_LEFT: 0,
	LOWER_LEFT: 1,
	UPPER_RIGHT: 2,
	LOWER_RIGHT: 3,
	TOP: 4,
	BOTTOM: 5,
	LEFT: 6,
	RIGHT: 7,

//	private final static boolean IS_MAC: System.getProperty("os.name").startsWith("Mac"),

	MINIMUM_MOUSE_DRAG_RESPONSE_INTERVAL: 5,
	TIME_FORMAT: "###.#",
	TEMPERATURE_FORMAT: "###.#",
	VELOCITY_FORMAT: "#.####",
	HEAT_FLUX_FORMAT: "###.##",
	COORDINATES_FORMAT: "###.###",
//	private Font smallFont: new Font(null, Font.PLAIN, 10),
//	private Font sensorReadingFont: new Font(null, Font.PLAIN, 10),
//	private Font labelFont: new Font("Arial", Font.PLAIN | Font.BOLD, 14),    
}

model2d.View2D.prototype.defaultSettings = {
    // view properties
    graph_data_type: 0,
    graph_time_unit: 0,
    fahrenheit_used: false,
    view_factor_lines: false,
    border_tickmarks: false,
    grid: false,
    snap_to_grid: true,
    grid_size: 10,
    isotherm: false,
    streamline: false,
    color_palette: false,
    color_palette_type: model2d.View2D.prototype.CONST.RAINBOW,
//    colorPaletteX, colorPaletteY, colorPaletteW, colorPaletteH,
    velocity: false,
    heat_flux_arrow: false,
    heat_flux_line: false,
    graph: false,    // graphOn
    clock: true,
    showLogo: true,
    control_panel: false,
    control_panel_position: 0,
    smooth: true,
    minimum_temperature: 0,
    maximum_temperature: 50,
    fan_rotation_speed_scale_factor: 1,
    graph_xlabel: null,
    graph_ylabel: null,
    graph_ymin: 0,
    graph_ymax: 50,
    heat_map: model2d.View2D.prototype.CONST.HEATMAP_TEMPERATURE,
}