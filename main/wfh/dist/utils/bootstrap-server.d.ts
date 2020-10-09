import '../node-path';
import { GlobalOptions } from '../cmd/types';
export declare function initConfigAsync(options: GlobalOptions, onShutdownSignal?: () => void | Promise<any>): Promise<void>;
export declare function initConfig(options: GlobalOptions, onShutdownSignal?: () => void | Promise<any>): void;
export { withGlobalOptions } from '../cmd/cli';
export { GlobalOptions };
