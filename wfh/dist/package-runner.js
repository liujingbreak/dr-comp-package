"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
// import Package from './packageNodeInstance';
const fs_1 = require("fs");
const path_1 = require("path");
const package_priority_helper_1 = require("./package-priority-helper");
const LRU = require('lru-cache');
const config = require('../lib/config');
const packageUtils = require('../lib/packageMgr/packageUtils');
const NodeApi = require('../lib/nodeApi');
const { nodeInjector } = require('../lib/injectorFactory');
const log = require('log4js').getLogger('package-runner');
class ServerRunner {
    shutdownServer() {
        return __awaiter(this, void 0, void 0, function* () {
            log.info('shutting down');
            yield this._deactivatePackages(this.deactivatePackages);
        });
    }
    _deactivatePackages(comps) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const comp of comps) {
                const exp = require(comp.longName);
                if (_.isFunction(exp.deactivate)) {
                    log.info('deactivate', comp.longName);
                    yield Promise.resolve(exp.deactivate());
                }
            }
        });
    }
}
exports.ServerRunner = ServerRunner;
const apiCache = {};
function runPackages(argv) {
    const includeNameSet = new Set();
    argv.package.forEach(name => includeNameSet.add(name));
    const hyPos = argv.target.indexOf('#');
    const fileToRun = argv.target.substring(0, hyPos);
    const funcToRun = argv.target.substring(hyPos + 1);
    const NodeApi = require('../lib/nodeApi');
    const proto = NodeApi.prototype;
    proto.argv = argv;
    const walkPackages = require('@dr-core/build-util').walkPackages;
    const packageInfo = walkPackages(config, argv, packageUtils, argv['package-cache'] === false);
    proto.packageInfo = packageInfo;
    const cache = LRU(20);
    proto.findPackageByFile = function (file) {
        var found = cache.get(file);
        if (!found) {
            found = packageInfo.dirTree.getAllData(file).pop();
            cache.set(file, found);
        }
        return found;
    };
    proto.getNodeApiForPackage = function (packageInstance) {
        return getApiForPackage(packageInstance);
    };
    const components = packageInfo.allModules.filter(pk => {
        return (includeNameSet.size === 0 || includeNameSet.has(pk.longName) || includeNameSet.has(pk.shortName)) &&
            pk.dr != null && fs_1.existsSync(path_1.join(pk.packagePath, fileToRun));
    });
    components.forEach(pk => {
        setupNodeInjectorFor(pk);
    });
    return package_priority_helper_1.orderPackages(components, (pkInstance) => {
        const file = path_1.join(pkInstance.packagePath, fileToRun);
        log.info('Run %s %s()', file, funcToRun);
        return require(file)[funcToRun]();
    });
}
exports.runPackages = runPackages;
function setupNodeInjectorFor(pkInstance) {
    function apiFactory() {
        return getApiForPackage(pkInstance);
    }
    nodeInjector.fromPackage(pkInstance.longName, pkInstance.realPackagePath)
        .value('__injector', nodeInjector)
        .factory('__api', apiFactory);
    nodeInjector.fromPackage(pkInstance.longName, pkInstance.packagePath)
        .value('__injector', nodeInjector)
        .factory('__api', apiFactory);
    nodeInjector.default = nodeInjector; // For ES6 import syntax
}
function getApiForPackage(pkInstance) {
    if (_.has(apiCache, pkInstance.longName)) {
        return apiCache[pkInstance.longName];
    }
    const api = new NodeApi(pkInstance.longName, pkInstance);
    // api.constructor = NodeApi;
    pkInstance.api = api;
    apiCache[pkInstance.longName] = api;
    api.default = api; // For ES6 import syntax
    return api;
}
//# sourceMappingURL=package-runner.js.map