import PluginManager from '@plugin/PluginManager'

import EventEmitter from 'events'


export default class BaseHandler {

    constructor(id, users, db, mongo,  config) {
        this.id = id
        this.users = users
        this.db = db
        this.mongo = mongo
        this.config = config

        this.logging = true

        this.plugins

        this.events = new EventEmitter({ captureRejections: true })

        this.events.on('error', (error) => {
            this.error(error)
        })
    }

    startPlugins(pluginsDir = '') {
        this.plugins = new PluginManager(this, pluginsDir)
    }

    async handle(message, user) {
        try {
            if (this.logging) {
                console.log(`[${this.id}] Received: ${message.action} ${JSON.stringify(message.args)}`)
                let userid = user.id;
                if (!userid && message.args && message.args.username) {
                    userid = (await this.db.getUserByUsername(message.args.username)).id
                }
                this.mongo.logPacket({ user: userid, action: message.action, args: message.args })
            }

            if (this.handleGuard(message, user)) {
                return user.close()
            }

            this.events.emit(message.action, message.args, user)

            if (user.events) {
                user.events.emit(message.action, message.args, user)
            }

        } catch(error) {
            this.error(error)
        }
    }

    handleGuard(message, user) {
        return false
    }

    close(user) {
        delete this.users[user.socket.id]
    }

    error(error) {
        console.error(`[${this.id}] ERROR: ${error.stack}`)
    }

}
