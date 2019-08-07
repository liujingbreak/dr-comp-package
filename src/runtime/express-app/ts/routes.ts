import express, {Application} from 'express';
import ExpressAppApi from './api-types';
import api from '__api';
import {DrcpApi} from '@dr-core/ng-app-builder/globals';
import _ from 'lodash';
import Path from 'path';
export {ExpressAppApi};
var log = require('log4js').getLogger(api.packageName + '.setApi');
var swig = require('swig-templates');

interface RouterDefCallback {
  (app: Application, exp: typeof express): void;
  packageName?: string;
}

var routerSetupFuncs: RouterDefCallback[] = [];
// var middlewares = [];
var appSets: RouterDefCallback[] = [];


export function createPackageDefinedRouters(app: Application) {
  routerSetupFuncs.forEach(function(routerDef) {
    try {
      log.debug(routerDef.packageName, 'defines router/middleware');
      routerDef(app, express);
    } catch (er) {
      log.error('package ' + routerDef.packageName + ' router', er);
      throw er;
    }
  });
  // app.use(revertRenderFunction);
  // app.use(revertRenderFunctionForError);//important
}

export function applyPackageDefinedAppSetting(app: Application) {
  appSets.forEach(callback => {
    callback(app, express);
  });
}

export function setupApi(api: ExpressAppApi & DrcpApi, app: Application) {
  var apiPrototype: ExpressAppApi = Object.getPrototypeOf(api);
  apiPrototype.express = express;
  apiPrototype.expressApp = app;
  apiPrototype.swig = swig;

  /**
	 * setup a router under package context path
	 * same as app.use('/<package-path>', router);
	 * @return {[type]} [description]
	 */
  apiPrototype.router = function() {
    var self = this;
    var calleePackageName = this.packageName;
    if (self._router) {
      return self._router;
    }
    var router = self._router = express.Router();
    var contextPath = self.contextPath;
    var packageRelPath = Path.relative(self.config().rootPath, self.packageInstance.path);
    if (Path.sep === '\\') {
      packageRelPath = packageRelPath.replace(/\\/g, '/');
    }
    log.debug('package relative path: ' + packageRelPath);
    packageRelPath += '/';
    let oldRender: express.Response['render'];
    function setupRouter(app: Application) {
      app.use(contextPath, function(req, res, next) {
        log.debug('In package', calleePackageName, self.packageName, 'middleware customized res.render');
        if (!oldRender)
          oldRender = Object.getPrototypeOf(res).render;
        res.render = customizedRender;
        next();
      });
      // log.debug(self.packageName + ': app.use context path = ' + contextPath);
      app.use(contextPath, router);
      app.use(contextPath, function(req, res, next) {
        delete res.render;
        log.debug('Out package', calleePackageName, self.packageName, 'cleanup customized res.render');
        next();
      });
      // If an error encountered in previous middlewares, we still need to cleanup render method
      app.use(contextPath, function(err, req, res, next) {
        log.warn('cleanup render() when encountering error in ', contextPath);
        delete res.render;
        next(err);
      } as express.ErrorRequestHandler);
    }
    setupRouter.packageName = self.packageName;
    // this function will be
    // cached in array and executed later.
    // Thus save current stack for later debug.
    setupRouter.stack = new Error().stack;
    routerSetupFuncs.push(setupRouter);

    function customizedRender() {
      var args = [].slice.call(arguments);
      if (arguments[0].endsWith('_drcp-express-error.html'))
        return oldRender.apply(this, args);
      else if (_.startsWith(args[0], '/')) {
        args[0] = args[0].substring(1);
      } else {
        args[0] = packageRelPath + arguments[0];
      }

      return oldRender.apply(this, args);
    }

    return router;
  };

  /**
	 * set an express middleware
	 * same as calling `app.use('/optional-path', middleware)`
	 * Middleware is always registered before routers getting registered, so each
	 * request will pass through middleware prior to routers.
	 */
  ['use',
  /**
	 * same as calling `app.param('/optional-path', middleware)`
	 */
    'param'].forEach(function(method) {
    apiPrototype[method] = function(_x: any) {
      var args = [].slice.apply(arguments);
      function setupMiddleware(app: Application) {
        app[method].apply(app, args);
      }
      setupMiddleware.packageName = this.packageName;
      // this function will be
      // cached in array and executed later, the current stack information
      // won't be shown if there is error in later execution progress.
      // Thus save current stack for later debug.
      setupMiddleware.stack = new Error().stack;
      routerSetupFuncs.push(setupMiddleware);
    };
  });

  /**
	 * Callback functions will be called after express app being created
	 * @param  {Function} callback function(app, express)
	 * e.g.
	 * 	api.expressAppSet((app, express) => {
 	 * 		app.set('trust proxy', true);
 	 * 		app.set('views', Path.resolve(api.config().rootPath, '../web/views/'));
 	 * 	});
	 * @return void
	 */
  apiPrototype.expressAppSet = (callback) => appSets.push(callback);
  apiPrototype.expressAppUse = (callback) => routerSetupFuncs.push(callback);
  /**
	 * e.g.
	 * 	api.router().options('/api', api.cors());
	 * 	api.router().get('/api', api.cors());
	 * Or
	 *  api.router().use('/api', api.cors());
	 * @return void
	 */
  apiPrototype.cors = function() {
    var setting = api.config();
    var corsOpt = _.get(setting, api.packageShortName + '-enableCORS') || _.get(setting, 'enableCORS');
    var cors = require('cors');
    var whiteOriginSet = {};
    if (_.isArray(corsOpt)) {
      corsOpt.forEach(domain => whiteOriginSet[domain] = true);
    }
    var corsOptions = {
      origin(origin: string, callback: (_arg: any, pass: boolean) => void) {
        var pass = origin == null || corsOpt === true || _.has(whiteOriginSet, origin);
        callback(pass ? null : {status: 400, message: 'Bad Request (CORS) for origin: ' + origin}, pass);
        if (!pass)
          log.info('CORS request blocked for origin: ' + origin);
      },
      credentials: true
    };
    return cors(corsOptions);
  };
}

// function revertRenderFunction(req, res, next) {
// 	log.trace('release hijacked res.render()');
// 	if (res.__origRender) {
// 		res.render = res.__origRender;
// 		delete res.__origRender;
// 	}
// 	next();
// }

// function revertRenderFunctionForError(err, req, res, next) {
// 	log.trace('encounter error, release hijacked res.render()');
// 	if (res.__origRender) {
// 		res.render = res.__origRender;
// 		delete res.__origRender;
// 	}
// 	next(err);
// }