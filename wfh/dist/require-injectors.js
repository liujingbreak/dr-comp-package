"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function doInjectorConfig(factory, isNode = false) {
    const config = require('../lib/config');
    return config.configHandlerMgr().runEach((file, lastResult, handler) => {
        if (isNode && handler.setupNodeInjector)
            handler.setupNodeInjector(factory);
        else if (!isNode && handler.setupWebInjector)
            handler.setupWebInjector(factory);
    });
}
exports.doInjectorConfig = doInjectorConfig;
//# sourceMappingURL=require-injectors.js.map