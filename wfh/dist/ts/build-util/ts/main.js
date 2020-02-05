"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const package_instance_1 = __importDefault(require("./package-instance"));
const _ = __importStar(require("lodash"));
const bResolve = require('browser-resolve');
const resolve = require('resolve');
// var chalk = require('chalk');
const log = require('log4js').getLogger('buildUtil.' + Path.basename(__filename, '.js'));
const dir_tree_1 = require("require-injector/dist/dir-tree");
const package_instance_2 = __importDefault(require("./package-instance"));
exports.PackageBrowserInstance = package_instance_2.default;
let packageInfo;
// var packageInfoCacheFile, isFromCache;
/**
 * walkPackages
 * @param {*} config
 * @param {*} argv
 * @param {*} packageUtils
 * @param {*} ignoreCache
 * @return {PackageInfo}
 */
function walkPackages(config, packageUtils) {
    if (packageInfo)
        return packageInfo;
    log.info('scan for packages info');
    packageInfo = _walkPackages(packageUtils, config);
    createPackageDirTree(packageInfo);
    return packageInfo;
}
exports.walkPackages = walkPackages;
function listBundleInfo(_config, _packageUtils) {
    _config.set('bundlePerPackage', false);
    const packageInfo = walkPackages(_config, _packageUtils);
    saveCache(packageInfo, _config);
    return packageInfo;
}
exports.listBundleInfo = listBundleInfo;
function saveCache(packageInfo, config) {
    // if (isFromCache)
    // 	return;
    // mkdirp.sync(Path.join(config().rootPath, config().destDir));
    // fs.writeFileSync(packageInfoCacheFile, JSON.stringify(cycle.decycle(packageInfo)));
    // log.debug('write to cache ', packageInfoCacheFile);
}
exports.saveCache = saveCache;
function _walkPackages(packageUtils, config) {
    const nodePaths = [config().nodePath];
    const configBundleInfo = readBundleMapConfig(packageUtils, config);
    const info = {
        allModules: null,
        moduleMap: _.clone(configBundleInfo.moduleMap),
        shortNameMap: _.clone(configBundleInfo.shortNameMap),
        noBundlePackageMap: {},
        bundleMap: configBundleInfo.bundleMap,
        bundleUrlMap: configBundleInfo.bundleUrlMap,
        urlPackageSet: configBundleInfo.urlPackageSet,
        entryPageMap: {},
        dirTree: null
    };
    const bundleMap = info.bundleMap;
    packageUtils.findBrowserPackageByType('*', function (name, entryPath, parsedName, pkJson, packagePath) {
        addPackageToInfo(packageUtils, info, nodePaths, name, parsedName, pkJson, packagePath);
    });
    addPackageToInfo(packageUtils, info, nodePaths, 'dr-comp-package', packageUtils.parseName('dr-comp-package'), require('dr-comp-package/package.json'), packageUtils.findBrowserPackagePath('dr-comp-package'));
    _.each(bundleMap, (packageMap, bundle) => {
        bundleMap[bundle] = _.values(packageMap); // turn Object.<moduleName, packageInstance> to Array.<packageInstance>
    });
    info.allModules = _.values(info.moduleMap);
    return info;
}
function addPackageToInfo(packageUtils, info, nodePaths, name, parsedName, pkJson, packagePath) {
    var entryViews, entryPages;
    var isEntryServerTemplate = true;
    var noParseFiles, instance;
    if (_.has(info.moduleMap, name)) {
        instance = info.moduleMap[name];
    }
    else {
        // There are also node packages
        instance = new package_instance_1.default({
            isVendor: true,
            bundle: null,
            longName: name,
            shortName: packageUtils.parseName(name).name,
            packagePath,
            realPackagePath: fs.realpathSync(packagePath)
        });
    }
    if (!pkJson.dr) {
        pkJson.dr = {};
    }
    if (pkJson.dr.entryPage) {
        isEntryServerTemplate = false;
        entryPages = [].concat(pkJson.dr.entryPage);
        info.entryPageMap[name] = instance;
    }
    else if (pkJson.dr.entryView) {
        isEntryServerTemplate = true;
        entryViews = [].concat(pkJson.dr.entryView);
        info.entryPageMap[name] = instance;
    }
    if (pkJson.dr.noParse) {
        noParseFiles = [].concat(pkJson.dr.noParse).map(trimNoParseSetting);
    }
    if (pkJson.dr.browserifyNoParse) {
        noParseFiles = [].concat(pkJson.dr.browserifyNoParse).map(trimNoParseSetting);
    }
    var mainFile;
    try {
        // For package like e2etest, it could have no main file
        mainFile = bResolve.sync(name, { paths: nodePaths });
    }
    catch (err) { }
    instance.init({
        isVendor: false,
        file: mainFile ? fs.realpathSync(mainFile) : undefined,
        main: pkJson.main,
        style: pkJson.style ? resolveStyle(name, nodePaths) : undefined,
        parsedName,
        entryPages,
        entryViews,
        browserifyNoParse: noParseFiles,
        isEntryServerTemplate,
        translatable: !_.has(pkJson, 'dr.translatable') || _.get(pkJson, 'dr.translatable'),
        dr: pkJson.dr,
        json: pkJson,
        compiler: pkJson.dr.compiler,
        browser: pkJson.browser,
        i18n: pkJson.dr.i18n ? pkJson.dr.i18n : null,
        appType: pkJson.dr.appType
    });
    if (instance.file == null && (instance.entryPages || instance.entryViews))
        throw new Error(`Entry package "${instance.longName}"'s "browser" or "main" file ${mainFile} doesn't exist!`);
    info.moduleMap[instance.longName] = instance;
    info.shortNameMap[instance.shortName] = instance;
    if (!instance.bundle)
        info.noBundlePackageMap[instance.longName] = instance;
}
function trimNoParseSetting(p) {
    p = p.replace(/\\/g, '/');
    if (p.startsWith('./')) {
        p = p.substring(2);
    }
    return p;
}
function resolveStyle(name, nodePaths) {
    var entry;
    try {
        return fs.realpathSync(resolve.sync(name, {
            paths: nodePaths,
            packageFilter: (pkg, pkgfile) => {
                entry = pkg.main = pkg.style;
                return pkg;
            }
        }));
    }
    catch (err) {
        log.warn('Can not resolve style file "%s" of package %s', entry, name);
        return null;
    }
}
function readBundleMapConfig(packageUtils, config) {
    const info = {
        moduleMap: {},
        /** @type {Object.<bundleName, Object.<moduleName, packageInstance>>} */
        bundleMap: {},
        shortNameMap: {},
        /** @type {Object.<bundleName, URL[]>} */
        bundleUrlMap: {},
        urlPackageSet: null
    };
    _readBundles(packageUtils, info, config, true);
    _readPackageChunkMap(packageUtils, config, info);
    return info;
}
function _readPackageChunkMap(packageUtils, config, info) {
    const bmap = info.bundleMap;
    const mmap = info.moduleMap;
    _.each(config()._package2Chunk, (bundle, moduleName) => {
        try {
            const packagePath = packageUtils.findBrowserPackagePath(moduleName);
            if (!packagePath)
                return;
            const parsedName = packageUtils.parseName(moduleName);
            const instance = new package_instance_1.default({
                isVendor: true,
                bundle,
                longName: moduleName,
                parsedName,
                shortName: parsedName.name,
                packagePath,
                realPackagePath: fs.realpathSync(packagePath)
            });
            mmap[moduleName] = instance;
            info.shortNameMap[parsedName.name] = instance;
            if (info.urlPackageSet)
                info.urlPackageSet[moduleName] = 1;
            if (_.has(bmap, bundle) && _.isArray(bmap[bundle]))
                bmap[bundle].push(instance);
            else
                bmap[bundle] = [instance];
        }
        catch (err) {
            log.warn(err);
            throw err;
        }
    });
}
function _readBundles(packageUtils, info, config, isExternal = false) {
    const bmap = info.bundleMap;
    const mmap = info.moduleMap;
    const mapConfig = config().externalBundleMap;
    if (isExternal)
        info.urlPackageSet = {};
    _.forOwn(mapConfig, function (bundleData, bundle) {
        const moduleNames = _.isArray(bundleData.modules) ?
            bundleData.modules : bundleData;
        const bundleModules = _.map(moduleNames, function (moduleName) {
            try {
                const packagePath = packageUtils.findBrowserPackagePath(moduleName);
                const instance = new package_instance_1.default({
                    isVendor: true,
                    bundle,
                    longName: moduleName,
                    shortName: packageUtils.parseName(moduleName).name,
                    packagePath,
                    realPackagePath: fs.realpathSync(packagePath)
                });
                mmap[moduleName] = instance;
                info.shortNameMap[instance.shortName] = instance;
                if (info.urlPackageSet)
                    info.urlPackageSet[moduleName] = 1;
                return instance;
            }
            catch (err) {
                log.warn(err);
                throw err;
            }
        });
        if (isExternal) {
            if (_.isArray(bundleData))
                info.bundleUrlMap[bundle] = bundleData;
            else if (_.has(bundleData, 'URLs'))
                info.bundleUrlMap[bundle] = bundleData.URLs;
            else if (_.isObject(bundleData)) {
                if (!_.has(bundleData, 'js') && !_.has(bundleData, 'css'))
                    throw new Error('config property "externalBundleMap" must be array of object {css: string[], js: string[]}');
                info.bundleUrlMap[bundle] = bundleData; // bundleData.css, bundleData.js
            }
            else {
                info.bundleUrlMap[bundle] = [bundleData];
            }
        }
        else
            bmap[bundle] = bundleModules;
    });
}
function createPackageDirTree(packageInfo) {
    const tree = new dir_tree_1.DirTree();
    var count = 0;
    packageInfo.allModules.forEach(moduleInstance => {
        // log.info(moduleInstance.longName);
        if (moduleInstance == null)
            return;
        if (moduleInstance.realPackagePath)
            tree.putData(moduleInstance.realPackagePath, moduleInstance);
        if (moduleInstance.packagePath !== moduleInstance.realPackagePath)
            tree.putData(moduleInstance.packagePath, moduleInstance);
        count++;
    });
    log.info('Total %s node packages', count);
    packageInfo.dirTree = tree;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3RzL2J1aWxkLXV0aWwvdHMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBNkI7QUFDN0IsdUNBQXlCO0FBQ3pCLDBFQUF3RDtBQUN4RCwwQ0FBNEI7QUFDNUIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDNUMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLGdDQUFnQztBQUNoQyxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pGLDZEQUF1RDtBQUN2RCwwRUFBd0Q7QUFnQmhELGlDQWhCRCwwQkFBc0IsQ0FnQkM7QUFFOUIsSUFBSSxXQUF3QixDQUFDO0FBQzdCLHlDQUF5QztBQUN6Qzs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLE1BQVcsRUFBRSxZQUFpQjtJQUN6RCxJQUFJLFdBQVc7UUFDYixPQUFPLFdBQVcsQ0FBQztJQUNyQixHQUFHLENBQUMsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7SUFDbkMsV0FBVyxHQUFHLGFBQWEsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEQsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbEMsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQztBQVBELG9DQU9DO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLE9BQVksRUFBRSxhQUFrQjtJQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLE1BQU0sV0FBVyxHQUFHLFlBQVksQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7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QUMvRCxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDM0QsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDLENBQUMsQ0FBQztJQUNILEdBQUcsQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUMsV0FBVyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDN0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGFja2FnZUJyb3dzZXJJbnN0YW5jZSBmcm9tICcuL3BhY2thZ2UtaW5zdGFuY2UnO1xuaW1wb3J0ICogYXMgXyBmcm9tICdsb2Rhc2gnO1xuY29uc3QgYlJlc29sdmUgPSByZXF1aXJlKCdicm93c2VyLXJlc29sdmUnKTtcbmNvbnN0IHJlc29sdmUgPSByZXF1aXJlKCdyZXNvbHZlJyk7XG4vLyB2YXIgY2hhbGsgPSByZXF1aXJlKCdjaGFsaycpO1xuY29uc3QgbG9nID0gcmVxdWlyZSgnbG9nNGpzJykuZ2V0TG9nZ2VyKCdidWlsZFV0aWwuJyArIFBhdGguYmFzZW5hbWUoX19maWxlbmFtZSwgJy5qcycpKTtcbmltcG9ydCB7RGlyVHJlZX0gZnJvbSAncmVxdWlyZS1pbmplY3Rvci9kaXN0L2Rpci10cmVlJztcbmltcG9ydCBQYWNrYWdlQnJvd3Nlckluc3RhbmNlIGZyb20gJy4vcGFja2FnZS1pbnN0YW5jZSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnVuZGxlSW5mbyB7XG4gIG1vZHVsZU1hcDoge1tuYW1lOiBzdHJpbmddOiBQYWNrYWdlQnJvd3Nlckluc3RhbmNlfTtcbiAgc2hvcnROYW1lTWFwOiB7W25hbWU6IHN0cmluZ106IFBhY2thZ2VCcm93c2VySW5zdGFuY2V9O1xuICBidW5kbGVNYXA6IHtbbmFtZTogc3RyaW5nXTogUGFja2FnZUJyb3dzZXJJbnN0YW5jZVtdfTtcbiAgYnVuZGxlVXJsTWFwOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ1tdIHx7Y3NzPzogc3RyaW5nW10sIGpzPzogc3RyaW5nW119fTtcbiAgdXJsUGFja2FnZVNldDoge1tuYW1lOiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbDtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZUluZm8gZXh0ZW5kcyBCdW5kbGVJbmZvIHtcbiAgYWxsTW9kdWxlczogUGFja2FnZUJyb3dzZXJJbnN0YW5jZVtdO1xuICBkaXJUcmVlOiBEaXJUcmVlPFBhY2thZ2VCcm93c2VySW5zdGFuY2U+O1xuICBub0J1bmRsZVBhY2thZ2VNYXA6IHtbbmFtZTogc3RyaW5nXTogUGFja2FnZUJyb3dzZXJJbnN0YW5jZX07XG4gIGVudHJ5UGFnZU1hcDoge1twYWdlOiBzdHJpbmddOiBQYWNrYWdlQnJvd3Nlckluc3RhbmNlfTtcbn1cblxuZXhwb3J0IHtQYWNrYWdlQnJvd3Nlckluc3RhbmNlfTtcblxubGV0IHBhY2thZ2VJbmZvOiBQYWNrYWdlSW5mbztcbi8vIHZhciBwYWNrYWdlSW5mb0NhY2hlRmlsZSwgaXNGcm9tQ2FjaGU7XG4vKipcbiAqIHdhbGtQYWNrYWdlc1xuICogQHBhcmFtIHsqfSBjb25maWcgXG4gKiBAcGFyYW0geyp9IGFyZ3YgXG4gKiBAcGFyYW0geyp9IHBhY2thZ2VVdGlscyBcbiAqIEBwYXJhbSB7Kn0gaWdub3JlQ2FjaGVcbiAqIEByZXR1cm4ge1BhY2thZ2VJbmZvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gd2Fsa1BhY2thZ2VzKGNvbmZpZzogYW55LCBwYWNrYWdlVXRpbHM6IGFueSkge1xuICBpZiAocGFja2FnZUluZm8pXG4gICAgcmV0dXJuIHBhY2thZ2VJbmZvO1xuICBsb2cuaW5mbygnc2NhbiBmb3IgcGFja2FnZXMgaW5mbycpO1xuICBwYWNrYWdlSW5mbyA9IF93YWxrUGFja2FnZXMocGFja2FnZVV0aWxzLCBjb25maWcpO1xuICBjcmVhdGVQYWNrYWdlRGlyVHJlZShwYWNrYWdlSW5mbyk7XG4gIHJldHVybiBwYWNrYWdlSW5mbztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RCdW5kbGVJbmZvKF9jb25maWc6IGFueSwgX3BhY2thZ2VVdGlsczogYW55KSB7XG4gIF9jb25maWcuc2V0KCdidW5kbGVQZXJQYWNrYWdlJywgZmFsc2UpO1xuICBjb25zdCBwYWNrYWdlSW5mbyA9IHdhbGtQYWNrYWdlcyhfY29uZmlnLCBfcGFja2FnZVV0aWxzKTtcbiAgc2F2ZUNhY2hlKHBhY2thZ2VJbmZvLCBfY29uZmlnKTtcbiAgcmV0dXJuIHBhY2thZ2VJbmZvO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzYXZlQ2FjaGUocGFja2FnZUluZm86IFBhY2thZ2VJbmZvLCBjb25maWc6IGFueSkge1xuICAvLyBpZiAoaXNGcm9tQ2FjaGUpXG4gIC8vIFx0cmV0dXJuO1xuICAvLyBta2RpcnAuc3luYyhQYXRoLmpvaW4oY29uZmlnKCkucm9vdFBhdGgsIGNvbmZpZygpLmRlc3REaXIpKTtcbiAgLy8gZnMud3JpdGVGaWxlU3luYyhwYWNrYWdlSW5mb0NhY2hlRmlsZSwgSlNPTi5zdHJpbmdpZnkoY3ljbGUuZGVjeWNsZShwYWNrYWdlSW5mbykpKTtcbiAgLy8gbG9nLmRlYnVnKCd3cml0ZSB0byBjYWNoZSAnLCBwYWNrYWdlSW5mb0NhY2hlRmlsZSk7XG59XG5cbmZ1bmN0aW9uIF93YWxrUGFja2FnZXMocGFja2FnZVV0aWxzOiBhbnksIGNvbmZpZzogYW55KTogUGFja2FnZUluZm8ge1xuICBjb25zdCBub2RlUGF0aHMgPSBbY29uZmlnKCkubm9kZVBhdGhdO1xuICBjb25zdCBjb25maWdCdW5kbGVJbmZvID0gcmVhZEJ1bmRsZU1hcENvbmZpZyhwYWNrYWdlVXRpbHMsIGNvbmZpZyk7XG4gIGNvbnN0IGluZm86IFBhY2thZ2VJbmZvID0ge1xuICAgIGFsbE1vZHVsZXM6IG51bGwgYXMgdW5rbm93biBhcyBQYWNrYWdlQnJvd3Nlckluc3RhbmNlW10sIC8vIGFycmF5XG4gICAgbW9kdWxlTWFwOiBfLmNsb25lKGNvbmZpZ0J1bmRsZUluZm8ubW9kdWxlTWFwKSxcbiAgICBzaG9ydE5hbWVNYXA6IF8uY2xvbmUoY29uZmlnQnVuZGxlSW5mby5zaG9ydE5hbWVNYXApLFxuICAgIG5vQnVuZGxlUGFja2FnZU1hcDoge30sXG4gICAgYnVuZGxlTWFwOiBjb25maWdCdW5kbGVJbmZvLmJ1bmRsZU1hcCxcbiAgICBidW5kbGVVcmxNYXA6IGNvbmZpZ0J1bmRsZUluZm8uYnVuZGxlVXJsTWFwLFxuICAgIHVybFBhY2thZ2VTZXQ6IGNvbmZpZ0J1bmRsZUluZm8udXJsUGFja2FnZVNldCxcbiAgICBlbnRyeVBhZ2VNYXA6IHt9LFxuICAgIGRpclRyZWU6IG51bGwgYXMgdW5rbm93biBhcyBEaXJUcmVlPFBhY2thZ2VCcm93c2VySW5zdGFuY2U+XG4gIH07XG4gIGNvbnN0IGJ1bmRsZU1hcCA9IGluZm8uYnVuZGxlTWFwO1xuXG4gIHBhY2thZ2VVdGlscy5maW5kQnJvd3NlclBhY2thZ2VCeVR5cGUoJyonLCBmdW5jdGlvbihcbiAgICBuYW1lOiBzdHJpbmcsIGVudHJ5UGF0aDogc3RyaW5nLCBwYXJzZWROYW1lOiB7c2NvcGU6IHN0cmluZywgbmFtZTogc3RyaW5nfSwgcGtKc29uOiBhbnksIHBhY2thZ2VQYXRoOiBzdHJpbmcpIHtcbiAgICBhZGRQYWNrYWdlVG9JbmZvKHBhY2thZ2VVdGlscywgaW5mbywgbm9kZVBhdGhzLCBuYW1lLCBwYXJzZWROYW1lLCBwa0pzb24sIHBhY2thZ2VQYXRoKTtcbiAgfSk7XG4gIGFkZFBhY2thZ2VUb0luZm8ocGFja2FnZVV0aWxzLCBpbmZvLCBub2RlUGF0aHMsICdkci1jb21wLXBhY2thZ2UnLFxuICAgIHBhY2thZ2VVdGlscy5wYXJzZU5hbWUoJ2RyLWNvbXAtcGFja2FnZScpLFxuICAgIHJlcXVpcmUoJ2RyLWNvbXAtcGFja2FnZS9wYWNrYWdlLmpzb24nKSwgcGFja2FnZVV0aWxzLmZpbmRCcm93c2VyUGFja2FnZVBhdGgoJ2RyLWNvbXAtcGFja2FnZScpKTtcbiAgXy5lYWNoKGJ1bmRsZU1hcCwgKHBhY2thZ2VNYXAsIGJ1bmRsZSkgPT4ge1xuICAgIGJ1bmRsZU1hcFtidW5kbGVdID0gXy52YWx1ZXMocGFja2FnZU1hcCk7IC8vIHR1cm4gT2JqZWN0Ljxtb2R1bGVOYW1lLCBwYWNrYWdlSW5zdGFuY2U+IHRvIEFycmF5LjxwYWNrYWdlSW5zdGFuY2U+XG4gIH0pO1xuICBpbmZvLmFsbE1vZHVsZXMgPSBfLnZhbHVlcyhpbmZvLm1vZHVsZU1hcCk7XG5cbiAgcmV0dXJuIGluZm87XG59XG5cbmZ1bmN0aW9uIGFkZFBhY2thZ2VUb0luZm8ocGFja2FnZVV0aWxzOiBhbnksIGluZm86IFBhY2thZ2VJbmZvLCBub2RlUGF0aHM6IHN0cmluZ1tdLCBuYW1lOiBzdHJpbmcsXG4gIHBhcnNlZE5hbWU6IHtzY29wZTogc3RyaW5nLCBuYW1lOiBzdHJpbmd9LCBwa0pzb246IGFueSwgcGFja2FnZVBhdGg6IHN0cmluZykge1xuICB2YXIgZW50cnlWaWV3cywgZW50cnlQYWdlcztcbiAgdmFyIGlzRW50cnlTZXJ2ZXJUZW1wbGF0ZSA9IHRydWU7XG4gIHZhciBub1BhcnNlRmlsZXMsIGluc3RhbmNlO1xuICBpZiAoXy5oYXMoaW5mby5tb2R1bGVNYXAsIG5hbWUpKSB7XG4gICAgaW5zdGFuY2UgPSBpbmZvLm1vZHVsZU1hcFtuYW1lXTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBhcmUgYWxzbyBub2RlIHBhY2thZ2VzXG4gICAgaW5zdGFuY2UgPSBuZXcgcGFja2FnZUJyb3dzZXJJbnN0YW5jZSh7XG4gICAgICBpc1ZlbmRvcjogdHJ1ZSxcbiAgICAgIGJ1bmRsZTogbnVsbCxcbiAgICAgIGxvbmdOYW1lOiBuYW1lLFxuICAgICAgc2hvcnROYW1lOiBwYWNrYWdlVXRpbHMucGFyc2VOYW1lKG5hbWUpLm5hbWUsXG4gICAgICBwYWNrYWdlUGF0aCxcbiAgICAgIHJlYWxQYWNrYWdlUGF0aDogZnMucmVhbHBhdGhTeW5jKHBhY2thZ2VQYXRoKVxuICAgIH0pO1xuICB9XG4gIGlmICghcGtKc29uLmRyKSB7XG4gICAgcGtKc29uLmRyID0ge307XG4gIH1cbiAgaWYgKHBrSnNvbi5kci5lbnRyeVBhZ2UpIHtcbiAgICBpc0VudHJ5U2VydmVyVGVtcGxhdGUgPSBmYWxzZTtcbiAgICBlbnRyeVBhZ2VzID0gW10uY29uY2F0KHBrSnNvbi5kci5lbnRyeVBhZ2UpO1xuICAgIGluZm8uZW50cnlQYWdlTWFwW25hbWVdID0gaW5zdGFuY2U7XG4gIH0gZWxzZSBpZiAocGtKc29uLmRyLmVudHJ5Vmlldykge1xuICAgIGlzRW50cnlTZXJ2ZXJUZW1wbGF0ZSA9IHRydWU7XG4gICAgZW50cnlWaWV3cyA9IFtdLmNvbmNhdChwa0pzb24uZHIuZW50cnlWaWV3KTtcbiAgICBpbmZvLmVudHJ5UGFnZU1hcFtuYW1lXSA9IGluc3RhbmNlO1xuICB9XG4gIGlmIChwa0pzb24uZHIubm9QYXJzZSkge1xuICAgIG5vUGFyc2VGaWxlcyA9IFtdLmNvbmNhdChwa0pzb24uZHIubm9QYXJzZSkubWFwKHRyaW1Ob1BhcnNlU2V0dGluZyk7XG4gIH1cbiAgaWYgKHBrSnNvbi5kci5icm93c2VyaWZ5Tm9QYXJzZSkge1xuICAgIG5vUGFyc2VGaWxlcyA9IFtdLmNvbmNhdChwa0pzb24uZHIuYnJvd3NlcmlmeU5vUGFyc2UpLm1hcCh0cmltTm9QYXJzZVNldHRpbmcpO1xuICB9XG4gIHZhciBtYWluRmlsZTtcbiAgdHJ5IHtcbiAgICAvLyBGb3IgcGFja2FnZSBsaWtlIGUyZXRlc3QsIGl0IGNvdWxkIGhhdmUgbm8gbWFpbiBmaWxlXG4gICAgbWFpbkZpbGUgPSBiUmVzb2x2ZS5zeW5jKG5hbWUsIHtwYXRoczogbm9kZVBhdGhzfSk7XG4gIH0gY2F0Y2ggKGVycikge31cbiAgaW5zdGFuY2UuaW5pdCh7XG4gICAgaXNWZW5kb3I6IGZhbHNlLFxuICAgIGZpbGU6IG1haW5GaWxlID8gZnMucmVhbHBhdGhTeW5jKG1haW5GaWxlKSA6IHVuZGVmaW5lZCwgLy8gcGFja2FnZS5qc29uIFwiYnJvd3NlclwiXG4gICAgbWFpbjogcGtKc29uLm1haW4sIC8vIHBhY2thZ2UuanNvbiBcIm1haW5cIlxuICAgIHN0eWxlOiBwa0pzb24uc3R5bGUgPyByZXNvbHZlU3R5bGUobmFtZSwgbm9kZVBhdGhzKSA6IHVuZGVmaW5lZCxcbiAgICBwYXJzZWROYW1lLFxuICAgIGVudHJ5UGFnZXMsXG4gICAgZW50cnlWaWV3cyxcbiAgICBicm93c2VyaWZ5Tm9QYXJzZTogbm9QYXJzZUZpbGVzLFxuICAgIGlzRW50cnlTZXJ2ZXJUZW1wbGF0ZSxcbiAgICB0cmFuc2xhdGFibGU6ICFfLmhhcyhwa0pzb24sICdkci50cmFuc2xhdGFibGUnKSB8fCBfLmdldChwa0pzb24sICdkci50cmFuc2xhdGFibGUnKSxcbiAgICBkcjogcGtKc29uLmRyLFxuICAgIGpzb246IHBrSnNvbixcbiAgICBjb21waWxlcjogcGtKc29uLmRyLmNvbXBpbGVyLFxuICAgIGJyb3dzZXI6IHBrSnNvbi5icm93c2VyLFxuICAgIGkxOG46IHBrSnNvbi5kci5pMThuID8gcGtKc29uLmRyLmkxOG4gOiBudWxsLFxuICAgIGFwcFR5cGU6IHBrSnNvbi5kci5hcHBUeXBlXG4gIH0pO1xuICBpZiAoaW5zdGFuY2UuZmlsZSA9PSBudWxsICYmIChpbnN0YW5jZS5lbnRyeVBhZ2VzIHx8IGluc3RhbmNlLmVudHJ5Vmlld3MpKVxuICAgIHRocm93IG5ldyBFcnJvcihgRW50cnkgcGFja2FnZSBcIiR7aW5zdGFuY2UubG9uZ05hbWV9XCIncyBcImJyb3dzZXJcIiBvciBcIm1haW5cIiBmaWxlICR7bWFpbkZpbGV9IGRvZXNuJ3QgZXhpc3QhYCk7XG4gIGluZm8ubW9kdWxlTWFwW2luc3RhbmNlLmxvbmdOYW1lXSA9IGluc3RhbmNlO1xuICBpbmZvLnNob3J0TmFtZU1hcFtpbnN0YW5jZS5zaG9ydE5hbWVdID0gaW5zdGFuY2U7XG4gIGlmICghaW5zdGFuY2UuYnVuZGxlKVxuICAgIGluZm8ubm9CdW5kbGVQYWNrYWdlTWFwW2luc3RhbmNlLmxvbmdOYW1lXSA9IGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiB0cmltTm9QYXJzZVNldHRpbmcocDogc3RyaW5nKSB7XG4gIHAgPSBwLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgaWYgKHAuc3RhcnRzV2l0aCgnLi8nKSkge1xuICAgIHAgPSBwLnN1YnN0cmluZygyKTtcbiAgfVxuICByZXR1cm4gcDtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZVN0eWxlKG5hbWU6IHN0cmluZywgbm9kZVBhdGhzOiBzdHJpbmdbXSkge1xuICB2YXIgZW50cnk7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGZzLnJlYWxwYXRoU3luYyhyZXNvbHZlLnN5bmMobmFtZSwge1xuICAgICAgcGF0aHM6IG5vZGVQYXRocyxcbiAgICAgIHBhY2thZ2VGaWx0ZXI6IChwa2c6IGFueSwgcGtnZmlsZTogYW55KSA9PiB7XG4gICAgICAgIGVudHJ5ID0gcGtnLm1haW4gPSBwa2cuc3R5bGU7XG4gICAgICAgIHJldHVybiBwa2c7XG4gICAgICB9XG4gICAgfSkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2cud2FybignQ2FuIG5vdCByZXNvbHZlIHN0eWxlIGZpbGUgXCIlc1wiIG9mIHBhY2thZ2UgJXMnLCBlbnRyeSwgbmFtZSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZEJ1bmRsZU1hcENvbmZpZyhwYWNrYWdlVXRpbHM6IGFueSwgY29uZmlnOiBhbnkpIHtcbiAgY29uc3QgaW5mbzogQnVuZGxlSW5mbyA9IHtcbiAgICBtb2R1bGVNYXA6IHt9LFxuICAgIC8qKiBAdHlwZSB7T2JqZWN0LjxidW5kbGVOYW1lLCBPYmplY3QuPG1vZHVsZU5hbWUsIHBhY2thZ2VJbnN0YW5jZT4+fSAqL1xuICAgIGJ1bmRsZU1hcDoge30sXG4gICAgc2hvcnROYW1lTWFwOiB7fSxcbiAgICAvKiogQHR5cGUge09iamVjdC48YnVuZGxlTmFtZSwgVVJMW10+fSAqL1xuICAgIGJ1bmRsZVVybE1hcDoge30sXG4gICAgdXJsUGFja2FnZVNldDogbnVsbFxuICB9O1xuICBfcmVhZEJ1bmRsZXMocGFja2FnZVV0aWxzLCBpbmZvLCBjb25maWcsIHRydWUpO1xuICBfcmVhZFBhY2thZ2VDaHVua01hcChwYWNrYWdlVXRpbHMsIGNvbmZpZywgaW5mbyk7XG4gIHJldHVybiBpbmZvO1xufVxuXG5mdW5jdGlvbiBfcmVhZFBhY2thZ2VDaHVua01hcChwYWNrYWdlVXRpbHM6IGFueSwgY29uZmlnOiBhbnksIGluZm86IEJ1bmRsZUluZm8pIHtcbiAgY29uc3QgYm1hcCA9IGluZm8uYnVuZGxlTWFwO1xuICBjb25zdCBtbWFwID0gaW5mby5tb2R1bGVNYXA7XG4gIF8uZWFjaChjb25maWcoKS5fcGFja2FnZTJDaHVuaywgKGJ1bmRsZSwgbW9kdWxlTmFtZSkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWNrYWdlUGF0aCA9IHBhY2thZ2VVdGlscy5maW5kQnJvd3NlclBhY2thZ2VQYXRoKG1vZHVsZU5hbWUpO1xuICAgICAgaWYgKCFwYWNrYWdlUGF0aClcbiAgICAgICAgcmV0dXJuO1xuICAgICAgY29uc3QgcGFyc2VkTmFtZSA9IHBhY2thZ2VVdGlscy5wYXJzZU5hbWUobW9kdWxlTmFtZSk7XG4gICAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBwYWNrYWdlQnJvd3Nlckluc3RhbmNlKHtcbiAgICAgICAgaXNWZW5kb3I6IHRydWUsXG4gICAgICAgIGJ1bmRsZSxcbiAgICAgICAgbG9uZ05hbWU6IG1vZHVsZU5hbWUsXG4gICAgICAgIHBhcnNlZE5hbWUsXG4gICAgICAgIHNob3J0TmFtZTogcGFyc2VkTmFtZS5uYW1lLFxuICAgICAgICBwYWNrYWdlUGF0aCxcbiAgICAgICAgcmVhbFBhY2thZ2VQYXRoOiBmcy5yZWFscGF0aFN5bmMocGFja2FnZVBhdGgpXG4gICAgICB9KTtcbiAgICAgIG1tYXBbbW9kdWxlTmFtZV0gPSBpbnN0YW5jZTtcbiAgICAgIGluZm8uc2hvcnROYW1lTWFwW3BhcnNlZE5hbWUubmFtZV0gPSBpbnN0YW5jZTtcbiAgICAgIGlmIChpbmZvLnVybFBhY2thZ2VTZXQpXG4gICAgICAgIGluZm8udXJsUGFja2FnZVNldFttb2R1bGVOYW1lXSA9IDE7XG4gICAgICBpZiAoXy5oYXMoYm1hcCwgYnVuZGxlKSAmJiBfLmlzQXJyYXkoYm1hcFtidW5kbGVdKSlcbiAgICAgICAgYm1hcFtidW5kbGVdLnB1c2goaW5zdGFuY2UpO1xuICAgICAgZWxzZVxuICAgICAgICBibWFwW2J1bmRsZV0gPSBbaW5zdGFuY2VdO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgbG9nLndhcm4oZXJyKTtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBfcmVhZEJ1bmRsZXMocGFja2FnZVV0aWxzOiBhbnksIGluZm86IEJ1bmRsZUluZm8sIGNvbmZpZzogYW55LCBpc0V4dGVybmFsID0gZmFsc2UpIHtcbiAgY29uc3QgYm1hcCA9IGluZm8uYnVuZGxlTWFwO1xuICBjb25zdCBtbWFwID0gaW5mby5tb2R1bGVNYXA7XG5cbiAgaW50ZXJmYWNlIEVibVR5cGUxIHtcbiAgICBVUkxzOiBzdHJpbmdbXTtcbiAgICBtb2R1bGVzOiBzdHJpbmdbXTtcbiAgfVxuICBpbnRlcmZhY2UgRWJtVHlwZTIge1xuICAgIGpzPzogc3RyaW5nW107XG4gICAgY3NzPzogc3RyaW5nW107XG4gIH1cbiAgdHlwZSBFYm1UeXBlID0gRWJtVHlwZTEgfCBFYm1UeXBlMiB8IHN0cmluZztcblxuICBjb25zdCBtYXBDb25maWcgPSBjb25maWcoKS5leHRlcm5hbEJ1bmRsZU1hcCBhcyB7W2s6IHN0cmluZ106IHN0cmluZ1tdIHwgRWJtVHlwZX07XG4gIGlmIChpc0V4dGVybmFsKVxuICAgIGluZm8udXJsUGFja2FnZVNldCA9IHt9O1xuICBfLmZvck93bihtYXBDb25maWcsIGZ1bmN0aW9uKGJ1bmRsZURhdGEsIGJ1bmRsZSkge1xuICAgIGNvbnN0IG1vZHVsZU5hbWVzOiBzdHJpbmdbXSA9IF8uaXNBcnJheSgoYnVuZGxlRGF0YSBhcyBFYm1UeXBlMSkubW9kdWxlcykgP1xuICAgICAgKGJ1bmRsZURhdGEgYXMgRWJtVHlwZTEpLm1vZHVsZXMgOiBidW5kbGVEYXRhIGFzIHN0cmluZ1tdO1xuICAgIGNvbnN0IGJ1bmRsZU1vZHVsZXMgPSBfLm1hcChtb2R1bGVOYW1lcywgZnVuY3Rpb24obW9kdWxlTmFtZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcGFja2FnZVBhdGggPSBwYWNrYWdlVXRpbHMuZmluZEJyb3dzZXJQYWNrYWdlUGF0aChtb2R1bGVOYW1lKTtcbiAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBuZXcgcGFja2FnZUJyb3dzZXJJbnN0YW5jZSh7XG4gICAgICAgICAgaXNWZW5kb3I6IHRydWUsXG4gICAgICAgICAgYnVuZGxlLFxuICAgICAgICAgIGxvbmdOYW1lOiBtb2R1bGVOYW1lLFxuICAgICAgICAgIHNob3J0TmFtZTogcGFja2FnZVV0aWxzLnBhcnNlTmFtZShtb2R1bGVOYW1lKS5uYW1lLFxuICAgICAgICAgIHBhY2thZ2VQYXRoLFxuICAgICAgICAgIHJlYWxQYWNrYWdlUGF0aDogZnMucmVhbHBhdGhTeW5jKHBhY2thZ2VQYXRoKVxuICAgICAgICB9KTtcbiAgICAgICAgbW1hcFttb2R1bGVOYW1lXSA9IGluc3RhbmNlO1xuICAgICAgICBpbmZvLnNob3J0TmFtZU1hcFtpbnN0YW5jZS5zaG9ydE5hbWVdID0gaW5zdGFuY2U7XG4gICAgICAgIGlmIChpbmZvLnVybFBhY2thZ2VTZXQpXG4gICAgICAgICAgaW5mby51cmxQYWNrYWdlU2V0W21vZHVsZU5hbWVdID0gMTtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZy53YXJuKGVycik7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoaXNFeHRlcm5hbCkge1xuICAgICAgaWYgKF8uaXNBcnJheShidW5kbGVEYXRhKSlcbiAgICAgICAgaW5mby5idW5kbGVVcmxNYXBbYnVuZGxlXSA9IGJ1bmRsZURhdGE7XG4gICAgICBlbHNlIGlmIChfLmhhcyhidW5kbGVEYXRhLCAnVVJMcycpKVxuICAgICAgICBpbmZvLmJ1bmRsZVVybE1hcFtidW5kbGVdID0gKGJ1bmRsZURhdGEgYXMgRWJtVHlwZTEpLlVSTHM7XG4gICAgICBlbHNlIGlmIChfLmlzT2JqZWN0KGJ1bmRsZURhdGEpKSB7XG4gICAgICAgIGlmICghXy5oYXMoYnVuZGxlRGF0YSwgJ2pzJykgJiYgIV8uaGFzKGJ1bmRsZURhdGEsICdjc3MnKSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvbmZpZyBwcm9wZXJ0eSBcImV4dGVybmFsQnVuZGxlTWFwXCIgbXVzdCBiZSBhcnJheSBvZiBvYmplY3Qge2Nzczogc3RyaW5nW10sIGpzOiBzdHJpbmdbXX0nKTtcbiAgICAgICAgaW5mby5idW5kbGVVcmxNYXBbYnVuZGxlXSA9IGJ1bmRsZURhdGEgYXMgRWJtVHlwZTI7IC8vIGJ1bmRsZURhdGEuY3NzLCBidW5kbGVEYXRhLmpzXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmZvLmJ1bmRsZVVybE1hcFtidW5kbGVdID0gW2J1bmRsZURhdGEgYXMgc3RyaW5nXTtcbiAgICAgIH1cbiAgICB9IGVsc2VcbiAgICAgIGJtYXBbYnVuZGxlXSA9IGJ1bmRsZU1vZHVsZXM7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVQYWNrYWdlRGlyVHJlZShwYWNrYWdlSW5mbzogUGFja2FnZUluZm8pIHtcbiAgY29uc3QgdHJlZSA9IG5ldyBEaXJUcmVlPFBhY2thZ2VCcm93c2VySW5zdGFuY2U+KCk7XG4gIHZhciBjb3VudCA9IDA7XG4gIHBhY2thZ2VJbmZvLmFsbE1vZHVsZXMuZm9yRWFjaChtb2R1bGVJbnN0YW5jZSA9PiB7XG4gICAgLy8gbG9nLmluZm8obW9kdWxlSW5zdGFuY2UubG9uZ05hbWUpO1xuICAgIGlmIChtb2R1bGVJbnN0YW5jZSA9PSBudWxsKVxuICAgICAgcmV0dXJuO1xuICAgIGlmIChtb2R1bGVJbnN0YW5jZS5yZWFsUGFja2FnZVBhdGgpXG4gICAgICB0cmVlLnB1dERhdGEobW9kdWxlSW5zdGFuY2UucmVhbFBhY2thZ2VQYXRoLCBtb2R1bGVJbnN0YW5jZSk7XG4gICAgaWYgKG1vZHVsZUluc3RhbmNlLnBhY2thZ2VQYXRoICE9PSBtb2R1bGVJbnN0YW5jZS5yZWFsUGFja2FnZVBhdGgpXG4gICAgICB0cmVlLnB1dERhdGEobW9kdWxlSW5zdGFuY2UucGFja2FnZVBhdGgsIG1vZHVsZUluc3RhbmNlKTtcbiAgICBjb3VudCsrO1xuICB9KTtcbiAgbG9nLmluZm8oJ1RvdGFsICVzIG5vZGUgcGFja2FnZXMnLCBjb3VudCk7XG4gIHBhY2thZ2VJbmZvLmRpclRyZWUgPSB0cmVlO1xufVxuXG4iXX0=