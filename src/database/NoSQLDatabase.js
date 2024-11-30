import { MongoClient } from 'mongodb'
import EventEmitter from 'events'

export default class NoSQLDatabase {
    constructor(config) {
        this.events = new EventEmitter();
        this.config = config;
        const userString = config.MONGODB_USER ? `${config.MONGODB_USER}:${config.MONGODB_PASSWORD}@` : '';
        const uri = `mongodb://${userString}${config.MONGODB_HOST}:${config.MONGODB_PORT}`;
        const client = new MongoClient(uri);
        this.crumbs = [
            'flooring',
            'furniture',
            'igloos',
            'items',
            'pets',
            'worlds'
        ]
        this.collections = ['packets', 'chat', 'commands', 'population', 'logins'].concat(this.crumbs);

		client.connect()
			.then(async () => {
				this.db = client.db(config.MONGODB_DATABASE);
		
				// Create collections if they don't exist
				let existingCollections = await this.db.listCollections().toArray(); // Await the Promise
				existingCollections = existingCollections.map(collection => collection.name); // Extract the collection names
				for (let collection of this.collections) {
					if (!existingCollections.includes(collection)) {
						await this.db.createCollection(collection); // Ensure you await the creation
					}
				}
                
                this.events.emit('ready');
			})
			.catch(error => {
				console.error(`[MongoDB] Unable to connect to the database: ${error}`);
			});
    }

    async logPacket(packet) {
        const collection = this.db.collection('packets');
        await collection.insertOne(packet);
    }

    async logChatMessage(user, nickname, server, room, message, filtered) {
        const collection = this.db.collection('chat');
        await collection.insertOne({ user, nickname, server, room, message, filtered, timestamp: new Date() });
    }

    async logCommand(user, command, args, succeeded) {
        const collection = this.db.collection('commands');
        await collection.insertOne({ user, command, args, succeeded, timestamp: new Date() });
    }

    async logPopulation(server, population) {
        const collection = this.db.collection('population');
        await collection.insertOne({ server, population, timestamp: new Date() });
    }

    async logLogin(user, ip) {
        const collection = this.db.collection('logins');
        await collection.insertOne({ user, ip, timestamp: new Date() });
    }

    async logLogout(user) {
        const collection = this.db.collection('logins');
        let recentLogin = (await collection.find({ user }).sort({ timestamp: -1 }).limit(1).toArray())[0];
        if (recentLogin) {
            recentLogin.logout = new Date();
            await collection.updateOne({ _id: recentLogin._id }, { $set: recentLogin });
        }
    }

    async getCrumb(crumb) {
        if (this.crumbs.includes(crumb)) {
            const collection = this.db.collection(crumb);
            let array = await collection.find({}, { projection: { _id: 0} }).toArray();
            return array;
        } else {
            return [];
        }
    }
}