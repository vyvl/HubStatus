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
var cron = require("cron");
var nmdc = require("nmdc");
var fs = require("fs");
var bodyParser = require("body-parser");
var favicon = require("serve-favicon");
var store_1 = require("./store");
var plotly = require("plotly");
var api = JSON.parse(fs.readFileSync('api.key', 'utf8'));
var username;
var key;
for (var name_1 in api) {
    username = name_1;
    key = api[name_1];
}
plotly(username, key);
var cronJob = cron.CronJob;
var app = express();
var store = new store_1.HubStore('hubstore.db');
//TODO: remove sync call
var hubs = JSON.parse(fs.readFileSync('hubs.json', 'utf8'));
var hubBots = {};
var hourTable = [];
var minTable = [];
var tempclock = 0;
var cronString = '*/5 * * * * *';
var _loop_1 = function (name_2) {
    store.initHub(name_2);
    var ip = hubs[name_2].ip;
    var port = hubs[name_2].port;
    var bot = new nmdc.Nmdc({
        address: ip,
        port: port,
        auto_reconnect: true,
        nick: hubs[name_2].nick,
        password: hubs[name_2].pass,
        share: 11995116277760
    }, function () {
        store.setHubStatus(name_2, 1);
    });
    bot.onClosed = function () { store.setHubStatus(name_2, 3); };
    hubBots[name_2] = bot;
};
for (var name_2 in hubs) {
    _loop_1(name_2);
}
;
for (var name_3 in hubs) {
    var currentuptime = 0;
    var hourdetails = [];
    minTable[name_3] = currentuptime;
    hourTable[name_3] = hourdetails;
    var i = void 0;
    for (i = 0; i < 24; i++) {
        hourTable[name_3].push(null);
    }
}
;
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon('public/images/favicon_1.ico'));
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));
// Render the index page
app.get('/', function (req, res) {
    res.render('index', {
        title: 'HubStatus',
        logo_url: 'images/logos/logo.png'
    });
});
// Render the Stats page
app.get('/stats', function (req, res) {
    res.render('stats', {
        title: 'HubStatus'
    });
});
// Render the About page
app.get('/about', function (req, res) {
    res.render('about', {
        title: 'HubStatus'
    });
});
// Render the FAQ page
app.get('/faq', function (req, res) {
    res.render('faq', {
        title: 'HubStatus'
    });
});
// JSON Response for uptime values
app.get('/api/uptime', function (req, res) {
    var hubNames = [];
    for (var name_4 in hubBots) {
        hubNames.push(name_4);
    }
    getAllUptimes(hubNames, res);
});
// JSON Response for uptime records
app.get('/api/records', function (req, res) {
    var hubNames = [];
    for (var name_5 in hubBots) {
        hubNames.push(name_5);
    }
    getAllRecords(hubNames, res);
});
// JSON Response for current component status
app.get('/api/status', function (req, res) {
    var hubNames = [];
    for (var name_6 in hubBots) {
        hubNames.push(name_6);
    }
    getAllStatuses(hubNames, res);
});
app.get('/api/hourstat', function (req, res) {
    var hubNames = [];
    for (var name_7 in hubBots) {
        hubNames.push(name_7);
    }
    getHourStat(hubNames, res);
});
// // JSON Response for tracker uptime with time stamps
// app.get('/api/uptime/tracker', function (req, res) {
//     store.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
//         let jsonObj = {};
//         for (let i = 0; i < uptimesTrackerHistory.length; i++) {
//             let tokens = uptimesTrackerHistory[i].split(':')
//             jsonObj[tokens[0]] = tokens[1]
//         }
//         res.json(jsonObj)
//     })
// })
// // JSON Response for tracker uptime with time stamps [array]
// app.get('/api/2/uptime/tracker', function (req, res) {
//     store.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
//         let jsonArray = [];
//         for (let i = 0; i < uptimesTrackerHistory.length; i++) {
//             let tokens = uptimesTrackerHistory[i].split(':')
//             jsonArray.push({
//                 timestamp: tokens[0],
//                 status: tokens[1]
//             });
//         }
//         res.json(jsonArray)
//     })
// })
http.createServer(app).listen(app.get('port'), function () {
    console.log("HubStatus server listening on port: " + app.get('port'));
});
new cronJob('*/5 * * * *', function () {
    console.log("[Stats] Cronjob started => Hourly Stats Update");
    updateHourly();
    /*for (let name in hubBots) {
        console.log("Hourly Uptime of " + name + " : " + hourTable[name]);
    }*/
    tempclock = -1;
}, null, true, null, null, true);
// Check Site Components (Cronjob running every minute)
new cronJob(cronString, function () {
    console.log('Checking status of hubs');
    updateStatus();
}, null, true, null, null, true);
/*
Statistics (minute)
This cronjob is incrementing the uptime counters for the various monitored components
and updating the uptime records if the current uptime > the old record.
*/
// Initialize Redis Keys to prevent "null" values
new cronJob(cronString, function () {
    console.log("[Stats] Cronjob started");
    updateUptime();
    /*for (let name in hubBots) {
        console.log("Min Uptime of " + name + " : " + minTable[name]);
    }*/
    tempclock = ++tempclock;
}, null, true, null, null, true);
function updateStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _i, name_8, bot, hub, reply, tempflag;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = [];
                    for (_b in hubBots)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    name_8 = _a[_i];
                    bot = hubBots[name_8];
                    if (!bot.getIsConnected()) return [3 /*break*/, 2];
                    store.setHubStatus(name_8, 1);
                    store.setFlag(name_8, 1);
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, store.findOne(name_8)];
                case 3:
                    hub = _c.sent();
                    reply = hub.flag;
                    if (reply == 1 || reply == 2) {
                        store.setHubStatus(name_8, 2);
                    }
                    else {
                        store.setHubStatus(name_8, 0);
                    }
                    tempflag = ++reply;
                    store.setFlag(name_8, tempflag);
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function updateUptime() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _i, name_9, hub, tempmintable;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = [];
                    for (_b in hubBots)
                        _a.push(_b);
                    _i = 0;
                    _c.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    name_9 = _a[_i];
                    return [4 /*yield*/, store.findOne(name_9)];
                case 2:
                    hub = _c.sent();
                    if (hub.status == 1) {
                        store.increaseUptime(name_9);
                        tempmintable = ++minTable[name_9];
                        minTable[name_9] = tempmintable;
                        hourTable[name_9][23] = ((tempmintable / tempclock) * 60);
                    }
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Update Hub Uptime Record
function updateHourly() {
    return __awaiter(this, void 0, void 0, function () {
        var name_10, uptimeHourly, currenthour;
        return __generator(this, function (_a) {
            for (name_10 in hubs) {
                uptimeHourly = hourTable[name_10];
                currenthour = minTable[name_10];
                /*if ( uptimeHourly.length <24 ) {
                    uptimeHourly.push(currenthour);
                }*/
                uptimeHourly.shift();
                uptimeHourly.push(currenthour);
                minTable[name_10] = 0;
            }
            return [2 /*return*/];
        });
    });
}
function getAllUptimes(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var uptimes, _i, hubNames_1, name_11, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    uptimes = {};
                    _i = 0, hubNames_1 = hubNames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hubNames_1.length)) return [3 /*break*/, 4];
                    name_11 = hubNames_1[_i];
                    _a = uptimes;
                    _b = name_11;
                    return [4 /*yield*/, store.findOne(name_11)];
                case 2:
                    _a[_b] = (_c.sent()).uptime;
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
function getAllStatuses(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var status, _i, hubNames_2, name_12, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    status = {};
                    _i = 0, hubNames_2 = hubNames;
                    _c.label = 1;
                case 1:
                    if (!(_i < hubNames_2.length)) return [3 /*break*/, 4];
                    name_12 = hubNames_2[_i];
                    _a = status;
                    _b = name_12;
                    return [4 /*yield*/, store.findOne(name_12)];
                case 2:
                    _a[_b] = (_c.sent()).status;
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
function getAllRecords(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var records, _i, hubNames_3, name_13, hub;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    records = {};
                    _i = 0, hubNames_3 = hubNames;
                    _a.label = 1;
                case 1:
                    if (!(_i < hubNames_3.length)) return [3 /*break*/, 4];
                    name_13 = hubNames_3[_i];
                    return [4 /*yield*/, store.findOne(name_13)];
                case 2:
                    hub = _a.sent();
                    records[name_13] = hub.record;
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    res.json(records);
                    return [2 /*return*/];
            }
        });
    });
}
function getHourStat(hubNames, res) {
    return __awaiter(this, void 0, void 0, function () {
        var hourstat, _i, hubNames_4, name_14;
        return __generator(this, function (_a) {
            hourstat = {};
            for (_i = 0, hubNames_4 = hubNames; _i < hubNames_4.length; _i++) {
                name_14 = hubNames_4[_i];
                hourstat[name_14] = hourTable[name_14];
            }
            res.json(hourstat);
            return [2 /*return*/];
        });
    });
}
