let canvas = document.querySelector("canvas")!;
let gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("This browser does not support WebGL 2.");
}

gl.canvas.width = canvas.clientWidth;
gl.canvas.height = canvas.clientHeight;

if (window.devicePixelRatio) {
  gl.canvas.width *= window.devicePixelRatio;
  gl.canvas.height *= window.devicePixelRatio;
}

let positions = Float32Array.of(...[0, 0], ...[1, 0], ...[0, 0.5]);

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
out vec4 out_color;

void main() {
  out_color = vec4(1.0, 0.0, 0.5, 1.0);
}
`;

let vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
let fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
let program = linkProgram(gl, vs, fs);

let positionBuffer = gl.createBuffer();
let positionAttrib = gl.getAttribLocation(program, "a_position");

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

gl.enableVertexAttribArray(positionAttrib);
gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);

gl.useProgram(program);

gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);

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
