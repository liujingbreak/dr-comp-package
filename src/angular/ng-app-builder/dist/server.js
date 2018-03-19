"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __api_1 = require("__api");
const log4js = require("log4js");
const _ = require("lodash");
const Path = require("path");
const postcss_1 = require("./postcss");
const fs = require('fs-extra');
const sysFs = fs;
const rxPaths = require('rxjs/_esm5/path-mapping');
const api = __api_1.default;
const log = log4js.getLogger(api.packageName);
// const CircularDependencyPlugin = require('circular-dependency-plugin');
const { PurifyPlugin } = require('@angular-devkit/build-optimizer');
const webpack_1 = require("@ngtools/webpack");
// const {SourceMapDevToolPlugin} = require('webpack');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');
// const loaderConfig = require('@dr-core/webpack2-builder/configs/loader-config');
// const HappyPack = require('happypack');
const AOT = true;
function compile() {
    if (!api.argv.ng)
        return;
    var tsConfigPath = writeTsconfig();
    // var useHappypack = api.config.get('@dr-core/webpack2-builder.useHappypack', false);
    var devMode = api.config().devMode;
    // var happyThreadPool = HappyPack.ThreadPool({
    // 	size: api.config.get('@dr-core/webpack2-builder.happyThreadPoolSize', 2)
    // });
    api.configWebpackLater(function (webpackConfig) {
        if (webpackConfig.resolve.alias)
            Object.assign(webpackConfig.resolve.alias, rxPaths());
        else
            webpackConfig.resolve.alias = rxPaths();
        webpackConfig.resolve.mainFields = [
            'browser',
            'module',
            'main'
        ];
        if (webpackConfig.resolveLoader.alias)
            Object.assign(webpackConfig.resolveLoader.alias, rxPaths());
        else
            webpackConfig.resolveLoader.alias = rxPaths();
        webpackConfig.module.rules.push({
            test: /\.css$/,
            compiler: AOT ? () => true : undefined,
            issuer: AOT ? undefined : api.isIssuerAngular,
            use: [
                'exports-loader?module.exports.toString()',
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: api.config().enableSourceMaps,
                        import: false
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: postcss_1.default,
                        sourceMap: api.config().enableSourceMaps
                    }
                },
                { loader: 'lib/css-url-assets-loader' },
                { loader: 'require-injector/css-loader', options: {
                        injector: api.browserInjector
                    } }
            ]
        }, {
            test: /\.scss$|\.sass$/,
            compiler: AOT ? () => true : undefined,
            issuer: AOT ? undefined : api.isIssuerAngular,
            use: [
                'exports-loader?module.exports.toString()',
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: api.config().enableSourceMaps,
                        import: false
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: postcss_1.default,
                        sourceMap: api.config().enableSourceMaps
                    }
                },
                { loader: 'lib/css-url-assets-loader' },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: api.config().enableSourceMaps,
                        precision: 8,
                        includePaths: []
                    }
                },
                { loader: 'require-injector/css-loader', options: {
                        injector: api.browserInjector
                    } }
            ]
        }, {
            test: /\.less$/,
            compiler: AOT ? () => true : undefined,
            issuer: AOT ? undefined : api.isIssuerAngular,
            use: [
                'exports-loader?module.exports.toString()',
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: api.config().enableSourceMaps,
                        import: false
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: postcss_1.default,
                        sourceMap: api.config().enableSourceMaps
                    }
                },
                { loader: 'lib/css-url-assets-loader' },
                { loader: 'less-loader', options: {
                        sourceMap: api.config().enableSourceMaps
                    } },
                { loader: 'require-injector/css-loader', options: {
                        injector: api.browserInjector
                    } }
            ]
        }, devMode ?
            {
                test: shouldUseNgLoader,
                use: ['@ngtools/webpack']
            } : {
            test: shouldUseNgLoader,
            use: [
                {
                    loader: '@angular-devkit/build-optimizer/webpack-loader',
                    options: {
                        sourceMap: api.config().enableSourceMaps
                    }
                },
                '@ngtools/webpack'
            ]
        });
        // var entryPackage = api.packageInfo.moduleMap['@dr-core/ng-app-builder'];
        var angularCompiler = new webpack_1.AngularCompilerPlugin({
            mainPath: Path.resolve(__dirname, '../browser/main.ts'),
            // mainPath: require.resolve('@dr/angular-app/main.ts'),
            basePath: api.config().rootPath,
            platform: 0,
            skipCodeGeneration: !AOT,
            // forkTypeChecker: true, // Only available at version above 6.0.0
            // Angular 5 has a bug with Typescript > 2.4.2:
            // "Host should not return a redirect source file from `getSourceFile`"
            hostReplacementPaths: environmentMap(),
            sourceMap: api.config().enableSourceMaps,
            tsConfigPath,
            compilerOptions: {}
        });
        // TODO: require-injector
        // (angularCompiler as any)._compilerHost.writeFile();
        webpackConfig.plugins.push(angularCompiler);
        // let env = api.argv.env;
        // if (env) {
        // 	api.browserInjector.fromAllComponents().alias(
        // 		/^.*\/environment(\?:.ts)?$/, (file: string, result: RegExpExecArray) => {
        // 		if (file.endsWith('.ts')) {
        // 			return result[0] + '.' + env;
        // 		}
        // 		log.warn(file, result);
        // 		return result[0];
        // 	});
        // }
        if (!devMode) {
            webpackConfig.plugins.push(new PurifyPlugin());
        }
        return webpackConfig;
    });
}
exports.compile = compile;
function shouldUseNgLoader(file) {
    if (!/(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/.test(file))
        return false;
    var component = api.findPackageByFile(file);
    if (!component)
        return true;
    else if (_.get(component, 'dr.angularCompiler'))
        return true;
    return false;
}
function writeTsconfig() {
    var root = api.config().rootPath;
    var tempDir = api.config.resolve('destDir', 'webpack-temp');
    sysFs.mkdirsSync(tempDir);
    var packageScopes = api.config().packageScopes;
    var components = api.packageInfo.moduleMap;
    var ngPackages = api.packageInfo.allModules;
    if (api.argv.package && api.argv.package.length > 0) {
        var someComps = [];
        var packages = _.uniq([...api.argv.package, api.packageName]);
        for (let name of packages) {
            if (_.has(components, name) && _.has(components, [name, 'dr', 'angularCompiler'])) {
                someComps.push(components[name]);
            }
            else {
                packageScopes.some(scope => {
                    let testName = `@${scope}/${name}`;
                    if (_.has(components, testName) && _.get(components, [name, 'dr', 'angularCompiler'])) {
                        someComps.push(components[testName]);
                        return true;
                    }
                    return false;
                });
            }
        }
        ngPackages = someComps;
    }
    else {
        ngPackages = ngPackages.filter(comp => comp.dr && comp.dr.angular);
    }
    let tsInclude = [];
    let tsExclude = [];
    ngPackages.forEach(pk => {
        let dir = Path.relative(tempDir, pk.realPackagePath).replace(/\\/g, '/');
        tsInclude.push(dir + '/**/*.ts');
        tsExclude.push(dir + '/ts', dir + '/**/*.spec.ts');
    });
    tsExclude.push('**/test.ts');
    for (let comp of ngPackages) {
        log.warn(comp.longName);
    }
    var tsjson = {
        extends: require.resolve('@dr-core/webpack2-builder/configs/tsconfig.json'),
        include: tsInclude,
        exclude: tsExclude,
        compilerOptions: {
            baseUrl: root,
            typeRoots: [
                Path.resolve(root, 'node_modules/@types'),
                Path.resolve(root, 'node_modules/@dr-types'),
                Path.resolve(root, 'node_modules/dr-comp-package/wfh/types')
            ],
            module: 'esnext'
        },
        angularCompilerOptions: {
            trace: true,
            strictMetadataEmit: true
        }
    };
    var tsConfigPath = Path.resolve(tempDir, 'angular-app-tsconfig.json');
    fs.writeFileSync(tsConfigPath, JSON.stringify(tsjson, null, '  '));
    return tsConfigPath;
}
function environmentMap() {
    // var rootDir: string = api.config().rootPath;
    var env = api.argv.env;
    var envMap = {};
    api.packageInfo.allModules.forEach(pkg => {
        if (_.get(pkg, ['dr', 'angularCompiler'])) {
            let envFile = Path.resolve(pkg.realPackagePath, 'environments', `environment${env ? '.' + env : ''}.ts`);
            let defaultFile = Path.resolve(pkg.realPackagePath, 'environments', 'environment.ts');
            if (envFile === defaultFile)
                return;
            if (fs.existsSync(envFile)) {
                envMap[defaultFile] = envFile;
                // envMap[Path.relative(rootDir, Path.resolve(pkg.realPackagePath, 'environments', 'environment.ts'))] =
                // Path.relative(rootDir, envFile);
            }
        }
    });
    log.info('environments: ', envMap);
    return envMap;
}

//# sourceMappingURL=server.js.map
