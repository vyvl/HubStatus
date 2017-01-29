import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as redis from 'redis';
import * as cron from 'cron';
import * as nmdc from 'nmdc';
import * as fs from 'fs';
import * as bodyParser from 'body-parser';
import * as favicon from 'serve-favicon';
import { HubStore } from './store';

let cronJob = cron.CronJob;
let app = express();
let store = new HubStore('hubstore.db');
//TODO: remove sync call
let hubs = JSON.parse(fs.readFileSync('hubs.json', 'utf8'));
let hubBots: { [name: string]: nmdc.Nmdc } = {};
let cronString = '*/5 * * * * *';
for (let name in hubs) {
    store.initHub(name);
    let ip = hubs[name].ip;
    let port = hubs[name].port;
    let bot = new nmdc.Nmdc({
        address: ip,
        port: port,
        auto_reconnect: true,
        nick: hubs[name].nick,
        password: hubs[name].pass,
        share: 11995116277760
    }, () => {
        store.setHubStatus(name, 1);
    });
    bot.onClosed = () => { store.setHubStatus(name, 1); }
    hubBots[name] = bot;
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
})

// Render the Stats page
app.get('/stats', function (req, res) {
    res.render('stats', {
        title: 'HubStatus'
    });
})

// Render the About page
app.get('/about', function (req, res) {
    res.render('about', {
        title: 'HubStatus'
    });
})

// Render the FAQ page
app.get('/faq', function (req, res) {
    res.render('faq', {
        title: 'HubStatus'
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

// // JSON Response for tracker uptime with time stamps
// app.get('/api/uptime/tracker', function (req, res) {
//     db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
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
//     db.lrange('trackeruptime', 0, -1, function (err, uptimesTrackerHistory) {
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
}, null, true, null, null, true);


async function updateStatus() {
    for (let name in hubBots) {
        let bot = hubBots[name];
        let connName = bot.getHubName();

        if (bot.getIsConnected() && (connName && connName.trim())) {
            store.setHubStatus(name, 1);
            store.setFlag(name, 1);
        }
        else if (bot.getIsConnected()) {
            store.setHubStatus(name, 3);
        }
        else {
            let hub = await store.findOne(name);
            let reply = hub.flag;
            if (reply == 1 || reply == 2) {
                store.setHubStatus(name, 2);
            }
            else {
                store.setHubStatus(name, 0);
            }
            let tempflag = ++reply;
            store.setFlag(name, tempflag);
        }
    }
}

async function updateUptime() {
    for (let name in hubBots) {
        let hub = await store.findOne(name);
        if (hub.status == 1) {
            store.increaseUptime(name);
        }
    }
}

async function getAllUptimes(hubNames: string[], res: express.Response) {
    let uptimes = {};
    for (let name of hubNames) {
        uptimes[name] = (await store.findOne(name)).uptime;
    }
    res.json(uptimes);
}


async function getAllStatuses(hubNames: string[], res: express.Response) {
    let status = {};
    for (let name of hubNames) {
        status[name] = (await store.findOne(name)).status;
    }
    res.json(status);
}



async function getAllRecords(hubNames: string[], res: express.Response) {
    let records = {};
    for (let name of hubNames) {
        let hub = await store.findOne(name);
        records[name] = hub.record;
    }
    res.json(records);
}