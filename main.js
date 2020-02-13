"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

let vertGlsl = `
attribute vec3 a_position;
attribute vec3 a_color;
uniform mat3 u_rotation;
varying vec3 v_color;

void main() {
  vec3 p = a_position;
  p -= 0.5;
  p.y *= -1.0;
  p.xyz = u_rotation * p.xyz;
  gl_Position = vec4(p.xy, p.z + 0.5, (1.0 + p.z / 2.0));
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
let rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");

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
  const r = degAngle++ / 180 * Math.PI;
  const s1 = Math.sin(r);
  const c1 = Math.cos(r);
  const s2 = Math.sin(r / 3);
  const c2 = Math.cos(r / 3);

  const m1 = [
    c1, 0, s1,
    0, 1, 0,
    -s1, 0, c1
  ];

  const m2 = [
    1, 0, 0,
    0, c2, -s2,
    0, s2, c2
  ];

  gl.uniformMatrix3fv(rotationUniformLocation, false, mat3Dot(m2, m1));

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  requestAnimationFrame(drawScene);
}

function mat3Dot(m1, m2) {
  return [
    // First column
    m1[0] * m2[0] + m1[3] * m2[1] + m1[6] * m2[2],
    m1[1] * m2[0] + m1[4] * m2[1] + m1[7] * m2[2],
    m1[2] * m2[0] + m1[5] * m2[1] + m1[8] * m2[2],

    // Second column
    m1[0] * m2[3] + m1[3] * m2[4] + m1[6] * m2[5],
    m1[1] * m2[3] + m1[4] * m2[4] + m1[7] * m2[5],
    m1[2] * m2[3] + m1[5] * m2[4] + m1[8] * m2[5],

    // Third column
    m1[0] * m2[6] + m1[3] * m2[7] + m1[6] * m2[8],
    m1[1] * m2[6] + m1[4] * m2[7] + m1[7] * m2[8],
    m1[2] * m2[6] + m1[5] * m2[7] + m1[8] * m2[8]
  ];
}