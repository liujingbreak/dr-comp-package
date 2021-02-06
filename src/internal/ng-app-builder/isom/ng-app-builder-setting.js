"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = exports.defaultSetting = void 0;
const plink_1 = require("@wfh/plink");
/**
 * Plink runs this funtion to get package level setting value
 */
function defaultSetting() {
    const defaultValue = {
        useThread: false,
        ng8Compliant: true,
        logChangedTsFile: false
    };
    return defaultValue;
}
exports.defaultSetting = defaultSetting;
/**
 * The return setting value is merged with files specified by command line options "--prop" and "-c"
 * @return setting of current package
 */
function getSetting() {
    // tslint:disable:no-string-literal
    return plink_1.config()['@wfh/ng-app-builder'];
}
exports.getSetting = getSetting;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmctYXBwLWJ1aWxkZXItc2V0dGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5nLWFwcC1idWlsZGVyLXNldHRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsc0NBQWtDO0FBY2xDOztHQUVHO0FBQ0gsU0FBZ0IsY0FBYztJQUM1QixNQUFNLFlBQVksR0FBd0I7UUFDeEMsU0FBUyxFQUFFLEtBQUs7UUFDaEIsWUFBWSxFQUFFLElBQUk7UUFDbEIsZ0JBQWdCLEVBQUUsS0FBSztLQUN4QixDQUFDO0lBRUYsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQVJELHdDQVFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBZ0IsVUFBVTtJQUN4QixtQ0FBbUM7SUFDbkMsT0FBTyxjQUFNLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxDQUFDO0FBQzFDLENBQUM7QUFIRCxnQ0FHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Y29uZmlnfSBmcm9tICdAd2ZoL3BsaW5rJztcblxuLyoqXG4gKiBQYWNrYWdlIHNldHRpbmcgdHlwZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE5nQXBwQnVpbGRlclNldHRpbmcge1xuICAvKiogRGVzY3JpcHRpb24gb2YgY29uZmlnIHByb3BlcnR5ICovXG4gIC8vIHRzY29uZmlnSW5jbHVkZTogc3RyaW5nO1xuICB1c2VUaHJlYWQ6IGJvb2xlYW47XG4gIG5nOENvbXBsaWFudDogYm9vbGVhbjtcbiAgLyoqIEZvciBkZWJ1ZyBwdXJwb3NlLCBsb2cgY2hhbmdlZCBUUyBmaWxlIGNvbnRlbnQgKi9cbiAgbG9nQ2hhbmdlZFRzRmlsZTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBQbGluayBydW5zIHRoaXMgZnVudGlvbiB0byBnZXQgcGFja2FnZSBsZXZlbCBzZXR0aW5nIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWZhdWx0U2V0dGluZygpOiBOZ0FwcEJ1aWxkZXJTZXR0aW5nIHtcbiAgY29uc3QgZGVmYXVsdFZhbHVlOiBOZ0FwcEJ1aWxkZXJTZXR0aW5nID0ge1xuICAgIHVzZVRocmVhZDogZmFsc2UsXG4gICAgbmc4Q29tcGxpYW50OiB0cnVlLFxuICAgIGxvZ0NoYW5nZWRUc0ZpbGU6IGZhbHNlXG4gIH07XG5cbiAgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgcmV0dXJuIHNldHRpbmcgdmFsdWUgaXMgbWVyZ2VkIHdpdGggZmlsZXMgc3BlY2lmaWVkIGJ5IGNvbW1hbmQgbGluZSBvcHRpb25zIFwiLS1wcm9wXCIgYW5kIFwiLWNcIlxuICogQHJldHVybiBzZXR0aW5nIG9mIGN1cnJlbnQgcGFja2FnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U2V0dGluZygpOiBOZ0FwcEJ1aWxkZXJTZXR0aW5nIHtcbiAgLy8gdHNsaW50OmRpc2FibGU6bm8tc3RyaW5nLWxpdGVyYWxcbiAgcmV0dXJuIGNvbmZpZygpWydAd2ZoL25nLWFwcC1idWlsZGVyJ10hO1xufVxuIl19