import GamePlugin from '@plugin/GamePlugin'

export default class World extends GamePlugin {

    constructor(handler) {
        super(handler)

        this.events = {
            'stamp_earned': this.stampEarned,
        }
    }

    async stampEarned(args, user) {
        if (!user) {
            return
        }

        if (!this.crumbs.stamps.some(category =>
            category.stamps.some(stamp =>
                stamp.stamp_id == args.id)
        )) {
            return
        }

        if (user.stamps.includes(args.id)) {
            return
        }

        user.stamps.add(args.id)

        user.send('stamp_earned', { id: args.id })
    }

}
