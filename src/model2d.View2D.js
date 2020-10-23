

// *******************************************************
//
//   View
//
// *******************************************************

// float x, float y, float energy, float c
model2d.View2D = function(model) {

	this.model = model;
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
    graphDataType: 0,
    graphTimeUnit: 0,
    fahrenheitUsed: false,
    viewFactorLines: false,
    borderTickmarks: false,
    grid: false,
    snapToGrid: true,
    gridSize: 10,
    isotherm: false,
    streamline: false,
    colorPalette: false,
    colorPaletteType: model2d.View2D.prototype.CONST.RAINBOW,
//    colorPaletteX, colorPaletteY, colorPaletteW, colorPaletteH,
    velocity: false,
    heatFluxArrows: false,
    heatFluxLines: false,
    graphOn: false,
    clock: true,
    showLogo: true,
    controlPanel: false,
    controlPanelPosition: 0,
    smooth: true,
    minimumTemperature: 0,
    maximumTemperature: 50,
    fanRotationSpeedScaleFactor: 1,
    graphXLabel: null,
    graphYLabel: null,
    graphYmin: 0,
    graphYmax: 50,
    heatMapType: model2d.View2D.prototype.CONST.HEATMAP_TEMPERATURE,
}