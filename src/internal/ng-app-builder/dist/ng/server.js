"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* tslint:disable max-line-length */
require("./node-inject");
const build_webpack_1 = require("@angular-devkit/build-webpack");
const core_1 = require("@angular-devkit/core");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const browser_1 = require("@angular-devkit/build-angular/src/browser");
const utils_1 = require("@angular-devkit/build-angular/src/utils");
const build_angular_1 = require("@angular-devkit/build-angular");
const drcpCommon = require("./common");
class ServerBuilder extends build_angular_1.ServerBuilder {
    run(builderConfig) {
        const root = this.context.workspace.root;
        const projectRoot = core_1.resolve(root, builderConfig.root);
        const host = new core_1.virtualFs.AliasHost(this.context.host);
        const webpackBuilder = new build_webpack_1.WebpackBuilder(Object.assign({}, this.context, { host }));
        const options = utils_1.normalizeBuilderSchema(host, root, builderConfig);
        // TODO: verify using of(null) to kickstart things is a pattern.
        return rxjs_1.of(null).pipe(operators_1.concatMap(() => options.deleteOutputPath
            ? this._deleteOutputDir(builderConfig.root, core_1.normalize(options.outputPath), this.context.host)
            : rxjs_1.of(null)), operators_1.concatMap(() => {
            return drcpCommon.compile(builderConfig.root, builderConfig, () => this.buildWebpackConfig(root, projectRoot, host, options));
        }), operators_1.concatMap(() => {
            const webpackConfig = this.buildWebpackConfig(root, projectRoot, host, options);
            return webpackBuilder.runWebpack(webpackConfig, browser_1.getBrowserLoggingCb(options.verbose));
        }));
    }
}
exports.default = ServerBuilder;

//# sourceMappingURL=server.js.map
