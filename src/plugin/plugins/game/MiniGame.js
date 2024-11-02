import GamePlugin from '@plugin/GamePlugin'


export default class Minigame extends GamePlugin {

    constructor(handler) {
        super(handler)

        this.events = {
            'get_game': this.getGame,
            'join_game': this.joinGame,
            'send_move': this.sendMove,
            'game_over': this.gameOver
        }
    }

    getGame(args, user) {
        if (user.minigameRoom) {
            user.minigameRoom.getGame(args, user)
        }
    }

    joinGame(args, user) {
        if (user.minigameRoom) {
            user.minigameRoom.joinGame(args, user)
        }
    }

    sendMove(args, user) {
        if (user.minigameRoom) {
            user.minigameRoom.sendMove(args, user)
        }
    }

    gameOver(args, user) {
        if (user.room.game || user.minigameRoom) {
            user.updateCoins(args.coins, true)
            user.send('game_over', { coins: args.coins, game: user.room.name, stampCategory: 0, earnedStamps: [] })
        }
    }

}
