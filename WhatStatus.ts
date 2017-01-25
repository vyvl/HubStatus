/**
 * WhatStatus.info is a simple status page for torrent site.
 * @author dewey
 * https://github.com/dewey/WhatStatus
 */

import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as redis from 'redis';
import * as cron from 'cron';
import * as nmdc from 'nmdc';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as favicon from 'serve-favicon';

let cronJob = cron.CronJob;
var app = express();
var db = redis.createClient();
//TODO: remove sync call
var hubs = JSON.parse(fs.readFileSync('hubs.json', 'utf8'));
var hubBots: { [name: string]: nmdc.Nmdc } = {};

for (var name in hubs) {
    var ip = hubs[name].ip;
    var port = hubs[name].port;
    var bot = new nmdc.Nmdc({
        address: ip,
        port: port
    }, () => {
        hubBots[name] = bot;
    });
}
// Catch connection errors if redis-server isn't running
db.on("error", function (err) {
    console.log(err.toString());
    console.log("       Make sure redis-server is started and listening for connections.");
});

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(favicon('public/images/favicon.ico'));
    app.use(bodyParser());
    // app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
    // app.use(express.errorHandler());
    app.locals.pretty = true;
    // app.use(express.logger('dev'));
});


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
})

// Render the Stats page
app.get('/stats', function (req, res) {
    res.render('stats', {
        title: 'WhatStatus'
    });
})

// Render the About page
app.get('/about', function (req, res) {
    res.render('about', {
        title: 'WhatStatus'
    });
})

// Render the FAQ page
app.get('/faq', function (req, res) {
    res.render('faq', {
        title: 'WhatStatus'
    });
})

// JSON Response for uptime values
app.get('/api/uptime', function (req, res) {
    let hubNames: string[] = [];
    for (var name in hubBots) {
        hubNames.push(name);
    }
    getAllUptimes(hubNames, res);
})

// JSON Response for uptime records
app.get('/api/records', function (req, res) {
    let hubNames: string[] = [];
    for (var name in hubBots) {
        hubNames.push(name);
    }
    getAllRecords(hubNames, res);
})

// JSON Response for current component status
app.get('/api/status', function (req, res) {
    let hubNames: string[] = [];
    for (var name in hubBots) {
        hubNames.push(name);
    }
    getAllStatuses(hubNames, res);
})

// JSON Response for tracker uptime with time stamps
app.get('/api/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        var jsonObj = {};
        for (var i = 0; i < uptimesTrackerHistory.length; i++) {
            var tokens = uptimesTrackerHistory[i].split(':')
            jsonObj[tokens[0]] = tokens[1]
        }
        res.json(jsonObj)
    })
})

// JSON Response for tracker uptime with time stamps [array]
app.get('/api/2/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        var jsonArray = [];
        for (var i = 0; i < uptimesTrackerHistory.length; i++) {
            var tokens = uptimesTrackerHistory[i].split(':')
            jsonArray.push({
                timestamp: tokens[0],
                status: tokens[1]
            });
        }
        res.json(jsonArray)
    })
})

// Check all components every minute
var site_status_counter = 0
var tracker_status_counter = 0
var irc_status_counter = 0

// Check Site Components (Cronjob running every minute)
new cronJob('* 1 * * * * *', function () {
    console.log('Checking status of hubs');

    updateStatus();
}, null, true);

/*
Statistics (minute)

This cronjob is incrementing the uptime counters for the various monitored components
and updating the uptime records if the current uptime > the old record.
*/

// Initialize Redis Keys to prevent "null" values
function initializeRedis(component) {
    db.exists(component, function (err, reply) {
        if (reply != 1) {
            db.set(component, 0);
        }
    });
}

for (let name in hubs) {
    initializeRedis(`${name}-status`);
    db.set(`uptime:${name}`, 0);
    db.set(`uptime-record:${name}`, 0);
}
new cronJob('* 1 * * * *', function () {
    console.log("[Stats] Cronjob started");

    updateUptime();
    updateRecords();
}, null, true);

http.createServer(app).listen(app.get('port'), function () {
    console.log("WhatStatus server listening on port: " + app.get('port'));
});

function updateStatus() {
    for (var name in hubBots) {
        var bot = hubBots[name];

        if (bot.getIsConnected()) {
            db.set(`${name}-status`, 1);
        } else {
            db.set(`${name}-status`, 0);
        }
    }
}
function updateUptime() {
    for (let name in hubBots) {
        db.get(`${name}-status`, (err, stat: number) => {
            if (stat != 0) {
                db.incr(`uptime:${name}`);
            }
        });
    }
}

function updateRecords() {
    for (let name in hubBots) {
        db.get(`uptime:${name}`, (err, stat: number) => {
            db.get(`uptime-record:${name}`, (err, record: number) => {
                if (record < stat) {
                    db.set(`uptime:${name}`, stat);
                }
            })
        });
    }
}

async function getUptimePromise(name: string) {
    return new Promise<number>((res, rej) => {
        db.get(`uptime:${name}`, (err, status: number) => {
            res(status);
        });
    })
}

async function getAllUptimes(hubNames: string[], res: express.Response) {
    let uptimes = {};
    for (var name of hubNames) {
        uptimes[name] = await getUptimePromise(name);
    }
    res.json(uptimes);
    //Mock
    // res.json({
    //     "DeZire": 11,
    //     "Hell": 21,
    //     "Nebula": 10
    // });

}
async function getStatusPromise(name: string) {
    return new Promise<number>((res, rej) => {
        db.get(`${name}-status`, (err, status: number) => {
            res(status);
        });
    })
}

async function getAllStatuses(hubNames: string[], res: express.Response) {
    let status = {};
    for (var name of hubNames) {
        status[name] = await getStatusPromise(name);
    }
    res.json(status);
    // Mock
    // res.json({
    //     "DeZire": 1,
    //     "Hell": 2,
    //     "Nebula": 0
    // });
}

async function getRecordPromise(name: string) {
    return new Promise<number>((res, rej) => {
        db.get(`uptime-record:${name}`, (err, status: number) => {
            res(status);
        });
    })
}

async function getAllRecords(hubNames: string[], res: express.Response) {
    let status = {};
    for (var name of hubNames) {
        status[name] = await getRecordPromise(name);
    }
    res.json(status);
    //Mock
    // res.json({
    //     "DeZire": 2122,
    //     "Hell": 2222,
    //     "Nebula": 2022
    // });
}