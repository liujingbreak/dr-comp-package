"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createZipRoute = exports.createStaticRoute = void 0;
const serve_static_zip_1 = __importDefault(require("serve-static-zip"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const express_1 = __importDefault(require("express"));
const ms = require('ms');
function createStaticRoute(staticDir, maxAgeMap = {}) {
    let maxAgeNumMap = parseMaxAgeMap(maxAgeMap);
    return express_1.default.static(staticDir, {
        setHeaders: createSetHeaderFunc(maxAgeNumMap),
        redirect: false
    });
}
exports.createStaticRoute = createStaticRoute;
function createZipRoute(maxAgeMap = {}) {
    const maxAgeNumMap = parseMaxAgeMap(maxAgeMap);
    const zss = serve_static_zip_1.default('', { setHeaders: createSetHeaderFunc(maxAgeNumMap) });
    return zss;
}
exports.createZipRoute = createZipRoute;
function createSetHeaderFunc(maxAgeNumMap) {
    return (res, path, entry) => {
        var ext = path_1.default.extname(path).toLowerCase();
        if (ext.startsWith('.'))
            ext = ext.substring(1);
        if (lodash_1.default.has(maxAgeNumMap, ext))
            setCacheControlHeader(res, maxAgeNumMap[ext]);
        else
            res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Allow-Origin', '*');
    };
}
function setCacheControlHeader(res, _maxage = 0, immutable = false) {
    if (_maxage == null) {
        res.setHeader('Cache-Control', 'no-cache');
        return;
    }
    var cacheControl = 'public, max-age=' + Math.floor(_maxage / 1000);
    if (immutable) {
        cacheControl += ', immutable';
    }
    res.setHeader('Cache-Control', cacheControl);
}
function parseMaxAgeMap(maxAgeMap) {
    let maxAgeNumMap = {};
    if (maxAgeMap) {
        Object.keys(maxAgeMap).forEach(key => {
            const value = maxAgeMap[key];
            maxAgeNumMap[key] = typeof value === 'string' ? ms(value) : value;
        });
    }
    else {
        maxAgeNumMap = {};
    }
    return maxAgeNumMap;
}

//# sourceMappingURL=static-middleware.js.map
