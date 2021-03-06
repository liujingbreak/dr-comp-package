"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var promise_queque_1 = require("../promise-queque");
describe('promise-queue', function () {
    it('parallel queueUp() task should work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var actions, _loop_1, i, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    actions = [];
                    _loop_1 = function (i) {
                        actions.push(function () {
                            var idx = i;
                            console.log(idx + " start");
                            return new Promise(function (resolve) { return setTimeout(function () {
                                resolve(idx);
                                console.log(idx + " done");
                            }, 500); });
                        });
                    };
                    for (i = 0; i < 10; i++) {
                        _loop_1(i);
                    }
                    return [4 /*yield*/, promise_queque_1.queueUp(3, actions)];
                case 1:
                    res = _a.sent();
                    console.log(res, res.length);
                    return [2 /*return*/];
            }
        });
    }); });
    it('create queue and dynamically add async task to it', function () { return __awaiter(void 0, void 0, void 0, function () {
        var add, dones, _loop_2, i, _loop_3, i, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    add = promise_queque_1.queue(3).add;
                    dones = [];
                    _loop_2 = function (i) {
                        var done = add(function () {
                            var idx = i;
                            console.log(idx + " start " + new Date().toLocaleTimeString());
                            return new Promise(function (resolve) { return setTimeout(function () {
                                resolve(idx);
                                console.log(idx + " done " + new Date().toLocaleTimeString());
                            }, 500); });
                        });
                        dones.push(done);
                    };
                    for (i = 0; i < 10; i++) {
                        _loop_2(i);
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 1:
                    _c.sent();
                    _loop_3 = function (i) {
                        var done = add(function () {
                            var idx = 10 + i;
                            console.log(idx + " start " + new Date().toLocaleTimeString());
                            return new Promise(function (resolve) { return setTimeout(function () {
                                resolve(idx);
                                console.log(idx + " done " + new Date().toLocaleTimeString());
                            }, 500); });
                        });
                        dones.push(done);
                    };
                    for (i = 0; i < 5; i++) {
                        _loop_3(i);
                    }
                    _b = (_a = console).log;
                    return [4 /*yield*/, Promise.all(dones)];
                case 2:
                    _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvbWlzZS1xdWVxdWVTcGVjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdHMvc3BlYy9wcm9taXNlLXF1ZXF1ZVNwZWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwrQkFBK0I7QUFDL0Isb0RBQWlEO0FBRWpELFFBQVEsQ0FBQyxlQUFlLEVBQUU7SUFDeEIsRUFBRSxDQUFDLHFDQUFxQyxFQUFFOzs7OztvQkFDbEMsT0FBTyxHQUFHLEVBQStCLENBQUM7d0NBQ3ZDLENBQUM7d0JBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQzs0QkFDWCxJQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7NEJBQ2QsT0FBTyxDQUFDLEdBQUcsQ0FBSSxHQUFHLFdBQVEsQ0FBQyxDQUFDOzRCQUM1QixPQUFPLElBQUksT0FBTyxDQUFDLFVBQUEsT0FBTyxJQUFJLE9BQUEsVUFBVSxDQUFDO2dDQUN2QyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7Z0NBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBSSxHQUFHLFVBQU8sQ0FBQyxDQUFDOzRCQUM3QixDQUFDLEVBQUUsR0FBRyxDQUFDLEVBSHVCLENBR3ZCLENBQUMsQ0FBQzt3QkFDWCxDQUFDLENBQUMsQ0FBQzs7b0JBUkwsS0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dDQUFsQixDQUFDO3FCQVNUO29CQUNXLHFCQUFNLHdCQUFPLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxFQUFBOztvQkFBL0IsR0FBRyxHQUFHLFNBQXlCO29CQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7Ozs7U0FFOUIsQ0FBQyxDQUFDO0lBRUgsRUFBRSxDQUFDLG1EQUFtRCxFQUFFOzs7OztvQkFDL0MsR0FBRyxHQUFJLHNCQUFLLENBQUMsQ0FBQyxDQUFDLElBQVosQ0FBYTtvQkFDakIsS0FBSyxHQUFHLEVBQXVCLENBQUM7d0NBQzdCLENBQUM7d0JBQ1IsSUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDOzRCQUNmLElBQU0sR0FBRyxHQUFHLENBQUMsQ0FBQzs0QkFDZCxPQUFPLENBQUMsR0FBRyxDQUFJLEdBQUcsZUFBVSxJQUFJLElBQUksRUFBRSxDQUFDLGtCQUFrQixFQUFJLENBQUMsQ0FBQzs0QkFDL0QsT0FBTyxJQUFJLE9BQU8sQ0FBUyxVQUFBLE9BQU8sSUFBSSxPQUFBLFVBQVUsQ0FBQztnQ0FDL0MsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dDQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUksR0FBRyxjQUFTLElBQUksSUFBSSxFQUFFLENBQUMsa0JBQWtCLEVBQUksQ0FBQyxDQUFDOzRCQUNoRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBSCtCLENBRy9CLENBQUMsQ0FBQzt3QkFDWCxDQUFDLENBQUMsQ0FBQzt3QkFDSCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztvQkFUbkIsS0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO2dDQUFsQixDQUFDO3FCQVVUO29CQUVELHFCQUFNLElBQUksT0FBTyxDQUFDLFVBQUEsT0FBTyxJQUFJLE9BQUEsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBekIsQ0FBeUIsQ0FBQyxFQUFBOztvQkFBdkQsU0FBdUQsQ0FBQzt3Q0FFL0MsQ0FBQzt3QkFDUixJQUFNLElBQUksR0FBRyxHQUFHLENBQUM7NEJBQ2YsSUFBTSxHQUFHLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzs0QkFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBSSxHQUFHLGVBQVUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxrQkFBa0IsRUFBSSxDQUFDLENBQUM7NEJBQy9ELE9BQU8sSUFBSSxPQUFPLENBQVMsVUFBQSxPQUFPLElBQUksT0FBQSxVQUFVLENBQUM7Z0NBQy9DLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztnQ0FDYixPQUFPLENBQUMsR0FBRyxDQUFJLEdBQUcsY0FBUyxJQUFJLElBQUksRUFBRSxDQUFDLGtCQUFrQixFQUFJLENBQUMsQ0FBQzs0QkFDaEUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUgrQixDQUcvQixDQUFDLENBQUM7d0JBQ1gsQ0FBQyxDQUFDLENBQUM7d0JBQ0gsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7b0JBVG5CLEtBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQ0FBakIsQ0FBQztxQkFVVDtvQkFDRCxLQUFBLENBQUEsS0FBQSxPQUFPLENBQUEsQ0FBQyxHQUFHLENBQUE7b0JBQUMscUJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBQTs7b0JBQXBDLGNBQVksU0FBd0IsRUFBQyxDQUFDOzs7O1NBQ3ZDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgbm8tY29uc29sZSAqL1xuaW1wb3J0IHtxdWV1ZVVwLCBxdWV1ZX0gZnJvbSAnLi4vcHJvbWlzZS1xdWVxdWUnO1xuXG5kZXNjcmliZSgncHJvbWlzZS1xdWV1ZScsICgpID0+IHtcbiAgaXQoJ3BhcmFsbGVsIHF1ZXVlVXAoKSB0YXNrIHNob3VsZCB3b3JrJywgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IGFjdGlvbnMgPSBbXSBhcyBBcnJheTwoKSA9PiBQcm9taXNlPGFueT4+O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTA7IGkrKykge1xuICAgICAgYWN0aW9ucy5wdXNoKCgpID0+IHtcbiAgICAgICAgY29uc3QgaWR4ID0gaTtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aWR4fSBzdGFydGApO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICByZXNvbHZlKGlkeCk7XG4gICAgICAgICAgY29uc29sZS5sb2coYCR7aWR4fSBkb25lYCk7XG4gICAgICAgIH0sIDUwMCkpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IHF1ZXVlVXAoMywgYWN0aW9ucyk7XG4gICAgY29uc29sZS5sb2cocmVzLCByZXMubGVuZ3RoKTtcblxuICB9KTtcblxuICBpdCgnY3JlYXRlIHF1ZXVlIGFuZCBkeW5hbWljYWxseSBhZGQgYXN5bmMgdGFzayB0byBpdCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCB7YWRkfSA9IHF1ZXVlKDMpO1xuICAgIGNvbnN0IGRvbmVzID0gW10gYXMgUHJvbWlzZTxudW1iZXI+W107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG4gICAgICBjb25zdCBkb25lID0gYWRkKCgpID0+IHtcbiAgICAgICAgY29uc3QgaWR4ID0gaTtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aWR4fSBzdGFydCAke25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9YCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxudW1iZXI+KHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShpZHgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2lkeH0gZG9uZSAke25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9YCk7XG4gICAgICAgIH0sIDUwMCkpO1xuICAgICAgfSk7XG4gICAgICBkb25lcy5wdXNoKGRvbmUpO1xuICAgIH1cblxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDU7IGkrKykge1xuICAgICAgY29uc3QgZG9uZSA9IGFkZCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGlkeCA9IDEwICsgaTtcbiAgICAgICAgY29uc29sZS5sb2coYCR7aWR4fSBzdGFydCAke25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9YCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxudW1iZXI+KHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShpZHgpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKGAke2lkeH0gZG9uZSAke25ldyBEYXRlKCkudG9Mb2NhbGVUaW1lU3RyaW5nKCl9YCk7XG4gICAgICAgIH0sIDUwMCkpO1xuICAgICAgfSk7XG4gICAgICBkb25lcy5wdXNoKGRvbmUpO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhhd2FpdCBQcm9taXNlLmFsbChkb25lcykpO1xuICB9KTtcbn0pO1xuIl19