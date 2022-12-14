function requestDeviceMotion(callback) {
  if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
    DeviceMotionEvent.requestPermission().then(
      function (state) {
        if (state == "granted") {
          callback(null);
        } else callback(new Error("Permission denied by user"));
      },
      function (err) {
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
//            ctx.fillStyle = "#000000";
//            ctx.fillRect(0, 0, canvas.width, canvas.height);
//var graphX = window.innerWidth-1;
function updateFancyGraphs(e) {

  var rot = e.rotationRate;
	var acc = e.acceleration || e.accelerationIncludingGravity;

  var gh = canvas.height;
  var gh2 = gh/2;
  function drawGraph(val, color) {
    if (val == null) val = 0;
    var size = Math.max(-gh, Math.min(val * 10, gh));
    ctx.strokeStyle = color;
    ctx.strokeRect(graphX,  gh2, 1, size/2);
  }

  ctx.drawImage(canvas, -1, 0);
  ctx.strokeStyle = "black";
//  ctx.fillRect(graphX, 0, 2, canvas.height);
  ctx.strokeRect(graphX, 0, 2, canvas.height);

  var a=rot.alpha,b=rot.beta,c=rot.gamma;
  drawGraph(3*(a+b+c), "blue"); 
  
//  drawGraph(acc.z*2, 3, "blue");
//  drawGraph(acc.x*2, 4, "lime");
//  drawGraph(acc.y*2, 5, "aqua");
//  graphX = (graphX + 1) % canvas.width;
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
  canvas.requestFullscreen()

const requestWakeLock = async () => {
  try {

    const wakeLock = await navigator.wakeLock.request('screen');
    setTimeout(()=>window.screen.orientation.lock("landscape"),50)

  } catch (err) {
    // The wake lock request fails - usually system-related, such as low battery.
    console.log(`${err.name}, ${err.message}`);
  }
}

requestWakeLock();
  
}

function firstClick(e) {
  var status = document.getElementById("dm_status");
  if (e) status.innerText = "Requesting...";
  requestDeviceMotion(function (err) {
    if (!err) {
      status.innerText = "OK!";
      window.removeEventListener("click", firstClick);
      window.removeEventListener("touchend", firstClick);
      window.addEventListener("devicemotion", updateFancyGraphs);
      el=document.querySelector('#fs');
      el.addEventListener("click", gofs);
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
window.addEventListener("devicemotion", ()=>gofs());
