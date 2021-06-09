"use strict";
/**
 * This file is not used actually. This is an attempt to patch Tsconfig file of fock-ts-checker-webpack-plugin 4.1.6.
 * The actual working solution is hack-fork-ts-checker.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForkTsCheckerExtend = void 0;
const fork_ts_checker_webpack_plugin_1 = __importDefault(require("fork-ts-checker-webpack-plugin"));
const misc_1 = require("@wfh/plink/wfh/dist/utils/misc");
const package_mgr_1 = require("@wfh/plink/wfh/dist/package-mgr");
const plink_1 = require("@wfh/plink");
const typescript_1 = __importDefault(require("typescript"));
const utils_1 = require("./utils");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// const log = log4File(__filename);
class ForkTsCheckerExtend extends fork_ts_checker_webpack_plugin_1.default {
    constructor(opts) {
        if (opts != null) {
            const plinkRoot = plink_1.plinkEnv.rootDir;
            const rootDir = misc_1.closestCommonParentDir(Array.from(package_mgr_1.getState().project2Packages.keys()).map(prjDir => path_1.default.resolve(plinkRoot, prjDir))).replace(/\\/g, '/');
            const tsconfigJson = typescript_1.default.readConfigFile(opts.tsconfig, (file) => fs_1.default.readFileSync(file, 'utf-8')).config;
            const tsconfigDir = path_1.default.dirname(opts.tsconfig);
            // CRA does not allow we configure "compilerOptions.paths"
            // (see create-react-app/packages/react-scripts/scripts/utils/verifyTypeScriptSetup.js)
            // therefore, initial paths is always empty.
            const pathMapping = tsconfigJson.compilerOptions.paths = {};
            if (tsconfigJson.compilerOptions.baseUrl == null) {
                tsconfigJson.compilerOptions.baseUrl = './';
            }
            for (const [name, { realPath }] of package_mgr_1.getState().srcPackages.entries() || []) {
                const realDir = path_1.default.relative(tsconfigDir, realPath).replace(/\\/g, '/');
                pathMapping[name] = [realDir];
                pathMapping[name + '/*'] = [realDir + '/*'];
            }
            if (package_mgr_1.getState().linkedDrcp) {
                const drcpDir = path_1.default.relative(tsconfigDir, package_mgr_1.getState().linkedDrcp.realPath).replace(/\\/g, '/');
                pathMapping['@wfh/plink'] = [drcpDir];
                pathMapping['@wfh/plink/*'] = [drcpDir + '/*'];
            }
            tsconfigJson.compilerOptions.paths = pathMapping;
            plink_1.setTsCompilerOptForNodePath(tsconfigDir, './', tsconfigJson.compilerOptions, {
                workspaceDir: plink_1.plinkEnv.workDir || process.cwd()
            });
            utils_1.runTsConfigHandlers(tsconfigJson.compilerOptions);
            tsconfigJson.include = [path_1.default.relative(plink_1.plinkEnv.workDir || process.cwd(), process.env._plink_cra_scripts_indexJs)];
            tsconfigJson.compilerOptions.rootDir = rootDir;
            opts.compilerOptions = tsconfigJson.compilerOptions;
        }
        super(opts);
    }
}
exports.ForkTsCheckerExtend = ForkTsCheckerExtend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yay10cy1jaGVja2VyLWV4dGVuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZvcmstdHMtY2hlY2tlci1leHRlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7O0FBRUgsb0dBQXdFO0FBQ3hFLHlEQUFzRTtBQUN0RSxpRUFBeUQ7QUFDekQsc0NBQWlFO0FBQ2pFLDREQUE0QjtBQUM1QixtQ0FBNEM7QUFDNUMsZ0RBQXdCO0FBQ3hCLDRDQUFvQjtBQUNwQixvQ0FBb0M7QUFFcEMsTUFBYSxtQkFBb0IsU0FBUSx3Q0FBMEI7SUFFakUsWUFBWSxJQUFpRTtRQUMzRSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7WUFDaEIsTUFBTSxTQUFTLEdBQUcsZ0JBQVEsQ0FBQyxPQUFPLENBQUM7WUFDbkMsTUFBTSxPQUFPLEdBQUcsNkJBQXNCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDL0Msc0JBQVEsRUFBRSxDQUFDLGdCQUFnQixDQUFpekcsSUFBSSxFQUFFLENBQ2oxRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBRXhFLE1BQU0sWUFBWSxHQUNoQixvQkFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxZQUFFLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNyRixNQUFNLFdBQVcsR0FBRyxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFTLENBQUMsQ0FBQztZQUVqRCwwREFBMEQ7WUFDMUQsdUZBQXVGO1lBQ3ZGLDRDQUE0QztZQUM1QyxNQUFNLFdBQVcsR0FBOEIsWUFBWSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1lBQ3ZGLElBQUksWUFBWSxDQUFDLGVBQWUsQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFO2dCQUNoRCxZQUFZLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7YUFDN0M7WUFDRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUMsQ0FBQyxJQUFJLHNCQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUN2RSxNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN6RSxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUIsV0FBVyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQzthQUM3QztZQUVELElBQUksc0JBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRTtnQkFDekIsTUFBTSxPQUFPLEdBQUcsY0FBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsc0JBQVEsRUFBRSxDQUFDLFVBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNoRyxXQUFXLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO2FBQ2hEO1lBQ0QsWUFBWSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDO1lBRWpELG1DQUEyQixDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRTtnQkFDM0UsWUFBWSxFQUFFLGdCQUFRLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUU7YUFDaEQsQ0FBQyxDQUFDO1lBQ0gsMkJBQW1CLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRWxELFlBQVksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxjQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFRLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEyQixDQUFDLENBQUMsQ0FBQztZQUNuSCxZQUFZLENBQUMsZUFBZSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7WUFDL0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxZQUFZLENBQUMsZUFBZSxDQUFDO1NBQ3JEO1FBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBNUNELGtEQTRDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBmaWxlIGlzIG5vdCB1c2VkIGFjdHVhbGx5LiBUaGlzIGlzIGFuIGF0dGVtcHQgdG8gcGF0Y2ggVHNjb25maWcgZmlsZSBvZiBmb2NrLXRzLWNoZWNrZXItd2VicGFjay1wbHVnaW4gNC4xLjYuXG4gKiBUaGUgYWN0dWFsIHdvcmtpbmcgc29sdXRpb24gaXMgaGFjay1mb3JrLXRzLWNoZWNrZXIudHNcbiAqL1xuXG5pbXBvcnQgRm9ya1RzQ2hlY2tlcldlYnBhY2tQbHVnaW4gZnJvbSAnZm9yay10cy1jaGVja2VyLXdlYnBhY2stcGx1Z2luJztcbmltcG9ydCB7Y2xvc2VzdENvbW1vblBhcmVudERpcn0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC91dGlscy9taXNjJztcbmltcG9ydCB7Z2V0U3RhdGV9IGZyb20gJ0B3ZmgvcGxpbmsvd2ZoL2Rpc3QvcGFja2FnZS1tZ3InO1xuaW1wb3J0IHtzZXRUc0NvbXBpbGVyT3B0Rm9yTm9kZVBhdGgsIHBsaW5rRW52fSBmcm9tICdAd2ZoL3BsaW5rJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7cnVuVHNDb25maWdIYW5kbGVyc30gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG4vLyBjb25zdCBsb2cgPSBsb2c0RmlsZShfX2ZpbGVuYW1lKTtcblxuZXhwb3J0IGNsYXNzIEZvcmtUc0NoZWNrZXJFeHRlbmQgZXh0ZW5kcyBGb3JrVHNDaGVja2VyV2VicGFja1BsdWdpbiB7XG5cbiAgY29uc3RydWN0b3Iob3B0czogQ29uc3RydWN0b3JQYXJhbWV0ZXJzPHR5cGVvZiBGb3JrVHNDaGVja2VyV2VicGFja1BsdWdpbj5bMF0pICB7XG4gICAgaWYgKG9wdHMgIT0gbnVsbCkge1xuICAgICAgY29uc3QgcGxpbmtSb290ID0gcGxpbmtFbnYucm9vdERpcjtcbiAgICAgIGNvbnN0IHJvb3REaXIgPSBjbG9zZXN0Q29tbW9uUGFyZW50RGlyKEFycmF5LmZyb20oXG4gICAgICAgIGdldFN0YXRlKCkucHJvamVjdDJQYWNrYWdlcyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAua2V5cygpXG4gICAgICAgICkubWFwKHByakRpciA9PiBQYXRoLnJlc29sdmUocGxpbmtSb290LCBwcmpEaXIpKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gICAgICBjb25zdCB0c2NvbmZpZ0pzb246IHtjb21waWxlck9wdGlvbnM6IGFueSwgaW5jbHVkZT86IHN0cmluZ1tdfSA9XG4gICAgICAgIHRzLnJlYWRDb25maWdGaWxlKG9wdHMudHNjb25maWchLCAoZmlsZSkgPT4gZnMucmVhZEZpbGVTeW5jKGZpbGUsICd1dGYtOCcpKS5jb25maWc7XG4gICAgICBjb25zdCB0c2NvbmZpZ0RpciA9IFBhdGguZGlybmFtZShvcHRzLnRzY29uZmlnISk7XG5cbiAgICAgIC8vIENSQSBkb2VzIG5vdCBhbGxvdyB3ZSBjb25maWd1cmUgXCJjb21waWxlck9wdGlvbnMucGF0aHNcIlxuICAgICAgLy8gKHNlZSBjcmVhdGUtcmVhY3QtYXBwL3BhY2thZ2VzL3JlYWN0LXNjcmlwdHMvc2NyaXB0cy91dGlscy92ZXJpZnlUeXBlU2NyaXB0U2V0dXAuanMpXG4gICAgICAvLyB0aGVyZWZvcmUsIGluaXRpYWwgcGF0aHMgaXMgYWx3YXlzIGVtcHR5LlxuICAgICAgY29uc3QgcGF0aE1hcHBpbmc6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX0gPSB0c2NvbmZpZ0pzb24uY29tcGlsZXJPcHRpb25zLnBhdGhzID0ge307XG4gICAgICBpZiAodHNjb25maWdKc29uLmNvbXBpbGVyT3B0aW9ucy5iYXNlVXJsID09IG51bGwpIHtcbiAgICAgICAgdHNjb25maWdKc29uLmNvbXBpbGVyT3B0aW9ucy5iYXNlVXJsID0gJy4vJztcbiAgICAgIH1cbiAgICAgIGZvciAoY29uc3QgW25hbWUsIHtyZWFsUGF0aH1dIG9mIGdldFN0YXRlKCkuc3JjUGFja2FnZXMuZW50cmllcygpIHx8IFtdKSB7XG4gICAgICAgIGNvbnN0IHJlYWxEaXIgPSBQYXRoLnJlbGF0aXZlKHRzY29uZmlnRGlyLCByZWFsUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICBwYXRoTWFwcGluZ1tuYW1lXSA9IFtyZWFsRGlyXTtcbiAgICAgICAgcGF0aE1hcHBpbmdbbmFtZSArICcvKiddID0gW3JlYWxEaXIgKyAnLyonXTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdldFN0YXRlKCkubGlua2VkRHJjcCkge1xuICAgICAgICBjb25zdCBkcmNwRGlyID0gUGF0aC5yZWxhdGl2ZSh0c2NvbmZpZ0RpciwgZ2V0U3RhdGUoKS5saW5rZWREcmNwIS5yZWFsUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgICAgICBwYXRoTWFwcGluZ1snQHdmaC9wbGluayddID0gW2RyY3BEaXJdO1xuICAgICAgICBwYXRoTWFwcGluZ1snQHdmaC9wbGluay8qJ10gPSBbZHJjcERpciArICcvKiddO1xuICAgICAgfVxuICAgICAgdHNjb25maWdKc29uLmNvbXBpbGVyT3B0aW9ucy5wYXRocyA9IHBhdGhNYXBwaW5nO1xuXG4gICAgICBzZXRUc0NvbXBpbGVyT3B0Rm9yTm9kZVBhdGgodHNjb25maWdEaXIsICcuLycsIHRzY29uZmlnSnNvbi5jb21waWxlck9wdGlvbnMsIHtcbiAgICAgICAgd29ya3NwYWNlRGlyOiBwbGlua0Vudi53b3JrRGlyIHx8IHByb2Nlc3MuY3dkKClcbiAgICAgIH0pO1xuICAgICAgcnVuVHNDb25maWdIYW5kbGVycyh0c2NvbmZpZ0pzb24uY29tcGlsZXJPcHRpb25zKTtcblxuICAgICAgdHNjb25maWdKc29uLmluY2x1ZGUgPSBbUGF0aC5yZWxhdGl2ZShwbGlua0Vudi53b3JrRGlyIHx8IHByb2Nlc3MuY3dkKCksIHByb2Nlc3MuZW52Ll9wbGlua19jcmFfc2NyaXB0c19pbmRleEpzISldO1xuICAgICAgdHNjb25maWdKc29uLmNvbXBpbGVyT3B0aW9ucy5yb290RGlyID0gcm9vdERpcjtcbiAgICAgIG9wdHMuY29tcGlsZXJPcHRpb25zID0gdHNjb25maWdKc29uLmNvbXBpbGVyT3B0aW9ucztcbiAgICB9XG4gICAgc3VwZXIob3B0cyk7XG4gIH1cbn1cbiJdfQ==