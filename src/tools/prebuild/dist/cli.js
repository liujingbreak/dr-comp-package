"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const package_json_1 = tslib_1.__importDefault(require("../package.json"));
const path_1 = tslib_1.__importDefault(require("path"));
const cfg = require('dr-comp-package/wfh/lib/config.js');
const package_runner_1 = require("dr-comp-package/wfh/dist/package-runner");
const program = new commander_1.Command();
program.version(package_json_1.default.version);
program.usage('Prebuild and deploy static resource to file server and compile node server side TS files');
program.option('-c, --config <config-file>', 'Read config files, if there are multiple files, the latter one overrides previous one', (curr, prev) => prev.concat(curr), []);
program.option('--prop <property-path=value as JSON | literal>', '<property-path>=<value as JSON | literal> ... directly set configuration properties, property name is lodash.set() path-like string\n e.g.\n', (curr, prev) => prev.concat(curr), []);
const deployCmd = program.command('deploy <env> <app> [scripts-file#function]')
    .option('--static', 'as an static resource build', true)
    .action((env, app, scriptsFile) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    yield cfg.init({ c: program.opts().config.length === 0 ? undefined : program.opts().config });
    // console.log(Path.resolve(__dirname, '_send-patch.js'));
    yield package_runner_1.runSinglePackage({
        target: path_1.default.resolve(__dirname, '_send-patch.js') + '#test',
        arguments: [deployCmd.opts().static]
    });
}));
program.command('githash [env]')
    // .option('-a,--all', 'list git hash info for all environment artifacts')
    .action((env) => tslib_1.__awaiter(this, void 0, void 0, function* () {
    const Artifacts = require('./artifacts');
    if (env) {
        // tslint:disable-next-line: no-console
        console.log(yield Artifacts.stringifyListVersions(env));
    }
    else {
        // tslint:disable-next-line: no-console
        console.log(yield Artifacts.stringifyListAllVersions());
    }
}));
program.parseAsync(process.argv);

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvcHJlYnVpbGQvdHMvY2xpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlDQUFrQztBQUNsQywyRUFBaUM7QUFDakMsd0RBQXdCO0FBQ3hCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDO0FBQ3pELDRFQUF5RTtBQUd6RSxNQUFNLE9BQU8sR0FBRyxJQUFJLG1CQUFPLEVBQUUsQ0FBQztBQUU5QixPQUFPLENBQUMsT0FBTyxDQUFDLHNCQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDNUIsT0FBTyxDQUFDLEtBQUssQ0FBQywwRkFBMEYsQ0FBQyxDQUFDO0FBQzFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsNEJBQTRCLEVBQ3pDLHVGQUF1RixFQUN2RixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBYyxDQUFDLENBQUM7QUFDbkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnREFBZ0QsRUFDL0QsOElBQThJLEVBQzlJLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFjLENBQUMsQ0FBQztBQUVyRCxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLDRDQUE0QyxDQUFDO0tBQzlFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsNkJBQTZCLEVBQUUsSUFBSSxDQUFDO0tBQ3ZELE1BQU0sQ0FBQyxDQUFPLEdBQUcsRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLEVBQUU7SUFDdEMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxFQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFtQixDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBQyxDQUFDLENBQUM7SUFDMUcsMERBQTBEO0lBQzFELE1BQU0saUNBQWdCLENBQUM7UUFDckIsTUFBTSxFQUFFLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsT0FBTztRQUMzRCxTQUFTLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO0tBQ3JDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsT0FBTyxDQUFDLGVBQWUsQ0FBQztJQUNoQywwRUFBMEU7S0FDekUsTUFBTSxDQUFDLENBQU8sR0FBRyxFQUFFLEVBQUU7SUFDcEIsTUFBTSxTQUFTLEdBQXNCLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUM1RCxJQUFJLEdBQUcsRUFBRTtRQUNQLHVDQUF1QztRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sU0FBUyxDQUFDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDekQ7U0FBTTtRQUNMLHVDQUF1QztRQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sU0FBUyxDQUFDLHdCQUF3QixFQUFFLENBQUMsQ0FBQztLQUN6RDtBQUNILENBQUMsQ0FBQSxDQUFDLENBQUM7QUFHSCxPQUFPLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyIsImZpbGUiOiJub2RlX21vZHVsZXMvQGJrL3ByZWJ1aWxkL2Rpc3QvY2xpLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21tYW5kfSBmcm9tICdjb21tYW5kZXInO1xuaW1wb3J0IHBrIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5pbXBvcnQgUGF0aCBmcm9tICdwYXRoJztcbmNvbnN0IGNmZyA9IHJlcXVpcmUoJ2RyLWNvbXAtcGFja2FnZS93ZmgvbGliL2NvbmZpZy5qcycpO1xuaW1wb3J0IHtydW5TaW5nbGVQYWNrYWdlfSBmcm9tICdkci1jb21wLXBhY2thZ2Uvd2ZoL2Rpc3QvcGFja2FnZS1ydW5uZXInO1xuaW1wb3J0ICogYXMgX0FydGlmYWN0cyBmcm9tICcuL2FydGlmYWN0cyc7XG5cbmNvbnN0IHByb2dyYW0gPSBuZXcgQ29tbWFuZCgpO1xuXG5wcm9ncmFtLnZlcnNpb24ocGsudmVyc2lvbik7XG5wcm9ncmFtLnVzYWdlKCdQcmVidWlsZCBhbmQgZGVwbG95IHN0YXRpYyByZXNvdXJjZSB0byBmaWxlIHNlcnZlciBhbmQgY29tcGlsZSBub2RlIHNlcnZlciBzaWRlIFRTIGZpbGVzJyk7XG5wcm9ncmFtLm9wdGlvbignLWMsIC0tY29uZmlnIDxjb25maWctZmlsZT4nLFxuICAnUmVhZCBjb25maWcgZmlsZXMsIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBmaWxlcywgdGhlIGxhdHRlciBvbmUgb3ZlcnJpZGVzIHByZXZpb3VzIG9uZScsXG4gIChjdXJyLCBwcmV2KSA9PiBwcmV2LmNvbmNhdChjdXJyKSwgW10gYXMgc3RyaW5nW10pO1xuICBwcm9ncmFtLm9wdGlvbignLS1wcm9wIDxwcm9wZXJ0eS1wYXRoPXZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPicsXG4gICc8cHJvcGVydHktcGF0aD49PHZhbHVlIGFzIEpTT04gfCBsaXRlcmFsPiAuLi4gZGlyZWN0bHkgc2V0IGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcywgcHJvcGVydHkgbmFtZSBpcyBsb2Rhc2guc2V0KCkgcGF0aC1saWtlIHN0cmluZ1xcbiBlLmcuXFxuJyxcbiAgKGN1cnIsIHByZXYpID0+IHByZXYuY29uY2F0KGN1cnIpLCBbXSBhcyBzdHJpbmdbXSk7XG5cbmNvbnN0IGRlcGxveUNtZCA9IHByb2dyYW0uY29tbWFuZCgnZGVwbG95IDxlbnY+IDxhcHA+IFtzY3JpcHRzLWZpbGUjZnVuY3Rpb25dJylcbi5vcHRpb24oJy0tc3RhdGljJywgJ2FzIGFuIHN0YXRpYyByZXNvdXJjZSBidWlsZCcsIHRydWUpXG4uYWN0aW9uKGFzeW5jIChlbnYsIGFwcCwgc2NyaXB0c0ZpbGUpID0+IHtcbiAgYXdhaXQgY2ZnLmluaXQoe2M6IChwcm9ncmFtLm9wdHMoKS5jb25maWcgYXMgc3RyaW5nW10pLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IHByb2dyYW0ub3B0cygpLmNvbmZpZ30pO1xuICAvLyBjb25zb2xlLmxvZyhQYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnX3NlbmQtcGF0Y2guanMnKSk7XG4gIGF3YWl0IHJ1blNpbmdsZVBhY2thZ2Uoe1xuICAgIHRhcmdldDogUGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ19zZW5kLXBhdGNoLmpzJykgKyAnI3Rlc3QnLFxuICAgIGFyZ3VtZW50czogW2RlcGxveUNtZC5vcHRzKCkuc3RhdGljXVxuICB9KTtcbn0pO1xuXG5wcm9ncmFtLmNvbW1hbmQoJ2dpdGhhc2ggW2Vudl0nKVxuLy8gLm9wdGlvbignLWEsLS1hbGwnLCAnbGlzdCBnaXQgaGFzaCBpbmZvIGZvciBhbGwgZW52aXJvbm1lbnQgYXJ0aWZhY3RzJylcbi5hY3Rpb24oYXN5bmMgKGVudikgPT4ge1xuICBjb25zdCBBcnRpZmFjdHM6IHR5cGVvZiBfQXJ0aWZhY3RzID0gcmVxdWlyZSgnLi9hcnRpZmFjdHMnKTtcbiAgaWYgKGVudikge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGF3YWl0IEFydGlmYWN0cy5zdHJpbmdpZnlMaXN0VmVyc2lvbnMoZW52KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coYXdhaXQgQXJ0aWZhY3RzLnN0cmluZ2lmeUxpc3RBbGxWZXJzaW9ucygpKTtcbiAgfVxufSk7XG5cblxucHJvZ3JhbS5wYXJzZUFzeW5jKHByb2Nlc3MuYXJndik7XG4iXX0=
