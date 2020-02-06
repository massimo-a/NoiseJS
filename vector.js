const Vector = function(_x, _y, _z) {
	let _add = function(v) {
		return Vector(_x + v.x, _y + v.y, _z + v.z)
	}
	
	let _sub = function(v) {
		return Vector(_x - v.x, _y - v.y, _z - v.z)
	}
	
	let _scale = function(a) {
		return Vector(_x*a, _y*a, _z*a)
	}
	
	let _dot = function(v) {
		return _x*v.x + _y*v.y + _z*v.z
	}
	
	let _mag = function() {
		return Math.sqrt(_x*_x + _y*_y + _z*_z)
	}
	
	let _norm = function() {
		let m = _mag()
		return Vector(_x/m, _y/m, _z/m)
	}
	
	return {
		x: _x,
		y: _y,
		z: _z,
		add: _add,
		sub: _sub,
		scale: _scale,
		dot: _dot,
		mag: _mag,
		norm: _norm,
	}
}

const List = {
	insert: function(arr, d) {
		let res = []
		let i = 0
		while(i < arr.length && arr[i] < d) {
			res[i] = arr[i]
			i++
		}
		res[i] = d
		i++
		while(i-1 < arr.length) {
			res[i] = arr[i-1]
			i++
		}
		return res
	},
	
	insertWith: function(arr, d, f) {
		let res = []
		let i = 0
		while(i < arr.length && f(arr[i]) < f(d)) {
			res[i] = arr[i]
			i++
		}
		res[i] = d
		i++
		while(i-1 < arr.length) {
			res[i] = arr[i-1]
			i++
		}
		return res
	}
}

const ColorStops = {
	hexToRgb: function(hexStr) {
		if(hexStr.charAt(0) == "#") {
			hexStr = hexStr.replace("#", "")
		}
		if(hexStr.length == 3) {
			hexStr = hexStr.charAt(0).repeat(2) + hexStr.charAt(1).repeat(2) + hexStr.charAt(2).repeat(2)
		}
		let hex = parseInt(hexStr, 16)
		let r = (hex & 0xFF0000) >> 16
		let g = (hex & 0x00FF00) >> 8
		let b = (hex & 0x0000FF)
		return [r, g, b]
	},
	
	getColor: function(stops, percent) {
		let i = 0
		while(i < stops.length - 1 && !(stops[i][3] < percent && stops[i+1][3] > percent)) {
			i++
		}
		let p = (percent - stops[i][3])/(stops[i+1][3] - stops[i][3])
		let r = Math.abs(Math.floor(stops[i][0]*(1-p) + stops[i+1][0]*p))
		let g = Math.abs(Math.floor(stops[i][1]*(1-p) + stops[i+1][1]*p))
		let b = Math.abs(Math.floor(stops[i][2]*(1-p) + stops[i+1][2]*p))
		return [r, g, b]
	},
	
	rgbToHex: function(arr) {
		let hex1 = arr[0].toString(16).toUpperCase()
		let r = hex1.length == 1 ? "0" + hex1 : hex1
		hex1 = arr[1].toString(16).toUpperCase()
		let g = hex1.length == 1 ? "0" + hex1 : hex1
		hex1 = arr[2].toString(16).toUpperCase()
		let b = hex1.length == 1 ? "0" + hex1 : hex1
		return "#" + r + g + b;
	},
	
	toString: function(arr) {
		return "<span>" + ColorStops.rgbToHex([arr[0], arr[1], arr[2]]) + "</span>" +
		"<span>" + parseInt(arr[3]*100) + "%</span>"
	},
	
	updateUI: function(id, callback) {
		children = document.getElementById(id).children
		for(let i = 0; i < children.length; i++) {
			children[i].addEventListener("click", function() {
				colorStops.splice(i, 1)
				ColorStops.updateView(id, colorStops, callback)
			})
		}
	},
	
	updateView: function(id, arr, callback) {
		let cNode = document.getElementById(id).cloneNode(false);
		document.getElementById(id).parentNode.replaceChild(cNode, document.getElementById(id))
		for(let i = 0; i < arr.length; i++) {
			document.getElementById(id).innerHTML += "<li class='nav-item ml-sm-3 mt-sm-3'><a class='nav-link bg-primary text-dark d-flex justify-content-between' style='border-radius: 20px;'  href='#'>"+
				ColorStops.toString(colorStops[i])+"</a></li>"
		}
		ColorStops.updateUI(id, callback)
		if(callback) callback()
	},
}

