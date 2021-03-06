"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.npmRegistryProxy = void 0;
const utils_1 = require("@wfh/assets-processer/dist/utils");
const plink_1 = require("@wfh/plink");
function npmRegistryProxy() {
    utils_1.setupHttpProxy('/npm-registry', plink_1.config()['@wfh/http-request-proxy'].npmRegistry);
}
exports.npmRegistryProxy = npmRegistryProxy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHBtLXNldHVwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHBtLXNldHVwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDREQUFnRTtBQUNoRSxzQ0FBa0M7QUFFbEMsU0FBZ0IsZ0JBQWdCO0lBQzlCLHNCQUFjLENBQUMsZUFBZSxFQUFFLGNBQU0sRUFBRSxDQUFDLHlCQUF5QixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDbkYsQ0FBQztBQUZELDRDQUVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtzZXR1cEh0dHBQcm94eX0gZnJvbSAnQHdmaC9hc3NldHMtcHJvY2Vzc2VyL2Rpc3QvdXRpbHMnO1xuaW1wb3J0IHtjb25maWd9IGZyb20gJ0B3ZmgvcGxpbmsnO1xuXG5leHBvcnQgZnVuY3Rpb24gbnBtUmVnaXN0cnlQcm94eSgpIHtcbiAgc2V0dXBIdHRwUHJveHkoJy9ucG0tcmVnaXN0cnknLCBjb25maWcoKVsnQHdmaC9odHRwLXJlcXVlc3QtcHJveHknXS5ucG1SZWdpc3RyeSk7XG59XG4iXX0=