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
let app = express();
let db = redis.createClient();
//TODO: remove sync call
let hubs = JSON.parse(fs.readFileSync('hubs.json', 'utf8'));
let hubBots: { [name: string]: nmdc.Nmdc } = {};

for (let name in hubs) {
    let ip = hubs[name].ip;
    let port = hubs[name].port;
    let bot = new nmdc.Nmdc({
        address: ip,
        port: port,
        auto_reconnect: true,
        nick: hubs[name].nick,
        password: hubs[name].pass
    });
    hubBots[name] = bot;
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
    for (let name in hubBots) {
        hubNames.push(name);
    }
    getAllUptimes(hubNames, res);
})

// JSON Response for uptime records
app.get('/api/records', function (req, res) {
    let hubNames: string[] = [];
    for (let name in hubBots) {
        hubNames.push(name);
    }
    getAllRecords(hubNames, res);
})

// JSON Response for current component status
app.get('/api/status', function (req, res) {
    let hubNames: string[] = [];
    for (let name in hubBots) {
        hubNames.push(name);
    }
    getAllStatuses(hubNames, res);
})

// JSON Response for tracker uptime with time stamps
app.get('/api/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        let jsonObj = {};
        for (let i = 0; i < uptimesTrackerHistory.length; i++) {
            let tokens = uptimesTrackerHistory[i].split(':')
            jsonObj[tokens[0]] = tokens[1]
        }
        res.json(jsonObj)
    })
})

// JSON Response for tracker uptime with time stamps [array]
app.get('/api/2/uptime/tracker', function (req, res) {
    db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
        let jsonArray = [];
        for (let i = 0; i < uptimesTrackerHistory.length; i++) {
            let tokens = uptimesTrackerHistory[i].split(':')
            jsonArray.push({
                timestamp: tokens[0],
                status: tokens[1]
            });
        }
        res.json(jsonArray)
    })
})

function initializeRedis(component) {
    db.set(component, 2);
}

for (let name in hubs) {
    initializeRedis(`${name}-status`);
    db.set(`uptime:${name}`, 0);
    db.exists(`uptime-record:${name}`, (err, val: boolean) => {
        if (!val) {
            db.set(`uptime-record:${name}`, 0);
        }
    })
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
    for (let name in hubBots) {
        let bot = hubBots[name];

        if (bot.getIsConnected()) {
            console.log(bot.getHubName());
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
                db.get(`uptime:${name}`, (err, stat: number) => {
                    db.get(`uptime-record:${name}`, (err, record: number) => {
                        if (record < stat) {
                            db.set(`uptime-record:${name}`, stat);
                        }
                    })
                });
            }
        });
    }
}

function updateRecords() {
    for (let name in hubBots) {
        db.get(`uptime:${name}`, (err, stat: number) => {
            db.get(`uptime-record:${name}`, (err, record: number) => {
                if (record < stat) {
                    db.set(`uptime-record:${name}`, stat);
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
    for (let name of hubNames) {
        uptimes[name] = await getUptimePromise(name);
    }
    res.json(uptimes);
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
    for (let name of hubNames) {
        status[name] = await getStatusPromise(name);
    }
    res.json(status);
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
    for (let name of hubNames) {
        status[name] = await getRecordPromise(name);
    }
    res.json(status);
}