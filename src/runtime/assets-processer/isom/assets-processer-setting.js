"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSetting = exports.defaultSetting = void 0;
const plink_1 = require("@wfh/plink");
/**
 * Plink run this funtion to get package level setting value
 */
function defaultSetting() {
    const defaultValue = {
        fetchUrl: null,
        fetchRetry: 5,
        downloadMode: 'fork',
        fetchLogErrPerTimes: 20,
        fetchIntervalSec: 90,
        cacheControlMaxAge: {
            js: '365 days',
            css: '365 days',
            less: '365 days',
            html: null,
            png: '365 days',
            jpg: '365 days',
            jpeg: '365 days',
            gif: '365 days',
            svg: '365 days',
            eot: '365 days',
            ttf: '365 days',
            woff: '365 days',
            woff2: '365 days'
        },
        fallbackIndexHtml: { '^/[^/?#.]+': '<%=match[0]%>/index.html' },
        httpProxy: {},
        fetchMailServer: null,
        serveIndex: false,
        requireToken: false
    };
    if (plink_1.config().devMode || plink_1.config().cliOptions.env === 'local') {
        const devValue = {
            fetchRetry: 0,
            fetchLogErrPerTimes: 1,
            fetchIntervalSec: 60,
            cacheControlMaxAge: {},
            fetchMailServer: null,
            proxyToDevServer: { target: 'http://localhost:4200' }
        };
        return Object.assign(defaultValue, devValue);
    }
    return defaultValue;
}
exports.defaultSetting = defaultSetting;
/**
 * The return setting value is merged with files specified by command line options --prop and -c
 * @return setting of current package
 */
