
import {queueUp} from '../../../thread-promise-pool/dist/promise-queque';
import * as _ from 'lodash';
import * as fs from 'fs';
import fsext from 'fs-extra';
import * as Path from 'path';
import {promisifyExe} from '../process-utils';
// import {boxString} from './utils';
// import * as recipeManager from './recipe-manager';
import jsonParser, {ObjectAst, Token} from '../utils/json-sync-parser';
import replaceCode, {ReplacementInf} from 'require-injector/dist/patch-text';
import config from '../config';
import {PackOptions, PublishOptions} from './types';
import {getPackagesOfProjects, getState, workspaceKey, actionDispatcher} from '../package-mgr';
import {packages4WorkspaceKey} from '../package-mgr/package-list-helper';
import log4js from 'log4js';
import {findPackagesByNames} from './utils';
import '../editor-helper';

let tarballDir: string;
const log = log4js.getLogger('plink.cli-pack');

async function init(opts: PublishOptions | PackOptions) {
  tarballDir = Path.resolve(config().rootPath, 'tarballs');
  fsext.mkdirpSync(tarballDir);
}

export async function pack(opts: PackOptions) {
  await init(opts);

  if (opts.workspace && opts.workspace.length > 0) {
    await Promise.all(opts.workspace.map(ws => packPackages(Array.from(linkedPackagesOfWorkspace(ws)))));
  } else if (opts.project && opts.project.length > 0) {
    return packProject(opts.project);
  } else if (opts.dir && opts.dir.length > 0) {
    await packPackages(opts.dir);
  } else if (opts.packages && opts.packages.length > 0) {
    const dirs = Array.from(findPackagesByNames(getState(), opts.packages))
    .filter(pkg => pkg)
    .map(pkg => pkg!.realPath);

    await packPackages(dirs);
  } else {
    await packPackages(Array.from(linkedPackagesOfWorkspace(process.cwd())));
  }
}

export async function publish(opts: PublishOptions) {
  await init(opts);

  if (opts.project && opts.project.length > 0)
    return publishProject(opts.project, opts.public ? ['--access', 'public'] : []);
  else if (opts.dir && opts.dir.length > 0) {
    await publishPackages(opts.dir, opts.public ? ['--access', 'public'] : []);
  } else if (opts.packages && opts.packages.length > 0) {
    const dirs = Array.from(findPackagesByNames(getState(), opts.packages))
    .filter(pkg => pkg)
    .map(pkg => pkg!.realPath);
    await publishPackages(dirs, opts.public ? ['--access', 'public'] : []);
  } else {
    await publishPackages(Array.from(linkedPackagesOfWorkspace(process.cwd())),
      opts.public ? ['--access', 'public'] : []);
  }
}

function *linkedPackagesOfWorkspace(workspaceDir: string) {
  const wsKey = workspaceKey(workspaceDir);
  if (!getState().workspaces.has(wsKey)) {
    log.error(`Workspace ${workspaceDir} is not a workspace directory`);
    return;
  }
  for (const pkg of packages4WorkspaceKey(wsKey)) {
    yield pkg.realPath;
  }
}

async function packPackages(packageDirs: string[]) {
  const package2tarball = new Map<string, string>();
  if (packageDirs && packageDirs.length > 0) {
    const pgPaths: string[] = packageDirs;

    const done = queueUp(4, pgPaths.map(packageDir => () => npmPack(packageDir)));
    const tarInfos = (await done).filter(item => typeof item != null) as
      (typeof done extends Promise<(infer T)[]> ? NonNullable<T> : unknown)[];

    for (const item of tarInfos) {
      package2tarball.set(item.name, Path.resolve(tarballDir, item!.filename));
    }
    // log.info(Array.from(package2tarball.entries())
    //   .map(([pkName, ver]) => `"${pkName}": "${ver}",`)
    //   .join('\n'));
    await deleteOldTar(tarInfos.map(item => new RegExp('^' +
      _.escapeRegExp(item.name.replace('@', '').replace(/[/\\]/g, '-'))
        + '\\-\\d+(?:\\.\\d+){1,2}(?:\\-[^\\-])?\\.tgz$', 'i'
      )),
      tarInfos.map(item => item.filename));
    await changePackageJson(package2tarball);
    await new Promise(resolve => setImmediate(resolve));
    actionDispatcher.scanAndSyncPackages({
      packageJsonFiles: packageDirs.map(dir => Path.resolve(dir, 'package.json'))
    });
  }
}

