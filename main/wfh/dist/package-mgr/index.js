"use strict";
/**
 * Unfortunately, this file is very long, you need to fold by indention for better view of source code in Editor
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPackageInfo = exports.installInDir = exports.switchCurrentWorkspace = exports.isCwdWorkspace = exports.getProjectList = exports.getPackagesOfProjects = exports.workspaceDir = exports.workspaceKey = exports.projKeyToPath = exports.pathToProjKey = exports.getStore = exports.getState = exports.onLinkedPackageAdded = exports.updateGitIgnores = exports.actionDispatcher = exports.slice = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const fs_1 = __importDefault(require("fs"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const transitive_dep_hoister_1 = require("../transitive-dep-hoister");
const process_utils_1 = require("../process-utils");
const process_utils_2 = require("../process-utils");
const recipe_manager_1 = require("../recipe-manager");
const store_1 = require("../store");
// import { getRootDir } from '../utils/misc';
const symlinks_1 = __importStar(require("../utils/symlinks"));
const rwPackageJson_1 = require("../rwPackageJson");
const os_1 = require("os");
const log4js_1 = require("log4js");
const log = log4js_1.getLogger('plink.package-mgr');
const { distDir, rootDir, plinkDir, isDrcpSymlink, symlinkDirName } = JSON.parse(process.env.__plink);
const NS = 'packages';
const moduleNameReg = /^(?:@([^/]+)\/)?(\S+)/;
const state = {
    inited: false,
    workspaces: new Map(),
    project2Packages: new Map(),
    srcPackages: new Map(),
    gitIgnores: {},
    workspaceUpdateChecksum: 0,
    packagesUpdateChecksum: 0
};
exports.slice = store_1.stateFactory.newSlice({
    name: NS,
    initialState: state,
    reducers: {
        /** Do this action after any linked package is removed or added  */
        initRootDir(d, action) { },
        /**
         * - Create initial files in root directory
         * - Scan linked packages and install transitive dependency
         * - Switch to different workspace
         * - Delete nonexisting workspace
         * - If "packageJsonFiles" is provided, it should skip step of scanning linked packages
         * - TODO: if there is linked package used in more than one workspace, hoist and install for them all?
         */
        updateWorkspace(d, action) {
        },
        scanAndSyncPackages(d, action) { },
        updateDir() { },
        _updatePlinkPackageInfo(d) {
            const plinkPkg = createPackageInfo(path_1.default.resolve(plinkDir, 'package.json'), false);
            if (isDrcpSymlink) {
                d.linkedDrcp = plinkPkg;
                d.installedDrcp = null;
                d.linkedDrcpProject = pathToProjKey(path_1.default.dirname(d.linkedDrcp.realPath));
            }
            else {
                d.linkedDrcp = null;
                d.installedDrcp = plinkPkg;
                d.linkedDrcpProject = null;
            }
        },
        _syncLinkedPackages(d, { payload }) {
            d.inited = true;
            let map = d.srcPackages;
            if (payload[1] === 'clean') {
                map = d.srcPackages = new Map();
            }
            for (const pkInfo of payload[0]) {
                map.set(pkInfo.name, pkInfo);
            }
        },
        onLinkedPackageAdded(d, action) { },
        addProject(d, action) {
            for (const rawDir of action.payload) {
                const dir = pathToProjKey(rawDir);
                if (!d.project2Packages.has(dir)) {
                    d.project2Packages.set(dir, []);
                }
            }
        },
        deleteProject(d, action) {
            for (const rawDir of action.payload) {
                const dir = pathToProjKey(rawDir);
                d.project2Packages.delete(dir);
            }
        },
        /** payload: workspace keys, happens as debounced workspace change event */
        workspaceBatchChanged(d, action) { },
        updateGitIgnores(d, { payload }) {
            d.gitIgnores[payload.file] = payload.lines.map(line => line.startsWith('/') ? line : '/' + line);
        },
        packagesUpdated(d) {
            d.packagesUpdateChecksum++;
        },
        setInChina(d, { payload }) {
            d.isInChina = payload;
        },
        _setCurrentWorkspace(d, { payload: dir }) {
            if (dir != null)
                d.currWorkspace = workspaceKey(dir);
            else
                d.currWorkspace = null;
        },
        /** paramter: workspace key */
        workspaceStateUpdated(d, { payload }) {
            d.workspaceUpdateChecksum += 1;
        },
        // onWorkspacePackageUpdated(d, {payload: workspaceKey}: PayloadAction<string>) {},
        _hoistWorkspaceDeps(state, { payload: { dir } }) {
            if (state.srcPackages == null) {
                throw new Error('"srcPackages" is null, need to run `init` command first');
            }
            let pkjsonStr;
            const pkgjsonFile = path_1.default.resolve(dir, 'package.json');
            const lockFile = path_1.default.resolve(dir, 'plink.install.lock');
            if (fs_1.default.existsSync(lockFile)) {
                log.warn('Plink init/sync process was interrupted last time, recover content of ' + pkgjsonFile);
                pkjsonStr = fs_1.default.readFileSync(lockFile, 'utf8');
                fs_1.default.unlinkSync(lockFile);
            }
            pkjsonStr = fs_1.default.readFileSync(pkgjsonFile, 'utf8');
            const pkjson = JSON.parse(pkjsonStr);
            // for (const deps of [pkjson.dependencies, pkjson.devDependencies] as {[name: string]: string}[] ) {
            //   Object.entries(deps);
            // }
            const deps = Object.entries(pkjson.dependencies || {});
            const updatingDeps = Object.assign({}, pkjson.dependencies || {});
            const linkedDependencies = [];
            deps.filter(dep => {
                if (state.srcPackages.has(dep[0])) {
                    linkedDependencies.push(dep);
                    delete updatingDeps[dep[0]];
                    return false;
                }
                return true;
            });
            const devDeps = Object.entries(pkjson.devDependencies || {});
            const updatingDevDeps = Object.assign({}, pkjson.devDependencies || {});
            const linkedDevDependencies = [];
            devDeps.filter(dep => {
                if (state.srcPackages.has(dep[0])) {
                    linkedDevDependencies.push(dep);
                    delete updatingDevDeps[dep[0]];
                    return false;
                }
                return true;
            });
            if (isDrcpSymlink) {
                // tslint:disable-next-line: no-console
                log.debug('[_hoistWorkspaceDeps] @wfh/plink is symlink');
                delete updatingDeps['@wfh/plink'];
                delete updatingDevDeps['@wfh/plink'];
            }
            const wsKey = workspaceKey(dir);
            const { hoisted: hoistedDeps, hoistedPeers: hoistPeerDepInfo } = transitive_dep_hoister_1.listCompDependency(linkedDependencies.map(entry => state.srcPackages.get(entry[0]).json), 
            // .concat(plinkApiRequiredDeps()),
            wsKey, updatingDeps, state.srcPackages);
            const { hoisted: hoistedDevDeps, hoistedPeers: devHoistPeerDepInfo } = transitive_dep_hoister_1.listCompDependency(linkedDevDependencies.map(entry => state.srcPackages.get(entry[0]).json), wsKey, updatingDevDeps, state.srcPackages);
            const installJson = Object.assign(Object.assign({}, pkjson), { dependencies: Array.from(hoistedDeps.entries())
                    .concat(Array.from(hoistPeerDepInfo.entries()).filter(item => !item[1].missing))
                    .reduce((dic, [name, info]) => {
                    dic[name] = info.by[0].ver;
                    return dic;
                }, {}), devDependencies: Array.from(hoistedDevDeps.entries())
                    .concat(Array.from(devHoistPeerDepInfo.entries()).filter(item => !item[1].missing))
                    .reduce((dic, [name, info]) => {
                    dic[name] = info.by[0].ver;
                    return dic;
                }, {}) });
            // log.info(installJson)
            // const installedComp = scanInstalledPackage4Workspace(state.workspaces, state.srcPackages, wsKey);
            const existing = state.workspaces.get(wsKey);
            const hoistInfoSummary = {
                conflictDeps: [], missingDeps: {}, missingDevDeps: {}
            };
            for (const depsInfo of [hoistedDeps, hoistPeerDepInfo]) {
                for (const [dep, info] of depsInfo.entries()) {
                    if (info.missing) {
                        hoistInfoSummary.missingDeps[dep] = info.by[0].ver;
                    }
                    if (!info.sameVer && !info.direct) {
                        hoistInfoSummary.conflictDeps.push(dep);
                    }
                }
            }
            for (const depsInfo of [hoistedDevDeps, devHoistPeerDepInfo]) {
                for (const [dep, info] of depsInfo.entries()) {
                    if (info.missing) {
                        hoistInfoSummary.missingDevDeps[dep] = info.by[0].ver;
                    }
                    if (!info.sameVer && !info.direct) {
                        hoistInfoSummary.conflictDeps.push(dep);
                    }
                }
            }
            const wp = {
                id: wsKey,
                originInstallJson: pkjson,
                originInstallJsonStr: pkjsonStr,
                installJson,
                installJsonStr: JSON.stringify(installJson, null, '  '),
                linkedDependencies,
                linkedDevDependencies,
                hoistInfo: hoistedDeps,
                hoistPeerDepInfo,
                hoistDevInfo: hoistedDevDeps,
                hoistDevPeerDepInfo: devHoistPeerDepInfo,
                hoistInfoSummary
            };
            state.lastCreatedWorkspace = wsKey;
            state.workspaces.set(wsKey, existing ? Object.assign(existing, wp) : wp);
        },
        _installWorkspace(d, { payload: { workspaceKey } }) { },
        _associatePackageToPrj(d, { payload: { prj, pkgs } }) {
            d.project2Packages.set(pathToProjKey(prj), pkgs.map(pkgs => pkgs.name));
        }
    }
});
exports.actionDispatcher = store_1.stateFactory.bindActionCreators(exports.slice);
exports.updateGitIgnores = exports.actionDispatcher.updateGitIgnores, exports.onLinkedPackageAdded = exports.actionDispatcher.onLinkedPackageAdded;
/**
 * Carefully access any property on config, since config setting probably hasn't been set yet at this momment
 */
store_1.stateFactory.addEpic((action$, state$) => {
    const updatedWorkspaceSet = new Set();
    const packageAddedList = new Array();
    return rxjs_1.merge(
    // To override stored state. 
    // Do not put following logic in initialState! It will be overridden by previously saved state
    rxjs_1.of(1).pipe(operators_1.tap(() => process.nextTick(() => exports.actionDispatcher._updatePlinkPackageInfo())), operators_1.ignoreElements()), getStore().pipe(operators_1.map(s => s.project2Packages), operators_1.distinctUntilChanged(), operators_1.map(pks => {
        recipe_manager_1.setProjectList(getProjectList());
        return pks;
    }), operators_1.ignoreElements()), getStore().pipe(operators_1.map(s => s.srcPackages), operators_1.distinctUntilChanged(), operators_1.scan((prevMap, currMap) => {
        packageAddedList.splice(0);
        for (const nm of currMap.keys()) {
            if (!prevMap.has(nm)) {
                packageAddedList.push(nm);
            }
        }
        if (packageAddedList.length > 0)
            exports.onLinkedPackageAdded(packageAddedList);
        return currMap;
    })), 
    //  updateWorkspace
    action$.pipe(store_1.ofPayloadAction(exports.slice.actions.updateWorkspace), operators_1.concatMap(({ payload: { dir, isForce, createHook, packageJsonFiles } }) => {
        dir = path_1.default.resolve(dir);
        exports.actionDispatcher._setCurrentWorkspace(dir);
        maybeCopyTemplate(path_1.default.resolve(__dirname, '../../templates/app-template.js'), path_1.default.resolve(dir, 'app.js'));
        checkAllWorkspaces();
        if (isForce) {
            // Chaning installJsonStr to force action _installWorkspace being dispatched later
            const wsKey = workspaceKey(dir);
            if (getState().workspaces.has(wsKey)) {
                exports.actionDispatcher._change(d => {
                    // clean to trigger install action
                    const ws = d.workspaces.get(wsKey);
                    ws.installJsonStr = '';
                    ws.installJson.dependencies = {};
                    ws.installJson.devDependencies = {};
                    // tslint:disable-next-line: no-console
                    log.debug('force npm install in', wsKey);
                });
            }
        }
        // call initRootDirectory() and wait for it finished by observing action '_syncLinkedPackages',
        // then call _hoistWorkspaceDeps
        return rxjs_1.merge(packageJsonFiles != null ? scanAndSyncPackages(packageJsonFiles) :
            rxjs_1.defer(() => rxjs_1.of(initRootDirectory(createHook))), action$.pipe(store_1.ofPayloadAction(exports.slice.actions._syncLinkedPackages), operators_1.take(1), operators_1.map(() => exports.actionDispatcher._hoistWorkspaceDeps({ dir }))));
    }), operators_1.ignoreElements()), action$.pipe(store_1.ofPayloadAction(exports.slice.actions.scanAndSyncPackages), operators_1.concatMap(({ payload }) => {
        return rxjs_1.merge(scanAndSyncPackages(payload.packageJsonFiles), action$.pipe(store_1.ofPayloadAction(exports.slice.actions._syncLinkedPackages), operators_1.take(1), operators_1.tap(() => {
            const currWs = getState().currWorkspace;
            for (const wsKey of getState().workspaces.keys()) {
                if (wsKey !== currWs)
                    exports.actionDispatcher._hoistWorkspaceDeps({ dir: path_1.default.resolve(rootDir, wsKey) });
            }
            if (currWs != null) {
                // Make sure "current workspace" is the last one being updated, so that it remains "current"
                exports.actionDispatcher._hoistWorkspaceDeps({ dir: path_1.default.resolve(rootDir, currWs) });
            }
        })));
    })), 
    // initRootDir
    action$.pipe(store_1.ofPayloadAction(exports.slice.actions.initRootDir), operators_1.map(({ payload }) => {
        checkAllWorkspaces();
        if (getState().workspaces.has(workspaceKey(process.cwd()))) {
            exports.actionDispatcher.updateWorkspace({ dir: process.cwd(),
                isForce: payload.isForce,
                createHook: payload.createHook });
        }
        else {
            const curr = getState().currWorkspace;
            if (curr != null) {
                if (getState().workspaces.has(curr)) {
                    const path = path_1.default.resolve(rootDir, curr);
                    exports.actionDispatcher.updateWorkspace({ dir: path, isForce: payload.isForce, createHook: payload.createHook });
                }
                else {
                    exports.actionDispatcher._setCurrentWorkspace(null);
                }
            }
        }
    }), operators_1.ignoreElements()), action$.pipe(store_1.ofPayloadAction(exports.slice.actions._hoistWorkspaceDeps), operators_1.map(({ payload }) => {
        const wsKey = workspaceKey(payload.dir);
        // actionDispatcher.onWorkspacePackageUpdated(wsKey);
        deleteDuplicatedInstalledPkg(wsKey);
        setImmediate(() => exports.actionDispatcher.workspaceStateUpdated(wsKey));
    }), operators_1.ignoreElements()), action$.pipe(store_1.ofPayloadAction(exports.slice.actions.updateDir), operators_1.tap(() => exports.actionDispatcher._updatePlinkPackageInfo()), operators_1.concatMap(() => scanAndSyncPackages()), operators_1.tap(() => {
        for (const key of getState().workspaces.keys()) {
            updateInstalledPackageForWorkspace(key);
        }
    })), 
    // Handle newly added workspace
    getStore().pipe(operators_1.map(s => s.workspaces), operators_1.distinctUntilChanged(), operators_1.map(ws => {
        const keys = Array.from(ws.keys());
        return keys;
    }), operators_1.scan((prev, curr) => {
        if (prev.length < curr.length) {
            const newAdded = lodash_1.default.difference(curr, prev);
            // tslint:disable-next-line: no-console
            log.info('New workspace: ', newAdded);
            for (const ws of newAdded) {
                exports.actionDispatcher._installWorkspace({ workspaceKey: ws });
            }
        }
        return curr;
    }), operators_1.ignoreElements()), 
    // observe all existing Workspaces for dependency hoisting result 
    ...Array.from(getState().workspaces.keys()).map(key => {
        return getStore().pipe(operators_1.filter(s => s.workspaces.has(key)), operators_1.map(s => s.workspaces.get(key)), operators_1.distinctUntilChanged((s1, s2) => s1.installJson === s2.installJson), operators_1.scan((old, newWs) => {
            // tslint:disable: max-line-length
            const newDeps = Object.entries(newWs.installJson.dependencies || [])
                .concat(Object.entries(newWs.installJson.devDependencies || []))
                .map(entry => entry.join(': '));
            if (newDeps.length === 0) {
                // forcing install workspace, therefore dependencies is cleared at this moment
                return newWs;
            }
            const oldDeps = Object.entries(old.installJson.dependencies || [])
                .concat(Object.entries(old.installJson.devDependencies || []))
                .map(entry => entry.join(': '));
            if (newDeps.length !== oldDeps.length) {
                exports.actionDispatcher._installWorkspace({ workspaceKey: key });
                return newWs;
            }
            newDeps.sort();
            oldDeps.sort();
            for (let i = 0, l = newDeps.length; i < l; i++) {
                if (newDeps[i] !== oldDeps[i]) {
                    exports.actionDispatcher._installWorkspace({ workspaceKey: key });
                    break;
                }
            }
            return newWs;
        }), operators_1.ignoreElements());
    }), action$.pipe(store_1.ofPayloadAction(exports.slice.actions._installWorkspace), operators_1.concatMap(action => {
        const wsKey = action.payload.workspaceKey;
        return getStore().pipe(operators_1.map(s => s.workspaces.get(wsKey)), operators_1.distinctUntilChanged(), operators_1.filter(ws => ws != null), operators_1.take(1), operators_1.concatMap(ws => rxjs_1.from(installWorkspace(ws))), operators_1.map(() => {
            updateInstalledPackageForWorkspace(wsKey);
        }));
    }), operators_1.ignoreElements()), action$.pipe(store_1.ofPayloadAction(exports.slice.actions.workspaceStateUpdated), operators_1.map(action => updatedWorkspaceSet.add(action.payload)), operators_1.debounceTime(800), operators_1.tap(() => {
        exports.actionDispatcher.workspaceBatchChanged(Array.from(updatedWorkspaceSet.values()));
        updatedWorkspaceSet.clear();
        // return from(writeConfigFiles());
    }), operators_1.map(() => __awaiter(void 0, void 0, void 0, function* () {
        exports.actionDispatcher.packagesUpdated();
    }))), action$.pipe(store_1.ofPayloadAction(exports.slice.actions.workspaceBatchChanged), operators_1.concatMap(({ payload: wsKeys }) => {
        return rxjs_1.merge(...wsKeys.map(_createSymlinksForWorkspace));
    })), getStore().pipe(operators_1.map(s => s.gitIgnores), operators_1.distinctUntilChanged(), operators_1.map(gitIgnores => Object.keys(gitIgnores).join(',')), operators_1.distinctUntilChanged(), operators_1.debounceTime(500), operators_1.switchMap(() => {
        return rxjs_1.merge(...Object.keys(getState().gitIgnores).map(file => getStore().pipe(operators_1.map(s => s.gitIgnores[file]), operators_1.distinctUntilChanged(), operators_1.skip(1), operators_1.map(lines => {
            fs_1.default.readFile(file, 'utf8', (err, data) => {
                if (err) {
                    console.error('Failed to read gitignore file', file);
                    throw err;
                }
                const existingLines = data.split(/\n\r?/).map(line => line.trim());
                const newLines = lodash_1.default.difference(lines, existingLines);
                if (newLines.length === 0)
                    return;
                fs_1.default.writeFile(file, data + os_1.EOL + newLines.join(os_1.EOL), () => {
                    // tslint:disable-next-line: no-console
                    log.info('Modify', file);
                });
            });
        }))));
    }), operators_1.ignoreElements()), action$.pipe(store_1.ofPayloadAction(exports.slice.actions.addProject, exports.slice.actions.deleteProject), operators_1.concatMap(() => scanAndSyncPackages()))).pipe(operators_1.ignoreElements(), operators_1.catchError(err => {
        log.error(err.stack ? err.stack : err);
        return rxjs_1.throwError(err);
    }));
});
function getState() {
    return store_1.stateFactory.sliceState(exports.slice);
}
exports.getState = getState;
function getStore() {
    return store_1.stateFactory.sliceStore(exports.slice);
}
exports.getStore = getStore;
function pathToProjKey(path) {
    const relPath = path_1.default.relative(rootDir, path);
    return relPath.startsWith('..') ? path_1.default.resolve(path) : relPath;
}
exports.pathToProjKey = pathToProjKey;
function projKeyToPath(key) {
    return path_1.default.isAbsolute(key) ? key : path_1.default.resolve(rootDir, key);
}
exports.projKeyToPath = projKeyToPath;
function workspaceKey(path) {
    let rel = path_1.default.relative(rootDir, path_1.default.resolve(path));
    if (path_1.default.sep === '\\')
        rel = rel.replace(/\\/g, '/');
    return rel;
}
exports.workspaceKey = workspaceKey;
function workspaceDir(key) {
    return path_1.default.resolve(rootDir, key);
}
exports.workspaceDir = workspaceDir;
function* getPackagesOfProjects(projects) {
    for (const prj of projects) {
        const pkgNames = getState().project2Packages.get(pathToProjKey(prj));
        if (pkgNames) {
            for (const pkgName of pkgNames) {
                const pk = getState().srcPackages.get(pkgName);
                if (pk)
                    yield pk;
            }
        }
    }
}
exports.getPackagesOfProjects = getPackagesOfProjects;
function getProjectList() {
    return Array.from(getState().project2Packages.keys()).map(pj => path_1.default.resolve(rootDir, pj));
}
exports.getProjectList = getProjectList;
function isCwdWorkspace() {
    const wsKey = workspaceKey(process.cwd());
    const ws = getState().workspaces.get(wsKey);
    if (ws == null)
        return false;
    return true;
}
exports.isCwdWorkspace = isCwdWorkspace;
/**
 * This method is meant to trigger editor-helper to update tsconfig files, so
 * editor-helper must be import at first
 * @param dir
 */
