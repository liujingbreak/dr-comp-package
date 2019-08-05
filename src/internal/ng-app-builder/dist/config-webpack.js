"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
/* tslint:disable no-console max-line-length max-classes-per-file */
const webpack_1 = require("@ngtools/webpack");
// import ts from 'typescript';
const fs = tslib_1.__importStar(require("fs"));
const _ = tslib_1.__importStar(require("lodash"));
const Path = tslib_1.__importStar(require("path"));
const util_1 = require("util");
const __api_1 = tslib_1.__importDefault(require("__api"));
const ng_ts_replace_1 = tslib_1.__importDefault(require("./ng-ts-replace"));
const chunk_info_1 = tslib_1.__importDefault(require("./plugins/chunk-info"));
const gzip_size_1 = tslib_1.__importDefault(require("./plugins/gzip-size"));
const index_html_plugin_1 = require("./plugins/index-html-plugin");
const read_hook_vfshost_1 = tslib_1.__importDefault(require("./utils/read-hook-vfshost"));
const smUrl = require('source-map-url');
const log = require('log4js').getLogger('config-webpack');
function changeWebpackConfig(context, param, webpackConfig, drcpConfigSetting) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // const api: typeof __api = require('__api'); // force to defer loading api until DRCP config is ready
        console.log('>>>>>>>>>>>>>>>>> changeWebpackConfig >>>>>>>>>>>>>>>>>>>>>>');
        if (webpackConfig.plugins == null) {
            webpackConfig.plugins = [];
        }
        if (webpackConfig.devServer) {
            const devServer = webpackConfig.devServer;
            // const origin = webpackConfig.devServer.before;
            // devServer.before = function after(app: Application) {
            //   setupAssets(devServer.publicPath || '/', app.use.bind(app));
            //   if (origin)
            //     origin.apply(this, arguments);
            // };
            devServer.compress = true;
            if (devServer.headers == null)
                devServer.headers = {};
            // CORS enablement
            devServer.headers['Access-Control-Allow-Origin'] = '*';
            devServer.headers['Access-Control-Allow-Headers'] = '*';
        }
        if (_.get(param, 'builderConfig.options.drcpArgs.report') ||
            param.browserOptions.drcpArgs.report || (param.browserOptions.drcpArgs.openReport)) {
            webpackConfig.plugins.push(new chunk_info_1.default());
        }
        // webpackConfig.module.noParse = (file: string) => noParse.some(name => file.replace(/\\/g, '/').includes(name));
        // Change AngularCompilerPlugin's option
        const ngCompilerPlugin = webpackConfig.plugins.find((plugin) => {
            return (plugin instanceof webpack_1.AngularCompilerPlugin);
        });
        if (ngCompilerPlugin == null)
            throw new Error('Can not find AngularCompilerPlugin');
        // Hack angular/packages/ngtools/webpack/src/angular_compiler_plugin.ts !!!!
        // const transformers: ts.TransformerFactory<ts.SourceFile>[] = (ngCompilerPlugin as any)._transformers;
        // transformers.unshift((context) => {
        //   return (tsSrc) => {
        //     console.log('hellow:', tsSrc.fileName);
        //     return tsSrc;
        //   };
        // });
        webpackConfig.plugins.unshift(new class {
            apply(compiler) {
                const hooker = new ng_ts_replace_1.default(param);
                ngCompilerPlugin.options.host = new read_hook_vfshost_1.default(compiler.inputFileSystem, hooker.hookFunc);
                // Due to https://github.com/angular/angular-cli/pull/12969
                ngCompilerPlugin.options.directTemplateLoading = false;
                // TODO: Once Angular cli (v8.1.x) upgrades to allow changing directTemplateLoading, we should remove
                // below hack code.
                ngCompilerPlugin._transformers.splice(0);
                ngCompilerPlugin._makeTransformers();
                compiler.hooks.watchRun.tapPromise('ts-read-hook', () => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    hooker.clear();
                }));
            }
        }());
        if (!drcpConfigSetting.devMode) {
            console.log('Build in production mode');
            webpackConfig.plugins.push(new gzip_size_1.default());
        }
        if (webpackConfig.target !== 'node') {
            // Since Angular 8.1.0, there is no indexHtmlPlugin used in Webpack configuration
            // webpackConfig.plugins.push(new IndexHtmlPlugin({
            //     indexFile: Path.resolve(param.browserOptions.index),
            //     inlineChunkNames: ['runtime']
            //   }));
            webpackConfig.plugins.push(new (class DrcpBuilderAssetsPlugin {
                apply(compiler) {
                    compiler.hooks.emit.tapPromise('drcp-builder-assets', (compilation) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                        const assets = compilation.assets;
                        for (const assetsPath of Object.keys(assets)) {
                            // log.warn('is ', assetsPath);
                            const match = /([^/.]+)(?:\.[^/.]+)*(\.js)$/.exec(assetsPath);
                            if (!match)
                                continue;
                            // log.warn('lookup assets', match[1]);
                            if (context.inlineAssets.has(match[1])) {
                                context.inlineAssets.set(match[1], assets[assetsPath].source());
                            }
                        }
                    }));
                }
            })());
        }
        else {
            // This is condition of Server side rendering
            // Refer to angular-cli/packages/angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/server.ts
            if (param.browserOptions.bundleDependencies === 'none') {
                webpackConfig.externals = [
                    /^@angular/,
                    (_, request, callback) => {
                        // Absolute & Relative paths are not externals
                        if (/^\.{0,2}\//.test(request) || Path.isAbsolute(request)) {
                            return callback();
                        }
                        try {
                            // Attempt to resolve the module via Node
                            const e = require.resolve(request);
                            const comp = __api_1.default.findPackageByFile(e);
                            if (comp == null || comp.dr == null) {
                                // It's a node_module
                                callback(null, request);
                            }
                            else {
                                // It's a system thing (.ie util, fs...)
                                callback();
                            }
                        }
                        catch (e) {
                            // Node couldn't find it, so it must be user-aliased
                            callback();
                        }
                    }
                ];
            }
        }
        // webpackConfig.plugins.push(new CompileDonePlugin());
        changeSplitChunks(param, webpackConfig);
        changeLoaders(param, webpackConfig);
        if (param.ssr) {
            webpackConfig.devtool = 'source-map';
        }
        yield __api_1.default.config.configHandlerMgr().runEach((file, lastResult, handler) => {
            if (handler.webpackConfig)
                return handler.webpackConfig(webpackConfig);
            return lastResult;
        });
        const wfname = `dist/webpack-${param.ssr ? 'ssr' : 'browser'}.config.js`;
        fs.writeFileSync(wfname, printConfig(webpackConfig));
        console.log('If you are wondering what kind of Webapck config file is used internally, checkout ' + wfname);
        return webpackConfig;
    });
}
exports.default = changeWebpackConfig;
function changeLoaders(param, webpackConfig) {
    const noParse = __api_1.default.config.get([__api_1.default.packageName, 'buildOptimizerExclude'], []);
    noParse.push(...__api_1.default.config.get([__api_1.default.packageName, 'build-optimizer:exclude'], []));
    // const devMode = webpackConfig.mode === 'development';
    if (webpackConfig.resolveLoader == null) {
        webpackConfig.resolveLoader = {};
    }
    if (webpackConfig.resolveLoader.modules == null) {
        webpackConfig.resolveLoader.modules = [];
    }
    webpackConfig.resolveLoader.modules.unshift(Path.join(__dirname, 'loaders'));
    if (!webpackConfig.module) {
        webpackConfig.module = { rules: [] };
    }
    const rules = webpackConfig.module.rules;
    let hasUrlLoader = false;
    let hasHtmlLoader = false;
    let fileLoaderRuleIdx;
    const urlLoaderRule = {
        test: /\.(jpg|png|gif)$/,
        use: [{
                loader: 'url-loader',
                options: {
                    limit: 10000,
                    fallback: '@dr-core/webpack2-builder/dist/loaders/dr-file-loader'
                }
            }]
    };
    const htmlLoaderRule = {
        test: /\.html$/,
        use: [
            { loader: 'raw-loader' }
            // {loader: 'ng-html-loader'}, // Replace keyward assets:// in *[src|href|srcset|ng-src]
            // {loader: '@dr/translate-generator'},
            // {loader: '@dr/template-builder'}
        ]
    };
    rules.forEach((rule, ruleIdx) => {
        const test = rule.test;
        if (rule.use) {
            const idx = rule.use.findIndex(ruleSet => ruleSet.loader === 'postcss-loader');
            if (idx >= 0) {
                rule.use.splice(idx + 1, 0, {
                    loader: 'css-url-loader'
                });
                // (rule.use as webpack.RuleSetLoader[]).push({loader: 'css-url-loader'});
            }
        }
        if (test instanceof RegExp && test.toString() === '/\\.js$/' && rule.use &&
            rule.use.some((item) => item.loader === '@angular-devkit/build-optimizer/webpack-loader')) {
            rule.test = (path) => {
                if (!/\\.js$/.test(path)) {
                    return false;
                }
                const nPath = path.replace(/\\/g, '/');
                return noParse.every((exclude => !nPath.includes(exclude)));
            };
        }
        // Angular 8 doesn't have loader for HTML
        if (test instanceof RegExp && test.toString() === '/\\.html$/') {
            hasHtmlLoader = true;
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, htmlLoaderRule);
        }
        else if (rule.loader === 'file-loader') {
            fileLoaderRuleIdx = ruleIdx;
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, {
                test: /\.(eot|svg|cur|webp|otf|ttf|woff|woff2|ani)$/,
                use: [{ loader: '@dr-core/webpack2-builder/dist/loaders/dr-file-loader' }]
            });
        }
        else if (rule.loader === 'url-loader') {
            hasUrlLoader = true;
            Object.keys(rule).forEach((key) => delete rule[key]);
            Object.assign(rule, urlLoaderRule);
        }
        else if (test instanceof RegExp && test.toString().indexOf('\\.scss') >= 0 && rule.use) {
            const use = rule.use;
            const insertIdx = use.findIndex(item => item.loader === 'sass-loader');
            if (insertIdx < 0) {
                throw new Error('sass-loader is not found');
            }
            const needSourceMap = use[insertIdx].options.sourceMap;
            // resolve-url-loader: "source maps must be enabled on any preceding loader"
            // https://github.com/bholloway/resolve-url-loader
            use[insertIdx].options.sourceMap = true;
            use.splice(insertIdx, 0, {
                loader: 'resolve-url-loader',
                options: {
                    sourceMap: needSourceMap
                }
            });
            // rule.use.push({loader: '@dr-core/webpack2-builder/lib/debug-loader', options: {id: 'less loaders'}});
        }
        else if (test instanceof RegExp && test.toString() === '/\\.less$/' && rule.use) {
            for (const useItem of rule.use) {
                if (useItem.loader === 'less-loader' && _.has(useItem, 'options.paths')) {
                    delete useItem.options.paths;
                    break;
                }
            }
            // rule.use.push({loader: '@dr-core/webpack2-builder/lib/debug-loader', options: {id: 'less loaders'}});
        }
    });
    if (!hasUrlLoader) {
        if (fileLoaderRuleIdx == null)
            throw new Error('Missing file-loader rule from Angular\'s Webpack config');
        console.log('Insert url-loader');
        rules.splice(fileLoaderRuleIdx + 1, 0, urlLoaderRule);
    }
    rules.unshift({
        // test: /\.(?:ngfactory\.js|component\.html)$/,
        test: file => {
            if (file.endsWith('.component.html'))
                return true;
            return !!__api_1.default.findPackageByFile(file);
        },
        use: [{ loader: '@dr-core/ng-app-builder/dist/ng-aot-assets/ng-aot-assets-loader' }]
    });
    rules.unshift({
        oneOf: [
            {
                test: /\.jade$/,
                use: [
                    { loader: 'html-loader', options: { attrs: 'img:src' } },
                    { loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader') },
                    // {loader: '@dr/translate-generator'},
                    { loader: '@dr-core/webpack2-builder/lib/jade-to-html-loader' }
                ]
            },
            {
                test: /\.md$/,
                use: [
                    { loader: 'html-loader', options: { attrs: 'img:src' } },
                    { loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader') },
                    { loader: '@dr-core/webpack2-builder/lib/markdown-loader' }
                ]
            },
            {
                test: /\.txt$/,
                use: { loader: 'raw-loader' }
            }, {
                test: /\.(yaml|yml)$/,
                use: [
                    { loader: 'json-loader' },
                    { loader: 'yaml-loader' }
                ]
            }
        ]
    });
    if (!hasHtmlLoader) {
        rules[0].oneOf && rules[0].oneOf.push(htmlLoaderRule);
    }
}
// function notAngularJs(file: string) {
// 	if (!file.endsWith('.js') || file.endsWith('.ngfactory.js') || file.endsWith('.ngstyle.js'))
// 		return false;
// 	if (noParse.some(name => file.replace(/\\/g, '/').includes(name)))
// 		return false;
// 	// const pk = api.findPackageByFile(file);
// 	// if (pk && pk.dr) {
// 	// 	return true;
// 	// }
// 	console.log('babel: ', file);
// 	return true;
// }
function changeSplitChunks(param, webpackConfig) {
    if (webpackConfig.optimization == null)
        return; // SSR' Webpack config does not has this property
    const oldVendorTestFunc = _.get(webpackConfig, 'optimization.splitChunks.cacheGroups.vendor.test');
    if (oldVendorTestFunc) {
        const cacheGroups = webpackConfig.optimization.splitChunks.cacheGroups;
        cacheGroups.vendor.test = vendorTest;
        cacheGroups.lazyVendor = {
            name: 'lazy-vendor',
            chunks: 'async',
            enforce: true,
            test: vendorTest,
            priority: 1
        };
    }
    function vendorTest(module, chunks) {
        const maybeVendor = oldVendorTestFunc(module, chunks);
        if (!maybeVendor)
            return false;
        const resource = module.nameForCondition ? module.nameForCondition() : '';
        // console.log(`vendor test, resource: ${resource}, chunks: ${chunks.map( c => c.name)}`);
        const pk = __api_1.default.findPackageByFile(resource);
        return pk == null || pk.dr == null;
    }
}
function printConfig(c, level = 0) {
    var indent = _.repeat('  ', level);
    var out = '{\n';
    _.forOwn(c, (value, prop) => {
        out += indent + `  ${JSON.stringify(prop)}: ${printConfigValue(value, level)},\n`;
    });
    out += indent + '}';
    return out;
}
function printConfigValue(value, level) {
    var out = '';
    var indent = _.repeat('  ', level);
    if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
        out += JSON.stringify(value) + '';
    }
    else if (Array.isArray(value)) {
        out += '[\n';
        value.forEach((row) => {
            out += indent + '    ' + printConfigValue(row, level + 1);
            out += ',\n';
        });
        out += indent + '  ]';
    }
    else if (_.isFunction(value)) {
        out += value.name + '()';
    }
    else if (util_1.isRegExp(value)) {
        out += `${value.toString()}`;
    }
    else if (_.isObject(value)) {
        const proto = Object.getPrototypeOf(value);
        if (proto && proto.constructor !== Object) {
            out += `new ${proto.constructor.name}()`;
        }
        else {
            out += printConfig(value, level + 1);
        }
    }
    else {
        out += ' unknown';
    }
    return out;
}
function transformIndexHtml(context, content) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            return index_html_plugin_1.transformHtml(content, context.ngBuildOption.browserOptions, srcUrl => {
                const match = /([^/.]+)(?:\.[^/.]+)+$/.exec(srcUrl);
                if (match && context.inlineAssets.has(match[1])) {
                    const source = context.inlineAssets.get(match[1]);
                    return smUrl.removeFrom(source);
                }
                return null;
            });
        }
        catch (e) {
            log.error(e);
            throw e;
        }
    });
}
exports.transformIndexHtml = transformIndexHtml;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy9jb25maWctd2VicGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxvRUFBb0U7QUFDcEUsOENBQXlEO0FBQ3pELCtCQUErQjtBQUMvQiwrQ0FBeUI7QUFDekIsa0RBQTRCO0FBQzVCLG1EQUE2QjtBQUM3QiwrQkFBZ0M7QUFHaEMsMERBQXdCO0FBQ3hCLDRFQUEyQztBQUczQyw4RUFBbUQ7QUFDbkQsNEVBQTJDO0FBQzNDLG1FQUE0RDtBQUM1RCwwRkFBcUQ7QUFDckQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDeEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBUzFELFNBQThCLG1CQUFtQixDQUFDLE9BQXVCLEVBQUUsS0FBc0IsRUFBRSxhQUFvQyxFQUNySSxpQkFBcUM7O1FBQ3JDLHVHQUF1RztRQUN2RyxPQUFPLENBQUMsR0FBRyxDQUFDLDhEQUE4RCxDQUFDLENBQUM7UUFFNUUsSUFBSSxhQUFhLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUNqQyxhQUFhLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztTQUM1QjtRQUNELElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRTtZQUMzQixNQUFNLFNBQVMsR0FBRyxhQUFhLENBQUMsU0FBUyxDQUFDO1lBQzFDLGlEQUFpRDtZQUNqRCx3REFBd0Q7WUFDeEQsaUVBQWlFO1lBQ2pFLGdCQUFnQjtZQUNoQixxQ0FBcUM7WUFDckMsS0FBSztZQUNMLFNBQVMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1lBQzFCLElBQUksU0FBUyxDQUFDLE9BQU8sSUFBSSxJQUFJO2dCQUMzQixTQUFTLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUN6QixrQkFBa0I7WUFDbEIsU0FBUyxDQUFDLE9BQU8sQ0FBQyw2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QGRyLWNvcmUvbmctYXBwLWJ1aWxkZXIvZGlzdC9jb25maWctd2VicGFjay5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qIHRzbGludDpkaXNhYmxlIG5vLWNvbnNvbGUgbWF4LWxpbmUtbGVuZ3RoIG1heC1jbGFzc2VzLXBlci1maWxlICovXG5pbXBvcnQgeyBBbmd1bGFyQ29tcGlsZXJQbHVnaW4gfSBmcm9tICdAbmd0b29scy93ZWJwYWNrJztcbi8vIGltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBpc1JlZ0V4cCB9IGZyb20gJ3V0aWwnO1xuaW1wb3J0ICogYXMgd2VicGFjayBmcm9tICd3ZWJwYWNrJztcbmltcG9ydCB7IENvbXBpbGVyIH0gZnJvbSAnd2VicGFjayc7XG5pbXBvcnQgYXBpIGZyb20gJ19fYXBpJztcbmltcG9ydCBUU1JlYWRIb29rZXIgZnJvbSAnLi9uZy10cy1yZXBsYWNlJztcbmltcG9ydCB7IEJ1aWxkZXJDb250ZXh0IH0gZnJvbSAnLi9uZy9idWlsZGVyLWNvbnRleHQnO1xuaW1wb3J0IHsgQW5ndWxhckNsaVBhcmFtIH0gZnJvbSAnLi9uZy9jb21tb24nO1xuaW1wb3J0IENodW5rSW5mb1BsdWdpbiBmcm9tICcuL3BsdWdpbnMvY2h1bmstaW5mbyc7XG5pbXBvcnQgZ3ppcFNpemUgZnJvbSAnLi9wbHVnaW5zL2d6aXAtc2l6ZSc7XG5pbXBvcnQgeyB0cmFuc2Zvcm1IdG1sIH0gZnJvbSAnLi9wbHVnaW5zL2luZGV4LWh0bWwtcGx1Z2luJztcbmltcG9ydCBSZWFkSG9va0hvc3QgZnJvbSAnLi91dGlscy9yZWFkLWhvb2stdmZzaG9zdCc7XG5jb25zdCBzbVVybCA9IHJlcXVpcmUoJ3NvdXJjZS1tYXAtdXJsJyk7XG5jb25zdCBsb2cgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoJ2NvbmZpZy13ZWJwYWNrJyk7XG4vLyBpbXBvcnQge0FwcGxpY2F0aW9ufSBmcm9tICdleHByZXNzJztcbi8vIGltcG9ydCBzZXR1cEFzc2V0cyBmcm9tICdAZHItY29yZS9hc3NldHMtcHJvY2Vzc2VyL2Rpc3QvZGV2LXNlcnZlLWFzc2V0cyc7XG5leHBvcnQgaW50ZXJmYWNlIFdlcGFja0NvbmZpZ0hhbmRsZXIge1xuICAvKiogQHJldHVybnMgd2VicGFjayBjb25maWd1cmF0aW9uIG9yIFByb21pc2UgKi9cbiAgd2VicGFja0NvbmZpZyhvcmlnaW5hbENvbmZpZzogd2VicGFjay5Db25maWd1cmF0aW9uKTpcbiAgICBQcm9taXNlPHdlYnBhY2suQ29uZmlndXJhdGlvbj4gfCB3ZWJwYWNrLkNvbmZpZ3VyYXRpb24gfCB2b2lkO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBjaGFuZ2VXZWJwYWNrQ29uZmlnKGNvbnRleHQ6IEJ1aWxkZXJDb250ZXh0LCBwYXJhbTogQW5ndWxhckNsaVBhcmFtLCB3ZWJwYWNrQ29uZmlnOiB3ZWJwYWNrLkNvbmZpZ3VyYXRpb24sXG4gIGRyY3BDb25maWdTZXR0aW5nOiB7ZGV2TW9kZTogYm9vbGVhbn0pIHtcbiAgLy8gY29uc3QgYXBpOiB0eXBlb2YgX19hcGkgPSByZXF1aXJlKCdfX2FwaScpOyAvLyBmb3JjZSB0byBkZWZlciBsb2FkaW5nIGFwaSB1bnRpbCBEUkNQIGNvbmZpZyBpcyByZWFkeVxuICBjb25zb2xlLmxvZygnPj4+Pj4+Pj4+Pj4+Pj4+Pj4gY2hhbmdlV2VicGFja0NvbmZpZyA+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Jyk7XG5cbiAgaWYgKHdlYnBhY2tDb25maWcucGx1Z2lucyA9PSBudWxsKSB7XG4gICAgd2VicGFja0NvbmZpZy5wbHVnaW5zID0gW107XG4gIH1cbiAgaWYgKHdlYnBhY2tDb25maWcuZGV2U2VydmVyKSB7XG4gICAgY29uc3QgZGV2U2VydmVyID0gd2VicGFja0NvbmZpZy5kZXZTZXJ2ZXI7XG4gICAgLy8gY29uc3Qgb3JpZ2luID0gd2VicGFja0NvbmZpZy5kZXZTZXJ2ZXIuYmVmb3JlO1xuICAgIC8vIGRldlNlcnZlci5iZWZvcmUgPSBmdW5jdGlvbiBhZnRlcihhcHA6IEFwcGxpY2F0aW9uKSB7XG4gICAgLy8gICBzZXR1cEFzc2V0cyhkZXZTZXJ2ZXIucHVibGljUGF0aCB8fCAnLycsIGFwcC51c2UuYmluZChhcHApKTtcbiAgICAvLyAgIGlmIChvcmlnaW4pXG4gICAgLy8gICAgIG9yaWdpbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIC8vIH07XG4gICAgZGV2U2VydmVyLmNvbXByZXNzID0gdHJ1ZTtcbiAgICBpZiAoZGV2U2VydmVyLmhlYWRlcnMgPT0gbnVsbClcbiAgICAgIGRldlNlcnZlci5oZWFkZXJzID0ge307XG4gICAgLy8gQ09SUyBlbmFibGVtZW50XG4gICAgZGV2U2VydmVyLmhlYWRlcnNbJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbiddID0gJyonO1xuICAgIGRldlNlcnZlci5oZWFkZXJzWydBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJ10gPSAnKic7XG4gIH1cblxuICBpZiAoXy5nZXQocGFyYW0sICdidWlsZGVyQ29uZmlnLm9wdGlvbnMuZHJjcEFyZ3MucmVwb3J0JykgfHxcbiAgcGFyYW0uYnJvd3Nlck9wdGlvbnMuZHJjcEFyZ3MucmVwb3J0IHx8KHBhcmFtLmJyb3dzZXJPcHRpb25zLmRyY3BBcmdzLm9wZW5SZXBvcnQpKSB7XG4gICAgd2VicGFja0NvbmZpZy5wbHVnaW5zLnB1c2goXG4gICAgICBuZXcgQ2h1bmtJbmZvUGx1Z2luKClcbiAgICApO1xuICB9XG5cbiAgLy8gd2VicGFja0NvbmZpZy5tb2R1bGUubm9QYXJzZSA9IChmaWxlOiBzdHJpbmcpID0+IG5vUGFyc2Uuc29tZShuYW1lID0+IGZpbGUucmVwbGFjZSgvXFxcXC9nLCAnLycpLmluY2x1ZGVzKG5hbWUpKTtcblxuICAvLyBDaGFuZ2UgQW5ndWxhckNvbXBpbGVyUGx1Z2luJ3Mgb3B0aW9uXG4gIGNvbnN0IG5nQ29tcGlsZXJQbHVnaW4gPSB3ZWJwYWNrQ29uZmlnLnBsdWdpbnMuZmluZCgocGx1Z2luOiBhbnkpID0+IHtcbiAgICByZXR1cm4gKHBsdWdpbiBpbnN0YW5jZW9mIEFuZ3VsYXJDb21waWxlclBsdWdpbik7XG4gIH0pIGFzIEFuZ3VsYXJDb21waWxlclBsdWdpbjtcbiAgaWYgKG5nQ29tcGlsZXJQbHVnaW4gPT0gbnVsbClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBub3QgZmluZCBBbmd1bGFyQ29tcGlsZXJQbHVnaW4nKTtcbiAgLy8gSGFjayBhbmd1bGFyL3BhY2thZ2VzL25ndG9vbHMvd2VicGFjay9zcmMvYW5ndWxhcl9jb21waWxlcl9wbHVnaW4udHMgISEhIVxuICAvLyBjb25zdCB0cmFuc2Zvcm1lcnM6IHRzLlRyYW5zZm9ybWVyRmFjdG9yeTx0cy5Tb3VyY2VGaWxlPltdID0gKG5nQ29tcGlsZXJQbHVnaW4gYXMgYW55KS5fdHJhbnNmb3JtZXJzO1xuICAvLyB0cmFuc2Zvcm1lcnMudW5zaGlmdCgoY29udGV4dCkgPT4ge1xuICAvLyAgIHJldHVybiAodHNTcmMpID0+IHtcbiAgLy8gICAgIGNvbnNvbGUubG9nKCdoZWxsb3c6JywgdHNTcmMuZmlsZU5hbWUpO1xuICAvLyAgICAgcmV0dXJuIHRzU3JjO1xuICAvLyAgIH07XG4gIC8vIH0pO1xuICAod2VicGFja0NvbmZpZy5wbHVnaW5zIGFzIGFueVtdKS51bnNoaWZ0KG5ldyBjbGFzcyB7XG4gICAgYXBwbHkoY29tcGlsZXI6IENvbXBpbGVyKSB7XG4gICAgICBjb25zdCBob29rZXIgPSBuZXcgVFNSZWFkSG9va2VyKHBhcmFtKTtcbiAgICAgIG5nQ29tcGlsZXJQbHVnaW4ub3B0aW9ucy5ob3N0ID0gbmV3IFJlYWRIb29rSG9zdCgoY29tcGlsZXIgYXMgYW55KS5pbnB1dEZpbGVTeXN0ZW0sIGhvb2tlci5ob29rRnVuYyk7XG4gICAgICAvLyBEdWUgdG8gaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXIvYW5ndWxhci1jbGkvcHVsbC8xMjk2OVxuICAgICAgbmdDb21waWxlclBsdWdpbi5vcHRpb25zLmRpcmVjdFRlbXBsYXRlTG9hZGluZyA9IGZhbHNlO1xuICAgICAgLy8gVE9ETzogT25jZSBBbmd1bGFyIGNsaSAodjguMS54KSB1cGdyYWRlcyB0byBhbGxvdyBjaGFuZ2luZyBkaXJlY3RUZW1wbGF0ZUxvYWRpbmcsIHdlIHNob3VsZCByZW1vdmVcbiAgICAgIC8vIGJlbG93IGhhY2sgY29kZS5cbiAgICAgICgobmdDb21waWxlclBsdWdpbiBhcyBhbnkpLl90cmFuc2Zvcm1lcnMgYXMgYW55W10pLnNwbGljZSgwKTtcbiAgICAgIChuZ0NvbXBpbGVyUGx1Z2luIGFzIGFueSkuX21ha2VUcmFuc2Zvcm1lcnMoKTtcbiAgICAgIGNvbXBpbGVyLmhvb2tzLndhdGNoUnVuLnRhcFByb21pc2UoJ3RzLXJlYWQtaG9vaycsIGFzeW5jICgpID0+IHtcbiAgICAgICAgaG9va2VyLmNsZWFyKCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0oKSk7XG5cbiAgaWYgKCFkcmNwQ29uZmlnU2V0dGluZy5kZXZNb2RlKSB7XG4gICAgY29uc29sZS5sb2coJ0J1aWxkIGluIHByb2R1Y3Rpb24gbW9kZScpO1xuICAgIHdlYnBhY2tDb25maWcucGx1Z2lucy5wdXNoKG5ldyBnemlwU2l6ZSgpKTtcbiAgfVxuXG4gIGlmICh3ZWJwYWNrQ29uZmlnLnRhcmdldCAhPT0gJ25vZGUnKSB7XG4gICAgLy8gU2luY2UgQW5ndWxhciA4LjEuMCwgdGhlcmUgaXMgbm8gaW5kZXhIdG1sUGx1Z2luIHVzZWQgaW4gV2VicGFjayBjb25maWd1cmF0aW9uXG4gICAgLy8gd2VicGFja0NvbmZpZy5wbHVnaW5zLnB1c2gobmV3IEluZGV4SHRtbFBsdWdpbih7XG4gICAgLy8gICAgIGluZGV4RmlsZTogUGF0aC5yZXNvbHZlKHBhcmFtLmJyb3dzZXJPcHRpb25zLmluZGV4KSxcbiAgICAvLyAgICAgaW5saW5lQ2h1bmtOYW1lczogWydydW50aW1lJ11cbiAgICAvLyAgIH0pKTtcbiAgICB3ZWJwYWNrQ29uZmlnLnBsdWdpbnMucHVzaChuZXcgKGNsYXNzIERyY3BCdWlsZGVyQXNzZXRzUGx1Z2luIHtcbiAgICAgIGFwcGx5KGNvbXBpbGVyOiBDb21waWxlcikge1xuICAgICAgICBjb21waWxlci5ob29rcy5lbWl0LnRhcFByb21pc2UoJ2RyY3AtYnVpbGRlci1hc3NldHMnLCBhc3luYyBjb21waWxhdGlvbiA9PiB7XG4gICAgICAgICAgY29uc3QgYXNzZXRzOiB7W2Fzc2V0c1BhdGg6IHN0cmluZ106IGFueX0gPSBjb21waWxhdGlvbi5hc3NldHM7XG4gICAgICAgICAgZm9yIChjb25zdCBhc3NldHNQYXRoIG9mIE9iamVjdC5rZXlzKGFzc2V0cykpIHtcbiAgICAgICAgICAgIC8vIGxvZy53YXJuKCdpcyAnLCBhc3NldHNQYXRoKTtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gLyhbXi8uXSspKD86XFwuW14vLl0rKSooXFwuanMpJC8uZXhlYyhhc3NldHNQYXRoKTtcbiAgICAgICAgICAgIGlmICghbWF0Y2gpXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgLy8gbG9nLndhcm4oJ2xvb2t1cCBhc3NldHMnLCBtYXRjaFsxXSk7XG4gICAgICAgICAgICBpZiAoY29udGV4dC5pbmxpbmVBc3NldHMuaGFzKG1hdGNoWzFdKSkge1xuICAgICAgICAgICAgICBjb250ZXh0LmlubGluZUFzc2V0cy5zZXQobWF0Y2hbMV0sIGFzc2V0c1thc3NldHNQYXRoXS5zb3VyY2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSgpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGNvbmRpdGlvbiBvZiBTZXJ2ZXIgc2lkZSByZW5kZXJpbmdcbiAgICAvLyBSZWZlciB0byBhbmd1bGFyLWNsaS9wYWNrYWdlcy9hbmd1bGFyX2RldmtpdC9idWlsZF9hbmd1bGFyL3NyYy9hbmd1bGFyLWNsaS1maWxlcy9tb2RlbHMvd2VicGFjay1jb25maWdzL3NlcnZlci50c1xuICAgIGlmIChwYXJhbS5icm93c2VyT3B0aW9ucy5idW5kbGVEZXBlbmRlbmNpZXMgPT09ICdub25lJykge1xuICAgICAgd2VicGFja0NvbmZpZy5leHRlcm5hbHMgPSBbXG4gICAgICAgIC9eQGFuZ3VsYXIvLFxuICAgICAgICAoXzogYW55LCByZXF1ZXN0OiBhbnksIGNhbGxiYWNrOiAoZXJyb3I/OiBhbnksIHJlc3VsdD86IGFueSkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAvLyBBYnNvbHV0ZSAmIFJlbGF0aXZlIHBhdGhzIGFyZSBub3QgZXh0ZXJuYWxzXG4gICAgICAgIGlmICgvXlxcLnswLDJ9XFwvLy50ZXN0KHJlcXVlc3QpIHx8IFBhdGguaXNBYnNvbHV0ZShyZXF1ZXN0KSkge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgLy8gQXR0ZW1wdCB0byByZXNvbHZlIHRoZSBtb2R1bGUgdmlhIE5vZGVcbiAgICAgICAgICBjb25zdCBlID0gcmVxdWlyZS5yZXNvbHZlKHJlcXVlc3QpO1xuICAgICAgICAgIGNvbnN0IGNvbXAgPSBhcGkuZmluZFBhY2thZ2VCeUZpbGUoZSk7XG4gICAgICAgICAgaWYgKGNvbXAgPT0gbnVsbCB8fCBjb21wLmRyID09IG51bGwgKSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgbm9kZV9tb2R1bGVcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcXVlc3QpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJdCdzIGEgc3lzdGVtIHRoaW5nICguaWUgdXRpbCwgZnMuLi4pXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIC8vIE5vZGUgY291bGRuJ3QgZmluZCBpdCwgc28gaXQgbXVzdCBiZSB1c2VyLWFsaWFzZWRcbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF07XG4gICAgICB9XG4gIH1cbiAgLy8gd2VicGFja0NvbmZpZy5wbHVnaW5zLnB1c2gobmV3IENvbXBpbGVEb25lUGx1Z2luKCkpO1xuXG4gIGNoYW5nZVNwbGl0Q2h1bmtzKHBhcmFtLCB3ZWJwYWNrQ29uZmlnKTtcbiAgY2hhbmdlTG9hZGVycyhwYXJhbSwgd2VicGFja0NvbmZpZyk7XG5cbiAgaWYgKHBhcmFtLnNzcikge1xuICAgIHdlYnBhY2tDb25maWcuZGV2dG9vbCA9ICdzb3VyY2UtbWFwJztcbiAgfVxuXG4gIGF3YWl0IGFwaS5jb25maWcuY29uZmlnSGFuZGxlck1ncigpLnJ1bkVhY2g8V2VwYWNrQ29uZmlnSGFuZGxlcj4oKGZpbGUsIGxhc3RSZXN1bHQsIGhhbmRsZXIpID0+IHtcbiAgICBpZiAoaGFuZGxlci53ZWJwYWNrQ29uZmlnKVxuICAgICAgcmV0dXJuIGhhbmRsZXIud2VicGFja0NvbmZpZyh3ZWJwYWNrQ29uZmlnKTtcbiAgICByZXR1cm4gbGFzdFJlc3VsdDtcbiAgfSk7XG5cbiAgY29uc3Qgd2ZuYW1lID0gYGRpc3Qvd2VicGFjay0ke3BhcmFtLnNzciA/ICdzc3InIDogJ2Jyb3dzZXInfS5jb25maWcuanNgO1xuICBmcy53cml0ZUZpbGVTeW5jKHdmbmFtZSwgcHJpbnRDb25maWcod2VicGFja0NvbmZpZykpO1xuICBjb25zb2xlLmxvZygnSWYgeW91IGFyZSB3b25kZXJpbmcgd2hhdCBraW5kIG9mIFdlYmFwY2sgY29uZmlnIGZpbGUgaXMgdXNlZCBpbnRlcm5hbGx5LCBjaGVja291dCAnICsgd2ZuYW1lKTtcbiAgcmV0dXJuIHdlYnBhY2tDb25maWc7XG59XG5cbmZ1bmN0aW9uIGNoYW5nZUxvYWRlcnMocGFyYW06IEFuZ3VsYXJDbGlQYXJhbSwgd2VicGFja0NvbmZpZzogd2VicGFjay5Db25maWd1cmF0aW9uKSB7XG4gIGNvbnN0IG5vUGFyc2UgPSAoYXBpLmNvbmZpZy5nZXQoW2FwaS5wYWNrYWdlTmFtZSwgJ2J1aWxkT3B0aW1pemVyRXhjbHVkZSddLCBbXSkgYXMgc3RyaW5nW10pO1xuICBub1BhcnNlLnB1c2goLi4uYXBpLmNvbmZpZy5nZXQoW2FwaS5wYWNrYWdlTmFtZSwgJ2J1aWxkLW9wdGltaXplcjpleGNsdWRlJ10sIFtdKSBhcyBzdHJpbmdbXSk7XG5cbiAgLy8gY29uc3QgZGV2TW9kZSA9IHdlYnBhY2tDb25maWcubW9kZSA9PT0gJ2RldmVsb3BtZW50JztcbiAgaWYgKHdlYnBhY2tDb25maWcucmVzb2x2ZUxvYWRlciA9PSBudWxsKSB7XG4gICAgd2VicGFja0NvbmZpZy5yZXNvbHZlTG9hZGVyID0ge307XG4gIH1cbiAgaWYgKHdlYnBhY2tDb25maWcucmVzb2x2ZUxvYWRlci5tb2R1bGVzID09IG51bGwpIHtcbiAgICB3ZWJwYWNrQ29uZmlnLnJlc29sdmVMb2FkZXIubW9kdWxlcyA9IFtdO1xuICB9XG4gIHdlYnBhY2tDb25maWcucmVzb2x2ZUxvYWRlci5tb2R1bGVzLnVuc2hpZnQoUGF0aC5qb2luKF9fZGlybmFtZSwgJ2xvYWRlcnMnKSk7XG4gIGlmICghd2VicGFja0NvbmZpZy5tb2R1bGUpIHtcbiAgICB3ZWJwYWNrQ29uZmlnLm1vZHVsZSA9IHtydWxlczogW119O1xuICB9XG4gIGNvbnN0IHJ1bGVzID0gd2VicGFja0NvbmZpZy5tb2R1bGUucnVsZXMgYXMgd2VicGFjay5SdWxlW107XG4gIGxldCBoYXNVcmxMb2FkZXIgPSBmYWxzZTtcbiAgbGV0IGhhc0h0bWxMb2FkZXIgPSBmYWxzZTtcbiAgbGV0IGZpbGVMb2FkZXJSdWxlSWR4OiBudW1iZXIgfCB1bmRlZmluZWQ7XG5cbiAgY29uc3QgdXJsTG9hZGVyUnVsZSA9IHtcbiAgICB0ZXN0OiAvXFwuKGpwZ3xwbmd8Z2lmKSQvLFxuICAgIHVzZTogW3tcbiAgICAgIGxvYWRlcjogJ3VybC1sb2FkZXInLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICBsaW1pdDogMTAwMDAsIC8vIDwxMGsgLHVzZSBiYXNlNjQgZm9ybWF0XG4gICAgICAgIGZhbGxiYWNrOiAnQGRyLWNvcmUvd2VicGFjazItYnVpbGRlci9kaXN0L2xvYWRlcnMvZHItZmlsZS1sb2FkZXInXG4gICAgICB9XG4gICAgfV1cbiAgfTtcbiAgY29uc3QgaHRtbExvYWRlclJ1bGUgPSB7XG4gICAgdGVzdDogL1xcLmh0bWwkLyxcbiAgICB1c2U6IFtcbiAgICAgIHtsb2FkZXI6ICdyYXctbG9hZGVyJ31cbiAgICAgIC8vIHtsb2FkZXI6ICduZy1odG1sLWxvYWRlcid9LCAvLyBSZXBsYWNlIGtleXdhcmQgYXNzZXRzOi8vIGluICpbc3JjfGhyZWZ8c3Jjc2V0fG5nLXNyY11cbiAgICAgIC8vIHtsb2FkZXI6ICdAZHIvdHJhbnNsYXRlLWdlbmVyYXRvcid9LFxuICAgICAgLy8ge2xvYWRlcjogJ0Bkci90ZW1wbGF0ZS1idWlsZGVyJ31cbiAgICBdXG4gIH07XG4gIHJ1bGVzLmZvckVhY2goKHJ1bGUsIHJ1bGVJZHgpID0+IHtcbiAgICBjb25zdCB0ZXN0ID0gcnVsZS50ZXN0O1xuICAgIGlmIChydWxlLnVzZSkge1xuICAgICAgY29uc3QgaWR4ID0gKHJ1bGUudXNlIGFzIHdlYnBhY2suUnVsZVNldExvYWRlcltdKS5maW5kSW5kZXgocnVsZVNldCA9PiBydWxlU2V0LmxvYWRlciA9PT0gJ3Bvc3Rjc3MtbG9hZGVyJyk7XG4gICAgICBpZiAoaWR4ID49IDApIHtcbiAgICAgICAgKHJ1bGUudXNlIGFzIHdlYnBhY2suUnVsZVNldExvYWRlcltdKS5zcGxpY2UoaWR4ICsgMSwgMCwge1xuICAgICAgICAgIGxvYWRlcjogJ2Nzcy11cmwtbG9hZGVyJ1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gKHJ1bGUudXNlIGFzIHdlYnBhY2suUnVsZVNldExvYWRlcltdKS5wdXNoKHtsb2FkZXI6ICdjc3MtdXJsLWxvYWRlcid9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGVzdCBpbnN0YW5jZW9mIFJlZ0V4cCAmJiB0ZXN0LnRvU3RyaW5nKCkgPT09ICcvXFxcXC5qcyQvJyAmJiBydWxlLnVzZSAmJlxuICAgICAgKHJ1bGUudXNlIGFzIHdlYnBhY2suUnVsZVNldFVzZUl0ZW1bXSkuc29tZSgoaXRlbSkgPT5cbiAgICAgICAgKGl0ZW0gYXMgd2VicGFjay5SdWxlU2V0TG9hZGVyKS5sb2FkZXIgPT09ICdAYW5ndWxhci1kZXZraXQvYnVpbGQtb3B0aW1pemVyL3dlYnBhY2stbG9hZGVyJykpIHtcblxuICAgICAgICBydWxlLnRlc3QgPSAocGF0aDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKCEvXFxcXC5qcyQvLnRlc3QocGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3QgblBhdGggPSBwYXRoLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgICAgICAgICByZXR1cm4gbm9QYXJzZS5ldmVyeSgoZXhjbHVkZSA9PiAhblBhdGguaW5jbHVkZXMoZXhjbHVkZSkpKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gQW5ndWxhciA4IGRvZXNuJ3QgaGF2ZSBsb2FkZXIgZm9yIEhUTUxcbiAgICBpZiAodGVzdCBpbnN0YW5jZW9mIFJlZ0V4cCAmJiB0ZXN0LnRvU3RyaW5nKCkgPT09ICcvXFxcXC5odG1sJC8nKSB7XG4gICAgICBoYXNIdG1sTG9hZGVyID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5rZXlzKHJ1bGUpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiBkZWxldGUgKHJ1bGUgYXMgYW55KVtrZXldKTtcbiAgICAgIE9iamVjdC5hc3NpZ24ocnVsZSwgaHRtbExvYWRlclJ1bGUpO1xuICAgIH0gZWxzZSBpZiAocnVsZS5sb2FkZXIgPT09ICdmaWxlLWxvYWRlcicpIHtcbiAgICAgIGZpbGVMb2FkZXJSdWxlSWR4ID0gcnVsZUlkeDtcbiAgICAgIE9iamVjdC5rZXlzKHJ1bGUpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiBkZWxldGUgKHJ1bGUgYXMgYW55KVtrZXldKTtcbiAgICAgIE9iamVjdC5hc3NpZ24ocnVsZSwge1xuICAgICAgICB0ZXN0OiAvXFwuKGVvdHxzdmd8Y3VyfHdlYnB8b3RmfHR0Znx3b2ZmfHdvZmYyfGFuaSkkLyxcbiAgICAgICAgdXNlOiBbe2xvYWRlcjogJ0Bkci1jb3JlL3dlYnBhY2syLWJ1aWxkZXIvZGlzdC9sb2FkZXJzL2RyLWZpbGUtbG9hZGVyJ31dXG4gICAgICB9KTtcblxuICAgIH0gZWxzZSBpZiAocnVsZS5sb2FkZXIgPT09ICd1cmwtbG9hZGVyJykge1xuICAgICAgaGFzVXJsTG9hZGVyID0gdHJ1ZTtcbiAgICAgIE9iamVjdC5rZXlzKHJ1bGUpLmZvckVhY2goKGtleTogc3RyaW5nKSA9PiBkZWxldGUgKHJ1bGUgYXMgYW55KVtrZXldKTtcbiAgICAgIE9iamVjdC5hc3NpZ24ocnVsZSwgdXJsTG9hZGVyUnVsZSk7XG4gICAgfSBlbHNlIGlmICh0ZXN0IGluc3RhbmNlb2YgUmVnRXhwICYmIHRlc3QudG9TdHJpbmcoKS5pbmRleE9mKCdcXFxcLnNjc3MnKSA+PSAwICYmIHJ1bGUudXNlKSB7XG4gICAgICBjb25zdCB1c2UgPSAocnVsZS51c2UgYXMgQXJyYXk8e1trZXk6IHN0cmluZ106IGFueSwgbG9hZGVyOiBzdHJpbmd9Pik7XG4gICAgICBjb25zdCBpbnNlcnRJZHggPSB1c2UuZmluZEluZGV4KGl0ZW0gPT4gaXRlbS5sb2FkZXIgPT09ICdzYXNzLWxvYWRlcicpO1xuICAgICAgaWYgKGluc2VydElkeCA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzYXNzLWxvYWRlciBpcyBub3QgZm91bmQnKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG5lZWRTb3VyY2VNYXAgPSB1c2VbaW5zZXJ0SWR4XS5vcHRpb25zLnNvdXJjZU1hcDtcbiAgICAgIC8vIHJlc29sdmUtdXJsLWxvYWRlcjogXCJzb3VyY2UgbWFwcyBtdXN0IGJlIGVuYWJsZWQgb24gYW55IHByZWNlZGluZyBsb2FkZXJcIlxuICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2Job2xsb3dheS9yZXNvbHZlLXVybC1sb2FkZXJcbiAgICAgIHVzZVtpbnNlcnRJZHhdLm9wdGlvbnMuc291cmNlTWFwID0gdHJ1ZTtcbiAgICAgIHVzZS5zcGxpY2UoaW5zZXJ0SWR4LCAwLCB7XG4gICAgICAgIGxvYWRlcjogJ3Jlc29sdmUtdXJsLWxvYWRlcicsXG4gICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICBzb3VyY2VNYXA6IG5lZWRTb3VyY2VNYXBcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyBydWxlLnVzZS5wdXNoKHtsb2FkZXI6ICdAZHItY29yZS93ZWJwYWNrMi1idWlsZGVyL2xpYi9kZWJ1Zy1sb2FkZXInLCBvcHRpb25zOiB7aWQ6ICdsZXNzIGxvYWRlcnMnfX0pO1xuICAgIH0gZWxzZSBpZiAodGVzdCBpbnN0YW5jZW9mIFJlZ0V4cCAmJiB0ZXN0LnRvU3RyaW5nKCkgPT09ICcvXFxcXC5sZXNzJC8nICYmIHJ1bGUudXNlKSB7XG4gICAgICBmb3IgKGNvbnN0IHVzZUl0ZW0gb2YgcnVsZS51c2UgYXMgd2VicGFjay5SdWxlU2V0TG9hZGVyW10pIHtcbiAgICAgICAgaWYgKHVzZUl0ZW0ubG9hZGVyID09PSAnbGVzcy1sb2FkZXInICYmIF8uaGFzKHVzZUl0ZW0sICdvcHRpb25zLnBhdGhzJykpIHtcbiAgICAgICAgICBkZWxldGUgKHVzZUl0ZW0ub3B0aW9ucyBhcyBhbnkpLnBhdGhzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBydWxlLnVzZS5wdXNoKHtsb2FkZXI6ICdAZHItY29yZS93ZWJwYWNrMi1idWlsZGVyL2xpYi9kZWJ1Zy1sb2FkZXInLCBvcHRpb25zOiB7aWQ6ICdsZXNzIGxvYWRlcnMnfX0pO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKCFoYXNVcmxMb2FkZXIpIHtcbiAgICBpZiAoZmlsZUxvYWRlclJ1bGVJZHggPT0gbnVsbClcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBmaWxlLWxvYWRlciBydWxlIGZyb20gQW5ndWxhclxcJ3MgV2VicGFjayBjb25maWcnKTtcbiAgICBjb25zb2xlLmxvZygnSW5zZXJ0IHVybC1sb2FkZXInKTtcbiAgICBydWxlcy5zcGxpY2UoZmlsZUxvYWRlclJ1bGVJZHggKyAxLCAwLCB1cmxMb2FkZXJSdWxlKTtcbiAgfVxuICBydWxlcy51bnNoaWZ0KHtcbiAgICAvLyB0ZXN0OiAvXFwuKD86bmdmYWN0b3J5XFwuanN8Y29tcG9uZW50XFwuaHRtbCkkLyxcbiAgICB0ZXN0OiBmaWxlID0+IHtcbiAgICAgIGlmIChmaWxlLmVuZHNXaXRoKCcuY29tcG9uZW50Lmh0bWwnKSlcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICByZXR1cm4gISFhcGkuZmluZFBhY2thZ2VCeUZpbGUoZmlsZSk7XG4gICAgfSxcbiAgICB1c2U6IFt7bG9hZGVyOiAnQGRyLWNvcmUvbmctYXBwLWJ1aWxkZXIvZGlzdC9uZy1hb3QtYXNzZXRzL25nLWFvdC1hc3NldHMtbG9hZGVyJ31dXG4gIH0pO1xuXG4gIHJ1bGVzLnVuc2hpZnQoe1xuICAgIG9uZU9mOiBbXG4gICAge1xuICAgICAgdGVzdDogL1xcLmphZGUkLyxcbiAgICAgIHVzZTogW1xuICAgICAgICB7bG9hZGVyOiAnaHRtbC1sb2FkZXInLCBvcHRpb25zOiB7YXR0cnM6ICdpbWc6c3JjJ319LFxuICAgICAgICB7bG9hZGVyOiBQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbG9hZGVycycsICduZy1odG1sLWxvYWRlcicpfSwgLy8gUmVwbGFjZSBrZXl3YXJkIGFzc2V0czovLyBpbiAqW3NyY3xocmVmfHNyY3NldHxuZy1zcmNdXG4gICAgICAgIC8vIHtsb2FkZXI6ICdAZHIvdHJhbnNsYXRlLWdlbmVyYXRvcid9LFxuICAgICAgICB7bG9hZGVyOiAnQGRyLWNvcmUvd2VicGFjazItYnVpbGRlci9saWIvamFkZS10by1odG1sLWxvYWRlcid9XG4gICAgICBdXG4gICAgfSxcbiAgICB7XG4gICAgICB0ZXN0OiAvXFwubWQkLyxcbiAgICAgIHVzZTogW1xuICAgICAgICB7bG9hZGVyOiAnaHRtbC1sb2FkZXInLCBvcHRpb25zOiB7YXR0cnM6ICdpbWc6c3JjJ319LFxuICAgICAgICB7bG9hZGVyOiBQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbG9hZGVycycsICduZy1odG1sLWxvYWRlcicpfSwgLy8gUmVwbGFjZSBrZXl3YXJkIGFzc2V0czovLyBpbiAqW3NyY3xocmVmfHNyY3NldHxuZy1zcmNdXG4gICAgICAgIHtsb2FkZXI6ICdAZHItY29yZS93ZWJwYWNrMi1idWlsZGVyL2xpYi9tYXJrZG93bi1sb2FkZXInfVxuICAgICAgXVxuICAgIH0sXG4gICAge1xuICAgICAgdGVzdDogL1xcLnR4dCQvLFxuICAgICAgdXNlOiB7bG9hZGVyOiAncmF3LWxvYWRlcid9XG4gICAgfSwge1xuICAgICAgdGVzdDogL1xcLih5YW1sfHltbCkkLyxcbiAgICAgIHVzZTogW1xuICAgICAgICB7bG9hZGVyOiAnanNvbi1sb2FkZXInfSxcbiAgICAgICAge2xvYWRlcjogJ3lhbWwtbG9hZGVyJ31cbiAgICAgIF1cbiAgICB9XVxuICB9KTtcblxuICBpZiAoIWhhc0h0bWxMb2FkZXIpIHtcbiAgICBydWxlc1swXS5vbmVPZiAmJiBydWxlc1swXS5vbmVPZi5wdXNoKGh0bWxMb2FkZXJSdWxlKTtcbiAgfVxufVxuXG4vLyBmdW5jdGlvbiBub3RBbmd1bGFySnMoZmlsZTogc3RyaW5nKSB7XG4vLyBcdGlmICghZmlsZS5lbmRzV2l0aCgnLmpzJykgfHwgZmlsZS5lbmRzV2l0aCgnLm5nZmFjdG9yeS5qcycpIHx8IGZpbGUuZW5kc1dpdGgoJy5uZ3N0eWxlLmpzJykpXG4vLyBcdFx0cmV0dXJuIGZhbHNlO1xuLy8gXHRpZiAobm9QYXJzZS5zb21lKG5hbWUgPT4gZmlsZS5yZXBsYWNlKC9cXFxcL2csICcvJykuaW5jbHVkZXMobmFtZSkpKVxuLy8gXHRcdHJldHVybiBmYWxzZTtcbi8vIFx0Ly8gY29uc3QgcGsgPSBhcGkuZmluZFBhY2thZ2VCeUZpbGUoZmlsZSk7XG4vLyBcdC8vIGlmIChwayAmJiBway5kcikge1xuLy8gXHQvLyBcdHJldHVybiB0cnVlO1xuLy8gXHQvLyB9XG4vLyBcdGNvbnNvbGUubG9nKCdiYWJlbDogJywgZmlsZSk7XG4vLyBcdHJldHVybiB0cnVlO1xuLy8gfVxuXG5mdW5jdGlvbiBjaGFuZ2VTcGxpdENodW5rcyhwYXJhbTogQW5ndWxhckNsaVBhcmFtLCB3ZWJwYWNrQ29uZmlnOiBhbnkpIHtcbiAgaWYgKHdlYnBhY2tDb25maWcub3B0aW1pemF0aW9uID09IG51bGwpXG4gICAgcmV0dXJuOyAvLyBTU1InIFdlYnBhY2sgY29uZmlnIGRvZXMgbm90IGhhcyB0aGlzIHByb3BlcnR5XG4gIGNvbnN0IG9sZFZlbmRvclRlc3RGdW5jID0gXy5nZXQod2VicGFja0NvbmZpZywgJ29wdGltaXphdGlvbi5zcGxpdENodW5rcy5jYWNoZUdyb3Vwcy52ZW5kb3IudGVzdCcpO1xuXG4gIGlmIChvbGRWZW5kb3JUZXN0RnVuYykge1xuICAgIGNvbnN0IGNhY2hlR3JvdXBzOiB7W2tleTogc3RyaW5nXTogd2VicGFjay5PcHRpb25zLkNhY2hlR3JvdXBzT3B0aW9uc30gPSB3ZWJwYWNrQ29uZmlnLm9wdGltaXphdGlvbi5zcGxpdENodW5rcy5jYWNoZUdyb3VwcztcbiAgICBjYWNoZUdyb3Vwcy52ZW5kb3IudGVzdCA9IHZlbmRvclRlc3Q7XG4gICAgY2FjaGVHcm91cHMubGF6eVZlbmRvciA9IHtcbiAgICAgIG5hbWU6ICdsYXp5LXZlbmRvcicsXG4gICAgICBjaHVua3M6ICdhc3luYycsXG4gICAgICBlbmZvcmNlOiB0cnVlLFxuICAgICAgdGVzdDogdmVuZG9yVGVzdCxcbiAgICAgIHByaW9yaXR5OiAxXG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZlbmRvclRlc3QobW9kdWxlOiBhbnksIGNodW5rczogQXJyYXk8eyBuYW1lOiBzdHJpbmcgfT4pIHtcbiAgICBjb25zdCBtYXliZVZlbmRvciA9IG9sZFZlbmRvclRlc3RGdW5jKG1vZHVsZSwgY2h1bmtzKTtcbiAgICBpZiAoIW1heWJlVmVuZG9yKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IHJlc291cmNlID0gbW9kdWxlLm5hbWVGb3JDb25kaXRpb24gPyBtb2R1bGUubmFtZUZvckNvbmRpdGlvbigpIDogJyc7XG4gICAgLy8gY29uc29sZS5sb2coYHZlbmRvciB0ZXN0LCByZXNvdXJjZTogJHtyZXNvdXJjZX0sIGNodW5rczogJHtjaHVua3MubWFwKCBjID0+IGMubmFtZSl9YCk7XG4gICAgY29uc3QgcGsgPSBhcGkuZmluZFBhY2thZ2VCeUZpbGUocmVzb3VyY2UpO1xuICAgIHJldHVybiBwayA9PSBudWxsIHx8IHBrLmRyID09IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gcHJpbnRDb25maWcoYzogYW55LCBsZXZlbCA9IDApOiBzdHJpbmcge1xuICB2YXIgaW5kZW50ID0gXy5yZXBlYXQoJyAgJywgbGV2ZWwpO1xuICB2YXIgb3V0ID0gJ3tcXG4nO1xuICBfLmZvck93bihjLCAodmFsdWU6IGFueSwgcHJvcDogc3RyaW5nKSA9PiB7XG4gICAgb3V0ICs9IGluZGVudCArIGAgICR7SlNPTi5zdHJpbmdpZnkocHJvcCl9OiAke3ByaW50Q29uZmlnVmFsdWUodmFsdWUsIGxldmVsKX0sXFxuYDtcbiAgfSk7XG4gIG91dCArPSBpbmRlbnQgKyAnfSc7XG4gIHJldHVybiBvdXQ7XG59XG5cbmZ1bmN0aW9uIHByaW50Q29uZmlnVmFsdWUodmFsdWU6IGFueSwgbGV2ZWw6IG51bWJlcik6IHN0cmluZyB7XG4gIHZhciBvdXQgPSAnJztcbiAgdmFyIGluZGVudCA9IF8ucmVwZWF0KCcgICcsIGxldmVsKTtcbiAgaWYgKF8uaXNTdHJpbmcodmFsdWUpIHx8IF8uaXNOdW1iZXIodmFsdWUpIHx8IF8uaXNCb29sZWFuKHZhbHVlKSkge1xuICAgIG91dCArPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgKyAnJztcbiAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgIG91dCArPSAnW1xcbic7XG4gICAgKHZhbHVlIGFzIGFueVtdKS5mb3JFYWNoKChyb3c6IGFueSkgPT4ge1xuICAgICAgb3V0ICs9IGluZGVudCArICcgICAgJyArIHByaW50Q29uZmlnVmFsdWUocm93LCBsZXZlbCArIDEpO1xuICAgICAgb3V0ICs9ICcsXFxuJztcbiAgICB9KTtcbiAgICBvdXQgKz0gaW5kZW50ICsgJyAgXSc7XG4gIH0gZWxzZSBpZiAoXy5pc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIG91dCArPSB2YWx1ZS5uYW1lICsgJygpJztcbiAgfSBlbHNlIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBvdXQgKz0gYCR7dmFsdWUudG9TdHJpbmcoKX1gO1xuICB9IGVsc2UgaWYgKF8uaXNPYmplY3QodmFsdWUpKSB7XG4gICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpO1xuICAgIGlmIChwcm90byAmJiBwcm90by5jb25zdHJ1Y3RvciAhPT0gT2JqZWN0KSB7XG4gICAgICBvdXQgKz0gYG5ldyAke3Byb3RvLmNvbnN0cnVjdG9yLm5hbWV9KClgO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXQgKz0gcHJpbnRDb25maWcodmFsdWUsIGxldmVsICsgMSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIG91dCArPSAnIHVua25vd24nO1xuICB9XG4gIHJldHVybiBvdXQ7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0cmFuc2Zvcm1JbmRleEh0bWwoY29udGV4dDogQnVpbGRlckNvbnRleHQsIGNvbnRlbnQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIHJldHVybiB0cmFuc2Zvcm1IdG1sKGNvbnRlbnQsIGNvbnRleHQubmdCdWlsZE9wdGlvbi5icm93c2VyT3B0aW9ucywgc3JjVXJsID0+IHtcbiAgICAgIGNvbnN0IG1hdGNoID0gLyhbXi8uXSspKD86XFwuW14vLl0rKSskLy5leGVjKHNyY1VybCk7XG4gICAgICBpZiAobWF0Y2ggJiYgY29udGV4dC5pbmxpbmVBc3NldHMuaGFzKG1hdGNoWzFdKSkge1xuICAgICAgICBjb25zdCBzb3VyY2UgPSBjb250ZXh0LmlubGluZUFzc2V0cy5nZXQobWF0Y2hbMV0pO1xuICAgICAgICByZXR1cm4gc21VcmwucmVtb3ZlRnJvbShzb3VyY2UhKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgbG9nLmVycm9yKGUpO1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxuIl19
