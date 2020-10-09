"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doInjectorConfigSync = exports.doInjectorConfig = exports.InjectorFactory = void 0;
// import {RequireInjector} from 'require-injector/dist/replace-require';
const injector_factory_1 = require("./injector-factory");
Object.defineProperty(exports, "InjectorFactory", { enumerable: true, get: function () { return injector_factory_1.DrPackageInjector; } });
function doInjectorConfig(factory, isNode = false) {
    const config = require('./config');
    return config.configHandlerMgr().runEach((file, lastResult, handler) => {
        if (isNode && handler.setupNodeInjector)
            handler.setupNodeInjector(factory);
        else if (!isNode && handler.setupWebInjector)
            handler.setupWebInjector(factory);
    });
}
exports.doInjectorConfig = doInjectorConfig;
function doInjectorConfigSync(factory, isNode = false) {
    const config = require('./config');
    config.configHandlerMgr().runEachSync((file, lastResult, handler) => {
        if (isNode && handler.setupNodeInjector)
            handler.setupNodeInjector(factory);
        else if (!isNode && handler.setupWebInjector)
            handler.setupWebInjector(factory);
    });
}
exports.doInjectorConfigSync = doInjectorConfigSync;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVxdWlyZS1pbmplY3RvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi90cy9yZXF1aXJlLWluamVjdG9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx5RUFBeUU7QUFDekUseURBQXFEO0FBRXhCLGdHQUZyQixvQ0FBaUIsT0FFbUI7QUFjNUMsU0FBZ0IsZ0JBQWdCLENBQUMsT0FBMEIsRUFBRSxNQUFNLEdBQUcsS0FBSztJQUN6RSxNQUFNLE1BQU0sR0FBbUIsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ25ELE9BQU8sTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsT0FBTyxDQUF3QixDQUFDLElBQVksRUFBRSxVQUFlLEVBQUUsT0FBTyxFQUFFLEVBQUU7UUFDekcsSUFBSSxNQUFNLElBQUksT0FBTyxDQUFDLGlCQUFpQjtZQUNyQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDaEMsSUFBSSxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsZ0JBQWdCO1lBQzFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFSRCw0Q0FRQztBQUVELFNBQWdCLG9CQUFvQixDQUFDLE9BQTBCLEVBQUUsTUFBTSxHQUFHLEtBQUs7SUFDN0UsTUFBTSxNQUFNLEdBQW1CLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUNuRCxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxXQUFXLENBQXdCLENBQUMsSUFBWSxFQUFFLFVBQWUsRUFBRSxPQUFPLEVBQUUsRUFBRTtRQUN0RyxJQUFJLE1BQU0sSUFBSSxPQUFPLENBQUMsaUJBQWlCO1lBQ3JDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNoQyxJQUFJLENBQUMsTUFBTSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0I7WUFDMUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQVJELG9EQVFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtGYWN0b3J5TWFwSW50ZXJmfSBmcm9tICdyZXF1aXJlLWluamVjdG9yL2Rpc3QvZmFjdG9yeS1tYXAnO1xuLy8gaW1wb3J0IHtSZXF1aXJlSW5qZWN0b3J9IGZyb20gJ3JlcXVpcmUtaW5qZWN0b3IvZGlzdC9yZXBsYWNlLXJlcXVpcmUnO1xuaW1wb3J0IHtEclBhY2thZ2VJbmplY3Rvcn0gZnJvbSAnLi9pbmplY3Rvci1mYWN0b3J5JztcbmltcG9ydCBfY29uZmlnIGZyb20gJy4vY29uZmlnJztcbmV4cG9ydCB7RHJQYWNrYWdlSW5qZWN0b3IgYXMgSW5qZWN0b3JGYWN0b3J5fTtcbmV4cG9ydCB7RmFjdG9yeU1hcEludGVyZn07XG5cbi8vIGV4cG9ydCBpbnRlcmZhY2UgSW5qZWN0b3JGYWN0b3J5IGV4dGVuZHMgUmVxdWlyZUluamVjdG9yIHtcbi8vIFx0YWRkUGFja2FnZShuYW1lOiBzdHJpbmcsIGRpcjogc3RyaW5nKTogdm9pZDtcbi8vIFx0ZnJvbUFsbENvbXBvbmVudHMoKTogRmFjdG9yeU1hcEludGVyZjtcbi8vIFx0bm90RnJvbVBhY2thZ2VzKGV4Y2x1ZGVQYWNrYWdlczogc3RyaW5nIHwgc3RyaW5nW10pOiBGYWN0b3J5TWFwSW50ZXJmO1xuLy8gfVxuXG5leHBvcnQgaW50ZXJmYWNlIEluamVjdG9yQ29uZmlnSGFuZGxlciB7XG4gIHNldHVwTm9kZUluamVjdG9yPyhmYWN0b3J5OiBEclBhY2thZ2VJbmplY3Rvcik6IHZvaWQ7XG4gIHNldHVwV2ViSW5qZWN0b3I/KGZhY3Rvcnk6IERyUGFja2FnZUluamVjdG9yKTogdm9pZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvSW5qZWN0b3JDb25maWcoZmFjdG9yeTogRHJQYWNrYWdlSW5qZWN0b3IsIGlzTm9kZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGNvbmZpZzogdHlwZW9mIF9jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuICByZXR1cm4gY29uZmlnLmNvbmZpZ0hhbmRsZXJNZ3IoKS5ydW5FYWNoPEluamVjdG9yQ29uZmlnSGFuZGxlcj4oKGZpbGU6IHN0cmluZywgbGFzdFJlc3VsdDogYW55LCBoYW5kbGVyKSA9PiB7XG4gICAgaWYgKGlzTm9kZSAmJiBoYW5kbGVyLnNldHVwTm9kZUluamVjdG9yKVxuICAgICAgaGFuZGxlci5zZXR1cE5vZGVJbmplY3RvcihmYWN0b3J5KTtcbiAgICBlbHNlIGlmICghaXNOb2RlICYmIGhhbmRsZXIuc2V0dXBXZWJJbmplY3RvcilcbiAgICAgIGhhbmRsZXIuc2V0dXBXZWJJbmplY3RvcihmYWN0b3J5KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkb0luamVjdG9yQ29uZmlnU3luYyhmYWN0b3J5OiBEclBhY2thZ2VJbmplY3RvciwgaXNOb2RlID0gZmFsc2UpIHtcbiAgY29uc3QgY29uZmlnOiB0eXBlb2YgX2NvbmZpZyA9IHJlcXVpcmUoJy4vY29uZmlnJyk7XG4gIGNvbmZpZy5jb25maWdIYW5kbGVyTWdyKCkucnVuRWFjaFN5bmM8SW5qZWN0b3JDb25maWdIYW5kbGVyPigoZmlsZTogc3RyaW5nLCBsYXN0UmVzdWx0OiBhbnksIGhhbmRsZXIpID0+IHtcbiAgICBpZiAoaXNOb2RlICYmIGhhbmRsZXIuc2V0dXBOb2RlSW5qZWN0b3IpXG4gICAgICBoYW5kbGVyLnNldHVwTm9kZUluamVjdG9yKGZhY3RvcnkpO1xuICAgIGVsc2UgaWYgKCFpc05vZGUgJiYgaGFuZGxlci5zZXR1cFdlYkluamVjdG9yKVxuICAgICAgaGFuZGxlci5zZXR1cFdlYkluamVjdG9yKGZhY3RvcnkpO1xuICB9KTtcbn1cblxuXG50eXBlIFZhbHVlRmFjdG9yeSA9IChzb3VyY2VGaWxlUGF0aDogc3RyaW5nLCByZWdleHBFeGVjUmVzPzogUmVnRXhwRXhlY0FycmF5KSA9PiBhbnk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVwbGFjZVR5cGVWYWx1ZSB7XG4gIHJlcGxhY2VtZW50OiBzdHJpbmc7XG4gIHZhbHVlOiBhbnkgfCBWYWx1ZUZhY3Rvcnk7XG59XG4iXX0=