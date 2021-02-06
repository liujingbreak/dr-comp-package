"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeTsConfigFile = void 0;
const misc_1 = require("@wfh/plink/wfh/dist/utils/misc");
const package_mgr_1 = require("@wfh/plink/wfh/dist/package-mgr");
const plink_1 = require("@wfh/plink");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
function changeTsConfigFile() {
    // const craOptions = getCmdOptions();
    const plinkRoot = plink_1.getRootDir();
    const rootDir = misc_1.closestCommonParentDir(Array.from(package_mgr_1.getState().project2Packages.keys()).map(prjDir => path_1.default.resolve(plinkRoot, prjDir))).replace(/\\/g, '/');
    const tsconfigJson = JSON.parse(fs_1.default.readFileSync(process.env._plink_cra_scripts_tsConfig, 'utf8'));
    const tsconfigDir = path_1.default.dirname(process.env._plink_cra_scripts_tsConfig);
    const pathMapping = {};
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
        workspaceDir: process.cwd()
    });
    tsconfigJson.include = [path_1.default.relative(process.cwd(), process.env._plink_cra_scripts_indexJs)];
    tsconfigJson.compilerOptions.rootDir = rootDir;
    // tslint:disable-next-line: no-console
    // console.log('[change-tsconfig] tsconfigJson:', JSON.stringify(tsconfigJson, null, '  '));
    // fs.writeFileSync(Path.resolve('tsconfig.json'), JSON.stringify(tsconfigJson, null, '  '));
    return tsconfigJson;
}
exports.changeTsConfigFile = changeTsConfigFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhbmdlLXRzY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hhbmdlLXRzY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlEQUFzRTtBQUN0RSxpRUFBeUQ7QUFDekQsc0NBQW1FO0FBQ25FLGdEQUF3QjtBQUN4Qiw0Q0FBb0I7QUFFcEIsU0FBZ0Isa0JBQWtCO0lBQ2hDLHNDQUFzQztJQUN0QyxNQUFNLFNBQVMsR0FBRyxrQkFBVSxFQUFFLENBQUM7SUFDL0IsTUFBTSxPQUFPLEdBQUcsNkJBQXNCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FDL0Msc0JBQVEsRUFBRSxDQUFDLGdCQUFnQixDQUFpekcsSUFBSSxFQUFFLENBQ2oxRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRXhFLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUE0QixFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbkcsTUFBTSxXQUFXLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUE0QixDQUFDLENBQUM7SUFFM0UsTUFBTSxXQUFXLEdBQThCLEVBQUUsQ0FBQztJQUVsRCxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBQyxRQUFRLEVBQUMsQ0FBQyxJQUFJLHNCQUFRLEVBQUUsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFO1FBQ3ZFLE1BQU0sT0FBTyxHQUFHLGNBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekUsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDOUIsV0FBVyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQztLQUM3QztJQUVELElBQUksc0JBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRTtRQUN6QixNQUFNLE9BQU8sR0FBRyxjQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxzQkFBUSxFQUFFLENBQUMsVUFBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDaEcsV0FBVyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ2hEO0lBQ0QsWUFBWSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDO0lBRWpELG1DQUEyQixDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxDQUFDLGVBQWUsRUFBRTtRQUMzRSxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRTtLQUM1QixDQUFDLENBQUM7SUFFSCxZQUFZLENBQUMsT0FBTyxHQUFHLENBQUMsY0FBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMkIsQ0FBQyxDQUFDLENBQUM7SUFDL0YsWUFBWSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0lBQy9DLHVDQUF1QztJQUN2Qyw0RkFBNEY7SUFDNUYsNkZBQTZGO0lBQzdGLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFuQ0QsZ0RBbUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtjbG9zZXN0Q29tbW9uUGFyZW50RGlyfSBmcm9tICdAd2ZoL3BsaW5rL3dmaC9kaXN0L3V0aWxzL21pc2MnO1xuaW1wb3J0IHtnZXRTdGF0ZX0gZnJvbSAnQHdmaC9wbGluay93ZmgvZGlzdC9wYWNrYWdlLW1ncic7XG5pbXBvcnQge2dldFJvb3REaXIsIHNldFRzQ29tcGlsZXJPcHRGb3JOb2RlUGF0aH0gZnJvbSAnQHdmaC9wbGluayc7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGFuZ2VUc0NvbmZpZ0ZpbGUoKSB7XG4gIC8vIGNvbnN0IGNyYU9wdGlvbnMgPSBnZXRDbWRPcHRpb25zKCk7XG4gIGNvbnN0IHBsaW5rUm9vdCA9IGdldFJvb3REaXIoKTtcbiAgY29uc3Qgcm9vdERpciA9IGNsb3Nlc3RDb21tb25QYXJlbnREaXIoQXJyYXkuZnJvbShcbiAgICBnZXRTdGF0ZSgpLnByb2plY3QyUGFja2FnZXMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLmtleXMoKVxuICAgICkubWFwKHByakRpciA9PiBQYXRoLnJlc29sdmUocGxpbmtSb290LCBwcmpEaXIpKSkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuXG4gIGNvbnN0IHRzY29uZmlnSnNvbiA9IEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKHByb2Nlc3MuZW52Ll9wbGlua19jcmFfc2NyaXB0c190c0NvbmZpZyEsICd1dGY4JykpO1xuICBjb25zdCB0c2NvbmZpZ0RpciA9IFBhdGguZGlybmFtZShwcm9jZXNzLmVudi5fcGxpbmtfY3JhX3NjcmlwdHNfdHNDb25maWchKTtcblxuICBjb25zdCBwYXRoTWFwcGluZzoge1trZXk6IHN0cmluZ106IHN0cmluZ1tdfSA9IHt9O1xuXG4gIGZvciAoY29uc3QgW25hbWUsIHtyZWFsUGF0aH1dIG9mIGdldFN0YXRlKCkuc3JjUGFja2FnZXMuZW50cmllcygpIHx8IFtdKSB7XG4gICAgY29uc3QgcmVhbERpciA9IFBhdGgucmVsYXRpdmUodHNjb25maWdEaXIsIHJlYWxQYXRoKS5yZXBsYWNlKC9cXFxcL2csICcvJyk7XG4gICAgcGF0aE1hcHBpbmdbbmFtZV0gPSBbcmVhbERpcl07XG4gICAgcGF0aE1hcHBpbmdbbmFtZSArICcvKiddID0gW3JlYWxEaXIgKyAnLyonXTtcbiAgfVxuXG4gIGlmIChnZXRTdGF0ZSgpLmxpbmtlZERyY3ApIHtcbiAgICBjb25zdCBkcmNwRGlyID0gUGF0aC5yZWxhdGl2ZSh0c2NvbmZpZ0RpciwgZ2V0U3RhdGUoKS5saW5rZWREcmNwIS5yZWFsUGF0aCkucmVwbGFjZSgvXFxcXC9nLCAnLycpO1xuICAgIHBhdGhNYXBwaW5nWydAd2ZoL3BsaW5rJ10gPSBbZHJjcERpcl07XG4gICAgcGF0aE1hcHBpbmdbJ0B3ZmgvcGxpbmsvKiddID0gW2RyY3BEaXIgKyAnLyonXTtcbiAgfVxuICB0c2NvbmZpZ0pzb24uY29tcGlsZXJPcHRpb25zLnBhdGhzID0gcGF0aE1hcHBpbmc7XG5cbiAgc2V0VHNDb21waWxlck9wdEZvck5vZGVQYXRoKHRzY29uZmlnRGlyLCAnLi8nLCB0c2NvbmZpZ0pzb24uY29tcGlsZXJPcHRpb25zLCB7XG4gICAgd29ya3NwYWNlRGlyOiBwcm9jZXNzLmN3ZCgpXG4gIH0pO1xuXG4gIHRzY29uZmlnSnNvbi5pbmNsdWRlID0gW1BhdGgucmVsYXRpdmUocHJvY2Vzcy5jd2QoKSwgcHJvY2Vzcy5lbnYuX3BsaW5rX2NyYV9zY3JpcHRzX2luZGV4SnMhKV07XG4gIHRzY29uZmlnSnNvbi5jb21waWxlck9wdGlvbnMucm9vdERpciA9IHJvb3REaXI7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAvLyBjb25zb2xlLmxvZygnW2NoYW5nZS10c2NvbmZpZ10gdHNjb25maWdKc29uOicsIEpTT04uc3RyaW5naWZ5KHRzY29uZmlnSnNvbiwgbnVsbCwgJyAgJykpO1xuICAvLyBmcy53cml0ZUZpbGVTeW5jKFBhdGgucmVzb2x2ZSgndHNjb25maWcuanNvbicpLCBKU09OLnN0cmluZ2lmeSh0c2NvbmZpZ0pzb24sIG51bGwsICcgICcpKTtcbiAgcmV0dXJuIHRzY29uZmlnSnNvbjtcbn1cbiJdfQ==