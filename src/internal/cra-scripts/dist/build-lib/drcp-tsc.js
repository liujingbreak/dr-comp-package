"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const drcpConfig = require('dr-comp-package/wfh/lib/config');
drcpConfig.init({})
    .then(() => {
    const tsc = require('dr-comp-package/wfh/dist/ts-cmd').tsc;
    return tsc({
        package: [process.argv[2]],
        ed: true, jsx: true,
        watch: process.argv.slice(3).indexOf('--watch') >= 0
    });
})
    .then(emitted => {
    // tslint:disable-next-line: no-console
    console.log('[drcp-tsc] declaration files emitted:');
    // tslint:disable-next-line: no-console
    emitted.forEach(info => console.log(`[drcp-tsc] emitted: ${info[0]} ${info[1]}Kb`));
})
    .catch(err => {
    console.error('[child-process tsc] Typescript compilation contains errors');
    console.error(err);
});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AYmsvY3JhLXNjcmlwdHMvdHMvYnVpbGQtbGliL2RyY3AtdHNjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7QUFFNUQsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQWtCO0tBQ3BDLElBQUksQ0FBQyxHQUFHLEVBQUU7SUFDVCxNQUFNLEdBQUcsR0FBZ0IsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsR0FBRyxDQUFDO0lBQ3hFLE9BQU8sR0FBRyxDQUFDO1FBQ1QsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixFQUFFLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJO1FBQ25CLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztLQUNyRCxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7S0FDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7SUFDZCx1Q0FBdUM7SUFDdkMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0lBQ3JELHVDQUF1QztJQUN2QyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN0RixDQUFDLENBQUM7S0FDRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7SUFDWCxPQUFPLENBQUMsS0FBSyxDQUFDLDREQUE0RCxDQUFDLENBQUM7SUFDNUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixDQUFDLENBQUMsQ0FBQyIsImZpbGUiOiJub2RlX21vZHVsZXMvQGJrL2NyYS1zY3JpcHRzL2Rpc3QvYnVpbGQtbGliL2RyY3AtdHNjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHt0c2MgYXMgX3RzY30gZnJvbSAnZHItY29tcC1wYWNrYWdlL3dmaC9kaXN0L3RzLWNtZCc7XG5jb25zdCBkcmNwQ29uZmlnID0gcmVxdWlyZSgnZHItY29tcC1wYWNrYWdlL3dmaC9saWIvY29uZmlnJyk7XG5cbihkcmNwQ29uZmlnLmluaXQoe30pIGFzIFByb21pc2U8YW55Pilcbi50aGVuKCgpID0+IHtcbiAgY29uc3QgdHNjOiB0eXBlb2YgX3RzYyA9IHJlcXVpcmUoJ2RyLWNvbXAtcGFja2FnZS93ZmgvZGlzdC90cy1jbWQnKS50c2M7XG4gIHJldHVybiB0c2Moe1xuICAgIHBhY2thZ2U6IFtwcm9jZXNzLmFyZ3ZbMl1dLFxuICAgIGVkOiB0cnVlLCBqc3g6IHRydWUsXG4gICAgd2F0Y2g6IHByb2Nlc3MuYXJndi5zbGljZSgzKS5pbmRleE9mKCctLXdhdGNoJykgPj0gMFxuICB9KTtcbn0pXG4udGhlbihlbWl0dGVkID0+IHtcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1jb25zb2xlXG4gIGNvbnNvbGUubG9nKCdbZHJjcC10c2NdIGRlY2xhcmF0aW9uIGZpbGVzIGVtaXR0ZWQ6Jyk7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tY29uc29sZVxuICBlbWl0dGVkLmZvckVhY2goaW5mbyA9PiBjb25zb2xlLmxvZyhgW2RyY3AtdHNjXSBlbWl0dGVkOiAke2luZm9bMF19ICR7aW5mb1sxXX1LYmApKTtcbn0pXG4uY2F0Y2goZXJyID0+IHtcbiAgY29uc29sZS5lcnJvcignW2NoaWxkLXByb2Nlc3MgdHNjXSBUeXBlc2NyaXB0IGNvbXBpbGF0aW9uIGNvbnRhaW5zIGVycm9ycycpO1xuICBjb25zb2xlLmVycm9yKGVycik7XG59KTtcblxuIl19
