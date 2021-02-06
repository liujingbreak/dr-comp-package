import {ConfigHandler, DrcpSettings, InjectorConfigHandler} from '@wfh/plink';

const workspaceSetting: ConfigHandler & InjectorConfigHandler = {
  /** Change settings of Plink and other Plink compliant packages */
  onConfig(setting: DrcpSettings, cliOpt: NonNullable<DrcpSettings['cliOptions']>): void {
    // Run command "plink setting" to see details of setting properties
    //
    // default setting value:
    // $__settingValue__$

    // TODO: modify value of "setting"
  },
  /** For Node.js runtime, replace module in "require()" or import syntax */
  setupNodeInjector(factory, setting) {
    // factory.fromPackage('@wfh/foobar').alias('moduleA', 'moduleB');
  },
  /** For Client framework build tool (React, Angular), replace module in "require()" or import syntax */
  setupWebInjector(factory, setting) {
    // factory.fromPackage('@wfh/foobar').alias('moduleA', 'moduleB');
  }
};

export default workspaceSetting;
