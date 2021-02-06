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
Object.defineProperty(exports, "__esModule", { value: true });
const plink_1 = require("@wfh/plink");
// import {cliPackageArgDesc}
const cli_gcmd_1 = require("./cli-gcmd");
const cliExt = (program) => {
    const cmd = program.command('gcmd <package-name> <command-name>')
        .alias('gen-command')
        .description('Generate a Plink command line implementation in specific package')
        // .option('--for-template <templateName>', 'Create a template generator command', false)
        .option('-d, --dry-run', 'Dryrun', false)
        .action((packageName, cmdName) => __awaiter(void 0, void 0, void 0, function* () {
        yield cli_gcmd_1.generate(packageName, cmdName, cmd.opts());
    }));
    cmd.usage(cmd.usage() + '\ne.g.\n  plink gcmd my-package my-command');
    const settingCmd = program.command('gsetting <package-name...>').alias('gen-setting')
        .option('-d, --dry-run', 'Dryrun', false)
        .description('Generate a package setting file', {
        'package-name': plink_1.cliPackageArgDesc
    })
        .action((packageNames) => __awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-gsetting')))).generateSetting(packageNames, settingCmd.opts());
    }));
    const cfgCmd = program.command('gcfg <file>').alias('gen-config')
        .option('-d, --dry-run', 'Dryrun', false)
        // .option('-t, --type <file-type>', 'Configuation file type, valid types are "ts", "yaml", "json"', 'ts')
        .description('Generate a workspace configuration file (Typescript file), used to override package settings', {
        file: 'Output configuration file path (with or without suffix name ".ts"), e.g. "../conf/foobar.prod"'
    })
        .action((file) => __awaiter(void 0, void 0, void 0, function* () {
        yield (yield Promise.resolve().then(() => __importStar(require('./cli-gcfg')))).generateConfig(file, cfgCmd.opts());
    }));
};
exports.default = cliExt;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY21kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY21kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHNDQUEyRDtBQUMzRCw2QkFBNkI7QUFDN0IseUNBQStDO0FBRS9DLE1BQU0sTUFBTSxHQUFpQixDQUFDLE9BQU8sRUFBRSxFQUFFO0lBQ3ZDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsb0NBQW9DLENBQUM7U0FDaEUsS0FBSyxDQUFDLGFBQWEsQ0FBQztTQUNwQixXQUFXLENBQUMsa0VBQWtFLENBQUM7UUFDaEYseUZBQXlGO1NBQ3hGLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztTQUN4QyxNQUFNLENBQUMsQ0FBTyxXQUFtQixFQUFFLE9BQWUsRUFBRSxFQUFFO1FBQ3JELE1BQU0sbUJBQVEsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQWUsQ0FBQyxDQUFDO0lBQ2hFLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDSCxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyw0Q0FBNEMsQ0FBQyxDQUFDO0lBRXRFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDO1NBQ3BGLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztTQUN4QyxXQUFXLENBQUMsaUNBQWlDLEVBQUU7UUFDOUMsY0FBYyxFQUFFLHlCQUFpQjtLQUNsQyxDQUFDO1NBQ0QsTUFBTSxDQUFDLENBQU8sWUFBc0IsRUFBRSxFQUFFO1FBQ3ZDLE1BQU0sQ0FBQyx3REFBYSxnQkFBZ0IsR0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsSUFBSSxFQUFTLENBQUMsQ0FBQztJQUNqRyxDQUFDLENBQUEsQ0FBQyxDQUFDO0lBRUgsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDO1NBQ2hFLE1BQU0sQ0FBQyxlQUFlLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztRQUN6QywwR0FBMEc7U0FDekcsV0FBVyxDQUFDLDhGQUE4RixFQUFFO1FBQzNHLElBQUksRUFBRSxnR0FBZ0c7S0FDdkcsQ0FBQztTQUNELE1BQU0sQ0FBQyxDQUFPLElBQVksRUFBRSxFQUFFO1FBQzdCLE1BQU0sQ0FBQyx3REFBYSxZQUFZLEdBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksRUFBUyxDQUFDLENBQUM7SUFDaEYsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVMLENBQUMsQ0FBQztBQUVGLGtCQUFlLE1BQU0sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Q2xpRXh0ZW5zaW9uLCBjbGlQYWNrYWdlQXJnRGVzY30gZnJvbSAnQHdmaC9wbGluayc7XG4vLyBpbXBvcnQge2NsaVBhY2thZ2VBcmdEZXNjfVxuaW1wb3J0IHtDQk9wdGlvbnMsIGdlbmVyYXRlfSBmcm9tICcuL2NsaS1nY21kJztcblxuY29uc3QgY2xpRXh0OiBDbGlFeHRlbnNpb24gPSAocHJvZ3JhbSkgPT4ge1xuICBjb25zdCBjbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2djbWQgPHBhY2thZ2UtbmFtZT4gPGNvbW1hbmQtbmFtZT4nKVxuICAuYWxpYXMoJ2dlbi1jb21tYW5kJylcbiAgLmRlc2NyaXB0aW9uKCdHZW5lcmF0ZSBhIFBsaW5rIGNvbW1hbmQgbGluZSBpbXBsZW1lbnRhdGlvbiBpbiBzcGVjaWZpYyBwYWNrYWdlJylcbiAgLy8gLm9wdGlvbignLS1mb3ItdGVtcGxhdGUgPHRlbXBsYXRlTmFtZT4nLCAnQ3JlYXRlIGEgdGVtcGxhdGUgZ2VuZXJhdG9yIGNvbW1hbmQnLCBmYWxzZSlcbiAgLm9wdGlvbignLWQsIC0tZHJ5LXJ1bicsICdEcnlydW4nLCBmYWxzZSlcbiAgLmFjdGlvbihhc3luYyAocGFja2FnZU5hbWU6IHN0cmluZywgY21kTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgYXdhaXQgZ2VuZXJhdGUocGFja2FnZU5hbWUsIGNtZE5hbWUsIGNtZC5vcHRzKCkgYXMgQ0JPcHRpb25zKTtcbiAgfSk7XG4gIGNtZC51c2FnZShjbWQudXNhZ2UoKSArICdcXG5lLmcuXFxuICBwbGluayBnY21kIG15LXBhY2thZ2UgbXktY29tbWFuZCcpO1xuXG4gIGNvbnN0IHNldHRpbmdDbWQgPSBwcm9ncmFtLmNvbW1hbmQoJ2dzZXR0aW5nIDxwYWNrYWdlLW5hbWUuLi4+JykuYWxpYXMoJ2dlbi1zZXR0aW5nJylcbiAgLm9wdGlvbignLWQsIC0tZHJ5LXJ1bicsICdEcnlydW4nLCBmYWxzZSlcbiAgLmRlc2NyaXB0aW9uKCdHZW5lcmF0ZSBhIHBhY2thZ2Ugc2V0dGluZyBmaWxlJywge1xuICAgICdwYWNrYWdlLW5hbWUnOiBjbGlQYWNrYWdlQXJnRGVzY1xuICB9KVxuICAuYWN0aW9uKGFzeW5jIChwYWNrYWdlTmFtZXM6IHN0cmluZ1tdKSA9PiB7XG4gICAgYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9jbGktZ3NldHRpbmcnKSkuZ2VuZXJhdGVTZXR0aW5nKHBhY2thZ2VOYW1lcywgc2V0dGluZ0NtZC5vcHRzKCkgYXMgYW55KTtcbiAgfSk7XG5cbiAgY29uc3QgY2ZnQ21kID0gcHJvZ3JhbS5jb21tYW5kKCdnY2ZnIDxmaWxlPicpLmFsaWFzKCdnZW4tY29uZmlnJylcbiAgLm9wdGlvbignLWQsIC0tZHJ5LXJ1bicsICdEcnlydW4nLCBmYWxzZSlcbiAgLy8gLm9wdGlvbignLXQsIC0tdHlwZSA8ZmlsZS10eXBlPicsICdDb25maWd1YXRpb24gZmlsZSB0eXBlLCB2YWxpZCB0eXBlcyBhcmUgXCJ0c1wiLCBcInlhbWxcIiwgXCJqc29uXCInLCAndHMnKVxuICAuZGVzY3JpcHRpb24oJ0dlbmVyYXRlIGEgd29ya3NwYWNlIGNvbmZpZ3VyYXRpb24gZmlsZSAoVHlwZXNjcmlwdCBmaWxlKSwgdXNlZCB0byBvdmVycmlkZSBwYWNrYWdlIHNldHRpbmdzJywge1xuICAgIGZpbGU6ICdPdXRwdXQgY29uZmlndXJhdGlvbiBmaWxlIHBhdGggKHdpdGggb3Igd2l0aG91dCBzdWZmaXggbmFtZSBcIi50c1wiKSwgZS5nLiBcIi4uL2NvbmYvZm9vYmFyLnByb2RcIidcbiAgfSlcbiAgLmFjdGlvbihhc3luYyAoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgYXdhaXQgKGF3YWl0IGltcG9ydCgnLi9jbGktZ2NmZycpKS5nZW5lcmF0ZUNvbmZpZyhmaWxlLCBjZmdDbWQub3B0cygpIGFzIGFueSk7XG4gIH0pO1xuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGlFeHQ7XG4iXX0=