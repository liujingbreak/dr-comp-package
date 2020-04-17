import express from 'express';

export default interface ExpressAppApi {
  express: typeof express;
  expressApp: express.Application;
  swig: any;
  use: express.Router['use'];
  router(): express.Router;
  /**
   * Before any system middleware
   * @param callable 
   */
  expressAppSet(callable: (app: express.Application, exp: typeof express) => void): void;
  /**
   * Add middleware after system middleware
   * @param callable 
   */
  expressAppUse(callable: (app: express.Application, exp: typeof express) => void): void;
  cors(): any;

  param(name: string, ...rest: any[]): any;
}