function switchCurrentWorkspace(dir) {
    exports.actionDispatcher._setCurrentWorkspace(dir);
    exports.actionDispatcher.workspaceBatchChanged([workspaceKey(dir)]);
}
exports.switchCurrentWorkspace = switchCurrentWorkspace;
function updateInstalledPackageForWorkspace(wsKey) {
    const pkgEntry = scanInstalledPackage4Workspace(getState(), wsKey);
    const installed = new Map((function* () {
        for (const pk of pkgEntry) {
            yield [pk.name, pk];
        }
    })());
    exports.actionDispatcher._change(d => d.workspaces.get(wsKey).installedComponents = installed);
    exports.actionDispatcher.workspaceStateUpdated(wsKey);
}
/**
 * Delete workspace state if its directory does not exist
 */
function checkAllWorkspaces() {
    for (const key of getState().workspaces.keys()) {
        const dir = path_1.default.resolve(rootDir, key);
        if (!fs_1.default.existsSync(dir)) {
            // tslint:disable-next-line: no-console
            log.info(`Workspace ${key} does not exist anymore.`);
            exports.actionDispatcher._change(d => d.workspaces.delete(key));
        }
    }
}
function initRootDirectory(createHook = false) {
    return __awaiter(this, void 0, void 0, function* () {
        log.debug('initRootDirectory');
        const rootPath = rootDir;
        fs_extra_1.default.mkdirpSync(distDir);
        // maybeCopyTemplate(Path.resolve(__dirname, '../../templates/config.local-template.yaml'), Path.join(distDir, 'config.local.yaml'));
        maybeCopyTemplate(path_1.default.resolve(__dirname, '../../templates/log4js.js'), rootPath + '/log4js.js');
        maybeCopyTemplate(path_1.default.resolve(__dirname, '../../templates', 'gitignore.txt'), rootDir + '/.gitignore');
        yield symlinks_1.default();
        const projectDirs = getProjectList();
        if (createHook) {
            projectDirs.forEach(prjdir => {
                _writeGitHook(prjdir);
                maybeCopyTemplate(path_1.default.resolve(__dirname, '../../tslint.json'), prjdir + '/tslint.json');
            });
        }
        yield scanAndSyncPackages();
        // await _deleteUselessSymlink(Path.resolve(rootDir, 'node_modules'), new Set<string>());
    });
}
// async function writeConfigFiles() {
//   return (await import('../cmd/config-setup')).addupConfigs((file, configContent) => {
//     // tslint:disable-next-line: no-console
//     log.info('write config file:', file);
//     writeFile(Path.join(distDir, file),
//       '\n# DO NOT MODIFIY THIS FILE!\n' + configContent);
//   });
// }
function installWorkspace(ws) {
    return __awaiter(this, void 0, void 0, function* () {
        const dir = path_1.default.resolve(rootDir, ws.id);
        try {
            yield installInDir(dir, ws.originInstallJsonStr, ws.installJsonStr);
        }
        catch (ex) {
            exports.actionDispatcher._change(d => {
                const wsd = d.workspaces.get(ws.id);
                wsd.installJsonStr = '';
                wsd.installJson.dependencies = {};
                wsd.installJson.devDependencies = {};
                const lockFile = path_1.default.resolve(dir, 'package-lock.json');
                if (fs_1.default.existsSync(lockFile)) {
                    // tslint:disable-next-line: no-console
                    log.info(`Problematic ${lockFile} is deleted, please try again`);
                    fs_1.default.unlinkSync(lockFile);
                }
            });
            throw ex;
        }
    });
}
function installInDir(dir, originPkgJsonStr, toInstallPkgJsonStr) {
    return __awaiter(this, void 0, void 0, function* () {
        // tslint:disable-next-line: no-console
        log.info('Install dependencies in ' + dir);
        try {
            yield copyNpmrcToWorkspace(dir);
        }
        catch (e) {
            console.error(e);
        }
        const symlinksInModuleDir = [];
        const target = path_1.default.resolve(dir, 'node_modules');
        if (!fs_1.default.existsSync(target)) {
            fs_extra_1.default.mkdirpSync(target);
        }
        // 1. Temoprarily remove all symlinks under `node_modules/` and `node_modules/@*/`
        // backup them for late recovery
        yield symlinks_1.listModuleSymlinks(target, link => {
            const linkContent = fs_1.default.readlinkSync(link);
            symlinksInModuleDir.push({ content: linkContent, link });
            return symlinks_1.unlinkAsync(link);
        });
        // 2. Run `npm install`
        const installJsonFile = path_1.default.resolve(dir, 'package.json');
        // tslint:disable-next-line: no-console
        log.info('write', installJsonFile);
        fs_1.default.writeFileSync(installJsonFile, toInstallPkgJsonStr, 'utf8');
        // save a lock file to indicate in-process of installing, once installation is completed without interruption, delete it.
        // check if there is existing lock file, meaning a previous installation is interrupted.
        const lockFile = path_1.default.resolve(dir, 'plink.install.lock');
        fs_1.default.promises.writeFile(lockFile, originPkgJsonStr);
        yield new Promise(resolve => setImmediate(resolve));
        // await new Promise(resolve => setTimeout(resolve, 5000));
        try {
            const env = Object.assign(Object.assign({}, process.env), { NODE_ENV: 'development' });
            yield process_utils_2.exe('npm', 'install', {
                cwd: dir,
                env // Force development mode, otherwise "devDependencies" will not be installed
            }).promise;
            yield new Promise(resolve => setImmediate(resolve));
            yield process_utils_2.exe('npm', 'prune', { cwd: dir, env }).promise;
            // "npm ddp" right after "npm install" will cause devDependencies being removed somehow, don't known
            // why, I have to add a setImmediate() between them to workaround
            yield new Promise(resolve => setImmediate(resolve));
            yield process_utils_2.exe('npm', 'ddp', { cwd: dir, env }).promise;
        }
        catch (e) {
            // tslint:disable-next-line: no-console
            log.error('Failed to install dependencies', e.stack);
            throw e;
        }
        finally {
            // tslint:disable-next-line: no-console
            log.info('Recover ' + installJsonFile);
            // 3. Recover package.json and symlinks deleted in Step.1.
            fs_1.default.writeFileSync(installJsonFile, originPkgJsonStr, 'utf8');
            fs_1.default.promises.unlink(lockFile);
            yield recoverSymlinks();
        }
        function recoverSymlinks() {
            return Promise.all(symlinksInModuleDir.map(({ content, link }) => {
                return symlinks_1._symlinkAsync(content, link, symlinks_1.isWin32 ? 'junction' : 'dir');
            }));
        }
    });
}
exports.installInDir = installInDir;
function copyNpmrcToWorkspace(workspaceDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const target = path_1.default.resolve(workspaceDir, '.npmrc');
        if (fs_1.default.existsSync(target))
            return;
        const isChina = yield getStore().pipe(operators_1.map(s => s.isInChina), operators_1.distinctUntilChanged(), operators_1.filter(cn => cn != null), operators_1.take(1)).toPromise();
        if (isChina) {
            // tslint:disable-next-line: no-console
            log.info('create .npmrc to', target);
            fs_1.default.copyFileSync(path_1.default.resolve(__dirname, '../../templates/npmrc-for-cn.txt'), target);
        }
    });
}
function scanAndSyncPackages(includePackageJsonFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        const projPkgMap = new Map();
        let pkgList;
        if (includePackageJsonFiles) {
            const prjKeys = Array.from(getState().project2Packages.keys());
            const prjDirs = Array.from(getState().project2Packages.keys()).map(prjKey => projKeyToPath(prjKey));
            pkgList = includePackageJsonFiles.map(jsonFile => {
                const info = createPackageInfo(jsonFile, false);
                const prjIdx = prjDirs.findIndex(dir => info.realPath.startsWith(dir + path_1.default.sep));
                if (prjIdx < 0) {
                    throw new Error(`${jsonFile} is not under any known Project directorys: ${prjDirs.join(', ')}`);
                }
                const prjPackageNames = getState().project2Packages.get(prjKeys[prjIdx]);
                if (!prjPackageNames.includes(info.name)) {
                    exports.actionDispatcher._associatePackageToPrj({
                        prj: prjKeys[prjIdx],
                        pkgs: [...prjPackageNames.map(name => ({ name })), info]
                    });
                }
                return info;
            });
            exports.actionDispatcher._syncLinkedPackages([pkgList, 'update']);
        }
        else {
            const rm = (yield Promise.resolve().then(() => __importStar(require('../recipe-manager'))));
            pkgList = [];
            yield rm.scanPackages().pipe(operators_1.tap(([proj, jsonFile]) => {
                if (!projPkgMap.has(proj))
                    projPkgMap.set(proj, []);
                const info = createPackageInfo(jsonFile, false);
                if (info.json.dr || info.json.plink) {
                    pkgList.push(info);
                    projPkgMap.get(proj).push(info);
                }
                else {
                    log.debug(`Package of ${jsonFile} is skipped (due to no "dr" or "plink" property)`);
                }
            })).toPromise();
            for (const [prj, pkgs] of projPkgMap.entries()) {
                exports.actionDispatcher._associatePackageToPrj({ prj, pkgs });
            }
            exports.actionDispatcher._syncLinkedPackages([pkgList, 'clean']);
        }
    });
}
function _createSymlinksForWorkspace(wsKey) {
    if (symlinkDirName !== '.links' && fs_1.default.existsSync(path_1.default.resolve(rootDir, wsKey, '.links'))) {
        fs_extra_1.default.remove(path_1.default.resolve(rootDir, wsKey, '.links'))
            .catch(ex => log.info(ex));
    }
    const symlinkDir = path_1.default.resolve(rootDir, wsKey, symlinkDirName || 'node_modules');
    fs_extra_1.default.mkdirpSync(symlinkDir);
    const ws = getState().workspaces.get(wsKey);
    const pkgNames = ws.linkedDependencies.map(item => item[0])
        .concat(ws.linkedDevDependencies.map(item => item[0]));
    const pkgNameSet = new Set(pkgNames);
    if (symlinkDirName !== 'node_modules') {
        if (ws.installedComponents) {
            for (const pname of ws.installedComponents.keys())
                pkgNameSet.add(pname);
        }
    }
    if (symlinkDirName !== 'node_modules') {
        exports.actionDispatcher.updateGitIgnores({
            file: path_1.default.resolve(rootDir, '.gitignore'),
            lines: [path_1.default.relative(rootDir, symlinkDir).replace(/\\/g, '/')]
        });
    }
    return rxjs_1.merge(rxjs_1.from(pkgNameSet.values()).pipe(operators_1.map(name => getState().srcPackages.get(name) || ws.installedComponents.get(name)), rwPackageJson_1.symbolicLinkPackages(symlinkDir)), _deleteUselessSymlink(symlinkDir, pkgNameSet));
}
function _deleteUselessSymlink(checkDir, excludeSet) {
    return __awaiter(this, void 0, void 0, function* () {
        const dones = [];
        const drcpName = getState().linkedDrcp ? getState().linkedDrcp.name : null;
        const done1 = symlinks_1.listModuleSymlinks(checkDir, (link) => __awaiter(this, void 0, void 0, function* () {
            const pkgName = path_1.default.relative(checkDir, link).replace(/\\/g, '/');
            if (drcpName !== pkgName && !excludeSet.has(pkgName)) {
                // tslint:disable-next-line: no-console
                log.info(`Delete extraneous symlink: ${link}`);
                dones.push(fs_1.default.promises.unlink(link));
            }
        }));
        yield done1;
        yield Promise.all(dones);
    });
}
/**
 *
 * @param pkJsonFile package.json file path
 * @param isInstalled
 * @param symLink symlink path of package
 * @param realPath real path of package
 */
function createPackageInfo(pkJsonFile, isInstalled = false) {
    const json = JSON.parse(fs_1.default.readFileSync(pkJsonFile, 'utf8'));
    return createPackageInfoWithJson(pkJsonFile, json, isInstalled);
}
exports.createPackageInfo = createPackageInfo;
/**
 * List those installed packages which are referenced by workspace package.json file,
 * those packages must have "dr" property in package.json
 * @param workspaceKey
 */
function* scanInstalledPackage4Workspace(state, workspaceKey) {
    const originInstallJson = state.workspaces.get(workspaceKey).originInstallJson;
    // const depJson = process.env.NODE_ENV === 'production' ? [originInstallJson.dependencies] :
    //   [originInstallJson.dependencies, originInstallJson.devDependencies];
    for (const deps of [originInstallJson.dependencies, originInstallJson.devDependencies]) {
        if (deps == null)
            continue;
        for (const dep of Object.keys(deps)) {
            if (!state.srcPackages.has(dep) && dep !== '@wfh/plink') {
                const pkjsonFile = path_1.default.resolve(rootDir, workspaceKey, 'node_modules', dep, 'package.json');
                if (fs_1.default.existsSync(pkjsonFile)) {
                    const pk = createPackageInfo(path_1.default.resolve(rootDir, workspaceKey, 'node_modules', dep, 'package.json'), true);
                    if (pk.json.dr || pk.json.plink) {
                        yield pk;
                    }
                }
            }
        }
    }
}
/**
 *
 * @param pkJsonFile package.json file path
 * @param isInstalled
 * @param symLink symlink path of package
 * @param realPath real path of package
 */
function createPackageInfoWithJson(pkJsonFile, json, isInstalled = false, symLinkParentDir) {
    const m = moduleNameReg.exec(json.name);
    const pkInfo = {
        shortName: m[2],
        name: json.name,
        scope: m[1],
        path: symLinkParentDir ? path_1.default.resolve(symLinkParentDir, json.name) : path_1.default.dirname(pkJsonFile),
        json,
        realPath: fs_1.default.realpathSync(path_1.default.dirname(pkJsonFile)),
        isInstalled
    };
    return pkInfo;
}
function cp(from, to) {
    if (lodash_1.default.startsWith(from, '-')) {
        from = arguments[1];
        to = arguments[2];
    }
    fs_extra_1.default.copySync(from, to);
    // shell.cp(...arguments);
    if (/[/\\]$/.test(to))
        to = path_1.default.basename(from); // to is a folder
    else
        to = path_1.default.relative(process.cwd(), to);
    // tslint:disable-next-line: no-console
    log.info('Copy to %s', chalk_1.default.cyan(to));
}
/**
 *
 * @param from absolute path
 * @param {string} to relative to rootPath
 */
