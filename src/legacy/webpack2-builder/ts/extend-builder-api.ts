import api from '__api';
import DrComponent from '@wfh/plink/wfh/dist/packageNodeInstance';
const Webpack = require('webpack');

export interface WebpackConfig {
  [key: string]: any;
}
export interface Webpack2BuilderApi {
  configWebpackLater(execFunc:
    (originalConfig: WebpackConfig, webpack: any) =>WebpackConfig | Promise<WebpackConfig>): void;
  isDrFile(fileSuffix: string | string[],
    compare?: (relPath: string, component: DrComponent) => boolean): void;
  isIssuerAngular(file: string): boolean;
}

export type WebpackConfigFunc =
  (originalConfig: WebpackConfig, webpack: any) => WebpackConfig | Promise<WebpackConfig>;

var newApi: Webpack2BuilderApi = Object.getPrototypeOf(api);
newApi.configWebpackLater = function(this: Webpack2BuilderApi,
  execFunc: WebpackConfigFunc) {

  require('..').tapable.plugin('webpackConfig',
    function(webpackConfig: WebpackConfig, cb: (err: Error | null, config?: WebpackConfig | null) => void) {
      Promise.resolve(execFunc(webpackConfig, Webpack))
      .then((cfg: WebpackConfig) => cb(null, cfg))
      .catch((err: Error) => cb(err, null));
  });
};
