"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
// import api from '__api';
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const typescript_1 = tslib_1.__importDefault(require("typescript"));
const typescript_2 = require("typescript");
const { green, yellow } = require('chalk');
// const log = require('log4js').getLogger('ts-ast-query');
function printFile(fileName) {
    if (!fileName) {
        // tslint:disable-next-line
        console.log('Usage:\n' + green('drcp run @dr-core/ng-app-builder/dist/utils/ts-ast-query --file <ts file>'));
        return;
    }
    new Selector(fs.readFileSync(fileName, 'utf8'), fileName).printAll();
}
exports.printFile = printFile;
// type Callback = (ast: ts.Node, path: string[]) => boolean | void;
class Selector {
    constructor(src, file) {
        if (typeof src === 'string') {
            this.src = typescript_1.default.createSourceFile(file || 'unknown', src, typescript_1.default.ScriptTarget.ESNext, true, typescript_1.default.ScriptKind.TSX);
        }
        else {
            this.src = src;
        }
    }
    findWith(...arg) {
        let query;
        let ast;
        let callback;
        if (typeof arg[0] === 'string') {
            ast = this.src;
            query = arg[0];
            callback = arg[1];
        }
        else {
            ast = arg[0];
            query = arg[1];
            callback = arg[2];
        }
        let res = null;
        const q = new Query(query);
        this.traverse(ast, (ast, path, parents) => {
            if (res != null)
                return true;
            if (q.matches(path)) {
                res = callback(ast, path, parents);
                if (res != null)
                    return true;
            }
        });
        return res;
    }
    findAll(ast, query) {
        let q;
        if (typeof ast === 'string') {
            query = ast;
            q = new Query(ast);
            ast = this.src;
        }
        else {
            q = new Query(query);
        }
        const res = [];
        this.traverse(ast, (ast, path, _parents, _isLeaf) => {
            if (q.matches(path)) {
                res.push(ast);
            }
        });
        return res;
    }
    findFirst(ast, query) {
        let q;
        if (typeof ast === 'string') {
            query = ast;
            q = new Query(query);
            ast = this.src;
        }
        else {
            q = new Query(query);
        }
        let res;
        this.traverse(ast, (ast, path) => {
            if (res)
                return true;
            if (q.matches(path)) {
                res = ast;
                return true;
            }
        });
        return res;
    }
    list(ast = this.src) {
        let out = '';
        this.traverse(ast, (node, path, _parents, noChild) => {
            if (noChild) {
                out += path.join('>') + ' ' + node.getText(this.src);
                out += '\n';
            }
        });
        return out;
    }
    printAll(ast = this.src) {
        this.traverse(ast, (node, path, _parents, noChild) => {
            if (noChild) {
                // tslint:disable-next-line:no-console
                console.log(path.join('>'), green(node.getText(this.src)));
            }
        });
    }
    printAllNoType(ast = this.src) {
        this.traverse(ast, (node, path, _parents, noChild) => {
            if (noChild) {
                // tslint:disable-next-line:no-console
                console.log(path.map(name => name.split(':')[0]).join('>'), green(node.getText(this.src)));
            }
        });
    }
    /**
       *
       * @param ast
       * @param cb return true to skip traversing child node
       * @param level default 0
       */
    traverse(ast, cb, propName = '', parents = [], pathEls = []) {
        let needPopPathEl = false;
        // if (ast.kind !== ts.SyntaxKind.SourceFile) {
        // let propName = parents[parents.length - 1] === this.src ? '' : this._findParentPropName(ast, parents);
        let pathEl = ':' + typescript_2.SyntaxKind[ast.kind];
        if (propName)
            pathEl = '.' + propName + pathEl;
        pathEls.push(pathEl);
        needPopPathEl = true;
        // }
        const res = cb(ast, pathEls, parents, ast.getChildCount(this.src) <= 0);
        if (res !== true) {
            parents.push(ast);
            const _value2key = new Map();
            // tslint:disable-next-line:forin
            // for (const key in ast) {
            const self = this;
            for (const key of Object.keys(ast)) {
                if (key === 'parent' || key === 'kind')
                    continue;
                _value2key.set(ast[key], key);
            }
            typescript_1.default.forEachChild(ast, sub => {
                self.traverse(sub, cb, _value2key.get(sub), parents, pathEls);
            }, subArray => self.traverseArray(subArray, cb, _value2key.get(subArray), parents, pathEls));
            parents.pop();
        }
        if (needPopPathEl)
            pathEls.pop();
    }
    pathForAst(ast) {
        const pathEls = [];
        let p = ast;
        while (p && p !== this.src) {
            pathEls.push(this.propNameForAst(p) + ':' + typescript_2.SyntaxKind[p.kind]);
            p = p.parent;
        }
        return pathEls.reverse().join('>');
    }
    propNameForAst(ast) {
        const p = ast.parent;
        for (const prop of Object.keys(p)) {
            const value = p[prop];
            if (prop === 'parent' || prop === 'kind')
                continue;
            if (Array.isArray(value)) {
                const idx = value.indexOf(ast);
                if (idx >= 0) {
                    return prop + `[${idx}]`;
                }
            }
            if (value === ast) {
                return prop;
            }
        }
        return '';
    }
    traverseArray(nodes, cb, propName = '', parents = [], pathEls = []) {
        let i = 0;
        for (const ast of nodes) {
            this.traverse(ast, cb, propName + `[${i++}]`, parents, pathEls);
        }
    }
}
exports.default = Selector;
class Query {
    constructor(query) {
        this.fromRoot = false;
        if (query.startsWith('^')) {
            query = query.slice(1);
            this.fromRoot = true;
        }
        this.queryPaths = query.trim()
            .replace(/\s*>\s*/g, '>')
            .split(/\s+/)
            .map(paths => paths.split('>')
            .map(singleAstDesc => this._parseDesc(singleAstDesc)).reverse())
            .reverse();
    }
    matches(path) {
        let testPos = path.length - 1;
        const startTestPos = testPos;
        for (const consecutiveNodes of this.queryPaths.slice(0)) {
            while (true) {
                if (this.matchesConsecutiveNodes(consecutiveNodes, path, testPos)) {
                    testPos -= consecutiveNodes.length;
                    break;
                }
                else if (testPos === startTestPos) {
                    return false;
                }
                else {
                    testPos--;
                }
                if (consecutiveNodes.length > testPos + 1)
                    return false;
            }
        }
        return this.fromRoot ? testPos === 0 : true;
    }
    _parseDesc(singleAstDesc) {
        const astChar = {};
        // tslint:disable-next-line
        let m = /^(?:\.([a-zA-Z0-9_$]+)(?:\[([0-9]*)\])?)?(?:\:([a-zA-Z0-9_$]+))?$|^\*$/.exec(singleAstDesc);
        if (m == null) {
            throw new Error(`Invalid query string "${yellow(singleAstDesc)}"`);
        }
        if (m[1]) {
            astChar.propertyName = m[1];
            if (m[2])
                astChar.propIndex = parseInt(m[2], 10);
        }
        if (m[3])
            astChar.kind = m[3];
        // if (m[4])
        // 	astChar.text = new RegExp(m[4]);
        return astChar;
    }
    matchesAst(query, target) {
        for (const key of Object.keys(query)) {
            const value = query[key];
            if (lodash_1.default.isRegExp(value)) {
                if (!value.test(target[key]))
                    return false;
            }
            else if (target[key] !== value)
                return false;
        }
        return true;
    }
    /**
     * predicte if it matches ">" connected path expression
     * @param queryNodes all items in reversed order
     * @param path
     * @param testPos starts with path.length - 1
     */
    matchesConsecutiveNodes(queryNodes, path, testPos) {
        if (queryNodes.length > testPos + 1)
            return false;
        for (const query of queryNodes.slice(0)) {
            const target = this._parseDesc(path[testPos--]);
            if (!this.matchesAst(query, target))
                return false;
        }
        return true;
    }
}
exports.Query = Query;

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci90cy91dGlscy90cy1hc3QtcXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0NBQXlCO0FBQ3pCLDJCQUEyQjtBQUMzQiw0REFBdUI7QUFDdkIsb0VBQTRCO0FBQzVCLDJDQUE4QztBQUM5QyxNQUFNLEVBQUMsS0FBSyxFQUFFLE1BQU0sRUFBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6QywyREFBMkQ7QUFFM0QsU0FBZ0IsU0FBUyxDQUFDLFFBQWdCO0lBQ3hDLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYiwyQkFBMkI7UUFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLDJFQUEyRSxDQUFDLENBQUMsQ0FBQztRQUMzRyxPQUFPO0tBQ1I7SUFDRCxJQUFJLFFBQVEsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUN2RSxDQUFDO0FBUEQsOEJBT0M7QUFFRCxvRUFBb0U7QUFDcEUsTUFBcUIsUUFBUTtJQUszQixZQUFZLEdBQTJCLEVBQUUsSUFBYTtRQUNwRCxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtZQUMzQixJQUFJLENBQUMsR0FBRyxHQUFHLG9CQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxJQUFJLFNBQVMsRUFBRSxHQUFHLEVBQUUsb0JBQUUsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUMzRSxJQUFJLEVBQUUsb0JBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7YUFBTTtZQUNMLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1NBQ2hCO0lBQ0gsQ0FBQztJQWlCRCxRQUFRLENBQUksR0FBRyxHQUFVO1FBQ3ZCLElBQUksS0FBYSxDQUFDO1FBQ2xCLElBQUksR0FBWSxD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S0FBSyxLQUFLO2dCQUN2QyxPQUFPLEtBQUssQ0FBQztTQUNoQjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssdUJBQXVCLENBQUMsVUFBMEIsRUFBRSxJQUFjLEVBQUUsT0FBZTtRQUN6RixJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsT0FBTyxHQUFHLENBQUM7WUFDakMsT0FBTyxLQUFLLENBQUM7UUFDZixLQUFLLE1BQU0sS0FBSyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDdkMsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUM7Z0JBQ2pDLE9BQU8sS0FBSyxDQUFDO1NBQ2hCO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFwRkQsc0JBb0ZDIiwiZmlsZSI6Im5vZGVfbW9kdWxlcy9AZHItY29yZS9uZy1hcHAtYnVpbGRlci9kaXN0L3V0aWxzL3RzLWFzdC1xdWVyeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbi8vIGltcG9ydCBhcGkgZnJvbSAnX19hcGknO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7IFN5bnRheEtpbmQgYXMgc2sgfSBmcm9tICd0eXBlc2NyaXB0JztcbmNvbnN0IHtncmVlbiwgeWVsbG93fSA9IHJlcXVpcmUoJ2NoYWxrJyk7XG4vLyBjb25zdCBsb2cgPSByZXF1aXJlKCdsb2c0anMnKS5nZXRMb2dnZXIoJ3RzLWFzdC1xdWVyeScpO1xuXG5leHBvcnQgZnVuY3Rpb24gcHJpbnRGaWxlKGZpbGVOYW1lOiBzdHJpbmcpIHtcbiAgaWYgKCFmaWxlTmFtZSkge1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuXHRcdGNvbnNvbGUubG9nKCdVc2FnZTpcXG4nICsgZ3JlZW4oJ2RyY3AgcnVuIEBkci1jb3JlL25nLWFwcC1idWlsZGVyL2Rpc3QvdXRpbHMvdHMtYXN0LXF1ZXJ5IC0tZmlsZSA8dHMgZmlsZT4nKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIG5ldyBTZWxlY3Rvcihmcy5yZWFkRmlsZVN5bmMoZmlsZU5hbWUsICd1dGY4JyksIGZpbGVOYW1lKS5wcmludEFsbCgpO1xufVxuXG4vLyB0eXBlIENhbGxiYWNrID0gKGFzdDogdHMuTm9kZSwgcGF0aDogc3RyaW5nW10pID0+IGJvb2xlYW4gfCB2b2lkO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VsZWN0b3Ige1xuICBzcmM6IHRzLlNvdXJjZUZpbGU7XG5cbiAgY29uc3RydWN0b3Ioc3JjOiBzdHJpbmcsIGZpbGU6IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKHNyYzogdHMuU291cmNlRmlsZSk7XG4gIGNvbnN0cnVjdG9yKHNyYzogdHMuU291cmNlRmlsZSB8IHN0cmluZywgZmlsZT86IHN0cmluZykge1xuICAgIGlmICh0eXBlb2Ygc3JjID09PSAnc3RyaW5nJykge1xuICAgICAgdGhpcy5zcmMgPSB0cy5jcmVhdGVTb3VyY2VGaWxlKGZpbGUgfHwgJ3Vua25vd24nLCBzcmMsIHRzLlNjcmlwdFRhcmdldC5FU05leHQsXG4gICAgICAgIHRydWUsIHRzLlNjcmlwdEtpbmQuVFNYKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zcmMgPSBzcmM7XG4gICAgfVxuICB9XG5cbiAgLyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0gcXVlcnkgTGlrZSBDU1Mgc2VsZWN0IDo9IFtcIl5cIl0gPHNlbGVjdG9yIGVsZW1lbnQ+IChcIiBcIiB8IFwiPlwiKSA8c2VsZWN0b3IgZWxlbWVudD5cblx0ICogICB3aGVyZSA8c2VsZWN0b3IgZWxlbWVudD4gOj0gXCIuXCIgPHByb3BlcnR5IG5hbWU+IDxpbmRleD4/IHwgXCI6XCIgPFR5cGVzY3JpcHQgU3ludGF4IGtpbmQgbmFtZT4gfCAqXG5cdCAqICAgd2hlcmUgPGluZGV4PiA6PSBcIltcIiBcIjBcIi1cIjlcIiBcIl1cIlxuICAgKiBcblx0ICogZS5nLlxuXHQgKiAgLSAuZWxlbWVudHM6SW1wb3J0U3BlY2lmaWVyID4gLm5hbWVcblx0ICogIC0gLmVsZW1lbnRzWzJdID4gLm5hbWVcblx0ICogIC0gXi5zdGF0ZW1lbnRzWzBdIDpJbXBvcnRTcGVjaWZpZXIgPiA6SWRlbnRpZmllclxuICAgKiBCZWdpbmluZyB3aXRoIFwiXlwiIG1lYW5zIHN0cmljdGx5IGNvbXBhcmluZyBmcm9tIGZpcnN0IHF1ZXJpZWQgQVNUIG5vZGVcblx0ICogQHBhcmFtIGNhbGxiYWNrIFxuXHQgKi9cbiAgZmluZFdpdGg8VD4ocXVlcnk6IHN0cmluZywgY2FsbGJhY2s6IChhc3Q6IHRzLk5vZGUsIHBhdGg6IHN0cmluZ1tdLCBwYXJlbnRzOiB0cy5Ob2RlW10pID0+IFQpOiBUIHwgbnVsbDtcbiAgZmluZFdpdGg8VD4oYXN0OiB0cy5Ob2RlLCBxdWVyeTogc3RyaW5nLCBjYWxsYmFjazogKGFzdDogdHMuTm9kZSwgcGF0aDogc3RyaW5nW10sIHBhcmVudHM6IHRzLk5vZGVbXSkgPT4gVCk6IFQgfCBudWxsO1xuICBmaW5kV2l0aDxUPiguLi5hcmc6IGFueVtdKTogVCB8IG51bGwge1xuICAgIGxldCBxdWVyeTogc3RyaW5nO1xuICAgIGxldCBhc3Q6IHRzLk5vZGU7XG4gICAgbGV0IGNhbGxiYWNrOiAoYXN0OiB0cy5Ob2RlLCBwYXRoOiBzdHJpbmdbXSwgcGFyZW50czogdHMuTm9kZVtdKSA9PiBUO1xuICAgIGlmICh0eXBlb2YgYXJnWzBdID09PSAnc3RyaW5nJykge1xuICAgICAgYXN0ID0gdGhpcy5zcmM7XG4gICAgICBxdWVyeSA9IGFyZ1swXTtcbiAgICAgIGNhbGxiYWNrID0gYXJnWzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBhc3QgPSBhcmdbMF07XG4gICAgICBxdWVyeSA9IGFyZ1sxXTtcbiAgICAgIGNhbGxiYWNrID0gYXJnWzJdO1xuICAgIH1cbiAgICBsZXQgcmVzOiBUIHwgbnVsbCA9IG51bGw7XG4gICAgY29uc3QgcSA9IG5ldyBRdWVyeShxdWVyeSEpO1xuXG4gICAgdGhpcy50cmF2ZXJzZShhc3QsIChhc3QsIHBhdGgsIHBhcmVudHMpID0+IHtcbiAgICAgIGlmIChyZXMgIT0gbnVsbClcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBpZiAocS5tYXRjaGVzKHBhdGgpKSB7XG4gICAgICAgIHJlcyA9IGNhbGxiYWNrKGFzdCwgcGF0aCwgcGFyZW50cyk7XG4gICAgICAgIGlmIChyZXMgIT0gbnVsbClcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgLyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0gYXN0IHJvb3QgQVNUIG5vZGVcblx0ICogQHBhcmFtIHF1ZXJ5IExpa2UgQ1NTIHNlbGVjdCA6PSBbXCJeXCJdIDxzZWxlY3RvciBlbGVtZW50PiAoXCIgXCIgfCBcIj5cIikgPHNlbGVjdG9yIGVsZW1lbnQ+XG5cdCAqICAgd2hlcmUgPHNlbGVjdG9yIGVsZW1lbnQ+IDo9IFwiLlwiIDxwcm9wZXJ0eSBuYW1lPiA8aW5kZXg+PyB8IFwiOlwiIDxUeXBlc2NyaXB0IFN5bnRheCBraW5kIG5hbWU+IHwgKlxuXHQgKiAgIHdoZXJlIDxpbmRleD4gOj0gXCJbXCIgXCIwXCItXCI5XCIgXCJdXCJcblx0ICogZS5nLlxuXHQgKiAgLSAuZWxlbWVudHM6SW1wb3J0U3BlY2lmaWVyID4gLm5hbWVcblx0ICogIC0gLmVsZW1lbnRzWzJdID4gLm5hbWVcblx0ICogIC0gLnN0YXRlbWVudHNbMF0gOkltcG9ydFNwZWNpZmllciA+IDpJZGVudGlmaWVyXG5cdCAqL1xuICBmaW5kQWxsKHF1ZXJ5OiBzdHJpbmcpOiB0cy5Ob2RlW107XG4gIGZpbmRBbGwoYXN0OiB0cy5Ob2RlLCBxdWVyeTogc3RyaW5nKTogdHMuTm9kZVtdO1xuICBmaW5kQWxsKGFzdDogdHMuTm9kZSB8IHN0cmluZywgcXVlcnk/OiBzdHJpbmcpOiB0cy5Ob2RlW10ge1xuICAgIGxldCBxOiBRdWVyeTtcbiAgICBpZiAodHlwZW9mIGFzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHF1ZXJ5ID0gYXN0O1xuICAgICAgcSA9IG5ldyBRdWVyeShhc3QpO1xuICAgICAgYXN0ID0gdGhpcy5zcmM7XG4gICAgfSBlbHNlIHtcbiAgICAgIHEgPSBuZXcgUXVlcnkocXVlcnkhKTtcbiAgICB9XG5cbiAgICBjb25zdCByZXM6IHRzLk5vZGVbXSA9IFtdO1xuICAgIHRoaXMudHJhdmVyc2UoYXN0LCAoYXN0LCBwYXRoLCBfcGFyZW50cywgX2lzTGVhZikgPT4ge1xuICAgICAgaWYgKHEubWF0Y2hlcyhwYXRoKSkge1xuICAgICAgICByZXMucHVzaChhc3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXM7XG4gIH1cbiAgLyoqXG5cdCAqIFxuXHQgKiBAcGFyYW0gYXN0IHJvb3QgQVNUIG5vZGVcblx0ICogQHBhcmFtIHF1ZXJ5IExpa2UgQ1NTIHNlbGVjdCA6PSBbXCJeXCJdIDxzZWxlY3RvciBlbGVtZW50PiAoXCIgXCIgfCBcIj5cIikgPHNlbGVjdG9yIGVsZW1lbnQ+XG5cdCAqICAgd2hlcmUgPHNlbGVjdG9yIGVsZW1lbnQ+IDo9IFwiLlwiIDxwcm9wZXJ0eSBuYW1lPiA8aW5kZXg+PyB8IFwiOlwiIDxUeXBlc2NyaXB0IFN5bnRheCBraW5kIG5hbWU+IHwgKlxuXHQgKiAgIHdoZXJlIDxpbmRleD4gOj0gXCJbXCIgXCIwXCItXCI5XCIgXCJdXCJcblx0ICogZS5nLlxuXHQgKiAgLSAuZWxlbWVudHM6SW1wb3J0U3BlY2lmaWVyID4gLm5hbWVcblx0ICogIC0gLmVsZW1lbnRzWzJdID4gLm5hbWVcblx0ICogIC0gLnN0YXRlbWVudHNbMF0gOkltcG9ydFNwZWNpZmllciA+IDpJZGVudGlmaWVyXG5cdCAqL1xuICBmaW5kRmlyc3QocXVlcnk6IHN0cmluZyk6IHRzLk5vZGUgfCB1bmRlZmluZWQ7XG4gIGZpbmRGaXJzdChhc3Q6IHRzLk5vZGUsIHF1ZXJ5OiBzdHJpbmcpOiB0cy5Ob2RlIHwgdW5kZWZpbmVkO1xuICBmaW5kRmlyc3QoYXN0OiB0cy5Ob2RlIHwgc3RyaW5nLCBxdWVyeT86IHN0cmluZyk6IHRzLk5vZGUgfCB1bmRlZmluZWQge1xuICAgIGxldCBxOiBRdWVyeTtcbiAgICBpZiAodHlwZW9mIGFzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHF1ZXJ5ID0gYXN0O1xuICAgICAgcSA9IG5ldyBRdWVyeShxdWVyeSk7XG4gICAgICBhc3QgPSB0aGlzLnNyYztcbiAgICB9IGVsc2Uge1xuICAgICAgcSA9IG5ldyBRdWVyeShxdWVyeSEpO1xuICAgIH1cbiAgICBsZXQgcmVzOiB0cy5Ob2RlIHwgdW5kZWZpbmVkO1xuICAgIHRoaXMudHJhdmVyc2UoYXN0LCAoYXN0LCBwYXRoKSA9PiB7XG4gICAgICBpZiAocmVzKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmIChxLm1hdGNoZXMocGF0aCkpIHtcbiAgICAgICAgcmVzID0gYXN0O1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmVzO1xuICB9XG5cbiAgbGlzdChhc3Q6IHRzLk5vZGUgPSB0aGlzLnNyYykge1xuICAgIGxldCBvdXQgPSAnJztcbiAgICB0aGlzLnRyYXZlcnNlKGFzdCwgKG5vZGUsIHBhdGgsIF9wYXJlbnRzLCBub0NoaWxkKSA9PiB7XG4gICAgICBpZiAobm9DaGlsZCkge1xuICAgICAgICBvdXQgKz0gcGF0aC5qb2luKCc+JykgKyAnICcgKyBub2RlLmdldFRleHQodGhpcy5zcmMpO1xuICAgICAgICBvdXQgKz0gJ1xcbic7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIHByaW50QWxsKGFzdDogdHMuTm9kZSA9IHRoaXMuc3JjKSB7XG4gICAgdGhpcy50cmF2ZXJzZShhc3QsIChub2RlLCBwYXRoLCBfcGFyZW50cywgbm9DaGlsZCkgPT4ge1xuICAgICAgaWYgKG5vQ2hpbGQpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5sb2cocGF0aC5qb2luKCc+JyksIGdyZWVuKG5vZGUuZ2V0VGV4dCh0aGlzLnNyYykpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHByaW50QWxsTm9UeXBlKGFzdDogdHMuTm9kZSA9IHRoaXMuc3JjKSB7XG4gICAgdGhpcy50cmF2ZXJzZShhc3QsIChub2RlLCBwYXRoLCBfcGFyZW50cywgbm9DaGlsZCkgPT4ge1xuICAgICAgaWYgKG5vQ2hpbGQpIHtcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbnNvbGVcbiAgICAgICAgY29uc29sZS5sb2cocGF0aC5tYXAobmFtZSA9PiBuYW1lLnNwbGl0KCc6JylbMF0pLmpvaW4oJz4nKSwgZ3JlZW4obm9kZS5nZXRUZXh0KHRoaXMuc3JjKSkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIC8qKlxuXHQgKiBcblx0ICogQHBhcmFtIGFzdCBcblx0ICogQHBhcmFtIGNiIHJldHVybiB0cnVlIHRvIHNraXAgdHJhdmVyc2luZyBjaGlsZCBub2RlXG5cdCAqIEBwYXJhbSBsZXZlbCBkZWZhdWx0IDBcblx0ICovXG4gIHRyYXZlcnNlKGFzdDogdHMuTm9kZSxcbiAgICBjYjogKGFzdDogdHMuTm9kZSwgcGF0aDogc3RyaW5nW10sIHBhcmVudHM6IHRzLk5vZGVbXSwgaXNMZWFmOiBib29sZWFuKSA9PiBib29sZWFuIHwgdm9pZCxcbiAgICBwcm9wTmFtZSA9ICcnLCBwYXJlbnRzOiB0cy5Ob2RlW10gPSBbXSwgcGF0aEVsczogc3RyaW5nW10gPSBbXSkge1xuXG4gICAgbGV0IG5lZWRQb3BQYXRoRWwgPSBmYWxzZTtcblxuICAgIC8vIGlmIChhc3Qua2luZCAhPT0gdHMuU3ludGF4S2luZC5Tb3VyY2VGaWxlKSB7XG4gICAgICAvLyBsZXQgcHJvcE5hbWUgPSBwYXJlbnRzW3BhcmVudHMubGVuZ3RoIC0gMV0gPT09IHRoaXMuc3JjID8gJycgOiB0aGlzLl9maW5kUGFyZW50UHJvcE5hbWUoYXN0LCBwYXJlbnRzKTtcbiAgICBsZXQgcGF0aEVsID0gJzonICsgc2tbYXN0LmtpbmRdO1xuICAgIGlmIChwcm9wTmFtZSlcbiAgICAgIHBhdGhFbCA9ICcuJyArIHByb3BOYW1lICsgcGF0aEVsO1xuICAgIHBhdGhFbHMucHVzaChwYXRoRWwpO1xuICAgIG5lZWRQb3BQYXRoRWwgPSB0cnVlO1xuICAgIC8vIH1cblxuICAgIGNvbnN0IHJlcyA9IGNiKGFzdCwgcGF0aEVscywgcGFyZW50cywgYXN0LmdldENoaWxkQ291bnQodGhpcy5zcmMpIDw9IDApO1xuXG4gICAgaWYgKHJlcyAhPT0gdHJ1ZSkge1xuICAgICAgcGFyZW50cy5wdXNoKGFzdCk7XG4gICAgICBjb25zdCBfdmFsdWUya2V5ID0gbmV3IE1hcDxhbnksIHN0cmluZz4oKTtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpmb3JpblxuICAgICAgLy8gZm9yIChjb25zdCBrZXkgaW4gYXN0KSB7XG4gICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKGFzdCkpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gJ3BhcmVudCcgfHwga2V5ID09PSAna2luZCcpXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgX3ZhbHVlMmtleS5zZXQoKGFzdCBhcyBhbnkpW2tleV0sIGtleSk7XG4gICAgICB9XG4gICAgICB0cy5mb3JFYWNoQ2hpbGQoYXN0LCBzdWIgPT4ge1xuICAgICAgICAgIHNlbGYudHJhdmVyc2Uoc3ViLCBjYiwgX3ZhbHVlMmtleS5nZXQoc3ViKSwgcGFyZW50cywgcGF0aEVscyk7XG4gICAgICAgIH0sXG4gICAgICAgIHN1YkFycmF5ID0+IHNlbGYudHJhdmVyc2VBcnJheShzdWJBcnJheSwgY2IsIF92YWx1ZTJrZXkuZ2V0KHN1YkFycmF5KSwgcGFyZW50cywgcGF0aEVscylcbiAgICAgICk7XG4gICAgICBwYXJlbnRzLnBvcCgpO1xuICAgIH1cbiAgICBpZiAobmVlZFBvcFBhdGhFbClcbiAgICAgIHBhdGhFbHMucG9wKCk7XG4gIH1cblxuICBwYXRoRm9yQXN0KGFzdDogdHMuTm9kZSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGF0aEVsczogc3RyaW5nW10gPSBbXTtcbiAgICBsZXQgcCA9IGFzdDtcbiAgICB3aGlsZSAocCAmJiBwICE9PSB0aGlzLnNyYykge1xuICAgICAgcGF0aEVscy5wdXNoKHRoaXMucHJvcE5hbWVGb3JBc3QocCkgKyAnOicgKyBza1twLmtpbmRdKTtcbiAgICAgIHAgPSBwLnBhcmVudDtcbiAgICB9XG4gICAgcmV0dXJuIHBhdGhFbHMucmV2ZXJzZSgpLmpvaW4oJz4nKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBwcm9wTmFtZUZvckFzdChhc3Q6IHRzLk5vZGUpOiBzdHJpbmcge1xuICAgIGNvbnN0IHAgPSBhc3QucGFyZW50O1xuICAgIGZvciAoY29uc3QgcHJvcCBvZiBPYmplY3Qua2V5cyhwKSkge1xuICAgICAgY29uc3QgdmFsdWUgPSAocCBhcyBhbnkpW3Byb3BdO1xuICAgICAgaWYgKHByb3AgPT09ICdwYXJlbnQnIHx8IHByb3AgPT09ICdraW5kJylcbiAgICAgICAgY29udGludWU7XG4gICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgY29uc3QgaWR4ID0gKHZhbHVlIGFzIGFueVtdKS5pbmRleE9mKGFzdCk7XG4gICAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAgIHJldHVybiBwcm9wICsgYFske2lkeH1dYDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZhbHVlID09PSBhc3QpIHtcbiAgICAgICAgcmV0dXJuIHByb3A7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIHByb3RlY3RlZCB0cmF2ZXJzZUFycmF5KG5vZGVzOiB0cy5Ob2RlQXJyYXk8dHMuTm9kZT4sXG4gICAgY2I6IChhc3Q6IHRzLk5vZGUsIHBhdGg6IHN0cmluZ1tdLCBwYXJlbnRzOiB0cy5Ob2RlW10sIGlzTGVhZjogYm9vbGVhbikgPT4gYm9vbGVhbiB8IHZvaWQsXG4gICAgcHJvcE5hbWUgPSAnJywgcGFyZW50czogdHMuTm9kZVtdID0gW10sIHBhdGhFbHM6IHN0cmluZ1tdID0gW10pIHtcblxuICAgIGxldCBpID0gMDtcbiAgICBmb3IgKGNvbnN0IGFzdCBvZiBub2Rlcykge1xuICAgICAgdGhpcy50cmF2ZXJzZShhc3QsIGNiLCBwcm9wTmFtZSArIGBbJHtpKyt9XWAsIHBhcmVudHMsIHBhdGhFbHMpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzdENoYXJhY3RlciB7XG4gIHByb3BlcnR5TmFtZT86IHN0cmluZztcbiAgcHJvcEluZGV4PzogbnVtYmVyO1xuICBraW5kPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFzdFF1ZXJ5IGV4dGVuZHMgQXN0Q2hhcmFjdGVyIHtcbiAgdGV4dD86IFJlZ0V4cDtcbn1cblxuZXhwb3J0IGNsYXNzIFF1ZXJ5IHtcbiAgcXVlcnlQYXRoczogQXN0Q2hhcmFjdGVyW11bXTsgLy8gaW4gcmV2ZXJzZWQgb3JkZXJcbiAgcHJpdmF0ZSBmcm9tUm9vdCA9IGZhbHNlO1xuXG4gIGNvbnN0cnVjdG9yKHF1ZXJ5OiBzdHJpbmcpIHtcbiAgICBpZiAocXVlcnkuc3RhcnRzV2l0aCgnXicpKSB7XG4gICAgICBxdWVyeSA9IHF1ZXJ5LnNsaWNlKDEpO1xuICAgICAgdGhpcy5mcm9tUm9vdCA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMucXVlcnlQYXRocyA9IHF1ZXJ5LnRyaW0oKVxuICAgICAgLnJlcGxhY2UoL1xccyo+XFxzKi9nLCAnPicpXG4gICAgICAuc3BsaXQoL1xccysvKVxuICAgICAgLm1hcChwYXRocyA9PiBwYXRocy5zcGxpdCgnPicpXG4gICAgICAgIC5tYXAoc2luZ2xlQXN0RGVzYyA9PiB0aGlzLl9wYXJzZURlc2Moc2luZ2xlQXN0RGVzYykpLnJldmVyc2UoKSlcbiAgICAgIC5yZXZlcnNlKCk7XG4gIH1cblxuICBtYXRjaGVzKHBhdGg6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gICAgbGV0IHRlc3RQb3MgPSBwYXRoLmxlbmd0aCAtIDE7XG4gICAgY29uc3Qgc3RhcnRUZXN0UG9zID0gdGVzdFBvcztcbiAgICBmb3IgKGNvbnN0IGNvbnNlY3V0aXZlTm9kZXMgb2YgdGhpcy5xdWVyeVBhdGhzLnNsaWNlKDApKSB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5tYXRjaGVzQ29uc2VjdXRpdmVOb2Rlcyhjb25zZWN1dGl2ZU5vZGVzLCBwYXRoLCB0ZXN0UG9zKSkge1xuICAgICAgICAgIHRlc3RQb3MgLT0gY29uc2VjdXRpdmVOb2Rlcy5sZW5ndGg7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSBpZiAodGVzdFBvcyA9PT0gc3RhcnRUZXN0UG9zKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRlc3RQb3MtLTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uc2VjdXRpdmVOb2Rlcy5sZW5ndGggPiB0ZXN0UG9zICsgMSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmZyb21Sb290ID8gdGVzdFBvcyA9PT0gMCA6IHRydWU7XG4gIH1cblxuICBwcm90ZWN0ZWQgX3BhcnNlRGVzYyhzaW5nbGVBc3REZXNjOiBzdHJpbmcpOiBBc3RRdWVyeSB7XG4gICAgY29uc3QgYXN0Q2hhcjogQXN0UXVlcnkgPSB7fTtcbiAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZVxuXHRcdFx0bGV0IG0gPSAvXig/OlxcLihbYS16QS1aMC05XyRdKykoPzpcXFsoWzAtOV0qKVxcXSk/KT8oPzpcXDooW2EtekEtWjAtOV8kXSspKT8kfF5cXCokLy5leGVjKHNpbmdsZUFzdERlc2MpO1xuICAgICAgaWYgKG0gPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcXVlcnkgc3RyaW5nIFwiJHt5ZWxsb3coc2luZ2xlQXN0RGVzYyl9XCJgKTtcbiAgICAgIH1cbiAgICAgIGlmIChtWzFdKSB7XG4gICAgICAgIGFzdENoYXIucHJvcGVydHlOYW1lID0gbVsxXTtcbiAgICAgICAgaWYgKG1bMl0pXG4gICAgICAgICAgYXN0Q2hhci5wcm9wSW5kZXggPSBwYXJzZUludChtWzJdLCAxMCk7XG4gICAgICB9XG4gICAgICBpZiAobVszXSlcbiAgICAgICAgYXN0Q2hhci5raW5kID0gbVszXTtcbiAgICAgIC8vIGlmIChtWzRdKVxuICAgICAgLy8gXHRhc3RDaGFyLnRleHQgPSBuZXcgUmVnRXhwKG1bNF0pO1xuICAgICAgcmV0dXJuIGFzdENoYXI7XG4gIH1cblxuICBwcml2YXRlIG1hdGNoZXNBc3QocXVlcnk6IEFzdFF1ZXJ5LCB0YXJnZXQ6IEFzdENoYXJhY3Rlcik6IGJvb2xlYW4ge1xuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKHF1ZXJ5KSkge1xuICAgICAgY29uc3QgdmFsdWUgPSAocXVlcnkgYXMgYW55KVtrZXldO1xuICAgICAgaWYgKF8uaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICAgIGlmICghKHZhbHVlIGFzIFJlZ0V4cCkudGVzdCgodGFyZ2V0IGFzIGFueSlba2V5XSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIGlmICgodGFyZ2V0IGFzIGFueSlba2V5XSAhPT0gdmFsdWUpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogcHJlZGljdGUgaWYgaXQgbWF0Y2hlcyBcIj5cIiBjb25uZWN0ZWQgcGF0aCBleHByZXNzaW9uIFxuICAgKiBAcGFyYW0gcXVlcnlOb2RlcyBhbGwgaXRlbXMgaW4gcmV2ZXJzZWQgb3JkZXJcbiAgICogQHBhcmFtIHBhdGggXG4gICAqIEBwYXJhbSB0ZXN0UG9zIHN0YXJ0cyB3aXRoIHBhdGgubGVuZ3RoIC0gMVxuICAgKi9cbiAgcHJpdmF0ZSBtYXRjaGVzQ29uc2VjdXRpdmVOb2RlcyhxdWVyeU5vZGVzOiBBc3RDaGFyYWN0ZXJbXSwgcGF0aDogc3RyaW5nW10sIHRlc3RQb3M6IG51bWJlcikge1xuICAgIGlmIChxdWVyeU5vZGVzLmxlbmd0aCA+IHRlc3RQb3MgKyAxKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAoY29uc3QgcXVlcnkgb2YgcXVlcnlOb2Rlcy5zbGljZSgwKSkge1xuICAgICAgY29uc3QgdGFyZ2V0ID0gdGhpcy5fcGFyc2VEZXNjKHBhdGhbdGVzdFBvcy0tXSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2hlc0FzdChxdWVyeSwgdGFyZ2V0KSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufVxuIl19
