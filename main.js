"use strict";

let canvas = document.getElementById("c");
if (!canvas) throw new Error("Could not get canvas.");

let gl = canvas.getContext("webgl");
if (!gl) throw new Error("Could not get WebGL context.");

const VERT_GLSL = `
  attribute vec4 a_position;
  attribute vec2 a_texcoord;
  uniform float u_angle;
  varying vec2 v_texcoord;

  mat2 rotate2D(float a) {
    return mat2(
      cos(a), -sin(a),
      sin(a), cos(a)
    );
  }

  void main() {
    gl_Position = a_position;
    gl_Position.xy *= rotate2D(u_angle);
    gl_Position.xy /= 3.5;
    gl_Position.y *= -1.0;

    v_texcoord = a_texcoord;
  }
`

const FRAG_GLSL = `
  precision mediump float;

  varying vec2 v_texcoord;
  uniform sampler2D u_texture;

  void main() {
    gl_FragColor = texture2D(u_texture, v_texcoord);
  }
`

let vertexShader = createShader(gl, gl.VERTEX_SHADER, VERT_GLSL);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, FRAG_GLSL);
let program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

let positions = Float32Array.of(
  0, 0, 2.5, 0, 0, 1,
  0, 1, 2.5, 0, 2.5, 1,
  0, 1, 1, 1, 0, 3.5,
  0, 3.5, 1, 1, 1, 3.5,
  1, 1.5, 2, 1.5, 1, 2.25,
  1, 2.25, 2, 1.5, 2, 2.25
);


let texCoords = Float32Array.of(
  38, 44, 218, 44, 38, 85,
  38, 85, 218, 44, 218, 85,
  38, 85, 113, 85, 38, 223,
  38, 223, 113, 85, 113, 223,
  113, 112, 203, 112, 113, 151,
  113, 151, 203, 112, 203, 151
).map(x => x / 255);

let degA = 0;

let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

let texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

let texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.of(0, 0, 255, 255));

let image = new Image();
image.src = "f-texture.png";
image.addEventListener("load", () => {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
});

let aPositionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(aPositionLocation);

let aTexCoordLocation = gl.getAttribLocation(program, "a_texcoord");
gl.enableVertexAttribArray(aTexCoordLocation);

let uAngleLocation = gl.getUniformLocation(program, "u_angle");
let uTextureLocation = gl.getUniformLocation(program, "u_texture");
gl.uniform1i(uTextureLocation, 0);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
gl.clearColor(0, 0, 0, 0);

requestAnimationFrame(drawScene);

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

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(aTexCoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 18);

  requestAnimationFrame(drawScene);
}
