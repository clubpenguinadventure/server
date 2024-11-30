import getSocketAddress from '@objects/user/getSocketAddress'
import UserFactory from '@objects/user/UserFactory'

import RateLimiterFlexible from 'rate-limiter-flexible'


export default class Server {

    constructor(id, users, db, handler, mongo, config) {
        this.id = id
        this.users = users
        this.db = db
        this.mongo = mongo
        handler.then((handler) => {
            this.handler = handler
        })
        this.config = config

        let io = this.createIo({
            https: false
        }, {
            cors: {
                origin: config.CORS_ORIGIN,
                methods: ['GET', 'POST']
            },
            path: '/'
        })

        if (config.RATE_LIMIT_ENABLED) {
            this.connectionLimiter = this.createLimiter(config.RATE_LIMIT_ADDRESS_CONNECTS_PER_SECOND)
            this.addressLimiter = this.createLimiter(config.RATE_LIMIT_ADDRESS_EVENTS_PER_SECOND)
            this.userLimiter = this.createLimiter(config.RATE_LIMIT_USER_EVENTS_PER_SECOND)
        }

        this.server = io.listen(config.WORLD_PORT)
        this.server.on('connection', this.onConnection.bind(this))
    }

    createLimiter(points, duration = 1) {
        return new RateLimiterFlexible.RateLimiterMemory({
            points: points,
            duration: duration
        })
    }

    createIo(config, options) {
        let server = this.httpServer()

        return require('socket.io')(server, options)
    }

    httpServer() {
        return require('http').createServer()
    }

    onConnection(socket) {
        if (!this.config.RATE_LIMIT_ENABLED) {
            this.initUser(socket)
            return
        }

        let address = getSocketAddress(socket, this.config)

        this.connectionLimiter.consume(address)
            .then(() => {
                this.initUser(socket)
            })
            .catch(() => {
                socket.disconnect(true)
            })
    }

    initUser(socket) {
        let user = UserFactory(this, socket)

        this.users[socket.id] = user

        console.log(`[${this.id}] Connection from: ${socket.id} ${user.address}`)

        socket.on('message', (message) => this.onMessage(message, user))
        socket.on('disconnect', () => this.onDisconnect(user))
    }

    onMessage(message, user) {
        if (!this.config.RATE_LIMIT_ENABLED) {
            this.handler.handle(message, user)
            return
        }

        this.addressLimiter.consume(user.address)
            .then(() => {

                let id = user.getId()

                this.userLimiter.consume(id)
                    .then(() => {
                        this.handler.handle(message, user)
                    })
                    .catch(() => {
                        // Blocked user
                    })

            })
            .catch(() => {
                // Blocked address
            })
    }

    onDisconnect(user) {
        console.log(`[${this.id}] Disconnect from: ${user.socket.id} ${user.address}`)
        this.handler.close(user)
    }

}
