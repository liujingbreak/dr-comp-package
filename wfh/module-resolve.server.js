// var log = require('log4js').getLogger('wfh.' + __filename);
// var Path = require('path');
module.exports = function(injector) {
	var _ = require('lodash');
	var config = require('./lib/config');

	injector.fromPackage('url-loader').alias('file-loader', '@dr-core/webpack2-builder/lib/dr-file-loader');

	// Hacking less-loader start: to append NpmImportPlugin to less render plugin list
	try {
		var less = require('less');
		var oldLessRender = less.render;
		var NpmImportPlugin;
		if ([
			'less-plugin-npm-import',
			'@dr-core/webpack2-builder/node_modules/less-plugin-npm-import'
		].some(m => {
			try {
				NpmImportPlugin = require(m);
			} catch (e) {
				return false;
			}
		})) {
			injector.fromDir(['node_modules/less-loader', '@dr-core/webpack2-builder/node_modules/less-loader'])
			.factory('less', function(file) {
				if (less.render !== hackedLessRender)
					less.render = hackedLessRender;
				return less;
			});
		}
	} catch (e) {
		console.log('Don\'t panic, this might be normal: ', e);
		console.log('Skip setting up LESS hacking for above issue, it might be normal to a production Node.js HTTP server environment.');
	}
	function hackedLessRender(source, options, ...others) {
		options.plugins.push(new NpmImportPlugin());
		return oldLessRender.call(less, source, options, ...others);
	}
	// Hacking less-loader end

	var chalk = require('chalk');
	injector.fromAllComponents()
	.factory('chalk', function() {
		return new chalk.constructor({enabled: config.get('colorfulConsole') !== false && _.toLower(process.env.CHALK_ENABLED) !== 'false'});
	});

	// Hack filesystem
	// var fs = require('fs');
	// var oldWriteFile = fs.writeFile;
	// var oldWriteFileSync = fs.writeFileSync;
	// var hackedFs = Object.assign({}, fs, {
	// 	writeFile(path) {
	// 		log.warn('writeFile ', path);
	// 		return oldWriteFile.apply(fs, arguments);
	// 	},
	// 	writeFileSync(path) {
	// 		log.warn('writeFileSync', path);
	// 		return oldWriteFileSync.apply(fs, arguments);
	// 	}
	// });

	// injector.fromDir(['node_modules/dr-comp-package/node_modules/typescript', 'node_modules/typescript'])
	// .factory('fs', function() {
	// 	//log.warn(arguments);
	// 	return hackedFs;
	// });
};
