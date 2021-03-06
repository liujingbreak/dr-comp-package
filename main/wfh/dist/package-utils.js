"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPackageByType = exports.findPackageJsonPath = exports.findAllPackages = exports.lookForPackages = exports.createLazyPackageFileFinder = exports.packages4Workspace = exports.packages4WorkspaceKey = exports.allPackages = void 0;
const lru_cache_1 = __importDefault(require("lru-cache"));
const lazy_package_factory_1 = __importDefault(require("./package-mgr/lazy-package-factory"));
const package_mgr_1 = require("./package-mgr");
// import * as Path from 'path';
const lodash_1 = __importDefault(require("lodash"));
// import log4js from 'log4js';
// import * as fs from 'fs';
const utils_1 = require("./cmd/utils");
Object.defineProperty(exports, "findPackageJsonPath", { enumerable: true, get: function () { return utils_1.lookupPackageJson; } });
const misc_1 = require("./utils/misc");
const path_1 = __importDefault(require("path"));
const package_list_helper_1 = require("./package-mgr/package-list-helper");
Object.defineProperty(exports, "allPackages", { enumerable: true, get: function () { return package_list_helper_1.allPackages; } });
Object.defineProperty(exports, "packages4WorkspaceKey", { enumerable: true, get: function () { return package_list_helper_1.packages4WorkspaceKey; } });
Object.defineProperty(exports, "packages4Workspace", { enumerable: true, get: function () { return package_list_helper_1.packages4Workspace; } });
// const log = log4js.getLogger('plink.package-utils');
const lazyPackageFactory = new lazy_package_factory_1.default(package_list_helper_1.allPackages());
function createLazyPackageFileFinder() {
    const cache = new lru_cache_1.default({ max: 20, maxAge: 20000 });
    return function (file) {
        let found = cache.get(file);
        if (!found) {
            found = lazyPackageFactory.getPackageByPath(file);
            if (found)
                cache.set(file, found);
        }
        return found;
    };
}
exports.createLazyPackageFileFinder = createLazyPackageFileFinder;
function lookForPackages(packageList, cb) {
    for (const pkg of utils_1.findPackagesByNames(package_mgr_1.getState(), Array.isArray(packageList) ? packageList : [packageList])) {
        if (pkg == null)
            continue;
        cb(pkg.name, path_1.default.join(misc_1.plinkEnv.workDir, pkg.path), { name: pkg.shortName, scope: pkg.scope }, pkg.json, pkg.realPath, pkg.isInstalled);
    }
}
exports.lookForPackages = lookForPackages;
function findAllPackages(packageList, callback, recipeType, projectDir) {
    // oldPu.findAllPackages.apply(oldPu, arguments);
    if (lodash_1.default.isFunction(callback) && packageList) {
        lookForPackages([].concat(packageList), callback);
        return;
    }
    else if (lodash_1.default.isFunction(packageList)) {
        // arguments.length <= 2
        projectDir = recipeType;
        recipeType = callback;
        callback = packageList;
    }
    return findPackageByType('*', callback, recipeType, projectDir);
}
exports.findAllPackages = findAllPackages;
function findPackageByType(_types, callback, recipeType, projectDir) {
    const arr = Array.isArray(projectDir) ? projectDir : projectDir == null ? projectDir : [projectDir];
    for (const pkg of package_list_helper_1.allPackages(_types, recipeType, arr)) {
        callback(pkg.name, path_1.default.join(misc_1.plinkEnv.workDir, pkg.path), { scope: pkg.scope, name: pkg.shortName }, pkg.json, pkg.realPath, pkg.isInstalled);
    }
}
exports.findPackageByType = findPackageByType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFja2FnZS11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3RzL3BhY2thZ2UtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsMERBQTRCO0FBRTVCLDhGQUFvRTtBQUNwRSwrQ0FBdUM7QUFDdkMsZ0NBQWdDO0FBQ2hDLG9EQUF1QjtBQUN2QiwrQkFBK0I7QUFDL0IsNEJBQTRCO0FBQzVCLHVDQUFtRTtBQXVFdEMsb0dBdkVyQix5QkFBaUIsT0F1RXVCO0FBdEVoRCx1Q0FBc0M7QUFDdEMsZ0RBQXdCO0FBQ3hCLDJFQUFzSDtBQUNqRyw0RkFEQSxpQ0FBVyxPQUNBO0FBQUUsc0dBREEsMkNBQXFCLE9BQ0E7QUFBRSxtR0FEQSx3Q0FBa0IsT0FDQTtBQUUzRSx1REFBdUQ7QUFFdkQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLDhCQUFrQixDQUFDLGlDQUFXLEVBQUUsQ0FBQyxDQUFDO0FBRWpFLFNBQWdCLDJCQUEyQjtJQUN6QyxNQUFNLEtBQUssR0FBRyxJQUFJLG1CQUFHLENBQTBCLEVBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztJQUV6RSxPQUFPLFVBQVMsSUFBWTtRQUMxQixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDVixLQUFLLEdBQUcsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFFLENBQUM7WUFDbkQsSUFBSSxLQUFLO2dCQUNQLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzFCO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLENBQUM7QUFDSixDQUFDO0FBWkQsa0VBWUM7QUFVRCxTQUFnQixlQUFlLENBQUMsV0FBOEIsRUFBRSxFQUFpQjtJQUMvRSxLQUFLLE1BQU0sR0FBRyxJQUFJLDJCQUFtQixDQUFDLHNCQUFRLEVBQUUsRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRTtRQUMzRyxJQUFJLEdBQUcsSUFBSSxJQUFJO1lBQ2IsU0FBUztRQUNYLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLGNBQUksQ0FBQyxJQUFJLENBQUMsZUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBQyxFQUN6RixHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzVDO0FBQ0gsQ0FBQztBQVBELDBDQU9DO0FBV0QsU0FBZ0IsZUFBZSxDQUFDLFdBQThDLEVBQzVFLFFBQThDLEVBQzlDLFVBQThCLEVBQzlCLFVBQThCO0lBQzlCLGlEQUFpRDtJQUVqRCxJQUFJLGdCQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFdBQVcsRUFBRTtRQUN6QyxlQUFlLENBQUUsRUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFrQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkYsT0FBTztLQUNSO1NBQU0sSUFBSSxnQkFBQyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRTtRQUNwQyx3QkFBd0I7UUFDeEIsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUN4QixVQUFVLEdBQUcsUUFBK0IsQ0FBQztRQUM3QyxRQUFRLEdBQUcsV0FBVyxDQUFDO0tBQ3hCO0lBQ0QsT0FBTyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsUUFBeUIsRUFBRSxVQUFpQyxFQUN4RixVQUFVLENBQUMsQ0FBQztBQUNoQixDQUFDO0FBakJELDBDQWlCQztBQU1ELFNBQWdCLGlCQUFpQixDQUFDLE1BQW1DLEVBQ25FLFFBQXVCLEVBQUUsVUFBZ0MsRUFBRSxVQUE4QjtJQUV6RixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNwRyxLQUFLLE1BQU0sR0FBRyxJQUFJLGlDQUFXLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsRUFBRTtRQUN0RCxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLGVBQVEsQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUN0RCxFQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxFQUFDLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNyRjtBQUNILENBQUM7QUFSRCw4Q0FRQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBMUlUgZnJvbSAnbHJ1LWNhY2hlJztcbmltcG9ydCBQYWNrYWdlSW5zdGFuY2UgZnJvbSAnLi9wYWNrYWdlTm9kZUluc3RhbmNlJztcbmltcG9ydCBMYXp5UGFja2FnZUZhY3RvcnkgZnJvbSAnLi9wYWNrYWdlLW1nci9sYXp5LXBhY2thZ2UtZmFjdG9yeSc7XG5pbXBvcnQge2dldFN0YXRlfSBmcm9tICcuL3BhY2thZ2UtbWdyJztcbi8vIGltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuLy8gaW1wb3J0IGxvZzRqcyBmcm9tICdsb2c0anMnO1xuLy8gaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHtsb29rdXBQYWNrYWdlSnNvbiwgZmluZFBhY2thZ2VzQnlOYW1lc30gZnJvbSAnLi9jbWQvdXRpbHMnO1xuaW1wb3J0IHtwbGlua0Vudn0gZnJvbSAnLi91dGlscy9taXNjJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtQYWNrYWdlVHlwZSwgYWxsUGFja2FnZXMsIHBhY2thZ2VzNFdvcmtzcGFjZUtleSwgcGFja2FnZXM0V29ya3NwYWNlfSBmcm9tICcuL3BhY2thZ2UtbWdyL3BhY2thZ2UtbGlzdC1oZWxwZXInO1xuZXhwb3J0IHtQYWNrYWdlVHlwZSwgYWxsUGFja2FnZXMsIHBhY2thZ2VzNFdvcmtzcGFjZUtleSwgcGFja2FnZXM0V29ya3NwYWNlfTtcblxuLy8gY29uc3QgbG9nID0gbG9nNGpzLmdldExvZ2dlcigncGxpbmsucGFja2FnZS11dGlscycpO1xuXG5jb25zdCBsYXp5UGFja2FnZUZhY3RvcnkgPSBuZXcgTGF6eVBhY2thZ2VGYWN0b3J5KGFsbFBhY2thZ2VzKCkpO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTGF6eVBhY2thZ2VGaWxlRmluZGVyKCkge1xuICBjb25zdCBjYWNoZSA9IG5ldyBMUlU8c3RyaW5nLCBQYWNrYWdlSW5zdGFuY2U+KHttYXg6IDIwLCBtYXhBZ2U6IDIwMDAwfSk7XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGZpbGU6IHN0cmluZyk6IFBhY2thZ2VJbnN0YW5jZSB8IHVuZGVmaW5lZCB7XG4gICAgbGV0IGZvdW5kID0gY2FjaGUuZ2V0KGZpbGUpO1xuICAgIGlmICghZm91bmQpIHtcbiAgICAgIGZvdW5kID0gbGF6eVBhY2thZ2VGYWN0b3J5LmdldFBhY2thZ2VCeVBhdGgoZmlsZSkhO1xuICAgICAgaWYgKGZvdW5kKVxuICAgICAgICBjYWNoZS5zZXQoZmlsZSwgZm91bmQpO1xuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH07XG59XG5cbmV4cG9ydCB0eXBlIEZpbmRQYWNrYWdlQ2IgPSAoZnVsbE5hbWU6IHN0cmluZyxcbiAgLyoqIEBEZXByZWNhdGVkIGVtcHR5IHN0cmluZyAqL1xuICBwYWNrYWdlUGF0aDogc3RyaW5nLFxuICBwYXJzZWROYW1lOiB7bmFtZTogc3RyaW5nLCBzY29wZTogc3RyaW5nfSxcbiAganNvbjogYW55LFxuICByZWFsUGFja2FnZVBhdGg6IHN0cmluZyxcbiAgaXNJbnN0YWxsZWQ6IGJvb2xlYW4pID0+IHZvaWQ7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb29rRm9yUGFja2FnZXMocGFja2FnZUxpc3Q6IHN0cmluZ1tdIHwgc3RyaW5nLCBjYjogRmluZFBhY2thZ2VDYik6IHZvaWQge1xuICBmb3IgKGNvbnN0IHBrZyBvZiBmaW5kUGFja2FnZXNCeU5hbWVzKGdldFN0YXRlKCksIEFycmF5LmlzQXJyYXkocGFja2FnZUxpc3QpID8gcGFja2FnZUxpc3QgOiBbcGFja2FnZUxpc3RdKSkge1xuICAgIGlmIChwa2cgPT0gbnVsbClcbiAgICAgIGNvbnRpbnVlO1xuICAgIGNiKHBrZy5uYW1lLCBwYXRoLmpvaW4ocGxpbmtFbnYud29ya0RpciwgcGtnLnBhdGgpLCB7bmFtZTogcGtnLnNob3J0TmFtZSwgc2NvcGU6IHBrZy5zY29wZX0sXG4gICAgICBwa2cuanNvbiwgcGtnLnJlYWxQYXRoLCBwa2cuaXNJbnN0YWxsZWQpO1xuICB9XG59XG5cbi8vIGV4cG9ydCB0eXBlIFBhY2thZ2VUeXBlID0gJyonIHwgJ2J1aWxkJyB8ICdjb3JlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGxQYWNrYWdlcyhjYWxsYmFjazogRmluZFBhY2thZ2VDYixcbiAgcmVjaXBlVHlwZT86ICdzcmMnIHwgJ2luc3RhbGxlZCcsXG4gIHByb2plY3REaXI/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZmluZEFsbFBhY2thZ2VzKHBhY2thZ2VMaXN0OiBzdHJpbmdbXSB8IHN0cmluZyxcbiAgY2FsbGJhY2s6IEZpbmRQYWNrYWdlQ2IsXG4gIHJlY2lwZVR5cGU/OiAnc3JjJyB8ICdpbnN0YWxsZWQnLFxuICBwcm9qZWN0RGlyPzogc3RyaW5nIHwgc3RyaW5nW10pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGZpbmRBbGxQYWNrYWdlcyhwYWNrYWdlTGlzdDogc3RyaW5nW10gfCBzdHJpbmcgfCBGaW5kUGFja2FnZUNiLFxuICBjYWxsYmFjaz86IEZpbmRQYWNrYWdlQ2IgfCAnc3JjJyB8ICdpbnN0YWxsZWQnLFxuICByZWNpcGVUeXBlPzogc3RyaW5nIHwgc3RyaW5nW10sXG4gIHByb2plY3REaXI/OiBzdHJpbmcgfCBzdHJpbmdbXSkge1xuICAvLyBvbGRQdS5maW5kQWxsUGFja2FnZXMuYXBwbHkob2xkUHUsIGFyZ3VtZW50cyk7XG5cbiAgaWYgKF8uaXNGdW5jdGlvbihjYWxsYmFjaykgJiYgcGFja2FnZUxpc3QpIHtcbiAgICBsb29rRm9yUGFja2FnZXMoKFtdIGFzIHN0cmluZ1tdKS5jb25jYXQocGFja2FnZUxpc3QgYXMgKHN0cmluZ1tdIHwgc3RyaW5nKSksIGNhbGxiYWNrKTtcbiAgICByZXR1cm47XG4gIH0gZWxzZSBpZiAoXy5pc0Z1bmN0aW9uKHBhY2thZ2VMaXN0KSkge1xuICAgIC8vIGFyZ3VtZW50cy5sZW5ndGggPD0gMlxuICAgIHByb2plY3REaXIgPSByZWNpcGVUeXBlO1xuICAgIHJlY2lwZVR5cGUgPSBjYWxsYmFjayBhcyAnc3JjJyB8ICdpbnN0YWxsZWQnO1xuICAgIGNhbGxiYWNrID0gcGFja2FnZUxpc3Q7XG4gIH1cbiAgcmV0dXJuIGZpbmRQYWNrYWdlQnlUeXBlKCcqJywgY2FsbGJhY2sgYXMgRmluZFBhY2thZ2VDYiwgcmVjaXBlVHlwZSBhcyAnc3JjJyB8ICdpbnN0YWxsZWQnLFxuICAgIHByb2plY3REaXIpO1xufVxuXG4vLyBleHBvcnQge2VhY2hSZWNpcGV9IGZyb20gJy4vcmVjaXBlLW1hbmFnZXInO1xuXG5leHBvcnQge2xvb2t1cFBhY2thZ2VKc29uIGFzIGZpbmRQYWNrYWdlSnNvblBhdGh9O1xuXG5leHBvcnQgZnVuY3Rpb24gZmluZFBhY2thZ2VCeVR5cGUoX3R5cGVzOiBQYWNrYWdlVHlwZSB8IFBhY2thZ2VUeXBlW10sXG4gIGNhbGxiYWNrOiBGaW5kUGFja2FnZUNiLCByZWNpcGVUeXBlPzogJ3NyYycgfCAnaW5zdGFsbGVkJywgcHJvamVjdERpcj86IHN0cmluZ1tdIHwgc3RyaW5nKSB7XG5cbiAgY29uc3QgYXJyID0gQXJyYXkuaXNBcnJheShwcm9qZWN0RGlyKSA/IHByb2plY3REaXIgOiBwcm9qZWN0RGlyID09IG51bGwgPyBwcm9qZWN0RGlyIDogW3Byb2plY3REaXJdO1xuICBmb3IgKGNvbnN0IHBrZyBvZiBhbGxQYWNrYWdlcyhfdHlwZXMsIHJlY2lwZVR5cGUsIGFycikpIHtcbiAgICBjYWxsYmFjayhwa2cubmFtZSwgcGF0aC5qb2luKHBsaW5rRW52LndvcmtEaXIsIHBrZy5wYXRoKSxcbiAgICAgIHtzY29wZTogcGtnLnNjb3BlLCBuYW1lOiBwa2cuc2hvcnROYW1lfSwgcGtnLmpzb24sIHBrZy5yZWFsUGF0aCwgcGtnLmlzSW5zdGFsbGVkKTtcbiAgfVxufVxuXG4iXX0=