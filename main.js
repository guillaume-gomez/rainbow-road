let canvas, context, width, height, updateRef, points, offset, spacing;
const colors = ["#c90000", "#f70000", "#ff3d00", "#ff8600", "#ffc400", "#4ddb73", "#00aa9f", "#006bc5", "#6004db", "#6804b2", "#9204a1", "#c8009b", "#ff289e"];
const colorsVariant = ["#e00000", "#ff1600", "#ff5400", "#ffa100", "#ffdd00", "#52ec52", "#00c29f", "#007fdb", "#6804ef", "#7500bc", "#a600a2", "#e4009f", "#ff289e"];


// sounds arguments
let pinch = 150;
let audioContext;
let source;
let analyser;
let bufferLength;
let dataArray;
let audioLength;


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
  init();
}

function init() {
  canvas = document.getElementById('canvas')
  canvas.width = width = window.innerWidth
  canvas.height = height = window.innerHeight;
  context = canvas.getContext('2d')
  context.translate(width / 2, height / 2)
  spacing = (80 * width) / 1920;
  points = Array(60).fill(0).map(_ => Array(colors.length + 1).fill(0))
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < points[0].length; j++) {
      const dist = Math.abs(j - points[0].length / 2)
      points[i][j] = {
        x: 4 + j * spacing,
        y: -(dist*dist) + pinch,
        z: -i * 10
      }
    }
  }
  offset = points[0].length * spacing / 2;
  update(0)
}



function update(time) {
  if(analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
  }


  for (let i = 0; i < points.length; i++) {
    let gone = false
    for (let j = 0; j < points[0].length; j++) {
      points[i][j].z -= 0.5
      if (points[i][j].z < -300) {
        gone = true
      }
    }
    if (gone) {
      let arr = points.pop();
      for(let k = 0; k < arr.length; k++) {
        const dist = Math.abs(k - arr.length / 2) * 1.2;
        const hauteur = dataArray ? avgByPosition(k, dataArray) + pinch : Math.random() * -(dist*dist) + pinch;
        //console.log(hauteur)
        arr[k].z = 0;
        arr[k].y =  hauteur;
      }
      points.unshift( arr )
    }
  }
  show()
  updateRef = requestAnimationFrame(update)
}

function show() {
  context.clearRect(-width / 2, -height / 2, width, height)
  for (let i = 0; i < points.length - 1; i++) {
    for (let j = 0; j < points[0].length - 1; j++) {
      const size = 300 / (300 + points[i][j].z)
      const nextSize = 300 / (300 + points[i+1][j].z)
      context.beginPath()
      context.moveTo((points[i][j].x - offset) * size, points[i][j].y * size)
      context.lineTo((points[i][j+1].x - offset) * size, points[i][j+1].y * size)
      context.lineTo((points[i+1][j+1].x - offset) * nextSize, points[i+1][j+1].y * nextSize)
      context.lineTo((points[i+1][j].x - offset) * nextSize, points[i+1][j].y * nextSize)
      context.closePath()
      const color = 300 + points[i][j].z
      context.fillStyle = colors[j];
      context.strokeStyle = colorsVariant[j];
      context.fill()
      context.stroke()
    } 
  }
}

window.onload = onLoad;
window.onresize = init;


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

function avgByPosition(index, arrayBuffer) {
  const slice = arrayBuffer.slice(index * audioLength, (index + 1) * audioLength);
  const sum = slice.reduce((previousValue, currentValue) => previousValue + currentValue, 0);
  if(sum === 0) {
    return 0
  }

  return sum / slice.length;
}