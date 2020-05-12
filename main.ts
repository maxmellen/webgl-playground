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

#define iResolution u_resolution
#define iTime u_time

float burn;

mat2 rot(float a)
{
  float s=sin(a), c=cos(a);
  return mat2(s, c, -c, s);
}

float map(vec3 p)
{
  float d = max(max(abs(p.x), abs(p.y)), abs(p.z)) - .5;
  burn = d;

  mat2 rm = rot(-iTime/3. + length(p));
  p.xy *= rm, p.zy *= rm;

  vec3 q = abs(p) - iTime;
  q = abs(q - round(q));

  rm = rot(iTime);
  q.xy *= rm, q.xz *= rm;

  d = min(d, min(min(length(q.xy), length(q.yz)), length(q.xz)) + .01);

  burn = pow(d - burn, 2.);

  return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec3 rd = normalize(vec3(2.*fragCoord-iResolution.xy, iResolution.y)),
  ro = vec2(0, -2).xxy;

  mat2 r1 = rot(iTime/4.), r2 = rot(iTime/2.);
  rd.xz *= r1, ro.xz *= r1, rd.yz *= r2, ro.yz *= r2;

  float t = .0, i = 24. * (1. - exp(-.2*iTime-.1));
  for(;i-->0.;)t += map(ro+rd*t) / 2.;

  fragColor = vec4(1.-burn, exp(-t), exp(-t/2.), 1);
}

void main() {
  mainImage(out_color, gl_FragCoord.xy);
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
