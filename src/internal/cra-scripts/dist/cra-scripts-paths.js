"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const utils_1 = require("./utils");
const build_target_helper_1 = require("./build-target-helper");
const path_1 = tslib_1.__importDefault(require("path"));
const paths = require('react-scripts/config/paths');
function default_1() {
    const cmdOption = utils_1.getCmdOptions();
    // console.log('[debug] ', cmdOption);
    if (cmdOption.buildType === 'lib') {
        const { dir, packageJson: pkJson } = build_target_helper_1.findPackage(cmdOption.buildTarget);
        paths.appBuild = path_1.default.resolve(dir, 'build');
        paths.appIndexJs = path_1.default.resolve(dir, pkJson.dr.buildEntry.lib);
        // tslint:disable-next-line: no-console
        console.log('[cra-scripts-paths] changed react-scripts paths:\n', paths);
    }
    return paths;
}
exports.default = default_1;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvY3JhLXNjcmlwdHMvdHMvY3JhLXNjcmlwdHMtcGF0aHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQXNDO0FBQ3RDLCtEQUFrRDtBQUNsRCx3REFBd0I7QUFDeEIsTUFBTSxLQUFLLEdBQW9CLE9BQU8sQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0FBcUJyRTtJQUNFLE1BQU0sU0FBUyxHQUFHLHFCQUFhLEVBQUUsQ0FBQztJQUNsQyxzQ0FBc0M7SUFDdEMsSUFBSSxTQUFTLENBQUMsU0FBUyxLQUFLLEtBQUssRUFBRTtRQUNqQyxNQUFNLEVBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUMsR0FBRyxpQ0FBVyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN0RSxLQUFLLENBQUMsUUFBUSxHQUFHLGNBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLEtBQUssQ0FBQyxVQUFVLEdBQUcsY0FBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0QsdUNBQXVDO1FBQ3ZDLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0RBQW9ELEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDMUU7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFYRCw0QkFXQyIsImZpbGUiOiJub2RlX21vZHVsZXMvQGJrL2NyYS1zY3JpcHRzL2Rpc3QvY3JhLXNjcmlwdHMtcGF0aHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2dldENtZE9wdGlvbnN9IGZyb20gJy4vdXRpbHMnO1xuaW1wb3J0IHtmaW5kUGFja2FnZX0gZnJvbSAnLi9idWlsZC10YXJnZXQtaGVscGVyJztcbmltcG9ydCBQYXRoIGZyb20gJ3BhdGgnO1xuY29uc3QgcGF0aHM6IENyYVNjcmlwdHNQYXRocyA9IHJlcXVpcmUoJ3JlYWN0LXNjcmlwdHMvY29uZmlnL3BhdGhzJyk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ3JhU2NyaXB0c1BhdGhzIHtcbiAgZG90ZW52OiBzdHJpbmc7IC8vIHJlc29sdmVBcHAoJy5lbnYnKSxcbiAgYXBwUGF0aDogc3RyaW5nOyAvLyByZXNvbHZlQXBwKCcuJyksXG4gIGFwcEJ1aWxkOiBzdHJpbmc7IC8vIHJlc29sdmVBcHAoJ2J1aWxkJyksXG4gIGFwcFB1YmxpYzogc3RyaW5nOyAvLyByZXNvbHZlQXBwKCdwdWJsaWMnKSxcbiAgYXBwSHRtbDogc3RyaW5nOyAvLyByZXNvbHZlQXBwKCdwdWJsaWMvaW5kZXguaHRtbCcpLFxuICBhcHBJbmRleEpzOiBzdHJpbmc7IC8vIHJlc29sdmVNb2R1bGUocmVzb2x2ZUFwcCwgJ3NyYy9pbmRleCcpLFxuICBhcHBQYWNrYWdlSnNvbjogc3RyaW5nOyAvLyByZXNvbHZlQXBwKCdwYWNrYWdlLmpzb24nKSxcbiAgYXBwU3JjOiBzdHJpbmc7IC8vIHJlc29sdmVBcHAoJ3NyYycpLFxuICBhcHBUc0NvbmZpZzogc3RyaW5nOyAvLyByZXNvbHZlQXBwKCd0c2NvbmZpZy5qc29uJyksXG4gIGFwcEpzQ29uZmlnOiBzdHJpbmc7IC8vIHJlc29sdmVBcHAoJ2pzY29uZmlnLmpzb24nKSxcbiAgeWFybkxvY2tGaWxlOiBzdHJpbmc7IC8vIHJlc29sdmVBcHAoJ3lhcm4ubG9jaycpLFxuICB0ZXN0c1NldHVwOiBzdHJpbmc7IC8vIHJlc29sdmVNb2R1bGUocmVzb2x2ZUFwcCwgJ3NyYy9zZXR1cFRlc3RzJyksXG4gIHByb3h5U2V0dXA6IHN0cmluZzsgLy8gcmVzb2x2ZUFwcCgnc3JjL3NldHVwUHJveHkuanMnKSxcbiAgYXBwTm9kZU1vZHVsZXM6IHN0cmluZzsgLy8gcmVzb2x2ZUFwcCgnbm9kZV9tb2R1bGVzJyksXG4gIHB1YmxpY1VybDogc3RyaW5nOyAvLyBzdHJpbmc7XG4gIHNlcnZlZFBhdGg6IHN0cmluZzsgLy8gZ2V0U2VydmVkUGF0aChyZXNvbHZlQXBwKCdwYWNrYWdlLmpzb24nKSksXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICBjb25zdCBjbWRPcHRpb24gPSBnZXRDbWRPcHRpb25zKCk7XG4gIC8vIGNvbnNvbGUubG9nKCdbZGVidWddICcsIGNtZE9wdGlvbik7XG4gIGlmIChjbWRPcHRpb24uYnVpbGRUeXBlID09PSAnbGliJykge1xuICAgIGNvbnN0IHtkaXIsIHBhY2thZ2VKc29uOiBwa0pzb259ID0gZmluZFBhY2thZ2UoY21kT3B0aW9uLmJ1aWxkVGFyZ2V0KTtcbiAgICBwYXRocy5hcHBCdWlsZCA9IFBhdGgucmVzb2x2ZShkaXIsICdidWlsZCcpO1xuICAgIHBhdGhzLmFwcEluZGV4SnMgPSBQYXRoLnJlc29sdmUoZGlyLCBwa0pzb24uZHIuYnVpbGRFbnRyeS5saWIpO1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKCdbY3JhLXNjcmlwdHMtcGF0aHNdIGNoYW5nZWQgcmVhY3Qtc2NyaXB0cyBwYXRoczpcXG4nLCBwYXRocyk7XG4gIH1cbiAgcmV0dXJuIHBhdGhzO1xufVxuIl19
