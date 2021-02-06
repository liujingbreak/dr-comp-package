import {config} from '@wfh/plink';

/**
 * Package setting type
 */
export interface HttpServerSetting {
  noHealthCheck: boolean;
  ssl: {
    enabled: boolean;
    key: string;
    cert: string;
    port: number;
    httpForward: boolean;
  };
}

/**
 * Plink runs this funtion to get package level setting value
 */
export function defaultSetting(): HttpServerSetting {
  const defaultValue: HttpServerSetting = {
    ssl: {
      enabled: false,
      key: 'key.pem',
      cert: 'cert.pem',
      port: 443,
      httpForward: true
    },
    noHealthCheck: false
  };
  // Return settings based on command line option "dev"
  if (config().cliOptions?.dev) {
    defaultValue.noHealthCheck = true;
  }

  const env = config().cliOptions?.env;
  // Return settings based on command line option "env"
  if (env === 'local') {
    defaultValue.noHealthCheck = true;
  }

  return defaultValue;
}

/**
 * The return setting value is merged with files specified by command line options "--prop" and "-c"
 * @return setting of current package
 */
export function getSetting(): HttpServerSetting {
  // tslint:disable:no-string-literal
  return config()['@wfh/http-server']!;
}
