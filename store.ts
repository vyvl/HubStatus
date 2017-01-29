import * as nedb from 'nedb';
export class HubStore {

    db: nedb;

    constructor(filename: string) {
        this.db = new nedb({ filename });
        this.db.loadDatabase();
    }
    async initHub(name: string) {
        let hubExists = await this.ifHubExists(name);
        if (hubExists) {
            this.updateItem(name, { status: 3, uptime: 0, flag: 1 });
        }
        else {
            let hub = { name, status: 3, uptime: 0, record: 0, flag: 1 };
            await this.insertHub(hub);
        }
    }



    async increaseUptime(name: string) {
        let hub: Hub = await this.findOne(name);
        await this.updateItem(name, { uptime: hub.uptime + 1 });
        this.updateRecord(name);
    }

    async setHubStatus(name: string, status: number) {
        await this.updateItem(name, { status });
    }

    async setHubRecord(name: string, record: number) {
        await this.updateItem(name, { record });
    }

    async updateRecord(name: string) {
        let hub: Hub = await this.findOne(name);
        if (hub.uptime > hub.record) {
            this.setHubRecord(name, hub.uptime);
        }
    }

    async setFlag(name: string, flag: number) {
        await this.updateItem(name, { flag });
    }

    updateItem(name: string, opts: any) {
        let db = this.db;
        return new Promise<Boolean>((res, rej) => {
            db.update({ name }, { $set: opts }, () => {
                res(true)
            });
        });
    }
    insertHub(hub: Hub) {
        let db = this.db;
        return new Promise<Hub>((res, rej) => {
            db.insert(hub, (err, doc) => {
                res(hub);
            })
        });
    }
    findOne(name: string) {
        let db = this.db;
        return new Promise<Hub>(function (resolve, reject) {
            db.findOne({ name }, (err, doc: Hub) => {

                resolve(doc);
            });
        });
    }

    ifHubExists(name: string) {
        let db = this.db;
        return new Promise<boolean>(function (resolve, reject) {
            db.count({ name }, (err, count) => {
                if (count > 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            })
        });
    }

    findAll(name: string) {
        let db = this.db;

        db.find({}, (err: Error, doc: Hub[]) => {

        });

    }
}

interface Hub {
    name: string; status: number; uptime: number; record: number; flag: number;
}