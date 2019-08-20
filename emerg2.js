<html>
<head>
    <script type="text/javascript" src="/quiet.js"></script>
    <script async type="text/javascript" src="/quiet-emscripten.js"></script>
    <script>
var TextTransmitter = (function() {
    Quiet.init({
        profilesPrefix: "/",
        memoryInitializerPrefix: "/",
        libfecPrefix: "/"
    });
    function onTransmitFinish() {
			console.log("End transmission.");
    };
    function onQuietReady() {
        transmit = Quiet.transmitter({profile: 'audible', onFinish: onTransmitFinish});
    };
    function onDOMLoad() {
        Quiet.addReadyCallback(onQuietReady, onQuietFail);
    };

    document.addEventListener("DOMContentLoaded", onDOMLoad);
})();
</script>
<style>
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #222;
  max-width: 40rem;
  padding: 2rem;
  margin: auto;
  background: #fafafa;
}
img {
  max-width: 100%;
}
a {
  color: #2ECC40;
}
h1, h2, strong {
  color: #111;
}
</style>
  <script>

var options = {
  enableHighAccuracy: true,
  timeout: 60000,
  maximumAge: 0
};

function success(pos) {
  var crd = pos.coords;
  var lat = crd.latitude;
  var lng = crd.longitude;
  var acc = crd.accuracy;
  console.log('Your current position is:');
  console.log(`Latitude : ${crd.latitude}`);
  console.log(`Longitude: ${crd.longitude}`);
  console.log(`More or less ${crd.accuracy} meters.`);
  //document.getElementById('pos').innerText=JSON.stringify({lat,lng,acc});
  butt=document.createElement("button");
  butt.innerText="Send position";
  butt.id="pos";
  butt.onclick=()=>{
 //   sender=new DTMF.Sender({ duration: 150, pause: 20 });
 //   sender.play(lat.toString().replace(".","*")+"#"+lng.toString().replace(".","*")+"#"+Math.floor(acc)+"#")
      transmit.transmit(Quiet.str2ab([lat,lng,acc].join(",")));
 };
document.getElementById('pos').replaceWith(butt);
}

function error(err) {
  console.warn(`ERROR(${err.code}): ${err.message}`);
  document.getElementById('pos').innerText=err.message;
}

  </script>
</head>
<body>
  <h1><a href='tel:*100*4*1*2%23'>Change to english</a></h1>
  <h1><a href='tel:*100*4*1*1%23'>Change to arabic</a></h1>
  <h1><a href='tel:*200*6%23'>Check balance</a></h1>
  <pre id=pos></pre>
  <script>
    navigator.geolocation.getCurrentPosition(success, error, options);
  </script>
</body>
</html>
