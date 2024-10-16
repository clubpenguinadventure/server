import GameUserMixin from './GameUserMixin'


export default function(server, socket) {
    let user = server.db.buildUser()

    Object.assign(user, GameUserMixin)
    user.init(server, socket)

    return user
}
