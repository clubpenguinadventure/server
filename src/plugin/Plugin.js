export default class Plugin {

    constructor(handler) {
        this.handler = handler

        this.users = handler.users
        this.db = handler.db
        this.mongo = handler.mongo
        this.config = handler.config
    }

    get plugins() {
        return this.handler.plugins.plugins
    }

}
