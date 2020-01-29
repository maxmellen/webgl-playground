"use strict";

const VERT_GLSL = `
  attribute vec4 a_position;
  uniform float u_angle;

  mat2 rotate2D(float a) {
    return mat2(
      cos(a), -sin(a),
      sin(a), cos(a)
    );
  }

  void main() {
    gl_Position = a_position;
    gl_Position.xy *= rotate2D(u_angle);
    gl_Position.y *= -1.0;
    gl_Position.xy /= 4.0;
  }
`

const FRAG_GLSL = `
  precision mediump float;

  void main() {
    gl_FragColor = vec4(1, 0, 0.5, 1);
  }
`

let positions = Float32Array.of(
  0, 0,
  3, 0,
  0, 1,
  0, 1,
  3, 0,
  3, 1,
  0, 1,
  1, 1,
  0, 4,
  0, 4,
  1, 1,
  1, 4,
  1, 2,
  2, 2,
  1, 3,
  1, 3,
  2, 2,
  2, 3
);

let degA = 0;

function createShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Could not compile WebGL shader: ${info}`);
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  let program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    let info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Could not compile WebGL program: ${info}`);
  }

  return program;
}

function drawScene() {
  gl.uniform1f(uAngleLocation, degA++ * Math.PI / 180)

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 18);

  requestAnimationFrame(drawScene);
}

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

let vertexShader = createShader(gl, gl.VERTEX_SHADER, VERT_GLSL);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG_GLSL);
let program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

let aPositionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(aPositionLocation);
gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

let uAngleLocation = gl.getUniformLocation(program, "u_angle");

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);

requestAnimationFrame(drawScene);
