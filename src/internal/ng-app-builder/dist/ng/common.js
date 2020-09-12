"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContext = exports.initCli = void 0;
// import type api from '__api';
const fs_extra_1 = __importDefault(require("fs-extra"));
const node_version_check_1 = __importDefault(require("dr-comp-package/wfh/dist/utils/node-version-check"));
const config_1 = __importDefault(require("dr-comp-package/wfh/dist/config"));
const bootstrap_server_1 = require("dr-comp-package/wfh/dist/utils/bootstrap-server");
// export type DrcpConfig = typeof api.config;
function initCli(options) {
    return __awaiter(this, void 0, void 0, function* () {
        yield node_version_check_1.default();
        const drcpConfigFiles = options.drcpConfig ? options.drcpConfig.split(/\s*[,;:]\s*/) : [];
        const config = yield initDrcp(options.drcpArgs, drcpConfigFiles);
        fs_extra_1.default.mkdirpSync(config.resolve('destDir', 'ng-app-builder.report'));
        return config;
    });
}
exports.initCli = initCli;
function initDrcp(drcpArgs, drcpConfigFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        if (drcpArgs.c == null)
            drcpArgs.c = [];
        drcpArgs.c.push(...drcpConfigFiles);
        yield bootstrap_server_1.initConfigAsync({ config: drcpArgs.c, prop: drcpArgs.p || drcpArgs.prop || [] });
        return config_1.default;
    });
}
function newContext(ngBuildOption, options) {
    const constructor = require('./builder-context').BuilderContext;
    return new constructor(ngBuildOption, options);
}
exports.newContext = newContext;

//# sourceMappingURL=common.js.map