function maybeCopyTemplate(from, to) {
    if (!fs_1.default.existsSync(path_1.default.resolve(rootDir, to)))
        cp(path_1.default.resolve(__dirname, from), to);
}
function _writeGitHook(project) {
    // if (!isWin32) {
    const gitPath = path_1.default.resolve(project, '.git/hooks');
    if (fs_1.default.existsSync(gitPath)) {
        const hookStr = '#!/bin/sh\n' +
            `cd "${rootDir}"\n` +
            // 'drcp init\n' +
            // 'npx pretty-quick --staged\n' + // Use `tslint --fix` instead.
            `plink lint --pj "${project.replace(/[/\\]$/, '')}" --fix\n`;
        if (fs_1.default.existsSync(gitPath + '/pre-commit'))
            fs_1.default.unlinkSync(gitPath + '/pre-commit');
        fs_1.default.writeFileSync(gitPath + '/pre-push', hookStr);
        // tslint:disable-next-line: no-console
        log.info('Write ' + gitPath + '/pre-push');
        if (!symlinks_1.isWin32) {
            process_utils_1.spawn('chmod', '-R', '+x', project + '/.git/hooks/pre-push');
        }
    }
    // }
}
function deleteDuplicatedInstalledPkg(workspaceKey) {
    const wsState = getState().workspaces.get(workspaceKey);
    const doNothing = () => { };
    wsState.linkedDependencies.concat(wsState.linkedDevDependencies).map(([pkgName]) => {
        const dir = path_1.default.resolve(rootDir, workspaceKey, 'node_modules', pkgName);
        return fs_1.default.promises.lstat(dir)
            .then((stat) => {
            if (!stat.isSymbolicLink()) {
                // tslint:disable-next-line: no-console
                log.info(`Previous installed ${path_1.default.relative(rootDir, dir)} is deleted, due to linked package ${pkgName}`);
                return fs_1.default.promises.unlink(dir);
            }
        })
            .catch(doNothing);
    });
}
// /**
//    * If a source code package uses Plink's __plink API ( like `.logger`) or extends Plink's command line,
//    * they need ensure some Plink's dependencies are installed as 1st level dependency in their workspace,
//    * otherwise Visual Code Editor can not find correct type definitions while referencing Plink's logger or
//    * Command interface.
//    * 
//    * So I need to make sure these dependencies are installed in each workspace
//    */
// function plinkApiRequiredDeps(): PackageJsonInterf {
//   const plinkJson: PackageJsonInterf = require('@wfh/plink/package.json');
//   const fakeJson: PackageJsonInterf = {
//     version: plinkJson.version,
//     name: plinkJson.name,
//     dependencies: {}
//   };
//   for (const dep of ['commander', 'log4js']) {
//     const version = plinkJson.dependencies![dep];
//     fakeJson.dependencies![dep] = version;
//   }
//   return fakeJson;
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi90cy9wYWNrYWdlLW1nci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCxrREFBMEI7QUFDMUIsd0RBQTZCO0FBQzdCLDRDQUFvQjtBQUNwQixvREFBdUI7QUFDdkIsZ0RBQXdCO0FBQ3hCLCtCQUFxRTtBQUNyRSw4Q0FDdUY7QUFDdkYsc0VBQWlHO0FBQ2pHLG9EQUF5QztBQUN6QyxvREFBdUM7QUFDdkMsc0RBQWtEO0FBQ2xELG9DQUF5RDtBQUN6RCw4Q0FBOEM7QUFDOUMsOERBQWtIO0FBQ2xILG9EQUFzRDtBQUV0RCwyQkFBeUI7QUFDekIsbUNBQWlDO0FBQ2pDLE1BQU0sR0FBRyxHQUFHLGtCQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQWlDM0MsTUFBTSxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBUSxDQUFhLENBQUM7QUFFakgsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDO0FBQ3RCLE1BQU0sYUFBYSxHQUFHLHVCQUF1QixDQUFDO0FBRTlDLE1BQU0sS0FBSyxHQUFrQjtJQUMzQixNQUFNLEVBQUUsS0FBSztJQUNiLFVBQVUsRUFBRSxJQUFJLEdBQUcsRUFBRTtJQUNyQixnQkFBZ0IsRUFBRSxJQUFJLEdBQUcsRUFBRTtJQUMzQixXQUFXLEVBQUUsSUFBSSxHQUFHLEVBQUU7SUFDdEIsVUFBVSxFQUFFLEVBQUU7SUFDZCx1QkFBdUIsRUFBRSxDQUFDO0lBQzFCLHNCQUFzQixFQUFFLENBQUM7Q0FDMUIsQ0FBQztBQWdDVyxRQUFBLEtBQUssR0FBRyxvQkFBWSxDQUFDLFFBQVEsQ0FBQztJQUN6QyxJQUFJLEVBQUUsRUFBRTtJQUNS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RyxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekUsT0FBTyxZQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7YUFDNUIsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFO2dCQUMxQix1Q0FBdUM7Z0JBQ3ZDLEdBQUcsQ0FBQyxJQUFJLENBQUMsc0JBQXNCLGNBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFDLEdBQUcsQ0FBQyxzQ0FBc0MsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUcsT0FBTyxZQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNoQztRQUNILENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNO0FBQ04sNEdBQTRHO0FBQzVHLDRHQUE0RztBQUM1Ryw4R0FBOEc7QUFDOUcsMEJBQTBCO0FBQzFCLFFBQVE7QUFDUixpRkFBaUY7QUFDakYsUUFBUTtBQUVSLHVEQUF1RDtBQUN2RCw2RUFBNkU7QUFDN0UsMENBQTBDO0FBQzFDLGtDQUFrQztBQUNsQyw0QkFBNEI7QUFDNUIsdUJBQXVCO0FBQ3ZCLE9BQU87QUFDUCxpREFBaUQ7QUFDakQsb0RBQW9EO0FBQ3BELDZDQUE2QztBQUM3QyxNQUFNO0FBQ04scUJBQXFCO0FBQ3JCLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVuZm9ydHVuYXRlbHksIHRoaXMgZmlsZSBpcyB2ZXJ5IGxvbmcsIHlvdSBuZWVkIHRvIGZvbGQgYnkgaW5kZW50aW9uIGZvciBiZXR0ZXIgdmlldyBvZiBzb3VyY2UgY29kZSBpbiBFZGl0b3JcbiAqL1xuXG5pbXBvcnQgeyBQYXlsb2FkQWN0aW9uIH0gZnJvbSAnQHJlZHV4anMvdG9vbGtpdCc7XG5pbXBvcnQgY2hhbGsgZnJvbSAnY2hhbGsnO1xuaW1wb3J0IGZzZXh0IGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcm9tLCBtZXJnZSwgT2JzZXJ2YWJsZSwgb2YsIGRlZmVyLCB0aHJvd0Vycm9yfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IGRpc3RpbmN0VW50aWxDaGFuZ2VkLCBmaWx0ZXIsIG1hcCwgc3dpdGNoTWFwLCBkZWJvdW5jZVRpbWUsXG4gIHRha2UsIGNvbmNhdE1hcCwgc2tpcCwgaWdub3JlRWxlbWVudHMsIHNjYW4sIGNhdGNoRXJyb3IsIHRhcCB9IGZyb20gJ3J4anMvb3BlcmF0b3JzJztcbmltcG9ydCB7IGxpc3RDb21wRGVwZW5kZW5jeSwgUGFja2FnZUpzb25JbnRlcmYsIERlcGVuZGVudEluZm8gfSBmcm9tICcuLi90cmFuc2l0aXZlLWRlcC1ob2lzdGVyJztcbmltcG9ydCB7IHNwYXduIH0gZnJvbSAnLi4vcHJvY2Vzcy11dGlscyc7XG5pbXBvcnQgeyBleGUgfSBmcm9tICcuLi9wcm9jZXNzLXV0aWxzJztcbmltcG9ydCB7IHNldFByb2plY3RMaXN0fSBmcm9tICcuLi9yZWNpcGUtbWFuYWdlcic7XG5pbXBvcnQgeyBzdGF0ZUZhY3RvcnksIG9mUGF5bG9hZEFjdGlvbiB9IGZyb20gJy4uL3N0b3JlJztcbi8vIGltcG9ydCB7IGdldFJvb3REaXIgfSBmcm9tICcuLi91dGlscy9taXNjJztcbmltcG9ydCBjbGVhbkludmFsaWRTeW1saW5rcywgeyBpc1dpbjMyLCBsaXN0TW9kdWxlU3ltbGlua3MsIHVubGlua0FzeW5jLCBfc3ltbGlua0FzeW5jIH0gZnJvbSAnLi4vdXRpbHMvc3ltbGlua3MnO1xuaW1wb3J0IHtzeW1ib2xpY0xpbmtQYWNrYWdlc30gZnJvbSAnLi4vcndQYWNrYWdlSnNvbic7XG5pbXBvcnQge1BsaW5rRW52fSBmcm9tICcuLi9ub2RlLXBhdGgnO1xuaW1wb3J0IHsgRU9MIH0gZnJvbSAnb3MnO1xuaW1wb3J0IHtnZXRMb2dnZXJ9IGZyb20gJ2xvZzRqcyc7XG5jb25zdCBsb2cgPSBnZXRMb2dnZXIoJ3BsaW5rLnBhY2thZ2UtbWdyJyk7XG5leHBvcnQgaW50ZXJmYWNlIFBhY2thZ2VJbmZvIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzY29wZTogc3RyaW5nO1xuICBzaG9ydE5hbWU6IHN0cmluZztcbiAganNvbjogYW55O1xuICAvKiogSWYgdGhpcyBwcm9wZXJ0eSBpcyBub3Qgc2FtZSBhcyBcInJlYWxQYXRoXCIsIHRoZW4gaXQgaXMgYSBzeW1saW5rICovXG4gIHBhdGg6IHN0cmluZztcbiAgcmVhbFBhdGg6IHN0cmluZztcbiAgaXNJbnN0YWxsZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFja2FnZXNTdGF0ZSB7XG4gIGluaXRlZDogYm9vbGVhbjtcbiAgc3JjUGFja2FnZXM6IE1hcDxzdHJpbmcsIFBhY2thZ2VJbmZvPjtcbiAgLyoqIEtleSBpcyByZWxhdGl2ZSBwYXRoIHRvIHJvb3Qgd29ya3NwYWNlICovXG4gIHdvcmtzcGFjZXM6IE1hcDxzdHJpbmcsIFdvcmtzcGFjZVN0YXRlPjtcbiAgLyoqIGtleSBvZiBjdXJyZW50IFwid29ya3NwYWNlc1wiICovXG4gIGN1cnJXb3Jrc3BhY2U/OiBzdHJpbmcgfCBudWxsO1xuICBwcm9qZWN0MlBhY2thZ2VzOiBNYXA8c3RyaW5nLCBzdHJpbmdbXT47XG4gIC8qKiBEcmNwIGlzIHRoZSBvcmlnaW5hbCBuYW1lIG9mIFBsaW5rIHByb2plY3QgKi9cbiAgbGlua2VkRHJjcD86IFBhY2thZ2VJbmZvIHwgbnVsbDtcbiAgbGlua2VkRHJjcFByb2plY3Q/OiBzdHJpbmcgfCBudWxsO1xuICBpbnN0YWxsZWREcmNwPzogUGFja2FnZUluZm8gfCBudWxsO1xuICBnaXRJZ25vcmVzOiB7W2ZpbGU6IHN0cmluZ106IHN0cmluZ1tdfTtcbiAgaXNJbkNoaW5hPzogYm9vbGVhbjtcbiAgLyoqIEV2ZXJ5dGltZSBhIGhvaXN0IHdvcmtzcGFjZSBzdGF0ZSBjYWxjdWxhdGlvbiBpcyBiYXNpY2FsbHkgZG9uZSwgaXQgaXMgaW5jcmVhc2VkIGJ5IDEgKi9cbiAgd29ya3NwYWNlVXBkYXRlQ2hlY2tzdW06IG51bWJlcjtcbiAgcGFja2FnZXNVcGRhdGVDaGVja3N1bTogbnVtYmVyO1xuICAvKiogd29ya3NwYWNlIGtleSAqL1xuICBsYXN0Q3JlYXRlZFdvcmtzcGFjZT86IHN0cmluZztcbn1cblxuY29uc3Qge2Rpc3REaXIsIHJvb3REaXIsIHBsaW5rRGlyLCBpc0RyY3BTeW1saW5rLCBzeW1saW5rRGlyTmFtZX0gPSBKU09OLnBhcnNlKHByb2Nlc3MuZW52Ll9fcGxpbmshKSBhcyBQbGlua0VudjtcblxuY29uc3QgTlMgPSAncGFja2FnZXMnO1xuY29uc3QgbW9kdWxlTmFtZVJlZyA9IC9eKD86QChbXi9dKylcXC8pPyhcXFMrKS87XG5cbmNvbnN0IHN0YXRlOiBQYWNrYWdlc1N0YXRlID0ge1xuICBpbml0ZWQ6IGZhbHNlLFxuICB3b3Jrc3BhY2VzOiBuZXcgTWFwKCksXG4gIHByb2plY3QyUGFja2FnZXM6IG5ldyBNYXAoKSxcbiAgc3JjUGFja2FnZXM6IG5ldyBNYXAoKSxcbiAgZ2l0SWdub3Jlczoge30sXG4gIHdvcmtzcGFjZVVwZGF0ZUNoZWNrc3VtOiAwLFxuICBwYWNrYWdlc1VwZGF0ZUNoZWNrc3VtOiAwXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFdvcmtzcGFjZVN0YXRlIHtcbiAgaWQ6IHN0cmluZztcbiAgb3JpZ2luSW5zdGFsbEpzb246IFBhY2thZ2VKc29uSW50ZXJmO1xuICBvcmlnaW5JbnN0YWxsSnNvblN0cjogc3RyaW5nO1xuICBpbnN0YWxsSnNvbjogUGFja2FnZUpzb25JbnRlcmY7XG4gIGluc3RhbGxKc29uU3RyOiBzdHJpbmc7XG4gIC8qKiBuYW1lcyBvZiB0aG9zZSBsaW5rZWQgc291cmNlIHBhY2thZ2VzICovXG4gIGxpbmtlZERlcGVuZGVuY2llczogW3N0cmluZywgc3RyaW5nXVtdO1xuICAvKiogbmFtZXMgb2YgdGhvc2UgbGlua2VkIHNvdXJjZSBwYWNrYWdlcyAqL1xuICBsaW5rZWREZXZEZXBlbmRlbmNpZXM6IFtzdHJpbmcsIHN0cmluZ11bXTtcblxuICAvKiogaW5zdGFsbGVkIERSIGNvbXBvbmVudCBwYWNrYWdlcyBbbmFtZSwgdmVyc2lvbl0qL1xuICBpbnN0YWxsZWRDb21wb25lbnRzPzogTWFwPHN0cmluZywgUGFja2FnZUluZm8+O1xuXG4gIGhvaXN0SW5mbzogTWFwPHN0cmluZywgRGVwZW5kZW50SW5mbz47XG4gIGhvaXN0UGVlckRlcEluZm86IE1hcDxzdHJpbmcsIERlcGVuZGVudEluZm8+O1xuXG4gIGhvaXN0RGV2SW5mbzogTWFwPHN0cmluZywgRGVwZW5kZW50SW5mbz47XG4gIGhvaXN0RGV2UGVlckRlcEluZm86IE1hcDxzdHJpbmcsIERlcGVuZGVudEluZm8+O1xuXG4gIGhvaXN0SW5mb1N1bW1hcnk6IHtcbiAgICAvKiogVXNlciBzaG91bGQgbWFudWxseSBhZGQgdGhlbSBhcyBkZXBlbmRlbmNpZXMgb2Ygd29ya3NwYWNlICovXG4gICAgbWlzc2luZ0RlcHM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfTtcbiAgICAvKiogVXNlciBzaG91bGQgbWFudWxseSBhZGQgdGhlbSBhcyBkZXZEZXBlbmRlbmNpZXMgb2Ygd29ya3NwYWNlICovXG4gICAgbWlzc2luZ0RldkRlcHM6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfTtcbiAgICAvKiogdmVyc2lvbnMgYXJlIGNvbmZsaWN0ICovXG4gICAgY29uZmxpY3REZXBzOiBzdHJpbmdbXTtcbiAgfTtcbn1cblxuZXhwb3J0IGNvbnN0IHNsaWNlID0gc3RhdGVGYWN0b3J5Lm5ld1NsaWNlKHtcbiAgbmFtZTogTlMsXG4gIGluaXRpYWxTdGF0ZTogc3RhdGUsXG4gIHJlZHVjZXJzOiB7XG4gICAgLyoqIERvIHRoaXMgYWN0aW9uIGFmdGVyIGFueSBsaW5rZWQgcGFja2FnZSBpcyByZW1vdmVkIG9yIGFkZGVkICAqL1xuICAgIGluaXRSb290RGlyKGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbjx7aXNGb3JjZTogYm9vbGVhbiwgY3JlYXRlSG9vazogYm9vbGVhbn0+KSB7fSxcblxuICAgIC8qKiBcbiAgICAgKiAtIENyZWF0ZSBpbml0aWFsIGZpbGVzIGluIHJvb3QgZGlyZWN0b3J5XG4gICAgICogLSBTY2FuIGxpbmtlZCBwYWNrYWdlcyBhbmQgaW5zdGFsbCB0cmFuc2l0aXZlIGRlcGVuZGVuY3lcbiAgICAgKiAtIFN3aXRjaCB0byBkaWZmZXJlbnQgd29ya3NwYWNlXG4gICAgICogLSBEZWxldGUgbm9uZXhpc3Rpbmcgd29ya3NwYWNlXG4gICAgICogLSBJZiBcInBhY2thZ2VKc29uRmlsZXNcIiBpcyBwcm92aWRlZCwgaXQgc2hvdWxkIHNraXAgc3RlcCBvZiBzY2FubmluZyBsaW5rZWQgcGFja2FnZXNcbiAgICAgKiAtIFRPRE86IGlmIHRoZXJlIGlzIGxpbmtlZCBwYWNrYWdlIHVzZWQgaW4gbW9yZSB0aGFuIG9uZSB3b3Jrc3BhY2UsIGhvaXN0IGFuZCBpbnN0YWxsIGZvciB0aGVtIGFsbD9cbiAgICAgKi9cbiAgICB1cGRhdGVXb3Jrc3BhY2UoZCwgYWN0aW9uOiBQYXlsb2FkQWN0aW9uPHtkaXI6IHN0cmluZyxcbiAgICAgIGlzRm9yY2U6IGJvb2xlYW4sIGNyZWF0ZUhvb2s6IGJvb2xlYW4sIHBhY2thZ2VKc29uRmlsZXM/OiBzdHJpbmdbXX0+KSB7XG4gICAgfSxcbiAgICBzY2FuQW5kU3luY1BhY2thZ2VzKGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbjx7cGFja2FnZUpzb25GaWxlcz86IHN0cmluZ1tdfT4pIHt9LFxuXG4gICAgdXBkYXRlRGlyKCkge30sXG4gICAgX3VwZGF0ZVBsaW5rUGFja2FnZUluZm8oZCkge1xuICAgICAgY29uc3QgcGxpbmtQa2cgPSBjcmVhdGVQYWNrYWdlSW5mbyhQYXRoLnJlc29sdmUocGxpbmtEaXIsICdwYWNrYWdlLmpzb24nKSwgZmFsc2UpO1xuICAgICAgaWYgKGlzRHJjcFN5bWxpbmspIHtcbiAgICAgICAgZC5saW5rZWREcmNwID0gcGxpbmtQa2c7XG4gICAgICAgIGQuaW5zdGFsbGVkRHJjcCA9IG51bGw7XG4gICAgICAgIGQubGlua2VkRHJjcFByb2plY3QgPSBwYXRoVG9Qcm9qS2V5KFBhdGguZGlybmFtZShkLmxpbmtlZERyY3AhLnJlYWxQYXRoKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkLmxpbmtlZERyY3AgPSBudWxsO1xuICAgICAgICBkLmluc3RhbGxlZERyY3AgPSBwbGlua1BrZztcbiAgICAgICAgZC5saW5rZWREcmNwUHJvamVjdCA9IG51bGw7XG4gICAgICB9XG4gICAgfSxcbiAgICBfc3luY0xpbmtlZFBhY2thZ2VzKGQsIHtwYXlsb2FkfTogUGF5bG9hZEFjdGlvbjxbcGtnczogUGFja2FnZUluZm9bXSwgb3BlcmF0b3I6ICd1cGRhdGUnIHwgJ2NsZWFuJ10+KSB7XG4gICAgICBkLmluaXRlZCA9IHRydWU7XG4gICAgICBsZXQgbWFwID0gZC5zcmNQYWNrYWdlcztcbiAgICAgIGlmIChwYXlsb2FkWzFdID09PSAnY2xlYW4nKSB7XG4gICAgICAgIG1hcCA9IGQuc3JjUGFja2FnZXMgPSBuZXcgTWFwKCk7XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IHBrSW5mbyBvZiBwYXlsb2FkWzBdKSB7XG4gICAgICAgIG1hcC5zZXQocGtJbmZvLm5hbWUsIHBrSW5mbyk7XG4gICAgICB9XG4gICAgfSxcbiAgICBvbkxpbmtlZFBhY2thZ2VBZGRlZChkLCBhY3Rpb246IFBheWxvYWRBY3Rpb248c3RyaW5nW10+KSB7fSxcbiAgICBhZGRQcm9qZWN0KGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbjxzdHJpbmdbXT4pIHtcbiAgICAgIGZvciAoY29uc3QgcmF3RGlyIG9mIGFjdGlvbi5wYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGhUb1Byb2pLZXkocmF3RGlyKTtcbiAgICAgICAgaWYgKCFkLnByb2plY3QyUGFja2FnZXMuaGFzKGRpcikpIHtcbiAgICAgICAgICBkLnByb2plY3QyUGFja2FnZXMuc2V0KGRpciwgW10pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcbiAgICBkZWxldGVQcm9qZWN0KGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbjxzdHJpbmdbXT4pIHtcbiAgICAgIGZvciAoY29uc3QgcmF3RGlyIG9mIGFjdGlvbi5wYXlsb2FkKSB7XG4gICAgICAgIGNvbnN0IGRpciA9IHBhdGhUb1Byb2pLZXkocmF3RGlyKTtcbiAgICAgICAgZC5wcm9qZWN0MlBhY2thZ2VzLmRlbGV0ZShkaXIpO1xuICAgICAgfVxuICAgIH0sXG4gICAgLyoqIHBheWxvYWQ6IHdvcmtzcGFjZSBrZXlzLCBoYXBwZW5zIGFzIGRlYm91bmNlZCB3b3Jrc3BhY2UgY2hhbmdlIGV2ZW50ICovXG4gICAgd29ya3NwYWNlQmF0Y2hDaGFuZ2VkKGQsIGFjdGlvbjogUGF5bG9hZEFjdGlvbjxzdHJpbmdbXT4pIHt9LFxuICAgIHVwZGF0ZUdpdElnbm9yZXMoZCwge3BheWxvYWR9OiBQYXlsb2FkQWN0aW9uPHtmaWxlOiBzdHJpbmcsIGxpbmVzOiBzdHJpbmdbXX0+KSB7XG4gICAgICBkLmdpdElnbm9yZXNbcGF5bG9hZC5maWxlXSA9IHBheWxvYWQubGluZXMubWFwKGxpbmUgPT4gbGluZS5zdGFydHNXaXRoKCcvJykgPyBsaW5lIDogJy8nICsgbGluZSk7XG4gICAgfSxcbiAgICBwYWNrYWdlc1VwZGF0ZWQoZCkge1xuICAgICAgZC5wYWNrYWdlc1VwZGF0ZUNoZWNrc3VtKys7XG4gICAgfSxcbiAgICBzZXRJbkNoaW5hKGQsIHtwYXlsb2FkfTogUGF5bG9hZEFjdGlvbjxib29sZWFuPikge1xuICAgICAgZC5pc0luQ2hpbmEgPSBwYXlsb2FkO1xuICAgIH0sXG4gICAgX3NldEN1cnJlbnRXb3Jrc3BhY2UoZCwge3BheWxvYWQ6IGRpcn06IFBheWxvYWRBY3Rpb248c3RyaW5nIHwgbnVsbD4pIHtcbiAgICAgIGlmIChkaXIgIT0gbnVsbClcbiAgICAgICAgZC5jdXJyV29ya3NwYWNlID0gd29ya3NwYWNlS2V5KGRpcik7XG4gICAgICBlbHNlXG4gICAgICAgIGQuY3VycldvcmtzcGFjZSA9IG51bGw7XG4gICAgfSxcbiAgICAvKiogcGFyYW10ZXI6IHdvcmtzcGFjZSBrZXkgKi9cbiAgICB3b3Jrc3BhY2VTdGF0ZVVwZGF0ZWQoZCwge3BheWxvYWR9OiBQYXlsb2FkQWN0aW9uPHN0cmluZz4pIHtcbiAgICAgIGQud29ya3NwYWNlVXBkYXRlQ2hlY2tzdW0gKz0gMTtcbiAgICB9LFxuICAgIC8vIG9uV29ya3NwYWNlUGFja2FnZVVwZGF0ZWQoZCwge3BheWxvYWQ6IHdvcmtzcGFjZUtleX06IFBheWxvYWRBY3Rpb248c3RyaW5nPikge30sXG4gICAgX2hvaXN0V29ya3NwYWNlRGVwcyhzdGF0ZSwge3BheWxvYWQ6IHtkaXJ9fTogUGF5bG9hZEFjdGlvbjx7ZGlyOiBzdHJpbmd9Pikge1xuICAgICAgaWYgKHN0YXRlLnNyY1BhY2thZ2VzID09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdcInNyY1BhY2thZ2VzXCIgaXMgbnVsbCwgbmVlZCB0byBydW4gYGluaXRgIGNvbW1hbmQgZmlyc3QnKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHBranNvblN0cjogc3RyaW5nO1xuICAgICAgY29uc3QgcGtnanNvbkZpbGUgPSBQYXRoLnJlc29sdmUoZGlyLCAncGFja2FnZS5qc29uJyk7XG4gICAgICBjb25zdCBsb2NrRmlsZSA9IFBhdGgucmVzb2x2ZShkaXIsICdwbGluay5pbnN0YWxsLmxvY2snKTtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGxvY2tGaWxlKSkge1xuICAgICAgICBsb2cud2FybignUGxpbmsgaW5pdC9zeW5jIHByb2Nlc3Mgd2FzIGludGVycnVwdGVkIGxhc3QgdGltZSwgcmVjb3ZlciBjb250ZW50IG9mICcgKyBwa2dqc29uRmlsZSk7XG4gICAgICAgIHBranNvblN0ciA9IGZzLnJlYWRGaWxlU3luYyhsb2NrRmlsZSwgJ3V0ZjgnKTtcbiAgICAgICAgZnMudW5saW5rU3luYyhsb2NrRmlsZSk7XG4gICAgICB9XG5cbiAgICAgIHBranNvblN0ciA9IGZzLnJlYWRGaWxlU3luYyhwa2dqc29uRmlsZSwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IHBranNvbjogUGFja2FnZUpzb25JbnRlcmYgPSBKU09OLnBhcnNlKHBranNvblN0cik7XG4gICAgICAvLyBmb3IgKGNvbnN0IGRlcHMgb2YgW3BranNvbi5kZXBlbmRlbmNpZXMsIHBranNvbi5kZXZEZXBlbmRlbmNpZXNdIGFzIHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfVtdICkge1xuICAgICAgLy8gICBPYmplY3QuZW50cmllcyhkZXBzKTtcbiAgICAgIC8vIH1cblxuICAgICAgY29uc3QgZGVwcyA9IE9iamVjdC5lbnRyaWVzPHN0cmluZz4ocGtqc29uLmRlcGVuZGVuY2llcyB8fCB7fSk7XG5cbiAgICAgIGNvbnN0IHVwZGF0aW5nRGVwcyA9IHsuLi5wa2pzb24uZGVwZW5kZW5jaWVzIHx8IHt9fTtcbiAgICAgIGNvbnN0IGxpbmtlZERlcGVuZGVuY2llczogdHlwZW9mIGRlcHMgPSBbXTtcbiAgICAgIGRlcHMuZmlsdGVyKGRlcCA9PiB7XG4gICAgICAgIGlmIChzdGF0ZS5zcmNQYWNrYWdlcy5oYXMoZGVwWzBdKSkge1xuICAgICAgICAgIGxpbmtlZERlcGVuZGVuY2llcy5wdXNoKGRlcCk7XG4gICAgICAgICAgZGVsZXRlIHVwZGF0aW5nRGVwc1tkZXBbMF1dO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgICAgY29uc3QgZGV2RGVwcyA9IE9iamVjdC5lbnRyaWVzPHN0cmluZz4ocGtqc29uLmRldkRlcGVuZGVuY2llcyB8fCB7fSk7XG4gICAgICBjb25zdCB1cGRhdGluZ0RldkRlcHMgPSB7Li4ucGtqc29uLmRldkRlcGVuZGVuY2llcyB8fCB7fX07XG4gICAgICBjb25zdCBsaW5rZWREZXZEZXBlbmRlbmNpZXM6IHR5cGVvZiBkZXZEZXBzID0gW107XG4gICAgICBkZXZEZXBzLmZpbHRlcihkZXAgPT4ge1xuICAgICAgICBpZiAoc3RhdGUuc3JjUGFja2FnZXMuaGFzKGRlcFswXSkpIHtcbiAgICAgICAgICBsaW5rZWREZXZEZXBlbmRlbmNpZXMucHVzaChkZXApO1xuICAgICAgICAgIGRlbGV0ZSB1cGRhdGluZ0RldkRlcHNbZGVwWzBdXTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGlzRHJjcFN5bWxpbmspIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgIGxvZy5kZWJ1ZygnW19ob2lzdFdvcmtzcGFjZURlcHNdIEB3ZmgvcGxpbmsgaXMgc3ltbGluaycpO1xuICAgICAgICBkZWxldGUgdXBkYXRpbmdEZXBzWydAd2ZoL3BsaW5rJ107XG4gICAgICAgIGRlbGV0ZSB1cGRhdGluZ0RldkRlcHNbJ0B3ZmgvcGxpbmsnXTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgd3NLZXkgPSB3b3Jrc3BhY2VLZXkoZGlyKTtcbiAgICAgIGNvbnN0IHtob2lzdGVkOiBob2lzdGVkRGVwcywgaG9pc3RlZFBlZXJzOiBob2lzdFBlZXJEZXBJbmZvfSA9IGxpc3RDb21wRGVwZW5kZW5jeShcbiAgICAgICAgbGlua2VkRGVwZW5kZW5jaWVzLm1hcChlbnRyeSA9PiBzdGF0ZS5zcmNQYWNrYWdlcy5nZXQoZW50cnlbMF0pIS5qc29uKSxcbiAgICAgICAgICAvLyAuY29uY2F0KHBsaW5rQXBpUmVxdWlyZWREZXBzKCkpLFxuICAgICAgICB3c0tleSwgdXBkYXRpbmdEZXBzLCBzdGF0ZS5zcmNQYWNrYWdlc1xuICAgICAgKTtcblxuICAgICAgY29uc3Qge2hvaXN0ZWQ6IGhvaXN0ZWREZXZEZXBzLCBob2lzdGVkUGVlcnM6IGRldkhvaXN0UGVlckRlcEluZm99ID0gbGlzdENvbXBEZXBlbmRlbmN5KFxuICAgICAgICBsaW5rZWREZXZEZXBlbmRlbmNpZXMubWFwKGVudHJ5ID0+IHN0YXRlLnNyY1BhY2thZ2VzLmdldChlbnRyeVswXSkhLmpzb24pLFxuICAgICAgICB3c0tleSwgdXBkYXRpbmdEZXZEZXBzLCBzdGF0ZS5zcmNQYWNrYWdlc1xuICAgICAgKTtcblxuICAgICAgY29uc3QgaW5zdGFsbEpzb246IFBhY2thZ2VKc29uSW50ZXJmID0ge1xuICAgICAgICAuLi5wa2pzb24sXG4gICAgICAgIGRlcGVuZGVuY2llczogQXJyYXkuZnJvbShob2lzdGVkRGVwcy5lbnRyaWVzKCkpXG4gICAgICAgIC5jb25jYXQoQXJyYXkuZnJvbShob2lzdFBlZXJEZXBJbmZvLmVudHJpZXMoKSkuZmlsdGVyKGl0ZW0gPT4gIWl0ZW1bMV0ubWlzc2luZykpXG4gICAgICAgIC5yZWR1Y2UoKGRpYywgW25hbWUsIGluZm9dKSA9PiB7XG4gICAgICAgICAgZGljW25hbWVdID0gaW5mby5ieVswXS52ZXI7XG4gICAgICAgICAgcmV0dXJuIGRpYztcbiAgICAgICAgfSwge30gYXMge1trZXk6IHN0cmluZ106IHN0cmluZ30pLFxuXG4gICAgICAgIGRldkRlcGVuZGVuY2llczogQXJyYXkuZnJvbShob2lzdGVkRGV2RGVwcy5lbnRyaWVzKCkpXG4gICAgICAgIC5jb25jYXQoQXJyYXkuZnJvbShkZXZIb2lzdFBlZXJEZXBJbmZvLmVudHJpZXMoKSkuZmlsdGVyKGl0ZW0gPT4gIWl0ZW1bMV0ubWlzc2luZykpXG4gICAgICAgIC5yZWR1Y2UoKGRpYywgW25hbWUsIGluZm9dKSA9PiB7XG4gICAgICAgICAgZGljW25hbWVdID0gaW5mby5ieVswXS52ZXI7XG4gICAgICAgICAgcmV0dXJuIGRpYztcbiAgICAgICAgfSwge30gYXMge1trZXk6IHN0cmluZ106IHN0cmluZ30pXG4gICAgICB9O1xuXG4gICAgICAvLyBsb2cuaW5mbyhpbnN0YWxsSnNvbilcbiAgICAgIC8vIGNvbnN0IGluc3RhbGxlZENvbXAgPSBzY2FuSW5zdGFsbGVkUGFja2FnZTRXb3Jrc3BhY2Uoc3RhdGUud29ya3NwYWNlcywgc3RhdGUuc3JjUGFja2FnZXMsIHdzS2V5KTtcblxuICAgICAgY29uc3QgZXhpc3RpbmcgPSBzdGF0ZS53b3Jrc3BhY2VzLmdldCh3c0tleSk7XG5cbiAgICAgIGNvbnN0IGhvaXN0SW5mb1N1bW1hcnk6IFdvcmtzcGFjZVN0YXRlWydob2lzdEluZm9TdW1tYXJ5J10gPSB7XG4gICAgICAgIGNvbmZsaWN0RGVwczogW10sIG1pc3NpbmdEZXBzOiB7fSwgbWlzc2luZ0RldkRlcHM6IHt9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKGNvbnN0IGRlcHNJbmZvIG9mIFtob2lzdGVkRGVwcywgaG9pc3RQZWVyRGVwSW5mb10pIHtcbiAgICAgICAgZm9yIChjb25zdCBbZGVwLCBpbmZvXSBvZiBkZXBzSW5mby5lbnRyaWVzKCkpIHtcbiAgICAgICAgICBpZiAoaW5mby5taXNzaW5nKSB7XG4gICAgICAgICAgICBob2lzdEluZm9TdW1tYXJ5Lm1pc3NpbmdEZXBzW2RlcF0gPSBpbmZvLmJ5WzBdLnZlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFpbmZvLnNhbWVWZXIgJiYgIWluZm8uZGlyZWN0KSB7XG4gICAgICAgICAgICBob2lzdEluZm9TdW1tYXJ5LmNvbmZsaWN0RGVwcy5wdXNoKGRlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3IgKGNvbnN0IGRlcHNJbmZvIG9mIFtob2lzdGVkRGV2RGVwcywgZGV2SG9pc3RQZWVyRGVwSW5mb10pIHtcbiAgICAgICAgZm9yIChjb25zdCBbZGVwLCBpbmZvXSBvZiBkZXBzSW5mby5lbnRyaWVzKCkpIHtcbiAgICAgICAgICBpZiAoaW5mby5taXNzaW5nKSB7XG4gICAgICAgICAgICBob2lzdEluZm9TdW1tYXJ5Lm1pc3NpbmdEZXZEZXBzW2RlcF0gPSBpbmZvLmJ5WzBdLnZlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFpbmZvLnNhbWVWZXIgJiYgIWluZm8uZGlyZWN0KSB7XG4gICAgICAgICAgICBob2lzdEluZm9TdW1tYXJ5LmNvbmZsaWN0RGVwcy5wdXNoKGRlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHdwOiBXb3Jrc3BhY2VTdGF0ZSA9IHtcbiAgICAgICAgaWQ6IHdzS2V5LFxuICAgICAgICBvcmlnaW5JbnN0YWxsSnNvbjogcGtqc29uLFxuICAgICAgICBvcmlnaW5JbnN0YWxsSnNvblN0cjogcGtqc29uU3RyLFxuICAgICAgICBpbnN0YWxsSnNvbixcbiAgICAgICAgaW5zdGFsbEpzb25TdHI6IEpTT04uc3RyaW5naWZ5KGluc3RhbGxKc29uLCBudWxsLCAnICAnKSxcbiAgICAgICAgbGlua2VkRGVwZW5kZW5jaWVzLFxuICAgICAgICBsaW5rZWREZXZEZXBlbmRlbmNpZXMsXG4gICAgICAgIGhvaXN0SW5mbzogaG9pc3RlZERlcHMsXG4gICAgICAgIGhvaXN0UGVlckRlcEluZm8sXG4gICAgICAgIGhvaXN0RGV2SW5mbzogaG9pc3RlZERldkRlcHMsXG4gICAgICAgIGhvaXN0RGV2UGVlckRlcEluZm86IGRldkhvaXN0UGVlckRlcEluZm8sXG4gICAgICAgIGhvaXN0SW5mb1N1bW1hcnlcbiAgICAgIH07XG4gICAgICBzdGF0ZS5sYXN0Q3JlYXRlZFdvcmtzcGFjZSA9IHdzS2V5O1xuICAgICAgc3RhdGUud29ya3NwYWNlcy5zZXQod3NLZXksIGV4aXN0aW5nID8gT2JqZWN0LmFzc2lnbihleGlzdGluZywgd3ApIDogd3ApO1xuICAgIH0sXG4gICAgX2luc3RhbGxXb3Jrc3BhY2UoZCwge3BheWxvYWQ6IHt3b3Jrc3BhY2VLZXl9fTogUGF5bG9hZEFjdGlvbjx7d29ya3NwYWNlS2V5OiBzdHJpbmd9Pikge30sXG4gICAgX2Fzc29jaWF0ZVBhY2thZ2VUb1ByaihkLCB7cGF5bG9hZDoge3ByaiwgcGtnc319OiBQYXlsb2FkQWN0aW9uPHtwcmo6IHN0cmluZzsgcGtnczoge25hbWU6IHN0cmluZ31bXX0+KSB7XG4gICAgICBkLnByb2plY3QyUGFja2FnZXMuc2V0KHBhdGhUb1Byb2pLZXkocHJqKSwgcGtncy5tYXAocGtncyA9PiBwa2dzLm5hbWUpKTtcbiAgICB9XG4gIH1cbn0pO1xuXG5leHBvcnQgY29uc3QgYWN0aW9uRGlzcGF0Y2hlciA9IHN0YXRlRmFjdG9yeS5iaW5kQWN0aW9uQ3JlYXRvcnMoc2xpY2UpO1xuZXhwb3J0IGNvbnN0IHt1cGRhdGVHaXRJZ25vcmVzLCBvbkxpbmtlZFBhY2thZ2VBZGRlZH0gPSBhY3Rpb25EaXNwYXRjaGVyO1xuXG4vKipcbiAqIENhcmVmdWxseSBhY2Nlc3MgYW55IHByb3BlcnR5IG9uIGNvbmZpZywgc2luY2UgY29uZmlnIHNldHRpbmcgcHJvYmFibHkgaGFzbid0IGJlZW4gc2V0IHlldCBhdCB0aGlzIG1vbW1lbnRcbiAqL1xuc3RhdGVGYWN0b3J5LmFkZEVwaWMoKGFjdGlvbiQsIHN0YXRlJCkgPT4ge1xuICBjb25zdCB1cGRhdGVkV29ya3NwYWNlU2V0ID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGNvbnN0IHBhY2thZ2VBZGRlZExpc3QgPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuXG4gIHJldHVybiBtZXJnZShcbiAgICAvLyBUbyBvdmVycmlkZSBzdG9yZWQgc3RhdGUuIFxuICAgIC8vIERvIG5vdCBwdXQgZm9sbG93aW5nIGxvZ2ljIGluIGluaXRpYWxTdGF0ZSEgSXQgd2lsbCBiZSBvdmVycmlkZGVuIGJ5IHByZXZpb3VzbHkgc2F2ZWQgc3RhdGVcblxuICAgIG9mKDEpLnBpcGUodGFwKCgpID0+IHByb2Nlc3MubmV4dFRpY2soKCkgPT4gYWN0aW9uRGlzcGF0Y2hlci5fdXBkYXRlUGxpbmtQYWNrYWdlSW5mbygpKSksXG4gICAgICBpZ25vcmVFbGVtZW50cygpXG4gICAgKSxcbiAgICBnZXRTdG9yZSgpLnBpcGUobWFwKHMgPT4gcy5wcm9qZWN0MlBhY2thZ2VzKSxcbiAgICAgIGRpc3RpbmN0VW50aWxDaGFuZ2VkKCksXG4gICAgICBtYXAocGtzID0+IHtcbiAgICAgICAgc2V0UHJvamVjdExpc3QoZ2V0UHJvamVjdExpc3QoKSk7XG4gICAgICAgIHJldHVybiBwa3M7XG4gICAgICB9KSxcbiAgICAgIGlnbm9yZUVsZW1lbnRzKClcbiAgICApLFxuXG4gICAgZ2V0U3RvcmUoKS5waXBlKG1hcChzID0+IHMuc3JjUGFja2FnZXMpLFxuICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIHNjYW4oKHByZXZNYXAsIGN1cnJNYXApID0+IHtcbiAgICAgICAgcGFja2FnZUFkZGVkTGlzdC5zcGxpY2UoMCk7XG4gICAgICAgIGZvciAoY29uc3Qgbm0gb2YgY3Vyck1hcC5rZXlzKCkpIHtcbiAgICAgICAgICBpZiAoIXByZXZNYXAuaGFzKG5tKSkge1xuICAgICAgICAgICAgcGFja2FnZUFkZGVkTGlzdC5wdXNoKG5tKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBhY2thZ2VBZGRlZExpc3QubGVuZ3RoID4gMClcbiAgICAgICAgICBvbkxpbmtlZFBhY2thZ2VBZGRlZChwYWNrYWdlQWRkZWRMaXN0KTtcbiAgICAgICAgcmV0dXJuIGN1cnJNYXA7XG4gICAgICB9KVxuICAgICksXG4gICAgLy8gIHVwZGF0ZVdvcmtzcGFjZVxuICAgIGFjdGlvbiQucGlwZShvZlBheWxvYWRBY3Rpb24oc2xpY2UuYWN0aW9ucy51cGRhdGVXb3Jrc3BhY2UpLFxuICAgICAgY29uY2F0TWFwKCh7cGF5bG9hZDoge2RpciwgaXNGb3JjZSwgY3JlYXRlSG9vaywgcGFja2FnZUpzb25GaWxlc319KSA9PiB7XG4gICAgICAgIGRpciA9IFBhdGgucmVzb2x2ZShkaXIpO1xuICAgICAgICBhY3Rpb25EaXNwYXRjaGVyLl9zZXRDdXJyZW50V29ya3NwYWNlKGRpcik7XG4gICAgICAgIG1heWJlQ29weVRlbXBsYXRlKFBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi90ZW1wbGF0ZXMvYXBwLXRlbXBsYXRlLmpzJyksIFBhdGgucmVzb2x2ZShkaXIsICdhcHAuanMnKSk7XG4gICAgICAgIGNoZWNrQWxsV29ya3NwYWNlcygpO1xuICAgICAgICBpZiAoaXNGb3JjZSkge1xuICAgICAgICAgIC8vIENoYW5pbmcgaW5zdGFsbEpzb25TdHIgdG8gZm9yY2UgYWN0aW9uIF9pbnN0YWxsV29ya3NwYWNlIGJlaW5nIGRpc3BhdGNoZWQgbGF0ZXJcbiAgICAgICAgICBjb25zdCB3c0tleSA9IHdvcmtzcGFjZUtleShkaXIpO1xuICAgICAgICAgIGlmIChnZXRTdGF0ZSgpLndvcmtzcGFjZXMuaGFzKHdzS2V5KSkge1xuICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5fY2hhbmdlKGQgPT4ge1xuICAgICAgICAgICAgICAvLyBjbGVhbiB0byB0cmlnZ2VyIGluc3RhbGwgYWN0aW9uXG4gICAgICAgICAgICAgIGNvbnN0IHdzID0gZC53b3Jrc3BhY2VzLmdldCh3c0tleSkhO1xuICAgICAgICAgICAgICB3cy5pbnN0YWxsSnNvblN0ciA9ICcnO1xuICAgICAgICAgICAgICB3cy5pbnN0YWxsSnNvbi5kZXBlbmRlbmNpZXMgPSB7fTtcbiAgICAgICAgICAgICAgd3MuaW5zdGFsbEpzb24uZGV2RGVwZW5kZW5jaWVzID0ge307XG4gICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICAgICAgICBsb2cuZGVidWcoJ2ZvcmNlIG5wbSBpbnN0YWxsIGluJywgd3NLZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGNhbGwgaW5pdFJvb3REaXJlY3RvcnkoKSBhbmQgd2FpdCBmb3IgaXQgZmluaXNoZWQgYnkgb2JzZXJ2aW5nIGFjdGlvbiAnX3N5bmNMaW5rZWRQYWNrYWdlcycsXG4gICAgICAgIC8vIHRoZW4gY2FsbCBfaG9pc3RXb3Jrc3BhY2VEZXBzXG4gICAgICAgIHJldHVybiBtZXJnZShcbiAgICAgICAgICBwYWNrYWdlSnNvbkZpbGVzICE9IG51bGwgPyBzY2FuQW5kU3luY1BhY2thZ2VzKHBhY2thZ2VKc29uRmlsZXMpOlxuICAgICAgICAgICAgZGVmZXIoKCkgPT4gb2YoaW5pdFJvb3REaXJlY3RvcnkoY3JlYXRlSG9vaykpKSxcbiAgICAgICAgICBhY3Rpb24kLnBpcGUoXG4gICAgICAgICAgICBvZlBheWxvYWRBY3Rpb24oc2xpY2UuYWN0aW9ucy5fc3luY0xpbmtlZFBhY2thZ2VzKSxcbiAgICAgICAgICAgIHRha2UoMSksXG4gICAgICAgICAgICBtYXAoKCkgPT4gYWN0aW9uRGlzcGF0Y2hlci5faG9pc3RXb3Jrc3BhY2VEZXBzKHtkaXJ9KSlcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9KSxcbiAgICAgIGlnbm9yZUVsZW1lbnRzKClcbiAgICApLFxuICAgIGFjdGlvbiQucGlwZShvZlBheWxvYWRBY3Rpb24oc2xpY2UuYWN0aW9ucy5zY2FuQW5kU3luY1BhY2thZ2VzKSxcbiAgICAgIGNvbmNhdE1hcCgoe3BheWxvYWR9KSA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZShcbiAgICAgICAgICBzY2FuQW5kU3luY1BhY2thZ2VzKHBheWxvYWQucGFja2FnZUpzb25GaWxlcyksXG4gICAgICAgICAgYWN0aW9uJC5waXBlKFxuICAgICAgICAgICAgb2ZQYXlsb2FkQWN0aW9uKHNsaWNlLmFjdGlvbnMuX3N5bmNMaW5rZWRQYWNrYWdlcyksXG4gICAgICAgICAgICB0YWtlKDEpLFxuICAgICAgICAgICAgdGFwKCgpID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgY3VycldzID0gZ2V0U3RhdGUoKS5jdXJyV29ya3NwYWNlO1xuICAgICAgICAgICAgICBmb3IgKGNvbnN0IHdzS2V5IG9mIGdldFN0YXRlKCkud29ya3NwYWNlcy5rZXlzKCkpIHtcbiAgICAgICAgICAgICAgICBpZiAod3NLZXkgIT09IGN1cnJXcylcbiAgICAgICAgICAgICAgICAgIGFjdGlvbkRpc3BhdGNoZXIuX2hvaXN0V29ya3NwYWNlRGVwcyh7ZGlyOiBQYXRoLnJlc29sdmUocm9vdERpciwgd3NLZXkpfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGN1cnJXcyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIFwiY3VycmVudCB3b3Jrc3BhY2VcIiBpcyB0aGUgbGFzdCBvbmUgYmVpbmcgdXBkYXRlZCwgc28gdGhhdCBpdCByZW1haW5zIFwiY3VycmVudFwiXG4gICAgICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5faG9pc3RXb3Jrc3BhY2VEZXBzKHtkaXI6IFBhdGgucmVzb2x2ZShyb290RGlyLCBjdXJyV3MpfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgfSlcbiAgICApLFxuXG4gICAgLy8gaW5pdFJvb3REaXJcbiAgICBhY3Rpb24kLnBpcGUob2ZQYXlsb2FkQWN0aW9uKHNsaWNlLmFjdGlvbnMuaW5pdFJvb3REaXIpLFxuICAgICAgbWFwKCh7cGF5bG9hZH0pID0+IHtcbiAgICAgICAgY2hlY2tBbGxXb3Jrc3BhY2VzKCk7XG4gICAgICAgIGlmIChnZXRTdGF0ZSgpLndvcmtzcGFjZXMuaGFzKHdvcmtzcGFjZUtleShwcm9jZXNzLmN3ZCgpKSkpIHtcbiAgICAgICAgICBhY3Rpb25EaXNwYXRjaGVyLnVwZGF0ZVdvcmtzcGFjZSh7ZGlyOiBwcm9jZXNzLmN3ZCgpLFxuICAgICAgICAgICAgaXNGb3JjZTogcGF5bG9hZC5pc0ZvcmNlLFxuICAgICAgICAgICAgY3JlYXRlSG9vazogcGF5bG9hZC5jcmVhdGVIb29rfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc3QgY3VyciA9IGdldFN0YXRlKCkuY3VycldvcmtzcGFjZTtcbiAgICAgICAgICBpZiAoY3VyciAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZiAoZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmhhcyhjdXJyKSkge1xuICAgICAgICAgICAgICBjb25zdCBwYXRoID0gUGF0aC5yZXNvbHZlKHJvb3REaXIsIGN1cnIpO1xuICAgICAgICAgICAgICBhY3Rpb25EaXNwYXRjaGVyLnVwZGF0ZVdvcmtzcGFjZSh7ZGlyOiBwYXRoLCBpc0ZvcmNlOiBwYXlsb2FkLmlzRm9yY2UsIGNyZWF0ZUhvb2s6IHBheWxvYWQuY3JlYXRlSG9va30pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5fc2V0Q3VycmVudFdvcmtzcGFjZShudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLFxuICAgICAgaWdub3JlRWxlbWVudHMoKVxuICAgICksXG5cbiAgICBhY3Rpb24kLnBpcGUob2ZQYXlsb2FkQWN0aW9uKHNsaWNlLmFjdGlvbnMuX2hvaXN0V29ya3NwYWNlRGVwcyksXG4gICAgICBtYXAoKHtwYXlsb2FkfSkgPT4ge1xuICAgICAgICBjb25zdCB3c0tleSA9IHdvcmtzcGFjZUtleShwYXlsb2FkLmRpcik7XG4gICAgICAgIC8vIGFjdGlvbkRpc3BhdGNoZXIub25Xb3Jrc3BhY2VQYWNrYWdlVXBkYXRlZCh3c0tleSk7XG4gICAgICAgIGRlbGV0ZUR1cGxpY2F0ZWRJbnN0YWxsZWRQa2cod3NLZXkpO1xuICAgICAgICBzZXRJbW1lZGlhdGUoKCkgPT4gYWN0aW9uRGlzcGF0Y2hlci53b3Jrc3BhY2VTdGF0ZVVwZGF0ZWQod3NLZXkpKTtcbiAgICAgIH0pLFxuICAgICAgaWdub3JlRWxlbWVudHMoKVxuICAgICksXG5cbiAgICBhY3Rpb24kLnBpcGUob2ZQYXlsb2FkQWN0aW9uKHNsaWNlLmFjdGlvbnMudXBkYXRlRGlyKSxcbiAgICAgIHRhcCgoKSA9PiBhY3Rpb25EaXNwYXRjaGVyLl91cGRhdGVQbGlua1BhY2thZ2VJbmZvKCkpLFxuICAgICAgY29uY2F0TWFwKCgpID0+IHNjYW5BbmRTeW5jUGFja2FnZXMoKSksXG4gICAgICB0YXAoKCkgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBnZXRTdGF0ZSgpLndvcmtzcGFjZXMua2V5cygpKSB7XG4gICAgICAgICAgdXBkYXRlSW5zdGFsbGVkUGFja2FnZUZvcldvcmtzcGFjZShrZXkpO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICksXG4gICAgLy8gSGFuZGxlIG5ld2x5IGFkZGVkIHdvcmtzcGFjZVxuICAgIGdldFN0b3JlKCkucGlwZShtYXAocyA9PiBzLndvcmtzcGFjZXMpLFxuICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIG1hcCh3cyA9PiB7XG4gICAgICAgIGNvbnN0IGtleXMgPSBBcnJheS5mcm9tKHdzLmtleXMoKSk7XG4gICAgICAgIHJldHVybiBrZXlzO1xuICAgICAgfSksXG4gICAgICBzY2FuPHN0cmluZ1tdPigocHJldiwgY3VycikgPT4ge1xuICAgICAgICBpZiAocHJldi5sZW5ndGggPCBjdXJyLmxlbmd0aCkge1xuICAgICAgICAgIGNvbnN0IG5ld0FkZGVkID0gXy5kaWZmZXJlbmNlKGN1cnIsIHByZXYpO1xuICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgICAgIGxvZy5pbmZvKCdOZXcgd29ya3NwYWNlOiAnLCBuZXdBZGRlZCk7XG4gICAgICAgICAgZm9yIChjb25zdCB3cyBvZiBuZXdBZGRlZCkge1xuICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5faW5zdGFsbFdvcmtzcGFjZSh7d29ya3NwYWNlS2V5OiB3c30pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycjtcbiAgICAgIH0pLFxuICAgICAgaWdub3JlRWxlbWVudHMoKVxuICAgICksXG4gICAgLy8gb2JzZXJ2ZSBhbGwgZXhpc3RpbmcgV29ya3NwYWNlcyBmb3IgZGVwZW5kZW5jeSBob2lzdGluZyByZXN1bHQgXG4gICAgLi4uQXJyYXkuZnJvbShnZXRTdGF0ZSgpLndvcmtzcGFjZXMua2V5cygpKS5tYXAoa2V5ID0+IHtcbiAgICAgIHJldHVybiBnZXRTdG9yZSgpLnBpcGUoXG4gICAgICAgIGZpbHRlcihzID0+IHMud29ya3NwYWNlcy5oYXMoa2V5KSksXG4gICAgICAgIG1hcChzID0+IHMud29ya3NwYWNlcy5nZXQoa2V5KSEpLFxuICAgICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgoczEsIHMyKSA9PiBzMS5pbnN0YWxsSnNvbiA9PT0gczIuaW5zdGFsbEpzb24pLFxuICAgICAgICBzY2FuPFdvcmtzcGFjZVN0YXRlPigob2xkLCBuZXdXcykgPT4ge1xuICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlOiBtYXgtbGluZS1sZW5ndGhcbiAgICAgICAgICBjb25zdCBuZXdEZXBzID0gT2JqZWN0LmVudHJpZXMobmV3V3MuaW5zdGFsbEpzb24uZGVwZW5kZW5jaWVzIHx8IFtdKVxuICAgICAgICAgICAgLmNvbmNhdChPYmplY3QuZW50cmllcyhuZXdXcy5pbnN0YWxsSnNvbi5kZXZEZXBlbmRlbmNpZXMgfHwgW10pKVxuICAgICAgICAgICAgLm1hcChlbnRyeSA9PiBlbnRyeS5qb2luKCc6ICcpKTtcbiAgICAgICAgICBpZiAobmV3RGVwcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIC8vIGZvcmNpbmcgaW5zdGFsbCB3b3Jrc3BhY2UsIHRoZXJlZm9yZSBkZXBlbmRlbmNpZXMgaXMgY2xlYXJlZCBhdCB0aGlzIG1vbWVudFxuICAgICAgICAgICAgcmV0dXJuIG5ld1dzO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBvbGREZXBzID0gT2JqZWN0LmVudHJpZXMob2xkLmluc3RhbGxKc29uLmRlcGVuZGVuY2llcyB8fCBbXSlcbiAgICAgICAgICAgIC5jb25jYXQoT2JqZWN0LmVudHJpZXMob2xkLmluc3RhbGxKc29uLmRldkRlcGVuZGVuY2llcyB8fCBbXSkpXG4gICAgICAgICAgICAubWFwKGVudHJ5ID0+IGVudHJ5LmpvaW4oJzogJykpO1xuXG4gICAgICAgICAgaWYgKG5ld0RlcHMubGVuZ3RoICE9PSBvbGREZXBzLmxlbmd0aCkge1xuICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5faW5zdGFsbFdvcmtzcGFjZSh7d29ya3NwYWNlS2V5OiBrZXl9KTtcbiAgICAgICAgICAgIHJldHVybiBuZXdXcztcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3RGVwcy5zb3J0KCk7XG4gICAgICAgICAgb2xkRGVwcy5zb3J0KCk7XG4gICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGwgPSBuZXdEZXBzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5ld0RlcHNbaV0gIT09IG9sZERlcHNbaV0pIHtcbiAgICAgICAgICAgICAgYWN0aW9uRGlzcGF0Y2hlci5faW5zdGFsbFdvcmtzcGFjZSh7d29ya3NwYWNlS2V5OiBrZXl9KTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXdXcztcbiAgICAgICAgfSksXG4gICAgICAgIGlnbm9yZUVsZW1lbnRzKClcbiAgICAgICk7XG4gICAgfSksXG4gICAgYWN0aW9uJC5waXBlKG9mUGF5bG9hZEFjdGlvbihzbGljZS5hY3Rpb25zLl9pbnN0YWxsV29ya3NwYWNlKSxcbiAgICAgIGNvbmNhdE1hcChhY3Rpb24gPT4ge1xuICAgICAgICBjb25zdCB3c0tleSA9IGFjdGlvbi5wYXlsb2FkLndvcmtzcGFjZUtleTtcbiAgICAgICAgcmV0dXJuIGdldFN0b3JlKCkucGlwZShcbiAgICAgICAgICBtYXAocyA9PiBzLndvcmtzcGFjZXMuZ2V0KHdzS2V5KSksXG4gICAgICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgICAgICBmaWx0ZXIod3MgPT4gd3MgIT0gbnVsbCksXG4gICAgICAgICAgdGFrZSgxKSxcbiAgICAgICAgICBjb25jYXRNYXAod3MgPT4gZnJvbShpbnN0YWxsV29ya3NwYWNlKHdzISkpKSxcbiAgICAgICAgICBtYXAoKCkgPT4ge1xuICAgICAgICAgICAgdXBkYXRlSW5zdGFsbGVkUGFja2FnZUZvcldvcmtzcGFjZSh3c0tleSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICAgIH0pLFxuICAgICAgaWdub3JlRWxlbWVudHMoKVxuICAgICksXG4gICAgYWN0aW9uJC5waXBlKG9mUGF5bG9hZEFjdGlvbihzbGljZS5hY3Rpb25zLndvcmtzcGFjZVN0YXRlVXBkYXRlZCksXG4gICAgICBtYXAoYWN0aW9uID0+IHVwZGF0ZWRXb3Jrc3BhY2VTZXQuYWRkKGFjdGlvbi5wYXlsb2FkKSksXG4gICAgICBkZWJvdW5jZVRpbWUoODAwKSxcbiAgICAgIHRhcCgoKSA9PiB7XG4gICAgICAgIGFjdGlvbkRpc3BhdGNoZXIud29ya3NwYWNlQmF0Y2hDaGFuZ2VkKEFycmF5LmZyb20odXBkYXRlZFdvcmtzcGFjZVNldC52YWx1ZXMoKSkpO1xuICAgICAgICB1cGRhdGVkV29ya3NwYWNlU2V0LmNsZWFyKCk7XG4gICAgICAgIC8vIHJldHVybiBmcm9tKHdyaXRlQ29uZmlnRmlsZXMoKSk7XG4gICAgICB9KSxcbiAgICAgIG1hcChhc3luYyAoKSA9PiB7XG4gICAgICAgIGFjdGlvbkRpc3BhdGNoZXIucGFja2FnZXNVcGRhdGVkKCk7XG4gICAgICB9KVxuICAgICksXG4gICAgYWN0aW9uJC5waXBlKG9mUGF5bG9hZEFjdGlvbihzbGljZS5hY3Rpb25zLndvcmtzcGFjZUJhdGNoQ2hhbmdlZCksXG4gICAgICBjb25jYXRNYXAoKHtwYXlsb2FkOiB3c0tleXN9KSA9PiB7XG4gICAgICAgIHJldHVybiBtZXJnZSguLi53c0tleXMubWFwKF9jcmVhdGVTeW1saW5rc0ZvcldvcmtzcGFjZSkpO1xuICAgICAgfSlcbiAgICApLFxuICAgIGdldFN0b3JlKCkucGlwZShtYXAocyA9PiBzLmdpdElnbm9yZXMpLFxuICAgICAgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIG1hcChnaXRJZ25vcmVzID0+IE9iamVjdC5rZXlzKGdpdElnbm9yZXMpLmpvaW4oJywnKSksXG4gICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpLFxuICAgICAgZGVib3VuY2VUaW1lKDUwMCksXG4gICAgICBzd2l0Y2hNYXAoKCkgPT4ge1xuICAgICAgICByZXR1cm4gbWVyZ2UoLi4uT2JqZWN0LmtleXMoZ2V0U3RhdGUoKS5naXRJZ25vcmVzKS5tYXAoZmlsZSA9PiBnZXRTdG9yZSgpLnBpcGUoXG4gICAgICAgICAgbWFwKHMgPT4gcy5naXRJZ25vcmVzW2ZpbGVdKSxcbiAgICAgICAgICBkaXN0aW5jdFVudGlsQ2hhbmdlZCgpLFxuICAgICAgICAgIHNraXAoMSksXG4gICAgICAgICAgbWFwKGxpbmVzID0+IHtcbiAgICAgICAgICAgIGZzLnJlYWRGaWxlKGZpbGUsICd1dGY4JywgKGVyciwgZGF0YSkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHJlYWQgZ2l0aWdub3JlIGZpbGUnLCBmaWxlKTtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdMaW5lcyA9IGRhdGEuc3BsaXQoL1xcblxccj8vKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSk7XG4gICAgICAgICAgICAgIGNvbnN0IG5ld0xpbmVzID0gXy5kaWZmZXJlbmNlKGxpbmVzLCBleGlzdGluZ0xpbmVzKTtcbiAgICAgICAgICAgICAgaWYgKG5ld0xpbmVzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIGZzLndyaXRlRmlsZShmaWxlLCBkYXRhICsgRU9MICsgbmV3TGluZXMuam9pbihFT0wpLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgICAgICAgICAgbG9nLmluZm8oJ01vZGlmeScsIGZpbGUpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICkpKTtcbiAgICAgIH0pLFxuICAgICAgaWdub3JlRWxlbWVudHMoKVxuICAgICksXG4gICAgYWN0aW9uJC5waXBlKG9mUGF5bG9hZEFjdGlvbihzbGljZS5hY3Rpb25zLmFkZFByb2plY3QsIHNsaWNlLmFjdGlvbnMuZGVsZXRlUHJvamVjdCksXG4gICAgICBjb25jYXRNYXAoKCkgPT4gc2NhbkFuZFN5bmNQYWNrYWdlcygpKVxuICAgIClcbiAgKS5waXBlKFxuICAgIGlnbm9yZUVsZW1lbnRzKCksXG4gICAgY2F0Y2hFcnJvcihlcnIgPT4ge1xuICAgICAgbG9nLmVycm9yKGVyci5zdGFjayA/IGVyci5zdGFjayA6IGVycik7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihlcnIpO1xuICAgIH0pXG4gICk7XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YXRlKCkge1xuICByZXR1cm4gc3RhdGVGYWN0b3J5LnNsaWNlU3RhdGUoc2xpY2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3RvcmUoKTogT2JzZXJ2YWJsZTxQYWNrYWdlc1N0YXRlPiB7XG4gIHJldHVybiBzdGF0ZUZhY3Rvcnkuc2xpY2VTdG9yZShzbGljZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXRoVG9Qcm9qS2V5KHBhdGg6IHN0cmluZykge1xuICBjb25zdCByZWxQYXRoID0gUGF0aC5yZWxhdGl2ZShyb290RGlyLCBwYXRoKTtcbiAgcmV0dXJuIHJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSA/IFBhdGgucmVzb2x2ZShwYXRoKSA6IHJlbFBhdGg7XG59XG5leHBvcnQgZnVuY3Rpb24gcHJvaktleVRvUGF0aChrZXk6IHN0cmluZykge1xuICByZXR1cm4gUGF0aC5pc0Fic29sdXRlKGtleSkgPyBrZXkgOiBQYXRoLnJlc29sdmUocm9vdERpciwga2V5KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdvcmtzcGFjZUtleShwYXRoOiBzdHJpbmcpIHtcbiAgbGV0IHJlbCA9IFBhdGgucmVsYXRpdmUocm9vdERpciwgUGF0aC5yZXNvbHZlKHBhdGgpKTtcbiAgaWYgKFBhdGguc2VwID09PSAnXFxcXCcpXG4gICAgcmVsID0gcmVsLnJlcGxhY2UoL1xcXFwvZywgJy8nKTtcbiAgcmV0dXJuIHJlbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdvcmtzcGFjZURpcihrZXk6IHN0cmluZykge1xuICByZXR1cm4gUGF0aC5yZXNvbHZlKHJvb3REaXIsIGtleSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiogZ2V0UGFja2FnZXNPZlByb2plY3RzKHByb2plY3RzOiBzdHJpbmdbXSkge1xuICBmb3IgKGNvbnN0IHByaiBvZiBwcm9qZWN0cykge1xuICAgIGNvbnN0IHBrZ05hbWVzID0gZ2V0U3RhdGUoKS5wcm9qZWN0MlBhY2thZ2VzLmdldChwYXRoVG9Qcm9qS2V5KHByaikpO1xuICAgIGlmIChwa2dOYW1lcykge1xuICAgICAgZm9yIChjb25zdCBwa2dOYW1lIG9mIHBrZ05hbWVzKSB7XG4gICAgICAgIGNvbnN0IHBrID0gZ2V0U3RhdGUoKS5zcmNQYWNrYWdlcy5nZXQocGtnTmFtZSk7XG4gICAgICAgIGlmIChwaylcbiAgICAgICAgICB5aWVsZCBwaztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2plY3RMaXN0KCkge1xuICByZXR1cm4gQXJyYXkuZnJvbShnZXRTdGF0ZSgpLnByb2plY3QyUGFja2FnZXMua2V5cygpKS5tYXAocGogPT4gUGF0aC5yZXNvbHZlKHJvb3REaXIsIHBqKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0N3ZFdvcmtzcGFjZSgpIHtcbiAgY29uc3Qgd3NLZXkgPSB3b3Jrc3BhY2VLZXkocHJvY2Vzcy5jd2QoKSk7XG4gIGNvbnN0IHdzID0gZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmdldCh3c0tleSk7XG4gIGlmICh3cyA9PSBudWxsKVxuICAgIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogVGhpcyBtZXRob2QgaXMgbWVhbnQgdG8gdHJpZ2dlciBlZGl0b3ItaGVscGVyIHRvIHVwZGF0ZSB0c2NvbmZpZyBmaWxlcywgc29cbiAqIGVkaXRvci1oZWxwZXIgbXVzdCBiZSBpbXBvcnQgYXQgZmlyc3RcbiAqIEBwYXJhbSBkaXIgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzd2l0Y2hDdXJyZW50V29ya3NwYWNlKGRpcjogc3RyaW5nKSB7XG4gIGFjdGlvbkRpc3BhdGNoZXIuX3NldEN1cnJlbnRXb3Jrc3BhY2UoZGlyKTtcbiAgYWN0aW9uRGlzcGF0Y2hlci53b3Jrc3BhY2VCYXRjaENoYW5nZWQoW3dvcmtzcGFjZUtleShkaXIpXSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUluc3RhbGxlZFBhY2thZ2VGb3JXb3Jrc3BhY2Uod3NLZXk6IHN0cmluZykge1xuICBjb25zdCBwa2dFbnRyeSA9IHNjYW5JbnN0YWxsZWRQYWNrYWdlNFdvcmtzcGFjZShnZXRTdGF0ZSgpLCB3c0tleSk7XG5cbiAgY29uc3QgaW5zdGFsbGVkID0gbmV3IE1hcCgoZnVuY3Rpb24qKCk6IEdlbmVyYXRvcjxbc3RyaW5nLCBQYWNrYWdlSW5mb10+IHtcbiAgICBmb3IgKGNvbnN0IHBrIG9mIHBrZ0VudHJ5KSB7XG4gICAgICB5aWVsZCBbcGsubmFtZSwgcGtdO1xuICAgIH1cbiAgfSkoKSk7XG4gIGFjdGlvbkRpc3BhdGNoZXIuX2NoYW5nZShkID0+IGQud29ya3NwYWNlcy5nZXQod3NLZXkpIS5pbnN0YWxsZWRDb21wb25lbnRzID0gaW5zdGFsbGVkKTtcbiAgYWN0aW9uRGlzcGF0Y2hlci53b3Jrc3BhY2VTdGF0ZVVwZGF0ZWQod3NLZXkpO1xufVxuXG4vKipcbiAqIERlbGV0ZSB3b3Jrc3BhY2Ugc3RhdGUgaWYgaXRzIGRpcmVjdG9yeSBkb2VzIG5vdCBleGlzdFxuICovXG5mdW5jdGlvbiBjaGVja0FsbFdvcmtzcGFjZXMoKSB7XG4gIGZvciAoY29uc3Qga2V5IG9mIGdldFN0YXRlKCkud29ya3NwYWNlcy5rZXlzKCkpIHtcbiAgICBjb25zdCBkaXIgPSBQYXRoLnJlc29sdmUocm9vdERpciwga2V5KTtcbiAgICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICBsb2cuaW5mbyhgV29ya3NwYWNlICR7a2V5fSBkb2VzIG5vdCBleGlzdCBhbnltb3JlLmApO1xuICAgICAgYWN0aW9uRGlzcGF0Y2hlci5fY2hhbmdlKGQgPT4gZC53b3Jrc3BhY2VzLmRlbGV0ZShrZXkpKTtcbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdFJvb3REaXJlY3RvcnkoY3JlYXRlSG9vayA9IGZhbHNlKSB7XG4gIGxvZy5kZWJ1ZygnaW5pdFJvb3REaXJlY3RvcnknKTtcbiAgY29uc3Qgcm9vdFBhdGggPSByb290RGlyO1xuICBmc2V4dC5ta2RpcnBTeW5jKGRpc3REaXIpO1xuICAvLyBtYXliZUNvcHlUZW1wbGF0ZShQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vdGVtcGxhdGVzL2NvbmZpZy5sb2NhbC10ZW1wbGF0ZS55YW1sJyksIFBhdGguam9pbihkaXN0RGlyLCAnY29uZmlnLmxvY2FsLnlhbWwnKSk7XG4gIG1heWJlQ29weVRlbXBsYXRlKFBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi90ZW1wbGF0ZXMvbG9nNGpzLmpzJyksIHJvb3RQYXRoICsgJy9sb2c0anMuanMnKTtcbiAgbWF5YmVDb3B5VGVtcGxhdGUoUGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3RlbXBsYXRlcycsXG4gICAgICAnZ2l0aWdub3JlLnR4dCcpLCByb290RGlyICsgJy8uZ2l0aWdub3JlJyk7XG4gIGF3YWl0IGNsZWFuSW52YWxpZFN5bWxpbmtzKCk7XG5cbiAgY29uc3QgcHJvamVjdERpcnMgPSBnZXRQcm9qZWN0TGlzdCgpO1xuXG4gIGlmIChjcmVhdGVIb29rKSB7XG4gICAgcHJvamVjdERpcnMuZm9yRWFjaChwcmpkaXIgPT4ge1xuICAgICAgX3dyaXRlR2l0SG9vayhwcmpkaXIpO1xuICAgICAgbWF5YmVDb3B5VGVtcGxhdGUoUGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3RzbGludC5qc29uJyksIHByamRpciArICcvdHNsaW50Lmpzb24nKTtcbiAgICB9KTtcbiAgfVxuXG4gIGF3YWl0IHNjYW5BbmRTeW5jUGFja2FnZXMoKTtcbiAgLy8gYXdhaXQgX2RlbGV0ZVVzZWxlc3NTeW1saW5rKFBhdGgucmVzb2x2ZShyb290RGlyLCAnbm9kZV9tb2R1bGVzJyksIG5ldyBTZXQ8c3RyaW5nPigpKTtcbn1cblxuLy8gYXN5bmMgZnVuY3Rpb24gd3JpdGVDb25maWdGaWxlcygpIHtcbi8vICAgcmV0dXJuIChhd2FpdCBpbXBvcnQoJy4uL2NtZC9jb25maWctc2V0dXAnKSkuYWRkdXBDb25maWdzKChmaWxlLCBjb25maWdDb250ZW50KSA9PiB7XG4vLyAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4vLyAgICAgbG9nLmluZm8oJ3dyaXRlIGNvbmZpZyBmaWxlOicsIGZpbGUpO1xuLy8gICAgIHdyaXRlRmlsZShQYXRoLmpvaW4oZGlzdERpciwgZmlsZSksXG4vLyAgICAgICAnXFxuIyBETyBOT1QgTU9ESUZJWSBUSElTIEZJTEUhXFxuJyArIGNvbmZpZ0NvbnRlbnQpO1xuLy8gICB9KTtcbi8vIH1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFdvcmtzcGFjZSh3czogV29ya3NwYWNlU3RhdGUpIHtcbiAgY29uc3QgZGlyID0gUGF0aC5yZXNvbHZlKHJvb3REaXIsIHdzLmlkKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBpbnN0YWxsSW5EaXIoZGlyLCB3cy5vcmlnaW5JbnN0YWxsSnNvblN0ciwgd3MuaW5zdGFsbEpzb25TdHIpO1xuICB9IGNhdGNoIChleCkge1xuICAgIGFjdGlvbkRpc3BhdGNoZXIuX2NoYW5nZShkID0+IHtcbiAgICAgIGNvbnN0IHdzZCA9IGQud29ya3NwYWNlcy5nZXQod3MuaWQpITtcbiAgICAgIHdzZC5pbnN0YWxsSnNvblN0ciA9ICcnO1xuICAgICAgd3NkLmluc3RhbGxKc29uLmRlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgd3NkLmluc3RhbGxKc29uLmRldkRlcGVuZGVuY2llcyA9IHt9O1xuICAgICAgY29uc3QgbG9ja0ZpbGUgPSBQYXRoLnJlc29sdmUoZGlyLCAncGFja2FnZS1sb2NrLmpzb24nKTtcbiAgICAgIGlmIChmcy5leGlzdHNTeW5jKGxvY2tGaWxlKSkge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgbG9nLmluZm8oYFByb2JsZW1hdGljICR7bG9ja0ZpbGV9IGlzIGRlbGV0ZWQsIHBsZWFzZSB0cnkgYWdhaW5gKTtcbiAgICAgICAgZnMudW5saW5rU3luYyhsb2NrRmlsZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhyb3cgZXg7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxJbkRpcihkaXI6IHN0cmluZywgb3JpZ2luUGtnSnNvblN0cjogc3RyaW5nLCB0b0luc3RhbGxQa2dKc29uU3RyOiBzdHJpbmcpIHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gIGxvZy5pbmZvKCdJbnN0YWxsIGRlcGVuZGVuY2llcyBpbiAnICsgZGlyKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBjb3B5TnBtcmNUb1dvcmtzcGFjZShkaXIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfVxuICBjb25zdCBzeW1saW5rc0luTW9kdWxlRGlyID0gW10gYXMge2NvbnRlbnQ6IHN0cmluZywgbGluazogc3RyaW5nfVtdO1xuXG4gIGNvbnN0IHRhcmdldCA9IFBhdGgucmVzb2x2ZShkaXIsICdub2RlX21vZHVsZXMnKTtcbiAgaWYgKCFmcy5leGlzdHNTeW5jKHRhcmdldCkpIHtcbiAgICBmc2V4dC5ta2RpcnBTeW5jKHRhcmdldCk7XG4gIH1cblxuICAvLyAxLiBUZW1vcHJhcmlseSByZW1vdmUgYWxsIHN5bWxpbmtzIHVuZGVyIGBub2RlX21vZHVsZXMvYCBhbmQgYG5vZGVfbW9kdWxlcy9AKi9gXG4gIC8vIGJhY2t1cCB0aGVtIGZvciBsYXRlIHJlY292ZXJ5XG4gIGF3YWl0IGxpc3RNb2R1bGVTeW1saW5rcyh0YXJnZXQsIGxpbmsgPT4ge1xuICAgIGNvbnN0IGxpbmtDb250ZW50ID0gZnMucmVhZGxpbmtTeW5jKGxpbmspO1xuICAgIHN5bWxpbmtzSW5Nb2R1bGVEaXIucHVzaCh7Y29udGVudDogbGlua0NvbnRlbnQsIGxpbmt9KTtcbiAgICByZXR1cm4gdW5saW5rQXN5bmMobGluayk7XG4gIH0pO1xuICAvLyAyLiBSdW4gYG5wbSBpbnN0YWxsYFxuICBjb25zdCBpbnN0YWxsSnNvbkZpbGUgPSBQYXRoLnJlc29sdmUoZGlyLCAncGFja2FnZS5qc29uJyk7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICBsb2cuaW5mbygnd3JpdGUnLCBpbnN0YWxsSnNvbkZpbGUpO1xuICBmcy53cml0ZUZpbGVTeW5jKGluc3RhbGxKc29uRmlsZSwgdG9JbnN0YWxsUGtnSnNvblN0ciwgJ3V0ZjgnKTtcbiAgLy8gc2F2ZSBhIGxvY2sgZmlsZSB0byBpbmRpY2F0ZSBpbi1wcm9jZXNzIG9mIGluc3RhbGxpbmcsIG9uY2UgaW5zdGFsbGF0aW9uIGlzIGNvbXBsZXRlZCB3aXRob3V0IGludGVycnVwdGlvbiwgZGVsZXRlIGl0LlxuICAvLyBjaGVjayBpZiB0aGVyZSBpcyBleGlzdGluZyBsb2NrIGZpbGUsIG1lYW5pbmcgYSBwcmV2aW91cyBpbnN0YWxsYXRpb24gaXMgaW50ZXJydXB0ZWQuXG4gIGNvbnN0IGxvY2tGaWxlID0gUGF0aC5yZXNvbHZlKGRpciwgJ3BsaW5rLmluc3RhbGwubG9jaycpO1xuICBmcy5wcm9taXNlcy53cml0ZUZpbGUobG9ja0ZpbGUsIG9yaWdpblBrZ0pzb25TdHIpO1xuXG4gIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0SW1tZWRpYXRlKHJlc29sdmUpKTtcbiAgLy8gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnYgPSB7Li4ucHJvY2Vzcy5lbnYsIE5PREVfRU5WOiAnZGV2ZWxvcG1lbnQnfSBhcyBOb2RlSlMuUHJvY2Vzc0VudjtcbiAgICBhd2FpdCBleGUoJ25wbScsICdpbnN0YWxsJywge1xuICAgICAgY3dkOiBkaXIsXG4gICAgICBlbnYgLy8gRm9yY2UgZGV2ZWxvcG1lbnQgbW9kZSwgb3RoZXJ3aXNlIFwiZGV2RGVwZW5kZW5jaWVzXCIgd2lsbCBub3QgYmUgaW5zdGFsbGVkXG4gICAgfSkucHJvbWlzZTtcbiAgICBhd2FpdCBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldEltbWVkaWF0ZShyZXNvbHZlKSk7XG4gICAgYXdhaXQgZXhlKCducG0nLCAncHJ1bmUnLCB7Y3dkOiBkaXIsIGVudn0pLnByb21pc2U7XG4gICAgLy8gXCJucG0gZGRwXCIgcmlnaHQgYWZ0ZXIgXCJucG0gaW5zdGFsbFwiIHdpbGwgY2F1c2UgZGV2RGVwZW5kZW5jaWVzIGJlaW5nIHJlbW92ZWQgc29tZWhvdywgZG9uJ3Qga25vd25cbiAgICAvLyB3aHksIEkgaGF2ZSB0byBhZGQgYSBzZXRJbW1lZGlhdGUoKSBiZXR3ZWVuIHRoZW0gdG8gd29ya2Fyb3VuZFxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0SW1tZWRpYXRlKHJlc29sdmUpKTtcbiAgICBhd2FpdCBleGUoJ25wbScsICdkZHAnLCB7Y3dkOiBkaXIsIGVudn0pLnByb21pc2U7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICBsb2cuZXJyb3IoJ0ZhaWxlZCB0byBpbnN0YWxsIGRlcGVuZGVuY2llcycsIGUuc3RhY2spO1xuICAgIHRocm93IGU7XG4gIH0gZmluYWxseSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgbG9nLmluZm8oJ1JlY292ZXIgJyArIGluc3RhbGxKc29uRmlsZSk7XG4gICAgLy8gMy4gUmVjb3ZlciBwYWNrYWdlLmpzb24gYW5kIHN5bWxpbmtzIGRlbGV0ZWQgaW4gU3RlcC4xLlxuICAgIGZzLndyaXRlRmlsZVN5bmMoaW5zdGFsbEpzb25GaWxlLCBvcmlnaW5Qa2dKc29uU3RyLCAndXRmOCcpO1xuICAgIGZzLnByb21pc2VzLnVubGluayhsb2NrRmlsZSk7XG4gICAgYXdhaXQgcmVjb3ZlclN5bWxpbmtzKCk7XG4gIH1cblxuICBmdW5jdGlvbiByZWNvdmVyU3ltbGlua3MoKSB7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHN5bWxpbmtzSW5Nb2R1bGVEaXIubWFwKCh7Y29udGVudCwgbGlua30pID0+IHtcbiAgICAgIHJldHVybiBfc3ltbGlua0FzeW5jKGNvbnRlbnQsIGxpbmssIGlzV2luMzIgPyAnanVuY3Rpb24nIDogJ2RpcicpO1xuICAgIH0pKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBjb3B5TnBtcmNUb1dvcmtzcGFjZSh3b3Jrc3BhY2VEaXI6IHN0cmluZykge1xuICBjb25zdCB0YXJnZXQgPSBQYXRoLnJlc29sdmUod29ya3NwYWNlRGlyLCAnLm5wbXJjJyk7XG4gIGlmIChmcy5leGlzdHNTeW5jKHRhcmdldCkpXG4gICAgcmV0dXJuO1xuICBjb25zdCBpc0NoaW5hID0gYXdhaXQgZ2V0U3RvcmUoKS5waXBlKFxuICAgIG1hcChzID0+IHMuaXNJbkNoaW5hKSwgZGlzdGluY3RVbnRpbENoYW5nZWQoKSxcbiAgICAgIGZpbHRlcihjbiA9PiBjbiAhPSBudWxsKSxcbiAgICAgIHRha2UoMSlcbiAgICApLnRvUHJvbWlzZSgpO1xuXG4gIGlmIChpc0NoaW5hKSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgbG9nLmluZm8oJ2NyZWF0ZSAubnBtcmMgdG8nLCB0YXJnZXQpO1xuICAgIGZzLmNvcHlGaWxlU3luYyhQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vdGVtcGxhdGVzL25wbXJjLWZvci1jbi50eHQnKSwgdGFyZ2V0KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzY2FuQW5kU3luY1BhY2thZ2VzKGluY2x1ZGVQYWNrYWdlSnNvbkZpbGVzPzogc3RyaW5nW10pIHtcbiAgY29uc3QgcHJvalBrZ01hcDogTWFwPHN0cmluZywgUGFja2FnZUluZm9bXT4gPSBuZXcgTWFwKCk7XG4gIGxldCBwa2dMaXN0OiBQYWNrYWdlSW5mb1tdO1xuXG4gIGlmIChpbmNsdWRlUGFja2FnZUpzb25GaWxlcykge1xuICAgIGNvbnN0IHByaktleXMgPSBBcnJheS5mcm9tKGdldFN0YXRlKCkucHJvamVjdDJQYWNrYWdlcy5rZXlzKCkpO1xuICAgIGNvbnN0IHByakRpcnMgPSBBcnJheS5mcm9tKGdldFN0YXRlKCkucHJvamVjdDJQYWNrYWdlcy5rZXlzKCkpLm1hcChwcmpLZXkgPT4gcHJvaktleVRvUGF0aChwcmpLZXkpKTtcbiAgICBwa2dMaXN0ID0gaW5jbHVkZVBhY2thZ2VKc29uRmlsZXMubWFwKGpzb25GaWxlID0+IHtcbiAgICAgIGNvbnN0IGluZm8gPSBjcmVhdGVQYWNrYWdlSW5mbyhqc29uRmlsZSwgZmFsc2UpO1xuICAgICAgY29uc3QgcHJqSWR4ID0gcHJqRGlycy5maW5kSW5kZXgoZGlyID0+IGluZm8ucmVhbFBhdGguc3RhcnRzV2l0aChkaXIgKyBQYXRoLnNlcCkpO1xuICAgICAgaWYgKHByaklkeCA8IDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke2pzb25GaWxlfSBpcyBub3QgdW5kZXIgYW55IGtub3duIFByb2plY3QgZGlyZWN0b3J5czogJHtwcmpEaXJzLmpvaW4oJywgJyl9YCk7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmpQYWNrYWdlTmFtZXMgPSBnZXRTdGF0ZSgpLnByb2plY3QyUGFja2FnZXMuZ2V0KHByaktleXNbcHJqSWR4XSkhO1xuICAgICAgaWYgKCFwcmpQYWNrYWdlTmFtZXMuaW5jbHVkZXMoaW5mby5uYW1lKSkge1xuICAgICAgICBhY3Rpb25EaXNwYXRjaGVyLl9hc3NvY2lhdGVQYWNrYWdlVG9Qcmooe1xuICAgICAgICAgIHByajogcHJqS2V5c1twcmpJZHhdLFxuICAgICAgICAgIHBrZ3M6IFsuLi5wcmpQYWNrYWdlTmFtZXMubWFwKG5hbWUgPT4gKHtuYW1lfSkpLCBpbmZvXVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmZvO1xuICAgIH0pO1xuICAgIGFjdGlvbkRpc3BhdGNoZXIuX3N5bmNMaW5rZWRQYWNrYWdlcyhbcGtnTGlzdCwgJ3VwZGF0ZSddKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBybSA9IChhd2FpdCBpbXBvcnQoJy4uL3JlY2lwZS1tYW5hZ2VyJykpO1xuICAgIHBrZ0xpc3QgPSBbXTtcbiAgICBhd2FpdCBybS5zY2FuUGFja2FnZXMoKS5waXBlKFxuICAgICAgdGFwKChbcHJvaiwganNvbkZpbGVdKSA9PiB7XG4gICAgICAgIGlmICghcHJvalBrZ01hcC5oYXMocHJvaikpXG4gICAgICAgICAgcHJvalBrZ01hcC5zZXQocHJvaiwgW10pO1xuICAgICAgICBjb25zdCBpbmZvID0gY3JlYXRlUGFja2FnZUluZm8oanNvbkZpbGUsIGZhbHNlKTtcbiAgICAgICAgaWYgKGluZm8uanNvbi5kciB8fCBpbmZvLmpzb24ucGxpbmspIHtcbiAgICAgICAgICBwa2dMaXN0LnB1c2goaW5mbyk7XG4gICAgICAgICAgcHJvalBrZ01hcC5nZXQocHJvaikhLnB1c2goaW5mbyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbG9nLmRlYnVnKGBQYWNrYWdlIG9mICR7anNvbkZpbGV9IGlzIHNraXBwZWQgKGR1ZSB0byBubyBcImRyXCIgb3IgXCJwbGlua1wiIHByb3BlcnR5KWApO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICkudG9Qcm9taXNlKCk7XG4gICAgZm9yIChjb25zdCBbcHJqLCBwa2dzXSBvZiBwcm9qUGtnTWFwLmVudHJpZXMoKSkge1xuICAgICAgYWN0aW9uRGlzcGF0Y2hlci5fYXNzb2NpYXRlUGFja2FnZVRvUHJqKHtwcmosIHBrZ3N9KTtcbiAgICB9XG4gICAgYWN0aW9uRGlzcGF0Y2hlci5fc3luY0xpbmtlZFBhY2thZ2VzKFtwa2dMaXN0LCAnY2xlYW4nXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2NyZWF0ZVN5bWxpbmtzRm9yV29ya3NwYWNlKHdzS2V5OiBzdHJpbmcpIHtcbiAgaWYgKHN5bWxpbmtEaXJOYW1lICE9PSAnLmxpbmtzJyAmJiBmcy5leGlzdHNTeW5jKFBhdGgucmVzb2x2ZShyb290RGlyLCB3c0tleSwgJy5saW5rcycpKSkge1xuICAgIGZzZXh0LnJlbW92ZShQYXRoLnJlc29sdmUocm9vdERpciwgd3NLZXksICcubGlua3MnKSlcbiAgICAuY2F0Y2goZXggPT4gbG9nLmluZm8oZXgpKTtcbiAgfVxuICBjb25zdCBzeW1saW5rRGlyID0gUGF0aC5yZXNvbHZlKHJvb3REaXIsIHdzS2V5LCBzeW1saW5rRGlyTmFtZSB8fCAnbm9kZV9tb2R1bGVzJyk7XG4gIGZzZXh0Lm1rZGlycFN5bmMoc3ltbGlua0Rpcik7XG4gIGNvbnN0IHdzID0gZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmdldCh3c0tleSkhO1xuXG4gIGNvbnN0IHBrZ05hbWVzID0gd3MubGlua2VkRGVwZW5kZW5jaWVzLm1hcChpdGVtID0+IGl0ZW1bMF0pXG4gIC5jb25jYXQod3MubGlua2VkRGV2RGVwZW5kZW5jaWVzLm1hcChpdGVtID0+IGl0ZW1bMF0pKTtcblxuICBjb25zdCBwa2dOYW1lU2V0ID0gbmV3IFNldChwa2dOYW1lcyk7XG4gIGlmIChzeW1saW5rRGlyTmFtZSAhPT0gJ25vZGVfbW9kdWxlcycpIHtcbiAgICBpZiAod3MuaW5zdGFsbGVkQ29tcG9uZW50cykge1xuICAgICAgZm9yIChjb25zdCBwbmFtZSBvZiB3cy5pbnN0YWxsZWRDb21wb25lbnRzLmtleXMoKSlcbiAgICAgICAgcGtnTmFtZVNldC5hZGQocG5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzeW1saW5rRGlyTmFtZSAhPT0gJ25vZGVfbW9kdWxlcycpIHtcbiAgICBhY3Rpb25EaXNwYXRjaGVyLnVwZGF0ZUdpdElnbm9yZXMoe1xuICAgICAgZmlsZTogUGF0aC5yZXNvbHZlKHJvb3REaXIsICcuZ2l0aWdub3JlJyksXG4gICAgICBsaW5lczogW1BhdGgucmVsYXRpdmUocm9vdERpciwgc3ltbGlua0RpcikucmVwbGFjZSgvXFxcXC9nLCAnLycpXX0pO1xuICB9XG5cbiAgcmV0dXJuIG1lcmdlKFxuICAgIGZyb20ocGtnTmFtZVNldC52YWx1ZXMoKSkucGlwZShcbiAgICAgIG1hcChuYW1lID0+IGdldFN0YXRlKCkuc3JjUGFja2FnZXMuZ2V0KG5hbWUpIHx8IHdzLmluc3RhbGxlZENvbXBvbmVudHMhLmdldChuYW1lKSEpLFxuICAgICAgc3ltYm9saWNMaW5rUGFja2FnZXMoc3ltbGlua0RpcilcbiAgICApLFxuICAgIF9kZWxldGVVc2VsZXNzU3ltbGluayhzeW1saW5rRGlyLCBwa2dOYW1lU2V0KVxuICApO1xufVxuXG5hc3luYyBmdW5jdGlvbiBfZGVsZXRlVXNlbGVzc1N5bWxpbmsoY2hlY2tEaXI6IHN0cmluZywgZXhjbHVkZVNldDogU2V0PHN0cmluZz4pIHtcbiAgY29uc3QgZG9uZXM6IFByb21pc2U8dm9pZD5bXSA9IFtdO1xuICBjb25zdCBkcmNwTmFtZSA9IGdldFN0YXRlKCkubGlua2VkRHJjcCA/IGdldFN0YXRlKCkubGlua2VkRHJjcCEubmFtZSA6IG51bGw7XG4gIGNvbnN0IGRvbmUxID0gbGlzdE1vZHVsZVN5bWxpbmtzKGNoZWNrRGlyLCBhc3luYyBsaW5rID0+IHtcbiAgICBjb25zdCBwa2dOYW1lID0gUGF0aC5yZWxhdGl2ZShjaGVja0RpciwgbGluaykucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIGlmICggZHJjcE5hbWUgIT09IHBrZ05hbWUgJiYgIWV4Y2x1ZGVTZXQuaGFzKHBrZ05hbWUpKSB7XG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgIGxvZy5pbmZvKGBEZWxldGUgZXh0cmFuZW91cyBzeW1saW5rOiAke2xpbmt9YCk7XG4gICAgICBkb25lcy5wdXNoKGZzLnByb21pc2VzLnVubGluayhsaW5rKSk7XG4gICAgfVxuICB9KTtcbiAgYXdhaXQgZG9uZTE7XG4gIGF3YWl0IFByb21pc2UuYWxsKGRvbmVzKTtcbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSBwa0pzb25GaWxlIHBhY2thZ2UuanNvbiBmaWxlIHBhdGhcbiAqIEBwYXJhbSBpc0luc3RhbGxlZCBcbiAqIEBwYXJhbSBzeW1MaW5rIHN5bWxpbmsgcGF0aCBvZiBwYWNrYWdlXG4gKiBAcGFyYW0gcmVhbFBhdGggcmVhbCBwYXRoIG9mIHBhY2thZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhY2thZ2VJbmZvKHBrSnNvbkZpbGU6IHN0cmluZywgaXNJbnN0YWxsZWQgPSBmYWxzZSk6IFBhY2thZ2VJbmZvIHtcbiAgY29uc3QganNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHBrSnNvbkZpbGUsICd1dGY4JykpO1xuICByZXR1cm4gY3JlYXRlUGFja2FnZUluZm9XaXRoSnNvbihwa0pzb25GaWxlLCBqc29uLCBpc0luc3RhbGxlZCk7XG59XG4vKipcbiAqIExpc3QgdGhvc2UgaW5zdGFsbGVkIHBhY2thZ2VzIHdoaWNoIGFyZSByZWZlcmVuY2VkIGJ5IHdvcmtzcGFjZSBwYWNrYWdlLmpzb24gZmlsZSxcbiAqIHRob3NlIHBhY2thZ2VzIG11c3QgaGF2ZSBcImRyXCIgcHJvcGVydHkgaW4gcGFja2FnZS5qc29uIFxuICogQHBhcmFtIHdvcmtzcGFjZUtleSBcbiAqL1xuZnVuY3Rpb24qIHNjYW5JbnN0YWxsZWRQYWNrYWdlNFdvcmtzcGFjZShzdGF0ZTogUGFja2FnZXNTdGF0ZSwgd29ya3NwYWNlS2V5OiBzdHJpbmcpIHtcbiAgY29uc3Qgb3JpZ2luSW5zdGFsbEpzb24gPSBzdGF0ZS53b3Jrc3BhY2VzLmdldCh3b3Jrc3BhY2VLZXkpIS5vcmlnaW5JbnN0YWxsSnNvbjtcbiAgLy8gY29uc3QgZGVwSnNvbiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSAncHJvZHVjdGlvbicgPyBbb3JpZ2luSW5zdGFsbEpzb24uZGVwZW5kZW5jaWVzXSA6XG4gIC8vICAgW29yaWdpbkluc3RhbGxKc29uLmRlcGVuZGVuY2llcywgb3JpZ2luSW5zdGFsbEpzb24uZGV2RGVwZW5kZW5jaWVzXTtcbiAgZm9yIChjb25zdCBkZXBzIG9mIFtvcmlnaW5JbnN0YWxsSnNvbi5kZXBlbmRlbmNpZXMsIG9yaWdpbkluc3RhbGxKc29uLmRldkRlcGVuZGVuY2llc10pIHtcbiAgICBpZiAoZGVwcyA9PSBudWxsKVxuICAgICAgY29udGludWU7XG4gICAgZm9yIChjb25zdCBkZXAgb2YgT2JqZWN0LmtleXMoZGVwcykpIHtcbiAgICAgIGlmICghc3RhdGUuc3JjUGFja2FnZXMuaGFzKGRlcCkgJiYgZGVwICE9PSAnQHdmaC9wbGluaycpIHtcbiAgICAgICAgY29uc3QgcGtqc29uRmlsZSA9IFBhdGgucmVzb2x2ZShyb290RGlyLCB3b3Jrc3BhY2VLZXksICdub2RlX21vZHVsZXMnLCBkZXAsICdwYWNrYWdlLmpzb24nKTtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocGtqc29uRmlsZSkpIHtcbiAgICAgICAgICBjb25zdCBwayA9IGNyZWF0ZVBhY2thZ2VJbmZvKFxuICAgICAgICAgICAgUGF0aC5yZXNvbHZlKHJvb3REaXIsIHdvcmtzcGFjZUtleSwgJ25vZGVfbW9kdWxlcycsIGRlcCwgJ3BhY2thZ2UuanNvbicpLCB0cnVlXG4gICAgICAgICAgKTtcbiAgICAgICAgICBpZiAocGsuanNvbi5kciB8fCBway5qc29uLnBsaW5rKSB7XG4gICAgICAgICAgICB5aWVsZCBwaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBcbiAqIEBwYXJhbSBwa0pzb25GaWxlIHBhY2thZ2UuanNvbiBmaWxlIHBhdGhcbiAqIEBwYXJhbSBpc0luc3RhbGxlZCBcbiAqIEBwYXJhbSBzeW1MaW5rIHN5bWxpbmsgcGF0aCBvZiBwYWNrYWdlXG4gKiBAcGFyYW0gcmVhbFBhdGggcmVhbCBwYXRoIG9mIHBhY2thZ2VcbiAqL1xuZnVuY3Rpb24gY3JlYXRlUGFja2FnZUluZm9XaXRoSnNvbihwa0pzb25GaWxlOiBzdHJpbmcsIGpzb246IGFueSwgaXNJbnN0YWxsZWQgPSBmYWxzZSxcbiAgc3ltTGlua1BhcmVudERpcj86IHN0cmluZyk6IFBhY2thZ2VJbmZvIHtcbiAgY29uc3QgbSA9IG1vZHVsZU5hbWVSZWcuZXhlYyhqc29uLm5hbWUpO1xuICBjb25zdCBwa0luZm86IFBhY2thZ2VJbmZvID0ge1xuICAgIHNob3J0TmFtZTogbSFbMl0sXG4gICAgbmFtZToganNvbi5uYW1lLFxuICAgIHNjb3BlOiBtIVsxXSxcbiAgICBwYXRoOiBzeW1MaW5rUGFyZW50RGlyID8gUGF0aC5yZXNvbHZlKHN5bUxpbmtQYXJlbnREaXIsIGpzb24ubmFtZSkgOiBQYXRoLmRpcm5hbWUocGtKc29uRmlsZSksXG4gICAganNvbixcbiAgICByZWFsUGF0aDogZnMucmVhbHBhdGhTeW5jKFBhdGguZGlybmFtZShwa0pzb25GaWxlKSksXG4gICAgaXNJbnN0YWxsZWRcbiAgfTtcbiAgcmV0dXJuIHBrSW5mbztcbn1cblxuZnVuY3Rpb24gY3AoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKSB7XG4gIGlmIChfLnN0YXJ0c1dpdGgoZnJvbSwgJy0nKSkge1xuICAgIGZyb20gPSBhcmd1bWVudHNbMV07XG4gICAgdG8gPSBhcmd1bWVudHNbMl07XG4gIH1cbiAgZnNleHQuY29weVN5bmMoZnJvbSwgdG8pO1xuICAvLyBzaGVsbC5jcCguLi5hcmd1bWVudHMpO1xuICBpZiAoL1svXFxcXF0kLy50ZXN0KHRvKSlcbiAgICB0byA9IFBhdGguYmFzZW5hbWUoZnJvbSk7IC8vIHRvIGlzIGEgZm9sZGVyXG4gIGVsc2VcbiAgICB0byA9IFBhdGgucmVsYXRpdmUocHJvY2Vzcy5jd2QoKSwgdG8pO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgbG9nLmluZm8oJ0NvcHkgdG8gJXMnLCBjaGFsay5jeWFuKHRvKSk7XG59XG5cbi8qKlxuICogXG4gKiBAcGFyYW0gZnJvbSBhYnNvbHV0ZSBwYXRoXG4gKiBAcGFyYW0ge3N0cmluZ30gdG8gcmVsYXRpdmUgdG8gcm9vdFBhdGggXG4gKi9cbmZ1bmN0aW9uIG1heWJlQ29weVRlbXBsYXRlKGZyb206IHN0cmluZywgdG86IHN0cmluZykge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoUGF0aC5yZXNvbHZlKHJvb3REaXIsIHRvKSkpXG4gICAgY3AoUGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgZnJvbSksIHRvKTtcbn1cblxuZnVuY3Rpb24gX3dyaXRlR2l0SG9vayhwcm9qZWN0OiBzdHJpbmcpIHtcbiAgLy8gaWYgKCFpc1dpbjMyKSB7XG4gIGNvbnN0IGdpdFBhdGggPSBQYXRoLnJlc29sdmUocHJvamVjdCwgJy5naXQvaG9va3MnKTtcbiAgaWYgKGZzLmV4aXN0c1N5bmMoZ2l0UGF0aCkpIHtcbiAgICBjb25zdCBob29rU3RyID0gJyMhL2Jpbi9zaFxcbicgK1xuICAgICAgYGNkIFwiJHtyb290RGlyfVwiXFxuYCArXG4gICAgICAvLyAnZHJjcCBpbml0XFxuJyArXG4gICAgICAvLyAnbnB4IHByZXR0eS1xdWljayAtLXN0YWdlZFxcbicgKyAvLyBVc2UgYHRzbGludCAtLWZpeGAgaW5zdGVhZC5cbiAgICAgIGBwbGluayBsaW50IC0tcGogXCIke3Byb2plY3QucmVwbGFjZSgvWy9cXFxcXSQvLCAnJyl9XCIgLS1maXhcXG5gO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGdpdFBhdGggKyAnL3ByZS1jb21taXQnKSlcbiAgICAgIGZzLnVubGlua1N5bmMoZ2l0UGF0aCArICcvcHJlLWNvbW1pdCcpO1xuICAgIGZzLndyaXRlRmlsZVN5bmMoZ2l0UGF0aCArICcvcHJlLXB1c2gnLCBob29rU3RyKTtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICBsb2cuaW5mbygnV3JpdGUgJyArIGdpdFBhdGggKyAnL3ByZS1wdXNoJyk7XG4gICAgaWYgKCFpc1dpbjMyKSB7XG4gICAgICBzcGF3bignY2htb2QnLCAnLVInLCAnK3gnLCBwcm9qZWN0ICsgJy8uZ2l0L2hvb2tzL3ByZS1wdXNoJyk7XG4gICAgfVxuICB9XG4gIC8vIH1cbn1cblxuZnVuY3Rpb24gZGVsZXRlRHVwbGljYXRlZEluc3RhbGxlZFBrZyh3b3Jrc3BhY2VLZXk6IHN0cmluZykge1xuICBjb25zdCB3c1N0YXRlID0gZ2V0U3RhdGUoKS53b3Jrc3BhY2VzLmdldCh3b3Jrc3BhY2VLZXkpITtcbiAgY29uc3QgZG9Ob3RoaW5nID0gKCkgPT4ge307XG4gIHdzU3RhdGUubGlua2VkRGVwZW5kZW5jaWVzLmNvbmNhdCh3c1N0YXRlLmxpbmtlZERldkRlcGVuZGVuY2llcykubWFwKChbcGtnTmFtZV0pID0+IHtcbiAgICBjb25zdCBkaXIgPSBQYXRoLnJlc29sdmUocm9vdERpciwgd29ya3NwYWNlS2V5LCAnbm9kZV9tb2R1bGVzJywgcGtnTmFtZSk7XG4gICAgcmV0dXJuIGZzLnByb21pc2VzLmxzdGF0KGRpcilcbiAgICAudGhlbigoc3RhdCkgPT4ge1xuICAgICAgaWYgKCFzdGF0LmlzU3ltYm9saWNMaW5rKCkpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgICAgIGxvZy5pbmZvKGBQcmV2aW91cyBpbnN0YWxsZWQgJHtQYXRoLnJlbGF0aXZlKHJvb3REaXIsZGlyKX0gaXMgZGVsZXRlZCwgZHVlIHRvIGxpbmtlZCBwYWNrYWdlICR7cGtnTmFtZX1gKTtcbiAgICAgICAgcmV0dXJuIGZzLnByb21pc2VzLnVubGluayhkaXIpO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKGRvTm90aGluZyk7XG4gIH0pO1xufVxuXG4vLyAvKipcbi8vICAgICogSWYgYSBzb3VyY2UgY29kZSBwYWNrYWdlIHVzZXMgUGxpbmsncyBfX3BsaW5rIEFQSSAoIGxpa2UgYC5sb2dnZXJgKSBvciBleHRlbmRzIFBsaW5rJ3MgY29tbWFuZCBsaW5lLFxuLy8gICAgKiB0aGV5IG5lZWQgZW5zdXJlIHNvbWUgUGxpbmsncyBkZXBlbmRlbmNpZXMgYXJlIGluc3RhbGxlZCBhcyAxc3QgbGV2ZWwgZGVwZW5kZW5jeSBpbiB0aGVpciB3b3Jrc3BhY2UsXG4vLyAgICAqIG90aGVyd2lzZSBWaXN1YWwgQ29kZSBFZGl0b3IgY2FuIG5vdCBmaW5kIGNvcnJlY3QgdHlwZSBkZWZpbml0aW9ucyB3aGlsZSByZWZlcmVuY2luZyBQbGluaydzIGxvZ2dlciBvclxuLy8gICAgKiBDb21tYW5kIGludGVyZmFjZS5cbi8vICAgICogXG4vLyAgICAqIFNvIEkgbmVlZCB0byBtYWtlIHN1cmUgdGhlc2UgZGVwZW5kZW5jaWVzIGFyZSBpbnN0YWxsZWQgaW4gZWFjaCB3b3Jrc3BhY2Vcbi8vICAgICovXG5cbi8vIGZ1bmN0aW9uIHBsaW5rQXBpUmVxdWlyZWREZXBzKCk6IFBhY2thZ2VKc29uSW50ZXJmIHtcbi8vICAgY29uc3QgcGxpbmtKc29uOiBQYWNrYWdlSnNvbkludGVyZiA9IHJlcXVpcmUoJ0B3ZmgvcGxpbmsvcGFja2FnZS5qc29uJyk7XG4vLyAgIGNvbnN0IGZha2VKc29uOiBQYWNrYWdlSnNvbkludGVyZiA9IHtcbi8vICAgICB2ZXJzaW9uOiBwbGlua0pzb24udmVyc2lvbixcbi8vICAgICBuYW1lOiBwbGlua0pzb24ubmFtZSxcbi8vICAgICBkZXBlbmRlbmNpZXM6IHt9XG4vLyAgIH07XG4vLyAgIGZvciAoY29uc3QgZGVwIG9mIFsnY29tbWFuZGVyJywgJ2xvZzRqcyddKSB7XG4vLyAgICAgY29uc3QgdmVyc2lvbiA9IHBsaW5rSnNvbi5kZXBlbmRlbmNpZXMhW2RlcF07XG4vLyAgICAgZmFrZUpzb24uZGVwZW5kZW5jaWVzIVtkZXBdID0gdmVyc2lvbjtcbi8vICAgfVxuLy8gICByZXR1cm4gZmFrZUpzb247XG4vLyB9XG4iXX0=