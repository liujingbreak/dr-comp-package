import {PlinkEnv} from '../node-path';
import Path from 'path';
import {stateFactory} from '../store';
import * as op from 'rxjs/operators';
import * as rx from 'rxjs';
import { GlobalOptions } from '../cmd/types';
import {PayloadAction} from '@reduxjs/toolkit';
import {PackagesConfig} from '_package-settings';
const {distDir, rootDir} = JSON.parse(process.env.__plink!) as PlinkEnv;
export interface BasePlinkSettings {
  /** Node.js server port number */
  port: number | string;
  publicPath: string;
  localIP?: string;
  /**
   * process.env.NODE_ENV will be automatically
   * updated to 'developement' or 'production corresponding to this property
   * */
  devMode: boolean;
  /** default directory is <rootDir>/dist */
  destDir: string;
  /** default directory is <rootDir>/dist/static */
  staticDir: string;
  /** default directory is <rootDir>/dist/server server side render resource directory */
  serverDir: string;
  /** Repository directory */
  rootPath: string;
  /** Node package scope names, omit leading "@" and tailing "/" character,
   * when we type package names in command line, we can omit scope name part,
   * Plink can guess complete package name based on this property
   */
  packageScopes: string[];
  /** Plink command line options */
  cliOptions?: GlobalOptions;
  logger?: {
    noFileLimit: boolean;
    onlyFileOut: boolean;
  };
  /** command line "--prop <json-path>=<json-value>" arguments */
  [cliProp: string]: unknown;
  /** @deprecated */
  outputPathMap: {[pkgName: string]: string};
  /** default is '/' */
  nodeRoutePath: string;
  /** @deprecated */
  staticAssetsURL: string;
  /** @deprecated */
  packageContextPathMapping: {[path: string]: string};
  browserSideConfigProp: string[];
  /** @deprecated */
  enableSourceMaps: boolean;
}

export type DrcpSettings = BasePlinkSettings & PackagesConfig;

const initialState: BasePlinkSettings = {
  port: 14333,
  publicPath: '/',
  devMode: false,
  destDir: distDir,
  staticDir: Path.resolve(distDir, 'static'),
  serverDir: Path.resolve(distDir, 'server'),
  rootPath: rootDir,
  packageScopes: ['wfh', 'bk', 'bk-core', 'dr', 'dr-core', 'types'],
  nodeRoutePath: '/',
  staticAssetsURL: '',
  packageContextPathMapping: {},
  browserSideConfigProp: [],
  enableSourceMaps: true,
  outputPathMap: {}
};

export const configSlice = stateFactory.newSlice({
  name: 'config',
  initialState,
  reducers: {
    saveCliOption(s, {payload}: PayloadAction<GlobalOptions>) {
      s.cliOptions = payload;
      s.devMode = payload.dev === true;
    }
  }
});

export const dispatcher = stateFactory.bindActionCreators(configSlice);

stateFactory.addEpic<{config: BasePlinkSettings}>((action$, state$) => {
  return rx.merge(
    getStore().pipe(
      op.map(s => s.devMode), op.distinctUntilChanged(),
      op.map(devMode => {
        process.env.NODE_ENV = devMode ? 'development' : 'production';
      })
    ),
    action$.pipe(op.filter(action => action.type === 'BEFORE_SAVE_STATE'),
      op.tap(() => dispatcher._change(s => {
        s.cliOptions = undefined;
        s.view = undefined;
      }))
    )
  ).pipe(
    op.catchError((ex, src) => {
      // tslint:disable-next-line: no-console
      console.error(ex);
      return src;
    }),
    op.ignoreElements()
  );
});

export function getState() {
  return stateFactory.sliceState(configSlice);
}

export function getStore() {
  return stateFactory.sliceStore(configSlice);
}