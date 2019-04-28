"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const serve_static_zip_1 = tslib_1.__importDefault(require("serve-static-zip"));
const path_1 = tslib_1.__importDefault(require("path"));
const __api_1 = tslib_1.__importDefault(require("__api"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const ms = require('ms');
function createStaticRoute(staticDir, maxAgeMap) {
    let maxAgeNumMap = parseMaxAgeMap(maxAgeMap);
    return __api_1.default.express.static(staticDir, { setHeaders: createSetHeaderFunc(maxAgeNumMap) });
}
exports.createStaticRoute = createStaticRoute;
function createZipRoute(maxAgeMap) {
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
            res.setHeader('Cache-Control', 'no-store');
        // res.setHeader('Access-Control-Allow-Origin', '*');
    };
}
function setCacheControlHeader(res, _maxage = 0, immutable = false) {
    if (_maxage == null) {
        res.setHeader('Cache-Control', 'no-store');
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9hc3NldHMtcHJvY2Vzc2VyL3RzL3N0YXRpYy1taWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGdGQUF3QztBQUV4Qyx3REFBd0I7QUFDeEIsMERBQXdCO0FBQ3hCLDREQUF1QjtBQUV2QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFFekIsU0FBZ0IsaUJBQWlCLENBQUMsU0FBaUIsRUFBRSxTQUFnRDtJQUNwRyxJQUFJLFlBQVksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDN0MsT0FBTyxlQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsRUFBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ3ZGLENBQUM7QUFIRCw4Q0FHQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxTQUF1QztJQUVyRSxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDL0MsTUFBTSxHQUFHLEdBQUcsMEJBQVEsQ0FBQyxFQUFFLEVBQUUsRUFBQyxVQUFVLEVBQUUsbUJBQW1CLENBQUMsWUFBWSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQUxELHdDQUtDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxZQUF5QztJQUNyRSxPQUFPLENBQUMsR0FBYSxFQUFFLElBQVksRUFBRSxLQUFVLEVBQUUsRUFBRTtRQUNsRCxJQUFJLEdBQUcsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQzNDLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7WUFDdEIsR0FBRyxHQUFHLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsSUFBSSxnQkFBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDO1lBQzNCLHFCQUFxQixDQUFDLEdBQUcsRUFBRSxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzs7WUFFOUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDNUMscURBQXFEO0lBQ3RELENBQUMsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLHFCQUFxQixDQUFDLEdBQWEsRUFBRSxVQUF5QixDQUFDLEVBQUUsU0FBUyxHQUFHLEtBQUs7SUFDMUYsSUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO1FBQ3BCLEdBQUcsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzNDLE9BQU87S0FDUDtJQUNELElBQUksWUFBWSxHQUFHLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ25FLElBQUksU0FBUyxFQUFFO1FBQ2QsWUFBWSxJQUFJLGFBQWEsQ0FBQztLQUM5QjtJQUNELEdBQUcsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLGNBQWMsQ0FBQyxTQUErQztJQUN0RSxJQUFJLFlBQVksR0FBZ0MsRUFBRSxDQUFDO0lBQ25ELElBQUksU0FBUyxFQUFFO1FBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDcEMsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLEtBQUssS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQ25FLENBQUMsQ0FBQyxDQUFDO0tBQ0g7U0FBTTtRQUNOLFlBQVksR0FBRyxFQUFFLENBQUM7S0FDbEI7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUNyQixDQUFDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AZHItY29yZS9hc3NldHMtcHJvY2Vzc2VyL2Rpc3Qvc3RhdGljLW1pZGRsZXdhcmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgc2VydmVaaXAgZnJvbSAnc2VydmUtc3RhdGljLXppcCc7XG5pbXBvcnQge1Jlc3BvbnNlLCBIYW5kbGVyfSBmcm9tICdleHByZXNzJztcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGFwaSBmcm9tICdfX2FwaSc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuXG5jb25zdCBtcyA9IHJlcXVpcmUoJ21zJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdGF0aWNSb3V0ZShzdGF0aWNEaXI6IHN0cmluZywgbWF4QWdlTWFwPzoge1tleHRuYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9KTogSGFuZGxlciB7XG5cdGxldCBtYXhBZ2VOdW1NYXAgPSBwYXJzZU1heEFnZU1hcChtYXhBZ2VNYXApO1xuXHRyZXR1cm4gYXBpLmV4cHJlc3Muc3RhdGljKHN0YXRpY0Rpciwge3NldEhlYWRlcnM6IGNyZWF0ZVNldEhlYWRlckZ1bmMobWF4QWdlTnVtTWFwKX0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlWmlwUm91dGUobWF4QWdlTWFwPzoge1tleHRuYW1lOiBzdHJpbmddOiBzdHJpbmd9KTpcbnNlcnZlWmlwLlppcFJlc291cmNlTWlkZGxld2FyZSB7XG5cdGNvbnN0IG1heEFnZU51bU1hcCA9IHBhcnNlTWF4QWdlTWFwKG1heEFnZU1hcCk7XG5cdGNvbnN0IHpzcyA9IHNlcnZlWmlwKCcnLCB7c2V0SGVhZGVyczogY3JlYXRlU2V0SGVhZGVyRnVuYyhtYXhBZ2VOdW1NYXApfSk7XG5cdHJldHVybiB6c3M7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNldEhlYWRlckZ1bmMobWF4QWdlTnVtTWFwOiB7W2V4dG5hbWU6IHN0cmluZ106IG51bWJlcn0pIHtcblx0cmV0dXJuIChyZXM6IFJlc3BvbnNlLCBwYXRoOiBzdHJpbmcsIGVudHJ5OiBhbnkpID0+IHtcblx0XHR2YXIgZXh0ID0gUGF0aC5leHRuYW1lKHBhdGgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKGV4dC5zdGFydHNXaXRoKCcuJykpXG5cdFx0XHRleHQgPSBleHQuc3Vic3RyaW5nKDEpO1xuXHRcdGlmIChfLmhhcyhtYXhBZ2VOdW1NYXAsIGV4dCkpXG5cdFx0XHRzZXRDYWNoZUNvbnRyb2xIZWFkZXIocmVzLCBtYXhBZ2VOdW1NYXBbZXh0XSk7XG5cdFx0ZWxzZVxuXHRcdFx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsICduby1zdG9yZScpO1xuXHRcdC8vIHJlcy5zZXRIZWFkZXIoJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbicsICcqJyk7XG5cdH07XG59XG5cbmZ1bmN0aW9uIHNldENhY2hlQ29udHJvbEhlYWRlcihyZXM6IFJlc3BvbnNlLCBfbWF4YWdlOiBudW1iZXIgfCBudWxsID0gMCwgaW1tdXRhYmxlID0gZmFsc2UpIHtcblx0aWYgKF9tYXhhZ2UgPT0gbnVsbCkge1xuXHRcdHJlcy5zZXRIZWFkZXIoJ0NhY2hlLUNvbnRyb2wnLCAnbm8tc3RvcmUnKTtcblx0XHRyZXR1cm47XG5cdH1cblx0dmFyIGNhY2hlQ29udHJvbCA9ICdwdWJsaWMsIG1heC1hZ2U9JyArIE1hdGguZmxvb3IoX21heGFnZSAvIDEwMDApO1xuXHRpZiAoaW1tdXRhYmxlKSB7XG5cdFx0Y2FjaGVDb250cm9sICs9ICcsIGltbXV0YWJsZSc7XG5cdH1cblx0cmVzLnNldEhlYWRlcignQ2FjaGUtQ29udHJvbCcsIGNhY2hlQ29udHJvbCk7XG59XG5cbmZ1bmN0aW9uIHBhcnNlTWF4QWdlTWFwKG1heEFnZU1hcDoge1tleHRuYW1lOiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXJ9KSB7XG5cdGxldCBtYXhBZ2VOdW1NYXA6IHtbZXh0bmFtZTogc3RyaW5nXTogbnVtYmVyfSA9IHt9O1xuXHRpZiAobWF4QWdlTWFwKSB7XG5cdFx0T2JqZWN0LmtleXMobWF4QWdlTWFwKS5mb3JFYWNoKGtleSA9PiB7XG5cdFx0XHRjb25zdCB2YWx1ZSA9IG1heEFnZU1hcFtrZXldO1xuXHRcdFx0bWF4QWdlTnVtTWFwW2tleV0gPSB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnID8gbXModmFsdWUpIDogdmFsdWU7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0bWF4QWdlTnVtTWFwID0ge307XG5cdH1cblx0cmV0dXJuIG1heEFnZU51bU1hcDtcbn1cbiJdfQ==
