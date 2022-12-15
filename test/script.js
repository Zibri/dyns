function requestDeviceMotion(callback) {
	if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
		DeviceMotionEvent.requestPermission().then(
			function(state) {
				if (state == "granted") {
					callback(null);
				} else callback(new Error("Permission denied by user"));
			},
			function(err) {
				callback(err);
			}
		);
	} else if (window.ondevicemotion !== undefined) {
		callback(null);
	} else callback(new Error("DeviceMotion is not supported."));
}
//
var canvas = document.getElementById("dm_graphs");
var ctx = canvas.getContext("2d");
ctx.lineWidth=1.75;
//            ctx.fillStyle = "#000000";
//            ctx.fillRect(0, 0, canvas.width, canvas.height);
//var graphX = window.innerWidth-1;
ls = 0;
t = true; // true=linegraph false=filledgraph
d = 7; // sesitivity
function updateFancyGraphsOld(e) {
	var rot = e.rotationRate;
	var acc = e.acceleration || e.accelerationIncludingGravity;
	var gh = canvas.height;
	var gh2 = gh / 2;

	function drawGraph(val, color) {
		if (val == null)
			val = 0;
		var size = Math.max(-gh, Math.min(val * d, gh));
		if (!t) {
			ctx.fillStyle = color;
			ctx.fillRect(graphX, gh2, 1, size / 2);
		} else {
			ctx.strokeStyle = color;
			ctx.beginPath();
			ctx.moveTo(graphX - 1, gh2 + ls);
			ctx.lineTo(graphX, gh2 + size / 2);
			ctx.stroke();
			ls = size / 2;
		}
	}
	ctx.drawImage(canvas, -1, 0);
	ctx.fillStyle = "black";
	//  ctx.fillRect(graphX, 0, 2, canvas.height);
	ctx.fillRect(graphX, 0, 1, canvas.height);
	var a = rot.alpha,
		b = rot.beta,
		c = rot.gamma;
	drawGraph(3 * (a + b + c), "Lime");
}

			ctx.strokeStyle = "Lime";
			ctx.fillStyle = "black";

function updateFancyGraphs(e) {
	var rot = e.rotationRate;
	var gh = canvas.height;
	var gh2 = gh / 2;

	ctx.drawImage(canvas, -1, 0);

	//  ctx.fillRect(graphX, 0, 2, canvas.height);
	ctx.fillRect(graphX, 0, 1, canvas.height);

		var size = Math.max(-gh, Math.min( (3 * (rot.alpha + rot.beta + rot.gamma)) * d, gh));
		
			ctx.beginPath();
			ctx.moveTo(graphX - 1, gh2 + ls / 2);
			ctx.lineTo(graphX, gh2 + size / 2);
			ctx.stroke();
			ls = size;
		

}
//
function resizeCanvas() {
	var status = document.getElementById("dm_status");
	status.innerText = window.innerWidth + "x" + window.innerHeight;
	status.innerText += "  " + canvas.width + "x" + canvas.height;
	var w = window.innerWidth || document.body.offsetWidth;
	canvas.width = w / 1.5;
	canvas.height = window.innerHeight / 1.5;
	graphX = canvas.width - 1;
}
window.addEventListener("resize", resizeCanvas);
//window.addEventListener("deviceorientation", resizeCanvas);
resizeCanvas();
//
function gofs(e) {
	if (document.fullscreenElement != null) {
		(t = !t)
	} else {
		canvas.requestFullscreen();
		const requestWakeLock = async () => {
			try {
				const wakeLock = await navigator.wakeLock.request('screen');
				setTimeout(() => window.screen.orientation.lock("landscape"), 50)
			} catch (err) {
				// The wake lock request fails - usually system-related, such as low battery.
				console.log(`${err.name}, ${err.message}`);
			}
		}
		requestWakeLock();
	}
}

function firstClick(e) {
	var status = document.getElementById("dm_status");
	if (e) status.innerText = "Requesting...";
	requestDeviceMotion(function(err) {
		if (!err) {
			status.innerText = "OK!";
			window.removeEventListener("click", firstClick);
			window.removeEventListener("touchend", firstClick);
			window.addEventListener("devicemotion", updateFancyGraphs);
			el = document.querySelector('#fs');
			el.addEventListener("click", gofs);
			if (!navigator.userAgentData.mobile) {
				z = setInterval(() => updateFancyGraphs({
					"rotationRate": {
						"alpha": 7.5 - Math.random() * 15,
						"beta": 7.5 - Math.random() * 15,
						"gamma": 7.5 - Math.random() * 15
					}
				}), 20)
			}
		} else if (e) {
			status.innerText = "" + err;
		}
	}, e);
	resizeCanvas();
}
window.addEventListener("click", firstClick);
//window.addEventListener("touchend", firstClick);
firstClick(false);
//ctx.font = "30px Georgia";
//ctx.fillStyle = 'yellow';
//ctx.fillText("Click here to start!", window.innerWidth / 2 - 100, 150);
