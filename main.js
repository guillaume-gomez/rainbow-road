let canvas, context, width, height, updateRef, points, offset, spacing;
const colors = ["#c90000", "#f70000", "#ff3d00", "#ff8600", "#ffc400", "#4ddb73", "#00aa9f", "#006bc5", "#6004db", "#6804b2", "#9204a1", "#c8009b", "#ff289e"];
const colorsVariant = ["#e00000", "#ff1600", "#ff5400", "#ffa100", "#ffdd00", "#52ec52", "#00c29f", "#007fdb", "#6804ef", "#7500bc", "#a600a2", "#e4009f", "#ff289e"];


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
        y: -(dist*dist) + 50, 
        z: -i * 10
      }
    }
  }
  offset = points[0].length * spacing / 2;
  update(0)
}

function update(time) {
  for (let i = 0; i < points.length; i++) {
    let gone = false
    for (let j = 0; j < points[0].length; j++) {
      points[i][j].z -= 0.5
      if (points[i][j].z < -300) {
        gone = true
      }
    }
    if (gone) {
     let arr = points.pop()
     for(let k = 0; k < arr.length; k++) {
      const dist = Math.abs(k - arr.length / 2)
      arr[k].z = 0
      arr[k].y = Math.random() * -(dist*dist) + 50;
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

window.onload = init;
window.onresize = init;