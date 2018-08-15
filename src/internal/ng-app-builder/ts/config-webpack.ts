/* tslint:disable no-console max-line-length */
import ChunkInfoPlugin from './plugins/chunk-info';
import gzipSize from './plugins/gzip-size';
import IndexHtmlPlugin from './plugins/index-html-plugin';
import {AngularCliParam} from './ng/common';
import * as _ from 'lodash';
import * as fs from 'fs';
import { isRegExp } from 'util';
import * as Path from 'path';
import {Compiler, HotModuleReplacementPlugin} from 'webpack';
import api from '__api';
import {AngularCompilerPlugin} from '@ngtools/webpack';
import createHook from './ng-ts-replace';
import ReadHookHost from './utils/read-hook-vfshost';
const {babel} = require('@dr-core/webpack2-builder/configs/loader-config');
// const log = require('log4js').getLogger('ng-app-builder.config-webpack');

export default function changeWebpackConfig(param: AngularCliParam, webpackConfig: any, drcpConfig: any): any {
	// const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer');
	console.log('>>>>>>>>>>>>>>>>> changeWebpackConfig >>>>>>>>>>>>>>>>>>>>>>');
	if (_.get(param, 'builderConfig.options.drcpArgs.report') ||
		param.browserOptions.drcpArgs.report ||(param.browserOptions.drcpArgs.openReport)) {
		// webpackConfig.plugins.unshift(new BundleAnalyzerPlugin({
		// 	analyzerMode: 'static',
		// 	reportFilename: 'bundle-report.html',
		// 	openAnalyzer: options.drcpArgs.openReport
		// }));
		webpackConfig.plugins.push(
			new ChunkInfoPlugin()
		);
	}

	const ngCompilerPlugin: AngularCompilerPlugin = webpackConfig.plugins.find((plugin: any) => {
		return (plugin instanceof AngularCompilerPlugin);
	});
	if (ngCompilerPlugin == null)
		throw new Error('Can not find AngularCompilerPlugin');
	// hack _options.host before angular/packages/ngtools/webpack/src/angular_compiler_plugin.ts apply() runs
	webpackConfig.plugins.unshift(new class {
		apply(compiler: Compiler) {
			(ngCompilerPlugin as any)._options.host = new ReadHookHost((compiler as any).inputFileSystem, createHook(param));
		}
	}());

	if (_.get(param, 'builderConfig.options.hmr'))
		webpackConfig.plugins.push(new HotModuleReplacementPlugin());
	if (!drcpConfig.devMode) {
		console.log('Build in production mode');
		webpackConfig.plugins.push(new gzipSize());
	}

	if (webpackConfig.target !== 'node') {
		webpackConfig.plugins.push(new IndexHtmlPlugin({
				indexHtml: Path.basename(param.browserOptions.index),
				inlineChunkNames: ['runtime']
			}));
	} else {
		// This is condition of Server side rendering
		// Refer to angular-cli/packages/angular_devkit/build_angular/src/angular-cli-files/models/webpack-configs/server.ts
		if (param.browserOptions.bundleDependencies === 'none') {
			webpackConfig.externals = [
			  /^@angular/,
			  (_: any, request: any, callback: (error?: any, result?: any) => void) => {
				// Absolute & Relative paths are not externals
				if (request.match(/^\.{0,2}\//)) {
					return callback();
				}
				try {
					// Attempt to resolve the module via Node
					const e = require.resolve(request);
					let comp = api.findPackageByFile(e);
					if (comp == null || comp.dr == null ) {
						// It's a node_module
						callback(null, request);
					} else {
						// It's a system thing (.ie util, fs...)
						callback();
					}
				} catch (e) {
					// Node couldn't find it, so it must be user-aliased
					callback();
				}
			  }
			];
		  }
	}
	webpackConfig.plugins.push(new CompileDonePlugin());

	changeSplitChunks(param, webpackConfig);
	changeLoaders(webpackConfig);

	if (param.ssr) {
		webpackConfig.devtool = 'source-map';
	}

	let wfname = `dist/webpack-${param.ssr ? 'ssr' : 'browser'}.config.js`;
	fs.writeFileSync(wfname, printConfig(webpackConfig));
	console.log('If you are wondering what kind of Webapck config file is used internally, checkout ' + wfname);
	return webpackConfig;
}

function changeLoaders(webpackConfig: any) {
	const devMode = webpackConfig.mode === 'development';
	webpackConfig.resolveLoader = {
		modules: ['node_modules']
	};
	webpackConfig.module.rules.forEach((rule: any) => {
		const test = rule.test;
		if (test instanceof RegExp && test.toString() === '/\\.html$/') {
			Object.keys(rule).forEach((key: string) => delete rule[key]);
			Object.assign(rule, {
				test,
				use: [
					{loader: 'raw-loader'},
					{loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader')}, // Replace keyward assets:// in *[src|href|srcset|ng-src]
					// {loader: '@dr/translate-generator'},
					{loader: '@dr/template-builder'}
				]
			});
		} else if (rule.loader === 'file-loader') {
			Object.keys(rule).forEach((key: string) => delete rule[key]);
			Object.assign(rule, {
				test: /\.(eot|woff2|woff|ttf|svg|cur)$/,
				use: [{loader: 'lib/dr-file-loader'}]
			});
		} else if (rule.loader === 'url-loader') {
			Object.keys(rule).forEach((key: string) => delete rule[key]);
			Object.assign(rule, {
				test,
				use: [{
						loader: 'url-loader',
						options: {
							limit: !devMode ? 10000 : 1, // <10k ,use base64 format, dev mode only use url for speed
							fallback: '@dr-core/webpack2-builder/lib/dr-file-loader'
						}
					}
				]
			});
		} else if (test instanceof RegExp && test.toString().indexOf('\\.scss') >= 0 && rule.use) {
			const use = (rule.use as Array<{[key: string]: any, loader: string}>);
			let insertIdx = use.findIndex(item => item.loader === 'sass-loader');
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
		} else if (test instanceof RegExp && test.toString() === '/\\.less$/' && rule.use) {
			for (const useItem of rule.use) {
				if (useItem.loader === 'less-loader' && _.has(useItem, 'options.paths')) {
					delete useItem.options.paths;
					break;
				}
			}
			// rule.use.push({loader: '@dr-core/webpack2-builder/lib/debug-loader', options: {id: 'less loaders'}});
		}
	});
	webpackConfig.module.rules.unshift({
			test: /\.jade$/,
			use: [
				{loader: 'html-loader', options: {attrs: 'img:src'}},
				{loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader')}, // Replace keyward assets:// in *[src|href|srcset|ng-src]
				// {loader: '@dr/translate-generator'},
				{loader: '@dr-core/webpack2-builder/lib/jade-to-html-loader'}
			]
		},
		{
			test: /\.md$/,
			use: [
				{loader: 'html-loader', options: {attrs: 'img:src'}},
				{loader: Path.resolve(__dirname, 'loaders', 'ng-html-loader')}, // Replace keyward assets:// in *[src|href|srcset|ng-src]
				{loader: '@dr-core/webpack2-builder/lib/markdown-loader'}
			]
		},
		{
			test: /\.txt$/,
			use: {loader: 'raw-loader'}
		}, {
			test: /\.(yaml|yml)$/,
			use: [
				{loader: 'json-loader'},
				{loader: 'yaml-loader'}
			]
		},
		{
			test: isDrJs,
			use: [babel()]
		}
	);
}

function isDrJs(file: string) {
	if (!file.endsWith('.js') || file.endsWith('.ngfactory.js') || file.endsWith('.ngstyle.js'))
		return false;
	const pk = api.findPackageByFile(file);
	if (pk && pk.dr) {
		// log.warn('js file', file);
		return true;
	}
	return false;
}

function changeSplitChunks(param: AngularCliParam, webpackConfig: any) {
	if (webpackConfig.optimization == null)
		return; // SSR' Webpack config does not has this property
	const oldVendorTestFunc = _.get(webpackConfig, 'optimization.splitChunks.cacheGroups.vendor.test');

	function vendorTest(module: any, chunks: Array<{ name: string }>) {
		const maybeVendor = oldVendorTestFunc(module, chunks);
		if (!maybeVendor)
			return false;
		const resource = module.nameForCondition ? module.nameForCondition() : '';
		const pk = api.findPackageByFile(resource);
		return pk == null || pk.dr == null;
	}

	if (oldVendorTestFunc) {
		webpackConfig.optimization.splitChunks.cacheGroups.vendor.test = vendorTest;
		webpackConfig.optimization.splitChunks.cacheGroups.lazyVendor = {
			name: 'lazy-vendor',
			chunks: 'async',
			enforce: true,
			test: vendorTest
		};
	}
}

function printConfig(c: any, level = 0): string {
	var indent = _.repeat('  ', level);
	var out = '{\n';
	_.forOwn(c, (value: any, prop: string) => {
		out += indent + `  ${JSON.stringify(prop)}: ${printConfigValue(value, level)},\n`;
	});
	out += indent + '}';
	return out;
}

function printConfigValue(value: any, level: number): string {
	var out = '';
	var indent = _.repeat('  ', level);
	if (_.isString(value) || _.isNumber(value) || _.isBoolean(value)) {
		out += JSON.stringify(value) + '';
	} else if (Array.isArray(value)) {
		out += '[\n';
		(value as any[]).forEach((row: any) => {
			out += indent + '    ' + printConfigValue(row, level + 1);
			out += ',\n';
		});
		out += indent + '  ]';
	} else if (_.isFunction(value)) {
		out += value.name + '()';
	} else if (isRegExp(value)) {
		out += `${value.toString()}`;
	} else if (_.isObject(value)) {
		const proto = Object.getPrototypeOf(value);
		if (proto && proto.constructor !== Object) {
			out += `new ${proto.constructor.name}()`;
		} else {
			out += printConfig(value, level + 1);
		}
	} else {
		out += ' unknown';
	}
	return out;
}

class CompileDonePlugin {

	apply(compiler: Compiler) {
		compiler.hooks.done.tap('drcp-devserver-build-webpack', (stats) => {
			api.eventBus.emit('webpackDone', {success: true});
		});
	}
}
