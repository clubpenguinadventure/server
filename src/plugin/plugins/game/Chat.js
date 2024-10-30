import GamePlugin from '@plugin/GamePlugin'

import { hasProps, isNumber, isString, isLength } from '@utils/validation'
import words from 'profane-words'

export default class Chat extends GamePlugin {

    constructor(handler) {
        super(handler)

        this.events = {
            'send_message': this.sendMessage,
            'send_safe': this.sendSafe,
            'send_emote': this.sendEmote,
            'send_joke': this.sendJoke,
            'send_tour': this.sendTour
        }

        this.commands = {
            'ai': this.addItem,
            'af': this.addFurniture,
            'ac': this.addCoins,
            'jr': this.joinRoom,
            'id': this.id,
            'users': this.userPopulation,
            'addall': this.addAll
        }

        this.bindCommands()

        this.messageRegex = /[^ -~]/i
        this.maxMessageLength = 48
    }

    // Events

    async sendMessage(args, user) {
        if (!hasProps(args, 'message')) {
            return
        }

        if (!isString(args.message)) {
            return
        }

        if (this.messageRegex.test(args.message)) {
            return
        }

        // Remove extra whitespace
        args.message = args.message.replace(/  +/g, ' ').trim()

        if (!isLength(args.message, 1, this.maxMessageLength)) {
            return
        }

        if (args.message.startsWith('!') && this.processCommand(args.message, user)) {
            return
        }

        let room;
        if (user.room.id > 2000) {
            let userId = user.room.id - 2000
            if (userId == user.id) {
                room = `[${user.room.id}] ${user.nickname}'s Igloo`
            } else {
                let igloo = this.handler.usersById[userId] || await this.db.getUser(userId)
                if (user) {
                    room = `[${user.room.id}] ${igloo.nickname}'s Igloo`
                } else {
                    room = 'Unknown Igloo'
                }
            }
        } else {
            room = `[${user.room.id}] ${this.handler.rooms[user.room.id].name}`
        }

        for (let word of args.message.split(' ')) {
            if (words.includes(word.toLowerCase().replace(/[.!?#,:;'"-]/g, ''))) {
                this.mongo.logChatMessage(user.id, user.nickname, this.handler.id, room, args.message, true)
                return
            }
        }

        user.room.send(user, 'send_message', { id: user.id, message: args.message }, [user], true)
        this.mongo.logChatMessage(user.id, user.nickname, this.handler.id, room, args.message, false)
    }

    sendSafe(args, user) {
        if (!hasProps(args, 'safe')) {
            return
        }

        if (!isNumber(args.safe)) {
            return
        }

        user.room.send(user, 'send_safe', { id: user.id, safe: args.safe }, [user], true)
    }

    sendEmote(args, user) {
        if (!hasProps(args, 'emote')) {
            return
        }

        if (!isNumber(args.emote)) {
            return
        }

        user.room.send(user, 'send_emote', { id: user.id, emote: args.emote }, [user], true)
    }

    sendJoke(args, user) {
        if (!hasProps(args, 'joke')) {
            return
        }

        if (!isNumber(args.joke)) {
            return
        }

        user.room.send(user, 'send_joke', { id: user.id, joke: args.joke }, [user], true)
    }

    sendTour(args, user) {
        if (!hasProps(args, 'roomId')) {
            return
        }

        if (!isNumber(args.roomId)) {
            return
        }

        if (args.roomId !== user.room.id) {
            return
        }

        user.room.send(user, 'send_tour', { id: user.id, roomId: args.roomId }, [user], true)
    }

    addAll(args, user) {
        if (!user.isModerator) {
            return
        }

        Object.keys(this.handler.crumbs.items).forEach(item => {
            this.plugins.item.addItem({ item: item }, user)
        })

        Object.keys(this.handler.crumbs.furnitures).forEach(furniture => {
            this.plugins.igloo.addFurniture({ furniture: furniture }, user)
        })

        Object.keys(this.handler.crumbs.floorings).forEach(flooring => {
            this.plugins.igloo.updateFlooring({ flooring: flooring }, user)
        })

        Object.keys(this.handler.crumbs.igloos).forEach(igloo => {
            this.plugins.igloo.addIgloo({ igloo: igloo }, user)
        })
    }

    // Commands

    bindCommands() {
        for (let command in this.commands) {
            this.commands[command] = this.commands[command].bind(this)
        }
    }

    processCommand(message, user) {
        message = message.substring(1)

        let args = message.split(' ')
        let command = args.shift().toLowerCase()

        if (command in this.commands) {
            const succeeded = this.commands[command](args, user)
            this.mongo.logCommand(user.id, command, args, succeeded)
            return true
        }

        return false
    }

    addItem(args, user) {
        if (user.isModerator) {
            this.plugins.item.addItem({ item: args[0] }, user)
            return true
        }
        return false
    }

    addFurniture(args, user) {
        if (user.isModerator) {
            this.plugins.igloo.addFurniture({ furniture: args[0] }, user)
            return true
        }
        return false
    }

    addCoins(args, user) {
        if (user.isModerator) {
            user.updateCoins(args[0], true)
            return true
        }
        return false
    }

    joinRoom(args, user) {
        if (!user.isModerator) {
            return false
        }

        let room = args[0]

        if (!room) {
            return false
        }

        if (!isNaN(room)) {
            this.plugins.join.joinRoom({ room: parseInt(room) }, user)
            return true
        }

        room = Object.values(this.rooms).find(r => r.name == room.toLowerCase())

        if (room) {
            this.plugins.join.joinRoom({ room: room.id }, user)
            return true
        }
    }

    id(args, user) {
        if (!user.isModerator) {
            return false
        }
        user.send('error', { error: `Your ID: ${user.id}` })
        return true
    }

    userPopulation(args, user) {
        if (!user.isModerator) {
            return false
        }
        user.send('error', { error: `Users online: ${this.handler.population}` })
        return true
    }

}
