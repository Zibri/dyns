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
canvas.addEventListener('touchend', async function(e) {
	if (e.target.tt > 1) {
		const blob = await (await fetch(canvas.toDataURL('image/png'))).blob();
		const filesArray = [
			new File(
				[blob],
				new Date().getTime().toString().substring(6) + '.png', {
					type: blob.type,
					lastModified: new Date().getTime()
				}
			)
		];
		const shareData = {
			files: filesArray,
		};
		navigator.share(shareData);
	}
});

canvas.addEventListener('touchstart', async function(e) {
	e.target.tt=e.touches.length;
});
var ctx = canvas.getContext("2d");
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

mdata = Array(256).fill(0);
mc = 0;
function updateFancyGraphs(e) {
    var rot = e.rotationRate;
    var gh = canvas.height;
    var gh2 = gh / 2;
    var v = rot.alpha + rot.beta + rot.gamma;
    mdata = mdata.slice(1);
    mdata[255] = v;
    mc += 1;
    if (mc == 256) {
        mc = 0;
        fft = new FFT(mdata.length,60);
        fft.forward(mdata);
        freqs = [].slice.call(fft.spectrum);
        mfreq = freqs.indexOf(Math.max(...freqs)) * (60 / 2 / 128);
        console.log((Math.round((0.01 + mfreq + (60 / 4 / 128)) * 100) / 100) + " Hz");
    }
    ctx.drawImage(canvas, -1, 0);
    //  ctx.fillRect(graphX, 0, 2, canvas.height);
    ctx.fillRect(graphX, 0, 1, canvas.height);
    var size = Math.max(-gh, Math.min((3 * (v)) * d, gh));
    ctx.beginPath();
    ctx.moveTo(graphX - 1, gh2 + ls / 2);
    ctx.lineTo(graphX, gh2 + size / 2);
    ctx.stroke();
    ls = size;
}

function resizeCanvas() {
	var status = document.getElementById("dm_status");
	status.innerText = window.innerWidth + "x" + window.innerHeight;
	status.innerText += "  " + canvas.width + "x" + canvas.height;
	var w = window.innerWidth || document.body.offsetWidth;
	canvas.width = w / 1.5;
	canvas.height = window.innerHeight / 1.5;
	graphX = canvas.width - 1;
	ctx.lineWidth = 1.3; // 1.75 is nicer lookign but loses a lot of information.
	ctx.strokeStyle = "Lime";
	ctx.fillStyle = "black";
}
window.addEventListener("resize", resizeCanvas);

resizeCanvas();

function gofs(e) {
	if (document.fullscreenElement != null) {
		if (t) {
			window.removeEventListener("devicemotion", updateFancyGraphs);
		} else {
			window.addEventListener("devicemotion", updateFancyGraphs);
		}
		(t = !t)
	} else {
		document.getElementById('fs').requestFullscreen();
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
                        var xx=0;
			if (!navigator.userAgentData.mobile) {
				z = setInterval(() => updateFancyGraphs({
					"rotationRate": {
						"alpha": 4*(Math.sin(xx/4.8)),
						"beta": 0,
						"gamma": (xx++)&0
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
