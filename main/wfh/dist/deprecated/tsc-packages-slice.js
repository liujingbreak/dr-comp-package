"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStore = exports.getState = exports.tscActionDispatcher = exports.tscSlice = void 0;
const store_1 = require("../store");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const operators_1 = require("rxjs/operators");
const rxjs_1 = require("rxjs");
const package_mgr_1 = require("../package-mgr");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHNjLXBhY2thZ2VzLXNsaWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvZGVwcmVjYXRlZC90c2MtcGFja2FnZXMtc2xpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQ0Esb0NBQXdDO0FBQ3hDLDRDQUFvQjtBQUNwQixnREFBd0I7QUFDeEIsOENBRXdCO0FBQ3hCLCtCQUFnRTtBQUNoRSxnREFBb0U7QUFvQnBFLE1BQU0sWUFBWSxHQUFhO0lBQzdCLE9BQU8sRUFBRSxJQUFJLEdBQUcsRUFBRTtDQUNuQixDQUFDO0FBRVcsUUFBQSxRQUFRLEdBQUcsb0JBQVksQ0FBQyxRQUFRLENBQUM7SUFDNUMsSUFBSSxFQUFFLEtBQUs7SUFDWCxZQUFZO0lBQ1osUUFBUSxFQUFFO1FBQ1IsZ0VBQWdFO1FBQ2hFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBQyxPQUFPLEVBQXNFO1lBQzdGLEtBQUssTUFBTSxFQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUMsSUFBSSxPQUFPO2dCQUNoQyxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEMsQ0FBQztLQUNGO0NBQ0YsQ0FBQyxDQUFDO0FBRVUsUUFBQSxtQkFBbUIsR0FBRyxvQkFBWSxDQUFDLGtCQUFrQixDQUFDLGdCQUFRLENBQUMsQ0FBQztBQUU3RSxNQUFNLFdBQVcsR0FBRyxvQkFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ25ELE9BQU8sWUFBSyxDQUNWLHNCQUFXLEVBQUUsQ0FBQyxJQUFJLENBQ2hCLGVBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFDdkIsZ0NBQW9CLEVBQUUsRUFDdEIsZ0JBQUksQ0FBQyxDQUFDLENBQUMsRUFDUCx3QkFBWSxDQUFDLEdBQUcsQ0FBQyxFQUNqQixvQkFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1FBQ2hC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SUFDaEMsQ0FBQyxDQUFDLENBQ0gsQ0FBQztBQUNKLENBQUM7QUFFRCxJQUFJLE1BQU0sQ0FBQyxHQUFHLEVBQUU7SUFDZCxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4QixvQkFBWSxDQUFDLFdBQVcsQ0FBQyxnQkFBUSxDQUFDLENBQUM7UUFDbkMsV0FBVyxFQUFFLENBQUM7SUFDaEIsQ0FBQyxDQUFDLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBheWxvYWRBY3Rpb24gfSBmcm9tICdAcmVkdXhqcy90b29sa2l0JztcbmltcG9ydCB7IHN0YXRlRmFjdG9yeSB9IGZyb20gJy4uL3N0b3JlJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7bWFwLCBtZXJnZU1hcCwgZGlzdGluY3RVbnRpbENoYW5nZWQsIGNhdGNoRXJyb3IsIGlnbm9yZUVsZW1lbnRzLCBkZWJvdW5jZVRpbWUsIHJlZHVjZSxcbiAgc2tpcFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQge29mLCBmcm9tLCBtZXJnZSwgUmVwbGF5U3ViamVjdCwgT2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5pbXBvcnQge2dldFN0b3JlIGFzIGdldFBrZ1N0b3JlLCBQYWNrYWdlSW5mb30gZnJvbSAnLi4vcGFja2FnZS1tZ3InO1xuXG5leHBvcnQgaW50ZXJmYWNlIFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtIHtcbiAgcm9vdERpcjogc3RyaW5nO1xuICBvdXREaXI6IHN0cmluZztcbiAgZmlsZXM/OiBzdHJpbmdbXTtcbiAgLyoqIFwicmVmZXJlbmNlc1wiIGluIHRzY29uZmlnIGh0dHBzOi8vd3d3LnR5cGVzY3JpcHRsYW5nLm9yZy9kb2NzL2hhbmRib29rL3Byb2plY3QtcmVmZXJlbmNlcy5odG1sICovXG4gIHJlZmVyZW5jZXM/OiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIENvbmZpZ0l0ZW1XaXRoTmFtZSB7XG4gIHBrZzogc3RyaW5nO1xuICBpdGVtczogUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW1bXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUc2NTdGF0ZSB7XG4gIC8qKiBrZXkgaXMgcGFja2FnZSBuYW1lICovXG4gIGNvbmZpZ3M6IE1hcDxzdHJpbmcsIFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtW10+O1xufVxuXG5jb25zdCBpbml0aWFsU3RhdGU6IFRzY1N0YXRlID0ge1xuICBjb25maWdzOiBuZXcgTWFwKClcbn07XG5cbmV4cG9ydCBjb25zdCB0c2NTbGljZSA9IHN0YXRlRmFjdG9yeS5uZXdTbGljZSh7XG4gIG5hbWU6ICd0c2MnLFxuICBpbml0aWFsU3RhdGUsXG4gIHJlZHVjZXJzOiB7XG4gICAgLy8gbm9ybWFsaXplUGFja2FnZUpzb25Uc2NQcm9wZXJ0eShkLCBhY3Rpb246IFBheWxvYWRBY3Rpb24pIHt9LFxuICAgIHB1dENvbmZpZyhkcmFmdCwge3BheWxvYWR9OiBQYXlsb2FkQWN0aW9uPHtwa2c6IHN0cmluZywgaXRlbXM6IFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtW119W10+KSB7XG4gICAgICBmb3IgKGNvbnN0IHtwa2csIGl0ZW1zfSBvZiBwYXlsb2FkKVxuICAgICAgICBkcmFmdC5jb25maWdzLnNldChwa2csIGl0ZW1zKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgY29uc3QgdHNjQWN0aW9uRGlzcGF0Y2hlciA9IHN0YXRlRmFjdG9yeS5iaW5kQWN0aW9uQ3JlYXRvcnModHNjU2xpY2UpO1xuXG5jb25zdCByZWxlYXNlRXBpYyA9IHN0YXRlRmFjdG9yeS5hZGRFcGljKChhY3Rpb24kKSA9PiB7XG4gIHJldHVybiBtZXJnZShcbiAgICBnZXRQa2dTdG9yZSgpLnBpcGUoXG4gICAgICBtYXAocyA9PiBzLnNyY1BhY2thZ2VzKSxcbiAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgICBza2lwKDEpLFxuICAgICAgZGVib3VuY2VUaW1lKDUwMCksXG4gICAgICBtZXJnZU1hcChwa2dNYXAgPT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2UoLi4uQXJyYXkuZnJvbShwa2dNYXAudmFsdWVzKCkpXG4gICAgICAgICAgLm1hcChwa2cgPT4gbm9ybWFsaXplUGFja2FnZUpzb25Uc2NQcm9wZXJ0eSQocGtnKSkpXG4gICAgICAgICAgLnBpcGUoXG4gICAgICAgICAgICByZWR1Y2U8Q29uZmlnSXRlbVdpdGhOYW1lPigoYWxsLCBjb25maWdzKSA9PiB7XG4gICAgICAgICAgICAgIGFsbC5wdXNoKGNvbmZpZ3MpO1xuICAgICAgICAgICAgICByZXR1cm4gYWxsO1xuICAgICAgICAgICAgfSwgW10pXG4gICAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgbWFwKGNvbmZpZ3MgPT4gdHNjQWN0aW9uRGlzcGF0Y2hlci5wdXRDb25maWcoY29uZmlncykpXG4gICAgKVxuICApLnBpcGUoXG4gICAgY2F0Y2hFcnJvcihleCA9PiB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXgpO1xuICAgICAgcmV0dXJuIG9mPFBheWxvYWRBY3Rpb24+KCk7XG4gICAgfSksXG4gICAgaWdub3JlRWxlbWVudHMoKVxuICApO1xufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdGF0ZSgpIHtcbiAgcmV0dXJuIHN0YXRlRmFjdG9yeS5zbGljZVN0YXRlKHRzY1NsaWNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0b3JlKCkge1xuICByZXR1cm4gc3RhdGVGYWN0b3J5LnNsaWNlU3RvcmUodHNjU2xpY2UpO1xufVxuXG5mdW5jdGlvbiBub3JtYWxpemVQYWNrYWdlSnNvblRzY1Byb3BlcnR5JChwa2c6IFBhY2thZ2VJbmZvKSB7XG5cbiAgY29uc3QgZHIgPSBwa2cuanNvbi5kcjtcbiAgbGV0IHJhd0NvbmZpZ3M6IE9ic2VydmFibGU8UGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW0+O1xuXG4gIGlmIChkciAmJiBkci50c2MpIHtcbiAgICBjb25zdCBpdGVtczogUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW1bXSA9IEFycmF5LmlzQXJyYXkoZHIudHNjKSA/IGRyLnRzYyA6IFtkci50c2NdO1xuICAgIHJhd0NvbmZpZ3MgPSBmcm9tPFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtW10+KGl0ZW1zKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCByYXdDb25maWdzMiA9IG5ldyBSZXBsYXlTdWJqZWN0PFBhY2thZ2VKc29uVHNjUHJvcGVydHlJdGVtPigpO1xuICAgIHJhd0NvbmZpZ3MgPSByYXdDb25maWdzMjtcbiAgICBmcy5leGlzdHMoUGF0aC5yZXNvbHZlKHBrZy5yZWFsUGF0aCwgJ2lzb20nKSwgZXhpc3RzID0+IHtcbiAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgY29uc3QgdGVtcDogUGFja2FnZUpzb25Uc2NQcm9wZXJ0eUl0ZW0gPSB7cm9vdERpcjogJ2lzb20nLCBvdXREaXI6ICdpc29tJ307XG4gICAgICAgIHJhd0NvbmZpZ3MyLm5leHQodGVtcCk7XG4gICAgICB9XG4gICAgICBjb25zdCB0ZW1wOiBQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbSA9IHtcbiAgICAgICAgcm9vdERpcjogJ3RzJyxcbiAgICAgICAgb3V0RGlyOiAnZGlzdCdcbiAgICAgIH07XG4gICAgICByYXdDb25maWdzMi5uZXh0KHRlbXApO1xuICAgICAgcmF3Q29uZmlnczIuY29tcGxldGUoKTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gcmF3Q29uZmlncy5waXBlKFxuICAgIHJlZHVjZTxQYWNrYWdlSnNvblRzY1Byb3BlcnR5SXRlbT4oKGFsbCwgaXRlbSkgPT4ge1xuICAgICAgYWxsLnB1c2goaXRlbSk7XG4gICAgICByZXR1cm4gYWxsO1xuICAgIH0sIFtdKSxcbiAgICBtYXAoaXRlbXMgPT4ge1xuICAgICAgcmV0dXJuIHtwa2c6IHBrZy5uYW1lLCBpdGVtc307XG4gICAgfSlcbiAgKTtcbn1cblxuaWYgKG1vZHVsZS5ob3QpIHtcbiAgbW9kdWxlLmhvdC5kaXNwb3NlKGRhdGEgPT4ge1xuICAgIHN0YXRlRmFjdG9yeS5yZW1vdmVTbGljZSh0c2NTbGljZSk7XG4gICAgcmVsZWFzZUVwaWMoKTtcbiAgfSk7XG59XG4iXX0=