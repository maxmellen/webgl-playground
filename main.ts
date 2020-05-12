// Original shader by lsdlive on Shadertoy
// https://www.shadertoy.com/view/MdGczK

let canvas = document.querySelector("canvas")!;
let gl = canvas.getContext("webgl");

if (!gl) {
  throw new Error("This browser does not support WebGL 2.");
}

let scaleFactor = 2;

let positions = Float32Array.of(
  ...[...[-1, 1], ...[-1, -1], ...[1, 1]],
  ...[...[1, 1], ...[-1, -1], ...[1, -1]]
);

// language=GLSL
let vsSource = `#version 100
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

// language=GLSL
let fsSource = `#version 100
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;

#define iResolution u_resolution
#define iTime u_time

// @lsdlive


float sc(vec3 p, float d){p=abs(p);p=max(p,p.yzx);return min(p.x,min(p.y,p.z))-d;}
mat2 r2d(float a){float c=cos(a),s=sin(a);return mat2(c,s,-s,c);}
float re(float p,float d){return mod(p-d*.5,d)-d*.5;}
void amod(inout vec2 p, float m){float a=re(atan(p.x,p.y),m);p=vec2(cos(a),sin(a))*length(p);}
void mo(inout vec2 p, vec2 d){p.x=abs(p.x)-d.x;p.y=abs(p.y)-d.y;if(p.y>p.x)p=p.yx;}


float scc(vec3 p, float d){
  float c1 = length(p.xy) - d;
  float c2 = length(p.xz) - d;
  float c3 = length(p.zy) - d;
  return min(c1,min(c2,c3));
}

float g=0.;
float de(vec3 p){
  //p.y-=1.;
  p.xy*=r2d(iTime*.3);

  p.xy*=r2d(p.z*.3);

  p.z=re(p.z,9.);

  amod(p.xy, 6.28/4.);
  mo(p.xy, vec2(2., .3));
  amod(p.xy, 6.28/8.3);
  mo(p.zy, vec2(1., .3));

  p.x=abs(p.x)-3.;

  p.y=abs(p.y)-2.;
  p.xy*=r2d(.5);

  float d = sc (p,.5);

  p.xy*=r2d(iTime*.3);
  d = min(d, -scc(p,1.));
  g+=.01/(.01+d*d);
  return d;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
  vec2 uv = fragCoord/iResolution.xy -.5;
  uv.x*=iResolution.x/iResolution.y;

  vec3 ro=vec3(0,0,-3.+iTime);
  vec3 rd=normalize(vec3(uv,1));

  vec3 p;
  float t=0.;
  float ri;
  for(float i=0.;i<1.;i+=.01){
    ri=i;
    p=ro+rd*t;
    float d=de(p);
    //if(d<.001)break;
    d=max(abs(d), .005);
    t+=d*.3;
  }

  vec3 bg= vec3(.2, .1, .2);
  vec3 c=mix(vec3(.7, .1, .1), bg, uv.x*4.3+ri);
  c.g+=sin(iTime);
  c+=g*.02;
  c=mix(c, bg,1.-exp(-.01*t*t));
  fragColor = vec4(c,1.0);
}

void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
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

function resize(gl: WebGLRenderingContext) {
  gl.canvas.width = canvas.clientWidth / scaleFactor;
  gl.canvas.height = canvas.clientHeight / scaleFactor;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(resolutionUniform, gl.canvas.width, gl.canvas.height);
}

function draw(gl: WebGLRenderingContext) {
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(timeUniform, (Date.now() - startTime) / 1000);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function compileShader(
  gl: WebGLRenderingContext,
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
  gl: WebGLRenderingContext,
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
