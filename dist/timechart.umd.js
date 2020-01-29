(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3-color'), require('d3-scale'), require('d3-axis'), require('d3-selection')) :
    typeof define === 'function' && define.amd ? define(['d3-color', 'd3-scale', 'd3-axis', 'd3-selection'], factory) :
    (global = global || self, global.TimeChart = factory(global.d3, global.d3, global.d3, global.d3));
}(this, (function (d3Color, d3Scale, d3Axis, d3Selection) { 'use strict';

    function maxMin(arr) {
        let max = -Infinity;
        let min = Infinity;
        for (const v of arr) {
            if (v > max)
                max = v;
            if (v < min)
                min = v;
        }
        return { max, min };
    }
    class RenderModel {
        constructor(options) {
            this.options = options;
            this.xScale = d3Scale.scaleTime();
            this.yScale = d3Scale.scaleLinear();
            this.xAutoInitized = false;
            this.yAutoInitized = false;
            this.seriesInfo = new Map();
            this.updateCallbacks = [];
            this.redrawRequested = false;
            if (options.xRange !== 'auto' && options.xRange) {
                this.xScale.domain([options.xRange.min, options.xRange.max]);
            }
            if (options.yRange !== 'auto' && options.yRange) {
                this.yScale.domain([options.yRange.min, options.yRange.max]);
            }
        }
        resize(width, height) {
            const op = this.options;
            this.xScale.range([op.paddingLeft, width - op.paddingRight]);
            this.yScale.range([op.paddingTop, height - op.paddingBottom]);
        }
        onUpdate(callback) {
            this.updateCallbacks.push(callback);
        }
        update() {
            for (const s of this.options.series) {
                if (!this.seriesInfo.has(s)) {
                    this.seriesInfo.set(s, {
                        yRangeUpdatedIndex: 0,
                    });
                }
            }
            const series = this.options.series.filter(s => s.data.length > 0);
            if (series.length === 0) {
                return;
            }
            const opXRange = this.options.xRange;
            const opYRange = this.options.yRange;
            if (this.options.realTime || opXRange === 'auto') {
                const maxDomain = this.options.baseTime + Math.max(...series.map(s => s.data[s.data.length - 1].x));
                if (this.options.realTime) {
                    const currentDomain = this.xScale.domain();
                    const range = currentDomain[1].getTime() - currentDomain[0].getTime();
                    this.xScale.domain([maxDomain - range, maxDomain]);
                }
                else { // Auto
                    const minDomain = this.xAutoInitized ?
                        this.xScale.domain()[0] :
                        this.options.baseTime + Math.min(...series.map(s => s.data[0].x));
                    this.xScale.domain([minDomain, maxDomain]);
                    this.xAutoInitized = true;
                }
            }
            else if (opXRange) {
                this.xScale.domain([opXRange.min, opXRange.max]);
            }
            if (opYRange === 'auto') {
                const maxMinY = series.map(s => {
                    const newY = s.data.slice(this.seriesInfo.get(s).yRangeUpdatedIndex).map(d => d.y);
                    return maxMin(newY);
                });
                if (this.yAutoInitized) {
                    const origDomain = this.yScale.domain();
                    maxMinY.push({
                        min: origDomain[1],
                        max: origDomain[0],
                    });
                }
                const minDomain = Math.min(...maxMinY.map(s => s.min));
                const maxDomain = Math.max(...maxMinY.map(s => s.max));
                this.yScale.domain([maxDomain, minDomain]).nice();
                this.yAutoInitized = true;
                for (const s of series) {
                    this.seriesInfo.get(s).yRangeUpdatedIndex = s.data.length;
                }
            }
            else if (opYRange) {
                this.yScale.domain([opYRange.max, opYRange.min]);
            }
            for (const cb of this.updateCallbacks) {
                cb();
            }
        }
        requestRedraw() {
            if (this.redrawRequested) {
                return;
            }
            this.redrawRequested = true;
            requestAnimationFrame((time) => {
                this.redrawRequested = false;
                this.update();
            });
        }
    }

    /**
     * Common utilities
     * @module glMatrix
     */
    var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
    if (!Math.hypot) Math.hypot = function () {
      var y = 0,
          i = arguments.length;

      while (i--) {
        y += arguments[i] * arguments[i];
      }

      return Math.sqrt(y);
    };

    /**
     * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
     * @module mat4
     */

    /**
     * Creates a new identity mat4
     *
     * @returns {mat4} a new 4x4 matrix
     */

    function create() {
      var out = new ARRAY_TYPE(16);

      if (ARRAY_TYPE != Float32Array) {
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
      }

      out[0] = 1;
      out[5] = 1;
      out[10] = 1;
      out[15] = 1;
      return out;
    }
    /**
     * Multiplies two mat4s
     *
     * @param {mat4} out the receiving matrix
     * @param {mat4} a the first operand
     * @param {mat4} b the second operand
     * @returns {mat4} out
     */

    function multiply(out, a, b) {
      var a00 = a[0],
          a01 = a[1],
          a02 = a[2],
          a03 = a[3];
      var a10 = a[4],
          a11 = a[5],
          a12 = a[6],
          a13 = a[7];
      var a20 = a[8],
          a21 = a[9],
          a22 = a[10],
          a23 = a[11];
      var a30 = a[12],
          a31 = a[13],
          a32 = a[14],
          a33 = a[15]; // Cache only the current line of the second matrix

      var b0 = b[0],
          b1 = b[1],
          b2 = b[2],
          b3 = b[3];
      out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[4];
      b1 = b[5];
      b2 = b[6];
      b3 = b[7];
      out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[8];
      b1 = b[9];
      b2 = b[10];
      b3 = b[11];
      out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      b0 = b[12];
      b1 = b[13];
      b2 = b[14];
      b3 = b[15];
      out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
      out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
      out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
      out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
      return out;
    }
    /**
     * Creates a matrix from a vector translation
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.translate(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {vec3} v Translation vector
     * @returns {mat4} out
     */

    function fromTranslation(out, v) {
      out[0] = 1;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = 1;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = 1;
      out[11] = 0;
      out[12] = v[0];
      out[13] = v[1];
      out[14] = v[2];
      out[15] = 1;
      return out;
    }
    /**
     * Creates a matrix from a vector scaling
     * This is equivalent to (but much faster than):
     *
     *     mat4.identity(dest);
     *     mat4.scale(dest, dest, vec);
     *
     * @param {mat4} out mat4 receiving operation result
     * @param {vec3} v Scaling vector
     * @returns {mat4} out
     */

    function fromScaling(out, v) {
      out[0] = v[0];
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[5] = v[1];
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[10] = v[2];
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
      out[15] = 1;
      return out;
    }

    /**
     * 3 Dimensional Vector
     * @module vec3
     */

    /**
     * Creates a new, empty vec3
     *
     * @returns {vec3} a new 3D vector
     */

    function create$1() {
      var out = new ARRAY_TYPE(3);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
      }

      return out;
    }
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec3} out the receiving vector
     * @param {vec3} a the first operand
     * @param {vec3} b the second operand
     * @returns {vec3} out
     */

    function subtract(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      out[2] = a[2] - b[2];
      return out;
    }
    /**
     * Perform some operation over an array of vec3s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    var forEach = function () {
      var vec = create$1();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 3;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          vec[2] = a[i + 2];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
          a[i + 2] = vec[2];
        }

        return a;
      };
    }();

    /**
     * 2 Dimensional Vector
     * @module vec2
     */

    /**
     * Creates a new, empty vec2
     *
     * @returns {vec2} a new 2D vector
     */

    function create$2() {
      var out = new ARRAY_TYPE(2);

      if (ARRAY_TYPE != Float32Array) {
        out[0] = 0;
        out[1] = 0;
      }

      return out;
    }
    /**
     * Creates a new vec2 initialized with the given values
     *
     * @param {Number} x X component
     * @param {Number} y Y component
     * @returns {vec2} a new 2D vector
     */

    function fromValues(x, y) {
      var out = new ARRAY_TYPE(2);
      out[0] = x;
      out[1] = y;
      return out;
    }
    /**
     * Subtracts vector b from vector a
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */

    function subtract$1(out, a, b) {
      out[0] = a[0] - b[0];
      out[1] = a[1] - b[1];
      return out;
    }
    /**
     * Divides two vec2's
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a the first operand
     * @param {vec2} b the second operand
     * @returns {vec2} out
     */

    function divide(out, a, b) {
      out[0] = a[0] / b[0];
      out[1] = a[1] / b[1];
      return out;
    }
    /**
     * Negates the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to negate
     * @returns {vec2} out
     */

    function negate(out, a) {
      out[0] = -a[0];
      out[1] = -a[1];
      return out;
    }
    /**
     * Returns the inverse of the components of a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to invert
     * @returns {vec2} out
     */

    function inverse(out, a) {
      out[0] = 1.0 / a[0];
      out[1] = 1.0 / a[1];
      return out;
    }
    /**
     * Normalize a vec2
     *
     * @param {vec2} out the receiving vector
     * @param {vec2} a vector to normalize
     * @returns {vec2} out
     */

    function normalize(out, a) {
      var x = a[0],
          y = a[1];
      var len = x * x + y * y;

      if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
      }

      out[0] = a[0] * len;
      out[1] = a[1] * len;
      return out;
    }
    /**
     * Perform some operation over an array of vec2s.
     *
     * @param {Array} a the array of vectors to iterate over
     * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
     * @param {Number} offset Number of elements to skip at the beginning of the array
     * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
     * @param {Function} fn Function to call for each vector in the array
     * @param {Object} [arg] additional argument to pass to fn
     * @returns {Array} a
     * @function
     */

    var forEach$1 = function () {
      var vec = create$2();
      return function (a, stride, offset, count, fn, arg) {
        var i, l;

        if (!stride) {
          stride = 2;
        }

        if (!offset) {
          offset = 0;
        }

        if (count) {
          l = Math.min(count * stride + offset, a.length);
        } else {
          l = a.length;
        }

        for (i = offset; i < l; i += stride) {
          vec[0] = a[i];
          vec[1] = a[i + 1];
          fn(vec, vec, arg);
          a[i] = vec[0];
          a[i + 1] = vec[1];
        }

        return a;
      };
    }();

    class LinkedWebGLProgram {
        constructor(gl, vertexSource, fragmentSource) {
            var _a;
            this.gl = gl;
            const program = throwIfFalsy(gl.createProgram());
            gl.attachShader(program, throwIfFalsy(createShader(gl, gl.VERTEX_SHADER, vertexSource)));
            gl.attachShader(program, throwIfFalsy(createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)));
            gl.linkProgram(program);
            const success = gl.getProgramParameter(program, gl.LINK_STATUS);
            if (!success) {
                const message = (_a = gl.getProgramInfoLog(program), (_a !== null && _a !== void 0 ? _a : 'Unknown Error.'));
                gl.deleteProgram(program);
                throw new Error(message);
            }
            this.program = program;
        }
        use() {
            this.gl.useProgram(this.program);
        }
    }
    function createShader(gl, type, source) {
        var _a;
        const shader = throwIfFalsy(gl.createShader(type));
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!success) {
            const message = (_a = gl.getShaderInfoLog(shader), (_a !== null && _a !== void 0 ? _a : 'Unknown Error.'));
            gl.deleteShader(shader);
            throw new Error(message);
        }
        return shader;
    }
    function throwIfFalsy(value) {
        if (!value) {
            throw new Error('value must not be falsy');
        }
        return value;
    }

    /** lower bound */
    function domainSearch(data, start, end, value, key) {
        if (start >= end) {
            return start;
        }
        if (value <= key(data[start])) {
            return start;
        }
        if (value > key(data[end - 1])) {
            return end;
        }
        end -= 1;
        while (start + 1 < end) {
            const minDomain = key(data[start]);
            const maxDomain = key(data[end]);
            const ratio = maxDomain <= minDomain ? 0 : (value - minDomain) / (maxDomain - minDomain);
            let expectedIndex = Math.ceil(start + ratio * (end - start));
            if (expectedIndex === end)
                expectedIndex--;
            else if (expectedIndex === start)
                expectedIndex++;
            const domain = key(data[expectedIndex]);
            if (domain < value) {
                start = expectedIndex;
            }
            else {
                end = expectedIndex;
            }
        }
        return end;
    }
    function zip(...rows) {
        return [...rows[0]].map((_, c) => rows.map(row => row[c]));
    }

    function resolveColorRGBA(color) {
        const rgbColor = typeof color === 'string' ? d3Color.rgb(color) : d3Color.rgb(color);
        return [rgbColor.r / 255, rgbColor.g / 255, rgbColor.b / 255, rgbColor.opacity];
    }

    var VertexAttribLocations;
    (function (VertexAttribLocations) {
        VertexAttribLocations[VertexAttribLocations["DATA_POINT"] = 0] = "DATA_POINT";
        VertexAttribLocations[VertexAttribLocations["DIR"] = 1] = "DIR";
    })(VertexAttribLocations || (VertexAttribLocations = {}));
    const vsSource = `#version 300 es
layout (location = ${VertexAttribLocations.DATA_POINT}) in vec2 aDataPoint;
layout (location = ${VertexAttribLocations.DIR}) in vec2 aDir;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform float uLineWidth;

void main() {
    vec4 cssPose = uModelViewMatrix * vec4(aDataPoint, 0.0, 1.0);
    vec4 dir = uModelViewMatrix * vec4(aDir, 0.0, 0.0);
    dir = normalize(dir);
    gl_Position = uProjectionMatrix * (cssPose + vec4(-dir.y, dir.x, 0.0, 0.0) * uLineWidth);
}
`;
    const fsSource = `#version 300 es
precision lowp float;

uniform vec4 uColor;

out vec4 outColor;

void main() {
    outColor = uColor;
}
`;
    class LineChartWebGLProgram extends LinkedWebGLProgram {
        constructor(gl) {
            super(gl, vsSource, fsSource);
            this.locations = {
                uModelViewMatrix: throwIfFalsy(gl.getUniformLocation(this.program, 'uModelViewMatrix')),
                uProjectionMatrix: throwIfFalsy(gl.getUniformLocation(this.program, 'uProjectionMatrix')),
                uLineWidth: throwIfFalsy(gl.getUniformLocation(this.program, 'uLineWidth')),
                uColor: throwIfFalsy(gl.getUniformLocation(this.program, 'uColor')),
            };
        }
    }
    const INDEX_PER_POINT = 4;
    const POINT_PER_DATAPOINT = 4;
    const INDEX_PER_DATAPOINT = INDEX_PER_POINT * POINT_PER_DATAPOINT;
    const BYTES_PER_POINT = INDEX_PER_POINT * Float32Array.BYTES_PER_ELEMENT;
    const BUFFER_DATA_POINT_CAPACITY = 128 * 1024;
    const BUFFER_CAPACITY = BUFFER_DATA_POINT_CAPACITY * INDEX_PER_DATAPOINT + 2 * POINT_PER_DATAPOINT;
    class VertexArray {
        /**
         * @param firstDataPointIndex At least 1, since datapoint 0 has no path to draw.
         */
        constructor(gl, dataPoints, firstDataPointIndex) {
            this.gl = gl;
            this.dataPoints = dataPoints;
            this.firstDataPointIndex = firstDataPointIndex;
            this.length = 0;
            this.vao = throwIfFalsy(gl.createVertexArray());
            this.bind();
            this.dataBuffer = throwIfFalsy(gl.createBuffer());
            gl.bindBuffer(gl.ARRAY_BUFFER, this.dataBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, BUFFER_CAPACITY * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(VertexAttribLocations.DATA_POINT);
            gl.vertexAttribPointer(VertexAttribLocations.DATA_POINT, 2, gl.FLOAT, false, BYTES_PER_POINT, 0);
            gl.enableVertexAttribArray(VertexAttribLocations.DIR);
            gl.vertexAttribPointer(VertexAttribLocations.DIR, 2, gl.FLOAT, false, BYTES_PER_POINT, 2 * Float32Array.BYTES_PER_ELEMENT);
        }
        bind() {
            this.gl.bindVertexArray(this.vao);
        }
        clear() {
            this.length = 0;
        }
        delete() {
            this.clear();
            this.gl.deleteBuffer(this.dataBuffer);
            this.gl.deleteVertexArray(this.vao);
        }
        /**
         * @returns Next data point index, or `dataPoints.length` if all data added.
         */
        addDataPoints() {
            const dataPoints = this.dataPoints;
            const start = this.firstDataPointIndex + this.length;
            const remainDPCapacity = BUFFER_DATA_POINT_CAPACITY - this.length;
            const remainDPCount = dataPoints.length - start;
            const isOverflow = remainDPCapacity < remainDPCount;
            const numDPtoAdd = isOverflow ? remainDPCapacity : remainDPCount;
            let extraBufferLength = INDEX_PER_DATAPOINT * numDPtoAdd;
            if (isOverflow) {
                extraBufferLength += 2 * INDEX_PER_POINT;
            }
            const buffer = new Float32Array(extraBufferLength);
            let bi = 0;
            const vDP = create$2();
            const vPreviousDP = create$2();
            const dir1 = create$2();
            const dir2 = create$2();
            function calc(dp, previousDP) {
                vDP[0] = dp.x;
                vDP[1] = dp.y;
                vPreviousDP[0] = previousDP.x;
                vPreviousDP[1] = previousDP.y;
                subtract$1(dir1, vDP, vPreviousDP);
                normalize(dir1, dir1);
                negate(dir2, dir1);
            }
            function put(v) {
                buffer[bi] = v[0];
                buffer[bi + 1] = v[1];
                bi += 2;
            }
            let previousDP = dataPoints[start - 1];
            for (let i = 0; i < numDPtoAdd; i++) {
                const dp = dataPoints[start + i];
                calc(dp, previousDP);
                previousDP = dp;
                for (const dp of [vPreviousDP, vDP]) {
                    for (const dir of [dir1, dir2]) {
                        put(dp);
                        put(dir);
                    }
                }
            }
            if (isOverflow) {
                calc(dataPoints[start + numDPtoAdd], previousDP);
                for (const dir of [dir1, dir2]) {
                    put(vPreviousDP);
                    put(dir);
                }
            }
            const gl = this.gl;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.dataBuffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, BYTES_PER_POINT * POINT_PER_DATAPOINT * this.length, buffer);
            this.length += numDPtoAdd;
            return start + numDPtoAdd;
        }
        draw(renderIndex) {
            const first = Math.max(0, renderIndex.min - this.firstDataPointIndex);
            const last = Math.min(this.length, renderIndex.max - this.firstDataPointIndex);
            const count = last - first;
            const gl = this.gl;
            this.bind();
            gl.drawArrays(gl.TRIANGLE_STRIP, first * POINT_PER_DATAPOINT, count * POINT_PER_DATAPOINT);
        }
    }
    /**
     * An array of `VertexArray` to represent a series
     *
     * `series.data`  index: 0  [1 ... C] [C+1 ... 2C] ... (C = `BUFFER_DATA_POINT_CAPACITY`)
     * `vertexArrays` index:     0         1           ...
     */
    class SeriesVertexArray {
        constructor(gl, series) {
            this.gl = gl;
            this.series = series;
            this.vertexArrays = [];
        }
        syncBuffer() {
            let activeArray;
            let bufferedDataPointNum = 1;
            const newArray = () => {
                activeArray = new VertexArray(this.gl, this.series.data, bufferedDataPointNum);
                this.vertexArrays.push(activeArray);
            };
            if (this.vertexArrays.length > 0) {
                const lastVertexArray = this.vertexArrays[this.vertexArrays.length - 1];
                bufferedDataPointNum = lastVertexArray.firstDataPointIndex + lastVertexArray.length;
                if (bufferedDataPointNum > this.series.data.length) {
                    throw new Error('remove data unsupported.');
                }
                if (bufferedDataPointNum === this.series.data.length) {
                    return;
                }
                activeArray = lastVertexArray;
            }
            else if (this.series.data.length >= 2) {
                newArray();
                activeArray = activeArray;
            }
            else {
                return; // Not enough data
            }
            while (true) {
                bufferedDataPointNum = activeArray.addDataPoints();
                if (bufferedDataPointNum >= this.series.data.length) {
                    if (bufferedDataPointNum > this.series.data.length) {
                        throw Error('Assertion failed.');
                    }
                    break;
                }
                newArray();
            }
        }
        draw(renderDomain) {
            const data = this.series.data;
            if (data.length === 0 || data[0].x > renderDomain.max || data[data.length - 1].x < renderDomain.min) {
                return;
            }
            const key = (d) => d.x;
            const minIndex = domainSearch(data, 1, data.length, renderDomain.min, key);
            const maxIndex = domainSearch(data, minIndex, data.length - 1, renderDomain.max, key) + 1;
            const minArrayIndex = Math.floor((minIndex - 1) / BUFFER_DATA_POINT_CAPACITY);
            const maxArrayIndex = Math.ceil((maxIndex - 1) / BUFFER_DATA_POINT_CAPACITY);
            const renderIndex = { min: minIndex, max: maxIndex };
            for (let i = minArrayIndex; i < maxArrayIndex; i++) {
                this.vertexArrays[i].draw(renderIndex);
            }
        }
    }
    class LineChartRenderer {
        constructor(model, gl, options) {
            this.model = model;
            this.gl = gl;
            this.options = options;
            this.program = new LineChartWebGLProgram(this.gl);
            this.arrays = new Map();
            this.height = 0;
            this.width = 0;
            model.onUpdate(() => this.drawFrame());
            this.program.use();
        }
        syncBuffer() {
            for (const s of this.options.series) {
                let a = this.arrays.get(s);
                if (!a) {
                    a = new SeriesVertexArray(this.gl, s);
                    this.arrays.set(s, a);
                }
                a.syncBuffer();
            }
        }
        onResize(width, height) {
            this.height = height;
            this.width = width;
            const scale = fromValues(width, height);
            divide(scale, scale, [2, 2]);
            inverse(scale, scale);
            const translate = create();
            fromTranslation(translate, [-1.0, -1.0, 0.0]);
            const projectionMatrix = create();
            fromScaling(projectionMatrix, [...scale, 1.0]);
            multiply(projectionMatrix, translate, projectionMatrix);
            const gl = this.gl;
            gl.uniformMatrix4fv(this.program.locations.uProjectionMatrix, false, projectionMatrix);
        }
        drawFrame() {
            var _a;
            this.syncBuffer();
            this.syncDomain();
            const gl = this.gl;
            for (const [ds, arr] of this.arrays) {
                const color = resolveColorRGBA(ds.color);
                gl.uniform4fv(this.program.locations.uColor, color);
                const lineWidth = (_a = ds.lineWidth, (_a !== null && _a !== void 0 ? _a : this.options.lineWidth));
                gl.uniform1f(this.program.locations.uLineWidth, lineWidth / 2);
                const renderDomain = {
                    min: this.model.xScale.invert(-lineWidth / 2).getTime() - this.options.baseTime,
                    max: this.model.xScale.invert(this.width + lineWidth / 2).getTime() - this.options.baseTime,
                };
                arr.draw(renderDomain);
            }
        }
        ySvgToCanvas(v) {
            return -v + this.height;
        }
        syncDomain() {
            const m = this.model;
            const gl = this.gl;
            const baseTime = this.options.baseTime;
            const zero = [m.xScale(baseTime), this.ySvgToCanvas(m.yScale(0)), 0];
            const one = [m.xScale(baseTime + 1), this.ySvgToCanvas(m.yScale(1)), 0];
            const modelViewMatrix = create();
            const scaling = create$1();
            subtract(scaling, one, zero);
            fromScaling(modelViewMatrix, scaling);
            const translateMat = create();
            fromTranslation(translateMat, zero);
            multiply(modelViewMatrix, translateMat, modelViewMatrix);
            gl.uniformMatrix4fv(this.program.locations.uModelViewMatrix, false, modelViewMatrix);
        }
    }

    class CanvasLayer {
        constructor(el, options, model) {
            model.onUpdate(() => this.clear());
            el.style.position = 'relative';
            const canvas = document.createElement('canvas');
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.position = 'absolute';
            el.appendChild(canvas);
            const ctx = canvas.getContext('webgl2');
            if (!ctx) {
                throw new Error('Unable to initialize WebGL. Your browser or machine may not support it.');
            }
            const gl = ctx;
            this.gl = gl;
            const bgColor = resolveColorRGBA(options.backgroundColor);
            gl.clearColor(...bgColor);
            this.canvas = canvas;
        }
        onResize() {
            const canvas = this.canvas;
            const scale = window.devicePixelRatio;
            canvas.width = canvas.clientWidth * scale;
            canvas.height = canvas.clientHeight * scale;
            this.gl.viewport(0, 0, canvas.width, canvas.height);
        }
        clear() {
            const gl = this.gl;
            gl.clear(gl.COLOR_BUFFER_BIT);
        }
    }

    class SVGLayer {
        constructor(el, options, model) {
            this.options = options;
            this.model = model;
            this.xAxis = d3Axis.axisBottom(this.model.xScale);
            this.yAxis = d3Axis.axisLeft(this.model.yScale);
            model.onUpdate(() => this.update());
            el.style.position = 'relative';
            const svg = d3Selection.select(el).append('svg')
                .style('position', 'absolute')
                .style('width', '100%')
                .style('height', '100%');
            this.svgNode = svg.node();
            this.xg = svg.append('g');
            this.yg = svg.append('g');
        }
        update() {
            this.xg.call(this.xAxis);
            this.yg.call(this.yAxis);
        }
        onResize() {
            const svg = this.svgNode;
            const op = this.options;
            this.xg.attr('transform', `translate(0, ${svg.clientHeight - op.paddingBottom})`);
            this.yg.attr('transform', `translate(${op.paddingLeft}, 0)`);
            this.update();
        }
    }

    var DEFAULT_CONFIG = {
      // minimum relative difference between two compared values,
      // used by all comparison functions
      epsilon: 1e-12,
      // type of default matrix output. Choose 'matrix' (default) or 'array'
      matrix: 'Matrix',
      // type of default number output. Choose 'number' (default) 'BigNumber', or 'Fraction
      number: 'number',
      // number of significant digits in BigNumbers
      precision: 64,
      // predictable output type of functions. When true, output type depends only
      // on the input types. When false (default), output type can vary depending
      // on input values. For example `math.sqrt(-4)` returns `complex('2i')` when
      // predictable is false, and returns `NaN` when true.
      predictable: false,
      // random seed for seeded pseudo random number generation
      // null = randomly seed
      randomSeed: null
    };

    function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

    // type checks for all known types
    //
    // note that:
    //
    // - check by duck-typing on a property like `isUnit`, instead of checking instanceof.
    //   instanceof cannot be used because that would not allow to pass data from
    //   one instance of math.js to another since each has it's own instance of Unit.
    // - check the `isUnit` property via the constructor, so there will be no
    //   matches for "fake" instances like plain objects with a property `isUnit`.
    //   That is important for security reasons.
    // - It must not be possible to override the type checks used internally,
    //   for security reasons, so these functions are not exposed in the expression
    //   parser.
    function isNumber(x) {
      return typeof x === 'number';
    }
    function isBigNumber(x) {
      return x && x.constructor.prototype.isBigNumber === true || false;
    }
    function isComplex(x) {
      return x && _typeof(x) === 'object' && Object.getPrototypeOf(x).isComplex === true || false;
    }
    function isFraction(x) {
      return x && _typeof(x) === 'object' && Object.getPrototypeOf(x).isFraction === true || false;
    }
    function isUnit(x) {
      return x && x.constructor.prototype.isUnit === true || false;
    }
    function isString(x) {
      return typeof x === 'string';
    }
    var isArray = Array.isArray;
    function isMatrix(x) {
      return x && x.constructor.prototype.isMatrix === true || false;
    }
    /**
     * Test whether a value is a collection: an Array or Matrix
     * @param {*} x
     * @returns {boolean} isCollection
     */

    function isCollection(x) {
      return Array.isArray(x) || isMatrix(x);
    }
    function isDenseMatrix(x) {
      return x && x.isDenseMatrix && x.constructor.prototype.isMatrix === true || false;
    }
    function isSparseMatrix(x) {
      return x && x.isSparseMatrix && x.constructor.prototype.isMatrix === true || false;
    }
    function isRange(x) {
      return x && x.constructor.prototype.isRange === true || false;
    }
    function isIndex(x) {
      return x && x.constructor.prototype.isIndex === true || false;
    }
    function isBoolean(x) {
      return typeof x === 'boolean';
    }
    function isResultSet(x) {
      return x && x.constructor.prototype.isResultSet === true || false;
    }
    function isHelp(x) {
      return x && x.constructor.prototype.isHelp === true || false;
    }
    function isFunction(x) {
      return typeof x === 'function';
    }
    function isDate(x) {
      return x instanceof Date;
    }
    function isRegExp(x) {
      return x instanceof RegExp;
    }
    function isObject(x) {
      return !!(x && _typeof(x) === 'object' && x.constructor === Object && !isComplex(x) && !isFraction(x));
    }
    function isNull(x) {
      return x === null;
    }
    function isUndefined(x) {
      return x === undefined;
    }
    function isAccessorNode(x) {
      return x && x.isAccessorNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isArrayNode(x) {
      return x && x.isArrayNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isAssignmentNode(x) {
      return x && x.isAssignmentNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isBlockNode(x) {
      return x && x.isBlockNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isConditionalNode(x) {
      return x && x.isConditionalNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isConstantNode(x) {
      return x && x.isConstantNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isFunctionAssignmentNode(x) {
      return x && x.isFunctionAssignmentNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isFunctionNode(x) {
      return x && x.isFunctionNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isIndexNode(x) {
      return x && x.isIndexNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isNode(x) {
      return x && x.isNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isObjectNode(x) {
      return x && x.isObjectNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isOperatorNode(x) {
      return x && x.isOperatorNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isParenthesisNode(x) {
      return x && x.isParenthesisNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isRangeNode(x) {
      return x && x.isRangeNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isSymbolNode(x) {
      return x && x.isSymbolNode === true && x.constructor.prototype.isNode === true || false;
    }
    function isChain(x) {
      return x && x.constructor.prototype.isChain === true || false;
    }
    function typeOf(x) {
      var t = _typeof(x);

      if (t === 'object') {
        // JavaScript types
        if (x === null) return 'null';
        if (Array.isArray(x)) return 'Array';
        if (x instanceof Date) return 'Date';
        if (x instanceof RegExp) return 'RegExp'; // math.js types

        if (isBigNumber(x)) return 'BigNumber';
        if (isComplex(x)) return 'Complex';
        if (isFraction(x)) return 'Fraction';
        if (isMatrix(x)) return 'Matrix';
        if (isUnit(x)) return 'Unit';
        if (isIndex(x)) return 'Index';
        if (isRange(x)) return 'Range';
        if (isResultSet(x)) return 'ResultSet';
        if (isNode(x)) return x.type;
        if (isChain(x)) return 'Chain';
        if (isHelp(x)) return 'Help';
        return 'Object';
      }

      if (t === 'function') return 'Function';
      return t; // can be 'string', 'number', 'boolean', ...
    }

    function _typeof$1(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$1 = function _typeof(obj) { return typeof obj; }; } else { _typeof$1 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$1(obj); }
    /**
     * Clone an object
     *
     *     clone(x)
     *
     * Can clone any primitive type, array, and object.
     * If x has a function clone, this function will be invoked to clone the object.
     *
     * @param {*} x
     * @return {*} clone
     */

    function clone(x) {
      var type = _typeof$1(x); // immutable primitive types


      if (type === 'number' || type === 'string' || type === 'boolean' || x === null || x === undefined) {
        return x;
      } // use clone function of the object when available


      if (typeof x.clone === 'function') {
        return x.clone();
      } // array


      if (Array.isArray(x)) {
        return x.map(function (value) {
          return clone(value);
        });
      }

      if (x instanceof Date) return new Date(x.valueOf());
      if (isBigNumber(x)) return x; // bignumbers are immutable

      if (x instanceof RegExp) throw new TypeError('Cannot clone ' + x); // TODO: clone a RegExp
      // object

      return mapObject(x, clone);
    }
    /**
     * Apply map to all properties of an object
     * @param {Object} object
     * @param {function} callback
     * @return {Object} Returns a copy of the object with mapped properties
     */

    function mapObject(object, callback) {
      var clone = {};

      for (var key in object) {
        if (hasOwnProperty(object, key)) {
          clone[key] = callback(object[key]);
        }
      }

      return clone;
    }
    /**
     * Extend object a with the properties of object b
     * @param {Object} a
     * @param {Object} b
     * @return {Object} a
     */

    function extend(a, b) {
      for (var prop in b) {
        if (hasOwnProperty(b, prop)) {
          a[prop] = b[prop];
        }
      }

      return a;
    }
    /**
     * Deep test equality of all fields in two pairs of arrays or objects.
     * Compares values and functions strictly (ie. 2 is not the same as '2').
     * @param {Array | Object} a
     * @param {Array | Object} b
     * @returns {boolean}
     */

    function deepStrictEqual(a, b) {
      var prop, i, len;

      if (Array.isArray(a)) {
        if (!Array.isArray(b)) {
          return false;
        }

        if (a.length !== b.length) {
          return false;
        }

        for (i = 0, len = a.length; i < len; i++) {
          if (!deepStrictEqual(a[i], b[i])) {
            return false;
          }
        }

        return true;
      } else if (typeof a === 'function') {
        return a === b;
      } else if (a instanceof Object) {
        if (Array.isArray(b) || !(b instanceof Object)) {
          return false;
        }

        for (prop in a) {
          // noinspection JSUnfilteredForInLoop
          if (!(prop in b) || !deepStrictEqual(a[prop], b[prop])) {
            return false;
          }
        }

        for (prop in b) {
          // noinspection JSUnfilteredForInLoop
          if (!(prop in a) || !deepStrictEqual(a[prop], b[prop])) {
            return false;
          }
        }

        return true;
      } else {
        return a === b;
      }
    }
    /**
     * A safe hasOwnProperty
     * @param {Object} object
     * @param {string} property
     */

    function hasOwnProperty(object, property) {
      return object && Object.hasOwnProperty.call(object, property);
    }
    /**
     * Shallow version of pick, creating an object composed of the picked object properties
     * but not for nested properties
     * @param {Object} object
     * @param {string[]} properties
     * @return {Object}
     */

    function pickShallow(object, properties) {
      var copy = {};

      for (var i = 0; i < properties.length; i++) {
        var key = properties[i];
        var value = object[key];

        if (value !== undefined) {
          copy[key] = value;
        }
      }

      return copy;
    }

    var MATRIX_OPTIONS = ['Matrix', 'Array']; // valid values for option matrix

    var NUMBER_OPTIONS = ['number', 'BigNumber', 'Fraction']; // valid values for option number

    function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

    var config =
    /* #__PURE__ */
    function config(options) {
      if (options) {
        throw new Error('The global config is readonly. \n' + 'Please create a mathjs instance if you want to change the default configuration. \n' + 'Example:\n' + '\n' + '  import { create, all } from \'mathjs\';\n' + '  const mathjs = create(all);\n' + '  mathjs.config({ number: \'BigNumber\' });\n');
      }

      return Object.freeze(DEFAULT_CONFIG);
    };

    _extends(config, DEFAULT_CONFIG, {
      MATRIX_OPTIONS: MATRIX_OPTIONS,
      NUMBER_OPTIONS: NUMBER_OPTIONS
    });

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var typedFunction = createCommonjsModule(function (module, exports) {

    (function (root, factory) {
      {
        // OldNode. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like OldNode.
        module.exports = factory();
      }
    }(commonjsGlobal, function () {

      function ok () {
        return true;
      }

      function notOk () {
        return false;
      }

      function undef () {
        return undefined;
      }

      /**
       * @typedef {{
       *   params: Param[],
       *   fn: function
       * }} Signature
       *
       * @typedef {{
       *   types: Type[],
       *   restParam: boolean
       * }} Param
       *
       * @typedef {{
       *   name: string,
       *   typeIndex: number,
       *   test: function,
       *   conversion?: ConversionDef,
       *   conversionIndex: number,
       * }} Type
       *
       * @typedef {{
       *   from: string,
       *   to: string,
       *   convert: function (*) : *
       * }} ConversionDef
       *
       * @typedef {{
       *   name: string,
       *   test: function(*) : boolean
       * }} TypeDef
       */

      // create a new instance of typed-function
      function create () {
        // data type tests
        var _types = [
          { name: 'number',    test: function (x) { return typeof x === 'number' } },
          { name: 'string',    test: function (x) { return typeof x === 'string' } },
          { name: 'boolean',   test: function (x) { return typeof x === 'boolean' } },
          { name: 'Function',  test: function (x) { return typeof x === 'function'} },
          { name: 'Array',     test: Array.isArray },
          { name: 'Date',      test: function (x) { return x instanceof Date } },
          { name: 'RegExp',    test: function (x) { return x instanceof RegExp } },
          { name: 'Object',    test: function (x) {
            return typeof x === 'object' && x !== null && x.constructor === Object
          }},
          { name: 'null',      test: function (x) { return x === null } },
          { name: 'undefined', test: function (x) { return x === undefined } }
        ];

        var anyType = {
          name: 'any',
          test: ok
        };

        // types which need to be ignored
        var _ignore = [];

        // type conversions
        var _conversions = [];

        // This is a temporary object, will be replaced with a typed function at the end
        var typed = {
          types: _types,
          conversions: _conversions,
          ignore: _ignore
        };

        /**
         * Find the test function for a type
         * @param {String} typeName
         * @return {TypeDef} Returns the type definition when found,
         *                    Throws a TypeError otherwise
         */
        function findTypeByName (typeName) {
          var entry = findInArray(typed.types, function (entry) {
            return entry.name === typeName;
          });

          if (entry) {
            return entry;
          }

          if (typeName === 'any') { // special baked-in case 'any'
            return anyType;
          }

          var hint = findInArray(typed.types, function (entry) {
            return entry.name.toLowerCase() === typeName.toLowerCase();
          });

          throw new TypeError('Unknown type "' + typeName + '"' +
              (hint ? ('. Did you mean "' + hint.name + '"?') : ''));
        }

        /**
         * Find the index of a type definition. Handles special case 'any'
         * @param {TypeDef} type
         * @return {number}
         */
        function findTypeIndex(type) {
          if (type === anyType) {
            return 999;
          }

          return typed.types.indexOf(type);
        }

        /**
         * Find a type that matches a value.
         * @param {*} value
         * @return {string} Returns the name of the first type for which
         *                  the type test matches the value.
         */
        function findTypeName(value) {
          var entry = findInArray(typed.types, function (entry) {
            return entry.test(value);
          });

          if (entry) {
            return entry.name;
          }

          throw new TypeError('Value has unknown type. Value: ' + value);
        }

        /**
         * Find a specific signature from a (composed) typed function, for example:
         *
         *   typed.find(fn, ['number', 'string'])
         *   typed.find(fn, 'number, string')
         *
         * Function find only only works for exact matches.
         *
         * @param {Function} fn                   A typed-function
         * @param {string | string[]} signature   Signature to be found, can be
         *                                        an array or a comma separated string.
         * @return {Function}                     Returns the matching signature, or
         *                                        throws an error when no signature
         *                                        is found.
         */
        function find (fn, signature) {
          if (!fn.signatures) {
            throw new TypeError('Function is no typed-function');
          }

          // normalize input
          var arr;
          if (typeof signature === 'string') {
            arr = signature.split(',');
            for (var i = 0; i < arr.length; i++) {
              arr[i] = arr[i].trim();
            }
          }
          else if (Array.isArray(signature)) {
            arr = signature;
          }
          else {
            throw new TypeError('String array or a comma separated string expected');
          }

          var str = arr.join(',');

          // find an exact match
          var match = fn.signatures[str];
          if (match) {
            return match;
          }

          // TODO: extend find to match non-exact signatures

          throw new TypeError('Signature not found (signature: ' + (fn.name || 'unnamed') + '(' + arr.join(', ') + '))');
        }

        /**
         * Convert a given value to another data type.
         * @param {*} value
         * @param {string} type
         */
        function convert (value, type) {
          var from = findTypeName(value);

          // check conversion is needed
          if (type === from) {
            return value;
          }

          for (var i = 0; i < typed.conversions.length; i++) {
            var conversion = typed.conversions[i];
            if (conversion.from === from && conversion.to === type) {
              return conversion.convert(value);
            }
          }

          throw new Error('Cannot convert from ' + from + ' to ' + type);
        }
        
        /**
         * Stringify parameters in a normalized way
         * @param {Param[]} params
         * @return {string}
         */
        function stringifyParams (params) {
          return params
              .map(function (param) {
                var typeNames = param.types.map(getTypeName);

                return (param.restParam ? '...' : '') + typeNames.join('|');
              })
              .join(',');
        }

        /**
         * Parse a parameter, like "...number | boolean"
         * @param {string} param
         * @param {ConversionDef[]} conversions
         * @return {Param} param
         */
        function parseParam (param, conversions) {
          var restParam = param.indexOf('...') === 0;
          var types = (!restParam)
              ? param
              : (param.length > 3)
                  ? param.slice(3)
                  : 'any';

          var typeNames = types.split('|').map(trim)
              .filter(notEmpty)
              .filter(notIgnore);

          var matchingConversions = filterConversions(conversions, typeNames);

          var exactTypes = typeNames.map(function (typeName) {
            var type = findTypeByName(typeName);

            return {
              name: typeName,
              typeIndex: findTypeIndex(type),
              test: type.test,
              conversion: null,
              conversionIndex: -1
            };
          });

          var convertibleTypes = matchingConversions.map(function (conversion) {
            var type = findTypeByName(conversion.from);

            return {
              name: conversion.from,
              typeIndex: findTypeIndex(type),
              test: type.test,
              conversion: conversion,
              conversionIndex: conversions.indexOf(conversion)
            };
          });

          return {
            types: exactTypes.concat(convertibleTypes),
            restParam: restParam
          };
        }

        /**
         * Parse a signature with comma separated parameters,
         * like "number | boolean, ...string"
         * @param {string} signature
         * @param {function} fn
         * @param {ConversionDef[]} conversions
         * @return {Signature | null} signature
         */
        function parseSignature (signature, fn, conversions) {
          var params = [];

          if (signature.trim() !== '') {
            params = signature
                .split(',')
                .map(trim)
                .map(function (param, index, array) {
                  var parsedParam = parseParam(param, conversions);

                  if (parsedParam.restParam && (index !== array.length - 1)) {
                    throw new SyntaxError('Unexpected rest parameter "' + param + '": ' +
                        'only allowed for the last parameter');
                  }

                  return parsedParam;
              });
          }

          if (params.some(isInvalidParam)) {
            // invalid signature: at least one parameter has no types
            // (they may have been filtered)
            return null;
          }

          return {
            params: params,
            fn: fn
          };
        }

        /**
         * Test whether a set of params contains a restParam
         * @param {Param[]} params
         * @return {boolean} Returns true when the last parameter is a restParam
         */
        function hasRestParam(params) {
          var param = last(params);
          return param ? param.restParam : false;
        }

        /**
         * Test whether a parameter contains conversions
         * @param {Param} param
         * @return {boolean} Returns true when at least one of the parameters
         *                   contains a conversion.
         */
        function hasConversions(param) {
          return param.types.some(function (type) {
            return type.conversion != null;
          });
        }

        /**
         * Create a type test for a single parameter, which can have one or multiple
         * types.
         * @param {Param} param
         * @return {function(x: *) : boolean} Returns a test function
         */
        function compileTest(param) {
          if (!param || param.types.length === 0) {
            // nothing to do
            return ok;
          }
          else if (param.types.length === 1) {
            return findTypeByName(param.types[0].name).test;
          }
          else if (param.types.length === 2) {
            var test0 = findTypeByName(param.types[0].name).test;
            var test1 = findTypeByName(param.types[1].name).test;
            return function or(x) {
              return test0(x) || test1(x);
            }
          }
          else { // param.types.length > 2
            var tests = param.types.map(function (type) {
              return findTypeByName(type.name).test;
            });
            return function or(x) {
              for (var i = 0; i < tests.length; i++) {
                if (tests[i](x)) {
                  return true;
                }
              }
              return false;
            }
          }
        }

        /**
         * Create a test for all parameters of a signature
         * @param {Param[]} params
         * @return {function(args: Array<*>) : boolean}
         */
        function compileTests(params) {
          var tests, test0, test1;

          if (hasRestParam(params)) {
            // variable arguments like '...number'
            tests = initial(params).map(compileTest);
            var varIndex = tests.length;
            var lastTest = compileTest(last(params));
            var testRestParam = function (args) {
              for (var i = varIndex; i < args.length; i++) {
                if (!lastTest(args[i])) {
                  return false;
                }
              }
              return true;
            };

            return function testArgs(args) {
              for (var i = 0; i < tests.length; i++) {
                if (!tests[i](args[i])) {
                  return false;
                }
              }
              return testRestParam(args) && (args.length >= varIndex + 1);
            };
          }
          else {
            // no variable arguments
            if (params.length === 0) {
              return function testArgs(args) {
                return args.length === 0;
              };
            }
            else if (params.length === 1) {
              test0 = compileTest(params[0]);
              return function testArgs(args) {
                return test0(args[0]) && args.length === 1;
              };
            }
            else if (params.length === 2) {
              test0 = compileTest(params[0]);
              test1 = compileTest(params[1]);
              return function testArgs(args) {
                return test0(args[0]) && test1(args[1]) && args.length === 2;
              };
            }
            else { // arguments.length > 2
              tests = params.map(compileTest);
              return function testArgs(args) {
                for (var i = 0; i < tests.length; i++) {
                  if (!tests[i](args[i])) {
                    return false;
                  }
                }
                return args.length === tests.length;
              };
            }
          }
        }

        /**
         * Find the parameter at a specific index of a signature.
         * Handles rest parameters.
         * @param {Signature} signature
         * @param {number} index
         * @return {Param | null} Returns the matching parameter when found,
         *                        null otherwise.
         */
        function getParamAtIndex(signature, index) {
          return index < signature.params.length
              ? signature.params[index]
              : hasRestParam(signature.params)
                  ? last(signature.params)
                  : null
        }

        /**
         * Get all type names of a parameter
         * @param {Signature} signature
         * @param {number} index
         * @param {boolean} excludeConversions
         * @return {string[]} Returns an array with type names
         */
        function getExpectedTypeNames (signature, index, excludeConversions) {
          var param = getParamAtIndex(signature, index);
          var types = param
              ? excludeConversions
                      ? param.types.filter(isExactType)
                      : param.types
              : [];

          return types.map(getTypeName);
        }

        /**
         * Returns the name of a type
         * @param {Type} type
         * @return {string} Returns the type name
         */
        function getTypeName(type) {
          return type.name;
        }

        /**
         * Test whether a type is an exact type or conversion
         * @param {Type} type
         * @return {boolean} Returns true when
         */
        function isExactType(type) {
          return type.conversion === null || type.conversion === undefined;
        }

        /**
         * Helper function for creating error messages: create an array with
         * all available types on a specific argument index.
         * @param {Signature[]} signatures
         * @param {number} index
         * @return {string[]} Returns an array with available types
         */
        function mergeExpectedParams(signatures, index) {
          var typeNames = uniq(flatMap(signatures, function (signature) {
            return getExpectedTypeNames(signature, index, false);
          }));

          return (typeNames.indexOf('any') !== -1) ? ['any'] : typeNames;
        }

        /**
         * Create
         * @param {string} name             The name of the function
         * @param {array.<*>} args          The actual arguments passed to the function
         * @param {Signature[]} signatures  A list with available signatures
         * @return {TypeError} Returns a type error with additional data
         *                     attached to it in the property `data`
         */
        function createError(name, args, signatures) {
          var err, expected;
          var _name = name || 'unnamed';

          // test for wrong type at some index
          var matchingSignatures = signatures;
          var index;
          for (index = 0; index < args.length; index++) {
            var nextMatchingDefs = matchingSignatures.filter(function (signature) {
              var test = compileTest(getParamAtIndex(signature, index));
              return (index < signature.params.length || hasRestParam(signature.params)) &&
                  test(args[index]);
            });

            if (nextMatchingDefs.length === 0) {
              // no matching signatures anymore, throw error "wrong type"
              expected = mergeExpectedParams(matchingSignatures, index);
              if (expected.length > 0) {
                var actualType = findTypeName(args[index]);

                err = new TypeError('Unexpected type of argument in function ' + _name +
                    ' (expected: ' + expected.join(' or ') +
                    ', actual: ' + actualType + ', index: ' + index + ')');
                err.data = {
                  category: 'wrongType',
                  fn: _name,
                  index: index,
                  actual: actualType,
                  expected: expected
                };
                return err;
              }
            }
            else {
              matchingSignatures = nextMatchingDefs;
            }
          }

          // test for too few arguments
          var lengths = matchingSignatures.map(function (signature) {
            return hasRestParam(signature.params) ? Infinity : signature.params.length;
          });
          if (args.length < Math.min.apply(null, lengths)) {
            expected = mergeExpectedParams(matchingSignatures, index);
            err = new TypeError('Too few arguments in function ' + _name +
                ' (expected: ' + expected.join(' or ') +
                ', index: ' + args.length + ')');
            err.data = {
              category: 'tooFewArgs',
              fn: _name,
              index: args.length,
              expected: expected
            };
            return err;
          }

          // test for too many arguments
          var maxLength = Math.max.apply(null, lengths);
          if (args.length > maxLength) {
            err = new TypeError('Too many arguments in function ' + _name +
                ' (expected: ' + maxLength + ', actual: ' + args.length + ')');
            err.data = {
              category: 'tooManyArgs',
              fn: _name,
              index: args.length,
              expectedLength: maxLength
            };
            return err;
          }

          err = new TypeError('Arguments of type "' + args.join(', ') +
              '" do not match any of the defined signatures of function ' + _name + '.');
          err.data = {
            category: 'mismatch',
            actual: args.map(findTypeName)
          };
          return err;
        }

        /**
         * Find the lowest index of all exact types of a parameter (no conversions)
         * @param {Param} param
         * @return {number} Returns the index of the lowest type in typed.types
         */
        function getLowestTypeIndex (param) {
          var min = 999;

          for (var i = 0; i < param.types.length; i++) {
            if (isExactType(param.types[i])) {
              min = Math.min(min, param.types[i].typeIndex);
            }
          }

          return min;
        }

        /**
         * Find the lowest index of the conversion of all types of the parameter
         * having a conversion
         * @param {Param} param
         * @return {number} Returns the lowest index of the conversions of this type
         */
        function getLowestConversionIndex (param) {
          var min = 999;

          for (var i = 0; i < param.types.length; i++) {
            if (!isExactType(param.types[i])) {
              min = Math.min(min, param.types[i].conversionIndex);
            }
          }

          return min;
        }

        /**
         * Compare two params
         * @param {Param} param1
         * @param {Param} param2
         * @return {number} returns a negative number when param1 must get a lower
         *                  index than param2, a positive number when the opposite,
         *                  or zero when both are equal
         */
        function compareParams (param1, param2) {
          var c;

          // compare having a rest parameter or not
          c = param1.restParam - param2.restParam;
          if (c !== 0) {
            return c;
          }

          // compare having conversions or not
          c = hasConversions(param1) - hasConversions(param2);
          if (c !== 0) {
            return c;
          }

          // compare the index of the types
          c = getLowestTypeIndex(param1) - getLowestTypeIndex(param2);
          if (c !== 0) {
            return c;
          }

          // compare the index of any conversion
          return getLowestConversionIndex(param1) - getLowestConversionIndex(param2);
        }

        /**
         * Compare two signatures
         * @param {Signature} signature1
         * @param {Signature} signature2
         * @return {number} returns a negative number when param1 must get a lower
         *                  index than param2, a positive number when the opposite,
         *                  or zero when both are equal
         */
        function compareSignatures (signature1, signature2) {
          var len = Math.min(signature1.params.length, signature2.params.length);
          var i;
          var c;

          // compare whether the params have conversions at all or not
          c = signature1.params.some(hasConversions) - signature2.params.some(hasConversions);
          if (c !== 0) {
            return c;
          }

          // next compare whether the params have conversions one by one
          for (i = 0; i < len; i++) {
            c = hasConversions(signature1.params[i]) - hasConversions(signature2.params[i]);
            if (c !== 0) {
              return c;
            }
          }

          // compare the types of the params one by one
          for (i = 0; i < len; i++) {
            c = compareParams(signature1.params[i], signature2.params[i]);
            if (c !== 0) {
              return c;
            }
          }

          // compare the number of params
          return signature1.params.length - signature2.params.length;
        }

        /**
         * Get params containing all types that can be converted to the defined types.
         *
         * @param {ConversionDef[]} conversions
         * @param {string[]} typeNames
         * @return {ConversionDef[]} Returns the conversions that are available
         *                        for every type (if any)
         */
        function filterConversions(conversions, typeNames) {
          var matches = {};

          conversions.forEach(function (conversion) {
            if (typeNames.indexOf(conversion.from) === -1 &&
                typeNames.indexOf(conversion.to) !== -1 &&
                !matches[conversion.from]) {
              matches[conversion.from] = conversion;
            }
          });

          return Object.keys(matches).map(function (from) {
            return matches[from];
          });
        }

        /**
         * Preprocess arguments before calling the original function:
         * - if needed convert the parameters
         * - in case of rest parameters, move the rest parameters into an Array
         * @param {Param[]} params
         * @param {function} fn
         * @return {function} Returns a wrapped function
         */
        function compileArgsPreprocessing(params, fn) {
          var fnConvert = fn;

          // TODO: can we make this wrapper function smarter/simpler?

          if (params.some(hasConversions)) {
            var restParam = hasRestParam(params);
            var compiledConversions = params.map(compileArgConversion);

            fnConvert = function convertArgs() {
              var args = [];
              var last = restParam ? arguments.length - 1 : arguments.length;
              for (var i = 0; i < last; i++) {
                args[i] = compiledConversions[i](arguments[i]);
              }
              if (restParam) {
                args[last] = arguments[last].map(compiledConversions[last]);
              }

              return fn.apply(null, args);
            };
          }

          var fnPreprocess = fnConvert;
          if (hasRestParam(params)) {
            var offset = params.length - 1;

            fnPreprocess = function preprocessRestParams () {
              return fnConvert.apply(null,
                  slice(arguments, 0, offset).concat([slice(arguments, offset)]));
            };
          }

          return fnPreprocess;
        }

        /**
         * Compile conversion for a parameter to the right type
         * @param {Param} param
         * @return {function} Returns the wrapped function that will convert arguments
         *
         */
        function compileArgConversion(param) {
          var test0, test1, conversion0, conversion1;
          var tests = [];
          var conversions = [];

          param.types.forEach(function (type) {
            if (type.conversion) {
              tests.push(findTypeByName(type.conversion.from).test);
              conversions.push(type.conversion.convert);
            }
          });

          // create optimized conversion functions depending on the number of conversions
          switch (conversions.length) {
            case 0:
              return function convertArg(arg) {
                return arg;
              }

            case 1:
              test0 = tests[0];
              conversion0 = conversions[0];
              return function convertArg(arg) {
                if (test0(arg)) {
                  return conversion0(arg)
                }
                return arg;
              }

            case 2:
              test0 = tests[0];
              test1 = tests[1];
              conversion0 = conversions[0];
              conversion1 = conversions[1];
              return function convertArg(arg) {
                if (test0(arg)) {
                  return conversion0(arg)
                }
                if (test1(arg)) {
                  return conversion1(arg)
                }
                return arg;
              }

            default:
              return function convertArg(arg) {
                for (var i = 0; i < conversions.length; i++) {
                  if (tests[i](arg)) {
                    return conversions[i](arg);
                  }
                }
                return arg;
              }
          }
        }

        /**
         * Convert an array with signatures into a map with signatures,
         * where signatures with union types are split into separate signatures
         *
         * Throws an error when there are conflicting types
         *
         * @param {Signature[]} signatures
         * @return {Object.<string, function>}  Returns a map with signatures
         *                                      as key and the original function
         *                                      of this signature as value.
         */
        function createSignaturesMap(signatures) {
          var signaturesMap = {};
          signatures.forEach(function (signature) {
            if (!signature.params.some(hasConversions)) {
              splitParams(signature.params, true).forEach(function (params) {
                signaturesMap[stringifyParams(params)] = signature.fn;
              });
            }
          });

          return signaturesMap;
        }

        /**
         * Split params with union types in to separate params.
         *
         * For example:
         *
         *     splitParams([['Array', 'Object'], ['string', 'RegExp'])
         *     // returns:
         *     // [
         *     //   ['Array', 'string'],
         *     //   ['Array', 'RegExp'],
         *     //   ['Object', 'string'],
         *     //   ['Object', 'RegExp']
         *     // ]
         *
         * @param {Param[]} params
         * @param {boolean} ignoreConversionTypes
         * @return {Param[]}
         */
        function splitParams(params, ignoreConversionTypes) {
          function _splitParams(params, index, types) {
            if (index < params.length) {
              var param = params[index];
              var filteredTypes = ignoreConversionTypes
                  ? param.types.filter(isExactType)
                  : param.types;
              var typeGroups;

              if (param.restParam) {
                // split the types of a rest parameter in two:
                // one with only exact types, and one with exact types and conversions
                var exactTypes = filteredTypes.filter(isExactType);
                typeGroups = exactTypes.length < filteredTypes.length
                    ? [exactTypes, filteredTypes]
                    : [filteredTypes];

              }
              else {
                // split all the types of a regular parameter into one type per group
                typeGroups = filteredTypes.map(function (type) {
                  return [type]
                });
              }

              // recurse over the groups with types
              return flatMap(typeGroups, function (typeGroup) {
                return _splitParams(params, index + 1, types.concat([typeGroup]));
              });

            }
            else {
              // we've reached the end of the parameters. Now build a new Param
              var splittedParams = types.map(function (type, typeIndex) {
                return {
                  types: type,
                  restParam: (typeIndex === params.length - 1) && hasRestParam(params)
                }
              });

              return [splittedParams];
            }
          }

          return _splitParams(params, 0, []);
        }

        /**
         * Test whether two signatures have a conflicting signature
         * @param {Signature} signature1
         * @param {Signature} signature2
         * @return {boolean} Returns true when the signatures conflict, false otherwise.
         */
        function hasConflictingParams(signature1, signature2) {
          var ii = Math.max(signature1.params.length, signature2.params.length);

          for (var i = 0; i < ii; i++) {
            var typesNames1 = getExpectedTypeNames(signature1, i, true);
            var typesNames2 = getExpectedTypeNames(signature2, i, true);

            if (!hasOverlap(typesNames1, typesNames2)) {
              return false;
            }
          }

          var len1 = signature1.params.length;
          var len2 = signature2.params.length;
          var restParam1 = hasRestParam(signature1.params);
          var restParam2 = hasRestParam(signature2.params);

          return restParam1
              ? restParam2 ? (len1 === len2) : (len2 >= len1)
              : restParam2 ? (len1 >= len2)  : (len1 === len2)
        }

        /**
         * Create a typed function
         * @param {String} name               The name for the typed function
         * @param {Object.<string, function>} signaturesMap
         *                                    An object with one or
         *                                    multiple signatures as key, and the
         *                                    function corresponding to the
         *                                    signature as value.
         * @return {function}  Returns the created typed function.
         */
        function createTypedFunction(name, signaturesMap) {
          if (Object.keys(signaturesMap).length === 0) {
            throw new SyntaxError('No signatures provided');
          }

          // parse the signatures, and check for conflicts
          var parsedSignatures = [];
          Object.keys(signaturesMap)
              .map(function (signature) {
                return parseSignature(signature, signaturesMap[signature], typed.conversions);
              })
              .filter(notNull)
              .forEach(function (parsedSignature) {
                // check whether this parameter conflicts with already parsed signatures
                var conflictingSignature = findInArray(parsedSignatures, function (s) {
                  return hasConflictingParams(s, parsedSignature)
                });
                if (conflictingSignature) {
                  throw new TypeError('Conflicting signatures "' +
                      stringifyParams(conflictingSignature.params) + '" and "' +
                      stringifyParams(parsedSignature.params) + '".');
                }

                parsedSignatures.push(parsedSignature);
              });

          // split and filter the types of the signatures, and then order them
          var signatures = flatMap(parsedSignatures, function (parsedSignature) {
            var params = parsedSignature ? splitParams(parsedSignature.params, false) : [];

            return params.map(function (params) {
              return {
                params: params,
                fn: parsedSignature.fn
              };
            });
          }).filter(notNull);

          signatures.sort(compareSignatures);

          // we create a highly optimized checks for the first couple of signatures with max 2 arguments
          var ok0 = signatures[0] && signatures[0].params.length <= 2 && !hasRestParam(signatures[0].params);
          var ok1 = signatures[1] && signatures[1].params.length <= 2 && !hasRestParam(signatures[1].params);
          var ok2 = signatures[2] && signatures[2].params.length <= 2 && !hasRestParam(signatures[2].params);
          var ok3 = signatures[3] && signatures[3].params.length <= 2 && !hasRestParam(signatures[3].params);
          var ok4 = signatures[4] && signatures[4].params.length <= 2 && !hasRestParam(signatures[4].params);
          var ok5 = signatures[5] && signatures[5].params.length <= 2 && !hasRestParam(signatures[5].params);
          var allOk = ok0 && ok1 && ok2 && ok3 && ok4 && ok5;

          // compile the tests
          var tests = signatures.map(function (signature) {
            return compileTests(signature.params);
          });

          var test00 = ok0 ? compileTest(signatures[0].params[0]) : notOk;
          var test10 = ok1 ? compileTest(signatures[1].params[0]) : notOk;
          var test20 = ok2 ? compileTest(signatures[2].params[0]) : notOk;
          var test30 = ok3 ? compileTest(signatures[3].params[0]) : notOk;
          var test40 = ok4 ? compileTest(signatures[4].params[0]) : notOk;
          var test50 = ok5 ? compileTest(signatures[5].params[0]) : notOk;

          var test01 = ok0 ? compileTest(signatures[0].params[1]) : notOk;
          var test11 = ok1 ? compileTest(signatures[1].params[1]) : notOk;
          var test21 = ok2 ? compileTest(signatures[2].params[1]) : notOk;
          var test31 = ok3 ? compileTest(signatures[3].params[1]) : notOk;
          var test41 = ok4 ? compileTest(signatures[4].params[1]) : notOk;
          var test51 = ok5 ? compileTest(signatures[5].params[1]) : notOk;

          // compile the functions
          var fns = signatures.map(function(signature) {
            return compileArgsPreprocessing(signature.params, signature.fn)
          });

          var fn0 = ok0 ? fns[0] : undef;
          var fn1 = ok1 ? fns[1] : undef;
          var fn2 = ok2 ? fns[2] : undef;
          var fn3 = ok3 ? fns[3] : undef;
          var fn4 = ok4 ? fns[4] : undef;
          var fn5 = ok5 ? fns[5] : undef;

          var len0 = ok0 ? signatures[0].params.length : -1;
          var len1 = ok1 ? signatures[1].params.length : -1;
          var len2 = ok2 ? signatures[2].params.length : -1;
          var len3 = ok3 ? signatures[3].params.length : -1;
          var len4 = ok4 ? signatures[4].params.length : -1;
          var len5 = ok5 ? signatures[5].params.length : -1;

          // simple and generic, but also slow
          var iStart = allOk ? 6 : 0;
          var iEnd = signatures.length;
          var generic = function generic() {

            for (var i = iStart; i < iEnd; i++) {
              if (tests[i](arguments)) {
                return fns[i].apply(null, arguments);
              }
            }

            throw createError(name, arguments, signatures);
          };

          // create the typed function
          // fast, specialized version. Falls back to the slower, generic one if needed
          var fn = function fn(arg0, arg1) {

            if (arguments.length === len0 && test00(arg0) && test01(arg1)) { return fn0.apply(null, arguments); }
            if (arguments.length === len1 && test10(arg0) && test11(arg1)) { return fn1.apply(null, arguments); }
            if (arguments.length === len2 && test20(arg0) && test21(arg1)) { return fn2.apply(null, arguments); }
            if (arguments.length === len3 && test30(arg0) && test31(arg1)) { return fn3.apply(null, arguments); }
            if (arguments.length === len4 && test40(arg0) && test41(arg1)) { return fn4.apply(null, arguments); }
            if (arguments.length === len5 && test50(arg0) && test51(arg1)) { return fn5.apply(null, arguments); }

            return generic.apply(null, arguments);
          };

          // attach name the typed function
          try {
            Object.defineProperty(fn, 'name', {value: name});
          }
          catch (err) {
            // old browsers do not support Object.defineProperty and some don't support setting the name property
            // the function name is not essential for the functioning, it's mostly useful for debugging,
            // so it's fine to have unnamed functions.
          }

          // attach signatures to the function
          fn.signatures = createSignaturesMap(signatures);

          return fn;
        }

        /**
         * Test whether a type should be NOT be ignored
         * @param {string} typeName
         * @return {boolean}
         */
        function notIgnore(typeName) {
          return typed.ignore.indexOf(typeName) === -1;
        }

        /**
         * trim a string
         * @param {string} str
         * @return {string}
         */
        function trim(str) {
          return str.trim();
        }

        /**
         * Test whether a string is not empty
         * @param {string} str
         * @return {boolean}
         */
        function notEmpty(str) {
          return !!str;
        }

        /**
         * test whether a value is not strict equal to null
         * @param {*} value
         * @return {boolean}
         */
        function notNull(value) {
          return value !== null;
        }

        /**
         * Test whether a parameter has no types defined
         * @param {Param} param
         * @return {boolean}
         */
        function isInvalidParam (param) {
          return param.types.length === 0;
        }

        /**
         * Return all but the last items of an array
         * @param {Array} arr
         * @return {Array}
         */
        function initial(arr) {
          return arr.slice(0, arr.length - 1);
        }

        /**
         * return the last item of an array
         * @param {Array} arr
         * @return {*}
         */
        function last(arr) {
          return arr[arr.length - 1];
        }

        /**
         * Slice an array or function Arguments
         * @param {Array | Arguments | IArguments} arr
         * @param {number} start
         * @param {number} [end]
         * @return {Array}
         */
        function slice(arr, start, end) {
          return Array.prototype.slice.call(arr, start, end);
        }

        /**
         * Test whether an array contains some item
         * @param {Array} array
         * @param {*} item
         * @return {boolean} Returns true if array contains item, false if not.
         */
        function contains(array, item) {
          return array.indexOf(item) !== -1;
        }

        /**
         * Test whether two arrays have overlapping items
         * @param {Array} array1
         * @param {Array} array2
         * @return {boolean} Returns true when at least one item exists in both arrays
         */
        function hasOverlap(array1, array2) {
          for (var i = 0; i < array1.length; i++) {
            if (contains(array2, array1[i])) {
              return true;
            }
          }

          return false;
        }

        /**
         * Return the first item from an array for which test(arr[i]) returns true
         * @param {Array} arr
         * @param {function} test
         * @return {* | undefined} Returns the first matching item
         *                         or undefined when there is no match
         */
        function findInArray(arr, test) {
          for (var i = 0; i < arr.length; i++) {
            if (test(arr[i])) {
              return arr[i];
            }
          }
          return undefined;
        }

        /**
         * Filter unique items of an array with strings
         * @param {string[]} arr
         * @return {string[]}
         */
        function uniq(arr) {
          var entries = {};
          for (var i = 0; i < arr.length; i++) {
            entries[arr[i]] = true;
          }
          return Object.keys(entries);
        }

        /**
         * Flat map the result invoking a callback for every item in an array.
         * https://gist.github.com/samgiles/762ee337dff48623e729
         * @param {Array} arr
         * @param {function} callback
         * @return {Array}
         */
        function flatMap(arr, callback) {
          return Array.prototype.concat.apply([], arr.map(callback));
        }

        /**
         * Retrieve the function name from a set of typed functions,
         * and check whether the name of all functions match (if given)
         * @param {function[]} fns
         */
        function getName (fns) {
          var name = '';

          for (var i = 0; i < fns.length; i++) {
            var fn = fns[i];

            // check whether the names are the same when defined
            if ((typeof fn.signatures === 'object' || typeof fn.signature === 'string') && fn.name !== '') {
              if (name === '') {
                name = fn.name;
              }
              else if (name !== fn.name) {
                var err = new Error('Function names do not match (expected: ' + name + ', actual: ' + fn.name + ')');
                err.data = {
                  actual: fn.name,
                  expected: name
                };
                throw err;
              }
            }
          }

          return name;
        }

        // extract and merge all signatures of a list with typed functions
        function extractSignatures(fns) {
          var err;
          var signaturesMap = {};

          function validateUnique(_signature, _fn) {
            if (signaturesMap.hasOwnProperty(_signature) && _fn !== signaturesMap[_signature]) {
              err = new Error('Signature "' + _signature + '" is defined twice');
              err.data = {signature: _signature};
              throw err;
              // else: both signatures point to the same function, that's fine
            }
          }

          for (var i = 0; i < fns.length; i++) {
            var fn = fns[i];

            // test whether this is a typed-function
            if (typeof fn.signatures === 'object') {
              // merge the signatures
              for (var signature in fn.signatures) {
                if (fn.signatures.hasOwnProperty(signature)) {
                  validateUnique(signature, fn.signatures[signature]);
                  signaturesMap[signature] = fn.signatures[signature];
                }
              }
            }
            else if (typeof fn.signature === 'string') {
              validateUnique(fn.signature, fn);
              signaturesMap[fn.signature] = fn;
            }
            else {
              err = new TypeError('Function is no typed-function (index: ' + i + ')');
              err.data = {index: i};
              throw err;
            }
          }

          return signaturesMap;
        }

        typed = createTypedFunction('typed', {
          'string, Object': createTypedFunction,
          'Object': function (signaturesMap) {
            // find existing name
            var fns = [];
            for (var signature in signaturesMap) {
              if (signaturesMap.hasOwnProperty(signature)) {
                fns.push(signaturesMap[signature]);
              }
            }
            var name = getName(fns);
            return createTypedFunction(name, signaturesMap);
          },
          '...Function': function (fns) {
            return createTypedFunction(getName(fns), extractSignatures(fns));
          },
          'string, ...Function': function (name, fns) {
            return createTypedFunction(name, extractSignatures(fns));
          }
        });

        typed.create = create;
        typed.types = _types;
        typed.conversions = _conversions;
        typed.ignore = _ignore;
        typed.convert = convert;
        typed.find = find;

        /**
         * add a type
         * @param {{name: string, test: function}} type
         * @param {boolean} [beforeObjectTest=true]
         *                          If true, the new test will be inserted before
         *                          the test with name 'Object' (if any), since
         *                          tests for Object match Array and classes too.
         */
        typed.addType = function (type, beforeObjectTest) {
          if (!type || typeof type.name !== 'string' || typeof type.test !== 'function') {
            throw new TypeError('Object with properties {name: string, test: function} expected');
          }

          if (beforeObjectTest !== false) {
            for (var i = 0; i < typed.types.length; i++) {
              if (typed.types[i].name === 'Object') {
                typed.types.splice(i, 0, type);
                return
              }
            }
          }

          typed.types.push(type);
        };

        // add a conversion
        typed.addConversion = function (conversion) {
          if (!conversion
              || typeof conversion.from !== 'string'
              || typeof conversion.to !== 'string'
              || typeof conversion.convert !== 'function') {
            throw new TypeError('Object with properties {from: string, to: string, convert: function} expected');
          }

          typed.conversions.push(conversion);
        };

        return typed;
      }

      return create();
    }));
    });

    /**
     * @typedef {{sign: '+' | '-' | '', coefficients: number[], exponent: number}} SplitValue
     */

    /**
     * Check if a number is integer
     * @param {number | boolean} value
     * @return {boolean} isInteger
     */

    function isInteger(value) {
      if (typeof value === 'boolean') {
        return true;
      }

      return isFinite(value) ? value === Math.round(value) : false; // Note: we use ==, not ===, as we can have Booleans as well
    }
    /**
     * Convert a number to a formatted string representation.
     *
     * Syntax:
     *
     *    format(value)
     *    format(value, options)
     *    format(value, precision)
     *    format(value, fn)
     *
     * Where:
     *
     *    {number} value   The value to be formatted
     *    {Object} options An object with formatting options. Available options:
     *                     {string} notation
     *                         Number notation. Choose from:
     *                         'fixed'          Always use regular number notation.
     *                                          For example '123.40' and '14000000'
     *                         'exponential'    Always use exponential notation.
     *                                          For example '1.234e+2' and '1.4e+7'
     *                         'engineering'    Always use engineering notation.
     *                                          For example '123.4e+0' and '14.0e+6'
     *                         'auto' (default) Regular number notation for numbers
     *                                          having an absolute value between
     *                                          `lowerExp` and `upperExp` bounds, and
     *                                          uses exponential notation elsewhere.
     *                                          Lower bound is included, upper bound
     *                                          is excluded.
     *                                          For example '123.4' and '1.4e7'.
     *                     {number} precision   A number between 0 and 16 to round
     *                                          the digits of the number.
     *                                          In case of notations 'exponential',
     *                                          'engineering', and 'auto',
     *                                          `precision` defines the total
     *                                          number of significant digits returned.
     *                                          In case of notation 'fixed',
     *                                          `precision` defines the number of
     *                                          significant digits after the decimal
     *                                          point.
     *                                          `precision` is undefined by default,
     *                                          not rounding any digits.
     *                     {number} lowerExp    Exponent determining the lower boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `-3`.
     *                     {number} upperExp    Exponent determining the upper boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `5`.
     *    {Function} fn    A custom formatting function. Can be used to override the
     *                     built-in notations. Function `fn` is called with `value` as
     *                     parameter and must return a string. Is useful for example to
     *                     format all values inside a matrix in a particular way.
     *
     * Examples:
     *
     *    format(6.4)                                        // '6.4'
     *    format(1240000)                                    // '1.24e6'
     *    format(1/3)                                        // '0.3333333333333333'
     *    format(1/3, 3)                                     // '0.333'
     *    format(21385, 2)                                   // '21000'
     *    format(12.071, {notation: 'fixed'})                // '12'
     *    format(2.3,    {notation: 'fixed', precision: 2})  // '2.30'
     *    format(52.8,   {notation: 'exponential'})          // '5.28e+1'
     *    format(12345678, {notation: 'engineering'})        // '12.345678e+6'
     *
     * @param {number} value
     * @param {Object | Function | number} [options]
     * @return {string} str The formatted value
     */

    function format(value, options) {
      if (typeof options === 'function') {
        // handle format(value, fn)
        return options(value);
      } // handle special cases


      if (value === Infinity) {
        return 'Infinity';
      } else if (value === -Infinity) {
        return '-Infinity';
      } else if (isNaN(value)) {
        return 'NaN';
      } // default values for options


      var notation = 'auto';
      var precision;

      if (options) {
        // determine notation from options
        if (options.notation) {
          notation = options.notation;
        } // determine precision from options


        if (isNumber(options)) {
          precision = options;
        } else if (isNumber(options.precision)) {
          precision = options.precision;
        }
      } // handle the various notations


      switch (notation) {
        case 'fixed':
          return toFixed(value, precision);

        case 'exponential':
          return toExponential(value, precision);

        case 'engineering':
          return toEngineering(value, precision);

        case 'auto':
          // TODO: clean up some day. Deprecated since: 2018-01-24
          // @deprecated upper and lower are replaced with upperExp and lowerExp since v4.0.0
          if (options && options.exponential && (options.exponential.lower !== undefined || options.exponential.upper !== undefined)) {
            var fixedOptions = mapObject(options, function (x) {
              return x;
            });
            fixedOptions.exponential = undefined;

            if (options.exponential.lower !== undefined) {
              fixedOptions.lowerExp = Math.round(Math.log(options.exponential.lower) / Math.LN10);
            }

            if (options.exponential.upper !== undefined) {
              fixedOptions.upperExp = Math.round(Math.log(options.exponential.upper) / Math.LN10);
            }

            console.warn('Deprecation warning: Formatting options exponential.lower and exponential.upper ' + '(minimum and maximum value) ' + 'are replaced with exponential.lowerExp and exponential.upperExp ' + '(minimum and maximum exponent) since version 4.0.0. ' + 'Replace ' + JSON.stringify(options) + ' with ' + JSON.stringify(fixedOptions));
            return toPrecision(value, precision, fixedOptions);
          } // remove trailing zeros after the decimal point


          return toPrecision(value, precision, options && options).replace(/((\.\d*?)(0+))($|e)/, function () {
            var digits = arguments[2];
            var e = arguments[4];
            return digits !== '.' ? digits + e : e;
          });

        default:
          throw new Error('Unknown notation "' + notation + '". ' + 'Choose "auto", "exponential", or "fixed".');
      }
    }
    /**
     * Split a number into sign, coefficients, and exponent
     * @param {number | string} value
     * @return {SplitValue}
     *              Returns an object containing sign, coefficients, and exponent
     */

    function splitNumber(value) {
      // parse the input value
      var match = String(value).toLowerCase().match(/^0*?(-?)(\d+\.?\d*)(e([+-]?\d+))?$/);

      if (!match) {
        throw new SyntaxError('Invalid number ' + value);
      }

      var sign = match[1];
      var digits = match[2];
      var exponent = parseFloat(match[4] || '0');
      var dot = digits.indexOf('.');
      exponent += dot !== -1 ? dot - 1 : digits.length - 1;
      var coefficients = digits.replace('.', '') // remove the dot (must be removed before removing leading zeros)
      .replace(/^0*/, function (zeros) {
        // remove leading zeros, add their count to the exponent
        exponent -= zeros.length;
        return '';
      }).replace(/0*$/, '') // remove trailing zeros
      .split('').map(function (d) {
        return parseInt(d);
      });

      if (coefficients.length === 0) {
        coefficients.push(0);
        exponent++;
      }

      return {
        sign: sign,
        coefficients: coefficients,
        exponent: exponent
      };
    }
    /**
     * Format a number in engineering notation. Like '1.23e+6', '2.3e+0', '3.500e-3'
     * @param {number | string} value
     * @param {number} [precision]        Optional number of significant figures to return.
     */

    function toEngineering(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }

      var rounded = roundDigits(splitNumber(value), precision);
      var e = rounded.exponent;
      var c = rounded.coefficients; // find nearest lower multiple of 3 for exponent

      var newExp = e % 3 === 0 ? e : e < 0 ? e - 3 - e % 3 : e - e % 3;

      if (isNumber(precision)) {
        // add zeroes to give correct sig figs
        while (precision > c.length || e - newExp + 1 > c.length) {
          c.push(0);
        }
      } else {
        // concatenate coefficients with necessary zeros
        var significandsDiff = e >= 0 ? e : Math.abs(newExp); // add zeros if necessary (for ex: 1e+8)

        while (c.length - 1 < significandsDiff) {
          c.push(0);
        }
      } // find difference in exponents


      var expDiff = Math.abs(e - newExp);
      var decimalIdx = 1; // push decimal index over by expDiff times

      while (expDiff > 0) {
        decimalIdx++;
        expDiff--;
      } // if all coefficient values are zero after the decimal point and precision is unset, don't add a decimal value.
      // otherwise concat with the rest of the coefficients


      var decimals = c.slice(decimalIdx).join('');
      var decimalVal = isNumber(precision) && decimals.length || decimals.match(/[1-9]/) ? '.' + decimals : '';
      var str = c.slice(0, decimalIdx).join('') + decimalVal + 'e' + (e >= 0 ? '+' : '') + newExp.toString();
      return rounded.sign + str;
    }
    /**
     * Format a number with fixed notation.
     * @param {number | string} value
     * @param {number} [precision=undefined]  Optional number of decimals after the
     *                                        decimal point. null by default.
     */

    function toFixed(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      }

      var splitValue = splitNumber(value);
      var rounded = typeof precision === 'number' ? roundDigits(splitValue, splitValue.exponent + 1 + precision) : splitValue;
      var c = rounded.coefficients;
      var p = rounded.exponent + 1; // exponent may have changed
      // append zeros if needed

      var pp = p + (precision || 0);

      if (c.length < pp) {
        c = c.concat(zeros(pp - c.length));
      } // prepend zeros if needed


      if (p < 0) {
        c = zeros(-p + 1).concat(c);
        p = 1;
      } // insert a dot if needed


      if (p < c.length) {
        c.splice(p, 0, p === 0 ? '0.' : '.');
      }

      return rounded.sign + c.join('');
    }
    /**
     * Format a number in exponential notation. Like '1.23e+5', '2.3e+0', '3.500e-3'
     * @param {number | string} value
     * @param {number} [precision]  Number of digits in formatted output.
     *                              If not provided, the maximum available digits
     *                              is used.
     */

    function toExponential(value, precision) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      } // round if needed, else create a clone


      var split = splitNumber(value);
      var rounded = precision ? roundDigits(split, precision) : split;
      var c = rounded.coefficients;
      var e = rounded.exponent; // append zeros if needed

      if (c.length < precision) {
        c = c.concat(zeros(precision - c.length));
      } // format as `C.CCCe+EEE` or `C.CCCe-EEE`


      var first = c.shift();
      return rounded.sign + first + (c.length > 0 ? '.' + c.join('') : '') + 'e' + (e >= 0 ? '+' : '') + e;
    }
    /**
     * Format a number with a certain precision
     * @param {number | string} value
     * @param {number} [precision=undefined] Optional number of digits.
     * @param {{lowerExp: number | undefined, upperExp: number | undefined}} [options]
     *                                       By default:
     *                                         lowerExp = -3 (incl)
     *                                         upper = +5 (excl)
     * @return {string}
     */

    function toPrecision(value, precision, options) {
      if (isNaN(value) || !isFinite(value)) {
        return String(value);
      } // determine lower and upper bound for exponential notation.


      var lowerExp = options && options.lowerExp !== undefined ? options.lowerExp : -3;
      var upperExp = options && options.upperExp !== undefined ? options.upperExp : 5;
      var split = splitNumber(value);
      var rounded = precision ? roundDigits(split, precision) : split;

      if (rounded.exponent < lowerExp || rounded.exponent >= upperExp) {
        // exponential notation
        return toExponential(value, precision);
      } else {
        var c = rounded.coefficients;
        var e = rounded.exponent; // append trailing zeros

        if (c.length < precision) {
          c = c.concat(zeros(precision - c.length));
        } // append trailing zeros
        // TODO: simplify the next statement


        c = c.concat(zeros(e - c.length + 1 + (c.length < precision ? precision - c.length : 0))); // prepend zeros

        c = zeros(-e).concat(c);
        var dot = e > 0 ? e : 0;

        if (dot < c.length - 1) {
          c.splice(dot + 1, 0, '.');
        }

        return rounded.sign + c.join('');
      }
    }
    /**
     * Round the number of digits of a number *
     * @param {SplitValue} split       A value split with .splitNumber(value)
     * @param {number} precision  A positive integer
     * @return {SplitValue}
     *              Returns an object containing sign, coefficients, and exponent
     *              with rounded digits
     */

    function roundDigits(split, precision) {
      // create a clone
      var rounded = {
        sign: split.sign,
        coefficients: split.coefficients,
        exponent: split.exponent
      };
      var c = rounded.coefficients; // prepend zeros if needed

      while (precision <= 0) {
        c.unshift(0);
        rounded.exponent++;
        precision++;
      }

      if (c.length > precision) {
        var removed = c.splice(precision, c.length - precision);

        if (removed[0] >= 5) {
          var i = precision - 1;
          c[i]++;

          while (c[i] === 10) {
            c.pop();

            if (i === 0) {
              c.unshift(0);
              rounded.exponent++;
              i++;
            }

            i--;
            c[i]++;
          }
        }
      }

      return rounded;
    }
    /**
     * Create an array filled with zeros.
     * @param {number} length
     * @return {Array}
     */

    function zeros(length) {
      var arr = [];

      for (var i = 0; i < length; i++) {
        arr.push(0);
      }

      return arr;
    }
    /**
     * Count the number of significant digits of a number.
     *
     * For example:
     *   2.34 returns 3
     *   0.0034 returns 2
     *   120.5e+30 returns 4
     *
     * @param {number} value
     * @return {number} digits   Number of significant digits
     */


    function digits(value) {
      return value.toExponential().replace(/e.*$/, '') // remove exponential notation
      .replace(/^0\.?0*|\./, '') // remove decimal point and leading zeros
      .length;
    }
    /**
     * Minimum number added to one that makes the result different than one
     */

    var DBL_EPSILON = Number.EPSILON || 2.2204460492503130808472633361816E-16;
    /**
     * Compares two floating point numbers.
     * @param {number} x          First value to compare
     * @param {number} y          Second value to compare
     * @param {number} [epsilon]  The maximum relative difference between x and y
     *                            If epsilon is undefined or null, the function will
     *                            test whether x and y are exactly equal.
     * @return {boolean} whether the two numbers are nearly equal
    */

    function nearlyEqual(x, y, epsilon) {
      // if epsilon is null or undefined, test whether x and y are exactly equal
      if (epsilon === null || epsilon === undefined) {
        return x === y;
      }

      if (x === y) {
        return true;
      } // NaN


      if (isNaN(x) || isNaN(y)) {
        return false;
      } // at this point x and y should be finite


      if (isFinite(x) && isFinite(y)) {
        // check numbers are very close, needed when comparing numbers near zero
        var diff = Math.abs(x - y);

        if (diff < DBL_EPSILON) {
          return true;
        } else {
          // use relative error
          return diff <= Math.max(Math.abs(x), Math.abs(y)) * epsilon;
        }
      } // Infinite and Number or negative Infinite and positive Infinite cases


      return false;
    }

    /**
     * Convert a BigNumber to a formatted string representation.
     *
     * Syntax:
     *
     *    format(value)
     *    format(value, options)
     *    format(value, precision)
     *    format(value, fn)
     *
     * Where:
     *
     *    {number} value   The value to be formatted
     *    {Object} options An object with formatting options. Available options:
     *                     {string} notation
     *                         Number notation. Choose from:
     *                         'fixed'          Always use regular number notation.
     *                                          For example '123.40' and '14000000'
     *                         'exponential'    Always use exponential notation.
     *                                          For example '1.234e+2' and '1.4e+7'
     *                         'auto' (default) Regular number notation for numbers
     *                                          having an absolute value between
     *                                          `lower` and `upper` bounds, and uses
     *                                          exponential notation elsewhere.
     *                                          Lower bound is included, upper bound
     *                                          is excluded.
     *                                          For example '123.4' and '1.4e7'.
     *                     {number} precision   A number between 0 and 16 to round
     *                                          the digits of the number.
     *                                          In case of notations 'exponential',
     *                                          'engineering', and 'auto',
     *                                          `precision` defines the total
     *                                          number of significant digits returned.
     *                                          In case of notation 'fixed',
     *                                          `precision` defines the number of
     *                                          significant digits after the decimal
     *                                          point.
     *                                          `precision` is undefined by default.
     *                     {number} lowerExp    Exponent determining the lower boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `-3`.
     *                     {number} upperExp    Exponent determining the upper boundary
     *                                          for formatting a value with an exponent
     *                                          when `notation='auto`.
     *                                          Default value is `5`.
     *    {Function} fn    A custom formatting function. Can be used to override the
     *                     built-in notations. Function `fn` is called with `value` as
     *                     parameter and must return a string. Is useful for example to
     *                     format all values inside a matrix in a particular way.
     *
     * Examples:
     *
     *    format(6.4)                                        // '6.4'
     *    format(1240000)                                    // '1.24e6'
     *    format(1/3)                                        // '0.3333333333333333'
     *    format(1/3, 3)                                     // '0.333'
     *    format(21385, 2)                                   // '21000'
     *    format(12e8, {notation: 'fixed'})                  // returns '1200000000'
     *    format(2.3,    {notation: 'fixed', precision: 4})  // returns '2.3000'
     *    format(52.8,   {notation: 'exponential'})          // returns '5.28e+1'
     *    format(12400,  {notation: 'engineering'})          // returns '12.400e+3'
     *
     * @param {BigNumber} value
     * @param {Object | Function | number} [options]
     * @return {string} str The formatted value
     */

    function format$1(value, options) {
      if (typeof options === 'function') {
        // handle format(value, fn)
        return options(value);
      } // handle special cases


      if (!value.isFinite()) {
        return value.isNaN() ? 'NaN' : value.gt(0) ? 'Infinity' : '-Infinity';
      } // default values for options


      var notation = 'auto';
      var precision;

      if (options !== undefined) {
        // determine notation from options
        if (options.notation) {
          notation = options.notation;
        } // determine precision from options


        if (typeof options === 'number') {
          precision = options;
        } else if (options.precision) {
          precision = options.precision;
        }
      } // handle the various notations


      switch (notation) {
        case 'fixed':
          return toFixed$1(value, precision);

        case 'exponential':
          return toExponential$1(value, precision);

        case 'engineering':
          return toEngineering$1(value, precision);

        case 'auto':
          {
            // TODO: clean up some day. Deprecated since: 2018-01-24
            // @deprecated upper and lower are replaced with upperExp and lowerExp since v4.0.0
            if (options && options.exponential && (options.exponential.lower !== undefined || options.exponential.upper !== undefined)) {
              var fixedOptions = mapObject(options, function (x) {
                return x;
              });
              fixedOptions.exponential = undefined;

              if (options.exponential.lower !== undefined) {
                fixedOptions.lowerExp = Math.round(Math.log(options.exponential.lower) / Math.LN10);
              }

              if (options.exponential.upper !== undefined) {
                fixedOptions.upperExp = Math.round(Math.log(options.exponential.upper) / Math.LN10);
              }

              console.warn('Deprecation warning: Formatting options exponential.lower and exponential.upper ' + '(minimum and maximum value) ' + 'are replaced with exponential.lowerExp and exponential.upperExp ' + '(minimum and maximum exponent) since version 4.0.0. ' + 'Replace ' + JSON.stringify(options) + ' with ' + JSON.stringify(fixedOptions));
              return format$1(value, fixedOptions);
            } // determine lower and upper bound for exponential notation.
            // TODO: implement support for upper and lower to be BigNumbers themselves


            var lowerExp = options && options.lowerExp !== undefined ? options.lowerExp : -3;
            var upperExp = options && options.upperExp !== undefined ? options.upperExp : 5; // handle special case zero

            if (value.isZero()) return '0'; // determine whether or not to output exponential notation

            var str;
            var rounded = value.toSignificantDigits(precision);
            var exp = rounded.e;

            if (exp >= lowerExp && exp < upperExp) {
              // normal number notation
              str = rounded.toFixed();
            } else {
              // exponential notation
              str = toExponential$1(value, precision);
            } // remove trailing zeros after the decimal point


            return str.replace(/((\.\d*?)(0+))($|e)/, function () {
              var digits = arguments[2];
              var e = arguments[4];
              return digits !== '.' ? digits + e : e;
            });
          }

        default:
          throw new Error('Unknown notation "' + notation + '". ' + 'Choose "auto", "exponential", or "fixed".');
      }
    }
    /**
     * Format a BigNumber in engineering notation. Like '1.23e+6', '2.3e+0', '3.500e-3'
     * @param {BigNumber | string} value
     * @param {number} [precision]        Optional number of significant figures to return.
     */

    function toEngineering$1(value, precision) {
      // find nearest lower multiple of 3 for exponent
      var e = value.e;
      var newExp = e % 3 === 0 ? e : e < 0 ? e - 3 - e % 3 : e - e % 3; // find difference in exponents, and calculate the value without exponent

      var valueWithoutExp = value.mul(Math.pow(10, -newExp));
      var valueStr = valueWithoutExp.toPrecision(precision);

      if (valueStr.indexOf('e') !== -1) {
        valueStr = valueWithoutExp.toString();
      }

      return valueStr + 'e' + (e >= 0 ? '+' : '') + newExp.toString();
    }
    /**
     * Format a number in exponential notation. Like '1.23e+5', '2.3e+0', '3.500e-3'
     * @param {BigNumber} value
     * @param {number} [precision]  Number of digits in formatted output.
     *                              If not provided, the maximum available digits
     *                              is used.
     * @returns {string} str
     */

    function toExponential$1(value, precision) {
      if (precision !== undefined) {
        return value.toExponential(precision - 1); // Note the offset of one
      } else {
        return value.toExponential();
      }
    }
    /**
     * Format a number with fixed notation.
     * @param {BigNumber} value
     * @param {number} [precision=undefined] Optional number of decimals after the
     *                                       decimal point. Undefined by default.
     */

    function toFixed$1(value, precision) {
      return value.toFixed(precision);
    }

    function _typeof$2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$2 = function _typeof(obj) { return typeof obj; }; } else { _typeof$2 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$2(obj); }
    /**
     * Format a value of any type into a string.
     *
     * Usage:
     *     math.format(value)
     *     math.format(value, precision)
     *
     * When value is a function:
     *
     * - When the function has a property `syntax`, it returns this
     *   syntax description.
     * - In other cases, a string `'function'` is returned.
     *
     * When `value` is an Object:
     *
     * - When the object contains a property `format` being a function, this
     *   function is invoked as `value.format(options)` and the result is returned.
     * - When the object has its own `toString` method, this method is invoked
     *   and the result is returned.
     * - In other cases the function will loop over all object properties and
     *   return JSON object notation like '{"a": 2, "b": 3}'.
     *
     * Example usage:
     *     math.format(2/7)                // '0.2857142857142857'
     *     math.format(math.pi, 3)         // '3.14'
     *     math.format(new Complex(2, 3))  // '2 + 3i'
     *     math.format('hello')            // '"hello"'
     *
     * @param {*} value             Value to be stringified
     * @param {Object | number | Function} [options]  Formatting options. See
     *                                                lib/utils/number:format for a
     *                                                description of the available
     *                                                options.
     * @return {string} str
     */

    function format$2(value, options) {
      if (typeof value === 'number') {
        return format(value, options);
      }

      if (isBigNumber(value)) {
        return format$1(value, options);
      } // note: we use unsafe duck-typing here to check for Fractions, this is
      // ok here since we're only invoking toString or concatenating its values


      if (looksLikeFraction(value)) {
        if (!options || options.fraction !== 'decimal') {
          // output as ratio, like '1/3'
          return value.s * value.n + '/' + value.d;
        } else {
          // output as decimal, like '0.(3)'
          return value.toString();
        }
      }

      if (Array.isArray(value)) {
        return formatArray(value, options);
      }

      if (isString(value)) {
        return '"' + value + '"';
      }

      if (typeof value === 'function') {
        return value.syntax ? String(value.syntax) : 'function';
      }

      if (value && _typeof$2(value) === 'object') {
        if (typeof value.format === 'function') {
          return value.format(options);
        } else if (value && value.toString(options) !== {}.toString()) {
          // this object has a non-native toString method, use that one
          return value.toString(options);
        } else {
          var entries = Object.keys(value).map(function (key) {
            return '"' + key + '": ' + format$2(value[key], options);
          });
          return '{' + entries.join(', ') + '}';
        }
      }

      return String(value);
    }
    /**
     * Recursively format an n-dimensional matrix
     * Example output: "[[1, 2], [3, 4]]"
     * @param {Array} array
     * @param {Object | number | Function} [options]  Formatting options. See
     *                                                lib/utils/number:format for a
     *                                                description of the available
     *                                                options.
     * @returns {string} str
     */

    function formatArray(array, options) {
      if (Array.isArray(array)) {
        var str = '[';
        var len = array.length;

        for (var i = 0; i < len; i++) {
          if (i !== 0) {
            str += ', ';
          }

          str += formatArray(array[i], options);
        }

        str += ']';
        return str;
      } else {
        return format$2(array, options);
      }
    }
    /**
     * Check whether a value looks like a Fraction (unsafe duck-type check)
     * @param {*} value
     * @return {boolean}
     */


    function looksLikeFraction(value) {
      return value && _typeof$2(value) === 'object' && typeof value.s === 'number' && typeof value.n === 'number' && typeof value.d === 'number' || false;
    }

    /**
     * Create a range error with the message:
     *     'Dimension mismatch (<actual size> != <expected size>)'
     * @param {number | number[]} actual        The actual size
     * @param {number | number[]} expected      The expected size
     * @param {string} [relation='!=']          Optional relation between actual
     *                                          and expected size: '!=', '<', etc.
     * @extends RangeError
     */
    function DimensionError(actual, expected, relation) {
      if (!(this instanceof DimensionError)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }

      this.actual = actual;
      this.expected = expected;
      this.relation = relation;
      this.message = 'Dimension mismatch (' + (Array.isArray(actual) ? '[' + actual.join(', ') + ']' : actual) + ' ' + (this.relation || '!=') + ' ' + (Array.isArray(expected) ? '[' + expected.join(', ') + ']' : expected) + ')';
      this.stack = new Error().stack;
    }
    DimensionError.prototype = new RangeError();
    DimensionError.prototype.constructor = RangeError;
    DimensionError.prototype.name = 'DimensionError';
    DimensionError.prototype.isDimensionError = true;

    /**
     * Create a range error with the message:
     *     'Index out of range (index < min)'
     *     'Index out of range (index < max)'
     *
     * @param {number} index     The actual index
     * @param {number} [min=0]   Minimum index (included)
     * @param {number} [max]     Maximum index (excluded)
     * @extends RangeError
     */
    function IndexError(index, min, max) {
      if (!(this instanceof IndexError)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }

      this.index = index;

      if (arguments.length < 3) {
        this.min = 0;
        this.max = min;
      } else {
        this.min = min;
        this.max = max;
      }

      if (this.min !== undefined && this.index < this.min) {
        this.message = 'Index out of range (' + this.index + ' < ' + this.min + ')';
      } else if (this.max !== undefined && this.index >= this.max) {
        this.message = 'Index out of range (' + this.index + ' > ' + (this.max - 1) + ')';
      } else {
        this.message = 'Index out of range (' + this.index + ')';
      }

      this.stack = new Error().stack;
    }
    IndexError.prototype = new RangeError();
    IndexError.prototype.constructor = RangeError;
    IndexError.prototype.name = 'IndexError';
    IndexError.prototype.isIndexError = true;

    /**
     * Calculate the size of a multi dimensional array.
     * This function checks the size of the first entry, it does not validate
     * whether all dimensions match. (use function `validate` for that)
     * @param {Array} x
     * @Return {Number[]} size
     */

    function arraySize(x) {
      var s = [];

      while (Array.isArray(x)) {
        s.push(x.length);
        x = x[0];
      }

      return s;
    }
    /**
     * Recursively validate whether each element in a multi dimensional array
     * has a size corresponding to the provided size array.
     * @param {Array} array    Array to be validated
     * @param {number[]} size  Array with the size of each dimension
     * @param {number} dim   Current dimension
     * @throws DimensionError
     * @private
     */

    function _validate(array, size, dim) {
      var i;
      var len = array.length;

      if (len !== size[dim]) {
        throw new DimensionError(len, size[dim]);
      }

      if (dim < size.length - 1) {
        // recursively validate each child array
        var dimNext = dim + 1;

        for (i = 0; i < len; i++) {
          var child = array[i];

          if (!Array.isArray(child)) {
            throw new DimensionError(size.length - 1, size.length, '<');
          }

          _validate(array[i], size, dimNext);
        }
      } else {
        // last dimension. none of the childs may be an array
        for (i = 0; i < len; i++) {
          if (Array.isArray(array[i])) {
            throw new DimensionError(size.length + 1, size.length, '>');
          }
        }
      }
    }
    /**
     * Validate whether each element in a multi dimensional array has
     * a size corresponding to the provided size array.
     * @param {Array} array    Array to be validated
     * @param {number[]} size  Array with the size of each dimension
     * @throws DimensionError
     */


    function validate(array, size) {
      var isScalar = size.length === 0;

      if (isScalar) {
        // scalar
        if (Array.isArray(array)) {
          throw new DimensionError(array.length, 0);
        }
      } else {
        // array
        _validate(array, size, 0);
      }
    }
    /**
     * Test whether index is an integer number with index >= 0 and index < length
     * when length is provided
     * @param {number} index    Zero-based index
     * @param {number} [length] Length of the array
     */

    function validateIndex(index, length) {
      if (!isNumber(index) || !isInteger(index)) {
        throw new TypeError('Index must be an integer (value: ' + index + ')');
      }

      if (index < 0 || typeof length === 'number' && index >= length) {
        throw new IndexError(index, length);
      }
    }
    /**
     * Resize a multi dimensional array. The resized array is returned.
     * @param {Array} array         Array to be resized
     * @param {Array.<number>} size Array with the size of each dimension
     * @param {*} [defaultValue=0]  Value to be filled in in new entries,
     *                              zero by default. Specify for example `null`,
     *                              to clearly see entries that are not explicitly
     *                              set.
     * @return {Array} array         The resized array
     */

    function resize(array, size, defaultValue) {
      // TODO: add support for scalars, having size=[] ?
      // check the type of the arguments
      if (!Array.isArray(array) || !Array.isArray(size)) {
        throw new TypeError('Array expected');
      }

      if (size.length === 0) {
        throw new Error('Resizing to scalar is not supported');
      } // check whether size contains positive integers


      size.forEach(function (value) {
        if (!isNumber(value) || !isInteger(value) || value < 0) {
          throw new TypeError('Invalid size, must contain positive integers ' + '(size: ' + format$2(size) + ')');
        }
      }); // recursively resize the array

      var _defaultValue = defaultValue !== undefined ? defaultValue : 0;

      _resize(array, size, 0, _defaultValue);

      return array;
    }
    /**
     * Recursively resize a multi dimensional array
     * @param {Array} array         Array to be resized
     * @param {number[]} size       Array with the size of each dimension
     * @param {number} dim          Current dimension
     * @param {*} [defaultValue]    Value to be filled in in new entries,
     *                              undefined by default.
     * @private
     */

    function _resize(array, size, dim, defaultValue) {
      var i;
      var elem;
      var oldLen = array.length;
      var newLen = size[dim];
      var minLen = Math.min(oldLen, newLen); // apply new length

      array.length = newLen;

      if (dim < size.length - 1) {
        // non-last dimension
        var dimNext = dim + 1; // resize existing child arrays

        for (i = 0; i < minLen; i++) {
          // resize child array
          elem = array[i];

          if (!Array.isArray(elem)) {
            elem = [elem]; // add a dimension

            array[i] = elem;
          }

          _resize(elem, size, dimNext, defaultValue);
        } // create new child arrays


        for (i = minLen; i < newLen; i++) {
          // get child array
          elem = [];
          array[i] = elem; // resize new child array

          _resize(elem, size, dimNext, defaultValue);
        }
      } else {
        // last dimension
        // remove dimensions of existing values
        for (i = 0; i < minLen; i++) {
          while (Array.isArray(array[i])) {
            array[i] = array[i][0];
          }
        } // fill new elements with the default value


        for (i = minLen; i < newLen; i++) {
          array[i] = defaultValue;
        }
      }
    }
    /**
     * Re-shape a multi dimensional array to fit the specified dimensions
     * @param {Array} array           Array to be reshaped
     * @param {Array.<number>} sizes  List of sizes for each dimension
     * @returns {Array}               Array whose data has been formatted to fit the
     *                                specified dimensions
     *
     * @throws {DimensionError}       If the product of the new dimension sizes does
     *                                not equal that of the old ones
     */


    function reshape(array, sizes) {
      var flatArray = flatten(array);
      var newArray;

      function product(arr) {
        return arr.reduce(function (prev, curr) {
          return prev * curr;
        });
      }

      if (!Array.isArray(array) || !Array.isArray(sizes)) {
        throw new TypeError('Array expected');
      }

      if (sizes.length === 0) {
        throw new DimensionError(0, product(arraySize(array)), '!=');
      }

      var totalSize = 1;

      for (var sizeIndex = 0; sizeIndex < sizes.length; sizeIndex++) {
        totalSize *= sizes[sizeIndex];
      }

      if (flatArray.length !== totalSize) {
        throw new DimensionError(product(sizes), product(arraySize(array)), '!=');
      }

      try {
        newArray = _reshape(flatArray, sizes);
      } catch (e) {
        if (e instanceof DimensionError) {
          throw new DimensionError(product(sizes), product(arraySize(array)), '!=');
        }

        throw e;
      }

      return newArray;
    }
    /**
     * Iteratively re-shape a multi dimensional array to fit the specified dimensions
     * @param {Array} array           Array to be reshaped
     * @param {Array.<number>} sizes  List of sizes for each dimension
     * @returns {Array}               Array whose data has been formatted to fit the
     *                                specified dimensions
     */

    function _reshape(array, sizes) {
      // testing if there are enough elements for the requested shape
      var tmpArray = array;
      var tmpArray2; // for each dimensions starting by the last one and ignoring the first one

      for (var sizeIndex = sizes.length - 1; sizeIndex > 0; sizeIndex--) {
        var size = sizes[sizeIndex];
        tmpArray2 = []; // aggregate the elements of the current tmpArray in elements of the requested size

        var length = tmpArray.length / size;

        for (var i = 0; i < length; i++) {
          tmpArray2.push(tmpArray.slice(i * size, (i + 1) * size));
        } // set it as the new tmpArray for the next loop turn or for return


        tmpArray = tmpArray2;
      }

      return tmpArray;
    }
    /**
     * Unsqueeze a multi dimensional array: add dimensions when missing
     *
     * Paramter `size` will be mutated to match the new, unqueezed matrix size.
     *
     * @param {Array} array
     * @param {number} dims       Desired number of dimensions of the array
     * @param {number} [outer]    Number of outer dimensions to be added
     * @param {Array} [size] Current size of array.
     * @returns {Array} returns the array itself
     * @private
     */


    function unsqueeze(array, dims, outer, size) {
      var s = size || arraySize(array); // unsqueeze outer dimensions

      if (outer) {
        for (var i = 0; i < outer; i++) {
          array = [array];
          s.unshift(1);
        }
      } // unsqueeze inner dimensions


      array = _unsqueeze(array, dims, 0);

      while (s.length < dims) {
        s.push(1);
      }

      return array;
    }
    /**
     * Recursively unsqueeze a multi dimensional array
     * @param {Array} array
     * @param {number} dims Required number of dimensions
     * @param {number} dim  Current dimension
     * @returns {Array | *} Returns the squeezed array
     * @private
     */

    function _unsqueeze(array, dims, dim) {
      var i, ii;

      if (Array.isArray(array)) {
        var next = dim + 1;

        for (i = 0, ii = array.length; i < ii; i++) {
          array[i] = _unsqueeze(array[i], dims, next);
        }
      } else {
        for (var d = dim; d < dims; d++) {
          array = [array];
        }
      }

      return array;
    }
    /**
     * Flatten a multi dimensional array, put all elements in a one dimensional
     * array
     * @param {Array} array   A multi dimensional array
     * @return {Array}        The flattened array (1 dimensional)
     */


    function flatten(array) {
      if (!Array.isArray(array)) {
        // if not an array, return as is
        return array;
      }

      var flat = [];
      array.forEach(function callback(value) {
        if (Array.isArray(value)) {
          value.forEach(callback); // traverse through sub-arrays recursively
        } else {
          flat.push(value);
        }
      });
      return flat;
    }
    /**
     * Check the datatype of a given object
     * This is a low level implementation that should only be used by
     * parent Matrix classes such as SparseMatrix or DenseMatrix
     * This method does not validate Array Matrix shape
     * @param {Array} array
     * @param {function} typeOf   Callback function to use to determine the type of a value
     * @return string
     */

    function getArrayDataType(array, typeOf) {
      var type; // to hold type info

      var length = 0; // to hold length value to ensure it has consistent sizes

      for (var i = 0; i < array.length; i++) {
        var item = array[i];
        var isArray = Array.isArray(item); // Saving the target matrix row size

        if (i === 0 && isArray) {
          length = item.length;
        } // If the current item is an array but the length does not equal the targetVectorSize


        if (isArray && item.length !== length) {
          return undefined;
        }

        var itemType = isArray ? getArrayDataType(item, typeOf) // recurse into a nested array
        : typeOf(item);

        if (type === undefined) {
          type = itemType; // first item
        } else if (type !== itemType) {
          return 'mixed';
        }
      }

      return type;
    }

    /**
     * Create a factory function, which can be used to inject dependencies.
     *
     * The created functions are memoized, a consecutive call of the factory
     * with the exact same inputs will return the same function instance.
     * The memoized cache is exposed on `factory.cache` and can be cleared
     * if needed.
     *
     * Example:
     *
     *     const name = 'log'
     *     const dependencies = ['config', 'typed', 'divideScalar', 'Complex']
     *
     *     export const createLog = factory(name, dependencies, ({ typed, config, divideScalar, Complex }) => {
     *       // ... create the function log here and return it
     *     }
     *
     * @param {string} name           Name of the function to be created
     * @param {string[]} dependencies The names of all required dependencies
     * @param {function} create       Callback function called with an object with all dependencies
     * @param {Object} [meta]         Optional object with meta information that will be attached
     *                                to the created factory function as property `meta`.
     * @returns {function}
     */

    function factory(name, dependencies, create, meta) {
      function assertAndCreate(scope) {
        // we only pass the requested dependencies to the factory function
        // to prevent functions to rely on dependencies that are not explicitly
        // requested.
        var deps = pickShallow(scope, dependencies.map(stripOptionalNotation));
        assertDependencies(name, dependencies, scope);
        return create(deps);
      }

      assertAndCreate.isFactory = true;
      assertAndCreate.fn = name;
      assertAndCreate.dependencies = dependencies.slice().sort();

      if (meta) {
        assertAndCreate.meta = meta;
      }

      return assertAndCreate;
    }
    /**
     * Assert that all dependencies of a list with dependencies are available in the provided scope.
     *
     * Will throw an exception when there are dependencies missing.
     *
     * @param {string} name   Name for the function to be created. Used to generate a useful error message
     * @param {string[]} dependencies
     * @param {Object} scope
     */

    function assertDependencies(name, dependencies, scope) {
      var allDefined = dependencies.filter(function (dependency) {
        return !isOptionalDependency(dependency);
      }) // filter optionals
      .every(function (dependency) {
        return scope[dependency] !== undefined;
      });

      if (!allDefined) {
        var missingDependencies = dependencies.filter(function (dependency) {
          return scope[dependency] === undefined;
        }); // TODO: create a custom error class for this, a MathjsError or something like that

        throw new Error("Cannot create function \"".concat(name, "\", ") + "some dependencies are missing: ".concat(missingDependencies.map(function (d) {
          return "\"".concat(d, "\"");
        }).join(', '), "."));
      }
    }
    function isOptionalDependency(dependency) {
      return dependency && dependency[0] === '?';
    }
    function stripOptionalNotation(dependency) {
      return dependency && dependency[0] === '?' ? dependency.slice(1) : dependency;
    }

    /**
     * Create a typed-function which checks the types of the arguments and
     * can match them against multiple provided signatures. The typed-function
     * automatically converts inputs in order to find a matching signature.
     * Typed functions throw informative errors in case of wrong input arguments.
     *
     * See the library [typed-function](https://github.com/josdejong/typed-function)
     * for detailed documentation.
     *
     * Syntax:
     *
     *     math.typed(name, signatures) : function
     *     math.typed(signatures) : function
     *
     * Examples:
     *
     *     // create a typed function with multiple types per argument (type union)
     *     const fn2 = typed({
     *       'number | boolean': function (b) {
     *         return 'b is a number or boolean'
     *       },
     *       'string, number | boolean': function (a, b) {
     *         return 'a is a string, b is a number or boolean'
     *       }
     *     })
     *
     *     // create a typed function with an any type argument
     *     const log = typed({
     *       'string, any': function (event, data) {
     *         console.log('event: ' + event + ', data: ' + JSON.stringify(data))
     *       }
     *     })
     *
     * @param {string} [name]                          Optional name for the typed-function
     * @param {Object<string, function>} signatures   Object with one or multiple function signatures
     * @returns {function} The created typed-function.
     */

    var _createTyped2 = function _createTyped() {
      // initially, return the original instance of typed-function
      // consecutively, return a new instance from typed.create.
      _createTyped2 = typedFunction.create;
      return typedFunction;
    };

    var dependencies = ['?BigNumber', '?Complex', '?DenseMatrix', '?Fraction'];
    /**
     * Factory function for creating a new typed instance
     * @param {Object} dependencies   Object with data types like Complex and BigNumber
     * @returns {Function}
     */

    var createTyped =
    /* #__PURE__ */
    factory('typed', dependencies, function createTyped(_ref) {
      var BigNumber = _ref.BigNumber,
          Complex = _ref.Complex,
          DenseMatrix = _ref.DenseMatrix,
          Fraction = _ref.Fraction;

      // TODO: typed-function must be able to silently ignore signatures with unknown data types
      // get a new instance of typed-function
      var typed = _createTyped2(); // define all types. The order of the types determines in which order function
      // arguments are type-checked (so for performance it's important to put the
      // most used types first).


      typed.types = [{
        name: 'number',
        test: isNumber
      }, {
        name: 'Complex',
        test: isComplex
      }, {
        name: 'BigNumber',
        test: isBigNumber
      }, {
        name: 'Fraction',
        test: isFraction
      }, {
        name: 'Unit',
        test: isUnit
      }, {
        name: 'string',
        test: isString
      }, {
        name: 'Chain',
        test: isChain
      }, {
        name: 'Array',
        test: isArray
      }, {
        name: 'Matrix',
        test: isMatrix
      }, {
        name: 'DenseMatrix',
        test: isDenseMatrix
      }, {
        name: 'SparseMatrix',
        test: isSparseMatrix
      }, {
        name: 'Range',
        test: isRange
      }, {
        name: 'Index',
        test: isIndex
      }, {
        name: 'boolean',
        test: isBoolean
      }, {
        name: 'ResultSet',
        test: isResultSet
      }, {
        name: 'Help',
        test: isHelp
      }, {
        name: 'function',
        test: isFunction
      }, {
        name: 'Date',
        test: isDate
      }, {
        name: 'RegExp',
        test: isRegExp
      }, {
        name: 'null',
        test: isNull
      }, {
        name: 'undefined',
        test: isUndefined
      }, {
        name: 'AccessorNode',
        test: isAccessorNode
      }, {
        name: 'ArrayNode',
        test: isArrayNode
      }, {
        name: 'AssignmentNode',
        test: isAssignmentNode
      }, {
        name: 'BlockNode',
        test: isBlockNode
      }, {
        name: 'ConditionalNode',
        test: isConditionalNode
      }, {
        name: 'ConstantNode',
        test: isConstantNode
      }, {
        name: 'FunctionNode',
        test: isFunctionNode
      }, {
        name: 'FunctionAssignmentNode',
        test: isFunctionAssignmentNode
      }, {
        name: 'IndexNode',
        test: isIndexNode
      }, {
        name: 'Node',
        test: isNode
      }, {
        name: 'ObjectNode',
        test: isObjectNode
      }, {
        name: 'OperatorNode',
        test: isOperatorNode
      }, {
        name: 'ParenthesisNode',
        test: isParenthesisNode
      }, {
        name: 'RangeNode',
        test: isRangeNode
      }, {
        name: 'SymbolNode',
        test: isSymbolNode
      }, {
        name: 'Object',
        test: isObject
      } // order 'Object' last, it matches on other classes too
      ];
      typed.conversions = [{
        from: 'number',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          } // note: conversion from number to BigNumber can fail if x has >15 digits


          if (digits(x) > 15) {
            throw new TypeError('Cannot implicitly convert a number with >15 significant digits to BigNumber ' + '(value: ' + x + '). ' + 'Use function bignumber(x) to convert to BigNumber.');
          }

          return new BigNumber(x);
        }
      }, {
        from: 'number',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }

          return new Complex(x, 0);
        }
      }, {
        from: 'number',
        to: 'string',
        convert: function convert(x) {
          return x + '';
        }
      }, {
        from: 'BigNumber',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }

          return new Complex(x.toNumber(), 0);
        }
      }, {
        from: 'Fraction',
        to: 'BigNumber',
        convert: function convert(x) {
          throw new TypeError('Cannot implicitly convert a Fraction to BigNumber or vice versa. ' + 'Use function bignumber(x) to convert to BigNumber or fraction(x) to convert to Fraction.');
        }
      }, {
        from: 'Fraction',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }

          return new Complex(x.valueOf(), 0);
        }
      }, {
        from: 'number',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }

          var f = new Fraction(x);

          if (f.valueOf() !== x) {
            throw new TypeError('Cannot implicitly convert a number to a Fraction when there will be a loss of precision ' + '(value: ' + x + '). ' + 'Use function fraction(x) to convert to Fraction.');
          }

          return f;
        }
      }, {
        // FIXME: add conversion from Fraction to number, for example for `sqrt(fraction(1,3))`
        //  from: 'Fraction',
        //  to: 'number',
        //  convert: function (x) {
        //    return x.valueOf()
        //  }
        // }, {
        from: 'string',
        to: 'number',
        convert: function convert(x) {
          var n = Number(x);

          if (isNaN(n)) {
            throw new Error('Cannot convert "' + x + '" to a number');
          }

          return n;
        }
      }, {
        from: 'string',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          }

          try {
            return new BigNumber(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to BigNumber');
          }
        }
      }, {
        from: 'string',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }

          try {
            return new Fraction(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to Fraction');
          }
        }
      }, {
        from: 'string',
        to: 'Complex',
        convert: function convert(x) {
          if (!Complex) {
            throwNoComplex(x);
          }

          try {
            return new Complex(x);
          } catch (err) {
            throw new Error('Cannot convert "' + x + '" to Complex');
          }
        }
      }, {
        from: 'boolean',
        to: 'number',
        convert: function convert(x) {
          return +x;
        }
      }, {
        from: 'boolean',
        to: 'BigNumber',
        convert: function convert(x) {
          if (!BigNumber) {
            throwNoBignumber(x);
          }

          return new BigNumber(+x);
        }
      }, {
        from: 'boolean',
        to: 'Fraction',
        convert: function convert(x) {
          if (!Fraction) {
            throwNoFraction(x);
          }

          return new Fraction(+x);
        }
      }, {
        from: 'boolean',
        to: 'string',
        convert: function convert(x) {
          return String(x);
        }
      }, {
        from: 'Array',
        to: 'Matrix',
        convert: function convert(array) {
          if (!DenseMatrix) {
            throwNoMatrix();
          }

          return new DenseMatrix(array);
        }
      }, {
        from: 'Matrix',
        to: 'Array',
        convert: function convert(matrix) {
          return matrix.valueOf();
        }
      }];
      return typed;
    });

    function throwNoBignumber(x) {
      throw new Error("Cannot convert value ".concat(x, " into a BigNumber: no class 'BigNumber' provided"));
    }

    function throwNoComplex(x) {
      throw new Error("Cannot convert value ".concat(x, " into a Complex number: no class 'Complex' provided"));
    }

    function throwNoMatrix() {
      throw new Error('Cannot convert array into a Matrix: no class \'DenseMatrix\' provided');
    }

    function throwNoFraction(x) {
      throw new Error("Cannot convert value ".concat(x, " into a Fraction, no class 'Fraction' provided."));
    }

    /*
     *  decimal.js v10.2.0
     *  An arbitrary-precision Decimal type for JavaScript.
     *  https://github.com/MikeMcl/decimal.js
     *  Copyright (c) 2019 Michael Mclaughlin <M8ch88l@gmail.com>
     *  MIT Licence
     */


    // -----------------------------------  EDITABLE DEFAULTS  ------------------------------------ //


      // The maximum exponent magnitude.
      // The limit on the value of `toExpNeg`, `toExpPos`, `minE` and `maxE`.
    var EXP_LIMIT = 9e15,                      // 0 to 9e15

      // The limit on the value of `precision`, and on the value of the first argument to
      // `toDecimalPlaces`, `toExponential`, `toFixed`, `toPrecision` and `toSignificantDigits`.
      MAX_DIGITS = 1e9,                        // 0 to 1e9

      // Base conversion alphabet.
      NUMERALS = '0123456789abcdef',

      // The natural logarithm of 10 (1025 digits).
      LN10 = '2.3025850929940456840179914546843642076011014886287729760333279009675726096773524802359972050895982983419677840422862486334095254650828067566662873690987816894829072083255546808437998948262331985283935053089653777326288461633662222876982198867465436674744042432743651550489343149393914796194044002221051017141748003688084012647080685567743216228355220114804663715659121373450747856947683463616792101806445070648000277502684916746550586856935673420670581136429224554405758925724208241314695689016758940256776311356919292033376587141660230105703089634572075440370847469940168269282808481184289314848524948644871927809676271275775397027668605952496716674183485704422507197965004714951050492214776567636938662976979522110718264549734772662425709429322582798502585509785265383207606726317164309505995087807523710333101197857547331541421808427543863591778117054309827482385045648019095610299291824318237525357709750539565187697510374970888692180205189339507238539205144634197265287286965110862571492198849978748873771345686209167058',

      // Pi (1025 digits).
      PI = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679821480865132823066470938446095505822317253594081284811174502841027019385211055596446229489549303819644288109756659334461284756482337867831652712019091456485669234603486104543266482133936072602491412737245870066063155881748815209209628292540917153643678925903600113305305488204665213841469519415116094330572703657595919530921861173819326117931051185480744623799627495673518857527248912279381830119491298336733624406566430860213949463952247371907021798609437027705392171762931767523846748184676694051320005681271452635608277857713427577896091736371787214684409012249534301465495853710507922796892589235420199561121290219608640344181598136297747713099605187072113499999983729780499510597317328160963185950244594553469083026425223082533446850352619311881710100031378387528865875332083814206171776691473035982534904287554687311595628638823537875937519577818577805321712268066130019278766111959092164201989380952572010654858632789',


      // The initial configuration properties of the Decimal constructor.
      DEFAULTS = {

        // These values must be integers within the stated ranges (inclusive).
        // Most of these values can be changed at run-time using the `Decimal.config` method.

        // The maximum number of significant digits of the result of a calculation or base conversion.
        // E.g. `Decimal.config({ precision: 20 });`
        precision: 20,                         // 1 to MAX_DIGITS

        // The rounding mode used when rounding to `precision`.
        //
        // ROUND_UP         0 Away from zero.
        // ROUND_DOWN       1 Towards zero.
        // ROUND_CEIL       2 Towards +Infinity.
        // ROUND_FLOOR      3 Towards -Infinity.
        // ROUND_HALF_UP    4 Towards nearest neighbour. If equidistant, up.
        // ROUND_HALF_DOWN  5 Towards nearest neighbour. If equidistant, down.
        // ROUND_HALF_EVEN  6 Towards nearest neighbour. If equidistant, towards even neighbour.
        // ROUND_HALF_CEIL  7 Towards nearest neighbour. If equidistant, towards +Infinity.
        // ROUND_HALF_FLOOR 8 Towards nearest neighbour. If equidistant, towards -Infinity.
        //
        // E.g.
        // `Decimal.rounding = 4;`
        // `Decimal.rounding = Decimal.ROUND_HALF_UP;`
        rounding: 4,                           // 0 to 8

        // The modulo mode used when calculating the modulus: a mod n.
        // The quotient (q = a / n) is calculated according to the corresponding rounding mode.
        // The remainder (r) is calculated as: r = a - n * q.
        //
        // UP         0 The remainder is positive if the dividend is negative, else is negative.
        // DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
        // FLOOR      3 The remainder has the same sign as the divisor (Python %).
        // HALF_EVEN  6 The IEEE 754 remainder function.
        // EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
        //
        // Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
        // division (9) are commonly used for the modulus operation. The other rounding modes can also
        // be used, but they may not give useful results.
        modulo: 1,                             // 0 to 9

        // The exponent value at and beneath which `toString` returns exponential notation.
        // JavaScript numbers: -7
        toExpNeg: -7,                          // 0 to -EXP_LIMIT

        // The exponent value at and above which `toString` returns exponential notation.
        // JavaScript numbers: 21
        toExpPos:  21,                         // 0 to EXP_LIMIT

        // The minimum exponent value, beneath which underflow to zero occurs.
        // JavaScript numbers: -324  (5e-324)
        minE: -EXP_LIMIT,                      // -1 to -EXP_LIMIT

        // The maximum exponent value, above which overflow to Infinity occurs.
        // JavaScript numbers: 308  (1.7976931348623157e+308)
        maxE: EXP_LIMIT,                       // 1 to EXP_LIMIT

        // Whether to use cryptographically-secure random number generation, if available.
        crypto: false                          // true/false
      },


    // ----------------------------------- END OF EDITABLE DEFAULTS ------------------------------- //


      inexact, quadrant,
      external = true,

      decimalError = '[DecimalError] ',
      invalidArgument = decimalError + 'Invalid argument: ',
      precisionLimitExceeded = decimalError + 'Precision limit exceeded',
      cryptoUnavailable = decimalError + 'crypto unavailable',

      mathfloor = Math.floor,
      mathpow = Math.pow,

      isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i,
      isHex = /^0x([0-9a-f]+(\.[0-9a-f]*)?|\.[0-9a-f]+)(p[+-]?\d+)?$/i,
      isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i,
      isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i,

      BASE = 1e7,
      LOG_BASE = 7,
      MAX_SAFE_INTEGER = 9007199254740991,

      LN10_PRECISION = LN10.length - 1,
      PI_PRECISION = PI.length - 1,

      // Decimal.prototype object
      P = { name: '[object Decimal]' };


    // Decimal prototype methods


    /*
     *  absoluteValue             abs
     *  ceil
     *  comparedTo                cmp
     *  cosine                    cos
     *  cubeRoot                  cbrt
     *  decimalPlaces             dp
     *  dividedBy                 div
     *  dividedToIntegerBy        divToInt
     *  equals                    eq
     *  floor
     *  greaterThan               gt
     *  greaterThanOrEqualTo      gte
     *  hyperbolicCosine          cosh
     *  hyperbolicSine            sinh
     *  hyperbolicTangent         tanh
     *  inverseCosine             acos
     *  inverseHyperbolicCosine   acosh
     *  inverseHyperbolicSine     asinh
     *  inverseHyperbolicTangent  atanh
     *  inverseSine               asin
     *  inverseTangent            atan
     *  isFinite
     *  isInteger                 isInt
     *  isNaN
     *  isNegative                isNeg
     *  isPositive                isPos
     *  isZero
     *  lessThan                  lt
     *  lessThanOrEqualTo         lte
     *  logarithm                 log
     *  [maximum]                 [max]
     *  [minimum]                 [min]
     *  minus                     sub
     *  modulo                    mod
     *  naturalExponential        exp
     *  naturalLogarithm          ln
     *  negated                   neg
     *  plus                      add
     *  precision                 sd
     *  round
     *  sine                      sin
     *  squareRoot                sqrt
     *  tangent                   tan
     *  times                     mul
     *  toBinary
     *  toDecimalPlaces           toDP
     *  toExponential
     *  toFixed
     *  toFraction
     *  toHexadecimal             toHex
     *  toNearest
     *  toNumber
     *  toOctal
     *  toPower                   pow
     *  toPrecision
     *  toSignificantDigits       toSD
     *  toString
     *  truncated                 trunc
     *  valueOf                   toJSON
     */


    /*
     * Return a new Decimal whose value is the absolute value of this Decimal.
     *
     */
    P.absoluteValue = P.abs = function () {
      var x = new this.constructor(this);
      if (x.s < 0) x.s = 1;
      return finalise(x);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
     * direction of positive Infinity.
     *
     */
    P.ceil = function () {
      return finalise(new this.constructor(this), this.e + 1, 2);
    };


    /*
     * Return
     *   1    if the value of this Decimal is greater than the value of `y`,
     *  -1    if the value of this Decimal is less than the value of `y`,
     *   0    if they have the same value,
     *   NaN  if the value of either Decimal is NaN.
     *
     */
    P.comparedTo = P.cmp = function (y) {
      var i, j, xdL, ydL,
        x = this,
        xd = x.d,
        yd = (y = new x.constructor(y)).d,
        xs = x.s,
        ys = y.s;

      // Either NaN or ±Infinity?
      if (!xd || !yd) {
        return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd ^ xs < 0 ? 1 : -1;
      }

      // Either zero?
      if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

      // Signs differ?
      if (xs !== ys) return xs;

      // Compare exponents.
      if (x.e !== y.e) return x.e > y.e ^ xs < 0 ? 1 : -1;

      xdL = xd.length;
      ydL = yd.length;

      // Compare digit by digit.
      for (i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i) {
        if (xd[i] !== yd[i]) return xd[i] > yd[i] ^ xs < 0 ? 1 : -1;
      }

      // Compare lengths.
      return xdL === ydL ? 0 : xdL > ydL ^ xs < 0 ? 1 : -1;
    };


    /*
     * Return a new Decimal whose value is the cosine of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * cos(0)         = 1
     * cos(-0)        = 1
     * cos(Infinity)  = NaN
     * cos(-Infinity) = NaN
     * cos(NaN)       = NaN
     *
     */
    P.cosine = P.cos = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.d) return new Ctor(NaN);

      // cos(0) = cos(-0) = 1
      if (!x.d[0]) return new Ctor(1);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
      Ctor.rounding = 1;

      x = cosine(Ctor, toLessThanHalfPi(Ctor, x));

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant == 2 || quadrant == 3 ? x.neg() : x, pr, rm, true);
    };


    /*
     *
     * Return a new Decimal whose value is the cube root of the value of this Decimal, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     *  cbrt(0)  =  0
     *  cbrt(-0) = -0
     *  cbrt(1)  =  1
     *  cbrt(-1) = -1
     *  cbrt(N)  =  N
     *  cbrt(-I) = -I
     *  cbrt(I)  =  I
     *
     * Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
     *
     */
    P.cubeRoot = P.cbrt = function () {
      var e, m, n, r, rep, s, sd, t, t3, t3plusx,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);
      external = false;

      // Initial estimate.
      s = x.s * mathpow(x.s * x, 1 / 3);

       // Math.cbrt underflow/overflow?
       // Pass x to Math.pow as integer, then adjust the exponent of the result.
      if (!s || Math.abs(s) == 1 / 0) {
        n = digitsToString(x.d);
        e = x.e;

        // Adjust n exponent so it is a multiple of 3 away from x exponent.
        if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
        s = mathpow(n, 1 / 3);

        // Rarely, e may be one less than the result exponent value.
        e = mathfloor((e + 1) / 3) - (e % 3 == (e < 0 ? -1 : 2));

        if (s == 1 / 0) {
          n = '5e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new Ctor(n);
        r.s = x.s;
      } else {
        r = new Ctor(s.toString());
      }

      sd = (e = Ctor.precision) + 3;

      // Halley's method.
      // TODO? Compare Newton's method.
      for (;;) {
        t = r;
        t3 = t.times(t).times(t);
        t3plusx = t3.plus(x);
        r = divide$1(t3plusx.plus(x).times(t), t3plusx.plus(t3), sd + 2, 1);

        // TODO? Replace with for-loop and checkRoundingDigits.
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
          n = n.slice(sd - 3, sd + 1);

          // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
          // , i.e. approaching a rounding boundary, continue the iteration.
          if (n == '9999' || !rep && n == '4999') {

            // On the first iteration only, check to see if rounding up gives the exact result as the
            // nines may infinitely repeat.
            if (!rep) {
              finalise(t, e + 1, 0);

              if (t.times(t).times(t).eq(x)) {
                r = t;
                break;
              }
            }

            sd += 4;
            rep = 1;
          } else {

            // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
            // If not, then there are further digits and m will be truthy.
            if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

              // Truncate to the first rounding digit.
              finalise(r, e + 1, 1);
              m = !r.times(r).times(r).eq(x);
            }

            break;
          }
        }
      }

      external = true;

      return finalise(r, e, Ctor.rounding, m);
    };


    /*
     * Return the number of decimal places of the value of this Decimal.
     *
     */
    P.decimalPlaces = P.dp = function () {
      var w,
        d = this.d,
        n = NaN;

      if (d) {
        w = d.length - 1;
        n = (w - mathfloor(this.e / LOG_BASE)) * LOG_BASE;

        // Subtract the number of trailing zeros of the last word.
        w = d[w];
        if (w) for (; w % 10 == 0; w /= 10) n--;
        if (n < 0) n = 0;
      }

      return n;
    };


    /*
     *  n / 0 = I
     *  n / N = N
     *  n / I = 0
     *  0 / n = 0
     *  0 / 0 = N
     *  0 / N = N
     *  0 / I = 0
     *  N / n = N
     *  N / 0 = N
     *  N / N = N
     *  N / I = N
     *  I / n = I
     *  I / 0 = I
     *  I / N = N
     *  I / I = N
     *
     * Return a new Decimal whose value is the value of this Decimal divided by `y`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.dividedBy = P.div = function (y) {
      return divide$1(this, new this.constructor(y));
    };


    /*
     * Return a new Decimal whose value is the integer part of dividing the value of this Decimal
     * by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.dividedToIntegerBy = P.divToInt = function (y) {
      var x = this,
        Ctor = x.constructor;
      return finalise(divide$1(x, new Ctor(y), 0, 1, 1), Ctor.precision, Ctor.rounding);
    };


    /*
     * Return true if the value of this Decimal is equal to the value of `y`, otherwise return false.
     *
     */
    P.equals = P.eq = function (y) {
      return this.cmp(y) === 0;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number in the
     * direction of negative Infinity.
     *
     */
    P.floor = function () {
      return finalise(new this.constructor(this), this.e + 1, 3);
    };


    /*
     * Return true if the value of this Decimal is greater than the value of `y`, otherwise return
     * false.
     *
     */
    P.greaterThan = P.gt = function (y) {
      return this.cmp(y) > 0;
    };


    /*
     * Return true if the value of this Decimal is greater than or equal to the value of `y`,
     * otherwise return false.
     *
     */
    P.greaterThanOrEqualTo = P.gte = function (y) {
      var k = this.cmp(y);
      return k == 1 || k === 0;
    };


    /*
     * Return a new Decimal whose value is the hyperbolic cosine of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [1, Infinity]
     *
     * cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
     *
     * cosh(0)         = 1
     * cosh(-0)        = 1
     * cosh(Infinity)  = Infinity
     * cosh(-Infinity) = Infinity
     * cosh(NaN)       = NaN
     *
     *  x        time taken (ms)   result
     * 1000      9                 9.8503555700852349694e+433
     * 10000     25                4.4034091128314607936e+4342
     * 100000    171               1.4033316802130615897e+43429
     * 1000000   3817              1.5166076984010437725e+434294
     * 10000000  abandoned after 2 minute wait
     *
     * TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
     *
     */
    P.hyperbolicCosine = P.cosh = function () {
      var k, n, pr, rm, len,
        x = this,
        Ctor = x.constructor,
        one = new Ctor(1);

      if (!x.isFinite()) return new Ctor(x.s ? 1 / 0 : NaN);
      if (x.isZero()) return one;

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
      Ctor.rounding = 1;
      len = x.d.length;

      // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
      // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))

      // Estimate the optimum number of times to use the argument reduction.
      // TODO? Estimation reused from cosine() and may not be optimal here.
      if (len < 32) {
        k = Math.ceil(len / 3);
        n = (1 / tinyPow(4, k)).toString();
      } else {
        k = 16;
        n = '2.3283064365386962890625e-10';
      }

      x = taylorSeries(Ctor, 1, x.times(n), new Ctor(1), true);

      // Reverse argument reduction
      var cosh2_x,
        i = k,
        d8 = new Ctor(8);
      for (; i--;) {
        cosh2_x = x.times(x);
        x = one.minus(cosh2_x.times(d8.minus(cosh2_x.times(d8))));
      }

      return finalise(x, Ctor.precision = pr, Ctor.rounding = rm, true);
    };


    /*
     * Return a new Decimal whose value is the hyperbolic sine of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
     *
     * sinh(0)         = 0
     * sinh(-0)        = -0
     * sinh(Infinity)  = Infinity
     * sinh(-Infinity) = -Infinity
     * sinh(NaN)       = NaN
     *
     * x        time taken (ms)
     * 10       2 ms
     * 100      5 ms
     * 1000     14 ms
     * 10000    82 ms
     * 100000   886 ms            1.4033316802130615897e+43429
     * 200000   2613 ms
     * 300000   5407 ms
     * 400000   8824 ms
     * 500000   13026 ms          8.7080643612718084129e+217146
     * 1000000  48543 ms
     *
     * TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
     *
     */
    P.hyperbolicSine = P.sinh = function () {
      var k, pr, rm, len,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + 4;
      Ctor.rounding = 1;
      len = x.d.length;

      if (len < 3) {
        x = taylorSeries(Ctor, 2, x, x, true);
      } else {

        // Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
        // i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
        // 3 multiplications and 1 addition

        // Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
        // i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
        // 4 multiplications and 2 additions

        // Estimate the optimum number of times to use the argument reduction.
        k = 1.4 * Math.sqrt(len);
        k = k > 16 ? 16 : k | 0;

        x = x.times(1 / tinyPow(5, k));
        x = taylorSeries(Ctor, 2, x, x, true);

        // Reverse argument reduction
        var sinh2_x,
          d5 = new Ctor(5),
          d16 = new Ctor(16),
          d20 = new Ctor(20);
        for (; k--;) {
          sinh2_x = x.times(x);
          x = x.times(d5.plus(sinh2_x.times(d16.times(sinh2_x).plus(d20))));
        }
      }

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(x, pr, rm, true);
    };


    /*
     * Return a new Decimal whose value is the hyperbolic tangent of the value in radians of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * tanh(x) = sinh(x) / cosh(x)
     *
     * tanh(0)         = 0
     * tanh(-0)        = -0
     * tanh(Infinity)  = 1
     * tanh(-Infinity) = -1
     * tanh(NaN)       = NaN
     *
     */
    P.hyperbolicTangent = P.tanh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(x.s);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 7;
      Ctor.rounding = 1;

      return divide$1(x.sinh(), x.cosh(), Ctor.precision = pr, Ctor.rounding = rm);
    };


    /*
     * Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of
     * this Decimal.
     *
     * Domain: [-1, 1]
     * Range: [0, pi]
     *
     * acos(x) = pi/2 - asin(x)
     *
     * acos(0)       = pi/2
     * acos(-0)      = pi/2
     * acos(1)       = 0
     * acos(-1)      = pi
     * acos(1/2)     = pi/3
     * acos(-1/2)    = 2*pi/3
     * acos(|x| > 1) = NaN
     * acos(NaN)     = NaN
     *
     */
    P.inverseCosine = P.acos = function () {
      var halfPi,
        x = this,
        Ctor = x.constructor,
        k = x.abs().cmp(1),
        pr = Ctor.precision,
        rm = Ctor.rounding;

      if (k !== -1) {
        return k === 0
          // |x| is 1
          ? x.isNeg() ? getPi(Ctor, pr, rm) : new Ctor(0)
          // |x| > 1 or x is NaN
          : new Ctor(NaN);
      }

      if (x.isZero()) return getPi(Ctor, pr + 4, rm).times(0.5);

      // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3

      Ctor.precision = pr + 6;
      Ctor.rounding = 1;

      x = x.asin();
      halfPi = getPi(Ctor, pr + 4, rm).times(0.5);

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return halfPi.minus(x);
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the
     * value of this Decimal.
     *
     * Domain: [1, Infinity]
     * Range: [0, Infinity]
     *
     * acosh(x) = ln(x + sqrt(x^2 - 1))
     *
     * acosh(x < 1)     = NaN
     * acosh(NaN)       = NaN
     * acosh(Infinity)  = Infinity
     * acosh(-Infinity) = NaN
     * acosh(0)         = NaN
     * acosh(-0)        = NaN
     * acosh(1)         = 0
     * acosh(-1)        = NaN
     *
     */
    P.inverseHyperbolicCosine = P.acosh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (x.lte(1)) return new Ctor(x.eq(1) ? 0 : NaN);
      if (!x.isFinite()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(Math.abs(x.e), x.sd()) + 4;
      Ctor.rounding = 1;
      external = false;

      x = x.times(x).minus(1).sqrt().plus(x);

      external = true;
      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.ln();
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value
     * of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * asinh(x) = ln(x + sqrt(x^2 + 1))
     *
     * asinh(NaN)       = NaN
     * asinh(Infinity)  = Infinity
     * asinh(-Infinity) = -Infinity
     * asinh(0)         = 0
     * asinh(-0)        = -0
     *
     */
    P.inverseHyperbolicSine = P.asinh = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite() || x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 2 * Math.max(Math.abs(x.e), x.sd()) + 6;
      Ctor.rounding = 1;
      external = false;

      x = x.times(x).plus(1).sqrt().plus(x);

      external = true;
      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.ln();
    };


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the
     * value of this Decimal.
     *
     * Domain: [-1, 1]
     * Range: [-Infinity, Infinity]
     *
     * atanh(x) = 0.5 * ln((1 + x) / (1 - x))
     *
     * atanh(|x| > 1)   = NaN
     * atanh(NaN)       = NaN
     * atanh(Infinity)  = NaN
     * atanh(-Infinity) = NaN
     * atanh(0)         = 0
     * atanh(-0)        = -0
     * atanh(1)         = Infinity
     * atanh(-1)        = -Infinity
     *
     */
    P.inverseHyperbolicTangent = P.atanh = function () {
      var pr, rm, wpr, xsd,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.e >= 0) return new Ctor(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      xsd = x.sd();

      if (Math.max(xsd, pr) < 2 * -x.e - 1) return finalise(new Ctor(x), pr, rm, true);

      Ctor.precision = wpr = xsd - x.e;

      x = divide$1(x.plus(1), new Ctor(1).minus(x), wpr + pr, 1);

      Ctor.precision = pr + 4;
      Ctor.rounding = 1;

      x = x.ln();

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.times(0.5);
    };


    /*
     * Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of this
     * Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi/2, pi/2]
     *
     * asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
     *
     * asin(0)       = 0
     * asin(-0)      = -0
     * asin(1/2)     = pi/6
     * asin(-1/2)    = -pi/6
     * asin(1)       = pi/2
     * asin(-1)      = -pi/2
     * asin(|x| > 1) = NaN
     * asin(NaN)     = NaN
     *
     * TODO? Compare performance of Taylor series.
     *
     */
    P.inverseSine = P.asin = function () {
      var halfPi, k,
        pr, rm,
        x = this,
        Ctor = x.constructor;

      if (x.isZero()) return new Ctor(x);

      k = x.abs().cmp(1);
      pr = Ctor.precision;
      rm = Ctor.rounding;

      if (k !== -1) {

        // |x| is 1
        if (k === 0) {
          halfPi = getPi(Ctor, pr + 4, rm).times(0.5);
          halfPi.s = x.s;
          return halfPi;
        }

        // |x| > 1 or x is NaN
        return new Ctor(NaN);
      }

      // TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

      Ctor.precision = pr + 6;
      Ctor.rounding = 1;

      x = x.div(new Ctor(1).minus(x.times(x)).sqrt().plus(1)).atan();

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return x.times(2);
    };


    /*
     * Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value
     * of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi/2, pi/2]
     *
     * atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
     *
     * atan(0)         = 0
     * atan(-0)        = -0
     * atan(1)         = pi/4
     * atan(-1)        = -pi/4
     * atan(Infinity)  = pi/2
     * atan(-Infinity) = -pi/2
     * atan(NaN)       = NaN
     *
     */
    P.inverseTangent = P.atan = function () {
      var i, j, k, n, px, t, r, wpr, x2,
        x = this,
        Ctor = x.constructor,
        pr = Ctor.precision,
        rm = Ctor.rounding;

      if (!x.isFinite()) {
        if (!x.s) return new Ctor(NaN);
        if (pr + 4 <= PI_PRECISION) {
          r = getPi(Ctor, pr + 4, rm).times(0.5);
          r.s = x.s;
          return r;
        }
      } else if (x.isZero()) {
        return new Ctor(x);
      } else if (x.abs().eq(1) && pr + 4 <= PI_PRECISION) {
        r = getPi(Ctor, pr + 4, rm).times(0.25);
        r.s = x.s;
        return r;
      }

      Ctor.precision = wpr = pr + 10;
      Ctor.rounding = 1;

      // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);

      // Argument reduction
      // Ensure |x| < 0.42
      // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))

      k = Math.min(28, wpr / LOG_BASE + 2 | 0);

      for (i = k; i; --i) x = x.div(x.times(x).plus(1).sqrt().plus(1));

      external = false;

      j = Math.ceil(wpr / LOG_BASE);
      n = 1;
      x2 = x.times(x);
      r = new Ctor(x);
      px = x;

      // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
      for (; i !== -1;) {
        px = px.times(x2);
        t = r.minus(px.div(n += 2));

        px = px.times(x2);
        r = t.plus(px.div(n += 2));

        if (r.d[j] !== void 0) for (i = j; r.d[i] === t.d[i] && i--;);
      }

      if (k) r = r.times(2 << (k - 1));

      external = true;

      return finalise(r, Ctor.precision = pr, Ctor.rounding = rm, true);
    };


    /*
     * Return true if the value of this Decimal is a finite number, otherwise return false.
     *
     */
    P.isFinite = function () {
      return !!this.d;
    };


    /*
     * Return true if the value of this Decimal is an integer, otherwise return false.
     *
     */
    P.isInteger = P.isInt = function () {
      return !!this.d && mathfloor(this.e / LOG_BASE) > this.d.length - 2;
    };


    /*
     * Return true if the value of this Decimal is NaN, otherwise return false.
     *
     */
    P.isNaN = function () {
      return !this.s;
    };


    /*
     * Return true if the value of this Decimal is negative, otherwise return false.
     *
     */
    P.isNegative = P.isNeg = function () {
      return this.s < 0;
    };


    /*
     * Return true if the value of this Decimal is positive, otherwise return false.
     *
     */
    P.isPositive = P.isPos = function () {
      return this.s > 0;
    };


    /*
     * Return true if the value of this Decimal is 0 or -0, otherwise return false.
     *
     */
    P.isZero = function () {
      return !!this.d && this.d[0] === 0;
    };


    /*
     * Return true if the value of this Decimal is less than `y`, otherwise return false.
     *
     */
    P.lessThan = P.lt = function (y) {
      return this.cmp(y) < 0;
    };


    /*
     * Return true if the value of this Decimal is less than or equal to `y`, otherwise return false.
     *
     */
    P.lessThanOrEqualTo = P.lte = function (y) {
      return this.cmp(y) < 1;
    };


    /*
     * Return the logarithm of the value of this Decimal to the specified base, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * If no base is specified, return log[10](arg).
     *
     * log[base](arg) = ln(arg) / ln(base)
     *
     * The result will always be correctly rounded if the base of the log is 10, and 'almost always'
     * otherwise:
     *
     * Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
     * rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
     * between the result and the correctly rounded result will be one ulp (unit in the last place).
     *
     * log[-b](a)       = NaN
     * log[0](a)        = NaN
     * log[1](a)        = NaN
     * log[NaN](a)      = NaN
     * log[Infinity](a) = NaN
     * log[b](0)        = -Infinity
     * log[b](-0)       = -Infinity
     * log[b](-a)       = NaN
     * log[b](1)        = 0
     * log[b](Infinity) = Infinity
     * log[b](NaN)      = NaN
     *
     * [base] {number|string|Decimal} The base of the logarithm.
     *
     */
    P.logarithm = P.log = function (base) {
      var isBase10, d, denominator, k, inf, num, sd, r,
        arg = this,
        Ctor = arg.constructor,
        pr = Ctor.precision,
        rm = Ctor.rounding,
        guard = 5;

      // Default base is 10.
      if (base == null) {
        base = new Ctor(10);
        isBase10 = true;
      } else {
        base = new Ctor(base);
        d = base.d;

        // Return NaN if base is negative, or non-finite, or is 0 or 1.
        if (base.s < 0 || !d || !d[0] || base.eq(1)) return new Ctor(NaN);

        isBase10 = base.eq(10);
      }

      d = arg.d;

      // Is arg negative, non-finite, 0 or 1?
      if (arg.s < 0 || !d || !d[0] || arg.eq(1)) {
        return new Ctor(d && !d[0] ? -1 / 0 : arg.s != 1 ? NaN : d ? 0 : 1 / 0);
      }

      // The result will have a non-terminating decimal expansion if base is 10 and arg is not an
      // integer power of 10.
      if (isBase10) {
        if (d.length > 1) {
          inf = true;
        } else {
          for (k = d[0]; k % 10 === 0;) k /= 10;
          inf = k !== 1;
        }
      }

      external = false;
      sd = pr + guard;
      num = naturalLogarithm(arg, sd);
      denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);

      // The result will have 5 rounding digits.
      r = divide$1(num, denominator, sd, 1);

      // If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
      // calculate 10 further digits.
      //
      // If the result is known to have an infinite decimal expansion, repeat this until it is clear
      // that the result is above or below the boundary. Otherwise, if after calculating the 10
      // further digits, the last 14 are nines, round up and assume the result is exact.
      // Also assume the result is exact if the last 14 are zero.
      //
      // Example of a result that will be incorrectly rounded:
      // log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
      // The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
      // will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
      // the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
      // place is still 2.6.
      if (checkRoundingDigits(r.d, k = pr, rm)) {

        do {
          sd += 10;
          num = naturalLogarithm(arg, sd);
          denominator = isBase10 ? getLn10(Ctor, sd + 10) : naturalLogarithm(base, sd);
          r = divide$1(num, denominator, sd, 1);

          if (!inf) {

            // Check for 14 nines from the 2nd rounding digit, as the first may be 4.
            if (+digitsToString(r.d).slice(k + 1, k + 15) + 1 == 1e14) {
              r = finalise(r, pr + 1, 0);
            }

            break;
          }
        } while (checkRoundingDigits(r.d, k += 10, rm));
      }

      external = true;

      return finalise(r, pr, rm);
    };


    /*
     * Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
     *
     * arguments {number|string|Decimal}
     *
    P.max = function () {
      Array.prototype.push.call(arguments, this);
      return maxOrMin(this.constructor, arguments, 'lt');
    };
     */


    /*
     * Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
     *
     * arguments {number|string|Decimal}
     *
    P.min = function () {
      Array.prototype.push.call(arguments, this);
      return maxOrMin(this.constructor, arguments, 'gt');
    };
     */


    /*
     *  n - 0 = n
     *  n - N = N
     *  n - I = -I
     *  0 - n = -n
     *  0 - 0 = 0
     *  0 - N = N
     *  0 - I = -I
     *  N - n = N
     *  N - 0 = N
     *  N - N = N
     *  N - I = N
     *  I - n = I
     *  I - 0 = I
     *  I - N = N
     *  I - I = N
     *
     * Return a new Decimal whose value is the value of this Decimal minus `y`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.minus = P.sub = function (y) {
      var d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // If either is not finite...
      if (!x.d || !y.d) {

        // Return NaN if either is NaN.
        if (!x.s || !y.s) y = new Ctor(NaN);

        // Return y negated if x is finite and y is ±Infinity.
        else if (x.d) y.s = -y.s;

        // Return x if y is finite and x is ±Infinity.
        // Return x if both are ±Infinity with different signs.
        // Return NaN if both are ±Infinity with the same sign.
        else y = new Ctor(y.d || x.s !== y.s ? x : NaN);

        return y;
      }

      // If signs differ...
      if (x.s != y.s) {
        y.s = -y.s;
        return x.plus(y);
      }

      xd = x.d;
      yd = y.d;
      pr = Ctor.precision;
      rm = Ctor.rounding;

      // If either is zero...
      if (!xd[0] || !yd[0]) {

        // Return y negated if x is zero and y is non-zero.
        if (yd[0]) y.s = -y.s;

        // Return x if y is zero and x is non-zero.
        else if (xd[0]) y = new Ctor(x);

        // Return zero if both are zero.
        // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
        else return new Ctor(rm === 3 ? -0 : 0);

        return external ? finalise(y, pr, rm) : y;
      }

      // x and y are finite, non-zero numbers with the same sign.

      // Calculate base 1e7 exponents.
      e = mathfloor(y.e / LOG_BASE);
      xe = mathfloor(x.e / LOG_BASE);

      xd = xd.slice();
      k = xe - e;

      // If base 1e7 exponents differ...
      if (k) {
        xLTy = k < 0;

        if (xLTy) {
          d = xd;
          k = -k;
          len = yd.length;
        } else {
          d = yd;
          e = xe;
          len = xd.length;
        }

        // Numbers with massively different exponents would result in a very high number of
        // zeros needing to be prepended, but this can be avoided while still ensuring correct
        // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
        i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;

        if (k > i) {
          k = i;
          d.length = 1;
        }

        // Prepend zeros to equalise exponents.
        d.reverse();
        for (i = k; i--;) d.push(0);
        d.reverse();

      // Base 1e7 exponents equal.
      } else {

        // Check digits to determine which is the bigger number.

        i = xd.length;
        len = yd.length;
        xLTy = i < len;
        if (xLTy) len = i;

        for (i = 0; i < len; i++) {
          if (xd[i] != yd[i]) {
            xLTy = xd[i] < yd[i];
            break;
          }
        }

        k = 0;
      }

      if (xLTy) {
        d = xd;
        xd = yd;
        yd = d;
        y.s = -y.s;
      }

      len = xd.length;

      // Append zeros to `xd` if shorter.
      // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
      for (i = yd.length - len; i > 0; --i) xd[len++] = 0;

      // Subtract yd from xd.
      for (i = yd.length; i > k;) {

        if (xd[--i] < yd[i]) {
          for (j = i; j && xd[--j] === 0;) xd[j] = BASE - 1;
          --xd[j];
          xd[i] += BASE;
        }

        xd[i] -= yd[i];
      }

      // Remove trailing zeros.
      for (; xd[--len] === 0;) xd.pop();

      // Remove leading zeros and adjust exponent accordingly.
      for (; xd[0] === 0; xd.shift()) --e;

      // Zero?
      if (!xd[0]) return new Ctor(rm === 3 ? -0 : 0);

      y.d = xd;
      y.e = getBase10Exponent(xd, e);

      return external ? finalise(y, pr, rm) : y;
    };


    /*
     *   n % 0 =  N
     *   n % N =  N
     *   n % I =  n
     *   0 % n =  0
     *  -0 % n = -0
     *   0 % 0 =  N
     *   0 % N =  N
     *   0 % I =  0
     *   N % n =  N
     *   N % 0 =  N
     *   N % N =  N
     *   N % I =  N
     *   I % n =  N
     *   I % 0 =  N
     *   I % N =  N
     *   I % I =  N
     *
     * Return a new Decimal whose value is the value of this Decimal modulo `y`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * The result depends on the modulo mode.
     *
     */
    P.modulo = P.mod = function (y) {
      var q,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
      if (!x.d || !y.s || y.d && !y.d[0]) return new Ctor(NaN);

      // Return x if y is ±Infinity or x is ±0.
      if (!y.d || x.d && !x.d[0]) {
        return finalise(new Ctor(x), Ctor.precision, Ctor.rounding);
      }

      // Prevent rounding of intermediate calculations.
      external = false;

      if (Ctor.modulo == 9) {

        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // result = x - q * y    where  0 <= result < abs(y)
        q = divide$1(x, y.abs(), 0, 3, 1);
        q.s *= y.s;
      } else {
        q = divide$1(x, y, 0, Ctor.modulo, 1);
      }

      q = q.times(y);

      external = true;

      return x.minus(q);
    };


    /*
     * Return a new Decimal whose value is the natural exponential of the value of this Decimal,
     * i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.naturalExponential = P.exp = function () {
      return naturalExponential(this);
    };


    /*
     * Return a new Decimal whose value is the natural logarithm of the value of this Decimal,
     * rounded to `precision` significant digits using rounding mode `rounding`.
     *
     */
    P.naturalLogarithm = P.ln = function () {
      return naturalLogarithm(this);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal negated, i.e. as if multiplied by
     * -1.
     *
     */
    P.negated = P.neg = function () {
      var x = new this.constructor(this);
      x.s = -x.s;
      return finalise(x);
    };


    /*
     *  n + 0 = n
     *  n + N = N
     *  n + I = I
     *  0 + n = n
     *  0 + 0 = 0
     *  0 + N = N
     *  0 + I = I
     *  N + n = N
     *  N + 0 = N
     *  N + N = N
     *  N + I = N
     *  I + n = I
     *  I + 0 = I
     *  I + N = N
     *  I + I = I
     *
     * Return a new Decimal whose value is the value of this Decimal plus `y`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     */
    P.plus = P.add = function (y) {
      var carry, d, e, i, k, len, pr, rm, xd, yd,
        x = this,
        Ctor = x.constructor;

      y = new Ctor(y);

      // If either is not finite...
      if (!x.d || !y.d) {

        // Return NaN if either is NaN.
        if (!x.s || !y.s) y = new Ctor(NaN);

        // Return x if y is finite and x is ±Infinity.
        // Return x if both are ±Infinity with the same sign.
        // Return NaN if both are ±Infinity with different signs.
        // Return y if x is finite and y is ±Infinity.
        else if (!x.d) y = new Ctor(y.d || x.s === y.s ? x : NaN);

        return y;
      }

       // If signs differ...
      if (x.s != y.s) {
        y.s = -y.s;
        return x.minus(y);
      }

      xd = x.d;
      yd = y.d;
      pr = Ctor.precision;
      rm = Ctor.rounding;

      // If either is zero...
      if (!xd[0] || !yd[0]) {

        // Return x if y is zero.
        // Return y if y is non-zero.
        if (!yd[0]) y = new Ctor(x);

        return external ? finalise(y, pr, rm) : y;
      }

      // x and y are finite, non-zero numbers with the same sign.

      // Calculate base 1e7 exponents.
      k = mathfloor(x.e / LOG_BASE);
      e = mathfloor(y.e / LOG_BASE);

      xd = xd.slice();
      i = k - e;

      // If base 1e7 exponents differ...
      if (i) {

        if (i < 0) {
          d = xd;
          i = -i;
          len = yd.length;
        } else {
          d = yd;
          e = k;
          len = xd.length;
        }

        // Limit number of zeros prepended to max(ceil(pr / LOG_BASE), len) + 1.
        k = Math.ceil(pr / LOG_BASE);
        len = k > len ? k + 1 : len + 1;

        if (i > len) {
          i = len;
          d.length = 1;
        }

        // Prepend zeros to equalise exponents. Note: Faster to use reverse then do unshifts.
        d.reverse();
        for (; i--;) d.push(0);
        d.reverse();
      }

      len = xd.length;
      i = yd.length;

      // If yd is longer than xd, swap xd and yd so xd points to the longer array.
      if (len - i < 0) {
        i = len;
        d = yd;
        yd = xd;
        xd = d;
      }

      // Only start adding at yd.length - 1 as the further digits of xd can be left as they are.
      for (carry = 0; i;) {
        carry = (xd[--i] = xd[i] + yd[i] + carry) / BASE | 0;
        xd[i] %= BASE;
      }

      if (carry) {
        xd.unshift(carry);
        ++e;
      }

      // Remove trailing zeros.
      // No need to check for zero, as +x + +y != 0 && -x + -y != 0
      for (len = xd.length; xd[--len] == 0;) xd.pop();

      y.d = xd;
      y.e = getBase10Exponent(xd, e);

      return external ? finalise(y, pr, rm) : y;
    };


    /*
     * Return the number of significant digits of the value of this Decimal.
     *
     * [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
     *
     */
    P.precision = P.sd = function (z) {
      var k,
        x = this;

      if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) throw Error(invalidArgument + z);

      if (x.d) {
        k = getPrecision(x.d);
        if (z && x.e + 1 > k) k = x.e + 1;
      } else {
        k = NaN;
      }

      return k;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a whole number using
     * rounding mode `rounding`.
     *
     */
    P.round = function () {
      var x = this,
        Ctor = x.constructor;

      return finalise(new Ctor(x), x.e + 1, Ctor.rounding);
    };


    /*
     * Return a new Decimal whose value is the sine of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-1, 1]
     *
     * sin(x) = x - x^3/3! + x^5/5! - ...
     *
     * sin(0)         = 0
     * sin(-0)        = -0
     * sin(Infinity)  = NaN
     * sin(-Infinity) = NaN
     * sin(NaN)       = NaN
     *
     */
    P.sine = P.sin = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + Math.max(x.e, x.sd()) + LOG_BASE;
      Ctor.rounding = 1;

      x = sine(Ctor, toLessThanHalfPi(Ctor, x));

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant > 2 ? x.neg() : x, pr, rm, true);
    };


    /*
     * Return a new Decimal whose value is the square root of this Decimal, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     *  sqrt(-n) =  N
     *  sqrt(N)  =  N
     *  sqrt(-I) =  N
     *  sqrt(I)  =  I
     *  sqrt(0)  =  0
     *  sqrt(-0) = -0
     *
     */
    P.squareRoot = P.sqrt = function () {
      var m, n, sd, r, rep, t,
        x = this,
        d = x.d,
        e = x.e,
        s = x.s,
        Ctor = x.constructor;

      // Negative/NaN/Infinity/zero?
      if (s !== 1 || !d || !d[0]) {
        return new Ctor(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
      }

      external = false;

      // Initial estimate.
      s = Math.sqrt(+x);

      // Math.sqrt underflow/overflow?
      // Pass x to Math.sqrt as integer, then adjust the exponent of the result.
      if (s == 0 || s == 1 / 0) {
        n = digitsToString(d);

        if ((n.length + e) % 2 == 0) n += '0';
        s = Math.sqrt(n);
        e = mathfloor((e + 1) / 2) - (e < 0 || e % 2);

        if (s == 1 / 0) {
          n = '1e' + e;
        } else {
          n = s.toExponential();
          n = n.slice(0, n.indexOf('e') + 1) + e;
        }

        r = new Ctor(n);
      } else {
        r = new Ctor(s.toString());
      }

      sd = (e = Ctor.precision) + 3;

      // Newton-Raphson iteration.
      for (;;) {
        t = r;
        r = t.plus(divide$1(x, t, sd + 2, 1)).times(0.5);

        // TODO? Replace with for-loop and checkRoundingDigits.
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
          n = n.slice(sd - 3, sd + 1);

          // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
          // 4999, i.e. approaching a rounding boundary, continue the iteration.
          if (n == '9999' || !rep && n == '4999') {

            // On the first iteration only, check to see if rounding up gives the exact result as the
            // nines may infinitely repeat.
            if (!rep) {
              finalise(t, e + 1, 0);

              if (t.times(t).eq(x)) {
                r = t;
                break;
              }
            }

            sd += 4;
            rep = 1;
          } else {

            // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
            // If not, then there are further digits and m will be truthy.
            if (!+n || !+n.slice(1) && n.charAt(0) == '5') {

              // Truncate to the first rounding digit.
              finalise(r, e + 1, 1);
              m = !r.times(r).eq(x);
            }

            break;
          }
        }
      }

      external = true;

      return finalise(r, e, Ctor.rounding, m);
    };


    /*
     * Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-Infinity, Infinity]
     *
     * tan(0)         = 0
     * tan(-0)        = -0
     * tan(Infinity)  = NaN
     * tan(-Infinity) = NaN
     * tan(NaN)       = NaN
     *
     */
    P.tangent = P.tan = function () {
      var pr, rm,
        x = this,
        Ctor = x.constructor;

      if (!x.isFinite()) return new Ctor(NaN);
      if (x.isZero()) return new Ctor(x);

      pr = Ctor.precision;
      rm = Ctor.rounding;
      Ctor.precision = pr + 10;
      Ctor.rounding = 1;

      x = x.sin();
      x.s = 1;
      x = divide$1(x, new Ctor(1).minus(x.times(x)).sqrt(), pr + 10, 0);

      Ctor.precision = pr;
      Ctor.rounding = rm;

      return finalise(quadrant == 2 || quadrant == 4 ? x.neg() : x, pr, rm, true);
    };


    /*
     *  n * 0 = 0
     *  n * N = N
     *  n * I = I
     *  0 * n = 0
     *  0 * 0 = 0
     *  0 * N = N
     *  0 * I = N
     *  N * n = N
     *  N * 0 = N
     *  N * N = N
     *  N * I = N
     *  I * n = I
     *  I * 0 = N
     *  I * N = N
     *  I * I = I
     *
     * Return a new Decimal whose value is this Decimal times `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     */
    P.times = P.mul = function (y) {
      var carry, e, i, k, r, rL, t, xdL, ydL,
        x = this,
        Ctor = x.constructor,
        xd = x.d,
        yd = (y = new Ctor(y)).d;

      y.s *= x.s;

       // If either is NaN, ±Infinity or ±0...
      if (!xd || !xd[0] || !yd || !yd[0]) {

        return new Ctor(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd

          // Return NaN if either is NaN.
          // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
          ? NaN

          // Return ±Infinity if either is ±Infinity.
          // Return ±0 if either is ±0.
          : !xd || !yd ? y.s / 0 : y.s * 0);
      }

      e = mathfloor(x.e / LOG_BASE) + mathfloor(y.e / LOG_BASE);
      xdL = xd.length;
      ydL = yd.length;

      // Ensure xd points to the longer array.
      if (xdL < ydL) {
        r = xd;
        xd = yd;
        yd = r;
        rL = xdL;
        xdL = ydL;
        ydL = rL;
      }

      // Initialise the result array with zeros.
      r = [];
      rL = xdL + ydL;
      for (i = rL; i--;) r.push(0);

      // Multiply!
      for (i = ydL; --i >= 0;) {
        carry = 0;
        for (k = xdL + i; k > i;) {
          t = r[k] + yd[i] * xd[k - i - 1] + carry;
          r[k--] = t % BASE | 0;
          carry = t / BASE | 0;
        }

        r[k] = (r[k] + carry) % BASE | 0;
      }

      // Remove trailing zeros.
      for (; !r[--rL];) r.pop();

      if (carry) ++e;
      else r.shift();

      y.d = r;
      y.e = getBase10Exponent(r, e);

      return external ? finalise(y, Ctor.precision, Ctor.rounding) : y;
    };


    /*
     * Return a string representing the value of this Decimal in base 2, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toBinary = function (sd, rm) {
      return toStringBinary(this, 2, sd, rm);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
     * decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
     *
     * If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toDecimalPlaces = P.toDP = function (dp, rm) {
      var x = this,
        Ctor = x.constructor;

      x = new Ctor(x);
      if (dp === void 0) return x;

      checkInt32(dp, 0, MAX_DIGITS);

      if (rm === void 0) rm = Ctor.rounding;
      else checkInt32(rm, 0, 8);

      return finalise(x, dp + x.e + 1, rm);
    };


    /*
     * Return a string representing the value of this Decimal in exponential notation rounded to
     * `dp` fixed decimal places using rounding mode `rounding`.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toExponential = function (dp, rm) {
      var str,
        x = this,
        Ctor = x.constructor;

      if (dp === void 0) {
        str = finiteToString(x, true);
      } else {
        checkInt32(dp, 0, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        x = finalise(new Ctor(x), dp + 1, rm);
        str = finiteToString(x, true, dp + 1);
      }

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a string representing the value of this Decimal in normal (fixed-point) notation to
     * `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is
     * omitted.
     *
     * As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
     *
     * [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
     * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
     * (-0).toFixed(3) is '0.000'.
     * (-0.5).toFixed(0) is '-0'.
     *
     */
    P.toFixed = function (dp, rm) {
      var str, y,
        x = this,
        Ctor = x.constructor;

      if (dp === void 0) {
        str = finiteToString(x);
      } else {
        checkInt32(dp, 0, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        y = finalise(new Ctor(x), dp + x.e + 1, rm);
        str = finiteToString(y, false, dp + y.e + 1);
      }

      // To determine whether to add the minus sign look at the value before it was rounded,
      // i.e. look at `x` rather than `y`.
      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return an array representing the value of this Decimal as a simple fraction with an integer
     * numerator and an integer denominator.
     *
     * The denominator will be a positive non-zero value less than or equal to the specified maximum
     * denominator. If a maximum denominator is not specified, the denominator will be the lowest
     * value necessary to represent the number exactly.
     *
     * [maxD] {number|string|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
     *
     */
    P.toFraction = function (maxD) {
      var d, d0, d1, d2, e, k, n, n0, n1, pr, q, r,
        x = this,
        xd = x.d,
        Ctor = x.constructor;

      if (!xd) return new Ctor(x);

      n1 = d0 = new Ctor(1);
      d1 = n0 = new Ctor(0);

      d = new Ctor(d1);
      e = d.e = getPrecision(xd) - x.e - 1;
      k = e % LOG_BASE;
      d.d[0] = mathpow(10, k < 0 ? LOG_BASE + k : k);

      if (maxD == null) {

        // d is 10**e, the minimum max-denominator needed.
        maxD = e > 0 ? d : n1;
      } else {
        n = new Ctor(maxD);
        if (!n.isInt() || n.lt(n1)) throw Error(invalidArgument + n);
        maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
      }

      external = false;
      n = new Ctor(digitsToString(xd));
      pr = Ctor.precision;
      Ctor.precision = e = xd.length * LOG_BASE * 2;

      for (;;)  {
        q = divide$1(n, d, 0, 1, 1);
        d2 = d0.plus(q.times(d1));
        if (d2.cmp(maxD) == 1) break;
        d0 = d1;
        d1 = d2;
        d2 = n1;
        n1 = n0.plus(q.times(d2));
        n0 = d2;
        d2 = d;
        d = n.minus(q.times(d2));
        n = d2;
      }

      d2 = divide$1(maxD.minus(d0), d1, 0, 1, 1);
      n0 = n0.plus(d2.times(n1));
      d0 = d0.plus(d2.times(d1));
      n0.s = n1.s = x.s;

      // Determine which fraction is closer to x, n0/d0 or n1/d1?
      r = divide$1(n1, d1, e, 1).minus(x).abs().cmp(divide$1(n0, d0, e, 1).minus(x).abs()) < 1
          ? [n1, d1] : [n0, d0];

      Ctor.precision = pr;
      external = true;

      return r;
    };


    /*
     * Return a string representing the value of this Decimal in base 16, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toHexadecimal = P.toHex = function (sd, rm) {
      return toStringBinary(this, 16, sd, rm);
    };


    /*
     * Returns a new Decimal whose value is the nearest multiple of `y` in the direction of rounding
     * mode `rm`, or `Decimal.rounding` if `rm` is omitted, to the value of this Decimal.
     *
     * The return value will always have the same sign as this Decimal, unless either this Decimal
     * or `y` is NaN, in which case the return value will be also be NaN.
     *
     * The return value is not affected by the value of `precision`.
     *
     * y {number|string|Decimal} The magnitude to round to a multiple of.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * 'toNearest() rounding mode not an integer: {rm}'
     * 'toNearest() rounding mode out of range: {rm}'
     *
     */
    P.toNearest = function (y, rm) {
      var x = this,
        Ctor = x.constructor;

      x = new Ctor(x);

      if (y == null) {

        // If x is not finite, return x.
        if (!x.d) return x;

        y = new Ctor(1);
        rm = Ctor.rounding;
      } else {
        y = new Ctor(y);
        if (rm === void 0) {
          rm = Ctor.rounding;
        } else {
          checkInt32(rm, 0, 8);
        }

        // If x is not finite, return x if y is not NaN, else NaN.
        if (!x.d) return y.s ? x : y;

        // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
        if (!y.d) {
          if (y.s) y.s = x.s;
          return y;
        }
      }

      // If y is not zero, calculate the nearest multiple of y to x.
      if (y.d[0]) {
        external = false;
        x = divide$1(x, y, 0, rm, 1).times(y);
        external = true;
        finalise(x);

      // If y is zero, return zero with the sign of x.
      } else {
        y.s = x.s;
        x = y;
      }

      return x;
    };


    /*
     * Return the value of this Decimal converted to a number primitive.
     * Zero keeps its sign.
     *
     */
    P.toNumber = function () {
      return +this;
    };


    /*
     * Return a string representing the value of this Decimal in base 8, round to `sd` significant
     * digits using rounding mode `rm`.
     *
     * If the optional `sd` argument is present then return binary exponential notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toOctal = function (sd, rm) {
      return toStringBinary(this, 8, sd, rm);
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal raised to the power `y`, rounded
     * to `precision` significant digits using rounding mode `rounding`.
     *
     * ECMAScript compliant.
     *
     *   pow(x, NaN)                           = NaN
     *   pow(x, ±0)                            = 1

     *   pow(NaN, non-zero)                    = NaN
     *   pow(abs(x) > 1, +Infinity)            = +Infinity
     *   pow(abs(x) > 1, -Infinity)            = +0
     *   pow(abs(x) == 1, ±Infinity)           = NaN
     *   pow(abs(x) < 1, +Infinity)            = +0
     *   pow(abs(x) < 1, -Infinity)            = +Infinity
     *   pow(+Infinity, y > 0)                 = +Infinity
     *   pow(+Infinity, y < 0)                 = +0
     *   pow(-Infinity, odd integer > 0)       = -Infinity
     *   pow(-Infinity, even integer > 0)      = +Infinity
     *   pow(-Infinity, odd integer < 0)       = -0
     *   pow(-Infinity, even integer < 0)      = +0
     *   pow(+0, y > 0)                        = +0
     *   pow(+0, y < 0)                        = +Infinity
     *   pow(-0, odd integer > 0)              = -0
     *   pow(-0, even integer > 0)             = +0
     *   pow(-0, odd integer < 0)              = -Infinity
     *   pow(-0, even integer < 0)             = +Infinity
     *   pow(finite x < 0, finite non-integer) = NaN
     *
     * For non-integer or very large exponents pow(x, y) is calculated using
     *
     *   x^y = exp(y*ln(x))
     *
     * Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
     * probability of an incorrectly rounded result
     * P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
     * i.e. 1 in 250,000,000,000,000
     *
     * If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
     *
     * y {number|string|Decimal} The power to which to raise this Decimal.
     *
     */
    P.toPower = P.pow = function (y) {
      var e, k, pr, r, rm, s,
        x = this,
        Ctor = x.constructor,
        yn = +(y = new Ctor(y));

      // Either ±Infinity, NaN or ±0?
      if (!x.d || !y.d || !x.d[0] || !y.d[0]) return new Ctor(mathpow(+x, yn));

      x = new Ctor(x);

      if (x.eq(1)) return x;

      pr = Ctor.precision;
      rm = Ctor.rounding;

      if (y.eq(1)) return finalise(x, pr, rm);

      // y exponent
      e = mathfloor(y.e / LOG_BASE);

      // If y is a small integer use the 'exponentiation by squaring' algorithm.
      if (e >= y.d.length - 1 && (k = yn < 0 ? -yn : yn) <= MAX_SAFE_INTEGER) {
        r = intPow(Ctor, x, k, pr);
        return y.s < 0 ? new Ctor(1).div(r) : finalise(r, pr, rm);
      }

      s = x.s;

      // if x is negative
      if (s < 0) {

        // if y is not an integer
        if (e < y.d.length - 1) return new Ctor(NaN);

        // Result is positive if x is negative and the last digit of integer y is even.
        if ((y.d[e] & 1) == 0) s = 1;

        // if x.eq(-1)
        if (x.e == 0 && x.d[0] == 1 && x.d.length == 1) {
          x.s = s;
          return x;
        }
      }

      // Estimate result exponent.
      // x^y = 10^e,  where e = y * log10(x)
      // log10(x) = log10(x_significand) + x_exponent
      // log10(x_significand) = ln(x_significand) / ln(10)
      k = mathpow(+x, yn);
      e = k == 0 || !isFinite(k)
        ? mathfloor(yn * (Math.log('0.' + digitsToString(x.d)) / Math.LN10 + x.e + 1))
        : new Ctor(k + '').e;

      // Exponent estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

      // Overflow/underflow?
      if (e > Ctor.maxE + 1 || e < Ctor.minE - 1) return new Ctor(e > 0 ? s / 0 : 0);

      external = false;
      Ctor.rounding = x.s = 1;

      // Estimate the extra guard digits needed to ensure five correct rounding digits from
      // naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
      // new Decimal(2.32456).pow('2087987436534566.46411')
      // should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
      k = Math.min(12, (e + '').length);

      // r = x^y = exp(y*ln(x))
      r = naturalExponential(y.times(naturalLogarithm(x, pr + k)), pr);

      // r may be Infinity, e.g. (0.9999999999999999).pow(-1e+40)
      if (r.d) {

        // Truncate to the required precision plus five rounding digits.
        r = finalise(r, pr + 5, 1);

        // If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
        // the result.
        if (checkRoundingDigits(r.d, pr, rm)) {
          e = pr + 10;

          // Truncate to the increased precision plus five rounding digits.
          r = finalise(naturalExponential(y.times(naturalLogarithm(x, e + k)), e), e + 5, 1);

          // Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
          if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14) {
            r = finalise(r, pr + 1, 0);
          }
        }
      }

      r.s = s;
      external = true;
      Ctor.rounding = rm;

      return finalise(r, pr, rm);
    };


    /*
     * Return a string representing the value of this Decimal rounded to `sd` significant digits
     * using rounding mode `rounding`.
     *
     * Return exponential notation if `sd` is less than the number of digits necessary to represent
     * the integer part of the value in normal notation.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     */
    P.toPrecision = function (sd, rm) {
      var str,
        x = this,
        Ctor = x.constructor;

      if (sd === void 0) {
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);
      } else {
        checkInt32(sd, 1, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);

        x = finalise(new Ctor(x), sd, rm);
        str = finiteToString(x, sd <= x.e || x.e <= Ctor.toExpNeg, sd);
      }

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
     * significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
     * omitted.
     *
     * [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
     * [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
     *
     * 'toSD() digits out of range: {sd}'
     * 'toSD() digits not an integer: {sd}'
     * 'toSD() rounding mode not an integer: {rm}'
     * 'toSD() rounding mode out of range: {rm}'
     *
     */
    P.toSignificantDigits = P.toSD = function (sd, rm) {
      var x = this,
        Ctor = x.constructor;

      if (sd === void 0) {
        sd = Ctor.precision;
        rm = Ctor.rounding;
      } else {
        checkInt32(sd, 1, MAX_DIGITS);

        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
      }

      return finalise(new Ctor(x), sd, rm);
    };


    /*
     * Return a string representing the value of this Decimal.
     *
     * Return exponential notation if this Decimal has a positive exponent equal to or greater than
     * `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
     *
     */
    P.toString = function () {
      var x = this,
        Ctor = x.constructor,
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

      return x.isNeg() && !x.isZero() ? '-' + str : str;
    };


    /*
     * Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
     *
     */
    P.truncated = P.trunc = function () {
      return finalise(new this.constructor(this), this.e + 1, 1);
    };


    /*
     * Return a string representing the value of this Decimal.
     * Unlike `toString`, negative zero will include the minus sign.
     *
     */
    P.valueOf = P.toJSON = function () {
      var x = this,
        Ctor = x.constructor,
        str = finiteToString(x, x.e <= Ctor.toExpNeg || x.e >= Ctor.toExpPos);

      return x.isNeg() ? '-' + str : str;
    };


    /*
    // Add aliases to match BigDecimal method names.
    // P.add = P.plus;
    P.subtract = P.minus;
    P.multiply = P.times;
    P.divide = P.div;
    P.remainder = P.mod;
    P.compareTo = P.cmp;
    P.negate = P.neg;
     */


    // Helper functions for Decimal.prototype (P) and/or Decimal methods, and their callers.


    /*
     *  digitsToString           P.cubeRoot, P.logarithm, P.squareRoot, P.toFraction, P.toPower,
     *                           finiteToString, naturalExponential, naturalLogarithm
     *  checkInt32               P.toDecimalPlaces, P.toExponential, P.toFixed, P.toNearest,
     *                           P.toPrecision, P.toSignificantDigits, toStringBinary, random
     *  checkRoundingDigits      P.logarithm, P.toPower, naturalExponential, naturalLogarithm
     *  convertBase              toStringBinary, parseOther
     *  cos                      P.cos
     *  divide                   P.atanh, P.cubeRoot, P.dividedBy, P.dividedToIntegerBy,
     *                           P.logarithm, P.modulo, P.squareRoot, P.tan, P.tanh, P.toFraction,
     *                           P.toNearest, toStringBinary, naturalExponential, naturalLogarithm,
     *                           taylorSeries, atan2, parseOther
     *  finalise                 P.absoluteValue, P.atan, P.atanh, P.ceil, P.cos, P.cosh,
     *                           P.cubeRoot, P.dividedToIntegerBy, P.floor, P.logarithm, P.minus,
     *                           P.modulo, P.negated, P.plus, P.round, P.sin, P.sinh, P.squareRoot,
     *                           P.tan, P.times, P.toDecimalPlaces, P.toExponential, P.toFixed,
     *                           P.toNearest, P.toPower, P.toPrecision, P.toSignificantDigits,
     *                           P.truncated, divide, getLn10, getPi, naturalExponential,
     *                           naturalLogarithm, ceil, floor, round, trunc
     *  finiteToString           P.toExponential, P.toFixed, P.toPrecision, P.toString, P.valueOf,
     *                           toStringBinary
     *  getBase10Exponent        P.minus, P.plus, P.times, parseOther
     *  getLn10                  P.logarithm, naturalLogarithm
     *  getPi                    P.acos, P.asin, P.atan, toLessThanHalfPi, atan2
     *  getPrecision             P.precision, P.toFraction
     *  getZeroString            digitsToString, finiteToString
     *  intPow                   P.toPower, parseOther
     *  isOdd                    toLessThanHalfPi
     *  maxOrMin                 max, min
     *  naturalExponential       P.naturalExponential, P.toPower
     *  naturalLogarithm         P.acosh, P.asinh, P.atanh, P.logarithm, P.naturalLogarithm,
     *                           P.toPower, naturalExponential
     *  nonFiniteToString        finiteToString, toStringBinary
     *  parseDecimal             Decimal
     *  parseOther               Decimal
     *  sin                      P.sin
     *  taylorSeries             P.cosh, P.sinh, cos, sin
     *  toLessThanHalfPi         P.cos, P.sin
     *  toStringBinary           P.toBinary, P.toHexadecimal, P.toOctal
     *  truncate                 intPow
     *
     *  Throws:                  P.logarithm, P.precision, P.toFraction, checkInt32, getLn10, getPi,
     *                           naturalLogarithm, config, parseOther, random, Decimal
     */


    function digitsToString(d) {
      var i, k, ws,
        indexOfLastWord = d.length - 1,
        str = '',
        w = d[0];

      if (indexOfLastWord > 0) {
        str += w;
        for (i = 1; i < indexOfLastWord; i++) {
          ws = d[i] + '';
          k = LOG_BASE - ws.length;
          if (k) str += getZeroString(k);
          str += ws;
        }

        w = d[i];
        ws = w + '';
        k = LOG_BASE - ws.length;
        if (k) str += getZeroString(k);
      } else if (w === 0) {
        return '0';
      }

      // Remove trailing zeros of last w.
      for (; w % 10 === 0;) w /= 10;

      return str + w;
    }


    function checkInt32(i, min, max) {
      if (i !== ~~i || i < min || i > max) {
        throw Error(invalidArgument + i);
      }
    }


    /*
     * Check 5 rounding digits if `repeating` is null, 4 otherwise.
     * `repeating == null` if caller is `log` or `pow`,
     * `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
     */
    function checkRoundingDigits(d, i, rm, repeating) {
      var di, k, r, rd;

      // Get the length of the first word of the array d.
      for (k = d[0]; k >= 10; k /= 10) --i;

      // Is the rounding digit in the first word of d?
      if (--i < 0) {
        i += LOG_BASE;
        di = 0;
      } else {
        di = Math.ceil((i + 1) / LOG_BASE);
        i %= LOG_BASE;
      }

      // i is the index (0 - 6) of the rounding digit.
      // E.g. if within the word 3487563 the first rounding digit is 5,
      // then i = 4, k = 1000, rd = 3487563 % 1000 = 563
      k = mathpow(10, LOG_BASE - i);
      rd = d[di] % k | 0;

      if (repeating == null) {
        if (i < 3) {
          if (i == 0) rd = rd / 100 | 0;
          else if (i == 1) rd = rd / 10 | 0;
          r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
        } else {
          r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
            (d[di + 1] / k / 100 | 0) == mathpow(10, i - 2) - 1 ||
              (rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
        }
      } else {
        if (i < 4) {
          if (i == 0) rd = rd / 1000 | 0;
          else if (i == 1) rd = rd / 100 | 0;
          else if (i == 2) rd = rd / 10 | 0;
          r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
        } else {
          r = ((repeating || rm < 4) && rd + 1 == k ||
          (!repeating && rm > 3) && rd + 1 == k / 2) &&
            (d[di + 1] / k / 1000 | 0) == mathpow(10, i - 3) - 1;
        }
      }

      return r;
    }


    // Convert string of `baseIn` to an array of numbers of `baseOut`.
    // Eg. convertBase('255', 10, 16) returns [15, 15].
    // Eg. convertBase('ff', 16, 10) returns [2, 5, 5].
    function convertBase(str, baseIn, baseOut) {
      var j,
        arr = [0],
        arrL,
        i = 0,
        strL = str.length;

      for (; i < strL;) {
        for (arrL = arr.length; arrL--;) arr[arrL] *= baseIn;
        arr[0] += NUMERALS.indexOf(str.charAt(i++));
        for (j = 0; j < arr.length; j++) {
          if (arr[j] > baseOut - 1) {
            if (arr[j + 1] === void 0) arr[j + 1] = 0;
            arr[j + 1] += arr[j] / baseOut | 0;
            arr[j] %= baseOut;
          }
        }
      }

      return arr.reverse();
    }


    /*
     * cos(x) = 1 - x^2/2! + x^4/4! - ...
     * |x| < pi/2
     *
     */
    function cosine(Ctor, x) {
      var k, y,
        len = x.d.length;

      // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
      // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

      // Estimate the optimum number of times to use the argument reduction.
      if (len < 32) {
        k = Math.ceil(len / 3);
        y = (1 / tinyPow(4, k)).toString();
      } else {
        k = 16;
        y = '2.3283064365386962890625e-10';
      }

      Ctor.precision += k;

      x = taylorSeries(Ctor, 1, x.times(y), new Ctor(1));

      // Reverse argument reduction
      for (var i = k; i--;) {
        var cos2x = x.times(x);
        x = cos2x.times(cos2x).minus(cos2x).times(8).plus(1);
      }

      Ctor.precision -= k;

      return x;
    }


    /*
     * Perform division in the specified base.
     */
    var divide$1 = (function () {

      // Assumes non-zero x and k, and hence non-zero result.
      function multiplyInteger(x, k, base) {
        var temp,
          carry = 0,
          i = x.length;

        for (x = x.slice(); i--;) {
          temp = x[i] * k + carry;
          x[i] = temp % base | 0;
          carry = temp / base | 0;
        }

        if (carry) x.unshift(carry);

        return x;
      }

      function compare(a, b, aL, bL) {
        var i, r;

        if (aL != bL) {
          r = aL > bL ? 1 : -1;
        } else {
          for (i = r = 0; i < aL; i++) {
            if (a[i] != b[i]) {
              r = a[i] > b[i] ? 1 : -1;
              break;
            }
          }
        }

        return r;
      }

      function subtract(a, b, aL, base) {
        var i = 0;

        // Subtract b from a.
        for (; aL--;) {
          a[aL] -= i;
          i = a[aL] < b[aL] ? 1 : 0;
          a[aL] = i * base + a[aL] - b[aL];
        }

        // Remove leading zeros.
        for (; !a[0] && a.length > 1;) a.shift();
      }

      return function (x, y, pr, rm, dp, base) {
        var cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
          yL, yz,
          Ctor = x.constructor,
          sign = x.s == y.s ? 1 : -1,
          xd = x.d,
          yd = y.d;

        // Either NaN, Infinity or 0?
        if (!xd || !xd[0] || !yd || !yd[0]) {

          return new Ctor(// Return NaN if either NaN, or both Infinity or 0.
            !x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

            // Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
            xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
        }

        if (base) {
          logBase = 1;
          e = x.e - y.e;
        } else {
          base = BASE;
          logBase = LOG_BASE;
          e = mathfloor(x.e / logBase) - mathfloor(y.e / logBase);
        }

        yL = yd.length;
        xL = xd.length;
        q = new Ctor(sign);
        qd = q.d = [];

        // Result exponent may be one less than e.
        // The digit array of a Decimal from toStringBinary may have trailing zeros.
        for (i = 0; yd[i] == (xd[i] || 0); i++);

        if (yd[i] > (xd[i] || 0)) e--;

        if (pr == null) {
          sd = pr = Ctor.precision;
          rm = Ctor.rounding;
        } else if (dp) {
          sd = pr + (x.e - y.e) + 1;
        } else {
          sd = pr;
        }

        if (sd < 0) {
          qd.push(1);
          more = true;
        } else {

          // Convert precision in number of base 10 digits to base 1e7 digits.
          sd = sd / logBase + 2 | 0;
          i = 0;

          // divisor < 1e7
          if (yL == 1) {
            k = 0;
            yd = yd[0];
            sd++;

            // k is the carry.
            for (; (i < xL || k) && sd--; i++) {
              t = k * base + (xd[i] || 0);
              qd[i] = t / yd | 0;
              k = t % yd | 0;
            }

            more = k || i < xL;

          // divisor >= 1e7
          } else {

            // Normalise xd and yd so highest order digit of yd is >= base/2
            k = base / (yd[0] + 1) | 0;

            if (k > 1) {
              yd = multiplyInteger(yd, k, base);
              xd = multiplyInteger(xd, k, base);
              yL = yd.length;
              xL = xd.length;
            }

            xi = yL;
            rem = xd.slice(0, yL);
            remL = rem.length;

            // Add zeros to make remainder as long as divisor.
            for (; remL < yL;) rem[remL++] = 0;

            yz = yd.slice();
            yz.unshift(0);
            yd0 = yd[0];

            if (yd[1] >= base / 2) ++yd0;

            do {
              k = 0;

              // Compare divisor and remainder.
              cmp = compare(yd, rem, yL, remL);

              // If divisor < remainder.
              if (cmp < 0) {

                // Calculate trial digit, k.
                rem0 = rem[0];
                if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

                // k will be how many times the divisor goes into the current remainder.
                k = rem0 / yd0 | 0;

                //  Algorithm:
                //  1. product = divisor * trial digit (k)
                //  2. if product > remainder: product -= divisor, k--
                //  3. remainder -= product
                //  4. if product was < remainder at 2:
                //    5. compare new remainder and divisor
                //    6. If remainder > divisor: remainder -= divisor, k++

                if (k > 1) {
                  if (k >= base) k = base - 1;

                  // product = divisor * trial digit.
                  prod = multiplyInteger(yd, k, base);
                  prodL = prod.length;
                  remL = rem.length;

                  // Compare product and remainder.
                  cmp = compare(prod, rem, prodL, remL);

                  // product > remainder.
                  if (cmp == 1) {
                    k--;

                    // Subtract divisor from product.
                    subtract(prod, yL < prodL ? yz : yd, prodL, base);
                  }
                } else {

                  // cmp is -1.
                  // If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
                  // to avoid it. If k is 1 there is a need to compare yd and rem again below.
                  if (k == 0) cmp = k = 1;
                  prod = yd.slice();
                }

                prodL = prod.length;
                if (prodL < remL) prod.unshift(0);

                // Subtract product from remainder.
                subtract(rem, prod, remL, base);

                // If product was < previous remainder.
                if (cmp == -1) {
                  remL = rem.length;

                  // Compare divisor and new remainder.
                  cmp = compare(yd, rem, yL, remL);

                  // If divisor < new remainder, subtract divisor from remainder.
                  if (cmp < 1) {
                    k++;

                    // Subtract divisor from remainder.
                    subtract(rem, yL < remL ? yz : yd, remL, base);
                  }
                }

                remL = rem.length;
              } else if (cmp === 0) {
                k++;
                rem = [0];
              }    // if cmp === 1, k will be 0

              // Add the next digit, k, to the result array.
              qd[i++] = k;

              // Update the remainder.
              if (cmp && rem[0]) {
                rem[remL++] = xd[xi] || 0;
              } else {
                rem = [xd[xi]];
                remL = 1;
              }

            } while ((xi++ < xL || rem[0] !== void 0) && sd--);

            more = rem[0] !== void 0;
          }

          // Leading zero?
          if (!qd[0]) qd.shift();
        }

        // logBase is 1 when divide is being used for base conversion.
        if (logBase == 1) {
          q.e = e;
          inexact = more;
        } else {

          // To calculate q.e, first get the number of digits of qd[0].
          for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
          q.e = i + e * logBase - 1;

          finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
        }

        return q;
      };
    })();


    /*
     * Round `x` to `sd` significant digits using rounding mode `rm`.
     * Check for over/under-flow.
     */
     function finalise(x, sd, rm, isTruncated) {
      var digits, i, j, k, rd, roundUp, w, xd, xdi,
        Ctor = x.constructor;

      // Don't round if sd is null or undefined.
      out: if (sd != null) {
        xd = x.d;

        // Infinity/NaN.
        if (!xd) return x;

        // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
        // w: the word of xd containing rd, a base 1e7 number.
        // xdi: the index of w within xd.
        // digits: the number of digits of w.
        // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
        // they had leading zeros)
        // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).

        // Get the length of the first word of the digits array xd.
        for (digits = 1, k = xd[0]; k >= 10; k /= 10) digits++;
        i = sd - digits;

        // Is the rounding digit in the first word of xd?
        if (i < 0) {
          i += LOG_BASE;
          j = sd;
          w = xd[xdi = 0];

          // Get the rounding digit at index j of w.
          rd = w / mathpow(10, digits - j - 1) % 10 | 0;
        } else {
          xdi = Math.ceil((i + 1) / LOG_BASE);
          k = xd.length;
          if (xdi >= k) {
            if (isTruncated) {

              // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
              for (; k++ <= xdi;) xd.push(0);
              w = rd = 0;
              digits = 1;
              i %= LOG_BASE;
              j = i - LOG_BASE + 1;
            } else {
              break out;
            }
          } else {
            w = k = xd[xdi];

            // Get the number of digits of w.
            for (digits = 1; k >= 10; k /= 10) digits++;

            // Get the index of rd within w.
            i %= LOG_BASE;

            // Get the index of rd within w, adjusted for leading zeros.
            // The number of leading zeros of w is given by LOG_BASE - digits.
            j = i - LOG_BASE + digits;

            // Get the rounding digit at index j of w.
            rd = j < 0 ? 0 : w / mathpow(10, digits - j - 1) % 10 | 0;
          }
        }

        // Are there any non-zero digits after the rounding digit?
        isTruncated = isTruncated || sd < 0 ||
          xd[xdi + 1] !== void 0 || (j < 0 ? w : w % mathpow(10, digits - j - 1));

        // The expression `w % mathpow(10, digits - j - 1)` returns all the digits of w to the right
        // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
        // will give 714.

        roundUp = rm < 4
          ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
          : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&

            // Check whether the digit to the left of the rounding digit is odd.
            ((i > 0 ? j > 0 ? w / mathpow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
              rm == (x.s < 0 ? 8 : 7));

        if (sd < 1 || !xd[0]) {
          xd.length = 0;
          if (roundUp) {

            // Convert sd to decimal places.
            sd -= x.e + 1;

            // 1, 0.1, 0.01, 0.001, 0.0001 etc.
            xd[0] = mathpow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
            x.e = -sd || 0;
          } else {

            // Zero.
            xd[0] = x.e = 0;
          }

          return x;
        }

        // Remove excess digits.
        if (i == 0) {
          xd.length = xdi;
          k = 1;
          xdi--;
        } else {
          xd.length = xdi + 1;
          k = mathpow(10, LOG_BASE - i);

          // E.g. 56700 becomes 56000 if 7 is the rounding digit.
          // j > 0 means i > number of leading zeros of w.
          xd[xdi] = j > 0 ? (w / mathpow(10, digits - j) % mathpow(10, j) | 0) * k : 0;
        }

        if (roundUp) {
          for (;;) {

            // Is the digit to be rounded up in the first word of xd?
            if (xdi == 0) {

              // i will be the length of xd[0] before k is added.
              for (i = 1, j = xd[0]; j >= 10; j /= 10) i++;
              j = xd[0] += k;
              for (k = 1; j >= 10; j /= 10) k++;

              // if i != k the length has increased.
              if (i != k) {
                x.e++;
                if (xd[0] == BASE) xd[0] = 1;
              }

              break;
            } else {
              xd[xdi] += k;
              if (xd[xdi] != BASE) break;
              xd[xdi--] = 0;
              k = 1;
            }
          }
        }

        // Remove trailing zeros.
        for (i = xd.length; xd[--i] === 0;) xd.pop();
      }

      if (external) {

        // Overflow?
        if (x.e > Ctor.maxE) {

          // Infinity.
          x.d = null;
          x.e = NaN;

        // Underflow?
        } else if (x.e < Ctor.minE) {

          // Zero.
          x.e = 0;
          x.d = [0];
          // Ctor.underflow = true;
        } // else Ctor.underflow = false;
      }

      return x;
    }


    function finiteToString(x, isExp, sd) {
      if (!x.isFinite()) return nonFiniteToString(x);
      var k,
        e = x.e,
        str = digitsToString(x.d),
        len = str.length;

      if (isExp) {
        if (sd && (k = sd - len) > 0) {
          str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k);
        } else if (len > 1) {
          str = str.charAt(0) + '.' + str.slice(1);
        }

        str = str + (x.e < 0 ? 'e' : 'e+') + x.e;
      } else if (e < 0) {
        str = '0.' + getZeroString(-e - 1) + str;
        if (sd && (k = sd - len) > 0) str += getZeroString(k);
      } else if (e >= len) {
        str += getZeroString(e + 1 - len);
        if (sd && (k = sd - e - 1) > 0) str = str + '.' + getZeroString(k);
      } else {
        if ((k = e + 1) < len) str = str.slice(0, k) + '.' + str.slice(k);
        if (sd && (k = sd - len) > 0) {
          if (e + 1 === len) str += '.';
          str += getZeroString(k);
        }
      }

      return str;
    }


    // Calculate the base 10 exponent from the base 1e7 exponent.
    function getBase10Exponent(digits, e) {
      var w = digits[0];

      // Add the number of digits of the first word of the digits array.
      for ( e *= LOG_BASE; w >= 10; w /= 10) e++;
      return e;
    }


    function getLn10(Ctor, sd, pr) {
      if (sd > LN10_PRECISION) {

        // Reset global state in case the exception is caught.
        external = true;
        if (pr) Ctor.precision = pr;
        throw Error(precisionLimitExceeded);
      }
      return finalise(new Ctor(LN10), sd, 1, true);
    }


    function getPi(Ctor, sd, rm) {
      if (sd > PI_PRECISION) throw Error(precisionLimitExceeded);
      return finalise(new Ctor(PI), sd, rm, true);
    }


    function getPrecision(digits) {
      var w = digits.length - 1,
        len = w * LOG_BASE + 1;

      w = digits[w];

      // If non-zero...
      if (w) {

        // Subtract the number of trailing zeros of the last word.
        for (; w % 10 == 0; w /= 10) len--;

        // Add the number of digits of the first word.
        for (w = digits[0]; w >= 10; w /= 10) len++;
      }

      return len;
    }


    function getZeroString(k) {
      var zs = '';
      for (; k--;) zs += '0';
      return zs;
    }


    /*
     * Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
     * integer of type number.
     *
     * Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
     *
     */
    function intPow(Ctor, x, n, pr) {
      var isTruncated,
        r = new Ctor(1),

        // Max n of 9007199254740991 takes 53 loop iterations.
        // Maximum digits array length; leaves [28, 34] guard digits.
        k = Math.ceil(pr / LOG_BASE + 4);

      external = false;

      for (;;) {
        if (n % 2) {
          r = r.times(x);
          if (truncate(r.d, k)) isTruncated = true;
        }

        n = mathfloor(n / 2);
        if (n === 0) {

          // To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
          n = r.d.length - 1;
          if (isTruncated && r.d[n] === 0) ++r.d[n];
          break;
        }

        x = x.times(x);
        truncate(x.d, k);
      }

      external = true;

      return r;
    }


    function isOdd(n) {
      return n.d[n.d.length - 1] & 1;
    }


    /*
     * Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
     */
    function maxOrMin(Ctor, args, ltgt) {
      var y,
        x = new Ctor(args[0]),
        i = 0;

      for (; ++i < args.length;) {
        y = new Ctor(args[i]);
        if (!y.s) {
          x = y;
          break;
        } else if (x[ltgt](y)) {
          x = y;
        }
      }

      return x;
    }


    /*
     * Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant
     * digits.
     *
     * Taylor/Maclaurin series.
     *
     * exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
     *
     * Argument reduction:
     *   Repeat x = x / 32, k += 5, until |x| < 0.1
     *   exp(x) = exp(x / 2^k)^(2^k)
     *
     * Previously, the argument was initially reduced by
     * exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
     * to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
     * found to be slower than just dividing repeatedly by 32 as above.
     *
     * Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
     * Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
     * (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
     *
     *  exp(Infinity)  = Infinity
     *  exp(-Infinity) = 0
     *  exp(NaN)       = NaN
     *  exp(±0)        = 1
     *
     *  exp(x) is non-terminating for any finite, non-zero x.
     *
     *  The result will always be correctly rounded.
     *
     */
    function naturalExponential(x, sd) {
      var denominator, guard, j, pow, sum, t, wpr,
        rep = 0,
        i = 0,
        k = 0,
        Ctor = x.constructor,
        rm = Ctor.rounding,
        pr = Ctor.precision;

      // 0/NaN/Infinity?
      if (!x.d || !x.d[0] || x.e > 17) {

        return new Ctor(x.d
          ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0
          : x.s ? x.s < 0 ? 0 : x : 0 / 0);
      }

      if (sd == null) {
        external = false;
        wpr = pr;
      } else {
        wpr = sd;
      }

      t = new Ctor(0.03125);

      // while abs(x) >= 0.1
      while (x.e > -2) {

        // x = x / 2^5
        x = x.times(t);
        k += 5;
      }

      // Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
      // necessary to ensure the first 4 rounding digits are correct.
      guard = Math.log(mathpow(2, k)) / Math.LN10 * 2 + 5 | 0;
      wpr += guard;
      denominator = pow = sum = new Ctor(1);
      Ctor.precision = wpr;

      for (;;) {
        pow = finalise(pow.times(x), wpr, 1);
        denominator = denominator.times(++i);
        t = sum.plus(divide$1(pow, denominator, wpr, 1));

        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
          j = k;
          while (j--) sum = finalise(sum.times(sum), wpr, 1);

          // Check to see if the first 4 rounding digits are [49]999.
          // If so, repeat the summation with a higher precision, otherwise
          // e.g. with precision: 18, rounding: 1
          // exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
          // `wpr - guard` is the index of first rounding digit.
          if (sd == null) {

            if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
              Ctor.precision = wpr += 10;
              denominator = pow = t = new Ctor(1);
              i = 0;
              rep++;
            } else {
              return finalise(sum, Ctor.precision = pr, rm, external = true);
            }
          } else {
            Ctor.precision = pr;
            return sum;
          }
        }

        sum = t;
      }
    }


    /*
     * Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant
     * digits.
     *
     *  ln(-n)        = NaN
     *  ln(0)         = -Infinity
     *  ln(-0)        = -Infinity
     *  ln(1)         = 0
     *  ln(Infinity)  = Infinity
     *  ln(-Infinity) = NaN
     *  ln(NaN)       = NaN
     *
     *  ln(n) (n != 1) is non-terminating.
     *
     */
    function naturalLogarithm(y, sd) {
      var c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
        n = 1,
        guard = 10,
        x = y,
        xd = x.d,
        Ctor = x.constructor,
        rm = Ctor.rounding,
        pr = Ctor.precision;

      // Is x negative or Infinity, NaN, 0 or 1?
      if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
        return new Ctor(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
      }

      if (sd == null) {
        external = false;
        wpr = pr;
      } else {
        wpr = sd;
      }

      Ctor.precision = wpr += guard;
      c = digitsToString(xd);
      c0 = c.charAt(0);

      if (Math.abs(e = x.e) < 1.5e15) {

        // Argument reduction.
        // The series converges faster the closer the argument is to 1, so using
        // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
        // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
        // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
        // later be divided by this number, then separate out the power of 10 using
        // ln(a*10^b) = ln(a) + b*ln(10).

        // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
        //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
        // max n is 6 (gives 0.7 - 1.3)
        while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
          x = x.times(y);
          c = digitsToString(x.d);
          c0 = c.charAt(0);
          n++;
        }

        e = x.e;

        if (c0 > 1) {
          x = new Ctor('0.' + c);
          e++;
        } else {
          x = new Ctor(c0 + '.' + c.slice(1));
        }
      } else {

        // The argument reduction method above may result in overflow if the argument y is a massive
        // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
        // function using ln(x*10^e) = ln(x) + e*ln(10).
        t = getLn10(Ctor, wpr + 2, pr).times(e + '');
        x = naturalLogarithm(new Ctor(c0 + '.' + c.slice(1)), wpr - guard).plus(t);
        Ctor.precision = pr;

        return sd == null ? finalise(x, pr, rm, external = true) : x;
      }

      // x1 is x reduced to a value near 1.
      x1 = x;

      // Taylor series.
      // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
      // where x = (y - 1)/(y + 1)    (|x| < 1)
      sum = numerator = x = divide$1(x.minus(1), x.plus(1), wpr, 1);
      x2 = finalise(x.times(x), wpr, 1);
      denominator = 3;

      for (;;) {
        numerator = finalise(numerator.times(x2), wpr, 1);
        t = sum.plus(divide$1(numerator, new Ctor(denominator), wpr, 1));

        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
          sum = sum.times(2);

          // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
          // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
          if (e !== 0) sum = sum.plus(getLn10(Ctor, wpr + 2, pr).times(e + ''));
          sum = divide$1(sum, new Ctor(n), wpr, 1);

          // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
          // been repeated previously) and the first 4 rounding digits 9999?
          // If so, restart the summation with a higher precision, otherwise
          // e.g. with precision: 12, rounding: 1
          // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
          // `wpr - guard` is the index of first rounding digit.
          if (sd == null) {
            if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
              Ctor.precision = wpr += guard;
              t = numerator = x = divide$1(x1.minus(1), x1.plus(1), wpr, 1);
              x2 = finalise(x.times(x), wpr, 1);
              denominator = rep = 1;
            } else {
              return finalise(sum, Ctor.precision = pr, rm, external = true);
            }
          } else {
            Ctor.precision = pr;
            return sum;
          }
        }

        sum = t;
        denominator += 2;
      }
    }


    // ±Infinity, NaN.
    function nonFiniteToString(x) {
      // Unsigned.
      return String(x.s * x.s / 0);
    }


    /*
     * Parse the value of a new Decimal `x` from string `str`.
     */
    function parseDecimal(x, str) {
      var e, i, len;

      // Decimal point?
      if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

      // Exponential form?
      if ((i = str.search(/e/i)) > 0) {

        // Determine exponent.
        if (e < 0) e = i;
        e += +str.slice(i + 1);
        str = str.substring(0, i);
      } else if (e < 0) {

        // Integer.
        e = str.length;
      }

      // Determine leading zeros.
      for (i = 0; str.charCodeAt(i) === 48; i++);

      // Determine trailing zeros.
      for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
      str = str.slice(i, len);

      if (str) {
        len -= i;
        x.e = e = e - i - 1;
        x.d = [];

        // Transform base

        // e is the base 10 exponent.
        // i is where to slice str to get the first word of the digits array.
        i = (e + 1) % LOG_BASE;
        if (e < 0) i += LOG_BASE;

        if (i < len) {
          if (i) x.d.push(+str.slice(0, i));
          for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
          str = str.slice(i);
          i = LOG_BASE - str.length;
        } else {
          i -= len;
        }

        for (; i--;) str += '0';
        x.d.push(+str);

        if (external) {

          // Overflow?
          if (x.e > x.constructor.maxE) {

            // Infinity.
            x.d = null;
            x.e = NaN;

          // Underflow?
          } else if (x.e < x.constructor.minE) {

            // Zero.
            x.e = 0;
            x.d = [0];
            // x.constructor.underflow = true;
          } // else x.constructor.underflow = false;
        }
      } else {

        // Zero.
        x.e = 0;
        x.d = [0];
      }

      return x;
    }


    /*
     * Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
     */
    function parseOther(x, str) {
      var base, Ctor, divisor, i, isFloat, len, p, xd, xe;

      if (str === 'Infinity' || str === 'NaN') {
        if (!+str) x.s = NaN;
        x.e = NaN;
        x.d = null;
        return x;
      }

      if (isHex.test(str))  {
        base = 16;
        str = str.toLowerCase();
      } else if (isBinary.test(str))  {
        base = 2;
      } else if (isOctal.test(str))  {
        base = 8;
      } else {
        throw Error(invalidArgument + str);
      }

      // Is there a binary exponent part?
      i = str.search(/p/i);

      if (i > 0) {
        p = +str.slice(i + 1);
        str = str.substring(2, i);
      } else {
        str = str.slice(2);
      }

      // Convert `str` as an integer then divide the result by `base` raised to a power such that the
      // fraction part will be restored.
      i = str.indexOf('.');
      isFloat = i >= 0;
      Ctor = x.constructor;

      if (isFloat) {
        str = str.replace('.', '');
        len = str.length;
        i = len - i;

        // log[10](16) = 1.2041... , log[10](88) = 1.9444....
        divisor = intPow(Ctor, new Ctor(base), i, i * 2);
      }

      xd = convertBase(str, base, BASE);
      xe = xd.length - 1;

      // Remove trailing zeros.
      for (i = xe; xd[i] === 0; --i) xd.pop();
      if (i < 0) return new Ctor(x.s * 0);
      x.e = getBase10Exponent(xd, xe);
      x.d = xd;
      external = false;

      // At what precision to perform the division to ensure exact conversion?
      // maxDecimalIntegerPartDigitCount = ceil(log[10](b) * otherBaseIntegerPartDigitCount)
      // log[10](2) = 0.30103, log[10](8) = 0.90309, log[10](16) = 1.20412
      // E.g. ceil(1.2 * 3) = 4, so up to 4 decimal digits are needed to represent 3 hex int digits.
      // maxDecimalFractionPartDigitCount = {Hex:4|Oct:3|Bin:1} * otherBaseFractionPartDigitCount
      // Therefore using 4 * the number of digits of str will always be enough.
      if (isFloat) x = divide$1(x, divisor, len * 4);

      // Multiply by the binary exponent part if present.
      if (p) x = x.times(Math.abs(p) < 54 ? mathpow(2, p) : Decimal.pow(2, p));
      external = true;

      return x;
    }


    /*
     * sin(x) = x - x^3/3! + x^5/5! - ...
     * |x| < pi/2
     *
     */
    function sine(Ctor, x) {
      var k,
        len = x.d.length;

      if (len < 3) return taylorSeries(Ctor, 2, x, x);

      // Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
      // i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
      // and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

      // Estimate the optimum number of times to use the argument reduction.
      k = 1.4 * Math.sqrt(len);
      k = k > 16 ? 16 : k | 0;

      x = x.times(1 / tinyPow(5, k));
      x = taylorSeries(Ctor, 2, x, x);

      // Reverse argument reduction
      var sin2_x,
        d5 = new Ctor(5),
        d16 = new Ctor(16),
        d20 = new Ctor(20);
      for (; k--;) {
        sin2_x = x.times(x);
        x = x.times(d5.plus(sin2_x.times(d16.times(sin2_x).minus(d20))));
      }

      return x;
    }


    // Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
    function taylorSeries(Ctor, n, x, y, isHyperbolic) {
      var j, t, u, x2,
        pr = Ctor.precision,
        k = Math.ceil(pr / LOG_BASE);

      external = false;
      x2 = x.times(x);
      u = new Ctor(y);

      for (;;) {
        t = divide$1(u.times(x2), new Ctor(n++ * n++), pr, 1);
        u = isHyperbolic ? y.plus(t) : y.minus(t);
        y = divide$1(t.times(x2), new Ctor(n++ * n++), pr, 1);
        t = u.plus(y);

        if (t.d[k] !== void 0) {
          for (j = k; t.d[j] === u.d[j] && j--;);
          if (j == -1) break;
        }

        j = u;
        u = y;
        y = t;
        t = j;
      }

      external = true;
      t.d.length = k + 1;

      return t;
    }


    // Exponent e must be positive and non-zero.
    function tinyPow(b, e) {
      var n = b;
      while (--e) n *= b;
      return n;
    }


    // Return the absolute value of `x` reduced to less than or equal to half pi.
    function toLessThanHalfPi(Ctor, x) {
      var t,
        isNeg = x.s < 0,
        pi = getPi(Ctor, Ctor.precision, 1),
        halfPi = pi.times(0.5);

      x = x.abs();

      if (x.lte(halfPi)) {
        quadrant = isNeg ? 4 : 1;
        return x;
      }

      t = x.divToInt(pi);

      if (t.isZero()) {
        quadrant = isNeg ? 3 : 2;
      } else {
        x = x.minus(t.times(pi));

        // 0 <= x < pi
        if (x.lte(halfPi)) {
          quadrant = isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
          return x;
        }

        quadrant = isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
      }

      return x.minus(pi).abs();
    }


    /*
     * Return the value of Decimal `x` as a string in base `baseOut`.
     *
     * If the optional `sd` argument is present include a binary exponent suffix.
     */
    function toStringBinary(x, baseOut, sd, rm) {
      var base, e, i, k, len, roundUp, str, xd, y,
        Ctor = x.constructor,
        isExp = sd !== void 0;

      if (isExp) {
        checkInt32(sd, 1, MAX_DIGITS);
        if (rm === void 0) rm = Ctor.rounding;
        else checkInt32(rm, 0, 8);
      } else {
        sd = Ctor.precision;
        rm = Ctor.rounding;
      }

      if (!x.isFinite()) {
        str = nonFiniteToString(x);
      } else {
        str = finiteToString(x);
        i = str.indexOf('.');

        // Use exponential notation according to `toExpPos` and `toExpNeg`? No, but if required:
        // maxBinaryExponent = floor((decimalExponent + 1) * log[2](10))
        // minBinaryExponent = floor(decimalExponent * log[2](10))
        // log[2](10) = 3.321928094887362347870319429489390175864

        if (isExp) {
          base = 2;
          if (baseOut == 16) {
            sd = sd * 4 - 3;
          } else if (baseOut == 8) {
            sd = sd * 3 - 2;
          }
        } else {
          base = baseOut;
        }

        // Convert the number as an integer then divide the result by its base raised to a power such
        // that the fraction part will be restored.

        // Non-integer.
        if (i >= 0) {
          str = str.replace('.', '');
          y = new Ctor(1);
          y.e = str.length - i;
          y.d = convertBase(finiteToString(y), 10, base);
          y.e = y.d.length;
        }

        xd = convertBase(str, 10, base);
        e = len = xd.length;

        // Remove trailing zeros.
        for (; xd[--len] == 0;) xd.pop();

        if (!xd[0]) {
          str = isExp ? '0p+0' : '0';
        } else {
          if (i < 0) {
            e--;
          } else {
            x = new Ctor(x);
            x.d = xd;
            x.e = e;
            x = divide$1(x, y, sd, rm, 0, base);
            xd = x.d;
            e = x.e;
            roundUp = inexact;
          }

          // The rounding digit, i.e. the digit after the digit that may be rounded up.
          i = xd[sd];
          k = base / 2;
          roundUp = roundUp || xd[sd + 1] !== void 0;

          roundUp = rm < 4
            ? (i !== void 0 || roundUp) && (rm === 0 || rm === (x.s < 0 ? 3 : 2))
            : i > k || i === k && (rm === 4 || roundUp || rm === 6 && xd[sd - 1] & 1 ||
              rm === (x.s < 0 ? 8 : 7));

          xd.length = sd;

          if (roundUp) {

            // Rounding up may mean the previous digit has to be rounded up and so on.
            for (; ++xd[--sd] > base - 1;) {
              xd[sd] = 0;
              if (!sd) {
                ++e;
                xd.unshift(1);
              }
            }
          }

          // Determine trailing zeros.
          for (len = xd.length; !xd[len - 1]; --len);

          // E.g. [4, 11, 15] becomes 4bf.
          for (i = 0, str = ''; i < len; i++) str += NUMERALS.charAt(xd[i]);

          // Add binary exponent suffix?
          if (isExp) {
            if (len > 1) {
              if (baseOut == 16 || baseOut == 8) {
                i = baseOut == 16 ? 4 : 3;
                for (--len; len % i; len++) str += '0';
                xd = convertBase(str, base, baseOut);
                for (len = xd.length; !xd[len - 1]; --len);

                // xd[0] will always be be 1
                for (i = 1, str = '1.'; i < len; i++) str += NUMERALS.charAt(xd[i]);
              } else {
                str = str.charAt(0) + '.' + str.slice(1);
              }
            }

            str =  str + (e < 0 ? 'p' : 'p+') + e;
          } else if (e < 0) {
            for (; ++e;) str = '0' + str;
            str = '0.' + str;
          } else {
            if (++e > len) for (e -= len; e-- ;) str += '0';
            else if (e < len) str = str.slice(0, e) + '.' + str.slice(e);
          }
        }

        str = (baseOut == 16 ? '0x' : baseOut == 2 ? '0b' : baseOut == 8 ? '0o' : '') + str;
      }

      return x.s < 0 ? '-' + str : str;
    }


    // Does not strip trailing zeros.
    function truncate(arr, len) {
      if (arr.length > len) {
        arr.length = len;
        return true;
      }
    }


    // Decimal methods


    /*
     *  abs
     *  acos
     *  acosh
     *  add
     *  asin
     *  asinh
     *  atan
     *  atanh
     *  atan2
     *  cbrt
     *  ceil
     *  clone
     *  config
     *  cos
     *  cosh
     *  div
     *  exp
     *  floor
     *  hypot
     *  ln
     *  log
     *  log2
     *  log10
     *  max
     *  min
     *  mod
     *  mul
     *  pow
     *  random
     *  round
     *  set
     *  sign
     *  sin
     *  sinh
     *  sqrt
     *  sub
     *  tan
     *  tanh
     *  trunc
     */


    /*
     * Return a new Decimal whose value is the absolute value of `x`.
     *
     * x {number|string|Decimal}
     *
     */
    function abs(x) {
      return new this(x).abs();
    }


    /*
     * Return a new Decimal whose value is the arccosine in radians of `x`.
     *
     * x {number|string|Decimal}
     *
     */
    function acos(x) {
      return new this(x).acos();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic cosine of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function acosh(x) {
      return new this(x).acosh();
    }


    /*
     * Return a new Decimal whose value is the sum of `x` and `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function add(x, y) {
      return new this(x).plus(y);
    }


    /*
     * Return a new Decimal whose value is the arcsine in radians of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function asin(x) {
      return new this(x).asin();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic sine of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function asinh(x) {
      return new this(x).asinh();
    }


    /*
     * Return a new Decimal whose value is the arctangent in radians of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function atan(x) {
      return new this(x).atan();
    }


    /*
     * Return a new Decimal whose value is the inverse of the hyperbolic tangent of `x`, rounded to
     * `precision` significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function atanh(x) {
      return new this(x).atanh();
    }


    /*
     * Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
     * (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * Domain: [-Infinity, Infinity]
     * Range: [-pi, pi]
     *
     * y {number|string|Decimal} The y-coordinate.
     * x {number|string|Decimal} The x-coordinate.
     *
     * atan2(±0, -0)               = ±pi
     * atan2(±0, +0)               = ±0
     * atan2(±0, -x)               = ±pi for x > 0
     * atan2(±0, x)                = ±0 for x > 0
     * atan2(-y, ±0)               = -pi/2 for y > 0
     * atan2(y, ±0)                = pi/2 for y > 0
     * atan2(±y, -Infinity)        = ±pi for finite y > 0
     * atan2(±y, +Infinity)        = ±0 for finite y > 0
     * atan2(±Infinity, x)         = ±pi/2 for finite x
     * atan2(±Infinity, -Infinity) = ±3*pi/4
     * atan2(±Infinity, +Infinity) = ±pi/4
     * atan2(NaN, x) = NaN
     * atan2(y, NaN) = NaN
     *
     */
    function atan2(y, x) {
      y = new this(y);
      x = new this(x);
      var r,
        pr = this.precision,
        rm = this.rounding,
        wpr = pr + 4;

      // Either NaN
      if (!y.s || !x.s) {
        r = new this(NaN);

      // Both ±Infinity
      } else if (!y.d && !x.d) {
        r = getPi(this, wpr, 1).times(x.s > 0 ? 0.25 : 0.75);
        r.s = y.s;

      // x is ±Infinity or y is ±0
      } else if (!x.d || y.isZero()) {
        r = x.s < 0 ? getPi(this, pr, rm) : new this(0);
        r.s = y.s;

      // y is ±Infinity or x is ±0
      } else if (!y.d || x.isZero()) {
        r = getPi(this, wpr, 1).times(0.5);
        r.s = y.s;

      // Both non-zero and finite
      } else if (x.s < 0) {
        this.precision = wpr;
        this.rounding = 1;
        r = this.atan(divide$1(y, x, wpr, 1));
        x = getPi(this, wpr, 1);
        this.precision = pr;
        this.rounding = rm;
        r = y.s < 0 ? r.minus(x) : r.plus(x);
      } else {
        r = this.atan(divide$1(y, x, wpr, 1));
      }

      return r;
    }


    /*
     * Return a new Decimal whose value is the cube root of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function cbrt(x) {
      return new this(x).cbrt();
    }


    /*
     * Return a new Decimal whose value is `x` rounded to an integer using `ROUND_CEIL`.
     *
     * x {number|string|Decimal}
     *
     */
    function ceil(x) {
      return finalise(x = new this(x), x.e + 1, 2);
    }


    /*
     * Configure global settings for a Decimal constructor.
     *
     * `obj` is an object with one or more of the following properties,
     *
     *   precision  {number}
     *   rounding   {number}
     *   toExpNeg   {number}
     *   toExpPos   {number}
     *   maxE       {number}
     *   minE       {number}
     *   modulo     {number}
     *   crypto     {boolean|number}
     *   defaults   {true}
     *
     * E.g. Decimal.config({ precision: 20, rounding: 4 })
     *
     */
    function config$1(obj) {
      if (!obj || typeof obj !== 'object') throw Error(decimalError + 'Object expected');
      var i, p, v,
        useDefaults = obj.defaults === true,
        ps = [
          'precision', 1, MAX_DIGITS,
          'rounding', 0, 8,
          'toExpNeg', -EXP_LIMIT, 0,
          'toExpPos', 0, EXP_LIMIT,
          'maxE', 0, EXP_LIMIT,
          'minE', -EXP_LIMIT, 0,
          'modulo', 0, 9
        ];

      for (i = 0; i < ps.length; i += 3) {
        if (p = ps[i], useDefaults) this[p] = DEFAULTS[p];
        if ((v = obj[p]) !== void 0) {
          if (mathfloor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) this[p] = v;
          else throw Error(invalidArgument + p + ': ' + v);
        }
      }

      if (p = 'crypto', useDefaults) this[p] = DEFAULTS[p];
      if ((v = obj[p]) !== void 0) {
        if (v === true || v === false || v === 0 || v === 1) {
          if (v) {
            if (typeof crypto != 'undefined' && crypto &&
              (crypto.getRandomValues || crypto.randomBytes)) {
              this[p] = true;
            } else {
              throw Error(cryptoUnavailable);
            }
          } else {
            this[p] = false;
          }
        } else {
          throw Error(invalidArgument + p + ': ' + v);
        }
      }

      return this;
    }


    /*
     * Return a new Decimal whose value is the cosine of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function cos(x) {
      return new this(x).cos();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic cosine of `x`, rounded to precision
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function cosh(x) {
      return new this(x).cosh();
    }


    /*
     * Create and return a Decimal constructor with the same configuration properties as this Decimal
     * constructor.
     *
     */
    function clone$1(obj) {
      var i, p, ps;

      /*
       * The Decimal constructor and exported function.
       * Return a new Decimal instance.
       *
       * v {number|string|Decimal} A numeric value.
       *
       */
      function Decimal(v) {
        var e, i, t,
          x = this;

        // Decimal called without new.
        if (!(x instanceof Decimal)) return new Decimal(v);

        // Retain a reference to this Decimal constructor, and shadow Decimal.prototype.constructor
        // which points to Object.
        x.constructor = Decimal;

        // Duplicate.
        if (v instanceof Decimal) {
          x.s = v.s;

          if (external) {
            if (!v.d || v.e > Decimal.maxE) {

              // Infinity.
              x.e = NaN;
              x.d = null;
            } else if (v.e < Decimal.minE) {

              // Zero.
              x.e = 0;
              x.d = [0];
            } else {
              x.e = v.e;
              x.d = v.d.slice();
            }
          } else {
            x.e = v.e;
            x.d = v.d ? v.d.slice() : v.d;
          }

          return;
        }

        t = typeof v;

        if (t === 'number') {
          if (v === 0) {
            x.s = 1 / v < 0 ? -1 : 1;
            x.e = 0;
            x.d = [0];
            return;
          }

          if (v < 0) {
            v = -v;
            x.s = -1;
          } else {
            x.s = 1;
          }

          // Fast path for small integers.
          if (v === ~~v && v < 1e7) {
            for (e = 0, i = v; i >= 10; i /= 10) e++;

            if (external) {
              if (e > Decimal.maxE) {
                x.e = NaN;
                x.d = null;
              } else if (e < Decimal.minE) {
                x.e = 0;
                x.d = [0];
              } else {
                x.e = e;
                x.d = [v];
              }
            } else {
              x.e = e;
              x.d = [v];
            }

            return;

          // Infinity, NaN.
          } else if (v * 0 !== 0) {
            if (!v) x.s = NaN;
            x.e = NaN;
            x.d = null;
            return;
          }

          return parseDecimal(x, v.toString());

        } else if (t !== 'string') {
          throw Error(invalidArgument + v);
        }

        // Minus sign?
        if ((i = v.charCodeAt(0)) === 45) {
          v = v.slice(1);
          x.s = -1;
        } else {
          // Plus sign?
          if (i === 43) v = v.slice(1);
          x.s = 1;
        }

        return isDecimal.test(v) ? parseDecimal(x, v) : parseOther(x, v);
      }

      Decimal.prototype = P;

      Decimal.ROUND_UP = 0;
      Decimal.ROUND_DOWN = 1;
      Decimal.ROUND_CEIL = 2;
      Decimal.ROUND_FLOOR = 3;
      Decimal.ROUND_HALF_UP = 4;
      Decimal.ROUND_HALF_DOWN = 5;
      Decimal.ROUND_HALF_EVEN = 6;
      Decimal.ROUND_HALF_CEIL = 7;
      Decimal.ROUND_HALF_FLOOR = 8;
      Decimal.EUCLID = 9;

      Decimal.config = Decimal.set = config$1;
      Decimal.clone = clone$1;
      Decimal.isDecimal = isDecimalInstance;

      Decimal.abs = abs;
      Decimal.acos = acos;
      Decimal.acosh = acosh;        // ES6
      Decimal.add = add;
      Decimal.asin = asin;
      Decimal.asinh = asinh;        // ES6
      Decimal.atan = atan;
      Decimal.atanh = atanh;        // ES6
      Decimal.atan2 = atan2;
      Decimal.cbrt = cbrt;          // ES6
      Decimal.ceil = ceil;
      Decimal.cos = cos;
      Decimal.cosh = cosh;          // ES6
      Decimal.div = div;
      Decimal.exp = exp;
      Decimal.floor = floor;
      Decimal.hypot = hypot;        // ES6
      Decimal.ln = ln;
      Decimal.log = log;
      Decimal.log10 = log10;        // ES6
      Decimal.log2 = log2;          // ES6
      Decimal.max = max;
      Decimal.min = min;
      Decimal.mod = mod;
      Decimal.mul = mul;
      Decimal.pow = pow;
      Decimal.random = random;
      Decimal.round = round;
      Decimal.sign = sign;          // ES6
      Decimal.sin = sin;
      Decimal.sinh = sinh;          // ES6
      Decimal.sqrt = sqrt;
      Decimal.sub = sub;
      Decimal.tan = tan;
      Decimal.tanh = tanh;          // ES6
      Decimal.trunc = trunc;        // ES6

      if (obj === void 0) obj = {};
      if (obj) {
        if (obj.defaults !== true) {
          ps = ['precision', 'rounding', 'toExpNeg', 'toExpPos', 'maxE', 'minE', 'modulo', 'crypto'];
          for (i = 0; i < ps.length;) if (!obj.hasOwnProperty(p = ps[i++])) obj[p] = this[p];
        }
      }

      Decimal.config(obj);

      return Decimal;
    }


    /*
     * Return a new Decimal whose value is `x` divided by `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function div(x, y) {
      return new this(x).div(y);
    }


    /*
     * Return a new Decimal whose value is the natural exponential of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} The power to which to raise the base of the natural log.
     *
     */
    function exp(x) {
      return new this(x).exp();
    }


    /*
     * Return a new Decimal whose value is `x` round to an integer using `ROUND_FLOOR`.
     *
     * x {number|string|Decimal}
     *
     */
    function floor(x) {
      return finalise(x = new this(x), x.e + 1, 3);
    }


    /*
     * Return a new Decimal whose value is the square root of the sum of the squares of the arguments,
     * rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * hypot(a, b, ...) = sqrt(a^2 + b^2 + ...)
     *
     * arguments {number|string|Decimal}
     *
     */
    function hypot() {
      var i, n,
        t = new this(0);

      external = false;

      for (i = 0; i < arguments.length;) {
        n = new this(arguments[i++]);
        if (!n.d) {
          if (n.s) {
            external = true;
            return new this(1 / 0);
          }
          t = n;
        } else if (t.d) {
          t = t.plus(n.times(n));
        }
      }

      external = true;

      return t.sqrt();
    }


    /*
     * Return true if object is a Decimal instance (where Decimal is any Decimal constructor),
     * otherwise return false.
     *
     */
    function isDecimalInstance(obj) {
      return obj instanceof Decimal || obj && obj.name === '[object Decimal]' || false;
    }


    /*
     * Return a new Decimal whose value is the natural logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function ln(x) {
      return new this(x).ln();
    }


    /*
     * Return a new Decimal whose value is the log of `x` to the base `y`, or to base 10 if no base
     * is specified, rounded to `precision` significant digits using rounding mode `rounding`.
     *
     * log[y](x)
     *
     * x {number|string|Decimal} The argument of the logarithm.
     * y {number|string|Decimal} The base of the logarithm.
     *
     */
    function log(x, y) {
      return new this(x).log(y);
    }


    /*
     * Return a new Decimal whose value is the base 2 logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function log2(x) {
      return new this(x).log(2);
    }


    /*
     * Return a new Decimal whose value is the base 10 logarithm of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function log10(x) {
      return new this(x).log(10);
    }


    /*
     * Return a new Decimal whose value is the maximum of the arguments.
     *
     * arguments {number|string|Decimal}
     *
     */
    function max() {
      return maxOrMin(this, arguments, 'lt');
    }


    /*
     * Return a new Decimal whose value is the minimum of the arguments.
     *
     * arguments {number|string|Decimal}
     *
     */
    function min() {
      return maxOrMin(this, arguments, 'gt');
    }


    /*
     * Return a new Decimal whose value is `x` modulo `y`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function mod(x, y) {
      return new this(x).mod(y);
    }


    /*
     * Return a new Decimal whose value is `x` multiplied by `y`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function mul(x, y) {
      return new this(x).mul(y);
    }


    /*
     * Return a new Decimal whose value is `x` raised to the power `y`, rounded to precision
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} The base.
     * y {number|string|Decimal} The exponent.
     *
     */
    function pow(x, y) {
      return new this(x).pow(y);
    }


    /*
     * Returns a new Decimal with a random value equal to or greater than 0 and less than 1, and with
     * `sd`, or `Decimal.precision` if `sd` is omitted, significant digits (or less if trailing zeros
     * are produced).
     *
     * [sd] {number} Significant digits. Integer, 0 to MAX_DIGITS inclusive.
     *
     */
    function random(sd) {
      var d, e, k, n,
        i = 0,
        r = new this(1),
        rd = [];

      if (sd === void 0) sd = this.precision;
      else checkInt32(sd, 1, MAX_DIGITS);

      k = Math.ceil(sd / LOG_BASE);

      if (!this.crypto) {
        for (; i < k;) rd[i++] = Math.random() * 1e7 | 0;

      // Browsers supporting crypto.getRandomValues.
      } else if (crypto.getRandomValues) {
        d = crypto.getRandomValues(new Uint32Array(k));

        for (; i < k;) {
          n = d[i];

          // 0 <= n < 4294967296
          // Probability n >= 4.29e9, is 4967296 / 4294967296 = 0.00116 (1 in 865).
          if (n >= 4.29e9) {
            d[i] = crypto.getRandomValues(new Uint32Array(1))[0];
          } else {

            // 0 <= n <= 4289999999
            // 0 <= (n % 1e7) <= 9999999
            rd[i++] = n % 1e7;
          }
        }

      // Node.js supporting crypto.randomBytes.
      } else if (crypto.randomBytes) {

        // buffer
        d = crypto.randomBytes(k *= 4);

        for (; i < k;) {

          // 0 <= n < 2147483648
          n = d[i] + (d[i + 1] << 8) + (d[i + 2] << 16) + ((d[i + 3] & 0x7f) << 24);

          // Probability n >= 2.14e9, is 7483648 / 2147483648 = 0.0035 (1 in 286).
          if (n >= 2.14e9) {
            crypto.randomBytes(4).copy(d, i);
          } else {

            // 0 <= n <= 2139999999
            // 0 <= (n % 1e7) <= 9999999
            rd.push(n % 1e7);
            i += 4;
          }
        }

        i = k / 4;
      } else {
        throw Error(cryptoUnavailable);
      }

      k = rd[--i];
      sd %= LOG_BASE;

      // Convert trailing digits to zeros according to sd.
      if (k && sd) {
        n = mathpow(10, LOG_BASE - sd);
        rd[i] = (k / n | 0) * n;
      }

      // Remove trailing words which are zero.
      for (; rd[i] === 0; i--) rd.pop();

      // Zero?
      if (i < 0) {
        e = 0;
        rd = [0];
      } else {
        e = -1;

        // Remove leading words which are zero and adjust exponent accordingly.
        for (; rd[0] === 0; e -= LOG_BASE) rd.shift();

        // Count the digits of the first word of rd to determine leading zeros.
        for (k = 1, n = rd[0]; n >= 10; n /= 10) k++;

        // Adjust the exponent for leading zeros of the first word of rd.
        if (k < LOG_BASE) e -= LOG_BASE - k;
      }

      r.e = e;
      r.d = rd;

      return r;
    }


    /*
     * Return a new Decimal whose value is `x` rounded to an integer using rounding mode `rounding`.
     *
     * To emulate `Math.round`, set rounding to 7 (ROUND_HALF_CEIL).
     *
     * x {number|string|Decimal}
     *
     */
    function round(x) {
      return finalise(x = new this(x), x.e + 1, this.rounding);
    }


    /*
     * Return
     *   1    if x > 0,
     *  -1    if x < 0,
     *   0    if x is 0,
     *  -0    if x is -0,
     *   NaN  otherwise
     *
     * x {number|string|Decimal}
     *
     */
    function sign(x) {
      x = new this(x);
      return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
    }


    /*
     * Return a new Decimal whose value is the sine of `x`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function sin(x) {
      return new this(x).sin();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic sine of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function sinh(x) {
      return new this(x).sinh();
    }


    /*
     * Return a new Decimal whose value is the square root of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     *
     */
    function sqrt(x) {
      return new this(x).sqrt();
    }


    /*
     * Return a new Decimal whose value is `x` minus `y`, rounded to `precision` significant digits
     * using rounding mode `rounding`.
     *
     * x {number|string|Decimal}
     * y {number|string|Decimal}
     *
     */
    function sub(x, y) {
      return new this(x).sub(y);
    }


    /*
     * Return a new Decimal whose value is the tangent of `x`, rounded to `precision` significant
     * digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function tan(x) {
      return new this(x).tan();
    }


    /*
     * Return a new Decimal whose value is the hyperbolic tangent of `x`, rounded to `precision`
     * significant digits using rounding mode `rounding`.
     *
     * x {number|string|Decimal} A value in radians.
     *
     */
    function tanh(x) {
      return new this(x).tanh();
    }


    /*
     * Return a new Decimal whose value is `x` truncated to an integer.
     *
     * x {number|string|Decimal}
     *
     */
    function trunc(x) {
      return finalise(x = new this(x), x.e + 1, 1);
    }


    P[Symbol.for('nodejs.util.inspect.custom')] = P.toString;
    P[Symbol.toStringTag] = 'Decimal';

    // Create and configure initial Decimal constructor.
    var Decimal = clone$1(DEFAULTS);

    // Create the internal constants from their string values.
    LN10 = new Decimal(LN10);
    PI = new Decimal(PI);

    var name = 'BigNumber';
    var dependencies$1 = ['?on', 'config'];
    var createBigNumberClass =
    /* #__PURE__ */
    factory(name, dependencies$1, function (_ref) {
      var on = _ref.on,
          config = _ref.config;
      var BigNumber = Decimal.clone({
        precision: config.precision
      });
      /**
       * Attach type information
       */

      BigNumber.prototype.type = 'BigNumber';
      BigNumber.prototype.isBigNumber = true;
      /**
       * Get a JSON representation of a BigNumber containing
       * type information
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "BigNumber", "value": "0.2"}`
       */

      BigNumber.prototype.toJSON = function () {
        return {
          mathjs: 'BigNumber',
          value: this.toString()
        };
      };
      /**
       * Instantiate a BigNumber from a JSON object
       * @param {Object} json  a JSON object structured as:
       *                       `{"mathjs": "BigNumber", "value": "0.2"}`
       * @return {BigNumber}
       */


      BigNumber.fromJSON = function (json) {
        return new BigNumber(json.value);
      };

      if (on) {
        // listen for changed in the configuration, automatically apply changed precision
        on('config', function (curr, prev) {
          if (curr.precision !== prev.precision) {
            BigNumber.config({
              precision: curr.precision
            });
          }
        });
      }

      return BigNumber;
    }, {
      isClass: true
    });

    var complex = createCommonjsModule(function (module, exports) {
    /**
     * @license Complex.js v2.0.11 11/02/2016
     *
     * Copyright (c) 2016, Robert Eisele (robert@xarg.org)
     * Dual licensed under the MIT or GPL Version 2 licenses.
     **/

    /**
     *
     * This class allows the manipulation of complex numbers.
     * You can pass a complex number in different formats. Either as object, double, string or two integer parameters.
     *
     * Object form
     * { re: <real>, im: <imaginary> }
     * { arg: <angle>, abs: <radius> }
     * { phi: <angle>, r: <radius> }
     *
     * Array / Vector form
     * [ real, imaginary ]
     *
     * Double form
     * 99.3 - Single double value
     *
     * String form
     * '23.1337' - Simple real number
     * '15+3i' - a simple complex number
     * '3-i' - a simple complex number
     *
     * Example:
     *
     * var c = new Complex('99.3+8i');
     * c.mul({r: 3, i: 9}).div(4.9).sub(3, 2);
     *
     */

    (function(root) {

      var cosh = function(x) {
        return (Math.exp(x) + Math.exp(-x)) * 0.5;
      };

      var sinh = function(x) {
        return (Math.exp(x) - Math.exp(-x)) * 0.5;
      };

      /**
       * Calculates cos(x) - 1 using Taylor series if x is small.
       *
       * @param {number} x
       * @returns {number} cos(x) - 1
       */

      var cosm1 = function(x) {
        var limit = Math.PI/4;
        if (x < -limit || x > limit) {
          return (Math.cos(x) - 1.0);
        }

        var xx = x * x;
        return xx *
          (-0.5 + xx *
            (1/24 + xx *
              (-1/720 + xx *
                (1/40320 + xx *
                  (-1/3628800 + xx *
                    (1/4790014600 + xx *
                      (-1/87178291200 + xx *
                        (1/20922789888000)
                      )
                    )
                  )
                )
              )
            )
          )
      };

      var hypot = function(x, y) {

        var a = Math.abs(x);
        var b = Math.abs(y);

        if (a < 3000 && b < 3000) {
          return Math.sqrt(a * a + b * b);
        }

        if (a < b) {
          a = b;
          b = x / y;
        } else {
          b = y / x;
        }
        return a * Math.sqrt(1 + b * b);
      };

      var parser_exit = function() {
        throw SyntaxError('Invalid Param');
      };

      /**
       * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
       *
       * @param {number} a
       * @param {number} b
       * @returns {number}
       */
      function logHypot(a, b) {

        var _a = Math.abs(a);
        var _b = Math.abs(b);

        if (a === 0) {
          return Math.log(_b);
        }

        if (b === 0) {
          return Math.log(_a);
        }

        if (_a < 3000 && _b < 3000) {
          return Math.log(a * a + b * b) * 0.5;
        }

        /* I got 4 ideas to compute this property without overflow:
         *
         * Testing 1000000 times with random samples for a,b ∈ [1, 1000000000] against a big decimal library to get an error estimate
         *
         * 1. Only eliminate the square root: (OVERALL ERROR: 3.9122483030951116e-11)

         Math.log(a * a + b * b) / 2

         *
         *
         * 2. Try to use the non-overflowing pythagoras: (OVERALL ERROR: 8.889760039210159e-10)

         var fn = function(a, b) {
         a = Math.abs(a);
         b = Math.abs(b);
         var t = Math.min(a, b);
         a = Math.max(a, b);
         t = t / a;

         return Math.log(a) + Math.log(1 + t * t) / 2;
         };

         * 3. Abuse the identity cos(atan(y/x) = x / sqrt(x^2+y^2): (OVERALL ERROR: 3.4780178737037204e-10)

         Math.log(a / Math.cos(Math.atan2(b, a)))

         * 4. Use 3. and apply log rules: (OVERALL ERROR: 1.2014087502620896e-9)

         Math.log(a) - Math.log(Math.cos(Math.atan2(b, a)))

         */

        return Math.log(a / Math.cos(Math.atan2(b, a)));
      }

      var parse = function(a, b) {

        var z = {'re': 0, 'im': 0};

        if (a === undefined || a === null) {
          z['re'] =
                  z['im'] = 0;
        } else if (b !== undefined) {
          z['re'] = a;
          z['im'] = b;
        } else
          switch (typeof a) {

            case 'object':

              if ('im' in a && 're' in a) {
                z['re'] = a['re'];
                z['im'] = a['im'];
              } else if ('abs' in a && 'arg' in a) {
                if (!Number.isFinite(a['abs']) && Number.isFinite(a['arg'])) {
                  return Complex['INFINITY'];
                }
                z['re'] = a['abs'] * Math.cos(a['arg']);
                z['im'] = a['abs'] * Math.sin(a['arg']);
              } else if ('r' in a && 'phi' in a) {
                if (!Number.isFinite(a['r']) && Number.isFinite(a['phi'])) {
                  return Complex['INFINITY'];
                }
                z['re'] = a['r'] * Math.cos(a['phi']);
                z['im'] = a['r'] * Math.sin(a['phi']);
              } else if (a.length === 2) { // Quick array check
                z['re'] = a[0];
                z['im'] = a[1];
              } else {
                parser_exit();
              }
              break;

            case 'string':

              z['im'] = /* void */
                      z['re'] = 0;

              var tokens = a.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
              var plus = 1;
              var minus = 0;

              if (tokens === null) {
                parser_exit();
              }

              for (var i = 0; i < tokens.length; i++) {

                var c = tokens[i];

                if (c === ' ' || c === '\t' || c === '\n') ; else if (c === '+') {
                  plus++;
                } else if (c === '-') {
                  minus++;
                } else if (c === 'i' || c === 'I') {

                  if (plus + minus === 0) {
                    parser_exit();
                  }

                  if (tokens[i + 1] !== ' ' && !isNaN(tokens[i + 1])) {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + tokens[i + 1]);
                    i++;
                  } else {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + '1');
                  }
                  plus = minus = 0;

                } else {

                  if (plus + minus === 0 || isNaN(c)) {
                    parser_exit();
                  }

                  if (tokens[i + 1] === 'i' || tokens[i + 1] === 'I') {
                    z['im'] += parseFloat((minus % 2 ? '-' : '') + c);
                    i++;
                  } else {
                    z['re'] += parseFloat((minus % 2 ? '-' : '') + c);
                  }
                  plus = minus = 0;
                }
              }

              // Still something on the stack
              if (plus + minus > 0) {
                parser_exit();
              }
              break;

            case 'number':
              z['im'] = 0;
              z['re'] = a;
              break;

            default:
              parser_exit();
          }

        return z;
      };

      /**
       * @constructor
       * @returns {Complex}
       */
      function Complex(a, b) {

        if (!(this instanceof Complex)) {
          return new Complex(a, b);
        }

        var z = parse(a, b);

        this['re'] = z['re'];
        this['im'] = z['im'];
      }

      Complex.prototype = {

        're': 0,
        'im': 0,

        /**
         * Calculates the sign of a complex number, which is a normalized complex
         *
         * @returns {Complex}
         */
        'sign': function() {

          var abs = this['abs']();

          return new Complex(
                  this['re'] / abs,
                  this['im'] / abs);
        },

        /**
         * Adds two complex numbers
         *
         * @returns {Complex}
         */
        'add': function(a, b) {

          var z = new Complex(a, b);

          // Infinity + Infinity = NaN
          if (this['isInfinite']() && z['isInfinite']()) {
            return Complex['NAN'];
          }

          // Infinity + z = Infinity { where z != Infinity }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          return new Complex(
                  this['re'] + z['re'],
                  this['im'] + z['im']);
        },

        /**
         * Subtracts two complex numbers
         *
         * @returns {Complex}
         */
        'sub': function(a, b) {

          var z = new Complex(a, b);

          // Infinity - Infinity = NaN
          if (this['isInfinite']() && z['isInfinite']()) {
            return Complex['NAN'];
          }

          // Infinity - z = Infinity { where z != Infinity }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          return new Complex(
                  this['re'] - z['re'],
                  this['im'] - z['im']);
        },

        /**
         * Multiplies two complex numbers
         *
         * @returns {Complex}
         */
        'mul': function(a, b) {

          var z = new Complex(a, b);

          // Infinity * 0 = NaN
          if ((this['isInfinite']() && z['isZero']()) || (this['isZero']() && z['isInfinite']())) {
            return Complex['NAN'];
          }

          // Infinity * z = Infinity { where z != 0 }
          if (this['isInfinite']() || z['isInfinite']()) {
            return Complex['INFINITY'];
          }

          // Short circuit for real values
          if (z['im'] === 0 && this['im'] === 0) {
            return new Complex(this['re'] * z['re'], 0);
          }

          return new Complex(
                  this['re'] * z['re'] - this['im'] * z['im'],
                  this['re'] * z['im'] + this['im'] * z['re']);
        },

        /**
         * Divides two complex numbers
         *
         * @returns {Complex}
         */
        'div': function(a, b) {

          var z = new Complex(a, b);

          // 0 / 0 = NaN and Infinity / Infinity = NaN
          if ((this['isZero']() && z['isZero']()) || (this['isInfinite']() && z['isInfinite']())) {
            return Complex['NAN'];
          }

          // Infinity / 0 = Infinity
          if (this['isInfinite']() || z['isZero']()) {
            return Complex['INFINITY'];
          }

          // 0 / Infinity = 0
          if (this['isZero']() || z['isInfinite']()) {
            return Complex['ZERO'];
          }

          a = this['re'];
          b = this['im'];

          var c = z['re'];
          var d = z['im'];
          var t, x;

          if (0 === d) {
            // Divisor is real
            return new Complex(a / c, b / c);
          }

          if (Math.abs(c) < Math.abs(d)) {

            x = c / d;
            t = c * x + d;

            return new Complex(
                    (a * x + b) / t,
                    (b * x - a) / t);

          } else {

            x = d / c;
            t = d * x + c;

            return new Complex(
                    (a + b * x) / t,
                    (b - a * x) / t);
          }
        },

        /**
         * Calculate the power of two complex numbers
         *
         * @returns {Complex}
         */
        'pow': function(a, b) {

          var z = new Complex(a, b);

          a = this['re'];
          b = this['im'];

          if (z['isZero']()) {
            return Complex['ONE'];
          }

          // If the exponent is real
          if (z['im'] === 0) {

            if (b === 0 && a >= 0) {

              return new Complex(Math.pow(a, z['re']), 0);

            } else if (a === 0) { // If base is fully imaginary

              switch ((z['re'] % 4 + 4) % 4) {
                case 0:
                  return new Complex(Math.pow(b, z['re']), 0);
                case 1:
                  return new Complex(0, Math.pow(b, z['re']));
                case 2:
                  return new Complex(-Math.pow(b, z['re']), 0);
                case 3:
                  return new Complex(0, -Math.pow(b, z['re']));
              }
            }
          }

          /* I couldn't find a good formula, so here is a derivation and optimization
           *
           * z_1^z_2 = (a + bi)^(c + di)
           *         = exp((c + di) * log(a + bi)
           *         = pow(a^2 + b^2, (c + di) / 2) * exp(i(c + di)atan2(b, a))
           * =>...
           * Re = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * cos(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
           * Im = (pow(a^2 + b^2, c / 2) * exp(-d * atan2(b, a))) * sin(d * log(a^2 + b^2) / 2 + c * atan2(b, a))
           *
           * =>...
           * Re = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * cos(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
           * Im = exp(c * log(sqrt(a^2 + b^2)) - d * atan2(b, a)) * sin(d * log(sqrt(a^2 + b^2)) + c * atan2(b, a))
           *
           * =>
           * Re = exp(c * logsq2 - d * arg(z_1)) * cos(d * logsq2 + c * arg(z_1))
           * Im = exp(c * logsq2 - d * arg(z_1)) * sin(d * logsq2 + c * arg(z_1))
           *
           */

          if (a === 0 && b === 0 && z['re'] > 0 && z['im'] >= 0) {
            return Complex['ZERO'];
          }

          var arg = Math.atan2(b, a);
          var loh = logHypot(a, b);

          a = Math.exp(z['re'] * loh - z['im'] * arg);
          b = z['im'] * loh + z['re'] * arg;
          return new Complex(
                  a * Math.cos(b),
                  a * Math.sin(b));
        },

        /**
         * Calculate the complex square root
         *
         * @returns {Complex}
         */
        'sqrt': function() {

          var a = this['re'];
          var b = this['im'];
          var r = this['abs']();

          var re, im;

          if (a >= 0) {

            if (b === 0) {
              return new Complex(Math.sqrt(a), 0);
            }

            re = 0.5 * Math.sqrt(2.0 * (r + a));
          } else {
            re = Math.abs(b) / Math.sqrt(2 * (r - a));
          }

          if (a <= 0) {
            im = 0.5 * Math.sqrt(2.0 * (r - a));
          } else {
            im = Math.abs(b) / Math.sqrt(2 * (r + a));
          }

          return new Complex(re, b < 0 ? -im : im);
        },

        /**
         * Calculate the complex exponent
         *
         * @returns {Complex}
         */
        'exp': function() {

          var tmp = Math.exp(this['re']);

          if (this['im'] === 0) ;
          return new Complex(
                  tmp * Math.cos(this['im']),
                  tmp * Math.sin(this['im']));
        },

        /**
         * Calculate the complex exponent and subtracts one.
         *
         * This may be more accurate than `Complex(x).exp().sub(1)` if
         * `x` is small.
         *
         * @returns {Complex}
         */
        'expm1': function() {

          /**
           * exp(a + i*b) - 1
           = exp(a) * (cos(b) + j*sin(b)) - 1
           = expm1(a)*cos(b) + cosm1(b) + j*exp(a)*sin(b)
           */

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  Math.expm1(a) * Math.cos(b) + cosm1(b),
                  Math.exp(a) * Math.sin(b));
        },

        /**
         * Calculate the natural log
         *
         * @returns {Complex}
         */
        'log': function() {

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  logHypot(a, b),
                  Math.atan2(b, a));
        },

        /**
         * Calculate the magnitude of the complex number
         *
         * @returns {number}
         */
        'abs': function() {

          return hypot(this['re'], this['im']);
        },

        /**
         * Calculate the angle of the complex number
         *
         * @returns {number}
         */
        'arg': function() {

          return Math.atan2(this['im'], this['re']);
        },

        /**
         * Calculate the sine of the complex number
         *
         * @returns {Complex}
         */
        'sin': function() {

          // sin(c) = (e^b - e^(-b)) / (2i)

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  Math.sin(a) * cosh(b),
                  Math.cos(a) * sinh(b));
        },

        /**
         * Calculate the cosine
         *
         * @returns {Complex}
         */
        'cos': function() {

          // cos(z) = (e^b + e^(-b)) / 2

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  Math.cos(a) * cosh(b),
                  -Math.sin(a) * sinh(b));
        },

        /**
         * Calculate the tangent
         *
         * @returns {Complex}
         */
        'tan': function() {

          // tan(c) = (e^(ci) - e^(-ci)) / (i(e^(ci) + e^(-ci)))

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = Math.cos(a) + cosh(b);

          return new Complex(
                  Math.sin(a) / d,
                  sinh(b) / d);
        },

        /**
         * Calculate the cotangent
         *
         * @returns {Complex}
         */
        'cot': function() {

          // cot(c) = i(e^(ci) + e^(-ci)) / (e^(ci) - e^(-ci))

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = Math.cos(a) - cosh(b);

          return new Complex(
                  -Math.sin(a) / d,
                  sinh(b) / d);
        },

        /**
         * Calculate the secant
         *
         * @returns {Complex}
         */
        'sec': function() {

          // sec(c) = 2 / (e^(ci) + e^(-ci))

          var a = this['re'];
          var b = this['im'];
          var d = 0.5 * cosh(2 * b) + 0.5 * Math.cos(2 * a);

          return new Complex(
                  Math.cos(a) * cosh(b) / d,
                  Math.sin(a) * sinh(b) / d);
        },

        /**
         * Calculate the cosecans
         *
         * @returns {Complex}
         */
        'csc': function() {

          // csc(c) = 2i / (e^(ci) - e^(-ci))

          var a = this['re'];
          var b = this['im'];
          var d = 0.5 * cosh(2 * b) - 0.5 * Math.cos(2 * a);

          return new Complex(
                  Math.sin(a) * cosh(b) / d,
                  -Math.cos(a) * sinh(b) / d);
        },

        /**
         * Calculate the complex arcus sinus
         *
         * @returns {Complex}
         */
        'asin': function() {

          // asin(c) = -i * log(ci + sqrt(1 - c^2))

          var a = this['re'];
          var b = this['im'];

          var t1 = new Complex(
                  b * b - a * a + 1,
                  -2 * a * b)['sqrt']();

          var t2 = new Complex(
                  t1['re'] - b,
                  t1['im'] + a)['log']();

          return new Complex(t2['im'], -t2['re']);
        },

        /**
         * Calculate the complex arcus cosinus
         *
         * @returns {Complex}
         */
        'acos': function() {

          // acos(c) = i * log(c - i * sqrt(1 - c^2))

          var a = this['re'];
          var b = this['im'];

          var t1 = new Complex(
                  b * b - a * a + 1,
                  -2 * a * b)['sqrt']();

          var t2 = new Complex(
                  t1['re'] - b,
                  t1['im'] + a)['log']();

          return new Complex(Math.PI / 2 - t2['im'], t2['re']);
        },

        /**
         * Calculate the complex arcus tangent
         *
         * @returns {Complex}
         */
        'atan': function() {

          // atan(c) = i / 2 log((i + x) / (i - x))

          var a = this['re'];
          var b = this['im'];

          if (a === 0) {

            if (b === 1) {
              return new Complex(0, Infinity);
            }

            if (b === -1) {
              return new Complex(0, -Infinity);
            }
          }

          var d = a * a + (1.0 - b) * (1.0 - b);

          var t1 = new Complex(
                  (1 - b * b - a * a) / d,
                  -2 * a / d).log();

          return new Complex(-0.5 * t1['im'], 0.5 * t1['re']);
        },

        /**
         * Calculate the complex arcus cotangent
         *
         * @returns {Complex}
         */
        'acot': function() {

          // acot(c) = i / 2 log((c - i) / (c + i))

          var a = this['re'];
          var b = this['im'];

          if (b === 0) {
            return new Complex(Math.atan2(1, a), 0);
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).atan()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).atan();
        },

        /**
         * Calculate the complex arcus secant
         *
         * @returns {Complex}
         */
        'asec': function() {

          // asec(c) = -i * log(1 / c + sqrt(1 - i / c^2))

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(0, Infinity);
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).acos()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).acos();
        },

        /**
         * Calculate the complex arcus cosecans
         *
         * @returns {Complex}
         */
        'acsc': function() {

          // acsc(c) = -i * log(i / c + sqrt(1 - 1 / c^2))

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(Math.PI / 2, Infinity);
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).asin()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).asin();
        },

        /**
         * Calculate the complex sinh
         *
         * @returns {Complex}
         */
        'sinh': function() {

          // sinh(c) = (e^c - e^-c) / 2

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  sinh(a) * Math.cos(b),
                  cosh(a) * Math.sin(b));
        },

        /**
         * Calculate the complex cosh
         *
         * @returns {Complex}
         */
        'cosh': function() {

          // cosh(c) = (e^c + e^-c) / 2

          var a = this['re'];
          var b = this['im'];

          return new Complex(
                  cosh(a) * Math.cos(b),
                  sinh(a) * Math.sin(b));
        },

        /**
         * Calculate the complex tanh
         *
         * @returns {Complex}
         */
        'tanh': function() {

          // tanh(c) = (e^c - e^-c) / (e^c + e^-c)

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = cosh(a) + Math.cos(b);

          return new Complex(
                  sinh(a) / d,
                  Math.sin(b) / d);
        },

        /**
         * Calculate the complex coth
         *
         * @returns {Complex}
         */
        'coth': function() {

          // coth(c) = (e^c + e^-c) / (e^c - e^-c)

          var a = 2 * this['re'];
          var b = 2 * this['im'];
          var d = cosh(a) - Math.cos(b);

          return new Complex(
                  sinh(a) / d,
                  -Math.sin(b) / d);
        },

        /**
         * Calculate the complex coth
         *
         * @returns {Complex}
         */
        'csch': function() {

          // csch(c) = 2 / (e^c - e^-c)

          var a = this['re'];
          var b = this['im'];
          var d = Math.cos(2 * b) - cosh(2 * a);

          return new Complex(
                  -2 * sinh(a) * Math.cos(b) / d,
                  2 * cosh(a) * Math.sin(b) / d);
        },

        /**
         * Calculate the complex sech
         *
         * @returns {Complex}
         */
        'sech': function() {

          // sech(c) = 2 / (e^c + e^-c)

          var a = this['re'];
          var b = this['im'];
          var d = Math.cos(2 * b) + cosh(2 * a);

          return new Complex(
                  2 * cosh(a) * Math.cos(b) / d,
                  -2 * sinh(a) * Math.sin(b) / d);
        },

        /**
         * Calculate the complex asinh
         *
         * @returns {Complex}
         */
        'asinh': function() {

          // asinh(c) = log(c + sqrt(c^2 + 1))

          var tmp = this['im'];
          this['im'] = -this['re'];
          this['re'] = tmp;
          var res = this['asin']();

          this['re'] = -this['im'];
          this['im'] = tmp;
          tmp = res['re'];

          res['re'] = -res['im'];
          res['im'] = tmp;
          return res;
        },

        /**
         * Calculate the complex asinh
         *
         * @returns {Complex}
         */
        'acosh': function() {

          // acosh(c) = log(c + sqrt(c^2 - 1))

          var res = this['acos']();
          if (res['im'] <= 0) {
            var tmp = res['re'];
            res['re'] = -res['im'];
            res['im'] = tmp;
          } else {
            var tmp = res['im'];
            res['im'] = -res['re'];
            res['re'] = tmp;
          }
          return res;
        },

        /**
         * Calculate the complex atanh
         *
         * @returns {Complex}
         */
        'atanh': function() {

          // atanh(c) = log((1+c) / (1-c)) / 2

          var a = this['re'];
          var b = this['im'];

          var noIM = a > 1 && b === 0;
          var oneMinus = 1 - a;
          var onePlus = 1 + a;
          var d = oneMinus * oneMinus + b * b;

          var x = (d !== 0)
                  ? new Complex(
                          (onePlus * oneMinus - b * b) / d,
                          (b * oneMinus + onePlus * b) / d)
                  : new Complex(
                          (a !== -1) ? (a / 0) : 0,
                          (b !== 0) ? (b / 0) : 0);

          var temp = x['re'];
          x['re'] = logHypot(x['re'], x['im']) / 2;
          x['im'] = Math.atan2(x['im'], temp) / 2;
          if (noIM) {
            x['im'] = -x['im'];
          }
          return x;
        },

        /**
         * Calculate the complex acoth
         *
         * @returns {Complex}
         */
        'acoth': function() {

          // acoth(c) = log((c+1) / (c-1)) / 2

          var a = this['re'];
          var b = this['im'];

          if (a === 0 && b === 0) {
            return new Complex(0, Math.PI / 2);
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).atanh()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).atanh();
        },

        /**
         * Calculate the complex acsch
         *
         * @returns {Complex}
         */
        'acsch': function() {

          // acsch(c) = log((1+sqrt(1+c^2))/c)

          var a = this['re'];
          var b = this['im'];

          if (b === 0) {

            return new Complex(
                    (a !== 0)
                    ? Math.log(a + Math.sqrt(a * a + 1))
                    : Infinity, 0);
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).asinh()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).asinh();
        },

        /**
         * Calculate the complex asech
         *
         * @returns {Complex}
         */
        'asech': function() {

          // asech(c) = log((1+sqrt(1-c^2))/c)

          var a = this['re'];
          var b = this['im'];

          if (this['isZero']()) {
            return Complex['INFINITY'];
          }

          var d = a * a + b * b;
          return (d !== 0)
                  ? new Complex(
                          a / d,
                          -b / d).acosh()
                  : new Complex(
                          (a !== 0) ? a / 0 : 0,
                          (b !== 0) ? -b / 0 : 0).acosh();
        },

        /**
         * Calculate the complex inverse 1/z
         *
         * @returns {Complex}
         */
        'inverse': function() {

          // 1 / 0 = Infinity and 1 / Infinity = 0
          if (this['isZero']()) {
            return Complex['INFINITY'];
          }

          if (this['isInfinite']()) {
            return Complex['ZERO'];
          }

          var a = this['re'];
          var b = this['im'];

          var d = a * a + b * b;

          return new Complex(a / d, -b / d);
        },

        /**
         * Returns the complex conjugate
         *
         * @returns {Complex}
         */
        'conjugate': function() {

          return new Complex(this['re'], -this['im']);
        },

        /**
         * Gets the negated complex number
         *
         * @returns {Complex}
         */
        'neg': function() {

          return new Complex(-this['re'], -this['im']);
        },

        /**
         * Ceils the actual complex number
         *
         * @returns {Complex}
         */
        'ceil': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
                  Math.ceil(this['re'] * places) / places,
                  Math.ceil(this['im'] * places) / places);
        },

        /**
         * Floors the actual complex number
         *
         * @returns {Complex}
         */
        'floor': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
                  Math.floor(this['re'] * places) / places,
                  Math.floor(this['im'] * places) / places);
        },

        /**
         * Ceils the actual complex number
         *
         * @returns {Complex}
         */
        'round': function(places) {

          places = Math.pow(10, places || 0);

          return new Complex(
                  Math.round(this['re'] * places) / places,
                  Math.round(this['im'] * places) / places);
        },

        /**
         * Compares two complex numbers
         *
         * **Note:** new Complex(Infinity).equals(Infinity) === false
         *
         * @returns {boolean}
         */
        'equals': function(a, b) {

          var z = new Complex(a, b);

          return Math.abs(z['re'] - this['re']) <= Complex['EPSILON'] &&
                  Math.abs(z['im'] - this['im']) <= Complex['EPSILON'];
        },

        /**
         * Clones the actual object
         *
         * @returns {Complex}
         */
        'clone': function() {

          return new Complex(this['re'], this['im']);
        },

        /**
         * Gets a string of the actual complex number
         *
         * @returns {string}
         */
        'toString': function() {

          var a = this['re'];
          var b = this['im'];
          var ret = '';

          if (this['isNaN']()) {
            return 'NaN';
          }

          if (this['isZero']()) {
            return '0';
          }

          if (this['isInfinite']()) {
            return 'Infinity';
          }

          if (a !== 0) {
            ret += a;
          }

          if (b !== 0) {

            if (a !== 0) {
              ret += b < 0 ? ' - ' : ' + ';
            } else if (b < 0) {
              ret += '-';
            }

            b = Math.abs(b);

            if (1 !== b) {
              ret += b;
            }
            ret += 'i';
          }

          if (!ret)
            return '0';

          return ret;
        },

        /**
         * Returns the actual number as a vector
         *
         * @returns {Array}
         */
        'toVector': function() {

          return [this['re'], this['im']];
        },

        /**
         * Returns the actual real value of the current object
         *
         * @returns {number|null}
         */
        'valueOf': function() {

          if (this['im'] === 0) {
            return this['re'];
          }
          return null;
        },

        /**
         * Determines whether a complex number is not on the Riemann sphere.
         *
         * @returns {boolean}
         */
        'isNaN': function() {
          return isNaN(this['re']) || isNaN(this['im']);
        },

        /**
         * Determines whether or not a complex number is at the zero pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isZero': function() {
          return (
                  (this['re'] === 0 || this['re'] === -0) &&
                  (this['im'] === 0 || this['im'] === -0)
                  );
        },

        /**
         * Determines whether a complex number is not at the infinity pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isFinite': function() {
          return isFinite(this['re']) && isFinite(this['im']);
        },

        /**
         * Determines whether or not a complex number is at the infinity pole of the
         * Riemann sphere.
         *
         * @returns {boolean}
         */
        'isInfinite': function() {
          return !(this['isNaN']() || this['isFinite']());
        }
      };

      Complex['ZERO'] = new Complex(0, 0);
      Complex['ONE'] = new Complex(1, 0);
      Complex['I'] = new Complex(0, 1);
      Complex['PI'] = new Complex(Math.PI, 0);
      Complex['E'] = new Complex(Math.E, 0);
      Complex['INFINITY'] = new Complex(Infinity, Infinity);
      Complex['NAN'] = new Complex(NaN, NaN);
      Complex['EPSILON'] = 1e-16;

      {
        Object.defineProperty(exports, "__esModule", {'value': true});
        Complex['default'] = Complex;
        Complex['Complex'] = Complex;
        module['exports'] = Complex;
      }

    })();
    });

    var Complex = unwrapExports(complex);

    function _typeof$3(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof$3 = function _typeof(obj) { return typeof obj; }; } else { _typeof$3 = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof$3(obj); }
    var name$1 = 'Complex';
    var dependencies$2 = [];
    var createComplexClass =
    /* #__PURE__ */
    factory(name$1, dependencies$2, function () {
      /**
       * Attach type information
       */
      Complex.prototype.type = 'Complex';
      Complex.prototype.isComplex = true;
      /**
       * Get a JSON representation of the complex number
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "Complex", "re": 2, "im": 3}`
       */

      Complex.prototype.toJSON = function () {
        return {
          mathjs: 'Complex',
          re: this.re,
          im: this.im
        };
      };
      /*
       * Return the value of the complex number in polar notation
       * The angle phi will be set in the interval of [-pi, pi].
       * @return {{r: number, phi: number}} Returns and object with properties r and phi.
       */


      Complex.prototype.toPolar = function () {
        return {
          r: this.abs(),
          phi: this.arg()
        };
      };
      /**
       * Get a string representation of the complex number,
       * with optional formatting options.
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @return {string} str
       */


      Complex.prototype.format = function (options) {
        var str = '';
        var im = this.im;
        var re = this.re;
        var strRe = format(this.re, options);
        var strIm = format(this.im, options); // round either re or im when smaller than the configured precision

        var precision = isNumber(options) ? options : options ? options.precision : null;

        if (precision !== null) {
          var epsilon = Math.pow(10, -precision);

          if (Math.abs(re / im) < epsilon) {
            re = 0;
          }

          if (Math.abs(im / re) < epsilon) {
            im = 0;
          }
        }

        if (im === 0) {
          // real value
          str = strRe;
        } else if (re === 0) {
          // purely complex value
          if (im === 1) {
            str = 'i';
          } else if (im === -1) {
            str = '-i';
          } else {
            str = strIm + 'i';
          }
        } else {
          // complex value
          if (im < 0) {
            if (im === -1) {
              str = strRe + ' - i';
            } else {
              str = strRe + ' - ' + strIm.substring(1) + 'i';
            }
          } else {
            if (im === 1) {
              str = strRe + ' + i';
            } else {
              str = strRe + ' + ' + strIm + 'i';
            }
          }
        }

        return str;
      };
      /**
       * Create a complex number from polar coordinates
       *
       * Usage:
       *
       *     Complex.fromPolar(r: number, phi: number) : Complex
       *     Complex.fromPolar({r: number, phi: number}) : Complex
       *
       * @param {*} args...
       * @return {Complex}
       */


      Complex.fromPolar = function (args) {
        switch (arguments.length) {
          case 1:
            {
              var arg = arguments[0];

              if (_typeof$3(arg) === 'object') {
                return Complex(arg);
              } else {
                throw new TypeError('Input has to be an object with r and phi keys.');
              }
            }

          case 2:
            {
              var r = arguments[0];
              var phi = arguments[1];

              if (isNumber(r)) {
                if (isUnit(phi) && phi.hasBase('ANGLE')) {
                  // convert unit to a number in radians
                  phi = phi.toNumber('rad');
                }

                if (isNumber(phi)) {
                  return new Complex({
                    r: r,
                    phi: phi
                  });
                }

                throw new TypeError('Phi is not a number nor an angle unit.');
              } else {
                throw new TypeError('Radius r is not a number.');
              }
            }

          default:
            throw new SyntaxError('Wrong number of arguments in function fromPolar');
        }
      };

      Complex.prototype.valueOf = Complex.prototype.toString;
      /**
       * Create a Complex number from a JSON object
       * @param {Object} json  A JSON Object structured as
       *                       {"mathjs": "Complex", "re": 2, "im": 3}
       *                       All properties are optional, default values
       *                       for `re` and `im` are 0.
       * @return {Complex} Returns a new Complex number
       */

      Complex.fromJSON = function (json) {
        return new Complex(json);
      };
      /**
       * Compare two complex numbers, `a` and `b`:
       *
       * - Returns 1 when the real part of `a` is larger than the real part of `b`
       * - Returns -1 when the real part of `a` is smaller than the real part of `b`
       * - Returns 1 when the real parts are equal
       *   and the imaginary part of `a` is larger than the imaginary part of `b`
       * - Returns -1 when the real parts are equal
       *   and the imaginary part of `a` is smaller than the imaginary part of `b`
       * - Returns 0 when both real and imaginary parts are equal.
       *
       * @params {Complex} a
       * @params {Complex} b
       * @returns {number} Returns the comparison result: -1, 0, or 1
       */


      Complex.compare = function (a, b) {
        if (a.re > b.re) {
          return 1;
        }

        if (a.re < b.re) {
          return -1;
        }

        if (a.im > b.im) {
          return 1;
        }

        if (a.im < b.im) {
          return -1;
        }

        return 0;
      };

      return Complex;
    }, {
      isClass: true
    });

    var fraction = createCommonjsModule(function (module, exports) {
    /**
     * @license Fraction.js v4.0.12 09/09/2015
     * http://www.xarg.org/2014/03/rational-numbers-in-javascript/
     *
     * Copyright (c) 2015, Robert Eisele (robert@xarg.org)
     * Dual licensed under the MIT or GPL Version 2 licenses.
     **/


    /**
     *
     * This class offers the possibility to calculate fractions.
     * You can pass a fraction in different formats. Either as array, as double, as string or as an integer.
     *
     * Array/Object form
     * [ 0 => <nominator>, 1 => <denominator> ]
     * [ n => <nominator>, d => <denominator> ]
     *
     * Integer form
     * - Single integer value
     *
     * Double form
     * - Single double value
     *
     * String form
     * 123.456 - a simple double
     * 123/456 - a string fraction
     * 123.'456' - a double with repeating decimal places
     * 123.(456) - synonym
     * 123.45'6' - a double with repeating last place
     * 123.45(6) - synonym
     *
     * Example:
     *
     * var f = new Fraction("9.4'31'");
     * f.mul([-4, 3]).div(4.9);
     *
     */

    (function(root) {

      // Maximum search depth for cyclic rational numbers. 2000 should be more than enough.
      // Example: 1/7 = 0.(142857) has 6 repeating decimal places.
      // If MAX_CYCLE_LEN gets reduced, long cycles will not be detected and toString() only gets the first 10 digits
      var MAX_CYCLE_LEN = 2000;

      // Parsed data to avoid calling "new" all the time
      var P = {
        "s": 1,
        "n": 0,
        "d": 1
      };

      function createError(name) {

        function errorConstructor() {
          var temp = Error.apply(this, arguments);
          temp['name'] = this['name'] = name;
          this['stack'] = temp['stack'];
          this['message'] = temp['message'];
        }

        /**
         * Error constructor
         *
         * @constructor
         */
        function IntermediateInheritor() {}
        IntermediateInheritor.prototype = Error.prototype;
        errorConstructor.prototype = new IntermediateInheritor();

        return errorConstructor;
      }

      var DivisionByZero = Fraction['DivisionByZero'] = createError('DivisionByZero');
      var InvalidParameter = Fraction['InvalidParameter'] = createError('InvalidParameter');

      function assign(n, s) {

        if (isNaN(n = parseInt(n, 10))) {
          throwInvalidParam();
        }
        return n * s;
      }

      function throwInvalidParam() {
        throw new InvalidParameter();
      }

      var parse = function(p1, p2) {

        var n = 0, d = 1, s = 1;
        var v = 0, w = 0, x = 0, y = 1, z = 1;

        var A = 0, B = 1;
        var C = 1, D = 1;

        var N = 10000000;
        var M;

        if (p1 === undefined || p1 === null) ; else if (p2 !== undefined) {
          n = p1;
          d = p2;
          s = n * d;
        } else
          switch (typeof p1) {

            case "object":
            {
              if ("d" in p1 && "n" in p1) {
                n = p1["n"];
                d = p1["d"];
                if ("s" in p1)
                  n *= p1["s"];
              } else if (0 in p1) {
                n = p1[0];
                if (1 in p1)
                  d = p1[1];
              } else {
                throwInvalidParam();
              }
              s = n * d;
              break;
            }
            case "number":
            {
              if (p1 < 0) {
                s = p1;
                p1 = -p1;
              }

              if (p1 % 1 === 0) {
                n = p1;
              } else if (p1 > 0) { // check for != 0, scale would become NaN (log(0)), which converges really slow

                if (p1 >= 1) {
                  z = Math.pow(10, Math.floor(1 + Math.log(p1) / Math.LN10));
                  p1 /= z;
                }

                // Using Farey Sequences
                // http://www.johndcook.com/blog/2010/10/20/best-rational-approximation/

                while (B <= N && D <= N) {
                  M = (A + C) / (B + D);

                  if (p1 === M) {
                    if (B + D <= N) {
                      n = A + C;
                      d = B + D;
                    } else if (D > B) {
                      n = C;
                      d = D;
                    } else {
                      n = A;
                      d = B;
                    }
                    break;

                  } else {

                    if (p1 > M) {
                      A += C;
                      B += D;
                    } else {
                      C += A;
                      D += B;
                    }

                    if (B > N) {
                      n = C;
                      d = D;
                    } else {
                      n = A;
                      d = B;
                    }
                  }
                }
                n *= z;
              } else if (isNaN(p1) || isNaN(p2)) {
                d = n = NaN;
              }
              break;
            }
            case "string":
            {
              B = p1.match(/\d+|./g);

              if (B === null)
                throwInvalidParam();

              if (B[A] === '-') {// Check for minus sign at the beginning
                s = -1;
                A++;
              } else if (B[A] === '+') {// Check for plus sign at the beginning
                A++;
              }

              if (B.length === A + 1) { // Check if it's just a simple number "1234"
                w = assign(B[A++], s);
              } else if (B[A + 1] === '.' || B[A] === '.') { // Check if it's a decimal number

                if (B[A] !== '.') { // Handle 0.5 and .5
                  v = assign(B[A++], s);
                }
                A++;

                // Check for decimal places
                if (A + 1 === B.length || B[A + 1] === '(' && B[A + 3] === ')' || B[A + 1] === "'" && B[A + 3] === "'") {
                  w = assign(B[A], s);
                  y = Math.pow(10, B[A].length);
                  A++;
                }

                // Check for repeating places
                if (B[A] === '(' && B[A + 2] === ')' || B[A] === "'" && B[A + 2] === "'") {
                  x = assign(B[A + 1], s);
                  z = Math.pow(10, B[A + 1].length) - 1;
                  A += 3;
                }

              } else if (B[A + 1] === '/' || B[A + 1] === ':') { // Check for a simple fraction "123/456" or "123:456"
                w = assign(B[A], s);
                y = assign(B[A + 2], 1);
                A += 3;
              } else if (B[A + 3] === '/' && B[A + 1] === ' ') { // Check for a complex fraction "123 1/2"
                v = assign(B[A], s);
                w = assign(B[A + 2], s);
                y = assign(B[A + 4], 1);
                A += 5;
              }

              if (B.length <= A) { // Check for more tokens on the stack
                d = y * z;
                s = /* void */
                        n = x + d * v + z * w;
                break;
              }

              /* Fall through on error */
            }
            default:
              throwInvalidParam();
          }

        if (d === 0) {
          throw new DivisionByZero();
        }

        P["s"] = s < 0 ? -1 : 1;
        P["n"] = Math.abs(n);
        P["d"] = Math.abs(d);
      };

      function modpow(b, e, m) {

        var r = 1;
        for (; e > 0; b = (b * b) % m, e >>= 1) {

          if (e & 1) {
            r = (r * b) % m;
          }
        }
        return r;
      }


      function cycleLen(n, d) {

        for (; d % 2 === 0;
                d /= 2) {
        }

        for (; d % 5 === 0;
                d /= 5) {
        }

        if (d === 1) // Catch non-cyclic numbers
          return 0;

        // If we would like to compute really large numbers quicker, we could make use of Fermat's little theorem:
        // 10^(d-1) % d == 1
        // However, we don't need such large numbers and MAX_CYCLE_LEN should be the capstone,
        // as we want to translate the numbers to strings.

        var rem = 10 % d;
        var t = 1;

        for (; rem !== 1; t++) {
          rem = rem * 10 % d;

          if (t > MAX_CYCLE_LEN)
            return 0; // Returning 0 here means that we don't print it as a cyclic number. It's likely that the answer is `d-1`
        }
        return t;
      }


         function cycleStart(n, d, len) {

        var rem1 = 1;
        var rem2 = modpow(10, len, d);

        for (var t = 0; t < 300; t++) { // s < ~log10(Number.MAX_VALUE)
          // Solve 10^s == 10^(s+t) (mod d)

          if (rem1 === rem2)
            return t;

          rem1 = rem1 * 10 % d;
          rem2 = rem2 * 10 % d;
        }
        return 0;
      }

      function gcd(a, b) {

        if (!a)
          return b;
        if (!b)
          return a;

        while (1) {
          a %= b;
          if (!a)
            return b;
          b %= a;
          if (!b)
            return a;
        }
      }
      /**
       * Module constructor
       *
       * @constructor
       * @param {number|Fraction=} a
       * @param {number=} b
       */
      function Fraction(a, b) {

        if (!(this instanceof Fraction)) {
          return new Fraction(a, b);
        }

        parse(a, b);

        if (Fraction['REDUCE']) {
          a = gcd(P["d"], P["n"]); // Abuse a
        } else {
          a = 1;
        }

        this["s"] = P["s"];
        this["n"] = P["n"] / a;
        this["d"] = P["d"] / a;
      }

      /**
       * Boolean global variable to be able to disable automatic reduction of the fraction
       *
       */
      Fraction['REDUCE'] = 1;

      Fraction.prototype = {

        "s": 1,
        "n": 0,
        "d": 1,

        /**
         * Calculates the absolute value
         *
         * Ex: new Fraction(-4).abs() => 4
         **/
        "abs": function() {

          return new Fraction(this["n"], this["d"]);
        },

        /**
         * Inverts the sign of the current fraction
         *
         * Ex: new Fraction(-4).neg() => 4
         **/
        "neg": function() {

          return new Fraction(-this["s"] * this["n"], this["d"]);
        },

        /**
         * Adds two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => 467 / 30
         **/
        "add": function(a, b) {

          parse(a, b);
          return new Fraction(
                  this["s"] * this["n"] * P["d"] + P["s"] * this["d"] * P["n"],
                  this["d"] * P["d"]
                  );
        },

        /**
         * Subtracts two rational numbers
         *
         * Ex: new Fraction({n: 2, d: 3}).add("14.9") => -427 / 30
         **/
        "sub": function(a, b) {

          parse(a, b);
          return new Fraction(
                  this["s"] * this["n"] * P["d"] - P["s"] * this["d"] * P["n"],
                  this["d"] * P["d"]
                  );
        },

        /**
         * Multiplies two rational numbers
         *
         * Ex: new Fraction("-17.(345)").mul(3) => 5776 / 111
         **/
        "mul": function(a, b) {

          parse(a, b);
          return new Fraction(
                  this["s"] * P["s"] * this["n"] * P["n"],
                  this["d"] * P["d"]
                  );
        },

        /**
         * Divides two rational numbers
         *
         * Ex: new Fraction("-17.(345)").inverse().div(3)
         **/
        "div": function(a, b) {

          parse(a, b);
          return new Fraction(
                  this["s"] * P["s"] * this["n"] * P["d"],
                  this["d"] * P["n"]
                  );
        },

        /**
         * Clones the actual object
         *
         * Ex: new Fraction("-17.(345)").clone()
         **/
        "clone": function() {
          return new Fraction(this);
        },

        /**
         * Calculates the modulo of two rational numbers - a more precise fmod
         *
         * Ex: new Fraction('4.(3)').mod([7, 8]) => (13/3) % (7/8) = (5/6)
         **/
        "mod": function(a, b) {

          if (isNaN(this['n']) || isNaN(this['d'])) {
            return new Fraction(NaN);
          }

          if (a === undefined) {
            return new Fraction(this["s"] * this["n"] % this["d"], 1);
          }

          parse(a, b);
          if (0 === P["n"] && 0 === this["d"]) {
            Fraction(0, 0); // Throw DivisionByZero
          }

          /*
           * First silly attempt, kinda slow
           *
           return that["sub"]({
           "n": num["n"] * Math.floor((this.n / this.d) / (num.n / num.d)),
           "d": num["d"],
           "s": this["s"]
           });*/

          /*
           * New attempt: a1 / b1 = a2 / b2 * q + r
           * => b2 * a1 = a2 * b1 * q + b1 * b2 * r
           * => (b2 * a1 % a2 * b1) / (b1 * b2)
           */
          return new Fraction(
                  this["s"] * (P["d"] * this["n"]) % (P["n"] * this["d"]),
                  P["d"] * this["d"]
                  );
        },

        /**
         * Calculates the fractional gcd of two rational numbers
         *
         * Ex: new Fraction(5,8).gcd(3,7) => 1/56
         */
        "gcd": function(a, b) {

          parse(a, b);

          // gcd(a / b, c / d) = gcd(a, c) / lcm(b, d)

          return new Fraction(gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]), P["d"] * this["d"]);
        },

        /**
         * Calculates the fractional lcm of two rational numbers
         *
         * Ex: new Fraction(5,8).lcm(3,7) => 15
         */
        "lcm": function(a, b) {

          parse(a, b);

          // lcm(a / b, c / d) = lcm(a, c) / gcd(b, d)

          if (P["n"] === 0 && this["n"] === 0) {
            return new Fraction;
          }
          return new Fraction(P["n"] * this["n"], gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]));
        },

        /**
         * Calculates the ceil of a rational number
         *
         * Ex: new Fraction('4.(3)').ceil() => (5 / 1)
         **/
        "ceil": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return new Fraction(Math.ceil(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Calculates the floor of a rational number
         *
         * Ex: new Fraction('4.(3)').floor() => (4 / 1)
         **/
        "floor": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return new Fraction(Math.floor(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Rounds a rational numbers
         *
         * Ex: new Fraction('4.(3)').round() => (4 / 1)
         **/
        "round": function(places) {

          places = Math.pow(10, places || 0);

          if (isNaN(this["n"]) || isNaN(this["d"])) {
            return new Fraction(NaN);
          }
          return new Fraction(Math.round(places * this["s"] * this["n"] / this["d"]), places);
        },

        /**
         * Gets the inverse of the fraction, means numerator and denumerator are exchanged
         *
         * Ex: new Fraction([-3, 4]).inverse() => -4 / 3
         **/
        "inverse": function() {

          return new Fraction(this["s"] * this["d"], this["n"]);
        },

        /**
         * Calculates the fraction to some integer exponent
         *
         * Ex: new Fraction(-1,2).pow(-3) => -8
         */
        "pow": function(m) {

          if (m < 0) {
            return new Fraction(Math.pow(this['s'] * this["d"], -m), Math.pow(this["n"], -m));
          } else {
            return new Fraction(Math.pow(this['s'] * this["n"], m), Math.pow(this["d"], m));
          }
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "equals": function(a, b) {

          parse(a, b);
          return this["s"] * this["n"] * P["d"] === P["s"] * P["n"] * this["d"]; // Same as compare() === 0
        },

        /**
         * Check if two rational numbers are the same
         *
         * Ex: new Fraction(19.6).equals([98, 5]);
         **/
        "compare": function(a, b) {

          parse(a, b);
          var t = (this["s"] * this["n"] * P["d"] - P["s"] * P["n"] * this["d"]);
          return (0 < t) - (t < 0);
        },

        "simplify": function(eps) {

          // First naive implementation, needs improvement

          if (isNaN(this['n']) || isNaN(this['d'])) {
            return this;
          }

          var cont = this['abs']()['toContinued']();

          eps = eps || 0.001;

          function rec(a) {
            if (a.length === 1)
              return new Fraction(a[0]);
            return rec(a.slice(1))['inverse']()['add'](a[0]);
          }

          for (var i = 0; i < cont.length; i++) {
            var tmp = rec(cont.slice(0, i + 1));
            if (tmp['sub'](this['abs']())['abs']().valueOf() < eps) {
              return tmp['mul'](this['s']);
            }
          }
          return this;
        },

        /**
         * Check if two rational numbers are divisible
         *
         * Ex: new Fraction(19.6).divisible(1.5);
         */
        "divisible": function(a, b) {

          parse(a, b);
          return !(!(P["n"] * this["d"]) || ((this["n"] * P["d"]) % (P["n"] * this["d"])));
        },

        /**
         * Returns a decimal representation of the fraction
         *
         * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
         **/
        'valueOf': function() {

          return this["s"] * this["n"] / this["d"];
        },

        /**
         * Returns a string-fraction representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toFraction() => "4 1/3"
         **/
        'toFraction': function(excludeWhole) {

          var whole, str = "";
          var n = this["n"];
          var d = this["d"];
          if (this["s"] < 0) {
            str += '-';
          }

          if (d === 1) {
            str += n;
          } else {

            if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
              str += whole;
              str += " ";
              n %= d;
            }

            str += n;
            str += '/';
            str += d;
          }
          return str;
        },

        /**
         * Returns a latex representation of a Fraction object
         *
         * Ex: new Fraction("1.'3'").toLatex() => "\frac{4}{3}"
         **/
        'toLatex': function(excludeWhole) {

          var whole, str = "";
          var n = this["n"];
          var d = this["d"];
          if (this["s"] < 0) {
            str += '-';
          }

          if (d === 1) {
            str += n;
          } else {

            if (excludeWhole && (whole = Math.floor(n / d)) > 0) {
              str += whole;
              n %= d;
            }

            str += "\\frac{";
            str += n;
            str += '}{';
            str += d;
            str += '}';
          }
          return str;
        },

        /**
         * Returns an array of continued fraction elements
         *
         * Ex: new Fraction("7/8").toContinued() => [0,1,7]
         */
        'toContinued': function() {

          var t;
          var a = this['n'];
          var b = this['d'];
          var res = [];

          if (isNaN(this['n']) || isNaN(this['d'])) {
            return res;
          }

          do {
            res.push(Math.floor(a / b));
            t = a % b;
            a = b;
            b = t;
          } while (a !== 1);

          return res;
        },

        /**
         * Creates a string representation of a fraction with all digits
         *
         * Ex: new Fraction("100.'91823'").toString() => "100.(91823)"
         **/
        'toString': function(dec) {

          var g;
          var N = this["n"];
          var D = this["d"];

          if (isNaN(N) || isNaN(D)) {
            return "NaN";
          }

          if (!Fraction['REDUCE']) {
            g = gcd(N, D);
            N /= g;
            D /= g;
          }

          dec = dec || 15; // 15 = decimal places when no repitation

          var cycLen = cycleLen(N, D); // Cycle length
          var cycOff = cycleStart(N, D, cycLen); // Cycle start

          var str = this['s'] === -1 ? "-" : "";

          str += N / D | 0;

          N %= D;
          N *= 10;

          if (N)
            str += ".";

          if (cycLen) {

            for (var i = cycOff; i--; ) {
              str += N / D | 0;
              N %= D;
              N *= 10;
            }
            str += "(";
            for (var i = cycLen; i--; ) {
              str += N / D | 0;
              N %= D;
              N *= 10;
            }
            str += ")";
          } else {
            for (var i = dec; N && i--; ) {
              str += N / D | 0;
              N %= D;
              N *= 10;
            }
          }
          return str;
        }
      };

      {
        Object.defineProperty(exports, "__esModule", {'value': true});
        Fraction['default'] = Fraction;
        Fraction['Fraction'] = Fraction;
        module['exports'] = Fraction;
      }

    })();
    });

    var Fraction = unwrapExports(fraction);

    var name$2 = 'Fraction';
    var dependencies$3 = [];
    var createFractionClass =
    /* #__PURE__ */
    factory(name$2, dependencies$3, function () {
      /**
       * Attach type information
       */
      Fraction.prototype.type = 'Fraction';
      Fraction.prototype.isFraction = true;
      /**
       * Get a JSON representation of a Fraction containing type information
       * @returns {Object} Returns a JSON object structured as:
       *                   `{"mathjs": "Fraction", "n": 3, "d": 8}`
       */

      Fraction.prototype.toJSON = function () {
        return {
          mathjs: 'Fraction',
          n: this.s * this.n,
          d: this.d
        };
      };
      /**
       * Instantiate a Fraction from a JSON object
       * @param {Object} json  a JSON object structured as:
       *                       `{"mathjs": "Fraction", "n": 3, "d": 8}`
       * @return {BigNumber}
       */


      Fraction.fromJSON = function (json) {
        return new Fraction(json);
      };

      return Fraction;
    }, {
      isClass: true
    });

    var name$3 = 'Matrix';
    var dependencies$4 = [];
    var createMatrixClass =
    /* #__PURE__ */
    factory(name$3, dependencies$4, function () {
      /**
       * @constructor Matrix
       *
       * A Matrix is a wrapper around an Array. A matrix can hold a multi dimensional
       * array. A matrix can be constructed as:
       *
       *     let matrix = math.matrix(data)
       *
       * Matrix contains the functions to resize, get and set values, get the size,
       * clone the matrix and to convert the matrix to a vector, array, or scalar.
       * Furthermore, one can iterate over the matrix using map and forEach.
       * The internal Array of the Matrix can be accessed using the function valueOf.
       *
       * Example usage:
       *
       *     let matrix = math.matrix([[1, 2], [3, 4]])
       *     matix.size()              // [2, 2]
       *     matrix.resize([3, 2], 5)
       *     matrix.valueOf()          // [[1, 2], [3, 4], [5, 5]]
       *     matrix.subset([1,2])       // 3 (indexes are zero-based)
       *
       */
      function Matrix() {
        if (!(this instanceof Matrix)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        }
      }
      /**
       * Attach type information
       */


      Matrix.prototype.type = 'Matrix';
      Matrix.prototype.isMatrix = true;
      /**
       * Get the Matrix storage constructor for the given format.
       *
       * @param {string} format       The Matrix storage format.
       *
       * @return {Function}           The Matrix storage constructor.
       */

      Matrix.storage = function (format) {
        // TODO: deprecated since v6.0.0. Clean up some day
        throw new Error('Matrix.storage is deprecated since v6.0.0. ' + 'Use the factory function math.matrix instead.');
      };
      /**
       * Get the storage format used by the matrix.
       *
       * Usage:
       *     const format = matrix.storage()   // retrieve storage format
       *
       * @return {string}           The storage format.
       */


      Matrix.prototype.storage = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke storage on a Matrix interface');
      };
      /**
       * Get the datatype of the data stored in the matrix.
       *
       * Usage:
       *     const format = matrix.datatype()    // retrieve matrix datatype
       *
       * @return {string}           The datatype.
       */


      Matrix.prototype.datatype = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke datatype on a Matrix interface');
      };
      /**
       * Create a new Matrix With the type of the current matrix instance
       * @param {Array | Object} data
       * @param {string} [datatype]
       */


      Matrix.prototype.create = function (data, datatype) {
        throw new Error('Cannot invoke create on a Matrix interface');
      };
      /**
       * Get a subset of the matrix, or replace a subset of the matrix.
       *
       * Usage:
       *     const subset = matrix.subset(index)               // retrieve subset
       *     const value = matrix.subset(index, replacement)   // replace subset
       *
       * @param {Index} index
       * @param {Array | Matrix | *} [replacement]
       * @param {*} [defaultValue=0]      Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be filled with zeros.
       */


      Matrix.prototype.subset = function (index, replacement, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke subset on a Matrix interface');
      };
      /**
       * Get a single element from the matrix.
       * @param {number[]} index   Zero-based index
       * @return {*} value
       */


      Matrix.prototype.get = function (index) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke get on a Matrix interface');
      };
      /**
       * Replace a single element in the matrix.
       * @param {number[]} index   Zero-based index
       * @param {*} value
       * @param {*} [defaultValue]        Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be left undefined.
       * @return {Matrix} self
       */


      Matrix.prototype.set = function (index, value, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke set on a Matrix interface');
      };
      /**
       * Resize the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (resize in place).
       *
       * @param {number[]} size           The new size the matrix should have.
       * @param {*} [defaultValue=0]      Default value, filled in on new entries.
       *                                  If not provided, the matrix elements will
       *                                  be filled with zeros.
       * @param {boolean} [copy]          Return a resized copy of the matrix
       *
       * @return {Matrix}                 The resized matrix
       */


      Matrix.prototype.resize = function (size, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke resize on a Matrix interface');
      };
      /**
       * Reshape the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (reshape in place).
       *
       * @param {number[]} size           The new size the matrix should have.
       * @param {boolean} [copy]          Return a reshaped copy of the matrix
       *
       * @return {Matrix}                 The reshaped matrix
       */


      Matrix.prototype.reshape = function (size, defaultValue) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke reshape on a Matrix interface');
      };
      /**
       * Create a clone of the matrix
       * @return {Matrix} clone
       */


      Matrix.prototype.clone = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke clone on a Matrix interface');
      };
      /**
       * Retrieve the size of the matrix.
       * @returns {number[]} size
       */


      Matrix.prototype.size = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke size on a Matrix interface');
      };
      /**
       * Create a new matrix with the results of the callback function executed on
       * each entry of the matrix.
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
       *
       * @return {Matrix} matrix
       */


      Matrix.prototype.map = function (callback, skipZeros) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke map on a Matrix interface');
      };
      /**
       * Execute a callback function on each entry of the matrix.
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       */


      Matrix.prototype.forEach = function (callback) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke forEach on a Matrix interface');
      };
      /**
       * Create an Array with a copy of the data of the Matrix
       * @returns {Array} array
       */


      Matrix.prototype.toArray = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke toArray on a Matrix interface');
      };
      /**
       * Get the primitive value of the Matrix: a multidimensional array
       * @returns {Array} array
       */


      Matrix.prototype.valueOf = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke valueOf on a Matrix interface');
      };
      /**
       * Get a string representation of the matrix, with optional formatting options.
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @returns {string} str
       */


      Matrix.prototype.format = function (options) {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke format on a Matrix interface');
      };
      /**
       * Get a string representation of the matrix
       * @returns {string} str
       */


      Matrix.prototype.toString = function () {
        // must be implemented by each of the Matrix implementations
        throw new Error('Cannot invoke toString on a Matrix interface');
      };

      return Matrix;
    }, {
      isClass: true
    });

    var name$4 = 'DenseMatrix';
    var dependencies$5 = ['Matrix'];
    var createDenseMatrixClass =
    /* #__PURE__ */
    factory(name$4, dependencies$5, function (_ref) {
      var Matrix = _ref.Matrix;

      /**
       * Dense Matrix implementation. A regular, dense matrix, supporting multi-dimensional matrices. This is the default matrix type.
       * @class DenseMatrix
       */
      function DenseMatrix(data, datatype) {
        if (!(this instanceof DenseMatrix)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        }

        if (datatype && !isString(datatype)) {
          throw new Error('Invalid datatype: ' + datatype);
        }

        if (isMatrix(data)) {
          // check data is a DenseMatrix
          if (data.type === 'DenseMatrix') {
            // clone data & size
            this._data = clone(data._data);
            this._size = clone(data._size);
            this._datatype = datatype || data._datatype;
          } else {
            // build data from existing matrix
            this._data = data.toArray();
            this._size = data.size();
            this._datatype = datatype || data._datatype;
          }
        } else if (data && isArray(data.data) && isArray(data.size)) {
          // initialize fields from JSON representation
          this._data = data.data;
          this._size = data.size;
          this._datatype = datatype || data.datatype;
        } else if (isArray(data)) {
          // replace nested Matrices with Arrays
          this._data = preprocess(data); // get the dimensions of the array

          this._size = arraySize(this._data); // verify the dimensions of the array, TODO: compute size while processing array

          validate(this._data, this._size); // data type unknown

          this._datatype = datatype;
        } else if (data) {
          // unsupported type
          throw new TypeError('Unsupported type of data (' + typeOf(data) + ')');
        } else {
          // nothing provided
          this._data = [];
          this._size = [0];
          this._datatype = datatype;
        }
      }

      DenseMatrix.prototype = new Matrix();
      /**
       * Create a new DenseMatrix
       */

      DenseMatrix.prototype.createDenseMatrix = function (data, datatype) {
        return new DenseMatrix(data, datatype);
      };
      /**
       * Attach type information
       */


      DenseMatrix.prototype.type = 'DenseMatrix';
      DenseMatrix.prototype.isDenseMatrix = true;
      /**
       * Get the matrix type
       *
       * Usage:
       *    const matrixType = matrix.getDataType()  // retrieves the matrix type
       *
       * @memberOf DenseMatrix
       * @return {string}   type information; if multiple types are found from the Matrix, it will return "mixed"
       */

      DenseMatrix.prototype.getDataType = function () {
        return getArrayDataType(this._data, typeOf);
      };
      /**
       * Get the storage format used by the matrix.
       *
       * Usage:
       *     const format = matrix.storage()  // retrieve storage format
       *
       * @memberof DenseMatrix
       * @return {string}           The storage format.
       */


      DenseMatrix.prototype.storage = function () {
        return 'dense';
      };
      /**
       * Get the datatype of the data stored in the matrix.
       *
       * Usage:
       *     const format = matrix.datatype()   // retrieve matrix datatype
       *
       * @memberof DenseMatrix
       * @return {string}           The datatype.
       */


      DenseMatrix.prototype.datatype = function () {
        return this._datatype;
      };
      /**
       * Create a new DenseMatrix
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {string} [datatype]
       */


      DenseMatrix.prototype.create = function (data, datatype) {
        return new DenseMatrix(data, datatype);
      };
      /**
       * Get a subset of the matrix, or replace a subset of the matrix.
       *
       * Usage:
       *     const subset = matrix.subset(index)               // retrieve subset
       *     const value = matrix.subset(index, replacement)   // replace subset
       *
       * @memberof DenseMatrix
       * @param {Index} index
       * @param {Array | Matrix | *} [replacement]
       * @param {*} [defaultValue=0]      Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be filled with zeros.
       */


      DenseMatrix.prototype.subset = function (index, replacement, defaultValue) {
        switch (arguments.length) {
          case 1:
            return _get(this, index);
          // intentional fall through

          case 2:
          case 3:
            return _set(this, index, replacement, defaultValue);

          default:
            throw new SyntaxError('Wrong number of arguments');
        }
      };
      /**
       * Get a single element from the matrix.
       * @memberof DenseMatrix
       * @param {number[]} index   Zero-based index
       * @return {*} value
       */


      DenseMatrix.prototype.get = function (index) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }

        if (index.length !== this._size.length) {
          throw new DimensionError(index.length, this._size.length);
        } // check index


        for (var x = 0; x < index.length; x++) {
          validateIndex(index[x], this._size[x]);
        }

        var data = this._data;

        for (var i = 0, ii = index.length; i < ii; i++) {
          var indexI = index[i];
          validateIndex(indexI, data.length);
          data = data[indexI];
        }

        return data;
      };
      /**
       * Replace a single element in the matrix.
       * @memberof DenseMatrix
       * @param {number[]} index   Zero-based index
       * @param {*} value
       * @param {*} [defaultValue]        Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be left undefined.
       * @return {DenseMatrix} self
       */


      DenseMatrix.prototype.set = function (index, value, defaultValue) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }

        if (index.length < this._size.length) {
          throw new DimensionError(index.length, this._size.length, '<');
        }

        var i, ii, indexI; // enlarge matrix when needed

        var size = index.map(function (i) {
          return i + 1;
        });

        _fit(this, size, defaultValue); // traverse over the dimensions


        var data = this._data;

        for (i = 0, ii = index.length - 1; i < ii; i++) {
          indexI = index[i];
          validateIndex(indexI, data.length);
          data = data[indexI];
        } // set new value


        indexI = index[index.length - 1];
        validateIndex(indexI, data.length);
        data[indexI] = value;
        return this;
      };
      /**
       * Get a submatrix of this matrix
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix
       * @param {Index} index   Zero-based index
       * @private
       */


      function _get(matrix, index) {
        if (!isIndex(index)) {
          throw new TypeError('Invalid index');
        }

        var isScalar = index.isScalar();

        if (isScalar) {
          // return a scalar
          return matrix.get(index.min());
        } else {
          // validate dimensions
          var size = index.size();

          if (size.length !== matrix._size.length) {
            throw new DimensionError(size.length, matrix._size.length);
          } // validate if any of the ranges in the index is out of range


          var min = index.min();
          var max = index.max();

          for (var i = 0, ii = matrix._size.length; i < ii; i++) {
            validateIndex(min[i], matrix._size[i]);
            validateIndex(max[i], matrix._size[i]);
          } // retrieve submatrix
          // TODO: more efficient when creating an empty matrix and setting _data and _size manually


          return new DenseMatrix(_getSubmatrix(matrix._data, index, size.length, 0), matrix._datatype);
        }
      }
      /**
       * Recursively get a submatrix of a multi dimensional matrix.
       * Index is not checked for correct number or length of dimensions.
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {Index} index
       * @param {number} dims   Total number of dimensions
       * @param {number} dim    Current dimension
       * @return {Array} submatrix
       * @private
       */


      function _getSubmatrix(data, index, dims, dim) {
        var last = dim === dims - 1;
        var range = index.dimension(dim);

        if (last) {
          return range.map(function (i) {
            validateIndex(i, data.length);
            return data[i];
          }).valueOf();
        } else {
          return range.map(function (i) {
            validateIndex(i, data.length);
            var child = data[i];
            return _getSubmatrix(child, index, dims, dim + 1);
          }).valueOf();
        }
      }
      /**
       * Replace a submatrix in this matrix
       * Indexes are zero-based.
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix
       * @param {Index} index
       * @param {DenseMatrix | Array | *} submatrix
       * @param {*} defaultValue          Default value, filled in on new entries when
       *                                  the matrix is resized.
       * @return {DenseMatrix} matrix
       * @private
       */


      function _set(matrix, index, submatrix, defaultValue) {
        if (!index || index.isIndex !== true) {
          throw new TypeError('Invalid index');
        } // get index size and check whether the index contains a single value


        var iSize = index.size();
        var isScalar = index.isScalar(); // calculate the size of the submatrix, and convert it into an Array if needed

        var sSize;

        if (isMatrix(submatrix)) {
          sSize = submatrix.size();
          submatrix = submatrix.valueOf();
        } else {
          sSize = arraySize(submatrix);
        }

        if (isScalar) {
          // set a scalar
          // check whether submatrix is a scalar
          if (sSize.length !== 0) {
            throw new TypeError('Scalar expected');
          }

          matrix.set(index.min(), submatrix, defaultValue);
        } else {
          // set a submatrix
          // validate dimensions
          if (iSize.length < matrix._size.length) {
            throw new DimensionError(iSize.length, matrix._size.length, '<');
          }

          if (sSize.length < iSize.length) {
            // calculate number of missing outer dimensions
            var i = 0;
            var outer = 0;

            while (iSize[i] === 1 && sSize[i] === 1) {
              i++;
            }

            while (iSize[i] === 1) {
              outer++;
              i++;
            } // unsqueeze both outer and inner dimensions


            submatrix = unsqueeze(submatrix, iSize.length, outer, sSize);
          } // check whether the size of the submatrix matches the index size


          if (!deepStrictEqual(iSize, sSize)) {
            throw new DimensionError(iSize, sSize, '>');
          } // enlarge matrix when needed


          var size = index.max().map(function (i) {
            return i + 1;
          });

          _fit(matrix, size, defaultValue); // insert the sub matrix


          var dims = iSize.length;
          var dim = 0;

          _setSubmatrix(matrix._data, index, submatrix, dims, dim);
        }

        return matrix;
      }
      /**
       * Replace a submatrix of a multi dimensional matrix.
       * @memberof DenseMatrix
       * @param {Array} data
       * @param {Index} index
       * @param {Array} submatrix
       * @param {number} dims   Total number of dimensions
       * @param {number} dim
       * @private
       */


      function _setSubmatrix(data, index, submatrix, dims, dim) {
        var last = dim === dims - 1;
        var range = index.dimension(dim);

        if (last) {
          range.forEach(function (dataIndex, subIndex) {
            validateIndex(dataIndex);
            data[dataIndex] = submatrix[subIndex[0]];
          });
        } else {
          range.forEach(function (dataIndex, subIndex) {
            validateIndex(dataIndex);

            _setSubmatrix(data[dataIndex], index, submatrix[subIndex[0]], dims, dim + 1);
          });
        }
      }
      /**
       * Resize the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (resize in place).
       *
       * @memberof DenseMatrix
       * @param {number[]} size           The new size the matrix should have.
       * @param {*} [defaultValue=0]      Default value, filled in on new entries.
       *                                  If not provided, the matrix elements will
       *                                  be filled with zeros.
       * @param {boolean} [copy]          Return a resized copy of the matrix
       *
       * @return {Matrix}                 The resized matrix
       */


      DenseMatrix.prototype.resize = function (size, defaultValue, copy) {
        // validate arguments
        if (!isArray(size)) {
          throw new TypeError('Array expected');
        } // matrix to resize


        var m = copy ? this.clone() : this; // resize matrix

        return _resize(m, size, defaultValue);
      };

      function _resize(matrix, size, defaultValue) {
        // check size
        if (size.length === 0) {
          // first value in matrix
          var v = matrix._data; // go deep

          while (isArray(v)) {
            v = v[0];
          }

          return v;
        } // resize matrix


        matrix._size = size.slice(0); // copy the array

        matrix._data = resize(matrix._data, matrix._size, defaultValue); // return matrix

        return matrix;
      }
      /**
       * Reshape the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (reshape in place).
       *
       * NOTE: This might be better suited to copy by default, instead of modifying
       *       in place. For now, it operates in place to remain consistent with
       *       resize().
       *
       * @memberof DenseMatrix
       * @param {number[]} size           The new size the matrix should have.
       * @param {boolean} [copy]          Return a reshaped copy of the matrix
       *
       * @return {Matrix}                 The reshaped matrix
       */


      DenseMatrix.prototype.reshape = function (size, copy) {
        var m = copy ? this.clone() : this;
        m._data = reshape(m._data, size);
        m._size = size.slice(0);
        return m;
      };
      /**
       * Enlarge the matrix when it is smaller than given size.
       * If the matrix is larger or equal sized, nothing is done.
       * @memberof DenseMatrix
       * @param {DenseMatrix} matrix           The matrix to be resized
       * @param {number[]} size
       * @param {*} defaultValue          Default value, filled in on new entries.
       * @private
       */


      function _fit(matrix, size, defaultValue) {
        var // copy the array
        newSize = matrix._size.slice(0);

        var changed = false; // add dimensions when needed

        while (newSize.length < size.length) {
          newSize.push(0);
          changed = true;
        } // enlarge size when needed


        for (var i = 0, ii = size.length; i < ii; i++) {
          if (size[i] > newSize[i]) {
            newSize[i] = size[i];
            changed = true;
          }
        }

        if (changed) {
          // resize only when size is changed
          _resize(matrix, newSize, defaultValue);
        }
      }
      /**
       * Create a clone of the matrix
       * @memberof DenseMatrix
       * @return {DenseMatrix} clone
       */


      DenseMatrix.prototype.clone = function () {
        var m = new DenseMatrix({
          data: clone(this._data),
          size: clone(this._size),
          datatype: this._datatype
        });
        return m;
      };
      /**
       * Retrieve the size of the matrix.
       * @memberof DenseMatrix
       * @returns {number[]} size
       */


      DenseMatrix.prototype.size = function () {
        return this._size.slice(0); // return a clone of _size
      };
      /**
       * Create a new matrix with the results of the callback function executed on
       * each entry of the matrix.
       * @memberof DenseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       *
       * @return {DenseMatrix} matrix
       */


      DenseMatrix.prototype.map = function (callback) {
        // matrix instance
        var me = this;

        var recurse = function recurse(value, index) {
          if (isArray(value)) {
            return value.map(function (child, i) {
              return recurse(child, index.concat(i));
            });
          } else {
            return callback(value, index, me);
          }
        }; // return dense format


        return new DenseMatrix({
          data: recurse(this._data, []),
          size: clone(this._size),
          datatype: this._datatype
        });
      };
      /**
       * Execute a callback function on each entry of the matrix.
       * @memberof DenseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       */


      DenseMatrix.prototype.forEach = function (callback) {
        // matrix instance
        var me = this;

        var recurse = function recurse(value, index) {
          if (isArray(value)) {
            value.forEach(function (child, i) {
              recurse(child, index.concat(i));
            });
          } else {
            callback(value, index, me);
          }
        };

        recurse(this._data, []);
      };
      /**
       * Create an Array with a copy of the data of the DenseMatrix
       * @memberof DenseMatrix
       * @returns {Array} array
       */


      DenseMatrix.prototype.toArray = function () {
        return clone(this._data);
      };
      /**
       * Get the primitive value of the DenseMatrix: a multidimensional array
       * @memberof DenseMatrix
       * @returns {Array} array
       */


      DenseMatrix.prototype.valueOf = function () {
        return this._data;
      };
      /**
       * Get a string representation of the matrix, with optional formatting options.
       * @memberof DenseMatrix
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @returns {string} str
       */


      DenseMatrix.prototype.format = function (options) {
        return format$2(this._data, options);
      };
      /**
       * Get a string representation of the matrix
       * @memberof DenseMatrix
       * @returns {string} str
       */


      DenseMatrix.prototype.toString = function () {
        return format$2(this._data);
      };
      /**
       * Get a JSON representation of the matrix
       * @memberof DenseMatrix
       * @returns {Object}
       */


      DenseMatrix.prototype.toJSON = function () {
        return {
          mathjs: 'DenseMatrix',
          data: this._data,
          size: this._size,
          datatype: this._datatype
        };
      };
      /**
       * Get the kth Matrix diagonal.
       *
       * @memberof DenseMatrix
       * @param {number | BigNumber} [k=0]     The kth diagonal where the vector will retrieved.
       *
       * @returns {Matrix}                     The matrix with the diagonal values.
       */


      DenseMatrix.prototype.diagonal = function (k) {
        // validate k if any
        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          } // is must be an integer


          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        }

        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0; // rows & columns

        var rows = this._size[0];
        var columns = this._size[1]; // number diagonal values

        var n = Math.min(rows - kSub, columns - kSuper); // x is a matrix get diagonal from matrix

        var data = []; // loop rows

        for (var i = 0; i < n; i++) {
          data[i] = this._data[i + kSub][i + kSuper];
        } // create DenseMatrix


        return new DenseMatrix({
          data: data,
          size: [n],
          datatype: this._datatype
        });
      };
      /**
       * Create a diagonal matrix.
       *
       * @memberof DenseMatrix
       * @param {Array} size                     The matrix size.
       * @param {number | Matrix | Array } value The values for the diagonal.
       * @param {number | BigNumber} [k=0]       The kth diagonal where the vector will be filled in.
       * @param {number} [defaultValue]          The default value for non-diagonal
       * @param {string} [datatype]              The datatype for the diagonal
       *
       * @returns {DenseMatrix}
       */


      DenseMatrix.diagonal = function (size, value, k, defaultValue) {
        if (!isArray(size)) {
          throw new TypeError('Array expected, size parameter');
        }

        if (size.length !== 2) {
          throw new Error('Only two dimensions matrix are supported');
        } // map size & validate


        size = size.map(function (s) {
          // check it is a big number
          if (isBigNumber(s)) {
            // convert it
            s = s.toNumber();
          } // validate arguments


          if (!isNumber(s) || !isInteger(s) || s < 1) {
            throw new Error('Size values must be positive integers');
          }

          return s;
        }); // validate k if any

        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          } // is must be an integer


          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        }

        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0; // rows and columns

        var rows = size[0];
        var columns = size[1]; // number of non-zero items

        var n = Math.min(rows - kSub, columns - kSuper); // value extraction function

        var _value; // check value


        if (isArray(value)) {
          // validate array
          if (value.length !== n) {
            // number of values in array must be n
            throw new Error('Invalid value array length');
          } // define function


          _value = function _value(i) {
            // return value @ i
            return value[i];
          };
        } else if (isMatrix(value)) {
          // matrix size
          var ms = value.size(); // validate matrix

          if (ms.length !== 1 || ms[0] !== n) {
            // number of values in array must be n
            throw new Error('Invalid matrix length');
          } // define function


          _value = function _value(i) {
            // return value @ i
            return value.get([i]);
          };
        } else {
          // define function
          _value = function _value() {
            // return value
            return value;
          };
        } // discover default value if needed


        if (!defaultValue) {
          // check first value in array
          defaultValue = isBigNumber(_value(0)) ? _value(0).mul(0) // trick to create a BigNumber with value zero
          : 0;
        } // empty array


        var data = []; // check we need to resize array

        if (size.length > 0) {
          // resize array
          data = resize(data, size, defaultValue); // fill diagonal

          for (var d = 0; d < n; d++) {
            data[d + kSub][d + kSuper] = _value(d);
          }
        } // create DenseMatrix


        return new DenseMatrix({
          data: data,
          size: [rows, columns]
        });
      };
      /**
       * Generate a matrix from a JSON object
       * @memberof DenseMatrix
       * @param {Object} json  An object structured like
       *                       `{"mathjs": "DenseMatrix", data: [], size: []}`,
       *                       where mathjs is optional
       * @returns {DenseMatrix}
       */


      DenseMatrix.fromJSON = function (json) {
        return new DenseMatrix(json);
      };
      /**
       * Swap rows i and j in Matrix.
       *
       * @memberof DenseMatrix
       * @param {number} i       Matrix row index 1
       * @param {number} j       Matrix row index 2
       *
       * @return {Matrix}        The matrix reference
       */


      DenseMatrix.prototype.swapRows = function (i, j) {
        // check index
        if (!isNumber(i) || !isInteger(i) || !isNumber(j) || !isInteger(j)) {
          throw new Error('Row index must be positive integers');
        } // check dimensions


        if (this._size.length !== 2) {
          throw new Error('Only two dimensional matrix is supported');
        } // validate index


        validateIndex(i, this._size[0]);
        validateIndex(j, this._size[0]); // swap rows

        DenseMatrix._swapRows(i, j, this._data); // return current instance


        return this;
      };
      /**
       * Swap rows i and j in Dense Matrix data structure.
       *
       * @param {number} i       Matrix row index 1
       * @param {number} j       Matrix row index 2
       * @param {Array} data     Matrix data
       */


      DenseMatrix._swapRows = function (i, j, data) {
        // swap values i <-> j
        var vi = data[i];
        data[i] = data[j];
        data[j] = vi;
      };
      /**
       * Preprocess data, which can be an Array or DenseMatrix with nested Arrays and
       * Matrices. Replaces all nested Matrices with Arrays
       * @memberof DenseMatrix
       * @param {Array} data
       * @return {Array} data
       */


      function preprocess(data) {
        for (var i = 0, ii = data.length; i < ii; i++) {
          var elem = data[i];

          if (isArray(elem)) {
            data[i] = preprocess(elem);
          } else if (elem && elem.isMatrix === true) {
            data[i] = preprocess(elem.valueOf());
          }
        }

        return data;
      }

      return DenseMatrix;
    }, {
      isClass: true
    });

    /**
     * Test whether an array contains collections
     * @param {Array} array
     * @returns {boolean} Returns true when the array contains one or multiple
     *                    collections (Arrays or Matrices). Returns false otherwise.
     */

    function containsCollections(array) {
      for (var i = 0; i < array.length; i++) {
        if (isCollection(array[i])) {
          return true;
        }
      }

      return false;
    }
    /**
     * Recursively loop over all elements in a given multi dimensional array
     * and invoke the callback on each of the elements.
     * @param {Array | Matrix} array
     * @param {Function} callback     The callback method is invoked with one
     *                                parameter: the current element in the array
     */

    function deepForEach(array, callback) {
      if (isMatrix(array)) {
        array = array.valueOf();
      }

      for (var i = 0, ii = array.length; i < ii; i++) {
        var value = array[i];

        if (Array.isArray(value)) {
          deepForEach(value, callback);
        } else {
          callback(value);
        }
      }
    }
    /**
     * Execute the callback function element wise for each element in array and any
     * nested array
     * Returns an array with the results
     * @param {Array | Matrix} array
     * @param {Function} callback   The callback is called with two parameters:
     *                              value1 and value2, which contain the current
     *                              element of both arrays.
     * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
     *
     * @return {Array | Matrix} res
     */

    function deepMap(array, callback, skipZeros) {
      if (array && typeof array.map === 'function') {
        // TODO: replace array.map with a for loop to improve performance
        return array.map(function (x) {
          return deepMap(x, callback);
        });
      } else {
        return callback(array);
      }
    }
    /**
     * Reduce a given matrix or array to a new matrix or
     * array with one less dimension, applying the given
     * callback in the selected dimension.
     * @param {Array | Matrix} mat
     * @param {number} dim
     * @param {Function} callback
     * @return {Array | Matrix} res
     */

    function reduce(mat, dim, callback) {
      var size = Array.isArray(mat) ? arraySize(mat) : mat.size();

      if (dim < 0 || dim >= size.length) {
        // TODO: would be more clear when throwing a DimensionError here
        throw new IndexError(dim, size.length);
      }

      if (isMatrix(mat)) {
        return mat.create(_reduce(mat.valueOf(), dim, callback));
      } else {
        return _reduce(mat, dim, callback);
      }
    }
    /**
     * Recursively reduce a matrix
     * @param {Array} mat
     * @param {number} dim
     * @param {Function} callback
     * @returns {Array} ret
     * @private
     */

    function _reduce(mat, dim, callback) {
      var i, ret, val, tran;

      if (dim <= 0) {
        if (!Array.isArray(mat[0])) {
          val = mat[0];

          for (i = 1; i < mat.length; i++) {
            val = callback(val, mat[i]);
          }

          return val;
        } else {
          tran = _switch(mat);
          ret = [];

          for (i = 0; i < tran.length; i++) {
            ret[i] = _reduce(tran[i], dim - 1, callback);
          }

          return ret;
        }
      } else {
        ret = [];

        for (i = 0; i < mat.length; i++) {
          ret[i] = _reduce(mat[i], dim - 1, callback);
        }

        return ret;
      }
    }
    /**
     * Transpose a matrix
     * @param {Array} mat
     * @returns {Array} ret
     * @private
     */


    function _switch(mat) {
      var I = mat.length;
      var J = mat[0].length;
      var i, j;
      var ret = [];

      for (j = 0; j < J; j++) {
        var tmp = [];

        for (i = 0; i < I; i++) {
          tmp.push(mat[i][j]);
        }

        ret.push(tmp);
      }

      return ret;
    } // TODO: document function scatter

    var name$5 = 'isInteger';
    var dependencies$6 = ['typed'];
    var createIsInteger =
    /* #__PURE__ */
    factory(name$5, dependencies$6, function (_ref) {
      var typed = _ref.typed;

      /**
       * Test whether a value is an integer number.
       * The function supports `number`, `BigNumber`, and `Fraction`.
       *
       * The function is evaluated element-wise in case of Array or Matrix input.
       *
       * Syntax:
       *
       *     math.isInteger(x)
       *
       * Examples:
       *
       *    math.isInteger(2)                     // returns true
       *    math.isInteger(0)                     // returns true
       *    math.isInteger(0.5)                   // returns false
       *    math.isInteger(math.bignumber(500))   // returns true
       *    math.isInteger(math.fraction(4))      // returns true
       *    math.isInteger('3')                   // returns true
       *    math.isInteger([3, 0.5, -2])          // returns [true, false, true]
       *    math.isInteger(math.complex('2-4i')   // throws an error
       *
       * See also:
       *
       *    isNumeric, isPositive, isNegative, isZero
       *
       * @param {number | BigNumber | Fraction | Array | Matrix} x   Value to be tested
       * @return {boolean}  Returns true when `x` contains a numeric, integer value.
       *                    Throws an error in case of an unknown data type.
       */
      var isInteger$1 = typed(name$5, {
        number: isInteger,
        // TODO: what to do with isInteger(add(0.1, 0.2))  ?
        BigNumber: function BigNumber(x) {
          return x.isInt();
        },
        Fraction: function Fraction(x) {
          return x.d === 1 && isFinite(x.n);
        },
        'Array | Matrix': function ArrayMatrix(x) {
          return deepMap(x, isInteger$1);
        }
      });
      return isInteger$1;
    });

    var n1 = 'number';
    var n2 = 'number, number';
    function absNumber(a) {
      return Math.abs(a);
    }
    absNumber.signature = n1;
    function addNumber(a, b) {
      return a + b;
    }
    addNumber.signature = n2;
    function multiplyNumber(a, b) {
      return a * b;
    }
    multiplyNumber.signature = n2;
    function unaryMinusNumber(x) {
      return -x;
    }
    unaryMinusNumber.signature = n1;

    var n1$1 = 'number';
    function isNaNNumber(x) {
      return Number.isNaN(x);
    }
    isNaNNumber.signature = n1$1;

    var name$6 = 'isNaN';
    var dependencies$7 = ['typed'];
    var createIsNaN =
    /* #__PURE__ */
    factory(name$6, dependencies$7, function (_ref) {
      var typed = _ref.typed;

      /**
       * Test whether a value is NaN (not a number).
       * The function supports types `number`, `BigNumber`, `Fraction`, `Unit` and `Complex`.
       *
       * The function is evaluated element-wise in case of Array or Matrix input.
       *
       * Syntax:
       *
       *     math.isNaN(x)
       *
       * Examples:
       *
       *    math.isNaN(3)                     // returns false
       *    math.isNaN(NaN)                   // returns true
       *    math.isNaN(0)                     // returns false
       *    math.isNaN(math.bignumber(NaN))   // returns true
       *    math.isNaN(math.bignumber(0))     // returns false
       *    math.isNaN(math.fraction(-2, 5))  // returns false
       *    math.isNaN('-2')                  // returns false
       *    math.isNaN([2, 0, -3, NaN]')      // returns [false, false, false, true]
       *
       * See also:
       *
       *    isNumeric, isNegative, isPositive, isZero, isInteger
       *
       * @param {number | BigNumber | Fraction | Unit | Array | Matrix} x  Value to be tested
       * @return {boolean}  Returns true when `x` is NaN.
       *                    Throws an error in case of an unknown data type.
       */
      return typed(name$6, {
        number: isNaNNumber,
        BigNumber: function BigNumber(x) {
          return x.isNaN();
        },
        Fraction: function Fraction(x) {
          return false;
        },
        Complex: function Complex(x) {
          return x.isNaN();
        },
        Unit: function Unit(x) {
          return Number.isNaN(x.value);
        },
        'Array | Matrix': function ArrayMatrix(x) {
          return deepMap(x, Number.isNaN);
        }
      });
    });

    /**
     * Compares two BigNumbers.
     * @param {BigNumber} x       First value to compare
     * @param {BigNumber} y       Second value to compare
     * @param {number} [epsilon]  The maximum relative difference between x and y
     *                            If epsilon is undefined or null, the function will
     *                            test whether x and y are exactly equal.
     * @return {boolean} whether the two numbers are nearly equal
     */
    function nearlyEqual$1(x, y, epsilon) {
      // if epsilon is null or undefined, test whether x and y are exactly equal
      if (epsilon === null || epsilon === undefined) {
        return x.eq(y);
      } // use "==" operator, handles infinities


      if (x.eq(y)) {
        return true;
      } // NaN


      if (x.isNaN() || y.isNaN()) {
        return false;
      } // at this point x and y should be finite


      if (x.isFinite() && y.isFinite()) {
        // check numbers are very close, needed when comparing numbers near zero
        var diff = x.minus(y).abs();

        if (diff.isZero()) {
          return true;
        } else {
          // use relative error
          var max = x.constructor.max(x.abs(), y.abs());
          return diff.lte(max.times(epsilon));
        }
      } // Infinite and Number or negative Infinite and positive Infinite cases


      return false;
    }

    /**
     * Test whether two complex values are equal provided a given epsilon.
     * Does not use or change the global Complex.EPSILON setting
     * @param {Complex} x
     * @param {Complex} y
     * @param {number} epsilon
     * @returns {boolean}
     */

    function complexEquals(x, y, epsilon) {
      return nearlyEqual(x.re, y.re, epsilon) && nearlyEqual(x.im, y.im, epsilon);
    }

    var name$7 = 'equalScalar';
    var dependencies$8 = ['typed', 'config'];
    var createEqualScalar =
    /* #__PURE__ */
    factory(name$7, dependencies$8, function (_ref) {
      var typed = _ref.typed,
          config = _ref.config;

      /**
       * Test whether two scalar values are nearly equal.
       *
       * @param  {number | BigNumber | Fraction | boolean | Complex | Unit} x   First value to compare
       * @param  {number | BigNumber | Fraction | boolean | Complex} y          Second value to compare
       * @return {boolean}                                                  Returns true when the compared values are equal, else returns false
       * @private
       */
      var equalScalar = typed(name$7, {
        'boolean, boolean': function booleanBoolean(x, y) {
          return x === y;
        },
        'number, number': function numberNumber(x, y) {
          return nearlyEqual(x, y, config.epsilon);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.eq(y) || nearlyEqual$1(x, y, config.epsilon);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.equals(y);
        },
        'Complex, Complex': function ComplexComplex(x, y) {
          return complexEquals(x, y, config.epsilon);
        },
        'Unit, Unit': function UnitUnit(x, y) {
          if (!x.equalBase(y)) {
            throw new Error('Cannot compare units with different base');
          }

          return equalScalar(x.value, y.value);
        }
      });
      return equalScalar;
    });
    var createEqualScalarNumber = factory(name$7, ['typed', 'config'], function (_ref2) {
      var typed = _ref2.typed,
          config = _ref2.config;
      return typed(name$7, {
        'number, number': function numberNumber(x, y) {
          return nearlyEqual(x, y, config.epsilon);
        }
      });
    });

    var name$8 = 'SparseMatrix';
    var dependencies$9 = ['typed', 'equalScalar', 'Matrix'];
    var createSparseMatrixClass =
    /* #__PURE__ */
    factory(name$8, dependencies$9, function (_ref) {
      var typed = _ref.typed,
          equalScalar = _ref.equalScalar,
          Matrix = _ref.Matrix;

      /**
       * Sparse Matrix implementation. This type implements a Compressed Column Storage format
       * for sparse matrices.
       * @class SparseMatrix
       */
      function SparseMatrix(data, datatype) {
        if (!(this instanceof SparseMatrix)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        }

        if (datatype && !isString(datatype)) {
          throw new Error('Invalid datatype: ' + datatype);
        }

        if (isMatrix(data)) {
          // create from matrix
          _createFromMatrix(this, data, datatype);
        } else if (data && isArray(data.index) && isArray(data.ptr) && isArray(data.size)) {
          // initialize fields
          this._values = data.values;
          this._index = data.index;
          this._ptr = data.ptr;
          this._size = data.size;
          this._datatype = datatype || data.datatype;
        } else if (isArray(data)) {
          // create from array
          _createFromArray(this, data, datatype);
        } else if (data) {
          // unsupported type
          throw new TypeError('Unsupported type of data (' + typeOf(data) + ')');
        } else {
          // nothing provided
          this._values = [];
          this._index = [];
          this._ptr = [0];
          this._size = [0, 0];
          this._datatype = datatype;
        }
      }

      function _createFromMatrix(matrix, source, datatype) {
        // check matrix type
        if (source.type === 'SparseMatrix') {
          // clone arrays
          matrix._values = source._values ? clone(source._values) : undefined;
          matrix._index = clone(source._index);
          matrix._ptr = clone(source._ptr);
          matrix._size = clone(source._size);
          matrix._datatype = datatype || source._datatype;
        } else {
          // build from matrix data
          _createFromArray(matrix, source.valueOf(), datatype || source._datatype);
        }
      }

      function _createFromArray(matrix, data, datatype) {
        // initialize fields
        matrix._values = [];
        matrix._index = [];
        matrix._ptr = [];
        matrix._datatype = datatype; // discover rows & columns, do not use math.size() to avoid looping array twice

        var rows = data.length;
        var columns = 0; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0;

        if (isString(datatype)) {
          // find signature that matches (datatype, datatype)
          eq = typed.find(equalScalar, [datatype, datatype]) || equalScalar; // convert 0 to the same datatype

          zero = typed.convert(0, datatype);
        } // check we have rows (empty array)


        if (rows > 0) {
          // column index
          var j = 0;

          do {
            // store pointer to values index
            matrix._ptr.push(matrix._index.length); // loop rows


            for (var i = 0; i < rows; i++) {
              // current row
              var row = data[i]; // check row is an array

              if (isArray(row)) {
                // update columns if needed (only on first column)
                if (j === 0 && columns < row.length) {
                  columns = row.length;
                } // check row has column


                if (j < row.length) {
                  // value
                  var v = row[j]; // check value != 0

                  if (!eq(v, zero)) {
                    // store value
                    matrix._values.push(v); // index


                    matrix._index.push(i);
                  }
                }
              } else {
                // update columns if needed (only on first column)
                if (j === 0 && columns < 1) {
                  columns = 1;
                } // check value != 0 (row is a scalar)


                if (!eq(row, zero)) {
                  // store value
                  matrix._values.push(row); // index


                  matrix._index.push(i);
                }
              }
            } // increment index


            j++;
          } while (j < columns);
        } // store number of values in ptr


        matrix._ptr.push(matrix._index.length); // size


        matrix._size = [rows, columns];
      }

      SparseMatrix.prototype = new Matrix();
      /**
       * Create a new SparseMatrix
       */

      SparseMatrix.prototype.createSparseMatrix = function (data, datatype) {
        return new SparseMatrix(data, datatype);
      };
      /**
       * Attach type information
       */


      SparseMatrix.prototype.type = 'SparseMatrix';
      SparseMatrix.prototype.isSparseMatrix = true;
      /**
       * Get the matrix type
       *
       * Usage:
       *    const matrixType = matrix.getDataType()  // retrieves the matrix type
       *
       * @memberOf SparseMatrix
       * @return {string}   type information; if multiple types are found from the Matrix, it will return "mixed"
       */

      SparseMatrix.prototype.getDataType = function () {
        return getArrayDataType(this._values, typeOf);
      };
      /**
       * Get the storage format used by the matrix.
       *
       * Usage:
       *     const format = matrix.storage()   // retrieve storage format
       *
       * @memberof SparseMatrix
       * @return {string}           The storage format.
       */


      SparseMatrix.prototype.storage = function () {
        return 'sparse';
      };
      /**
       * Get the datatype of the data stored in the matrix.
       *
       * Usage:
       *     const format = matrix.datatype()    // retrieve matrix datatype
       *
       * @memberof SparseMatrix
       * @return {string}           The datatype.
       */


      SparseMatrix.prototype.datatype = function () {
        return this._datatype;
      };
      /**
       * Create a new SparseMatrix
       * @memberof SparseMatrix
       * @param {Array} data
       * @param {string} [datatype]
       */


      SparseMatrix.prototype.create = function (data, datatype) {
        return new SparseMatrix(data, datatype);
      };
      /**
       * Get the matrix density.
       *
       * Usage:
       *     const density = matrix.density()                   // retrieve matrix density
       *
       * @memberof SparseMatrix
       * @return {number}           The matrix density.
       */


      SparseMatrix.prototype.density = function () {
        // rows & columns
        var rows = this._size[0];
        var columns = this._size[1]; // calculate density

        return rows !== 0 && columns !== 0 ? this._index.length / (rows * columns) : 0;
      };
      /**
       * Get a subset of the matrix, or replace a subset of the matrix.
       *
       * Usage:
       *     const subset = matrix.subset(index)               // retrieve subset
       *     const value = matrix.subset(index, replacement)   // replace subset
       *
       * @memberof SparseMatrix
       * @param {Index} index
       * @param {Array | Matrix | *} [replacement]
       * @param {*} [defaultValue=0]      Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be filled with zeros.
       */


      SparseMatrix.prototype.subset = function (index, replacement, defaultValue) {
        // check it is a pattern matrix
        if (!this._values) {
          throw new Error('Cannot invoke subset on a Pattern only matrix');
        } // check arguments


        switch (arguments.length) {
          case 1:
            return _getsubset(this, index);
          // intentional fall through

          case 2:
          case 3:
            return _setsubset(this, index, replacement, defaultValue);

          default:
            throw new SyntaxError('Wrong number of arguments');
        }
      };

      function _getsubset(matrix, idx) {
        // check idx
        if (!isIndex(idx)) {
          throw new TypeError('Invalid index');
        }

        var isScalar = idx.isScalar();

        if (isScalar) {
          // return a scalar
          return matrix.get(idx.min());
        } // validate dimensions


        var size = idx.size();

        if (size.length !== matrix._size.length) {
          throw new DimensionError(size.length, matrix._size.length);
        } // vars


        var i, ii, k, kk; // validate if any of the ranges in the index is out of range

        var min = idx.min();
        var max = idx.max();

        for (i = 0, ii = matrix._size.length; i < ii; i++) {
          validateIndex(min[i], matrix._size[i]);
          validateIndex(max[i], matrix._size[i]);
        } // matrix arrays


        var mvalues = matrix._values;
        var mindex = matrix._index;
        var mptr = matrix._ptr; // rows & columns dimensions for result matrix

        var rows = idx.dimension(0);
        var columns = idx.dimension(1); // workspace & permutation vector

        var w = [];
        var pv = []; // loop rows in resulting matrix

        rows.forEach(function (i, r) {
          // update permutation vector
          pv[i] = r[0]; // mark i in workspace

          w[i] = true;
        }); // result matrix arrays

        var values = mvalues ? [] : undefined;
        var index = [];
        var ptr = []; // loop columns in result matrix

        columns.forEach(function (j) {
          // update ptr
          ptr.push(index.length); // loop values in column j

          for (k = mptr[j], kk = mptr[j + 1]; k < kk; k++) {
            // row
            i = mindex[k]; // check row is in result matrix

            if (w[i] === true) {
              // push index
              index.push(pv[i]); // check we need to process values

              if (values) {
                values.push(mvalues[k]);
              }
            }
          }
        }); // update ptr

        ptr.push(index.length); // return matrix

        return new SparseMatrix({
          values: values,
          index: index,
          ptr: ptr,
          size: size,
          datatype: matrix._datatype
        });
      }

      function _setsubset(matrix, index, submatrix, defaultValue) {
        // check index
        if (!index || index.isIndex !== true) {
          throw new TypeError('Invalid index');
        } // get index size and check whether the index contains a single value


        var iSize = index.size();
        var isScalar = index.isScalar(); // calculate the size of the submatrix, and convert it into an Array if needed

        var sSize;

        if (isMatrix(submatrix)) {
          // submatrix size
          sSize = submatrix.size(); // use array representation

          submatrix = submatrix.toArray();
        } else {
          // get submatrix size (array, scalar)
          sSize = arraySize(submatrix);
        } // check index is a scalar


        if (isScalar) {
          // verify submatrix is a scalar
          if (sSize.length !== 0) {
            throw new TypeError('Scalar expected');
          } // set value


          matrix.set(index.min(), submatrix, defaultValue);
        } else {
          // validate dimensions, index size must be one or two dimensions
          if (iSize.length !== 1 && iSize.length !== 2) {
            throw new DimensionError(iSize.length, matrix._size.length, '<');
          } // check submatrix and index have the same dimensions


          if (sSize.length < iSize.length) {
            // calculate number of missing outer dimensions
            var i = 0;
            var outer = 0;

            while (iSize[i] === 1 && sSize[i] === 1) {
              i++;
            }

            while (iSize[i] === 1) {
              outer++;
              i++;
            } // unsqueeze both outer and inner dimensions


            submatrix = unsqueeze(submatrix, iSize.length, outer, sSize);
          } // check whether the size of the submatrix matches the index size


          if (!deepStrictEqual(iSize, sSize)) {
            throw new DimensionError(iSize, sSize, '>');
          } // offsets


          var x0 = index.min()[0];
          var y0 = index.min()[1]; // submatrix rows and columns

          var m = sSize[0];
          var n = sSize[1]; // loop submatrix

          for (var x = 0; x < m; x++) {
            // loop columns
            for (var y = 0; y < n; y++) {
              // value at i, j
              var v = submatrix[x][y]; // invoke set (zero value will remove entry from matrix)

              matrix.set([x + x0, y + y0], v, defaultValue);
            }
          }
        }

        return matrix;
      }
      /**
       * Get a single element from the matrix.
       * @memberof SparseMatrix
       * @param {number[]} index   Zero-based index
       * @return {*} value
       */


      SparseMatrix.prototype.get = function (index) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }

        if (index.length !== this._size.length) {
          throw new DimensionError(index.length, this._size.length);
        } // check it is a pattern matrix


        if (!this._values) {
          throw new Error('Cannot invoke get on a Pattern only matrix');
        } // row and column


        var i = index[0];
        var j = index[1]; // check i, j are valid

        validateIndex(i, this._size[0]);
        validateIndex(j, this._size[1]); // find value index

        var k = _getValueIndex(i, this._ptr[j], this._ptr[j + 1], this._index); // check k is prior to next column k and it is in the correct row


        if (k < this._ptr[j + 1] && this._index[k] === i) {
          return this._values[k];
        }

        return 0;
      };
      /**
       * Replace a single element in the matrix.
       * @memberof SparseMatrix
       * @param {number[]} index   Zero-based index
       * @param {*} v
       * @param {*} [defaultValue]        Default value, filled in on new entries when
       *                                  the matrix is resized. If not provided,
       *                                  new matrix elements will be set to zero.
       * @return {SparseMatrix} self
       */


      SparseMatrix.prototype.set = function (index, v, defaultValue) {
        if (!isArray(index)) {
          throw new TypeError('Array expected');
        }

        if (index.length !== this._size.length) {
          throw new DimensionError(index.length, this._size.length);
        } // check it is a pattern matrix


        if (!this._values) {
          throw new Error('Cannot invoke set on a Pattern only matrix');
        } // row and column


        var i = index[0];
        var j = index[1]; // rows & columns

        var rows = this._size[0];
        var columns = this._size[1]; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0;

        if (isString(this._datatype)) {
          // find signature that matches (datatype, datatype)
          eq = typed.find(equalScalar, [this._datatype, this._datatype]) || equalScalar; // convert 0 to the same datatype

          zero = typed.convert(0, this._datatype);
        } // check we need to resize matrix


        if (i > rows - 1 || j > columns - 1) {
          // resize matrix
          _resize(this, Math.max(i + 1, rows), Math.max(j + 1, columns), defaultValue); // update rows & columns


          rows = this._size[0];
          columns = this._size[1];
        } // check i, j are valid


        validateIndex(i, rows);
        validateIndex(j, columns); // find value index

        var k = _getValueIndex(i, this._ptr[j], this._ptr[j + 1], this._index); // check k is prior to next column k and it is in the correct row


        if (k < this._ptr[j + 1] && this._index[k] === i) {
          // check value != 0
          if (!eq(v, zero)) {
            // update value
            this._values[k] = v;
          } else {
            // remove value from matrix
            _remove(k, j, this._values, this._index, this._ptr);
          }
        } else {
          // insert value @ (i, j)
          _insert(k, i, j, v, this._values, this._index, this._ptr);
        }

        return this;
      };

      function _getValueIndex(i, top, bottom, index) {
        // check row is on the bottom side
        if (bottom - top === 0) {
          return bottom;
        } // loop rows [top, bottom[


        for (var r = top; r < bottom; r++) {
          // check we found value index
          if (index[r] === i) {
            return r;
          }
        } // we did not find row


        return top;
      }

      function _remove(k, j, values, index, ptr) {
        // remove value @ k
        values.splice(k, 1);
        index.splice(k, 1); // update pointers

        for (var x = j + 1; x < ptr.length; x++) {
          ptr[x]--;
        }
      }

      function _insert(k, i, j, v, values, index, ptr) {
        // insert value
        values.splice(k, 0, v); // update row for k

        index.splice(k, 0, i); // update column pointers

        for (var x = j + 1; x < ptr.length; x++) {
          ptr[x]++;
        }
      }
      /**
       * Resize the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (resize in place).
       *
       * @memberof SparseMatrix
       * @param {number[]} size           The new size the matrix should have.
       * @param {*} [defaultValue=0]      Default value, filled in on new entries.
       *                                  If not provided, the matrix elements will
       *                                  be filled with zeros.
       * @param {boolean} [copy]          Return a resized copy of the matrix
       *
       * @return {Matrix}                 The resized matrix
       */


      SparseMatrix.prototype.resize = function (size, defaultValue, copy) {
        // validate arguments
        if (!isArray(size)) {
          throw new TypeError('Array expected');
        }

        if (size.length !== 2) {
          throw new Error('Only two dimensions matrix are supported');
        } // check sizes


        size.forEach(function (value) {
          if (!isNumber(value) || !isInteger(value) || value < 0) {
            throw new TypeError('Invalid size, must contain positive integers ' + '(size: ' + format$2(size) + ')');
          }
        }); // matrix to resize

        var m = copy ? this.clone() : this; // resize matrix

        return _resize(m, size[0], size[1], defaultValue);
      };

      function _resize(matrix, rows, columns, defaultValue) {
        // value to insert at the time of growing matrix
        var value = defaultValue || 0; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0;

        if (isString(matrix._datatype)) {
          // find signature that matches (datatype, datatype)
          eq = typed.find(equalScalar, [matrix._datatype, matrix._datatype]) || equalScalar; // convert 0 to the same datatype

          zero = typed.convert(0, matrix._datatype); // convert value to the same datatype

          value = typed.convert(value, matrix._datatype);
        } // should we insert the value?


        var ins = !eq(value, zero); // old columns and rows

        var r = matrix._size[0];
        var c = matrix._size[1];
        var i, j, k; // check we need to increase columns

        if (columns > c) {
          // loop new columns
          for (j = c; j < columns; j++) {
            // update matrix._ptr for current column
            matrix._ptr[j] = matrix._values.length; // check we need to insert matrix._values

            if (ins) {
              // loop rows
              for (i = 0; i < r; i++) {
                // add new matrix._values
                matrix._values.push(value); // update matrix._index


                matrix._index.push(i);
              }
            }
          } // store number of matrix._values in matrix._ptr


          matrix._ptr[columns] = matrix._values.length;
        } else if (columns < c) {
          // truncate matrix._ptr
          matrix._ptr.splice(columns + 1, c - columns); // truncate matrix._values and matrix._index


          matrix._values.splice(matrix._ptr[columns], matrix._values.length);

          matrix._index.splice(matrix._ptr[columns], matrix._index.length);
        } // update columns


        c = columns; // check we need to increase rows

        if (rows > r) {
          // check we have to insert values
          if (ins) {
            // inserts
            var n = 0; // loop columns

            for (j = 0; j < c; j++) {
              // update matrix._ptr for current column
              matrix._ptr[j] = matrix._ptr[j] + n; // where to insert matrix._values

              k = matrix._ptr[j + 1] + n; // pointer

              var p = 0; // loop new rows, initialize pointer

              for (i = r; i < rows; i++, p++) {
                // add value
                matrix._values.splice(k + p, 0, value); // update matrix._index


                matrix._index.splice(k + p, 0, i); // increment inserts


                n++;
              }
            } // store number of matrix._values in matrix._ptr


            matrix._ptr[c] = matrix._values.length;
          }
        } else if (rows < r) {
          // deletes
          var d = 0; // loop columns

          for (j = 0; j < c; j++) {
            // update matrix._ptr for current column
            matrix._ptr[j] = matrix._ptr[j] - d; // where matrix._values start for next column

            var k0 = matrix._ptr[j];
            var k1 = matrix._ptr[j + 1] - d; // loop matrix._index

            for (k = k0; k < k1; k++) {
              // row
              i = matrix._index[k]; // check we need to delete value and matrix._index

              if (i > rows - 1) {
                // remove value
                matrix._values.splice(k, 1); // remove item from matrix._index


                matrix._index.splice(k, 1); // increase deletes


                d++;
              }
            }
          } // update matrix._ptr for current column


          matrix._ptr[j] = matrix._values.length;
        } // update matrix._size


        matrix._size[0] = rows;
        matrix._size[1] = columns; // return matrix

        return matrix;
      }
      /**
       * Reshape the matrix to the given size. Returns a copy of the matrix when
       * `copy=true`, otherwise return the matrix itself (reshape in place).
       *
       * NOTE: This might be better suited to copy by default, instead of modifying
       *       in place. For now, it operates in place to remain consistent with
       *       resize().
       *
       * @memberof SparseMatrix
       * @param {number[]} size           The new size the matrix should have.
       * @param {boolean} [copy]          Return a reshaped copy of the matrix
       *
       * @return {Matrix}                 The reshaped matrix
       */


      SparseMatrix.prototype.reshape = function (size, copy) {
        // validate arguments
        if (!isArray(size)) {
          throw new TypeError('Array expected');
        }

        if (size.length !== 2) {
          throw new Error('Sparse matrices can only be reshaped in two dimensions');
        } // check sizes


        size.forEach(function (value) {
          if (!isNumber(value) || !isInteger(value) || value < 0) {
            throw new TypeError('Invalid size, must contain positive integers ' + '(size: ' + format$2(size) + ')');
          }
        }); // m * n must not change

        if (this._size[0] * this._size[1] !== size[0] * size[1]) {
          throw new Error('Reshaping sparse matrix will result in the wrong number of elements');
        } // matrix to reshape


        var m = copy ? this.clone() : this; // return unchanged if the same shape

        if (this._size[0] === size[0] && this._size[1] === size[1]) {
          return m;
        } // Convert to COO format (generate a column index)


        var colIndex = [];

        for (var i = 0; i < m._ptr.length; i++) {
          for (var j = 0; j < m._ptr[i + 1] - m._ptr[i]; j++) {
            colIndex.push(i);
          }
        } // Clone the values array


        var values = m._values.slice(); // Clone the row index array


        var rowIndex = m._index.slice(); // Transform the (row, column) indices


        for (var _i = 0; _i < m._index.length; _i++) {
          var r1 = rowIndex[_i];
          var c1 = colIndex[_i];
          var flat = r1 * m._size[1] + c1;
          colIndex[_i] = flat % size[1];
          rowIndex[_i] = Math.floor(flat / size[1]);
        } // Now reshaping is supposed to preserve the row-major order, BUT these sparse matrices are stored
        // in column-major order, so we have to reorder the value array now. One option is to use a multisort,
        // sorting several arrays based on some other array.
        // OR, we could easily just:
        // 1. Remove all values from the matrix


        m._values.length = 0;
        m._index.length = 0;
        m._ptr.length = size[1] + 1;
        m._size = size.slice();

        for (var _i2 = 0; _i2 < m._ptr.length; _i2++) {
          m._ptr[_i2] = 0;
        } // 2. Re-insert all elements in the proper order (simplified code from SparseMatrix.prototype.set)
        // This step is probably the most time-consuming


        for (var h = 0; h < values.length; h++) {
          var _i3 = rowIndex[h];
          var _j = colIndex[h];
          var v = values[h];

          var k = _getValueIndex(_i3, m._ptr[_j], m._ptr[_j + 1], m._index);

          _insert(k, _i3, _j, v, m._values, m._index, m._ptr);
        } // The value indices are inserted out of order, but apparently that's... still OK?


        return m;
      };
      /**
       * Create a clone of the matrix
       * @memberof SparseMatrix
       * @return {SparseMatrix} clone
       */


      SparseMatrix.prototype.clone = function () {
        var m = new SparseMatrix({
          values: this._values ? clone(this._values) : undefined,
          index: clone(this._index),
          ptr: clone(this._ptr),
          size: clone(this._size),
          datatype: this._datatype
        });
        return m;
      };
      /**
       * Retrieve the size of the matrix.
       * @memberof SparseMatrix
       * @returns {number[]} size
       */


      SparseMatrix.prototype.size = function () {
        return this._size.slice(0); // copy the Array
      };
      /**
       * Create a new matrix with the results of the callback function executed on
       * each entry of the matrix.
       * @memberof SparseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
       *
       * @return {SparseMatrix} matrix
       */


      SparseMatrix.prototype.map = function (callback, skipZeros) {
        // check it is a pattern matrix
        if (!this._values) {
          throw new Error('Cannot invoke map on a Pattern only matrix');
        } // matrix instance


        var me = this; // rows and columns

        var rows = this._size[0];
        var columns = this._size[1]; // invoke callback

        var invoke = function invoke(v, i, j) {
          // invoke callback
          return callback(v, [i, j], me);
        }; // invoke _map


        return _map(this, 0, rows - 1, 0, columns - 1, invoke, skipZeros);
      };
      /**
       * Create a new matrix with the results of the callback function executed on the interval
       * [minRow..maxRow, minColumn..maxColumn].
       */


      function _map(matrix, minRow, maxRow, minColumn, maxColumn, callback, skipZeros) {
        // result arrays
        var values = [];
        var index = [];
        var ptr = []; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0;

        if (isString(matrix._datatype)) {
          // find signature that matches (datatype, datatype)
          eq = typed.find(equalScalar, [matrix._datatype, matrix._datatype]) || equalScalar; // convert 0 to the same datatype

          zero = typed.convert(0, matrix._datatype);
        } // invoke callback


        var invoke = function invoke(v, x, y) {
          // invoke callback
          v = callback(v, x, y); // check value != 0

          if (!eq(v, zero)) {
            // store value
            values.push(v); // index

            index.push(x);
          }
        }; // loop columns


        for (var j = minColumn; j <= maxColumn; j++) {
          // store pointer to values index
          ptr.push(values.length); // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]

          var k0 = matrix._ptr[j];
          var k1 = matrix._ptr[j + 1];

          if (skipZeros) {
            // loop k within [k0, k1[
            for (var k = k0; k < k1; k++) {
              // row index
              var i = matrix._index[k]; // check i is in range

              if (i >= minRow && i <= maxRow) {
                // value @ k
                invoke(matrix._values[k], i - minRow, j - minColumn);
              }
            }
          } else {
            // create a cache holding all defined values
            var _values = {};

            for (var _k = k0; _k < k1; _k++) {
              var _i4 = matrix._index[_k];
              _values[_i4] = matrix._values[_k];
            } // loop over all rows (indexes can be unordered so we can't use that),
            // and either read the value or zero


            for (var _i5 = minRow; _i5 <= maxRow; _i5++) {
              var value = _i5 in _values ? _values[_i5] : 0;
              invoke(value, _i5 - minRow, j - minColumn);
            }
          }
        } // store number of values in ptr


        ptr.push(values.length); // return sparse matrix

        return new SparseMatrix({
          values: values,
          index: index,
          ptr: ptr,
          size: [maxRow - minRow + 1, maxColumn - minColumn + 1]
        });
      }
      /**
       * Execute a callback function on each entry of the matrix.
       * @memberof SparseMatrix
       * @param {Function} callback   The callback function is invoked with three
       *                              parameters: the value of the element, the index
       *                              of the element, and the Matrix being traversed.
       * @param {boolean} [skipZeros] Invoke callback function for non-zero values only.
       */


      SparseMatrix.prototype.forEach = function (callback, skipZeros) {
        // check it is a pattern matrix
        if (!this._values) {
          throw new Error('Cannot invoke forEach on a Pattern only matrix');
        } // matrix instance


        var me = this; // rows and columns

        var rows = this._size[0];
        var columns = this._size[1]; // loop columns

        for (var j = 0; j < columns; j++) {
          // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]
          var k0 = this._ptr[j];
          var k1 = this._ptr[j + 1];

          if (skipZeros) {
            // loop k within [k0, k1[
            for (var k = k0; k < k1; k++) {
              // row index
              var i = this._index[k]; // value @ k

              callback(this._values[k], [i, j], me);
            }
          } else {
            // create a cache holding all defined values
            var values = {};

            for (var _k2 = k0; _k2 < k1; _k2++) {
              var _i6 = this._index[_k2];
              values[_i6] = this._values[_k2];
            } // loop over all rows (indexes can be unordered so we can't use that),
            // and either read the value or zero


            for (var _i7 = 0; _i7 < rows; _i7++) {
              var value = _i7 in values ? values[_i7] : 0;
              callback(value, [_i7, j], me);
            }
          }
        }
      };
      /**
       * Create an Array with a copy of the data of the SparseMatrix
       * @memberof SparseMatrix
       * @returns {Array} array
       */


      SparseMatrix.prototype.toArray = function () {
        return _toArray(this._values, this._index, this._ptr, this._size, true);
      };
      /**
       * Get the primitive value of the SparseMatrix: a two dimensions array
       * @memberof SparseMatrix
       * @returns {Array} array
       */


      SparseMatrix.prototype.valueOf = function () {
        return _toArray(this._values, this._index, this._ptr, this._size, false);
      };

      function _toArray(values, index, ptr, size, copy) {
        // rows and columns
        var rows = size[0];
        var columns = size[1]; // result

        var a = []; // vars

        var i, j; // initialize array

        for (i = 0; i < rows; i++) {
          a[i] = [];

          for (j = 0; j < columns; j++) {
            a[i][j] = 0;
          }
        } // loop columns


        for (j = 0; j < columns; j++) {
          // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]
          var k0 = ptr[j];
          var k1 = ptr[j + 1]; // loop k within [k0, k1[

          for (var k = k0; k < k1; k++) {
            // row index
            i = index[k]; // set value (use one for pattern matrix)

            a[i][j] = values ? copy ? clone(values[k]) : values[k] : 1;
          }
        }

        return a;
      }
      /**
       * Get a string representation of the matrix, with optional formatting options.
       * @memberof SparseMatrix
       * @param {Object | number | Function} [options]  Formatting options. See
       *                                                lib/utils/number:format for a
       *                                                description of the available
       *                                                options.
       * @returns {string} str
       */


      SparseMatrix.prototype.format = function (options) {
        // rows and columns
        var rows = this._size[0];
        var columns = this._size[1]; // density

        var density = this.density(); // rows & columns

        var str = 'Sparse Matrix [' + format$2(rows, options) + ' x ' + format$2(columns, options) + '] density: ' + format$2(density, options) + '\n'; // loop columns

        for (var j = 0; j < columns; j++) {
          // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]
          var k0 = this._ptr[j];
          var k1 = this._ptr[j + 1]; // loop k within [k0, k1[

          for (var k = k0; k < k1; k++) {
            // row index
            var i = this._index[k]; // append value

            str += '\n    (' + format$2(i, options) + ', ' + format$2(j, options) + ') ==> ' + (this._values ? format$2(this._values[k], options) : 'X');
          }
        }

        return str;
      };
      /**
       * Get a string representation of the matrix
       * @memberof SparseMatrix
       * @returns {string} str
       */


      SparseMatrix.prototype.toString = function () {
        return format$2(this.toArray());
      };
      /**
       * Get a JSON representation of the matrix
       * @memberof SparseMatrix
       * @returns {Object}
       */


      SparseMatrix.prototype.toJSON = function () {
        return {
          mathjs: 'SparseMatrix',
          values: this._values,
          index: this._index,
          ptr: this._ptr,
          size: this._size,
          datatype: this._datatype
        };
      };
      /**
       * Get the kth Matrix diagonal.
       *
       * @memberof SparseMatrix
       * @param {number | BigNumber} [k=0]     The kth diagonal where the vector will retrieved.
       *
       * @returns {Matrix}                     The matrix vector with the diagonal values.
       */


      SparseMatrix.prototype.diagonal = function (k) {
        // validate k if any
        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          } // is must be an integer


          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        }

        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0; // rows & columns

        var rows = this._size[0];
        var columns = this._size[1]; // number diagonal values

        var n = Math.min(rows - kSub, columns - kSuper); // diagonal arrays

        var values = [];
        var index = [];
        var ptr = []; // initial ptr value

        ptr[0] = 0; // loop columns

        for (var j = kSuper; j < columns && values.length < n; j++) {
          // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]
          var k0 = this._ptr[j];
          var k1 = this._ptr[j + 1]; // loop x within [k0, k1[

          for (var x = k0; x < k1; x++) {
            // row index
            var i = this._index[x]; // check row

            if (i === j - kSuper + kSub) {
              // value on this column
              values.push(this._values[x]); // store row

              index[values.length - 1] = i - kSub; // exit loop

              break;
            }
          }
        } // close ptr


        ptr.push(values.length); // return matrix

        return new SparseMatrix({
          values: values,
          index: index,
          ptr: ptr,
          size: [n, 1]
        });
      };
      /**
       * Generate a matrix from a JSON object
       * @memberof SparseMatrix
       * @param {Object} json  An object structured like
       *                       `{"mathjs": "SparseMatrix", "values": [], "index": [], "ptr": [], "size": []}`,
       *                       where mathjs is optional
       * @returns {SparseMatrix}
       */


      SparseMatrix.fromJSON = function (json) {
        return new SparseMatrix(json);
      };
      /**
       * Create a diagonal matrix.
       *
       * @memberof SparseMatrix
       * @param {Array} size                       The matrix size.
       * @param {number | Array | Matrix } value   The values for the diagonal.
       * @param {number | BigNumber} [k=0]         The kth diagonal where the vector will be filled in.
       * @param {number} [defaultValue]            The default value for non-diagonal
       * @param {string} [datatype]                The Matrix datatype, values must be of this datatype.
       *
       * @returns {SparseMatrix}
       */


      SparseMatrix.diagonal = function (size, value, k, defaultValue, datatype) {
        if (!isArray(size)) {
          throw new TypeError('Array expected, size parameter');
        }

        if (size.length !== 2) {
          throw new Error('Only two dimensions matrix are supported');
        } // map size & validate


        size = size.map(function (s) {
          // check it is a big number
          if (isBigNumber(s)) {
            // convert it
            s = s.toNumber();
          } // validate arguments


          if (!isNumber(s) || !isInteger(s) || s < 1) {
            throw new Error('Size values must be positive integers');
          }

          return s;
        }); // validate k if any

        if (k) {
          // convert BigNumber to a number
          if (isBigNumber(k)) {
            k = k.toNumber();
          } // is must be an integer


          if (!isNumber(k) || !isInteger(k)) {
            throw new TypeError('The parameter k must be an integer number');
          }
        } else {
          // default value
          k = 0;
        } // equal signature to use


        var eq = equalScalar; // zero value

        var zero = 0;

        if (isString(datatype)) {
          // find signature that matches (datatype, datatype)
          eq = typed.find(equalScalar, [datatype, datatype]) || equalScalar; // convert 0 to the same datatype

          zero = typed.convert(0, datatype);
        }

        var kSuper = k > 0 ? k : 0;
        var kSub = k < 0 ? -k : 0; // rows and columns

        var rows = size[0];
        var columns = size[1]; // number of non-zero items

        var n = Math.min(rows - kSub, columns - kSuper); // value extraction function

        var _value; // check value


        if (isArray(value)) {
          // validate array
          if (value.length !== n) {
            // number of values in array must be n
            throw new Error('Invalid value array length');
          } // define function


          _value = function _value(i) {
            // return value @ i
            return value[i];
          };
        } else if (isMatrix(value)) {
          // matrix size
          var ms = value.size(); // validate matrix

          if (ms.length !== 1 || ms[0] !== n) {
            // number of values in array must be n
            throw new Error('Invalid matrix length');
          } // define function


          _value = function _value(i) {
            // return value @ i
            return value.get([i]);
          };
        } else {
          // define function
          _value = function _value() {
            // return value
            return value;
          };
        } // create arrays


        var values = [];
        var index = [];
        var ptr = []; // loop items

        for (var j = 0; j < columns; j++) {
          // number of rows with value
          ptr.push(values.length); // diagonal index

          var i = j - kSuper; // check we need to set diagonal value

          if (i >= 0 && i < n) {
            // get value @ i
            var v = _value(i); // check for zero


            if (!eq(v, zero)) {
              // column
              index.push(i + kSub); // add value

              values.push(v);
            }
          }
        } // last value should be number of values


        ptr.push(values.length); // create SparseMatrix

        return new SparseMatrix({
          values: values,
          index: index,
          ptr: ptr,
          size: [rows, columns]
        });
      };
      /**
       * Swap rows i and j in Matrix.
       *
       * @memberof SparseMatrix
       * @param {number} i       Matrix row index 1
       * @param {number} j       Matrix row index 2
       *
       * @return {Matrix}        The matrix reference
       */


      SparseMatrix.prototype.swapRows = function (i, j) {
        // check index
        if (!isNumber(i) || !isInteger(i) || !isNumber(j) || !isInteger(j)) {
          throw new Error('Row index must be positive integers');
        } // check dimensions


        if (this._size.length !== 2) {
          throw new Error('Only two dimensional matrix is supported');
        } // validate index


        validateIndex(i, this._size[0]);
        validateIndex(j, this._size[0]); // swap rows

        SparseMatrix._swapRows(i, j, this._size[1], this._values, this._index, this._ptr); // return current instance


        return this;
      };
      /**
       * Loop rows with data in column j.
       *
       * @param {number} j            Column
       * @param {Array} values        Matrix values
       * @param {Array} index         Matrix row indeces
       * @param {Array} ptr           Matrix column pointers
       * @param {Function} callback   Callback function invoked for every row in column j
       */


      SparseMatrix._forEachRow = function (j, values, index, ptr, callback) {
        // indeces for column j
        var k0 = ptr[j];
        var k1 = ptr[j + 1]; // loop

        for (var k = k0; k < k1; k++) {
          // invoke callback
          callback(index[k], values[k]);
        }
      };
      /**
       * Swap rows x and y in Sparse Matrix data structures.
       *
       * @param {number} x         Matrix row index 1
       * @param {number} y         Matrix row index 2
       * @param {number} columns   Number of columns in matrix
       * @param {Array} values     Matrix values
       * @param {Array} index      Matrix row indeces
       * @param {Array} ptr        Matrix column pointers
       */


      SparseMatrix._swapRows = function (x, y, columns, values, index, ptr) {
        // loop columns
        for (var j = 0; j < columns; j++) {
          // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]
          var k0 = ptr[j];
          var k1 = ptr[j + 1]; // find value index @ x

          var kx = _getValueIndex(x, k0, k1, index); // find value index @ x


          var ky = _getValueIndex(y, k0, k1, index); // check both rows exist in matrix


          if (kx < k1 && ky < k1 && index[kx] === x && index[ky] === y) {
            // swap values (check for pattern matrix)
            if (values) {
              var v = values[kx];
              values[kx] = values[ky];
              values[ky] = v;
            } // next column


            continue;
          } // check x row exist & no y row


          if (kx < k1 && index[kx] === x && (ky >= k1 || index[ky] !== y)) {
            // value @ x (check for pattern matrix)
            var vx = values ? values[kx] : undefined; // insert value @ y

            index.splice(ky, 0, y);

            if (values) {
              values.splice(ky, 0, vx);
            } // remove value @ x (adjust array index if needed)


            index.splice(ky <= kx ? kx + 1 : kx, 1);

            if (values) {
              values.splice(ky <= kx ? kx + 1 : kx, 1);
            } // next column


            continue;
          } // check y row exist & no x row


          if (ky < k1 && index[ky] === y && (kx >= k1 || index[kx] !== x)) {
            // value @ y (check for pattern matrix)
            var vy = values ? values[ky] : undefined; // insert value @ x

            index.splice(kx, 0, x);

            if (values) {
              values.splice(kx, 0, vy);
            } // remove value @ y (adjust array index if needed)


            index.splice(kx <= ky ? ky + 1 : ky, 1);

            if (values) {
              values.splice(kx <= ky ? ky + 1 : ky, 1);
            }
          }
        }
      };

      return SparseMatrix;
    }, {
      isClass: true
    });

    var name$9 = 'number';
    var dependencies$a = ['typed'];
    var createNumber =
    /* #__PURE__ */
    factory(name$9, dependencies$a, function (_ref) {
      var typed = _ref.typed;

      /**
       * Create a number or convert a string, boolean, or unit to a number.
       * When value is a matrix, all elements will be converted to number.
       *
       * Syntax:
       *
       *    math.number(value)
       *    math.number(unit, valuelessUnit)
       *
       * Examples:
       *
       *    math.number(2)                         // returns number 2
       *    math.number('7.2')                     // returns number 7.2
       *    math.number(true)                      // returns number 1
       *    math.number([true, false, true, true]) // returns [1, 0, 1, 1]
       *    math.number(math.unit('52cm'), 'm')    // returns 0.52
       *
       * See also:
       *
       *    bignumber, boolean, complex, index, matrix, string, unit
       *
       * @param {string | number | BigNumber | Fraction | boolean | Array | Matrix | Unit | null} [value]  Value to be converted
       * @param {Unit | string} [valuelessUnit] A valueless unit, used to convert a unit to a number
       * @return {number | Array | Matrix} The created number
       */
      var number = typed('number', {
        '': function _() {
          return 0;
        },
        number: function number(x) {
          return x;
        },
        string: function string(x) {
          if (x === 'NaN') return NaN;
          var num = Number(x);

          if (isNaN(num)) {
            throw new SyntaxError('String "' + x + '" is no valid number');
          }

          return num;
        },
        BigNumber: function BigNumber(x) {
          return x.toNumber();
        },
        Fraction: function Fraction(x) {
          return x.valueOf();
        },
        Unit: function Unit(x) {
          throw new Error('Second argument with valueless unit expected');
        },
        "null": function _null(x) {
          return 0;
        },
        'Unit, string | Unit': function UnitStringUnit(unit, valuelessUnit) {
          return unit.toNumber(valuelessUnit);
        },
        'Array | Matrix': function ArrayMatrix(x) {
          return deepMap(x, number);
        }
      });
      return number;
    });

    var name$a = 'bignumber';
    var dependencies$b = ['typed', 'BigNumber'];
    var createBignumber =
    /* #__PURE__ */
    factory(name$a, dependencies$b, function (_ref) {
      var typed = _ref.typed,
          BigNumber = _ref.BigNumber;

      /**
       * Create a BigNumber, which can store numbers with arbitrary precision.
       * When a matrix is provided, all elements will be converted to BigNumber.
       *
       * Syntax:
       *
       *    math.bignumber(x)
       *
       * Examples:
       *
       *    0.1 + 0.2                                  // returns number 0.30000000000000004
       *    math.bignumber(0.1) + math.bignumber(0.2)  // returns BigNumber 0.3
       *
       *
       *    7.2e500                                    // returns number Infinity
       *    math.bignumber('7.2e500')                  // returns BigNumber 7.2e500
       *
       * See also:
       *
       *    boolean, complex, index, matrix, string, unit
       *
       * @param {number | string | Fraction | BigNumber | Array | Matrix | boolean | null} [value]  Value for the big number,
       *                                                    0 by default.
       * @returns {BigNumber} The created bignumber
       */
      var bignumber = typed('bignumber', {
        '': function _() {
          return new BigNumber(0);
        },
        number: function number(x) {
          // convert to string to prevent errors in case of >15 digits
          return new BigNumber(x + '');
        },
        string: function string(x) {
          return new BigNumber(x);
        },
        BigNumber: function BigNumber(x) {
          // we assume a BigNumber is immutable
          return x;
        },
        Fraction: function Fraction(x) {
          return new BigNumber(x.n).div(x.d).times(x.s);
        },
        "null": function _null(x) {
          return new BigNumber(0);
        },
        'Array | Matrix': function ArrayMatrix(x) {
          return deepMap(x, bignumber);
        }
      });
      return bignumber;
    });

    var name$b = 'fraction';
    var dependencies$c = ['typed', 'Fraction'];
    var createFraction =
    /* #__PURE__ */
    factory(name$b, dependencies$c, function (_ref) {
      var typed = _ref.typed,
          Fraction = _ref.Fraction;

      /**
       * Create a fraction convert a value to a fraction.
       *
       * Syntax:
       *     math.fraction(numerator, denominator)
       *     math.fraction({n: numerator, d: denominator})
       *     math.fraction(matrix: Array | Matrix)         Turn all matrix entries
       *                                                   into fractions
       *
       * Examples:
       *
       *     math.fraction(1, 3)
       *     math.fraction('2/3')
       *     math.fraction({n: 2, d: 3})
       *     math.fraction([0.2, 0.25, 1.25])
       *
       * See also:
       *
       *    bignumber, number, string, unit
       *
       * @param {number | string | Fraction | BigNumber | Array | Matrix} [args]
       *            Arguments specifying the numerator and denominator of
       *            the fraction
       * @return {Fraction | Array | Matrix} Returns a fraction
       */
      var fraction = typed('fraction', {
        number: function number(x) {
          if (!isFinite(x) || isNaN(x)) {
            throw new Error(x + ' cannot be represented as a fraction');
          }

          return new Fraction(x);
        },
        string: function string(x) {
          return new Fraction(x);
        },
        'number, number': function numberNumber(numerator, denominator) {
          return new Fraction(numerator, denominator);
        },
        "null": function _null(x) {
          return new Fraction(0);
        },
        BigNumber: function BigNumber(x) {
          return new Fraction(x.toString());
        },
        Fraction: function Fraction(x) {
          return x; // fractions are immutable
        },
        Object: function Object(x) {
          return new Fraction(x);
        },
        'Array | Matrix': function ArrayMatrix(x) {
          return deepMap(x, fraction);
        }
      });
      return fraction;
    });

    var name$c = 'matrix';
    var dependencies$d = ['typed', 'Matrix', 'DenseMatrix', 'SparseMatrix'];
    var createMatrix =
    /* #__PURE__ */
    factory(name$c, dependencies$d, function (_ref) {
      var typed = _ref.typed,
          Matrix = _ref.Matrix,
          DenseMatrix = _ref.DenseMatrix,
          SparseMatrix = _ref.SparseMatrix;

      /**
       * Create a Matrix. The function creates a new `math.Matrix` object from
       * an `Array`. A Matrix has utility functions to manipulate the data in the
       * matrix, like getting the size and getting or setting values in the matrix.
       * Supported storage formats are 'dense' and 'sparse'.
       *
       * Syntax:
       *
       *    math.matrix()                         // creates an empty matrix using default storage format (dense).
       *    math.matrix(data)                     // creates a matrix with initial data using default storage format (dense).
       *    math.matrix('dense')                  // creates an empty matrix using the given storage format.
       *    math.matrix(data, 'dense')            // creates a matrix with initial data using the given storage format.
       *    math.matrix(data, 'sparse')           // creates a sparse matrix with initial data.
       *    math.matrix(data, 'sparse', 'number') // creates a sparse matrix with initial data, number data type.
       *
       * Examples:
       *
       *    let m = math.matrix([[1, 2], [3, 4]])
       *    m.size()                        // Array [2, 2]
       *    m.resize([3, 2], 5)
       *    m.valueOf()                     // Array [[1, 2], [3, 4], [5, 5]]
       *    m.get([1, 0])                    // number 3
       *
       * See also:
       *
       *    bignumber, boolean, complex, index, number, string, unit, sparse
       *
       * @param {Array | Matrix} [data]    A multi dimensional array
       * @param {string} [format]          The Matrix storage format
       *
       * @return {Matrix} The created matrix
       */
      return typed(name$c, {
        '': function _() {
          return _create([]);
        },
        string: function string(format) {
          return _create([], format);
        },
        'string, string': function stringString(format, datatype) {
          return _create([], format, datatype);
        },
        Array: function Array(data) {
          return _create(data);
        },
        Matrix: function Matrix(data) {
          return _create(data, data.storage());
        },
        'Array | Matrix, string': _create,
        'Array | Matrix, string, string': _create
      });
      /**
       * Create a new Matrix with given storage format
       * @param {Array} data
       * @param {string} [format]
       * @param {string} [datatype]
       * @returns {Matrix} Returns a new Matrix
       * @private
       */

      function _create(data, format, datatype) {
        // get storage format constructor
        if (format === 'dense' || format === 'default' || format === undefined) {
          return new DenseMatrix(data, datatype);
        }

        if (format === 'sparse') {
          return new SparseMatrix(data, datatype);
        }

        throw new TypeError('Unknown matrix type ' + JSON.stringify(format) + '.');
      }
    });

    var name$d = 'unaryMinus';
    var dependencies$e = ['typed'];
    var createUnaryMinus =
    /* #__PURE__ */
    factory(name$d, dependencies$e, function (_ref) {
      var typed = _ref.typed;

      /**
       * Inverse the sign of a value, apply a unary minus operation.
       *
       * For matrices, the function is evaluated element wise. Boolean values and
       * strings will be converted to a number. For complex numbers, both real and
       * complex value are inverted.
       *
       * Syntax:
       *
       *    math.unaryMinus(x)
       *
       * Examples:
       *
       *    math.unaryMinus(3.5)      // returns -3.5
       *    math.unaryMinus(-4.2)     // returns 4.2
       *
       * See also:
       *
       *    add, subtract, unaryPlus
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} x Number to be inverted.
       * @return {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} Returns the value with inverted sign.
       */
      var unaryMinus = typed(name$d, {
        number: unaryMinusNumber,
        Complex: function Complex(x) {
          return x.neg();
        },
        BigNumber: function BigNumber(x) {
          return x.neg();
        },
        Fraction: function Fraction(x) {
          return x.neg();
        },
        Unit: function Unit(x) {
          var res = x.clone();
          res.value = unaryMinus(x.value);
          return res;
        },
        'Array | Matrix': function ArrayMatrix(x) {
          // deep map collection, skip zeros since unaryMinus(0) = 0
          return deepMap(x, unaryMinus);
        } // TODO: add support for string

      });
      return unaryMinus;
    });

    var name$e = 'abs';
    var dependencies$f = ['typed'];
    var createAbs =
    /* #__PURE__ */
    factory(name$e, dependencies$f, function (_ref) {
      var typed = _ref.typed;

      /**
       * Calculate the absolute value of a number. For matrices, the function is
       * evaluated element wise.
       *
       * Syntax:
       *
       *    math.abs(x)
       *
       * Examples:
       *
       *    math.abs(3.5)                // returns number 3.5
       *    math.abs(-4.2)               // returns number 4.2
       *
       *    math.abs([3, -5, -1, 0, 2])  // returns Array [3, 5, 1, 0, 2]
       *
       * See also:
       *
       *    sign
       *
       * @param  {number | BigNumber | Fraction | Complex | Array | Matrix | Unit} x
       *            A number or matrix for which to get the absolute value
       * @return {number | BigNumber | Fraction | Complex | Array | Matrix | Unit}
       *            Absolute value of `x`
       */
      var abs = typed(name$e, {
        number: absNumber,
        Complex: function Complex(x) {
          return x.abs();
        },
        BigNumber: function BigNumber(x) {
          return x.abs();
        },
        Fraction: function Fraction(x) {
          return x.abs();
        },
        'Array | Matrix': function ArrayMatrix(x) {
          // deep map collection, skip zeros since abs(0) = 0
          return deepMap(x, abs);
        },
        Unit: function Unit(x) {
          return x.abs();
        }
      });
      return abs;
    });

    var name$f = 'apply';
    var dependencies$g = ['typed', 'isInteger'];
    var createApply =
    /* #__PURE__ */
    factory(name$f, dependencies$g, function (_ref) {
      var typed = _ref.typed,
          isInteger = _ref.isInteger;

      /**
       * Apply a function that maps an array to a scalar
       * along a given axis of a matrix or array.
       * Returns a new matrix or array with one less dimension than the input.
       *
       * Syntax:
       *
       *     math.apply(A, dim, callback)
       *
       * Where:
       *
       * - `dim: number` is a zero-based dimension over which to concatenate the matrices.
       *
       * Examples:
       *
       *    const A = [[1, 2], [3, 4]]
       *    const sum = math.sum
       *
       *    math.apply(A, 0, sum)             // returns [4, 6]
       *    math.apply(A, 1, sum)             // returns [3, 7]
       *
       * See also:
       *
       *    map, filter, forEach
       *
       * @param {Array | Matrix} array   The input Matrix
       * @param {number} dim             The dimension along which the callback is applied
       * @param {Function} callback      The callback function that is applied. This Function
       *                                 should take an array or 1-d matrix as an input and
       *                                 return a number.
       * @return {Array | Matrix} res    The residual matrix with the function applied over some dimension.
       */
      var apply = typed(name$f, {
        'Array | Matrix, number | BigNumber, function': function ArrayMatrixNumberBigNumberFunction(mat, dim, callback) {
          if (!isInteger(dim)) {
            throw new TypeError('Integer number expected for dimension');
          }

          var size = Array.isArray(mat) ? arraySize(mat) : mat.size();

          if (dim < 0 || dim >= size.length) {
            throw new IndexError(dim, size.length);
          }

          if (isMatrix(mat)) {
            return mat.create(_apply(mat.valueOf(), dim, callback));
          } else {
            return _apply(mat, dim, callback);
          }
        }
      });
      return apply;
    });
    /**
     * Recursively reduce a matrix
     * @param {Array} mat
     * @param {number} dim
     * @param {Function} callback
     * @returns {Array} ret
     * @private
     */

    function _apply(mat, dim, callback) {
      var i, ret, tran;

      if (dim <= 0) {
        if (!Array.isArray(mat[0])) {
          return callback(mat);
        } else {
          tran = _switch$1(mat);
          ret = [];

          for (i = 0; i < tran.length; i++) {
            ret[i] = _apply(tran[i], dim - 1, callback);
          }

          return ret;
        }
      } else {
        ret = [];

        for (i = 0; i < mat.length; i++) {
          ret[i] = _apply(mat[i], dim - 1, callback);
        }

        return ret;
      }
    }
    /**
     * Transpose a matrix
     * @param {Array} mat
     * @returns {Array} ret
     * @private
     */


    function _switch$1(mat) {
      var I = mat.length;
      var J = mat[0].length;
      var i, j;
      var ret = [];

      for (j = 0; j < J; j++) {
        var tmp = [];

        for (i = 0; i < I; i++) {
          tmp.push(mat[i][j]);
        }

        ret.push(tmp);
      }

      return ret;
    }

    var name$g = 'addScalar';
    var dependencies$h = ['typed'];
    var createAddScalar =
    /* #__PURE__ */
    factory(name$g, dependencies$h, function (_ref) {
      var typed = _ref.typed;

      /**
       * Add two scalar values, `x + y`.
       * This function is meant for internal use: it is used by the public function
       * `add`
       *
       * This function does not support collections (Array or Matrix).
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit} x   First value to add
       * @param  {number | BigNumber | Fraction | Complex} y          Second value to add
       * @return {number | BigNumber | Fraction | Complex | Unit}     Sum of `x` and `y`
       * @private
       */
      var addScalar = typed(name$g, {
        'number, number': addNumber,
        'Complex, Complex': function ComplexComplex(x, y) {
          return x.add(y);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.plus(y);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.add(y);
        },
        'Unit, Unit': function UnitUnit(x, y) {
          if (x.value === null || x.value === undefined) throw new Error('Parameter x contains a unit with undefined value');
          if (y.value === null || y.value === undefined) throw new Error('Parameter y contains a unit with undefined value');
          if (!x.equalBase(y)) throw new Error('Units do not match');
          var res = x.clone();
          res.value = addScalar(res.value, y.value);
          res.fixPrefix = false;
          return res;
        }
      });
      return addScalar;
    });

    var name$h = 'algorithm01';
    var dependencies$i = ['typed'];
    var createAlgorithm01 =
    /* #__PURE__ */
    factory(name$h, dependencies$i, function (_ref) {
      var typed = _ref.typed;

      /**
       * Iterates over SparseMatrix nonzero items and invokes the callback function f(Dij, Sij).
       * Callback function invoked NNZ times (number of nonzero items in SparseMatrix).
       *
       *
       *          ┌  f(Dij, Sij)  ; S(i,j) !== 0
       * C(i,j) = ┤
       *          └  Dij          ; otherwise
       *
       *
       * @param {Matrix}   denseMatrix       The DenseMatrix instance (D)
       * @param {Matrix}   sparseMatrix      The SparseMatrix instance (S)
       * @param {Function} callback          The f(Dij,Sij) operation to invoke, where Dij = DenseMatrix(i,j) and Sij = SparseMatrix(i,j)
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(Sij,Dij)
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * see https://github.com/josdejong/mathjs/pull/346#issuecomment-97477571
       */
      return function algorithm1(denseMatrix, sparseMatrix, callback, inverse) {
        // dense matrix arrays
        var adata = denseMatrix._data;
        var asize = denseMatrix._size;
        var adt = denseMatrix._datatype; // sparse matrix arrays

        var bvalues = sparseMatrix._values;
        var bindex = sparseMatrix._index;
        var bptr = sparseMatrix._ptr;
        var bsize = sparseMatrix._size;
        var bdt = sparseMatrix._datatype; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // check rows & columns


        if (asize[0] !== bsize[0] || asize[1] !== bsize[1]) {
          throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
        } // sparse matrix cannot be a Pattern matrix


        if (!bvalues) {
          throw new Error('Cannot perform operation on Dense Matrix and Pattern Sparse Matrix');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // process data types

        var dt = typeof adt === 'string' && adt === bdt ? adt : undefined; // callback function

        var cf = dt ? typed.find(callback, [dt, dt]) : callback; // vars

        var i, j; // result (DenseMatrix)

        var cdata = []; // initialize c

        for (i = 0; i < rows; i++) {
          cdata[i] = [];
        } // workspace


        var x = []; // marks indicating we have a value in x for a given column

        var w = []; // loop columns in b

        for (j = 0; j < columns; j++) {
          // column mark
          var mark = j + 1; // values in column j

          for (var k0 = bptr[j], k1 = bptr[j + 1], k = k0; k < k1; k++) {
            // row
            i = bindex[k]; // update workspace

            x[i] = inverse ? cf(bvalues[k], adata[i][j]) : cf(adata[i][j], bvalues[k]); // mark i as updated

            w[i] = mark;
          } // loop rows


          for (i = 0; i < rows; i++) {
            // check row is in workspace
            if (w[i] === mark) {
              // c[i][j] was already calculated
              cdata[i][j] = x[i];
            } else {
              // item does not exist in S
              cdata[i][j] = adata[i][j];
            }
          }
        } // return dense matrix


        return denseMatrix.createDenseMatrix({
          data: cdata,
          size: [rows, columns],
          datatype: dt
        });
      };
    });

    var name$i = 'algorithm04';
    var dependencies$j = ['typed', 'equalScalar'];
    var createAlgorithm04 =
    /* #__PURE__ */
    factory(name$i, dependencies$j, function (_ref) {
      var typed = _ref.typed,
          equalScalar = _ref.equalScalar;

      /**
       * Iterates over SparseMatrix A and SparseMatrix B nonzero items and invokes the callback function f(Aij, Bij).
       * Callback function invoked MAX(NNZA, NNZB) times
       *
       *
       *          ┌  f(Aij, Bij)  ; A(i,j) !== 0 && B(i,j) !== 0
       * C(i,j) = ┤  A(i,j)       ; A(i,j) !== 0
       *          └  B(i,j)       ; B(i,j) !== 0
       *
       *
       * @param {Matrix}   a                 The SparseMatrix instance (A)
       * @param {Matrix}   b                 The SparseMatrix instance (B)
       * @param {Function} callback          The f(Aij,Bij) operation to invoke
       *
       * @return {Matrix}                    SparseMatrix (C)
       *
       * see https://github.com/josdejong/mathjs/pull/346#issuecomment-97620294
       */
      return function algorithm04(a, b, callback) {
        // sparse matrix arrays
        var avalues = a._values;
        var aindex = a._index;
        var aptr = a._ptr;
        var asize = a._size;
        var adt = a._datatype; // sparse matrix arrays

        var bvalues = b._values;
        var bindex = b._index;
        var bptr = b._ptr;
        var bsize = b._size;
        var bdt = b._datatype; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // check rows & columns


        if (asize[0] !== bsize[0] || asize[1] !== bsize[1]) {
          throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string' && adt === bdt) {
          // datatype
          dt = adt; // find signature that matches (dt, dt)

          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result arrays


        var cvalues = avalues && bvalues ? [] : undefined;
        var cindex = [];
        var cptr = []; // matrix

        var c = a.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [rows, columns],
          datatype: dt
        }); // workspace

        var xa = avalues && bvalues ? [] : undefined;
        var xb = avalues && bvalues ? [] : undefined; // marks indicating we have a value in x for a given column

        var wa = [];
        var wb = []; // vars

        var i, j, k, k0, k1; // loop columns

        for (j = 0; j < columns; j++) {
          // update cptr
          cptr[j] = cindex.length; // columns mark

          var mark = j + 1; // loop A(:,j)

          for (k0 = aptr[j], k1 = aptr[j + 1], k = k0; k < k1; k++) {
            // row
            i = aindex[k]; // update c

            cindex.push(i); // update workspace

            wa[i] = mark; // check we need to process values

            if (xa) {
              xa[i] = avalues[k];
            }
          } // loop B(:,j)


          for (k0 = bptr[j], k1 = bptr[j + 1], k = k0; k < k1; k++) {
            // row
            i = bindex[k]; // check row exists in A

            if (wa[i] === mark) {
              // update record in xa @ i
              if (xa) {
                // invoke callback
                var v = cf(xa[i], bvalues[k]); // check for zero

                if (!eq(v, zero)) {
                  // update workspace
                  xa[i] = v;
                } else {
                  // remove mark (index will be removed later)
                  wa[i] = null;
                }
              }
            } else {
              // update c
              cindex.push(i); // update workspace

              wb[i] = mark; // check we need to process values

              if (xb) {
                xb[i] = bvalues[k];
              }
            }
          } // check we need to process values (non pattern matrix)


          if (xa && xb) {
            // initialize first index in j
            k = cptr[j]; // loop index in j

            while (k < cindex.length) {
              // row
              i = cindex[k]; // check workspace has value @ i

              if (wa[i] === mark) {
                // push value (Aij != 0 || (Aij != 0 && Bij != 0))
                cvalues[k] = xa[i]; // increment pointer

                k++;
              } else if (wb[i] === mark) {
                // push value (bij != 0)
                cvalues[k] = xb[i]; // increment pointer

                k++;
              } else {
                // remove index @ k
                cindex.splice(k, 1);
              }
            }
          }
        } // update cptr


        cptr[columns] = cindex.length; // return sparse matrix

        return c;
      };
    });

    var name$j = 'algorithm10';
    var dependencies$k = ['typed', 'DenseMatrix'];
    var createAlgorithm10 =
    /* #__PURE__ */
    factory(name$j, dependencies$k, function (_ref) {
      var typed = _ref.typed,
          DenseMatrix = _ref.DenseMatrix;

      /**
       * Iterates over SparseMatrix S nonzero items and invokes the callback function f(Sij, b).
       * Callback function invoked NZ times (number of nonzero items in S).
       *
       *
       *          ┌  f(Sij, b)  ; S(i,j) !== 0
       * C(i,j) = ┤
       *          └  b          ; otherwise
       *
       *
       * @param {Matrix}   s                 The SparseMatrix instance (S)
       * @param {Scalar}   b                 The Scalar value
       * @param {Function} callback          The f(Aij,b) operation to invoke
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(b,Sij)
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * https://github.com/josdejong/mathjs/pull/346#issuecomment-97626813
       */
      return function algorithm10(s, b, callback, inverse) {
        // sparse matrix arrays
        var avalues = s._values;
        var aindex = s._index;
        var aptr = s._ptr;
        var asize = s._size;
        var adt = s._datatype; // sparse matrix cannot be a Pattern matrix

        if (!avalues) {
          throw new Error('Cannot perform operation on Pattern Sparse Matrix and Scalar value');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string') {
          // datatype
          dt = adt; // convert b to the same datatype

          b = typed.convert(b, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result arrays


        var cdata = []; // matrix

        var c = new DenseMatrix({
          data: cdata,
          size: [rows, columns],
          datatype: dt
        }); // workspaces

        var x = []; // marks indicating we have a value in x for a given column

        var w = []; // loop columns

        for (var j = 0; j < columns; j++) {
          // columns mark
          var mark = j + 1; // values in j

          for (var k0 = aptr[j], k1 = aptr[j + 1], k = k0; k < k1; k++) {
            // row
            var r = aindex[k]; // update workspace

            x[r] = avalues[k];
            w[r] = mark;
          } // loop rows


          for (var i = 0; i < rows; i++) {
            // initialize C on first column
            if (j === 0) {
              // create row array
              cdata[i] = [];
            } // check sparse matrix has a value @ i,j


            if (w[i] === mark) {
              // invoke callback, update C
              cdata[i][j] = inverse ? cf(b, x[i]) : cf(x[i], b);
            } else {
              // dense matrix value @ i, j
              cdata[i][j] = b;
            }
          }
        } // return sparse matrix


        return c;
      };
    });

    var name$k = 'algorithm13';
    var dependencies$l = ['typed'];
    var createAlgorithm13 =
    /* #__PURE__ */
    factory(name$k, dependencies$l, function (_ref) {
      var typed = _ref.typed;

      /**
       * Iterates over DenseMatrix items and invokes the callback function f(Aij..z, Bij..z).
       * Callback function invoked MxN times.
       *
       * C(i,j,...z) = f(Aij..z, Bij..z)
       *
       * @param {Matrix}   a                 The DenseMatrix instance (A)
       * @param {Matrix}   b                 The DenseMatrix instance (B)
       * @param {Function} callback          The f(Aij..z,Bij..z) operation to invoke
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * https://github.com/josdejong/mathjs/pull/346#issuecomment-97658658
       */
      return function algorithm13(a, b, callback) {
        // a arrays
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // b arrays

        var bdata = b._data;
        var bsize = b._size;
        var bdt = b._datatype; // c arrays

        var csize = []; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // validate each one of the dimension sizes


        for (var s = 0; s < asize.length; s++) {
          // must match
          if (asize[s] !== bsize[s]) {
            throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
          } // update dimension in c


          csize[s] = asize[s];
        } // datatype


        var dt; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string' && adt === bdt) {
          // datatype
          dt = adt; // callback

          cf = typed.find(callback, [dt, dt]);
        } // populate cdata, iterate through dimensions


        var cdata = csize.length > 0 ? _iterate(cf, 0, csize, csize[0], adata, bdata) : []; // c matrix

        return a.createDenseMatrix({
          data: cdata,
          size: csize,
          datatype: dt
        });
      }; // recursive function

      function _iterate(f, level, s, n, av, bv) {
        // initialize array for this level
        var cv = []; // check we reach the last level

        if (level === s.length - 1) {
          // loop arrays in last level
          for (var i = 0; i < n; i++) {
            // invoke callback and store value
            cv[i] = f(av[i], bv[i]);
          }
        } else {
          // iterate current level
          for (var j = 0; j < n; j++) {
            // iterate next level
            cv[j] = _iterate(f, level + 1, s, s[level + 1], av[j], bv[j]);
          }
        }

        return cv;
      }
    });

    var name$l = 'algorithm14';
    var dependencies$m = ['typed'];
    var createAlgorithm14 =
    /* #__PURE__ */
    factory(name$l, dependencies$m, function (_ref) {
      var typed = _ref.typed;

      /**
       * Iterates over DenseMatrix items and invokes the callback function f(Aij..z, b).
       * Callback function invoked MxN times.
       *
       * C(i,j,...z) = f(Aij..z, b)
       *
       * @param {Matrix}   a                 The DenseMatrix instance (A)
       * @param {Scalar}   b                 The Scalar value
       * @param {Function} callback          The f(Aij..z,b) operation to invoke
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(b,Aij..z)
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * https://github.com/josdejong/mathjs/pull/346#issuecomment-97659042
       */
      return function algorithm14(a, b, callback, inverse) {
        // a arrays
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // datatype

        var dt; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string') {
          // datatype
          dt = adt; // convert b to the same datatype

          b = typed.convert(b, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // populate cdata, iterate through dimensions


        var cdata = asize.length > 0 ? _iterate(cf, 0, asize, asize[0], adata, b, inverse) : []; // c matrix

        return a.createDenseMatrix({
          data: cdata,
          size: clone(asize),
          datatype: dt
        });
      }; // recursive function

      function _iterate(f, level, s, n, av, bv, inverse) {
        // initialize array for this level
        var cv = []; // check we reach the last level

        if (level === s.length - 1) {
          // loop arrays in last level
          for (var i = 0; i < n; i++) {
            // invoke callback and store value
            cv[i] = inverse ? f(bv, av[i]) : f(av[i], bv);
          }
        } else {
          // iterate current level
          for (var j = 0; j < n; j++) {
            // iterate next level
            cv[j] = _iterate(f, level + 1, s, s[level + 1], av[j], bv, inverse);
          }
        }

        return cv;
      }
    });

    var name$m = 'algorithm11';
    var dependencies$n = ['typed', 'equalScalar'];
    var createAlgorithm11 =
    /* #__PURE__ */
    factory(name$m, dependencies$n, function (_ref) {
      var typed = _ref.typed,
          equalScalar = _ref.equalScalar;

      /**
       * Iterates over SparseMatrix S nonzero items and invokes the callback function f(Sij, b).
       * Callback function invoked NZ times (number of nonzero items in S).
       *
       *
       *          ┌  f(Sij, b)  ; S(i,j) !== 0
       * C(i,j) = ┤
       *          └  0          ; otherwise
       *
       *
       * @param {Matrix}   s                 The SparseMatrix instance (S)
       * @param {Scalar}   b                 The Scalar value
       * @param {Function} callback          The f(Aij,b) operation to invoke
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(b,Sij)
       *
       * @return {Matrix}                    SparseMatrix (C)
       *
       * https://github.com/josdejong/mathjs/pull/346#issuecomment-97626813
       */
      return function algorithm11(s, b, callback, inverse) {
        // sparse matrix arrays
        var avalues = s._values;
        var aindex = s._index;
        var aptr = s._ptr;
        var asize = s._size;
        var adt = s._datatype; // sparse matrix cannot be a Pattern matrix

        if (!avalues) {
          throw new Error('Cannot perform operation on Pattern Sparse Matrix and Scalar value');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string') {
          // datatype
          dt = adt; // find signature that matches (dt, dt)

          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt); // convert b to the same datatype

          b = typed.convert(b, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result arrays


        var cvalues = [];
        var cindex = [];
        var cptr = []; // matrix

        var c = s.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [rows, columns],
          datatype: dt
        }); // loop columns

        for (var j = 0; j < columns; j++) {
          // initialize ptr
          cptr[j] = cindex.length; // values in j

          for (var k0 = aptr[j], k1 = aptr[j + 1], k = k0; k < k1; k++) {
            // row
            var i = aindex[k]; // invoke callback

            var v = inverse ? cf(b, avalues[k]) : cf(avalues[k], b); // check value is zero

            if (!eq(v, zero)) {
              // push index & value
              cindex.push(i);
              cvalues.push(v);
            }
          }
        } // update ptr


        cptr[columns] = cindex.length; // return sparse matrix

        return c;
      };
    });

    var name$n = 'algorithm03';
    var dependencies$o = ['typed'];
    var createAlgorithm03 =
    /* #__PURE__ */
    factory(name$n, dependencies$o, function (_ref) {
      var typed = _ref.typed;

      /**
       * Iterates over SparseMatrix items and invokes the callback function f(Dij, Sij).
       * Callback function invoked M*N times.
       *
       *
       *          ┌  f(Dij, Sij)  ; S(i,j) !== 0
       * C(i,j) = ┤
       *          └  f(Dij, 0)    ; otherwise
       *
       *
       * @param {Matrix}   denseMatrix       The DenseMatrix instance (D)
       * @param {Matrix}   sparseMatrix      The SparseMatrix instance (C)
       * @param {Function} callback          The f(Dij,Sij) operation to invoke, where Dij = DenseMatrix(i,j) and Sij = SparseMatrix(i,j)
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(Sij,Dij)
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * see https://github.com/josdejong/mathjs/pull/346#issuecomment-97477571
       */
      return function algorithm03(denseMatrix, sparseMatrix, callback, inverse) {
        // dense matrix arrays
        var adata = denseMatrix._data;
        var asize = denseMatrix._size;
        var adt = denseMatrix._datatype; // sparse matrix arrays

        var bvalues = sparseMatrix._values;
        var bindex = sparseMatrix._index;
        var bptr = sparseMatrix._ptr;
        var bsize = sparseMatrix._size;
        var bdt = sparseMatrix._datatype; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // check rows & columns


        if (asize[0] !== bsize[0] || asize[1] !== bsize[1]) {
          throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
        } // sparse matrix cannot be a Pattern matrix


        if (!bvalues) {
          throw new Error('Cannot perform operation on Dense Matrix and Pattern Sparse Matrix');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // zero value

        var zero = 0; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string' && adt === bdt) {
          // datatype
          dt = adt; // convert 0 to the same datatype

          zero = typed.convert(0, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result (DenseMatrix)


        var cdata = []; // initialize dense matrix

        for (var z = 0; z < rows; z++) {
          // initialize row
          cdata[z] = [];
        } // workspace


        var x = []; // marks indicating we have a value in x for a given column

        var w = []; // loop columns in b

        for (var j = 0; j < columns; j++) {
          // column mark
          var mark = j + 1; // values in column j

          for (var k0 = bptr[j], k1 = bptr[j + 1], k = k0; k < k1; k++) {
            // row
            var i = bindex[k]; // update workspace

            x[i] = inverse ? cf(bvalues[k], adata[i][j]) : cf(adata[i][j], bvalues[k]);
            w[i] = mark;
          } // process workspace


          for (var y = 0; y < rows; y++) {
            // check we have a calculated value for current row
            if (w[y] === mark) {
              // use calculated value
              cdata[y][j] = x[y];
            } else {
              // calculate value
              cdata[y][j] = inverse ? cf(zero, adata[y][j]) : cf(adata[y][j], zero);
            }
          }
        } // return dense matrix


        return denseMatrix.createDenseMatrix({
          data: cdata,
          size: [rows, columns],
          datatype: dt
        });
      };
    });

    var name$o = 'algorithm05';
    var dependencies$p = ['typed', 'equalScalar'];
    var createAlgorithm05 =
    /* #__PURE__ */
    factory(name$o, dependencies$p, function (_ref) {
      var typed = _ref.typed,
          equalScalar = _ref.equalScalar;

      /**
       * Iterates over SparseMatrix A and SparseMatrix B nonzero items and invokes the callback function f(Aij, Bij).
       * Callback function invoked MAX(NNZA, NNZB) times
       *
       *
       *          ┌  f(Aij, Bij)  ; A(i,j) !== 0 || B(i,j) !== 0
       * C(i,j) = ┤
       *          └  0            ; otherwise
       *
       *
       * @param {Matrix}   a                 The SparseMatrix instance (A)
       * @param {Matrix}   b                 The SparseMatrix instance (B)
       * @param {Function} callback          The f(Aij,Bij) operation to invoke
       *
       * @return {Matrix}                    SparseMatrix (C)
       *
       * see https://github.com/josdejong/mathjs/pull/346#issuecomment-97620294
       */
      return function algorithm05(a, b, callback) {
        // sparse matrix arrays
        var avalues = a._values;
        var aindex = a._index;
        var aptr = a._ptr;
        var asize = a._size;
        var adt = a._datatype; // sparse matrix arrays

        var bvalues = b._values;
        var bindex = b._index;
        var bptr = b._ptr;
        var bsize = b._size;
        var bdt = b._datatype; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // check rows & columns


        if (asize[0] !== bsize[0] || asize[1] !== bsize[1]) {
          throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // equal signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string' && adt === bdt) {
          // datatype
          dt = adt; // find signature that matches (dt, dt)

          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result arrays


        var cvalues = avalues && bvalues ? [] : undefined;
        var cindex = [];
        var cptr = []; // matrix

        var c = a.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [rows, columns],
          datatype: dt
        }); // workspaces

        var xa = cvalues ? [] : undefined;
        var xb = cvalues ? [] : undefined; // marks indicating we have a value in x for a given column

        var wa = [];
        var wb = []; // vars

        var i, j, k, k1; // loop columns

        for (j = 0; j < columns; j++) {
          // update cptr
          cptr[j] = cindex.length; // columns mark

          var mark = j + 1; // loop values A(:,j)

          for (k = aptr[j], k1 = aptr[j + 1]; k < k1; k++) {
            // row
            i = aindex[k]; // push index

            cindex.push(i); // update workspace

            wa[i] = mark; // check we need to process values

            if (xa) {
              xa[i] = avalues[k];
            }
          } // loop values B(:,j)


          for (k = bptr[j], k1 = bptr[j + 1]; k < k1; k++) {
            // row
            i = bindex[k]; // check row existed in A

            if (wa[i] !== mark) {
              // push index
              cindex.push(i);
            } // update workspace


            wb[i] = mark; // check we need to process values

            if (xb) {
              xb[i] = bvalues[k];
            }
          } // check we need to process values (non pattern matrix)


          if (cvalues) {
            // initialize first index in j
            k = cptr[j]; // loop index in j

            while (k < cindex.length) {
              // row
              i = cindex[k]; // marks

              var wai = wa[i];
              var wbi = wb[i]; // check Aij or Bij are nonzero

              if (wai === mark || wbi === mark) {
                // matrix values @ i,j
                var va = wai === mark ? xa[i] : zero;
                var vb = wbi === mark ? xb[i] : zero; // Cij

                var vc = cf(va, vb); // check for zero

                if (!eq(vc, zero)) {
                  // push value
                  cvalues.push(vc); // increment pointer

                  k++;
                } else {
                  // remove value @ i, do not increment pointer
                  cindex.splice(k, 1);
                }
              }
            }
          }
        } // update cptr


        cptr[columns] = cindex.length; // return sparse matrix

        return c;
      };
    });

    var name$p = 'algorithm12';
    var dependencies$q = ['typed', 'DenseMatrix'];
    var createAlgorithm12 =
    /* #__PURE__ */
    factory(name$p, dependencies$q, function (_ref) {
      var typed = _ref.typed,
          DenseMatrix = _ref.DenseMatrix;

      /**
       * Iterates over SparseMatrix S nonzero items and invokes the callback function f(Sij, b).
       * Callback function invoked MxN times.
       *
       *
       *          ┌  f(Sij, b)  ; S(i,j) !== 0
       * C(i,j) = ┤
       *          └  f(0, b)    ; otherwise
       *
       *
       * @param {Matrix}   s                 The SparseMatrix instance (S)
       * @param {Scalar}   b                 The Scalar value
       * @param {Function} callback          The f(Aij,b) operation to invoke
       * @param {boolean}  inverse           A true value indicates callback should be invoked f(b,Sij)
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * https://github.com/josdejong/mathjs/pull/346#issuecomment-97626813
       */
      return function algorithm12(s, b, callback, inverse) {
        // sparse matrix arrays
        var avalues = s._values;
        var aindex = s._index;
        var aptr = s._ptr;
        var asize = s._size;
        var adt = s._datatype; // sparse matrix cannot be a Pattern matrix

        if (!avalues) {
          throw new Error('Cannot perform operation on Pattern Sparse Matrix and Scalar value');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string') {
          // datatype
          dt = adt; // convert b to the same datatype

          b = typed.convert(b, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // result arrays


        var cdata = []; // matrix

        var c = new DenseMatrix({
          data: cdata,
          size: [rows, columns],
          datatype: dt
        }); // workspaces

        var x = []; // marks indicating we have a value in x for a given column

        var w = []; // loop columns

        for (var j = 0; j < columns; j++) {
          // columns mark
          var mark = j + 1; // values in j

          for (var k0 = aptr[j], k1 = aptr[j + 1], k = k0; k < k1; k++) {
            // row
            var r = aindex[k]; // update workspace

            x[r] = avalues[k];
            w[r] = mark;
          } // loop rows


          for (var i = 0; i < rows; i++) {
            // initialize C on first column
            if (j === 0) {
              // create row array
              cdata[i] = [];
            } // check sparse matrix has a value @ i,j


            if (w[i] === mark) {
              // invoke callback, update C
              cdata[i][j] = inverse ? cf(b, x[i]) : cf(x[i], b);
            } else {
              // dense matrix value @ i, j
              cdata[i][j] = inverse ? cf(b, 0) : cf(0, b);
            }
          }
        } // return sparse matrix


        return c;
      };
    });

    var name$q = 'multiplyScalar';
    var dependencies$r = ['typed'];
    var createMultiplyScalar =
    /* #__PURE__ */
    factory(name$q, dependencies$r, function (_ref) {
      var typed = _ref.typed;

      /**
       * Multiply two scalar values, `x * y`.
       * This function is meant for internal use: it is used by the public function
       * `multiply`
       *
       * This function does not support collections (Array or Matrix).
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit} x   First value to multiply
       * @param  {number | BigNumber | Fraction | Complex} y          Second value to multiply
       * @return {number | BigNumber | Fraction | Complex | Unit}     Multiplication of `x` and `y`
       * @private
       */
      var multiplyScalar = typed('multiplyScalar', {
        'number, number': multiplyNumber,
        'Complex, Complex': function ComplexComplex(x, y) {
          return x.mul(y);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.times(y);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.mul(y);
        },
        'number | Fraction | BigNumber | Complex, Unit': function numberFractionBigNumberComplexUnit(x, y) {
          var res = y.clone();
          res.value = res.value === null ? res._normalize(x) : multiplyScalar(res.value, x);
          return res;
        },
        'Unit, number | Fraction | BigNumber | Complex': function UnitNumberFractionBigNumberComplex(x, y) {
          var res = x.clone();
          res.value = res.value === null ? res._normalize(y) : multiplyScalar(res.value, y);
          return res;
        },
        'Unit, Unit': function UnitUnit(x, y) {
          return x.multiply(y);
        }
      });
      return multiplyScalar;
    });

    var name$r = 'multiply';
    var dependencies$s = ['typed', 'matrix', 'addScalar', 'multiplyScalar', 'equalScalar'];
    var createMultiply =
    /* #__PURE__ */
    factory(name$r, dependencies$s, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          addScalar = _ref.addScalar,
          multiplyScalar = _ref.multiplyScalar,
          equalScalar = _ref.equalScalar;
      var algorithm11 = createAlgorithm11({
        typed: typed,
        equalScalar: equalScalar
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Multiply two or more values, `x * y`.
       * For matrices, the matrix product is calculated.
       *
       * Syntax:
       *
       *    math.multiply(x, y)
       *    math.multiply(x, y, z, ...)
       *
       * Examples:
       *
       *    math.multiply(4, 5.2)        // returns number 20.8
       *    math.multiply(2, 3, 4)       // returns number 24
       *
       *    const a = math.complex(2, 3)
       *    const b = math.complex(4, 1)
       *    math.multiply(a, b)          // returns Complex 5 + 14i
       *
       *    const c = [[1, 2], [4, 3]]
       *    const d = [[1, 2, 3], [3, -4, 7]]
       *    math.multiply(c, d)          // returns Array [[7, -6, 17], [13, -4, 33]]
       *
       *    const e = math.unit('2.1 km')
       *    math.multiply(3, e)          // returns Unit 6.3 km
       *
       * See also:
       *
       *    divide, prod, cross, dot
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} x First value to multiply
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} y Second value to multiply
       * @return {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} Multiplication of `x` and `y`
       */

      var multiply = typed(name$r, extend({
        // we extend the signatures of multiplyScalar with signatures dealing with matrices
        'Array, Array': function ArrayArray(x, y) {
          // check dimensions
          _validateMatrixDimensions(arraySize(x), arraySize(y)); // use dense matrix implementation


          var m = multiply(matrix(x), matrix(y)); // return array or scalar

          return isMatrix(m) ? m.valueOf() : m;
        },
        'Matrix, Matrix': function MatrixMatrix(x, y) {
          // dimensions
          var xsize = x.size();
          var ysize = y.size(); // check dimensions

          _validateMatrixDimensions(xsize, ysize); // process dimensions


          if (xsize.length === 1) {
            // process y dimensions
            if (ysize.length === 1) {
              // Vector * Vector
              return _multiplyVectorVector(x, y, xsize[0]);
            } // Vector * Matrix


            return _multiplyVectorMatrix(x, y);
          } // process y dimensions


          if (ysize.length === 1) {
            // Matrix * Vector
            return _multiplyMatrixVector(x, y);
          } // Matrix * Matrix


          return _multiplyMatrixMatrix(x, y);
        },
        'Matrix, Array': function MatrixArray(x, y) {
          // use Matrix * Matrix implementation
          return multiply(x, matrix(y));
        },
        'Array, Matrix': function ArrayMatrix(x, y) {
          // use Matrix * Matrix implementation
          return multiply(matrix(x, y.storage()), y);
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm11(x, y, multiplyScalar, false);
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, multiplyScalar, false);
        },
        'any, SparseMatrix': function anySparseMatrix(x, y) {
          return algorithm11(y, x, multiplyScalar, true);
        },
        'any, DenseMatrix': function anyDenseMatrix(x, y) {
          return algorithm14(y, x, multiplyScalar, true);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, multiplyScalar, false).valueOf();
        },
        'any, Array': function anyArray(x, y) {
          // use matrix implementation
          return algorithm14(matrix(y), x, multiplyScalar, true).valueOf();
        },
        'any, any': multiplyScalar,
        'any, any, ...any': function anyAnyAny(x, y, rest) {
          var result = multiply(x, y);

          for (var i = 0; i < rest.length; i++) {
            result = multiply(result, rest[i]);
          }

          return result;
        }
      }, multiplyScalar.signatures));

      function _validateMatrixDimensions(size1, size2) {
        // check left operand dimensions
        switch (size1.length) {
          case 1:
            // check size2
            switch (size2.length) {
              case 1:
                // Vector x Vector
                if (size1[0] !== size2[0]) {
                  // throw error
                  throw new RangeError('Dimension mismatch in multiplication. Vectors must have the same length');
                }

                break;

              case 2:
                // Vector x Matrix
                if (size1[0] !== size2[0]) {
                  // throw error
                  throw new RangeError('Dimension mismatch in multiplication. Vector length (' + size1[0] + ') must match Matrix rows (' + size2[0] + ')');
                }

                break;

              default:
                throw new Error('Can only multiply a 1 or 2 dimensional matrix (Matrix B has ' + size2.length + ' dimensions)');
            }

            break;

          case 2:
            // check size2
            switch (size2.length) {
              case 1:
                // Matrix x Vector
                if (size1[1] !== size2[0]) {
                  // throw error
                  throw new RangeError('Dimension mismatch in multiplication. Matrix columns (' + size1[1] + ') must match Vector length (' + size2[0] + ')');
                }

                break;

              case 2:
                // Matrix x Matrix
                if (size1[1] !== size2[0]) {
                  // throw error
                  throw new RangeError('Dimension mismatch in multiplication. Matrix A columns (' + size1[1] + ') must match Matrix B rows (' + size2[0] + ')');
                }

                break;

              default:
                throw new Error('Can only multiply a 1 or 2 dimensional matrix (Matrix B has ' + size2.length + ' dimensions)');
            }

            break;

          default:
            throw new Error('Can only multiply a 1 or 2 dimensional matrix (Matrix A has ' + size1.length + ' dimensions)');
        }
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            Dense Vector   (N)
       * @param {Matrix} b            Dense Vector   (N)
       *
       * @return {number}             Scalar value
       */


      function _multiplyVectorVector(a, b, n) {
        // check empty vector
        if (n === 0) {
          throw new Error('Cannot multiply two empty vectors');
        } // a dense


        var adata = a._data;
        var adt = a._datatype; // b dense

        var bdata = b._data;
        var bdt = b._datatype; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
        } // result (do not initialize it with zero)


        var c = mf(adata[0], bdata[0]); // loop data

        for (var i = 1; i < n; i++) {
          // multiply and accumulate
          c = af(c, mf(adata[i], bdata[i]));
        }

        return c;
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            Dense Vector   (M)
       * @param {Matrix} b            Matrix         (MxN)
       *
       * @return {Matrix}             Dense Vector   (N)
       */


      function _multiplyVectorMatrix(a, b) {
        // process storage
        if (b.storage() !== 'dense') {
          throw new Error('Support for SparseMatrix not implemented');
        }

        return _multiplyVectorDenseMatrix(a, b);
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            Dense Vector   (M)
       * @param {Matrix} b            Dense Matrix   (MxN)
       *
       * @return {Matrix}             Dense Vector   (N)
       */


      function _multiplyVectorDenseMatrix(a, b) {
        // a dense
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // b dense

        var bdata = b._data;
        var bsize = b._size;
        var bdt = b._datatype; // rows & columns

        var alength = asize[0];
        var bcolumns = bsize[1]; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
        } // result


        var c = []; // loop matrix columns

        for (var j = 0; j < bcolumns; j++) {
          // sum (do not initialize it with zero)
          var sum = mf(adata[0], bdata[0][j]); // loop vector

          for (var i = 1; i < alength; i++) {
            // multiply & accumulate
            sum = af(sum, mf(adata[i], bdata[i][j]));
          }

          c[j] = sum;
        } // return matrix


        return a.createDenseMatrix({
          data: c,
          size: [bcolumns],
          datatype: dt
        });
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            Matrix         (MxN)
       * @param {Matrix} b            Dense Vector   (N)
       *
       * @return {Matrix}             Dense Vector   (M)
       */


      var _multiplyMatrixVector = typed('_multiplyMatrixVector', {
        'DenseMatrix, any': _multiplyDenseMatrixVector,
        'SparseMatrix, any': _multiplySparseMatrixVector
      });
      /**
       * C = A * B
       *
       * @param {Matrix} a            Matrix         (MxN)
       * @param {Matrix} b            Matrix         (NxC)
       *
       * @return {Matrix}             Matrix         (MxC)
       */


      var _multiplyMatrixMatrix = typed('_multiplyMatrixMatrix', {
        'DenseMatrix, DenseMatrix': _multiplyDenseMatrixDenseMatrix,
        'DenseMatrix, SparseMatrix': _multiplyDenseMatrixSparseMatrix,
        'SparseMatrix, DenseMatrix': _multiplySparseMatrixDenseMatrix,
        'SparseMatrix, SparseMatrix': _multiplySparseMatrixSparseMatrix
      });
      /**
       * C = A * B
       *
       * @param {Matrix} a            DenseMatrix  (MxN)
       * @param {Matrix} b            Dense Vector (N)
       *
       * @return {Matrix}             Dense Vector (M)
       */


      function _multiplyDenseMatrixVector(a, b) {
        // a dense
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // b dense

        var bdata = b._data;
        var bdt = b._datatype; // rows & columns

        var arows = asize[0];
        var acolumns = asize[1]; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
        } // result


        var c = []; // loop matrix a rows

        for (var i = 0; i < arows; i++) {
          // current row
          var row = adata[i]; // sum (do not initialize it with zero)

          var sum = mf(row[0], bdata[0]); // loop matrix a columns

          for (var j = 1; j < acolumns; j++) {
            // multiply & accumulate
            sum = af(sum, mf(row[j], bdata[j]));
          }

          c[i] = sum;
        } // return matrix


        return a.createDenseMatrix({
          data: c,
          size: [arows],
          datatype: dt
        });
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            DenseMatrix    (MxN)
       * @param {Matrix} b            DenseMatrix    (NxC)
       *
       * @return {Matrix}             DenseMatrix    (MxC)
       */


      function _multiplyDenseMatrixDenseMatrix(a, b) {
        // a dense
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // b dense

        var bdata = b._data;
        var bsize = b._size;
        var bdt = b._datatype; // rows & columns

        var arows = asize[0];
        var acolumns = asize[1];
        var bcolumns = bsize[1]; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
        } // result


        var c = []; // loop matrix a rows

        for (var i = 0; i < arows; i++) {
          // current row
          var row = adata[i]; // initialize row array

          c[i] = []; // loop matrix b columns

          for (var j = 0; j < bcolumns; j++) {
            // sum (avoid initializing sum to zero)
            var sum = mf(row[0], bdata[0][j]); // loop matrix a columns

            for (var x = 1; x < acolumns; x++) {
              // multiply & accumulate
              sum = af(sum, mf(row[x], bdata[x][j]));
            }

            c[i][j] = sum;
          }
        } // return matrix


        return a.createDenseMatrix({
          data: c,
          size: [arows, bcolumns],
          datatype: dt
        });
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            DenseMatrix    (MxN)
       * @param {Matrix} b            SparseMatrix   (NxC)
       *
       * @return {Matrix}             SparseMatrix   (MxC)
       */


      function _multiplyDenseMatrixSparseMatrix(a, b) {
        // a dense
        var adata = a._data;
        var asize = a._size;
        var adt = a._datatype; // b sparse

        var bvalues = b._values;
        var bindex = b._index;
        var bptr = b._ptr;
        var bsize = b._size;
        var bdt = b._datatype; // validate b matrix

        if (!bvalues) {
          throw new Error('Cannot multiply Dense Matrix times Pattern only Matrix');
        } // rows & columns


        var arows = asize[0];
        var bcolumns = bsize[1]; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // equalScalar signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt);
        } // result


        var cvalues = [];
        var cindex = [];
        var cptr = []; // c matrix

        var c = b.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [arows, bcolumns],
          datatype: dt
        }); // loop b columns

        for (var jb = 0; jb < bcolumns; jb++) {
          // update ptr
          cptr[jb] = cindex.length; // indeces in column jb

          var kb0 = bptr[jb];
          var kb1 = bptr[jb + 1]; // do not process column jb if no data exists

          if (kb1 > kb0) {
            // last row mark processed
            var last = 0; // loop a rows

            for (var i = 0; i < arows; i++) {
              // column mark
              var mark = i + 1; // C[i, jb]

              var cij = void 0; // values in b column j

              for (var kb = kb0; kb < kb1; kb++) {
                // row
                var ib = bindex[kb]; // check value has been initialized

                if (last !== mark) {
                  // first value in column jb
                  cij = mf(adata[i][ib], bvalues[kb]); // update mark

                  last = mark;
                } else {
                  // accumulate value
                  cij = af(cij, mf(adata[i][ib], bvalues[kb]));
                }
              } // check column has been processed and value != 0


              if (last === mark && !eq(cij, zero)) {
                // push row & value
                cindex.push(i);
                cvalues.push(cij);
              }
            }
          }
        } // update ptr


        cptr[bcolumns] = cindex.length; // return sparse matrix

        return c;
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            SparseMatrix    (MxN)
       * @param {Matrix} b            Dense Vector (N)
       *
       * @return {Matrix}             SparseMatrix    (M, 1)
       */


      function _multiplySparseMatrixVector(a, b) {
        // a sparse
        var avalues = a._values;
        var aindex = a._index;
        var aptr = a._ptr;
        var adt = a._datatype; // validate a matrix

        if (!avalues) {
          throw new Error('Cannot multiply Pattern only Matrix times Dense Matrix');
        } // b dense


        var bdata = b._data;
        var bdt = b._datatype; // rows & columns

        var arows = a._size[0];
        var brows = b._size[0]; // result

        var cvalues = [];
        var cindex = [];
        var cptr = []; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // equalScalar signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt);
        } // workspace


        var x = []; // vector with marks indicating a value x[i] exists in a given column

        var w = []; // update ptr

        cptr[0] = 0; // rows in b

        for (var ib = 0; ib < brows; ib++) {
          // b[ib]
          var vbi = bdata[ib]; // check b[ib] != 0, avoid loops

          if (!eq(vbi, zero)) {
            // A values & index in ib column
            for (var ka0 = aptr[ib], ka1 = aptr[ib + 1], ka = ka0; ka < ka1; ka++) {
              // a row
              var ia = aindex[ka]; // check value exists in current j

              if (!w[ia]) {
                // ia is new entry in j
                w[ia] = true; // add i to pattern of C

                cindex.push(ia); // x(ia) = A

                x[ia] = mf(vbi, avalues[ka]);
              } else {
                // i exists in C already
                x[ia] = af(x[ia], mf(vbi, avalues[ka]));
              }
            }
          }
        } // copy values from x to column jb of c


        for (var p1 = cindex.length, p = 0; p < p1; p++) {
          // row
          var ic = cindex[p]; // copy value

          cvalues[p] = x[ic];
        } // update ptr


        cptr[1] = cindex.length; // return sparse matrix

        return a.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [arows, 1],
          datatype: dt
        });
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            SparseMatrix      (MxN)
       * @param {Matrix} b            DenseMatrix       (NxC)
       *
       * @return {Matrix}             SparseMatrix      (MxC)
       */


      function _multiplySparseMatrixDenseMatrix(a, b) {
        // a sparse
        var avalues = a._values;
        var aindex = a._index;
        var aptr = a._ptr;
        var adt = a._datatype; // validate a matrix

        if (!avalues) {
          throw new Error('Cannot multiply Pattern only Matrix times Dense Matrix');
        } // b dense


        var bdata = b._data;
        var bdt = b._datatype; // rows & columns

        var arows = a._size[0];
        var brows = b._size[0];
        var bcolumns = b._size[1]; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // equalScalar signature to use

        var eq = equalScalar; // zero value

        var zero = 0; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
          eq = typed.find(equalScalar, [dt, dt]); // convert 0 to the same datatype

          zero = typed.convert(0, dt);
        } // result


        var cvalues = [];
        var cindex = [];
        var cptr = []; // c matrix

        var c = a.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [arows, bcolumns],
          datatype: dt
        }); // workspace

        var x = []; // vector with marks indicating a value x[i] exists in a given column

        var w = []; // loop b columns

        for (var jb = 0; jb < bcolumns; jb++) {
          // update ptr
          cptr[jb] = cindex.length; // mark in workspace for current column

          var mark = jb + 1; // rows in jb

          for (var ib = 0; ib < brows; ib++) {
            // b[ib, jb]
            var vbij = bdata[ib][jb]; // check b[ib, jb] != 0, avoid loops

            if (!eq(vbij, zero)) {
              // A values & index in ib column
              for (var ka0 = aptr[ib], ka1 = aptr[ib + 1], ka = ka0; ka < ka1; ka++) {
                // a row
                var ia = aindex[ka]; // check value exists in current j

                if (w[ia] !== mark) {
                  // ia is new entry in j
                  w[ia] = mark; // add i to pattern of C

                  cindex.push(ia); // x(ia) = A

                  x[ia] = mf(vbij, avalues[ka]);
                } else {
                  // i exists in C already
                  x[ia] = af(x[ia], mf(vbij, avalues[ka]));
                }
              }
            }
          } // copy values from x to column jb of c


          for (var p0 = cptr[jb], p1 = cindex.length, p = p0; p < p1; p++) {
            // row
            var ic = cindex[p]; // copy value

            cvalues[p] = x[ic];
          }
        } // update ptr


        cptr[bcolumns] = cindex.length; // return sparse matrix

        return c;
      }
      /**
       * C = A * B
       *
       * @param {Matrix} a            SparseMatrix      (MxN)
       * @param {Matrix} b            SparseMatrix      (NxC)
       *
       * @return {Matrix}             SparseMatrix      (MxC)
       */


      function _multiplySparseMatrixSparseMatrix(a, b) {
        // a sparse
        var avalues = a._values;
        var aindex = a._index;
        var aptr = a._ptr;
        var adt = a._datatype; // b sparse

        var bvalues = b._values;
        var bindex = b._index;
        var bptr = b._ptr;
        var bdt = b._datatype; // rows & columns

        var arows = a._size[0];
        var bcolumns = b._size[1]; // flag indicating both matrices (a & b) contain data

        var values = avalues && bvalues; // datatype

        var dt; // addScalar signature to use

        var af = addScalar; // multiplyScalar signature to use

        var mf = multiplyScalar; // process data types

        if (adt && bdt && adt === bdt && typeof adt === 'string') {
          // datatype
          dt = adt; // find signatures that matches (dt, dt)

          af = typed.find(addScalar, [dt, dt]);
          mf = typed.find(multiplyScalar, [dt, dt]);
        } // result


        var cvalues = values ? [] : undefined;
        var cindex = [];
        var cptr = []; // c matrix

        var c = a.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [arows, bcolumns],
          datatype: dt
        }); // workspace

        var x = values ? [] : undefined; // vector with marks indicating a value x[i] exists in a given column

        var w = []; // variables

        var ka, ka0, ka1, kb, kb0, kb1, ia, ib; // loop b columns

        for (var jb = 0; jb < bcolumns; jb++) {
          // update ptr
          cptr[jb] = cindex.length; // mark in workspace for current column

          var mark = jb + 1; // B values & index in j

          for (kb0 = bptr[jb], kb1 = bptr[jb + 1], kb = kb0; kb < kb1; kb++) {
            // b row
            ib = bindex[kb]; // check we need to process values

            if (values) {
              // loop values in a[:,ib]
              for (ka0 = aptr[ib], ka1 = aptr[ib + 1], ka = ka0; ka < ka1; ka++) {
                // row
                ia = aindex[ka]; // check value exists in current j

                if (w[ia] !== mark) {
                  // ia is new entry in j
                  w[ia] = mark; // add i to pattern of C

                  cindex.push(ia); // x(ia) = A

                  x[ia] = mf(bvalues[kb], avalues[ka]);
                } else {
                  // i exists in C already
                  x[ia] = af(x[ia], mf(bvalues[kb], avalues[ka]));
                }
              }
            } else {
              // loop values in a[:,ib]
              for (ka0 = aptr[ib], ka1 = aptr[ib + 1], ka = ka0; ka < ka1; ka++) {
                // row
                ia = aindex[ka]; // check value exists in current j

                if (w[ia] !== mark) {
                  // ia is new entry in j
                  w[ia] = mark; // add i to pattern of C

                  cindex.push(ia);
                }
              }
            }
          } // check we need to process matrix values (pattern matrix)


          if (values) {
            // copy values from x to column jb of c
            for (var p0 = cptr[jb], p1 = cindex.length, p = p0; p < p1; p++) {
              // row
              var ic = cindex[p]; // copy value

              cvalues[p] = x[ic];
            }
          }
        } // update ptr


        cptr[bcolumns] = cindex.length; // return sparse matrix

        return c;
      }

      return multiply;
    });

    var name$s = 'subtract';
    var dependencies$t = ['typed', 'matrix', 'equalScalar', 'addScalar', 'unaryMinus', 'DenseMatrix'];
    var createSubtract =
    /* #__PURE__ */
    factory(name$s, dependencies$t, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          equalScalar = _ref.equalScalar,
          addScalar = _ref.addScalar,
          unaryMinus = _ref.unaryMinus,
          DenseMatrix = _ref.DenseMatrix;
      // TODO: split function subtract in two: subtract and subtractScalar
      var algorithm01 = createAlgorithm01({
        typed: typed
      });
      var algorithm03 = createAlgorithm03({
        typed: typed
      });
      var algorithm05 = createAlgorithm05({
        typed: typed,
        equalScalar: equalScalar
      });
      var algorithm10 = createAlgorithm10({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm13 = createAlgorithm13({
        typed: typed
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Subtract two values, `x - y`.
       * For matrices, the function is evaluated element wise.
       *
       * Syntax:
       *
       *    math.subtract(x, y)
       *
       * Examples:
       *
       *    math.subtract(5.3, 2)        // returns number 3.3
       *
       *    const a = math.complex(2, 3)
       *    const b = math.complex(4, 1)
       *    math.subtract(a, b)          // returns Complex -2 + 2i
       *
       *    math.subtract([5, 7, 4], 4)  // returns Array [1, 3, 0]
       *
       *    const c = math.unit('2.1 km')
       *    const d = math.unit('500m')
       *    math.subtract(c, d)          // returns Unit 1.6 km
       *
       * See also:
       *
       *    add
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} x
       *            Initial value
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} y
       *            Value to subtract from `x`
       * @return {number | BigNumber | Fraction | Complex | Unit | Array | Matrix}
       *            Subtraction of `x` and `y`
       */

      var subtract = typed(name$s, {
        'number, number': function numberNumber(x, y) {
          return x - y;
        },
        'Complex, Complex': function ComplexComplex(x, y) {
          return x.sub(y);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.minus(y);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.sub(y);
        },
        'Unit, Unit': function UnitUnit(x, y) {
          if (x.value === null) {
            throw new Error('Parameter x contains a unit with undefined value');
          }

          if (y.value === null) {
            throw new Error('Parameter y contains a unit with undefined value');
          }

          if (!x.equalBase(y)) {
            throw new Error('Units do not match');
          }

          var res = x.clone();
          res.value = subtract(res.value, y.value);
          res.fixPrefix = false;
          return res;
        },
        'SparseMatrix, SparseMatrix': function SparseMatrixSparseMatrix(x, y) {
          checkEqualDimensions(x, y);
          return algorithm05(x, y, subtract);
        },
        'SparseMatrix, DenseMatrix': function SparseMatrixDenseMatrix(x, y) {
          checkEqualDimensions(x, y);
          return algorithm03(y, x, subtract, true);
        },
        'DenseMatrix, SparseMatrix': function DenseMatrixSparseMatrix(x, y) {
          checkEqualDimensions(x, y);
          return algorithm01(x, y, subtract, false);
        },
        'DenseMatrix, DenseMatrix': function DenseMatrixDenseMatrix(x, y) {
          checkEqualDimensions(x, y);
          return algorithm13(x, y, subtract);
        },
        'Array, Array': function ArrayArray(x, y) {
          // use matrix implementation
          return subtract(matrix(x), matrix(y)).valueOf();
        },
        'Array, Matrix': function ArrayMatrix(x, y) {
          // use matrix implementation
          return subtract(matrix(x), y);
        },
        'Matrix, Array': function MatrixArray(x, y) {
          // use matrix implementation
          return subtract(x, matrix(y));
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm10(x, unaryMinus(y), addScalar);
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, subtract);
        },
        'any, SparseMatrix': function anySparseMatrix(x, y) {
          return algorithm10(y, x, subtract, true);
        },
        'any, DenseMatrix': function anyDenseMatrix(x, y) {
          return algorithm14(y, x, subtract, true);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, subtract, false).valueOf();
        },
        'any, Array': function anyArray(x, y) {
          // use matrix implementation
          return algorithm14(matrix(y), x, subtract, true).valueOf();
        }
      });
      return subtract;
    });
    /**
     * Check whether matrix x and y have the same number of dimensions.
     * Throws a DimensionError when dimensions are not equal
     * @param {Matrix} x
     * @param {Matrix} y
     */

    function checkEqualDimensions(x, y) {
      var xsize = x.size();
      var ysize = y.size();

      if (xsize.length !== ysize.length) {
        throw new DimensionError(xsize.length, ysize.length);
      }
    }

    var name$t = 'algorithm07';
    var dependencies$u = ['typed', 'DenseMatrix'];
    var createAlgorithm07 =
    /* #__PURE__ */
    factory(name$t, dependencies$u, function (_ref) {
      var typed = _ref.typed,
          DenseMatrix = _ref.DenseMatrix;

      /**
       * Iterates over SparseMatrix A and SparseMatrix B items (zero and nonzero) and invokes the callback function f(Aij, Bij).
       * Callback function invoked MxN times.
       *
       * C(i,j) = f(Aij, Bij)
       *
       * @param {Matrix}   a                 The SparseMatrix instance (A)
       * @param {Matrix}   b                 The SparseMatrix instance (B)
       * @param {Function} callback          The f(Aij,Bij) operation to invoke
       *
       * @return {Matrix}                    DenseMatrix (C)
       *
       * see https://github.com/josdejong/mathjs/pull/346#issuecomment-97620294
       */
      return function algorithm07(a, b, callback) {
        // sparse matrix arrays
        var asize = a._size;
        var adt = a._datatype; // sparse matrix arrays

        var bsize = b._size;
        var bdt = b._datatype; // validate dimensions

        if (asize.length !== bsize.length) {
          throw new DimensionError(asize.length, bsize.length);
        } // check rows & columns


        if (asize[0] !== bsize[0] || asize[1] !== bsize[1]) {
          throw new RangeError('Dimension mismatch. Matrix A (' + asize + ') must match Matrix B (' + bsize + ')');
        } // rows & columns


        var rows = asize[0];
        var columns = asize[1]; // datatype

        var dt; // zero value

        var zero = 0; // callback signature to use

        var cf = callback; // process data types

        if (typeof adt === 'string' && adt === bdt) {
          // datatype
          dt = adt; // convert 0 to the same datatype

          zero = typed.convert(0, dt); // callback

          cf = typed.find(callback, [dt, dt]);
        } // vars


        var i, j; // result arrays

        var cdata = []; // initialize c

        for (i = 0; i < rows; i++) {
          cdata[i] = [];
        } // matrix


        var c = new DenseMatrix({
          data: cdata,
          size: [rows, columns],
          datatype: dt
        }); // workspaces

        var xa = [];
        var xb = []; // marks indicating we have a value in x for a given column

        var wa = [];
        var wb = []; // loop columns

        for (j = 0; j < columns; j++) {
          // columns mark
          var mark = j + 1; // scatter the values of A(:,j) into workspace

          _scatter(a, j, wa, xa, mark); // scatter the values of B(:,j) into workspace


          _scatter(b, j, wb, xb, mark); // loop rows


          for (i = 0; i < rows; i++) {
            // matrix values @ i,j
            var va = wa[i] === mark ? xa[i] : zero;
            var vb = wb[i] === mark ? xb[i] : zero; // invoke callback

            cdata[i][j] = cf(va, vb);
          }
        } // return sparse matrix


        return c;
      };

      function _scatter(m, j, w, x, mark) {
        // a arrays
        var values = m._values;
        var index = m._index;
        var ptr = m._ptr; // loop values in column j

        for (var k = ptr[j], k1 = ptr[j + 1]; k < k1; k++) {
          // row
          var i = index[k]; // update workspace

          w[i] = mark;
          x[i] = values[k];
        }
      }
    });

    var name$u = 'identity';
    var dependencies$v = ['typed', 'config', 'matrix', 'BigNumber', 'DenseMatrix', 'SparseMatrix'];
    var createIdentity =
    /* #__PURE__ */
    factory(name$u, dependencies$v, function (_ref) {
      var typed = _ref.typed,
          config = _ref.config,
          matrix = _ref.matrix,
          BigNumber = _ref.BigNumber,
          DenseMatrix = _ref.DenseMatrix,
          SparseMatrix = _ref.SparseMatrix;

      /**
       * Create a 2-dimensional identity matrix with size m x n or n x n.
       * The matrix has ones on the diagonal and zeros elsewhere.
       *
       * Syntax:
       *
       *    math.identity(n)
       *    math.identity(n, format)
       *    math.identity(m, n)
       *    math.identity(m, n, format)
       *    math.identity([m, n])
       *    math.identity([m, n], format)
       *
       * Examples:
       *
       *    math.identity(3)                    // returns [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
       *    math.identity(3, 2)                 // returns [[1, 0], [0, 1], [0, 0]]
       *
       *    const A = [[1, 2, 3], [4, 5, 6]]
       *    math.identity(math.size(A))         // returns [[1, 0, 0], [0, 1, 0]]
       *
       * See also:
       *
       *    diag, ones, zeros, size, range
       *
       * @param {...number | Matrix | Array} size   The size for the matrix
       * @param {string} [format]                   The Matrix storage format
       *
       * @return {Matrix | Array | number} A matrix with ones on the diagonal.
       */
      return typed(name$u, {
        '': function _() {
          return config.matrix === 'Matrix' ? matrix([]) : [];
        },
        string: function string(format) {
          return matrix(format);
        },
        'number | BigNumber': function numberBigNumber(rows) {
          return _identity(rows, rows, config.matrix === 'Matrix' ? 'dense' : undefined);
        },
        'number | BigNumber, string': function numberBigNumberString(rows, format) {
          return _identity(rows, rows, format);
        },
        'number | BigNumber, number | BigNumber': function numberBigNumberNumberBigNumber(rows, cols) {
          return _identity(rows, cols, config.matrix === 'Matrix' ? 'dense' : undefined);
        },
        'number | BigNumber, number | BigNumber, string': function numberBigNumberNumberBigNumberString(rows, cols, format) {
          return _identity(rows, cols, format);
        },
        Array: function Array(size) {
          return _identityVector(size);
        },
        'Array, string': function ArrayString(size, format) {
          return _identityVector(size, format);
        },
        Matrix: function Matrix(size) {
          return _identityVector(size.valueOf(), size.storage());
        },
        'Matrix, string': function MatrixString(size, format) {
          return _identityVector(size.valueOf(), format);
        }
      });

      function _identityVector(size, format) {
        switch (size.length) {
          case 0:
            return format ? matrix(format) : [];

          case 1:
            return _identity(size[0], size[0], format);

          case 2:
            return _identity(size[0], size[1], format);

          default:
            throw new Error('Vector containing two values expected');
        }
      }
      /**
       * Create an identity matrix
       * @param {number | BigNumber} rows
       * @param {number | BigNumber} cols
       * @param {string} [format]
       * @returns {Matrix}
       * @private
       */


      function _identity(rows, cols, format) {
        // BigNumber constructor with the right precision
        var Big = isBigNumber(rows) || isBigNumber(cols) ? BigNumber : null;
        if (isBigNumber(rows)) rows = rows.toNumber();
        if (isBigNumber(cols)) cols = cols.toNumber();

        if (!isInteger(rows) || rows < 1) {
          throw new Error('Parameters in function identity must be positive integers');
        }

        if (!isInteger(cols) || cols < 1) {
          throw new Error('Parameters in function identity must be positive integers');
        }

        var one = Big ? new BigNumber(1) : 1;
        var defaultValue = Big ? new Big(0) : 0;
        var size = [rows, cols]; // check we need to return a matrix

        if (format) {
          // create diagonal matrix (use optimized implementation for storage format)
          if (format === 'sparse') {
            return SparseMatrix.diagonal(size, one, 0, defaultValue);
          }

          if (format === 'dense') {
            return DenseMatrix.diagonal(size, one, 0, defaultValue);
          }

          throw new TypeError("Unknown matrix type \"".concat(format, "\""));
        } // create and resize array


        var res = resize([], size, defaultValue); // fill in ones on the diagonal

        var minimum = rows < cols ? rows : cols; // fill diagonal

        for (var d = 0; d < minimum; d++) {
          res[d][d] = one;
        }

        return res;
      }
    });

    function noBignumber() {
      throw new Error('No "bignumber" implementation available');
    }
    function noFraction() {
      throw new Error('No "fraction" implementation available');
    }

    /**
     * Create a syntax error with the message:
     *     'Wrong number of arguments in function <fn> (<count> provided, <min>-<max> expected)'
     * @param {string} fn     Function name
     * @param {number} count  Actual argument count
     * @param {number} min    Minimum required argument count
     * @param {number} [max]  Maximum required argument count
     * @extends Error
     */
    function ArgumentsError(fn, count, min, max) {
      if (!(this instanceof ArgumentsError)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }

      this.fn = fn;
      this.count = count;
      this.min = min;
      this.max = max;
      this.message = 'Wrong number of arguments in function ' + fn + ' (' + count + ' provided, ' + min + (max !== undefined && max !== null ? '-' + max : '') + ' expected)';
      this.stack = new Error().stack;
    }
    ArgumentsError.prototype = new Error();
    ArgumentsError.prototype.constructor = Error;
    ArgumentsError.prototype.name = 'ArgumentsError';
    ArgumentsError.prototype.isArgumentsError = true;

    var name$v = 'transpose';
    var dependencies$w = ['typed', 'matrix'];
    var createTranspose =
    /* #__PURE__ */
    factory(name$v, dependencies$w, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix;

      /**
       * Transpose a matrix. All values of the matrix are reflected over its
       * main diagonal. Only applicable to two dimensional matrices containing
       * a vector (i.e. having size `[1,n]` or `[n,1]`). One dimensional
       * vectors and scalars return the input unchanged.
       *
       * Syntax:
       *
       *     math.transpose(x)
       *
       * Examples:
       *
       *     const A = [[1, 2, 3], [4, 5, 6]]
       *     math.transpose(A)               // returns [[1, 4], [2, 5], [3, 6]]
       *
       * See also:
       *
       *     diag, inv, subset, squeeze
       *
       * @param {Array | Matrix} x  Matrix to be transposed
       * @return {Array | Matrix}   The transposed matrix
       */
      var transpose = typed('transpose', {
        Array: function Array(x) {
          // use dense matrix implementation
          return transpose(matrix(x)).valueOf();
        },
        Matrix: function Matrix(x) {
          // matrix size
          var size = x.size(); // result

          var c; // process dimensions

          switch (size.length) {
            case 1:
              // vector
              c = x.clone();
              break;

            case 2:
              {
                // rows and columns
                var rows = size[0];
                var columns = size[1]; // check columns

                if (columns === 0) {
                  // throw exception
                  throw new RangeError('Cannot transpose a 2D matrix with no columns (size: ' + format$2(size) + ')');
                } // process storage format


                switch (x.storage()) {
                  case 'dense':
                    c = _denseTranspose(x, rows, columns);
                    break;

                  case 'sparse':
                    c = _sparseTranspose(x, rows, columns);
                    break;
                }
              }
              break;

            default:
              // multi dimensional
              throw new RangeError('Matrix must be a vector or two dimensional (size: ' + format$2(this._size) + ')');
          }

          return c;
        },
        // scalars
        any: function any(x) {
          return clone(x);
        }
      });

      function _denseTranspose(m, rows, columns) {
        // matrix array
        var data = m._data; // transposed matrix data

        var transposed = [];
        var transposedRow; // loop columns

        for (var j = 0; j < columns; j++) {
          // initialize row
          transposedRow = transposed[j] = []; // loop rows

          for (var i = 0; i < rows; i++) {
            // set data
            transposedRow[i] = clone(data[i][j]);
          }
        } // return matrix


        return m.createDenseMatrix({
          data: transposed,
          size: [columns, rows],
          datatype: m._datatype
        });
      }

      function _sparseTranspose(m, rows, columns) {
        // matrix arrays
        var values = m._values;
        var index = m._index;
        var ptr = m._ptr; // result matrices

        var cvalues = values ? [] : undefined;
        var cindex = [];
        var cptr = []; // row counts

        var w = [];

        for (var x = 0; x < rows; x++) {
          w[x] = 0;
        } // vars


        var p, l, j; // loop values in matrix

        for (p = 0, l = index.length; p < l; p++) {
          // number of values in row
          w[index[p]]++;
        } // cumulative sum


        var sum = 0; // initialize cptr with the cummulative sum of row counts

        for (var i = 0; i < rows; i++) {
          // update cptr
          cptr.push(sum); // update sum

          sum += w[i]; // update w

          w[i] = cptr[i];
        } // update cptr


        cptr.push(sum); // loop columns

        for (j = 0; j < columns; j++) {
          // values & index in column
          for (var k0 = ptr[j], k1 = ptr[j + 1], k = k0; k < k1; k++) {
            // C values & index
            var q = w[index[k]]++; // C[j, i] = A[i, j]

            cindex[q] = j; // check we need to process values (pattern matrix)

            if (values) {
              cvalues[q] = clone(values[k]);
            }
          }
        } // return matrix


        return m.createSparseMatrix({
          values: cvalues,
          index: cindex,
          ptr: cptr,
          size: [columns, rows],
          datatype: m._datatype
        });
      }

      return transpose;
    });

    /**
     * Improve error messages for statistics functions. Errors are typically
     * thrown in an internally used function like larger, causing the error
     * not to mention the function (like max) which is actually used by the user.
     *
     * @param {Error} err
     * @param {String} fnName
     * @param {*} [value]
     * @return {Error}
     */

    function improveErrorMessage(err, fnName, value) {
      // TODO: add information with the index (also needs transform in expression parser)
      var details;

      if (String(err).indexOf('Unexpected type') !== -1) {
        details = arguments.length > 2 ? ' (type: ' + typeOf(value) + ', value: ' + JSON.stringify(value) + ')' : ' (type: ' + err.data.actual + ')';
        return new TypeError('Cannot calculate ' + fnName + ', unexpected type of argument' + details);
      }

      if (String(err).indexOf('complex numbers') !== -1) {
        details = arguments.length > 2 ? ' (type: ' + typeOf(value) + ', value: ' + JSON.stringify(value) + ')' : '';
        return new TypeError('Cannot calculate ' + fnName + ', no ordering relation is defined for complex numbers' + details);
      }

      return err;
    }

    var name$w = 'numeric';
    var dependencies$x = ['number', '?bignumber', '?fraction'];
    var createNumeric =
    /* #__PURE__ */
    factory(name$w, dependencies$x, function (_ref) {
      var _number = _ref.number,
          bignumber = _ref.bignumber,
          fraction = _ref.fraction;
      var validInputTypes = {
        string: true,
        number: true,
        BigNumber: true,
        Fraction: true
      }; // Load the conversion functions for each output type

      var validOutputTypes = {
        number: function number(x) {
          return _number(x);
        },
        BigNumber: bignumber ? function (x) {
          return bignumber(x);
        } : noBignumber,
        Fraction: fraction ? function (x) {
          return fraction(x);
        } : noFraction
      };
      /**
       * Convert a numeric input to a specific numeric type: number, BigNumber, or Fraction.
       *
       * Syntax:
       *
       *    math.numeric(x)
       *
       * Examples:
       *
       *    math.numeric('4')                           // returns number 4
       *    math.numeric('4', 'number')                 // returns number 4
       *    math.numeric('4', 'BigNumber')              // returns BigNumber 4
       *    math.numeric('4', 'Fraction')               // returns Fraction 4
       *    math.numeric(4, 'Fraction')                 // returns Fraction 4
       *    math.numeric(math.fraction(2, 5), 'number') // returns number 0.4
       *
       * See also:
       *
       *    number, fraction, bignumber, string, format
       *
       * @param {string | number | BigNumber | Fraction } value
       *              A numeric value or a string containing a numeric value
       * @param {string} outputType
       *              Desired numeric output type.
       *              Available values: 'number', 'BigNumber', or 'Fraction'
       * @return {number | BigNumber | Fraction}
       *              Returns an instance of the numeric in the requested type
       */

      return function numeric(value, outputType) {
        var inputType = typeOf(value);

        if (!(inputType in validInputTypes)) {
          throw new TypeError('Cannot convert ' + value + ' of type "' + inputType + '"; valid input types are ' + Object.keys(validInputTypes).join(', '));
        }

        if (!(outputType in validOutputTypes)) {
          throw new TypeError('Cannot convert ' + value + ' to type "' + outputType + '"; valid output types are ' + Object.keys(validOutputTypes).join(', '));
        }

        if (outputType === inputType) {
          return value;
        } else {
          return validOutputTypes[outputType](value);
        }
      };
    });

    var name$x = 'divideScalar';
    var dependencies$y = ['typed', 'numeric'];
    var createDivideScalar =
    /* #__PURE__ */
    factory(name$x, dependencies$y, function (_ref) {
      var typed = _ref.typed,
          numeric = _ref.numeric;

      /**
       * Divide two scalar values, `x / y`.
       * This function is meant for internal use: it is used by the public functions
       * `divide` and `inv`.
       *
       * This function does not support collections (Array or Matrix).
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit} x   Numerator
       * @param  {number | BigNumber | Fraction | Complex} y          Denominator
       * @return {number | BigNumber | Fraction | Complex | Unit}     Quotient, `x / y`
       * @private
       */
      var divideScalar = typed(name$x, {
        'number, number': function numberNumber(x, y) {
          return x / y;
        },
        'Complex, Complex': function ComplexComplex(x, y) {
          return x.div(y);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.div(y);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.div(y);
        },
        'Unit, number | Fraction | BigNumber': function UnitNumberFractionBigNumber(x, y) {
          var res = x.clone(); // TODO: move the divide function to Unit.js, it uses internals of Unit

          var one = numeric(1, typeOf(y));
          res.value = divideScalar(res.value === null ? res._normalize(one) : res.value, y);
          return res;
        },
        'number | Fraction | BigNumber, Unit': function numberFractionBigNumberUnit(x, y) {
          var res = y.clone();
          res = res.pow(-1); // TODO: move the divide function to Unit.js, it uses internals of Unit

          var one = numeric(1, typeOf(x));
          res.value = divideScalar(x, y.value === null ? y._normalize(one) : y.value);
          return res;
        },
        'Unit, Unit': function UnitUnit(x, y) {
          return x.divide(y);
        }
      });
      return divideScalar;
    });

    var name$y = 'equal';
    var createEqualNumber = factory(name$y, ['typed', 'equalScalar'], function (_ref2) {
      var typed = _ref2.typed,
          equalScalar = _ref2.equalScalar;
      return typed(name$y, {
        'any, any': function anyAny(x, y) {
          // strict equality for null and undefined?
          if (x === null) {
            return y === null;
          }

          if (y === null) {
            return x === null;
          }

          if (x === undefined) {
            return y === undefined;
          }

          if (y === undefined) {
            return x === undefined;
          }

          return equalScalar(x, y);
        }
      });
    });

    var name$z = 'smaller';
    var dependencies$z = ['typed', 'config', 'matrix', 'DenseMatrix'];
    var createSmaller =
    /* #__PURE__ */
    factory(name$z, dependencies$z, function (_ref) {
      var typed = _ref.typed,
          config = _ref.config,
          matrix = _ref.matrix,
          DenseMatrix = _ref.DenseMatrix;
      var algorithm03 = createAlgorithm03({
        typed: typed
      });
      var algorithm07 = createAlgorithm07({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm12 = createAlgorithm12({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm13 = createAlgorithm13({
        typed: typed
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Test whether value x is smaller than y.
       *
       * The function returns true when x is smaller than y and the relative
       * difference between x and y is smaller than the configured epsilon. The
       * function cannot be used to compare values smaller than approximately 2.22e-16.
       *
       * For matrices, the function is evaluated element wise.
       * Strings are compared by their numerical value.
       *
       * Syntax:
       *
       *    math.smaller(x, y)
       *
       * Examples:
       *
       *    math.smaller(2, 3)            // returns true
       *    math.smaller(5, 2 * 2)        // returns false
       *
       *    const a = math.unit('5 cm')
       *    const b = math.unit('2 inch')
       *    math.smaller(a, b)            // returns true
       *
       * See also:
       *
       *    equal, unequal, smallerEq, smaller, smallerEq, compare
       *
       * @param  {number | BigNumber | Fraction | boolean | Unit | string | Array | Matrix} x First value to compare
       * @param  {number | BigNumber | Fraction | boolean | Unit | string | Array | Matrix} y Second value to compare
       * @return {boolean | Array | Matrix} Returns true when the x is smaller than y, else returns false
       */

      var smaller = typed(name$z, {
        'boolean, boolean': function booleanBoolean(x, y) {
          return x < y;
        },
        'number, number': function numberNumber(x, y) {
          return x < y && !nearlyEqual(x, y, config.epsilon);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.lt(y) && !nearlyEqual$1(x, y, config.epsilon);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.compare(y) === -1;
        },
        'Complex, Complex': function ComplexComplex(x, y) {
          throw new TypeError('No ordering relation is defined for complex numbers');
        },
        'Unit, Unit': function UnitUnit(x, y) {
          if (!x.equalBase(y)) {
            throw new Error('Cannot compare units with different base');
          }

          return smaller(x.value, y.value);
        },
        'SparseMatrix, SparseMatrix': function SparseMatrixSparseMatrix(x, y) {
          return algorithm07(x, y, smaller);
        },
        'SparseMatrix, DenseMatrix': function SparseMatrixDenseMatrix(x, y) {
          return algorithm03(y, x, smaller, true);
        },
        'DenseMatrix, SparseMatrix': function DenseMatrixSparseMatrix(x, y) {
          return algorithm03(x, y, smaller, false);
        },
        'DenseMatrix, DenseMatrix': function DenseMatrixDenseMatrix(x, y) {
          return algorithm13(x, y, smaller);
        },
        'Array, Array': function ArrayArray(x, y) {
          // use matrix implementation
          return smaller(matrix(x), matrix(y)).valueOf();
        },
        'Array, Matrix': function ArrayMatrix(x, y) {
          // use matrix implementation
          return smaller(matrix(x), y);
        },
        'Matrix, Array': function MatrixArray(x, y) {
          // use matrix implementation
          return smaller(x, matrix(y));
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm12(x, y, smaller, false);
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, smaller, false);
        },
        'any, SparseMatrix': function anySparseMatrix(x, y) {
          return algorithm12(y, x, smaller, true);
        },
        'any, DenseMatrix': function anyDenseMatrix(x, y) {
          return algorithm14(y, x, smaller, true);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, smaller, false).valueOf();
        },
        'any, Array': function anyArray(x, y) {
          // use matrix implementation
          return algorithm14(matrix(y), x, smaller, true).valueOf();
        }
      });
      return smaller;
    });

    var name$A = 'larger';
    var dependencies$A = ['typed', 'config', 'matrix', 'DenseMatrix'];
    var createLarger =
    /* #__PURE__ */
    factory(name$A, dependencies$A, function (_ref) {
      var typed = _ref.typed,
          config = _ref.config,
          matrix = _ref.matrix,
          DenseMatrix = _ref.DenseMatrix;
      var algorithm03 = createAlgorithm03({
        typed: typed
      });
      var algorithm07 = createAlgorithm07({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm12 = createAlgorithm12({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm13 = createAlgorithm13({
        typed: typed
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Test whether value x is larger than y.
       *
       * The function returns true when x is larger than y and the relative
       * difference between x and y is larger than the configured epsilon. The
       * function cannot be used to compare values smaller than approximately 2.22e-16.
       *
       * For matrices, the function is evaluated element wise.
       * Strings are compared by their numerical value.
       *
       * Syntax:
       *
       *    math.larger(x, y)
       *
       * Examples:
       *
       *    math.larger(2, 3)             // returns false
       *    math.larger(5, 2 + 2)         // returns true
       *
       *    const a = math.unit('5 cm')
       *    const b = math.unit('2 inch')
       *    math.larger(a, b)             // returns false
       *
       * See also:
       *
       *    equal, unequal, smaller, smallerEq, largerEq, compare
       *
       * @param  {number | BigNumber | Fraction | boolean | Unit | string | Array | Matrix} x First value to compare
       * @param  {number | BigNumber | Fraction | boolean | Unit | string | Array | Matrix} y Second value to compare
       * @return {boolean | Array | Matrix} Returns true when the x is larger than y, else returns false
       */

      var larger = typed(name$A, {
        'boolean, boolean': function booleanBoolean(x, y) {
          return x > y;
        },
        'number, number': function numberNumber(x, y) {
          return x > y && !nearlyEqual(x, y, config.epsilon);
        },
        'BigNumber, BigNumber': function BigNumberBigNumber(x, y) {
          return x.gt(y) && !nearlyEqual$1(x, y, config.epsilon);
        },
        'Fraction, Fraction': function FractionFraction(x, y) {
          return x.compare(y) === 1;
        },
        'Complex, Complex': function ComplexComplex() {
          throw new TypeError('No ordering relation is defined for complex numbers');
        },
        'Unit, Unit': function UnitUnit(x, y) {
          if (!x.equalBase(y)) {
            throw new Error('Cannot compare units with different base');
          }

          return larger(x.value, y.value);
        },
        'SparseMatrix, SparseMatrix': function SparseMatrixSparseMatrix(x, y) {
          return algorithm07(x, y, larger);
        },
        'SparseMatrix, DenseMatrix': function SparseMatrixDenseMatrix(x, y) {
          return algorithm03(y, x, larger, true);
        },
        'DenseMatrix, SparseMatrix': function DenseMatrixSparseMatrix(x, y) {
          return algorithm03(x, y, larger, false);
        },
        'DenseMatrix, DenseMatrix': function DenseMatrixDenseMatrix(x, y) {
          return algorithm13(x, y, larger);
        },
        'Array, Array': function ArrayArray(x, y) {
          // use matrix implementation
          return larger(matrix(x), matrix(y)).valueOf();
        },
        'Array, Matrix': function ArrayMatrix(x, y) {
          // use matrix implementation
          return larger(matrix(x), y);
        },
        'Matrix, Array': function MatrixArray(x, y) {
          // use matrix implementation
          return larger(x, matrix(y));
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm12(x, y, larger, false);
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, larger, false);
        },
        'any, SparseMatrix': function anySparseMatrix(x, y) {
          return algorithm12(y, x, larger, true);
        },
        'any, DenseMatrix': function anyDenseMatrix(x, y) {
          return algorithm14(y, x, larger, true);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, larger, false).valueOf();
        },
        'any, Array': function anyArray(x, y) {
          // use matrix implementation
          return algorithm14(matrix(y), x, larger, true).valueOf();
        }
      });
      return larger;
    });

    var name$B = 'unequal';
    var createUnequalNumber = factory(name$B, ['typed', 'equalScalar'], function (_ref2) {
      var typed = _ref2.typed,
          equalScalar = _ref2.equalScalar;
      return typed(name$B, {
        'any, any': function anyAny(x, y) {
          // strict equality for null and undefined?
          if (x === null) {
            return y !== null;
          }

          if (y === null) {
            return x !== null;
          }

          if (x === undefined) {
            return y !== undefined;
          }

          if (y === undefined) {
            return x !== undefined;
          }

          return !equalScalar(x, y);
        }
      });
    });

    var name$C = 'FibonacciHeap';
    var dependencies$B = ['smaller', 'larger'];
    var createFibonacciHeapClass =
    /* #__PURE__ */
    factory(name$C, dependencies$B, function (_ref) {
      var smaller = _ref.smaller,
          larger = _ref.larger;
      var oneOverLogPhi = 1.0 / Math.log((1.0 + Math.sqrt(5.0)) / 2.0);
      /**
       * Fibonacci Heap implementation, used interally for Matrix math.
       * @class FibonacciHeap
       * @constructor FibonacciHeap
       */

      function FibonacciHeap() {
        if (!(this instanceof FibonacciHeap)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        } // initialize fields


        this._minimum = null;
        this._size = 0;
      }
      /**
       * Attach type information
       */


      FibonacciHeap.prototype.type = 'FibonacciHeap';
      FibonacciHeap.prototype.isFibonacciHeap = true;
      /**
       * Inserts a new data element into the heap. No heap consolidation is
       * performed at this time, the new node is simply inserted into the root
       * list of this heap. Running time: O(1) actual.
       * @memberof FibonacciHeap
       */

      FibonacciHeap.prototype.insert = function (key, value) {
        // create node
        var node = {
          key: key,
          value: value,
          degree: 0
        }; // check we have a node in the minimum

        if (this._minimum) {
          // minimum node
          var minimum = this._minimum; // update left & right of node

          node.left = minimum;
          node.right = minimum.right;
          minimum.right = node;
          node.right.left = node; // update minimum node in heap if needed

          if (smaller(key, minimum.key)) {
            // node has a smaller key, use it as minimum
            this._minimum = node;
          }
        } else {
          // set left & right
          node.left = node;
          node.right = node; // this is the first node

          this._minimum = node;
        } // increment number of nodes in heap


        this._size++; // return node

        return node;
      };
      /**
       * Returns the number of nodes in heap. Running time: O(1) actual.
       * @memberof FibonacciHeap
       */


      FibonacciHeap.prototype.size = function () {
        return this._size;
      };
      /**
       * Removes all elements from this heap.
       * @memberof FibonacciHeap
       */


      FibonacciHeap.prototype.clear = function () {
        this._minimum = null;
        this._size = 0;
      };
      /**
       * Returns true if the heap is empty, otherwise false.
       * @memberof FibonacciHeap
       */


      FibonacciHeap.prototype.isEmpty = function () {
        return this._size === 0;
      };
      /**
       * Extracts the node with minimum key from heap. Amortized running
       * time: O(log n).
       * @memberof FibonacciHeap
       */


      FibonacciHeap.prototype.extractMinimum = function () {
        // node to remove
        var node = this._minimum; // check we have a minimum

        if (node === null) {
          return node;
        } // current minimum


        var minimum = this._minimum; // get number of children

        var numberOfChildren = node.degree; // pointer to the first child

        var x = node.child; // for each child of node do...

        while (numberOfChildren > 0) {
          // store node in right side
          var tempRight = x.right; // remove x from child list

          x.left.right = x.right;
          x.right.left = x.left; // add x to root list of heap

          x.left = minimum;
          x.right = minimum.right;
          minimum.right = x;
          x.right.left = x; // set Parent[x] to null

          x.parent = null;
          x = tempRight;
          numberOfChildren--;
        } // remove node from root list of heap


        node.left.right = node.right;
        node.right.left = node.left; // update minimum

        if (node === node.right) {
          // empty
          minimum = null;
        } else {
          // update minimum
          minimum = node.right; // we need to update the pointer to the root with minimum key

          minimum = _findMinimumNode(minimum, this._size);
        } // decrement size of heap


        this._size--; // update minimum

        this._minimum = minimum; // return node

        return node;
      };
      /**
       * Removes a node from the heap given the reference to the node. The trees
       * in the heap will be consolidated, if necessary. This operation may fail
       * to remove the correct element if there are nodes with key value -Infinity.
       * Running time: O(log n) amortized.
       * @memberof FibonacciHeap
       */


      FibonacciHeap.prototype.remove = function (node) {
        // decrease key value
        this._minimum = _decreaseKey(this._minimum, node, -1); // remove the smallest

        this.extractMinimum();
      };
      /**
       * Decreases the key value for a heap node, given the new value to take on.
       * The structure of the heap may be changed and will not be consolidated.
       * Running time: O(1) amortized.
       * @memberof FibonacciHeap
       */


      function _decreaseKey(minimum, node, key) {
        // set node key
        node.key = key; // get parent node

        var parent = node.parent;

        if (parent && smaller(node.key, parent.key)) {
          // remove node from parent
          _cut(minimum, node, parent); // remove all nodes from parent to the root parent


          _cascadingCut(minimum, parent);
        } // update minimum node if needed


        if (smaller(node.key, minimum.key)) {
          minimum = node;
        } // return minimum


        return minimum;
      }
      /**
       * The reverse of the link operation: removes node from the child list of parent.
       * This method assumes that min is non-null. Running time: O(1).
       * @memberof FibonacciHeap
       */


      function _cut(minimum, node, parent) {
        // remove node from parent children and decrement Degree[parent]
        node.left.right = node.right;
        node.right.left = node.left;
        parent.degree--; // reset y.child if necessary

        if (parent.child === node) {
          parent.child = node.right;
        } // remove child if degree is 0


        if (parent.degree === 0) {
          parent.child = null;
        } // add node to root list of heap


        node.left = minimum;
        node.right = minimum.right;
        minimum.right = node;
        node.right.left = node; // set parent[node] to null

        node.parent = null; // set mark[node] to false

        node.mark = false;
      }
      /**
       * Performs a cascading cut operation. This cuts node from its parent and then
       * does the same for its parent, and so on up the tree.
       * Running time: O(log n); O(1) excluding the recursion.
       * @memberof FibonacciHeap
       */


      function _cascadingCut(minimum, node) {
        // store parent node
        var parent = node.parent; // if there's a parent...

        if (!parent) {
          return;
        } // if node is unmarked, set it marked


        if (!node.mark) {
          node.mark = true;
        } else {
          // it's marked, cut it from parent
          _cut(minimum, node, parent); // cut its parent as well


          _cascadingCut(parent);
        }
      }
      /**
       * Make the first node a child of the second one. Running time: O(1) actual.
       * @memberof FibonacciHeap
       */


      var _linkNodes = function _linkNodes(node, parent) {
        // remove node from root list of heap
        node.left.right = node.right;
        node.right.left = node.left; // make node a Child of parent

        node.parent = parent;

        if (!parent.child) {
          parent.child = node;
          node.right = node;
          node.left = node;
        } else {
          node.left = parent.child;
          node.right = parent.child.right;
          parent.child.right = node;
          node.right.left = node;
        } // increase degree[parent]


        parent.degree++; // set mark[node] false

        node.mark = false;
      };

      function _findMinimumNode(minimum, size) {
        // to find trees of the same degree efficiently we use an array of length O(log n) in which we keep a pointer to one root of each degree
        var arraySize = Math.floor(Math.log(size) * oneOverLogPhi) + 1; // create list with initial capacity

        var array = new Array(arraySize); // find the number of root nodes.

        var numRoots = 0;
        var x = minimum;

        if (x) {
          numRoots++;
          x = x.right;

          while (x !== minimum) {
            numRoots++;
            x = x.right;
          }
        } // vars


        var y; // For each node in root list do...

        while (numRoots > 0) {
          // access this node's degree..
          var d = x.degree; // get next node

          var next = x.right; // check if there is a node already in array with the same degree

          while (true) {
            // get node with the same degree is any
            y = array[d];

            if (!y) {
              break;
            } // make one node with the same degree a child of the other, do this based on the key value.


            if (larger(x.key, y.key)) {
              var temp = y;
              y = x;
              x = temp;
            } // make y a child of x


            _linkNodes(y, x); // we have handled this degree, go to next one.


            array[d] = null;
            d++;
          } // save this node for later when we might encounter another of the same degree.


          array[d] = x; // move forward through list.

          x = next;
          numRoots--;
        } // Set min to null (effectively losing the root list) and reconstruct the root list from the array entries in array[].


        minimum = null; // loop nodes in array

        for (var i = 0; i < arraySize; i++) {
          // get current node
          y = array[i];

          if (!y) {
            continue;
          } // check if we have a linked list


          if (minimum) {
            // First remove node from root list.
            y.left.right = y.right;
            y.right.left = y.left; // now add to root list, again.

            y.left = minimum;
            y.right = minimum.right;
            minimum.right = y;
            y.right.left = y; // check if this is a new min.

            if (smaller(y.key, minimum.key)) {
              minimum = y;
            }
          } else {
            minimum = y;
          }
        }

        return minimum;
      }

      return FibonacciHeap;
    }, {
      isClass: true
    });

    var name$D = 'Spa';
    var dependencies$C = ['addScalar', 'equalScalar', 'FibonacciHeap'];
    var createSpaClass =
    /* #__PURE__ */
    factory(name$D, dependencies$C, function (_ref) {
      var addScalar = _ref.addScalar,
          equalScalar = _ref.equalScalar,
          FibonacciHeap = _ref.FibonacciHeap;

      /**
       * An ordered Sparse Accumulator is a representation for a sparse vector that includes a dense array
       * of the vector elements and an ordered list of non-zero elements.
       */
      function Spa() {
        if (!(this instanceof Spa)) {
          throw new SyntaxError('Constructor must be called with the new operator');
        } // allocate vector, TODO use typed arrays


        this._values = [];
        this._heap = new FibonacciHeap();
      }
      /**
       * Attach type information
       */


      Spa.prototype.type = 'Spa';
      Spa.prototype.isSpa = true;
      /**
       * Set the value for index i.
       *
       * @param {number} i                       The index
       * @param {number | BigNumber | Complex}   The value at index i
       */

      Spa.prototype.set = function (i, v) {
        // check we have a value @ i
        if (!this._values[i]) {
          // insert in heap
          var node = this._heap.insert(i, v); // set the value @ i


          this._values[i] = node;
        } else {
          // update the value @ i
          this._values[i].value = v;
        }
      };

      Spa.prototype.get = function (i) {
        var node = this._values[i];

        if (node) {
          return node.value;
        }

        return 0;
      };

      Spa.prototype.accumulate = function (i, v) {
        // node @ i
        var node = this._values[i];

        if (!node) {
          // insert in heap
          node = this._heap.insert(i, v); // initialize value

          this._values[i] = node;
        } else {
          // accumulate value
          node.value = addScalar(node.value, v);
        }
      };

      Spa.prototype.forEach = function (from, to, callback) {
        // references
        var heap = this._heap;
        var values = this._values; // nodes

        var nodes = []; // node with minimum key, save it

        var node = heap.extractMinimum();

        if (node) {
          nodes.push(node);
        } // extract nodes from heap (ordered)


        while (node && node.key <= to) {
          // check it is in range
          if (node.key >= from) {
            // check value is not zero
            if (!equalScalar(node.value, 0)) {
              // invoke callback
              callback(node.key, node.value, this);
            }
          } // extract next node, save it


          node = heap.extractMinimum();

          if (node) {
            nodes.push(node);
          }
        } // reinsert all nodes in heap


        for (var i = 0; i < nodes.length; i++) {
          // current node
          var n = nodes[i]; // insert node in heap

          node = heap.insert(n.key, n.value); // update values

          values[node.key] = node;
        }
      };

      Spa.prototype.swap = function (i, j) {
        // node @ i and j
        var nodei = this._values[i];
        var nodej = this._values[j]; // check we need to insert indeces

        if (!nodei && nodej) {
          // insert in heap
          nodei = this._heap.insert(i, nodej.value); // remove from heap

          this._heap.remove(nodej); // set values


          this._values[i] = nodei;
          this._values[j] = undefined;
        } else if (nodei && !nodej) {
          // insert in heap
          nodej = this._heap.insert(j, nodei.value); // remove from heap

          this._heap.remove(nodei); // set values


          this._values[j] = nodej;
          this._values[i] = undefined;
        } else if (nodei && nodej) {
          // swap values
          var v = nodei.value;
          nodei.value = nodej.value;
          nodej.value = v;
        }
      };

      return Spa;
    }, {
      isClass: true
    });

    var name$E = 'add';
    var dependencies$D = ['typed', 'matrix', 'addScalar', 'equalScalar', 'DenseMatrix', 'SparseMatrix'];
    var createAdd =
    /* #__PURE__ */
    factory(name$E, dependencies$D, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          addScalar = _ref.addScalar,
          equalScalar = _ref.equalScalar,
          DenseMatrix = _ref.DenseMatrix,
          SparseMatrix = _ref.SparseMatrix;
      var algorithm01 = createAlgorithm01({
        typed: typed
      });
      var algorithm04 = createAlgorithm04({
        typed: typed,
        equalScalar: equalScalar
      });
      var algorithm10 = createAlgorithm10({
        typed: typed,
        DenseMatrix: DenseMatrix
      });
      var algorithm13 = createAlgorithm13({
        typed: typed
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Add two or more values, `x + y`.
       * For matrices, the function is evaluated element wise.
       *
       * Syntax:
       *
       *    math.add(x, y)
       *    math.add(x, y, z, ...)
       *
       * Examples:
       *
       *    math.add(2, 3)               // returns number 5
       *    math.add(2, 3, 4)            // returns number 9
       *
       *    const a = math.complex(2, 3)
       *    const b = math.complex(-4, 1)
       *    math.add(a, b)               // returns Complex -2 + 4i
       *
       *    math.add([1, 2, 3], 4)       // returns Array [5, 6, 7]
       *
       *    const c = math.unit('5 cm')
       *    const d = math.unit('2.1 mm')
       *    math.add(c, d)               // returns Unit 52.1 mm
       *
       *    math.add("2.3", "4")         // returns number 6.3
       *
       * See also:
       *
       *    subtract, sum
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} x First value to add
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} y Second value to add
       * @return {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} Sum of `x` and `y`
       */

      var add = typed(name$E, extend({
        // we extend the signatures of addScalar with signatures dealing with matrices
        'DenseMatrix, DenseMatrix': function DenseMatrixDenseMatrix(x, y) {
          return algorithm13(x, y, addScalar);
        },
        'DenseMatrix, SparseMatrix': function DenseMatrixSparseMatrix(x, y) {
          return algorithm01(x, y, addScalar, false);
        },
        'SparseMatrix, DenseMatrix': function SparseMatrixDenseMatrix(x, y) {
          return algorithm01(y, x, addScalar, true);
        },
        'SparseMatrix, SparseMatrix': function SparseMatrixSparseMatrix(x, y) {
          return algorithm04(x, y, addScalar);
        },
        'Array, Array': function ArrayArray(x, y) {
          // use matrix implementation
          return add(matrix(x), matrix(y)).valueOf();
        },
        'Array, Matrix': function ArrayMatrix(x, y) {
          // use matrix implementation
          return add(matrix(x), y);
        },
        'Matrix, Array': function MatrixArray(x, y) {
          // use matrix implementation
          return add(x, matrix(y));
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, addScalar, false);
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm10(x, y, addScalar, false);
        },
        'any, DenseMatrix': function anyDenseMatrix(x, y) {
          return algorithm14(y, x, addScalar, true);
        },
        'any, SparseMatrix': function anySparseMatrix(x, y) {
          return algorithm10(y, x, addScalar, true);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, addScalar, false).valueOf();
        },
        'any, Array': function anyArray(x, y) {
          // use matrix implementation
          return algorithm14(matrix(y), x, addScalar, true).valueOf();
        },
        'any, any': addScalar,
        'any, any, ...any': function anyAnyAny(x, y, rest) {
          var result = add(x, y);

          for (var i = 0; i < rest.length; i++) {
            result = add(result, rest[i]);
          }

          return result;
        }
      }, addScalar.signatures));
      return add;
    });

    var name$F = 'lup';
    var dependencies$E = ['typed', 'matrix', 'abs', 'addScalar', 'divideScalar', 'multiplyScalar', 'subtract', 'larger', 'equalScalar', 'unaryMinus', 'DenseMatrix', 'SparseMatrix', 'Spa'];
    var createLup =
    /* #__PURE__ */
    factory(name$F, dependencies$E, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          abs = _ref.abs,
          addScalar = _ref.addScalar,
          divideScalar = _ref.divideScalar,
          multiplyScalar = _ref.multiplyScalar,
          subtract = _ref.subtract,
          larger = _ref.larger,
          equalScalar = _ref.equalScalar,
          unaryMinus = _ref.unaryMinus,
          DenseMatrix = _ref.DenseMatrix,
          SparseMatrix = _ref.SparseMatrix,
          Spa = _ref.Spa;

      /**
       * Calculate the Matrix LU decomposition with partial pivoting. Matrix `A` is decomposed in two matrices (`L`, `U`) and a
       * row permutation vector `p` where `A[p,:] = L * U`
       *
       * Syntax:
       *
       *    math.lup(A)
       *
       * Example:
       *
       *    const m = [[2, 1], [1, 4]]
       *    const r = math.lup(m)
       *    // r = {
       *    //   L: [[1, 0], [0.5, 1]],
       *    //   U: [[2, 1], [0, 3.5]],
       *    //   P: [0, 1]
       *    // }
       *
       * See also:
       *
       *    slu, lsolve, lusolve, usolve
       *
       * @param {Matrix | Array} A    A two dimensional matrix or array for which to get the LUP decomposition.
       *
       * @return {{L: Array | Matrix, U: Array | Matrix, P: Array.<number>}} The lower triangular matrix, the upper triangular matrix and the permutation matrix.
       */
      return typed(name$F, {
        DenseMatrix: function DenseMatrix(m) {
          return _denseLUP(m);
        },
        SparseMatrix: function SparseMatrix(m) {
          return _sparseLUP(m);
        },
        Array: function Array(a) {
          // create dense matrix from array
          var m = matrix(a); // lup, use matrix implementation

          var r = _denseLUP(m); // result


          return {
            L: r.L.valueOf(),
            U: r.U.valueOf(),
            p: r.p
          };
        }
      });

      function _denseLUP(m) {
        // rows & columns
        var rows = m._size[0];
        var columns = m._size[1]; // minimum rows and columns

        var n = Math.min(rows, columns); // matrix array, clone original data

        var data = clone(m._data); // l matrix arrays

        var ldata = [];
        var lsize = [rows, n]; // u matrix arrays

        var udata = [];
        var usize = [n, columns]; // vars

        var i, j, k; // permutation vector

        var p = [];

        for (i = 0; i < rows; i++) {
          p[i] = i;
        } // loop columns


        for (j = 0; j < columns; j++) {
          // skip first column in upper triangular matrix
          if (j > 0) {
            // loop rows
            for (i = 0; i < rows; i++) {
              // min i,j
              var min = Math.min(i, j); // v[i, j]

              var s = 0; // loop up to min

              for (k = 0; k < min; k++) {
                // s = l[i, k] - data[k, j]
                s = addScalar(s, multiplyScalar(data[i][k], data[k][j]));
              }

              data[i][j] = subtract(data[i][j], s);
            }
          } // row with larger value in cvector, row >= j


          var pi = j;
          var pabsv = 0;
          var vjj = 0; // loop rows

          for (i = j; i < rows; i++) {
            // data @ i, j
            var v = data[i][j]; // absolute value

            var absv = abs(v); // value is greater than pivote value

            if (larger(absv, pabsv)) {
              // store row
              pi = i; // update max value

              pabsv = absv; // value @ [j, j]

              vjj = v;
            }
          } // swap rows (j <-> pi)


          if (j !== pi) {
            // swap values j <-> pi in p
            p[j] = [p[pi], p[pi] = p[j]][0]; // swap j <-> pi in data

            DenseMatrix._swapRows(j, pi, data);
          } // check column is in lower triangular matrix


          if (j < rows) {
            // loop rows (lower triangular matrix)
            for (i = j + 1; i < rows; i++) {
              // value @ i, j
              var vij = data[i][j];

              if (!equalScalar(vij, 0)) {
                // update data
                data[i][j] = divideScalar(data[i][j], vjj);
              }
            }
          }
        } // loop columns


        for (j = 0; j < columns; j++) {
          // loop rows
          for (i = 0; i < rows; i++) {
            // initialize row in arrays
            if (j === 0) {
              // check row exists in upper triangular matrix
              if (i < columns) {
                // U
                udata[i] = [];
              } // L


              ldata[i] = [];
            } // check we are in the upper triangular matrix


            if (i < j) {
              // check row exists in upper triangular matrix
              if (i < columns) {
                // U
                udata[i][j] = data[i][j];
              } // check column exists in lower triangular matrix


              if (j < rows) {
                // L
                ldata[i][j] = 0;
              }

              continue;
            } // diagonal value


            if (i === j) {
              // check row exists in upper triangular matrix
              if (i < columns) {
                // U
                udata[i][j] = data[i][j];
              } // check column exists in lower triangular matrix


              if (j < rows) {
                // L
                ldata[i][j] = 1;
              }

              continue;
            } // check row exists in upper triangular matrix


            if (i < columns) {
              // U
              udata[i][j] = 0;
            } // check column exists in lower triangular matrix


            if (j < rows) {
              // L
              ldata[i][j] = data[i][j];
            }
          }
        } // l matrix


        var l = new DenseMatrix({
          data: ldata,
          size: lsize
        }); // u matrix

        var u = new DenseMatrix({
          data: udata,
          size: usize
        }); // p vector

        var pv = [];

        for (i = 0, n = p.length; i < n; i++) {
          pv[p[i]] = i;
        } // return matrices


        return {
          L: l,
          U: u,
          p: pv,
          toString: function toString() {
            return 'L: ' + this.L.toString() + '\nU: ' + this.U.toString() + '\nP: ' + this.p;
          }
        };
      }

      function _sparseLUP(m) {
        // rows & columns
        var rows = m._size[0];
        var columns = m._size[1]; // minimum rows and columns

        var n = Math.min(rows, columns); // matrix arrays (will not be modified, thanks to permutation vector)

        var values = m._values;
        var index = m._index;
        var ptr = m._ptr; // l matrix arrays

        var lvalues = [];
        var lindex = [];
        var lptr = [];
        var lsize = [rows, n]; // u matrix arrays

        var uvalues = [];
        var uindex = [];
        var uptr = [];
        var usize = [n, columns]; // vars

        var i, j, k; // permutation vectors, (current index -> original index) and (original index -> current index)

        var pvCo = [];
        var pvOc = [];

        for (i = 0; i < rows; i++) {
          pvCo[i] = i;
          pvOc[i] = i;
        } // swap indices in permutation vectors (condition x < y)!


        var swapIndeces = function swapIndeces(x, y) {
          // find pv indeces getting data from x and y
          var kx = pvOc[x];
          var ky = pvOc[y]; // update permutation vector current -> original

          pvCo[kx] = y;
          pvCo[ky] = x; // update permutation vector original -> current

          pvOc[x] = ky;
          pvOc[y] = kx;
        }; // loop columns


        var _loop = function _loop() {
          // sparse accumulator
          var spa = new Spa(); // check lower triangular matrix has a value @ column j

          if (j < rows) {
            // update ptr
            lptr.push(lvalues.length); // first value in j column for lower triangular matrix

            lvalues.push(1);
            lindex.push(j);
          } // update ptr


          uptr.push(uvalues.length); // k0 <= k < k1 where k0 = _ptr[j] && k1 = _ptr[j+1]

          var k0 = ptr[j];
          var k1 = ptr[j + 1]; // copy column j into sparse accumulator

          for (k = k0; k < k1; k++) {
            // row
            i = index[k]; // copy column values into sparse accumulator (use permutation vector)

            spa.set(pvCo[i], values[k]);
          } // skip first column in upper triangular matrix


          if (j > 0) {
            // loop rows in column j (above diagonal)
            spa.forEach(0, j - 1, function (k, vkj) {
              // loop rows in column k (L)
              SparseMatrix._forEachRow(k, lvalues, lindex, lptr, function (i, vik) {
                // check row is below k
                if (i > k) {
                  // update spa value
                  spa.accumulate(i, unaryMinus(multiplyScalar(vik, vkj)));
                }
              });
            });
          } // row with larger value in spa, row >= j


          var pi = j;
          var vjj = spa.get(j);
          var pabsv = abs(vjj); // loop values in spa (order by row, below diagonal)

          spa.forEach(j + 1, rows - 1, function (x, v) {
            // absolute value
            var absv = abs(v); // value is greater than pivote value

            if (larger(absv, pabsv)) {
              // store row
              pi = x; // update max value

              pabsv = absv; // value @ [j, j]

              vjj = v;
            }
          }); // swap rows (j <-> pi)

          if (j !== pi) {
            // swap values j <-> pi in L
            SparseMatrix._swapRows(j, pi, lsize[1], lvalues, lindex, lptr); // swap values j <-> pi in U


            SparseMatrix._swapRows(j, pi, usize[1], uvalues, uindex, uptr); // swap values in spa


            spa.swap(j, pi); // update permutation vector (swap values @ j, pi)

            swapIndeces(j, pi);
          } // loop values in spa (order by row)


          spa.forEach(0, rows - 1, function (x, v) {
            // check we are above diagonal
            if (x <= j) {
              // update upper triangular matrix
              uvalues.push(v);
              uindex.push(x);
            } else {
              // update value
              v = divideScalar(v, vjj); // check value is non zero

              if (!equalScalar(v, 0)) {
                // update lower triangular matrix
                lvalues.push(v);
                lindex.push(x);
              }
            }
          });
        };

        for (j = 0; j < columns; j++) {
          _loop();
        } // update ptrs


        uptr.push(uvalues.length);
        lptr.push(lvalues.length); // return matrices

        return {
          L: new SparseMatrix({
            values: lvalues,
            index: lindex,
            ptr: lptr,
            size: lsize
          }),
          U: new SparseMatrix({
            values: uvalues,
            index: uindex,
            ptr: uptr,
            size: usize
          }),
          p: pvCo,
          toString: function toString() {
            return 'L: ' + this.L.toString() + '\nU: ' + this.U.toString() + '\nP: ' + this.p;
          }
        };
      }
    });

    var name$G = 'det';
    var dependencies$F = ['typed', 'matrix', 'subtract', 'multiply', 'unaryMinus', 'lup'];
    var createDet =
    /* #__PURE__ */
    factory(name$G, dependencies$F, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          subtract = _ref.subtract,
          multiply = _ref.multiply,
          unaryMinus = _ref.unaryMinus,
          lup = _ref.lup;

      /**
       * Calculate the determinant of a matrix.
       *
       * Syntax:
       *
       *    math.det(x)
       *
       * Examples:
       *
       *    math.det([[1, 2], [3, 4]]) // returns -2
       *
       *    const A = [
       *      [-2, 2, 3],
       *      [-1, 1, 3],
       *      [2, 0, -1]
       *    ]
       *    math.det(A) // returns 6
       *
       * See also:
       *
       *    inv
       *
       * @param {Array | Matrix} x  A matrix
       * @return {number} The determinant of `x`
       */
      return typed(name$G, {
        any: function any(x) {
          return clone(x);
        },
        'Array | Matrix': function det(x) {
          var size;

          if (isMatrix(x)) {
            size = x.size();
          } else if (Array.isArray(x)) {
            x = matrix(x);
            size = x.size();
          } else {
            // a scalar
            size = [];
          }

          switch (size.length) {
            case 0:
              // scalar
              return clone(x);

            case 1:
              // vector
              if (size[0] === 1) {
                return clone(x.valueOf()[0]);
              } else {
                throw new RangeError('Matrix must be square ' + '(size: ' + format$2(size) + ')');
              }

            case 2:
              {
                // two dimensional array
                var rows = size[0];
                var cols = size[1];

                if (rows === cols) {
                  return _det(x.clone().valueOf(), rows);
                } else {
                  throw new RangeError('Matrix must be square ' + '(size: ' + format$2(size) + ')');
                }
              }

            default:
              // multi dimensional array
              throw new RangeError('Matrix must be two dimensional ' + '(size: ' + format$2(size) + ')');
          }
        }
      });
      /**
       * Calculate the determinant of a matrix
       * @param {Array[]} matrix  A square, two dimensional matrix
       * @param {number} rows     Number of rows of the matrix (zero-based)
       * @param {number} cols     Number of columns of the matrix (zero-based)
       * @returns {number} det
       * @private
       */

      function _det(matrix, rows, cols) {
        if (rows === 1) {
          // this is a 1 x 1 matrix
          return clone(matrix[0][0]);
        } else if (rows === 2) {
          // this is a 2 x 2 matrix
          // the determinant of [a11,a12;a21,a22] is det = a11*a22-a21*a12
          return subtract(multiply(matrix[0][0], matrix[1][1]), multiply(matrix[1][0], matrix[0][1]));
        } else {
          // Compute the LU decomposition
          var decomp = lup(matrix); // The determinant is the product of the diagonal entries of U (and those of L, but they are all 1)

          var det = decomp.U[0][0];

          for (var _i = 1; _i < rows; _i++) {
            det = multiply(det, decomp.U[_i][_i]);
          } // The determinant will be multiplied by 1 or -1 depending on the parity of the permutation matrix.
          // This can be determined by counting the cycles. This is roughly a linear time algorithm.


          var evenCycles = 0;
          var i = 0;
          var visited = [];

          while (true) {
            while (visited[i]) {
              i++;
            }

            if (i >= rows) break;
            var j = i;
            var cycleLen = 0;

            while (!visited[decomp.p[j]]) {
              visited[decomp.p[j]] = true;
              j = decomp.p[j];
              cycleLen++;
            }

            if (cycleLen % 2 === 0) {
              evenCycles++;
            }
          }

          return evenCycles % 2 === 0 ? det : unaryMinus(det);
        }
      }
    });

    var name$H = 'inv';
    var dependencies$G = ['typed', 'matrix', 'divideScalar', 'addScalar', 'multiply', 'unaryMinus', 'det', 'identity', 'abs'];
    var createInv =
    /* #__PURE__ */
    factory(name$H, dependencies$G, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          divideScalar = _ref.divideScalar,
          addScalar = _ref.addScalar,
          multiply = _ref.multiply,
          unaryMinus = _ref.unaryMinus,
          det = _ref.det,
          identity = _ref.identity,
          abs = _ref.abs;

      /**
       * Calculate the inverse of a square matrix.
       *
       * Syntax:
       *
       *     math.inv(x)
       *
       * Examples:
       *
       *     math.inv([[1, 2], [3, 4]])  // returns [[-2, 1], [1.5, -0.5]]
       *     math.inv(4)                 // returns 0.25
       *     1 / 4                       // returns 0.25
       *
       * See also:
       *
       *     det, transpose
       *
       * @param {number | Complex | Array | Matrix} x     Matrix to be inversed
       * @return {number | Complex | Array | Matrix} The inverse of `x`.
       */
      return typed(name$H, {
        'Array | Matrix': function ArrayMatrix(x) {
          var size = isMatrix(x) ? x.size() : arraySize(x);

          switch (size.length) {
            case 1:
              // vector
              if (size[0] === 1) {
                if (isMatrix(x)) {
                  return matrix([divideScalar(1, x.valueOf()[0])]);
                } else {
                  return [divideScalar(1, x[0])];
                }
              } else {
                throw new RangeError('Matrix must be square ' + '(size: ' + format$2(size) + ')');
              }

            case 2:
              // two dimensional array
              {
                var rows = size[0];
                var cols = size[1];

                if (rows === cols) {
                  if (isMatrix(x)) {
                    return matrix(_inv(x.valueOf(), rows, cols), x.storage());
                  } else {
                    // return an Array
                    return _inv(x, rows, cols);
                  }
                } else {
                  throw new RangeError('Matrix must be square ' + '(size: ' + format$2(size) + ')');
                }
              }

            default:
              // multi dimensional array
              throw new RangeError('Matrix must be two dimensional ' + '(size: ' + format$2(size) + ')');
          }
        },
        any: function any(x) {
          // scalar
          return divideScalar(1, x); // FIXME: create a BigNumber one when configured for bignumbers
        }
      });
      /**
       * Calculate the inverse of a square matrix
       * @param {Array[]} mat     A square matrix
       * @param {number} rows     Number of rows
       * @param {number} cols     Number of columns, must equal rows
       * @return {Array[]} inv    Inverse matrix
       * @private
       */

      function _inv(mat, rows, cols) {
        var r, s, f, value, temp;

        if (rows === 1) {
          // this is a 1 x 1 matrix
          value = mat[0][0];

          if (value === 0) {
            throw Error('Cannot calculate inverse, determinant is zero');
          }

          return [[divideScalar(1, value)]];
        } else if (rows === 2) {
          // this is a 2 x 2 matrix
          var d = det(mat);

          if (d === 0) {
            throw Error('Cannot calculate inverse, determinant is zero');
          }

          return [[divideScalar(mat[1][1], d), divideScalar(unaryMinus(mat[0][1]), d)], [divideScalar(unaryMinus(mat[1][0]), d), divideScalar(mat[0][0], d)]];
        } else {
          // this is a matrix of 3 x 3 or larger
          // calculate inverse using gauss-jordan elimination
          //      https://en.wikipedia.org/wiki/Gaussian_elimination
          //      http://mathworld.wolfram.com/MatrixInverse.html
          //      http://math.uww.edu/~mcfarlat/inverse.htm
          // make a copy of the matrix (only the arrays, not of the elements)
          var A = mat.concat();

          for (r = 0; r < rows; r++) {
            A[r] = A[r].concat();
          } // create an identity matrix which in the end will contain the
          // matrix inverse


          var B = identity(rows).valueOf(); // loop over all columns, and perform row reductions

          for (var c = 0; c < cols; c++) {
            // Pivoting: Swap row c with row r, where row r contains the largest element A[r][c]
            var ABig = abs(A[c][c]);
            var rBig = c;
            r = c + 1;

            while (r < rows) {
              if (abs(A[r][c]) > ABig) {
                ABig = abs(A[r][c]);
                rBig = r;
              }

              r++;
            }

            if (ABig === 0) {
              throw Error('Cannot calculate inverse, determinant is zero');
            }

            r = rBig;

            if (r !== c) {
              temp = A[c];
              A[c] = A[r];
              A[r] = temp;
              temp = B[c];
              B[c] = B[r];
              B[r] = temp;
            } // eliminate non-zero values on the other rows at column c


            var Ac = A[c];
            var Bc = B[c];

            for (r = 0; r < rows; r++) {
              var Ar = A[r];
              var Br = B[r];

              if (r !== c) {
                // eliminate value at column c and row r
                if (Ar[c] !== 0) {
                  f = divideScalar(unaryMinus(Ar[c]), Ac[c]); // add (f * row c) to row r to eliminate the value
                  // at column c

                  for (s = c; s < cols; s++) {
                    Ar[s] = addScalar(Ar[s], multiply(f, Ac[s]));
                  }

                  for (s = 0; s < cols; s++) {
                    Br[s] = addScalar(Br[s], multiply(f, Bc[s]));
                  }
                }
              } else {
                // normalize value at Acc to 1,
                // divide each value on row r with the value at Acc
                f = Ac[c];

                for (s = c; s < cols; s++) {
                  Ar[s] = divideScalar(Ar[s], f);
                }

                for (s = 0; s < cols; s++) {
                  Br[s] = divideScalar(Br[s], f);
                }
              }
            }
          }

          return B;
        }
      }
    });

    var name$I = 'divide';
    var dependencies$H = ['typed', 'matrix', 'multiply', 'equalScalar', 'divideScalar', 'inv'];
    var createDivide =
    /* #__PURE__ */
    factory(name$I, dependencies$H, function (_ref) {
      var typed = _ref.typed,
          matrix = _ref.matrix,
          multiply = _ref.multiply,
          equalScalar = _ref.equalScalar,
          divideScalar = _ref.divideScalar,
          inv = _ref.inv;
      var algorithm11 = createAlgorithm11({
        typed: typed,
        equalScalar: equalScalar
      });
      var algorithm14 = createAlgorithm14({
        typed: typed
      });
      /**
       * Divide two values, `x / y`.
       * To divide matrices, `x` is multiplied with the inverse of `y`: `x * inv(y)`.
       *
       * Syntax:
       *
       *    math.divide(x, y)
       *
       * Examples:
       *
       *    math.divide(2, 3)            // returns number 0.6666666666666666
       *
       *    const a = math.complex(5, 14)
       *    const b = math.complex(4, 1)
       *    math.divide(a, b)            // returns Complex 2 + 3i
       *
       *    const c = [[7, -6], [13, -4]]
       *    const d = [[1, 2], [4, 3]]
       *    math.divide(c, d)            // returns Array [[-9, 4], [-11, 6]]
       *
       *    const e = math.unit('18 km')
       *    math.divide(e, 4.5)          // returns Unit 4 km
       *
       * See also:
       *
       *    multiply
       *
       * @param  {number | BigNumber | Fraction | Complex | Unit | Array | Matrix} x   Numerator
       * @param  {number | BigNumber | Fraction | Complex | Array | Matrix} y          Denominator
       * @return {number | BigNumber | Fraction | Complex | Unit | Array | Matrix}                      Quotient, `x / y`
       */

      return typed('divide', extend({
        // we extend the signatures of divideScalar with signatures dealing with matrices
        'Array | Matrix, Array | Matrix': function ArrayMatrixArrayMatrix(x, y) {
          // TODO: implement matrix right division using pseudo inverse
          // https://www.mathworks.nl/help/matlab/ref/mrdivide.html
          // https://www.gnu.org/software/octave/doc/interpreter/Arithmetic-Ops.html
          // https://stackoverflow.com/questions/12263932/how-does-gnu-octave-matrix-division-work-getting-unexpected-behaviour
          return multiply(x, inv(y));
        },
        'DenseMatrix, any': function DenseMatrixAny(x, y) {
          return algorithm14(x, y, divideScalar, false);
        },
        'SparseMatrix, any': function SparseMatrixAny(x, y) {
          return algorithm11(x, y, divideScalar, false);
        },
        'Array, any': function ArrayAny(x, y) {
          // use matrix implementation
          return algorithm14(matrix(x), y, divideScalar, false).valueOf();
        },
        'any, Array | Matrix': function anyArrayMatrix(x, y) {
          return multiply(x, inv(y));
        }
      }, divideScalar.signatures));
    });

    var name$J = 'mean';
    var dependencies$I = ['typed', 'add', 'divide'];
    var createMean =
    /* #__PURE__ */
    factory(name$J, dependencies$I, function (_ref) {
      var typed = _ref.typed,
          add = _ref.add,
          divide = _ref.divide;

      /**
       * Compute the mean value of matrix or a list with values.
       * In case of a multi dimensional array, the mean of the flattened array
       * will be calculated. When `dim` is provided, the maximum over the selected
       * dimension will be calculated. Parameter `dim` is zero-based.
       *
       * Syntax:
       *
       *     math.mean(a, b, c, ...)
       *     math.mean(A)
       *     math.mean(A, dim)
       *
       * Examples:
       *
       *     math.mean(2, 1, 4, 3)                     // returns 2.5
       *     math.mean([1, 2.7, 3.2, 4])               // returns 2.725
       *
       *     math.mean([[2, 5], [6, 3], [1, 7]], 0)    // returns [3, 5]
       *     math.mean([[2, 5], [6, 3], [1, 7]], 1)    // returns [3.5, 4.5, 4]
       *
       * See also:
       *
       *     median, min, max, sum, prod, std, variance
       *
       * @param {... *} args  A single matrix or or multiple scalar values
       * @return {*} The mean of all values
       */
      return typed(name$J, {
        // mean([a, b, c, d, ...])
        'Array | Matrix': _mean,
        // mean([a, b, c, d, ...], dim)
        'Array | Matrix, number | BigNumber': _nmeanDim,
        // mean(a, b, c, d, ...)
        '...': function _(args) {
          if (containsCollections(args)) {
            throw new TypeError('Scalar values expected in function mean');
          }

          return _mean(args);
        }
      });
      /**
       * Calculate the mean value in an n-dimensional array, returning a
       * n-1 dimensional array
       * @param {Array} array
       * @param {number} dim
       * @return {number} mean
       * @private
       */

      function _nmeanDim(array, dim) {
        try {
          var sum = reduce(array, dim, add);
          var s = Array.isArray(array) ? arraySize(array) : array.size();
          return divide(sum, s[dim]);
        } catch (err) {
          throw improveErrorMessage(err, 'mean');
        }
      }
      /**
       * Recursively calculate the mean value in an n-dimensional array
       * @param {Array} array
       * @return {number} mean
       * @private
       */


      function _mean(array) {
        var sum;
        var num = 0;
        deepForEach(array, function (value) {
          try {
            sum = sum === undefined ? value : add(sum, value);
            num++;
          } catch (err) {
            throw improveErrorMessage(err, 'mean', value);
          }
        });

        if (num === 0) {
          throw new Error('Cannot calculate the mean of an empty array');
        }

        return divide(sum, num);
      }
    });

    var DEFAULT_NORMALIZATION = 'unbiased';
    var name$K = 'variance';
    var dependencies$J = ['typed', 'add', 'subtract', 'multiply', 'divide', 'apply', 'isNaN'];
    var createVariance =
    /* #__PURE__ */
    factory(name$K, dependencies$J, function (_ref) {
      var typed = _ref.typed,
          add = _ref.add,
          subtract = _ref.subtract,
          multiply = _ref.multiply,
          divide = _ref.divide,
          apply = _ref.apply,
          isNaN = _ref.isNaN;

      /**
       * Compute the variance of a matrix or a  list with values.
       * In case of a (multi dimensional) array or matrix, the variance over all
       * elements will be calculated.
       *
       * Additionally, it is possible to compute the variance along the rows
       * or columns of a matrix by specifying the dimension as the second argument.
       *
       * Optionally, the type of normalization can be specified as the final
       * parameter. The parameter `normalization` can be one of the following values:
       *
       * - 'unbiased' (default) The sum of squared errors is divided by (n - 1)
       * - 'uncorrected'        The sum of squared errors is divided by n
       * - 'biased'             The sum of squared errors is divided by (n + 1)
       *
       *
       * Note that older browser may not like the variable name `var`. In that
       * case, the function can be called as `math['var'](...)` instead of
       * `math.var(...)`.
       *
       * Syntax:
       *
       *     math.variance(a, b, c, ...)
       *     math.variance(A)
       *     math.variance(A, normalization)
       *     math.variance(A, dimension)
       *     math.variance(A, dimension, normalization)
       *
       * Examples:
       *
       *     math.variance(2, 4, 6)                     // returns 4
       *     math.variance([2, 4, 6, 8])                // returns 6.666666666666667
       *     math.variance([2, 4, 6, 8], 'uncorrected') // returns 5
       *     math.variance([2, 4, 6, 8], 'biased')      // returns 4
       *
       *     math.variance([[1, 2, 3], [4, 5, 6]])      // returns 3.5
       *     math.variance([[1, 2, 3], [4, 6, 8]], 0)   // returns [4.5, 8, 12.5]
       *     math.variance([[1, 2, 3], [4, 6, 8]], 1)   // returns [1, 4]
       *     math.variance([[1, 2, 3], [4, 6, 8]], 1, 'biased') // returns [0.5, 2]
       *
       * See also:
       *
       *    mean, median, max, min, prod, std, sum
       *
       * @param {Array | Matrix} array
       *                        A single matrix or or multiple scalar values
       * @param {string} [normalization='unbiased']
       *                        Determines how to normalize the variance.
       *                        Choose 'unbiased' (default), 'uncorrected', or 'biased'.
       * @param dimension {number | BigNumber}
       *                        Determines the axis to compute the variance for a matrix
       * @return {*} The variance
       */
      return typed(name$K, {
        // variance([a, b, c, d, ...])
        'Array | Matrix': function ArrayMatrix(array) {
          return _var(array, DEFAULT_NORMALIZATION);
        },
        // variance([a, b, c, d, ...], normalization)
        'Array | Matrix, string': _var,
        // variance([a, b, c, c, ...], dim)
        'Array | Matrix, number | BigNumber': function ArrayMatrixNumberBigNumber(array, dim) {
          return _varDim(array, dim, DEFAULT_NORMALIZATION);
        },
        // variance([a, b, c, c, ...], dim, normalization)
        'Array | Matrix, number | BigNumber, string': _varDim,
        // variance(a, b, c, d, ...)
        '...': function _(args) {
          return _var(args, DEFAULT_NORMALIZATION);
        }
      });
      /**
       * Recursively calculate the variance of an n-dimensional array
       * @param {Array} array
       * @param {string} normalization
       *                        Determines how to normalize the variance:
       *                        - 'unbiased'    The sum of squared errors is divided by (n - 1)
       *                        - 'uncorrected' The sum of squared errors is divided by n
       *                        - 'biased'      The sum of squared errors is divided by (n + 1)
       * @return {number | BigNumber} variance
       * @private
       */

      function _var(array, normalization) {
        var sum = 0;
        var num = 0;

        if (array.length === 0) {
          throw new SyntaxError('Function variance requires one or more parameters (0 provided)');
        } // calculate the mean and number of elements


        deepForEach(array, function (value) {
          try {
            sum = add(sum, value);
            num++;
          } catch (err) {
            throw improveErrorMessage(err, 'variance', value);
          }
        });
        if (num === 0) throw new Error('Cannot calculate variance of an empty array');
        var mean = divide(sum, num); // calculate the variance

        sum = 0;
        deepForEach(array, function (value) {
          var diff = subtract(value, mean);
          sum = add(sum, multiply(diff, diff));
        });

        if (isNaN(sum)) {
          return sum;
        }

        switch (normalization) {
          case 'uncorrected':
            return divide(sum, num);

          case 'biased':
            return divide(sum, num + 1);

          case 'unbiased':
            {
              var zero = isBigNumber(sum) ? sum.mul(0) : 0;
              return num === 1 ? zero : divide(sum, num - 1);
            }

          default:
            throw new Error('Unknown normalization "' + normalization + '". ' + 'Choose "unbiased" (default), "uncorrected", or "biased".');
        }
      }

      function _varDim(array, dim, normalization) {
        try {
          if (array.length === 0) {
            throw new SyntaxError('Function variance requires one or more parameters (0 provided)');
          }

          return apply(array, dim, function (x) {
            return _var(x, normalization);
          });
        } catch (err) {
          throw improveErrorMessage(err, 'variance');
        }
      }
    }); // For backward compatibility, deprecated since version 6.0.0. Date: 2018-11-09

    var seedRandom = createCommonjsModule(function (module) {

    var width = 256;// each RC4 output is 0 <= x < 256
    var chunks = 6;// at least six RC4 outputs for each double
    var digits = 52;// there are 52 significant digits in a double
    var pool = [];// pool: entropy pool starts empty
    var GLOBAL = typeof commonjsGlobal === 'undefined' ? window : commonjsGlobal;

    //
    // The following constants are related to IEEE 754 limits.
    //
    var startdenom = Math.pow(width, chunks),
        significance = Math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1;


    var oldRandom = Math.random;

    //
    // seedrandom()
    // This is the seedrandom function described above.
    //
    module.exports = function(seed, options) {
      if (options && options.global === true) {
        options.global = false;
        Math.random = module.exports(seed, options);
        options.global = true;
        return Math.random;
      }
      var use_entropy = (options && options.entropy) || false;
      var key = [];

      // Flatten the seed string or build one from local entropy if needed.
      var shortseed = mixkey(flatten(
        use_entropy ? [seed, tostring(pool)] :
        0 in arguments ? seed : autoseed(), 3), key);

      // Use the seed to initialize an ARC4 generator.
      var arc4 = new ARC4(key);

      // Mix the randomness into accumulated entropy.
      mixkey(tostring(arc4.S), pool);

      // Override Math.random

      // This function returns a random double in [0, 1) that contains
      // randomness in every bit of the mantissa of the IEEE 754 value.

      return function() {         // Closure to return a random double:
        var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
            d = startdenom,                 //   and denominator d = 2 ^ 48.
            x = 0;                          //   and no 'extra last byte'.
        while (n < significance) {          // Fill up all significant digits by
          n = (n + x) * width;              //   shifting numerator and
          d *= width;                       //   denominator and generating a
          x = arc4.g(1);                    //   new least-significant-byte.
        }
        while (n >= overflow) {             // To avoid rounding up, before adding
          n /= 2;                           //   last byte, shift everything
          d /= 2;                           //   right using integer Math until
          x >>>= 1;                         //   we have exactly the desired bits.
        }
        return (n + x) / d;                 // Form the number within [0, 1).
      };
    };

    module.exports.resetGlobal = function () {
      Math.random = oldRandom;
    };

    //
    // ARC4
    //
    // An ARC4 implementation.  The constructor takes a key in the form of
    // an array of at most (width) integers that should be 0 <= x < (width).
    //
    // The g(count) method returns a pseudorandom integer that concatenates
    // the next (count) outputs from ARC4.  Its return value is a number x
    // that is in the range 0 <= x < (width ^ count).
    //
    /** @constructor */
    function ARC4(key) {
      var t, keylen = key.length,
          me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

      // The empty key [] is treated as [0].
      if (!keylen) { key = [keylen++]; }

      // Set up S using the standard key scheduling algorithm.
      while (i < width) {
        s[i] = i++;
      }
      for (i = 0; i < width; i++) {
        s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
        s[j] = t;
      }

      // The "g" method returns the next (count) outputs as one number.
      (me.g = function(count) {
        // Using instance members instead of closure state nearly doubles speed.
        var t, r = 0,
            i = me.i, j = me.j, s = me.S;
        while (count--) {
          t = s[i = mask & (i + 1)];
          r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
        }
        me.i = i; me.j = j;
        return r;
        // For robust unpredictability discard an initial batch of values.
        // See http://www.rsa.com/rsalabs/node.asp?id=2009
      })(width);
    }

    //
    // flatten()
    // Converts an object tree to nested arrays of strings.
    //
    function flatten(obj, depth) {
      var result = [], typ = (typeof obj)[0], prop;
      if (depth && typ == 'o') {
        for (prop in obj) {
          try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
        }
      }
      return (result.length ? result : typ == 's' ? obj : obj + '\0');
    }

    //
    // mixkey()
    // Mixes a string seed into a key that is an array of integers, and
    // returns a shortened string seed that is equivalent to the result key.
    //
    function mixkey(seed, key) {
      var stringseed = seed + '', smear, j = 0;
      while (j < stringseed.length) {
        key[mask & j] =
          mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
      }
      return tostring(key);
    }

    //
    // autoseed()
    // Returns an object for autoseeding, using window.crypto if available.
    //
    /** @param {Uint8Array=} seed */
    function autoseed(seed) {
      try {
        GLOBAL.crypto.getRandomValues(seed = new Uint8Array(width));
        return tostring(seed);
      } catch (e) {
        return [+new Date, GLOBAL, GLOBAL.navigator && GLOBAL.navigator.plugins,
                GLOBAL.screen, tostring(pool)];
      }
    }

    //
    // tostring()
    // Converts an array of charcodes to a string
    //
    function tostring(a) {
      return String.fromCharCode.apply(0, a);
    }

    //
    // When seedrandom.js is loaded, we immediately mix a few bits
    // from the built-in RNG into the entropy pool.  Because we do
    // not want to intefere with determinstic PRNG state later,
    // seedrandom will not call Math.random on its own again after
    // initialization.
    //
    mixkey(Math.random(), pool);
    });
    var seedRandom_1 = seedRandom.resetGlobal;

    var createFineStructure = numberFactory('fineStructure', 7.2973525693e-3);
    var createWeakMixingAngle = numberFactory('weakMixingAngle', 0.22290);
    var createEfimovFactor = numberFactory('efimovFactor', 22.7); // Physico-chemical constants
    var createSackurTetrode = numberFactory('sackurTetrode', -1.16487052358);
    // either a number or BigNumber depending on the configuration


    function numberFactory(name, value) {
      var dependencies = ['config', 'BigNumber'];
      return factory(name, dependencies, function (_ref2) {
        var config = _ref2.config,
            BigNumber = _ref2.BigNumber;
        return config.number === 'BigNumber' ? new BigNumber(value) : value;
      });
    }

    /**
     * THIS FILE IS AUTO-GENERATED
     * DON'T MAKE CHANGES HERE
     */
    var Complex$1 =
    /* #__PURE__ */
    createComplexClass({});
    var BigNumber =
    /* #__PURE__ */
    createBigNumberClass({
      config: config
    });
    var Matrix =
    /* #__PURE__ */
    createMatrixClass({});
    var Fraction$1 =
    /* #__PURE__ */
    createFractionClass({});
    var DenseMatrix =
    /* #__PURE__ */
    createDenseMatrixClass({
      Matrix: Matrix
    });
    var typed =
    /* #__PURE__ */
    createTyped({
      BigNumber: BigNumber,
      Complex: Complex$1,
      DenseMatrix: DenseMatrix,
      Fraction: Fraction$1
    });
    var isInteger$1 =
    /* #__PURE__ */
    createIsInteger({
      typed: typed
    });
    var isNaN$1 =
    /* #__PURE__ */
    createIsNaN({
      typed: typed
    });
    var equalScalar =
    /* #__PURE__ */
    createEqualScalar({
      config: config,
      typed: typed
    });
    var number =
    /* #__PURE__ */
    createNumber({
      typed: typed
    });
    var apply =
    /* #__PURE__ */
    createApply({
      isInteger: isInteger$1,
      typed: typed
    });
    var multiplyScalar =
    /* #__PURE__ */
    createMultiplyScalar({
      typed: typed
    });
    var fraction$1 =
    /* #__PURE__ */
    createFraction({
      Fraction: Fraction$1,
      typed: typed
    });
    var unaryMinus =
    /* #__PURE__ */
    createUnaryMinus({
      typed: typed
    });
    var addScalar =
    /* #__PURE__ */
    createAddScalar({
      typed: typed
    });
    var SparseMatrix =
    /* #__PURE__ */
    createSparseMatrixClass({
      Matrix: Matrix,
      equalScalar: equalScalar,
      typed: typed
    });
    var matrix =
    /* #__PURE__ */
    createMatrix({
      DenseMatrix: DenseMatrix,
      Matrix: Matrix,
      SparseMatrix: SparseMatrix,
      typed: typed
    });
    var identity =
    /* #__PURE__ */
    createIdentity({
      BigNumber: BigNumber,
      DenseMatrix: DenseMatrix,
      SparseMatrix: SparseMatrix,
      config: config,
      matrix: matrix,
      typed: typed
    });
    var smaller =
    /* #__PURE__ */
    createSmaller({
      DenseMatrix: DenseMatrix,
      config: config,
      matrix: matrix,
      typed: typed
    });
    var larger =
    /* #__PURE__ */
    createLarger({
      DenseMatrix: DenseMatrix,
      config: config,
      matrix: matrix,
      typed: typed
    });
    var FibonacciHeap =
    /* #__PURE__ */
    createFibonacciHeapClass({
      larger: larger,
      smaller: smaller
    });
    var add$1 =
    /* #__PURE__ */
    createAdd({
      DenseMatrix: DenseMatrix,
      SparseMatrix: SparseMatrix,
      addScalar: addScalar,
      equalScalar: equalScalar,
      matrix: matrix,
      typed: typed
    });
    var abs$1 =
    /* #__PURE__ */
    createAbs({
      typed: typed
    });
    var multiply$1 =
    /* #__PURE__ */
    createMultiply({
      addScalar: addScalar,
      equalScalar: equalScalar,
      matrix: matrix,
      multiplyScalar: multiplyScalar,
      typed: typed
    });
    var Spa =
    /* #__PURE__ */
    createSpaClass({
      FibonacciHeap: FibonacciHeap,
      addScalar: addScalar,
      equalScalar: equalScalar
    });
    var bignumber =
    /* #__PURE__ */
    createBignumber({
      BigNumber: BigNumber,
      typed: typed
    });
    var transpose =
    /* #__PURE__ */
    createTranspose({
      matrix: matrix,
      typed: typed
    });
    var numeric =
    /* #__PURE__ */
    createNumeric({
      bignumber: bignumber,
      fraction: fraction$1,
      number: number
    });
    var subtract$2 =
    /* #__PURE__ */
    createSubtract({
      DenseMatrix: DenseMatrix,
      addScalar: addScalar,
      equalScalar: equalScalar,
      matrix: matrix,
      typed: typed,
      unaryMinus: unaryMinus
    });
    var divideScalar =
    /* #__PURE__ */
    createDivideScalar({
      numeric: numeric,
      typed: typed
    });
    var lup =
    /* #__PURE__ */
    createLup({
      DenseMatrix: DenseMatrix,
      Spa: Spa,
      SparseMatrix: SparseMatrix,
      abs: abs$1,
      addScalar: addScalar,
      divideScalar: divideScalar,
      equalScalar: equalScalar,
      larger: larger,
      matrix: matrix,
      multiplyScalar: multiplyScalar,
      subtract: subtract$2,
      typed: typed,
      unaryMinus: unaryMinus
    });
    var det =
    /* #__PURE__ */
    createDet({
      lup: lup,
      matrix: matrix,
      multiply: multiply$1,
      subtract: subtract$2,
      typed: typed,
      unaryMinus: unaryMinus
    });
    var inv =
    /* #__PURE__ */
    createInv({
      abs: abs$1,
      addScalar: addScalar,
      det: det,
      divideScalar: divideScalar,
      identity: identity,
      matrix: matrix,
      multiply: multiply$1,
      typed: typed,
      unaryMinus: unaryMinus
    });
    var divide$2 =
    /* #__PURE__ */
    createDivide({
      divideScalar: divideScalar,
      equalScalar: equalScalar,
      inv: inv,
      matrix: matrix,
      multiply: multiply$1,
      typed: typed
    });
    var variance =
    /* #__PURE__ */
    createVariance({
      add: add$1,
      apply: apply,
      divide: divide$2,
      isNaN: isNaN$1,
      multiply: multiply$1,
      subtract: subtract$2,
      typed: typed
    });
    var mean =
    /* #__PURE__ */
    createMean({
      add: add$1,
      divide: divide$2,
      typed: typed
    });

    var DIRECTION;
    (function (DIRECTION) {
        DIRECTION[DIRECTION["UNKNOWN"] = 0] = "UNKNOWN";
        DIRECTION[DIRECTION["X"] = 1] = "X";
        DIRECTION[DIRECTION["Y"] = 2] = "Y";
    })(DIRECTION || (DIRECTION = {}));
    const defaultAxisOptions = {
        minDomain: -Infinity,
        maxDomain: Infinity,
        minDomainExtent: 0,
        maxDomainExtent: Infinity,
    };
    class ChartZoom {
        constructor(el, options) {
            this.el = el;
            this.majorDirection = DIRECTION.UNKNOWN;
            this.previousPoints = new Map();
            this.enabled = {
                [DIRECTION.X]: false,
                [DIRECTION.Y]: false,
            };
            this.updateCallbacks = [];
            el.addEventListener('touchstart', e => this.onTouchStart(e));
            el.addEventListener('touchend', e => this.onTouchEnd(e));
            el.addEventListener('touchcancel', e => this.onTouchEnd(e));
            el.addEventListener('touchmove', e => this.onTouchMove(e));
            options = (options !== null && options !== void 0 ? options : {});
            this.options = {
                x: options.x && Object.assign(Object.assign({}, defaultAxisOptions), options.x),
                y: options.y && Object.assign(Object.assign({}, defaultAxisOptions), options.y),
            };
            this.update();
        }
        update() {
            this.syncEnabled();
            this.syncTouchAction();
        }
        syncEnabled() {
            const dirs = [
                ['x', DIRECTION.X],
                ['y', DIRECTION.Y],
            ];
            for (const [opDir, dir] of dirs) {
                const op = this.options[opDir];
                if (!op) {
                    this.enabled[dir] = false;
                }
                else {
                    const domain = op.scale.domain().sort();
                    this.enabled[dir] = op.minDomain < domain[0] && domain[1] < op.maxDomain;
                }
            }
        }
        syncTouchAction() {
            const actions = [];
            if (!this.enabled[DIRECTION.X]) {
                actions.push('pan-x');
            }
            if (!this.enabled[DIRECTION.Y]) {
                actions.push('pan-y');
            }
            if (actions.length === 0) {
                actions.push('none');
            }
            this.el.style.touchAction = actions.join(' ');
        }
        touchPoints(touches) {
            const axis = [
                ['clientX', DIRECTION.X],
                ['clientY', DIRECTION.Y],
            ];
            let changed = false;
            const ts = [...touches];
            for (const [pProp, dir] of axis) {
                const op = this.dirOptions(dir);
                if (op === undefined) {
                    continue;
                }
                const scale = op.scale;
                const temp = ts.map(t => ({ current: t[pProp], previousPoint: this.previousPoints.get(t.identifier) }))
                    .filter(t => t.previousPoint !== undefined)
                    .map(({ current, previousPoint }) => ({ current, domain: +scale.invert(previousPoint[pProp]) }));
                if (temp.length === 0) {
                    continue;
                }
                let k, b;
                if (dir === this.majorDirection && temp.length >= 2) {
                    // linear least squares
                    // beta = (X^T X)^(-1) X^T Y
                    const X = matrix(temp.map(t => [1, t.current]));
                    const XT = transpose(X);
                    const Y = matrix(temp.map(t => t.domain));
                    const beta = multiply$1(multiply$1(inv(multiply$1(XT, X)), XT), Y);
                    b = beta.get([0]);
                    k = beta.get([1]);
                }
                else {
                    // Pan only
                    const domain = scale.domain();
                    const range = scale.range();
                    k = (+domain[1] - +domain[0]) / (range[1] - range[0]);
                    console.log(k);
                    b = mean(temp.map(t => t.domain - k * t.current));
                }
                const domain = scale.range().map(r => b + k * r);
                if (this.applyNewDomain(dir, domain)) {
                    changed = true;
                }
            }
            this.previousPoints = new Map(ts.map(t => [t.identifier, {
                    clientX: t.clientX,
                    clientY: t.clientY,
                }]));
            if (changed) {
                for (const cb of this.updateCallbacks) {
                    cb();
                }
            }
            return changed;
        }
        /**
         * @returns If domain changed
         */
        applyNewDomain(dir, domain) {
            const op = this.dirOptions(dir);
            const inExtent = domain[1] - domain[0];
            const extent = Math.min(op.maxDomainExtent, Math.max(op.minDomainExtent, inExtent));
            const deltaE = (extent - inExtent) / 2;
            domain[0] -= deltaE;
            domain[1] += deltaE;
            const deltaO = Math.min(Math.max(op.minDomain - domain[0], 0), op.maxDomain - domain[1]);
            domain[0] += deltaO;
            domain[1] += deltaO;
            const eps = extent * 1e-6;
            const previousDomain = op.scale.domain();
            op.scale.domain(domain);
            if (zip(domain, previousDomain).some(([d, pd]) => Math.abs(d - +pd) > eps)) {
                return true;
            }
            return false;
        }
        onUpdate(callback) {
            this.updateCallbacks.push(callback);
        }
        dirOptions(dir) {
            return {
                [DIRECTION.X]: this.options.x,
                [DIRECTION.Y]: this.options.y,
            }[dir];
        }
        onTouchStart(event) {
            if (this.majorDirection === DIRECTION.UNKNOWN && event.touches.length >= 2) {
                const ts = [...event.touches];
                const varX = variance(ts.map(t => t.clientX));
                const varY = variance(ts.map(t => t.clientY));
                this.majorDirection = varX > varY ? DIRECTION.X : DIRECTION.Y;
                if (this.dirOptions(this.majorDirection) === undefined) {
                    this.majorDirection = DIRECTION.UNKNOWN;
                }
            }
            this.touchPoints(event.touches);
        }
        onTouchEnd(event) {
            if (event.touches.length === 0) {
                this.majorDirection = DIRECTION.UNKNOWN;
            }
            this.touchPoints(event.touches);
        }
        onTouchMove(event) {
            this.touchPoints(event.touches);
        }
    }

    const defaultOptions = {
        lineWidth: 1,
        backgroundColor: d3Color.rgb(255, 255, 255, 1),
        paddingTop: 10,
        paddingRight: 10,
        paddingLeft: 45,
        paddingBottom: 20,
        xRange: 'auto',
        yRange: 'auto',
        realTime: false,
        zoom: true,
        baseTime: 0,
    };
    const defaultSeriesOptions = {
        color: d3Color.rgb(0, 0, 0, 1),
        name: '',
    };
    class TimeChart {
        constructor(el, options) {
            var _a, _b, _c;
            this.el = el;
            const series = (_c = (_b = (_a = options) === null || _a === void 0 ? void 0 : _a.series) === null || _b === void 0 ? void 0 : _b.map(s => (Object.assign(Object.assign({ data: [] }, defaultSeriesOptions), s))), (_c !== null && _c !== void 0 ? _c : []));
            const resolvedOptions = Object.assign(Object.assign(Object.assign({}, defaultOptions), options), { series });
            this.options = resolvedOptions;
            this.model = new RenderModel(resolvedOptions);
            this.canvasLayer = new CanvasLayer(el, resolvedOptions, this.model);
            this.svgLayer = new SVGLayer(el, resolvedOptions, this.model);
            this.lineChartRenderer = new LineChartRenderer(this.model, this.canvasLayer.gl, resolvedOptions);
            this.onResize();
            window.addEventListener('resize', () => this.onResize());
            this.registerZoom();
        }
        registerZoom() {
            if (this.options.zoom) {
                const z = new ChartZoom(this.el, {
                    x: {
                        scale: this.model.xScale,
                        minDomain: 0,
                        maxDomain: (new Date(2100, 0, 1)).getTime(),
                        minDomainExtent: 50,
                        maxDomainExtent: 10 * 365 * 24 * 3600 * 1000,
                    }
                });
                this.model.onUpdate(() => z.update());
                z.onUpdate(() => {
                    this.options.xRange = null;
                    this.options.realTime = false;
                    this.update();
                });
            }
        }
        onResize() {
            const canvas = this.canvasLayer.canvas;
            this.model.resize(canvas.clientWidth, canvas.clientHeight);
            this.svgLayer.onResize();
            this.canvasLayer.onResize();
            this.lineChartRenderer.onResize(canvas.clientWidth, canvas.clientHeight);
            this.update();
        }
        update() {
            this.model.requestRedraw();
        }
    }

    return TimeChart;

})));
//# sourceMappingURL=timechart.umd.js.map
