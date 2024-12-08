import Collection from '../Collection'


export default class StampCollection extends Collection {

    constructor(user, models) {
        super(user, models, 'stamps', 'itemId')
    }

    add(stamp) {
        super.add({ userId: this.user.id, stamp })
    }

}