let Noise = {
	hash: function(x) {
		return x*2903 + 5501
	},

	rand: function(seed, x, y) {
		let s = Math.sin(seed*Noise.hash(x) + Noise.hash(y))*seed
		return s - Math.floor(s)
	},

	lerp: function(x, y, t) {
		return x*(1-t) + y*t
	},

	smooth: function(a) {
		return a*a*a*(a*(a*6 - 15) + 10)
	},

	ValueNoise: function(x, y, seed) {
		let idx = Math.floor(x)
		let idy = Math.floor(y)
		let lvx = Noise.smooth(x - idx)
		let lvy = Noise.smooth(y - idy)
		let b = Noise.lerp(Noise.rand(seed, idx, idy),Noise.rand(seed, idx+1, idy),lvx)
		let t = Noise.lerp(Noise.rand(seed, idx, idy+1),Noise.rand(seed, idx+1, idy+1),lvx)
		return Noise.lerp(b, t, lvy)
	},

	FractalNoise: function(per, lac, oct, seed) {
		return function(x, y) {
			let p = per
			let l = lac
			let max = 0
			let accu = 0
			for(let i = 0; i < oct; i++) {
				accu = accu + Noise.ValueNoise(x*l, y*l, seed)*p
				max = max + p
				p = p*per
				l = l*lac
			}
			return accu/max
		}
	},
	
	FractalNoiseWith: function(f, per, lac, oct, seed) {
		return function(x, y) {
			let p = per
			let l = lac
			let max = 0
			let accu = 0
			for(let i = 0; i < oct; i++) {
				accu = accu + f(Noise.ValueNoise(x*l, y*l, seed))*p
				max = max + p
				p = p*per
				l = l*lac
			}
			return accu/max
		}
	},
}

const Inputs = {
	IntInput: function(id, call) {
		let input = document.getElementById(id)
		input.addEventListener("change", function() {
			if(input.value) {
				Settings[id] = parseInt(input.value)
				if(call) call()
			}
		})
	},

	FloatInput: function(id, call) {
		let input = document.getElementById(id)
		input.addEventListener("change", function() {
			if(input.value) {
				Settings[id] = parseFloat(input.value)
				if(call) call()
			}
		})
	},

	OptionInput: function(id, set, value, call) {
		let input = document.getElementById(id)
		input.addEventListener("click", function() {
			Settings[set] = value
			if(call) call()
		})
	},
	
	getMousePosition: function(canvas, event) { 
		let rect = canvas.getBoundingClientRect()
		let scaleX = canvas.width / rect.width
		let scaleY = canvas.height / rect.height
		let x = (event.clientX - rect.left)*scaleX 
		let y = (event.clientY - rect.top)*scaleY
		return Vector(x, y, 0)
	},
	
	mouseEvents: function(elem, up, move, down, click) {
		if(up) {
			elem.addEventListener("mouseup", up)
		}
		if(move) {
			elem.addEventListener("mousemove", move)
		}
		if(down) {
			elem.addEventListener("mousedown", down)
		}
		if(click) {
			elem.addEventListener("click", click)
		}
	},
}

let Distance = {
	Manhattan: function(v1, v2) {
		return Math.abs(v1.sub(v2).x) + Math.abs(v1.sub(v2).y) + Math.abs(v1.sub(v2).z)
	},
	Euclidean: function(v1, v2) {
		return v1.sub(v2).mag()
	},
	Minkowski: function(v1, v2, p) {
		let v = v1.sub(v2)
		return Math.pow(Math.pow(Math.abs(v.x), p) + Math.pow(Math.abs(v.y), p) + Math.pow(Math.abs(v.z), p), 1/p)
	},
	Chebyshev: function(v1, v2) {
		let v = v1.sub(v2)
		return Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))
	},
	Canberra: function(v1, v2) {
		let v3 = Vector(Math.abs(v1.x), Math.abs(v1.x), Math.abs(v1.x))
		let v4 = Vector(Math.abs(v2.x), Math.abs(v2.x), Math.abs(v2.x))
		let v = v1.sub(v2)
		let a = v3.add(v4)
		let u = Vector(Math.abs(v.x)/Math.abs(a.x), Math.abs(v.y)/Math.abs(a.y), Math.abs(v.z)/Math.abs(a.z))
		return u.x + u.y + u.z
	}
}

let DrawingPanel = function(canvas) {
	let ctx = canvas.getContext('2d')
	let mousePressed = false
}

//CYB540-DevTestLab-W10-CYB540a004-457754
