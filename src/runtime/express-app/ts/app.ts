import express = require('express');
import {Request, Response, NextFunction} from 'express';
import * as Path from 'path';
// var favicon = require('serve-favicon');
import * as log4js from 'log4js';
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engines = require('consolidate');
var swig = require('swig-templates');
var setupApi = require('../setupApi');
import api from '__api';
var log = log4js.getLogger(api.packageName);
var compression = require('compression');
// var swigInjectLoader = require('swig-package-tmpl-loader');

const VIEW_PATH = Path.relative(api.config().rootPath,
	Path.resolve(__dirname, '..', 'views'));
var app: express.Express;

export = {
	activate() {
		app = express();
		setupApi(api, app);
		api.eventBus.on('packagesActivated', function(packageCache) {
			log.info('packagesActivated');
			process.nextTick(() => {
				create(app, api.config());
				api.eventBus.emit('appCreated', app);
			});
		});
	},
	set app(expressApp: express.Express) {
		app = expressApp;
	},
	get app() {
		return app;
	}
};

function create(app: express.Express, setting: any) {
	// view engine setup
	swig.setDefaults({
		varControls: ['{=', '=}'],
		cache: setting.devMode ? false : 'memory'
	});
	// var injector = require('__injector');
	// var translateHtml = require('@dr/translate-generator').htmlReplacer();
	// swigInjectLoader.swigSetup(swig, {
	// 	injector: injector
	// 	// fileContentHandler: function(file, source) {
	// 	// 	return translateHtml(source, file, api.config.get('locales[0]'));
	// 	// }
	// });

	engines.requires.swig = swig;
	app.engine('html', engines.swig);
	app.set('view cache', false);
	// app.engine('jade', engines.jade);
	app.set('trust proxy', true);
	app.set('views', [setting.rootPath]);
	app.set('view engine', 'html');
	app.set('x-powered-by', false);
	app.set('env', api.config().devMode ? 'development' : 'production');
	setupApi.applyPackageDefinedAppSetting(app);
	// uncomment after placing your favicon in /public
	// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
	// app.use(logger('dev'));
	app.use(log4js.connectLogger(log, {
		level: 'INFO'
	}));
	app.use(bodyParser.json({
		limit: '50mb'
	}));
	app.use(bodyParser.urlencoded({
		extended: false
	}));
	app.use(bodyParser.raw());
	app.use(bodyParser.text());
	app.use(cookieParser());
	app.use(compression());
	// setupApi.createPackageDefinedMiddleware(app);
	setupApi.createPackageDefinedRouters(app);

	const hashFile = Path.join(api.config().rootPath, 'githash-server.txt');
	if (fs.existsSync(hashFile)) {
		const githash = fs.readFileSync(hashFile, 'utf8');
		app.get('/githash-server', (req: Request, res: Response) => {
			res.set('Content-Type', 'text/plain');
			res.send(githash);
		});
		app.get('/githash-server.txt', (req: Request, res: Response) => {
			res.set('Content-Type', 'text/plain');
			res.send(githash);
		});
	}
	// error handlers
	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		log.info('originalUrl: ' + req.originalUrl);
		var err = new Error('Not Found');
		(err as any).status = 404;
		next(err);
	});

	// development error handler
	// will print stacktrace
	if (setting.devMode || app.get('env') === 'development') {
		app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
			res.status((err as any).status || 500);
			log.error(req.originalUrl, err);
			res.render(Path.join(VIEW_PATH, '_drcp-express-error.html'), {
				message: err.message,
				error: err
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err: Error, req: Request, res: Response, next: NextFunction) {
		res.status((err as any).status || 500);
		log.error(req.originalUrl, err);
		res.render(Path.join(VIEW_PATH, '_drcp-express-error.html'), {
			message: err.message,
			error: {}
		});
	});
	return app;
}