async function packProject(projectDirs: string[]) {
  const dirs = [] as string[];
  for (const pkg of getPackagesOfProjects(projectDirs)) {
    dirs.push(pkg.realPath);
  }
  await packPackages(dirs);
}

async function publishPackages(packageDirs: string[], npmCliOpts: string[]) {
  if (packageDirs && packageDirs.length > 0) {
    const pgPaths: string[] = packageDirs;

    await queueUp(4, pgPaths.map(packageDir => async () => {
      try {
        log.info(`publishing ${packageDir}`);
        const params = ['publish', ...npmCliOpts, {silent: true, cwd: packageDir}];
        const output = await promisifyExe('npm', ...params);
        log.info(output);
      } catch (e) {
        log.error(e);
      }
    }));
  }
}

async function publishProject(projectDirs: string[], npmCliOpts: string[]) {
  const dirs = [] as string[];
  for (const pkg of getPackagesOfProjects(projectDirs)) {
    dirs.push(pkg.realPath);
  }
  await publishPackages(dirs, npmCliOpts);
}

async function npmPack(packagePath: string):
  Promise<{name: string, filename: string} | null> {
  try {
    const output = await promisifyExe('npm', 'pack', Path.resolve(packagePath),
      {silent: true, cwd: tarballDir});
    const resultInfo = parseNpmPackOutput(output);

    const packageName = resultInfo.get('name')!;
    // cb(packageName, resultInfo.get('filename')!);
    log.info(output);
    return {
      name: packageName,
      filename: resultInfo.get('filename')!
    };
  } catch (e) {
    handleExption(packagePath, e);
    return null;
  }
}

/**
 * @param package2tarball 
 */
function changePackageJson(packageTarballMap: Map<string, string>) {
  const package2tarball = new Map(packageTarballMap);
  // include Root dir
  for (const workspace of _.uniq([
    ...getState().workspaces.keys(), '']).map(dir => Path.resolve(config().rootPath, dir))
  ) {
    const wsDir = Path.resolve(config().rootPath, workspace);
    const jsonFile = Path.resolve(wsDir, 'package.json');
    const pkj = fs.readFileSync(jsonFile, 'utf8');
    const ast = jsonParser(pkj);
    const depsAst = ast.properties.find(({name}) => JSON.parse(name.text) === 'dependencies');
    const devDepsAst = ast.properties.find(({name}) => JSON.parse(name.text) === 'devDependencies');
    const replacements: ReplacementInf[] = [];
    if (depsAst) {
      changeDependencies(depsAst.value as ObjectAst, wsDir, jsonFile, replacements);
    }
    if (devDepsAst) {
      changeDependencies(devDepsAst.value as ObjectAst, wsDir, jsonFile, replacements);
    }

    // if (package2tarball.size > 0) {
    //   const appendToAst = depsAst ? depsAst : devDepsAst;
    //   if (appendToAst == null) {
    //     // There is no dependencies or DevDependencies
    //     replacements.push({replacement: ',\n  dependencies: {\n    ', start: pkj.length - 2, end: pkj.length - 2});
    //     appendRemainderPkgs(pkj.length - 2);
    //     replacements.push({replacement: '\n  }\n', start: pkj.length - 2, end: pkj.length - 2});
    //   } else {
    //     let appendPos = (appendToAst.value).end - 1;
    //     const existingEntries = (appendToAst.value as ObjectAst).properties;
    //     if (existingEntries.length > 0) {
    //       appendPos = existingEntries[existingEntries.length - 1].value.end;
    //     }
    //     replacements.push({
    //       replacement: ',\n    ', start: appendPos, end: appendPos
    //     });
    //     appendRemainderPkgs(appendPos);
    //     replacements.push({
    //       replacement: '\n', start: appendPos, end: appendPos
    //     });
    //   }
    // }

    // function appendRemainderPkgs(appendPos: number) {
    //   let i = 1;
    //   for (const [pkName, tarFile] of package2tarball) {
    //     let newVersion = Path.relative(wsDir, tarFile).replace(/\\/g, '/');
    //     log.info(`Append ${jsonFile}: "${pkName}": ${newVersion}`);

    //     if (!newVersion.startsWith('.')) {
    //       newVersion = './' + newVersion;
    //     }
    //     replacements.push({
    //       replacement: `"${pkName}": ${newVersion}`, start: appendPos, end: appendPos
    //     });
    //     if (i !== package2tarball.size) {
    //       replacements.push({
    //         replacement: ',\n    ', start: appendPos, end: appendPos
    //       });
    //     }
    //     i++;
    //   }
    // }


    if (replacements.length > 0) {
      const replaced = replaceCode(pkj, replacements);
      // tslint:disable-next-line: no-console
      log.info(`Updated ${jsonFile}\n`, replaced);
      fs.writeFileSync(jsonFile, replaced);
    }
  }
  function changeDependencies(deps: ObjectAst, wsDir: string, jsonFile: string, replacements: ReplacementInf[]) {
    // console.log(deps.properties.map(prop => prop.name.text + ':' + (prop.value as Token).text));
    // console.log(Array.from(package2tarball.entries()));
    const foundDeps = deps.properties.filter(({name}) => package2tarball.has(JSON.parse(name.text)));
    for (const foundDep of foundDeps) {
      const verToken = foundDep.value as Token;
      const pkName = JSON.parse(foundDep.name.text);
      const tarFile = package2tarball.get(pkName);
      let newVersion = Path.relative(wsDir, tarFile!).replace(/\\/g, '/');
      if (!newVersion.startsWith('.')) {
        newVersion = './' + newVersion;
      }
      log.info(`Update ${jsonFile}: ${verToken.text} => ${newVersion}`);
      replacements.push({
        start: verToken.pos,
        end: verToken.end!,
        text: JSON.stringify(newVersion)
      });
      // package2tarball.delete(pkName);
    }
  }
}

