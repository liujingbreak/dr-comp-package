import {FactoryMapInterf} from 'require-injector/dist/factory-map';
// import {RequireInjector} from 'require-injector/dist/replace-require';
import {DrPackageInjector} from './injector-factory';
import _config from './config';
export {DrPackageInjector as InjectorFactory};
export {FactoryMapInterf};

// export interface InjectorFactory extends RequireInjector {
// 	addPackage(name: string, dir: string): void;
// 	fromAllComponents(): FactoryMapInterf;
// 	notFromPackages(excludePackages: string | string[]): FactoryMapInterf;
// }

export interface InjectorConfigHandler {
  setupNodeInjector?(factory: DrPackageInjector): void;
  setupWebInjector?(factory: DrPackageInjector): void;
}

export function doInjectorConfig(factory: DrPackageInjector, isNode = false): Promise<void> {
  const config: typeof _config = require('./config');
  return config.configHandlerMgr().runEach<InjectorConfigHandler>((file: string, lastResult: any, handler) => {
    if (isNode && handler.setupNodeInjector)
      handler.setupNodeInjector(factory);
    else if (!isNode && handler.setupWebInjector)
      handler.setupWebInjector(factory);
  });
}

export function doInjectorConfigSync(factory: DrPackageInjector, isNode = false) {
  const config: typeof _config = require('./config');
  config.configHandlerMgr().runEachSync<InjectorConfigHandler>((file: string, lastResult: any, handler) => {
    if (isNode && handler.setupNodeInjector)
      handler.setupNodeInjector(factory);
    else if (!isNode && handler.setupWebInjector)
      handler.setupWebInjector(factory);
  });
}


type ValueFactory = (sourceFilePath: string, regexpExecRes?: RegExpExecArray) => any;

export interface ReplaceTypeValue {
  replacement: string;
  value: any | ValueFactory;
}
