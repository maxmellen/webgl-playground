"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

let vertGlsl = `
attribute vec2 a_position;
uniform float u_angle;

mat2 rotate(float a) {
  return mat2(
     cos(a), sin(a),
    -sin(a), cos(a)
  );
}

void main() {
  gl_Position = vec4(a_position * rotate(u_angle), 0.0, 1.0);
}
`;

let fragGlsl = `
precision mediump float;

void main() {
  gl_FragColor = vec4(1.0, 0.0, 0.5, 1.0);
}
`;

let positions = Float32Array.of(
  0, 0,
  0, 0.5,
  1, 0
);

let degAngle = 0;

let vertShader = compileShader(gl, gl.VERTEX_SHADER, vertGlsl);
let fragShader = compileShader(gl, gl.FRAGMENT_SHADER, fragGlsl);

let program = gl.createProgram();
gl.attachShader(program, vertShader);
gl.attachShader(program, fragShader);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  let info = gl.getProgramInfoLog(program);
  gl.deleteProgram(program);
  throw new Error(`Could not link program: ${info}`);
}

gl.useProgram(program);

let vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

let positionAttribLocation = gl.getAttribLocation(program, "a_position");
gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);

let angleUniformLocation = gl.getUniformLocation(program, "u_angle");

gl.clearColor(0, 0, 0, 0);

requestAnimationFrame(drawScene);

function compileShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Could not compile shader: ${info}`);
  }

  return shader;
}

function drawScene() {
  gl.uniform1f(angleUniformLocation, degAngle++ / 180 * Math.PI);

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  requestAnimationFrame(drawScene);
}
