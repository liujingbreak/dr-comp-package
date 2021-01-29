import {CliExtension, GlobalOptions, initConfig, initProcess} from '@wfh/plink/wfh/dist';
import generateStructure from '@wfh/plink/wfh/dist/template-gen';
import replaceText from '@wfh/plink/wfh/dist/utils/patch-text';
import {findPackagesByNames} from '@wfh/plink/wfh/dist/cmd/utils';
import {getState} from '@wfh/plink/wfh/dist/package-mgr';
import parse, {ObjectAst} from '@wfh/plink/wfh/dist/utils/json-sync-parser';
import Path from 'path';
import plink from '__plink';
import fs from 'fs';
import chalk from 'chalk';

interface CBOptions extends GlobalOptions {
  forTemplate: boolean;
  dryRun: boolean;
}

const cliExt: CliExtension = (program) => {
  const cmd = program.command('gcmd <package> <command-name>')
  .alias('gen-command')
  .description('Generate a Plink command line implementation in specific package')
  // .option('--for-template <templateName>', 'Create a template generator command', false)
  .option('-d, --dry-run', 'Dryrun', false)
  .action(async (packageName: string, cmdName: string) => {
    initConfig(cmd.opts() as GlobalOptions);
    initProcess();
    generate(packageName, cmdName, cmd.opts() as CBOptions);
  });
};

export default cliExt;

async function generate(packageName: string, cmdName: string, opts: CBOptions) {
  const targetPkgs = Array.from(findPackagesByNames(getState(), [packageName]));
  if (targetPkgs.length === 0) {
    throw new Error(`Can not find package ${packageName}`);
  }
  const targetPkg = targetPkgs[0]!;

  const lowerCaseCmdName = cmdName.toLowerCase();
  const camelCaseCmd = lowerCaseCmdName.replace(/-([a-zA-Z])/g, (match, $1: string) => $1.toUpperCase());
  if (opts.dryRun) {
    plink.logger.warn('Dryrun mode...');
  }
  await generateStructure(Path.resolve(__dirname, '../../template-cligen'),
    Path.resolve(targetPkg.realPath, 'ts'),
    {
      fileMapping: [ [/foobar/g, lowerCaseCmdName] ],
      textMapping: {
        foobar: lowerCaseCmdName,
        foobarId: camelCaseCmd
      }
    }, {dryrun: opts.dryRun});

  const pkJsonFile = Path.resolve(targetPkg.path, 'package.json');

  if (opts.dryRun) {
    plink.logger.info(chalk.cyan(pkJsonFile) + ' will be changed.');
  } else {
    let text = fs.readFileSync(pkJsonFile, 'utf8');
    const objAst = parse(text);
    const plinkProp = objAst.properties.find(prop => prop.name.text === '"dr"')
      || objAst.properties.find(prop => prop.name.text === '"plink"');
    if (plinkProp) {
      const drProp = plinkProp.value as ObjectAst;
      if (drProp.properties.map(item => item.name.text).includes('"cli"')) {
        throw new Error(`${pkJsonFile} has already defined a "cli" property as executable entry`);
      }
      const pkjsonText = replaceText(text, [{
        text: '\n    "cli": "dist/cli.js#default"' + (drProp.properties.length > 0 ? ',' : ''),
        start: drProp.start + 1,
        end: drProp.start + 1
      }]);
      fs.writeFileSync(pkJsonFile, pkjsonText);
      plink.logger.info(chalk.cyan(pkJsonFile) + 'is changed.');
    } else {
      throw new Error(`${pkJsonFile} has no "dr" or "plink" property, is it an valid Plink package?`);
    }
  }
}
