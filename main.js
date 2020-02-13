"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

let vertGlsl = `
attribute vec3 a_position;
attribute vec3 a_color;
uniform mat4 u_matrix;
varying vec3 v_color;

void main() {
  vec4 p = vec4(a_position, 1.0);
  p.xyz -= 0.5;
  p.y *= -1.0;
  p = u_matrix * p;
  p.z += 0.5;
  gl_Position = p;
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
let matrixUniformLocation = gl.getUniformLocation(program, "u_matrix");

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

  const xzRotMat = [
    c1, 0, s1, 0,
    0, 1, 0, 0,
    -s1, 0, c1, 0,
    0, 0, 0, 1
  ];

  const yzRotMat = [
    1, 0, 0, 0,
    0, c2, -s2, 0,
    0, s2, c2, 0,
    0, 0, 0, 1
  ];

  const fudgeMat = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0.5,
    0, 0, 0, 1
  ];

  gl.uniformMatrix4fv(matrixUniformLocation, false, [xzRotMat, yzRotMat, fudgeMat].reduceRight(mat4Dot));

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  requestAnimationFrame(drawScene);
}

function mat4Dot(m1, m2) {
  return [
    // First column
    m1[0x0] * m2[0x0] + m1[0x4] * m2[0x1] + m1[0x8] * m2[0x2] + m1[0xC] * m2[0x3],
    m1[0x1] * m2[0x0] + m1[0x5] * m2[0x1] + m1[0x9] * m2[0x2] + m1[0xD] * m2[0x3],
    m1[0x2] * m2[0x0] + m1[0x6] * m2[0x1] + m1[0xA] * m2[0x2] + m1[0xE] * m2[0x3],
    m1[0x3] * m2[0x0] + m1[0x7] * m2[0x1] + m1[0xB] * m2[0x2] + m1[0xF] * m2[0x3],

    // Second column
    m1[0x0] * m2[0x4] + m1[0x4] * m2[0x5] + m1[0x8] * m2[0x6] + m1[0xC] * m2[0x7],
    m1[0x1] * m2[0x4] + m1[0x5] * m2[0x5] + m1[0x9] * m2[0x6] + m1[0xD] * m2[0x7],
    m1[0x2] * m2[0x4] + m1[0x6] * m2[0x5] + m1[0xA] * m2[0x6] + m1[0xE] * m2[0x7],
    m1[0x3] * m2[0x4] + m1[0x7] * m2[0x5] + m1[0xB] * m2[0x6] + m1[0xF] * m2[0x7],

    // Third column
    m1[0x0] * m2[0x8] + m1[0x4] * m2[0x9] + m1[0x8] * m2[0xA] + m1[0xC] * m2[0xB],
    m1[0x1] * m2[0x8] + m1[0x5] * m2[0x9] + m1[0x9] * m2[0xA] + m1[0xD] * m2[0xB],
    m1[0x2] * m2[0x8] + m1[0x6] * m2[0x9] + m1[0xA] * m2[0xA] + m1[0xE] * m2[0xB],
    m1[0x3] * m2[0x8] + m1[0x7] * m2[0x9] + m1[0xB] * m2[0xA] + m1[0xF] * m2[0xB],

    // Fourth column
    m1[0x0] * m2[0xC] + m1[0x4] * m2[0xD] + m1[0x8] * m2[0xE] + m1[0xC] * m2[0xF],
    m1[0x1] * m2[0xC] + m1[0x5] * m2[0xD] + m1[0x9] * m2[0xE] + m1[0xD] * m2[0xF],
    m1[0x2] * m2[0xC] + m1[0x6] * m2[0xD] + m1[0xA] * m2[0xE] + m1[0xE] * m2[0xF],
    m1[0x3] * m2[0xC] + m1[0x7] * m2[0xD] + m1[0xB] * m2[0xE] + m1[0xF] * m2[0xF]
  ];
}