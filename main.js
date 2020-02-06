let c = document.getElementsByTagName("canvas")[0]
let ctx = c.getContext("2d")

let pts = []
let colorStops = [[255, 255, 255, 0.0], [0, 0, 0, 1.0]]
let colorStopIds = [0, 1]

Settings = {
	"seed": 1319,
	"block-size": 150,
	"width": 1800,
	"height": 700,
	"base-red": 255,
	"base-green": 255,
	"base-blue": 255,
	"noise-type": 2,
	"distance-func": Distance.Euclidean,
	"lacunarity": 2,
	"persistence": 0.5,
	"octaves": 5,
}

let sortedPoints = function(pts, v) {
	let res = []
	for(let i = 0; i < pts.length; i++) {
		let dist = Settings["distance-func"](pts[i], v)
		res = List.insert(res, dist)
	}
	return res
}

let toColor = function(a) {
	let col = ColorStops.getColor(colorStops, a)
	return "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")"
}

let initializePoints = function() {
	let pts = []
	for(let i = 0; i < Settings["width"]/Settings["block-size"]; i++) {
		for(let j = 0; j < Settings["height"]/Settings["block-size"]; j++) {
			pts[i*parseInt(Settings["height"]/Settings["block-size"]) + j] = Vector((Math.random() + i)*Settings["block-size"], (Math.random() + j)*Settings["block-size"], 0)
		}
	}
	return pts;
}
pts = initializePoints()
pixelValues = []

let updatePixel = function(arr, i, j) {
	let c;
	if(Settings["noise-type"] == 0) {
		let d = sortedPoints(arr, Vector(i, j, 0))
		c = d[0]/d[1]
	} else if(Settings["noise-type"] == 1) {
		c = Noise.ValueNoise(i/Settings["block-size"], j/Settings["block-size"], Settings["seed"])
	} else if(Settings["noise-type"] == 2) {
		c = Noise.FractalNoise(Settings["persistence"], Settings["lacunarity"], Settings["octaves"], Settings["seed"])(i/Settings["block-size"], j/Settings["block-size"])
	} else if(Settings["noise-type"] == 3) {
		c = Noise.FractalNoiseWith(x => Math.abs(x*2 - 1), Settings["persistence"], Settings["lacunarity"], Settings["octaves"], Settings["seed"])(i/Settings["block-size"], j/Settings["block-size"])
	}
	ctx.fillStyle = toColor(c)
	ctx.fillRect(i, j, 1, 1)
}

let draw = function(arr) {
	let j = 0;
	let interval = setInterval(function() {
		if(j < Settings["height"]) {
			for(let k = 0; k < Settings["width"]; k++) {
				updatePixel(arr, k, j)
			}
			j++
		} else {
			clearInterval(interval)
		}
	}, 10)
}

Inputs.OptionInput("worley", "noise-type", 0, function() {
	document.getElementById("worley-options").classList.remove("collapse")
	document.getElementById("fractal-options").classList.add("collapse")
	draw(pts)
})
Inputs.OptionInput("value", "noise-type", 1, function() {
	document.getElementById("worley-options").classList.add("collapse")
	document.getElementById("fractal-options").classList.add("collapse")
	draw(pts)
})
Inputs.OptionInput("fractal", "noise-type", 2, function() {
	document.getElementById("worley-options").classList.add("collapse")
	document.getElementById("fractal-options").classList.remove("collapse")
	draw(pts)
})
Inputs.OptionInput("ridged", "noise-type", 3, function() {
	document.getElementById("worley-options").classList.add("collapse")
	document.getElementById("fractal-options").classList.remove("collapse")
	draw(pts)
})
Inputs.OptionInput("manhattan", "distance-func", Distance.Manhattan, function(){draw(pts)})
Inputs.OptionInput("euclid", "distance-func", Distance.Euclidean, function(){draw(pts)})
Inputs.OptionInput("cheby", "distance-func", Distance.Chebyshev, function(){draw(pts)})

Inputs.IntInput("seed", function(){draw(pts)})
Inputs.IntInput("block-size", function() {
	pts = initializePoints()
	draw(pts)
})
Inputs.IntInput("octaves", function(){draw(pts)})

Inputs.FloatInput("persistence", function(){draw(pts)})
Inputs.FloatInput("lacunarity", function(){draw(pts)})

let mouseDown = false

let test = function(e) {
	let p = Inputs.getMousePosition(c, e)
	let r = 50
	let inc = 100
	let img = ctx.getImageData(p.x-r, p.y-r, 2*r, 2*r)
	let imgData = img.data
	for(let i = 0; i < imgData.length; i+=4) {
		let a = Math.floor(i/(8*r)) - r
		let b = Math.floor(i/4)%(2*r) - r
		if(a*a + b*b <= r*r && imgData[i] < 255) {
			let inv = Math.floor(Math.sqrt(a*a+b*b)/2) + 10
			imgData[i] = imgData[i] + Math.floor(inc/inv)
			imgData[i+1] = imgData[i+1] + Math.floor(inc/inv)
			imgData[i+2] = imgData[i+2] + Math.floor(inc/inv)
		} else if(imgData[i] > 255) {
			console.log(imgData[i])
		}
	}
	ctx.putImageData(img, p.x-r, p.y-r)
}

Inputs.mouseEvents(c, function() {
	if(Settings["noise-type"] != 0) {
		mouseDown = false
	}
}, function(e) {
	if((Settings["noise-type"] == 1 || Settings["noise-type"] == 2) && mouseDown) {
		test(e)
	}
}, function() {
	if(Settings["noise-type"] != 0 && !mouseDown) {
		mouseDown = true
	}
}, function(e) {
	if(Settings["noise-type"] == 0) {
		pts.push(Inputs.getMousePosition(c, e))
		draw(pts)
	}
})

document.getElementById("export").addEventListener("click", function() {
	let a = c.toDataURL("image/png")
	document.write('<img src="' + a + '"/>')
})

document.getElementById("worley-reset").addEventListener("click", function() {
	pts = []
	draw(pts)
})

document.getElementById("add-col-stop").addEventListener("click", function() {
	let rgb = ColorStops.hexToRgb(document.getElementById("hex-color").value)
	let a = parseFloat(document.getElementById("col-stop-pt").value)
	colorStops = List.insertWith(colorStops, [rgb[0], rgb[1], rgb[2], a], x => {return x[3]})
	ColorStops.updateView("color-stops-list", colorStops, function() {draw(pts)})
	draw(pts)
})

draw(pts)