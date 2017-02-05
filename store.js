"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var nedb = require("nedb");
var HubStore = (function () {
    function HubStore(filename) {
        this.db = new nedb({ filename: filename });
        this.db.loadDatabase();
    }
    HubStore.prototype.initHub = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var hubExists, hub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ifHubExists(name)];
                    case 1:
                        hubExists = _a.sent();
                        if (!hubExists) return [3 /*break*/, 2];
                        this.updateItem(name, { status: 3, uptime: 0, flag: 1 });
                        return [3 /*break*/, 4];
                    case 2:
                        hub = { name: name, status: 3, uptime: 0, record: 0, flag: 1 };
                        return [4 /*yield*/, this.insertHub(hub)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.increaseUptime = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var hub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(name)];
                    case 1:
                        hub = _a.sent();
                        return [4 /*yield*/, this.updateItem(name, { uptime: hub.uptime + 1 })];
                    case 2:
                        _a.sent();
                        this.updateRecord(name);
                        return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.setHubStatus = function (name, status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateItem(name, { status: status })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.setHubRecord = function (name, record) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateItem(name, { record: record })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.updateRecord = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var hub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findOne(name)];
                    case 1:
                        hub = _a.sent();
                        if (hub.uptime > hub.record) {
                            this.setHubRecord(name, hub.uptime);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.setFlag = function (name, flag) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.updateItem(name, { flag: flag })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    HubStore.prototype.updateItem = function (name, opts) {
        var db = this.db;
        return new Promise(function (res, rej) {
            db.update({ name: name }, { $set: opts }, function () {
                res(true);
            });
        });
    };
    HubStore.prototype.insertHub = function (hub) {
        var db = this.db;
        return new Promise(function (res, rej) {
            db.insert(hub, function (err, doc) {
                res(hub);
            });
        });
    };
    HubStore.prototype.findOne = function (name) {
        var db = this.db;
        return new Promise(function (resolve, reject) {
            db.findOne({ name: name }, function (err, doc) {
                resolve(doc);
            });
        });
    };
    HubStore.prototype.ifHubExists = function (name) {
        var db = this.db;
        return new Promise(function (resolve, reject) {
            db.count({ name: name }, function (err, count) {
                if (count > 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    };
    HubStore.prototype.findAll = function (name) {
        var db = this.db;
        db.find({}, function (err, doc) {
        });
    };
    return HubStore;
}());
exports.HubStore = HubStore;
