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
	e.target.tt = e.touches.length;
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

mc = 0;
lbpm = "";
mdata = Array(512).fill(0);
fdata = Array(4).fill(0);
var samples = mdata.length;
txt = document.getElementById('txt');
adata = Array(512).fill(0);

function updateFancyGraphs(e) {
    var rot = e.rotationRate;
    var gh = canvas.height;
    var gh2 = gh / 2;
    var v = rot.alpha + rot.beta + rot.gamma;
    mdata = mdata.slice(1);
    mdata[samples - 1] = v;
    mc += 1;
    if (mc == samples) {
        mc = 0;
        fft = new FFT(mdata.length,60);
        fft.forward(mdata);
        freqs = [].slice.call(fft.spectrum);
        freqs[0] = 0;
        mfreq = freqs.indexOf(Math.max(...freqs)) * (60 / 2 / (samples / 2));
        mfreq = mfreq + (30 / samples);
        console.log(mdata);
        fdata = fdata.slice(1);
        fdata[15] = mfreq;
        avg = fdata.reduce((a,c)=>{
            if (c !== 0) {
                a.count++;
                a.sum += c;
                a.avg = a.sum / a.count;
            }
            return a;
        }
        , {
            count: 0,
            sum: 0,
            avg: 0
        }).avg;
        //        avg=fdata.reduce((a, b) => a + b) / fdata.reduce((a,b)=>a+=b!=0);
        //console.log("average:",Math.round(avg*100)/100);
        txt.innerText = "AVG Frequency: " + Math.round(avg * 100) / 100 + " Hz.";
        txt.innerText += "\nRT Frequency: " + Math.round(mfreq * 100) / 100 + " Hz.";
        bpms=adata.slice(152).map((a,b,c)=>(a>0)?c[b]**4 * c[b-1]**3 :-20).map((a,b,c)=>a>Math.max(...c.slice(2))/20).map((a,b,c)=>(b>10) && c.slice(b-10,b).indexOf(a)==-1 ).reduce((a,c)=>{
            if (c == 0) {
                a.count++;
            } else {
                if (a.count > a.max) a.max=a.count;
                a.p.push(a.count);
                a.count=0;
            }
            return a;
        }
        , {count: 0, max:0, p: []}).p.map(a=>Math.round(36000/a)/10).slice(1);
        if (typeof bpms[0]=='undefined') {bpms[0]=lbpm}else lbpm=bpms[0];

        txt.innerText += "\nBPM: "+lbpm;
    }

    //v=avg;
    v=10*v/Math.max(...mdata.slice(392));
    ctx.drawImage(canvas, -1, 0);
    ctx.fillRect(graphX, 0, 1, canvas.height);
    var size = Math.max(-gh, Math.min((3 * (v)) * d, gh));
    ctx.beginPath();
    ctx.moveTo(graphX - 0.5, gh2 + ls / 2);
    ctx.lineTo(graphX + 0.5, gh2 + size / 2);
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
sdata=[4.4,1.3,-3.5999999999999996,-7.000000000000001,-5.3,-0.7000000000000002,2.8000000000000003,3.5,2.3,0.6000000000000001,-1.1999999999999997,-2.1,-0.6000000000000002,2.4,3.7,1.8000000000000003,-1.2999999999999998,-3.4,-4.000000000000001,-3.1,-1.2,1.2,3,3.5,2.7,1.2,0,-1,-1.3,-1.2,-0.7000000000000001,-0.30000000000000004,0.7,2.1,2.6,1.9000000000000001,0.6,-1.1,-2.3000000000000003,-2.9000000000000004,-1.8,0.30000000000000016,2.4,3.6999999999999997,3.6,0.7,-4.1,-6.6000000000000005,-3.8999999999999995,2.4,6.5,6.7,4.800000000000001,2.3,-0.3,-2.2,-2.6,-0.9,1.4000000000000004,0.4000000000000001,-1.7999999999999998,-3.3000000000000007,-3.0000000000000004,-1.9000000000000001,-0.20000000000000004,2.0000000000000004,3.0999999999999996,2.5999999999999996,1,-0.30000000000000004,-1.2000000000000002,-1.5999999999999999,-1.2999999999999998,-0.7000000000000001,-0.1,0.6000000000000002,1.0999999999999999,1.5999999999999999,2.3000000000000003,2.4,1.6,-0.30000000000000004,-2.4,-2.4,-1.6,-0.20000000000000004,0.9000000000000001,2.8000000000000007,3.3000000000000003,0.4,-4.2,-6.1000000000000005,-2.8999999999999995,3.0000000000000004,7.000000000000001,7.4,5.3999999999999995,2.5,-0.6000000000000001,-2.5,-2.9000000000000004,-1.2,1,0.5,-2.2,-4.300000000000001,-4.7,-3.6,-1.1,1.9000000000000004,4.1000000000000005,4.1,2.5,0.6,-0.8000000000000002,-1.8,-2.0000000000000004,-1.6,-1,0.20000000000000004,1.4000000000000001,2.4000000000000004,3.3,2.9000000000000004,0.9,-1.4,-2.6999999999999997,-3,-1.5,0.4999999999999999,2.4,4.500000000000001,4,-0.7000000000000002,-6.1000000000000005,-7.3999999999999995,-2.8,4,8,7.600000000000001,4.8999999999999995,1.7,-0.8,-2.8000000000000007,-3.1999999999999997,-0.9000000000000001,1.1,0.2,-2.8,-4.3,-4,-2.5,1.3877787807814457e-16,2.6,3.4999999999999996,3,3,-0.10000000000000009,-1.7,-2.2,-2.1,-1.3000000000000003,-0.4,0.9000000000000001,2.4000000000000004,3.5,3.3,2,-0.3999999999999999,-2.5000000000000004,-3.3,-2.5000000000000004,-0.20000000000000004,2,4.1,5.1000000000000005,1.5,-4.400000000000001,-7.7,-4.9,2,7.699999999999999,8.5,6.200000000000001,2.9999999999999996,0,-2.2,-3.2,-1.9000000000000001,1,1,-1.6,-4.4,-5.2,-4.1,-1.7000000000000002,-1.7000000000000002,3.6,4.1000000000000005,3.1,1.1,-0.8999999999999999,-2.4,-2.6999999999999997,-2.2,-1.0000000000000002,0.6,2.1999999999999997,3.4000000000000004,3.400000000000001,2.3,0.29999999999999993,-1.8,-3.2,-3.5,-1.9000000000000001,0.29999999999999993,2.9000000000000004,5.7,4.6,-1.2,-7.2,-7.800000000000001,-2.5,4.9,8.4,7.800000000000001,4.5,1.4000000000000001,-1.2,-2.7,-2.4000000000000004,-0.5999999999999999,1.1,0.2,-3.3000000000000003,-5.7,-5.3,-3.1,0,3,4.4,3.8,1.6000000000000003,-0.7,-2.5999999999999996,-3.6000000000000005,-3.6,-3.6,-1.1,0.39999999999999997,2.2,3.8,4.300000000000001,3.1000000000000005,0.6000000000000001,-1.9999999999999996,-3.8,-3.5,-1.2999999999999998,1.2,3.6000000000000005,5.300000000000001,3.5,-2.4,-7.300000000000001,-6.900000000000001,-0.4,6.800000000000001,10,8.500000000000002,4.8,0.8000000000000002,-2.0000000000000004,-3.3000000000000003,-3.0000000000000004,-1.1,0.7,-8.326672684688674e-17,-3.1,-5.300000000000001,-5.100000000000001,-3.0999999999999996,0.19999999999999987,2.9,4.2,3.8999999999999995,2.3,0.5000000000000001,-1.1,-2,-2.3000000000000003,-1.8,-0.7000000000000001,0.40000000000000013,1.1,1.7999999999999998,2.5,2.8000000000000003,1.9000000000000001,-0.4,-2.1999999999999997,-3.0000000000000004,-2.3000000000000003,-0.4000000000000001,1.6,4,5,1.6,-4.5,-8.000000000000002,-4.8999999999999995,2.2000000000000006,8,8.700000000000001,6.1000000000000005,2.5,-0.4,-2.3000000000000003,-3.3000000000000003,-3.0999999999999996,-1.2,0.2999999999999999,-0.8999999999999999,-3.5000000000000004,-4.8,-3.6999999999999997,-1.5000000000000002,0.7999999999999999,2.3000000000000003,2.8000000000000003,2.2,1.2999999999999998,0.6000000000000001,-0.3,-1.4000000000000001,-2.1,-1.7,-0.7,0.6000000000000001,2,3.1,3.6,2.6,0.6,-1.7,-3.4,-3.900000000000001,-2.0999999999999996,0.6000000000000001,3.4,5.9,4.8,-1.0999999999999999,-6.6000000000000005,-7.300000000000001,-1.8,5.2,8.8,8.2,5,1.4000000000000001,-1.4000000000000001,-3.2,-3.3,-1.3,0.7,-1.6653345369377348e-16,-3.6000000000000005,-6.200000000000001,-5.6,-3.1,0.10000000000000009,2.8000000000000007,4.200000000000001,3.7,2.1,-0.10000000000000009,-2,-2.9,-2.5999999999999996,-1.4000000000000001,0.30000000000000004,1.5,1.9000000000000001,1.8999999999999997,2.1,2.2,1.5000000000000004,-0.09999999999999998,-1.9,-3.1,-2.8000000000000003,-0.8,1.6,4,6.3,3.6999999999999997,3.6999999999999997,-8.100000000000001,-7,-0.4000000000000001,6.5,9.200000000000001,7.8,4.2,0.8,-1.6,-3.1,-3.0000000000000004,-1,1.3,-0.10000000000000003,-3.8,-6.200000000000001,-5.6,-3,0.30000000000000016,3.1999999999999997,4.5,4.2,2.4,0.30000000000000004,-2.0000000000000004,-3.1,-3.1,-3.1,-0.6000000000000001,0.6,1.4000000000000001,1.9,2.2,2.5000000000000004,2.6,1.8,-0.1,-2.1,-3.4000000000000004,-2.9,-1.1,1.1,3.8000000000000003,5.7,2.5000000000000004,-3.8000000000000007,-7.700000000000001,-5.3999999999999995,1.2000000000000002,7.6,9.200000000000001,7,3.3,0.10000000000000003,-2.0999999999999996,-3.1999999999999997,-2.9000000000000004,-0.8000000000000003,1.2000000000000002,0.09999999999999992,-3.7000000000000006,-6.500000000000001,-5.8,-3.3000000000000003,0.2000000000000001,2.8,3.9,3.6000000000000005,2.5999999999999996,0.7999999999999999,-1.0999999999999999,-2,-2.2,-1.5,-0.4,0.2,0.7,1.3,2.1,3,2.9,0.8000000000000002,-1.9000000000000001,-3.5999999999999996,-3.5,-1.6000000000000003,1,3.6000000000000005,6.100000000000001,5.2,-0.8,-7.2,-8.7,-3.5,4.1000000000000005,9.200000000000001,9.200000000000003,6.3,2.5,-0.39999999999999997,-2.9,-4.000000000000001,-2.6999999999999997,-0.30000000000000004,0.30000000000000004,-2.6,-5.800000000000001,-6.3,-3.9000000000000004,-0.5000000000000001,2.5,3.9000000000000004,4];
sdl=sdata.length;

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
				var xx = 0;
				z = setInterval(() => {
					updateFancyGraphs({
						"rotationRate": {
							"alpha": sdata[xx%sdl],
							"beta": 0,
							"gamma": (xx++) & 0
						}
					});
				}, 1000 / 60)
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