function handleExption(packagePath: string, e: Error) {
  if (e && e.message && e.message.indexOf('EPUBLISHCONFLICT') > 0)
    log.info(`npm pack ${packagePath}: EPUBLISHCONFLICT.`);
  else
    log.error(packagePath, e);
}

/**
 * 
 * @param output 
 * e.g.
npm notice === Tarball Details === 
npm notice name:          require-injector                        
npm notice version:       5.1.5                                   
npm notice filename:      require-injector-5.1.5.tgz              
npm notice package size:  56.9 kB                                 
npm notice unpacked size: 229.1 kB                                
npm notice shasum:        c0693270c140f65a696207ab9deb18e64452a02c
npm notice integrity:     sha512-kRGVWcw1fvQ5J[...]ABwLPU8UvStbA==
npm notice total files:   47                                      
npm notice 

 */
function parseNpmPackOutput(output: string) {
  const lines = output.split(/\r?\n/);
  const linesOffset = _.findLastIndex(lines, line => line.indexOf('Tarball Details') >= 0);
  const tarballInfo = new Map<string, string>();
  lines.slice(linesOffset).forEach(line => {
    const match = /npm notice\s+([^:]+)[:]\s*(.+?)\s*$/.exec(line);
    if (!match)
      return null;
    return tarballInfo.set(match[1], match[2]);
  });
  return tarballInfo;
}

export const testable = {parseNpmPackOutput};

function deleteOldTar(deleteFileReg: RegExp[], keepfiles: string[]) {
  // log.warn(deleteFileReg, keepfiles);
  const tarSet = new Set(keepfiles);
  const deleteDone: Promise<any>[] = [];

  if (!fs.existsSync(tarballDir))
    fsext.mkdirpSync(tarballDir);
  // TODO: wait for timeout
  for (const file of fs.readdirSync(tarballDir)) {
    if (!tarSet.has(file) && deleteFileReg.some(reg => reg.test(file))) {
      log.warn('Remove ' + file);
      deleteDone.push(fs.promises.unlink(Path.resolve(tarballDir, file)));
    }
  }
  return Promise.all(deleteDone);
}
