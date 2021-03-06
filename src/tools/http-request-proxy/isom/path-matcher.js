"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchedHandlers = exports.addToHandlerTree = exports.DirTree = void 0;
const dir_tree_1 = require("./dir-tree");
Object.defineProperty(exports, "DirTree", { enumerable: true, get: function () { return dir_tree_1.DirTree; } });
const url_1 = __importDefault(require("url"));
// import get from 'lodash/get';
// import trimStart from 'lodash/trimStart';
const trim_1 = __importDefault(require("lodash/trim"));
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp"));
function addToHandlerTree(path, handler, tree) {
    if (path.startsWith('/'))
        path = path.slice(1);
    let leadingPath = path;
    const splittedPath = path.split('/');
    let restingRegex;
    const paramIdx = splittedPath.findIndex(element => element.startsWith(':') || /\s*\*\s*/.test(element));
    if (paramIdx >= 0) {
        leadingPath = splittedPath.slice(0, paramIdx).join('/');
        restingRegex = new RegExp('^' + splittedPath.slice(paramIdx).map(el => {
            if (el.startsWith(':')) {
                return '([^/]+)';
            }
            else if (el === '*') {
                return '.*';
            }
            else {
                return escapeRegExp_1.default(el);
            }
        }).join('\\/') + '$');
        // tslint:disable-next-line:no-console
        console.log(`[path-matcher] path ${path}'s regexp:`, restingRegex);
    }
    const data = {
        handler,
        treePath: leadingPath,
        restingRegex
    };
    const existing = tree.getData(leadingPath);
    if (existing) {
        existing.push(data);
    }
    else {
        tree.putData(leadingPath, [data]);
    }
}
exports.addToHandlerTree = addToHandlerTree;
function matchedHandlers(tree, reqUrl) {
    reqUrl = trim_1.default(reqUrl, '/');
    const found = [];
    lookup(found, tree, reqUrl);
    const parsedReqUrl = url_1.default.parse(reqUrl);
    if (parsedReqUrl.query) {
        lookup(found, tree, parsedReqUrl.pathname || '');
    }
    return found;
}
exports.matchedHandlers = matchedHandlers;
function lookup(found, tree, reqUrl) {
    tree.getAllData(reqUrl).forEach(shandlers => {
        for (const sh of shandlers) {
            let restingReqUrl = reqUrl.slice(sh.treePath.length);
            restingReqUrl = trim_1.default(restingReqUrl, '/');
            if (sh.restingRegex == null) {
                if (restingReqUrl.length === 0) {
                    found.push(sh.handler);
                    continue;
                }
                continue;
            }
            const re = sh.restingRegex.exec(restingReqUrl);
            if (re) {
                found.push(sh.handler);
            }
        }
        return false;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC1tYXRjaGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGF0aC1tYXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLHlDQUFtQztBQVEzQix3RkFSQSxrQkFBTyxPQVFBO0FBTmYsOENBQXNCO0FBQ3RCLGdDQUFnQztBQUNoQyw0Q0FBNEM7QUFDNUMsdURBQStCO0FBQy9CLHVFQUErQztBQXdCL0MsU0FBZ0IsZ0JBQWdCLENBQzlCLElBQVksRUFBRSxPQUFVLEVBQUUsSUFBaUM7SUFDM0QsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUN0QixJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQyxJQUFJLFlBQWdDLENBQUM7SUFDckMsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3hHLElBQUksUUFBUSxJQUFJLENBQUMsRUFBRTtRQUNqQixXQUFXLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3hELFlBQVksR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFDcEUsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN0QixPQUFPLFNBQVMsQ0FBQzthQUNsQjtpQkFBTSxJQUFJLEVBQUUsS0FBSyxHQUFHLEVBQUU7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsT0FBTyxzQkFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3pCO1FBQ0gsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLHNDQUFzQztRQUN0QyxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixJQUFJLFlBQVksRUFBRSxZQUFZLENBQUMsQ0FBQztLQUNwRTtJQUVELE1BQU0sSUFBSSxHQUFxQjtRQUM3QixPQUFPO1FBQ1AsUUFBUSxFQUFFLFdBQVc7UUFDckIsWUFBWTtLQUNiLENBQUM7SUFDRixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzNDLElBQUksUUFBUSxFQUFFO1FBQ1osUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQjtTQUFNO1FBQ0wsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ25DO0FBQ0gsQ0FBQztBQWxDRCw0Q0FrQ0M7QUFFRCxTQUFnQixlQUFlLENBQUksSUFBaUMsRUFBRSxNQUFjO0lBQ2xGLE1BQU0sR0FBRyxjQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzNCLE1BQU0sS0FBSyxHQUFRLEVBQUUsQ0FBQztJQUN0QixNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM1QixNQUFNLFlBQVksR0FBRyxhQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZDLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRTtRQUN0QixNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxZQUFZLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQ2xEO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBVEQsMENBU0M7QUFFRCxTQUFTLE1BQU0sQ0FBSSxLQUFVLEVBQUUsSUFBaUMsRUFBRSxNQUFjO0lBQzlFLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzFDLEtBQUssTUFBTSxFQUFFLElBQUksU0FBUyxFQUFFO1lBQzFCLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNyRCxhQUFhLEdBQUcsY0FBSSxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUN6QyxJQUFJLEVBQUUsQ0FBQyxZQUFZLElBQUksSUFBSSxFQUFFO2dCQUMzQixJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO29CQUM5QixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDdkIsU0FBUztpQkFDVjtnQkFDRCxTQUFTO2FBQ1Y7WUFDRCxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMvQyxJQUFJLEVBQUUsRUFBRTtnQkFDTixLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN4QjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0RpclRyZWV9IGZyb20gJy4vZGlyLXRyZWUnO1xuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XG5pbXBvcnQgVXJsIGZyb20gJ3VybCc7XG4vLyBpbXBvcnQgZ2V0IGZyb20gJ2xvZGFzaC9nZXQnO1xuLy8gaW1wb3J0IHRyaW1TdGFydCBmcm9tICdsb2Rhc2gvdHJpbVN0YXJ0JztcbmltcG9ydCB0cmltIGZyb20gJ2xvZGFzaC90cmltJztcbmltcG9ydCBlc2NhcGVSZWdFeHAgZnJvbSAnbG9kYXNoL2VzY2FwZVJlZ0V4cCc7XG5cbmV4cG9ydCB7RGlyVHJlZX07XG5leHBvcnQgaW50ZXJmYWNlIE1vY2tDb250ZXh0IHtcbiAgdXJsUGFyYW0/OiB7W25hbWU6IHN0cmluZ106IHN0cmluZ307XG59XG5cbmV4cG9ydCB0eXBlIEJvZHlIYW5kbGVyID0gKHJlcTogZXhwcmVzcy5SZXF1ZXN0LFxuICBoYWNrZWRSZXFIZWFkZXJzOiB7W25hbWU6IHN0cmluZ106IHN0cmluZ30sXG4gIHJlcXVlc3RCb2R5OiBhbnksXG4gIGxhc3RSZXN1bHQ6IGFueSwgY3R4OiBNb2NrQ29udGV4dCkgPT4gYW55O1xuXG5leHBvcnQgdHlwZSBIZWFkZXJIYW5kbGVyID0gKHJlcTogZXhwcmVzcy5SZXF1ZXN0LCBoZWFkZXI6IHtbbmFtZTogc3RyaW5nXTogYW55fSkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBIYW5kbGVycyB7XG4gIFtwYXRoOiBzdHJpbmddOiBTZXQ8Qm9keUhhbmRsZXIgfCBIZWFkZXJIYW5kbGVyPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdG9yZWRIYW5kbGVyPEg+IHtcbiAgdHJlZVBhdGg6IHN0cmluZztcbiAgcmVzdGluZ1JlZ2V4PzogUmVnRXhwO1xuICBoYW5kbGVyOiBIO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9IYW5kbGVyVHJlZTxIIGV4dGVuZHMgKEJvZHlIYW5kbGVyIHwgSGVhZGVySGFuZGxlcik+KFxuICBwYXRoOiBzdHJpbmcsIGhhbmRsZXI6IEgsIHRyZWU6IERpclRyZWU8U3RvcmVkSGFuZGxlcjxIPltdPikge1xuICBpZiAocGF0aC5zdGFydHNXaXRoKCcvJykpXG4gICAgcGF0aCA9IHBhdGguc2xpY2UoMSk7XG4gIGxldCBsZWFkaW5nUGF0aCA9IHBhdGg7XG4gIGNvbnN0IHNwbGl0dGVkUGF0aCA9IHBhdGguc3BsaXQoJy8nKTtcbiAgbGV0IHJlc3RpbmdSZWdleDogUmVnRXhwIHwgdW5kZWZpbmVkO1xuICBjb25zdCBwYXJhbUlkeCA9IHNwbGl0dGVkUGF0aC5maW5kSW5kZXgoZWxlbWVudCA9PiBlbGVtZW50LnN0YXJ0c1dpdGgoJzonKSB8fCAvXFxzKlxcKlxccyovLnRlc3QoZWxlbWVudCkpO1xuICBpZiAocGFyYW1JZHggPj0gMCkge1xuICAgIGxlYWRpbmdQYXRoID0gc3BsaXR0ZWRQYXRoLnNsaWNlKDAsIHBhcmFtSWR4KS5qb2luKCcvJyk7XG4gICAgcmVzdGluZ1JlZ2V4ID0gbmV3IFJlZ0V4cCgnXicgKyBzcGxpdHRlZFBhdGguc2xpY2UocGFyYW1JZHgpLm1hcChlbCA9PiB7XG4gICAgICBpZiAoZWwuc3RhcnRzV2l0aCgnOicpKSB7XG4gICAgICAgIHJldHVybiAnKFteL10rKSc7XG4gICAgICB9IGVsc2UgaWYgKGVsID09PSAnKicpIHtcbiAgICAgICAgcmV0dXJuICcuKic7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZXNjYXBlUmVnRXhwKGVsKTtcbiAgICAgIH1cbiAgICB9KS5qb2luKCdcXFxcLycpICsgJyQnKTtcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKGBbcGF0aC1tYXRjaGVyXSBwYXRoICR7cGF0aH0ncyByZWdleHA6YCwgcmVzdGluZ1JlZ2V4KTtcbiAgfVxuXG4gIGNvbnN0IGRhdGE6IFN0b3JlZEhhbmRsZXI8SD4gPSB7XG4gICAgaGFuZGxlcixcbiAgICB0cmVlUGF0aDogbGVhZGluZ1BhdGgsXG4gICAgcmVzdGluZ1JlZ2V4XG4gIH07XG4gIGNvbnN0IGV4aXN0aW5nID0gdHJlZS5nZXREYXRhKGxlYWRpbmdQYXRoKTtcbiAgaWYgKGV4aXN0aW5nKSB7XG4gICAgZXhpc3RpbmcucHVzaChkYXRhKTtcbiAgfSBlbHNlIHtcbiAgICB0cmVlLnB1dERhdGEobGVhZGluZ1BhdGgsIFtkYXRhXSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoZWRIYW5kbGVyczxIPih0cmVlOiBEaXJUcmVlPFN0b3JlZEhhbmRsZXI8SD5bXT4sIHJlcVVybDogc3RyaW5nKTogSFtdIHtcbiAgcmVxVXJsID0gdHJpbShyZXFVcmwsICcvJyk7XG4gIGNvbnN0IGZvdW5kOiBIW10gPSBbXTtcbiAgbG9va3VwKGZvdW5kLCB0cmVlLCByZXFVcmwpO1xuICBjb25zdCBwYXJzZWRSZXFVcmwgPSBVcmwucGFyc2UocmVxVXJsKTtcbiAgaWYgKHBhcnNlZFJlcVVybC5xdWVyeSkge1xuICAgIGxvb2t1cChmb3VuZCwgdHJlZSwgcGFyc2VkUmVxVXJsLnBhdGhuYW1lIHx8ICcnKTtcbiAgfVxuICByZXR1cm4gZm91bmQ7XG59XG5cbmZ1bmN0aW9uIGxvb2t1cDxIPihmb3VuZDogSFtdLCB0cmVlOiBEaXJUcmVlPFN0b3JlZEhhbmRsZXI8SD5bXT4sIHJlcVVybDogc3RyaW5nKSB7XG4gIHRyZWUuZ2V0QWxsRGF0YShyZXFVcmwpLmZvckVhY2goc2hhbmRsZXJzID0+IHtcbiAgICBmb3IgKGNvbnN0IHNoIG9mIHNoYW5kbGVycykge1xuICAgICAgbGV0IHJlc3RpbmdSZXFVcmwgPSByZXFVcmwuc2xpY2Uoc2gudHJlZVBhdGgubGVuZ3RoKTtcbiAgICAgIHJlc3RpbmdSZXFVcmwgPSB0cmltKHJlc3RpbmdSZXFVcmwsICcvJyk7XG4gICAgICBpZiAoc2gucmVzdGluZ1JlZ2V4ID09IG51bGwpIHtcbiAgICAgICAgaWYgKHJlc3RpbmdSZXFVcmwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgZm91bmQucHVzaChzaC5oYW5kbGVyKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlID0gc2gucmVzdGluZ1JlZ2V4LmV4ZWMocmVzdGluZ1JlcVVybCk7XG4gICAgICBpZiAocmUpIHtcbiAgICAgICAgZm91bmQucHVzaChzaC5oYW5kbGVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KTtcbn1cblxuXG4iXX0=