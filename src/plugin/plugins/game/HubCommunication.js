import GamePlugin from '@plugin/GamePlugin'


export default class HubCommunicator extends GamePlugin {

    constructor(handler) {
        super(handler)

        this.events = {
            'register_hub': this.registerHub,
            'hub_kick': this.hubKick,
            'hub_warn': this.hubWarn,
            'hub_mute': this.hubMute,
            'hub_ban': this.hubBan,
        }
    }

    async registerHub(args, user) {
        if (!args.authKey) {
            return user.close()
        }

        if (args.authKey !== this.handler.hubAuthKey) {
            return user.close()
        }

        user.hub = true
        user.authenticated = true
    }

    async hubKick(args, user) {
        if (!user.hub) {
            return
        }

        if (!args.id) {
            return
        }

        let kickUser = this.handler.usersById[parseInt(args.id)]

        if (!kickUser) {
            return
        }

        kickUser.send('close_with_error', { error: `You have been removed from the server for:\n${args.reason}\nPlease remember to follow the rules!`, permitReload: true })
        kickUser.close()
    }

    async hubWarn(args, user) {
        if (!user.hub) {
            return
        }

        if (!args.id) {
            return
        }

        let warnUser = this.handler.usersById[parseInt(args.id)]

        if (!warnUser) {
            return
        }

        warnUser.send('error', { error: `You have been warned for:\n${args.reason}\nPlease remember to follow the rules!` })
    }

    async hubMute(args, user) {
        if (!user.hub) {
            return
        }

        if (!args.id) {
            return
        }

        let muteUser = this.handler.usersById[parseInt(args.id)]

        if (!muteUser) {
            return
        }

        muteUser.mute = {
            expires: Date.now() + args.duration * 1000 * 60 * 60
        }
        muteUser.send('error', { error: `You have been muted for:\n${args.reason}\nPlease remember to follow the rules!` })
        muteUser.send('mute', { mute: "You are muted for " + args.duration + " hours" })
    }

    async hubBan(args, user) {
        if (!user.hub) {
            return
        }

        if (!args.id) {
            return
        }

        let banUser = this.handler.usersById[parseInt(args.id)]

        if (!banUser) {
            return
        }

        banUser.send('close_with_error', { error: `You have been banned from the server for:\n${args.reason}\nPlease remember to follow the rules!`, permitReload: false })
        banUser.close()
    }
}
