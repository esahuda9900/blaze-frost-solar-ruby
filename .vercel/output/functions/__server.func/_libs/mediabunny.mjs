import { n as __exportAll } from "../_runtime.mjs";
//#region node_modules/mediabunny/dist/modules/src/misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
function assert(x) {
	if (!x) throw new Error("Assertion failed.");
}
var DEG_TO_RAD = Math.PI / 180;
var normalizeRotation = (rotation) => {
	const mappedRotation = (rotation % 360 + 360) % 360;
	if (mappedRotation === 0 || mappedRotation === 90 || mappedRotation === 180 || mappedRotation === 270) return mappedRotation;
	else throw new Error(`Invalid rotation ${rotation}.`);
};
var IDENTITY_MATRIX = [
	1,
	0,
	0,
	0,
	1,
	0,
	0,
	0,
	1
];
/**
* Applies a linear transformation (no translation) to a width-by-height frame about its center, with the result
* sitting in the positive quadrant.
*/
var centeredTransformationMatrix = (linear, width, height) => {
	const [a, b, , c, d] = linear;
	const transformedWidth = Math.abs(a) * width + Math.abs(c) * height;
	const transformedHeight = Math.abs(b) * width + Math.abs(d) * height;
	return multiplyMatrices(multiplyMatrices(translationMatrix(-width / 2, -height / 2), linear), translationMatrix(transformedWidth / 2, transformedHeight / 2));
};
var rotationMatrix = (rotationInDegrees) => {
	const theta = rotationInDegrees * DEG_TO_RAD;
	const cosTheta = Math.round(Math.cos(theta));
	const sinTheta = Math.round(Math.sin(theta));
	return [
		cosTheta,
		sinTheta,
		0,
		-sinTheta,
		cosTheta,
		0,
		0,
		0,
		1
	];
};
var translationMatrix = (x, y) => {
	return [
		1,
		0,
		0,
		0,
		1,
		0,
		x,
		y,
		1
	];
};
var scaleMatrix = (x, y) => {
	return [
		x,
		0,
		0,
		0,
		y,
		0,
		0,
		0,
		1
	];
};
/** Computes a * b. Since points are row vectors, this applies a first, then b. */
var multiplyMatrices = (a, b) => {
	const result = new Array(9);
	for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) result[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j];
	return result;
};
/**
* Composes two "rotate, then flip" transformations into one. A flip conjugates any rotation that follows it, meaning
* the second rotation flips direction if the first flip is set.
*/
var composeRotationAndFlip = (rotation1, flip1, rotation2, flip2) => {
	return {
		rotation: normalizeRotation(rotation1 + (flip1 ? -rotation2 : rotation2)),
		flip: flip1 !== flip2
	};
};
var last = (arr) => {
	return arr && arr[arr.length - 1];
};
var isU32 = (value) => {
	return value >= 0 && value < 2 ** 32;
};
var isI32 = (value) => {
	return value >= -(2 ** 31) && value < 2 ** 31;
};
/** Reads an exponential-Golomb universal code from a Bitstream.  */
var readExpGolomb = (bitstream) => {
	let leadingZeroBits = 0;
	while (bitstream.readBits(1) === 0 && leadingZeroBits < 32) leadingZeroBits++;
	if (leadingZeroBits >= 32) throw new Error("Invalid exponential-Golomb code.");
	return 2 ** leadingZeroBits - 1 + bitstream.readBits(leadingZeroBits);
};
/** Reads a signed exponential-Golomb universal code from a Bitstream. */
var readSignedExpGolomb = (bitstream) => {
	const codeNum = readExpGolomb(bitstream);
	return codeNum % 2 === 0 ? -(codeNum / 2) : (codeNum + 1) / 2;
};
var toUint8Array = (source) => {
	if (source.constructor === Uint8Array) return source;
	else if (ArrayBuffer.isView(source)) return new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
	else return new Uint8Array(source);
};
var toDataView = (source) => {
	if (source.constructor === DataView) return source;
	else if (ArrayBuffer.isView(source)) return new DataView(source.buffer, source.byteOffset, source.byteLength);
	else return new DataView(source);
};
var TextEncoder = typeof globalThis.TextEncoder !== "undefined" ? globalThis.TextEncoder : class TextEncoder {
	constructor() {
		this.encoding = "utf-8";
	}
	encode(input = "") {
		const bytes = new Uint8Array(3 * input.length);
		let n = 0;
		for (let i = 0; i < input.length; i++) {
			let c = input.charCodeAt(i);
			if (c < 128) bytes[n++] = c;
			else if (c < 2048) {
				bytes[n++] = 192 | c >> 6;
				bytes[n++] = 128 | c & 63;
			} else if (c < 55296 || c > 57343) {
				bytes[n++] = 224 | c >> 12;
				bytes[n++] = 128 | c >> 6 & 63;
				bytes[n++] = 128 | c & 63;
			} else {
				const next = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
				if (c < 56320 && next >= 56320 && next <= 57343) {
					c = 65536 + (c - 55296 << 10) + (next - 56320);
					i++;
					bytes[n++] = 240 | c >> 18;
					bytes[n++] = 128 | c >> 12 & 63;
					bytes[n++] = 128 | c >> 6 & 63;
					bytes[n++] = 128 | c & 63;
				} else {
					bytes[n++] = 239;
					bytes[n++] = 191;
					bytes[n++] = 189;
				}
			}
		}
		return bytes.slice(0, n);
	}
};
typeof globalThis.TextDecoder !== "undefined" && globalThis.TextDecoder;
var textEncoder = /* #__PURE__ */ new TextEncoder();
var COLOR_PRIMARIES_MAP = {
	bt709: 1,
	bt470bg: 5,
	smpte170m: 6,
	bt2020: 9,
	smpte432: 12
};
var TRANSFER_CHARACTERISTICS_MAP = {
	"bt709": 1,
	"smpte170m": 6,
	"linear": 8,
	"iec61966-2-1": 13,
	"pq": 16,
	"hlg": 18
};
var MATRIX_COEFFICIENTS_MAP = {
	"rgb": 0,
	"bt709": 1,
	"bt470bg": 5,
	"smpte170m": 6,
	"bt2020-ncl": 9
};
var colorSpaceIsEmpty = (colorSpace) => {
	return !colorSpace || colorSpace.primaries == null && colorSpace.transfer == null && colorSpace.matrix == null && colorSpace.fullRange == null;
};
var isAllowSharedBufferSource = (x) => {
	return x instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && x instanceof SharedArrayBuffer || ArrayBuffer.isView(x);
};
var AsyncMutex = class {
	constructor() {
		this.currentPromise = Promise.resolve();
		this.pending = 0;
	}
	async acquire() {
		let resolver;
		const nextPromise = new Promise((resolve) => {
			let resolved = false;
			resolver = () => {
				if (resolved) return;
				resolve();
				this.pending--;
				resolved = true;
			};
		});
		const currentPromiseAlias = this.currentPromise;
		this.currentPromise = nextPromise;
		this.pending++;
		await currentPromiseAlias;
		return resolver;
	}
};
var bytesToHexString = (bytes) => {
	return [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
};
var reverseBitsU32 = (x) => {
	x = x >> 1 & 1431655765 | (x & 1431655765) << 1;
	x = x >> 2 & 858993459 | (x & 858993459) << 2;
	x = x >> 4 & 252645135 | (x & 252645135) << 4;
	x = x >> 8 & 16711935 | (x & 16711935) << 8;
	x = x >> 16 & 65535 | (x & 65535) << 16;
	return x >>> 0;
};
/** Returns the largest index i such that val[i] <= key, or -1 if no such index exists. */
var binarySearchLessOrEqual = (arr, key, valueGetter) => {
	let low = 0;
	let high = arr.length - 1;
	let ans = -1;
	while (low <= high) {
		const mid = low + (high - low + 1) / 2 | 0;
		if (valueGetter(arr[mid]) <= key) {
			ans = mid;
			low = mid + 1;
		} else high = mid - 1;
	}
	return ans;
};
var promiseWithResolvers = () => {
	let resolve;
	let reject;
	return {
		promise: new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		}),
		resolve,
		reject
	};
};
var assertNever = (x) => {
	throw new Error(`Unexpected value: ${x}`);
};
var getUint24 = (view, byteOffset, littleEndian) => {
	const byte1 = view.getUint8(byteOffset);
	const byte2 = view.getUint8(byteOffset + 1);
	const byte3 = view.getUint8(byteOffset + 2);
	if (littleEndian) return byte1 | byte2 << 8 | byte3 << 16;
	else return byte1 << 16 | byte2 << 8 | byte3;
};
var setUint24 = (view, byteOffset, value, littleEndian) => {
	value = value >>> 0;
	value = value & 16777215;
	if (littleEndian) {
		view.setUint8(byteOffset, value & 255);
		view.setUint8(byteOffset + 1, value >>> 8 & 255);
		view.setUint8(byteOffset + 2, value >>> 16 & 255);
	} else {
		view.setUint8(byteOffset, value >>> 16 & 255);
		view.setUint8(byteOffset + 1, value >>> 8 & 255);
		view.setUint8(byteOffset + 2, value & 255);
	}
};
var setInt24 = (view, byteOffset, value, littleEndian) => {
	value = clamp(value, -8388608, 8388607);
	if (value < 0) value = value + 16777216 & 16777215;
	setUint24(view, byteOffset, value, littleEndian);
};
var clamp = (value, min, max) => {
	return Math.max(min, Math.min(max, value));
};
var lerp = (from, to, t) => {
	return from + (to - from) * t;
};
var roundToMultiple = (value, multiple) => {
	return Math.round(value / multiple) * multiple;
};
var roundToDivisor = (value, multiple) => {
	return Math.round(value * multiple) / multiple;
};
var floorToDivisor = (value, multiple) => {
	return Math.floor(value * multiple) / multiple;
};
var popcount = (value) => {
	let count = 0;
	while (value !== 0) {
		value &= value - 1;
		count++;
	}
	return count;
};
var ISO_639_2_REGEX = /^[a-z]{3}$/;
var isIso639Dash2LanguageCode = (x) => {
	return ISO_639_2_REGEX.test(x);
};
var SECOND_TO_MICROSECOND_FACTOR = 1e6 * (1 + Number.EPSILON);
var computeRationalApproximation = (x, maxDenominator) => {
	const sign = x < 0 ? -1 : 1;
	x = Math.abs(x);
	let prevNumerator = 0, prevDenominator = 1;
	let currNumerator = 1, currDenominator = 0;
	let remainder = x;
	while (true) {
		const integer = Math.floor(remainder);
		const nextNumerator = integer * currNumerator + prevNumerator;
		const nextDenominator = integer * currDenominator + prevDenominator;
		if (nextDenominator > maxDenominator) return {
			num: sign * currNumerator,
			den: currDenominator
		};
		prevNumerator = currNumerator;
		prevDenominator = currDenominator;
		currNumerator = nextNumerator;
		currDenominator = nextDenominator;
		remainder = 1 / (remainder - integer);
		if (!isFinite(remainder)) break;
	}
	return {
		num: sign * currNumerator,
		den: currDenominator
	};
};
var CallSerializer = class {
	constructor() {
		this.currentPromise = Promise.resolve();
	}
	call(fn) {
		return this.currentPromise = this.currentPromise.then(fn);
	}
};
var isWebKitCache = null;
var isWebKit = () => {
	if (isWebKitCache !== null) return isWebKitCache;
	return isWebKitCache = !!(typeof navigator !== "undefined" && (navigator.vendor?.match(/apple/i) || /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent) || /\b(iPad|iPhone|iPod)\b/.test(navigator.userAgent)));
};
var isFirefoxCache = null;
var isFirefox = () => {
	if (isFirefoxCache !== null) return isFirefoxCache;
	return isFirefoxCache = typeof navigator !== "undefined" && navigator.userAgent?.includes("Firefox");
};
var isChromiumCache = null;
var isChromium = () => {
	if (isChromiumCache !== null) return isChromiumCache;
	return isChromiumCache = !!(typeof navigator !== "undefined" && (navigator.vendor?.includes("Google Inc") || /Chrome/.test(navigator.userAgent)));
};
var chromiumVersionCache = null;
var getChromiumVersion = () => {
	if (chromiumVersionCache !== null) return chromiumVersionCache;
	if (typeof navigator === "undefined") return null;
	const match = /\bChrome\/(\d+)/.exec(navigator.userAgent);
	if (!match) return null;
	return chromiumVersionCache = Number(match[1]);
};
var missingWebCodecsClassMessage = (className) => {
	if (typeof globalThis.isSecureContext !== "undefined" && !globalThis.isSecureContext) return `${className} is not available in this environment; this may be because this page is running in an insecure context. Try serving your page over HTTPS or use localhost.`;
	return `${className} is not available in this environment.`;
};
var isCodecReclaimedError = (error) => {
	return error instanceof DOMException && error.name === "QuotaExceededError" && /reclaimed/i.test(error.message);
};
var NativePromiseConstructor = (/* #__PURE__ */ (async () => {})()).constructor;
/**
* Needed to properly deal with custom Promise implementations and because this is closer to how the JS spec does it.
*/
var isThenable = (value) => {
	if (value instanceof NativePromiseConstructor || value instanceof Promise) return true;
	return typeof value?.then === "function";
};
var keyValueIterator = function* (object) {
	for (const key in object) {
		const value = object[key];
		if (value === void 0) continue;
		yield {
			key,
			value
		};
	}
};
var polyfillSymbolDispose = () => {
	Symbol.dispose ??= Symbol("Symbol.dispose");
};
var isNumber = (x) => {
	return typeof x === "number" && !Number.isNaN(x);
};
var arrayArgmin = (array, getValue) => {
	let minIndex = -1;
	let minValue = Infinity;
	for (let i = 0; i < array.length; i++) {
		const value = getValue(array[i]);
		if (minIndex === -1 || value < minValue) {
			minValue = value;
			minIndex = i;
		}
	}
	return minIndex;
};
var simplifyRational = (rational) => {
	assert(Number.isInteger(rational.num));
	assert(Number.isInteger(rational.den));
	assert(rational.den !== 0);
	let a = Math.abs(rational.num);
	let b = Math.abs(rational.den);
	while (b !== 0) {
		const t = a % b;
		a = b;
		b = t;
	}
	const gcd = a || 1;
	return {
		num: rational.num / gcd,
		den: rational.den / gcd
	};
};
var validateRectangle = (rect, propertyPath) => {
	if (typeof rect !== "object" || !rect) throw new TypeError(`${propertyPath} must be an object.`);
	if (!Number.isInteger(rect.left) || rect.left < 0) throw new TypeError(`${propertyPath}.left must be a non-negative integer.`);
	if (!Number.isInteger(rect.top) || rect.top < 0) throw new TypeError(`${propertyPath}.top must be a non-negative integer.`);
	if (!Number.isInteger(rect.width) || rect.width < 0) throw new TypeError(`${propertyPath}.width must be a non-negative integer.`);
	if (!Number.isInteger(rect.height) || rect.height < 0) throw new TypeError(`${propertyPath}.height must be a non-negative integer.`);
};
var wait = (ms) => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};
var toArray = (x) => {
	if (Array.isArray(x)) return x;
	else return [x];
};
/**
* A class that manages event listeners and dispatches events to them.
*
* @group Miscellaneous
* @public
*/
var EventEmitter = class {
	constructor() {
		/** @internal */
		this._listeners = /* @__PURE__ */ new Map();
	}
	/** Registers a listener for the given event. Returns a function that, when called, removes the listener again. */
	on(event, listener, options) {
		if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
		const entry = {
			fn: listener,
			once: options?.once ?? false
		};
		this._listeners.get(event).add(entry);
		return () => {
			this._listeners.get(event)?.delete(entry);
		};
	}
	/** @internal */
	_emit(...args) {
		const [event, data] = args;
		const listeners = this._listeners.get(event);
		if (!listeners) return;
		for (const entry of listeners) {
			try {
				entry.fn(data);
			} catch (error) {
				console.error(error);
			}
			if (entry.once) listeners.delete(entry);
		}
	}
};
var isRecordStringString = (value) => {
	return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype && Object.values(value).every((x) => typeof x === "string");
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/logging.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Controls how much information Mediabunny prints to the console. Higher levels include all lower levels.
*
* @group Logging
* @public
*/
var LogLevel;
(function(LogLevel) {
	/** Nothing is printed to the console. */
	LogLevel[LogLevel["Silent"] = 0] = "Silent";
	/** Only errors are printed. */
	LogLevel[LogLevel["Errors"] = 1] = "Errors";
	/** Errors and warnings are printed. */
	LogLevel[LogLevel["Warnings"] = 2] = "Warnings";
	/** Errors, warnings, and informational messages are printed. */
	LogLevel[LogLevel["Info"] = 3] = "Info";
})(LogLevel || (LogLevel = {}));
/**
* Mediabunny's central logging singleton. Use {@link Logging.level} to control how much is printed to the console,
* and subscribe to log events using {@link Logging.on}.
*
* Having manual control over logging is useful for command-line applications where you want full say over the output.
*
* @group Logging
* @public
*/
var Logging = class Logging {
	constructor() {}
	/** The current log level. Defaults to {@link LogLevel.Info}. */
	static get level() {
		return Logging._level;
	}
	static set level(value) {
		if (value !== LogLevel.Silent && value !== LogLevel.Errors && value !== LogLevel.Warnings && value !== LogLevel.Info) throw new TypeError("Invalid log level. Use one of the values of the LogLevel enum.");
		Logging._level = value;
	}
	/** @internal */
	static get _emitter() {
		return Logging._emitterInstance ??= new EventEmitter();
	}
	/** Registers a listener for a log event. Returns a function that, when called, removes the listener again. */
	static on(event, listener, options) {
		return Logging._emitter.on(event, listener, options);
	}
	/** @internal */
	static _error(...args) {
		Logging._emitter._emit("error", args);
		if (Logging._level >= LogLevel.Errors) console.error(...args);
	}
	/** @internal */
	static _warn(...args) {
		Logging._emitter._emit("warn", args);
		if (Logging._level >= LogLevel.Warnings) console.warn(...args);
	}
	/** @internal */
	static _info(...args) {
		Logging._emitter._emit("info", args);
		if (Logging._level >= LogLevel.Info) console.info(...args);
	}
};
/** @internal */
Logging._level = LogLevel.Info;
/** @internal */
Logging._emitterInstance = null;
//#endregion
//#region node_modules/mediabunny/dist/modules/src/metadata.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Image data with additional metadata.
*
* @group Metadata tags
* @public
*/
var RichImageData = class {
	/** Creates a new {@link RichImageData}. */
	constructor(data, mimeType) {
		this.data = data;
		this.mimeType = mimeType;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (typeof mimeType !== "string") throw new TypeError("mimeType must be a string.");
	}
};
/**
* A file attached to a media file.
*
* @group Metadata tags
* @public
*/
var AttachedFile = class {
	/** Creates a new {@link AttachedFile}. */
	constructor(data, mimeType, name, description) {
		this.data = data;
		this.mimeType = mimeType;
		this.name = name;
		this.description = description;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (mimeType !== void 0 && typeof mimeType !== "string") throw new TypeError("mimeType, when provided, must be a string.");
		if (name !== void 0 && typeof name !== "string") throw new TypeError("name, when provided, must be a string.");
		if (description !== void 0 && typeof description !== "string") throw new TypeError("description, when provided, must be a string.");
	}
};
var validateMetadataTags = (tags) => {
	if (!tags || typeof tags !== "object") throw new TypeError("tags must be an object.");
	if (tags.title !== void 0 && typeof tags.title !== "string") throw new TypeError("tags.title, when provided, must be a string.");
	if (tags.description !== void 0 && typeof tags.description !== "string") throw new TypeError("tags.description, when provided, must be a string.");
	if (tags.artist !== void 0 && typeof tags.artist !== "string") throw new TypeError("tags.artist, when provided, must be a string.");
	if (tags.album !== void 0 && typeof tags.album !== "string") throw new TypeError("tags.album, when provided, must be a string.");
	if (tags.albumArtist !== void 0 && typeof tags.albumArtist !== "string") throw new TypeError("tags.albumArtist, when provided, must be a string.");
	if (tags.trackNumber !== void 0 && (!Number.isInteger(tags.trackNumber) || tags.trackNumber <= 0)) throw new TypeError("tags.trackNumber, when provided, must be a positive integer.");
	if (tags.tracksTotal !== void 0 && (!Number.isInteger(tags.tracksTotal) || tags.tracksTotal <= 0)) throw new TypeError("tags.tracksTotal, when provided, must be a positive integer.");
	if (tags.discNumber !== void 0 && (!Number.isInteger(tags.discNumber) || tags.discNumber <= 0)) throw new TypeError("tags.discNumber, when provided, must be a positive integer.");
	if (tags.discsTotal !== void 0 && (!Number.isInteger(tags.discsTotal) || tags.discsTotal <= 0)) throw new TypeError("tags.discsTotal, when provided, must be a positive integer.");
	if (tags.genre !== void 0 && typeof tags.genre !== "string") throw new TypeError("tags.genre, when provided, must be a string.");
	if (tags.date !== void 0 && (!(tags.date instanceof Date) || Number.isNaN(tags.date.getTime()))) throw new TypeError("tags.date, when provided, must be a valid Date.");
	if (tags.creationTime !== void 0 && tags.creationTime !== null && (!(tags.creationTime instanceof Date) || Number.isNaN(tags.creationTime.getTime()))) throw new TypeError("tags.creationTime, when provided, must be a valid Date or null.");
	if (tags.beatsPerMinute !== void 0 && (!Number.isInteger(tags.beatsPerMinute) || tags.beatsPerMinute <= 0)) throw new TypeError("tags.beatsPerMinute, when provided, must be a positive integer.");
	if (tags.lyrics !== void 0 && typeof tags.lyrics !== "string") throw new TypeError("tags.lyrics, when provided, must be a string.");
	if (tags.images !== void 0) {
		if (!Array.isArray(tags.images)) throw new TypeError("tags.images, when provided, must be an array.");
		for (const image of tags.images) {
			if (!image || typeof image !== "object") throw new TypeError("Each image in tags.images must be an object.");
			if (!(image.data instanceof Uint8Array)) throw new TypeError("Each image.data must be a Uint8Array.");
			if (typeof image.mimeType !== "string") throw new TypeError("Each image.mimeType must be a string.");
			if (![
				"coverFront",
				"coverBack",
				"unknown"
			].includes(image.kind)) throw new TypeError("Each image.kind must be 'coverFront', 'coverBack', or 'unknown'.");
		}
	}
	if (tags.comment !== void 0 && typeof tags.comment !== "string") throw new TypeError("tags.comment, when provided, must be a string.");
	if (tags.raw !== void 0) {
		if (!tags.raw || typeof tags.raw !== "object") throw new TypeError("tags.raw, when provided, must be an object.");
		for (const value of Object.values(tags.raw)) if (value !== null && typeof value !== "string" && !(Array.isArray(value) && value.every((x) => typeof x === "string")) && !(value instanceof Uint8Array) && !(Array.isArray(value) && value.every((x) => x instanceof Uint8Array)) && !(value instanceof RichImageData) && !(value instanceof AttachedFile) && !isRecordStringString(value)) throw new TypeError("Each value in tags.raw must be a string, string array, Uint8Array, Uint8Array array, RichImageData, AttachedFile, Record<string, string>, or null.");
	}
};
var validateTrackDisposition = (disposition) => {
	if (!disposition || typeof disposition !== "object") throw new TypeError("disposition must be an object.");
	if (disposition.default !== void 0 && typeof disposition.default !== "boolean") throw new TypeError("disposition.default must be a boolean.");
	if (disposition.primary !== void 0 && typeof disposition.primary !== "boolean") throw new TypeError("disposition.primary must be a boolean.");
	if (disposition.forced !== void 0 && typeof disposition.forced !== "boolean") throw new TypeError("disposition.forced must be a boolean.");
	if (disposition.original !== void 0 && typeof disposition.original !== "boolean") throw new TypeError("disposition.original must be a boolean.");
	if (disposition.commentary !== void 0 && typeof disposition.commentary !== "boolean") throw new TypeError("disposition.commentary must be a boolean.");
	if (disposition.hearingImpaired !== void 0 && typeof disposition.hearingImpaired !== "boolean") throw new TypeError("disposition.hearingImpaired must be a boolean.");
	if (disposition.visuallyImpaired !== void 0 && typeof disposition.visuallyImpaired !== "boolean") throw new TypeError("disposition.visuallyImpaired must be a boolean.");
};
//#endregion
//#region node_modules/mediabunny/dist/modules/shared/bitstream.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Bitstream = class Bitstream {
	constructor(bytes) {
		this.bytes = bytes;
		/** Current offset in bits. */
		this.pos = 0;
	}
	seekToByte(byteOffset) {
		this.pos = 8 * byteOffset;
	}
	readBit() {
		const byteIndex = Math.floor(this.pos / 8);
		const byte = this.bytes[byteIndex] ?? 0;
		const bitIndex = 7 - (this.pos & 7);
		const bit = (byte & 1 << bitIndex) >> bitIndex;
		this.pos++;
		return bit;
	}
	readBits(n) {
		if (n === 1) return this.readBit();
		let result = 0;
		for (let i = 0; i < n; i++) {
			result <<= 1;
			result |= this.readBit();
		}
		return result;
	}
	writeBits(n, value) {
		const end = this.pos + n;
		for (let i = this.pos; i < end; i++) {
			const byteIndex = Math.floor(i / 8);
			let byte = this.bytes[byteIndex];
			const bitIndex = 7 - (i & 7);
			byte &= ~(1 << bitIndex);
			byte |= (value & 1 << end - i - 1) >> end - i - 1 << bitIndex;
			this.bytes[byteIndex] = byte;
		}
		this.pos = end;
	}
	copyBits(n, other) {
		let i = 0;
		for (; i < n - 7; i += 8) this.writeBits(8, other.readBits(8));
		const leftover = n - i;
		if (leftover > 0) this.writeBits(leftover, other.readBits(leftover));
	}
	readAlignedByte() {
		if (this.pos % 8 !== 0) throw new Error("Bitstream is not byte-aligned.");
		const byteIndex = this.pos / 8;
		const byte = this.bytes[byteIndex] ?? 0;
		this.pos += 8;
		return byte;
	}
	skipBits(n) {
		this.pos += n;
	}
	getBitsLeft() {
		return this.bytes.length * 8 - this.pos;
	}
	clone() {
		const clone = new Bitstream(this.bytes);
		clone.pos = this.pos;
		return clone;
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/shared/aac-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var aacFrequencyTable = [
	96e3,
	88200,
	64e3,
	48e3,
	44100,
	32e3,
	24e3,
	22050,
	16e3,
	12e3,
	11025,
	8e3,
	7350
];
var aacChannelMap = [
	-1,
	1,
	2,
	3,
	4,
	5,
	6,
	8
];
var generalAudioObjectTypes = [
	1,
	2,
	3,
	4,
	6,
	7,
	17,
	19,
	20,
	21,
	22
];
var parseAacAudioSpecificConfig = (bytes) => {
	if (!bytes || bytes.byteLength < 2) throw new TypeError("AAC description must be at least 2 bytes long.");
	const bitstream = new Bitstream(bytes);
	const objectType = readAacObjectType(bitstream);
	const { frequencyIndex, sampleRate } = readAacSamplingFrequency(bitstream);
	const channelConfiguration = bitstream.readBits(4);
	let numberOfChannels = null;
	if (channelConfiguration >= 1 && channelConfiguration <= 7) numberOfChannels = aacChannelMap[channelConfiguration];
	let coreObjectType = objectType;
	let psPresent = false;
	let outputSampleRate = sampleRate;
	if (objectType === 5 || objectType === 29) {
		psPresent = objectType === 29;
		outputSampleRate = readAacSamplingFrequency(bitstream).sampleRate;
		coreObjectType = readAacObjectType(bitstream);
		if (coreObjectType === 22) bitstream.skipBits(4);
	}
	let frameLength = 1024;
	if (generalAudioObjectTypes.includes(coreObjectType)) frameLength = bitstream.readBits(1) ? 960 : 1024;
	if (objectType !== 5 && objectType !== 29) while (bitstream.getBitsLeft() > 15) {
		const searchStart = bitstream.pos;
		if (bitstream.readBits(11) !== 695) {
			bitstream.pos = searchStart + 1;
			continue;
		}
		if (readAacObjectType(bitstream) === 5 && bitstream.readBits(1)) {
			outputSampleRate = readAacSamplingFrequency(bitstream).sampleRate;
			if (bitstream.getBitsLeft() > 11 && bitstream.readBits(11) === 1352) psPresent = !!bitstream.readBits(1);
		}
		break;
	}
	if (numberOfChannels !== null && numberOfChannels > 1) psPresent = false;
	return {
		objectType,
		coreObjectType,
		frequencyIndex,
		channelConfiguration,
		coreSampleRate: sampleRate,
		outputSampleRate,
		outputNumberOfChannels: psPresent && numberOfChannels === 1 ? 2 : numberOfChannels,
		frameLength
	};
};
var readAacObjectType = (bitstream) => {
	const objectType = bitstream.readBits(5);
	return objectType === 31 ? 32 + bitstream.readBits(6) : objectType;
};
var readAacSamplingFrequency = (bitstream) => {
	const frequencyIndex = bitstream.readBits(4);
	if (frequencyIndex === 15) return {
		frequencyIndex,
		sampleRate: bitstream.readBits(24)
	};
	return {
		frequencyIndex,
		sampleRate: frequencyIndex < aacFrequencyTable.length ? aacFrequencyTable[frequencyIndex] : null
	};
};
var buildAacAudioSpecificConfig = (config) => {
	const usesSbr = config.objectType === 5 || config.objectType === 29;
	const usesPs = config.objectType === 29;
	const coreSampleRate = usesSbr ? config.outputSampleRate / 2 : config.outputSampleRate;
	const coreNumberOfChannels = usesPs ? 1 : config.outputNumberOfChannels;
	const channelConfiguration = aacChannelMap.indexOf(coreNumberOfChannels);
	if (channelConfiguration === -1) throw new TypeError(`Unsupported number of channels: ${config.outputNumberOfChannels}`);
	let bitCount = 16;
	if (config.objectType >= 32) bitCount += 6;
	if (findAacFrequencyIndex(coreSampleRate) === 15) bitCount += 24;
	if (usesSbr) {
		bitCount += 9;
		if (findAacFrequencyIndex(config.outputSampleRate) === 15) bitCount += 24;
	}
	const byteCount = Math.ceil(bitCount / 8);
	const bytes = new Uint8Array(byteCount);
	const bitstream = new Bitstream(bytes);
	writeAacObjectType(bitstream, config.objectType);
	writeAacSamplingFrequency(bitstream, coreSampleRate);
	bitstream.writeBits(4, channelConfiguration);
	if (usesSbr) {
		writeAacSamplingFrequency(bitstream, config.outputSampleRate);
		writeAacObjectType(bitstream, 2);
	}
	bitstream.writeBits(3, 0);
	return bytes;
};
var writeAacObjectType = (bitstream, objectType) => {
	if (objectType < 32) bitstream.writeBits(5, objectType);
	else {
		bitstream.writeBits(5, 31);
		bitstream.writeBits(6, objectType - 32);
	}
};
var writeAacSamplingFrequency = (bitstream, sampleRate) => {
	const frequencyIndex = findAacFrequencyIndex(sampleRate);
	bitstream.writeBits(4, frequencyIndex);
	if (frequencyIndex === 15) bitstream.writeBits(24, sampleRate);
};
var findAacFrequencyIndex = (sampleRate) => {
	const index = aacFrequencyTable.indexOf(sampleRate);
	return index === -1 ? 15 : index;
};
//#endregion
//#region node_modules/mediabunny/dist/modules/shared/ac3-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/** Sample rates indexed by fscod (Table 4.1) */
var AC3_SAMPLE_RATES = [
	48e3,
	44100,
	32e3
];
/** E-AC-3 reduced sample rates for fscod2 per ATSC A/52:2018 */
var EAC3_REDUCED_SAMPLE_RATES = [
	24e3,
	22050,
	16e3
];
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var VERSIONED_NAME = `Mediabunny v1.65.1`;
//#endregion
//#region node_modules/mediabunny/dist/modules/src/codec-data.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var AvcNalUnitType;
(function(AvcNalUnitType) {
	AvcNalUnitType[AvcNalUnitType["NON_IDR_SLICE"] = 1] = "NON_IDR_SLICE";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPA"] = 2] = "SLICE_DPA";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPB"] = 3] = "SLICE_DPB";
	AvcNalUnitType[AvcNalUnitType["SLICE_DPC"] = 4] = "SLICE_DPC";
	AvcNalUnitType[AvcNalUnitType["IDR"] = 5] = "IDR";
	AvcNalUnitType[AvcNalUnitType["SEI"] = 6] = "SEI";
	AvcNalUnitType[AvcNalUnitType["SPS"] = 7] = "SPS";
	AvcNalUnitType[AvcNalUnitType["PPS"] = 8] = "PPS";
	AvcNalUnitType[AvcNalUnitType["AUD"] = 9] = "AUD";
	AvcNalUnitType[AvcNalUnitType["SPS_EXT"] = 13] = "SPS_EXT";
})(AvcNalUnitType || (AvcNalUnitType = {}));
var HevcNalUnitType;
(function(HevcNalUnitType) {
	HevcNalUnitType[HevcNalUnitType["RASL_N"] = 8] = "RASL_N";
	HevcNalUnitType[HevcNalUnitType["RASL_R"] = 9] = "RASL_R";
	HevcNalUnitType[HevcNalUnitType["BLA_W_LP"] = 16] = "BLA_W_LP";
	HevcNalUnitType[HevcNalUnitType["RSV_IRAP_VCL23"] = 23] = "RSV_IRAP_VCL23";
	HevcNalUnitType[HevcNalUnitType["VPS_NUT"] = 32] = "VPS_NUT";
	HevcNalUnitType[HevcNalUnitType["SPS_NUT"] = 33] = "SPS_NUT";
	HevcNalUnitType[HevcNalUnitType["PPS_NUT"] = 34] = "PPS_NUT";
	HevcNalUnitType[HevcNalUnitType["AUD_NUT"] = 35] = "AUD_NUT";
	HevcNalUnitType[HevcNalUnitType["PREFIX_SEI_NUT"] = 39] = "PREFIX_SEI_NUT";
	HevcNalUnitType[HevcNalUnitType["SUFFIX_SEI_NUT"] = 40] = "SUFFIX_SEI_NUT";
})(HevcNalUnitType || (HevcNalUnitType = {}));
var iterateNalUnitsInAnnexB = function* (packetData) {
	let i = 0;
	let nalStart = -1;
	while (i < packetData.length - 2) {
		const zeroIndex = packetData.indexOf(0, i);
		if (zeroIndex === -1 || zeroIndex >= packetData.length - 2) break;
		i = zeroIndex;
		let startCodeLength = 0;
		if (i + 3 < packetData.length && packetData[i + 1] === 0 && packetData[i + 2] === 0 && packetData[i + 3] === 1) startCodeLength = 4;
		else if (packetData[i + 1] === 0 && packetData[i + 2] === 1) startCodeLength = 3;
		if (startCodeLength === 0) {
			i++;
			continue;
		}
		if (nalStart !== -1 && i > nalStart) yield {
			offset: nalStart,
			length: i - nalStart
		};
		nalStart = i + startCodeLength;
		i = nalStart;
	}
	if (nalStart !== -1 && nalStart < packetData.length) yield {
		offset: nalStart,
		length: packetData.length - nalStart
	};
};
var iterateNalUnitsInLengthPrefixed = function* (packetData, lengthSize) {
	let offset = 0;
	const dataView = new DataView(packetData.buffer, packetData.byteOffset, packetData.byteLength);
	while (offset + lengthSize <= packetData.length) {
		let nalUnitLength;
		if (lengthSize === 1) nalUnitLength = dataView.getUint8(offset);
		else if (lengthSize === 2) nalUnitLength = dataView.getUint16(offset, false);
		else if (lengthSize === 3) nalUnitLength = getUint24(dataView, offset, false);
		else {
			assert(lengthSize === 4);
			nalUnitLength = dataView.getUint32(offset, false);
		}
		offset += lengthSize;
		yield {
			offset,
			length: nalUnitLength
		};
		offset += nalUnitLength;
	}
};
var iterateAvcNalUnits = (packetData, decoderConfig) => {
	if (decoderConfig.description) return iterateNalUnitsInLengthPrefixed(packetData, (toUint8Array(decoderConfig.description)[4] & 3) + 1);
	else return iterateNalUnitsInAnnexB(packetData);
};
var extractNalUnitTypeForAvc = (byte) => {
	return byte & 31;
};
var removeEmulationPreventionBytes = (data) => {
	const result = new Uint8Array(data.length);
	const len = data.length;
	let resultLength = 0;
	for (let i = 0; i < len; i++) if (i + 2 < len && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 3) {
		result[resultLength++] = 0;
		result[resultLength++] = 0;
		i += 2;
	} else result[resultLength++] = data[i];
	return result.subarray(0, resultLength);
};
new Uint8Array([
	0,
	0,
	0,
	1
]);
var concatNalUnitsInLengthPrefixed = (nalUnits, lengthSize) => {
	const totalLength = nalUnits.reduce((a, b) => a + lengthSize + b.byteLength, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;
	for (const nalUnit of nalUnits) {
		const dataView = new DataView(result.buffer, result.byteOffset, result.byteLength);
		switch (lengthSize) {
			case 1:
				dataView.setUint8(offset, nalUnit.byteLength);
				break;
			case 2:
				dataView.setUint16(offset, nalUnit.byteLength, false);
				break;
			case 3:
				setUint24(dataView, offset, nalUnit.byteLength, false);
				break;
			case 4: dataView.setUint32(offset, nalUnit.byteLength, false);
		}
		offset += lengthSize;
		result.set(nalUnit, offset);
		offset += nalUnit.byteLength;
	}
	return result;
};
/** Builds an AvcDecoderConfigurationRecord from an AVC packet in Annex B format. */
var extractAvcDecoderConfigurationRecord = (packetData) => {
	try {
		const spsUnits = [];
		const ppsUnits = [];
		const spsExtUnits = [];
		for (const loc of iterateNalUnitsInAnnexB(packetData)) {
			const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
			const type = extractNalUnitTypeForAvc(nalUnit[0]);
			if (type === AvcNalUnitType.SPS && spsUnits.length < 31) spsUnits.push(nalUnit);
			else if (type === AvcNalUnitType.PPS && ppsUnits.length < 255) ppsUnits.push(nalUnit);
			else if (type === AvcNalUnitType.SPS_EXT && spsExtUnits.length < 255) spsExtUnits.push(nalUnit);
		}
		if (spsUnits.length === 0) return null;
		if (ppsUnits.length === 0) return null;
		const spsData = spsUnits[0];
		const spsInfo = parseAvcSps(spsData);
		if (!spsInfo) return null;
		const hasExtendedData = spsInfo.profileIdc === 100 || spsInfo.profileIdc === 110 || spsInfo.profileIdc === 122 || spsInfo.profileIdc === 144;
		return {
			configurationVersion: 1,
			avcProfileIndication: spsInfo.profileIdc,
			profileCompatibility: spsInfo.constraintFlags,
			avcLevelIndication: spsInfo.levelIdc,
			lengthSizeMinusOne: 3,
			sequenceParameterSets: spsUnits,
			pictureParameterSets: ppsUnits,
			chromaFormat: hasExtendedData ? spsInfo.chromaFormatIdc : null,
			bitDepthLumaMinus8: hasExtendedData ? spsInfo.bitDepthLumaMinus8 : null,
			bitDepthChromaMinus8: hasExtendedData ? spsInfo.bitDepthChromaMinus8 : null,
			sequenceParameterSetExt: hasExtendedData ? spsExtUnits : null
		};
	} catch (error) {
		Logging._error("Error building AVC Decoder Configuration Record:", error);
		return null;
	}
};
/** Serializes an AvcDecoderConfigurationRecord into the format specified in Section 5.3.3.1 of ISO 14496-15. */
var serializeAvcDecoderConfigurationRecord = (record) => {
	const bytes = [];
	bytes.push(record.configurationVersion);
	bytes.push(record.avcProfileIndication);
	bytes.push(record.profileCompatibility);
	bytes.push(record.avcLevelIndication);
	bytes.push(252 | record.lengthSizeMinusOne & 3);
	bytes.push(224 | record.sequenceParameterSets.length & 31);
	for (const sps of record.sequenceParameterSets) {
		const length = sps.byteLength;
		bytes.push(length >> 8);
		bytes.push(length & 255);
		for (let i = 0; i < length; i++) bytes.push(sps[i]);
	}
	bytes.push(record.pictureParameterSets.length);
	for (const pps of record.pictureParameterSets) {
		const length = pps.byteLength;
		bytes.push(length >> 8);
		bytes.push(length & 255);
		for (let i = 0; i < length; i++) bytes.push(pps[i]);
	}
	if ((record.avcProfileIndication === 100 || record.avcProfileIndication === 110 || record.avcProfileIndication === 122 || record.avcProfileIndication === 144) && record.chromaFormat !== null) {
		assert(record.bitDepthLumaMinus8 !== null);
		assert(record.bitDepthChromaMinus8 !== null);
		assert(record.sequenceParameterSetExt !== null);
		bytes.push(252 | record.chromaFormat & 3);
		bytes.push(248 | record.bitDepthLumaMinus8 & 7);
		bytes.push(248 | record.bitDepthChromaMinus8 & 7);
		bytes.push(record.sequenceParameterSetExt.length);
		for (const spsExt of record.sequenceParameterSetExt) {
			const length = spsExt.byteLength;
			bytes.push(length >> 8);
			bytes.push(length & 255);
			for (let i = 0; i < length; i++) bytes.push(spsExt[i]);
		}
	}
	return new Uint8Array(bytes);
};
/** Deserializes an AvcDecoderConfigurationRecord from the format specified in Section 5.3.3.1 of ISO 14496-15. */
var deserializeAvcDecoderConfigurationRecord = (data) => {
	try {
		const view = toDataView(data);
		let offset = 0;
		const configurationVersion = view.getUint8(offset++);
		const avcProfileIndication = view.getUint8(offset++);
		const profileCompatibility = view.getUint8(offset++);
		const avcLevelIndication = view.getUint8(offset++);
		const lengthSizeMinusOne = view.getUint8(offset++) & 3;
		const numOfSequenceParameterSets = view.getUint8(offset++) & 31;
		const sequenceParameterSets = [];
		for (let i = 0; i < numOfSequenceParameterSets; i++) {
			const length = view.getUint16(offset, false);
			offset += 2;
			sequenceParameterSets.push(data.subarray(offset, offset + length));
			offset += length;
		}
		const numOfPictureParameterSets = view.getUint8(offset++);
		const pictureParameterSets = [];
		for (let i = 0; i < numOfPictureParameterSets; i++) {
			const length = view.getUint16(offset, false);
			offset += 2;
			pictureParameterSets.push(data.subarray(offset, offset + length));
			offset += length;
		}
		const record = {
			configurationVersion,
			avcProfileIndication,
			profileCompatibility,
			avcLevelIndication,
			lengthSizeMinusOne,
			sequenceParameterSets,
			pictureParameterSets,
			chromaFormat: null,
			bitDepthLumaMinus8: null,
			bitDepthChromaMinus8: null,
			sequenceParameterSetExt: null
		};
		if ((avcProfileIndication === 100 || avcProfileIndication === 110 || avcProfileIndication === 122 || avcProfileIndication === 144) && offset + 4 <= data.length) {
			const chromaFormat = view.getUint8(offset++) & 3;
			const bitDepthLumaMinus8 = view.getUint8(offset++) & 7;
			const bitDepthChromaMinus8 = view.getUint8(offset++) & 7;
			const numOfSequenceParameterSetExt = view.getUint8(offset++);
			record.chromaFormat = chromaFormat;
			record.bitDepthLumaMinus8 = bitDepthLumaMinus8;
			record.bitDepthChromaMinus8 = bitDepthChromaMinus8;
			const sequenceParameterSetExt = [];
			for (let i = 0; i < numOfSequenceParameterSetExt; i++) {
				const length = view.getUint16(offset, false);
				offset += 2;
				sequenceParameterSetExt.push(data.subarray(offset, offset + length));
				offset += length;
			}
			record.sequenceParameterSetExt = sequenceParameterSetExt;
		}
		return record;
	} catch (error) {
		Logging._error("Error deserializing AVC Decoder Configuration Record:", error);
		return null;
	}
};
var AVC_HEVC_ASPECT_RATIO_IDC_TABLE = {
	1: {
		num: 1,
		den: 1
	},
	2: {
		num: 12,
		den: 11
	},
	3: {
		num: 10,
		den: 11
	},
	4: {
		num: 16,
		den: 11
	},
	5: {
		num: 40,
		den: 33
	},
	6: {
		num: 24,
		den: 11
	},
	7: {
		num: 20,
		den: 11
	},
	8: {
		num: 32,
		den: 11
	},
	9: {
		num: 80,
		den: 33
	},
	10: {
		num: 18,
		den: 11
	},
	11: {
		num: 15,
		den: 11
	},
	12: {
		num: 64,
		den: 33
	},
	13: {
		num: 160,
		den: 99
	},
	14: {
		num: 4,
		den: 3
	},
	15: {
		num: 3,
		den: 2
	},
	16: {
		num: 2,
		den: 1
	}
};
/** Parses an AVC SPS (Sequence Parameter Set) to extract basic information. */
var parseAvcSps = (sps) => {
	try {
		const emulationUnpreventedBytes = removeEmulationPreventionBytes(sps);
		const bitstream = new Bitstream(emulationUnpreventedBytes);
		bitstream.skipBits(1);
		bitstream.skipBits(2);
		if (bitstream.readBits(5) !== 7) return null;
		const profileIdc = bitstream.readAlignedByte();
		const constraintFlags = bitstream.readAlignedByte();
		const levelIdc = bitstream.readAlignedByte();
		readExpGolomb(bitstream);
		let chromaFormatIdc = 1;
		let bitDepthLumaMinus8 = 0;
		let bitDepthChromaMinus8 = 0;
		let separateColourPlaneFlag = 0;
		if (profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244 || profileIdc === 44 || profileIdc === 83 || profileIdc === 86 || profileIdc === 118 || profileIdc === 128) {
			chromaFormatIdc = readExpGolomb(bitstream);
			if (chromaFormatIdc === 3) separateColourPlaneFlag = bitstream.readBits(1);
			bitDepthLumaMinus8 = readExpGolomb(bitstream);
			bitDepthChromaMinus8 = readExpGolomb(bitstream);
			bitstream.skipBits(1);
			if (bitstream.readBits(1)) {
				for (let i = 0; i < (chromaFormatIdc !== 3 ? 8 : 12); i++) if (bitstream.readBits(1)) {
					const sizeOfScalingList = i < 6 ? 16 : 64;
					let lastScale = 8;
					let nextScale = 8;
					for (let j = 0; j < sizeOfScalingList; j++) {
						if (nextScale !== 0) {
							const deltaScale = readSignedExpGolomb(bitstream);
							nextScale = (lastScale + deltaScale + 256) % 256;
						}
						lastScale = nextScale === 0 ? lastScale : nextScale;
					}
				}
			}
		}
		readExpGolomb(bitstream);
		const picOrderCntType = readExpGolomb(bitstream);
		if (picOrderCntType === 0) readExpGolomb(bitstream);
		else if (picOrderCntType === 1) {
			bitstream.skipBits(1);
			readSignedExpGolomb(bitstream);
			readSignedExpGolomb(bitstream);
			const numRefFramesInPicOrderCntCycle = readExpGolomb(bitstream);
			for (let i = 0; i < numRefFramesInPicOrderCntCycle; i++) readSignedExpGolomb(bitstream);
		}
		readExpGolomb(bitstream);
		bitstream.skipBits(1);
		const picWidthInMbsMinus1 = readExpGolomb(bitstream);
		const picHeightInMapUnitsMinus1 = readExpGolomb(bitstream);
		const codedWidth = 16 * (picWidthInMbsMinus1 + 1);
		const codedHeight = 16 * (picHeightInMapUnitsMinus1 + 1);
		let displayWidth = codedWidth;
		let displayHeight = codedHeight;
		const frameMbsOnlyFlag = bitstream.readBits(1);
		if (!frameMbsOnlyFlag) bitstream.skipBits(1);
		bitstream.skipBits(1);
		if (bitstream.readBits(1)) {
			const frameCropLeftOffset = readExpGolomb(bitstream);
			const frameCropRightOffset = readExpGolomb(bitstream);
			const frameCropTopOffset = readExpGolomb(bitstream);
			const frameCropBottomOffset = readExpGolomb(bitstream);
			let cropUnitX;
			let cropUnitY;
			if ((separateColourPlaneFlag === 0 ? chromaFormatIdc : 0) === 0) {
				cropUnitX = 1;
				cropUnitY = 2 - frameMbsOnlyFlag;
			} else {
				const subWidthC = chromaFormatIdc === 3 ? 1 : 2;
				const subHeightC = chromaFormatIdc === 1 ? 2 : 1;
				cropUnitX = subWidthC;
				cropUnitY = subHeightC * (2 - frameMbsOnlyFlag);
			}
			displayWidth -= cropUnitX * (frameCropLeftOffset + frameCropRightOffset);
			displayHeight -= cropUnitY * (frameCropTopOffset + frameCropBottomOffset);
		}
		if (displayWidth <= 0 || displayHeight <= 0) return null;
		let colourPrimaries = 2;
		let transferCharacteristics = 2;
		let matrixCoefficients = 2;
		let fullRangeFlag = 0;
		let pixelAspectRatio = {
			num: 1,
			den: 1
		};
		let numReorderFrames = null;
		let maxDecFrameBuffering = null;
		let bitstreamRestrictionFlagBitOffset = null;
		let bitstreamRestrictionFlag = null;
		const vuiParametersFlagBitOffset = bitstream.pos;
		if (bitstream.readBits(1)) {
			if (bitstream.readBits(1)) {
				const aspectRatioIdc = bitstream.readBits(8);
				if (aspectRatioIdc === 255) pixelAspectRatio = {
					num: bitstream.readBits(16),
					den: bitstream.readBits(16)
				};
				else {
					const aspectRatio = AVC_HEVC_ASPECT_RATIO_IDC_TABLE[aspectRatioIdc];
					if (aspectRatio) pixelAspectRatio = aspectRatio;
				}
			}
			if (bitstream.readBits(1)) bitstream.skipBits(1);
			if (bitstream.readBits(1)) {
				bitstream.skipBits(3);
				fullRangeFlag = bitstream.readBits(1);
				if (bitstream.readBits(1)) {
					colourPrimaries = bitstream.readBits(8);
					transferCharacteristics = bitstream.readBits(8);
					matrixCoefficients = bitstream.readBits(8);
				}
			}
			if (bitstream.readBits(1)) {
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
			}
			if (bitstream.readBits(1)) {
				bitstream.skipBits(32);
				bitstream.skipBits(32);
				bitstream.skipBits(1);
			}
			const nalHrdParametersPresentFlag = bitstream.readBits(1);
			if (nalHrdParametersPresentFlag) skipAvcHrdParameters(bitstream);
			const vclHrdParametersPresentFlag = bitstream.readBits(1);
			if (vclHrdParametersPresentFlag) skipAvcHrdParameters(bitstream);
			if (nalHrdParametersPresentFlag || vclHrdParametersPresentFlag) bitstream.skipBits(1);
			bitstream.skipBits(1);
			bitstreamRestrictionFlagBitOffset = bitstream.pos;
			bitstreamRestrictionFlag = bitstream.readBits(1);
			if (bitstreamRestrictionFlag) {
				bitstream.skipBits(1);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				readExpGolomb(bitstream);
				numReorderFrames = Math.min(readExpGolomb(bitstream), 16);
				maxDecFrameBuffering = Math.min(readExpGolomb(bitstream), 16);
			}
		}
		if (numReorderFrames === null) {
			assert(maxDecFrameBuffering === null);
			const constraintSet3Flag = constraintFlags & 16;
			if ((profileIdc === 44 || profileIdc === 86 || profileIdc === 100 || profileIdc === 110 || profileIdc === 122 || profileIdc === 244) && constraintSet3Flag) {
				numReorderFrames = 0;
				maxDecFrameBuffering = 0;
			} else {
				const picWidthInMbs = picWidthInMbsMinus1 + 1;
				const picHeightInMapUnits = picHeightInMapUnitsMinus1 + 1;
				const frameHeightInMbs = (2 - frameMbsOnlyFlag) * picHeightInMapUnits;
				const levelInfo = AVC_LEVEL_TABLE.find((x) => x.level >= levelIdc) ?? last(AVC_LEVEL_TABLE);
				const maxDpbFrames = Math.min(Math.floor(levelInfo.maxDpbMbs / (picWidthInMbs * frameHeightInMbs)), 16);
				numReorderFrames = maxDpbFrames;
				maxDecFrameBuffering = maxDpbFrames;
			}
		}
		assert(maxDecFrameBuffering !== null);
		return {
			emulationUnpreventedBytes,
			profileIdc,
			constraintFlags,
			levelIdc,
			frameMbsOnlyFlag,
			chromaFormatIdc,
			bitDepthLumaMinus8,
			bitDepthChromaMinus8,
			codedWidth,
			codedHeight,
			displayWidth,
			displayHeight,
			pixelAspectRatio,
			colourPrimaries,
			matrixCoefficients,
			transferCharacteristics,
			fullRangeFlag,
			numReorderFrames,
			maxDecFrameBuffering,
			vuiParametersFlagBitOffset,
			bitstreamRestrictionFlagBitOffset,
			bitstreamRestrictionFlag
		};
	} catch (error) {
		Logging._error("Error parsing AVC SPS:", error);
		return null;
	}
};
var skipAvcHrdParameters = (bitstream) => {
	const cpb_cnt_minus1 = readExpGolomb(bitstream);
	bitstream.skipBits(4);
	bitstream.skipBits(4);
	for (let i = 0; i <= cpb_cnt_minus1; i++) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		bitstream.skipBits(1);
	}
	bitstream.skipBits(5);
	bitstream.skipBits(5);
	bitstream.skipBits(5);
	bitstream.skipBits(5);
};
var iterateHevcNalUnits = (packetData, decoderConfig) => {
	if (decoderConfig.description) return iterateNalUnitsInLengthPrefixed(packetData, (toUint8Array(decoderConfig.description)[21] & 3) + 1);
	else return iterateNalUnitsInAnnexB(packetData);
};
var extractNalUnitTypeForHevc = (byte) => {
	return byte >> 1 & 63;
};
/** Parses an HEVC SPS (Sequence Parameter Set) to extract video information. */
var parseHevcSps = (sps) => {
	try {
		const bitstream = new Bitstream(removeEmulationPreventionBytes(sps));
		bitstream.skipBits(16);
		bitstream.readBits(4);
		const spsMaxSubLayersMinus1 = bitstream.readBits(3);
		const spsTemporalIdNestingFlag = bitstream.readBits(1);
		const { general_profile_space, general_tier_flag, general_profile_idc, general_profile_compatibility_flags, general_constraint_indicator_flags, general_level_idc } = parseProfileTierLevel(bitstream, spsMaxSubLayersMinus1);
		readExpGolomb(bitstream);
		const chromaFormatIdc = readExpGolomb(bitstream);
		let separateColourPlaneFlag = 0;
		if (chromaFormatIdc === 3) separateColourPlaneFlag = bitstream.readBits(1);
		const picWidthInLumaSamples = readExpGolomb(bitstream);
		const picHeightInLumaSamples = readExpGolomb(bitstream);
		let displayWidth = picWidthInLumaSamples;
		let displayHeight = picHeightInLumaSamples;
		if (bitstream.readBits(1)) {
			const confWinLeftOffset = readExpGolomb(bitstream);
			const confWinRightOffset = readExpGolomb(bitstream);
			const confWinTopOffset = readExpGolomb(bitstream);
			const confWinBottomOffset = readExpGolomb(bitstream);
			let subWidthC = 1;
			let subHeightC = 1;
			const chromaArrayType = separateColourPlaneFlag === 0 ? chromaFormatIdc : 0;
			if (chromaArrayType === 1) {
				subWidthC = 2;
				subHeightC = 2;
			} else if (chromaArrayType === 2) {
				subWidthC = 2;
				subHeightC = 1;
			}
			displayWidth -= (confWinLeftOffset + confWinRightOffset) * subWidthC;
			displayHeight -= (confWinTopOffset + confWinBottomOffset) * subHeightC;
		}
		if (displayWidth <= 0 || displayHeight <= 0) return null;
		const bitDepthLumaMinus8 = readExpGolomb(bitstream);
		const bitDepthChromaMinus8 = readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		const startI = bitstream.readBits(1) ? 0 : spsMaxSubLayersMinus1;
		let spsMaxNumReorderPics = 0;
		for (let i = startI; i <= spsMaxSubLayersMinus1; i++) {
			readExpGolomb(bitstream);
			spsMaxNumReorderPics = readExpGolomb(bitstream);
			readExpGolomb(bitstream);
		}
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		if (bitstream.readBits(1)) {
			if (bitstream.readBits(1)) skipScalingListData(bitstream);
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		if (bitstream.readBits(1)) {
			bitstream.skipBits(4);
			bitstream.skipBits(4);
			readExpGolomb(bitstream);
			readExpGolomb(bitstream);
			bitstream.skipBits(1);
		}
		skipAllStRefPicSets(bitstream, readExpGolomb(bitstream));
		if (bitstream.readBits(1)) {
			const numLongTermRefPicsSps = readExpGolomb(bitstream);
			for (let i = 0; i < numLongTermRefPicsSps; i++) {
				readExpGolomb(bitstream);
				bitstream.skipBits(1);
			}
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		let colourPrimaries = 2;
		let transferCharacteristics = 2;
		let matrixCoefficients = 2;
		let fullRangeFlag = 0;
		let minSpatialSegmentationIdc = 0;
		let pixelAspectRatio = {
			num: 1,
			den: 1
		};
		if (bitstream.readBits(1)) {
			const vui = parseHevcVui(bitstream, spsMaxSubLayersMinus1);
			pixelAspectRatio = vui.pixelAspectRatio;
			colourPrimaries = vui.colourPrimaries;
			transferCharacteristics = vui.transferCharacteristics;
			matrixCoefficients = vui.matrixCoefficients;
			fullRangeFlag = vui.fullRangeFlag;
			minSpatialSegmentationIdc = vui.minSpatialSegmentationIdc;
		}
		return {
			displayWidth,
			displayHeight,
			pixelAspectRatio,
			colourPrimaries,
			transferCharacteristics,
			matrixCoefficients,
			fullRangeFlag,
			maxDecFrameBuffering: Math.min(spsMaxNumReorderPics + 1, 16),
			spsMaxSubLayersMinus1,
			spsTemporalIdNestingFlag,
			generalProfileSpace: general_profile_space,
			generalTierFlag: general_tier_flag,
			generalProfileIdc: general_profile_idc,
			generalProfileCompatibilityFlags: general_profile_compatibility_flags,
			generalConstraintIndicatorFlags: general_constraint_indicator_flags,
			generalLevelIdc: general_level_idc,
			chromaFormatIdc,
			bitDepthLumaMinus8,
			bitDepthChromaMinus8,
			minSpatialSegmentationIdc
		};
	} catch (error) {
		Logging._error("Error parsing HEVC SPS:", error);
		return null;
	}
};
/** Builds a HevcDecoderConfigurationRecord from an HEVC packet in Annex B format. */
var extractHevcDecoderConfigurationRecord = (packetData) => {
	try {
		const vpsUnits = [];
		const spsUnits = [];
		const ppsUnits = [];
		const seiUnits = [];
		const MAX_NAL_UNITS_PER_ARRAY = 65535;
		for (const loc of iterateNalUnitsInAnnexB(packetData)) {
			const nalUnit = packetData.subarray(loc.offset, loc.offset + loc.length);
			const type = extractNalUnitTypeForHevc(nalUnit[0]);
			if (type === HevcNalUnitType.VPS_NUT && vpsUnits.length < MAX_NAL_UNITS_PER_ARRAY) vpsUnits.push(nalUnit);
			else if (type === HevcNalUnitType.SPS_NUT && spsUnits.length < MAX_NAL_UNITS_PER_ARRAY) spsUnits.push(nalUnit);
			else if (type === HevcNalUnitType.PPS_NUT && ppsUnits.length < MAX_NAL_UNITS_PER_ARRAY) ppsUnits.push(nalUnit);
			else if ((type === HevcNalUnitType.PREFIX_SEI_NUT || type === HevcNalUnitType.SUFFIX_SEI_NUT) && seiUnits.length < MAX_NAL_UNITS_PER_ARRAY) seiUnits.push(nalUnit);
		}
		if (spsUnits.length === 0 || ppsUnits.length === 0) return null;
		const spsInfo = parseHevcSps(spsUnits[0]);
		if (!spsInfo) return null;
		let parallelismType = 0;
		if (ppsUnits.length > 0) {
			const pps = ppsUnits[0];
			const ppsBitstream = new Bitstream(removeEmulationPreventionBytes(pps));
			ppsBitstream.skipBits(16);
			readExpGolomb(ppsBitstream);
			readExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(3);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			readExpGolomb(ppsBitstream);
			readExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			if (ppsBitstream.readBits(1)) readExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			readSignedExpGolomb(ppsBitstream);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			ppsBitstream.skipBits(1);
			const tiles_enabled_flag = ppsBitstream.readBits(1);
			const entropy_coding_sync_enabled_flag = ppsBitstream.readBits(1);
			if (!tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 0;
			else if (tiles_enabled_flag && !entropy_coding_sync_enabled_flag) parallelismType = 2;
			else if (!tiles_enabled_flag && entropy_coding_sync_enabled_flag) parallelismType = 3;
			else parallelismType = 0;
		}
		const arrays = [
			...vpsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.VPS_NUT,
				nalUnits: vpsUnits
			}] : [],
			...spsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.SPS_NUT,
				nalUnits: spsUnits
			}] : [],
			...ppsUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: HevcNalUnitType.PPS_NUT,
				nalUnits: ppsUnits
			}] : [],
			...seiUnits.length ? [{
				arrayCompleteness: 1,
				nalUnitType: extractNalUnitTypeForHevc(seiUnits[0][0]),
				nalUnits: seiUnits
			}] : []
		];
		return {
			configurationVersion: 1,
			generalProfileSpace: spsInfo.generalProfileSpace,
			generalTierFlag: spsInfo.generalTierFlag,
			generalProfileIdc: spsInfo.generalProfileIdc,
			generalProfileCompatibilityFlags: spsInfo.generalProfileCompatibilityFlags,
			generalConstraintIndicatorFlags: spsInfo.generalConstraintIndicatorFlags,
			generalLevelIdc: spsInfo.generalLevelIdc,
			minSpatialSegmentationIdc: spsInfo.minSpatialSegmentationIdc,
			parallelismType,
			chromaFormatIdc: spsInfo.chromaFormatIdc,
			bitDepthLumaMinus8: spsInfo.bitDepthLumaMinus8,
			bitDepthChromaMinus8: spsInfo.bitDepthChromaMinus8,
			avgFrameRate: 0,
			constantFrameRate: 0,
			numTemporalLayers: spsInfo.spsMaxSubLayersMinus1 + 1,
			temporalIdNested: spsInfo.spsTemporalIdNestingFlag,
			lengthSizeMinusOne: 3,
			arrays
		};
	} catch (error) {
		Logging._error("Error building HEVC Decoder Configuration Record:", error);
		return null;
	}
};
var parseProfileTierLevel = (bitstream, maxNumSubLayersMinus1) => {
	const general_profile_space = bitstream.readBits(2);
	const general_tier_flag = bitstream.readBits(1);
	const general_profile_idc = bitstream.readBits(5);
	let general_profile_compatibility_flags = 0;
	for (let i = 0; i < 32; i++) general_profile_compatibility_flags = general_profile_compatibility_flags << 1 | bitstream.readBits(1);
	const general_constraint_indicator_flags = /* @__PURE__ */ new Uint8Array(6);
	for (let i = 0; i < 6; i++) general_constraint_indicator_flags[i] = bitstream.readBits(8);
	const general_level_idc = bitstream.readBits(8);
	const sub_layer_profile_present_flag = [];
	const sub_layer_level_present_flag = [];
	for (let i = 0; i < maxNumSubLayersMinus1; i++) {
		sub_layer_profile_present_flag.push(bitstream.readBits(1));
		sub_layer_level_present_flag.push(bitstream.readBits(1));
	}
	if (maxNumSubLayersMinus1 > 0) for (let i = maxNumSubLayersMinus1; i < 8; i++) bitstream.skipBits(2);
	for (let i = 0; i < maxNumSubLayersMinus1; i++) {
		if (sub_layer_profile_present_flag[i]) bitstream.skipBits(88);
		if (sub_layer_level_present_flag[i]) bitstream.skipBits(8);
	}
	return {
		general_profile_space,
		general_tier_flag,
		general_profile_idc,
		general_profile_compatibility_flags,
		general_constraint_indicator_flags,
		general_level_idc
	};
};
var skipScalingListData = (bitstream) => {
	for (let sizeId = 0; sizeId < 4; sizeId++) for (let matrixId = 0; matrixId < (sizeId === 3 ? 2 : 6); matrixId++) if (!bitstream.readBits(1)) readExpGolomb(bitstream);
	else {
		const coefNum = Math.min(64, 1 << 4 + (sizeId << 1));
		if (sizeId > 1) readSignedExpGolomb(bitstream);
		for (let i = 0; i < coefNum; i++) readSignedExpGolomb(bitstream);
	}
};
var skipAllStRefPicSets = (bitstream, num_short_term_ref_pic_sets) => {
	const NumDeltaPocs = [];
	for (let stRpsIdx = 0; stRpsIdx < num_short_term_ref_pic_sets; stRpsIdx++) NumDeltaPocs[stRpsIdx] = skipStRefPicSet(bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs);
};
var skipStRefPicSet = (bitstream, stRpsIdx, num_short_term_ref_pic_sets, NumDeltaPocs) => {
	let NumDeltaPocsThis = 0;
	let inter_ref_pic_set_prediction_flag = 0;
	let RefRpsIdx = 0;
	if (stRpsIdx !== 0) inter_ref_pic_set_prediction_flag = bitstream.readBits(1);
	if (inter_ref_pic_set_prediction_flag) {
		if (stRpsIdx === num_short_term_ref_pic_sets) RefRpsIdx = stRpsIdx - (readExpGolomb(bitstream) + 1);
		else RefRpsIdx = stRpsIdx - 1;
		bitstream.readBits(1);
		readExpGolomb(bitstream);
		const numDelta = NumDeltaPocs[RefRpsIdx] ?? 0;
		for (let j = 0; j <= numDelta; j++) if (!bitstream.readBits(1)) bitstream.readBits(1);
		NumDeltaPocsThis = NumDeltaPocs[RefRpsIdx];
	} else {
		const num_negative_pics = readExpGolomb(bitstream);
		const num_positive_pics = readExpGolomb(bitstream);
		for (let i = 0; i < num_negative_pics; i++) {
			readExpGolomb(bitstream);
			bitstream.readBits(1);
		}
		for (let i = 0; i < num_positive_pics; i++) {
			readExpGolomb(bitstream);
			bitstream.readBits(1);
		}
		NumDeltaPocsThis = num_negative_pics + num_positive_pics;
	}
	return NumDeltaPocsThis;
};
var parseHevcVui = (bitstream, sps_max_sub_layers_minus1) => {
	let colourPrimaries = 2;
	let transferCharacteristics = 2;
	let matrixCoefficients = 2;
	let fullRangeFlag = 0;
	let minSpatialSegmentationIdc = 0;
	let pixelAspectRatio = {
		num: 1,
		den: 1
	};
	if (bitstream.readBits(1)) {
		const aspect_ratio_idc = bitstream.readBits(8);
		if (aspect_ratio_idc === 255) pixelAspectRatio = {
			num: bitstream.readBits(16),
			den: bitstream.readBits(16)
		};
		else {
			const aspectRatio = AVC_HEVC_ASPECT_RATIO_IDC_TABLE[aspect_ratio_idc];
			if (aspectRatio) pixelAspectRatio = aspectRatio;
		}
	}
	if (bitstream.readBits(1)) bitstream.readBits(1);
	if (bitstream.readBits(1)) {
		bitstream.readBits(3);
		fullRangeFlag = bitstream.readBits(1);
		if (bitstream.readBits(1)) {
			colourPrimaries = bitstream.readBits(8);
			transferCharacteristics = bitstream.readBits(8);
			matrixCoefficients = bitstream.readBits(8);
		}
	}
	if (bitstream.readBits(1)) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	bitstream.readBits(1);
	bitstream.readBits(1);
	bitstream.readBits(1);
	if (bitstream.readBits(1)) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	if (bitstream.readBits(1)) {
		bitstream.readBits(32);
		bitstream.readBits(32);
		if (bitstream.readBits(1)) readExpGolomb(bitstream);
		if (bitstream.readBits(1)) skipHevcHrdParameters(bitstream, true, sps_max_sub_layers_minus1);
	}
	if (bitstream.readBits(1)) {
		bitstream.readBits(1);
		bitstream.readBits(1);
		bitstream.readBits(1);
		minSpatialSegmentationIdc = readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
	}
	return {
		pixelAspectRatio,
		colourPrimaries,
		transferCharacteristics,
		matrixCoefficients,
		fullRangeFlag,
		minSpatialSegmentationIdc
	};
};
var skipHevcHrdParameters = (bitstream, commonInfPresentFlag, maxNumSubLayersMinus1) => {
	let nal_hrd_parameters_present_flag = false;
	let vcl_hrd_parameters_present_flag = false;
	let sub_pic_hrd_params_present_flag = false;
	if (commonInfPresentFlag) {
		nal_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
		vcl_hrd_parameters_present_flag = bitstream.readBits(1) === 1;
		if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
			sub_pic_hrd_params_present_flag = bitstream.readBits(1) === 1;
			if (sub_pic_hrd_params_present_flag) {
				bitstream.readBits(8);
				bitstream.readBits(5);
				bitstream.readBits(1);
				bitstream.readBits(5);
			}
			bitstream.readBits(4);
			bitstream.readBits(4);
			if (sub_pic_hrd_params_present_flag) bitstream.readBits(4);
			bitstream.readBits(5);
			bitstream.readBits(5);
			bitstream.readBits(5);
		}
	}
	for (let i = 0; i <= maxNumSubLayersMinus1; i++) {
		const fixed_pic_rate_general_flag = bitstream.readBits(1) === 1;
		let fixed_pic_rate_within_cvs_flag = true;
		if (!fixed_pic_rate_general_flag) fixed_pic_rate_within_cvs_flag = bitstream.readBits(1) === 1;
		let low_delay_hrd_flag = false;
		if (fixed_pic_rate_within_cvs_flag) readExpGolomb(bitstream);
		else low_delay_hrd_flag = bitstream.readBits(1) === 1;
		let CpbCnt = 1;
		if (!low_delay_hrd_flag) CpbCnt = readExpGolomb(bitstream) + 1;
		if (nal_hrd_parameters_present_flag) skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
		if (vcl_hrd_parameters_present_flag) skipSubLayerHrdParameters(bitstream, CpbCnt, sub_pic_hrd_params_present_flag);
	}
};
var skipSubLayerHrdParameters = (bitstream, CpbCnt, sub_pic_hrd_params_present_flag) => {
	for (let i = 0; i < CpbCnt; i++) {
		readExpGolomb(bitstream);
		readExpGolomb(bitstream);
		if (sub_pic_hrd_params_present_flag) {
			readExpGolomb(bitstream);
			readExpGolomb(bitstream);
		}
		bitstream.readBits(1);
	}
};
/** Serializes an HevcDecoderConfigurationRecord into the format specified in Section 8.3.3.1 of ISO 14496-15. */
var serializeHevcDecoderConfigurationRecord = (record) => {
	const bytes = [];
	bytes.push(record.configurationVersion);
	bytes.push((record.generalProfileSpace & 3) << 6 | (record.generalTierFlag & 1) << 5 | record.generalProfileIdc & 31);
	bytes.push(record.generalProfileCompatibilityFlags >>> 24 & 255);
	bytes.push(record.generalProfileCompatibilityFlags >>> 16 & 255);
	bytes.push(record.generalProfileCompatibilityFlags >>> 8 & 255);
	bytes.push(record.generalProfileCompatibilityFlags & 255);
	bytes.push(...record.generalConstraintIndicatorFlags);
	bytes.push(record.generalLevelIdc & 255);
	bytes.push(240 | record.minSpatialSegmentationIdc >> 8 & 15);
	bytes.push(record.minSpatialSegmentationIdc & 255);
	bytes.push(252 | record.parallelismType & 3);
	bytes.push(252 | record.chromaFormatIdc & 3);
	bytes.push(248 | record.bitDepthLumaMinus8 & 7);
	bytes.push(248 | record.bitDepthChromaMinus8 & 7);
	bytes.push(record.avgFrameRate >> 8 & 255);
	bytes.push(record.avgFrameRate & 255);
	bytes.push((record.constantFrameRate & 3) << 6 | (record.numTemporalLayers & 7) << 3 | (record.temporalIdNested & 1) << 2 | record.lengthSizeMinusOne & 3);
	bytes.push(record.arrays.length & 255);
	for (const arr of record.arrays) {
		bytes.push((arr.arrayCompleteness & 1) << 7 | 0 | arr.nalUnitType & 63);
		bytes.push(arr.nalUnits.length >> 8 & 255);
		bytes.push(arr.nalUnits.length & 255);
		for (const nal of arr.nalUnits) {
			bytes.push(nal.length >> 8 & 255);
			bytes.push(nal.length & 255);
			for (let i = 0; i < nal.length; i++) bytes.push(nal[i]);
		}
	}
	return new Uint8Array(bytes);
};
var HevcNaluOrderState;
(function(HevcNaluOrderState) {
	HevcNaluOrderState[HevcNaluOrderState["audAllowed"] = 0] = "audAllowed";
	HevcNaluOrderState[HevcNaluOrderState["beforeFirstVcl"] = 1] = "beforeFirstVcl";
	HevcNaluOrderState[HevcNaluOrderState["afterFirstVcl"] = 2] = "afterFirstVcl";
	HevcNaluOrderState[HevcNaluOrderState["eoBitstreamAllowed"] = 3] = "eoBitstreamAllowed";
	HevcNaluOrderState[HevcNaluOrderState["noMoreDataAllowed"] = 4] = "noMoreDataAllowed";
})(HevcNaluOrderState || (HevcNaluOrderState = {}));
var VP9_COLOR_SPACE_TABLE = {
	1: {
		colourPrimaries: 5,
		transferCharacteristics: 6,
		matrixCoefficients: 5
	},
	2: {
		colourPrimaries: 1,
		transferCharacteristics: 1,
		matrixCoefficients: 1
	},
	3: {
		colourPrimaries: 6,
		transferCharacteristics: 6,
		matrixCoefficients: 6
	},
	4: {
		colourPrimaries: 7,
		transferCharacteristics: 7,
		matrixCoefficients: 7
	},
	5: {
		colourPrimaries: 9,
		transferCharacteristics: 14,
		matrixCoefficients: 9
	},
	7: {
		colourPrimaries: 1,
		transferCharacteristics: 13,
		matrixCoefficients: 0
	}
};
var extractVp9CodecInfoFromPacket = (packet) => {
	const bitstream = new Bitstream(packet);
	if (bitstream.readBits(2) !== 2) return null;
	const profileLowBit = bitstream.readBits(1);
	const profile = (bitstream.readBits(1) << 1) + profileLowBit;
	if (profile === 3) bitstream.skipBits(1);
	if (bitstream.readBits(1) === 1) return null;
	if (bitstream.readBits(1) !== 0) return null;
	bitstream.skipBits(2);
	if (bitstream.readBits(24) !== 4817730) return null;
	let bitDepth = 8;
	if (profile >= 2) bitDepth = bitstream.readBits(1) ? 12 : 10;
	const colorSpace = bitstream.readBits(3);
	let chromaSubsampling = 0;
	let videoFullRangeFlag = 0;
	if (colorSpace !== 7) {
		videoFullRangeFlag = bitstream.readBits(1);
		if (profile === 1 || profile === 3) {
			const subsamplingX = bitstream.readBits(1);
			const subsamplingY = bitstream.readBits(1);
			chromaSubsampling = !subsamplingX && !subsamplingY ? 3 : subsamplingX && !subsamplingY ? 2 : 1;
			bitstream.skipBits(1);
		} else chromaSubsampling = 1;
	} else {
		chromaSubsampling = 3;
		videoFullRangeFlag = 1;
	}
	const widthMinusOne = bitstream.readBits(16);
	const heightMinusOne = bitstream.readBits(16);
	const pictureSize = (widthMinusOne + 1) * (heightMinusOne + 1);
	let level = last(VP9_LEVEL_TABLE).level;
	for (const entry of VP9_LEVEL_TABLE) if (pictureSize <= entry.maxPictureSize) {
		level = entry.level;
		break;
	}
	const colorSpaceValues = VP9_COLOR_SPACE_TABLE[colorSpace];
	const colourPrimaries = colorSpaceValues?.colourPrimaries ?? 2;
	const transferCharacteristics = colorSpaceValues?.transferCharacteristics ?? 2;
	const matrixCoefficients = colorSpaceValues?.matrixCoefficients ?? 2;
	return {
		profile,
		level,
		bitDepth,
		chromaSubsampling,
		videoFullRangeFlag,
		colourPrimaries,
		transferCharacteristics,
		matrixCoefficients
	};
};
/** Iterates over all OBUs in an AV1 packet bitstream. */
var iterateAv1PacketObus = function* (packet) {
	const bitstream = new Bitstream(packet);
	const readLeb128 = () => {
		let value = 0;
		for (let i = 0; i < 8; i++) {
			const byte = bitstream.readAlignedByte();
			value += (byte & 127) * 2 ** (i * 7);
			if (!(byte & 128)) break;
			if (i === 7 && byte & 128) return null;
		}
		if (value > 2 ** 32 - 1) return null;
		return value;
	};
	while (bitstream.getBitsLeft() >= 8) {
		bitstream.skipBits(1);
		const obuType = bitstream.readBits(4);
		const obuExtension = bitstream.readBits(1);
		const obuHasSizeField = bitstream.readBits(1);
		bitstream.skipBits(1);
		if (obuExtension) bitstream.skipBits(8);
		let obuSize;
		if (obuHasSizeField) {
			const obuSizeValue = readLeb128();
			if (obuSizeValue === null) return;
			obuSize = obuSizeValue;
		} else obuSize = Math.floor(bitstream.getBitsLeft() / 8);
		assert(bitstream.pos % 8 === 0);
		yield {
			type: obuType,
			data: packet.subarray(bitstream.pos / 8, bitstream.pos / 8 + obuSize)
		};
		bitstream.skipBits(obuSize * 8);
	}
};
/**
* When AV1 codec information is not provided by the container, we can still try to extract the information by digging
* into the AV1 bitstream.
*/
var extractAv1CodecInfoFromPacket = (packet) => {
	for (const { type, data } of iterateAv1PacketObus(packet)) {
		if (type !== 1) continue;
		const bitstream = new Bitstream(data);
		const seqProfile = bitstream.readBits(3);
		bitstream.readBits(1);
		const reducedStillPictureHeader = bitstream.readBits(1);
		let seqLevel = 0;
		let seqTier = 0;
		let bufferDelayLengthMinus1 = 0;
		if (reducedStillPictureHeader) seqLevel = bitstream.readBits(5);
		else {
			const timingInfoPresentFlag = bitstream.readBits(1);
			let decoderModelInfoPresentFlag = 0;
			if (timingInfoPresentFlag) {
				bitstream.skipBits(32);
				bitstream.skipBits(32);
				if (bitstream.readBits(1)) {
					let leadingZeros = 0;
					while (leadingZeros < 32 && !bitstream.readBits(1)) leadingZeros++;
					if (leadingZeros < 32) bitstream.skipBits(leadingZeros);
				}
				decoderModelInfoPresentFlag = bitstream.readBits(1);
				if (decoderModelInfoPresentFlag) {
					bufferDelayLengthMinus1 = bitstream.readBits(5);
					bitstream.skipBits(32);
					bitstream.skipBits(5);
					bitstream.skipBits(5);
				}
			}
			const initialDisplayDelayPresentFlag = bitstream.readBits(1);
			const operatingPointsCntMinus1 = bitstream.readBits(5);
			for (let i = 0; i <= operatingPointsCntMinus1; i++) {
				bitstream.skipBits(12);
				const seqLevelIdx = bitstream.readBits(5);
				if (i === 0) seqLevel = seqLevelIdx;
				if (seqLevelIdx > 7) {
					const seqTierTemp = bitstream.readBits(1);
					if (i === 0) seqTier = seqTierTemp;
				}
				if (decoderModelInfoPresentFlag) {
					if (bitstream.readBits(1)) {
						const n = bufferDelayLengthMinus1 + 1;
						bitstream.skipBits(n);
						bitstream.skipBits(n);
						bitstream.skipBits(1);
					}
				}
				if (initialDisplayDelayPresentFlag) {
					if (bitstream.readBits(1)) bitstream.skipBits(4);
				}
			}
		}
		const frameWidthBitsMinus1 = bitstream.readBits(4);
		const frameHeightBitsMinus1 = bitstream.readBits(4);
		const n1 = frameWidthBitsMinus1 + 1;
		bitstream.skipBits(n1);
		const n2 = frameHeightBitsMinus1 + 1;
		bitstream.skipBits(n2);
		let frameIdNumbersPresentFlag = 0;
		if (reducedStillPictureHeader) frameIdNumbersPresentFlag = 0;
		else frameIdNumbersPresentFlag = bitstream.readBits(1);
		if (frameIdNumbersPresentFlag) {
			bitstream.skipBits(4);
			bitstream.skipBits(3);
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		if (!reducedStillPictureHeader) {
			bitstream.skipBits(1);
			bitstream.skipBits(1);
			bitstream.skipBits(1);
			bitstream.skipBits(1);
			const enableOrderHint = bitstream.readBits(1);
			if (enableOrderHint) {
				bitstream.skipBits(1);
				bitstream.skipBits(1);
			}
			const seqChooseScreenContentTools = bitstream.readBits(1);
			let seqForceScreenContentTools = 0;
			if (seqChooseScreenContentTools) seqForceScreenContentTools = 2;
			else seqForceScreenContentTools = bitstream.readBits(1);
			if (seqForceScreenContentTools > 0) {
				if (!bitstream.readBits(1)) bitstream.skipBits(1);
			}
			if (enableOrderHint) bitstream.skipBits(3);
		}
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		bitstream.skipBits(1);
		const highBitdepth = bitstream.readBits(1);
		let bitDepth = 8;
		if (seqProfile === 2 && highBitdepth) bitDepth = bitstream.readBits(1) ? 12 : 10;
		else if (seqProfile <= 2) bitDepth = highBitdepth ? 10 : 8;
		let monochrome = 0;
		if (seqProfile !== 1) monochrome = bitstream.readBits(1);
		let colourPrimaries = 2;
		let transferCharacteristics = 2;
		let matrixCoefficients = 2;
		if (bitstream.readBits(1)) {
			colourPrimaries = bitstream.readBits(8);
			transferCharacteristics = bitstream.readBits(8);
			matrixCoefficients = bitstream.readBits(8);
		}
		let videoFullRangeFlag = 0;
		let chromaSubsamplingX = 1;
		let chromaSubsamplingY = 1;
		let chromaSamplePosition = 0;
		if (monochrome) videoFullRangeFlag = bitstream.readBits(1);
		else if (colourPrimaries === 1 && transferCharacteristics === 13 && matrixCoefficients === 0) {
			videoFullRangeFlag = 1;
			chromaSubsamplingX = 0;
			chromaSubsamplingY = 0;
		} else {
			videoFullRangeFlag = bitstream.readBits(1);
			if (seqProfile === 0) {
				chromaSubsamplingX = 1;
				chromaSubsamplingY = 1;
			} else if (seqProfile === 1) {
				chromaSubsamplingX = 0;
				chromaSubsamplingY = 0;
			} else if (bitDepth === 12) {
				chromaSubsamplingX = bitstream.readBits(1);
				chromaSubsamplingY = chromaSubsamplingX ? bitstream.readBits(1) : 0;
			} else {
				chromaSubsamplingX = 1;
				chromaSubsamplingY = 0;
			}
			if (chromaSubsamplingX && chromaSubsamplingY) chromaSamplePosition = bitstream.readBits(2);
		}
		return {
			profile: seqProfile,
			level: seqLevel,
			tier: seqTier,
			bitDepth,
			monochrome,
			chromaSubsamplingX,
			chromaSubsamplingY,
			chromaSamplePosition,
			videoFullRangeFlag,
			colourPrimaries,
			transferCharacteristics,
			matrixCoefficients
		};
	}
	return null;
};
var av1CodecInfoHasColorInfo = (info) => {
	return info.colourPrimaries !== 2 || info.transferCharacteristics !== 2 || info.matrixCoefficients !== 2;
};
var parseOpusIdentificationHeader = (bytes) => {
	if (bytes.byteLength < 19) throw new Error("Invalid Opus identification header: too short.");
	const view = toDataView(bytes);
	const outputChannelCount = view.getUint8(9);
	const preSkip = view.getUint16(10, true);
	const inputSampleRate = view.getUint32(12, true);
	const outputGain = view.getInt16(16, true);
	const channelMappingFamily = view.getUint8(18);
	let channelMappingTable = null;
	if (channelMappingFamily) channelMappingTable = bytes.subarray(19, 21 + outputChannelCount);
	return {
		outputChannelCount,
		preSkip,
		inputSampleRate,
		outputGain,
		channelMappingFamily,
		channelMappingTable
	};
};
var OPUS_FRAME_DURATION_TABLE = [
	480,
	960,
	1920,
	2880,
	480,
	960,
	1920,
	2880,
	480,
	960,
	1920,
	2880,
	480,
	960,
	480,
	960,
	120,
	240,
	480,
	960,
	120,
	240,
	480,
	960,
	120,
	240,
	480,
	960,
	120,
	240,
	480,
	960
];
var parseOpusTocByte = (packet) => {
	const config = packet[0] >> 3;
	const code = packet[0] & 3;
	let frameCount;
	if (code === 0) frameCount = 1;
	else if (code === 1 || code === 2) frameCount = 2;
	else frameCount = packet[1] & 63;
	return { durationInSamples: OPUS_FRAME_DURATION_TABLE[config] * frameCount };
};
/** Determines a packet's type (key or delta) by digging into the packet bitstream. */
var determineVideoPacketType = (codec, decoderConfig, packetData) => {
	switch (codec) {
		case "avc":
			for (const loc of iterateAvcNalUnits(packetData, decoderConfig)) {
				const nalTypeByte = packetData[loc.offset];
				const type = extractNalUnitTypeForAvc(nalTypeByte);
				if (type >= AvcNalUnitType.NON_IDR_SLICE && type <= AvcNalUnitType.SLICE_DPC) return "delta";
				if (type === AvcNalUnitType.IDR) return "key";
				if (type === AvcNalUnitType.SEI && !isChromium()) {
					const bytes = removeEmulationPreventionBytes(packetData.subarray(loc.offset, loc.offset + loc.length));
					let pos = 1;
					do {
						let payloadType = 0;
						while (true) {
							const nextByte = bytes[pos++];
							if (nextByte === void 0) break;
							payloadType += nextByte;
							if (nextByte < 255) break;
						}
						let payloadSize = 0;
						while (true) {
							const nextByte = bytes[pos++];
							if (nextByte === void 0) break;
							payloadSize += nextByte;
							if (nextByte < 255) break;
						}
						if (payloadType === 6) {
							const bitstream = new Bitstream(bytes);
							bitstream.pos = 8 * pos;
							let recoveryFrameCount = -1;
							try {
								recoveryFrameCount = readExpGolomb(bitstream);
							} catch {}
							const exactMatchFlag = bitstream.readBits(1);
							if (recoveryFrameCount === 0 && exactMatchFlag === 1) return "key";
						}
						pos += payloadSize;
					} while (pos < bytes.length - 1);
				}
			}
			return "delta";
		case "hevc":
			for (const loc of iterateHevcNalUnits(packetData, decoderConfig)) {
				const type = extractNalUnitTypeForHevc(packetData[loc.offset]);
				if (type < HevcNalUnitType.BLA_W_LP) return "delta";
				if (type <= HevcNalUnitType.RSV_IRAP_VCL23) return "key";
			}
			return "delta";
		case "vp8": return (packetData[0] & 1) === 0 ? "key" : "delta";
		case "vp9": {
			const bitstream = new Bitstream(packetData);
			if (bitstream.readBits(2) !== 2) return null;
			const profileLowBit = bitstream.readBits(1);
			if ((bitstream.readBits(1) << 1) + profileLowBit === 3) bitstream.skipBits(1);
			if (bitstream.readBits(1)) return null;
			return bitstream.readBits(1) === 0 ? "key" : "delta";
		}
		case "av1": {
			let reducedStillPictureHeader = false;
			for (const { type, data } of iterateAv1PacketObus(packetData)) if (type === 1) {
				const bitstream = new Bitstream(data);
				bitstream.skipBits(4);
				reducedStillPictureHeader = !!bitstream.readBits(1);
			} else if (type === 3 || type === 6 || type === 7) {
				if (reducedStillPictureHeader) return "key";
				const bitstream = new Bitstream(data);
				if (bitstream.readBits(1)) return null;
				return bitstream.readBits(2) === 0 ? "key" : "delta";
			}
			return null;
		}
		case "prores": return "key";
		default:
			assertNever(codec);
			assert(false);
	}
};
var determineAudioPacketType = (codec, packetData) => {
	if (codec === "truehd") return (packetData.byteLength >= 8 ? toDataView(packetData).getUint32(4) : null) === 4168249274 ? "key" : "delta";
	else return "key";
};
var FlacBlockType;
(function(FlacBlockType) {
	FlacBlockType[FlacBlockType["STREAMINFO"] = 0] = "STREAMINFO";
	FlacBlockType[FlacBlockType["VORBIS_COMMENT"] = 4] = "VORBIS_COMMENT";
	FlacBlockType[FlacBlockType["PICTURE"] = 6] = "PICTURE";
})(FlacBlockType || (FlacBlockType = {}));
/**
* Parse an AC-3 syncframe to extract BSI (Bit Stream Information) fields.
* Section 4.3
*/
var parseAc3SyncFrame = (data) => {
	if (data.length < 7) return null;
	if (data[0] !== 11 || data[1] !== 119) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(16);
	bitstream.skipBits(16);
	const fscod = bitstream.readBits(2);
	if (fscod === 3) return null;
	const frmsizecod = bitstream.readBits(6);
	const bsid = bitstream.readBits(5);
	if (bsid > 8) return null;
	const bsmod = bitstream.readBits(3);
	const acmod = bitstream.readBits(3);
	if ((acmod & 1) !== 0 && acmod !== 1) bitstream.skipBits(2);
	if ((acmod & 4) !== 0) bitstream.skipBits(2);
	if (acmod === 2) bitstream.skipBits(2);
	return {
		fscod,
		bsid,
		bsmod,
		acmod,
		lfeon: bitstream.readBits(1),
		bitRateCode: Math.floor(frmsizecod / 2)
	};
};
new Uint8Array([
	5,
	4,
	65,
	67,
	45,
	51
]);
new Uint8Array([
	5,
	4,
	69,
	65,
	67,
	51
]);
/** Number of audio blocks per syncframe, indexed by numblkscod */
var EAC3_NUMBLKS_TABLE = [
	1,
	2,
	3,
	6
];
/**
* Parse an E-AC-3 syncframe to extract BSI fields.
* Section E.1.2
*/
var parseEac3SyncFrame = (data) => {
	if (data.length < 6) return null;
	if (data[0] !== 11 || data[1] !== 119) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(16);
	const strmtyp = bitstream.readBits(2);
	bitstream.skipBits(3);
	if (strmtyp !== 0 && strmtyp !== 2) return null;
	const frmsiz = bitstream.readBits(11);
	const fscod = bitstream.readBits(2);
	let fscod2 = 0;
	let numblkscod;
	if (fscod === 3) {
		fscod2 = bitstream.readBits(2);
		numblkscod = 3;
	} else numblkscod = bitstream.readBits(2);
	const acmod = bitstream.readBits(3);
	const lfeon = bitstream.readBits(1);
	const bsid = bitstream.readBits(5);
	if (bsid < 11 || bsid > 16) return null;
	const numblks = EAC3_NUMBLKS_TABLE[numblkscod];
	let fs;
	if (fscod < 3) fs = AC3_SAMPLE_RATES[fscod] / 1e3;
	else fs = EAC3_REDUCED_SAMPLE_RATES[fscod2] / 1e3;
	return {
		dataRate: Math.round((frmsiz + 1) * fs / (numblks * 16)),
		substreams: [{
			fscod,
			fscod2,
			bsid,
			bsmod: 0,
			acmod,
			lfeon,
			numDepSub: 0,
			chanLoc: 0
		}]
	};
};
/** Number of PCM blocks that a core frame's length must be a multiple of. */
var DTS_SUBBAND_SAMPLES = 8;
/** Core sample rates indexed by SFREQ. Zeroes mark invalid codes. Table 5-4 */
var DTS_CORE_SAMPLE_RATES = [
	0,
	8e3,
	16e3,
	32e3,
	0,
	0,
	11025,
	22050,
	44100,
	0,
	0,
	12e3,
	24e3,
	48e3,
	96e3,
	192e3
];
/**
* Core bit rates in bps indexed by RATE, where a zero means the code isn't a constant rate. Table 5-7
*
* Note that FFmpeg's ff_dca_bit_rates has 896000 where the spec has 960, and defines rates for codes 25 to 28
* which this revision of the spec calls invalid. We keep the latter, since they cost nothing and some content
* predating the spec revision uses them.
*/
var DTS_CORE_BIT_RATES = [
	32e3,
	56e3,
	64e3,
	96e3,
	112e3,
	128e3,
	192e3,
	224e3,
	256e3,
	32e4,
	384e3,
	448e3,
	512e3,
	576e3,
	64e4,
	768e3,
	96e4,
	1024e3,
	1152e3,
	128e4,
	1344e3,
	1408e3,
	1411200,
	1472e3,
	1536e3,
	192e4,
	2048e3,
	3072e3,
	384e4,
	0,
	0,
	0
];
/** Source PCM resolutions in bits indexed by PCMR. Zeroes mark invalid codes. */
var DTS_PCM_RESOLUTIONS = [
	16,
	16,
	20,
	20,
	0,
	24,
	24,
	0
];
/** Channel counts indexed by AMODE, not counting LFE. */
var DTS_AMODE_CHANNEL_COUNTS = [
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	6,
	6,
	6,
	7,
	8,
	8
];
/**
* Speaker layout masks indexed by AMODE, expressed with the same bits as `ChannelLayout` in the DTSSpecificBox
* and `nuSpkrActivityMask` in an extension substream asset descriptor.
*/
var DTS_AMODE_CHANNEL_LAYOUTS = [
	1,
	2,
	2,
	2,
	2,
	3,
	18,
	19,
	6,
	7,
	518,
	323,
	83,
	519,
	582,
	535
];
/** The LFE1 speaker bit in a channel layout mask. */
var DTS_CHANNEL_LAYOUT_LFE1 = 8;
/** Reference clock rates indexed by nuRefClockCode. The last code is unused. Table 7-3 */
var DTS_EXSS_REF_CLOCKS = [
	32e3,
	44100,
	48e3,
	0
];
/** Sample rates used by extension substream assets, indexed by nuMaxSampleRate. */
var DTS_EXSS_SAMPLE_RATES = [
	8e3,
	16e3,
	32e3,
	64e3,
	128e3,
	22050,
	44100,
	88200,
	176400,
	352800,
	12e3,
	24e3,
	48e3,
	96e3,
	192e3,
	384e3
];
/** Frame durations that the DTSSpecificBox can express, indexed by FrameDuration. */
var DTS_SPECIFIC_BOX_FRAME_DURATIONS = [
	512,
	1024,
	2048,
	4096
];
/**
* Parse one complete DTS frame, being a core substream frame followed by any number of extension substreams,
* or an extension substream on its own. Section 5 and Section 7.4.1
*/
var parseDtsFrame = (data) => {
	const core = parseDtsCoreFrameHeader(data);
	const view = toDataView(data);
	let offset = core ? Math.ceil(core.frameSize / 4) * 4 : 0;
	let firstExss = null;
	while (offset + 4 <= data.length && view.getUint32(offset) === 1683496997) {
		const exss = parseDtsExssHeader(data.subarray(offset));
		if (!exss) break;
		firstExss ??= exss;
		offset += exss.frameSize;
	}
	if (core) return {
		frameSize: firstExss ? offset : core.frameSize,
		sampleRate: core.sampleRate,
		numberOfChannels: core.numberOfChannels,
		sampleCount: core.sampleCount,
		channelLayout: core.channelLayout,
		pcmResolution: core.pcmResolution,
		bitRate: core.bitRate,
		core,
		hasExtensions: firstExss !== null
	};
	if (!firstExss?.asset) return null;
	const { asset } = firstExss;
	return {
		frameSize: offset,
		sampleRate: asset.sampleRate,
		numberOfChannels: asset.numberOfChannels,
		sampleCount: asset.sampleCount,
		channelLayout: asset.channelLayout,
		pcmResolution: asset.pcmResolution,
		bitRate: 0,
		core: null,
		hasExtensions: true
	};
};
/** Parse the header of a core substream frame. Section 5.3 */
var parseDtsCoreFrameHeader = (data) => {
	if (data.length < 18) return null;
	if (data[0] !== 127 || data[1] !== 254 || data[2] !== 128 || data[3] !== 1) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(32);
	bitstream.skipBits(1);
	if (bitstream.readBits(5) !== 31) return null;
	const cpf = bitstream.readBits(1);
	const npcmblocks = bitstream.readBits(7) + 1;
	if (npcmblocks % DTS_SUBBAND_SAMPLES !== 0) return null;
	const frameSize = bitstream.readBits(14) + 1;
	if (frameSize < 96) return null;
	const amode = bitstream.readBits(6);
	if (amode >= DTS_AMODE_CHANNEL_COUNTS.length) return null;
	const sampleRate = DTS_CORE_SAMPLE_RATES[bitstream.readBits(4)];
	if (sampleRate === 0) return null;
	const bitRate = DTS_CORE_BIT_RATES[bitstream.readBits(5)];
	if (bitstream.readBits(1) !== 0) return null;
	bitstream.skipBits(4);
	bitstream.skipBits(5);
	const lff = bitstream.readBits(2);
	if (lff === 3) return null;
	bitstream.skipBits(1);
	if (cpf) bitstream.skipBits(16);
	bitstream.skipBits(7);
	const pcmResolution = DTS_PCM_RESOLUTIONS[bitstream.readBits(3)];
	if (pcmResolution === 0) return null;
	const lfePresent = lff !== 0;
	return {
		frameSize,
		sampleRate,
		numberOfChannels: DTS_AMODE_CHANNEL_COUNTS[amode] + (lfePresent ? 1 : 0),
		sampleCount: npcmblocks * 32,
		channelLayout: DTS_AMODE_CHANNEL_LAYOUTS[amode] | (lfePresent ? DTS_CHANNEL_LAYOUT_LFE1 : 0),
		amode,
		lfePresent,
		bitRate,
		pcmResolution
	};
};
/** Parse the header of an extension substream, along with its first audio asset descriptor. Section 7.4.1 */
var parseDtsExssHeader = (data) => {
	if (data.length < 10) return null;
	if (data[0] !== 100 || data[1] !== 88 || data[2] !== 32 || data[3] !== 37) return null;
	const bitstream = new Bitstream(data);
	bitstream.skipBits(32);
	bitstream.skipBits(8);
	const extSsIndex = bitstream.readBits(2);
	const wideHeader = bitstream.readBits(1);
	const headerSizeBits = 8 + 4 * wideHeader;
	const frameSizeBits = 16 + 4 * wideHeader;
	bitstream.skipBits(headerSizeBits);
	const frameSize = bitstream.readBits(frameSizeBits) + 1;
	const incomplete = {
		frameSize,
		asset: null
	};
	if (!bitstream.readBits(1)) return incomplete;
	const refClock = DTS_EXSS_REF_CLOCKS[bitstream.readBits(2)];
	const frameDurationCycles = 512 * (bitstream.readBits(3) + 1);
	if (bitstream.readBits(1)) bitstream.skipBits(36);
	const numAudioPresentations = bitstream.readBits(3) + 1;
	const numAssets = bitstream.readBits(3) + 1;
	const activeExssMasks = [];
	for (let i = 0; i < numAudioPresentations; i++) activeExssMasks.push(bitstream.readBits(extSsIndex + 1));
	for (const mask of activeExssMasks) bitstream.skipBits(8 * popcount(mask));
	if (bitstream.readBits(1)) {
		bitstream.skipBits(2);
		const spkrMaskBits = bitstream.readBits(2) + 1 << 2;
		const numMixOutConfigs = bitstream.readBits(2) + 1;
		bitstream.skipBits(numMixOutConfigs * spkrMaskBits);
	}
	for (let i = 0; i < numAssets; i++) bitstream.skipBits(frameSizeBits);
	bitstream.skipBits(9);
	bitstream.skipBits(3);
	if (bitstream.readBits(1)) bitstream.skipBits(4);
	if (bitstream.readBits(1)) bitstream.skipBits(24);
	if (bitstream.readBits(1)) bitstream.skipBits(8 * (bitstream.readBits(10) + 1));
	const pcmResolution = bitstream.readBits(5) + 1;
	const sampleRate = DTS_EXSS_SAMPLE_RATES[bitstream.readBits(4)];
	const numberOfChannels = bitstream.readBits(8) + 1;
	let channelLayout = 0;
	if (bitstream.readBits(1)) {
		if (numberOfChannels > 2) bitstream.skipBits(1);
		if (numberOfChannels > 6) bitstream.skipBits(1);
		if (bitstream.readBits(1)) {
			const spkrMaskBits = bitstream.readBits(2) + 1 << 2;
			channelLayout = bitstream.readBits(spkrMaskBits);
		}
	}
	if (refClock === 0 || bitstream.getBitsLeft() < 0) return incomplete;
	return {
		frameSize,
		asset: {
			sampleRate,
			numberOfChannels,
			sampleCount: Math.round(frameDurationCycles * sampleRate / refClock),
			channelLayout,
			pcmResolution
		}
	};
};
/** Build the payload of a DTSSpecificBox (ddts) from a frame of the stream it describes. */
var buildDtsSpecificBox = (frameInfo) => {
	const bytes = /* @__PURE__ */ new Uint8Array(20);
	const view = toDataView(bytes);
	view.setUint32(0, frameInfo.sampleRate);
	view.setUint32(4, frameInfo.bitRate);
	view.setUint32(8, frameInfo.bitRate);
	bytes[12] = frameInfo.pcmResolution;
	const streamConstruction = frameInfo.core && !frameInfo.hasExtensions ? 1 : 0;
	const bitstream = new Bitstream(bytes);
	bitstream.seekToByte(13);
	bitstream.writeBits(2, Math.max(DTS_SPECIFIC_BOX_FRAME_DURATIONS.indexOf(frameInfo.sampleCount), 0));
	bitstream.writeBits(5, streamConstruction);
	bitstream.writeBits(1, frameInfo.core?.lfePresent ? 1 : 0);
	bitstream.writeBits(6, frameInfo.core?.amode ?? 0);
	bitstream.writeBits(14, frameInfo.core ? frameInfo.core.frameSize - 1 : 0);
	bitstream.writeBits(1, 0);
	bitstream.writeBits(3, 0);
	bitstream.writeBits(16, frameInfo.channelLayout);
	bitstream.writeBits(1, 0);
	bitstream.writeBits(1, 0);
	bitstream.writeBits(1, 0);
	bitstream.writeBits(5, 0);
	return bytes;
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/subtitles.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var inlineTimestampRegex = /<(?:(\d{2}):)?(\d{2}):(\d{2}).(\d{3})>/g;
var formatSubtitleTimestamp = (timestamp) => {
	const hours = Math.floor(timestamp / 36e5);
	const minutes = Math.floor(timestamp % 36e5 / 6e4);
	const seconds = Math.floor(timestamp % 6e4 / 1e3);
	const milliseconds = timestamp % 1e3;
	return hours.toString().padStart(2, "0") + ":" + minutes.toString().padStart(2, "0") + ":" + seconds.toString().padStart(2, "0") + "." + milliseconds.toString().padStart(3, "0");
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/pcm.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var toUlaw = (s16) => {
	const MULAW_MAX = 8191;
	const MULAW_BIAS = 33;
	let number = s16 >> 2;
	let mask = 4096;
	let sign = 0;
	let position = 12;
	let lsb = 0;
	if (number < 0) {
		number = -number;
		sign = 128;
	}
	number += MULAW_BIAS;
	if (number > MULAW_MAX) number = MULAW_MAX;
	while ((number & mask) !== mask && position >= 5) {
		mask >>= 1;
		position--;
	}
	lsb = number >> position - 4 & 15;
	return ~(sign | position - 5 << 4 | lsb) & 255;
};
var toAlaw = (s16) => {
	const ALAW_MAX = 4095;
	let mask = 2048;
	let sign = 0;
	let position = 11;
	let lsb = 0;
	let number = s16 >> 3;
	if (number < 0) number = -number - 1;
	else sign = 128;
	if (number > ALAW_MAX) number = ALAW_MAX;
	while ((number & mask) !== mask && position >= 5) {
		mask >>= 1;
		position--;
	}
	lsb = number >> (position === 4 ? 1 : position - 4) & 15;
	return (sign | position - 4 << 4 | lsb) ^ 85;
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/sample.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var __addDisposableResource$1 = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources$1 = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
polyfillSymbolDispose();
var lastVideoGcErrorLog = -Infinity;
var lastAudioGcErrorLog = -Infinity;
var finalizationRegistry = null;
if (typeof FinalizationRegistry !== "undefined") finalizationRegistry = new FinalizationRegistry((value) => {
	const now = performance.now();
	if (value.type === "video") {
		if (now - lastVideoGcErrorLog >= 1e3) {
			Logging._error("A VideoSample was garbage collected without first being closed. For proper resource management, make sure to call close() on all your VideoSamples as soon as you're done using them.");
			lastVideoGcErrorLog = now;
		}
		if (typeof VideoFrame !== "undefined" && value.data instanceof VideoFrame) value.data.close();
	} else {
		if (now - lastAudioGcErrorLog >= 1e3) {
			Logging._error("An AudioSample was garbage collected without first being closed. For proper resource management, make sure to call close() on all your AudioSamples as soon as you're done using them.");
			lastAudioGcErrorLog = now;
		}
		if (typeof AudioData !== "undefined" && value.data instanceof AudioData) value.data.close();
	}
});
/**
* Abstract base class for custom video sample resources. Implement this class to provide custom backing
* for VideoSample instances.
* @group Samples
* @public
*/
var VideoSampleResource = class {
	constructor() {
		/** @internal */
		this._referenceCount = 0;
		/** @internal */
		this._lastAllocationBuffer = null;
	}
};
/**
* The list of {@link VideoSample} pixel formats.
* @group Samples
* @public
*/
var VIDEO_SAMPLE_PIXEL_FORMATS = [
	"I420",
	"I420P10",
	"I420P12",
	"I420A",
	"I420AP10",
	"I420AP12",
	"I422",
	"I422P10",
	"I422P12",
	"I422A",
	"I422AP10",
	"I422AP12",
	"I444",
	"I444P10",
	"I444P12",
	"I444A",
	"I444AP10",
	"I444AP12",
	"NV12",
	"RGBA",
	"RGBX",
	"BGRA",
	"BGRX"
];
var VIDEO_SAMPLE_PIXEL_FORMATS_SET = new Set(VIDEO_SAMPLE_PIXEL_FORMATS);
/**
* Represents a raw, unencoded video sample (frame). Mainly used as an expressive wrapper around WebCodecs API's
* [`VideoFrame`](https://developer.mozilla.org/en-US/docs/Web/API/VideoFrame), but can also be used standalone.
* @group Samples
* @public
*/
var VideoSample = class VideoSample {
	/** The width of the frame in pixels. */
	get codedWidth() {
		return this.visibleRect.width;
	}
	/** The height of the frame in pixels. */
	get codedHeight() {
		return this.visibleRect.height;
	}
	/** The display width of the frame in pixels, after aspect ratio adjustment, rotation and flip. */
	get displayWidth() {
		return this.rotation % 180 === 0 ? this.squarePixelWidth : this.squarePixelHeight;
	}
	/** The display height of the frame in pixels, after aspect ratio adjustment, rotation and flip. */
	get displayHeight() {
		return this.rotation % 180 === 0 ? this.squarePixelHeight : this.squarePixelWidth;
	}
	/** The presentation timestamp of the frame in microseconds. */
	get microsecondTimestamp() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
	}
	/** The duration of the frame in microseconds. */
	get microsecondDuration() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
	}
	/**
	* Whether this sample uses a pixel format that can hold transparency data. Note that this doesn't necessarily mean
	* that the sample is transparent.
	*/
	get hasAlpha() {
		return this.format && this.format.includes("A");
	}
	constructor(data, init) {
		/** @internal */
		this._closed = false;
		if (data instanceof ArrayBuffer || typeof SharedArrayBuffer !== "undefined" && data instanceof SharedArrayBuffer || ArrayBuffer.isView(data)) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.format === void 0 || !VIDEO_SAMPLE_PIXEL_FORMATS_SET.has(init.format)) throw new TypeError("init.format must be one of: " + VIDEO_SAMPLE_PIXEL_FORMATS.join(", "));
			if (!Number.isInteger(init.codedWidth) || init.codedWidth <= 0) throw new TypeError("init.codedWidth must be a positive integer.");
			if (!Number.isInteger(init.codedHeight) || init.codedHeight <= 0) throw new TypeError("init.codedHeight must be a positive integer.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (init.flip !== void 0 && typeof init.flip !== "boolean") throw new TypeError("init.flip, when provided, must be a boolean.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (init.layout !== void 0) {
				if (!Array.isArray(init.layout)) throw new TypeError("init.layout, when provided, must be an array.");
				for (const plane of init.layout) {
					if (!plane || typeof plane !== "object" || Array.isArray(plane)) throw new TypeError("Each entry in init.layout must be an object.");
					if (!Number.isInteger(plane.offset) || plane.offset < 0) throw new TypeError("plane.offset must be a non-negative integer.");
					if (!Number.isInteger(plane.stride) || plane.stride < 0) throw new TypeError("plane.stride must be a non-negative integer.");
				}
			}
			if (init.visibleRect !== void 0) validateRectangle(init.visibleRect, "init.visibleRect");
			if (init.displayWidth !== void 0 && (!Number.isInteger(init.displayWidth) || init.displayWidth <= 0)) throw new TypeError("init.displayWidth, when provided, must be a positive integer.");
			if (init.displayHeight !== void 0 && (!Number.isInteger(init.displayHeight) || init.displayHeight <= 0)) throw new TypeError("init.displayHeight, when provided, must be a positive integer.");
			if (init.displayWidth !== void 0 !== (init.displayHeight !== void 0)) throw new TypeError("init.displayWidth and init.displayHeight must be either both provided or both omitted.");
			this.format = init.format;
			this.rotation = init.rotation ?? 0;
			this.flip = init.flip ?? false;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			const layout = init.layout ?? createDefaultPlaneLayout(init.format, init.codedWidth, init.codedHeight);
			let colorSpaceInit = init.colorSpace ?? null;
			if (colorSpaceInit === null) {
				if (this.format === "RGBA" || this.format === "RGBX" || this.format === "BGRA" || this.format === "BGRX") colorSpaceInit = {
					primaries: "bt709",
					transfer: "iec61966-2-1",
					matrix: "rgb",
					fullRange: true
				};
				else colorSpaceInit = {
					primaries: "bt709",
					transfer: "bt709",
					matrix: "bt709",
					fullRange: false
				};
			}
			this.visibleRect = {
				left: init.visibleRect?.left ?? 0,
				top: init.visibleRect?.top ?? 0,
				width: init.visibleRect?.width ?? init.codedWidth,
				height: init.visibleRect?.height ?? init.codedHeight
			};
			if (init.displayWidth !== void 0) {
				this.squarePixelWidth = this.rotation % 180 === 0 ? init.displayWidth : init.displayHeight;
				this.squarePixelHeight = this.rotation % 180 === 0 ? init.displayHeight : init.displayWidth;
			} else {
				this.squarePixelWidth = this.visibleRect.width;
				this.squarePixelHeight = this.visibleRect.height;
			}
			this._data = init._doNotCopy ? toUint8Array(data) : toUint8Array(data).slice();
			this._layout = layout;
			this.colorSpace = new VideoSampleColorSpace(colorSpaceInit);
		} else if (typeof VideoFrame !== "undefined" && data instanceof VideoFrame) {
			if (init?.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (init?.flip !== void 0 && typeof init.flip !== "boolean") throw new TypeError("init.flip, when provided, must be a boolean.");
			if (init?.timestamp !== void 0 && !Number.isFinite(init?.timestamp)) throw new TypeError("init.timestamp, when provided, must be a number.");
			if (init?.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (init?.visibleRect !== void 0) validateRectangle(init.visibleRect, "init.visibleRect");
			this._data = data;
			this._layout = null;
			this.format = data.format;
			this.visibleRect = {
				left: data.visibleRect?.x ?? 0,
				top: data.visibleRect?.y ?? 0,
				width: data.visibleRect?.width ?? data.codedWidth,
				height: data.visibleRect?.height ?? data.codedHeight
			};
			this.rotation = init?.rotation ?? 0;
			this.flip = init?.flip ?? false;
			this.squarePixelWidth = data.displayWidth;
			this.squarePixelHeight = data.displayHeight;
			this.timestamp = init?.timestamp ?? data.timestamp / 1e6;
			this.duration = init?.duration ?? (data.duration ?? 0) / 1e6;
			const { primaries, transfer, matrix, fullRange } = data.colorSpace;
			this.colorSpace = new VideoSampleColorSpace({
				primaries: primaries !== null && primaries in COLOR_PRIMARIES_MAP ? primaries : null,
				transfer: transfer !== null && transfer in TRANSFER_CHARACTERISTICS_MAP ? transfer : null,
				matrix: matrix !== null && matrix in MATRIX_COEFFICIENTS_MAP ? matrix : null,
				fullRange
			});
		} else if (typeof HTMLImageElement !== "undefined" && data instanceof HTMLImageElement || typeof SVGImageElement !== "undefined" && data instanceof SVGImageElement || typeof ImageBitmap !== "undefined" && data instanceof ImageBitmap || typeof HTMLVideoElement !== "undefined" && data instanceof HTMLVideoElement || typeof HTMLCanvasElement !== "undefined" && data instanceof HTMLCanvasElement || typeof OffscreenCanvas !== "undefined" && data instanceof OffscreenCanvas) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (init.flip !== void 0 && typeof init.flip !== "boolean") throw new TypeError("init.flip, when provided, must be a boolean.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			if (init.visibleRect !== void 0) validateRectangle(init.visibleRect, "init.visibleRect");
			if (typeof VideoFrame !== "undefined") return new VideoSample(new VideoFrame(data, {
				timestamp: Math.trunc(init.timestamp * SECOND_TO_MICROSECOND_FACTOR),
				duration: Math.trunc((init.duration ?? 0) * SECOND_TO_MICROSECOND_FACTOR) || void 0,
				visibleRect: init.visibleRect && {
					x: init.visibleRect.left,
					y: init.visibleRect.top,
					width: init.visibleRect.width,
					height: init.visibleRect.height
				}
			}), init);
			let width = 0;
			let height = 0;
			if ("naturalWidth" in data) {
				width = data.naturalWidth;
				height = data.naturalHeight;
			} else if ("videoWidth" in data) {
				width = data.videoWidth;
				height = data.videoHeight;
			} else if ("width" in data) {
				width = Number(data.width);
				height = Number(data.height);
			}
			if (!width || !height) throw new TypeError("Could not determine dimensions.");
			const visibleRect = init.visibleRect ?? {
				left: 0,
				top: 0,
				width,
				height
			};
			const canvas = new OffscreenCanvas(visibleRect.width, visibleRect.height);
			const context = canvas.getContext("2d", {
				alpha: isFirefox(),
				willReadFrequently: true
			});
			if (!context) throw new Error("OffscreenCanvas must have support for the '2d' context in order to create a VideoSample from this data.");
			context.drawImage(data, -visibleRect.left, -visibleRect.top);
			this._data = canvas;
			this._layout = null;
			this.format = "RGBX";
			this.visibleRect = {
				left: 0,
				top: 0,
				width: visibleRect.width,
				height: visibleRect.height
			};
			this.squarePixelWidth = visibleRect.width;
			this.squarePixelHeight = visibleRect.height;
			this.rotation = init.rotation ?? 0;
			this.flip = init.flip ?? false;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			this.colorSpace = new VideoSampleColorSpace({
				matrix: "rgb",
				primaries: "bt709",
				transfer: "iec61966-2-1",
				fullRange: true
			});
		} else if (data instanceof VideoSampleResource) {
			if (!init || typeof init !== "object") throw new TypeError("init must be an object.");
			if (init.rotation !== void 0 && ![
				0,
				90,
				180,
				270
			].includes(init.rotation)) throw new TypeError("init.rotation, when provided, must be 0, 90, 180, or 270.");
			if (init.flip !== void 0 && typeof init.flip !== "boolean") throw new TypeError("init.flip, when provided, must be a boolean.");
			if (!Number.isFinite(init.timestamp)) throw new TypeError("init.timestamp must be a number.");
			if (init.duration !== void 0 && (!Number.isFinite(init.duration) || init.duration < 0)) throw new TypeError("init.duration, when provided, must be a non-negative number.");
			this._data = data;
			data._referenceCount++;
			this.format = data.getFormat();
			if (this.format !== null && !VIDEO_SAMPLE_PIXEL_FORMATS.includes(this.format)) throw new TypeError("getFormat() must return a VideoSamplePixelFormat or null.");
			this.visibleRect = {
				left: 0,
				top: 0,
				width: data.getCodedWidth(),
				height: data.getCodedHeight()
			};
			if (!Number.isInteger(this.visibleRect.width) || this.visibleRect.width <= 0) throw new TypeError("getCodedWidth() must return a positive integer.");
			if (!Number.isInteger(this.visibleRect.height) || this.visibleRect.height <= 0) throw new TypeError("getCodedHeight() must return a positive integer.");
			this.squarePixelWidth = data.getSquarePixelWidth();
			if (!Number.isInteger(this.squarePixelWidth) || this.squarePixelWidth <= 0) throw new TypeError("getSquarePixelWidth() must return a positive integer.");
			this.squarePixelHeight = data.getSquarePixelHeight();
			if (!Number.isInteger(this.squarePixelHeight) || this.squarePixelHeight <= 0) throw new TypeError("getSquarePixelHeight() must return a positive integer.");
			this.rotation = init.rotation ?? 0;
			this.flip = init.flip ?? false;
			this.timestamp = init.timestamp;
			this.duration = init.duration ?? 0;
			this.colorSpace = data.getColorSpace();
		} else throw new TypeError("Invalid data type: Must be a BufferSource, CanvasImageSource, or VideoSampleResource.");
		this.encodeOptions = init?.encodeOptions ?? {};
		this.pixelAspectRatio = simplifyRational({
			num: this.squarePixelWidth * this.codedHeight,
			den: this.squarePixelHeight * this.codedWidth
		});
		finalizationRegistry?.register(this, {
			type: "video",
			data: this._data
		}, this);
	}
	/** Clones this video sample. */
	clone() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource) return new VideoSample(this._data, {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: this.rotation,
			flip: this.flip,
			encodeOptions: this.encodeOptions
		});
		else if (isVideoFrame(this._data)) return new VideoSample(this._data.clone(), {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: this.rotation,
			flip: this.flip,
			encodeOptions: this.encodeOptions
		});
		else if (this._data instanceof Uint8Array) {
			assert(this._layout);
			return new VideoSample(this._data, {
				format: this.format,
				layout: this._layout,
				codedWidth: this.codedWidth,
				codedHeight: this.codedHeight,
				timestamp: this.timestamp,
				duration: this.duration,
				colorSpace: this.colorSpace,
				rotation: this.rotation,
				flip: this.flip,
				visibleRect: this.visibleRect,
				displayWidth: this.displayWidth,
				displayHeight: this.displayHeight,
				encodeOptions: this.encodeOptions,
				_doNotCopy: true
			});
		} else return new VideoSample(this._data, {
			format: this.format,
			codedWidth: this.codedWidth,
			codedHeight: this.codedHeight,
			timestamp: this.timestamp,
			duration: this.duration,
			colorSpace: this.colorSpace,
			rotation: this.rotation,
			flip: this.flip,
			visibleRect: this.visibleRect,
			displayWidth: this.displayWidth,
			displayHeight: this.displayHeight,
			encodeOptions: this.encodeOptions
		});
	}
	/**
	* Closes this video sample, releasing held resources. Video samples should be closed as soon as they are not
	* needed anymore.
	*/
	close() {
		if (this._closed) return;
		finalizationRegistry?.unregister(this);
		if (this._data instanceof VideoSampleResource) {
			this._data._referenceCount--;
			if (this._data._referenceCount === 0) this._data.close();
		} else if (isVideoFrame(this._data)) this._data.close();
		else this._data = null;
		this._closed = true;
	}
	/**
	* Returns the number of bytes required to hold this video sample's pixel data.
	*/
	allocationSize(options = {}) {
		validateVideoFrameCopyToOptions(options);
		if (this._closed) throw new Error("VideoSample is closed.");
		if ((options.format ?? this.format) == null) throw new Error("Cannot get allocation size when format is null.");
		if (isVideoFrame(this._data)) return this._data.allocationSize(options);
		return ParseVideoFrameCopyToOptions(this, options).allocationSize;
	}
	/**
	* Copies this video sample's pixel data to an ArrayBuffer or ArrayBufferView.
	* @returns The byte layout of the planes of the copied data.
	*/
	async copyTo(destination, options = {}) {
		if (!isAllowSharedBufferSource(destination)) throw new TypeError("destination must be an ArrayBuffer or an ArrayBuffer view.");
		validateVideoFrameCopyToOptions(options);
		if (this._closed) throw new Error("VideoSample is closed.");
		if ((options.format ?? this.format) == null) throw new Error("Cannot copy video sample data when format is null.");
		assert(this._data !== null);
		if (isVideoFrame(this._data)) return this._data.copyTo(destination, options);
		if (options.format && ![
			"RGBA",
			"RGBX",
			"BGRA",
			"BGRX"
		].includes(this.format) && [
			"RGBA",
			"RGBX",
			"BGRA",
			"BGRX"
		].includes(options.format)) {
			if (this._data instanceof VideoSampleResource) {
				const env_1 = {
					stack: [],
					error: void 0,
					hasError: false
				};
				try {
					const rgbSample = __addDisposableResource$1(env_1, await this._data.toRgbSample({
						timestamp: this.timestamp,
						duration: this.duration,
						rotation: this.rotation,
						flip: this.flip
					}, options.colorSpace ?? "srgb"), false);
					if (!(rgbSample instanceof VideoSample)) throw new TypeError("toRgbSample() must return a VideoSample.");
					if (![
						"RGBA",
						"RGBX",
						"BGRA",
						"BGRX"
					].includes(rgbSample.format)) throw new Error(`Sample returned by toRgbSample was expected to have an RGB format, got '${rgbSample.format}' instead.`);
					return await rgbSample.copyTo(destination, options);
				} catch (e_1) {
					env_1.error = e_1;
					env_1.hasError = true;
				} finally {
					__disposeResources$1(env_1);
				}
			} else {
				if (typeof VideoFrame === "undefined") throw new Error("For this sample, converting from a non-RGB to an RGB format requires VideoFrame to be defined.");
				const tempFrame = this.toVideoFrame();
				const result = await tempFrame.copyTo(destination, options);
				tempFrame.close();
				return result;
			}
		}
		const combinedLayout = ParseVideoFrameCopyToOptions(this, options);
		assert(this.format);
		const destBytes = toUint8Array(destination);
		if (destBytes.byteLength < combinedLayout.allocationSize) throw new TypeError(`Destination buffer too small. Required: ${combinedLayout.allocationSize}, Available: ${destBytes.byteLength}`);
		const planeConfigs = getPlaneConfigs(this.format);
		let dataPlanes;
		if (this._data instanceof VideoSampleResource) {
			let result = this._data.getDataPlanes();
			if (isThenable(result)) result = await result;
			if (!Array.isArray(result) || result.some((x) => !(x.data instanceof Uint8Array) || !Number.isInteger(x.stride) || x.stride < 0)) throw new TypeError("getDataPlanes() must return an array of objects with a Uint8Array \"data\" property and a non-negative integer \"stride\" property.");
			dataPlanes = result;
		} else if (this._data instanceof Uint8Array) {
			assert(this._layout);
			assert(this._layout.length === planeConfigs.length);
			dataPlanes = this._layout.map((planeLayout, i) => {
				const height = Math.ceil(this.codedHeight / planeConfigs[i].heightDivisor);
				return {
					data: this._data.subarray(planeLayout.offset, planeLayout.offset + planeLayout.stride * height),
					stride: planeLayout.stride
				};
			});
		} else {
			const context = this._data.getContext("2d");
			assert(context);
			dataPlanes = [{
				data: toUint8Array(context.getImageData(0, 0, this.codedWidth, this.codedHeight).data),
				stride: 4 * this.codedWidth
			}];
		}
		const planeLayouts = [];
		const numPlanes = planeConfigs.length;
		for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
			const computedLayout = combinedLayout.computedLayouts[planeIndex];
			const sourceStride = dataPlanes[planeIndex].stride;
			const sourceData = dataPlanes[planeIndex].data;
			let sourceOffset = computedLayout.sourceTop * sourceStride;
			sourceOffset += computedLayout.sourceLeftBytes;
			let destinationOffset = computedLayout.destinationOffset;
			const rowBytes = computedLayout.sourceWidthBytes;
			const layout = {
				offset: destinationOffset,
				stride: computedLayout.destinationStride
			};
			for (let row = 0; row < computedLayout.sourceHeight; row++) {
				if (sourceOffset + rowBytes > sourceData.byteLength) throw new Error(`Source buffer OOB read.`);
				if (destinationOffset + rowBytes > destBytes.byteLength) throw new Error(`Destination buffer OOB write.`);
				const srcSub = sourceData.subarray(sourceOffset, sourceOffset + rowBytes);
				destBytes.set(srcSub, destinationOffset);
				sourceOffset += sourceStride;
				destinationOffset += computedLayout.destinationStride;
			}
			planeLayouts.push(layout);
		}
		if (options.format !== void 0) {
			const needsRgbConversion = this.format.startsWith("RGB") !== options.format.startsWith("RGB");
			const needsAlphaConversion = this.format.includes("X") && options.format.includes("A");
			if (needsRgbConversion || needsAlphaConversion) for (let i = 0; i < combinedLayout.allocationSize; i += 4) {
				if (needsRgbConversion) {
					const r = destBytes[i];
					const b = destBytes[i + 2];
					destBytes[i] = b;
					destBytes[i + 2] = r;
				}
				if (needsAlphaConversion) destBytes[i + 3] = 255;
			}
		}
		return planeLayouts;
	}
	/**
	* Converts this video sample to a VideoFrame for use with the WebCodecs API. The VideoFrame returned by this
	* method *must* be closed separately from this video sample.
	*/
	toVideoFrame() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource) {
			if (this.format === null) throw new Error("Cannot convert a VideoSampleResource-backed VideoSample to VideoFrame if format is null.");
			const planes = this._data.getDataPlanes();
			if (isThenable(planes)) throw new Error("Cannot convert a VideoSampleResource-backed VideoSample to VideoFrame if getDataPlanes() returns a promise.");
			const size = planes.reduce((a, b) => a + b.data.byteLength, 0);
			const buffer = new Uint8Array(size);
			let offset = 0;
			const offsets = [];
			for (const plane of planes) {
				buffer.set(plane.data, offset);
				offsets.push(offset);
				offset += plane.data.byteLength;
			}
			return new VideoFrame(buffer, {
				format: this.format,
				layout: planes.map((x, i) => ({
					offset: offsets[i],
					stride: x.stride
				})),
				codedWidth: this.codedWidth,
				codedHeight: this.codedHeight,
				timestamp: this.microsecondTimestamp,
				duration: this.microsecondDuration,
				colorSpace: this.colorSpace,
				visibleRect: this.visibleRect,
				displayWidth: this.squarePixelWidth,
				displayHeight: this.squarePixelHeight
			});
		} else if (isVideoFrame(this._data)) return new VideoFrame(this._data, {
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration || void 0
		});
		else if (this._data instanceof Uint8Array) {
			assert(this._layout);
			return new VideoFrame(this._data, {
				format: this.format,
				codedWidth: this.codedWidth,
				codedHeight: this.codedHeight,
				layout: this._layout,
				timestamp: this.microsecondTimestamp,
				duration: this.microsecondDuration || void 0,
				colorSpace: this.colorSpace,
				visibleRect: this.visibleRect,
				displayWidth: this.squarePixelWidth,
				displayHeight: this.squarePixelHeight
			});
		} else return new VideoFrame(this._data, {
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration || void 0
		});
	}
	draw(context, arg1, arg2, arg3, arg4, arg5, arg6, arg7, arg8) {
		let sx = 0;
		let sy = 0;
		let sWidth = this.displayWidth;
		let sHeight = this.displayHeight;
		let dx = 0;
		let dy = 0;
		let dWidth = this.displayWidth;
		let dHeight = this.displayHeight;
		if (arg5 !== void 0) {
			sx = arg1;
			sy = arg2;
			sWidth = arg3;
			sHeight = arg4;
			dx = arg5;
			dy = arg6;
			if (arg7 !== void 0) {
				dWidth = arg7;
				dHeight = arg8;
			} else {
				dWidth = sWidth;
				dHeight = sHeight;
			}
		} else {
			dx = arg1;
			dy = arg2;
			if (arg3 !== void 0) {
				dWidth = arg3;
				dHeight = arg4;
			}
		}
		if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
		if (!Number.isFinite(sx)) throw new TypeError("sx must be a number.");
		if (!Number.isFinite(sy)) throw new TypeError("sy must be a number.");
		if (!Number.isFinite(sWidth) || sWidth < 0) throw new TypeError("sWidth must be a non-negative number.");
		if (!Number.isFinite(sHeight) || sHeight < 0) throw new TypeError("sHeight must be a non-negative number.");
		if (!Number.isFinite(dx)) throw new TypeError("dx must be a number.");
		if (!Number.isFinite(dy)) throw new TypeError("dy must be a number.");
		if (!Number.isFinite(dWidth) || dWidth < 0) throw new TypeError("dWidth must be a non-negative number.");
		if (!Number.isFinite(dHeight) || dHeight < 0) throw new TypeError("dHeight must be a non-negative number.");
		if (this._closed) throw new Error("VideoSample is closed.");
		({sx, sy, sWidth, sHeight} = this._unmapSourceRegion(sx, sy, sWidth, sHeight, this.rotation, this.flip));
		const source = this.toCanvasImageSource();
		context.save();
		const centerX = dx + dWidth / 2;
		const centerY = dy + dHeight / 2;
		context.translate(centerX, centerY);
		if (this.flip) context.scale(-1, 1);
		context.rotate(this.rotation * Math.PI / 180);
		const aspectRatioChange = this.rotation % 180 === 0 ? 1 : dWidth / dHeight;
		context.scale(1 / aspectRatioChange, aspectRatioChange);
		context.drawImage(source, sx, sy, sWidth, sHeight, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
		context.restore();
	}
	/**
	* Draws the sample in the middle of the canvas corresponding to the context with the specified fit behavior.
	*/
	drawWithFit(context, options) {
		if (!(typeof CanvasRenderingContext2D !== "undefined" && context instanceof CanvasRenderingContext2D || typeof OffscreenCanvasRenderingContext2D !== "undefined" && context instanceof OffscreenCanvasRenderingContext2D)) throw new TypeError("context must be a CanvasRenderingContext2D or OffscreenCanvasRenderingContext2D.");
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (![
			"fill",
			"contain",
			"cover"
		].includes(options.fit)) throw new TypeError("options.fit must be 'fill', 'contain', or 'cover'.");
		if (options.rotation !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(options.rotation)) throw new TypeError("options.rotation, when provided, must be 0, 90, 180, or 270.");
		if (options.flip !== void 0 && typeof options.flip !== "boolean") throw new TypeError("options.flip, when provided, must be a boolean.");
		if (options.crop !== void 0) validateCropRectangle(options.crop, "options.");
		const canvasWidth = context.canvas.width;
		const canvasHeight = context.canvas.height;
		const rotation = options.rotation ?? this.rotation;
		const flip = options.flip ?? this.flip;
		const [rotatedWidth, rotatedHeight] = rotation % 180 === 0 ? [this.squarePixelWidth, this.squarePixelHeight] : [this.squarePixelHeight, this.squarePixelWidth];
		let finalCrop = options.crop;
		if (finalCrop) finalCrop = clampCropRectangle(finalCrop, rotatedWidth, rotatedHeight);
		let dx;
		let dy;
		let newWidth;
		let newHeight;
		const { sx, sy, sWidth, sHeight } = this._unmapSourceRegion(options.crop?.left ?? 0, options.crop?.top ?? 0, options.crop?.width ?? rotatedWidth, options.crop?.height ?? rotatedHeight, rotation, flip);
		if (options.fit === "fill") {
			dx = 0;
			dy = 0;
			newWidth = canvasWidth;
			newHeight = canvasHeight;
		} else {
			const [sampleWidth, sampleHeight] = options.crop ? [options.crop.width, options.crop.height] : [rotatedWidth, rotatedHeight];
			const scale = options.fit === "contain" ? Math.min(canvasWidth / sampleWidth, canvasHeight / sampleHeight) : Math.max(canvasWidth / sampleWidth, canvasHeight / sampleHeight);
			newWidth = sampleWidth * scale;
			newHeight = sampleHeight * scale;
			dx = (canvasWidth - newWidth) / 2;
			dy = (canvasHeight - newHeight) / 2;
		}
		context.save();
		const aspectRatioChange = rotation % 180 === 0 ? 1 : newWidth / newHeight;
		context.translate(canvasWidth / 2, canvasHeight / 2);
		if (flip) context.scale(-1, 1);
		context.rotate(rotation * Math.PI / 180);
		context.scale(1 / aspectRatioChange, aspectRatioChange);
		context.translate(-canvasWidth / 2, -canvasHeight / 2);
		context.drawImage(this.toCanvasImageSource(), sx, sy, sWidth, sHeight, dx, dy, newWidth, newHeight);
		context.restore();
	}
	/** @internal */
	_unmapSourceRegion(sx, sy, sWidth, sHeight, rotation, flip) {
		if (flip) sx = (rotation % 180 === 0 ? this.squarePixelWidth : this.squarePixelHeight) - sx - sWidth;
		if (rotation === 90) [sx, sy, sWidth, sHeight] = [
			sy,
			this.squarePixelHeight - sx - sWidth,
			sHeight,
			sWidth
		];
		else if (rotation === 180) [sx, sy] = [this.squarePixelWidth - sx - sWidth, this.squarePixelHeight - sy - sHeight];
		else if (rotation === 270) [sx, sy, sWidth, sHeight] = [
			this.squarePixelWidth - sy - sHeight,
			sx,
			sHeight,
			sWidth
		];
		return {
			sx,
			sy,
			sWidth,
			sHeight
		};
	}
	/**
	* Draws the sample onto the target canvas with fit behavior, manually mipmapping on strong downscales for quality.
	* @internal
	*/
	_drawWithFitAndMipmapping(targetCanvas, targetContext, options) {
		const targetWidth = targetCanvas.width;
		const targetHeight = targetCanvas.height;
		const [rotatedWidth, rotatedHeight] = options.rotation % 180 === 0 ? [this.squarePixelWidth, this.squarePixelHeight] : [this.squarePixelHeight, this.squarePixelWidth];
		const sourceWidth = options.crop ? options.crop.width : rotatedWidth;
		const sourceHeight = options.crop ? options.crop.height : rotatedHeight;
		let mipLevels = 0;
		if (2 * targetWidth < sourceWidth && 2 * targetHeight < sourceHeight) mipLevels = Math.floor(Math.log2(Math.min(sourceWidth / targetWidth, sourceHeight / targetHeight)));
		const drawWidth = targetWidth * 2 ** mipLevels;
		const drawHeight = targetHeight * 2 ** mipLevels;
		const { canvas, context, isNew } = mipLevels > 0 ? getTransformationCanvas(drawWidth, drawHeight) : {
			canvas: targetCanvas,
			context: targetContext,
			isNew: options.targetIsFresh
		};
		context.imageSmoothingQuality = "high";
		if (options.fillBlack) {
			context.fillStyle = "black";
			context.fillRect(0, 0, drawWidth, drawHeight);
		} else if (!isNew) context.clearRect(0, 0, drawWidth, drawHeight);
		this.drawWithFit(context, {
			fit: options.fit,
			rotation: options.rotation,
			flip: options.flip,
			crop: options.crop
		});
		context.globalCompositeOperation = "copy";
		for (let i = mipLevels; i > 1; i--) {
			const levelWidth = targetWidth * 2 ** i;
			const levelHeight = targetHeight * 2 ** i;
			context.drawImage(canvas, 0, 0, levelWidth, levelHeight, 0, 0, levelWidth / 2, levelHeight / 2);
		}
		context.globalCompositeOperation = "source-over";
		if (mipLevels > 0) {
			targetContext.imageSmoothingQuality = "high";
			targetContext.globalCompositeOperation = "copy";
			targetContext.drawImage(canvas, 0, 0, 2 * targetWidth, 2 * targetHeight, 0, 0, targetWidth, targetHeight);
			targetContext.globalCompositeOperation = "source-over";
		}
	}
	/**
	* Converts this video sample to a
	* [`CanvasImageSource`](https://udn.realityripple.com/docs/Web/API/CanvasImageSource) for drawing to a canvas.
	*
	* You must use the value returned by this method immediately, as any VideoFrame created internally may
	* automatically be closed in the next microtask.
	*/
	toCanvasImageSource() {
		if (this._closed) throw new Error("VideoSample is closed.");
		assert(this._data !== null);
		if (this._data instanceof VideoSampleResource || this._data instanceof Uint8Array) {
			const videoFrame = this.toVideoFrame();
			queueMicrotask(() => videoFrame.close());
			return videoFrame;
		} else return this._data;
	}
	/**
	* Transform this video sample to a new video sample given the options. Can be used to resize, rotate, flip, and
	* crop the sample.
	*
	* In non-browser environments, this method will not work by default. To make it work, register a custom
	* transformer function via {@link registerVideoSampleTransformer}.
	*/
	async transform(options) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.width !== void 0 && (!Number.isInteger(options.width) || options.width <= 0)) throw new TypeError("options.width, when provided, must be a positive integer.");
		if (options.height !== void 0 && (!Number.isInteger(options.height) || options.height <= 0)) throw new TypeError("options.height, when provided, must be a positive integer.");
		if (options.roundDimensionsTo !== void 0 && (!Number.isInteger(options.roundDimensionsTo) || options.roundDimensionsTo <= 0)) throw new TypeError("options.roundDimensionsTo, when provided, must be a positive integer.");
		if (options.fit !== void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(options.fit)) throw new TypeError("options.fit, when provided, must be one of \"fill\", \"contain\", or \"cover\".");
		if (options.width !== void 0 && options.height !== void 0 && options.fit === void 0) throw new TypeError("When both options.width and options.height are provided, options.fit must also be provided.");
		if (options.rotate !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(options.rotate)) throw new TypeError("options.rotate, when provided, must be 0, 90, 180 or 270.");
		if (options.flip !== void 0 && typeof options.flip !== "boolean") throw new TypeError("options.flip, when provided, must be a boolean.");
		if (options.crop !== void 0) validateCropRectangle(options.crop, "options.");
		if (options.alpha !== void 0 && !["keep", "discard"].includes(options.alpha)) throw new TypeError("options.alpha, when provided, must be 'keep' or 'discard'.");
		const { rotation, flip } = composeRotationAndFlip(this.rotation, this.flip, options.rotate ?? 0, options.flip ?? false);
		const [rotatedWidth, rotatedHeight] = rotation % 180 === 0 ? [this.squarePixelWidth, this.squarePixelHeight] : [this.squarePixelHeight, this.squarePixelWidth];
		let finalCrop = options.crop;
		if (finalCrop) finalCrop = clampCropRectangle(finalCrop, rotatedWidth, rotatedHeight);
		const cropWidth = finalCrop ? finalCrop.width : rotatedWidth;
		const cropHeight = finalCrop ? finalCrop.height : rotatedHeight;
		const originalAspectRatio = cropWidth / cropHeight;
		let targetWidth;
		let targetHeight;
		if (options.width !== void 0 && options.height === void 0) {
			targetWidth = options.width;
			targetHeight = targetWidth / originalAspectRatio;
		} else if (options.width === void 0 && options.height !== void 0) {
			targetHeight = options.height;
			targetWidth = targetHeight * originalAspectRatio;
		} else if (options.width !== void 0 && options.height !== void 0) {
			targetWidth = options.width;
			targetHeight = options.height;
		} else {
			targetWidth = cropWidth;
			targetHeight = cropHeight;
		}
		targetWidth = roundToMultiple(targetWidth, options.roundDimensionsTo ?? 1);
		targetHeight = roundToMultiple(targetHeight, options.roundDimensionsTo ?? 1);
		const description = {
			width: targetWidth,
			height: targetHeight,
			fit: options.fit ?? "fill",
			rotation,
			flip,
			crop: finalCrop ?? {
				left: 0,
				top: 0,
				width: rotatedWidth,
				height: rotatedHeight
			},
			alpha: options.alpha ?? "keep"
		};
		for (const transformer of registeredVideoSampleTransformers) {
			let result = transformer(this, description);
			if (isThenable(result)) result = await result;
			if (result !== null) return result;
		}
		const { canvas, context, isNew } = getTransformationCanvas(description.width, description.height);
		this._drawWithFitAndMipmapping(canvas, context, {
			fit: description.fit,
			rotation: description.rotation,
			flip: description.flip,
			crop: description.crop,
			targetIsFresh: isNew,
			fillBlack: description.alpha === "discard"
		});
		return new VideoSample(canvas, {
			timestamp: this.timestamp,
			duration: this.duration,
			rotation: 0,
			flip: false
		});
	}
	/** Sets the rotation metadata of this video sample. */
	setRotation(newRotation) {
		if (![
			0,
			90,
			180,
			270
		].includes(newRotation)) throw new TypeError("newRotation must be 0, 90, 180, or 270.");
		this.rotation = newRotation;
	}
	/** Sets the flip metadata of this video sample. */
	setFlip(newFlip) {
		if (typeof newFlip !== "boolean") throw new TypeError("newFlip must be a boolean.");
		this.flip = newFlip;
	}
	/** Sets the presentation timestamp of this video sample, in seconds. */
	setTimestamp(newTimestamp) {
		if (!Number.isFinite(newTimestamp)) throw new TypeError("newTimestamp must be a number.");
		this.timestamp = newTimestamp;
	}
	/** Sets the duration of this video sample, in seconds. */
	setDuration(newDuration) {
		if (!Number.isFinite(newDuration) || newDuration < 0) throw new TypeError("newDuration must be a non-negative number.");
		this.duration = newDuration;
	}
	/** Sets the encode options used when this sample is passed to an encoder. */
	setEncodeOptions(newEncodeOptions) {
		if (!newEncodeOptions || typeof newEncodeOptions !== "object") throw new TypeError("newEncodeOptions must be an object.");
		this.encodeOptions = newEncodeOptions;
	}
	/** Calls `.close()`. */
	[Symbol.dispose]() {
		this.close();
	}
};
var registeredVideoSampleTransformers = [];
var TRANSFORMATION_CANVAS_CACHE_MAX_SIZE = 3;
var transformationCanvasCache = [];
var transformationCanvasCacheNextAge = 0;
var getTransformationCanvas = (width, height) => {
	for (const entry of transformationCanvasCache) if (entry.canvas.width === width && entry.canvas.height === height) {
		entry.age = transformationCanvasCacheNextAge++;
		return {
			canvas: entry.canvas,
			context: entry.context,
			isNew: false
		};
	}
	let canvas;
	if (typeof OffscreenCanvas !== "undefined") canvas = new OffscreenCanvas(width, height);
	else {
		if (typeof window === "undefined" || typeof document === "undefined") throw new Error("Cannot transform VideoSamples in this environment. Either run in an environment with OffscreenCanvas or HTMLCanvasElement, or supply a custom VideoSample transformer using registerVideoSampleTransformer().");
		canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
	}
	const context = canvas.getContext("2d", {
		alpha: true,
		willReadFrequently: false
	});
	if (!context) throw new Error("The '2d' canvas context is required to transform VideoSamples. Register a custom transformer using registerVideoSampleTransformer to work around this limitation.");
	if (transformationCanvasCache.length >= TRANSFORMATION_CANVAS_CACHE_MAX_SIZE) transformationCanvasCache.splice(arrayArgmin(transformationCanvasCache, (x) => x.age), 1);
	transformationCanvasCache.push({
		canvas,
		context,
		age: transformationCanvasCacheNextAge++
	});
	return {
		canvas,
		context,
		isNew: true
	};
};
/**
* Describes the color space of a {@link VideoSample}. Corresponds to the WebCodecs API's VideoColorSpace.
* @group Samples
* @public
*/
var VideoSampleColorSpace = class {
	/** Creates a new VideoSampleColorSpace. */
	constructor(init) {
		if (init !== void 0) {
			if (!init || typeof init !== "object") throw new TypeError("init.colorSpace, when provided, must be an object.");
			const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
			if (init.primaries != null && !primariesValues.includes(init.primaries)) throw new TypeError(`init.colorSpace.primaries, when provided, must be one of ${primariesValues.join(", ")}.`);
			const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
			if (init.transfer != null && !transferValues.includes(init.transfer)) throw new TypeError(`init.colorSpace.transfer, when provided, must be one of ${transferValues.join(", ")}.`);
			const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
			if (init.matrix != null && !matrixValues.includes(init.matrix)) throw new TypeError(`init.colorSpace.matrix, when provided, must be one of ${matrixValues.join(", ")}.`);
			if (init.fullRange != null && typeof init.fullRange !== "boolean") throw new TypeError("init.colorSpace.fullRange, when provided, must be a boolean.");
		}
		this.primaries = init?.primaries ?? null;
		this.transfer = init?.transfer ?? null;
		this.matrix = init?.matrix ?? null;
		this.fullRange = init?.fullRange ?? null;
	}
	/** Serializes the color space to a JSON object. */
	toJSON() {
		return {
			primaries: this.primaries,
			transfer: this.transfer,
			matrix: this.matrix,
			fullRange: this.fullRange
		};
	}
};
var isVideoFrame = (x) => {
	return typeof VideoFrame !== "undefined" && x instanceof VideoFrame;
};
var clampCropRectangle = (crop, outerWidth, outerHeight) => {
	const left = Math.min(crop.left, outerWidth);
	const top = Math.min(crop.top, outerHeight);
	const width = Math.min(crop.width, outerWidth - left);
	const height = Math.min(crop.height, outerHeight - top);
	assert(width >= 0);
	assert(height >= 0);
	return {
		left,
		top,
		width,
		height
	};
};
var validateCropRectangle = (crop, prefix) => {
	if (!crop || typeof crop !== "object") throw new TypeError(prefix + "crop, when provided, must be an object.");
	if (!Number.isInteger(crop.left) || crop.left < 0) throw new TypeError(prefix + "crop.left must be a non-negative integer.");
	if (!Number.isInteger(crop.top) || crop.top < 0) throw new TypeError(prefix + "crop.top must be a non-negative integer.");
	if (!Number.isInteger(crop.width) || crop.width < 0) throw new TypeError(prefix + "crop.width must be a non-negative integer.");
	if (!Number.isInteger(crop.height) || crop.height < 0) throw new TypeError(prefix + "crop.height must be a non-negative integer.");
};
var validateVideoFrameCopyToOptions = (options) => {
	if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
	if (options.colorSpace !== void 0 && !["display-p3", "srgb"].includes(options.colorSpace)) throw new TypeError("options.colorSpace, when provided, must be 'display-p3' or 'srgb'.");
	if (options.format !== void 0 && typeof options.format !== "string") throw new TypeError("options.format, when provided, must be a string.");
	if (options.layout !== void 0) {
		if (!Array.isArray(options.layout)) throw new TypeError("options.layout, when provided, must be an array.");
		for (const plane of options.layout) {
			if (!plane || typeof plane !== "object") throw new TypeError("Each entry in options.layout must be an object.");
			if (!Number.isInteger(plane.offset) || plane.offset < 0) throw new TypeError("plane.offset must be a non-negative integer.");
			if (!Number.isInteger(plane.stride) || plane.stride < 0) throw new TypeError("plane.stride must be a non-negative integer.");
		}
	}
	if (options.rect !== void 0) {
		if (!options.rect || typeof options.rect !== "object") throw new TypeError("options.rect, when provided, must be an object.");
		if (options.rect.x !== void 0 && (!Number.isInteger(options.rect.x) || options.rect.x < 0)) throw new TypeError("options.rect.x, when provided, must be a non-negative integer.");
		if (options.rect.y !== void 0 && (!Number.isInteger(options.rect.y) || options.rect.y < 0)) throw new TypeError("options.rect.y, when provided, must be a non-negative integer.");
		if (options.rect.width !== void 0 && (!Number.isInteger(options.rect.width) || options.rect.width < 0)) throw new TypeError("options.rect.width, when provided, must be a non-negative integer.");
		if (options.rect.height !== void 0 && (!Number.isInteger(options.rect.height) || options.rect.height < 0)) throw new TypeError("options.rect.height, when provided, must be a non-negative integer.");
	}
};
/** Implements logic from WebCodecs § 9.4.6 "Compute Layout and Allocation Size" */
var createDefaultPlaneLayout = (format, codedWidth, codedHeight) => {
	const planes = getPlaneConfigs(format);
	const layouts = [];
	let currentOffset = 0;
	for (const plane of planes) {
		const planeWidth = Math.ceil(codedWidth / plane.widthDivisor);
		const planeHeight = Math.ceil(codedHeight / plane.heightDivisor);
		const stride = planeWidth * plane.sampleBytes;
		const planeSize = stride * planeHeight;
		layouts.push({
			offset: currentOffset,
			stride
		});
		currentOffset += planeSize;
	}
	return layouts;
};
/** Helper to retrieve plane configurations based on WebCodecs § 9.8 Pixel Format definitions. */
var getPlaneConfigs = (format) => {
	const yuv = (yBytes, uvBytes, subX, subY, hasAlpha) => {
		const configs = [
			{
				sampleBytes: yBytes,
				widthDivisor: 1,
				heightDivisor: 1
			},
			{
				sampleBytes: uvBytes,
				widthDivisor: subX,
				heightDivisor: subY
			},
			{
				sampleBytes: uvBytes,
				widthDivisor: subX,
				heightDivisor: subY
			}
		];
		if (hasAlpha) configs.push({
			sampleBytes: yBytes,
			widthDivisor: 1,
			heightDivisor: 1
		});
		return configs;
	};
	switch (format) {
		case "I420": return yuv(1, 1, 2, 2, false);
		case "I420P10":
		case "I420P12": return yuv(2, 2, 2, 2, false);
		case "I420A": return yuv(1, 1, 2, 2, true);
		case "I420AP10":
		case "I420AP12": return yuv(2, 2, 2, 2, true);
		case "I422": return yuv(1, 1, 2, 1, false);
		case "I422P10":
		case "I422P12": return yuv(2, 2, 2, 1, false);
		case "I422A": return yuv(1, 1, 2, 1, true);
		case "I422AP10":
		case "I422AP12": return yuv(2, 2, 2, 1, true);
		case "I444": return yuv(1, 1, 1, 1, false);
		case "I444P10":
		case "I444P12": return yuv(2, 2, 1, 1, false);
		case "I444A": return yuv(1, 1, 1, 1, true);
		case "I444AP10":
		case "I444AP12": return yuv(2, 2, 1, 1, true);
		case "NV12": return [{
			sampleBytes: 1,
			widthDivisor: 1,
			heightDivisor: 1
		}, {
			sampleBytes: 2,
			widthDivisor: 2,
			heightDivisor: 2
		}];
		case "RGBA":
		case "RGBX":
		case "BGRA":
		case "BGRX": return [{
			sampleBytes: 4,
			widthDivisor: 1,
			heightDivisor: 1
		}];
		default:
			assertNever(format);
			assert(false);
	}
};
/** Taken from the WebCodecs spec. */
var ParseVideoFrameCopyToOptions = (sample, options) => {
	const defaultRect = {
		left: 0,
		top: 0,
		width: sample.codedWidth,
		height: sample.codedHeight
	};
	const overrideRect = options.rect;
	const parsedRect = ParseVisibleRect(defaultRect, overrideRect, sample.codedWidth, sample.codedHeight, sample.format);
	const optLayout = options.layout;
	let format;
	if (!options.format || options.format === sample.format) format = sample.format;
	else if ([
		"RGBA",
		"RGBX",
		"BGRA",
		"BGRX"
	].includes(options.format)) format = options.format;
	else throw new Error("NotSupportedError: Invalid destination format.");
	return ComputeLayoutAndAllocationSize(parsedRect, format, optLayout);
};
/** Taken from the WebCodecs spec. */
var ParseVisibleRect = (defaultRect, overrideRect, codedWidth, codedHeight, format) => {
	const sourceRect = { ...defaultRect };
	if (overrideRect !== void 0) {
		if (overrideRect.width === 0 || overrideRect.height === 0) throw new TypeError("visibleRect dimensions cannot be zero.");
		if ((overrideRect.x || 0) + (overrideRect.width || 0) > codedWidth) throw new TypeError("visibleRect exceeds codedWidth.");
		if ((overrideRect.y || 0) + (overrideRect.height || 0) > codedHeight) throw new TypeError("visibleRect exceeds codedHeight.");
		sourceRect.x = overrideRect.x || 0;
		sourceRect.y = overrideRect.y || 0;
		sourceRect.width = overrideRect.width || 0;
		sourceRect.height = overrideRect.height || 0;
	}
	if (!VerifyRectOffsetAlignment(format, sourceRect)) throw new TypeError("visibleRect alignment is invalid for the format.");
	return sourceRect;
};
/** Taken from the WebCodecs spec. */
var VerifyRectOffsetAlignment = (format, rect) => {
	if (format === null) return true;
	const planes = getPlaneConfigs(format);
	for (let planeIndex = 0; planeIndex < planes.length; planeIndex++) {
		const plane = planes[planeIndex];
		const sampleWidth = plane.widthDivisor;
		const sampleHeight = plane.heightDivisor;
		if ((rect.x || 0) % sampleWidth !== 0) return false;
		if ((rect.y || 0) % sampleHeight !== 0) return false;
	}
	return true;
};
/** Taken from the WebCodecs spec. */
var ComputeLayoutAndAllocationSize = (parsedRect, format, layout) => {
	const planes = getPlaneConfigs(format);
	const numPlanes = planes.length;
	if (layout !== void 0 && layout.length !== numPlanes) throw new TypeError(`Layout must have ${numPlanes} planes.`);
	let minAllocationSize = 0;
	const computedLayouts = [];
	const endOffsets = [];
	for (let planeIndex = 0; planeIndex < numPlanes; planeIndex++) {
		const plane = planes[planeIndex];
		const sampleBytes = plane.sampleBytes;
		const sampleWidth = plane.widthDivisor;
		const sampleHeight = plane.heightDivisor;
		const computedLayout = {
			destinationOffset: 0,
			destinationStride: 0,
			sourceTop: 0,
			sourceHeight: 0,
			sourceLeftBytes: 0,
			sourceWidthBytes: 0
		};
		computedLayout.sourceTop = Math.ceil(Math.trunc(parsedRect.y || 0) / sampleHeight);
		computedLayout.sourceHeight = Math.ceil(Math.trunc(parsedRect.height || 0) / sampleHeight);
		computedLayout.sourceLeftBytes = Math.floor(Math.trunc(parsedRect.x || 0) / sampleWidth) * sampleBytes;
		computedLayout.sourceWidthBytes = Math.floor(Math.trunc(parsedRect.width || 0) / sampleWidth) * sampleBytes;
		if (layout !== void 0) {
			const planeLayout = layout[planeIndex];
			if (planeLayout.stride < computedLayout.sourceWidthBytes) throw new TypeError(`Stride for plane ${planeIndex} is too small.`);
			computedLayout.destinationOffset = planeLayout.offset;
			computedLayout.destinationStride = planeLayout.stride;
		} else {
			computedLayout.destinationOffset = minAllocationSize;
			computedLayout.destinationStride = computedLayout.sourceWidthBytes;
		}
		const planeEnd = computedLayout.destinationStride * computedLayout.sourceHeight + computedLayout.destinationOffset;
		if (planeEnd > 4294967295) throw new TypeError("Allocation size exceeds limit.");
		endOffsets.push(planeEnd);
		minAllocationSize = Math.max(minAllocationSize, planeEnd);
		for (let earlierPlaneIndex = 0; earlierPlaneIndex < planeIndex; earlierPlaneIndex++) {
			const earlierLayout = computedLayouts[earlierPlaneIndex];
			if (endOffsets[planeIndex] <= earlierLayout.destinationOffset || endOffsets[earlierPlaneIndex] <= computedLayout.destinationOffset) continue;
			throw new TypeError("Planes overlap.");
		}
		computedLayouts.push(computedLayout);
	}
	return {
		allocationSize: minAllocationSize,
		computedLayouts
	};
};
var AUDIO_SAMPLE_FORMATS = /* @__PURE__ */ new Set([
	"f32",
	"f32-planar",
	"s16",
	"s16-planar",
	"s32",
	"s32-planar",
	"u8",
	"u8-planar"
]);
/**
* Abstract base class for custom audio sample resources. Implement this class to provide custom backing
* for AudioSample instances.
* @group Samples
* @public
*/
var AudioSampleResource = class {
	constructor() {
		/** @internal */
		this._referenceCount = 0;
	}
};
/**
* Represents a raw, unencoded audio sample. Mainly used as an expressive wrapper around WebCodecs API's
* [`AudioData`](https://developer.mozilla.org/en-US/docs/Web/API/AudioData), but can also be used standalone.
* @group Samples
* @public
*/
var AudioSample = class AudioSample {
	/** The presentation timestamp of the sample in microseconds. */
	get microsecondTimestamp() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
	}
	/** The duration of the sample in microseconds. */
	get microsecondDuration() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
	}
	constructor(init) {
		/** @internal */
		this._closed = false;
		if (isAudioData(init)) {
			if (init.format === null) throw new TypeError("AudioData with null format is not supported.");
			this._data = init;
			this.format = init.format;
			this.sampleRate = init.sampleRate;
			this.numberOfFrames = init.numberOfFrames;
			this.numberOfChannels = init.numberOfChannels;
			this.timestamp = init.timestamp / 1e6;
			this.duration = init.numberOfFrames / init.sampleRate;
		} else if (init instanceof AudioSampleResource) {
			this._data = init;
			init._referenceCount++;
			this.format = init.getFormat();
			if (!AUDIO_SAMPLE_FORMATS.has(this.format)) throw new TypeError("getFormat() must return an AudioSampleFormat.");
			this.sampleRate = init.getSampleRate();
			if (!Number.isInteger(this.sampleRate) || this.sampleRate <= 0) throw new TypeError("getSampleRate() must return a positive integer.");
			this.numberOfFrames = init.getNumberOfFrames();
			if (!Number.isInteger(this.numberOfFrames) || this.numberOfFrames < 0) throw new TypeError("getNumberOfFrames() must return a non-negative integer.");
			this.numberOfChannels = init.getNumberOfChannels();
			if (!Number.isInteger(this.numberOfChannels) || this.numberOfChannels <= 0) throw new TypeError("getNumberOfChannels() must return a positive integer.");
			this.timestamp = init.getTimestamp();
			if (!Number.isFinite(this.timestamp)) throw new TypeError("getTimestamp() must return a finite number.");
			this.duration = this.numberOfFrames / this.sampleRate;
		} else {
			if (!init || typeof init !== "object") throw new TypeError("Invalid AudioDataInit: must be an object.");
			if (!AUDIO_SAMPLE_FORMATS.has(init.format)) throw new TypeError("Invalid AudioDataInit: invalid format.");
			if (!Number.isFinite(init.sampleRate) || init.sampleRate <= 0) throw new TypeError("Invalid AudioDataInit: sampleRate must be > 0.");
			if (!Number.isInteger(init.numberOfChannels) || init.numberOfChannels === 0) throw new TypeError("Invalid AudioDataInit: numberOfChannels must be an integer > 0.");
			if (!Number.isFinite(init?.timestamp)) throw new TypeError("init.timestamp must be a number.");
			const numberOfFrames = init.data.byteLength / (getBytesPerSample(init.format) * init.numberOfChannels);
			if (!Number.isInteger(numberOfFrames)) throw new TypeError("Invalid AudioDataInit: data size is not a multiple of frame size.");
			this.format = init.format;
			this.sampleRate = init.sampleRate;
			this.numberOfFrames = numberOfFrames;
			this.numberOfChannels = init.numberOfChannels;
			this.timestamp = init.timestamp;
			this.duration = numberOfFrames / init.sampleRate;
			let dataBuffer;
			if (init.data instanceof ArrayBuffer) dataBuffer = new Uint8Array(init.data);
			else if (ArrayBuffer.isView(init.data)) dataBuffer = new Uint8Array(init.data.buffer, init.data.byteOffset, init.data.byteLength);
			else throw new TypeError("Invalid AudioDataInit: data is not a BufferSource.");
			const expectedSize = this.numberOfFrames * this.numberOfChannels * getBytesPerSample(this.format);
			if (dataBuffer.byteLength < expectedSize) throw new TypeError("Invalid AudioDataInit: insufficient data size.");
			this._data = dataBuffer;
		}
		finalizationRegistry?.register(this, {
			type: "audio",
			data: this._data
		}, this);
	}
	/** Returns the number of bytes required to hold the audio sample's data as specified by the given options. */
	allocationSize(options) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) throw new TypeError("planeIndex must be a non-negative integer.");
		if (options.format !== void 0 && !AUDIO_SAMPLE_FORMATS.has(options.format)) throw new TypeError("Invalid format.");
		if (options.frameOffset !== void 0 && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) throw new TypeError("frameOffset must be a non-negative integer.");
		if (options.frameCount !== void 0 && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) throw new TypeError("frameCount must be a non-negative integer.");
		if (this._closed) throw new Error("AudioSample is closed.");
		const destFormat = options.format ?? this.format;
		const frameOffset = options.frameOffset ?? 0;
		if (frameOffset >= this.numberOfFrames) throw new RangeError("frameOffset out of range");
		const copyFrameCount = options.frameCount !== void 0 ? options.frameCount : this.numberOfFrames - frameOffset;
		if (copyFrameCount > this.numberOfFrames - frameOffset) throw new RangeError("frameCount out of range");
		const bytesPerSample = getBytesPerSample(destFormat);
		const isPlanar = formatIsPlanar(destFormat);
		if (isPlanar && options.planeIndex >= this.numberOfChannels) throw new RangeError("planeIndex out of range");
		if (!isPlanar && options.planeIndex !== 0) throw new RangeError("planeIndex out of range");
		return (isPlanar ? copyFrameCount : copyFrameCount * this.numberOfChannels) * bytesPerSample;
	}
	/** Copies the audio sample's data to an ArrayBuffer or ArrayBufferView as specified by the given options. */
	copyTo(destination, options) {
		if (!isAllowSharedBufferSource(destination)) throw new TypeError("destination must be an ArrayBuffer or an ArrayBuffer view.");
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (!Number.isInteger(options.planeIndex) || options.planeIndex < 0) throw new TypeError("planeIndex must be a non-negative integer.");
		if (options.format !== void 0 && !AUDIO_SAMPLE_FORMATS.has(options.format)) throw new TypeError("Invalid format.");
		if (options.frameOffset !== void 0 && (!Number.isInteger(options.frameOffset) || options.frameOffset < 0)) throw new TypeError("frameOffset must be a non-negative integer.");
		if (options.frameCount !== void 0 && (!Number.isInteger(options.frameCount) || options.frameCount < 0)) throw new TypeError("frameCount must be a non-negative integer.");
		if (this._closed) throw new Error("AudioSample is closed.");
		const { format, frameCount: optFrameCount, frameOffset: optFrameOffset } = options;
		let { planeIndex } = options;
		let srcFormat = this.format;
		const destFormat = format ?? this.format;
		if (!destFormat) throw new Error("Destination format not determined");
		const numFrames = this.numberOfFrames;
		const numChannels = this.numberOfChannels;
		const frameOffset = optFrameOffset ?? 0;
		if (frameOffset >= numFrames) throw new RangeError("frameOffset out of range");
		const copyFrameCount = optFrameCount !== void 0 ? optFrameCount : numFrames - frameOffset;
		if (copyFrameCount > numFrames - frameOffset) throw new RangeError("frameCount out of range");
		const destBytesPerSample = getBytesPerSample(destFormat);
		const destIsPlanar = formatIsPlanar(destFormat);
		if (destIsPlanar && planeIndex >= numChannels) throw new RangeError("planeIndex out of range");
		if (!destIsPlanar && planeIndex !== 0) throw new RangeError("planeIndex out of range");
		const requiredSize = (destIsPlanar ? copyFrameCount : copyFrameCount * numChannels) * destBytesPerSample;
		if (destination.byteLength < requiredSize) throw new RangeError("Destination buffer is too small");
		const destView = toDataView(destination);
		const writeFn = getWriteFunction(destFormat);
		if (isAudioData(this._data)) {
			if (isWebKit() && numChannels > 2 && destFormat !== srcFormat) {
				doAudioDataCopyToWebKitWorkaround(this._data, destView, srcFormat, destFormat, numChannels, planeIndex, frameOffset, copyFrameCount);
				return;
			} else try {
				this._data.copyTo(destination, {
					planeIndex,
					frameOffset,
					frameCount: copyFrameCount,
					format: destFormat
				});
				return;
			} catch (error) {
				if (destFormat === "f32-planar") throw error;
				srcFormat = "f32-planar";
			}
		}
		const readFn = getReadFunction(srcFormat);
		const srcBytesPerSample = getBytesPerSample(srcFormat);
		const srcIsPlanar = formatIsPlanar(srcFormat);
		let uint8Data;
		if (this._data instanceof AudioSampleResource) {
			const getDataPlaneValidated = (index) => {
				const result = this._data.getDataPlane(index);
				if (!(result instanceof Uint8Array)) throw new TypeError("getDataPlane() must return a Uint8Array.");
				const expectedSize = numFrames * srcBytesPerSample * (srcIsPlanar ? 1 : numChannels);
				if (result.byteLength !== expectedSize) throw new TypeError(`Data plane ${index} has invalid size. Expected exactly ${expectedSize} bytes, got ${result.byteLength} bytes.`);
				return result;
			};
			if (srcIsPlanar) {
				if (destIsPlanar) {
					uint8Data = getDataPlaneValidated(planeIndex);
					planeIndex = 0;
				} else {
					uint8Data = new Uint8Array(numFrames * srcBytesPerSample * numChannels);
					for (let ch = 0; ch < numChannels; ch++) {
						const planeData = getDataPlaneValidated(ch);
						uint8Data.set(planeData, ch * numFrames * srcBytesPerSample);
					}
				}
			} else uint8Data = getDataPlaneValidated(0);
		} else if (this._data instanceof Uint8Array) uint8Data = this._data;
		else {
			assert(srcFormat === "f32-planar");
			if (destIsPlanar) {
				uint8Data = new Uint8Array(this._data.allocationSize({
					format: "f32-planar",
					planeIndex
				}));
				this._data.copyTo(uint8Data, {
					format: "f32-planar",
					planeIndex
				});
				planeIndex = 0;
			} else {
				uint8Data = new Uint8Array(this._data.allocationSize({
					format: "f32-planar",
					planeIndex: 0
				}) * numChannels);
				for (let ch = 0; ch < numChannels; ch++) this._data.copyTo(uint8Data.subarray(ch * numFrames * srcBytesPerSample, (ch + 1) * numFrames * srcBytesPerSample), {
					format: "f32-planar",
					planeIndex: ch
				});
			}
		}
		const srcView = toDataView(uint8Data);
		for (let i = 0; i < copyFrameCount; i++) if (destIsPlanar) {
			const destOffset = i * destBytesPerSample;
			let srcOffset;
			if (srcIsPlanar) srcOffset = (planeIndex * numFrames + (i + frameOffset)) * srcBytesPerSample;
			else srcOffset = ((i + frameOffset) * numChannels + planeIndex) * srcBytesPerSample;
			writeFn(destView, destOffset, readFn(srcView, srcOffset));
		} else for (let ch = 0; ch < numChannels; ch++) {
			const destOffset = (i * numChannels + ch) * destBytesPerSample;
			let srcOffset;
			if (srcIsPlanar) srcOffset = (ch * numFrames + (i + frameOffset)) * srcBytesPerSample;
			else srcOffset = ((i + frameOffset) * numChannels + ch) * srcBytesPerSample;
			writeFn(destView, destOffset, readFn(srcView, srcOffset));
		}
	}
	/** Clones this audio sample. */
	clone() {
		if (this._closed) throw new Error("AudioSample is closed.");
		if (this._data instanceof AudioSampleResource) {
			const sample = new AudioSample(this._data);
			sample.setTimestamp(this.timestamp);
			return sample;
		} else if (isAudioData(this._data)) {
			const sample = new AudioSample(this._data.clone());
			sample.setTimestamp(this.timestamp);
			return sample;
		} else return new AudioSample({
			format: this.format,
			sampleRate: this.sampleRate,
			numberOfFrames: this.numberOfFrames,
			numberOfChannels: this.numberOfChannels,
			timestamp: this.timestamp,
			data: this._data
		});
	}
	/**
	* Returns a new {@link AudioSample} containing only the frames in the range [startFrame, endFrame). Both bounds
	* must lie within this sample's range of frames. The returned sample's timestamp is shifted to match the start of
	* the trimmed section.
	*/
	trim(startFrame, endFrame = this.numberOfFrames) {
		if (!Number.isInteger(startFrame) || startFrame < 0) throw new TypeError("startFrame must be a non-negative integer.");
		if (!Number.isInteger(endFrame) || endFrame < 0) throw new TypeError("endFrame must be a non-negative integer.");
		if (startFrame > this.numberOfFrames) throw new RangeError("startFrame out of range.");
		if (endFrame > this.numberOfFrames) throw new RangeError("endFrame out of range.");
		if (endFrame < startFrame) throw new RangeError("endFrame must not be less than startFrame.");
		if (this._closed) throw new Error("AudioSample is closed.");
		const frameCount = endFrame - startFrame;
		const bytesPerSample = getBytesPerSample(this.format);
		let data;
		if (formatIsPlanar(this.format)) {
			const planeSize = frameCount * bytesPerSample;
			data = new Uint8Array(planeSize * this.numberOfChannels);
			if (frameCount > 0) for (let i = 0; i < this.numberOfChannels; i++) this.copyTo(data.subarray(i * planeSize, (i + 1) * planeSize), {
				planeIndex: i,
				format: this.format,
				frameOffset: startFrame,
				frameCount
			});
		} else {
			data = new Uint8Array(frameCount * this.numberOfChannels * bytesPerSample);
			if (frameCount > 0) this.copyTo(data, {
				planeIndex: 0,
				format: this.format,
				frameOffset: startFrame,
				frameCount
			});
		}
		return new AudioSample({
			data,
			format: this.format,
			sampleRate: this.sampleRate,
			numberOfChannels: this.numberOfChannels,
			timestamp: this.timestamp + startFrame / this.sampleRate
		});
	}
	/**
	* Closes this audio sample, releasing held resources. Audio samples should be closed as soon as they are not
	* needed anymore.
	*/
	close() {
		if (this._closed) return;
		finalizationRegistry?.unregister(this);
		if (this._data instanceof AudioSampleResource) {
			this._data._referenceCount--;
			if (this._data._referenceCount === 0) this._data.close();
		} else if (isAudioData(this._data)) this._data.close();
		else this._data = /* @__PURE__ */ new Uint8Array(0);
		this._closed = true;
	}
	/**
	* Converts this audio sample to an AudioData for use with the WebCodecs API. The AudioData returned by this
	* method *must* be closed separately from this audio sample.
	*/
	toAudioData() {
		if (this._closed) throw new Error("AudioSample is closed.");
		if (this._data instanceof AudioSampleResource) return this._createAudioDataFromData();
		else if (isAudioData(this._data)) {
			if (this._data.timestamp === this.microsecondTimestamp) return this._data.clone();
			else return this._createAudioDataFromData();
		} else return new AudioData({
			format: this.format,
			sampleRate: this.sampleRate,
			numberOfFrames: this.numberOfFrames,
			numberOfChannels: this.numberOfChannels,
			timestamp: this.microsecondTimestamp,
			data: this._data.buffer instanceof ArrayBuffer ? this._data : this._data.slice()
		});
	}
	/** @internal */
	_createAudioDataFromData() {
		if (formatIsPlanar(this.format)) {
			const size = this.allocationSize({
				planeIndex: 0,
				format: this.format
			});
			const data = new ArrayBuffer(size * this.numberOfChannels);
			for (let i = 0; i < this.numberOfChannels; i++) this.copyTo(new Uint8Array(data, i * size, size), {
				planeIndex: i,
				format: this.format
			});
			return new AudioData({
				format: this.format,
				sampleRate: this.sampleRate,
				numberOfFrames: this.numberOfFrames,
				numberOfChannels: this.numberOfChannels,
				timestamp: this.microsecondTimestamp,
				data
			});
		} else {
			const data = new ArrayBuffer(this.allocationSize({
				planeIndex: 0,
				format: this.format
			}));
			this.copyTo(data, {
				planeIndex: 0,
				format: this.format
			});
			return new AudioData({
				format: this.format,
				sampleRate: this.sampleRate,
				numberOfFrames: this.numberOfFrames,
				numberOfChannels: this.numberOfChannels,
				timestamp: this.microsecondTimestamp,
				data
			});
		}
	}
	/** Convert this audio sample to an AudioBuffer for use with the Web Audio API. */
	toAudioBuffer() {
		if (this._closed) throw new Error("AudioSample is closed.");
		const audioBuffer = new AudioBuffer({
			numberOfChannels: this.numberOfChannels,
			length: this.numberOfFrames,
			sampleRate: this.sampleRate
		});
		const dataBytes = new Float32Array(this.allocationSize({
			planeIndex: 0,
			format: "f32-planar"
		}) / 4);
		for (let i = 0; i < this.numberOfChannels; i++) {
			this.copyTo(dataBytes, {
				planeIndex: i,
				format: "f32-planar"
			});
			audioBuffer.copyToChannel(dataBytes, i);
		}
		return audioBuffer;
	}
	/** Sets the presentation timestamp of this audio sample, in seconds. */
	setTimestamp(newTimestamp) {
		if (!Number.isFinite(newTimestamp)) throw new TypeError("newTimestamp must be a number.");
		this.timestamp = newTimestamp;
	}
	/** Calls `.close()`. */
	[Symbol.dispose]() {
		this.close();
	}
	/** @internal */
	static *_fromAudioBuffer(audioBuffer, timestamp) {
		if (!(audioBuffer instanceof AudioBuffer)) throw new TypeError("audioBuffer must be an AudioBuffer.");
		const MAX_FLOAT_COUNT = 24e4;
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;
		const totalFrames = audioBuffer.length;
		const maxFramesPerChunk = Math.floor(MAX_FLOAT_COUNT / numberOfChannels);
		let currentRelativeFrame = 0;
		let remainingFrames = totalFrames;
		while (remainingFrames > 0) {
			const framesToCopy = Math.min(maxFramesPerChunk, remainingFrames);
			const chunkData = new Float32Array(numberOfChannels * framesToCopy);
			for (let channel = 0; channel < numberOfChannels; channel++) audioBuffer.copyFromChannel(chunkData.subarray(channel * framesToCopy, (channel + 1) * framesToCopy), channel, currentRelativeFrame);
			yield new AudioSample({
				format: "f32-planar",
				sampleRate,
				numberOfFrames: framesToCopy,
				numberOfChannels,
				timestamp: timestamp + currentRelativeFrame / sampleRate,
				data: chunkData
			});
			currentRelativeFrame += framesToCopy;
			remainingFrames -= framesToCopy;
		}
	}
	/**
	* Creates AudioSamples from an AudioBuffer, starting at the given timestamp in seconds. Typically creates exactly
	* one sample, but may create multiple if the AudioBuffer is exceedingly large.
	*/
	static fromAudioBuffer(audioBuffer, timestamp) {
		if (!(audioBuffer instanceof AudioBuffer)) throw new TypeError("audioBuffer must be an AudioBuffer.");
		const MAX_FLOAT_COUNT = 24e4;
		const numberOfChannels = audioBuffer.numberOfChannels;
		const sampleRate = audioBuffer.sampleRate;
		const totalFrames = audioBuffer.length;
		const maxFramesPerChunk = Math.floor(MAX_FLOAT_COUNT / numberOfChannels);
		let currentRelativeFrame = 0;
		let remainingFrames = totalFrames;
		const result = [];
		while (remainingFrames > 0) {
			const framesToCopy = Math.min(maxFramesPerChunk, remainingFrames);
			const chunkData = new Float32Array(numberOfChannels * framesToCopy);
			for (let channel = 0; channel < numberOfChannels; channel++) audioBuffer.copyFromChannel(chunkData.subarray(channel * framesToCopy, (channel + 1) * framesToCopy), channel, currentRelativeFrame);
			const audioSample = new AudioSample({
				format: "f32-planar",
				sampleRate,
				numberOfFrames: framesToCopy,
				numberOfChannels,
				timestamp: timestamp + currentRelativeFrame / sampleRate,
				data: chunkData
			});
			result.push(audioSample);
			currentRelativeFrame += framesToCopy;
			remainingFrames -= framesToCopy;
		}
		return result;
	}
};
var getBytesPerSample = (format) => {
	switch (format) {
		case "u8":
		case "u8-planar": return 1;
		case "s16":
		case "s16-planar": return 2;
		case "s32":
		case "s32-planar": return 4;
		case "f32":
		case "f32-planar": return 4;
		default: throw new Error("Unknown AudioSampleFormat");
	}
};
var formatIsPlanar = (format) => {
	switch (format) {
		case "u8-planar":
		case "s16-planar":
		case "s32-planar":
		case "f32-planar": return true;
		default: return false;
	}
};
var getReadFunction = (format) => {
	switch (format) {
		case "u8":
		case "u8-planar": return (view, offset) => (view.getUint8(offset) - 128) / 128;
		case "s16":
		case "s16-planar": return (view, offset) => view.getInt16(offset, true) / 32768;
		case "s32":
		case "s32-planar": return (view, offset) => view.getInt32(offset, true) / 2147483648;
		case "f32":
		case "f32-planar": return (view, offset) => view.getFloat32(offset, true);
	}
};
var getWriteFunction = (format) => {
	switch (format) {
		case "u8":
		case "u8-planar": return (view, offset, value) => view.setUint8(offset, clamp(Math.round(value * 128) + 128, 0, 255));
		case "s16":
		case "s16-planar": return (view, offset, value) => view.setInt16(offset, clamp(Math.round(value * 32768), -32768, 32767), true);
		case "s32":
		case "s32-planar": return (view, offset, value) => view.setInt32(offset, clamp(Math.round(value * 2147483648), -2147483648, 2147483647), true);
		case "f32":
		case "f32-planar": return (view, offset, value) => view.setFloat32(offset, value, true);
	}
};
var isAudioData = (x) => {
	return typeof AudioData !== "undefined" && x instanceof AudioData;
};
var toInterleavedAudioFormat = (format) => {
	switch (format) {
		case "u8-planar": return "u8";
		case "s16-planar": return "s16";
		case "s32-planar": return "s32";
		case "f32-planar": return "f32";
		default: return format;
	}
};
/**
* WebKit has a bug where calling AudioData.copyTo with a format different from the source format crashes the tab when
* there are more than 2 channels. This function works around that by always copying with the source format and then
* manually converting to the destination format.
*
* See https://bugs.webkit.org/show_bug.cgi?id=302521.
*/
var doAudioDataCopyToWebKitWorkaround = (audioData, destView, srcFormat, destFormat, numChannels, planeIndex, frameOffset, copyFrameCount) => {
	const readFn = getReadFunction(srcFormat);
	const writeFn = getWriteFunction(destFormat);
	const srcBytesPerSample = getBytesPerSample(srcFormat);
	const destBytesPerSample = getBytesPerSample(destFormat);
	const srcIsPlanar = formatIsPlanar(srcFormat);
	if (formatIsPlanar(destFormat)) {
		if (srcIsPlanar) {
			const data = new ArrayBuffer(copyFrameCount * srcBytesPerSample);
			const dataView = toDataView(data);
			audioData.copyTo(data, {
				planeIndex,
				frameOffset,
				frameCount: copyFrameCount,
				format: srcFormat
			});
			for (let i = 0; i < copyFrameCount; i++) {
				const srcOffset = i * srcBytesPerSample;
				writeFn(destView, i * destBytesPerSample, readFn(dataView, srcOffset));
			}
		} else {
			const data = new ArrayBuffer(copyFrameCount * numChannels * srcBytesPerSample);
			const dataView = toDataView(data);
			audioData.copyTo(data, {
				planeIndex: 0,
				frameOffset,
				frameCount: copyFrameCount,
				format: srcFormat
			});
			for (let i = 0; i < copyFrameCount; i++) {
				const srcOffset = (i * numChannels + planeIndex) * srcBytesPerSample;
				writeFn(destView, i * destBytesPerSample, readFn(dataView, srcOffset));
			}
		}
	} else if (srcIsPlanar) {
		const planeSize = copyFrameCount * srcBytesPerSample;
		const data = new ArrayBuffer(planeSize);
		const dataView = toDataView(data);
		for (let ch = 0; ch < numChannels; ch++) {
			audioData.copyTo(data, {
				planeIndex: ch,
				frameOffset,
				frameCount: copyFrameCount,
				format: srcFormat
			});
			for (let i = 0; i < copyFrameCount; i++) {
				const srcOffset = i * srcBytesPerSample;
				writeFn(destView, (i * numChannels + ch) * destBytesPerSample, readFn(dataView, srcOffset));
			}
		}
	} else {
		const data = new ArrayBuffer(copyFrameCount * numChannels * srcBytesPerSample);
		const dataView = toDataView(data);
		audioData.copyTo(data, {
			planeIndex: 0,
			frameOffset,
			frameCount: copyFrameCount,
			format: srcFormat
		});
		for (let i = 0; i < copyFrameCount; i++) for (let ch = 0; ch < numChannels; ch++) {
			const idx = i * numChannels + ch;
			const srcOffset = idx * srcBytesPerSample;
			writeFn(destView, idx * destBytesPerSample, readFn(dataView, srcOffset));
		}
	}
};
var audioSampleToInterleavedFormat = (sample, format) => {
	const size = sample.allocationSize({
		format,
		planeIndex: 0
	});
	const buffer = new ArrayBuffer(size);
	sample.copyTo(buffer, {
		format,
		planeIndex: 0
	});
	return new AudioSample({
		data: buffer,
		format,
		numberOfChannels: sample.numberOfChannels,
		sampleRate: sample.sampleRate,
		timestamp: sample.timestamp,
		duration: sample.duration
	});
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/encode.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var validateVideoEncodingConfig = (config) => {
	if (!config || typeof config !== "object") throw new TypeError("Encoding config must be an object.");
	if (!VIDEO_CODECS.includes(config.codec)) throw new TypeError(`Invalid video codec '${config.codec}'. Must be one of: ${VIDEO_CODECS.join(", ")}.`);
	const bitrate = config.bitrate;
	if (config.quality === void 0 && bitrate === void 0) throw new TypeError("config.quality must be provided.");
	if (config.quality !== void 0 && bitrate !== void 0) throw new TypeError("config.quality and config.bitrate cannot both be provided.");
	if (config.quality !== void 0 && !(config.quality instanceof Quality)) throw new TypeError("config.quality, when provided, must be a Quality.");
	if (bitrate !== void 0 && !(bitrate instanceof Quality) && (!Number.isInteger(bitrate) || bitrate <= 0)) throw new TypeError("config.bitrate, when provided, must be a positive integer or a quality.");
	if (config.keyFrameInterval !== void 0 && (!Number.isFinite(config.keyFrameInterval) || config.keyFrameInterval < 0)) throw new TypeError("config.keyFrameInterval, when provided, must be a non-negative number.");
	if (config.sizeChangeBehavior !== void 0 && ![
		"deny",
		"passThrough",
		"fill",
		"contain",
		"cover"
	].includes(config.sizeChangeBehavior)) throw new TypeError("config.sizeChangeBehavior, when provided, must be 'deny', 'passThrough', 'fill', 'contain' or 'cover'.");
	if (config.transform !== void 0) {
		if (typeof config.transform !== "object" || !config.transform) throw new TypeError("config.transform, when provided, must be an object.");
		if (config.transform.width !== void 0 && (!Number.isInteger(config.transform.width) || config.transform.width <= 0)) throw new TypeError("config.transform.width, when provided, must be a positive integer.");
		if (config.transform.height !== void 0 && (!Number.isInteger(config.transform.height) || config.transform.height <= 0)) throw new TypeError("config.transform.height, when provided, must be a positive integer.");
		if (config.transform.fit !== void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(config.transform.fit)) throw new TypeError("config.transform.fit, when provided, must be one of \"fill\", \"contain\", or \"cover\".");
		if (config.transform.width !== void 0 && config.transform.height !== void 0 && config.transform.fit === void 0 && ![
			"fill",
			"contain",
			"cover"
		].includes(config.sizeChangeBehavior)) throw new TypeError("When both config.transform.width and config.transform.height are provided, config.transform.fit must also be provided.");
		if (config.transform.fit !== void 0 && [
			"fill",
			"contain",
			"cover"
		].includes(config.sizeChangeBehavior) && config.transform.fit !== config.sizeChangeBehavior) throw new TypeError("config.transform.fit, when provided, cannot differ from config.sizeChangeBehavior when config.sizeChangeBehavior is 'fill', 'contain' or 'cover', as sizeChangeBehavior already determines the fitting algorithm.");
		if (config.transform.rotate !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(config.transform.rotate)) throw new TypeError("config.transform.rotate, when provided, must be 0, 90, 180 or 270.");
		if (config.transform.flip !== void 0 && typeof config.transform.flip !== "boolean") throw new TypeError("config.transform.flip, when provided, must be a boolean.");
		if (config.transform.crop !== void 0) validateCropRectangle(config.transform.crop, "config.transform.");
		if (config.transform.process !== void 0 && typeof config.transform.process !== "function") throw new TypeError("config.transform.process, when provided, must be a function.");
		if (config.transform.frameRate !== void 0 && (!Number.isFinite(config.transform.frameRate) || config.transform.frameRate <= 0)) throw new TypeError("config.transform.frameRate, when provided, must be a finite positive number.");
		if (config.transform.force !== void 0 && typeof config.transform.force !== "boolean") throw new TypeError("config.transform.force, when provided, must be a boolean.");
	}
	if (config.onEncodedPacket !== void 0 && typeof config.onEncodedPacket !== "function") throw new TypeError("config.onEncodedPacket, when provided, must be a function.");
	if (config.onEncoderConfig !== void 0 && typeof config.onEncoderConfig !== "function") throw new TypeError("config.onEncoderConfig, when provided, must be a function.");
	if (config.onEncodedSample !== void 0 && typeof config.onEncodedSample !== "function") throw new TypeError("config.onEncodedSample, when provided, must be a function.");
	validateVideoEncodingAdditionalOptions(config.codec, config);
};
var validateVideoEncodingAdditionalOptions = (codec, options) => {
	if (!options || typeof options !== "object") throw new TypeError("Encoding options must be an object.");
	if (options.alpha !== void 0 && !["discard", "keep"].includes(options.alpha)) throw new TypeError("options.alpha, when provided, must be 'discard' or 'keep'.");
	const bitrateMode = options.bitrateMode;
	if (bitrateMode !== void 0 && !["constant", "variable"].includes(bitrateMode)) throw new TypeError("bitrateMode, when provided, must be 'constant' or 'variable'.");
	if (options.latencyMode !== void 0 && !["quality", "realtime"].includes(options.latencyMode)) throw new TypeError("latencyMode, when provided, must be 'quality' or 'realtime'.");
	if (options.fullCodecString !== void 0 && typeof options.fullCodecString !== "string") throw new TypeError("fullCodecString, when provided, must be a string.");
	if (options.fullCodecString !== void 0 && inferCodecFromCodecString(options.fullCodecString) !== codec) throw new TypeError(`fullCodecString, when provided, must be a string that matches the specified codec (${codec}).`);
	if (options.hardwareAcceleration !== void 0 && ![
		"no-preference",
		"prefer-hardware",
		"prefer-software"
	].includes(options.hardwareAcceleration)) throw new TypeError("hardwareAcceleration, when provided, must be 'no-preference', 'prefer-hardware' or 'prefer-software'.");
	if (options.scalabilityMode !== void 0 && typeof options.scalabilityMode !== "string") throw new TypeError("scalabilityMode, when provided, must be a string.");
	if (options.contentHint !== void 0 && typeof options.contentHint !== "string") throw new TypeError("contentHint, when provided, must be a string.");
};
/**
* Builds the encoder configs to attempt, in order of preference. Multiple configs are returned when a Quality can be
* satisfied by multiple rate control methods (quantizer-based encoding with a bitrate-based fallback).
*/
var buildVideoEncoderConfigs = (options) => {
	const fallbackBitrateMode = options.bitrateMode;
	const rateControl = options.quality._toVideoRateControl(options.codec, options.width, options.height, fallbackBitrateMode);
	const buildConfig = (bitrate, bitrateMode, bitrateEstimate) => ({
		codec: options.fullCodecString ?? buildVideoCodecString(options.codec, options.width, options.height, bitrateEstimate, options.alpha === "keep"),
		width: options.width,
		height: options.height,
		displayWidth: options.squarePixelWidth,
		displayHeight: options.squarePixelHeight,
		bitrate,
		bitrateMode,
		alpha: options.alpha ?? "discard",
		framerate: options.framerate,
		latencyMode: options.latencyMode,
		hardwareAcceleration: options.hardwareAcceleration,
		scalabilityMode: options.scalabilityMode,
		contentHint: options.contentHint,
		...getVideoEncoderConfigExtension(options.codec)
	});
	const candidates = [];
	if (rateControl.quantizer !== null) candidates.push({
		config: buildConfig(void 0, "quantizer", rateControl.bitrate),
		quantizer: rateControl.quantizer
	});
	if (rateControl.bitrateMode !== "quantizer") candidates.push({
		config: buildConfig(rateControl.bitrate, rateControl.bitrateMode, rateControl.bitrate),
		quantizer: null
	});
	assert(candidates.length > 0);
	return candidates;
};
var validateAudioEncodingConfig = (config) => {
	if (!config || typeof config !== "object") throw new TypeError("Encoding config must be an object.");
	if (!AUDIO_CODECS.includes(config.codec)) throw new TypeError(`Invalid audio codec '${config.codec}'. Must be one of: ${AUDIO_CODECS.join(", ")}.`);
	const bitrate = config.bitrate;
	if (config.quality === void 0 && bitrate === void 0 && !(PCM_AUDIO_CODECS.includes(config.codec) || config.codec === "flac" || config.codec === "truehd")) throw new TypeError("config.quality must be provided for compressed audio codecs.");
	if (config.quality !== void 0 && bitrate !== void 0) throw new TypeError("config.quality and config.bitrate cannot both be provided.");
	if (config.quality !== void 0 && !(config.quality instanceof Quality)) throw new TypeError("config.quality, when provided, must be a Quality.");
	if (bitrate !== void 0 && !(bitrate instanceof Quality) && (!Number.isInteger(bitrate) || bitrate <= 0)) throw new TypeError("config.bitrate, when provided, must be a positive integer or a quality.");
	if (config.transform !== void 0) {
		if (typeof config.transform !== "object" || !config.transform) throw new TypeError("config.transform, when provided, must be an object.");
		if (config.transform.numberOfChannels !== void 0 && (!Number.isInteger(config.transform.numberOfChannels) || config.transform.numberOfChannels <= 0)) throw new TypeError("config.transform.numberOfChannels, when provided, must be a positive integer.");
		if (config.transform.sampleRate !== void 0 && (!Number.isInteger(config.transform.sampleRate) || config.transform.sampleRate <= 0)) throw new TypeError("config.transform.sampleRate, when provided, must be a positive integer.");
		if (config.transform.sampleFormat !== void 0 && ![
			"u8",
			"s16",
			"s32",
			"f32"
		].includes(config.transform.sampleFormat)) throw new TypeError("config.transform.sampleFormat, when provided, must be one of: u8, s16, s32, f32.");
		if (config.transform.process !== void 0 && typeof config.transform.process !== "function") throw new TypeError("config.transform.process, when provided, must be a function.");
	}
	if (config.onEncodedPacket !== void 0 && typeof config.onEncodedPacket !== "function") throw new TypeError("config.onEncodedPacket, when provided, must be a function.");
	if (config.onEncoderConfig !== void 0 && typeof config.onEncoderConfig !== "function") throw new TypeError("config.onEncoderConfig, when provided, must be a function.");
	if (config.onEncodedSample !== void 0 && typeof config.onEncodedSample !== "function") throw new TypeError("config.onEncodedSample, when provided, must be a function.");
	validateAudioEncodingAdditionalOptions(config.codec, config);
};
var validateAudioEncodingAdditionalOptions = (codec, options) => {
	if (!options || typeof options !== "object") throw new TypeError("Encoding options must be an object.");
	const bitrateMode = options.bitrateMode;
	if (bitrateMode !== void 0 && !["constant", "variable"].includes(bitrateMode)) throw new TypeError("bitrateMode, when provided, must be 'constant' or 'variable'.");
	if (options.fullCodecString !== void 0 && typeof options.fullCodecString !== "string") throw new TypeError("fullCodecString, when provided, must be a string.");
	if (options.fullCodecString !== void 0 && inferCodecFromCodecString(options.fullCodecString) !== codec) throw new TypeError(`fullCodecString, when provided, must be a string that matches the specified codec (${codec}).`);
};
var buildAudioEncoderConfig = (options) => {
	const fallbackBitrateMode = options.bitrateMode;
	return {
		codec: options.fullCodecString ?? buildAudioCodecString(options.codec, options.numberOfChannels, options.sampleRate),
		numberOfChannels: options.numberOfChannels,
		sampleRate: options.sampleRate,
		bitrate: options.quality?._toAudioBitrate(options.codec),
		bitrateMode: options.quality?._bitrateMode ?? fallbackBitrateMode,
		...getAudioEncoderConfigExtension(options.codec)
	};
};
/**
* Represents a desired encoding quality. Can express a qualitative quality level, an explicit bitrate, an explicit
* quantizer value, or a combination thereof.
* @group Encoding
* @public
*/
var Quality = class {
	constructor(options) {
		if (typeof options === "number" || typeof options === "string") options = { quality: options };
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.bitrateMode !== void 0 && !["constant", "variable"].includes(options.bitrateMode)) throw new TypeError("options.bitrateMode, when provided, must be 'constant' or 'variable'.");
		if ("quality" in options) {
			if (typeof options.quality === "string" ? !(options.quality in QUALITY_LEVELS) : typeof options.quality !== "number" || Number.isNaN(options.quality)) throw new TypeError("options.quality must be a number, or one of 'very-low', 'low', 'medium', 'high' or 'very-high'.");
			if (options.preferBitrate !== void 0 && typeof options.preferBitrate !== "boolean") throw new TypeError("options.preferBitrate, when provided, must be a boolean.");
			if ("bitrate" in options || "quantizer" in options) throw new TypeError("options.quality cannot be combined with options.bitrate or options.quantizer.");
			this._quality = typeof options.quality === "string" ? QUALITY_LEVELS[options.quality] : options.quality;
			this._preferBitrate = options.preferBitrate ?? false;
			this._bitrate = void 0;
			this._quantizer = void 0;
		} else {
			if (options.bitrate !== void 0 && (!Number.isInteger(options.bitrate) || options.bitrate <= 0)) throw new TypeError("options.bitrate, when provided, must be a positive integer.");
			if (options.quantizer !== void 0 && (!Number.isInteger(options.quantizer) || options.quantizer < 0)) throw new TypeError("options.quantizer, when provided, must be a non-negative integer.");
			if (options.bitrate === void 0 && options.quantizer === void 0) throw new TypeError("At least one of options.bitrate or options.quantizer must be set.");
			if ("preferBitrate" in options) throw new TypeError("options.preferBitrate can only be combined with options.quality.");
			this._quality = void 0;
			this._preferBitrate = false;
			this._bitrate = options.bitrate;
			this._quantizer = options.quantizer;
		}
		this._bitrateMode = options.bitrateMode;
	}
	/**
	* Determines the rate control methods usable for the given codec.
	* @internal
	*/
	_toVideoRateControl(codec, width, height, fallbackBitrateMode) {
		const quantizerSupport = VIDEO_CODEC_QUANTIZER_SUPPORT[codec];
		let quantizer = null;
		let bitrateMode = this._bitrateMode ?? fallbackBitrateMode ?? "variable";
		if (this._quantizer !== void 0) {
			if (!quantizerSupport) {
				if (this._bitrate === void 0) throw new Error(`Codec '${codec}' does not support quantizer-based encoding. Provide a bitrate in the Quality to define a fallback.`);
			} else if (this._quantizer < quantizerSupport.min || this._quantizer > quantizerSupport.max) {
				if (this._bitrate === void 0) throw new Error(`Quantizer ${this._quantizer} is out of range for codec '${codec}'; must be between ${quantizerSupport.min} and ${quantizerSupport.max}.`);
			} else {
				quantizer = this._quantizer;
				if (this._bitrate === void 0) bitrateMode = "quantizer";
			}
		} else if (this._bitrate === void 0 && quantizerSupport && !this._preferBitrate) {
			assert(this._quality !== void 0);
			quantizer = clamp(Math.round(lerp(quantizerSupport.worst, quantizerSupport.best, this._quality)), quantizerSupport.min, quantizerSupport.max);
		}
		let bitrate;
		if (this._bitrate !== void 0) bitrate = this._bitrate;
		else {
			let quality = this._quality;
			if (quality === void 0) {
				assert(quantizer !== null && quantizerSupport);
				quality = clamp((quantizer - quantizerSupport.worst) / (quantizerSupport.best - quantizerSupport.worst), 0, 1);
			}
			bitrate = computeVideoBitrate(codec, width, height, qualityToBitrateFactor(quality));
		}
		return {
			quantizer,
			bitrate,
			bitrateMode
		};
	}
	/** @internal */
	_toVideoBitrate(codec, width, height) {
		if (this._bitrate !== void 0) return this._bitrate;
		assert(this._quality !== void 0);
		return computeVideoBitrate(codec, width, height, qualityToBitrateFactor(this._quality));
	}
	/** @internal */
	_toAudioBitrate(codec) {
		if (PCM_AUDIO_CODECS.includes(codec) || codec === "flac" || codec === "truehd") return;
		if (this._bitrate !== void 0) return this._bitrate;
		if (this._quality === void 0) throw new Error("This Quality defines neither a quality level nor a bitrate and therefore cannot be used for audio encoding.");
		const factor = qualityToBitrateFactor(this._quality);
		const baseBitrate = {
			aac: 128e3,
			opus: 64e3,
			mp3: 16e4,
			vorbis: 64e3,
			ac3: 384e3,
			eac3: 192e3,
			dts: 768e3
		}[codec];
		if (!baseBitrate) throw new Error(`Unhandled codec: ${codec}`);
		let finalBitrate = baseBitrate * factor;
		if (codec === "aac") finalBitrate = [
			96e3,
			128e3,
			16e4,
			192e3
		].reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
		else if (codec === "opus" || codec === "vorbis") finalBitrate = Math.max(6e3, finalBitrate);
		else if (codec === "mp3") finalBitrate = [
			8e3,
			16e3,
			24e3,
			32e3,
			4e4,
			48e3,
			64e3,
			8e4,
			96e3,
			112e3,
			128e3,
			16e4,
			192e3,
			224e3,
			256e3,
			32e4
		].reduce((prev, curr) => Math.abs(curr - finalBitrate) < Math.abs(prev - finalBitrate) ? curr : prev);
		return Math.round(finalBitrate / 1e3) * 1e3;
	}
};
var QUALITY_LEVELS = {
	"very-low": 0,
	"low": .25,
	"medium": .5,
	"high": .75,
	"very-high": 1
};
var VIDEO_CODEC_QUANTIZER_SUPPORT = {
	avc: {
		min: 0,
		max: 51,
		worst: 41,
		best: 16
	},
	hevc: {
		min: 0,
		max: 51,
		worst: 41,
		best: 16
	},
	vp9: (getChromiumVersion() ?? Infinity) < 145 ? {
		min: 0,
		max: 63,
		worst: 52,
		best: 20
	} : {
		min: 0,
		max: 255,
		worst: 208,
		best: 80
	},
	av1: {
		min: 0,
		max: 255,
		worst: 208,
		best: 80
	}
};
/**
* Maps the qualitative 0-1 quality scale to a bitrate multiplier. The curve is a least-squares exponential fit through
* the multipliers historically used by the predefined quality levels (0.3, 0.6, 1, 2, 4).
*/
var qualityToBitrateFactor = (quality) => .3 * Math.exp(2.5538 * quality);
var computeVideoBitrate = (codec, width, height, factor) => {
	const pixels = width * height;
	const referencePixels = 2073600;
	const referenceBitrate = 3e6;
	const finalBitrate = referenceBitrate * Math.pow(pixels / referencePixels, .95) * {
		avc: 1,
		hevc: .6,
		vp9: .6,
		av1: .4,
		vp8: 1.2,
		prores: 22e7 / referenceBitrate
	}[codec] * factor;
	return Math.ceil(finalBitrate / 1e3) * 1e3;
};
/** Builds the per-frame encode options that carry the quantizer value for the given codec. */
var buildQuantizerEncodeOptions = (codec, quantizer) => {
	if (codec === "avc") return { avc: { quantizer } };
	else if (codec === "hevc") return { hevc: { quantizer } };
	else if (codec === "vp9") return { vp9: { quantizer } };
	else if (codec === "av1") return { av1: { quantizer } };
	assert(false);
};
/**
* Resolves the `quality` and deprecated `bitrate` fields from the public API into a {@link Quality}, the norm used
* internally.
*/
var resolveQuality = (quality, bitrate) => {
	if (quality !== void 0) return quality;
	if (bitrate === void 0) return;
	return bitrate instanceof Quality ? bitrate : new Quality({ bitrate });
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/custom-coder.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var customVideoEncoders = [];
var customAudioEncoders = [];
//#endregion
//#region node_modules/mediabunny/dist/modules/src/packet.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var PLACEHOLDER_DATA = /* #__PURE__ */ new Uint8Array(0);
/**
* Represents an encoded chunk of media. Mainly used as an expressive wrapper around WebCodecs API's
* [`EncodedVideoChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) and
* [`EncodedAudioChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk), but can also be used
* standalone.
* @group Packets
* @public
*/
var EncodedPacket = class EncodedPacket {
	/** Creates a new {@link EncodedPacket} from raw bytes and timing information. */
	constructor(data, type, timestamp, duration, sequenceNumber = -1, byteLength, sideData) {
		this.data = data;
		this.type = type;
		this.timestamp = timestamp;
		this.duration = duration;
		this.sequenceNumber = sequenceNumber;
		if (data === PLACEHOLDER_DATA && byteLength === void 0) throw new Error("Internal error: byteLength must be explicitly provided when constructing metadata-only packets.");
		if (byteLength === void 0) byteLength = data.byteLength;
		if (!(data instanceof Uint8Array)) throw new TypeError("data must be a Uint8Array.");
		if (type !== "key" && type !== "delta") throw new TypeError("type must be either \"key\" or \"delta\".");
		if (!Number.isFinite(timestamp)) throw new TypeError("timestamp must be a number.");
		if (!Number.isFinite(duration) || duration < 0) throw new TypeError("duration must be a non-negative number.");
		if (!Number.isFinite(sequenceNumber)) throw new TypeError("sequenceNumber must be a number.");
		if (!Number.isInteger(byteLength) || byteLength < 0) throw new TypeError("byteLength must be a non-negative integer.");
		if (sideData !== void 0 && (typeof sideData !== "object" || !sideData)) throw new TypeError("sideData, when provided, must be an object.");
		if (sideData?.alpha !== void 0 && !(sideData.alpha instanceof Uint8Array)) throw new TypeError("sideData.alpha, when provided, must be a Uint8Array.");
		if (sideData?.alphaByteLength !== void 0 && (!Number.isInteger(sideData.alphaByteLength) || sideData.alphaByteLength < 0)) throw new TypeError("sideData.alphaByteLength, when provided, must be a non-negative integer.");
		this.byteLength = byteLength;
		this.sideData = sideData ?? {};
		if (this.sideData.alpha && this.sideData.alphaByteLength === void 0) this.sideData.alphaByteLength = this.sideData.alpha.byteLength;
	}
	/**
	* If this packet is a metadata-only packet. Metadata-only packets don't contain their packet data. They are the
	* result of retrieving packets with {@link PacketRetrievalOptions.metadataOnly} set to `true`.
	*/
	get isMetadataOnly() {
		return this.data === PLACEHOLDER_DATA;
	}
	/** The timestamp of this packet in microseconds. */
	get microsecondTimestamp() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.timestamp);
	}
	/** The duration of this packet in microseconds. */
	get microsecondDuration() {
		return Math.trunc(SECOND_TO_MICROSECOND_FACTOR * this.duration);
	}
	/** Converts this packet to an
	* [`EncodedVideoChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) for use with the
	* WebCodecs API. */
	toEncodedVideoChunk() {
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
		if (typeof EncodedVideoChunk === "undefined") throw new Error("EncodedVideoChunk is not available in this environment.");
		return new EncodedVideoChunk({
			data: this.data,
			type: this.type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/**
	* Converts this packet to an
	* [`EncodedVideoChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) for use with the
	* WebCodecs API, using the alpha side data instead of the color data. Throws if no alpha side data is defined.
	*/
	alphaToEncodedVideoChunk(type = this.type) {
		if (!this.sideData.alpha) throw new TypeError("This packet does not contain alpha side data.");
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to a video chunk.");
		if (typeof EncodedVideoChunk === "undefined") throw new Error("EncodedVideoChunk is not available in this environment.");
		return new EncodedVideoChunk({
			data: this.sideData.alpha,
			type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/** Converts this packet to an
	* [`EncodedAudioChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk) for use with the
	* WebCodecs API. */
	toEncodedAudioChunk() {
		if (this.isMetadataOnly) throw new TypeError("Metadata-only packets cannot be converted to an audio chunk.");
		if (typeof EncodedAudioChunk === "undefined") throw new Error("EncodedAudioChunk is not available in this environment.");
		return new EncodedAudioChunk({
			data: this.data,
			type: this.type,
			timestamp: this.microsecondTimestamp,
			duration: this.microsecondDuration
		});
	}
	/**
	* Creates an {@link EncodedPacket} from an
	* [`EncodedVideoChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedVideoChunk) or
	* [`EncodedAudioChunk`](https://developer.mozilla.org/en-US/docs/Web/API/EncodedAudioChunk). This method is useful
	* for converting chunks from the WebCodecs API to `EncodedPacket` instances.
	*/
	static fromEncodedChunk(chunk, sideData) {
		if (!(chunk instanceof EncodedVideoChunk || chunk instanceof EncodedAudioChunk)) throw new TypeError("chunk must be an EncodedVideoChunk or EncodedAudioChunk.");
		const data = new Uint8Array(chunk.byteLength);
		chunk.copyTo(data);
		return new EncodedPacket(data, chunk.type, chunk.timestamp / 1e6, (chunk.duration ?? 0) / 1e6, void 0, void 0, sideData);
	}
	/** Clones this packet while optionally modifying the new packet's data. */
	clone(options) {
		if (options !== void 0 && (typeof options !== "object" || options === null)) throw new TypeError("options, when provided, must be an object.");
		if (options?.data !== void 0 && !(options.data instanceof Uint8Array)) throw new TypeError("options.data, when provided, must be a Uint8Array.");
		if (options?.type !== void 0 && options.type !== "key" && options.type !== "delta") throw new TypeError("options.type, when provided, must be either \"key\" or \"delta\".");
		if (options?.timestamp !== void 0 && !Number.isFinite(options.timestamp)) throw new TypeError("options.timestamp, when provided, must be a number.");
		if (options?.duration !== void 0 && !Number.isFinite(options.duration)) throw new TypeError("options.duration, when provided, must be a number.");
		if (options?.sequenceNumber !== void 0 && !Number.isFinite(options.sequenceNumber)) throw new TypeError("options.sequenceNumber, when provided, must be a number.");
		if (options?.sideData !== void 0 && (typeof options.sideData !== "object" || options.sideData === null)) throw new TypeError("options.sideData, when provided, must be an object.");
		return new EncodedPacket(options?.data ?? this.data, options?.type ?? this.type, options?.timestamp ?? this.timestamp, options?.duration ?? this.duration, options?.sequenceNumber ?? this.sequenceNumber, this.byteLength, options?.sideData ?? this.sideData);
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/resample.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Utility class to handle audio resampling, handling both sample rate resampling as well as channel up/downmixing.
* The advantage over doing this manually rather than using OfflineAudioContext to do it for us is the artifact-free
* handling of putting multiple resampled audio samples back to back, which produces flaky results using
* OfflineAudioContext.
*/
var AudioResampler = class {
	constructor(options) {
		this.sourceSampleRate = null;
		this.sourceNumberOfChannels = null;
		this.startTime = null;
		/** Start frame of current buffer */
		this.bufferStartFrame = 0;
		/** The highest index written to in the current buffer */
		this.maxWrittenFrame = null;
		this.targetSampleRate = options.targetSampleRate;
		this.targetNumberOfChannels = options.targetNumberOfChannels;
		this.onSample = options.onSample;
		this.bufferSizeInFrames = Math.floor(this.targetSampleRate * 5);
		this.bufferSizeInSamples = this.bufferSizeInFrames * this.targetNumberOfChannels;
	}
	/**
	* Sets up the channel mixer to handle up/downmixing in the case where input and output channel counts don't match.
	*/
	doChannelMixerSetup() {
		assert(this.sourceNumberOfChannels !== null);
		const sourceNum = this.sourceNumberOfChannels;
		const targetNum = this.targetNumberOfChannels;
		if (sourceNum === 1 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex) => {
			return sourceData[sourceFrameIndex * sourceNum];
		};
		else if (sourceNum === 1 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex < 2);
		};
		else if (sourceNum === 1 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return sourceData[sourceFrameIndex * sourceNum] * +(targetChannelIndex === 2);
		};
		else if (sourceNum === 2 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .5 * (sourceData[baseIdx] + sourceData[baseIdx + 1]);
		};
		else if (sourceNum === 2 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return targetChannelIndex < 2 ? sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] : 0;
		};
		else if (sourceNum === 2 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return targetChannelIndex < 2 ? sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] : 0;
		};
		else if (sourceNum === 4 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .25 * (sourceData[baseIdx] + sourceData[baseIdx + 1] + sourceData[baseIdx + 2] + sourceData[baseIdx + 3]);
		};
		else if (sourceNum === 4 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return .5 * (sourceData[baseIdx + targetChannelIndex] + sourceData[baseIdx + targetChannelIndex + 2]);
		};
		else if (sourceNum === 4 && targetNum === 6) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			if (targetChannelIndex < 2) return sourceData[baseIdx + targetChannelIndex];
			if (targetChannelIndex === 2 || targetChannelIndex === 3) return 0;
			return sourceData[baseIdx + targetChannelIndex - 2];
		};
		else if (sourceNum === 6 && targetNum === 1) this.channelMixer = (sourceData, sourceFrameIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return Math.SQRT1_2 * (sourceData[baseIdx] + sourceData[baseIdx + 1]) + sourceData[baseIdx + 2] + .5 * (sourceData[baseIdx + 4] + sourceData[baseIdx + 5]);
		};
		else if (sourceNum === 6 && targetNum === 2) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * (sourceData[baseIdx + 2] + sourceData[baseIdx + targetChannelIndex + 4]);
		};
		else if (sourceNum === 6 && targetNum === 4) this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			const baseIdx = sourceFrameIndex * sourceNum;
			if (targetChannelIndex < 2) return sourceData[baseIdx + targetChannelIndex] + Math.SQRT1_2 * sourceData[baseIdx + 2];
			return sourceData[baseIdx + targetChannelIndex + 2];
		};
		else this.channelMixer = (sourceData, sourceFrameIndex, targetChannelIndex) => {
			return targetChannelIndex < sourceNum ? sourceData[sourceFrameIndex * sourceNum + targetChannelIndex] : 0;
		};
	}
	ensureTempBufferSize(requiredSamples) {
		let length = this.tempSourceBuffer.length;
		while (length < requiredSamples) length *= 2;
		if (length !== this.tempSourceBuffer.length) {
			const newBuffer = new Float32Array(length);
			newBuffer.set(this.tempSourceBuffer);
			this.tempSourceBuffer = newBuffer;
		}
	}
	async add(audioSample) {
		if (this.sourceSampleRate === null) {
			this.sourceSampleRate = audioSample.sampleRate;
			this.sourceNumberOfChannels = audioSample.numberOfChannels;
			this.startTime = audioSample.timestamp;
			const overflowFrames = Math.ceil(this.targetSampleRate / this.sourceSampleRate);
			this.bufferCapacityInFrames = this.bufferSizeInFrames + overflowFrames;
			this.outputBuffer = new Float32Array(this.bufferCapacityInFrames * this.targetNumberOfChannels);
			this.tempSourceBuffer = new Float32Array(this.sourceSampleRate * this.sourceNumberOfChannels);
			this.doChannelMixerSetup();
		}
		assert(this.startTime !== null);
		const requiredSamples = audioSample.numberOfFrames * audioSample.numberOfChannels;
		this.ensureTempBufferSize(requiredSamples);
		const sourceDataSize = audioSample.allocationSize({
			planeIndex: 0,
			format: "f32"
		});
		const sourceView = new Float32Array(this.tempSourceBuffer.buffer, 0, sourceDataSize / 4);
		audioSample.copyTo(sourceView, {
			planeIndex: 0,
			format: "f32"
		});
		const sourceStartFrame = Math.round((audioSample.timestamp - this.startTime) * this.sourceSampleRate);
		const sourceEndFrame = sourceStartFrame + audioSample.numberOfFrames;
		const outputStartFrame = Math.floor((sourceStartFrame - 1) * this.targetSampleRate / this.sourceSampleRate) + 1;
		const outputEndFrame = Math.ceil(sourceEndFrame * this.targetSampleRate / this.sourceSampleRate);
		for (let outputFrame = outputStartFrame; outputFrame < outputEndFrame; outputFrame++) {
			if (outputFrame < this.bufferStartFrame) continue;
			while (outputFrame >= this.bufferStartFrame + this.bufferCapacityInFrames) {
				await this.finalizeCurrentBuffer();
				this.bufferStartFrame += this.bufferSizeInFrames;
			}
			const bufferFrameIndex = outputFrame - this.bufferStartFrame;
			assert(bufferFrameIndex < this.bufferCapacityInFrames);
			const sourcePosition = outputFrame * this.sourceSampleRate / this.targetSampleRate - sourceStartFrame;
			const sourceLowerFrame = Math.floor(sourcePosition);
			const sourceUpperFrame = Math.ceil(sourcePosition);
			const fraction = sourcePosition - sourceLowerFrame;
			for (let targetChannel = 0; targetChannel < this.targetNumberOfChannels; targetChannel++) {
				let lowerSample = 0;
				let upperSample = 0;
				if (sourceLowerFrame >= 0 && sourceLowerFrame < audioSample.numberOfFrames) lowerSample = this.channelMixer(sourceView, sourceLowerFrame, targetChannel);
				if (sourceUpperFrame >= 0 && sourceUpperFrame < audioSample.numberOfFrames) upperSample = this.channelMixer(sourceView, sourceUpperFrame, targetChannel);
				const outputSample = lowerSample + fraction * (upperSample - lowerSample);
				const outputIndex = bufferFrameIndex * this.targetNumberOfChannels + targetChannel;
				this.outputBuffer[outputIndex] += outputSample;
			}
			if (this.maxWrittenFrame === null) this.maxWrittenFrame = bufferFrameIndex;
			else this.maxWrittenFrame = Math.max(this.maxWrittenFrame, bufferFrameIndex);
		}
	}
	async finalizeCurrentBuffer() {
		if (this.maxWrittenFrame === null) return;
		assert(this.startTime !== null);
		const samplesWritten = Math.min(this.maxWrittenFrame + 1, this.bufferSizeInFrames) * this.targetNumberOfChannels;
		const outputData = new Float32Array(samplesWritten);
		outputData.set(this.outputBuffer.subarray(0, samplesWritten));
		const audioSample = new AudioSample({
			format: "f32",
			sampleRate: this.targetSampleRate,
			numberOfChannels: this.targetNumberOfChannels,
			timestamp: this.startTime + this.bufferStartFrame / this.targetSampleRate,
			data: outputData
		});
		await this.onSample(audioSample);
		this.outputBuffer.copyWithin(0, this.bufferSizeInSamples);
		this.outputBuffer.fill(0, this.outputBuffer.length - this.bufferSizeInSamples);
		this.maxWrittenFrame = this.maxWrittenFrame >= this.bufferSizeInFrames ? this.maxWrittenFrame - this.bufferSizeInFrames : null;
	}
	async finalize() {
		while (this.maxWrittenFrame !== null) {
			await this.finalizeCurrentBuffer();
			this.bufferStartFrame += this.bufferSizeInFrames;
		}
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/isobmff/isobmff-misc.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var TIMESTAMP_OFFSET = 2082844800;
var buildIsobmffMimeType = (info) => {
	let string = (info.hasVideo ? "video/" : info.hasAudio ? "audio/" : "application/") + (info.isQuickTime ? "quicktime" : "mp4");
	if (info.codecStrings.length > 0) {
		const uniqueCodecMimeTypes = [...new Set(info.codecStrings)];
		string += `; codecs="${uniqueCodecMimeTypes.join(", ")}"`;
	}
	return string;
};
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var readAdtsFrameHeader = (slice) => {
	const startPos = slice.filePos;
	if (slice.remainingLength < 7) return null;
	const bitstream = new Bitstream(readBytes(slice, 7));
	if (bitstream.readBits(12) !== 4095) return null;
	bitstream.skipBits(1);
	if (bitstream.readBits(2) !== 0) return null;
	const protectionAbsence = bitstream.readBits(1);
	const objectType = bitstream.readBits(2) + 1;
	const samplingFrequencyIndex = bitstream.readBits(4);
	if (samplingFrequencyIndex >= aacFrequencyTable.length) return null;
	bitstream.skipBits(1);
	const channelConfiguration = bitstream.readBits(3);
	if (channelConfiguration === 0) throw new Error("ADTS frames with channel configuration 0 are not supported.");
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	bitstream.skipBits(1);
	const frameLength = bitstream.readBits(13);
	bitstream.skipBits(11);
	const numberOfAacFrames = bitstream.readBits(2) + 1;
	if (numberOfAacFrames !== 1) throw new Error("ADTS frames with more than one AAC frame are not supported.");
	let crcCheck = null;
	if (protectionAbsence === 0) {
		if (slice.remainingLength < 2) return null;
		crcCheck = readU16Be(slice);
	}
	if (frameLength < slice.filePos - startPos) return null;
	return {
		objectType,
		samplingFrequencyIndex,
		channelConfiguration,
		frameLength,
		numberOfAacFrames,
		crcCheck,
		startPos
	};
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/reader.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var FileSlice = class FileSlice {
	constructor(bytes, view, offset, start, end) {
		this.bytes = bytes;
		this.view = view;
		this.offset = offset;
		this.start = start;
		this.end = end;
		this.bufferPos = start - offset;
	}
	static tempFromBytes(bytes) {
		return new FileSlice(bytes, toDataView(bytes), 0, 0, bytes.length);
	}
	get length() {
		return this.end - this.start;
	}
	get filePos() {
		return this.offset + this.bufferPos;
	}
	set filePos(value) {
		this.bufferPos = value - this.offset;
	}
	/** The number of bytes left from the current pos to the end of the slice. */
	get remainingLength() {
		return Math.max(this.end - this.filePos, 0);
	}
	skip(byteCount) {
		this.bufferPos += byteCount;
	}
	/** Creates a new subslice of this slice whose byte range must be contained within this slice. */
	slice(filePos, length = this.end - filePos) {
		if (filePos < this.start || filePos + length > this.end) throw new RangeError("Slicing outside of original slice.");
		return new FileSlice(this.bytes, this.view, this.offset, filePos, filePos + length);
	}
};
var checkIsInRange = (slice, bytesToRead) => {
	if (bytesToRead < 0 || slice.filePos < slice.start || slice.filePos + bytesToRead > slice.end) throw new RangeError(`Tried reading [${slice.filePos}, ${slice.filePos + bytesToRead}), but slice is [${slice.start}, ${slice.end}). This is likely an internal error, please report it alongside the file that caused it.`);
};
var readBytes = (slice, length) => {
	checkIsInRange(slice, length);
	const bytes = slice.bytes.subarray(slice.bufferPos, slice.bufferPos + length);
	slice.bufferPos += length;
	return bytes;
};
var readU8 = (slice) => {
	checkIsInRange(slice, 1);
	return slice.view.getUint8(slice.bufferPos++);
};
var readU16Be = (slice) => {
	checkIsInRange(slice, 2);
	const value = slice.view.getUint16(slice.bufferPos, false);
	slice.bufferPos += 2;
	return value;
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/isobmff/isobmff-reader.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var readIsomVariableInteger = (slice) => {
	let result = 0;
	for (let i = 0; i < 4; i++) {
		result <<= 7;
		const nextByte = readU8(slice);
		result |= nextByte & 127;
		if ((nextByte & 128) === 0) break;
	}
	return result;
};
var readEsDescriptor = (slice) => {
	if (readU8(slice) !== 3) throw new Error("Invalid esds: expected ES_Descriptor.");
	readIsomVariableInteger(slice);
	slice.skip(2);
	const mixed = readU8(slice);
	const streamDependenceFlag = (mixed & 128) !== 0;
	const urlFlag = (mixed & 64) !== 0;
	const ocrStreamFlag = (mixed & 32) !== 0;
	if (streamDependenceFlag) slice.skip(2);
	if (urlFlag) {
		const urlLength = readU8(slice);
		slice.skip(urlLength);
	}
	if (ocrStreamFlag) slice.skip(2);
	if (readU8(slice) !== 4) throw new Error("Invalid esds: expected DecoderConfigDescriptor.");
	const decoderConfigDescriptorLength = readIsomVariableInteger(slice);
	const payloadStart = slice.filePos;
	const objectTypeIndication = readU8(slice);
	slice.skip(12);
	let decoderSpecificInfo = null;
	if (decoderConfigDescriptorLength > slice.filePos - payloadStart) {
		if (readU8(slice) !== 5) throw new Error("Invalid esds: expected DecoderSpecificInfo.");
		decoderSpecificInfo = readBytes(slice, readIsomVariableInteger(slice));
	}
	return {
		objectTypeIndication,
		decoderSpecificInfo
	};
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/media-source.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var __addDisposableResource = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
/**
* Base class for media sources. Media sources are used to add media samples to an output file.
* @group Media sources
* @public
*/
var MediaSource = class {
	constructor() {
		/** @internal */
		this._connectedTrack = null;
		/** @internal */
		this._closingPromise = null;
		/** @internal */
		this._closed = false;
		/**
		* Set when the encoder is configured with a bitrate.
		* @internal
		*/
		this._nominalBitrate = null;
	}
	/** @internal */
	_ensureValidAdd() {
		if (!this._connectedTrack) throw new Error("Source is not connected to an output track.");
		if (this._connectedTrack.output.state === "canceled") throw new Error("Output has been canceled.");
		if (this._connectedTrack.output.state === "finalizing" || this._connectedTrack.output.state === "finalized") throw new Error("Output has been finalized.");
		if (this._connectedTrack.output.state === "pending") throw new Error("Output has not started.");
		if (this._closed) throw new Error("Source is closed.");
	}
	/** @internal */
	async _start() {}
	/** @internal */
	async _flushAndClose(forceClose) {}
	/**
	* Closes this source. This prevents future samples from being added and signals to the output file that no further
	* samples will come in for this track. Calling `.close()` is optional but recommended after adding the
	* last sample - for improved performance and reduced memory usage.
	*/
	close() {
		if (this._closingPromise) return;
		const connectedTrack = this._connectedTrack;
		if (!connectedTrack) throw new Error("Cannot call close without connecting the source to an output track.");
		if (connectedTrack.output.state === "pending") throw new Error("Cannot call close before output has been started.");
		this._closingPromise = (async () => {
			await this._flushAndClose(false);
			this._closed = true;
			if (connectedTrack.output.state === "finalizing" || connectedTrack.output.state === "finalized") return;
			connectedTrack.output._muxer.onTrackClose(connectedTrack);
		})();
	}
	/** @internal */
	async _flushOrWaitForOngoingClose(forceClose) {
		return this._closingPromise ??= (async () => {
			await this._flushAndClose(forceClose);
			this._closed = true;
		})();
	}
};
/**
* Base class for video sources - sources for video tracks.
* @group Media sources
* @public
*/
var VideoSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		if (!VIDEO_CODECS.includes(codec)) throw new TypeError(`Invalid video codec '${codec}'. Must be one of: ${VIDEO_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
var maybeEnsureIsKeyPacket = (track, packet) => {
	if (track.metadata.hasOnlyKeyPackets && packet.type !== "key") throw new Error("Cannot add non-key packets to a hasOnlyKeyPackets video track.");
};
var VideoEncoderWrapper = class {
	setError(error) {
		if (!this.errorSet) {
			this.error = error;
			this.errorSet = true;
		}
	}
	constructor(source, encodingConfig) {
		this.source = source;
		this.encodingConfig = encodingConfig;
		this.ensureEncoderPromise = null;
		this.encoderInitialized = false;
		this.encoder = null;
		this.encoderConfig = null;
		this.encodersReclaimed = false;
		this.muxer = null;
		this.lastMultipleOfKeyFrameInterval = -1;
		this.emittedEncoderPackets = 0;
		this.chunkTimestampsAreShiftedByDuration = false;
		this.codedWidth = null;
		this.codedHeight = null;
		this.outputWidth = null;
		this.outputHeight = null;
		this.frameRateLastSample = null;
		this.frameRateLastTimestamp = null;
		this.frameRateLastEndTimestamp = null;
		this.preciseTimings = [];
		this.customEncoder = null;
		this.customEncoderCallSerializer = new CallSerializer();
		this.customEncoderQueueSize = 0;
		this.defaultEncodeOptions = {};
		this.alphaEncoder = null;
		this.splitter = null;
		this.splitterCreationFailed = false;
		this.alphaFrameQueue = [];
		/**
		* Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
		* However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
		* So, we keep track of the encoder error and throw it as soon as we get the chance.
		*/
		this.error = null;
		this.errorSet = false;
		this.lastMuxerPromise = Promise.resolve();
		this.closed = false;
	}
	async add(videoSample, shouldClose, encodeOptions) {
		const originalSample = videoSample;
		try {
			this.checkForEncoderError();
			this.source._ensureValidAdd();
			const config = this.encodingConfig;
			const sizeChangeBehavior = config.sizeChangeBehavior ?? "deny";
			let isSizeChange = false;
			if (this.codedWidth !== null && this.codedHeight !== null) {
				if (videoSample.codedWidth !== this.codedWidth || videoSample.codedHeight !== this.codedHeight) {
					isSizeChange = true;
					if (sizeChangeBehavior === "deny") throw new Error(`Video sample size must remain constant. Expected ${this.codedWidth}x${this.codedHeight}, got ${videoSample.codedWidth}x${videoSample.codedHeight}. To allow the sample size to change over time, set \`sizeChangeBehavior\` to a value other than 'deny' in the encoding options.`);
				}
			} else {
				this.codedWidth = videoSample.codedWidth;
				this.codedHeight = videoSample.codedHeight;
			}
			if (config.transform?.width !== void 0 || config.transform?.height !== void 0 || config.transform?.rotate !== void 0 || config.transform?.flip !== void 0 || config.transform?.crop !== void 0 || config.transform?.force === true || isSizeChange && sizeChangeBehavior !== "passThrough") {
				let targetWidth = config.transform?.width;
				let targetHeight = config.transform?.height;
				let appliedFit = config.transform?.fit ?? "fill";
				if (isSizeChange && sizeChangeBehavior !== "passThrough") {
					assert(this.outputWidth);
					assert(this.outputHeight);
					assert(sizeChangeBehavior !== "deny");
					targetWidth = this.outputWidth;
					targetHeight = this.outputHeight;
					appliedFit = sizeChangeBehavior;
				}
				const transformed = await videoSample.transform({
					width: targetWidth,
					height: targetHeight,
					roundDimensionsTo: 2,
					crop: config.transform?.crop,
					rotate: config.transform?.rotate,
					flip: config.transform?.flip,
					fit: appliedFit,
					alpha: config.alpha
				});
				if (this.outputWidth === null || this.outputHeight === null) {
					this.outputWidth = transformed.displayWidth;
					this.outputHeight = transformed.displayHeight;
				}
				if (shouldClose) videoSample.close();
				videoSample = transformed;
				shouldClose = true;
			} else if (this.outputWidth === null || this.outputHeight === null) {
				this.outputWidth = videoSample.codedWidth;
				this.outputHeight = videoSample.codedHeight;
			}
			const frameRate = config.transform?.frameRate;
			if (frameRate !== void 0) {
				const originalEndTimestamp = videoSample.timestamp + videoSample.duration;
				const alignedTimestamp = floorToDivisor(videoSample.timestamp, frameRate);
				if (this.frameRateLastSample !== null) {
					if (alignedTimestamp <= this.frameRateLastTimestamp) {
						this.frameRateLastSample.close();
						this.frameRateLastSample = videoSample.clone();
						this.frameRateLastEndTimestamp = originalEndTimestamp;
						return;
					} else await this.padFrameRate(alignedTimestamp, encodeOptions);
				}
				if (videoSample === originalSample) {
					videoSample = videoSample.clone();
					shouldClose = true;
				}
				videoSample.setTimestamp(alignedTimestamp);
				videoSample.setDuration(1 / frameRate);
				this.frameRateLastSample?.close();
				this.frameRateLastSample = videoSample.clone();
				this.frameRateLastTimestamp = alignedTimestamp;
				this.frameRateLastEndTimestamp = originalEndTimestamp;
			}
			await this.processAndEncode(videoSample, encodeOptions);
		} finally {
			if (shouldClose) videoSample.close();
		}
	}
	/**
	* Runs the process function (if any) and encodes the resulting samples.
	*/
	async processAndEncode(videoSample, encodeOptions) {
		const config = this.encodingConfig;
		let samplesToEncode;
		if (config.transform?.process) {
			let processed = config.transform.process(videoSample);
			if (isThenable(processed)) processed = await processed;
			if (processed === null) return;
			if (!Array.isArray(processed)) processed = [processed];
			const mappedSamples = [];
			try {
				for (const x of processed) if (x instanceof VideoSample) mappedSamples.push(x);
				else if (typeof VideoFrame !== "undefined" && x instanceof VideoFrame) mappedSamples.push(new VideoSample(x));
				else mappedSamples.push(new VideoSample(x, {
					timestamp: videoSample.timestamp,
					duration: videoSample.duration
				}));
			} catch (error) {
				for (const sample of mappedSamples) if (sample !== videoSample) sample.close();
				for (const x of processed) if (x instanceof VideoSample && x !== videoSample) x.close();
				else if (typeof VideoFrame !== "undefined" && x instanceof VideoFrame) x.close();
				throw error;
			}
			samplesToEncode = mappedSamples;
		} else samplesToEncode = [videoSample];
		try {
			for (const sampleToEncode of samplesToEncode) {
				if (!this.encoderInitialized) {
					if (!this.ensureEncoderPromise) this.ensureEncoder(sampleToEncode);
					if (!this.encoderInitialized) await this.ensureEncoderPromise;
				}
				assert(this.encoderInitialized);
				if (this.closed) break;
				if (this.encodersReclaimed) this.recreateWebCodecsEncoders();
				const keyFrameInterval = this.encodingConfig.keyFrameInterval ?? 2;
				const multipleOfKeyFrameInterval = Math.floor(sampleToEncode.timestamp / keyFrameInterval);
				const mergedEncodeOptions = {
					...this.defaultEncodeOptions,
					...sampleToEncode.encodeOptions,
					...encodeOptions
				};
				const finalEncodeOptions = {
					...mergedEncodeOptions,
					keyFrame: mergedEncodeOptions.keyFrame !== void 0 ? mergedEncodeOptions.keyFrame : keyFrameInterval === 0 || multipleOfKeyFrameInterval !== this.lastMultipleOfKeyFrameInterval
				};
				this.lastMultipleOfKeyFrameInterval = multipleOfKeyFrameInterval;
				this.encodingConfig.onEncodedSample?.(sampleToEncode);
				if (this.customEncoder) {
					this.customEncoderQueueSize++;
					const clonedSample = sampleToEncode.clone();
					const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample, finalEncodeOptions)).catch((error) => this.setError(error)).finally(() => {
						this.customEncoderQueueSize--;
						clonedSample.close();
					});
					if (this.customEncoderQueueSize >= 4) await promise;
				} else {
					assert(this.encoder);
					const videoFrame = sampleToEncode.toVideoFrame();
					const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, videoFrame.timestamp, (x) => x.microsecondTimestamp);
					const existingEntry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
					if (existingEntry && existingEntry.microsecondTimestamp === videoFrame.timestamp) {
						if (existingEntry.timestamp !== sampleToEncode.timestamp) existingEntry.timestampIsValid = false;
						if (existingEntry.duration !== sampleToEncode.duration) existingEntry.durationIsValid = false;
					} else {
						this.preciseTimings.splice(preciseTimingIndex + 1, 0, {
							microsecondTimestamp: videoFrame.timestamp,
							timestamp: sampleToEncode.timestamp,
							duration: sampleToEncode.duration,
							timestampIsValid: true,
							durationIsValid: true
						});
						if (this.preciseTimings.length > 128) this.preciseTimings.shift();
					}
					if (!this.alphaEncoder) try {
						this.encoder.encode(videoFrame, finalEncodeOptions);
					} finally {
						videoFrame.close();
					}
					else if (!!videoFrame.format && !videoFrame.format.includes("A") || this.splitterCreationFailed) {
						this.alphaFrameQueue.push(null);
						try {
							this.encoder.encode(videoFrame, finalEncodeOptions);
						} finally {
							videoFrame.close();
						}
					} else {
						if (!this.splitter) this.splitter = new ColorAlphaSplitter();
						const { colorFrame, alphaFrame } = await this.splitter.split(videoFrame);
						this.alphaFrameQueue.push(alphaFrame);
						try {
							this.encoder.encode(colorFrame, finalEncodeOptions);
						} finally {
							colorFrame.close();
						}
					}
					if (this.encoder.encodeQueueSize >= 4) await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
				}
				await this.lastMuxerPromise;
			}
		} finally {
			for (const sample of samplesToEncode) if (sample !== videoSample) sample.close();
		}
	}
	/** Repeats the last frame rate sample to fill the gap up to the given timestamp. */
	async padFrameRate(until, encodeOptions) {
		const frameRate = this.encodingConfig.transform.frameRate;
		assert(this.frameRateLastSample);
		const frameDifference = Math.round((until - this.frameRateLastTimestamp) * frameRate);
		for (let i = 1; i < frameDifference; i++) {
			const env_1 = {
				stack: [],
				error: void 0,
				hasError: false
			};
			try {
				const sample = __addDisposableResource(env_1, this.frameRateLastSample.clone(), false);
				sample.setTimestamp(this.frameRateLastTimestamp + i / frameRate);
				sample.setDuration(1 / frameRate);
				await this.processAndEncode(sample, encodeOptions);
			} catch (e_1) {
				env_1.error = e_1;
				env_1.hasError = true;
			} finally {
				__disposeResources(env_1);
			}
		}
	}
	ensureEncoder(videoSample) {
		this.ensureEncoderPromise = (async () => {
			const quality = resolveQuality(this.encodingConfig.quality, this.encodingConfig.bitrate);
			assert(quality !== void 0);
			const candidates = buildVideoEncoderConfigs({
				...this.encodingConfig,
				quality,
				width: videoSample.codedWidth,
				height: videoSample.codedHeight,
				squarePixelWidth: videoSample.squarePixelWidth,
				squarePixelHeight: videoSample.squarePixelHeight,
				framerate: this.source._connectedTrack?.metadata.frameRate
			});
			let selected = null;
			let MatchingCustomEncoder;
			for (const candidate of candidates) {
				const candidateConfig = candidate.config;
				this.encodingConfig.onEncoderConfig?.(candidateConfig);
				MatchingCustomEncoder = customVideoEncoders.find((x) => x.supports(this.encodingConfig.codec, candidateConfig));
				if (MatchingCustomEncoder) {
					selected = candidate;
					break;
				}
				if (typeof VideoEncoder === "undefined") continue;
				candidateConfig.alpha = "discard";
				if (this.encodingConfig.alpha === "keep") candidateConfig.latencyMode = "quality";
				if ((candidateConfig.width % 2 === 1 || candidateConfig.height % 2 === 1) && (this.encodingConfig.codec === "avc" || this.encodingConfig.codec === "hevc")) throw new Error(`The dimensions ${candidateConfig.width}x${candidateConfig.height} are not supported for codec '${this.encodingConfig.codec}'; both width and height must be even numbers. Make sure to round your dimensions to the nearest even number.`);
				try {
					if ((await VideoEncoder.isConfigSupported(candidateConfig)).supported) {
						selected = candidate;
						break;
					}
				} catch {}
			}
			if (!selected) {
				if (typeof VideoEncoder === "undefined") throw new Error(missingWebCodecsClassMessage("VideoEncoder"));
				const firstConfig = candidates[0].config;
				const rateControls = candidates.map(({ config, quantizer }) => quantizer !== null ? `quantizer ${quantizer}` : `${config.bitrate} bps`);
				throw new Error(`This specific encoder configuration (${firstConfig.codec}, ${rateControls.join(" / ")}, ${firstConfig.width}x${firstConfig.height}, hardware acceleration: ${firstConfig.hardwareAcceleration ?? "no-preference"}) is not supported in this environment. Consider using another codec or changing your video parameters.`);
			}
			const encoderConfig = selected.config;
			if (selected.quantizer !== null) this.defaultEncodeOptions = buildQuantizerEncodeOptions(this.encodingConfig.codec, selected.quantizer);
			else this.source._nominalBitrate = encoderConfig.bitrate ?? null;
			if (MatchingCustomEncoder) {
				this.customEncoder = new MatchingCustomEncoder();
				this.customEncoder.codec = this.encodingConfig.codec;
				this.customEncoder.config = encoderConfig;
				this.customEncoder.onPacket = (packet, meta) => {
					if (!(packet instanceof EncodedPacket)) throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
					if (meta !== void 0 && (!meta || typeof meta !== "object")) throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
					maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.setError(error);
					});
				};
				this.customEncoder.onError = (error) => {
					this.setError(error);
				};
				await this.customEncoder.init();
			} else {
				this.encoderConfig = encoderConfig;
				if (this.encodingConfig.codec === "avc" && isFirefox()) this.chunkTimestampsAreShiftedByDuration = await detectAvcChunkTimestampShift();
				this.createWebCodecsEncoders();
			}
			assert(this.source._connectedTrack);
			this.muxer = this.source._connectedTrack.output._muxer;
			this.encoderInitialized = true;
		})();
	}
	createWebCodecsEncoders() {
		const encoderConfig = this.encoderConfig;
		assert(encoderConfig);
		/** Queue of color chunks waiting for their alpha counterpart. */
		const colorChunkQueue = [];
		/** Each value is the number of encoded alpha chunks at which a null alpha chunk should be added. */
		const nullAlphaChunkQueue = [];
		let encodedAlphaChunkCount = 0;
		let alphaEncoderQueue = 0;
		const handleError = (error, stack) => {
			if (isCodecReclaimedError(error)) {
				this.encodersReclaimed = true;
				return;
			}
			error.stack = stack;
			this.setError(error);
		};
		const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
		this.encoder = new VideoEncoder({
			output: (chunk, meta) => {
				if (!this.alphaEncoder) {
					this.addPacket(chunk, null, meta);
					return;
				}
				const alphaFrame = this.alphaFrameQueue.shift();
				assert(alphaFrame !== void 0);
				if (alphaFrame) {
					this.alphaEncoder.encode(alphaFrame, {
						...this.defaultEncodeOptions,
						keyFrame: chunk.type === "key"
					});
					alphaEncoderQueue++;
					alphaFrame.close();
					colorChunkQueue.push({
						chunk,
						meta
					});
				} else if (alphaEncoderQueue === 0) this.addPacket(chunk, null, meta);
				else {
					nullAlphaChunkQueue.push(encodedAlphaChunkCount + alphaEncoderQueue);
					colorChunkQueue.push({
						chunk,
						meta
					});
				}
			},
			error: (error) => handleError(error, stack)
		});
		this.encoder.configure(encoderConfig);
		if (this.encodingConfig.alpha === "keep") {
			const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
			this.alphaEncoder = new VideoEncoder({
				output: (chunk, meta) => {
					alphaEncoderQueue--;
					const colorChunk = colorChunkQueue.shift();
					assert(colorChunk !== void 0);
					this.addPacket(colorChunk.chunk, chunk, colorChunk.meta);
					encodedAlphaChunkCount++;
					while (nullAlphaChunkQueue.length > 0 && nullAlphaChunkQueue[0] === encodedAlphaChunkCount) {
						nullAlphaChunkQueue.shift();
						const colorChunk = colorChunkQueue.shift();
						assert(colorChunk !== void 0);
						this.addPacket(colorChunk.chunk, null, colorChunk.meta);
					}
				},
				error: (error) => handleError(error, stack)
			});
			this.alphaEncoder.configure(encoderConfig);
		}
	}
	addPacket(colorChunk, alphaChunk, meta) {
		const sideData = {};
		if (alphaChunk) {
			const alphaData = new Uint8Array(alphaChunk.byteLength);
			alphaChunk.copyTo(alphaData);
			sideData.alpha = alphaData;
		}
		let packet = EncodedPacket.fromEncodedChunk(colorChunk, sideData);
		const encoderConfig = this.encoderConfig;
		assert(encoderConfig);
		if (meta?.decoderConfig) {
			meta.decoderConfig.codec = extractVideoCodecString({
				width: encoderConfig.width,
				height: encoderConfig.height,
				codec: this.encodingConfig.codec,
				codecDescription: meta.decoderConfig.description ? toUint8Array(meta.decoderConfig.description) : null,
				colorSpace: meta.decoderConfig.colorSpace ?? null,
				avcType: encoderConfig.codec.includes("avc1.") ? 1 : encoderConfig.codec.includes("avc3.") ? 3 : null,
				avcCodecInfo: this.encodingConfig.codec === "avc" && !meta.decoderConfig.description ? extractAvcDecoderConfigurationRecord(packet.data) : null,
				hevcCodecInfo: this.encodingConfig.codec === "hevc" && !meta.decoderConfig.description ? extractHevcDecoderConfigurationRecord(packet.data) : null,
				vp9CodecInfo: this.encodingConfig.codec === "vp9" ? extractVp9CodecInfoFromPacket(packet.data) : null,
				av1CodecInfo: this.encodingConfig.codec === "av1" ? extractAv1CodecInfoFromPacket(packet.data) : null,
				proresFormat: null
			});
			if (this.encodingConfig.codec === "avc" && meta.decoderConfig.description && isFirefox()) {
				const parsed = deserializeAvcDecoderConfigurationRecord(toUint8Array(meta.decoderConfig.description));
				let sps = parsed?.sequenceParameterSets[0];
				if (sps && sps[0] === sps[1]) {
					assert(parsed);
					sps = sps.subarray(1);
					let pps = parsed.pictureParameterSets[0];
					if (pps) pps = pps.subarray(1);
					const record = serializeAvcDecoderConfigurationRecord({
						...parsed,
						sequenceParameterSets: [sps],
						pictureParameterSets: pps ? [pps] : []
					});
					meta.decoderConfig.description = record;
				}
			}
		}
		let microsecondTimestamp = colorChunk.timestamp;
		if (this.chunkTimestampsAreShiftedByDuration) {
			microsecondTimestamp -= colorChunk.duration ?? 0;
			packet = packet.clone({ timestamp: microsecondTimestamp / 1e6 });
		}
		const preciseTimingIndex = binarySearchLessOrEqual(this.preciseTimings, microsecondTimestamp, (x) => x.microsecondTimestamp);
		const entry = preciseTimingIndex !== -1 ? this.preciseTimings[preciseTimingIndex] : null;
		let actualType = null;
		if (this.emittedEncoderPackets === 0 && packet.type === "delta" && meta?.decoderConfig) actualType = determineVideoPacketType(this.encodingConfig.codec, meta.decoderConfig, packet.data);
		if (entry && entry.microsecondTimestamp === microsecondTimestamp || actualType !== null) packet = packet.clone({
			timestamp: entry?.timestampIsValid ? entry.timestamp : void 0,
			duration: entry?.durationIsValid ? entry.duration : void 0,
			type: actualType ?? void 0
		});
		maybeEnsureIsKeyPacket(this.source._connectedTrack, packet);
		this.encodingConfig.onEncodedPacket?.(packet, meta);
		this.lastMuxerPromise = this.muxer.addEncodedVideoPacket(this.source._connectedTrack, packet, meta).catch((error) => {
			this.setError(error);
		});
		this.emittedEncoderPackets++;
	}
	recreateWebCodecsEncoders() {
		assert(this.encoder);
		if (this.encoder.state !== "closed") this.encoder.close();
		if (this.alphaEncoder && this.alphaEncoder.state !== "closed") this.alphaEncoder.close();
		this.alphaFrameQueue.forEach((x) => x?.close());
		this.alphaFrameQueue.length = 0;
		this.encodersReclaimed = false;
		this.lastMultipleOfKeyFrameInterval = -1;
		this.createWebCodecsEncoders();
	}
	async flushAndClose(forceClose) {
		try {
			if (!forceClose) {
				this.checkForEncoderError();
				if (this.frameRateLastSample) {
					const frameRate = this.encodingConfig.transform.frameRate;
					const alignedEnd = floorToDivisor(this.frameRateLastEndTimestamp, frameRate);
					await this.padFrameRate(alignedEnd);
				}
			}
			this.closed = true;
			if (!forceClose) {
				if (this.customEncoder) this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
				else if (this.encoder && !this.encodersReclaimed) {
					await this.encoder.flush();
					await this.alphaEncoder?.flush();
					await wait(25);
				}
			}
		} finally {
			this.closed = true;
			this.frameRateLastSample?.close();
			this.frameRateLastSample = null;
			if (this.customEncoder) await this.customEncoderCallSerializer.call(() => this.customEncoder.close()).catch((error) => this.setError(error));
			else if (this.encoder) {
				if (this.encoder.state !== "closed") this.encoder.close();
				if (this.alphaEncoder && this.alphaEncoder.state !== "closed") this.alphaEncoder.close();
				this.alphaFrameQueue.forEach((x) => x?.close());
				this.alphaFrameQueue.length = 0;
				this.splitter?.close();
			}
		}
		if (!forceClose) this.checkForEncoderError();
	}
	getQueueSize() {
		if (this.customEncoder) return this.customEncoderQueueSize;
		else return this.encoder?.encodeQueueSize ?? 0;
	}
	checkForEncoderError() {
		if (this.errorSet) throw this.error;
	}
};
var avcChunkTimestampShiftPromise = null;
var detectAvcChunkTimestampShift = () => {
	return avcChunkTimestampShiftPromise ??= (async () => {
		let chunkTimestamp = null;
		const encoder = new VideoEncoder({
			output: (chunk) => {
				chunkTimestamp ??= chunk.timestamp;
			},
			error: () => {}
		});
		try {
			encoder.configure({
				codec: "avc1.64001f",
				width: 1280,
				height: 720
			});
			const frame = new VideoFrame(/* @__PURE__ */ new Uint8Array(1382400), {
				format: "I420",
				codedWidth: 1280,
				codedHeight: 720,
				timestamp: 0,
				duration: 500
			});
			encoder.encode(frame, { keyFrame: true });
			frame.close();
			await encoder.flush();
		} catch {
			return false;
		} finally {
			if (encoder.state !== "closed") encoder.close();
		}
		return chunkTimestamp === 500;
	})();
};
var splitterWorkerUrl = null;
/** Utility class for splitting a composite frame into separate color and alpha parts on the CPU in a worker. */
var ColorAlphaSplitter = class {
	constructor() {
		this.worker = null;
		this.pendingRequests = /* @__PURE__ */ new Map();
		this.nextRequestId = 0;
	}
	split(sourceFrame) {
		if (!this.worker) {
			if (!splitterWorkerUrl) {
				const blob = new Blob([`(${colorAlphaSplitterWorkerCode.toString()})()`], { type: "application/javascript" });
				splitterWorkerUrl = URL.createObjectURL(blob);
			}
			this.worker = new Worker(splitterWorkerUrl);
			this.worker.addEventListener("message", (event) => {
				const data = event.data;
				const pending = this.pendingRequests.get(data.id);
				if (!pending) return;
				this.pendingRequests.delete(data.id);
				if ("error" in data) pending.reject(new Error(data.error));
				else pending.resolve({
					colorFrame: data.colorFrame,
					alphaFrame: data.alphaFrame
				});
			});
			this.worker.addEventListener("error", (event) => {
				const error = new Error(event.message || "Color/alpha splitter worker error.");
				for (const pending of this.pendingRequests.values()) pending.reject(error);
				this.pendingRequests.clear();
			});
		}
		const id = this.nextRequestId++;
		const pending = promiseWithResolvers();
		this.pendingRequests.set(id, pending);
		this.worker.postMessage({
			id,
			sourceFrame
		}, { transfer: [sourceFrame] });
		return pending.promise;
	}
	close() {
		this.worker?.terminate();
		this.worker = null;
		const error = /* @__PURE__ */ new Error("Color/alpha splitter closed.");
		for (const pending of this.pendingRequests.values()) pending.reject(error);
		this.pendingRequests.clear();
	}
};
var colorAlphaSplitterWorkerCode = () => {
	let cpuSourceBuffer = null;
	let chain = Promise.resolve();
	self.addEventListener("message", (event) => {
		const { id, sourceFrame } = event.data;
		chain = chain.then(async () => {
			try {
				const { colorFrame, alphaFrame } = await split(sourceFrame);
				self.postMessage({
					id,
					colorFrame,
					alphaFrame
				}, { transfer: [colorFrame, alphaFrame] });
			} catch (error) {
				self.postMessage({
					id,
					error: error.message
				});
			} finally {
				sourceFrame.close();
			}
		});
	});
	const split = async (sourceFrame) => {
		const format = sourceFrame.format;
		if (!format) throw new Error("CPU color/alpha splitting requires a known VideoFrame format.");
		const sourceSize = sourceFrame.allocationSize();
		if (!cpuSourceBuffer || cpuSourceBuffer.byteLength !== sourceSize) cpuSourceBuffer = new Uint8Array(sourceSize);
		await sourceFrame.copyTo(cpuSourceBuffer);
		if (format === "RGBA" || format === "BGRA") return splitInterleavedRgba(cpuSourceBuffer, format, sourceFrame);
		else if (format === "I420A" || format === "I420AP10" || format === "I420AP12" || format === "I422A" || format === "I422AP10" || format === "I422AP12" || format === "I444A" || format === "I444AP10" || format === "I444AP12") return splitPlanarYuvA(cpuSourceBuffer, format, sourceFrame);
		throw new Error(`CPU color/alpha splitting does not support format '${format}'.`);
	};
	const splitInterleavedRgba = (source, format, sourceFrame) => {
		const width = sourceFrame.visibleRect?.width ?? sourceFrame.codedWidth;
		const height = sourceFrame.visibleRect?.height ?? sourceFrame.codedHeight;
		const pixelCount = width * height;
		const alphaSize = pixelCount + Math.ceil(width / 2) * Math.ceil(height / 2) * 2;
		const alphaBuffer = new Uint8Array(alphaSize);
		for (let i = 0, j = 3; i < pixelCount; i++, j += 4) alphaBuffer[i] = source[j];
		alphaBuffer.fill(128, pixelCount);
		const colorFrame = new VideoFrame(source, {
			format: format === "RGBA" ? "RGBX" : "BGRX",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: "I420",
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			colorSpace: {
				fullRange: true,
				matrix: "bt709",
				primaries: "bt709",
				transfer: "bt709"
			},
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
	const splitPlanarYuvA = (source, format, sourceFrame) => {
		const width = sourceFrame.visibleRect?.width ?? sourceFrame.codedWidth;
		const height = sourceFrame.visibleRect?.height ?? sourceFrame.codedHeight;
		const is10 = format.includes("P10");
		const is12 = format.includes("P12");
		const bytesPerSample = is10 || is12 ? 2 : 1;
		let chromaW;
		let chromaH;
		if (format.startsWith("I420")) {
			chromaW = Math.ceil(width / 2);
			chromaH = Math.ceil(height / 2);
		} else if (format.startsWith("I422")) {
			chromaW = Math.ceil(width / 2);
			chromaH = height;
		} else {
			chromaW = width;
			chromaH = height;
		}
		const ySamples = width * height;
		const uvSamples = chromaW * chromaH;
		const yBytes = ySamples * bytesPerSample;
		const uvBytes = uvSamples * bytesPerSample;
		const aBytes = ySamples * bytesPerSample;
		const colorBytes = yBytes + uvBytes * 2;
		const colorFormat = format.replace("A", "");
		const alphaUvSamples = Math.ceil(width / 2) * Math.ceil(height / 2);
		const alphaSize = aBytes + 2 * (alphaUvSamples * bytesPerSample);
		const alphaBuffer = new Uint8Array(alphaSize);
		const aPlaneStart = colorBytes;
		alphaBuffer.set(source.subarray(aPlaneStart, aPlaneStart + aBytes), 0);
		const uvOffset = aBytes;
		const neutralChroma = is10 ? 512 : is12 ? 2048 : 128;
		if (bytesPerSample === 1) alphaBuffer.fill(neutralChroma, uvOffset);
		else new Uint16Array(alphaBuffer.buffer, uvOffset, 2 * alphaUvSamples).fill(neutralChroma);
		const alphaFormat = is10 ? "I420P10" : is12 ? "I420P12" : "I420";
		const colorFrame = new VideoFrame(source.subarray(0, colorBytes), {
			format: colorFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0
		});
		const alphaInit = {
			format: alphaFormat,
			codedWidth: width,
			codedHeight: height,
			timestamp: sourceFrame.timestamp,
			duration: sourceFrame.duration ?? void 0,
			colorSpace: {
				fullRange: true,
				matrix: "bt709",
				primaries: "bt709",
				transfer: "bt709"
			},
			transfer: [alphaBuffer.buffer]
		};
		return {
			colorFrame,
			alphaFrame: new VideoFrame(alphaBuffer, alphaInit)
		};
	};
};
/**
* This source can be used to add video frames to the output track from a fixed canvas element. Since canvases are often
* used for rendering, this source provides a convenient wrapper around {@link VideoSampleSource}.
* @group Media sources
* @public
*/
var CanvasSource = class extends VideoSource {
	/**
	* Creates a new {@link CanvasSource} from a canvas element or `OffscreenCanvas` whose samples are encoded
	* according to the specified {@link VideoEncodingConfig}.
	*/
	constructor(canvas, encodingConfig) {
		if (!(typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement) && !(typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas)) throw new TypeError("canvas must be an HTMLCanvasElement or OffscreenCanvas.");
		validateVideoEncodingConfig(encodingConfig);
		super(encodingConfig.codec);
		this._encoder = new VideoEncoderWrapper(this, encodingConfig);
		this._canvas = canvas;
	}
	/**
	* Captures the current canvas state as a video sample (frame), encodes it and adds it to the output.
	*
	* @param timestamp - The timestamp of the sample, in seconds.
	* @param duration - The duration of the sample, in seconds.
	*
	* @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
	* to respect writer and encoder backpressure.
	*/
	add(timestamp, duration = 0, encodeOptions) {
		if (!Number.isFinite(timestamp)) throw new TypeError("timestamp must be a finite number.");
		if (!Number.isFinite(duration) || duration < 0) throw new TypeError("duration must be a non-negative number.");
		const sample = new VideoSample(this._canvas, {
			timestamp,
			duration
		});
		return this._encoder.add(sample, true, encodeOptions);
	}
	/** @internal */
	_flushAndClose(forceClose) {
		return this._encoder.flushAndClose(forceClose);
	}
};
/**
* Base class for audio sources - sources for audio tracks.
* @group Media sources
* @public
*/
var AudioSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		if (!AUDIO_CODECS.includes(codec)) throw new TypeError(`Invalid audio codec '${codec}'. Must be one of: ${AUDIO_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
var PCM_ENCODER_PACKET_SIZE = 2048;
var AudioEncoderWrapper = class {
	setError(error) {
		if (!this.errorSet) {
			this.error = error;
			this.errorSet = true;
		}
	}
	constructor(source, encodingConfig) {
		this.source = source;
		this.encodingConfig = encodingConfig;
		this.ensureEncoderPromise = null;
		this.encoderInitialized = false;
		this.encoder = null;
		this.muxer = null;
		this.lastNumberOfChannels = null;
		this.lastSampleRate = null;
		this.isPcmEncoder = false;
		this.outputSampleSize = null;
		this.writeOutputValue = null;
		this.pcmMeta = null;
		this.pcmStartTimestamp = 0;
		this.pcmEmittedFrames = 0;
		this.pcmReadBuffer = /* @__PURE__ */ new ArrayBuffer(0);
		this.pcmScratchView = null;
		this.pcmScratchFrames = 0;
		this.customEncoder = null;
		this.customEncoderCallSerializer = new CallSerializer();
		this.customEncoderQueueSize = 0;
		this.lastEndSampleIndex = null;
		this.resampler = null;
		/**
		* Encoders typically throw their errors "out of band", meaning asynchronously in some other execution context.
		* However, we want to surface these errors to the user within the normal control flow, so they don't go uncaught.
		* So, we keep track of the encoder error and throw it as soon as we get the chance.
		*/
		this.error = null;
		this.errorSet = false;
		this.lastMuxerPromise = Promise.resolve();
		this.closed = false;
	}
	async add(audioSample, shouldClose) {
		try {
			this.checkForEncoderError();
			this.source._ensureValidAdd();
			if (this.lastNumberOfChannels !== null && this.lastSampleRate !== null) {
				if (audioSample.numberOfChannels !== this.lastNumberOfChannels || audioSample.sampleRate !== this.lastSampleRate) throw new Error(`Audio parameters must remain constant. Expected ${this.lastNumberOfChannels} channels at ${this.lastSampleRate} Hz, got ${audioSample.numberOfChannels} channels at ${audioSample.sampleRate} Hz.`);
			} else {
				this.lastNumberOfChannels = audioSample.numberOfChannels;
				this.lastSampleRate = audioSample.sampleRate;
			}
			const config = this.encodingConfig;
			if (config.transform?.numberOfChannels !== void 0 || config.transform?.sampleRate !== void 0) {
				if (!this.resampler) this.resampler = new AudioResampler({
					targetNumberOfChannels: config.transform.numberOfChannels ?? audioSample.numberOfChannels,
					targetSampleRate: config.transform.sampleRate ?? audioSample.sampleRate,
					onSample: async (sample) => {
						await this.processAndEncode(sample, true);
					}
				});
				await this.resampler.add(audioSample);
			} else await this.processAndEncode(audioSample, shouldClose);
		} finally {
			if (shouldClose) audioSample.close();
		}
	}
	/**
	* Runs the process function (if any) and encodes the resulting samples.
	*/
	async processAndEncode(audioSample, shouldClose) {
		const config = this.encodingConfig;
		if (config.transform?.sampleFormat !== void 0 && toInterleavedAudioFormat(audioSample.format) !== config.transform.sampleFormat) {
			const newSample = audioSampleToInterleavedFormat(audioSample, config.transform.sampleFormat);
			if (shouldClose) audioSample.close();
			audioSample = newSample;
			shouldClose = true;
		}
		if (config.transform?.process) try {
			let processed = config.transform.process(audioSample);
			if (isThenable(processed)) processed = await processed;
			if (processed === null) return;
			if (!Array.isArray(processed)) processed = [processed];
			try {
				for (const sample of processed) if (!(sample instanceof AudioSample)) throw new TypeError("The audio process function must return an AudioSample, null, or an array of AudioSamples.");
				for (const sample of processed) await this.encodeSample(sample, true);
			} finally {
				for (const sample of processed) if (sample instanceof AudioSample) sample.close();
			}
		} finally {
			if (shouldClose) audioSample.close();
		}
		else await this.encodeSample(audioSample, shouldClose);
	}
	/**
	* Encodes a single audio sample, handling encoder init, gap padding, and backpressure.
	*/
	async encodeSample(audioSample, shouldClose) {
		try {
			if (!this.encoderInitialized) {
				if (!this.ensureEncoderPromise) this.ensureEncoder(audioSample);
				if (!this.encoderInitialized) await this.ensureEncoderPromise;
			}
			assert(this.encoderInitialized);
			if (this.closed) return;
			{
				const startSampleIndex = Math.round(audioSample.timestamp * audioSample.sampleRate);
				const endSampleIndex = Math.round((audioSample.timestamp + audioSample.duration) * audioSample.sampleRate);
				if (this.lastEndSampleIndex === null) this.lastEndSampleIndex = endSampleIndex;
				else {
					const sampleDiff = startSampleIndex - this.lastEndSampleIndex;
					if (sampleDiff >= 64) {
						const bytesPerSample = getBytesPerSample(audioSample.format);
						const data = new Uint8Array(bytesPerSample * sampleDiff * audioSample.numberOfChannels);
						if (audioSample.format === "u8" || audioSample.format === "u8-planar") data.fill(128);
						const fillSample = new AudioSample({
							data,
							format: audioSample.format,
							sampleRate: audioSample.sampleRate,
							numberOfChannels: audioSample.numberOfChannels,
							numberOfFrames: sampleDiff,
							timestamp: this.lastEndSampleIndex / audioSample.sampleRate
						});
						await this.encodeSample(fillSample, true);
					}
					this.lastEndSampleIndex += audioSample.numberOfFrames;
				}
			}
			this.encodingConfig.onEncodedSample?.(audioSample);
			if (this.customEncoder) {
				this.customEncoderQueueSize++;
				const clonedSample = audioSample.clone();
				const promise = this.customEncoderCallSerializer.call(() => this.customEncoder.encode(clonedSample)).catch((error) => this.setError(error)).finally(() => {
					this.customEncoderQueueSize--;
					clonedSample.close();
				});
				if (this.customEncoderQueueSize >= 4) await promise;
				await this.lastMuxerPromise;
			} else if (this.isPcmEncoder) await this.doPcmEncoding(audioSample, shouldClose);
			else {
				assert(this.encoder);
				const audioData = audioSample.toAudioData();
				this.encoder.encode(audioData);
				audioData.close();
				if (shouldClose) audioSample.close();
				if (this.encoder.encodeQueueSize >= 4) await new Promise((resolve) => this.encoder.addEventListener("dequeue", resolve, { once: true }));
				await this.lastMuxerPromise;
			}
		} finally {
			if (shouldClose) audioSample.close();
		}
	}
	async doPcmEncoding(audioSample, shouldClose) {
		assert(this.outputSampleSize);
		assert(this.writeOutputValue);
		const { numberOfChannels, numberOfFrames, sampleRate, timestamp } = audioSample;
		if (!this.pcmMeta) {
			this.pcmMeta = { decoderConfig: {
				codec: this.encodingConfig.codec,
				numberOfChannels,
				sampleRate
			} };
			this.pcmStartTimestamp = timestamp;
		}
		const isS32 = audioSample.format === "s32" || audioSample.format === "s32-planar";
		const readFormat = isS32 ? "s32" : "f32";
		const scale = isS32 ? 1 / 2147483648 : 1;
		const allocationSize = audioSample.allocationSize({
			planeIndex: 0,
			format: readFormat
		});
		if (this.pcmReadBuffer.byteLength < allocationSize) this.pcmReadBuffer = new ArrayBuffer(allocationSize);
		const values = isS32 ? new Int32Array(this.pcmReadBuffer, 0, allocationSize / 4) : new Float32Array(this.pcmReadBuffer, 0, allocationSize / 4);
		audioSample.copyTo(values, {
			planeIndex: 0,
			format: readFormat
		});
		if (shouldClose) audioSample.close();
		let frame = 0;
		while (frame < numberOfFrames) {
			this.pcmScratchView ??= /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(PCM_ENCODER_PACKET_SIZE * numberOfChannels * this.outputSampleSize));
			const frameCount = Math.min(PCM_ENCODER_PACKET_SIZE - this.pcmScratchFrames, numberOfFrames - frame);
			const valueOffset = this.pcmScratchFrames * numberOfChannels;
			const readOffset = frame * numberOfChannels;
			for (let i = 0; i < frameCount * numberOfChannels; i++) this.writeOutputValue(this.pcmScratchView, (valueOffset + i) * this.outputSampleSize, values[readOffset + i] * scale);
			this.pcmScratchFrames += frameCount;
			frame += frameCount;
			if (this.pcmScratchFrames === 2048) await this.emitPcmScratchPacket();
		}
	}
	async emitPcmScratchPacket() {
		assert(this.outputSampleSize);
		assert(this.pcmScratchView);
		assert(this.pcmMeta?.decoderConfig);
		const { numberOfChannels, sampleRate } = this.pcmMeta.decoderConfig;
		const byteLength = this.pcmScratchFrames * numberOfChannels * this.outputSampleSize;
		const packet = new EncodedPacket(new Uint8Array(this.pcmScratchView.buffer, 0, byteLength), "key", this.pcmStartTimestamp + this.pcmEmittedFrames / sampleRate, this.pcmScratchFrames / sampleRate);
		this.pcmEmittedFrames += this.pcmScratchFrames;
		this.pcmScratchView = null;
		this.pcmScratchFrames = 0;
		this.encodingConfig.onEncodedPacket?.(packet, this.pcmMeta);
		await this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, this.pcmMeta);
	}
	ensureEncoder(audioSample) {
		this.ensureEncoderPromise = (async () => {
			const { format, numberOfChannels, sampleRate, timestamp } = audioSample;
			const quality = resolveQuality(this.encodingConfig.quality, this.encodingConfig.bitrate);
			const encoderConfig = buildAudioEncoderConfig({
				numberOfChannels,
				sampleRate,
				...this.encodingConfig,
				quality
			});
			this.encodingConfig.onEncoderConfig?.(encoderConfig);
			this.source._nominalBitrate = encoderConfig.bitrate ?? null;
			const MatchingCustomEncoder = customAudioEncoders.find((x) => x.supports(this.encodingConfig.codec, encoderConfig));
			if (MatchingCustomEncoder) {
				this.customEncoder = new MatchingCustomEncoder();
				this.customEncoder.codec = this.encodingConfig.codec;
				this.customEncoder.config = encoderConfig;
				this.customEncoder.onPacket = (packet, meta) => {
					if (!(packet instanceof EncodedPacket)) throw new TypeError("The first argument passed to onPacket must be an EncodedPacket.");
					if (meta !== void 0 && (!meta || typeof meta !== "object")) throw new TypeError("The second argument passed to onPacket must be an object or undefined.");
					this.encodingConfig.onEncodedPacket?.(packet, meta);
					this.lastMuxerPromise = this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
						this.setError(error);
					});
				};
				this.customEncoder.onError = (error) => {
					this.setError(error);
				};
				await this.customEncoder.init();
			} else if (PCM_AUDIO_CODECS.includes(this.encodingConfig.codec)) this.initPcmEncoder();
			else {
				if (typeof AudioEncoder === "undefined") throw new Error(missingWebCodecsClassMessage("AudioEncoder"));
				let supported;
				try {
					supported = (await AudioEncoder.isConfigSupported(encoderConfig)).supported ?? false;
				} catch {
					supported = false;
				}
				if (!supported) throw new Error(`This specific encoder configuration (${encoderConfig.codec}, ${encoderConfig.bitrate} bps, ${encoderConfig.numberOfChannels} channels, ${encoderConfig.sampleRate} Hz) is not supported in this environment. Consider using another codec or changing your audio parameters.`);
				const primingShift = await detectAudioEncoderPrimingShift(this.encodingConfig.codec, encoderConfig.codec) / encoderConfig.sampleRate;
				let opusPreSkip = 0;
				const stack = (/* @__PURE__ */ new Error("Encoding error")).stack;
				this.encoder = new AudioEncoder({
					output: (chunk, meta) => {
						if (meta?.decoderConfig) {
							fixAudioDecoderConfig(this.encodingConfig.codec, encoderConfig, meta.decoderConfig);
							if (this.encodingConfig.codec === "opus" && meta.decoderConfig.description) opusPreSkip = parseOpusIdentificationHeader(toUint8Array(meta.decoderConfig.description)).preSkip / OPUS_SAMPLE_RATE;
						}
						let packet = EncodedPacket.fromEncodedChunk(chunk);
						packet = packet.clone({
							timestamp: roundToDivisor(packet.timestamp - primingShift - opusPreSkip, encoderConfig.sampleRate),
							duration: chunk.duration != null ? roundToDivisor(packet.duration, encoderConfig.sampleRate) : void 0
						});
						if (isFirefox()) opusPreSkip = 0;
						this.encodingConfig.onEncodedPacket?.(packet, meta);
						this.lastMuxerPromise = this.muxer.addEncodedAudioPacket(this.source._connectedTrack, packet, meta).catch((error) => {
							this.setError(error);
						});
					},
					error: (error) => {
						error.stack = stack;
						this.setError(error);
					}
				});
				this.encoder.configure(encoderConfig);
				if (this.encodingConfig.codec === "aac" && isWebKit()) encodeAacSilencePrefix(this.encoder, format, numberOfChannels, sampleRate, timestamp);
			}
			assert(this.source._connectedTrack);
			this.muxer = this.source._connectedTrack.output._muxer;
			this.encoderInitialized = true;
		})();
	}
	initPcmEncoder() {
		this.isPcmEncoder = true;
		const codec = this.encodingConfig.codec;
		const { dataType, sampleSize, littleEndian } = parsePcmCodec(codec);
		this.outputSampleSize = sampleSize;
		switch (sampleSize) {
			case 1:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint8(byteOffset, clamp(Math.round(value * 128) + 128, 0, 255));
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => {
					view.setInt8(byteOffset, clamp(Math.round(value * 128), -128, 127));
				};
				else if (dataType === "ulaw") this.writeOutputValue = (view, byteOffset, value) => {
					const int16 = clamp(Math.round(value * 32768), -32768, 32767);
					view.setUint8(byteOffset, toUlaw(int16));
				};
				else if (dataType === "alaw") this.writeOutputValue = (view, byteOffset, value) => {
					const int16 = clamp(Math.round(value * 32768), -32768, 32767);
					view.setUint8(byteOffset, toAlaw(int16));
				};
				else assert(false);
				break;
			case 2:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint16(byteOffset, clamp(Math.round(value * 32768) + 32768, 0, 65535), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => view.setInt16(byteOffset, clamp(Math.round(value * 32768), -32768, 32767), littleEndian);
				else assert(false);
				break;
			case 3:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => setUint24(view, byteOffset, clamp(Math.round(value * 8388608) + 8388608, 0, 16777215), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => setInt24(view, byteOffset, clamp(Math.round(value * 8388608), -8388608, 8388607), littleEndian);
				else assert(false);
				break;
			case 4:
				if (dataType === "unsigned") this.writeOutputValue = (view, byteOffset, value) => view.setUint32(byteOffset, clamp(Math.round(value * 2147483648) + 2147483648, 0, 4294967295), littleEndian);
				else if (dataType === "signed") this.writeOutputValue = (view, byteOffset, value) => view.setInt32(byteOffset, clamp(Math.round(value * 2147483648), -2147483648, 2147483647), littleEndian);
				else if (dataType === "float") this.writeOutputValue = (view, byteOffset, value) => view.setFloat32(byteOffset, value, littleEndian);
				else assert(false);
				break;
			case 8:
				if (dataType === "float") this.writeOutputValue = (view, byteOffset, value) => view.setFloat64(byteOffset, value, littleEndian);
				else assert(false);
				break;
			default:
				assertNever(sampleSize);
				assert(false);
		}
	}
	async flushAndClose(forceClose) {
		try {
			if (!forceClose) {
				this.checkForEncoderError();
				if (this.resampler) await this.resampler.finalize();
				if (this.pcmScratchFrames > 0) await this.emitPcmScratchPacket();
			}
			this.closed = true;
			if (!forceClose) {
				if (this.customEncoder) this.customEncoderCallSerializer.call(() => this.customEncoder.flush());
				else if (this.encoder) await this.encoder.flush();
			}
		} finally {
			this.closed = true;
			this.resampler = null;
			if (this.customEncoder) await this.customEncoderCallSerializer.call(() => this.customEncoder.close()).catch((error) => this.setError(error));
			else if (this.encoder && this.encoder.state !== "closed") this.encoder.close();
		}
		if (!forceClose) this.checkForEncoderError();
	}
	getQueueSize() {
		if (this.customEncoder) return this.customEncoderQueueSize;
		else if (this.isPcmEncoder) return 0;
		else return this.encoder?.encodeQueueSize ?? 0;
	}
	checkForEncoderError() {
		if (this.errorSet) throw this.error;
	}
};
var audioEncoderPrimingShiftPromises = /* @__PURE__ */ new Map();
var detectAudioEncoderPrimingShift = (codec, codecString) => {
	let promise = audioEncoderPrimingShiftPromises.get(codecString);
	if (promise) return promise;
	promise = (async () => {
		const numberOfChannels = 1;
		const sampleRate = 48e3;
		const encoderConfig = {
			codec: codecString,
			numberOfChannels,
			sampleRate,
			...getAudioEncoderConfigExtension(codec)
		};
		const impulseIndex = 4096;
		const numberOfFrames = 2 * impulseIndex;
		const format = "f32-planar";
		const chunks = [];
		let decoderConfig = null;
		let peakIndex = null;
		let peakValue = -Infinity;
		let decodedFrames = 0;
		let codecError = null;
		const encoder = new AudioEncoder({
			output: (chunk, meta) => {
				if (meta?.decoderConfig) decoderConfig ??= meta.decoderConfig;
				chunks.push(chunk);
			},
			error: (error) => {
				codecError ??= error;
			}
		});
		const decoder = new AudioDecoder({
			output: (audioData) => {
				const values = new Float32Array(audioData.numberOfFrames);
				audioData.copyTo(values, {
					planeIndex: 0,
					format
				});
				audioData.close();
				for (let i = 0; i < values.length; i++) if (values[i] > peakValue) {
					peakValue = values[i];
					peakIndex = decodedFrames + i;
				}
				decodedFrames += values.length;
			},
			error: (error) => {
				codecError ??= error;
			}
		});
		try {
			encoder.configure(encoderConfig);
			if (codec === "aac" && isWebKit()) encodeAacSilencePrefix(encoder, format, numberOfChannels, sampleRate, 0);
			const data = new Float32Array(numberOfChannels * numberOfFrames);
			data[impulseIndex] = 1;
			const audioData = new AudioData({
				data,
				format,
				numberOfChannels,
				numberOfFrames,
				sampleRate,
				timestamp: 0
			});
			encoder.encode(audioData);
			audioData.close();
			await encoder.flush();
			assert(decoderConfig);
			fixAudioDecoderConfig(codec, encoderConfig, decoderConfig);
			decoder.configure(decoderConfig);
			for (const chunk of chunks) decoder.decode(chunk);
			await decoder.flush();
		} catch (error) {
			throw codecError ?? error;
		} finally {
			if (encoder.state !== "closed") encoder.close();
			if (decoder.state !== "closed") decoder.close();
		}
		assert(peakIndex !== null);
		const firstChunkTimestampInSamples = Math.round(chunks[0].timestamp / 1e6 * sampleRate);
		return peakIndex - impulseIndex + firstChunkTimestampInSamples;
	})();
	audioEncoderPrimingShiftPromises.set(codecString, promise);
	promise.catch(() => audioEncoderPrimingShiftPromises.delete(codecString));
	return promise;
};
/** Works around https://bugs.webkit.org/show_bug.cgi?id=328491 */
var encodeAacSilencePrefix = (encoder, format, numberOfChannels, sampleRate, timestamp) => {
	const numberOfFrames = 1024;
	const bytesPerSample = getBytesPerSample(format);
	const data = new Uint8Array(bytesPerSample * numberOfFrames * numberOfChannels);
	if (format === "u8" || format === "u8-planar") data.fill(128);
	const audioData = new AudioData({
		data,
		format,
		numberOfChannels,
		numberOfFrames,
		sampleRate,
		timestamp: Math.round(1e6 * (timestamp - numberOfFrames / sampleRate))
	});
	encoder.encode(audioData);
	audioData.close();
};
var fixAudioDecoderConfig = (codec, encoderConfig, decoderConfig) => {
	if (codec === "aac") {
		if (decoderConfig.description && decoderConfig.description.byteLength > 0 && toUint8Array(decoderConfig.description)[0] === 3) {
			const { decoderSpecificInfo } = readEsDescriptor(FileSlice.tempFromBytes(toUint8Array(decoderConfig.description)));
			decoderConfig.description = decoderSpecificInfo ?? void 0;
		}
		let needsDescriptionOverwrite = false;
		if (!decoderConfig.description || decoderConfig.description.byteLength < 2) needsDescriptionOverwrite = true;
		else needsDescriptionOverwrite = parseAacAudioSpecificConfig(toUint8Array(decoderConfig.description)).objectType === 0;
		if (needsDescriptionOverwrite) decoderConfig.description = buildAacAudioSpecificConfig({
			objectType: Number(last(encoderConfig.codec.split("."))),
			outputNumberOfChannels: decoderConfig.numberOfChannels,
			outputSampleRate: decoderConfig.sampleRate
		});
	}
};
/**
* This source can be used to add audio data from an AudioBuffer to the output track. This is useful when working with
* the Web Audio API.
* @group Media sources
* @public
*/
var AudioBufferSource = class extends AudioSource {
	/**
	* Creates a new {@link AudioBufferSource} whose `AudioBuffer` instances are encoded according to the specified
	* {@link AudioEncodingConfig} and {@link AudioBufferSourceOptions}.
	*/
	constructor(encodingConfig, options = {}) {
		validateAudioEncodingConfig(encodingConfig);
		if (typeof options !== "object" || !options) throw new TypeError("options must be an object.");
		if (options.startTimestamp !== void 0 && !Number.isFinite(options.startTimestamp)) throw new TypeError("options.startTimestamp, when provided, must be a finite number.");
		super(encodingConfig.codec);
		this._encoder = new AudioEncoderWrapper(this, encodingConfig);
		this._accumulatedTime = options.startTimestamp ?? 0;
	}
	/**
	* Converts an AudioBuffer to audio samples, encodes them and adds them to the output. The first `AudioBuffer` will
	* be played at the configured start timestamp (the default is 0), and each subsequent `AudioBuffer` will be placed
	* directly after the previous one.
	*
	* @returns A Promise that resolves once the output is ready to receive more samples. You should await this Promise
	* to respect writer and encoder backpressure.
	*/
	async add(audioBuffer) {
		if (!(audioBuffer instanceof AudioBuffer)) throw new TypeError("audioBuffer must be an AudioBuffer.");
		const iterator = AudioSample._fromAudioBuffer(audioBuffer, this._accumulatedTime);
		this._accumulatedTime += audioBuffer.duration;
		for (const audioSample of iterator) await this._encoder.add(audioSample, true);
	}
	/** @internal */
	_flushAndClose(forceClose) {
		return this._encoder.flushAndClose(forceClose);
	}
};
/**
* Base class for subtitle sources - sources for subtitle tracks.
* @group Media sources
* @public
*/
var SubtitleSource = class extends MediaSource {
	/** Internal constructor. */
	constructor(codec) {
		super();
		if (!SUBTITLE_CODECS.includes(codec)) throw new TypeError(`Invalid subtitle codec '${codec}'. Must be one of: ${SUBTITLE_CODECS.join(", ")}.`);
		this._codec = codec;
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/codec.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* List of known video codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
var VIDEO_CODECS = [
	"avc",
	"hevc",
	"vp9",
	"av1",
	"vp8",
	"prores"
];
/**
* List of known PCM (uncompressed) audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
var PCM_AUDIO_CODECS = [
	"pcm-s16",
	"pcm-s16be",
	"pcm-s24",
	"pcm-s24be",
	"pcm-s32",
	"pcm-s32be",
	"pcm-f32",
	"pcm-f32be",
	"pcm-f64",
	"pcm-f64be",
	"pcm-u8",
	"pcm-s8",
	"ulaw",
	"alaw"
];
/**
* List of known compressed audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
var NON_PCM_AUDIO_CODECS = [
	"aac",
	"opus",
	"mp3",
	"vorbis",
	"flac",
	"ac3",
	"eac3",
	"dts",
	"truehd"
];
/**
* List of known audio codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
var AUDIO_CODECS = [...NON_PCM_AUDIO_CODECS, ...PCM_AUDIO_CODECS];
/**
* List of known subtitle codecs, ordered by encoding preference.
* @group Codecs
* @public
*/
var SUBTITLE_CODECS = ["webvtt"];
var AVC_LEVEL_TABLE = [
	{
		maxMacroblocks: 99,
		maxBitrate: 64e3,
		maxDpbMbs: 396,
		level: 10
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 192e3,
		maxDpbMbs: 900,
		level: 11
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 384e3,
		maxDpbMbs: 2376,
		level: 12
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 768e3,
		maxDpbMbs: 2376,
		level: 13
	},
	{
		maxMacroblocks: 396,
		maxBitrate: 2e6,
		maxDpbMbs: 2376,
		level: 20
	},
	{
		maxMacroblocks: 792,
		maxBitrate: 4e6,
		maxDpbMbs: 4752,
		level: 21
	},
	{
		maxMacroblocks: 1620,
		maxBitrate: 4e6,
		maxDpbMbs: 8100,
		level: 22
	},
	{
		maxMacroblocks: 1620,
		maxBitrate: 1e7,
		maxDpbMbs: 8100,
		level: 30
	},
	{
		maxMacroblocks: 3600,
		maxBitrate: 14e6,
		maxDpbMbs: 18e3,
		level: 31
	},
	{
		maxMacroblocks: 5120,
		maxBitrate: 2e7,
		maxDpbMbs: 20480,
		level: 32
	},
	{
		maxMacroblocks: 8192,
		maxBitrate: 2e7,
		maxDpbMbs: 32768,
		level: 40
	},
	{
		maxMacroblocks: 8192,
		maxBitrate: 5e7,
		maxDpbMbs: 32768,
		level: 41
	},
	{
		maxMacroblocks: 8704,
		maxBitrate: 5e7,
		maxDpbMbs: 34816,
		level: 42
	},
	{
		maxMacroblocks: 22080,
		maxBitrate: 135e6,
		maxDpbMbs: 110400,
		level: 50
	},
	{
		maxMacroblocks: 36864,
		maxBitrate: 24e7,
		maxDpbMbs: 184320,
		level: 51
	},
	{
		maxMacroblocks: 36864,
		maxBitrate: 24e7,
		maxDpbMbs: 184320,
		level: 52
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 24e7,
		maxDpbMbs: 696320,
		level: 60
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 48e7,
		maxDpbMbs: 696320,
		level: 61
	},
	{
		maxMacroblocks: 139264,
		maxBitrate: 8e8,
		maxDpbMbs: 696320,
		level: 62
	}
];
var HEVC_LEVEL_TABLE = [
	{
		maxPictureSize: 36864,
		maxBitrate: 128e3,
		tier: "L",
		level: 30
	},
	{
		maxPictureSize: 122880,
		maxBitrate: 15e5,
		tier: "L",
		level: 60
	},
	{
		maxPictureSize: 245760,
		maxBitrate: 3e6,
		tier: "L",
		level: 63
	},
	{
		maxPictureSize: 552960,
		maxBitrate: 6e6,
		tier: "L",
		level: 90
	},
	{
		maxPictureSize: 983040,
		maxBitrate: 1e7,
		tier: "L",
		level: 93
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 12e6,
		tier: "L",
		level: 120
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 3e7,
		tier: "H",
		level: 120
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 2e7,
		tier: "L",
		level: 123
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 5e7,
		tier: "H",
		level: 123
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 25e6,
		tier: "L",
		level: 150
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 1e8,
		tier: "H",
		level: 150
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 4e7,
		tier: "L",
		level: 153
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 16e7,
		tier: "H",
		level: 153
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		tier: "L",
		level: 156
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 24e7,
		tier: "H",
		level: 156
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "L",
		level: 180
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 180
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 12e7,
		tier: "L",
		level: 183
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		tier: "H",
		level: 183
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "L",
		level: 186
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 186
	}
];
var VP9_LEVEL_TABLE = [
	{
		maxPictureSize: 36864,
		maxBitrate: 2e5,
		level: 10
	},
	{
		maxPictureSize: 73728,
		maxBitrate: 8e5,
		level: 11
	},
	{
		maxPictureSize: 122880,
		maxBitrate: 18e5,
		level: 20
	},
	{
		maxPictureSize: 245760,
		maxBitrate: 36e5,
		level: 21
	},
	{
		maxPictureSize: 552960,
		maxBitrate: 72e5,
		level: 30
	},
	{
		maxPictureSize: 983040,
		maxBitrate: 12e6,
		level: 31
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 18e6,
		level: 40
	},
	{
		maxPictureSize: 2228224,
		maxBitrate: 3e7,
		level: 41
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		level: 50
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 12e7,
		level: 51
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 18e7,
		level: 52
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 18e7,
		level: 60
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		level: 61
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		level: 62
	}
];
var AV1_LEVEL_TABLE = [
	{
		maxPictureSize: 147456,
		maxBitrate: 15e5,
		tier: "M",
		level: 0
	},
	{
		maxPictureSize: 278784,
		maxBitrate: 3e6,
		tier: "M",
		level: 1
	},
	{
		maxPictureSize: 665856,
		maxBitrate: 6e6,
		tier: "M",
		level: 4
	},
	{
		maxPictureSize: 1065024,
		maxBitrate: 1e7,
		tier: "M",
		level: 5
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 12e6,
		tier: "M",
		level: 8
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 3e7,
		tier: "H",
		level: 8
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 2e7,
		tier: "M",
		level: 9
	},
	{
		maxPictureSize: 2359296,
		maxBitrate: 5e7,
		tier: "H",
		level: 9
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 3e7,
		tier: "M",
		level: 12
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 1e8,
		tier: "H",
		level: 12
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 4e7,
		tier: "M",
		level: 13
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 16e7,
		tier: "H",
		level: 13
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 6e7,
		tier: "M",
		level: 14
	},
	{
		maxPictureSize: 8912896,
		maxBitrate: 24e7,
		tier: "H",
		level: 14
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "M",
		level: 15
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 15
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 6e7,
		tier: "M",
		level: 16
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 24e7,
		tier: "H",
		level: 16
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 1e8,
		tier: "M",
		level: 17
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 48e7,
		tier: "H",
		level: 17
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 16e7,
		tier: "M",
		level: 18
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 18
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 16e7,
		tier: "M",
		level: 19
	},
	{
		maxPictureSize: 35651584,
		maxBitrate: 8e8,
		tier: "H",
		level: 19
	}
];
var VP9_DEFAULT_SUFFIX = ".01.01.01.01.00";
var AV1_DEFAULT_SUFFIX = ".0.110.01.01.01.0";
var PRORES_FOURCCS = [
	"ap4x",
	"ap4h",
	"apch",
	"apcn",
	"apcs",
	"apco"
];
var DTS_FOURCCS = [
	"dtsc",
	"dtsh",
	"dtsl",
	"dtse"
];
var PRORES_PROFILE_TARGET_BITRATES = [
	{
		fourCc: "apco",
		bitrate: 45e6,
		alpha: false
	},
	{
		fourCc: "apcs",
		bitrate: 102e6,
		alpha: false
	},
	{
		fourCc: "apcn",
		bitrate: 147e6,
		alpha: false
	},
	{
		fourCc: "apch",
		bitrate: 22e7,
		alpha: false
	},
	{
		fourCc: "ap4h",
		bitrate: 33e7,
		alpha: true
	},
	{
		fourCc: "ap4x",
		bitrate: 5e8,
		alpha: true
	}
];
var buildVideoCodecString = (codec, width, height, bitrate, alpha) => {
	if (codec === "avc") {
		const constrainedBaseline = isWebKit();
		const profileIndication = constrainedBaseline ? 66 : 100;
		const totalMacroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
		const levelInfo = AVC_LEVEL_TABLE.find((level) => totalMacroblocks <= level.maxMacroblocks && bitrate <= level.maxBitrate) ?? last(AVC_LEVEL_TABLE);
		const levelIndication = levelInfo ? levelInfo.level : 0;
		return `avc1.${profileIndication.toString(16).padStart(2, "0")}${constrainedBaseline ? "40" : "00"}${levelIndication.toString(16).padStart(2, "0")}`;
	} else if (codec === "hevc") {
		const profilePrefix = "";
		const profileIdc = 1;
		const compatibilityFlags = "6";
		const pictureSize = width * height;
		const levelInfo = HEVC_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(HEVC_LEVEL_TABLE);
		return `hev1.${profilePrefix}${profileIdc}.${compatibilityFlags}.${levelInfo.tier}${levelInfo.level}.B0`;
	} else if (codec === "vp8") return "vp8";
	else if (codec === "vp9") {
		const profile = "00";
		const pictureSize = width * height;
		return `vp09.${profile}.${(VP9_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(VP9_LEVEL_TABLE)).level.toString().padStart(2, "0")}.08`;
	} else if (codec === "av1") {
		const profile = 0;
		const pictureSize = width * height;
		const levelInfo = AV1_LEVEL_TABLE.find((level) => pictureSize <= level.maxPictureSize && bitrate <= level.maxBitrate) ?? last(AV1_LEVEL_TABLE);
		return `av01.${profile}.${levelInfo.level.toString().padStart(2, "0")}${levelInfo.tier}.08`;
	} else if (codec === "prores") {
		const scaleFactor = Math.pow(width * height / 2073600, .95);
		const candidates = PRORES_PROFILE_TARGET_BITRATES.filter((x) => x.alpha === alpha);
		let bestFourCc = candidates[0].fourCc;
		let smallestDifference = Infinity;
		for (const { fourCc, bitrate: targetBitrate } of candidates) {
			const difference = Math.abs(targetBitrate * scaleFactor - bitrate);
			if (difference < smallestDifference) {
				smallestDifference = difference;
				bestFourCc = fourCc;
			}
		}
		return bestFourCc;
	} else assertNever(codec);
	throw new TypeError(`Unhandled codec '${String(codec)}'.`);
};
var generateAv1CodecConfigurationFromCodecString = (codecString) => {
	const parts = codecString.split(".");
	const firstByte = 129;
	const profile = Number(parts[1]);
	const levelAndTier = parts[2];
	const level = Number(levelAndTier.slice(0, -1));
	const secondByte = (profile << 5) + level;
	const tier = levelAndTier.slice(-1) === "H" ? 1 : 0;
	const bitDepth = Number(parts[3]);
	const highBitDepth = bitDepth === 8 ? 0 : 1;
	const twelveBit = bitDepth === 12 ? 1 : 0;
	const monochrome = parts[4] ? Number(parts[4]) : 0;
	const chromaSubsamplingX = parts[5] ? Number(parts[5][0]) : 1;
	const chromaSubsamplingY = parts[5] ? Number(parts[5][1]) : 1;
	const chromaSamplePosition = parts[5] ? Number(parts[5][2]) : 0;
	return [
		firstByte,
		secondByte,
		(tier << 7) + (highBitDepth << 6) + (twelveBit << 5) + (monochrome << 4) + (chromaSubsamplingX << 3) + (chromaSubsamplingY << 2) + chromaSamplePosition,
		0
	];
};
var extractVideoCodecString = (trackInfo) => {
	const { codec, codecDescription, colorSpace, avcCodecInfo, hevcCodecInfo, vp9CodecInfo, av1CodecInfo, proresFormat } = trackInfo;
	if (codec === "avc") {
		assert(trackInfo.avcType !== null);
		if (avcCodecInfo) {
			const bytes = new Uint8Array([
				avcCodecInfo.avcProfileIndication,
				avcCodecInfo.profileCompatibility,
				avcCodecInfo.avcLevelIndication
			]);
			return `avc${trackInfo.avcType}.${bytesToHexString(bytes)}`;
		}
		if (!codecDescription || codecDescription.byteLength < 4) throw new TypeError("AVC decoder description is not provided or is not at least 4 bytes long.");
		return `avc${trackInfo.avcType}.${bytesToHexString(codecDescription.subarray(1, 4))}`;
	} else if (codec === "hevc") {
		let generalProfileSpace;
		let generalProfileIdc;
		let compatibilityFlags;
		let generalTierFlag;
		let generalLevelIdc;
		let constraintFlags;
		if (hevcCodecInfo) {
			generalProfileSpace = hevcCodecInfo.generalProfileSpace;
			generalProfileIdc = hevcCodecInfo.generalProfileIdc;
			compatibilityFlags = reverseBitsU32(hevcCodecInfo.generalProfileCompatibilityFlags);
			generalTierFlag = hevcCodecInfo.generalTierFlag;
			generalLevelIdc = hevcCodecInfo.generalLevelIdc;
			constraintFlags = [...hevcCodecInfo.generalConstraintIndicatorFlags];
		} else {
			if (!codecDescription || codecDescription.byteLength < 23) throw new TypeError("HEVC decoder description is not provided or is not at least 23 bytes long.");
			const view = toDataView(codecDescription);
			const profileByte = view.getUint8(1);
			generalProfileSpace = profileByte >> 6 & 3;
			generalProfileIdc = profileByte & 31;
			compatibilityFlags = reverseBitsU32(view.getUint32(2));
			generalTierFlag = profileByte >> 5 & 1;
			generalLevelIdc = view.getUint8(12);
			constraintFlags = [];
			for (let i = 0; i < 6; i++) constraintFlags.push(view.getUint8(6 + i));
		}
		let codecString = "hev1.";
		codecString += [
			"",
			"A",
			"B",
			"C"
		][generalProfileSpace] + generalProfileIdc;
		codecString += ".";
		codecString += compatibilityFlags.toString(16).toUpperCase();
		codecString += ".";
		codecString += generalTierFlag === 0 ? "L" : "H";
		codecString += generalLevelIdc;
		while (constraintFlags.length > 0 && constraintFlags[constraintFlags.length - 1] === 0) constraintFlags.pop();
		if (constraintFlags.length > 0) {
			codecString += ".";
			codecString += constraintFlags.map((x) => x.toString(16).toUpperCase()).join(".");
		}
		return codecString;
	} else if (codec === "vp8") return "vp8";
	else if (codec === "vp9") {
		if (!vp9CodecInfo) {
			const pictureSize = trackInfo.width * trackInfo.height;
			let level = last(VP9_LEVEL_TABLE).level;
			for (const entry of VP9_LEVEL_TABLE) if (pictureSize <= entry.maxPictureSize) {
				level = entry.level;
				break;
			}
			return `vp09.00.${level.toString().padStart(2, "0")}.08`;
		}
		const profile = vp9CodecInfo.profile.toString().padStart(2, "0");
		const level = vp9CodecInfo.level.toString().padStart(2, "0");
		const bitDepth = vp9CodecInfo.bitDepth.toString().padStart(2, "0");
		const chromaSubsampling = vp9CodecInfo.chromaSubsampling.toString().padStart(2, "0");
		const colourPrimaries = vp9CodecInfo.colourPrimaries.toString().padStart(2, "0");
		const transferCharacteristics = vp9CodecInfo.transferCharacteristics.toString().padStart(2, "0");
		const matrixCoefficients = vp9CodecInfo.matrixCoefficients.toString().padStart(2, "0");
		const videoFullRangeFlag = vp9CodecInfo.videoFullRangeFlag.toString().padStart(2, "0");
		let string = `vp09.${profile}.${level}.${bitDepth}.${chromaSubsampling}`;
		string += `.${colourPrimaries}.${transferCharacteristics}.${matrixCoefficients}.${videoFullRangeFlag}`;
		if (string.endsWith(VP9_DEFAULT_SUFFIX)) string = string.slice(0, -15);
		return string;
	} else if (codec === "av1") {
		if (!av1CodecInfo) {
			const pictureSize = trackInfo.width * trackInfo.height;
			let level = last(VP9_LEVEL_TABLE).level;
			for (const entry of VP9_LEVEL_TABLE) if (pictureSize <= entry.maxPictureSize) {
				level = entry.level;
				break;
			}
			return `av01.0.${level.toString().padStart(2, "0")}M.08`;
		}
		const profile = av1CodecInfo.profile;
		const level = av1CodecInfo.level.toString().padStart(2, "0");
		const tier = av1CodecInfo.tier ? "H" : "M";
		const bitDepth = av1CodecInfo.bitDepth.toString().padStart(2, "0");
		const monochrome = av1CodecInfo.monochrome ? "1" : "0";
		const chromaSubsampling = 100 * av1CodecInfo.chromaSubsamplingX + 10 * av1CodecInfo.chromaSubsamplingY + 1 * (av1CodecInfo.chromaSubsamplingX && av1CodecInfo.chromaSubsamplingY ? av1CodecInfo.chromaSamplePosition : 0);
		let colorPrimaries;
		let transferCharacteristics;
		let matrixCoefficients;
		let videoFullRangeFlag;
		if (av1CodecInfoHasColorInfo(av1CodecInfo)) {
			colorPrimaries = av1CodecInfo.colourPrimaries;
			transferCharacteristics = av1CodecInfo.transferCharacteristics;
			matrixCoefficients = av1CodecInfo.matrixCoefficients;
			videoFullRangeFlag = av1CodecInfo.videoFullRangeFlag;
		} else {
			colorPrimaries = colorSpace?.primaries ? COLOR_PRIMARIES_MAP[colorSpace.primaries] : 1;
			transferCharacteristics = colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer] : 1;
			matrixCoefficients = colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[colorSpace.matrix] : 1;
			videoFullRangeFlag = colorSpace?.fullRange ? 1 : 0;
		}
		let string = `av01.${profile}.${level}${tier}.${bitDepth}`;
		string += `.${monochrome}.${chromaSubsampling.toString().padStart(3, "0")}`;
		string += `.${colorPrimaries.toString().padStart(2, "0")}`;
		string += `.${transferCharacteristics.toString().padStart(2, "0")}`;
		string += `.${matrixCoefficients.toString().padStart(2, "0")}`;
		string += `.${videoFullRangeFlag}`;
		if (string.endsWith(AV1_DEFAULT_SUFFIX)) string = string.slice(0, -17);
		return string;
	} else if (codec === "prores") return proresFormat ?? "apch";
	else if (codec !== null) assertNever(codec);
	throw new TypeError(`Unhandled codec '${codec}'.`);
};
var buildAudioCodecString = (codec, numberOfChannels, sampleRate) => {
	if (codec === "aac") {
		if (numberOfChannels >= 2 && sampleRate <= 24e3) return "mp4a.40.29";
		if (sampleRate <= 24e3) return "mp4a.40.5";
		return "mp4a.40.2";
	} else if (codec === "mp3") return "mp3";
	else if (codec === "opus") return "opus";
	else if (codec === "vorbis") return "vorbis";
	else if (codec === "flac") return "flac";
	else if (codec === "ac3") return "ac-3";
	else if (codec === "eac3") return "ec-3";
	else if (codec === "dts") return "dtsc";
	else if (codec === "truehd") return "mlpa";
	else if (PCM_AUDIO_CODECS.includes(codec)) return codec;
	throw new TypeError(`Unhandled codec '${codec}'.`);
};
var OPUS_SAMPLE_RATE = 48e3;
var OPUS_PRE_ROLL_DURATION = .4;
var PCM_CODEC_REGEX = /^pcm-([usf])(\d+)(be)?$/;
var parsePcmCodec = (codec) => {
	assert(PCM_AUDIO_CODECS.includes(codec));
	if (codec === "ulaw") return {
		dataType: "ulaw",
		sampleSize: 1,
		littleEndian: true,
		silentValue: 255
	};
	else if (codec === "alaw") return {
		dataType: "alaw",
		sampleSize: 1,
		littleEndian: true,
		silentValue: 213
	};
	const match = PCM_CODEC_REGEX.exec(codec);
	assert(match);
	let dataType;
	if (match[1] === "u") dataType = "unsigned";
	else if (match[1] === "s") dataType = "signed";
	else dataType = "float";
	const sampleSize = Number(match[2]) / 8;
	const littleEndian = match[3] !== "be";
	return {
		dataType,
		sampleSize,
		littleEndian,
		silentValue: codec === "pcm-u8" ? 128 : 0
	};
};
var inferCodecFromCodecString = (codecString) => {
	if (codecString.startsWith("avc1") || codecString.startsWith("avc3")) return "avc";
	else if (codecString.startsWith("hev1") || codecString.startsWith("hvc1")) return "hevc";
	else if (codecString === "vp8") return "vp8";
	else if (codecString.startsWith("vp09")) return "vp9";
	else if (codecString.startsWith("av01")) return "av1";
	else if (PRORES_FOURCCS.includes(codecString)) return "prores";
	if (codecString === "mp3" || codecString === "mp4a.69" || codecString === "mp4a.6B" || codecString === "mp4a.6b" || codecString === "mp4a.40.34") return "mp3";
	else if (codecString.startsWith("mp4a.40.") || codecString === "mp4a.67") return "aac";
	else if (codecString === "opus" || codecString === "Opus") return "opus";
	else if (codecString === "vorbis") return "vorbis";
	else if (codecString === "flac") return "flac";
	else if (codecString === "ac-3" || codecString === "ac3") return "ac3";
	else if (codecString === "ec-3" || codecString === "eac3") return "eac3";
	else if (DTS_FOURCCS.includes(codecString)) return "dts";
	else if (codecString === "mlpa") return "truehd";
	else if (codecString === "ulaw") return "ulaw";
	else if (codecString === "alaw") return "alaw";
	else if (PCM_CODEC_REGEX.test(codecString)) return codecString;
	if (codecString === "webvtt") return "webvtt";
	return null;
};
var getVideoEncoderConfigExtension = (codec) => {
	if (codec === "avc") return { avc: { format: "avc" } };
	else if (codec === "hevc") return { hevc: { format: "hevc" } };
	return {};
};
var getAudioEncoderConfigExtension = (codec) => {
	if (codec === "aac") return { aac: { format: "aac" } };
	else if (codec === "opus") return { opus: { format: "opus" } };
	return {};
};
var VALID_VIDEO_CODEC_STRING_PREFIXES = [
	"avc1",
	"avc3",
	"hev1",
	"hvc1",
	"vp8",
	"vp09",
	"av01",
	...PRORES_FOURCCS
];
var AVC_CODEC_STRING_REGEX = /^(avc1|avc3)\.[0-9a-fA-F]{6}$/;
var HEVC_CODEC_STRING_REGEX = /^(hev1|hvc1)\.(?:[ABC]?\d+)\.[0-9a-fA-F]{1,8}\.[LH]\d+(?:\.[0-9a-fA-F]{1,2}){0,6}$/;
var VP9_CODEC_STRING_REGEX = /^vp09(?:\.\d{2}){3}(?:(?:\.\d{2}){5})?$/;
var AV1_CODEC_STRING_REGEX = /^av01\.\d\.\d{2}[MH]\.\d{2}(?:\.\d\.\d{3}\.\d{2}\.\d{2}\.\d{2}\.\d)?$/;
var validateVideoChunkMetadata = (metadata, trackCodec) => {
	if (!metadata) throw new TypeError("Video chunk metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Video chunk metadata must be an object.");
	if (!metadata.decoderConfig) throw new TypeError("Video chunk metadata must include a decoder configuration.");
	if (typeof metadata.decoderConfig !== "object") throw new TypeError("Video chunk metadata decoder configuration must be an object.");
	if (typeof metadata.decoderConfig.codec !== "string") throw new TypeError("Video chunk metadata decoder configuration must specify a codec string.");
	if (!VALID_VIDEO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) throw new TypeError("Video chunk metadata decoder configuration codec string must be a valid video codec string as specified in the Mediabunny Codec Registry.");
	if (!Number.isInteger(metadata.decoderConfig.codedWidth) || metadata.decoderConfig.codedWidth <= 0) throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedWidth (positive integer).");
	if (!Number.isInteger(metadata.decoderConfig.codedHeight) || metadata.decoderConfig.codedHeight <= 0) throw new TypeError("Video chunk metadata decoder configuration must specify a valid codedHeight (positive integer).");
	if (metadata.decoderConfig.displayAspectWidth !== void 0 && (!Number.isInteger(metadata.decoderConfig.displayAspectWidth) || metadata.decoderConfig.displayAspectWidth <= 0)) throw new TypeError("Video chunk metadata decoder configuration displayAspectWidth, when defined, must be a positive integer.");
	if (metadata.decoderConfig.displayAspectHeight !== void 0 && (!Number.isInteger(metadata.decoderConfig.displayAspectHeight) || metadata.decoderConfig.displayAspectHeight <= 0)) throw new TypeError("Video chunk metadata decoder configuration displayAspectHeight, when defined, must be a positive integer.");
	if (metadata.decoderConfig.displayAspectWidth !== void 0 !== (metadata.decoderConfig.displayAspectHeight !== void 0)) throw new TypeError("Video chunk metadata decoder configuration must specify both displayAspectWidth and displayAspectHeight, or neither.");
	if (metadata.decoderConfig.description !== void 0) {
		if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) throw new TypeError("Video chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an ArrayBuffer view.");
	}
	if (metadata.decoderConfig.colorSpace !== void 0) {
		const { colorSpace } = metadata.decoderConfig;
		if (typeof colorSpace !== "object") throw new TypeError("Video chunk metadata decoder configuration colorSpace, when provided, must be an object.");
		const primariesValues = Object.keys(COLOR_PRIMARIES_MAP);
		if (colorSpace.primaries != null && !primariesValues.includes(colorSpace.primaries)) throw new TypeError(`Video chunk metadata decoder configuration colorSpace primaries, when defined, must be one of ${primariesValues.join(", ")}.`);
		const transferValues = Object.keys(TRANSFER_CHARACTERISTICS_MAP);
		if (colorSpace.transfer != null && !transferValues.includes(colorSpace.transfer)) throw new TypeError(`Video chunk metadata decoder configuration colorSpace transfer, when defined, must be one of ${transferValues.join(", ")}.`);
		const matrixValues = Object.keys(MATRIX_COEFFICIENTS_MAP);
		if (colorSpace.matrix != null && !matrixValues.includes(colorSpace.matrix)) throw new TypeError(`Video chunk metadata decoder configuration colorSpace matrix, when defined, must be one of ${matrixValues.join(", ")}.`);
		if (colorSpace.fullRange != null && typeof colorSpace.fullRange !== "boolean") throw new TypeError("Video chunk metadata decoder configuration colorSpace fullRange, when defined, must be a boolean.");
	}
	if (metadata.decoderConfig.codec.startsWith("avc1") || metadata.decoderConfig.codec.startsWith("avc3")) {
		if (!AVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for AVC must be a valid AVC codec string as specified in Section 3.4 of RFC 6381.");
	} else if (metadata.decoderConfig.codec.startsWith("hev1") || metadata.decoderConfig.codec.startsWith("hvc1")) {
		if (!HEVC_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for HEVC must be a valid HEVC codec string as specified in Section E.3 of ISO 14496-15.");
	} else if (metadata.decoderConfig.codec.startsWith("vp8")) {
		if (metadata.decoderConfig.codec !== "vp8") throw new TypeError("Video chunk metadata decoder configuration codec string for VP8 must be \"vp8\".");
	} else if (metadata.decoderConfig.codec.startsWith("vp09")) {
		if (!VP9_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for VP9 must be a valid VP9 codec string as specified in Section \"Codecs Parameter String\" of https://www.webmproject.org/vp9/mp4/.");
	} else if (metadata.decoderConfig.codec.startsWith("av01")) {
		if (!AV1_CODEC_STRING_REGEX.test(metadata.decoderConfig.codec)) throw new TypeError("Video chunk metadata decoder configuration codec string for AV1 must be a valid AV1 codec string as specified in Section \"Codecs Parameter String\" of https://aomediacodec.github.io/av1-isobmff/.");
	} else if (PRORES_FOURCCS.some((x) => metadata.decoderConfig.codec.startsWith(x))) {
		if (!PRORES_FOURCCS.some((x) => metadata.decoderConfig.codec === x)) throw new TypeError(`Video chunk metadata decoder configuration codec string for ProRes must be one of the valid ProRes four-character codes: ${PRORES_FOURCCS.join(", ")}.`);
	}
	if (trackCodec !== null && inferCodecFromCodecString(metadata.decoderConfig.codec) !== trackCodec) throw new TypeError(`Video chunk metadata decoder configuration codec string '${metadata.decoderConfig.codec}' does not fit to the track codec '${trackCodec}'.`);
};
var VALID_AUDIO_CODEC_STRING_PREFIXES = [
	"mp4a",
	"mp3",
	"opus",
	"vorbis",
	"flac",
	"ulaw",
	"alaw",
	"pcm",
	"ac-3",
	"ec-3",
	"dts",
	"mlpa"
];
var validateAudioChunkMetadata = (metadata, trackCodec) => {
	if (!metadata) throw new TypeError("Audio chunk metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Audio chunk metadata must be an object.");
	if (!metadata.decoderConfig) throw new TypeError("Audio chunk metadata must include a decoder configuration.");
	if (typeof metadata.decoderConfig !== "object") throw new TypeError("Audio chunk metadata decoder configuration must be an object.");
	if (typeof metadata.decoderConfig.codec !== "string") throw new TypeError("Audio chunk metadata decoder configuration must specify a codec string.");
	if (!VALID_AUDIO_CODEC_STRING_PREFIXES.some((prefix) => metadata.decoderConfig.codec.startsWith(prefix))) throw new TypeError("Audio chunk metadata decoder configuration codec string must be a valid audio codec string as specified in the Mediabunny Codec Registry.");
	if (!Number.isInteger(metadata.decoderConfig.sampleRate) || metadata.decoderConfig.sampleRate <= 0) throw new TypeError("Audio chunk metadata decoder configuration must specify a valid sampleRate (positive integer).");
	if (!Number.isInteger(metadata.decoderConfig.numberOfChannels) || metadata.decoderConfig.numberOfChannels <= 0) throw new TypeError("Audio chunk metadata decoder configuration must specify a valid numberOfChannels (positive integer).");
	if (metadata.decoderConfig.description !== void 0) {
		if (!isAllowSharedBufferSource(metadata.decoderConfig.description)) throw new TypeError("Audio chunk metadata decoder configuration description, when defined, must be an ArrayBuffer or an ArrayBuffer view.");
	}
	if (metadata.decoderConfig.codec.startsWith("mp4a") && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") {
		if (![
			"mp4a.40.2",
			"mp4a.40.02",
			"mp4a.40.5",
			"mp4a.40.05",
			"mp4a.40.29",
			"mp4a.67"
		].includes(metadata.decoderConfig.codec)) throw new TypeError("Audio chunk metadata decoder configuration codec string for AAC must be a valid AAC codec string as specified in https://www.w3.org/TR/webcodecs-aac-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("mp3") || metadata.decoderConfig.codec.startsWith("mp4a")) {
		if (metadata.decoderConfig.codec !== "mp3" && metadata.decoderConfig.codec !== "mp4a.69" && metadata.decoderConfig.codec !== "mp4a.6B" && metadata.decoderConfig.codec !== "mp4a.6b") throw new TypeError("Audio chunk metadata decoder configuration codec string for MP3 must be \"mp3\", \"mp4a.69\" or \"mp4a.6B\".");
	} else if (metadata.decoderConfig.codec.startsWith("opus")) {
		if (metadata.decoderConfig.codec !== "opus") throw new TypeError("Audio chunk metadata decoder configuration codec string for Opus must be \"opus\".");
		if (metadata.decoderConfig.description && metadata.decoderConfig.description.byteLength < 18) throw new TypeError("Audio chunk metadata decoder configuration description, when specified, is expected to be an Identification Header as specified in Section 5.1 of RFC 7845.");
	} else if (metadata.decoderConfig.codec.startsWith("vorbis")) {
		if (metadata.decoderConfig.codec !== "vorbis") throw new TypeError("Audio chunk metadata decoder configuration codec string for Vorbis must be \"vorbis\".");
		if (!metadata.decoderConfig.description) throw new TypeError("Audio chunk metadata decoder configuration for Vorbis must include a description, which is expected to adhere to the format described in https://www.w3.org/TR/webcodecs-vorbis-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("flac")) {
		if (metadata.decoderConfig.codec !== "flac") throw new TypeError("Audio chunk metadata decoder configuration codec string for FLAC must be \"flac\".");
		if (!metadata.decoderConfig.description || metadata.decoderConfig.description.byteLength < 42) throw new TypeError("Audio chunk metadata decoder configuration for FLAC must include a description, which is expected to adhere to the format described in https://www.w3.org/TR/webcodecs-flac-codec-registration/.");
	} else if (metadata.decoderConfig.codec.startsWith("ac-3") || metadata.decoderConfig.codec.startsWith("ac3")) {
		if (metadata.decoderConfig.codec !== "ac-3") throw new TypeError("Audio chunk metadata decoder configuration codec string for AC-3 must be \"ac-3\".");
	} else if (metadata.decoderConfig.codec.startsWith("ec-3") || metadata.decoderConfig.codec.startsWith("eac3")) {
		if (metadata.decoderConfig.codec !== "ec-3") throw new TypeError("Audio chunk metadata decoder configuration codec string for EC-3 must be \"ec-3\".");
	} else if (metadata.decoderConfig.codec.startsWith("dts")) {
		if (!DTS_FOURCCS.includes(metadata.decoderConfig.codec)) throw new TypeError(`Audio chunk metadata decoder configuration codec string for DTS must be one of the following four-character codes: ${DTS_FOURCCS.join(", ")}.`);
	} else if (metadata.decoderConfig.codec.startsWith("mlpa")) {
		if (metadata.decoderConfig.codec !== "mlpa") throw new TypeError("Audio chunk metadata decoder configuration codec string for TrueHD must be \"mlpa\".");
	} else if (metadata.decoderConfig.codec.startsWith("pcm") || metadata.decoderConfig.codec.startsWith("ulaw") || metadata.decoderConfig.codec.startsWith("alaw")) {
		if (!PCM_AUDIO_CODECS.includes(metadata.decoderConfig.codec)) throw new TypeError(`Audio chunk metadata decoder configuration codec string for PCM must be one of the supported PCM codecs (${PCM_AUDIO_CODECS.join(", ")}).`);
	}
	if (trackCodec !== null && inferCodecFromCodecString(metadata.decoderConfig.codec) !== trackCodec) throw new TypeError(`Audio chunk metadata decoder configuration codec string '${metadata.decoderConfig.codec}' does not fit to the track codec '${trackCodec}'.`);
};
var validateSubtitleMetadata = (metadata) => {
	if (!metadata) throw new TypeError("Subtitle metadata must be provided.");
	if (typeof metadata !== "object") throw new TypeError("Subtitle metadata must be an object.");
	if (!metadata.config) throw new TypeError("Subtitle metadata must include a config object.");
	if (typeof metadata.config !== "object") throw new TypeError("Subtitle metadata config must be an object.");
	if (typeof metadata.config.description !== "string") throw new TypeError("Subtitle metadata config description must be a string.");
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Muxer = class {
	constructor(output) {
		this.mutex = new AsyncMutex();
		this.trackPacketOrderValidators = /* @__PURE__ */ new WeakMap();
		this.output = output;
	}
	onTrackClose(track) {}
	validateTimestamp(track, timestampInSeconds, isKeyPacket) {
		let validator = this.trackPacketOrderValidators.get(track);
		if (!validator) {
			validator = new PacketOrderValidator();
			this.trackPacketOrderValidators.set(track, validator);
		}
		const type = isKeyPacket ? "key" : "delta";
		if (validator.digest(timestampInSeconds, type)) return;
		if (validator.maxTimestamp === null) throw new Error("First packet must be a key packet.");
		const largestTimestamp = type === "key" ? validator.maxTimestamp : validator.maxTimestampBeforeLastKeyPacket;
		throw new Error(`Timestamps cannot be smaller than the largest timestamp of the previous GOP (a GOP begins with a key packet and ends right before the next key packet). Got ${timestampInSeconds}s, but largest timestamp is ${largestTimestamp}s.`);
	}
};
var PacketOrderValidator = class {
	constructor() {
		this.maxTimestamp = null;
		this.maxTimestampBeforeLastKeyPacket = null;
	}
	check(timestamp, type) {
		if (this.maxTimestamp === null) return type === "key";
		const maxTimestampOfPreviousGop = type === "key" ? this.maxTimestamp : this.maxTimestampBeforeLastKeyPacket;
		return maxTimestampOfPreviousGop === null || timestamp >= maxTimestampOfPreviousGop;
	}
	digest(timestamp, type) {
		if (!this.check(timestamp, type)) return false;
		if (type === "key") this.maxTimestampBeforeLastKeyPacket = this.maxTimestamp;
		this.maxTimestamp = Math.max(this.maxTimestamp ?? -Infinity, timestamp);
		return true;
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/isobmff/isobmff-boxes.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var IsobmffBoxWriter = class {
	constructor(writer) {
		this.writer = writer;
		this.helper = /* @__PURE__ */ new Uint8Array(8);
		this.helperView = new DataView(this.helper.buffer);
		/**
		* Stores the position from the start of the file to where boxes elements have been written. This is used to
		* rewrite/edit elements that were already added before, and to measure sizes of things.
		*/
		this.offsets = /* @__PURE__ */ new WeakMap();
	}
	writeU32(value) {
		this.helperView.setUint32(0, value, false);
		this.writer.write(this.helper.subarray(0, 4));
	}
	writeU64(value) {
		this.helperView.setUint32(0, Math.floor(value / 2 ** 32), false);
		this.helperView.setUint32(4, value, false);
		this.writer.write(this.helper.subarray(0, 8));
	}
	writeAscii(text) {
		for (let i = 0; i < text.length; i++) {
			this.helperView.setUint8(i % 8, text.charCodeAt(i));
			if (i % 8 === 7) this.writer.write(this.helper);
		}
		if (text.length % 8 !== 0) this.writer.write(this.helper.subarray(0, text.length % 8));
	}
	writeBox(box) {
		this.offsets.set(box, this.writer.getPos());
		if (box.contents && !box.children) {
			this.writeBoxHeader(box, box.size ?? box.contents.byteLength + 8);
			this.writer.write(box.contents);
		} else {
			const startPos = this.writer.getPos();
			this.writeBoxHeader(box, 0);
			if (box.contents) this.writer.write(box.contents);
			if (box.children) {
				for (const child of box.children) if (child) this.writeBox(child);
			}
			const endPos = this.writer.getPos();
			const size = box.size ?? endPos - startPos;
			this.writer.seek(startPos);
			this.writeBoxHeader(box, size);
			this.writer.seek(endPos);
		}
	}
	writeBoxHeader(box, size) {
		this.writeU32(box.largeSize ? 1 : size);
		this.writeAscii(box.type);
		if (box.largeSize) this.writeU64(size);
	}
	measureBoxHeader(box) {
		return 8 + (box.largeSize ? 8 : 0);
	}
	patchBox(box) {
		const boxOffset = this.offsets.get(box);
		assert(boxOffset !== void 0);
		const endPos = this.writer.getPos();
		this.writer.seek(boxOffset);
		this.writeBox(box);
		this.writer.seek(endPos);
	}
	measureBox(box) {
		if (box.contents && !box.children) return this.measureBoxHeader(box) + box.contents.byteLength;
		else {
			let result = this.measureBoxHeader(box);
			if (box.contents) result += box.contents.byteLength;
			if (box.children) {
				for (const child of box.children) if (child) result += this.measureBox(child);
			}
			return result;
		}
	}
};
var bytes = /* #__PURE__ */ new Uint8Array(8);
var view = /* #__PURE__ */ new DataView(bytes.buffer);
var u8 = (value) => {
	return [(value % 256 + 256) % 256];
};
var u16 = (value) => {
	view.setUint16(0, value, false);
	return [bytes[0], bytes[1]];
};
var i16 = (value) => {
	view.setInt16(0, value, false);
	return [bytes[0], bytes[1]];
};
var u24 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var u32 = (value) => {
	view.setUint32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var i32 = (value) => {
	view.setInt32(0, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var u64 = (value) => {
	view.setUint32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
var i64 = (value) => {
	view.setInt32(0, Math.floor(value / 2 ** 32), false);
	view.setUint32(4, value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3],
		bytes[4],
		bytes[5],
		bytes[6],
		bytes[7]
	];
};
var fixed_8_8 = (value) => {
	view.setInt16(0, 256 * value, false);
	return [bytes[0], bytes[1]];
};
var fixed_16_16 = (value) => {
	view.setInt32(0, 2 ** 16 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var fixed_2_30 = (value) => {
	view.setInt32(0, 2 ** 30 * value, false);
	return [
		bytes[0],
		bytes[1],
		bytes[2],
		bytes[3]
	];
};
var variableUnsignedInt = (value, byteLength) => {
	const bytes = [];
	let remaining = value;
	do {
		let byte = remaining & 127;
		remaining >>= 7;
		if (bytes.length > 0) byte |= 128;
		bytes.push(byte);
		if (byteLength !== void 0) byteLength--;
	} while (remaining > 0 || byteLength);
	return bytes.reverse();
};
var ascii = (text, nullTerminated = false) => {
	const bytes = Array(text.length).fill(null).map((_, i) => text.charCodeAt(i));
	if (nullTerminated) bytes.push(0);
	return bytes;
};
var matrixToBytes = (matrix) => {
	return [
		fixed_16_16(matrix[0]),
		fixed_16_16(matrix[1]),
		fixed_2_30(matrix[2]),
		fixed_16_16(matrix[3]),
		fixed_16_16(matrix[4]),
		fixed_2_30(matrix[5]),
		fixed_16_16(matrix[6]),
		fixed_16_16(matrix[7]),
		fixed_2_30(matrix[8])
	];
};
var box = (type, contents, children) => ({
	type,
	contents: contents && new Uint8Array(contents.flat(10)),
	children
});
/** A FullBox always starts with a version byte, followed by three flag bytes. */
var fullBox = (type, version, flags, contents, children) => box(type, [
	u8(version),
	u24(flags),
	contents ?? []
], children);
/**
* File Type Compatibility Box: Allows the reader to determine whether this is a type of file that the
* reader understands.
*/
var ftyp = (details) => {
	const minorVersion = 512;
	if (details.isQuickTime) return box("ftyp", [
		ascii("qt  "),
		u32(minorVersion),
		ascii("qt  ")
	]);
	if (details.fragmented) {
		if (details.cmaf) return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41"),
			ascii("cmfc"),
			ascii("dash")
		]);
		else return box("ftyp", [
			ascii("iso5"),
			u32(minorVersion),
			ascii("iso5"),
			ascii("iso6"),
			ascii("mp41")
		]);
	}
	return box("ftyp", [
		ascii("isom"),
		u32(minorVersion),
		ascii("isom"),
		details.holdsAvc ? ascii("avc1") : [],
		ascii("mp41")
	]);
};
/** Segment Type Box */
var styp = () => box("styp", [
	ascii("iso5"),
	u32(0),
	ascii("iso5"),
	ascii("iso6"),
	ascii("mp41"),
	ascii("cmfc"),
	ascii("dash")
]);
/** Segment Index Box */
var sidx = (muxer, referencedSize) => {
	const earliestPresentationTime = Math.max(0, muxer.minWrittenTimestamp);
	let duration = Math.max(0, muxer.maxWrittenEndTimestamp - earliestPresentationTime);
	if (!Number.isFinite(duration)) duration = 0;
	return fullBox("sidx", 1, 0, [
		u32(1),
		u32(GLOBAL_TIMESCALE),
		u64(intoTimescale(earliestPresentationTime, GLOBAL_TIMESCALE)),
		u64(0),
		u16(0),
		u16(1),
		u32(referencedSize & 2147483647),
		u32(intoTimescale(duration, GLOBAL_TIMESCALE)),
		u32(0)
	]);
};
/** Movie Sample Data Box. Contains the actual frames/samples of the media. */
var mdat = (reserveLargeSize) => ({
	type: "mdat",
	largeSize: reserveLargeSize
});
/** Free Space Box: A box that designates unused space in the movie data file. */
var free = (size) => ({
	type: "free",
	size
});
/**
* Movie Box: Used to specify the information that defines a movie - that is, the information that allows
* an application to interpret the sample data that is stored elsewhere.
*/
var moov = (muxer) => {
	return box("moov", void 0, [
		mvhd(muxer.creationTime, muxer.trackDatas),
		...muxer.trackDatas.map((x) => trak(x, muxer.creationTime)),
		muxer.isFragmented ? mvex(muxer.trackDatas) : null,
		udta(muxer)
	]);
};
/** Movie Header Box: Used to specify the characteristics of the entire movie, such as timescale and duration. */
var mvhd = (creationTime, trackDatas) => {
	const duration = Math.max(0, ...trackDatas.map((trackData) => Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE))));
	const nextTrackId = Math.max(0, ...trackDatas.map((x) => x.track.id)) + 1;
	const needsU64 = !isU32(creationTime) || !isU32(duration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mvhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(GLOBAL_TIMESCALE),
		u32OrU64(duration),
		fixed_16_16(1),
		fixed_8_8(1),
		Array(10).fill(0),
		matrixToBytes(IDENTITY_MATRIX),
		Array(24).fill(0),
		u32(nextTrackId)
	]);
};
/**
* Track Box: Defines a single track of a movie. A movie may consist of one or more tracks. Each track is
* independent of the other tracks in the movie and carries its own temporal and spatial information. Each Track Box
* contains its associated Media Box.
*/
var trak = (trackData, creationTime) => {
	const trackMetadata = getTrackMetadata(trackData);
	const needsEditList = trackData.startTimestampOffset !== null && trackData.startTimestampOffset !== 0;
	return box("trak", void 0, [
		tkhd(trackData, creationTime),
		needsEditList ? edts(trackData) : null,
		mdia(trackData, creationTime),
		trackMetadata.name !== void 0 ? box("udta", void 0, [box("name", [...textEncoder.encode(trackMetadata.name)])]) : null
	]);
};
/** Track Header Box: Specifies the characteristics of a single track within a movie. */
var tkhd = (trackData, creationTime) => {
	const durationInGlobalTimescale = Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(trackData.startTimestampOffset ?? 0, GLOBAL_TIMESCALE));
	const needsU64 = !isU32(creationTime) || !isU32(durationInGlobalTimescale);
	const u32OrU64 = needsU64 ? u64 : u32;
	let matrix;
	if (trackData.type === "video" && trackData.track.metadata.transformationMatrix) matrix = trackData.track.metadata.transformationMatrix;
	else if (trackData.type === "video") {
		const { rotation, flip } = trackData.track.metadata;
		matrix = centeredTransformationMatrix(multiplyMatrices(rotationMatrix(rotation ?? 0), scaleMatrix(flip ? -1 : 1, 1)), trackData.info.width, trackData.info.height);
	} else matrix = IDENTITY_MATRIX;
	let flags = 2;
	if (trackData.track.metadata.disposition?.default !== false) flags |= 1;
	const alternateGroup = trackData.type === "video" ? 0 : trackData.type === "audio" ? 1 : trackData.type === "subtitle" ? 2 : assertNever(trackData);
	return fullBox("tkhd", +needsU64, flags, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.track.id),
		u32(0),
		u32OrU64(durationInGlobalTimescale),
		Array(8).fill(0),
		u16(0),
		u16(alternateGroup),
		fixed_8_8(trackData.type === "audio" ? 1 : 0),
		u16(0),
		matrixToBytes(matrix),
		fixed_16_16(trackData.type === "video" ? trackData.info.width : 0),
		fixed_16_16(trackData.type === "video" ? trackData.info.height : 0)
	]);
};
/** Edit Box: Specifies edits to the track's media. */
var edts = (trackData) => {
	const offset = trackData.startTimestampOffset;
	assert(offset !== null);
	if (offset > 0) {
		const startOffset = intoTimescale(offset, GLOBAL_TIMESCALE);
		const mediaDuration = intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE);
		const needs64Bits = !isU32(startOffset) || !isU32(mediaDuration);
		const u32OrU64 = needs64Bits ? u64 : u32;
		const i32OrI64 = needs64Bits ? i64 : i32;
		return box("edts", void 0, [fullBox("elst", needs64Bits ? 1 : 0, 0, [
			u32(2),
			u32OrU64(startOffset),
			i32OrI64(-1),
			fixed_16_16(1),
			u32OrU64(mediaDuration),
			i32OrI64(0),
			fixed_16_16(1)
		])]);
	} else {
		const mediaTime = intoTimescale(-offset, trackData.timescale);
		const mediaDuration = Math.max(0, intoTimescale(presentationSpan(trackData), GLOBAL_TIMESCALE) + intoTimescale(offset, GLOBAL_TIMESCALE));
		const needs64Bits = !isI32(mediaTime) || !isU32(mediaDuration);
		const u32OrU64 = needs64Bits ? u64 : u32;
		const i32OrI64 = needs64Bits ? i64 : i32;
		return box("edts", void 0, [fullBox("elst", needs64Bits ? 1 : 0, 0, [
			u32(1),
			u32OrU64(mediaDuration),
			i32OrI64(mediaTime),
			fixed_16_16(1)
		])]);
	}
};
/** Media Box: Describes and define a track's media type and sample data. */
var mdia = (trackData, creationTime) => box("mdia", void 0, [
	mdhd(trackData, creationTime),
	hdlr(true, TRACK_TYPE_TO_COMPONENT_SUBTYPE[trackData.type], TRACK_TYPE_TO_HANDLER_NAME[trackData.type]),
	minf(trackData)
]);
/** Media Header Box: Specifies the characteristics of a media, including timescale and duration. */
var mdhd = (trackData, creationTime) => {
	const localDuration = intoTimescale(presentationSpan(trackData), trackData.timescale);
	const needsU64 = !isU32(creationTime) || !isU32(localDuration);
	const u32OrU64 = needsU64 ? u64 : u32;
	return fullBox("mdhd", +needsU64, 0, [
		u32OrU64(creationTime),
		u32OrU64(creationTime),
		u32(trackData.timescale),
		u32OrU64(localDuration),
		u16(getLanguageCodeInt(trackData.track.metadata.languageCode ?? "und")),
		u16(0)
	]);
};
var TRACK_TYPE_TO_COMPONENT_SUBTYPE = {
	video: "vide",
	audio: "soun",
	subtitle: "text"
};
var TRACK_TYPE_TO_HANDLER_NAME = {
	video: "MediabunnyVideoHandler",
	audio: "MediabunnySoundHandler",
	subtitle: "MediabunnyTextHandler"
};
/** Handler Reference Box. */
var hdlr = (hasComponentType, handlerType, name, manufacturer = "\0\0\0\0") => fullBox("hdlr", 0, 0, [
	hasComponentType ? ascii("mhlr") : u32(0),
	ascii(handlerType),
	ascii(manufacturer),
	u32(0),
	u32(0),
	ascii(name, true)
]);
/**
* Media Information Box: Stores handler-specific information for a track's media data. The media handler uses this
* information to map from media time to media data and to process the media data.
*/
var minf = (trackData) => box("minf", void 0, [
	TRACK_TYPE_TO_HEADER_BOX[trackData.type](),
	dinf(),
	stbl(trackData)
]);
/** Video Media Information Header Box: Defines specific color and graphics mode information. */
var vmhd = () => fullBox("vmhd", 0, 1, [
	u16(0),
	u16(0),
	u16(0),
	u16(0)
]);
/** Sound Media Information Header Box: Stores the sound media's control information, such as balance. */
var smhd = () => fullBox("smhd", 0, 0, [u16(0), u16(0)]);
/** Null Media Header Box. */
var nmhd = () => fullBox("nmhd", 0, 0);
var TRACK_TYPE_TO_HEADER_BOX = {
	video: vmhd,
	audio: smhd,
	subtitle: nmhd
};
/**
* Data Information Box: Contains information specifying the data handler component that provides access to the
* media data. The data handler component uses the Data Information Box to interpret the media's data.
*/
var dinf = () => box("dinf", void 0, [dref()]);
/**
* Data Reference Box: Contains tabular data that instructs the data handler component how to access the media's data.
*/
var dref = () => fullBox("dref", 0, 0, [u32(1)], [url()]);
var url = () => fullBox("url ", 0, 1);
/**
* Sample Table Box: Contains information for converting from media time to sample number to sample location. This box
* also indicates how to interpret the sample (for example, whether to decompress the video data and, if so, how).
*/
var stbl = (trackData) => {
	const needsCtts = trackData.compositionTimeOffsetTable.length > 1 || trackData.compositionTimeOffsetTable.some((x) => x.sampleCompositionTimeOffset !== 0);
	return box("stbl", void 0, [
		stsd(trackData),
		stts(trackData),
		needsCtts ? ctts(trackData) : null,
		needsCtts ? cslg(trackData) : null,
		stsc(trackData),
		stsz(trackData),
		stco(trackData),
		stss(trackData),
		...sgpdAndSbgp(trackData.samples, false)
	]);
};
/**
* Sample Description Box: Stores information that allows you to decode samples in the media. The data stored in the
* sample description varies, depending on the media type.
*/
var stsd = (trackData) => {
	let sampleDescription;
	if (trackData.type === "video") sampleDescription = videoSampleDescription(videoCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec), trackData);
	else if (trackData.type === "audio") {
		const boxName = audioCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec, trackData.muxer.isQuickTime);
		assert(boxName);
		sampleDescription = soundSampleDescription(boxName, trackData);
	} else if (trackData.type === "subtitle") sampleDescription = subtitleSampleDescription(SUBTITLE_CODEC_TO_BOX_NAME[trackData.track.source._codec], trackData);
	assert(sampleDescription);
	return fullBox("stsd", 0, 0, [u32(1)], [sampleDescription]);
};
/** Video Sample Description Box: Contains information that defines how to interpret video media data. */
var videoSampleDescription = (compressionType, trackData) => box(compressionType, [
	Array(6).fill(0),
	u16(1),
	u16(0),
	u16(0),
	Array(12).fill(0),
	u16(trackData.info.width),
	u16(trackData.info.height),
	u32(4718592),
	u32(4718592),
	u32(0),
	u16(1),
	u8(VERSIONED_NAME.length),
	ascii(VERSIONED_NAME),
	Array(31 - VERSIONED_NAME.length).fill(0),
	u16(trackData.info.hasAlphaChannel ? 32 : 24),
	i16(65535)
], [
	VIDEO_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec]?.(trackData) ?? null,
	pasp(trackData),
	colorSpaceIsEmpty(trackData.info.decoderConfig.colorSpace) ? null : colr(trackData),
	btrt(trackData)
]);
/** Bit Rate Box: Signals the average and peak bitrate of the track. */
var btrt = (trackData) => {
	if (trackData.avgBitrate === 0 && trackData.maxBitrate === 0) return null;
	return box("btrt", [
		u32(0),
		u32(trackData.maxBitrate),
		u32(trackData.avgBitrate)
	]);
};
/** Pixel Aspect Ratio Box: Specifies pixel width:height spacing for non-square pixels. */
var pasp = (trackData) => {
	if (trackData.info.pixelAspectRatio.num === trackData.info.pixelAspectRatio.den) return null;
	return box("pasp", [u32(trackData.info.pixelAspectRatio.num), u32(trackData.info.pixelAspectRatio.den)]);
};
/** Colour Information Box: Specifies the color space of the video. */
var colr = (trackData) => {
	const colorSpace = trackData.info.decoderConfig.colorSpace;
	return box("colr", [
		ascii(trackData.muxer.isQuickTime ? "nclc" : "nclx"),
		u16(colorSpace?.primaries != null ? COLOR_PRIMARIES_MAP[colorSpace.primaries] : 2),
		u16(colorSpace?.transfer != null ? TRANSFER_CHARACTERISTICS_MAP[colorSpace.transfer] : 2),
		u16(colorSpace?.matrix != null ? MATRIX_COEFFICIENTS_MAP[colorSpace.matrix] : 2),
		trackData.muxer.isQuickTime ? [] : u8((colorSpace?.fullRange ? 1 : 0) << 7)
	]);
};
/** AVC Configuration Box: Provides additional information to the decoder. */
var avcC = (trackData) => trackData.info.decoderConfig && box("avcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** HEVC Configuration Box: Provides additional information to the decoder. */
var hvcC = (trackData) => trackData.info.decoderConfig && box("hvcC", [...toUint8Array(trackData.info.decoderConfig.description)]);
/** VP Configuration Box: Provides additional information to the decoder. */
var vpcC = (trackData) => {
	if (!trackData.info.decoderConfig) return null;
	const decoderConfig = trackData.info.decoderConfig;
	const parts = decoderConfig.codec.split(".");
	const profile = Number(parts[1]);
	const level = Number(parts[2]);
	const bitDepth = Number(parts[3]);
	const chromaSubsampling = parts[4] ? Number(parts[4]) : 1;
	const videoFullRangeFlag = parts[8] ? Number(parts[8]) : Number(decoderConfig.colorSpace?.fullRange ?? 0);
	const thirdByte = (bitDepth << 4) + (chromaSubsampling << 1) + videoFullRangeFlag;
	const colourPrimaries = parts[5] ? Number(parts[5]) : decoderConfig.colorSpace?.primaries ? COLOR_PRIMARIES_MAP[decoderConfig.colorSpace.primaries] : 1;
	const transferCharacteristics = parts[6] ? Number(parts[6]) : decoderConfig.colorSpace?.transfer ? TRANSFER_CHARACTERISTICS_MAP[decoderConfig.colorSpace.transfer] : 1;
	const matrixCoefficients = parts[7] ? Number(parts[7]) : decoderConfig.colorSpace?.matrix ? MATRIX_COEFFICIENTS_MAP[decoderConfig.colorSpace.matrix] : 1;
	return fullBox("vpcC", 1, 0, [
		u8(profile),
		u8(level),
		u8(thirdByte),
		u8(colourPrimaries),
		u8(transferCharacteristics),
		u8(matrixCoefficients),
		u16(0)
	]);
};
/** AV1 Configuration Box: Provides additional information to the decoder. */
var av1C = (trackData) => {
	return box("av1C", generateAv1CodecConfigurationFromCodecString(trackData.info.decoderConfig.codec));
};
/** Sound Sample Description Box: Contains information that defines how to interpret sound media data. */
var soundSampleDescription = (compressionType, trackData) => {
	let version = 0;
	let contents;
	let sampleSizeInBits = 16;
	const isPcmCodec = PCM_AUDIO_CODECS.includes(trackData.track.source._codec);
	if (isPcmCodec) {
		const codec = trackData.track.source._codec;
		const { sampleSize } = parsePcmCodec(codec);
		sampleSizeInBits = 8 * sampleSize;
		if (sampleSizeInBits > 16) version = 1;
	}
	if (trackData.muxer.isQuickTime && trackData.track.source._codec !== "truehd") version = 1;
	if (version === 0) contents = [
		Array(6).fill(0),
		u16(1),
		u16(version),
		u16(0),
		u32(0),
		u16(trackData.info.numberOfChannels),
		u16(sampleSizeInBits),
		u16(0),
		u16(0),
		trackData.track.source._codec === "truehd" ? u32(trackData.info.sampleRate) : [u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0), u16(0)]
	];
	else {
		const compressionId = isPcmCodec ? 0 : -2;
		contents = [
			Array(6).fill(0),
			u16(1),
			u16(version),
			u16(0),
			u32(0),
			u16(trackData.info.numberOfChannels),
			u16(Math.min(sampleSizeInBits, 16)),
			i16(compressionId),
			u16(0),
			u16(trackData.info.sampleRate < 2 ** 16 ? trackData.info.sampleRate : 0),
			u16(0),
			isPcmCodec ? [
				u32(1),
				u32(sampleSizeInBits / 8),
				u32(trackData.info.numberOfChannels * sampleSizeInBits / 8)
			] : [
				u32(0),
				u32(0),
				u32(0)
			],
			u32(2)
		];
	}
	return box(compressionType, contents, [audioCodecToConfigurationBox(trackData.track.source._codec, trackData.muxer.isQuickTime)?.(trackData) ?? null, btrt(trackData)]);
};
/** MPEG-4 Elementary Stream Descriptor Box. */
var esds = (trackData) => {
	let objectTypeIndication;
	switch (trackData.track.source._codec) {
		case "aac":
			objectTypeIndication = 64;
			break;
		case "mp3":
			objectTypeIndication = 107;
			break;
		case "vorbis":
			objectTypeIndication = 221;
			break;
		default: throw new Error(`Unhandled audio codec: ${trackData.track.source._codec}`);
	}
	let bytes = [
		...u8(objectTypeIndication),
		...u8(21),
		...u24(0),
		...u32(trackData.maxBitrate),
		...u32(trackData.avgBitrate)
	];
	if (trackData.info.decoderConfig.description) {
		const description = toUint8Array(trackData.info.decoderConfig.description);
		bytes = [
			...bytes,
			...u8(5),
			...variableUnsignedInt(description.byteLength),
			...description
		];
	}
	bytes = [
		...u16(1),
		...u8(0),
		...u8(4),
		...variableUnsignedInt(bytes.length),
		...bytes,
		...u8(6),
		...u8(1),
		...u8(2)
	];
	bytes = [
		...u8(3),
		...variableUnsignedInt(bytes.length),
		...bytes
	];
	return fullBox("esds", 0, 0, bytes);
};
var wave = (trackData) => {
	return box("wave", void 0, [
		frma(trackData),
		enda(trackData),
		box("\0\0\0\0")
	]);
};
var frma = (trackData) => {
	return box("frma", [ascii(audioCodecToBoxName(trackData.track.source._codec, trackData.info.decoderConfig.codec, trackData.muxer.isQuickTime))]);
};
var enda = (trackData) => {
	const { littleEndian } = parsePcmCodec(trackData.track.source._codec);
	return box("enda", [u16(+littleEndian)]);
};
/** Opus Specific Box. */
var dOps = (trackData) => {
	let outputChannelCount = trackData.info.numberOfChannels;
	let preSkip = 312;
	let inputSampleRate = trackData.info.sampleRate;
	let outputGain = 0;
	let channelMappingFamily = 0;
	let channelMappingTable = /* @__PURE__ */ new Uint8Array(0);
	const description = trackData.info.decoderConfig?.description;
	if (description) {
		assert(description.byteLength >= 18);
		const header = parseOpusIdentificationHeader(toUint8Array(description));
		outputChannelCount = header.outputChannelCount;
		preSkip = header.preSkip;
		inputSampleRate = header.inputSampleRate;
		outputGain = header.outputGain;
		channelMappingFamily = header.channelMappingFamily;
		if (header.channelMappingTable) channelMappingTable = header.channelMappingTable;
	}
	return box("dOps", [
		u8(0),
		u8(outputChannelCount),
		u16(preSkip),
		u32(inputSampleRate),
		i16(outputGain),
		u8(channelMappingFamily),
		...channelMappingTable
	]);
};
/** FLAC specific box. */
var dfLa = (trackData) => {
	const description = trackData.info.decoderConfig?.description;
	assert(description);
	return fullBox("dfLa", 0, 0, [...toUint8Array(description).subarray(4)]);
};
/** PCM Configuration Box, ISO/IEC 23003-5. */
var pcmC = (trackData) => {
	const { littleEndian, sampleSize } = parsePcmCodec(trackData.track.source._codec);
	return fullBox("pcmC", 0, 0, [u8(+littleEndian), u8(8 * sampleSize)]);
};
/** AC3SpecificBox */
var dac3 = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseAc3SyncFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract AC-3 frame info from the audio packet. Ensure the packets contain valid AC-3 sync frames (as specified in ETSI TS 102 366).");
	const bytes = /* @__PURE__ */ new Uint8Array(3);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(2, frameInfo.fscod);
	bitstream.writeBits(5, frameInfo.bsid);
	bitstream.writeBits(3, frameInfo.bsmod);
	bitstream.writeBits(3, frameInfo.acmod);
	bitstream.writeBits(1, frameInfo.lfeon);
	bitstream.writeBits(5, frameInfo.bitRateCode);
	bitstream.writeBits(5, 0);
	return box("dac3", [...bytes]);
};
/** EC3SpecificBox */
var dec3 = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseEac3SyncFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract E-AC-3 frame info from the audio packet. Ensure the packets contain valid E-AC-3 sync frames (as specified in ETSI TS 102 366).");
	let totalBits = 16;
	for (const sub of frameInfo.substreams) {
		totalBits += 23;
		if (sub.numDepSub > 0) totalBits += 9;
		else totalBits += 1;
	}
	const size = Math.ceil(totalBits / 8);
	const bytes = new Uint8Array(size);
	const bitstream = new Bitstream(bytes);
	bitstream.writeBits(13, frameInfo.dataRate);
	bitstream.writeBits(3, frameInfo.substreams.length - 1);
	for (const sub of frameInfo.substreams) {
		bitstream.writeBits(2, sub.fscod);
		bitstream.writeBits(5, sub.bsid);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(1, 0);
		bitstream.writeBits(3, sub.bsmod);
		bitstream.writeBits(3, sub.acmod);
		bitstream.writeBits(1, sub.lfeon);
		bitstream.writeBits(3, 0);
		bitstream.writeBits(4, sub.numDepSub);
		if (sub.numDepSub > 0) bitstream.writeBits(9, sub.chanLoc);
		else bitstream.writeBits(1, 0);
	}
	return box("dec3", [...bytes]);
};
/** DTSSpecificBox */
var ddts = (trackData) => {
	assert(trackData.info.primingPacket);
	const frameInfo = parseDtsFrame(trackData.info.primingPacket.data);
	if (!frameInfo) throw new Error("Couldn't extract DTS frame info from the audio packet. Ensure the packets contain valid DTS frames as specified in ETSI TS 102 114.");
	return box("ddts", [...buildDtsSpecificBox(frameInfo)]);
};
/** MLPSpecificBox */
var dmlp = (trackData) => {
	assert(trackData.info.primingPacket);
	const data = trackData.info.primingPacket.data;
	if (determineAudioPacketType("truehd", data) !== "key") throw new Error("Couldn't extract TrueHD stream info from the audio packet. Ensure the first packet is an access unit carrying a major sync.");
	const view = toDataView(data);
	const formatInfo = view.getUint32(8);
	const peakDataRate = view.getUint16(18) & 32767;
	return box("dmlp", [
		u32(formatInfo),
		u16(peakDataRate << 1),
		u32(0)
	]);
};
var subtitleSampleDescription = (compressionType, trackData) => box(compressionType, [Array(6).fill(0), u16(1)], [SUBTITLE_CODEC_TO_CONFIGURATION_BOX[trackData.track.source._codec](trackData), btrt(trackData)]);
var vttC = (trackData) => box("vttC", [...textEncoder.encode(trackData.info.config.description)]);
/**
* Time-To-Sample Box: Stores duration information for a media's samples, providing a mapping from a time in a media
* to the corresponding data sample. The table is compact, meaning that consecutive samples with the same time delta
* will be grouped.
*/
var stts = (trackData) => {
	return fullBox("stts", 0, 0, [u32(trackData.timeToSampleTable.length), trackData.timeToSampleTable.map((x) => [u32(x.sampleCount), u32(x.sampleDelta)])]);
};
/** Sync Sample Box: Identifies the key frames in the media, marking the random access points within a stream. */
var stss = (trackData) => {
	if (trackData.samples.every((x) => x.type === "key")) return null;
	const keySamples = [...trackData.samples.entries()].filter(([, sample]) => sample.type === "key");
	return fullBox("stss", 0, 0, [u32(keySamples.length), keySamples.map(([index]) => u32(index + 1))]);
};
/**
* Sample-To-Chunk Box: As samples are added to a media, they are collected into chunks that allow optimized data
* access. A chunk contains one or more samples. Chunks in a media may have different sizes, and the samples within a
* chunk may have different sizes. The Sample-To-Chunk Box stores chunk information for the samples in a media, stored
* in a compactly-coded fashion.
*/
var stsc = (trackData) => {
	return fullBox("stsc", 0, 0, [u32(trackData.compactlyCodedChunkTable.length), trackData.compactlyCodedChunkTable.map((x) => [
		u32(x.firstChunk),
		u32(x.samplesPerChunk),
		u32(1)
	])]);
};
/** Sample Size Box: Specifies the byte size of each sample in the media. */
var stsz = (trackData) => {
	if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
		const { sampleSize } = parsePcmCodec(trackData.track.source._codec);
		return fullBox("stsz", 0, 0, [u32(sampleSize * trackData.info.numberOfChannels), u32(trackData.samples.reduce((acc, x) => acc + intoTimescale(x.duration, trackData.timescale), 0))]);
	}
	return fullBox("stsz", 0, 0, [
		u32(0),
		u32(trackData.samples.length),
		trackData.samples.map((x) => u32(x.size))
	]);
};
/** Chunk Offset Box: Identifies the location of each chunk of data in the media's data stream, relative to the file. */
var stco = (trackData) => {
	if (trackData.finalizedChunks.length > 0 && last(trackData.finalizedChunks).offset >= 2 ** 32) return fullBox("co64", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u64(x.offset))]);
	return fullBox("stco", 0, 0, [u32(trackData.finalizedChunks.length), trackData.finalizedChunks.map((x) => u32(x.offset))]);
};
/**
* Composition Time to Sample Box: Stores composition time offset information (PTS-DTS) for a
* media's samples. The table is compact, meaning that consecutive samples with the same time
* composition time offset will be grouped.
*/
var ctts = (trackData) => {
	return fullBox("ctts", 1, 0, [u32(trackData.compositionTimeOffsetTable.length), trackData.compositionTimeOffsetTable.map((x) => [u32(x.sampleCount), i32(x.sampleCompositionTimeOffset)])]);
};
/**
* Composition to Decode Box: Stores information about the composition and display times of the media samples.
*/
var cslg = (trackData) => {
	assert(trackData.compositionTimeOffsetTable.length > 0);
	if (trackData.samples.length === 0) return null;
	let leastDecodeToDisplayDelta = Infinity;
	let greatestDecodeToDisplayDelta = -Infinity;
	let compositionStartTime = Infinity;
	let compositionEndTime = -Infinity;
	for (let i = 0; i < trackData.compositionTimeOffsetTable.length; i++) {
		const entry = trackData.compositionTimeOffsetTable[i];
		leastDecodeToDisplayDelta = Math.min(leastDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
		greatestDecodeToDisplayDelta = Math.max(greatestDecodeToDisplayDelta, entry.sampleCompositionTimeOffset);
	}
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		compositionStartTime = Math.min(compositionStartTime, intoTimescale(sample.timestamp, trackData.timescale));
		compositionEndTime = Math.max(compositionEndTime, intoTimescale(sample.timestamp + sample.duration, trackData.timescale));
	}
	const compositionToDtsShift = Math.max(-leastDecodeToDisplayDelta, 0);
	if (compositionEndTime >= 2 ** 31) return null;
	return fullBox("cslg", 0, 0, [
		i32(compositionToDtsShift),
		i32(leastDecodeToDisplayDelta),
		i32(greatestDecodeToDisplayDelta),
		i32(compositionStartTime),
		i32(compositionEndTime)
	]);
};
var sgpdAndSbgp = (samples, inTrackFragment) => {
	const entries = [];
	for (const sample of samples) if (entries.length === 0) entries.push({
		sampleCount: 1,
		prerollSamples: sample.prerollSamples
	});
	else {
		const lastEntry = entries[entries.length - 1];
		if (lastEntry.prerollSamples === sample.prerollSamples) lastEntry.sampleCount++;
		else entries.push({
			sampleCount: 1,
			prerollSamples: sample.prerollSamples
		});
	}
	const rollEntries = entries.filter((x) => x.prerollSamples !== 0);
	if (rollEntries.length === 0) return [];
	let nextGroupIndex = inTrackFragment ? 65537 : 1;
	return [fullBox("sgpd", 1, 0, [
		ascii("roll"),
		u32(2),
		u32(rollEntries.length),
		...rollEntries.map((x) => i16(x.prerollSamples))
	]), fullBox("sbgp", 0, 0, [
		ascii("roll"),
		u32(entries.length),
		...entries.map((x) => [u32(x.sampleCount), u32(x.prerollSamples !== 0 ? nextGroupIndex++ : 0)])
	])];
};
/**
* Movie Extends Box: This box signals to readers that the file is fragmented. Contains a single Track Extends Box
* for each track in the movie.
*/
var mvex = (trackDatas) => {
	return box("mvex", void 0, trackDatas.map(trex));
};
/** Track Extends Box: Contains the default values used by the movie fragments. */
var trex = (trackData) => {
	return fullBox("trex", 0, 0, [
		u32(trackData.track.id),
		u32(1),
		u32(0),
		u32(0),
		u32(0)
	]);
};
/**
* Movie Fragment Box: The movie fragments extend the presentation in time. They provide the information that would
* previously have been	in the Movie Box.
*/
var moof = (sequenceNumber, trackDatas) => {
	return box("moof", void 0, [mfhd(sequenceNumber), ...trackDatas.map(traf)]);
};
/** Movie Fragment Header Box: Contains a sequence number as a safety check. */
var mfhd = (sequenceNumber) => {
	return fullBox("mfhd", 0, 0, [u32(sequenceNumber)]);
};
var fragmentSampleFlags = (sample) => {
	let byte1 = 0;
	let byte2 = 0;
	const sampleIsDifferenceSample = sample.type === "delta";
	byte2 |= +sampleIsDifferenceSample;
	if (sampleIsDifferenceSample) byte1 |= 1;
	else byte1 |= 2;
	return byte1 << 24 | byte2 << 16 | 0;
};
/** Track Fragment Box */
var traf = (trackData) => {
	return box("traf", void 0, [
		tfhd(trackData),
		tfdt(trackData),
		trun(trackData),
		...sgpdAndSbgp(trackData.currentChunk.samples, true)
	]);
};
/** Track Fragment Header Box: Provides a reference to the extended track, and flags. */
var tfhd = (trackData) => {
	assert(trackData.currentChunk);
	let tfFlags = 0;
	tfFlags |= 8;
	tfFlags |= 16;
	tfFlags |= 32;
	tfFlags |= 131072;
	const referenceSample = trackData.currentChunk.samples[1] ?? trackData.currentChunk.samples[0];
	const referenceSampleInfo = {
		duration: referenceSample.timescaleUnitsToNextSample,
		size: referenceSample.size,
		flags: fragmentSampleFlags(referenceSample)
	};
	return fullBox("tfhd", 0, tfFlags, [
		u32(trackData.track.id),
		u32(referenceSampleInfo.duration),
		u32(referenceSampleInfo.size),
		u32(referenceSampleInfo.flags)
	]);
};
/**
* Track Fragment Decode Time Box: Provides the absolute decode time of the first sample of the fragment. This is
* useful for performing random access on the media file.
*/
var tfdt = (trackData) => {
	assert(trackData.currentChunk);
	return fullBox("tfdt", 1, 0, [u64(intoTimescale(trackData.currentChunk.startTimestamp, trackData.timescale))]);
};
/** Track Run Box: Specifies a run of contiguous samples for a given track. */
var trun = (trackData) => {
	assert(trackData.currentChunk);
	const allSampleDurations = trackData.currentChunk.samples.map((x) => x.timescaleUnitsToNextSample);
	const allSampleSizes = trackData.currentChunk.samples.map((x) => x.size);
	const allSampleFlags = trackData.currentChunk.samples.map(fragmentSampleFlags);
	const allSampleCompositionTimeOffsets = trackData.currentChunk.samples.map((x) => intoTimescale(x.timestamp - x.decodeTimestamp, trackData.timescale));
	const uniqueSampleDurations = new Set(allSampleDurations);
	const uniqueSampleSizes = new Set(allSampleSizes);
	const uniqueSampleFlags = new Set(allSampleFlags);
	const uniqueSampleCompositionTimeOffsets = new Set(allSampleCompositionTimeOffsets);
	const firstSampleFlagsPresent = uniqueSampleFlags.size === 2 && allSampleFlags[0] !== allSampleFlags[1];
	const sampleDurationPresent = uniqueSampleDurations.size > 1;
	const sampleSizePresent = uniqueSampleSizes.size > 1;
	const sampleFlagsPresent = !firstSampleFlagsPresent && uniqueSampleFlags.size > 1;
	const sampleCompositionTimeOffsetsPresent = uniqueSampleCompositionTimeOffsets.size > 1 || [...uniqueSampleCompositionTimeOffsets].some((x) => x !== 0);
	let flags = 0;
	flags |= 1;
	flags |= 4 * +firstSampleFlagsPresent;
	flags |= 256 * +sampleDurationPresent;
	flags |= 512 * +sampleSizePresent;
	flags |= 1024 * +sampleFlagsPresent;
	flags |= 2048 * +sampleCompositionTimeOffsetsPresent;
	return fullBox("trun", 1, flags, [
		u32(trackData.currentChunk.samples.length),
		u32(trackData.currentChunk.offset - trackData.currentChunk.moofOffset || 0),
		firstSampleFlagsPresent ? u32(allSampleFlags[0]) : [],
		trackData.currentChunk.samples.map((_, i) => [
			sampleDurationPresent ? u32(allSampleDurations[i]) : [],
			sampleSizePresent ? u32(allSampleSizes[i]) : [],
			sampleFlagsPresent ? u32(allSampleFlags[i]) : [],
			sampleCompositionTimeOffsetsPresent ? i32(allSampleCompositionTimeOffsets[i]) : []
		])
	]);
};
/**
* Movie Fragment Random Access Box: For each track, provides pointers to sync samples within the file
* for random access.
*/
var mfra = (trackDatas) => {
	return box("mfra", void 0, [...trackDatas.map(tfra), mfro()]);
};
/** Track Fragment Random Access Box: Provides pointers to sync samples within the file for random access. */
var tfra = (trackData) => {
	const version = 1;
	const entries = [];
	for (const chunk of trackData.finalizedChunks) {
		const sampleIndex = chunk.samples.findIndex((sample) => sample.type === "key");
		if (sampleIndex === -1) continue;
		const sample = chunk.samples[sampleIndex];
		entries.push([
			u64(intoTimescale(sample.timestamp, trackData.timescale)),
			u64(chunk.moofOffset),
			u32(chunk.trafIndex + 1),
			u32(1),
			u32(sampleIndex + 1)
		]);
	}
	return fullBox("tfra", version, 0, [
		u32(trackData.track.id),
		u32(63),
		u32(entries.length),
		entries
	]);
};
/**
* Movie Fragment Random Access Offset Box: Provides the size of the enclosing mfra box. This box can be used by readers
* to quickly locate the mfra box by searching from the end of the file.
*/
var mfro = () => {
	return fullBox("mfro", 0, 0, [u32(0)]);
};
/** VTT Empty Cue Box */
var vtte = () => box("vtte");
/** VTT Cue Box */
var vttc = (payload, timestamp, identifier, settings, sourceId) => box("vttc", void 0, [
	sourceId !== null ? box("vsid", [i32(sourceId)]) : null,
	identifier !== null ? box("iden", [...textEncoder.encode(identifier)]) : null,
	timestamp !== null ? box("ctim", [...textEncoder.encode(formatSubtitleTimestamp(timestamp))]) : null,
	settings !== null ? box("sttg", [...textEncoder.encode(settings)]) : null,
	box("payl", [...textEncoder.encode(payload)])
]);
/** VTT Additional Text Box */
var vtta = (notes) => box("vtta", [...textEncoder.encode(notes)]);
/** User Data Box */
var udta = (muxer) => {
	const boxes = [];
	const metadataFormat = muxer.format._options.metadataFormat ?? "auto";
	const metadataTags = muxer.output._metadataTags;
	if (metadataFormat === "mdir" || metadataFormat === "auto" && !muxer.isQuickTime) {
		const metaBox = metaMdir(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "mdta") {
		const metaBox = metaMdta(metadataTags);
		if (metaBox) boxes.push(metaBox);
	} else if (metadataFormat === "udta" || metadataFormat === "auto" && muxer.isQuickTime) addQuickTimeMetadataTagBoxes(boxes, muxer.output._metadataTags);
	if (boxes.length === 0) return null;
	return box("udta", void 0, boxes);
};
var addQuickTimeMetadataTagBoxes = (boxes, tags) => {
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			boxes.push(metadataTagStringBoxShort("©nam", value));
			break;
		case "description":
			boxes.push(metadataTagStringBoxShort("©des", value));
			break;
		case "artist":
			boxes.push(metadataTagStringBoxShort("©ART", value));
			break;
		case "album":
			boxes.push(metadataTagStringBoxShort("©alb", value));
			break;
		case "albumArtist":
			boxes.push(metadataTagStringBoxShort("albr", value));
			break;
		case "genre":
			boxes.push(metadataTagStringBoxShort("©gen", value));
			break;
		case "date":
			boxes.push(metadataTagStringBoxShort("©day", value.toISOString().slice(0, 10)));
			break;
		case "comment":
			boxes.push(metadataTagStringBoxShort("©cmt", value));
			break;
		case "lyrics":
			boxes.push(metadataTagStringBoxShort("©lyr", value));
			break;
		case "raw": break;
		case "creationTime": break;
		case "discNumber":
		case "discsTotal":
		case "trackNumber":
		case "tracksTotal":
		case "beatsPerMinute":
		case "images": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || key.length !== 4 || boxes.some((x) => x.type === key)) continue;
		if (typeof value === "string") boxes.push(metadataTagStringBoxShort(key, value));
		else if (value instanceof Uint8Array) boxes.push(box(key, Array.from(value)));
	}
};
var metadataTagStringBoxShort = (name, value) => {
	const encoded = textEncoder.encode(value);
	return box(name, [
		u16(encoded.length),
		u16(getLanguageCodeInt("und")),
		Array.from(encoded)
	]);
};
var DATA_BOX_MIME_TYPE_MAP = {
	"image/jpeg": 13,
	"image/png": 14,
	"image/bmp": 27
};
var ILST_UNSAFE_RAW_KEYS = /* @__PURE__ */ new Set([
	"HMMT",
	"loci",
	"chpl"
]);
/**
* Generates key-value metadata for inclusion in the "meta" box.
*/
var generateMetadataPairs = (tags, isMdta) => {
	const pairs = [];
	for (const { key, value } of keyValueIterator(tags)) switch (key) {
		case "title":
			pairs.push({
				key: isMdta ? "title" : "©nam",
				value: dataStringBoxLong(value)
			});
			break;
		case "description":
			pairs.push({
				key: isMdta ? "description" : "©des",
				value: dataStringBoxLong(value)
			});
			break;
		case "artist":
			pairs.push({
				key: isMdta ? "artist" : "©ART",
				value: dataStringBoxLong(value)
			});
			break;
		case "album":
			pairs.push({
				key: isMdta ? "album" : "©alb",
				value: dataStringBoxLong(value)
			});
			break;
		case "albumArtist":
			pairs.push({
				key: isMdta ? "album_artist" : "aART",
				value: dataStringBoxLong(value)
			});
			break;
		case "comment":
			pairs.push({
				key: isMdta ? "comment" : "©cmt",
				value: dataStringBoxLong(value)
			});
			break;
		case "genre":
			pairs.push({
				key: isMdta ? "genre" : "©gen",
				value: dataStringBoxLong(value)
			});
			break;
		case "beatsPerMinute":
			if (!isMdta) pairs.push({
				key: "tmpo",
				value: box("data", [
					u32(21),
					u32(0),
					u16(value)
				])
			});
			break;
		case "lyrics":
			pairs.push({
				key: isMdta ? "lyrics" : "©lyr",
				value: dataStringBoxLong(value)
			});
			break;
		case "date":
			pairs.push({
				key: isMdta ? "date" : "©day",
				value: dataStringBoxLong(value.toISOString().slice(0, 10))
			});
			break;
		case "images":
			for (const image of value) {
				if (image.kind !== "coverFront") continue;
				pairs.push({
					key: "covr",
					value: box("data", [
						u32(DATA_BOX_MIME_TYPE_MAP[image.mimeType] ?? 0),
						u32(0),
						Array.from(image.data)
					])
				});
			}
			break;
		case "trackNumber":
			if (isMdta) {
				const string = tags.tracksTotal !== void 0 ? `${value}/${tags.tracksTotal}` : value.toString();
				pairs.push({
					key: "track",
					value: dataStringBoxLong(string)
				});
			} else pairs.push({
				key: "trkn",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.tracksTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "discNumber":
			if (!isMdta) pairs.push({
				key: "disc",
				value: box("data", [
					u32(0),
					u32(0),
					u16(0),
					u16(value),
					u16(tags.discsTotal ?? 0),
					u16(0)
				])
			});
			break;
		case "tracksTotal":
		case "discsTotal": break;
		case "raw": break;
		case "creationTime": break;
		default: assertNever(key);
	}
	if (tags.raw) for (const key in tags.raw) {
		const value = tags.raw[key];
		if (value == null || !isMdta && (key.length !== 4 || ILST_UNSAFE_RAW_KEYS.has(key)) || pairs.some((x) => x.key === key)) continue;
		if (typeof value === "string") pairs.push({
			key,
			value: dataStringBoxLong(value)
		});
		else if (value instanceof Uint8Array) pairs.push({
			key,
			value: box("data", [
				u32(0),
				u32(0),
				Array.from(value)
			])
		});
		else if (value instanceof RichImageData) pairs.push({
			key,
			value: box("data", [
				u32(DATA_BOX_MIME_TYPE_MAP[value.mimeType] ?? 0),
				u32(0),
				Array.from(value.data)
			])
		});
	}
	return pairs;
};
/** Metadata Box (mdir format) */
var metaMdir = (tags) => {
	const pairs = generateMetadataPairs(tags, false);
	if (pairs.length === 0) return null;
	return fullBox("meta", 0, 0, void 0, [hdlr(false, "mdir", "", "appl"), box("ilst", void 0, pairs.map((pair) => box(pair.key, void 0, [pair.value])))]);
};
/** Metadata Box (mdta format with keys box) */
var metaMdta = (tags) => {
	const pairs = generateMetadataPairs(tags, true);
	if (pairs.length === 0) return null;
	return box("meta", void 0, [
		hdlr(false, "mdta", ""),
		fullBox("keys", 0, 0, [u32(pairs.length)], pairs.map((pair) => box("mdta", [...textEncoder.encode(pair.key)]))),
		box("ilst", void 0, pairs.map((pair, i) => {
			return box(String.fromCharCode(...u32(i + 1)), void 0, [pair.value]);
		}))
	]);
};
var dataStringBoxLong = (value) => {
	return box("data", [
		u32(1),
		u32(0),
		...textEncoder.encode(value)
	]);
};
var videoCodecToBoxName = (codec, fullCodecString) => {
	switch (codec) {
		case "avc": return fullCodecString.startsWith("avc3") ? "avc3" : "avc1";
		case "hevc": return "hvc1";
		case "vp8": return "vp08";
		case "vp9": return "vp09";
		case "av1": return "av01";
		case "prores": return fullCodecString;
	}
};
var VIDEO_CODEC_TO_CONFIGURATION_BOX = {
	avc: avcC,
	hevc: hvcC,
	vp8: vpcC,
	vp9: vpcC,
	av1: av1C,
	prores: null
};
var audioCodecToBoxName = (codec, fullCodecString, isQuickTime) => {
	switch (codec) {
		case "aac": return "mp4a";
		case "mp3": return "mp4a";
		case "opus": return "Opus";
		case "vorbis": return "mp4a";
		case "flac": return "fLaC";
		case "ulaw": return "ulaw";
		case "alaw": return "alaw";
		case "pcm-u8": return "raw ";
		case "pcm-s8": return "sowt";
		case "ac3": return "ac-3";
		case "eac3": return "ec-3";
		case "dts": return fullCodecString;
		case "truehd": return "mlpa";
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s16": return "sowt";
		case "pcm-s16be": return "twos";
		case "pcm-s24": return "in24";
		case "pcm-s24be": return "in24";
		case "pcm-s32": return "in32";
		case "pcm-s32be": return "in32";
		case "pcm-f32": return "fl32";
		case "pcm-f32be": return "fl32";
		case "pcm-f64": return "fl64";
		case "pcm-f64be": return "fl64";
	}
	else switch (codec) {
		case "pcm-s16": return "ipcm";
		case "pcm-s16be": return "ipcm";
		case "pcm-s24": return "ipcm";
		case "pcm-s24be": return "ipcm";
		case "pcm-s32": return "ipcm";
		case "pcm-s32be": return "ipcm";
		case "pcm-f32": return "fpcm";
		case "pcm-f32be": return "fpcm";
		case "pcm-f64": return "fpcm";
		case "pcm-f64be": return "fpcm";
	}
};
var audioCodecToConfigurationBox = (codec, isQuickTime) => {
	switch (codec) {
		case "aac": return esds;
		case "mp3": return esds;
		case "opus": return dOps;
		case "vorbis": return esds;
		case "flac": return dfLa;
		case "ac3": return dac3;
		case "eac3": return dec3;
		case "dts": return ddts;
		case "truehd": return dmlp;
	}
	if (isQuickTime) switch (codec) {
		case "pcm-s24": return wave;
		case "pcm-s24be": return wave;
		case "pcm-s32": return wave;
		case "pcm-s32be": return wave;
		case "pcm-f32": return wave;
		case "pcm-f32be": return wave;
		case "pcm-f64": return wave;
		case "pcm-f64be": return wave;
	}
	else switch (codec) {
		case "pcm-s16": return pcmC;
		case "pcm-s16be": return pcmC;
		case "pcm-s24": return pcmC;
		case "pcm-s24be": return pcmC;
		case "pcm-s32": return pcmC;
		case "pcm-s32be": return pcmC;
		case "pcm-f32": return pcmC;
		case "pcm-f32be": return pcmC;
		case "pcm-f64": return pcmC;
		case "pcm-f64be": return pcmC;
	}
	return null;
};
var SUBTITLE_CODEC_TO_BOX_NAME = { webvtt: "wvtt" };
var SUBTITLE_CODEC_TO_CONFIGURATION_BOX = { webvtt: vttC };
var getLanguageCodeInt = (code) => {
	assert(code.length === 3);
	let language = 0;
	for (let i = 0; i < 3; i++) {
		language <<= 5;
		language += code.charCodeAt(i) - 96;
	}
	return language;
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/writer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var Writer = class {
	constructor(target, isMonotonic) {
		this.finalized = false;
		this.started = false;
		this.pos = 0;
		this.trackedWrites = null;
		this.trackedStart = -1;
		this.trackedEnd = -1;
		if (target._writerAcquired) throw new Error("Can't have multiple Writers for the same Target.");
		this.target = target;
		target._setMonotonicity(isMonotonic);
		target._writerAcquired = true;
	}
	start() {
		assert(!this.started);
		this.target._start();
		this.started = true;
	}
	/** Writes the given data to the target, at the current position. */
	write(data) {
		assert(this.started && !this.finalized);
		this.maybeTrackWrites(data);
		this.target._write(data, this.pos);
		this.pos += data.byteLength;
	}
	/** Sets the current position for future writes to a new one. */
	seek(newPos) {
		this.pos = newPos;
	}
	/** Returns the current position. */
	getPos() {
		return this.pos;
	}
	/** Signals to the writer that it may be time to flush. */
	async flush() {
		assert(this.started && !this.finalized);
		return this.target._flush();
	}
	/** Called after muxing has finished. */
	async finalize() {
		assert(this.started && !this.finalized);
		await this.target._finalize();
		this.finalized = true;
	}
	maybeTrackWrites(data) {
		if (!this.trackedWrites) return;
		let pos = this.getPos();
		if (pos < this.trackedStart) {
			if (pos + data.byteLength <= this.trackedStart) return;
			data = data.subarray(this.trackedStart - pos);
			pos = 0;
		}
		const neededSize = pos + data.byteLength - this.trackedStart;
		let newLength = this.trackedWrites.byteLength;
		while (newLength < neededSize) newLength *= 2;
		if (newLength !== this.trackedWrites.byteLength) {
			const copy = new Uint8Array(newLength);
			copy.set(this.trackedWrites, 0);
			this.trackedWrites = copy;
		}
		this.trackedWrites.set(data, pos - this.trackedStart);
		this.trackedEnd = Math.max(this.trackedEnd, pos + data.byteLength);
	}
	startTrackingWrites() {
		this.trackedWrites = /* @__PURE__ */ new Uint8Array(1024);
		this.trackedStart = this.getPos();
		this.trackedEnd = this.trackedStart;
	}
	stopTrackingWrites() {
		if (!this.trackedWrites) throw new Error("Internal error: Can't get tracked writes since nothing was tracked.");
		const result = {
			data: this.trackedWrites.subarray(0, this.trackedEnd - this.trackedStart),
			start: this.trackedStart,
			end: this.trackedEnd
		};
		this.trackedWrites = null;
		return result;
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/target.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class for targets, specifying where output files are written.
* @group Output targets
* @public
*/
var Target = class extends EventEmitter {
	constructor() {
		super(...arguments);
		/** @internal */
		this._writerAcquired = false;
		/** @internal */
		this._monotonicity = null;
		/**
		* Called each time data is written to the target. Will be called with the byte range into which data was written.
		*
		* Use this callback to track the size of the output file as it grows. But be warned, this function is chatty and
		* gets called *extremely* often.
		*
		* @deprecated Use `target.on('write', ({ start, end }) => ...)` instead.
		*/
		this.onwrite = null;
	}
	/** @internal */
	_setMonotonicity(monotonicity) {
		if (this._monotonicity !== false) this._monotonicity = monotonicity;
	}
	/** @internal */
	_dispatchWrite(start, end) {
		this.onwrite?.(start, end);
		this._emit("write", {
			start,
			end
		});
	}
	/**
	* Returns a new {@link RangedTarget} that writes data to this target using the given offset.
	*
	* Useful for writing a file into a section of a larger file.
	*/
	slice(offset) {
		if (!Number.isInteger(offset) || offset < 0) throw new TypeError("offset must be a non-negative integer.");
		return new RangedTarget(this, offset);
	}
};
var ARRAY_BUFFER_INITIAL_SIZE = 2 ** 16;
var ARRAY_BUFFER_MAX_SIZE = 2 ** 32;
/**
* A target that writes data directly into an ArrayBuffer in memory. Great for performance, but not suitable for very
* large files. The buffer will be available once the output has been finalized.
* @group Output targets
* @public
*/
var BufferTarget = class extends Target {
	/** Creates a new {@link BufferTarget}. The buffer holding the data will be created and managed internally. */
	constructor(options = {}) {
		super();
		/** Stores the final output buffer. Until the output is finalized, this will be `null`. */
		this.buffer = null;
		/** @internal */
		this._maxPos = 0;
		if (!options || typeof options !== "object") throw new TypeError("BufferTarget options, when provided, must be an object.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this._options = options;
		this._supportsResize = "resize" in /* @__PURE__ */ new ArrayBuffer(0);
		if (this._supportsResize) try {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE, { maxByteLength: ARRAY_BUFFER_MAX_SIZE });
		} catch {
			this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
			this._supportsResize = false;
		}
		else this._buffer = new ArrayBuffer(ARRAY_BUFFER_INITIAL_SIZE);
		this._bytes = new Uint8Array(this._buffer);
	}
	/** @internal */
	_ensureSize(size) {
		assert(this._buffer);
		assert(this._bytes);
		let newLength = this._buffer.byteLength;
		while (newLength < size) newLength *= 2;
		if (newLength === this._buffer.byteLength) return;
		if (newLength > ARRAY_BUFFER_MAX_SIZE) throw new Error(`ArrayBuffer exceeded maximum size of ${ARRAY_BUFFER_MAX_SIZE} bytes. Please consider using another target.`);
		if (this._supportsResize) this._buffer.resize(newLength);
		else {
			const newBuffer = new ArrayBuffer(newLength);
			const newBytes = new Uint8Array(newBuffer);
			newBytes.set(this._bytes, 0);
			this._buffer = newBuffer;
			this._bytes = newBytes;
		}
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		assert(this._bytes);
		this._ensureSize(pos + data.byteLength);
		this._bytes.set(data, pos);
		this._maxPos = Math.max(this._maxPos, pos + data.byteLength);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	async _flush() {}
	/** @internal */
	async _finalize() {
		assert(this._buffer);
		if ("transferToFixedLength" in this._buffer) this.buffer = this._buffer.transferToFixedLength(this._maxPos);
		else this.buffer = this._buffer.slice(0, this._maxPos);
		this._buffer = null;
		this._bytes = null;
		if (this._options.onFinalize) await this._options.onFinalize(this.buffer);
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_getSlice(start, end) {
		assert(this._bytes);
		return this._bytes.slice(start, end);
	}
};
/**
* A target that writes to a subrange (defined by an offset) of another, underlying target. Useful for writing a file
* into a section of a larger file.
* @group Output targets
* @public
*/
var RangedTarget = class extends Target {
	/** @internal */
	constructor(baseTarget, offset) {
		super();
		this._baseTarget = baseTarget;
		this._offset = offset;
	}
	/** @internal */
	_start() {}
	/** @internal */
	_write(data, pos) {
		this._baseTarget._write(data, this._offset + pos);
		this._dispatchWrite(pos, pos + data.byteLength);
	}
	/** @internal */
	_flush() {
		return this._baseTarget._flush();
	}
	/** @internal */
	async _finalize() {
		this._emit("finalized");
	}
	/** @internal */
	async _close() {}
	/** @internal */
	_setMonotonicity(monotonicity) {
		super._setMonotonicity(monotonicity);
		this._baseTarget._setMonotonicity(monotonicity);
	}
};
/**
* A special target for writing multi-file media where each file is uniquely identified by a path.
* @group Output targets
* @public
*/
var PathedTarget = class {
	/** Creates a new {@link PathedTarget} from a root path and a callback. */
	constructor(rootPath, getTarget) {
		this.rootPath = rootPath;
		this.getTarget = getTarget;
		if (typeof rootPath !== "string") throw new TypeError("rootPath must be a string.");
		if (typeof getTarget !== "function") throw new TypeError("getTarget must be a function.");
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/isobmff/isobmff-muxer.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
var GLOBAL_TIMESCALE = 57600;
var MIN_CHUNK_DURATION = .5;
var getTrackMetadata = (trackData) => {
	const metadata = {};
	const track = trackData.track;
	if (track.metadata.name !== void 0) metadata.name = track.metadata.name;
	return metadata;
};
var intoTimescale = (timeInSeconds, timescale, round = true) => {
	const value = timeInSeconds * timescale;
	return round ? Math.round(value) : value;
};
var presentationSpan = (trackData) => {
	if (trackData.samples.length === 0) return 0;
	let minTimestamp = Infinity;
	let maxEndTimestamp = -Infinity;
	for (let i = 0; i < trackData.samples.length; i++) {
		const sample = trackData.samples[i];
		if (sample.timestamp < minTimestamp) minTimestamp = sample.timestamp;
		if (sample.timestamp + sample.duration > maxEndTimestamp) maxEndTimestamp = sample.timestamp + sample.duration;
	}
	if (minTimestamp === Infinity) return 0;
	return maxEndTimestamp - minTimestamp;
};
var IsobmffMuxer = class extends Muxer {
	constructor(output, format) {
		super(output);
		this.writer = null;
		this.boxWriter = null;
		this.initWriter = null;
		this.initBoxWriter = null;
		this.auxTarget = new BufferTarget();
		this.auxWriter = new Writer(this.auxTarget, false);
		this.auxBoxWriter = new IsobmffBoxWriter(this.auxWriter);
		this.mdat = null;
		this.ftypSize = null;
		this.trackDatas = [];
		this.allTracksKnown = promiseWithResolvers();
		this.finalizedChunks = [];
		this.wroteFragmentedHeader = false;
		this.nextFragmentNumber = 1;
		this.maxWrittenTimestamp = -Infinity;
		this.minWrittenTimestamp = Infinity;
		this.maxWrittenEndTimestamp = -Infinity;
		this.segmentHeaderSize = null;
		this.format = format;
		this.formatOptions = { ...format._options };
		this.isQuickTime = format instanceof MovOutputFormat;
		this.isCmaf = format instanceof CmafOutputFormat;
		this.minimumFragmentDuration = this.formatOptions.minimumFragmentDuration ?? (format instanceof CmafOutputFormat ? Infinity : 1);
		this.auxWriter.start();
	}
	async start() {
		const release = await this.mutex.acquire();
		const creationDate = this.output._metadataTags.creationTime === void 0 ? /* @__PURE__ */ new Date() : this.output._metadataTags.creationTime;
		this.creationTime = creationDate ? Math.floor(creationDate.getTime() / 1e3) + TIMESTAMP_OFFSET : 0;
		if (creationDate && this.creationTime <= 0) throw new Error("creationTime must be after 1904-01-01T00:00:00Z for MP4/QuickTime files.");
		if (!this.isCmaf) {
			this.writer = await this.output._getRootWriter((target) => this.formatOptions.fastStart !== void 0 ? this.formatOptions.fastStart === "fragmented" : target instanceof BufferTarget);
			this.boxWriter = new IsobmffBoxWriter(this.writer);
			this.fastStart = this.formatOptions.fastStart ?? (this.writer.target instanceof BufferTarget ? "in-memory" : false);
			this.isFragmented = this.fastStart === "fragmented";
		} else {
			this.fastStart = "fragmented";
			this.isFragmented = true;
		}
		if (this.isCmaf) {
			if (!this.output._hasInitTarget()) throw new Error("CMAF outputs require the initTarget field in OutputOptions to be set; the init segment will be written to it.");
			const initWriter = new Writer(await this.output._getInitTarget(), true);
			initWriter.start();
			this.initWriter = initWriter;
			this.initBoxWriter = new IsobmffBoxWriter(initWriter);
		}
		const holdsAvc = this.output.tracks.some((x) => x.isVideoTrack() && x.source._codec === "avc");
		{
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.formatOptions.onFtyp) boxWriter.writer.startTrackingWrites();
			boxWriter.writeBox(ftyp({
				isQuickTime: this.isQuickTime,
				holdsAvc,
				fragmented: this.isFragmented,
				cmaf: this.isCmaf
			}));
			if (this.formatOptions.onFtyp) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.formatOptions.onFtyp(data, start);
			}
			this.ftypSize = boxWriter.writer.getPos();
			if (this.isCmaf) await this.initWriter.flush();
		}
		if (this.fastStart === "in-memory") {} else if (this.fastStart === "reserve") for (const track of this.output.tracks) {
			if (track.metadata.maximumPacketCount === void 0) throw new Error("All tracks must specify maximumPacketCount in their metadata when using fastStart: 'reserve'.");
			if (track.metadata.maximumPacketCount > 2 ** 32 - 1) throw new Error(`Track #${track.id} has a maximumPacketCount of ${track.metadata.maximumPacketCount}, which exceeds the maximum of ${2 ** 32 - 1} packets per track that a non-fragmented file can hold.`);
		}
		else if (this.isFragmented) {} else {
			assert(this.writer);
			assert(this.boxWriter);
			if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
			this.mdat = mdat(true);
			this.boxWriter.writeBox(this.mdat);
		}
		await this.writer?.flush();
		for (const track of this.output.tracks) if (track.isVideoTrack() && track.metadata.decoderConfig) this.getVideoTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		else if (track.isAudioTrack() && track.metadata.decoderConfig) this.getAudioTrackData(track, track.metadata.primingPacket ?? null, { decoderConfig: track.metadata.decoderConfig });
		release();
	}
	allTracksAreKnown() {
		for (const track of this.output.tracks) if (!track.source._closed && !this.trackDatas.some((x) => x.track === track)) return false;
		return true;
	}
	async getMimeType() {
		await this.allTracksKnown.promise;
		const codecStrings = this.trackDatas.map((trackData) => {
			if (trackData.type === "video") return trackData.info.decoderConfig.codec;
			else if (trackData.type === "audio") return trackData.info.decoderConfig.codec;
			else return { webvtt: "wvtt" }[trackData.track.source._codec];
		});
		return buildIsobmffMimeType({
			isQuickTime: this.isQuickTime,
			hasVideo: this.trackDatas.some((x) => x.type === "video"),
			hasAudio: this.trackDatas.some((x) => x.type === "audio"),
			codecStrings
		});
	}
	getVideoTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateVideoChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		assert(decoderConfig.codedWidth !== void 0);
		assert(decoderConfig.codedHeight !== void 0);
		let requiresAnnexBTransformation = false;
		if (track.source._codec === "avc" && !decoderConfig.description) {
			if (!packet) throw new Error("No AVC description provided; you must therefore provide a priming packet.");
			const decoderConfigurationRecord = extractAvcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an AVCDecoderConfigurationRecord from the AVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.264) when not providing a description, or provide a description (must be an AVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in AVCC format.");
			decoderConfig.description = serializeAvcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		} else if (track.source._codec === "hevc" && !decoderConfig.description) {
			if (!packet) throw new Error("No HEVC description provided; you must therefore provide a priming packet.");
			const decoderConfigurationRecord = extractHevcDecoderConfigurationRecord(packet.data);
			if (!decoderConfigurationRecord) throw new Error("Couldn't extract an HEVCDecoderConfigurationRecord from the HEVC packet. Make sure the packets are in Annex B format (as specified in ITU-T-REC-H.265) when not providing a description, or provide a description (must be an HEVCDecoderConfigurationRecord as specified in ISO 14496-15) and ensure the packets are in HEVC format.");
			decoderConfig.description = serializeHevcDecoderConfigurationRecord(decoderConfigurationRecord);
			requiresAnnexBTransformation = true;
		}
		const timescale = computeRationalApproximation(1 / (track.metadata.frameRate ?? 57600), 1e6).den;
		const displayAspectWidth = decoderConfig.displayAspectWidth;
		const displayAspectHeight = decoderConfig.displayAspectHeight;
		const pixelAspectRatio = displayAspectWidth === void 0 || displayAspectHeight === void 0 ? {
			num: 1,
			den: 1
		} : simplifyRational({
			num: displayAspectWidth * decoderConfig.codedHeight,
			den: displayAspectHeight * decoderConfig.codedWidth
		});
		const hasAlphaChannel = decoderConfig.codec === "ap4h" || decoderConfig.codec === "ap4x";
		const newTrackData = {
			muxer: this,
			track,
			type: "video",
			info: {
				width: decoderConfig.codedWidth,
				height: decoderConfig.codedHeight,
				pixelAspectRatio,
				decoderConfig,
				requiresAnnexBTransformation,
				hasAlphaChannel
			},
			timescale,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false,
			avgBitrate: track.source._nominalBitrate ?? track.metadata.averageBitrate ?? 0,
			maxBitrate: track.source._nominalBitrate ?? track.metadata.bitrate ?? 0
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getAudioTrackData(track, packet, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateAudioChunkMetadata(meta, track.source._codec);
		assert(meta);
		assert(meta.decoderConfig);
		const decoderConfig = { ...meta.decoderConfig };
		let requiresAdtsStripping = false;
		if (track.source._codec === "aac" && !decoderConfig.description) {
			if (!packet) throw new Error("No AAC description provided; you must therefore provide a priming packet.");
			const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packet.data));
			if (!adtsFrame) throw new Error("Couldn't parse ADTS header from the AAC packet. Make sure the packets are in ADTS format (as specified in ISO 13818-7) when not providing a description, or provide a description (must be an AudioSpecificConfig as specified in ISO 14496-3) and ensure the packets are raw AAC data.");
			const sampleRate = aacFrequencyTable[adtsFrame.samplingFrequencyIndex];
			const numberOfChannels = aacChannelMap[adtsFrame.channelConfiguration];
			if (sampleRate === void 0 || numberOfChannels === void 0) throw new Error("Invalid ADTS frame header.");
			decoderConfig.description = buildAacAudioSpecificConfig({
				objectType: adtsFrame.objectType,
				outputSampleRate: sampleRate,
				outputNumberOfChannels: numberOfChannels
			});
			requiresAdtsStripping = true;
		}
		if (!packet) {
			if (track.source._codec === "ac3" || track.source._codec === "eac3") throw new Error("AC-3/E-AC-3 require a priming packet.");
			if (track.source._codec === "dts") throw new Error("DTS requires a priming packet.");
			if (track.source._codec === "truehd") throw new Error("TrueHD requires a priming packet.");
		}
		const newTrackData = {
			muxer: this,
			track,
			type: "audio",
			info: {
				numberOfChannels: meta.decoderConfig.numberOfChannels,
				sampleRate: meta.decoderConfig.sampleRate,
				decoderConfig,
				requiresPcmTransformation: !this.isFragmented && PCM_AUDIO_CODECS.includes(track.source._codec),
				expectedNextPcmPacketTimestamp: null,
				requiresAdtsStripping,
				primingPacket: packet,
				preroll: {
					packetCount: 0,
					accumulatedAudioSamples: 0,
					audioSampleDurationHistory: []
				}
			},
			timescale: decoderConfig.sampleRate,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false,
			avgBitrate: track.source._nominalBitrate ?? track.metadata.averageBitrate ?? 0,
			maxBitrate: track.source._nominalBitrate ?? track.metadata.bitrate ?? 0
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	getSubtitleTrackData(track, meta) {
		const existingTrackData = this.trackDatas.find((x) => x.track === track);
		if (existingTrackData) return existingTrackData;
		validateSubtitleMetadata(meta);
		assert(meta);
		assert(meta.config);
		const newTrackData = {
			muxer: this,
			track,
			type: "subtitle",
			info: { config: meta.config },
			timescale: 1e3,
			samples: [],
			sampleQueue: [],
			timestampProcessingQueue: [],
			timeToSampleTable: [],
			compositionTimeOffsetTable: [],
			lastTimescaleUnits: null,
			lastSample: null,
			startTimestampOffset: null,
			finalizedChunks: [],
			currentChunk: null,
			compactlyCodedChunkTable: [],
			closed: false,
			avgBitrate: track.source._nominalBitrate ?? track.metadata.averageBitrate ?? 0,
			maxBitrate: track.source._nominalBitrate ?? track.metadata.bitrate ?? 0,
			lastCueEndTimestamp: null,
			cueQueue: [],
			nextSourceId: 0,
			cueToSourceId: /* @__PURE__ */ new WeakMap()
		};
		this.trackDatas.push(newTrackData);
		this.trackDatas.sort((a, b) => a.track.id - b.track.id);
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		return newTrackData;
	}
	async addEncodedVideoPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getVideoTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAnnexBTransformation) {
				const nalUnits = [...iterateNalUnitsInAnnexB(packetData)].map((loc) => packetData.subarray(loc.offset, loc.offset + loc.length));
				if (nalUnits.length === 0) throw new Error("Failed to transform packet data. Make sure all packets are provided in Annex B format, as specified in ITU-T-REC-H.264 and ITU-T-REC-H.265.");
				packetData = concatNalUnitsInLengthPrefixed(nalUnits, 4);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			const internalSample = this.createSampleForTrack(trackData, packetData, packet.timestamp, packet.duration, packet.type, 0);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async addEncodedAudioPacket(track, packet, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getAudioTrackData(track, packet, meta);
			let packetData = packet.data;
			if (trackData.info.requiresAdtsStripping) {
				const adtsFrame = readAdtsFrameHeader(FileSlice.tempFromBytes(packetData));
				if (!adtsFrame) throw new Error("Expected ADTS frame, didn't get one.");
				const headerLength = adtsFrame.crcCheck === null ? 7 : 9;
				packetData = packetData.subarray(headerLength);
			}
			this.validateTimestamp(trackData.track, packet.timestamp, packet.type === "key");
			let timestamp = packet.timestamp;
			let duration = packet.duration;
			if (trackData.info.requiresPcmTransformation) {
				const frameSize = parsePcmCodec(trackData.info.decoderConfig.codec).sampleSize * trackData.info.numberOfChannels;
				duration = packetData.byteLength / frameSize / trackData.info.sampleRate;
				if (trackData.info.expectedNextPcmPacketTimestamp !== null) {
					const diff = timestamp - trackData.info.expectedNextPcmPacketTimestamp;
					if (diff < .01) timestamp = trackData.info.expectedNextPcmPacketTimestamp;
					else {
						const paddedDuration = await this.padWithSilence(trackData, trackData.info.expectedNextPcmPacketTimestamp, diff);
						timestamp = trackData.info.expectedNextPcmPacketTimestamp + paddedDuration;
					}
				}
				trackData.info.expectedNextPcmPacketTimestamp = timestamp + duration;
			}
			const { preroll } = trackData.info;
			let prerollSamples = 0;
			if (track.source._codec === "aac" || track.source._codec === "vorbis") prerollSamples = -Math.min(1, preroll.packetCount);
			else if (track.source._codec === "mp3") prerollSamples = -Math.min(2, preroll.packetCount);
			else if (track.source._codec === "opus") {
				const OPUS_PREROLL_SAMPLES = Math.round(OPUS_PRE_ROLL_DURATION * OPUS_SAMPLE_RATE);
				prerollSamples = -preroll.audioSampleDurationHistory.length;
				const toc = parseOpusTocByte(packetData);
				preroll.accumulatedAudioSamples += toc.durationInSamples;
				preroll.audioSampleDurationHistory.push(toc.durationInSamples);
				while (preroll.accumulatedAudioSamples - preroll.audioSampleDurationHistory[0] >= OPUS_PREROLL_SAMPLES) {
					preroll.accumulatedAudioSamples -= preroll.audioSampleDurationHistory.shift();
					assert(preroll.audioSampleDurationHistory.length > 0);
				}
			}
			preroll.packetCount++;
			const internalSample = this.createSampleForTrack(trackData, packetData, timestamp, duration, packet.type, prerollSamples);
			await this.registerSample(trackData, internalSample);
		} finally {
			release();
		}
	}
	async padWithSilence(trackData, timestamp, duration) {
		const deltaInTimescale = intoTimescale(duration, trackData.timescale);
		duration = deltaInTimescale / trackData.timescale;
		if (deltaInTimescale > 0) {
			const { sampleSize, silentValue } = parsePcmCodec(trackData.info.decoderConfig.codec);
			const samplesNeeded = deltaInTimescale * trackData.info.numberOfChannels;
			const data = new Uint8Array(sampleSize * samplesNeeded).fill(silentValue);
			const paddingSample = this.createSampleForTrack(trackData, new Uint8Array(data.buffer), timestamp, duration, "key", 0);
			await this.registerSample(trackData, paddingSample);
		}
		return duration;
	}
	async addSubtitleCue(track, cue, meta) {
		const release = await this.mutex.acquire();
		try {
			const trackData = this.getSubtitleTrackData(track, meta);
			this.validateTimestamp(trackData.track, cue.timestamp, true);
			if (track.source._codec === "webvtt") {
				trackData.cueQueue.push(cue);
				await this.processWebVTTCues(trackData, cue.timestamp);
			}
		} finally {
			release();
		}
	}
	async processWebVTTCues(trackData, until) {
		while (trackData.cueQueue.length > 0) {
			trackData.lastCueEndTimestamp ??= Math.min(0, trackData.cueQueue[0].timestamp);
			const timestamps = /* @__PURE__ */ new Set([]);
			for (const cue of trackData.cueQueue) {
				assert(cue.timestamp <= until);
				assert(trackData.lastCueEndTimestamp <= cue.timestamp + cue.duration);
				timestamps.add(Math.max(cue.timestamp, trackData.lastCueEndTimestamp));
				timestamps.add(cue.timestamp + cue.duration);
			}
			const sortedTimestamps = [...timestamps].sort((a, b) => a - b);
			const sampleStart = sortedTimestamps[0];
			const sampleEnd = sortedTimestamps[1] ?? sampleStart;
			if (until < sampleEnd) break;
			if (trackData.lastCueEndTimestamp < sampleStart) {
				this.auxWriter.seek(0);
				const box = vtte();
				this.auxBoxWriter.writeBox(box);
				const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
				const sample = this.createSampleForTrack(trackData, body, trackData.lastCueEndTimestamp, sampleStart - trackData.lastCueEndTimestamp, "key", 0);
				await this.registerSample(trackData, sample);
				trackData.lastCueEndTimestamp = sampleStart;
			}
			this.auxWriter.seek(0);
			for (let i = 0; i < trackData.cueQueue.length; i++) {
				const cue = trackData.cueQueue[i];
				if (cue.timestamp >= sampleEnd) break;
				inlineTimestampRegex.lastIndex = 0;
				const containsTimestamp = inlineTimestampRegex.test(cue.text);
				const endTimestamp = cue.timestamp + cue.duration;
				let sourceId = trackData.cueToSourceId.get(cue);
				if (sourceId === void 0 && sampleEnd < endTimestamp) {
					sourceId = trackData.nextSourceId++;
					trackData.cueToSourceId.set(cue, sourceId);
				}
				if (cue.notes) {
					const box = vtta(cue.notes);
					this.auxBoxWriter.writeBox(box);
				}
				const box = vttc(cue.text, containsTimestamp ? sampleStart : null, cue.identifier ?? null, cue.settings ?? null, sourceId ?? null);
				this.auxBoxWriter.writeBox(box);
				if (endTimestamp === sampleEnd) trackData.cueQueue.splice(i--, 1);
			}
			const body = this.auxTarget._getSlice(0, this.auxWriter.getPos());
			const sample = this.createSampleForTrack(trackData, body, sampleStart, sampleEnd - sampleStart, "key", 0);
			await this.registerSample(trackData, sample);
			trackData.lastCueEndTimestamp = sampleEnd;
		}
	}
	createSampleForTrack(trackData, data, timestamp, duration, type, prerollSamples) {
		return {
			timestamp,
			decodeTimestamp: timestamp,
			duration,
			data,
			size: data.byteLength,
			type,
			timescaleUnitsToNextSample: intoTimescale(duration, trackData.timescale),
			prerollSamples
		};
	}
	processTimestamps(trackData, nextSample) {
		if (trackData.timestampProcessingQueue.length === 0) return;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) {
			assert(!this.isFragmented);
			trackData.startTimestampOffset ??= trackData.timestampProcessingQueue[0].timestamp;
			let totalDuration = 0;
			for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
				const sample = trackData.timestampProcessingQueue[i];
				const duration = intoTimescale(sample.duration, trackData.timescale);
				totalDuration += duration;
			}
			if (trackData.timeToSampleTable.length === 0) trackData.timeToSampleTable.push({
				sampleCount: totalDuration,
				sampleDelta: 1
			});
			else {
				const lastEntry = last(trackData.timeToSampleTable);
				lastEntry.sampleCount += totalDuration;
			}
			trackData.timestampProcessingQueue.length = 0;
			return;
		}
		const sortedTimestamps = trackData.timestampProcessingQueue.map((x) => x.timestamp).sort((a, b) => a - b);
		if (this.isFragmented) trackData.startTimestampOffset ??= Math.min(sortedTimestamps[0], 0);
		else trackData.startTimestampOffset ??= sortedTimestamps[0];
		for (let i = 0; i < trackData.timestampProcessingQueue.length; i++) {
			const sample = trackData.timestampProcessingQueue[i];
			sample.decodeTimestamp = sortedTimestamps[i];
			const sampleCompositionTimeOffset = intoTimescale(sample.timestamp - sample.decodeTimestamp, trackData.timescale);
			const durationInTimescale = intoTimescale(sample.duration, trackData.timescale);
			if (trackData.lastTimescaleUnits !== null) {
				assert(trackData.lastSample);
				const timescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
				assert(delta >= 0);
				trackData.lastTimescaleUnits += delta;
				trackData.lastSample.timescaleUnitsToNextSample = delta;
				if (!this.isFragmented) {
					let lastTableEntry = last(trackData.timeToSampleTable);
					assert(lastTableEntry);
					if (lastTableEntry.sampleCount === 1) {
						lastTableEntry.sampleDelta = delta;
						const entryBefore = trackData.timeToSampleTable[trackData.timeToSampleTable.length - 2];
						if (entryBefore && entryBefore.sampleDelta === delta) {
							entryBefore.sampleCount++;
							trackData.timeToSampleTable.pop();
							lastTableEntry = entryBefore;
						}
					} else if (lastTableEntry.sampleDelta !== delta) {
						lastTableEntry.sampleCount--;
						trackData.timeToSampleTable.push(lastTableEntry = {
							sampleCount: 1,
							sampleDelta: delta
						});
					}
					if (lastTableEntry.sampleDelta === durationInTimescale) lastTableEntry.sampleCount++;
					else trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					const lastCompositionTimeOffsetTableEntry = last(trackData.compositionTimeOffsetTable);
					assert(lastCompositionTimeOffsetTableEntry);
					if (lastCompositionTimeOffsetTableEntry.sampleCompositionTimeOffset === sampleCompositionTimeOffset) lastCompositionTimeOffsetTableEntry.sampleCount++;
					else trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			} else {
				trackData.lastTimescaleUnits = intoTimescale(sample.decodeTimestamp, trackData.timescale, false);
				if (!this.isFragmented) {
					trackData.timeToSampleTable.push({
						sampleCount: 1,
						sampleDelta: durationInTimescale
					});
					trackData.compositionTimeOffsetTable.push({
						sampleCount: 1,
						sampleCompositionTimeOffset
					});
				}
			}
			trackData.lastSample = sample;
		}
		trackData.timestampProcessingQueue.length = 0;
		assert(trackData.lastSample);
		assert(trackData.lastTimescaleUnits !== null);
		if (nextSample !== void 0 && trackData.lastSample.timescaleUnitsToNextSample === 0) {
			assert(nextSample.type === "key");
			const timescaleUnits = intoTimescale(nextSample.timestamp, trackData.timescale, false);
			const delta = Math.round(timescaleUnits - trackData.lastTimescaleUnits);
			trackData.lastSample.timescaleUnitsToNextSample = delta;
		}
	}
	async registerSample(trackData, sample) {
		if (sample.type === "key") this.processTimestamps(trackData, sample);
		trackData.timestampProcessingQueue.push(sample);
		trackData.sampleQueue.push(sample);
		await this.interleaveSamples();
	}
	async addSampleToTrack(trackData, sample) {
		if (!this.isFragmented) {
			trackData.samples.push(sample);
			if (this.fastStart === "reserve") {
				const maximumPacketCount = trackData.track.metadata.maximumPacketCount;
				assert(maximumPacketCount !== void 0);
				if (trackData.samples.length > maximumPacketCount) throw new Error(`Track #${trackData.track.id} has already reached the maximum packet count (${maximumPacketCount}). Either add less packets or increase the maximum packet count.`);
			}
		}
		let beginNewChunk = false;
		if (!trackData.currentChunk) beginNewChunk = true;
		else {
			trackData.currentChunk.startTimestamp = Math.min(trackData.currentChunk.startTimestamp, sample.timestamp);
			const currentChunkDuration = sample.timestamp - trackData.currentChunk.startTimestamp;
			if (this.isFragmented) {
				const keyFrameQueuedEverywhere = this.trackDatas.every((otherTrackData) => {
					if (trackData === otherTrackData) return sample.type === "key";
					const firstQueuedSample = otherTrackData.sampleQueue[0];
					if (firstQueuedSample) return firstQueuedSample.type === "key";
					return otherTrackData.closed;
				});
				if (currentChunkDuration >= this.minimumFragmentDuration && keyFrameQueuedEverywhere && sample.timestamp > this.maxWrittenTimestamp) {
					beginNewChunk = true;
					await this.finalizeFragment();
				}
			} else beginNewChunk = currentChunkDuration >= MIN_CHUNK_DURATION;
		}
		if (beginNewChunk) {
			if (!this.isFragmented) {
				const tracksToFinalize = this.trackDatas.filter((x) => x.currentChunk && sample.timestamp - x.currentChunk.startTimestamp >= MIN_CHUNK_DURATION).sort((a, b) => a.currentChunk.startTimestamp - b.currentChunk.startTimestamp);
				for (const otherTrackData of tracksToFinalize) await this.finalizeCurrentChunk(otherTrackData);
			}
			trackData.currentChunk = {
				startTimestamp: sample.timestamp,
				samples: [],
				offset: null,
				moofOffset: null,
				trafIndex: null
			};
		}
		assert(trackData.currentChunk);
		trackData.currentChunk.samples.push(sample);
		if (this.isFragmented) {
			this.maxWrittenTimestamp = Math.max(this.maxWrittenTimestamp, sample.timestamp);
			this.maxWrittenEndTimestamp = Math.max(this.maxWrittenEndTimestamp, sample.timestamp + sample.duration);
			this.minWrittenTimestamp = Math.min(this.minWrittenTimestamp, sample.timestamp);
		}
	}
	async finalizeCurrentChunk(trackData) {
		assert(!this.isFragmented);
		assert(this.writer);
		const chunk = trackData.currentChunk;
		assert(chunk);
		trackData.currentChunk = null;
		trackData.finalizedChunks.push(chunk);
		this.finalizedChunks.push(chunk);
		let sampleCount = chunk.samples.length;
		if (trackData.type === "audio" && trackData.info.requiresPcmTransformation) sampleCount = chunk.samples.reduce((acc, sample) => acc + intoTimescale(sample.duration, trackData.timescale), 0);
		if (trackData.compactlyCodedChunkTable.length === 0 || last(trackData.compactlyCodedChunkTable).samplesPerChunk !== sampleCount) trackData.compactlyCodedChunkTable.push({
			firstChunk: trackData.finalizedChunks.length,
			samplesPerChunk: sampleCount
		});
		if (this.fastStart === "in-memory") {
			chunk.offset = 0;
			return;
		}
		chunk.offset = this.writer.getPos();
		for (const sample of chunk.samples) {
			assert(sample.data);
			this.writer.write(sample.data);
			sample.data = null;
		}
		await this.writer.flush();
	}
	async interleaveSamples(isFinalCall = false) {
		if (!isFinalCall && !this.allTracksAreKnown()) return;
		if (this.fastStart === "reserve" && !this.mdat) await this.createFastStartReserveMdat();
		outer: while (true) {
			let trackWithMinTimestamp = null;
			let minTimestamp = Infinity;
			for (const trackData of this.trackDatas) {
				if (!isFinalCall && trackData.sampleQueue.length === 0 && !trackData.closed) break outer;
				if (trackData.sampleQueue.length > 0 && trackData.sampleQueue[0].timestamp < minTimestamp) {
					trackWithMinTimestamp = trackData;
					minTimestamp = trackData.sampleQueue[0].timestamp;
				}
			}
			if (!trackWithMinTimestamp) break;
			const sample = trackWithMinTimestamp.sampleQueue.shift();
			await this.addSampleToTrack(trackWithMinTimestamp, sample);
		}
	}
	async finalizeFragment(flushWriter = !this.isCmaf) {
		assert(this.isFragmented);
		if (!this.wroteFragmentedHeader) {
			this.wroteFragmentedHeader = true;
			const boxWriter = this.initBoxWriter ?? this.boxWriter;
			assert(boxWriter);
			if (this.formatOptions.onMoov) boxWriter.writer.startTrackingWrites();
			this.ensureOneEnabledTrack();
			const movieBox = moov(this);
			boxWriter.writeBox(movieBox);
			if (this.formatOptions.onMoov) {
				const { data, start } = boxWriter.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
			if (this.isCmaf) {
				assert(this.initWriter);
				await this.initWriter.flush();
				await this.initWriter.finalize();
				this.writer = await this.output._getRootWriter(true);
				this.boxWriter = new IsobmffBoxWriter(this.writer);
				const stypSize = this.boxWriter.measureBox(styp());
				const sidxSize = this.boxWriter.measureBox(sidx(this, 0));
				this.segmentHeaderSize = stypSize + sidxSize;
				this.writer.seek(this.segmentHeaderSize);
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		const tracksInFragment = this.trackDatas.filter((x) => x.currentChunk);
		if (tracksInFragment.length === 0) {
			if (flushWriter) await this.writer.flush();
			return;
		}
		const fragmentNumber = this.nextFragmentNumber++;
		const moofBox = moof(fragmentNumber, tracksInFragment);
		const moofOffset = this.writer.getPos();
		const mdatStartPos = moofOffset + this.boxWriter.measureBox(moofBox);
		let currentPos = mdatStartPos + 8;
		let fragmentStartTimestamp = Infinity;
		for (let i = 0; i < tracksInFragment.length; i++) {
			const trackData = tracksInFragment[i];
			assert(trackData.currentChunk);
			assert(trackData.startTimestampOffset !== null);
			trackData.currentChunk.offset = currentPos;
			trackData.currentChunk.moofOffset = moofOffset;
			trackData.currentChunk.trafIndex = i;
			trackData.currentChunk.startTimestamp -= trackData.startTimestampOffset;
			for (const sample of trackData.currentChunk.samples) {
				currentPos += sample.size;
				sample.timestamp -= trackData.startTimestampOffset;
				sample.decodeTimestamp -= trackData.startTimestampOffset;
			}
			fragmentStartTimestamp = Math.min(fragmentStartTimestamp, trackData.currentChunk.startTimestamp);
		}
		const mdatSize = currentPos - mdatStartPos;
		const needsLargeMdatSize = mdatSize >= 2 ** 32;
		if (needsLargeMdatSize) for (const trackData of tracksInFragment) trackData.currentChunk.offset += 8;
		if (this.formatOptions.onMoof) this.writer.startTrackingWrites();
		const newMoofBox = moof(fragmentNumber, tracksInFragment);
		this.boxWriter.writeBox(newMoofBox);
		if (this.formatOptions.onMoof) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.formatOptions.onMoof(data, start, fragmentStartTimestamp);
		}
		assert(this.writer.getPos() === mdatStartPos);
		if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
		const mdatBox = mdat(needsLargeMdatSize);
		mdatBox.size = mdatSize;
		this.boxWriter.writeBox(mdatBox);
		this.writer.seek(mdatStartPos + (needsLargeMdatSize ? 16 : 8));
		for (const trackData of tracksInFragment) for (const sample of trackData.currentChunk.samples) {
			this.writer.write(sample.data);
			sample.data = null;
		}
		if (this.formatOptions.onMdat) {
			const { data, start } = this.writer.stopTrackingWrites();
			this.formatOptions.onMdat(data, start);
		}
		for (const trackData of tracksInFragment) {
			trackData.finalizedChunks.push(trackData.currentChunk);
			this.finalizedChunks.push(trackData.currentChunk);
			trackData.currentChunk = null;
		}
		if (flushWriter) await this.writer.flush();
	}
	async createFastStartReserveMdat() {
		assert(this.writer);
		assert(this.boxWriter);
		this.ensureOneEnabledTrack();
		const moovBox = moov(this);
		const reservedSize = this.boxWriter.measureBox(moovBox) + this.computeSampleTableSizeUpperBound() + 4096;
		assert(this.ftypSize !== null);
		this.writer.seek(this.ftypSize + reservedSize);
		if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
		this.mdat = mdat(true);
		this.boxWriter.writeBox(this.mdat);
	}
	computeSampleTableSizeUpperBound() {
		assert(this.fastStart === "reserve");
		let upperBound = 0;
		for (const trackData of this.trackDatas) {
			const n = trackData.track.metadata.maximumPacketCount;
			assert(n !== void 0);
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * Math.ceil(2 / 3 * n);
			upperBound += 12 * Math.ceil(2 / 3 * n);
			upperBound += 4 * n;
			upperBound += 8 * n;
			if (trackData.type === "audio") {
				upperBound += 2 * n;
				upperBound += 8 * n;
			}
		}
		return upperBound;
	}
	async onTrackClose(track) {
		const release = await this.mutex.acquire();
		const trackData = this.trackDatas.find((x) => x.track === track);
		if (trackData) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		if (this.allTracksAreKnown()) this.allTracksKnown.resolve();
		await this.interleaveSamples();
		release();
	}
	ensureOneEnabledTrack() {
		for (const type of [
			"video",
			"audio",
			"subtitle"
		]) {
			const tracks = this.trackDatas.filter((t) => t.type === type);
			if (tracks.length === 0) continue;
			if (!tracks.some((t) => t.track.metadata.disposition?.default !== false)) {
				const firstTrack = tracks[0];
				firstTrack.track.metadata.disposition = {
					...firstTrack.track.metadata.disposition,
					default: true
				};
			}
		}
	}
	/** Internal function for external callers who want to full control fragment boundaries. */
	async forceFragmentFinalization() {
		assert(this.isFragmented);
		const release = await this.mutex.acquire();
		try {
			for (const trackData of this.trackDatas) {
				if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
				this.processTimestamps(trackData);
			}
			await this.interleaveSamples(true);
			await this.finalizeFragment();
		} finally {
			release();
		}
	}
	/** Finalizes the file, making it ready for use. Must be called after all video and audio chunks have been added. */
	async finalize() {
		const release = await this.mutex.acquire();
		this.allTracksKnown.resolve();
		this.ensureOneEnabledTrack();
		for (const trackData of this.trackDatas) {
			trackData.closed = true;
			if (trackData.type === "subtitle" && trackData.track.source._codec === "webvtt") await this.processWebVTTCues(trackData, Infinity);
			this.processTimestamps(trackData);
		}
		await this.interleaveSamples(true);
		if (this.isFragmented) await this.finalizeFragment(false);
		else {
			const tracksToFinalize = this.trackDatas.filter((x) => x.currentChunk).sort((a, b) => a.currentChunk.startTimestamp - b.currentChunk.startTimestamp);
			for (const trackData of tracksToFinalize) await this.finalizeCurrentChunk(trackData);
			for (const trackData of this.trackDatas) {
				const span = presentationSpan(trackData);
				if (span > 0) {
					let totalBytes = 0;
					for (const sample of trackData.samples) totalBytes += sample.size;
					trackData.avgBitrate = Math.round(8 * totalBytes / span);
				} else trackData.avgBitrate = 0;
				let windowStart = 0;
				let windowBytes = 0;
				let maxWindowBytes = 0;
				for (let i = 0; i < trackData.samples.length; i++) {
					const sample = trackData.samples[i];
					windowBytes += sample.size;
					while (sample.decodeTimestamp - trackData.samples[windowStart].decodeTimestamp >= 1) {
						windowBytes -= trackData.samples[windowStart].size;
						windowStart++;
					}
					maxWindowBytes = Math.max(maxWindowBytes, windowBytes);
				}
				trackData.maxBitrate = 8 * maxWindowBytes;
				if (trackData.startTimestampOffset !== null) for (let i = 0; i < trackData.samples.length; i++) {
					const sample = trackData.samples[i];
					sample.timestamp -= trackData.startTimestampOffset;
					sample.decodeTimestamp -= trackData.startTimestampOffset;
				}
			}
		}
		assert(this.writer);
		assert(this.boxWriter);
		if (this.fastStart === "in-memory") {
			this.mdat = mdat(false);
			let mdatSize;
			for (let i = 0; i < 2; i++) {
				const movieBox = moov(this);
				const movieBoxSize = this.boxWriter.measureBox(movieBox);
				mdatSize = this.boxWriter.measureBox(this.mdat);
				let currentChunkPos = this.writer.getPos() + movieBoxSize + mdatSize;
				for (const chunk of this.finalizedChunks) {
					chunk.offset = currentChunkPos;
					for (const { data } of chunk.samples) {
						assert(data);
						currentChunkPos += data.byteLength;
						mdatSize += data.byteLength;
					}
				}
				if (currentChunkPos < 2 ** 32) break;
				if (mdatSize >= 2 ** 32) this.mdat.largeSize = true;
			}
			if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
			const movieBox = moov(this);
			this.boxWriter.writeBox(movieBox);
			if (this.formatOptions.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
			if (this.formatOptions.onMdat) this.writer.startTrackingWrites();
			this.mdat.size = mdatSize;
			this.boxWriter.writeBox(this.mdat);
			for (const chunk of this.finalizedChunks) for (const sample of chunk.samples) {
				assert(sample.data);
				this.writer.write(sample.data);
				sample.data = null;
			}
			if (this.formatOptions.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMdat(data, start);
			}
		} else if (this.isFragmented) {
			if (this.isCmaf) {
				const contentSize = this.segmentHeaderSize !== null ? this.writer.getPos() - this.segmentHeaderSize : 0;
				this.writer.seek(0);
				this.boxWriter.writeBox(styp());
				this.boxWriter.writeBox(sidx(this, contentSize));
			} else {
				const startPos = this.writer.getPos();
				const mfraBox = mfra(this.trackDatas);
				this.boxWriter.writeBox(mfraBox);
				const mfraBoxSize = this.writer.getPos() - startPos;
				this.writer.seek(this.writer.getPos() - 4);
				this.boxWriter.writeU32(mfraBoxSize);
			}
		} else {
			assert(this.mdat);
			const mdatPos = this.boxWriter.offsets.get(this.mdat);
			assert(mdatPos !== void 0);
			const mdatSize = this.writer.getPos() - mdatPos;
			this.mdat.size = mdatSize;
			this.mdat.largeSize = mdatSize >= 2 ** 32;
			this.boxWriter.patchBox(this.mdat);
			if (this.formatOptions.onMdat) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMdat(data, start);
			}
			const movieBox = moov(this);
			if (this.fastStart === "reserve") {
				assert(this.ftypSize !== null);
				const reservedSpace = this.boxWriter.offsets.get(this.mdat) - this.ftypSize;
				const moovSize = this.boxWriter.measureBox(movieBox);
				if (moovSize + 8 > reservedSpace) throw new Error(`The moov box (${moovSize} bytes) plus a free box (8 bytes) exceed the space reserved for them (${reservedSpace} bytes) with fastStart: 'reserve'. This is a bug; please report it.`);
				this.writer.seek(this.ftypSize);
				if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
				this.boxWriter.writeBox(free(reservedSpace - moovSize));
			} else {
				if (this.formatOptions.onMoov) this.writer.startTrackingWrites();
				this.boxWriter.writeBox(movieBox);
			}
			if (this.formatOptions.onMoov) {
				const { data, start } = this.writer.stopTrackingWrites();
				this.formatOptions.onMoov(data, start);
			}
		}
		release();
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/output-format.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* Base class representing an output media file format.
* @group Output formats
* @public
*/
var OutputFormat = class {
	/**
	* Whether this output format supports video rotation metadata.
	* @deprecated Use {@link OutputFormat.supportsVideoTransformationMetadata} instead.
	*/
	get supportsVideoRotationMetadata() {
		return this.supportsVideoTransformationMetadata;
	}
	/**
	* Whether this output format, as configured, requires {@link BaseTrackMetadata.maximumPacketCount} to be set in
	* the metadata of every track added to it.
	*/
	get requiresMaximumPacketCount() {
		return false;
	}
	/** Returns a list of video codecs that this output format can contain. */
	getSupportedVideoCodecs() {
		return this.getSupportedCodecs().filter((codec) => VIDEO_CODECS.includes(codec));
	}
	/** Returns a list of audio codecs that this output format can contain. */
	getSupportedAudioCodecs() {
		return this.getSupportedCodecs().filter((codec) => AUDIO_CODECS.includes(codec));
	}
	/** Returns a list of subtitle codecs that this output format can contain. */
	getSupportedSubtitleCodecs() {
		return this.getSupportedCodecs().filter((codec) => SUBTITLE_CODECS.includes(codec));
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		return "";
	}
	/** @internal */
	_isFragmentedIsobmff() {
		return false;
	}
};
/**
* Format representing files compatible with the ISO base media file format (ISOBMFF), like MP4 or MOV files.
* @group Output formats
* @public
*/
var IsobmffOutputFormat = class extends OutputFormat {
	/** Internal constructor. */
	constructor(options = {}) {
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (options.fastStart !== void 0 && ![
			false,
			"in-memory",
			"reserve",
			"fragmented"
		].includes(options.fastStart)) throw new TypeError("options.fastStart, when provided, must be false, 'in-memory', 'reserve', or 'fragmented'.");
		if (options.minimumFragmentDuration !== void 0 && (!isNumber(options.minimumFragmentDuration) || options.minimumFragmentDuration < 0)) throw new TypeError("options.minimumFragmentDuration, when provided, must be a non-negative number.");
		if (options.onFtyp !== void 0 && typeof options.onFtyp !== "function") throw new TypeError("options.onFtyp, when provided, must be a function.");
		if (options.onMoov !== void 0 && typeof options.onMoov !== "function") throw new TypeError("options.onMoov, when provided, must be a function.");
		if (options.onMdat !== void 0 && typeof options.onMdat !== "function") throw new TypeError("options.onMdat, when provided, must be a function.");
		if (options.onMoof !== void 0 && typeof options.onMoof !== "function") throw new TypeError("options.onMoof, when provided, must be a function.");
		if (options.metadataFormat !== void 0 && ![
			"mdir",
			"mdta",
			"udta",
			"auto"
		].includes(options.metadataFormat)) throw new TypeError("options.metadataFormat, when provided, must be either 'auto', 'mdir', 'mdta', or 'udta'.");
		super();
		this._options = options;
	}
	getSupportedTrackCounts() {
		const max = 2 ** 32 - 1;
		return {
			video: {
				min: 0,
				max
			},
			audio: {
				min: 0,
				max
			},
			subtitle: {
				min: 0,
				max
			},
			total: {
				min: 0,
				max
			}
		};
	}
	get supportsVideoTransformationMetadata() {
		return true;
	}
	get supportsTimestampedMediaData() {
		return true;
	}
	get negativeTimestampSupport() {
		return "full";
	}
	get requiresMaximumPacketCount() {
		return this._options.fastStart === "reserve";
	}
	/** @internal */
	_createMuxer(output) {
		return new IsobmffMuxer(output, this);
	}
	/** @internal */
	_isFragmentedIsobmff() {
		return this._options.fastStart === "fragmented";
	}
};
/**
* MPEG-4 Part 14 (MP4) file format. Supports most codecs.
* @group Output formats
* @public
*/
var Mp4OutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link Mp4OutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MP4";
	}
	get fileExtension() {
		return ".mp4";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new MovOutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MOV will grant support for this codec.";
		return "";
	}
};
/**
* Creates a single Common Media Application Format (CMAF) segment. An init segment will be written to the
* {@link Target} specified in {@link OutputOptions.initTarget}. Supports most codecs.
* @group Output formats
* @public
*/
var CmafOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link CmafOutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "CMAF";
	}
	get fileExtension() {
		return ".m4s";
	}
	get mimeType() {
		return "video/mp4";
	}
	getSupportedCodecs() {
		return [
			...VIDEO_CODECS,
			...NON_PCM_AUDIO_CODECS,
			"pcm-s16",
			"pcm-s16be",
			"pcm-s24",
			"pcm-s24be",
			"pcm-s32",
			"pcm-s32be",
			"pcm-f32",
			"pcm-f32be",
			"pcm-f64",
			"pcm-f64be",
			...SUBTITLE_CODECS
		];
	}
};
/**
* QuickTime File Format (QTFF), often called MOV. Supports all video and audio codecs, but not subtitle codecs.
* @group Output formats
* @public
*/
var MovOutputFormat = class extends IsobmffOutputFormat {
	/** Creates a new {@link MovOutputFormat} configured with the specified `options`. */
	constructor(options) {
		super(options);
	}
	/** @internal */
	get _name() {
		return "MOV";
	}
	get fileExtension() {
		return ".mov";
	}
	get mimeType() {
		return "video/quicktime";
	}
	getSupportedCodecs() {
		return [...VIDEO_CODECS, ...AUDIO_CODECS];
	}
	/** @internal */
	_codecUnsupportedHint(codec) {
		if (new Mp4OutputFormat().getSupportedCodecs().includes(codec)) return " Switching to MP4 will grant support for this codec.";
		return "";
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/output.js
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
/**
* List of all track types.
* @group Miscellaneous
* @public
*/
var ALL_TRACK_TYPES = [
	"video",
	"audio",
	"subtitle"
];
/**
* Represents a track added to an {@link Output}.
* @group Output files
* @public
*/
var OutputTrack = class OutputTrack {
	/** @internal */
	constructor(id, output, type, source, metadata) {
		this.id = id;
		this.output = output;
		this.type = type;
		this.source = source;
		this.metadata = metadata;
	}
	/** Returns true if and only if this track is a video track. */
	isVideoTrack() {
		return this.type === "video";
	}
	/** Returns true if and only if this track is an audio track. */
	isAudioTrack() {
		return this.type === "audio";
	}
	/** Returns true if and only if this track is a subtitle track. */
	isSubtitleTrack() {
		return this.type === "subtitle";
	}
	/**
	* Returns true if and only if this track can be paired with the given other track. Pairability can be set using
	* the {@link BaseTrackMetadata.group} option.
	*/
	canBePairedWith(other) {
		if (!(other instanceof OutputTrack)) throw new TypeError("other must be an OutputTrack.");
		if (this === other) return false;
		const thisGroups = toArray(this.metadata.group);
		const otherGroups = toArray(other.metadata.group);
		for (const aGroup of thisGroups) {
			if (this.type !== other.type && otherGroups.some((bGroup) => aGroup === bGroup)) return true;
			if (otherGroups.some((bGroup) => aGroup._pairedGroups.has(bGroup))) return true;
		}
		return false;
	}
};
/**
* An {@link OutputTrack} providing video data, created using {@link Output.addVideoTrack}.
* @group Output files
* @public
*/
var OutputVideoTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "video", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing audio data, created using {@link Output.addAudioTrack}.
* @group Output files
* @public
*/
var OutputAudioTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "audio", source, metadata);
	}
};
/**
* An {@link OutputTrack} providing subtitle data, created using {@link Output.addSubtitleTrack}.
* @group Output files
* @public
*/
var OutputSubtitleTrack = class extends OutputTrack {
	/** @internal */
	constructor(id, output, source, metadata) {
		super(id, output, "subtitle", source, metadata);
	}
};
/**
* Used to define pairability between {@link OutputTrack} instances. First create the group, then assign tracks to it
* via {@link BaseTrackMetadata.group}.
*
* Two tracks are considered _pairable_ if they are in the same group but have a different {@link TrackType}, or if they
* are in different groups that are paired with each other. Groups can be paired with each other using the
* {@link OutputTrackGroup.pairWith} method.
*
* @group Output files
* @public
*/
var OutputTrackGroup = class OutputTrackGroup {
	/** Creates a new {@link OutputTrackGroup}. */
	constructor() {
		/** @internal */
		this._pairedGroups = /* @__PURE__ */ new Set();
	}
	/**
	* Marks this group as being pairable with another group, symmetrically. Output tracks where each track is assigned
	* to one half of a group pairing are then considered pairable.
	*
	* You cannot pair a group with itself.
	*/
	pairWith(other) {
		if (!(other instanceof OutputTrackGroup)) throw new TypeError("other must be an OutputTrackGroup.");
		if (this === other) throw new TypeError("Cannot pair a group with itself.");
		this._pairedGroups.add(other);
		other._pairedGroups.add(this);
	}
};
var validateBaseTrackMetadata = (metadata) => {
	if (!metadata || typeof metadata !== "object") throw new TypeError("metadata must be an object.");
	if (metadata.languageCode !== void 0 && !isIso639Dash2LanguageCode(metadata.languageCode)) throw new TypeError("metadata.languageCode, when provided, must be a three-letter, ISO 639-2/T language code.");
	if (metadata.name !== void 0 && typeof metadata.name !== "string") throw new TypeError("metadata.name, when provided, must be a string.");
	if (metadata.disposition !== void 0) validateTrackDisposition(metadata.disposition);
	if (metadata.maximumPacketCount !== void 0 && (!Number.isInteger(metadata.maximumPacketCount) || metadata.maximumPacketCount < 0)) throw new TypeError("metadata.maximumPacketCount, when provided, must be a non-negative integer.");
	if (metadata.bitrate !== void 0 && (!Number.isFinite(metadata.bitrate) || metadata.bitrate < 0)) throw new TypeError("metadata.bitrate, when provided, must be a non-negative number.");
	if (metadata.averageBitrate !== void 0 && (!Number.isFinite(metadata.averageBitrate) || metadata.averageBitrate < 0)) throw new TypeError("metadata.averageBitrate, when provided, must be a non-negative number.");
	if (metadata.group !== void 0 && !(metadata.group instanceof OutputTrackGroup) && (!Array.isArray(metadata.group) || metadata.group.some((group) => !(group instanceof OutputTrackGroup)))) throw new TypeError("metadata.group, when provided, must be an OutputTrackGroup instance or an array of OutputTrackGroup instances.");
};
/**
* Main class orchestrating the creation of new media files.
* @group Output files
* @public
*/
var Output = class extends EventEmitter {
	/**
	* The target to which the root file will be written. Throws when using {@link PathedTarget} with an async callback;
	* prefer the `'target'` event for those cases.
	*/
	get target() {
		const errorMessage = "Output.target cannot be used when using PathedTarget with an async callback. Use the 'target' event instead.";
		if (this._rootTargetPromise) throw new TypeError(errorMessage);
		const rootTargetResult = this._getRootTarget();
		if (isThenable(rootTargetResult)) throw new TypeError(errorMessage);
		return rootTargetResult;
	}
	/**
	* Creates a new instance of {@link Output} which can then be used to create a new media file according to the
	* specified {@link OutputOptions}.
	*/
	constructor(options) {
		super();
		/** The current state of the output. */
		this.state = "pending";
		/**
		* The {@link OutputTrackGroup} that all tracks are assigned to by default unless otherwise specified by
		* {@link BaseTrackMetadata.group}.
		*/
		this.defaultTrackGroup = new OutputTrackGroup();
		/**
		* The tracks that have been added to this output. Treat it as a readonly field; to add tracks, use the methods.
		*/
		this.tracks = [];
		/** @internal */
		this._onFinalize = null;
		/** @internal */
		this._unfinalizedTargets = /* @__PURE__ */ new Set();
		/** @internal */
		this._rootWriterPromise = null;
		/** @internal */
		this._startPromise = null;
		/** @internal */
		this._cancelPromise = null;
		/** @internal */
		this._finalizePromise = null;
		/** @internal */
		this._mutex = new AsyncMutex();
		/** @internal */
		this._metadataTags = {};
		/** @internal */
		this._rootTarget = null;
		/** @internal */
		this._rootTargetPromise = null;
		/**
		* This field is used to synchronize multiple MediaStreamTracks. They use the same time coordinate system across
		* tracks, and to ensure correct audio-video sync, we must use the same offset for all of them. The reason an offset
		* is needed at all is because the timestamps typically don't start at zero.
		* @internal
		*/
		this._firstMediaStreamTimestamp = null;
		if (!options || typeof options !== "object") throw new TypeError("options must be an object.");
		if (!(options.format instanceof OutputFormat)) throw new TypeError("options.format must be an OutputFormat.");
		if (!(options.target instanceof Target || options.target instanceof PathedTarget)) throw new TypeError("options.target must be a Target or a PathedTarget.");
		if (options.target instanceof Target) this._rememberTarget(options.target);
		if (options.initTarget !== void 0 && !(options.initTarget instanceof Target) && typeof options.initTarget !== "function") throw new Error("options.initTarget, when provided, must be a Target or a function that returns or resolves to a Target.");
		if (options.onFinalize !== void 0 && typeof options.onFinalize !== "function") throw new TypeError("options.onFinalize, when provided, must be a function.");
		this.format = options.format;
		this._target = options.target;
		this._onFinalize = options.onFinalize ?? null;
		this._initTarget = options.initTarget ?? null;
		if (this._initTarget instanceof Target) this._rememberTarget(this._initTarget);
		this._muxer = options.format._createMuxer(this);
	}
	/** @internal */
	_getTargetValidated(request) {
		assert(this._target instanceof PathedTarget);
		const result = this._target.getTarget(request);
		const handleResult = (result) => {
			if (!(result instanceof Target)) throw new TypeError("getTarget must return a Target.");
			return result;
		};
		if (isThenable(result)) return result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	async _getTarget(request) {
		assert(this._target instanceof PathedTarget);
		const target = await this._getTargetValidated(request);
		this._emit("target", {
			target,
			request,
			isRoot: request.isRoot
		});
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_rememberTarget(target) {
		this._unfinalizedTargets.add(target);
		target.on("finalized", () => this._unfinalizedTargets.delete(target), { once: true });
	}
	/** @internal */
	async _getInitTarget() {
		assert(this._initTarget !== null);
		if (this._initTarget instanceof Target) return this._initTarget;
		const target = await this._initTarget();
		if (this.state === "canceled") await target._close();
		else this._rememberTarget(target);
		return target;
	}
	/** @internal */
	_hasInitTarget() {
		return this._initTarget !== null;
	}
	/** @internal */
	_getRootTarget() {
		if (this._rootTarget) return this._rootTarget;
		if (this._rootTargetPromise) return this._rootTargetPromise;
		if (this._target instanceof Target) {
			this._emit("target", {
				target: this._target,
				request: null,
				isRoot: true
			});
			this._rootTarget = this._target;
			return this._target;
		}
		const request = {
			path: this._target.rootPath,
			isRoot: true,
			mimeType: this.format.mimeType
		};
		const result = this._getTargetValidated(request);
		const handleResult = (target) => {
			if (this.state === "canceled") target._close();
			else this._rememberTarget(target);
			this._emit("target", {
				target,
				request,
				isRoot: true
			});
			this._rootTarget = target;
			return target;
		};
		if (isThenable(result)) return this._rootTargetPromise = result.then(handleResult);
		else return handleResult(result);
	}
	/** @internal */
	_getRootWriter(isMonotonic) {
		return this._rootWriterPromise ??= (async () => {
			const target = await this._getRootTarget();
			const writer = new Writer(target, typeof isMonotonic === "boolean" ? isMonotonic : isMonotonic(target));
			writer.start();
			return writer;
		})();
	}
	/** Adds a video track to the output with the given source. Can only be called before the output is started. */
	addVideoTrack(source, metadata = {}) {
		if (!(source instanceof VideoSource)) throw new TypeError("source must be a VideoSource.");
		validateBaseTrackMetadata(metadata);
		if (metadata.rotation !== void 0 && ![
			0,
			90,
			180,
			270
		].includes(metadata.rotation)) throw new TypeError(`Invalid video rotation: ${metadata.rotation}. Has to be 0, 90, 180 or 270.`);
		if (metadata.flip !== void 0 && typeof metadata.flip !== "boolean") throw new TypeError("metadata.flip, when provided, must be a boolean.");
		if (metadata.transformationMatrix !== void 0 && (!Array.isArray(metadata.transformationMatrix) || metadata.transformationMatrix.length !== 9 || !metadata.transformationMatrix.every((x) => Number.isFinite(x)))) throw new TypeError("metadata.transformationMatrix, when provided, must be an array of 9 finite numbers.");
		if (metadata.frameRate !== void 0 && (!Number.isFinite(metadata.frameRate) || metadata.frameRate <= 0)) throw new TypeError(`Invalid video frame rate: ${metadata.frameRate}. Must be a positive number.`);
		if (metadata.hasOnlyKeyPackets !== void 0 && typeof metadata.hasOnlyKeyPackets !== "boolean") throw new TypeError("metadata.hasOnlyKeyPackets, when provided, must be a boolean.");
		if (metadata.canBeTransparent !== void 0 && typeof metadata.canBeTransparent !== "boolean") throw new TypeError("metadata.canBeTransparent, when provided, must be a boolean.");
		if (metadata.decoderConfig !== void 0) validateVideoChunkMetadata({ decoderConfig: metadata.decoderConfig }, source._codec);
		if (metadata.primingPacket !== void 0) {
			if (!(metadata.primingPacket instanceof EncodedPacket)) throw new TypeError("metadata.primingPacket, when provided, must be an EncodedPacket.");
			if (metadata.decoderConfig === void 0) throw new TypeError("metadata.primingPacket can only be provided alongside metadata.decoderConfig.");
		}
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputVideoTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds an audio track to the output with the given source. Can only be called before the output is started. */
	addAudioTrack(source, metadata = {}) {
		if (!(source instanceof AudioSource)) throw new TypeError("source must be an AudioSource.");
		validateBaseTrackMetadata(metadata);
		if (metadata.decoderConfig !== void 0) validateAudioChunkMetadata({ decoderConfig: metadata.decoderConfig }, source._codec);
		if (metadata.primingPacket !== void 0) {
			if (!(metadata.primingPacket instanceof EncodedPacket)) throw new TypeError("metadata.primingPacket, when provided, must be an EncodedPacket.");
			if (metadata.decoderConfig === void 0) throw new TypeError("metadata.primingPacket can only be provided alongside metadata.decoderConfig.");
		}
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputAudioTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/** Adds a subtitle track to the output with the given source. Can only be called before the output is started. */
	addSubtitleTrack(source, metadata = {}) {
		if (!(source instanceof SubtitleSource)) throw new TypeError("source must be a SubtitleSource.");
		validateBaseTrackMetadata(metadata);
		const metadataCopy = { ...metadata };
		metadataCopy.group ??= this.defaultTrackGroup;
		return this._addTrack(new OutputSubtitleTrack(this.tracks.length + 1, this, source, metadataCopy));
	}
	/**
	* Sets descriptive metadata tags about the media file, such as title, author, date, or cover art. When called
	* multiple times, only the metadata from the last call will be used.
	*
	* Can only be called before the output is started.
	*/
	setMetadataTags(tags) {
		validateMetadataTags(tags);
		if (this.state !== "pending") throw new Error("Cannot set metadata tags after output has been started or canceled.");
		this._metadataTags = tags;
	}
	/** @internal */
	_addTrack(track) {
		if (this.state !== "pending") throw new Error("Cannot add track after output has been started or canceled.");
		if (track.source._connectedTrack) throw new Error("Source is already used for a track.");
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		const presentTracksOfThisType = this.tracks.reduce((count, t) => count + (t.type === track.type ? 1 : 0), 0);
		const maxCount = supportedTrackCounts[track.type].max;
		if (presentTracksOfThisType === maxCount) throw new Error(maxCount === 0 ? `${this.format._name} does not support ${track.type} tracks.` : `${this.format._name} does not support more than ${maxCount} ${track.type} track${maxCount === 1 ? "" : "s"}.`);
		const maxTotalCount = supportedTrackCounts.total.max;
		if (this.tracks.length === maxTotalCount) throw new Error(`${this.format._name} does not support more than ${maxTotalCount} tracks${maxTotalCount === 1 ? "" : "s"} in total.`);
		if (track.isVideoTrack()) {
			const supportedVideoCodecs = this.format.getSupportedVideoCodecs();
			if (supportedVideoCodecs.length === 0) throw new Error(`${this.format._name} does not support video tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedVideoCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported video codecs are: ${supportedVideoCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isAudioTrack()) {
			const supportedAudioCodecs = this.format.getSupportedAudioCodecs();
			if (supportedAudioCodecs.length === 0) throw new Error(`${this.format._name} does not support audio tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedAudioCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported audio codecs are: ${supportedAudioCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		} else if (track.isSubtitleTrack()) {
			const supportedSubtitleCodecs = this.format.getSupportedSubtitleCodecs();
			if (supportedSubtitleCodecs.length === 0) throw new Error(`${this.format._name} does not support subtitle tracks.` + this.format._codecUnsupportedHint(track.source._codec));
			else if (!supportedSubtitleCodecs.includes(track.source._codec)) throw new Error(`Codec '${track.source._codec}' cannot be contained within ${this.format._name}. Supported subtitle codecs are: ${supportedSubtitleCodecs.map((codec) => `'${codec}'`).join(", ")}.` + this.format._codecUnsupportedHint(track.source._codec));
		}
		this.tracks.push(track);
		track.source._connectedTrack = track;
		return track;
	}
	/**
	* Whether the output has enough tracks (of the correct type) to be started, based on the requirements of the output
	* format.
	*/
	hasEnoughTracks() {
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		for (const trackType of ALL_TRACK_TYPES) if (this.tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0) < supportedTrackCounts[trackType].min) return false;
		const totalMinCount = supportedTrackCounts.total.min;
		if (this.tracks.length < totalMinCount) return false;
		return true;
	}
	/**
	* Starts the creation of the output file. This method should be called after all tracks have been added. Only after
	* the output has started can media samples be added to the tracks.
	*
	* @returns A promise that resolves when the output has successfully started and is ready to receive media samples.
	*/
	async start() {
		const supportedTrackCounts = this.format.getSupportedTrackCounts();
		for (const trackType of ALL_TRACK_TYPES) {
			const presentTracksOfThisType = this.tracks.reduce((count, track) => count + (track.type === trackType ? 1 : 0), 0);
			const minCount = supportedTrackCounts[trackType].min;
			if (presentTracksOfThisType < minCount) throw new Error(minCount === supportedTrackCounts[trackType].max ? `${this.format._name} requires exactly ${minCount} ${trackType} track${minCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${minCount} ${trackType} track${minCount === 1 ? "" : "s"}.`);
		}
		const totalMinCount = supportedTrackCounts.total.min;
		if (this.tracks.length < totalMinCount) throw new Error(totalMinCount === supportedTrackCounts.total.max ? `${this.format._name} requires exactly ${totalMinCount} track${totalMinCount === 1 ? "" : "s"}.` : `${this.format._name} requires at least ${totalMinCount} track${totalMinCount === 1 ? "" : "s"}.`);
		if (this.state === "canceled") throw new Error("Output has been canceled.");
		if (this._startPromise) {
			Logging._warn("Output has already been started.");
			return this._startPromise;
		}
		return this._startPromise = (async () => {
			this.state = "started";
			const releasePromise = this._mutex.acquire();
			try {
				await this._muxer.start();
				const promises = this.tracks.map((track) => track.source._start());
				await Promise.all(promises);
			} finally {
				(await releasePromise)();
			}
		})();
	}
	/**
	* Resolves with the full MIME type of the output file, including track codecs.
	*
	* The returned promise will resolve only once the precise codec strings of all tracks are known.
	*/
	getMimeType() {
		return this._muxer.getMimeType();
	}
	/**
	* Cancels the creation of the output file, releasing internal resources like encoders and preventing further
	* samples from being added.
	*
	* @returns A promise that resolves once all internal resources have been released.
	*/
	async cancel() {
		if (this.state === "canceled") return this._cancelPromise ?? void 0;
		else if (this.state === "finalizing" || this.state === "finalized") {
			if (this.state === "finalized") Logging._warn("Output has already been finalized.");
			return;
		}
		return this._cancelPromise = (async () => {
			this.state = "canceled";
			const release = await this._mutex.acquire();
			try {
				const promises = this.tracks.map((x) => x.source._flushOrWaitForOngoingClose(true));
				await Promise.all(promises);
				await Promise.all([...this._unfinalizedTargets].map((target) => target._close()));
				this._unfinalizedTargets.clear();
			} finally {
				release();
			}
		})();
	}
	/**
	* Finalizes the output file. This method must be called after all media samples across all tracks have been added.
	* Once the Promise returned by this method completes, the output file is ready.
	*/
	async finalize() {
		if (this.state === "pending") throw new Error("Cannot finalize before starting.");
		if (this.state === "canceled") throw new Error("Cannot finalize after canceling.");
		if (this._finalizePromise) {
			Logging._warn("Output has already been finalized.");
			return this._finalizePromise;
		}
		return this._finalizePromise = (async () => {
			this.state = "finalizing";
			const release = await this._mutex.acquire();
			try {
				const promises = this.tracks.map((x) => x.source._flushOrWaitForOngoingClose(false));
				await Promise.all(promises);
				await this._muxer.finalize();
				if (this._rootWriterPromise) {
					const rootWriter = await this._rootWriterPromise;
					if (!rootWriter.finalized) {
						await rootWriter.flush();
						await rootWriter.finalize();
					}
				}
				if (this._onFinalize) await this._onFinalize();
				this.state = "finalized";
			} catch (error) {
				this.state = "canceled";
				throw error;
			} finally {
				await Promise.all([...this._unfinalizedTargets].map((target) => target._close().catch(() => {})));
				this._unfinalizedTargets.clear();
				release();
			}
		})();
	}
};
//#endregion
//#region node_modules/mediabunny/dist/modules/src/index.js
var src_exports = /* @__PURE__ */ __exportAll({
	AudioBufferSource: () => AudioBufferSource,
	BufferTarget: () => BufferTarget,
	CanvasSource: () => CanvasSource,
	Mp4OutputFormat: () => Mp4OutputFormat,
	Output: () => Output,
	Quality: () => Quality
});
/*!
* Copyright (c) 2026-present, Vanilagy and contributors
*
* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at https://mozilla.org/MPL/2.0/.
*/
//#endregion
export { src_exports as t };
