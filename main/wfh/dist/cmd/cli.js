"use strict";
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.withGlobalOptions = exports.drcpCommand = void 0;
// tslint:disable: max-line-length
const commander_1 = __importDefault(require("commander"));
const chalk_1 = __importDefault(require("chalk"));
const _ = __importStar(require("lodash"));
// import Path from 'path';
const pk = require('../../../package');
// const WIDTH = 130;
const arrayOptionFn = (curr, prev) => {
    if (prev)
        prev.push(curr);
    return prev;
};
function drcpCommand(startTime) {
    return __awaiter(this, void 0, void 0, function* () {
        process.title = 'Plink - command line';
        const { stateFactory } = require('../store');
        yield Promise.resolve().then(() => __importStar(require('./cli-slice')));
        stateFactory.configureStore();
        let cliExtensions;
        const program = new commander_1.default.Command('plink')
            .action(args => {
            program.outputHelp();
            // tslint:disable-next-line: no-console
            console.log('\nversion:', pk.version);
            if (cliExtensions.length > 0) {
                // tslint:disable-next-line: no-console
                console.log(`Found ${cliExtensions.length} command line extension` +
                    `${cliExtensions.length > 1 ? 's' : ''}: ${cliExtensions.join(', ')}`);
            }
        });
        program.version(pk.version, '-v, --vers', 'output the current version');
        subDrcpCommand(program);
        if (process.env.PLINK_SAFE !== 'true')
            cliExtensions = loadExtensionCommand(program);
        try {
            yield program.parseAsync(process.argv);
        }
        catch (e) {
            console.error(chalk_1.default.redBright(e), e.stack);
            process.exit(1);
        }
    });
}
exports.drcpCommand = drcpCommand;
function subDrcpCommand(program) {
    /**
     * command init
     */
    const initCmd = program.command('init [workspace]')
        .description('Initialize workspace directory, generate basic configuration files for project and component packages')
        .option('-f | --force', 'Force run "npm install" in specific workspace directory', false)
        // .option('--yarn', 'Use Yarn to install component peer dependencies instead of using NPM', false)
        .option('--production', 'Add "--production" or "--only=prod" command line argument to "yarn/npm install"', false)
        .action((workspace) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-init')))).default(initCmd.opts(), workspace);
    }));
    withGlobalOptions(initCmd);
    /**
     * command project
     */
    program.command('project [add|remove] [project-dir...]')
        .description('Associate, disassociate or list associated project folders')
        .action((action, projectDir) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-project')))).default(action, projectDir);
    }));
    /**
     * command lint
     */
    const lintCmd = program.command('lint [package...]')
        .description('source code style check')
        .option('--pj <project1,project2...>', 'lint only TS code from specific project', arrayOptionFn, [])
        .option('--fix', 'Run eslint/tslint fix, this could cause your source code being changed unexpectedly', false)
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-lint')))).default(packages, lintCmd.opts());
    }));
    withGlobalOptions(lintCmd);
    lintCmd.usage(lintCmd.usage() +
        hl('\ndrcp lint --pj <project-dir..> [--fix]') + ' Lint TS files from specific project directory\n' +
        hl('\ndrcp lint <component-package..> [--fix]') + ' Lint TS files from specific component packages');
    /**
     * command clean
     */
    program.command('clean [symlink]').description('Clean whole "dist" directory or only symbolic links from node_modules')
        .action((symlink) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-clean')))).default(symlink === 'symlink');
    }));
    /**
     * command ls
     */
    const listCmd = program.command('ls').alias('list')
        .option('-j, --json', 'list linked dependencies in form of JSON', false)
        .description('If you want to know how many components will actually run, this command prints out a list and the priorities, including installed components')
        .action(() => __awaiter(this, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-ls')))).default(listCmd.opts());
    }));
    withGlobalOptions(listCmd);
    /**
     * command run
     */
    const runCmd = program.command('run <target> [arguments...]')
        .description('Run specific module\'s exported function\n')
        .action((target, args) => __awaiter(this, void 0, void 0, function* () {
        const config = yield (yield Promise.resolve().then(() => __importStar(require('../config')))).default;
        yield config.init(runCmd.opts());
        const logConfig = yield (yield Promise.resolve().then(() => __importStar(require('../log-config')))).default;
        logConfig(config());
        (yield Promise.resolve().then(() => __importStar(require('../package-runner')))).runSinglePackage({ target, args });
    }));
    withGlobalOptions(runCmd);
    runCmd.usage(runCmd.usage() + '\n' + chalk_1.default.green('plink run <target> [arguments...]\n') +
        `e.g.\n  ${chalk_1.default.green('plink run forbar-package/dist/file#function argument1 argument2...')}\n` +
        'execute exported function of TS/JS file from specific package or path\n\n' +
        '<target> - JS or TS file module path which can be resolved by Node.js (ts-node) followed by "#" and exported function name,\n' +
        'e.g. \n' +
        chalk_1.default.green('package-name/dist/foobar.js#myFunction') +
        ', function can be async which returns Promise\n' +
        chalk_1.default.green('node_modules/package-dir/dist/foobar.ts#myFunction') +
        ', relative or absolute path\n');
    /**
     * tsc command
     */
    const tscCmd = program.command('tsc [package...]')
        .description('Run Typescript compiler')
        .option('-w, --watch', 'Typescript compiler watch mode', false)
        .option('--pj, --project <project-dir,...>', 'Compile only specific project directory', (v, prev) => {
        prev.push(...v.split(','));
        return prev;
    }, [])
        .option('--jsx', 'includes TSX file', false)
        .option('--ed, --emitDeclarationOnly', 'Typescript compiler option: --emitDeclarationOnly.\nOnly emit ‘.d.ts’ declaration files.', false)
        .option('--source-map', 'Source map style: "inline" or "file"', 'inline')
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        const opt = tscCmd.opts();
        // console.log(opt);
        const config = yield (yield Promise.resolve().then(() => __importStar(require('../config')))).default;
        yield config.init(runCmd.opts());
        const logConfig = yield (yield Promise.resolve().then(() => __importStar(require('../log-config')))).default;
        logConfig(config());
        const tsCmd = yield Promise.resolve().then(() => __importStar(require('../ts-cmd')));
        yield tsCmd.tsc({
            package: packages,
            project: opt.project,
            watch: opt.watch,
            sourceMap: opt.sourceMap,
            jsx: opt.jsx,
            ed: opt.emitDeclarationOnly
        });
        const { stateFactory } = require('../store');
        stateFactory.stopAllEpics();
    }));
    withGlobalOptions(tscCmd);
    tscCmd.usage(tscCmd.usage() + '\n' + 'Run gulp-typescript to compile Node.js side typescript files.\n\n' +
        'It compiles \n  "<package-directory>/ts/**/*.ts" to "<package-directory>/dist",\n' +
        '  or\n  "<package-directory>/isom/**/*.ts" to "<package-directory>/isom"\n for all @wfh packages.\n' +
        'I suggest to put Node.js side TS code in directory `ts`, and isomorphic TS code (meaning it runs in ' +
        'both Node.js and Browser) in directory `isom`.\n' +
        hlDesc('plink tsc <package..>\n') + ' Only compile specific components by providing package name or short name\n' +
        hlDesc('plink tsc\n') + ' Compile all components belong to associated projects, not including installed components\n' +
        hlDesc('plink tsc --pj <project directory,...>\n') + ' Compile components belong to specific projects\n' +
        hlDesc('plink tsc [package...] -w\n') + ' Watch components change and compile when new typescript file is changed or created\n\n');
    /**
     * Bump command
     */
    const bumpCmd = program.command('bump [package...]')
        .description('bump package.json version number for specific package, same as "npm version" does')
        .option('--pj, --project <project-dir,...>', 'only bump component packages from specific project directory', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
    }, [])
        .option('-i, --incre-version <major | minor | patch | premajor | preminor | prepatch | prerelease>', 'version increment, valid values are: major, minor, patch, prerelease', 'patch')
        .action((packages) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-bump')))).default(Object.assign(Object.assign({}, bumpCmd.opts()), { packages }));
    }));
    withGlobalOptions(bumpCmd);
    // bumpCmd.usage(bumpCmd.usage() + '\n' + hl('plink bump <package> ...') + ' to recursively bump package.json from multiple directories\n' +
    //   hl('plink bump <dir> -i minor') + ' to bump minor version number, default is patch number');
    /**
     * Pack command
     */
    const packCmd = program.command('pack [packageDir...]')
        .description('npm pack every pakage into tarball files')
        .option('--pj, --project <project-dir,...>', 'project directories to be looked up for all packages which need to be packed to tarball files', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
    }, [])
        .action((packageDirs) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-pack')))).pack(Object.assign(Object.assign({}, packCmd.opts()), { packageDirs }));
    }));
    withGlobalOptions(packCmd);
    /**
     * Pack command
     */
    const publishCmd = program.command('publish [packageDir...]')
        .description('run npm publish')
        .option('--pj, --project <project-dir,...>', 'project directories to be looked up for all packages which need to be packed to tarball files', (value, prev) => {
        prev.push(...value.split(','));
        return prev;
    }, [])
        .option('--public', 'same as "npm publish" command option "--access public"', false)
        .action((packageDirs) => __awaiter(this, void 0, void 0, function* () {
        (yield Promise.resolve().then(() => __importStar(require('./cli-pack')))).publish(Object.assign(Object.assign({}, publishCmd.opts()), { packageDirs }));
    }));
    withGlobalOptions(publishCmd);
}
function loadExtensionCommand(program) {
    const { getState } = require('./cli-store');
    const { getState: getPkgState, workspaceKey } = require('../package-mgr');
    const ws = getPkgState().workspaces.get(workspaceKey(process.cwd()));
    if (ws == null)
        return [];
    const availables = [];
    for (const extension of getState().extensions.values()) {
        if (!_.has(ws.originInstallJson.dependencies, extension.pkName) && !_.has(ws.originInstallJson.devDependencies, extension.pkName))
            continue;
        availables.push(extension.pkName);
        let filePath = null;
        try {
            filePath = require.resolve(extension.pkName + '/' + extension.pkgFilePath);
        }
        catch (e) { }
        if (filePath != null) {
            try {
                const subCmdFactory = extension.funcName ? require(filePath)[extension.funcName] :
                    require(filePath);
                subCmdFactory(program, withGlobalOptions);
            }
            catch (e) {
                // tslint:disable-next-line: no-console
                console.error('Failed to load command line extension in package ' + extension.pkName, e);
            }
        }
    }
    return availables;
}
function hl(text) {
    return chalk_1.default.green(text);
}
function hlDesc(text) {
    return chalk_1.default.green(text);
}
function withGlobalOptions(program) {
    program.option('-c, --config <config-file>', hlDesc('Read config files, if there are multiple files, the latter one overrides previous one'), (value, prev) => { prev.push(...value.split(',')); return prev; }, [])
        .option('--prop <property-path=value as JSON | literal>', hlDesc('<property-path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string\n e.g.\n') +
        '--prop port=8080 --prop devMode=false --prop @wfh/foobar.api=http://localhost:8080\n' +
        '--prop port=8080 --prop devMode=false --prop @wfh/foobar.api=http://localhost:8080\n' +
        '--prop arraylike.prop[0]=foobar\n' +
        '--prop ["@wfh/foo.bar","prop",0]=true', arrayOptionFn, []);
    // .option('--log-stat', hlDesc('Print internal Redux state/actions for debug'));
    return program;
}
exports.withGlobalOptions = withGlobalOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvY21kL2NsaS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsa0NBQWtDO0FBQ2xDLDBEQUFrQztBQUNsQyxrREFBMEI7QUFLMUIsMENBQTRCO0FBQzVCLDJCQUEyQjtBQUMzQixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN2QyxxQkFBcUI7QUFFckIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFZLEVBQUUsSUFBMEIsRUFBRSxFQUFFO0lBQ2pFLElBQUksSUFBSTtRQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDLENBQUM7QUFFRixTQUFzQixXQUFXLENBQUMsU0FBaUI7O1FBQ2pELE9BQU8sQ0FBQyxLQUFLLEdBQUcsc0JBQXNCLENBQUM7UUFDdkMsTUFBTSxFQUFDLFlBQVksRUFBQyxHQUFpQixPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekQsd0RBQWEsYUFBYSxHQUFDLENBQUM7UUFDNUIsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRzlCLElBQUksYUFBdUIsQ0FBQztRQUM1QixNQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQzthQUM3QyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDYixPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDckIsdUNBQXVDO1lBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUM1Qix1Q0FBdUM7Z0JBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsU0FBUyxhQUFhLENBQUMsTUFB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LE9BQU8sQ0FBQyxLQUFLLENBQUMsbURBQW1ELEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMxRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDO0FBRUQsU0FBUyxFQUFFLENBQUMsSUFBWTtJQUN0QixPQUFPLGVBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUVELFNBQVMsTUFBTSxDQUFDLElBQVk7SUFDMUIsT0FBTyxlQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNCLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxPQUEwQjtJQUMxRCxPQUFPLENBQUMsTUFBTSxDQUFDLDRCQUE0QixFQUN6QyxNQUFNLENBQUMsdUZBQXVGLENBQUMsRUFDL0YsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQSxDQUFDLEVBQUUsRUFBYyxDQUFDO1NBQ2xGLE1BQU0sQ0FBQyxnREFBZ0QsRUFDdEQsTUFBTSxDQUFDLDhJQUE4SSxDQUFDO1FBQ3RKLHNGQUFzRjtRQUN0RixzRkFBc0Y7UUFDdEYsbUNBQW1DO1FBQ25DLHVDQUF1QyxFQUN2QyxhQUFhLEVBQUUsRUFBYyxDQUFDLENBQUM7SUFDakMsaUZBQWlGO0lBRWpGLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7QUFkRCw4Q0FjQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOiBtYXgtbGluZS1sZW5ndGhcbmltcG9ydCBjb21tYW5kZXIgZnJvbSAnY29tbWFuZGVyJztcbmltcG9ydCBjaGFsayBmcm9tICdjaGFsayc7XG5pbXBvcnQgKiBhcyBzdG9yZSBmcm9tICcuLi9zdG9yZSc7XG5pbXBvcnQgKiBhcyB0cCBmcm9tICcuL3R5cGVzJztcbmltcG9ydCAqIGFzIGNsaVN0b3JlIGZyb20gJy4vY2xpLXNsaWNlJztcbmltcG9ydCAqIGFzIHBrZ01nciBmcm9tICcuLi9wYWNrYWdlLW1ncic7XG5pbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG4vLyBpbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmNvbnN0IHBrID0gcmVxdWlyZSgnLi4vLi4vLi4vcGFja2FnZScpO1xuLy8gY29uc3QgV0lEVEggPSAxMzA7XG5cbmNvbnN0IGFycmF5T3B0aW9uRm4gPSAoY3Vycjogc3RyaW5nLCBwcmV2OiBzdHJpbmdbXSB8IHVuZGVmaW5lZCkgPT4ge1xuICBpZiAocHJldilcbiAgICBwcmV2LnB1c2goY3Vycik7XG4gIHJldHVybiBwcmV2O1xufTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRyY3BDb21tYW5kKHN0YXJ0VGltZTogbnVtYmVyKSB7XG4gIHByb2Nlc3MudGl0bGUgPSAnUGxpbmsgLSBjb21tYW5kIGxpbmUnO1xuICBjb25zdCB7c3RhdGVGYWN0b3J5fTogdHlwZW9mIHN0b3JlID0gcmVxdWlyZSgnLi4vc3RvcmUnKTtcbiAgYXdhaXQgaW1wb3J0KCcuL2NsaS1zbGljZScpO1xuICBzdGF0ZUZhY3RvcnkuY29uZmlndXJlU3RvcmUoKTtcblxuXG4gIGxldCBjbGlFeHRlbnNpb25zOiBzdHJpbmdbXTtcbiAgY29uc3QgcHJvZ3JhbSA9IG5ldyBjb21tYW5kZXIuQ29tbWFuZCgncGxpbmsnKVxuICAuYWN0aW9uKGFyZ3MgPT4ge1xuICAgIHByb2dyYW0ub3V0cHV0SGVscCgpO1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdcXG52ZXJzaW9uOicsIHBrLnZlcnNpb24pO1xuICAgIGlmIChjbGlFeHRlbnNpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgICAgY29uc29sZS5sb2coYEZvdW5kICR7Y2xpRXh0ZW5zaW9ucy5sZW5ndGh9IGNvbW1hbmQgbGluZSBleHRlbnNpb25gICtcbiAgICAgIGAke2NsaUV4dGVuc2lvbnMubGVuZ3RoID4gMSA/ICdzJyA6ICcnfTogJHtjbGlFeHRlbnNpb25zLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICB9KTtcblxuICBwcm9ncmFtLnZlcnNpb24ocGsudmVyc2lvbiwgJy12LCAtLXZlcnMnLCAnb3V0cHV0IHRoZSBjdXJyZW50IHZlcnNpb24nKTtcbiAgc3ViRHJjcENvbW1hbmQocHJvZ3JhbSk7XG4gIGlmIChwcm9jZXNzLmVudi5QTElOS19TQUZFICE9PSAndHJ1ZScpXG4gICAgY2xpRXh0ZW5zaW9ucyA9IGxvYWRFeHRlbnNpb25Db21tYW5kKHByb2dyYW0pO1xuXG4gIHRyeSB7XG4gICAgYXdhaXQgcHJvZ3JhbS5wYXJzZUFzeW5jKHByb2Nlc3MuYXJndik7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmVycm9yKGNoYWxrLnJlZEJyaWdodChlKSwgZS5zdGFjayk7XG4gICAgcHJvY2Vzcy5leGl0KDEpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN1YkRyY3BDb21tYW5kKHByb2dyYW06IGNvbW1hbmRlci5Db21tYW5kKSB7XG4gIC8qKlxuICAgKiBjb21tYW5kIGluaXRcbiAgICovXG4gIGNvbnN0IGluaXRDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2luaXQgW3dvcmtzcGFjZV0nKVxuICAuZGVzY3JpcHRpb24oJ0luaXRpYWxpemUgd29ya3NwYWNlIGRpcmVjdG9yeSwgZ2VuZXJhdGUgYmFzaWMgY29uZmlndXJhdGlvbiBmaWxlcyBmb3IgcHJvamVjdCBhbmQgY29tcG9uZW50IHBhY2thZ2VzJylcbiAgLm9wdGlvbignLWYgfCAtLWZvcmNlJywgJ0ZvcmNlIHJ1biBcIm5wbSBpbnN0YWxsXCIgaW4gc3BlY2lmaWMgd29ya3NwYWNlIGRpcmVjdG9yeScsIGZhbHNlKVxuICAvLyAub3B0aW9uKCctLXlhcm4nLCAnVXNlIFlhcm4gdG8gaW5zdGFsbCBjb21wb25lbnQgcGVlciBkZXBlbmRlbmNpZXMgaW5zdGVhZCBvZiB1c2luZyBOUE0nLCBmYWxzZSlcbiAgLm9wdGlvbignLS1wcm9kdWN0aW9uJywgJ0FkZCBcIi0tcHJvZHVjdGlvblwiIG9yIFwiLS1vbmx5PXByb2RcIiBjb21tYW5kIGxpbmUgYXJndW1lbnQgdG8gXCJ5YXJuL25wbSBpbnN0YWxsXCInLCBmYWxzZSlcbiAgLmFjdGlvbihhc3luYyAod29ya3NwYWNlOiBzdHJpbmcpID0+IHtcbiAgICBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuL2NsaS1pbml0JykpLmRlZmF1bHQoaW5pdENtZC5vcHRzKCkgYXMgYW55LCB3b3Jrc3BhY2UpO1xuICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMoaW5pdENtZCk7XG5cbiAgLyoqXG4gICAqIGNvbW1hbmQgcHJvamVjdFxuICAgKi9cbiAgcHJvZ3JhbS5jb21tYW5kKCdwcm9qZWN0IFthZGR8cmVtb3ZlXSBbcHJvamVjdC1kaXIuLi5dJylcbiAgLmRlc2NyaXB0aW9uKCdBc3NvY2lhdGUsIGRpc2Fzc29jaWF0ZSBvciBsaXN0IGFzc29jaWF0ZWQgcHJvamVjdCBmb2xkZXJzJylcbiAgLmFjdGlvbihhc3luYyAoYWN0aW9uOiAnYWRkJ3wncmVtb3ZlJ3x1bmRlZmluZWQsIHByb2plY3REaXI6IHN0cmluZ1tdKSA9PiB7XG4gICAgKGF3YWl0IGltcG9ydCgnLi9jbGktcHJvamVjdCcpKS5kZWZhdWx0KGFjdGlvbiwgcHJvamVjdERpcik7XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBjb21tYW5kIGxpbnRcbiAgICovXG4gIGNvbnN0IGxpbnRDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2xpbnQgW3BhY2thZ2UuLi5dJylcbiAgLmRlc2NyaXB0aW9uKCdzb3VyY2UgY29kZSBzdHlsZSBjaGVjaycpXG4gIC5vcHRpb24oJy0tcGogPHByb2plY3QxLHByb2plY3QyLi4uPicsICdsaW50IG9ubHkgVFMgY29kZSBmcm9tIHNwZWNpZmljIHByb2plY3QnLCBhcnJheU9wdGlvbkZuLCBbXSlcbiAgLm9wdGlvbignLS1maXgnLCAnUnVuIGVzbGludC90c2xpbnQgZml4LCB0aGlzIGNvdWxkIGNhdXNlIHlvdXIgc291cmNlIGNvZGUgYmVpbmcgY2hhbmdlZCB1bmV4cGVjdGVkbHknLCBmYWxzZSlcbiAgLmFjdGlvbihhc3luYyBwYWNrYWdlcyA9PiB7XG4gICAgYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9jbGktbGludCcpKS5kZWZhdWx0KHBhY2thZ2VzLCBsaW50Q21kLm9wdHMoKSBhcyBhbnkpO1xuICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMobGludENtZCk7XG4gIGxpbnRDbWQudXNhZ2UobGludENtZC51c2FnZSgpICtcbiAgICBobCgnXFxuZHJjcCBsaW50IC0tcGogPHByb2plY3QtZGlyLi4+IFstLWZpeF0nKSArICcgTGludCBUUyBmaWxlcyBmcm9tIHNwZWNpZmljIHByb2plY3QgZGlyZWN0b3J5XFxuJyArXG4gICAgaGwoJ1xcbmRyY3AgbGludCA8Y29tcG9uZW50LXBhY2thZ2UuLj4gWy0tZml4XScpICsgJyBMaW50IFRTIGZpbGVzIGZyb20gc3BlY2lmaWMgY29tcG9uZW50IHBhY2thZ2VzJyk7XG5cbiAgLyoqXG4gICAqIGNvbW1hbmQgY2xlYW5cbiAgICovXG4gIHByb2dyYW0uY29tbWFuZCgnY2xlYW4gW3N5bWxpbmtdJykuZGVzY3JpcHRpb24oJ0NsZWFuIHdob2xlIFwiZGlzdFwiIGRpcmVjdG9yeSBvciBvbmx5IHN5bWJvbGljIGxpbmtzIGZyb20gbm9kZV9tb2R1bGVzJylcbiAgLmFjdGlvbihhc3luYyAoc3ltbGluazogJ3N5bWxpbmsnIHwgdW5kZWZpbmVkKSA9PiB7XG4gICAgKGF3YWl0IGltcG9ydCgnLi9jbGktY2xlYW4nKSkuZGVmYXVsdChzeW1saW5rID09PSAnc3ltbGluaycpO1xuICB9KTtcblxuICAvKipcbiAgICogY29tbWFuZCBsc1xuICAgKi9cbiAgY29uc3QgbGlzdENtZCA9IHByb2dyYW0uY29tbWFuZCgnbHMnKS5hbGlhcygnbGlzdCcpXG4gIC5vcHRpb24oJy1qLCAtLWpzb24nLCAnbGlzdCBsaW5rZWQgZGVwZW5kZW5jaWVzIGluIGZvcm0gb2YgSlNPTicsIGZhbHNlKVxuICAuZGVzY3JpcHRpb24oJ0lmIHlvdSB3YW50IHRvIGtub3cgaG93IG1hbnkgY29tcG9uZW50cyB3aWxsIGFjdHVhbGx5IHJ1biwgdGhpcyBjb21tYW5kIHByaW50cyBvdXQgYSBsaXN0IGFuZCB0aGUgcHJpb3JpdGllcywgaW5jbHVkaW5nIGluc3RhbGxlZCBjb21wb25lbnRzJylcbiAgLmFjdGlvbihhc3luYyAoKSA9PiB7XG4gICAgYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9jbGktbHMnKSkuZGVmYXVsdChsaXN0Q21kLm9wdHMoKSBhcyBhbnkpO1xuICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMobGlzdENtZCk7XG5cbiAgLyoqXG4gICAqIGNvbW1hbmQgcnVuXG4gICAqL1xuICBjb25zdCBydW5DbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ3J1biA8dGFyZ2V0PiBbYXJndW1lbnRzLi4uXScpXG4gIC5kZXNjcmlwdGlvbignUnVuIHNwZWNpZmljIG1vZHVsZVxcJ3MgZXhwb3J0ZWQgZnVuY3Rpb25cXG4nKVxuICAuYWN0aW9uKGFzeW5jICh0YXJnZXQ6IHN0cmluZywgYXJnczogc3RyaW5nW10pID0+IHtcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCAoYXdhaXQgaW1wb3J0KCcuLi9jb25maWcnKSkuZGVmYXVsdDtcbiAgICBhd2FpdCBjb25maWcuaW5pdChydW5DbWQub3B0cygpIGFzIHRwLkdsb2JhbE9wdGlvbnMpO1xuICAgIGNvbnN0IGxvZ0NvbmZpZyA9IGF3YWl0IChhd2FpdCBpbXBvcnQoJy4uL2xvZy1jb25maWcnKSkuZGVmYXVsdDtcbiAgICBsb2dDb25maWcoY29uZmlnKCkpO1xuICAgIChhd2FpdCBpbXBvcnQoJy4uL3BhY2thZ2UtcnVubmVyJykpLnJ1blNpbmdsZVBhY2thZ2Uoe3RhcmdldCwgYXJnc30pO1xuICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMocnVuQ21kKTtcbiAgcnVuQ21kLnVzYWdlKHJ1bkNtZC51c2FnZSgpICsgJ1xcbicgKyBjaGFsay5ncmVlbigncGxpbmsgcnVuIDx0YXJnZXQ+IFthcmd1bWVudHMuLi5dXFxuJykgK1xuICBgZS5nLlxcbiAgJHtjaGFsay5ncmVlbigncGxpbmsgcnVuIGZvcmJhci1wYWNrYWdlL2Rpc3QvZmlsZSNmdW5jdGlvbiBhcmd1bWVudDEgYXJndW1lbnQyLi4uJyl9XFxuYCArXG4gICdleGVjdXRlIGV4cG9ydGVkIGZ1bmN0aW9uIG9mIFRTL0pTIGZpbGUgZnJvbSBzcGVjaWZpYyBwYWNrYWdlIG9yIHBhdGhcXG5cXG4nICtcbiAgJzx0YXJnZXQ+IC0gSlMgb3IgVFMgZmlsZSBtb2R1bGUgcGF0aCB3aGljaCBjYW4gYmUgcmVzb2x2ZWQgYnkgTm9kZS5qcyAodHMtbm9kZSkgZm9sbG93ZWQgYnkgXCIjXCIgYW5kIGV4cG9ydGVkIGZ1bmN0aW9uIG5hbWUsXFxuJyArXG4gICdlLmcuIFxcbicgK1xuICBjaGFsay5ncmVlbigncGFja2FnZS1uYW1lL2Rpc3QvZm9vYmFyLmpzI215RnVuY3Rpb24nKSArXG4gICcsIGZ1bmN0aW9uIGNhbiBiZSBhc3luYyB3aGljaCByZXR1cm5zIFByb21pc2VcXG4nICtcbiAgY2hhbGsuZ3JlZW4oJ25vZGVfbW9kdWxlcy9wYWNrYWdlLWRpci9kaXN0L2Zvb2Jhci50cyNteUZ1bmN0aW9uJykgK1xuICAnLCByZWxhdGl2ZSBvciBhYnNvbHV0ZSBwYXRoXFxuJyk7XG5cbiAgLyoqXG4gICAqIHRzYyBjb21tYW5kXG4gICAqL1xuICBjb25zdCB0c2NDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ3RzYyBbcGFja2FnZS4uLl0nKVxuICAuZGVzY3JpcHRpb24oJ1J1biBUeXBlc2NyaXB0IGNvbXBpbGVyJylcbiAgLm9wdGlvbignLXcsIC0td2F0Y2gnLCAnVHlwZXNjcmlwdCBjb21waWxlciB3YXRjaCBtb2RlJywgZmFsc2UpXG4gIC5vcHRpb24oJy0tcGosIC0tcHJvamVjdCA8cHJvamVjdC1kaXIsLi4uPicsICdDb21waWxlIG9ubHkgc3BlY2lmaWMgcHJvamVjdCBkaXJlY3RvcnknLCAodiwgcHJldikgPT4ge1xuICAgIHByZXYucHVzaCguLi52LnNwbGl0KCcsJykpOyByZXR1cm4gcHJldjtcbiAgfSwgW10gYXMgc3RyaW5nW10pXG4gIC5vcHRpb24oJy0tanN4JywgJ2luY2x1ZGVzIFRTWCBmaWxlJywgZmFsc2UpXG4gIC5vcHRpb24oJy0tZWQsIC0tZW1pdERlY2xhcmF0aW9uT25seScsICdUeXBlc2NyaXB0IGNvbXBpbGVyIG9wdGlvbjogLS1lbWl0RGVjbGFyYXRpb25Pbmx5Llxcbk9ubHkgZW1pdCDigJguZC50c+KAmSBkZWNsYXJhdGlvbiBmaWxlcy4nLCBmYWxzZSlcbiAgLm9wdGlvbignLS1zb3VyY2UtbWFwJywgJ1NvdXJjZSBtYXAgc3R5bGU6IFwiaW5saW5lXCIgb3IgXCJmaWxlXCInLCAnaW5saW5lJylcbiAgLmFjdGlvbihhc3luYyAocGFja2FnZXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgY29uc3Qgb3B0ID0gdHNjQ21kLm9wdHMoKTtcbiAgICAvLyBjb25zb2xlLmxvZyhvcHQpO1xuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IChhd2FpdCBpbXBvcnQoJy4uL2NvbmZpZycpKS5kZWZhdWx0O1xuICAgIGF3YWl0IGNvbmZpZy5pbml0KHJ1bkNtZC5vcHRzKCkgYXMgdHAuR2xvYmFsT3B0aW9ucyk7XG4gICAgY29uc3QgbG9nQ29uZmlnID0gYXdhaXQgKGF3YWl0IGltcG9ydCgnLi4vbG9nLWNvbmZpZycpKS5kZWZhdWx0O1xuICAgIGxvZ0NvbmZpZyhjb25maWcoKSk7XG4gICAgY29uc3QgdHNDbWQgPSBhd2FpdCBpbXBvcnQoJy4uL3RzLWNtZCcpO1xuICAgIGF3YWl0IHRzQ21kLnRzYyh7XG4gICAgICBwYWNrYWdlOiBwYWNrYWdlcyxcbiAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgd2F0Y2g6IG9wdC53YXRjaCxcbiAgICAgIHNvdXJjZU1hcDogb3B0LnNvdXJjZU1hcCxcbiAgICAgIGpzeDogb3B0LmpzeCxcbiAgICAgIGVkOiBvcHQuZW1pdERlY2xhcmF0aW9uT25seVxuICAgIH0pO1xuICAgIGNvbnN0IHtzdGF0ZUZhY3Rvcnl9OiB0eXBlb2Ygc3RvcmUgPSByZXF1aXJlKCcuLi9zdG9yZScpO1xuICAgIHN0YXRlRmFjdG9yeS5zdG9wQWxsRXBpY3MoKTtcbiAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHRzY0NtZCk7XG4gIHRzY0NtZC51c2FnZSh0c2NDbWQudXNhZ2UoKSArICdcXG4nICsgJ1J1biBndWxwLXR5cGVzY3JpcHQgdG8gY29tcGlsZSBOb2RlLmpzIHNpZGUgdHlwZXNjcmlwdCBmaWxlcy5cXG5cXG4nICtcbiAgJ0l0IGNvbXBpbGVzIFxcbiAgXCI8cGFja2FnZS1kaXJlY3Rvcnk+L3RzLyoqLyoudHNcIiB0byBcIjxwYWNrYWdlLWRpcmVjdG9yeT4vZGlzdFwiLFxcbicgK1xuICAnICBvclxcbiAgXCI8cGFja2FnZS1kaXJlY3Rvcnk+L2lzb20vKiovKi50c1wiIHRvIFwiPHBhY2thZ2UtZGlyZWN0b3J5Pi9pc29tXCJcXG4gZm9yIGFsbCBAd2ZoIHBhY2thZ2VzLlxcbicgK1xuICAnSSBzdWdnZXN0IHRvIHB1dCBOb2RlLmpzIHNpZGUgVFMgY29kZSBpbiBkaXJlY3RvcnkgYHRzYCwgYW5kIGlzb21vcnBoaWMgVFMgY29kZSAobWVhbmluZyBpdCBydW5zIGluICcgK1xuICAnYm90aCBOb2RlLmpzIGFuZCBCcm93c2VyKSBpbiBkaXJlY3RvcnkgYGlzb21gLlxcbicgK1xuICBobERlc2MoJ3BsaW5rIHRzYyA8cGFja2FnZS4uPlxcbicpICsgJyBPbmx5IGNvbXBpbGUgc3BlY2lmaWMgY29tcG9uZW50cyBieSBwcm92aWRpbmcgcGFja2FnZSBuYW1lIG9yIHNob3J0IG5hbWVcXG4nICtcbiAgaGxEZXNjKCdwbGluayB0c2NcXG4nKSArICcgQ29tcGlsZSBhbGwgY29tcG9uZW50cyBiZWxvbmcgdG8gYXNzb2NpYXRlZCBwcm9qZWN0cywgbm90IGluY2x1ZGluZyBpbnN0YWxsZWQgY29tcG9uZW50c1xcbicgK1xuICBobERlc2MoJ3BsaW5rIHRzYyAtLXBqIDxwcm9qZWN0IGRpcmVjdG9yeSwuLi4+XFxuJykgKyAnIENvbXBpbGUgY29tcG9uZW50cyBiZWxvbmcgdG8gc3BlY2lmaWMgcHJvamVjdHNcXG4nICtcbiAgaGxEZXNjKCdwbGluayB0c2MgW3BhY2thZ2UuLi5dIC13XFxuJykgKyAnIFdhdGNoIGNvbXBvbmVudHMgY2hhbmdlIGFuZCBjb21waWxlIHdoZW4gbmV3IHR5cGVzY3JpcHQgZmlsZSBpcyBjaGFuZ2VkIG9yIGNyZWF0ZWRcXG5cXG4nKTtcblxuICAvKipcbiAgICogQnVtcCBjb21tYW5kXG4gICAqL1xuICBjb25zdCBidW1wQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdidW1wIFtwYWNrYWdlLi4uXScpXG4gICAgLmRlc2NyaXB0aW9uKCdidW1wIHBhY2thZ2UuanNvbiB2ZXJzaW9uIG51bWJlciBmb3Igc3BlY2lmaWMgcGFja2FnZSwgc2FtZSBhcyBcIm5wbSB2ZXJzaW9uXCIgZG9lcycpXG4gICAgLm9wdGlvbjxzdHJpbmdbXT4oJy0tcGosIC0tcHJvamVjdCA8cHJvamVjdC1kaXIsLi4uPicsICdvbmx5IGJ1bXAgY29tcG9uZW50IHBhY2thZ2VzIGZyb20gc3BlY2lmaWMgcHJvamVjdCBkaXJlY3RvcnknLFxuICAgICAgKHZhbHVlLCBwcmV2KSA9PiB7XG4gICAgICAgIHByZXYucHVzaCguLi52YWx1ZS5zcGxpdCgnLCcpKTsgcmV0dXJuIHByZXY7XG4gICAgICB9LCBbXSlcbiAgICAub3B0aW9uKCctaSwgLS1pbmNyZS12ZXJzaW9uIDxtYWpvciB8IG1pbm9yIHwgcGF0Y2ggfCBwcmVtYWpvciB8IHByZW1pbm9yIHwgcHJlcGF0Y2ggfCBwcmVyZWxlYXNlPicsXG4gICAgICAndmVyc2lvbiBpbmNyZW1lbnQsIHZhbGlkIHZhbHVlcyBhcmU6IG1ham9yLCBtaW5vciwgcGF0Y2gsIHByZXJlbGVhc2UnLCAncGF0Y2gnKVxuICAgIC5hY3Rpb24oYXN5bmMgKHBhY2thZ2VzOiBzdHJpbmdbXSkgPT4ge1xuICAgICAgKGF3YWl0IGltcG9ydCgnLi9jbGktYnVtcCcpKS5kZWZhdWx0KHsuLi5idW1wQ21kLm9wdHMoKSBhcyB0cC5CdW1wT3B0aW9ucywgcGFja2FnZXN9KTtcbiAgICB9KTtcbiAgd2l0aEdsb2JhbE9wdGlvbnMoYnVtcENtZCk7XG4gIC8vIGJ1bXBDbWQudXNhZ2UoYnVtcENtZC51c2FnZSgpICsgJ1xcbicgKyBobCgncGxpbmsgYnVtcCA8cGFja2FnZT4gLi4uJykgKyAnIHRvIHJlY3Vyc2l2ZWx5IGJ1bXAgcGFja2FnZS5qc29uIGZyb20gbXVsdGlwbGUgZGlyZWN0b3JpZXNcXG4nICtcbiAgLy8gICBobCgncGxpbmsgYnVtcCA8ZGlyPiAtaSBtaW5vcicpICsgJyB0byBidW1wIG1pbm9yIHZlcnNpb24gbnVtYmVyLCBkZWZhdWx0IGlzIHBhdGNoIG51bWJlcicpO1xuXG4gIC8qKlxuICAgKiBQYWNrIGNvbW1hbmRcbiAgICovXG4gIGNvbnN0IHBhY2tDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ3BhY2sgW3BhY2thZ2VEaXIuLi5dJylcbiAgICAuZGVzY3JpcHRpb24oJ25wbSBwYWNrIGV2ZXJ5IHBha2FnZSBpbnRvIHRhcmJhbGwgZmlsZXMnKVxuICAgIC5vcHRpb248c3RyaW5nW10+KCctLXBqLCAtLXByb2plY3QgPHByb2plY3QtZGlyLC4uLj4nLFxuICAgICdwcm9qZWN0IGRpcmVjdG9yaWVzIHRvIGJlIGxvb2tlZCB1cCBmb3IgYWxsIHBhY2thZ2VzIHdoaWNoIG5lZWQgdG8gYmUgcGFja2VkIHRvIHRhcmJhbGwgZmlsZXMnLFxuICAgICAgKHZhbHVlLCBwcmV2KSA9PiB7XG4gICAgICAgIHByZXYucHVzaCguLi52YWx1ZS5zcGxpdCgnLCcpKTsgcmV0dXJuIHByZXY7XG4gICAgICB9LCBbXSlcbiAgICAuYWN0aW9uKGFzeW5jIChwYWNrYWdlRGlyczogc3RyaW5nW10pID0+IHtcbiAgICAgIChhd2FpdCBpbXBvcnQoJy4vY2xpLXBhY2snKSkucGFjayh7Li4ucGFja0NtZC5vcHRzKCkgYXMgdHAuUGFja09wdGlvbnMsIHBhY2thZ2VEaXJzfSk7XG4gICAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHBhY2tDbWQpO1xuXG4gIC8qKlxuICAgKiBQYWNrIGNvbW1hbmRcbiAgICovXG4gIGNvbnN0IHB1Ymxpc2hDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ3B1Ymxpc2ggW3BhY2thZ2VEaXIuLi5dJylcbiAgICAuZGVzY3JpcHRpb24oJ3J1biBucG0gcHVibGlzaCcpXG4gICAgLm9wdGlvbjxzdHJpbmdbXT4oJy0tcGosIC0tcHJvamVjdCA8cHJvamVjdC1kaXIsLi4uPicsXG4gICAgJ3Byb2plY3QgZGlyZWN0b3JpZXMgdG8gYmUgbG9va2VkIHVwIGZvciBhbGwgcGFja2FnZXMgd2hpY2ggbmVlZCB0byBiZSBwYWNrZWQgdG8gdGFyYmFsbCBmaWxlcycsXG4gICAgICAodmFsdWUsIHByZXYpID0+IHtcbiAgICAgICAgcHJldi5wdXNoKC4uLnZhbHVlLnNwbGl0KCcsJykpOyByZXR1cm4gcHJldjtcbiAgICAgIH0sIFtdKVxuICAgIC5vcHRpb24oJy0tcHVibGljJywgJ3NhbWUgYXMgXCJucG0gcHVibGlzaFwiIGNvbW1hbmQgb3B0aW9uIFwiLS1hY2Nlc3MgcHVibGljXCInLCBmYWxzZSlcbiAgICAuYWN0aW9uKGFzeW5jIChwYWNrYWdlRGlyczogc3RyaW5nW10pID0+IHtcbiAgICAgIChhd2FpdCBpbXBvcnQoJy4vY2xpLXBhY2snKSkucHVibGlzaCh7Li4ucHVibGlzaENtZC5vcHRzKCkgYXMgdHAuUHVibGlzaE9wdGlvbnMsIHBhY2thZ2VEaXJzfSk7XG4gICAgfSk7XG4gIHdpdGhHbG9iYWxPcHRpb25zKHB1Ymxpc2hDbWQpO1xufVxuXG5mdW5jdGlvbiBsb2FkRXh0ZW5zaW9uQ29tbWFuZChwcm9ncmFtOiBjb21tYW5kZXIuQ29tbWFuZCk6IHN0cmluZ1tdIHtcbiAgY29uc3Qge2dldFN0YXRlfSA9IHJlcXVpcmUoJy4vY2xpLXN0b3JlJykgYXMgdHlwZW9mIGNsaVN0b3JlO1xuICBjb25zdCB7Z2V0U3RhdGU6IGdldFBrZ1N0YXRlLCB3b3Jrc3BhY2VLZXl9ID0gcmVxdWlyZSgnLi4vcGFja2FnZS1tZ3InKSBhcyB0eXBlb2YgcGtnTWdyO1xuICBjb25zdCB3cyA9IGdldFBrZ1N0YXRlKCkud29ya3NwYWNlcy5nZXQod29ya3NwYWNlS2V5KHByb2Nlc3MuY3dkKCkpKTtcbiAgaWYgKHdzID09IG51bGwpXG4gICAgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IGF2YWlsYWJsZXM6IHN0cmluZ1tdID0gW107XG4gIGZvciAoY29uc3QgZXh0ZW5zaW9uIG9mIGdldFN0YXRlKCkuZXh0ZW5zaW9ucy52YWx1ZXMoKSkge1xuICAgIGlmICghXy5oYXMod3Mub3JpZ2luSW5zdGFsbEpzb24uZGVwZW5kZW5jaWVzLCBleHRlbnNpb24ucGtOYW1lKSAmJiAhXy5oYXMod3Mub3JpZ2luSW5zdGFsbEpzb24uZGV2RGVwZW5kZW5jaWVzLCBleHRlbnNpb24ucGtOYW1lKSlcbiAgICAgIGNvbnRpbnVlO1xuXG4gICAgYXZhaWxhYmxlcy5wdXNoKGV4dGVuc2lvbi5wa05hbWUpO1xuICAgIGxldCBmaWxlUGF0aDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGZpbGVQYXRoID0gcmVxdWlyZS5yZXNvbHZlKGV4dGVuc2lvbi5wa05hbWUgKyAnLycgKyBleHRlbnNpb24ucGtnRmlsZVBhdGgpO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICBpZiAoZmlsZVBhdGggIT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc3ViQ21kRmFjdG9yeTogdHAuQ2xpRXh0ZW5zaW9uID0gZXh0ZW5zaW9uLmZ1bmNOYW1lID8gcmVxdWlyZShmaWxlUGF0aClbZXh0ZW5zaW9uLmZ1bmNOYW1lXSA6XG4gICAgICAgICAgcmVxdWlyZShmaWxlUGF0aCk7XG4gICAgICAgIHN1YkNtZEZhY3RvcnkocHJvZ3JhbSwgd2l0aEdsb2JhbE9wdGlvbnMpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvYWQgY29tbWFuZCBsaW5lIGV4dGVuc2lvbiBpbiBwYWNrYWdlICcgKyBleHRlbnNpb24ucGtOYW1lLCBlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGF2YWlsYWJsZXM7XG59XG5cbmZ1bmN0aW9uIGhsKHRleHQ6IHN0cmluZykge1xuICByZXR1cm4gY2hhbGsuZ3JlZW4odGV4dCk7XG59XG5cbmZ1bmN0aW9uIGhsRGVzYyh0ZXh0OiBzdHJpbmcpIHtcbiAgcmV0dXJuIGNoYWxrLmdyZWVuKHRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd2l0aEdsb2JhbE9wdGlvbnMocHJvZ3JhbTogY29tbWFuZGVyLkNvbW1hbmQpOiBjb21tYW5kZXIuQ29tbWFuZCB7XG4gIHByb2dyYW0ub3B0aW9uKCctYywgLS1jb25maWcgPGNvbmZpZy1maWxlPicsXG4gICAgaGxEZXNjKCdSZWFkIGNvbmZpZyBmaWxlcywgaWYgdGhlcmUgYXJlIG11bHRpcGxlIGZpbGVzLCB0aGUgbGF0dGVyIG9uZSBvdmVycmlkZXMgcHJldmlvdXMgb25lJyksXG4gICAgKHZhbHVlLCBwcmV2KSA9PiB7IHByZXYucHVzaCguLi52YWx1ZS5zcGxpdCgnLCcpKTsgcmV0dXJuIHByZXY7fSwgW10gYXMgc3RyaW5nW10pXG4gIC5vcHRpb24oJy0tcHJvcCA8cHJvcGVydHktcGF0aD12YWx1ZSBhcyBKU09OIHwgbGl0ZXJhbD4nLFxuICAgIGhsRGVzYygnPHByb3BlcnR5LXBhdGg+PTx2YWx1ZSBhcyBKU09OIHwgbGl0ZXJhbD4gLi4uIGRpcmVjdGx5IHNldCBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMsIHByb3BlcnR5IG5hbWUgaXMgbG9kYXNoLnNldCgpIHBhdGgtbGlrZSBzdHJpbmdcXG4gZS5nLlxcbicpICtcbiAgICAnLS1wcm9wIHBvcnQ9ODA4MCAtLXByb3AgZGV2TW9kZT1mYWxzZSAtLXByb3AgQHdmaC9mb29iYXIuYXBpPWh0dHA6Ly9sb2NhbGhvc3Q6ODA4MFxcbicgK1xuICAgICctLXByb3AgcG9ydD04MDgwIC0tcHJvcCBkZXZNb2RlPWZhbHNlIC0tcHJvcCBAd2ZoL2Zvb2Jhci5hcGk9aHR0cDovL2xvY2FsaG9zdDo4MDgwXFxuJyArXG4gICAgJy0tcHJvcCBhcnJheWxpa2UucHJvcFswXT1mb29iYXJcXG4nICtcbiAgICAnLS1wcm9wIFtcIkB3ZmgvZm9vLmJhclwiLFwicHJvcFwiLDBdPXRydWUnLFxuICAgIGFycmF5T3B0aW9uRm4sIFtdIGFzIHN0cmluZ1tdKTtcbiAgLy8gLm9wdGlvbignLS1sb2ctc3RhdCcsIGhsRGVzYygnUHJpbnQgaW50ZXJuYWwgUmVkdXggc3RhdGUvYWN0aW9ucyBmb3IgZGVidWcnKSk7XG5cbiAgcmV0dXJuIHByb2dyYW07XG59XG5cbiJdfQ==