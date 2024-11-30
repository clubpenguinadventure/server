import Database from './database/Database'
import NoSQLDatabase from '@database/NoSQLDatabase'
import GameHandler from './handlers/GameHandler'
import Server from './server/Server'
import fs from 'fs'

let config;
if (fs.existsSync('./config/config.json')) {
    config = JSON.parse(fs.readFileSync('./config/config.json'));
} else {
    config = process.env;
}


class World extends Server {

    constructor(id) {
        console.log(`[${id}] Starting world ${id} on port ${config.WORLD_PORT}`)

        let users = {}
        let db = new Database(config)
        let mongo = new NoSQLDatabase(config)

        let handler = new Promise((resolve) => {
            mongo.events.once('ready', () => {
                resolve(new GameHandler(id, users, db, mongo, config))
            })
        })

        super(id, users, db, handler, mongo, config)
    }

}

new World(config.WORLD_ID)
