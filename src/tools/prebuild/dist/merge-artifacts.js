"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrBranchName = exports.mergeBack = exports.prepare = void 0;
// tslint:disable: curly
const process_utils_1 = require("@wfh/plink/wfh/dist/process-utils");
const dist_1 = require("@wfh/plink/wfh/dist");
const path_1 = require("path");
const fs_extra_1 = __importDefault(require("fs-extra"));
const __api_1 = __importDefault(require("__api"));
const log = require('log4js').getLogger('merge-artifacts');
const rootDir = dist_1.getRootDir();
const tempDir = path_1.resolve(rootDir, 'dist/merge-temp');
const envs = ['local', 'dev', 'test', 'stage', 'prod'];
function prepare() {
    return __awaiter(this, void 0, void 0, function* () {
        const setting = __api_1.default.config()['@wfh/prebuild'];
        let releaseBranch = setting.prebuildReleaseBranch;
        const releaseRemote = setting.prebuildGitRemote;
        // await checkRemote();
        yield process_utils_1.spawn('git', 'fetch', releaseRemote, { cwd: rootDir }).promise;
        const currBranch = yield getCurrBranchName();
        if (currBranch === releaseBranch) {
            // tslint:disable-next-line: no-console
            console.log('Current branch is release-server which should not be your build targeting branch,\nplease checkout another branch to procede!');
            throw new Error('please checkout another branch to procede!');
        }
        try {
            yield process_utils_1.spawn('git', 'branch', '-D', releaseBranch, { cwd: rootDir }).promise;
        }
        catch (e) { }
        yield cleanupRepo();
        yield process_utils_1.spawn('git', 'checkout', '-b', releaseBranch, releaseRemote + '/' + releaseBranch, { cwd: rootDir }).promise;
        if (fs_extra_1.default.existsSync(tempDir)) {
            fs_extra_1.default.removeSync(tempDir);
        }
        fs_extra_1.default.mkdirpSync(tempDir);
        for (const env of envs) {
            mvDir('install-' + env);
            mvDir('server-content-' + env);
            const checksumFile = path_1.resolve(rootDir, `checksum.${env}.json`);
            if (fs_extra_1.default.existsSync(checksumFile)) {
                const newName = path_1.resolve(tempDir, path_1.basename(checksumFile));
                fs_extra_1.default.renameSync(checksumFile, newName);
            }
        }
        function mvDir(targetDirName) {
            const dir = path_1.resolve(rootDir, targetDirName);
            if (fs_extra_1.default.existsSync(dir)) {
                const newName = path_1.resolve(tempDir, targetDirName);
                log.info(`move ${dir} to ${newName}`);
                fs_extra_1.default.renameSync(dir, newName);
            }
        }
        yield process_utils_1.spawn('git', 'checkout', currBranch, { cwd: rootDir }).promise;
    });
}
exports.prepare = prepare;
function cleanupRepo() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield process_utils_1.spawn('git', 'reset', '--hard', 'HEAD', { cwd: rootDir }).promise;
        }
        catch (e) {
        }
        try {
            yield process_utils_1.spawn('git', 'clean', '-f', '-d', { cwd: rootDir }).promise;
        }
        catch (e) {
        }
    });
}
function mergeBack() {
    log.info('merge artifacts');
    for (const env of envs) {
        mergeDir('install-' + env);
        mergeDir('server-content-' + env);
    }
    function mergeDir(targetDirName) {
        const dir = path_1.resolve(tempDir, targetDirName);
        if (fs_extra_1.default.existsSync(dir)) {
            const tempFiles = fs_extra_1.default.readdirSync(dir);
            const installDir = path_1.resolve(rootDir, targetDirName);
            fs_extra_1.default.mkdirpSync(installDir);
            for (const file of tempFiles) {
                if (fs_extra_1.default.existsSync(path_1.resolve(installDir, file))) {
                    log.info(`${path_1.resolve(installDir, file)} exists, delete`);
                    fs_extra_1.default.removeSync(path_1.resolve(installDir, file));
                }
                fs_extra_1.default.renameSync(path_1.resolve(dir, file), path_1.resolve(installDir, file));
                log.info(`move ${path_1.resolve(dir, file)} to ${path_1.resolve(installDir, file)}`);
            }
        }
    }
    const files = fs_extra_1.default.readdirSync(tempDir);
    for (const file of files) {
        if (!/^checksum\.[^.]+\.json$/.test(file)) {
            continue;
        }
        const existing = path_1.resolve(rootDir, file);
        if (fs_extra_1.default.existsSync(existing))
            fs_extra_1.default.removeSync(existing);
        fs_extra_1.default.renameSync(path_1.resolve(tempDir, file), existing);
    }
}
exports.mergeBack = mergeBack;
function getCurrBranchName() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield process_utils_1.spawn('git', 'status', { cwd: rootDir, silent: true }).promise;
        let currBranch;
        [/^On branch (.*)$/m, /^HEAD detached at (\S+)$/m].some(reg => {
            const m = reg.exec(res);
            if (m) {
                currBranch = m[1];
                return true;
            }
            return false;
        });
        if (currBranch == null) {
            throw new Error(`Can not understand which is current branch:\n ${res}`);
        }
        return currBranch;
    });
}
exports.getCurrBranchName = getCurrBranchName;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2UtYXJ0aWZhY3RzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVyZ2UtYXJ0aWZhY3RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHdCQUF3QjtBQUN4QixxRUFBd0Q7QUFDeEQsOENBQStDO0FBQy9DLCtCQUF1QztBQUN2Qyx3REFBMEI7QUFDMUIsa0RBQXdCO0FBRXhCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUUzRCxNQUFNLE9BQU8sR0FBRyxpQkFBVSxFQUFFLENBQUM7QUFDN0IsTUFBTSxPQUFPLEdBQUcsY0FBTyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBRXBELE1BQU0sSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRXZELFNBQXNCLE9BQU87O1FBQzNCLE1BQU0sT0FBTyxHQUFHLGVBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM5QyxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUM7UUFDbEQsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1FBRWhELHVCQUF1QjtRQUV2QixNQUFNLHFCQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFFbkUsTUFBTSxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsRUFBRSxDQUFDO1FBRTdDLElBQUksVUFBVSxLQUFLLGFBQWEsRUFBRTtZQUNoQyx1Q0FBdUM7WUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQywrSEFBK0gsQ0FBQyxDQUFDO1lBQzdJLE1BQU0sSUFBSSxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FB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RTtZQUN6QyxTQUFTO1NBQ1Y7UUFDRCxNQUFNLFFBQVEsR0FBRyxjQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3hDLElBQUksa0JBQUUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO1lBQ3pCLGtCQUFFLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzFCLGtCQUFFLENBQUMsVUFBVSxDQUFDLGNBQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDakQ7QUFDSCxDQUFDO0FBbENELDhCQWtDQztBQUVELFNBQXNCLGlCQUFpQjs7UUFDckMsTUFBTSxHQUFHLEdBQUcsTUFBTSxxQkFBSyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztRQUMvRSxJQUFJLFVBQThCLENBQUM7UUFDbkMsQ0FBQyxtQkFBbUIsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUM1RCxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3hCLElBQUksQ0FBQyxFQUFFO2dCQUNMLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO1lBQ3RCLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELEdBQUcsRUFBRSxDQUFDLENBQUM7U0FDekU7UUFDRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQUE7QUFmRCw4Q0FlQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHRzbGludDpkaXNhYmxlOiBjdXJseVxuaW1wb3J0IHtzcGF3bn0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC9wcm9jZXNzLXV0aWxzJztcbmltcG9ydCB7Z2V0Um9vdERpcn0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdCc7XG5pbXBvcnQge3Jlc29sdmUsIGJhc2VuYW1lfSBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcy1leHRyYSc7XG5pbXBvcnQgYXBpIGZyb20gJ19fYXBpJztcblxuY29uc3QgbG9nID0gcmVxdWlyZSgnbG9nNGpzJykuZ2V0TG9nZ2VyKCdtZXJnZS1hcnRpZmFjdHMnKTtcblxuY29uc3Qgcm9vdERpciA9IGdldFJvb3REaXIoKTtcbmNvbnN0IHRlbXBEaXIgPSByZXNvbHZlKHJvb3REaXIsICdkaXN0L21lcmdlLXRlbXAnKTtcblxuY29uc3QgZW52cyA9IFsnbG9jYWwnLCAnZGV2JywgJ3Rlc3QnLCAnc3RhZ2UnLCAncHJvZCddO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlcGFyZSgpIHtcbiAgY29uc3Qgc2V0dGluZyA9IGFwaS5jb25maWcoKVsnQHdmaC9wcmVidWlsZCddO1xuICBsZXQgcmVsZWFzZUJyYW5jaCA9IHNldHRpbmcucHJlYnVpbGRSZWxlYXNlQnJhbmNoO1xuICBjb25zdCByZWxlYXNlUmVtb3RlID0gc2V0dGluZy5wcmVidWlsZEdpdFJlbW90ZTtcblxuICAvLyBhd2FpdCBjaGVja1JlbW90ZSgpO1xuXG4gIGF3YWl0IHNwYXduKCdnaXQnLCAnZmV0Y2gnLCByZWxlYXNlUmVtb3RlLCB7Y3dkOiByb290RGlyfSkucHJvbWlzZTtcblxuICBjb25zdCBjdXJyQnJhbmNoID0gYXdhaXQgZ2V0Q3VyckJyYW5jaE5hbWUoKTtcblxuICBpZiAoY3VyckJyYW5jaCA9PT0gcmVsZWFzZUJyYW5jaCkge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdDdXJyZW50IGJyYW5jaCBpcyByZWxlYXNlLXNlcnZlciB3aGljaCBzaG91bGQgbm90IGJlIHlvdXIgYnVpbGQgdGFyZ2V0aW5nIGJyYW5jaCxcXG5wbGVhc2UgY2hlY2tvdXQgYW5vdGhlciBicmFuY2ggdG8gcHJvY2VkZSEnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsZWFzZSBjaGVja291dCBhbm90aGVyIGJyYW5jaCB0byBwcm9jZWRlIScpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBhd2FpdCBzcGF3bignZ2l0JywgJ2JyYW5jaCcsICctRCcsIHJlbGVhc2VCcmFuY2gsIHtjd2Q6IHJvb3REaXJ9KS5wcm9taXNlO1xuICB9IGNhdGNoIChlKSB7fVxuICBhd2FpdCBjbGVhbnVwUmVwbygpO1xuXG4gIGF3YWl0IHNwYXduKCdnaXQnLCAnY2hlY2tvdXQnLCAnLWInLCByZWxlYXNlQnJhbmNoLCByZWxlYXNlUmVtb3RlICsgJy8nICsgcmVsZWFzZUJyYW5jaCwge2N3ZDogcm9vdERpcn0pLnByb21pc2U7XG4gIGlmIChmcy5leGlzdHNTeW5jKHRlbXBEaXIpKSB7XG4gICAgZnMucmVtb3ZlU3luYyh0ZW1wRGlyKTtcbiAgfVxuICBmcy5ta2RpcnBTeW5jKHRlbXBEaXIpO1xuICBmb3IgKGNvbnN0IGVudiBvZiBlbnZzKSB7XG4gICAgbXZEaXIoJ2luc3RhbGwtJyArIGVudik7XG4gICAgbXZEaXIoJ3NlcnZlci1jb250ZW50LScgKyBlbnYpO1xuXG4gICAgY29uc3QgY2hlY2tzdW1GaWxlID0gcmVzb2x2ZShyb290RGlyLCBgY2hlY2tzdW0uJHtlbnZ9Lmpzb25gKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhjaGVja3N1bUZpbGUpKSB7XG4gICAgICBjb25zdCBuZXdOYW1lID0gcmVzb2x2ZSh0ZW1wRGlyLCBiYXNlbmFtZShjaGVja3N1bUZpbGUpKTtcbiAgICAgIGZzLnJlbmFtZVN5bmMoY2hlY2tzdW1GaWxlLCBuZXdOYW1lKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtdkRpcih0YXJnZXREaXJOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBkaXIgPSByZXNvbHZlKHJvb3REaXIsIHRhcmdldERpck5hbWUpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGRpcikpIHtcbiAgICAgIGNvbnN0IG5ld05hbWUgPSByZXNvbHZlKHRlbXBEaXIsIHRhcmdldERpck5hbWUpO1xuICAgICAgbG9nLmluZm8oYG1vdmUgJHtkaXJ9IHRvICR7bmV3TmFtZX1gKTtcbiAgICAgIGZzLnJlbmFtZVN5bmMoZGlyLCBuZXdOYW1lKTtcbiAgICB9XG4gIH1cbiAgYXdhaXQgc3Bhd24oJ2dpdCcsICdjaGVja291dCcsIGN1cnJCcmFuY2gsIHtjd2Q6IHJvb3REaXJ9KS5wcm9taXNlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBjbGVhbnVwUmVwbygpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBzcGF3bignZ2l0JywgJ3Jlc2V0JywgJy0taGFyZCcsICdIRUFEJywge2N3ZDogcm9vdERpcn0pLnByb21pc2U7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IHNwYXduKCdnaXQnLCAnY2xlYW4nLCAnLWYnLCAnLWQnLCB7Y3dkOiByb290RGlyfSkucHJvbWlzZTtcbiAgfSBjYXRjaCAoZSkge1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZUJhY2soKSB7XG4gIGxvZy5pbmZvKCdtZXJnZSBhcnRpZmFjdHMnKTtcbiAgZm9yIChjb25zdCBlbnYgb2YgZW52cykge1xuICAgIG1lcmdlRGlyKCdpbnN0YWxsLScgKyBlbnYpO1xuICAgIG1lcmdlRGlyKCdzZXJ2ZXItY29udGVudC0nICsgZW52KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lcmdlRGlyKHRhcmdldERpck5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGRpciA9IHJlc29sdmUodGVtcERpciwgdGFyZ2V0RGlyTmFtZSk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZGlyKSkge1xuICAgICAgY29uc3QgdGVtcEZpbGVzID0gZnMucmVhZGRpclN5bmMoZGlyKTtcbiAgICAgIGNvbnN0IGluc3RhbGxEaXIgPSByZXNvbHZlKHJvb3REaXIsIHRhcmdldERpck5hbWUpO1xuICAgICAgZnMubWtkaXJwU3luYyhpbnN0YWxsRGlyKTtcbiAgICAgIGZvciAoY29uc3QgZmlsZSBvZiB0ZW1wRmlsZXMpIHtcbiAgICAgICAgaWYgKGZzLmV4aXN0c1N5bmMocmVzb2x2ZShpbnN0YWxsRGlyLCBmaWxlKSkpIHtcbiAgICAgICAgICBsb2cuaW5mbyhgJHtyZXNvbHZlKGluc3RhbGxEaXIsIGZpbGUpfSBleGlzdHMsIGRlbGV0ZWApO1xuICAgICAgICAgIGZzLnJlbW92ZVN5bmMocmVzb2x2ZShpbnN0YWxsRGlyLCBmaWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgZnMucmVuYW1lU3luYyhyZXNvbHZlKGRpciwgZmlsZSksIHJlc29sdmUoaW5zdGFsbERpciwgZmlsZSkpO1xuICAgICAgICBsb2cuaW5mbyhgbW92ZSAke3Jlc29sdmUoZGlyLCBmaWxlKX0gdG8gJHtyZXNvbHZlKGluc3RhbGxEaXIsIGZpbGUpfWApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGZpbGVzID0gZnMucmVhZGRpclN5bmModGVtcERpcik7XG4gIGZvciAoY29uc3QgZmlsZSBvZiBmaWxlcykge1xuICAgIGlmICghL15jaGVja3N1bVxcLlteLl0rXFwuanNvbiQvLnRlc3QoZmlsZSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBleGlzdGluZyA9IHJlc29sdmUocm9vdERpciwgZmlsZSk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZXhpc3RpbmcpKVxuICAgICAgZnMucmVtb3ZlU3luYyhleGlzdGluZyk7XG4gICAgZnMucmVuYW1lU3luYyhyZXNvbHZlKHRlbXBEaXIsIGZpbGUpLCBleGlzdGluZyk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1cnJCcmFuY2hOYW1lKCkge1xuICBjb25zdCByZXMgPSBhd2FpdCBzcGF3bignZ2l0JywgJ3N0YXR1cycsIHtjd2Q6IHJvb3REaXIsIHNpbGVudDogdHJ1ZX0pLnByb21pc2U7XG4gIGxldCBjdXJyQnJhbmNoOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIFsvXk9uIGJyYW5jaCAoLiopJC9tLCAvXkhFQUQgZGV0YWNoZWQgYXQgKFxcUyspJC9tXS5zb21lKHJlZyA9PiB7XG4gICAgY29uc3QgbSA9IHJlZy5leGVjKHJlcyk7XG4gICAgaWYgKG0pIHtcbiAgICAgIGN1cnJCcmFuY2ggPSBtWzFdO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG4gIGlmIChjdXJyQnJhbmNoID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYENhbiBub3QgdW5kZXJzdGFuZCB3aGljaCBpcyBjdXJyZW50IGJyYW5jaDpcXG4gJHtyZXN9YCk7XG4gIH1cbiAgcmV0dXJuIGN1cnJCcmFuY2g7XG59XG4iXX0=