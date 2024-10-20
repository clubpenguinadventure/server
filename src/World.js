import Database from './database/Database'
import NoSQLDatabase from '@database/NoSQLDatabase'
import GameHandler from './handlers/GameHandler'
import Server from './server/Server'

import config from '../config/config.json'


class World extends Server {

    constructor(id) {
        console.log(`[${id}] Starting world ${id} on port ${config.worlds[id].port}`)

        let users = {}
        let db = new Database(config.database)
        let mongo = new NoSQLDatabase(config.mongodb)

        let handler = new GameHandler(id, users, db, mongo, config)

        super(id, users, db, handler, mongo, config)
    }

}

let args = process.argv.slice(2)

for (let world of args) {
    if (world in config.worlds) {
        new World(world)
    }
}
