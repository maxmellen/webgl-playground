"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

canvas.width = 256;
canvas.height = 256;
canvas.style.width = `${canvas.width}px`;
canvas.style.height = `${canvas.height}px`;

if (window.devicePixelRatio) {
  canvas.width *= window.devicePixelRatio;
  canvas.height *= window.devicePixelRatio;
}

let texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

let fb = gl.createFramebuffer();
gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

gl.viewport(0, 0, 32, 32);

let vertGlsl = `
attribute vec2 a_position;
attribute vec3 a_color;
varying vec3 v_color;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
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
  -0.5, -0.5,
  0.5, -0.5,
  -0.5, 0.5
);

let colors = Float32Array.of(
  0, 1, 1,
  1, 0, 1,
  1, 1, 0
);

gl.clearColor(0, 0, 0, 0);

let program = compileProgram(gl, vertGlsl, fragGlsl);

gl.useProgram(program);

let vertexBuffer = gl.createBuffer();
let colorBuffer = gl.createBuffer();
let positionAttribLocation = gl.getAttribLocation(program, "a_position");
let colorAttribLocation = gl.getAttribLocation(program, "a_color");

gl.enableVertexAttribArray(positionAttribLocation);
gl.enableVertexAttribArray(colorAttribLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.vertexAttribPointer(colorAttribLocation, 3, gl.FLOAT, false, 0, 0);

gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);

gl.bindFramebuffer(gl.FRAMEBUFFER, null);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

let screenPositions = Float32Array.of(
  -1, 1,
  -1, -1,
  1, 1,
  1, 1,
  -1, -1,
  1, -1
);

let screenTexCoords = Float32Array.of(
  0, 1,
  0, 0,
  1, 1,
  1, 1,
  0, 0,
  1, 0
);

let screenProgram = compileProgram(gl, `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`, `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
`);

gl.useProgram(screenProgram);

let screenVertexBuffer = gl.createBuffer();
let screenTexCoordBuffer = gl.createBuffer();
let screenPositionAttribLocation = gl.getAttribLocation(screenProgram, "a_position");
let screenTexCoordAttribLocation = gl.getAttribLocation(screenProgram, "a_texcoord");
let screenTextureUniformLocation = gl.getUniformLocation(screenProgram, "u_texture");

gl.enableVertexAttribArray(screenPositionAttribLocation);
gl.enableVertexAttribArray(screenTexCoordAttribLocation);

gl.bindBuffer(gl.ARRAY_BUFFER, screenVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, screenPositions, gl.STATIC_DRAW);
gl.vertexAttribPointer(screenPositionAttribLocation, 2, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, screenTexCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, screenTexCoords, gl.STATIC_DRAW);
gl.vertexAttribPointer(screenTexCoordAttribLocation, 2, gl.FLOAT, false, 0, 0);

gl.uniform1i(screenTextureUniformLocation, 0);

gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 6);

function compileProgram(gl, vertGlsl, fragGlsl) {
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

  return program;
}

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
