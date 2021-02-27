"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.generateSetting = void 0;
const plink_1 = require("@wfh/plink");
const template_gen_1 = __importDefault(require("@wfh/plink/wfh/dist/template-gen"));
const package_mgr_1 = require("@wfh/plink/wfh/dist/package-mgr");
const ts_cmd_1 = require("@wfh/plink/wfh/dist/ts-cmd");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const __plink_1 = __importDefault(require("__plink"));
const lodash_1 = __importDefault(require("lodash"));
function generateSetting(pkgs, opt) {
    return __awaiter(this, void 0, void 0, function* () {
        if (opt.dryRun) {
            __plink_1.default.logger.info('Dryrun mode');
        }
        const pkgsInfo = Array.from(plink_1.findPackagesByNames(pkgs));
        let i = 0;
        const pkgInfoWithJsonFiles = yield Promise.all(pkgsInfo.map((pkgInfo) => __awaiter(this, void 0, void 0, function* () {
            if (pkgInfo == null) {
                __plink_1.default.logger.error(`Package not found: ${pkgs[i]}`);
                return null;
            }
            let camelCased = pkgInfo.shortName.replace(/-([^])/g, (match, g1) => g1.toUpperCase());
            const upperCaseFirstName = camelCased.charAt(0).toUpperCase() + camelCased.slice(1) + 'Setting';
            const json = lodash_1.default.cloneDeep(pkgInfo.json);
            const pkgjsonProp = json.dr || json.plink;
            if (pkgjsonProp.setting) {
                __plink_1.default.logger.warn(`There has been an existing "${pkgInfo.json.dr ? 'dr' : 'plink'}.setting" in ${pkgInfo.realPath}/package.json file`);
                return null;
            }
            pkgjsonProp.setting = {
                value: `isom/${pkgInfo.shortName}-setting.js#defaultSetting`,
                type: `isom/${pkgInfo.shortName}-setting#` + upperCaseFirstName
            };
            const pkgjsonStr = JSON.stringify(json, null, '  ');
            const pkgjsonFile = path_1.default.resolve(pkgInfo.realPath, 'package.json');
            let jsonDone;
            if (opt.dryRun) {
                __plink_1.default.logger.info(`Will write file ${pkgjsonFile}:\n` + pkgjsonStr);
                jsonDone = Promise.resolve();
            }
            else {
                jsonDone = fs_1.default.promises.writeFile(pkgjsonFile, pkgjsonStr);
                __plink_1.default.logger.info(`Write file ${pkgjsonFile}`);
            }
            const filesDone = template_gen_1.default(path_1.default.resolve(__dirname, '../../template-gsetting'), path_1.default.resolve(pkgInfo.realPath, 'isom'), {
                fileMapping: [
                    [/foobar/g, pkgInfo.shortName]
                ],
                textMapping: {
                    foobarPackage: pkgInfo.name,
                    foobar: camelCased,
                    Foobar: camelCased.charAt(0).toUpperCase() + camelCased.slice(1)
                }
            }, { dryrun: opt.dryRun });
            yield Promise.all([jsonDone, filesDone]);
            return [pkgInfo, pkgjsonFile];
        })));
        if (!opt.dryRun) {
            const meta = pkgInfoWithJsonFiles.filter(item => item != null);
            if (meta.length === 0)
                return;
            ts_cmd_1.tsc({
                package: meta.map(item => item[0].name)
            });
            yield new Promise(resolve => setImmediate(resolve));
            yield Promise.resolve().then(() => __importStar(require('@wfh/plink/wfh/dist/editor-helper')));
            package_mgr_1.actionDispatcher.scanAndSyncPackages({ packageJsonFiles: meta.map(item => item[1])
            });
        }
    });
}
exports.generateSetting = generateSetting;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpLWdzZXR0aW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2xpLWdzZXR0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxzQ0FBaUQ7QUFFakQsb0ZBQWlFO0FBQ2pFLGlFQUE4RTtBQUM5RSx1REFBK0M7QUFDL0MsNENBQW9CO0FBQ3BCLGdEQUF3QjtBQUN4QixzREFBNEI7QUFDNUIsb0RBQXVCO0FBRXZCLFNBQXNCLGVBQWUsQ0FBQyxJQUFjLEVBQUUsR0FBc0I7O1FBQzFFLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRTtZQUNkLGlCQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUNsQztRQUNELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsMkJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN2RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDVixNQUFNLG9CQUFvQixHQUN4QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFNLE9BQU8sRUFBQyxFQUFFO1lBQy9DLElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtnQkFDbkIsaUJBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNwRCxPQUFPLElBQUksQ0FBQzthQUNiO1lBRUQsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7WUFDdkYsTUFBTSxrQkFBa0IsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxHQUFHLFVB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QUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO2FBQ3pDLENBQUMsQ0FBQztZQUNILE1BQU0sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUNwRCx3REFBYSxtQ0FBbUMsR0FBQyxDQUFDO1lBQ2xELDhCQUFnQixDQUFDLG1CQUFtQixDQUFDLEVBQUMsZ0JBQWdCLEVBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0NBQUE7QUFwRUQsMENBb0VDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZmluZFBhY2thZ2VzQnlOYW1lcyB9IGZyb20gJ0B3ZmgvcGxpbmsnO1xuaW1wb3J0IHsgV2l0aFBhY2thZ2VTZXR0aW5nUHJvcCB9IGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvY29uZmlnJztcbmltcG9ydCBnZW5lcmF0ZVN0cnVjdHVyZSBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3RlbXBsYXRlLWdlbic7XG5pbXBvcnQge2FjdGlvbkRpc3BhdGNoZXIsIFBhY2thZ2VJbmZvfSBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3BhY2thZ2UtbWdyJztcbmltcG9ydCB7dHNjfSBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3RzLWNtZCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IFBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgcGxpbmsgZnJvbSAnX19wbGluayc7XG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVTZXR0aW5nKHBrZ3M6IHN0cmluZ1tdLCBvcHQ6IHtkcnlSdW46IGJvb2xlYW59KSB7XG4gIGlmIChvcHQuZHJ5UnVuKSB7XG4gICAgcGxpbmsubG9nZ2VyLmluZm8oJ0RyeXJ1biBtb2RlJyk7XG4gIH1cbiAgY29uc3QgcGtnc0luZm8gPSBBcnJheS5mcm9tKGZpbmRQYWNrYWdlc0J5TmFtZXMocGtncykpO1xuICBsZXQgaSA9IDA7XG4gIGNvbnN0IHBrZ0luZm9XaXRoSnNvbkZpbGVzOiBBcnJheTxbcGtnOiBQYWNrYWdlSW5mbywganNvbkZpbGU6IHN0cmluZ10gfCBudWxsPiA9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocGtnc0luZm8ubWFwKGFzeW5jIHBrZ0luZm8gPT4ge1xuICAgIGlmIChwa2dJbmZvID09IG51bGwpIHtcbiAgICAgIHBsaW5rLmxvZ2dlci5lcnJvcihgUGFja2FnZSBub3QgZm91bmQ6ICR7cGtnc1tpXX1gKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBjYW1lbENhc2VkID0gcGtnSW5mby5zaG9ydE5hbWUucmVwbGFjZSgvLShbXl0pL2csIChtYXRjaCwgZzEpID0+IGcxLnRvVXBwZXJDYXNlKCkpO1xuICAgIGNvbnN0IHVwcGVyQ2FzZUZpcnN0TmFtZSA9IGNhbWVsQ2FzZWQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyBjYW1lbENhc2VkLnNsaWNlKDEpICsgJ1NldHRpbmcnO1xuXG4gICAgY29uc3QganNvbiA9IF8uY2xvbmVEZWVwKHBrZ0luZm8uanNvbik7XG4gICAgY29uc3QgcGtnanNvblByb3A6IFdpdGhQYWNrYWdlU2V0dGluZ1Byb3AgPSBqc29uLmRyIHx8IGpzb24ucGxpbms7XG4gICAgaWYgKHBrZ2pzb25Qcm9wLnNldHRpbmcpIHtcbiAgICAgIHBsaW5rLmxvZ2dlci53YXJuKGBUaGVyZSBoYXMgYmVlbiBhbiBleGlzdGluZyBcIiR7cGtnSW5mby5qc29uLmRyID8gJ2RyJyA6ICdwbGluayd9LnNldHRpbmdcIiBpbiAke3BrZ0luZm8ucmVhbFBhdGh9L3BhY2thZ2UuanNvbiBmaWxlYCk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBwa2dqc29uUHJvcC5zZXR0aW5nID0ge1xuICAgICAgdmFsdWU6IGBpc29tLyR7cGtnSW5mby5zaG9ydE5hbWV9LXNldHRpbmcuanMjZGVmYXVsdFNldHRpbmdgLFxuICAgICAgdHlwZTogYGlzb20vJHtwa2dJbmZvLnNob3J0TmFtZX0tc2V0dGluZyNgICsgdXBwZXJDYXNlRmlyc3ROYW1lXG4gICAgfTtcblxuICAgIGNvbnN0IHBrZ2pzb25TdHIgPSBKU09OLnN0cmluZ2lmeShqc29uLCBudWxsLCAnICAnKTtcbiAgICBjb25zdCBwa2dqc29uRmlsZSA9IFBhdGgucmVzb2x2ZShwa2dJbmZvLnJlYWxQYXRoLCAncGFja2FnZS5qc29uJyk7XG5cbiAgICBsZXQganNvbkRvbmU6IFByb21pc2U8YW55PjtcbiAgICBpZiAob3B0LmRyeVJ1bikge1xuICAgICAgcGxpbmsubG9nZ2VyLmluZm8oYFdpbGwgd3JpdGUgZmlsZSAke3BrZ2pzb25GaWxlfTpcXG5gICsgcGtnanNvblN0cik7XG4gICAgICBqc29uRG9uZSA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBqc29uRG9uZSA9IGZzLnByb21pc2VzLndyaXRlRmlsZShwa2dqc29uRmlsZSwgcGtnanNvblN0cik7XG4gICAgICBwbGluay5sb2dnZXIuaW5mbyhgV3JpdGUgZmlsZSAke3BrZ2pzb25GaWxlfWApO1xuICAgIH1cblxuICAgIGNvbnN0IGZpbGVzRG9uZSA9IGdlbmVyYXRlU3RydWN0dXJlKFBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi90ZW1wbGF0ZS1nc2V0dGluZycpLFxuICAgICAgUGF0aC5yZXNvbHZlKHBrZ0luZm8ucmVhbFBhdGgsICdpc29tJyksIHtcbiAgICAgICAgZmlsZU1hcHBpbmc6IFtcbiAgICAgICAgICBbL2Zvb2Jhci9nLCBwa2dJbmZvLnNob3J0TmFtZV1cbiAgICAgICAgXSxcbiAgICAgICAgdGV4dE1hcHBpbmc6IHtcbiAgICAgICAgICBmb29iYXJQYWNrYWdlOiBwa2dJbmZvLm5hbWUsXG4gICAgICAgICAgZm9vYmFyOiBjYW1lbENhc2VkLFxuICAgICAgICAgIEZvb2JhcjogY2FtZWxDYXNlZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIGNhbWVsQ2FzZWQuc2xpY2UoMSlcbiAgICAgICAgfVxuICAgICAgfSwge2RyeXJ1bjogb3B0LmRyeVJ1bn0pO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKFtqc29uRG9uZSwgZmlsZXNEb25lXSk7XG4gICAgcmV0dXJuIFtwa2dJbmZvLCBwa2dqc29uRmlsZV0gYXMgW3BrZzogUGFja2FnZUluZm8sIGpzb25GaWxlOiBzdHJpbmddO1xuICB9KSk7XG5cbiAgaWYgKCFvcHQuZHJ5UnVuKSB7XG4gICAgY29uc3QgbWV0YSA9IHBrZ0luZm9XaXRoSnNvbkZpbGVzLmZpbHRlcihpdGVtID0+IGl0ZW0gIT0gbnVsbCk7XG4gICAgaWYgKG1ldGEubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuO1xuICAgIHRzYyh7XG4gICAgICBwYWNrYWdlOiBtZXRhLm1hcChpdGVtID0+IGl0ZW0hWzBdLm5hbWUpXG4gICAgfSk7XG4gICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRJbW1lZGlhdGUocmVzb2x2ZSkpO1xuICAgIGF3YWl0IGltcG9ydCgnQHdmaC9wbGluay93ZmgvZGlzdC9lZGl0b3ItaGVscGVyJyk7XG4gICAgYWN0aW9uRGlzcGF0Y2hlci5zY2FuQW5kU3luY1BhY2thZ2VzKHtwYWNrYWdlSnNvbkZpbGVzOlxuICAgICAgbWV0YS5tYXAoaXRlbSA9PiBpdGVtIVsxXSlcbiAgICB9KTtcbiAgfVxufVxuIl19