"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const _ = require("lodash");
const __api_1 = require("__api");
const log = require('log4js').getLogger(__api_1.default.packageName);
exports.ROUTE_MAP_FILE = 'prerender-routes.json';
const staticDir = __api_1.default.config.resolve('staticDir');
class PrerenderForExpress {
    /**
     *
     * @param routeMapFiles array of dist/static/<app>/prerender-routes.json
     */
    constructor(...routeMapFiles) {
        // noPrerender = false;
        this.prerenderPages = {}; // page contents
        // this.prerenderMapFile = join(staticDir, this.applName, '_prerender', ROUTE_MAP_FILE);
        // this.noPrerender = !existsSync(this.prerenderMapFile);
        // if (this.noPrerender) {
        // 	log.warn('No prerender files found in ', this.prerenderMapFile);
        // 	return;
        // }
        this.queryPrerenderPages(routeMapFiles)
            .then(pages => this.prerenderPages = pages);
        __api_1.default.eventBus.on('@dr-core/assets-processer.downloaded', () => {
            log.info('assets downloaded, update prerendered pages');
            this.queryPrerenderPages(routeMapFiles)
                .then(pages => this.prerenderPages = pages);
        });
    }
    asMiddleware() {
        if (__api_1.default.argv.hmr) {
            log.warn('Hot module replacement mode is on, no prerendered page will be served\n');
            return (req, res, next) => next();
        }
        return (req, res, next) => {
            if (req.method !== 'GET')
                return next();
            const route = _.trimEnd(req.originalUrl, '/');
            if (_.has(this.prerenderPages, route)) {
                log.info('Serve with prerender page for ', route);
                if (this.prerenderPages[route] === null) {
                    fs_extra_1.readFile(path_1.join(staticDir, this.prerenderMap[route]), 'utf-8', (err, cont) => {
                        if (err) {
                            log.error('Failed to read prerendered page: ' + this.prerenderMap[route], err);
                            next();
                        }
                        this.prerenderPages[route] = cont;
                        res.send(cont);
                    });
                }
                else {
                    res.send(this.prerenderPages[route]);
                }
            }
            else {
                next();
            }
        };
    }
    queryPrerenderPages(routeMapFiles) {
        const pages = {};
        const allDone = [];
        for (const prerenderMapFile of routeMapFiles) {
            if (!fs_extra_1.existsSync(prerenderMapFile))
                continue;
            log.info('read', prerenderMapFile);
            allDone.push(new Promise((resolve, rej) => {
                fs_extra_1.readFile(prerenderMapFile, 'utf-8', (err, content) => {
                    if (err)
                        return rej(err);
                    this.prerenderMap = JSON.parse(content);
                    _.forEach(this.prerenderMap, (file, route) => {
                        pages[route] = null;
                    });
                    resolve();
                });
            }));
        }
        return Promise.all(allDone).then(() => pages);
    }
}
exports.PrerenderForExpress = PrerenderForExpress;

//# sourceMappingURL=ng-prerender.js.map