function getSetting() {
    /* eslint-disable dot-notation,@typescript-eslint/dot-notation */
    return plink_1.config()['@wfh/assets-processer'];
}
exports.getSetting = getSetting;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLXByb2Nlc3Nlci1zZXR0aW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXRzLXByb2Nlc3Nlci1zZXR0aW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHNDQUFrQztBQTJEbEM7O0dBRUc7QUFDSCxTQUFnQixjQUFjO0lBQzVCLE1BQU0sWUFBWSxHQUEyQjtRQUMzQyxRQUFRLEVBQUUsSUFBSTtRQUNkLFVBQVUsRUFBRSxDQUFDO1FBQ2IsWUFBWSxFQUFFLE1BQU07UUFDcEIsbUJBQW1CLEVBQUUsRUFBRTtRQUN2QixnQkFBZ0IsRUFBRSxFQUFFO1FBQ3BCLGtCQUFrQixFQUFFO1lBQ2xCLEVBQUUsRUFBRSxVQUFVO1lBQ2QsR0FBRyxFQUFFLFVBQVU7WUFDZixJQUFJLEVBQUUsVUFBVTtZQUNoQixJQUFJLEVBQUUsSUFBSTtZQUNWLEdBQUcsRUFBRSxVQUFVO1lBQ2YsR0FBRyxFQUFFLFVBQVU7WUFDZixJQUFJLEVBQUUsVUFBVTtZQUNoQixHQUFHLEVBQUUsVUFBVTtZQUNmLEdBQUcsRUFBRSxVQUFVO1lBQ2YsR0FBRyxFQUFFLFVBQVU7WUFDZixHQUFHLEVBQUUsVUFBVTtZQUNmLElBQUksRUFBRSxVQUFVO1lBQ2hCLEtBQUssRUFBRSxVQUFVO1NBQ2xCO1FBQ0QsaUJBQWlCLEVBQUUsRUFBQyxZQUFZLEVBQUUsMEJBQTBCLEVBQUM7UUFDN0QsU0FBUyxFQUFFLEVBQUU7UUFDYixlQUFlLEVBQUUsSUFBSTtRQUNyQixVQUFVLEVBQUUsS0FBSztRQUNqQixZQUFZLEVBQUUsS0FBSztLQUNwQixDQUFDO0lBRUYsSUFBSSxjQUFNLEVBQUUsQ0FBQyxPQUFPLElBQUksY0FBTSxFQUFFLENBQUMsVUFBVyxDQUFDLEdBQUcsS0FBSyxPQUFPLEVBQUU7UUFDNUQsTUFBTSxRQUFRLEdBQW9DO1lBQ2hELFVBQVUsRUFBRSxDQUFDO1lBQ2IsbUJBQW1CLEVBQUUsQ0FBQztZQUN0QixnQkFBZ0IsRUFBRSxFQUFFO1lBQ3BCLGtCQUFrQixFQUFFLEVBQUU7WUFDdEIsZUFBZSxFQUFFLElBQUk7WUFDckIsZ0JBQWdCLEVBQUUsRUFBQyxNQUFNLEVBQUUsdUJBQXVCLEVBQUM7U0FDcEQsQ0FBQztRQUNGLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDOUM7SUFDRCxPQUFPLFlBQVksQ0FBQztBQUN0QixDQUFDO0FBekNELHdDQXlDQztBQUVEOzs7R0FHRztBQUNILFNBQWdCLFVBQVU7SUFDeEIsaUVBQWlFO0lBQ2pFLE9BQU8sY0FBTSxFQUFFLENBQUMsdUJBQXVCLENBQUUsQ0FBQztBQUM1QyxDQUFDO0FBSEQsZ0NBR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge2NvbmZpZ30gZnJvbSAnQHdmaC9wbGluayc7XG5pbXBvcnQge09wdGlvbnN9IGZyb20gJ2h0dHAtcHJveHktbWlkZGxld2FyZSc7XG4vKipcbiAqIFBhY2thZ2Ugc2V0dGluZyB0eXBlXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQXNzZXRzUHJvY2Vzc2VyU2V0dGluZyB7XG4gIC8qKiBAZGVwcmVjYXRlZCAqL1xuICBmZXRjaFVybDogc3RyaW5nIHwgbnVsbDtcbiAgLyoqIEBkZXByZWNhdGVkICovXG4gIGZldGNoUmV0cnk6IG51bWJlcjtcbiAgLyoqIEBkZXByZWNhdGVkICovXG4gIGRvd25sb2FkTW9kZTogJ2ZvcmsnO1xuICAvKiogQGRlcHJlY2F0ZWQgKi9cbiAgZmV0Y2hMb2dFcnJQZXJUaW1lczogbnVtYmVyO1xuICAvKiogQGRlcHJlY2F0ZWQgKi9cbiAgZmV0Y2hJbnRlcnZhbFNlYzogbnVtYmVyO1xuICAvKiogUmVzcG9uc2UgbWF4QWdlIGhlYWRlciB2YWx1ZSBhZ2FpbnN0IGRpZmZlcmVudCBtZWRpYSB0eXBlIGZpbGUgKi9cbiAgY2FjaGVDb250cm9sTWF4QWdlOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH07XG4gIC8qKiBGb3IgSFRNTCA1IGhpc3RvcnkgYmFzZWQgY2xpZW50IHNpZGUgcm91dGUsIHNlcnZpbmcgaW5kZXguaHRtbCBmb3IgXG4gICAqIHNwZWNpZmljIHBhdGguXG4gICAqIFxuICAgKiBLZXkgaXMgYSBSZWdFeHAgc3RyaW5nLCB2YWx1ZSBpcyB0YXJnZXQgcGF0aC5cbiAgICogZS5nLiAgeydeL1teLz8jLl0rJzogJzwlPW1hdGNoWzBdJT4vaW5kZXguaHRtbCd9XG4gICAqIFxuICAgKiBJbiBjYXNlIHVzZXIgYWNjZXNzIFwiL2hlbGxvdz91aWQ9MTIzXCIsIHRoZSBhY3R1YWwgRXhwcmVzcy5qc1xuICAgKiBgcmVxdWVzdC5wYXRoYCB3aWxsIGJlIGNoYW5nZSB0byBcIi9pbmRleC5odG1sXCIsIGByZXF1ZXN0LnF1ZXJ5YCB3aWxsIGJlIGtlcHRcbiAgICovXG4gIGZhbGxiYWNrSW5kZXhIdG1sOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfTtcbiAgaHR0cFByb3h5OiB7W3Byb3h5UGF0aDogc3RyaW5nXTogc3RyaW5nfTtcbiAgZmV0Y2hNYWlsU2VydmVyOiB7XG4gICAgaW1hcDogc3RyaW5nO1xuICAgIHNtdHA6IHN0cmluZztcbiAgICB1c2VyOiBzdHJpbmc7XG4gICAgbG9naW5TZWNyZXQ6IHN0cmluZztcbiAgICBlbnY/OiBzdHJpbmc7XG4gIH0gfCBudWxsO1xuICAvKiogU2V0dGluZyB0aGlzIHZhbHVlIHRvIHRydWUgd2lsbCBlbmFibGUgc2VydmluZyBJbmRleCBIVE1MIHBhZ2UgZm9yIHN0YXRpYyByZXNvdXJjZSB1bmRlcjpcbiAgICogIDxyb290IGRpcj4vZGlzdC9zdGF0aWMuXG4gICAqIFxuICAgKiBZb3UgbWF5IGFsc28gYXNzaWduIGEgZGlmZmVyZW50IHZhbHVlIHRvIFBsaW5rIHByb3BlcnR5IFwic3RhdGljRGlyXCIgdG8gY2hhbmdlIHN0YXRpYyByZXNvdXJjZSBkaXJlY3RvcnksXG4gICAqIGUuZy4gQnkgY29tbWFuZCBsaW5lIG9wdGlvbiBgLS1wcm9wIHN0YXRpY0Rpcj08ZGlyPmBcbiAgICovXG4gIHNlcnZlSW5kZXg6IGJvb2xlYW47XG4gIHJlcXVpcmVUb2tlbjogYm9vbGVhbjtcbiAgLyoqIFxuICAgKiBAdHlwZSBpbXBvcnQoJ2h0dHAtcHJveHktbWlkZGxld2FyZScpLkNvbmZpZ1xuICAgKiBQcm94eSByZXF1ZXN0IHRvIGFub3RoZXIgZGV2IHNlcnZlciwgaWYgcHJveHkgZ290IGFuIGVycm9yIHJlc3BvbnNlLCB0aGVuIGZhbGxiYWNrIHJlcXVlc3QgdG9cbiAgICogbG9jYWwgc3RhdGljIGZpbGUgcmVzb3VyY2VcbiAgICogZS5nLiB7dGFyZ2V0OiBodHRwOi8vbG9jYWxoc290OjMwMDB9IGZvciBjcmVhdGUtcmVhY3QtYXBwIGRldiBzZXJ2ZXIsXG4gICAqIHt0YXJnZXQ6IGh0dHA6Ly9sb2NhbGhvc3Q6NDIwMH0gZm9yIEFuZ3VsYXIgZGV2IHNlcnZlclxuICAgKiBcbiAgICogRGVmYXVsdCB2YWx1ZSBpcyB7dGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo0MjAwJ30gd2hlbiBcIi0tZGV2XCIgbW9kZSBpcyBvbi5cbiAgICogXG4gICAqIENoYW5nZU9yaWdpbiBhbmQgd3MgKHdlYnNvY2tldCkgd2lsbCBiZSBlbmFibGVkLCBzaW5jZSBkZXZTZXJ2ZXIgbW9zdGx5IGxpa2Ugd2lsbFxuICAgKiBlbmFibGUgV2VicGFjayBITVIgdGhyb3VnaCB3ZWJzb2NrZXQuXG4gICovXG4gIHByb3h5VG9EZXZTZXJ2ZXI/OiBPcHRpb25zO1xufVxuXG4vKipcbiAqIFBsaW5rIHJ1biB0aGlzIGZ1bnRpb24gdG8gZ2V0IHBhY2thZ2UgbGV2ZWwgc2V0dGluZyB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFNldHRpbmcoKTogQXNzZXRzUHJvY2Vzc2VyU2V0dGluZyB7XG4gIGNvbnN0IGRlZmF1bHRWYWx1ZTogQXNzZXRzUHJvY2Vzc2VyU2V0dGluZyA9IHtcbiAgICBmZXRjaFVybDogbnVsbCxcbiAgICBmZXRjaFJldHJ5OiA1LFxuICAgIGRvd25sb2FkTW9kZTogJ2ZvcmsnLFxuICAgIGZldGNoTG9nRXJyUGVyVGltZXM6IDIwLFxuICAgIGZldGNoSW50ZXJ2YWxTZWM6IDkwLFxuICAgIGNhY2hlQ29udHJvbE1heEFnZToge1xuICAgICAganM6ICczNjUgZGF5cycsXG4gICAgICBjc3M6ICczNjUgZGF5cycsXG4gICAgICBsZXNzOiAnMzY1IGRheXMnLFxuICAgICAgaHRtbDogbnVsbCxcbiAgICAgIHBuZzogJzM2NSBkYXlzJyxcbiAgICAgIGpwZzogJzM2NSBkYXlzJyxcbiAgICAgIGpwZWc6ICczNjUgZGF5cycsXG4gICAgICBnaWY6ICczNjUgZGF5cycsXG4gICAgICBzdmc6ICczNjUgZGF5cycsXG4gICAgICBlb3Q6ICczNjUgZGF5cycsXG4gICAgICB0dGY6ICczNjUgZGF5cycsXG4gICAgICB3b2ZmOiAnMzY1IGRheXMnLFxuICAgICAgd29mZjI6ICczNjUgZGF5cydcbiAgICB9LFxuICAgIGZhbGxiYWNrSW5kZXhIdG1sOiB7J14vW14vPyMuXSsnOiAnPCU9bWF0Y2hbMF0lPi9pbmRleC5odG1sJ30sXG4gICAgaHR0cFByb3h5OiB7fSxcbiAgICBmZXRjaE1haWxTZXJ2ZXI6IG51bGwsXG4gICAgc2VydmVJbmRleDogZmFsc2UsXG4gICAgcmVxdWlyZVRva2VuOiBmYWxzZVxuICB9O1xuXG4gIGlmIChjb25maWcoKS5kZXZNb2RlIHx8IGNvbmZpZygpLmNsaU9wdGlvbnMhLmVudiA9PT0gJ2xvY2FsJykge1xuICAgIGNvbnN0IGRldlZhbHVlOiBQYXJ0aWFsPEFzc2V0c1Byb2Nlc3NlclNldHRpbmc+ID0ge1xuICAgICAgZmV0Y2hSZXRyeTogMCxcbiAgICAgIGZldGNoTG9nRXJyUGVyVGltZXM6IDEsXG4gICAgICBmZXRjaEludGVydmFsU2VjOiA2MCxcbiAgICAgIGNhY2hlQ29udHJvbE1heEFnZToge30sXG4gICAgICBmZXRjaE1haWxTZXJ2ZXI6IG51bGwsXG4gICAgICBwcm94eVRvRGV2U2VydmVyOiB7dGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo0MjAwJ31cbiAgICB9O1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKGRlZmF1bHRWYWx1ZSwgZGV2VmFsdWUpO1xuICB9XG4gIHJldHVybiBkZWZhdWx0VmFsdWU7XG59XG5cbi8qKlxuICogVGhlIHJldHVybiBzZXR0aW5nIHZhbHVlIGlzIG1lcmdlZCB3aXRoIGZpbGVzIHNwZWNpZmllZCBieSBjb21tYW5kIGxpbmUgb3B0aW9ucyAtLXByb3AgYW5kIC1jXG4gKiBAcmV0dXJuIHNldHRpbmcgb2YgY3VycmVudCBwYWNrYWdlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZXR0aW5nKCk6IEFzc2V0c1Byb2Nlc3NlclNldHRpbmcge1xuICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24sQHR5cGVzY3JpcHQtZXNsaW50L2RvdC1ub3RhdGlvbiAqL1xuICByZXR1cm4gY29uZmlnKClbJ0B3ZmgvYXNzZXRzLXByb2Nlc3NlciddITtcbn1cbiJdfQ==