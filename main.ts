let canvas = document.querySelector("canvas")!;
let gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("This browser does not support WebGL 2.");
}

let scaleFactor = 4;

let positions = Float32Array.of(
  ...[...[-1, 1], ...[-1, -1], ...[1, 1]],
  ...[...[1, 1], ...[-1, -1], ...[1, -1]]
);

// language=GLSL
let vsSource = `#version 300 es
in vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// language=GLSL
let fsSource = `#version 300 es
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
out vec4 out_color;

void mainImage(out vec4 e) {
  vec3 d = 0.5 - vec3(gl_FragCoord.xy, 1) / u_resolution.y, p, o;
  for (int i = 0; i < 32; i++) {
    o = p;
    o.z -= u_time * 9.0;
    float a = o.z * 0.1;
    o.xy *= mat2(cos(a), sin(a), -sin(a), cos(a));
    p += (0.1- length(cos(o.xy) + sin(o.yz))) *d;
  }
  e = vec4((sin(p) + vec3(2.0, 5.0, 9.0)) / length(p) * vec3(1.0), 1.0);
}

void main() {
  mainImage(out_color);
}
`;

let vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
let fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
let program = linkProgram(gl, vs, fs);

let positionBuffer = gl.createBuffer();
let positionAttrib = gl.getAttribLocation(program, "a_position");
let resolutionUniform = gl.getUniformLocation(program, "u_resolution");
let timeUniform = gl.getUniformLocation(program, "u_time");

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionAttrib);
gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);

window.addEventListener("resize", () => resize(gl!));

window.requestAnimationFrame(function loop() {
  draw(gl!);
  window.requestAnimationFrame(loop);
});

window.addEventListener("keydown", (event) => {
  let numberKey = +event.key;
  if (Number.isNaN(numberKey)) return;
  scaleFactor = numberKey === 0 ? 0.5 : numberKey;
  resize(gl!);
});

resize(gl);

let startTime = Date.now();

function resize(gl: WebGL2RenderingContext) {
  gl.canvas.width = canvas.clientWidth / scaleFactor;
  gl.canvas.height = canvas.clientHeight / scaleFactor;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(resolutionUniform, gl.canvas.width, gl.canvas.height);
}

function draw(gl: WebGL2RenderingContext) {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(timeUniform, (Date.now() - startTime) / 1000);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: GLenum,
  source: string
): WebGLShader {
  let shader = gl.createShader(type)!;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    let info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Could not compile shader:\n" + info);
  }

  return shader;
}

function linkProgram(
  gl: WebGL2RenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram {
  let program = gl.createProgram()!;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    let info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Could not link program:\n" + info);
  }

  return program;
}

export {};
