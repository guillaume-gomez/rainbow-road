// main canvas
let canvas;
let context;
let width;
let height;
let updateRef;
let points;
let offset;
let spacing;
let nbPointsByColor = 3;
let elapsedTime = 0;
let speed = 0.5;

const colors = ["#c90000", "#f70000", "#ff3d00", "#ff8600", "#ffc400", "#4ddb73", "#00aa9f", "#006bc5", "#6004db", "#6804b2", "#9204a1", "#c8009b", "#ff289e"];
const colorsVariant = ["#e00000", "#ff1600", "#ff5400", "#ffa100", "#ffdd00", "#52ec52", "#00c29f", "#007fdb", "#6804ef", "#7500bc", "#a600a2", "#e4009f", "#ff289e"];

// sounds arguments
let pinch = 125;
let audioContext;
let source;
let analyser;
let bufferLength;
let dataArray;
let audioLength;

// histogram canvas
let histogramCanvas;
let histogramContext;


function onLoad() {
  const button = document.getElementById("enable-mic");
  if(button) {
    button.addEventListener("click", (event) => {
      const { status } = event.target.dataset;
      if(status === "disable") {
        getLocalStream();
        event.target.innerText = "Disable microphone";
        event.target.dataset.status = "enable";
      } else {
        dataArray = null;
        audioContext = null;
        analyser = null;
        event.target.innerText = "Enable microphone";
        event.target.dataset.status = "disable";
      }
    });
  }

  const range = document.getElementById("speed");
  if(range) {
    range.addEventListener("change", (event) => {
      speed = parseFloat(event.target.value);
    });
  }

  init();

  //debug
  //histogramCanvas = document.getElementById("histogram");
  //histogramContext = histogramCanvas.getContext('2d');
  //drawHistogram();

}

function init() {
  canvas = document.getElementById('canvas')
  canvas.width = width = window.innerWidth
  canvas.height = height = window.innerHeight;
  context = canvas.getContext('2d')
  context.translate(width / 2, height / 2)
  spacing = (40 * width) / 1920;
  points = Array(60).fill(0).map(_ => Array((colors.length + 1) * nbPointsByColor ).fill(0))
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points[0].length; j++) {
      const dist = Math.abs(j - points[0].length / 2) / nbPointsByColor;
      points[i][j] = {
        x: 4 + j * spacing,
        y: -(dist*dist) + pinch,
        z: -i * 10
      }
    }
  }
  offset = points[0].length * spacing / 2;
  // on resize. init is call
  if(updateRef) {
    window.cancelAnimationFrame(updateRef);
  }
  update(0)
}



function update(time) {
  updateRef = requestAnimationFrame(update);
  
  elapsedTime = time - elapsedTime;
  if(analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
  }


  for (let i = 0; i < points.length; i++) {
    let gone = false
    for (let j = 0; j < points[0].length; j++) {
      points[i][j].z -= speed;
      if (points[i][j].z < -300) {
        gone = true
      }
    }
    if (gone) {
      //console.log(dataArray)
      let arr = points.pop();
      for(let k = 0; k < arr.length; k++) {
        const dist = Math.abs(k - arr.length / 2) / nbPointsByColor;
        const hauteur = dataArray ? -(dataArray[k] /1.5) + pinch : Math.random() * -(dist*dist) + pinch;
        //console.log(hauteur)
        arr[k].y = hauteur;
        arr[k].z = 0;
      }
      points.unshift( arr )
    }
  }
  show()
}

function show() {
  context.clearRect(-width / 2, -height / 2, width, height)
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < points[0].length - 1; j++) {
      const size = 300 / (300 + points[i][j].z);
      const nextSize = 300 / (300 + points[i+1][j].z);
      context.beginPath();
      context.moveTo((points[i][j].x - offset) * size, points[i][j].y * size);
      context.lineTo((points[i][j+1].x - offset) * size, points[i][j+1].y * size);
      context.lineTo((points[i+1][j+1].x - offset) * nextSize, points[i+1][j+1].y * nextSize);
      context.lineTo((points[i+1][j].x - offset) * nextSize, points[i+1][j].y * nextSize);
      context.closePath();
      const color = 300 + points[i][j].z;
      context.fillStyle = colorByPoints(colors, j);
      context.strokeStyle = colorByPoints(colorsVariant, j);
      context.fill();
      context.stroke();
    } 
  }
}



function getLocalStream() {
    navigator.mediaDevices.getUserMedia({video: false, audio: true}).then( stream => {
      window.localStream = stream;

      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      //analyser.connect(audioContext.destination);

      analyser.fftSize = 256;
      bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);
      audioLength = Math.floor(dataArray.length/points[0].length);

    }).catch( err => {
        console.log("u got an error:" + err)
    });
}

function colorByPoints(arrayOfColor, index) {
  return arrayOfColor[index / nbPointsByColor];
}


/*function drawHistogram() {
  draw = requestAnimationFrame(drawHistogram);
  histogramContext.fillStyle = 'rgb(0, 0, 0)';
  histogramContext.fillRect(0, 0, histogramCanvas.width, histogramCanvas.height);

  if(!analyser || !dataArray) {
    return;
  }
  analyser.getByteFrequencyData(dataArray);

  const barWidth = (histogramCanvas.width / dataArray.length) * 4;
  let barHeight;
  let x = 0;
  for(let i = 0; i < dataArray.length; i++) {
    barHeight = dataArray[i];

    histogramContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
    histogramContext.fillRect(x, histogramCanvas.height - barHeight/2, barWidth, barHeight);

    x += barWidth + 1;
  }
}*/


window.onload = onLoad;
window.onresize = init;
window.addEventListener('dblclick', () =>
{
    if(!canvas) {
        return;
    }

    if(!document.fullscreenElement)
    {
        if(canvas.requestFullscreen)
        {
            canvas.requestFullscreen()
        }
    }
    else
    {
        if(document.exitFullscreen)
        {
            document.exitFullscreen()
        }
        
    }
});