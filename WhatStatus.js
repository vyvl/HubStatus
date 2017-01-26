/**
 * WhatStatus.info is a simple status page for torrent site.
 * @author dewey
 * https://github.com/dewey/WhatStatus
 */
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
var express = require("express");
var http = require("http");
var path = require("path");
var redis = require("redis");
var cron = require("cron");
var nmdc = require("nmdc");
var fs = require("fs");
var bodyParser = require("body-parser");
var favicon = require("serve-favicon");
var cronJob = cron.CronJob;
var app = express();
var db = redis.createClient();
//TODO: remove sync call
var hubs = JSON.parse(fs.readFileSync('hubs.json', 'utf8'));
var hubBots = {};
var _loop_1 = function (name_1) {
    var ip = hubs[name_1].ip;
    var port = hubs[name_1].port;
    var bot = new nmdc.Nmdc({
        address: ip,
        port: port,
        auto_reconnect: true,
        nick: hubs[name_1].nick,
        password: hubs[name_1].pass
    }, function () {
        hubBots[name_1] = bot;
    });
};
for (var name_1 in hubs) {
    _loop_1(name_1);
}
// Catch connection errors if redis-server isn't running
db.on("error", function (err) {
    console.log(err.toString());
    console.log("       Make sure redis-server is started and listening for connections.");
});
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon('public/images/favicon.ico'));
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));
// If there's an outtage reset uptime record counter.
function reset_uptime(component) {
    db.set('uptime:' + component, 0);
}
// Render the index page
app.get('/', function (req, res) {
    res.render('index', {
        title: 'WhatStatus',
        logo_url: 'images/logos/logo.png'
    });
});
// Render the Stats page
app.get('/stats', function (req, res) {
    res.render('stats', {
        title: 'WhatStatus'
    });
});
// Render the About page
app.get('/about', function (req, res) {
    res.render('about', {
        title: 'WhatStatus'
    });
});
// Render the FAQ page
app.get('/faq', function (req, res) {
    res.render('faq', {
        title: 'WhatStatus'
    });
});
// JSON Response for uptime values
app.get('/api/uptime', function (req, res) {
    var hubNames = [];
    for (var name_2 in hubBots) {
        hubNames.push(name_2);
    }
    getAllUptimes(hubNames, res);
});
// JSON Response for uptime records
app.get('/api/records', function (req, res) {
    var hubNames = [];
    for (var name_3 in hubBots) {
        hubNames.push(name_3);
    }
    getAllRecords(hubNames, res);
});
// JSON Response for current component status
app.get('/api/status', function (req, res) {
    var hubNames = [];
    for (var name_4 in hubBots) {
        hubNames.push(name_4);
    }
    getAllStatuses(hubNames, res);
});
// JSON Response for tracker uptime with time stamps
app.get('/api/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        var jsonObj = {};
        for (var i = 0; i < uptimesTrackerHistory.length; i++) {
            var tokens = uptimesTrackerHistory[i].split(':');
            jsonObj[tokens[0]] = tokens[1];
        }
        res.json(jsonObj);
    });
});
// JSON Response for tracker uptime with time stamps [array]
app.get('/api/2/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        var jsonArray = [];
        for (var i = 0; i < uptimesTrackerHistory.length; i++) {
            var tokens = uptimesTrackerHistory[i].split(':');
            jsonArray.push({
                timestamp: tokens[0],
                status: tokens[1]
            });
        }
        res.json(jsonArray);
    });
});
function initializeRedis(component) {
    db.exists(component, function (err, reply) {
        if (reply != 1) {
            db.set(component, 0);
        }
    });
}
for (var name_5 in hubs) {
    initializeRedis(name_5 + "-status");
    db.set("uptime:" + name_5, 0);
}
// Check Site Components (Cronjob running every minute)
new cronJob('*/1 * * * *', function () {
    console.log('Checking status of hubs');
    updateStatus();
}, null, true, null, null, true);
/*
Statistics (minute)

This cronjob is incrementing the uptime counters for the various monitored components
and updating the uptime records if the current uptime > the old record.
*/
// Initialize Redis Keys to prevent "null" values
new cronJob('*/1 * * * *', function () {
    console.log("[Stats] Cronjob started");
    updateUptime();
}, null, true, null, null, true);
http.createServer(app).listen(app.get('port'), function () {
    console.log("WhatStatus server listening on port: " + app.get('port'));
});
function updateStatus() {
    for (var name_6 in hubBots) {
        var bot = hubBots[name_6];
        if (bot.getIsConnected()) {
            db.set(name_6 + "-status", 1);
        }
        else {
            db.set(name_6 + "-status", 0);
        }
    }
}
function updateUptime() {
    var _loop_2 = function (name_7) {
        db.get(name_7 + "-status", function (err, stat) {
            if (stat != 0) {
                db.incr("uptime:" + name_7);
                db.get("uptime:" + name_7, function (err, stat) {
                    db.get("uptime-record:" + name_7, function (err, record) {
                        if (record < stat) {
                            db.set("uptime-record:" + name_7, stat);
                        }
                    });
                });
            }
        });
    };
    for (var name_7 in hubBots) {
        _loop_2(name_7);
    }
}
function updateRecords() {
    var _loop_3 = function (name_8) {
        db.get("uptime:" + name_8, function (err, stat) {
            db.get("uptime-record:" + name_8, function (err, record) {
                if (record < stat) {
                    db.set("uptime-record:" + name_8, stat);
                }
            });
        });
    };
    for (var name_8 in hubBots) {
        _loop_3(name_8);
    }
}
function getUptimePromise(name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res, rej) {
                    db.get("uptime:" + name, function (err, status) {
                        res(status);
                    });
                })];
        });
    });
}
function getAllUptimes(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var uptimes, _i, hubNames_1, name_9, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    uptimes = {};
                    _i = 0, hubNames_1 = hubNames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hubNames_1.length)) return [3 /*break*/, 4];
                    name_9 = hubNames_1[_i];
                    _a = uptimes;
                    _b = name_9;
                    return [4 /*yield*/, getUptimePromise(name_9)];
                case 2:
                    _a[_b] = _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    res.json(uptimes);
                    return [2 /*return*/];
            }
        });
    });
}
function getStatusPromise(name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res, rej) {
                    db.get(name + "-status", function (err, status) {
                        res(status);
                    });
                })];
        });
    });
}
function getAllStatuses(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var status, _i, hubNames_2, name_10, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    status = {};
                    _i = 0, hubNames_2 = hubNames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hubNames_2.length)) return [3 /*break*/, 4];
                    name_10 = hubNames_2[_i];
                    _a = status;
                    _b = name_10;
                    return [4 /*yield*/, getStatusPromise(name_10)];
                case 2:
                    _a[_b] = _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    res.json(status);
                    return [2 /*return*/];
            }
        });
    });
}
function getRecordPromise(name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (res, rej) {
                    db.get("uptime-record:" + name, function (err, status) {
                        res(status);
                    });
                })];
        });
    });
}
function getAllRecords(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var status, _i, hubNames_3, name_11, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    status = {};
                    _i = 0, hubNames_3 = hubNames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hubNames_3.length)) return [3 /*break*/, 4];
                    name_11 = hubNames_3[_i];
                    _a = status;
                    _b = name_11;
                    return [4 /*yield*/, getRecordPromise(name_11)];
                case 2:
                    _a[_b] = _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    res.json(status);
                    return [2 /*return*/];
            }
        });
    });
}
