"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

let vertGlsl = `
attribute vec3 a_position;
attribute vec3 a_color;
uniform float u_angle;
varying vec3 v_color;

mat2 rotate(float a) {
  return mat2(
    cos(a), -sin(a),
    sin(a), cos(a)
  );
}

void main() {
  vec3 p = a_position;
  p -= 0.5;
  p.y *= -1.0;
  p.zx *= rotate(u_angle);
  p.zy *= rotate(u_angle / 3.0);
  gl_Position = vec4(p.xy / (1.0 + p.z / 2.0), p.z, 1.0);
  v_color = a_color;
}
`;

let fragGlsl = `
precision mediump float;
varying vec3 v_color;

void main() {
  gl_FragColor = vec4(v_color, 1.0);
}
`;

let positions = Float32Array.of(
  // Front face
  0, 0, 0, 0, 1, 0, 1, 0, 0,
  1, 0, 0, 0, 1, 0, 1, 1, 0,
  // Top face
  0, 0, 0, 1, 0, 0, 0, 0, 1,
  0, 0, 1, 1, 0, 0, 1, 0, 1,
  // Left face
  0, 0, 0, 0, 0, 1, 0, 1, 0,
  0, 1, 0, 0, 0, 1, 0, 1, 1,
  // Right face
  1, 0, 0, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 0, 1, 1, 1,
  // Back face
  0, 0, 1, 1, 0, 1, 0, 1, 1,
  0, 1, 1, 1, 0, 1, 1, 1, 1,
  // Bottom face
  0, 1, 0, 0, 1, 1, 1, 1, 0,
  1, 1, 0, 0, 1, 1, 1, 1, 1
);

let colors = Float32Array.of(
  // Front face
  1, 0, 0, 1, 0, 0, 1, 0, 0,
  1, 0, 0, 1, 0, 0, 1, 0, 0,
  // Top face
  0, 1, 0, 0, 1, 0, 0, 1, 0,
  0, 1, 0, 0, 1, 0, 0, 1, 0,
  // Left face
  0, 0, 1, 0, 0, 1, 0, 0, 1,
  0, 0, 1, 0, 0, 1, 0, 0, 1,
  // Right face
  1, 1, 0, 1, 1, 0, 1, 1, 0,
  1, 1, 0, 1, 1, 0, 1, 1, 0,
  // Back face
  0, 1, 1, 0, 1, 1, 0, 1, 1,
  0, 1, 1, 0, 1, 1, 0, 1, 1,
  // Bottom face
  1, 0, 1, 1, 0, 1, 1, 0, 1,
  1, 0, 1, 1, 0, 1, 1, 0, 1
);

let degAngle = 0;

gl.enable(gl.CULL_FACE);
gl.clearColor(0, 0, 0, 0);

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
let colorBuffer = gl.createBuffer();
let positionAttribLocation = gl.getAttribLocation(program, "a_position");
let colorAttribLocation = gl.getAttribLocation(program, "a_color");
let angleUniformLocation = gl.getUniformLocation(program, "u_angle");

gl.enableVertexAttribArray(positionAttribLocation);
gl.enableVertexAttribArray(colorAttribLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
gl.vertexAttribPointer(positionAttribLocation, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 0, 0);

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
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  requestAnimationFrame(drawScene);
}
