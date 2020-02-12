import {Application} from 'express';
import os from 'os';
import {Checksum, WithMailServerConfig} from '../fetch-types';
import util from 'util';
import _pm2 from '@growth/pm2';
import {getPm2Info, zipDownloadDir, forkExtractExstingZip, retry} from '../fetch-remote';
import Path from 'path';
import {ImapManager} from '../fetch-remote-imap';
import fs from 'fs-extra';
import _ from 'lodash';
import memstat from 'dr-comp-package/wfh/dist/utils/mem-stats';
import crypto, {Hash} from 'crypto';
import api from '__api';
const log = require('log4js').getLogger('@dr/assets-processer.cd-server');

interface Pm2Packet {
  type: 'process:msg';
  data: {
    pid: number;
    'cd-server:checksum updating'?: ChecksumItem;
    'cd-server:check mail'?: string;
    extractZip?: boolean;
  };
}

interface Pm2Bus {
  on(event: 'process:msg', cb: (packet: Pm2Packet) => void): void;
}

type ChecksumItem = Checksum extends Array<infer I> ? I : unknown;

const requireToken = api.config.get([api.packageName, 'requireToken'], false);
const mailSetting = (api.config.get(api.packageName) as WithMailServerConfig).fetchMailServer;


export async function activate(app: Application, imap: ImapManager) {
  let fwriter: fs.WriteStream | undefined;
  let writingFile: string | undefined;

  let filesHash = readChecksumFile();

  const {isPm2, isMainProcess} = getPm2Info();
  if (isPm2) {
    initPm2();
  }

  imap.appendMail(`server ${os.hostname} ${process.pid} activates`, new Date() + '');

  app.use('/_stat', async (req, res, next) => {
    if (requireToken && req.query.whisper !== generateToken()) {
      res.header('Connection', 'close');
      res.status(401).send(`REJECT from ${os.hostname()} pid: ${process.pid}: Not allowed to push artifact in this environment.`);
      req.socket.end();
      res.connection.end();
      return;
    }

    if (req.method === 'GET' && req.originalUrl === '/_stat' || req.originalUrl === '/_stat/') {
      res.contentType('json');
      res.send(JSON.stringify({
        isMainProcess,
        filesHash: Array.from(filesHash.values()),
        is_pm2_slave: isPm2,
        hostname: os.hostname(),
        pid: process.pid,
        mem: memstat(),
        cpus: os.cpus(),
        arch: os.arch(),
        platform: os.platform(),
        loadavg: os.loadavg()
      }, null, '  '));
    } else {
      next();
    }
  });

  app.use<{file: string, hash: string}>('/_install/:file/:hash', async (req, res, next) => {
    const existing = filesHash.get(req.params.file);
    log.info(`${req.method} [${os.hostname}]file: ${req.params.file}, hash: ${req.params.hash},\nexisting file: ${existing ? existing : '<NO>'}` +
      `\n${util.inspect(req.headers)}`);

    if (req.method === 'PUT') {
      log.info('recieving data');
      if (isPm2 && !isMainProcess) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      if (existing && existing.sha256 === req.params.hash) {
        // I want to cancel recieving request body asap
        // https://stackoverflow.com/questions/18367824/how-to-cancel-http-upload-from-data-events
        res.header('Connection', 'close');
        res.status(409).send(`[REJECT] ${os.hostname()} pid: ${process.pid}:` +
        `- found existing: ${JSON.stringify(existing, null, '  ')}\n` +
        `- hashs:\n  ${JSON.stringify(filesHash, null, '  ')}`);
        req.socket.end();
        res.connection.end();
        return;
      }

      const now = new Date();
      const newChecksumItem: ChecksumItem = {
        file: req.params.file,
        sha256: req.params.hash,
        created: now.toLocaleString(),
        createdTime: now.getTime()
      };

      // checksum.versions![req.params.app] = {version: parseInt(req.params.version, 10)};

      let countBytes = 0;

      let hash: Hash;
      let hashDone: Promise<string>;

      req.on('data', (data: Buffer) => {
        countBytes += data.byteLength;
        if (hash == null) {
          hash = crypto.createHash('sha256');
          hashDone = new Promise(resolve => {
            hash.on('readable', () => {
              const data = hash.read();
              if (data) {
                resolve(data.toString('hex'));
              }
            });
          });
        }
        hash.write(data);

        if (fwriter == null) {
          let fileBaseName = Path.basename(req.params.file);
          const dot = fileBaseName.lastIndexOf('.');
          if (dot >=0 )
            fileBaseName = fileBaseName.slice(0, dot);
          writingFile = Path.resolve(zipDownloadDir, `${fileBaseName.slice(0, fileBaseName.lastIndexOf('.'))}.${process.pid}.zip`);
          fwriter = fs.createWriteStream(writingFile);
        }
        fwriter.write(data);
      });
      req.on('end', async () => {
        log.info(`${writingFile} is written with ${countBytes} bytes`);
        let sha: string | undefined;
        if (hash) {
          hash.end();
          sha = await hashDone;
        }
        if (sha !== newChecksumItem.sha256) {
          res.send(`[WARN] ${os.hostname()} pid: ${process.pid}: ${JSON.stringify(newChecksumItem, null, '  ')}\n` +
            `Recieved file is corrupted with hash ${sha},\nwhile expecting file hash is ${newChecksumItem.sha256}`);
          fwriter!.end(onZipFileWritten);
          fwriter = undefined;
          return;
        }

        fwriter!.end(onZipFileWritten);
        fwriter = undefined;
        res.send(`[ACCEPT] ${os.hostname()} pid: ${process.pid}: ${JSON.stringify(newChecksumItem, null, '  ')}`);

        filesHash.set(newChecksumItem.file, newChecksumItem);
        writeChecksumFile(filesHash);
        if (isPm2) {
          const msg: Pm2Packet = {
            type : 'process:msg',
            data: {
              'cd-server:checksum updating': newChecksumItem,
              pid: process.pid
            }
          };
          process.send!(msg);
        }
      });
    } else {
      next();
    }
  });

  let checkedSeq = '';

  app.use('/_checkmail/:seq', (req, res, next) => {
    log.info('force check mail for:', req.params.seq);
    if (checkedSeq === req.params.seq)
      return;
    if (isPm2 && !isMainProcess) {
      process.send!({
        type : 'process:msg',
        data: {
          'cd-server:check mail': req.params.seq,
          pid: process.pid
        }
      });
    } else {
      imap.checkMailForUpdate();
    }
  });

  app.use('/_time', (req, res) => {
    res.send(generateToken());
  });

  function onZipFileWritten() {
    if (isPm2 && !isMainProcess) {
      const msg: Pm2Packet = {
        type : 'process:msg',
        data: {extractZip: true, pid: process.pid}
      };
      process.send!(msg);
    } else
      retry(2, forkExtractExstingZip);
  }

  async function initPm2() {
    const pm2: typeof _pm2 = require('@growth/pm2');
    const pm2connect = util.promisify(pm2.connect.bind(pm2));
    const pm2launchBus = util.promisify<Pm2Bus>(pm2.launchBus.bind(pm2));

    await pm2connect();
    const bus = await pm2launchBus();
    bus.on('process:msg', packet => {
      if (!packet.data) {
        return;
      }
      const updatedChecksumItem = packet.data['cd-server:checksum updating'];
      if (updatedChecksumItem && packet.data.pid !== process.pid) {
        const recievedChecksum = updatedChecksumItem;
        filesHash.set(recievedChecksum.file, recievedChecksum);
        log.info('Other process recieved updating checksum %s from id: %s',
          util.inspect(recievedChecksum), _.get(packet, 'process.pm_id'));
      }
      const checkMailProp = packet.data['cd-server:check mail'];
      if (checkMailProp && packet.data.pid !== process.pid) {
        checkedSeq = checkMailProp;
        log.info('Other process triggers "check mail" from id:', _.get(packet, 'process.pm_id'));
        // imap.checkMailForUpdate();
      }

      if (packet.data.extractZip && packet.data.pid !== process.pid) {
        log.info('Other process triggers "extractZip" from id:', _.get(packet, 'process.pm_id'));
        retry(2, forkExtractExstingZip);
      }
    });
  }
}

export function generateToken() {
  const date = new Date();
  const token = date.getDate() + '' + date.getHours();
  // tslint:disable-next-line: no-console
  console.log(token);
  return token;
}

function readChecksumFile(): Map<string, ChecksumItem> {
  const env = mailSetting ? mailSetting.env : 'local';
  const checksum = JSON.parse(fs.readFileSync(Path.resolve('checksum.' + env + '.json'), 'utf8')) as Checksum;
  return checksum.reduce((map, val) => map.set(val.file, val), new Map<string, ChecksumItem>());
}

function writeChecksumFile(checksum: ReturnType<typeof readChecksumFile>) {
  const env = mailSetting ? mailSetting.env : 'local';
  fs.writeFile(Path.resolve('checksum.' + env + '.json'), JSON.stringify(Array.from(checksum.values()), null, '  '), (err) => {
    if (err) {
      log.error(err);
    }
  });
}
