"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = exports.getState = exports.tscActionDispatcher = exports.tscSlice = void 0;
const store_1 = require("./store");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const package_mgr_1 = require("./package-mgr");
const initialState = {
    configs: new Map()
};
exports.tscSlice = store_1.stateFactory.newSlice({
    name: 'tsc',
    initialState,
    reducers: {
        // normalizePackageJsonTscProperty(d, action: PayloadAction) {},
        putConfig(draft, { payload }) {
            for (const { pkg, items } of payload)
                draft.configs.set(pkg, items);
        }
    }
});
exports.tscActionDispatcher = store_1.stateFactory.bindActionCreators(exports.tscSlice);
const releaseEpic = store_1.stateFactory.addEpic((action$) => {
    return rxjs_1.merge(package_mgr_1.getStore().pipe(operators_1.map(s => s.srcPackages), operators_1.distinctUntilChanged(), operators_1.skip(1), operators_1.debounceTime(500), operators_1.mergeMap(pkgMap => {
        return rxjs_1.merge(...Array.from(pkgMap.values())
            .map(pkg => normalizePackageJsonTscProperty$(pkg)))
            .pipe(operators_1.reduce((all, configs) => {
            all.push(configs);
            return all;
        }, []));
    }), operators_1.map(configs => exports.tscActionDispatcher.putConfig(configs)))).pipe(operators_1.catchError(ex => {
        // tslint:disable-next-line: no-console
        console.error(ex);
        return rxjs_1.of();
    }), operators_1.ignoreElements());
});
function getState() {
    return store_1.stateFactory.sliceState(exports.tscSlice);
}
exports.getState = getState;
function getStore() {
    return store_1.stateFactory.sliceStore(exports.tscSlice);
}
exports.getStore = getStore;
function normalizePackageJsonTscProperty$(pkg) {
    const dr = pkg.json.dr;
    let rawConfigs;
    if (dr && dr.tsc) {
        const items = Array.isArray(dr.tsc) ? dr.tsc : [dr.tsc];
        rawConfigs = rxjs_1.from(items);
    }
    else {
        const rawConfigs2 = new rxjs_1.ReplaySubject();
        rawConfigs = rawConfigs2;
        fs_1.default.exists(path_1.default.resolve(pkg.realPath, 'isom'), exists => {
            if (exists) {
                const temp = { rootDir: 'isom', outDir: 'isom' };
                rawConfigs2.next(temp);
            }
            const temp = {
                rootDir: 'ts',
                outDir: 'dist'
            };
            rawConfigs2.next(temp);
            rawConfigs2.complete();
        });
    }
    return rawConfigs.pipe(operators_1.reduce((all, item) => {
        all.push(item);
        return all;
    }, []), operators_1.map(items => {
        return { pkg: pkg.name, items };
    }));
}
if (module.hot) {
    module.hot.dispose(data => {
        store_1.stateFactory.removeSlice(exports.tscSlice);
        releaseEpic();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNjLXBhY2thZ2VzLXNsaWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvdHNjLXBhY2thZ2VzLXNsaWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUNBLG1DQUF1QztBQUN2Qyw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBQ3hCLDhDQUV3QjtBQUN4QiwrQkFBZ0U7QUFDaEUsK0NBQW1FO0FBb0JuRSxNQUFNLFlBQVksR0FBYTtJQUM3QixPQUFPLEVBQUUsSUFBSSxHQUFHLEVBQUU7Q0FDbkIsQ0FBQztBQUVXLFFBQUEsUUFBUSxHQUFHLG9CQUFZLENBQUMsUUFBUSxDQUFDO0lBQzVDLElBQUksRUFBRSxLQUFLO0lBQ1gsWUFBWTtJQUNaLFFBQVEsRUFBRTtRQUNSLGdFQUFnRTtRQUNoRSxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUMsT0FBTyxFQUFzRTtZQUM3RixLQUFLLE1BQU0sRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFDLElBQUksT0FBTztnQkFDaEMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLENBQUM7S0FDRjtDQUNGLENBQUMsQ0FBQztBQUVVLFFBQUEsbUJBQW1CLEdBQUcsb0JBQVksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBUSxDQUFDLENBQUM7QUFFN0UsTUFBTSxXQUFXLEdBQUcsb0JBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtJQUNuRCxPQUFPLFlBQUssQ0FDVixzQkFBVyxFQUFFLENBQUMsSUFBSSxDQUNoQixlQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQ3ZCLGdDQUFvQixFQUFFLEVBQ3RCLGdCQUFJLENBQUMsQ0FBQyxDQUFDLEVBQ1Asd0JBQVksQ0FBQyxHQUFHLENBQUMsRUFDakIsb0JBQVEsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNoQixPQUFPLFlBQUssQ0FB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QyxDQUNILENBQUM7QUFDSixDQUFDO0FBRUQsSUFBSSxNQUFNLENBQUMsR0FBRyxFQUFFO0lBQ2QsTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDeEIsb0JBQVksQ0FBQyxXQUFXLENBQUMsZ0JBQVEsQ0FBQyxDQUFDO1FBQ25DLFdBQVcsRUFBRSxDQUFDO0lBQ2hCLENBQUMsQ0FBQyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYXlsb2FkQWN0aW9uIH0gZnJvbSAnQHJlZHV4anMvdG9vbGtpdCc7XG5pbXBvcnQgeyBzdGF0ZUZhY3RvcnkgfSBmcm9tICcuL3N0b3JlJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7bWFwLCBtZXJnZU1hcCwgZGlzdGluY3RVbnRpbENoYW5nZWQsIGNhdGNoRXJyb3IsIGlnbm9yZUVsZW1lbnRzLCBkZWJvdW5jZVRpbWUsIHJlZHVjZSxcbiAgc2tpcFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge29mLCBmcm9tLCBtZXJnZSwgUmVwbGF5U3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2dldFN0b3JlIGFzIGdldFBrZ1N0b3JlLCBQYWNrYWdlSW5mb30gZnJvbSAnLi9wYWNrYWdlLW1ncic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW0ge1xuICByb290RGlyOiBzdHJpbmc7XG4gIG91dERpcjogc3RyaW5nO1xuICBmaWxlcz86IHN0cmluZ1tdO1xuICAvKiogXCJyZWZlcmVuY2VzXCIgaW4gdHNjb25maWcgaHR0cHM6Ly93d3cudHlwZXNjcmlwdGxhbmcub3JnL2RvY3MvaGFuZGJvb2svcHJvamVjdC1yZWZlcmVuY2VzLmh0bWwgKi9cbiAgcmVmZXJlbmNlcz86IHN0cmluZ1tdO1xufVxuXG5pbnRlcmZhY2UgQ29uZmlnSXRlbVdpdGhOYW1lIHtcbiAgcGtnOiBzdHJpbmc7XG4gIGl0ZW1zOiBQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRzY1N0YXRlIHtcbiAgLyoqIGtleSBpcyBwYWNrYWdlIG5hbWUgKi9cbiAgY29uZmlnczogTWFwPHN0cmluZywgUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW1bXT47XG59XG5cbmNvbnN0IGluaXRpYWxTdGF0ZTogVHNjU3RhdGUgPSB7XG4gIGNvbmZpZ3M6IG5ldyBNYXAoKVxufTtcblxuZXhwb3J0IGNvbnN0IHRzY1NsaWNlID0gc3RhdGVGYWN0b3J5Lm5ld1NsaWNlKHtcbiAgbmFtZTogJ3RzYycsXG4gIGluaXRpYWxTdGF0ZSxcbiAgcmVkdWNlcnM6IHtcbiAgICAvLyBub3JtYWxpemVQYWNrYWdlSnNvblRzY1Byb3BlcnR5KGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbikge30sXG4gICAgcHV0Q29uZmlnKGRyYWZ0LCB7cGF5bG9hZH06IFBheWxvYWRBY3Rpb248e3BrZzogc3RyaW5nLCBpdGVtczogUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW1bXX1bXT4pIHtcbiAgICAgIGZvciAoY29uc3Qge3BrZywgaXRlbXN9IG9mIHBheWxvYWQpXG4gICAgICAgIGRyYWZ0LmNvbmZpZ3Muc2V0KHBrZywgaXRlbXMpO1xuICAgIH1cbiAgfVxufSk7XG5cbmV4cG9ydCBjb25zdCB0c2NBY3Rpb25EaXNwYXRjaGVyID0gc3RhdGVGYWN0b3J5LmJpbmRBY3Rpb25DcmVhdG9ycyh0c2NTbGljZSk7XG5cbmNvbnN0IHJlbGVhc2VFcGljID0gc3RhdGVGYWN0b3J5LmFkZEVwaWMoKGFjdGlvbiQpID0+IHtcbiAgcmV0dXJuIG1lcmdlKFxuICAgIGdldFBrZ1N0b3JlKCkucGlwZShcbiAgICAgIG1hcChzID0+IHMuc3JjUGFja2FnZXMpLFxuICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIHNraXAoMSksXG4gICAgICBkZWJvdW5jZVRpbWUoNTAwKSxcbiAgICAgIG1lcmdlTWFwKHBrZ01hcCA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZSguLi5BcnJheS5mcm9tKHBrZ01hcC52YWx1ZXMoKSlcbiAgICAgICAgICAubWFwKHBrZyA9PiBub3JtYWxpemVQYWNrYWdlSnNvblRzY1Byb3BlcnR5JChwa2cpKSlcbiAgICAgICAgICAucGlwZShcbiAgICAgICAgICAgIHJlZHVjZTxDb25maWdJdGVtV2l0aE5hbWU+KChhbGwsIGNvbmZpZ3MpID0+IHtcbiAgICAgICAgICAgICAgYWxsLnB1c2goY29uZmlncyk7XG4gICAgICAgICAgICAgIHJldHVybiBhbGw7XG4gICAgICAgICAgICB9LCBbXSlcbiAgICAgICAgICApO1xuICAgICAgfSksXG4gICAgICBtYXAoY29uZmlncyA9PiB0c2NBY3Rpb25EaXNwYXRjaGVyLnB1dENvbmZpZyhjb25maWdzKSlcbiAgICApXG4gICkucGlwZShcbiAgICBjYXRjaEVycm9yKGV4ID0+IHtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcihleCk7XG4gICAgICByZXR1cm4gb2Y8UGF5bG9hZEFjdGlvbj4oKTtcbiAgICB9KSxcbiAgICBpZ25vcmVFbGVtZW50cygpXG4gICk7XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXRlKCkge1xuICByZXR1cm4gc3RhdGVGYWN0b3J5LnNsaWNlU3RhdGUodHNjU2xpY2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmUoKSB7XG4gIHJldHVybiBzdGF0ZUZhY3Rvcnkuc2xpY2VTdG9yZSh0c2NTbGljZSk7XG59XG5cbmZ1bmN0aW9uIG5vcm1hbGl6ZVBhY2thZ2VKc29uVHNjUHJvcGVydHkkKHBrZzogUGFja2FnZUluZm8pIHtcblxuICBjb25zdCBkciA9IHBrZy5qc29uLmRyO1xuICBsZXQgcmF3Q29uZmlnczogT2JzZXJ2YWJsZTxQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbT47XG5cbiAgaWYgKGRyICYmIGRyLnRzYykge1xuICAgIGNvbnN0IGl0ZW1zOiBQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbVtdID0gQXJyYXkuaXNBcnJheShkci50c2MpID8gZHIudHNjIDogW2RyLnRzY107XG4gICAgcmF3Q29uZmlncyA9IGZyb208UGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW1bXT4oaXRlbXMpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHJhd0NvbmZpZ3MyID0gbmV3IFJlcGxheVN1YmplY3Q8UGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW0+KCk7XG4gICAgcmF3Q29uZmlncyA9IHJhd0NvbmZpZ3MyO1xuICAgIGZzLmV4aXN0cyhQYXRoLnJlc29sdmUocGtnLnJlYWxQYXRoLCAnaXNvbScpLCBleGlzdHMgPT4ge1xuICAgICAgaWYgKGV4aXN0cykge1xuICAgICAgICBjb25zdCB0ZW1wOiBQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbSA9IHtyb290RGlyOiAnaXNvbScsIG91dERpcjogJ2lzb20nfTtcbiAgICAgICAgcmF3Q29uZmlnczIubmV4dCh0ZW1wKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHRlbXA6IFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtID0ge1xuICAgICAgICByb290RGlyOiAndHMnLFxuICAgICAgICBvdXREaXI6ICdkaXN0J1xuICAgICAgfTtcbiAgICAgIHJhd0NvbmZpZ3MyLm5leHQodGVtcCk7XG4gICAgICByYXdDb25maWdzMi5jb21wbGV0ZSgpO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiByYXdDb25maWdzLnBpcGUoXG4gICAgcmVkdWNlPFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtPigoYWxsLCBpdGVtKSA9PiB7XG4gICAgICBhbGwucHVzaChpdGVtKTtcbiAgICAgIHJldHVybiBhbGw7XG4gICAgfSwgW10pLFxuICAgIG1hcChpdGVtcyA9PiB7XG4gICAgICByZXR1cm4ge3BrZzogcGtnLm5hbWUsIGl0ZW1zfTtcbiAgICB9KVxuICApO1xufVxuXG5pZiAobW9kdWxlLmhvdCkge1xuICBtb2R1bGUuaG90LmRpc3Bvc2UoZGF0YSA9PiB7XG4gICAgc3RhdGVGYWN0b3J5LnJlbW92ZVNsaWNlKHRzY1NsaWNlKTtcbiAgICByZWxlYXNlRXBpYygpO1xuICB9KTtcbn1cbiJdfQ==