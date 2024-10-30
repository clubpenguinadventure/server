import { MongoClient } from 'mongodb'

export default class NoSQLDatabase {
    constructor(config) {
        this.config = config;
        const userString = config.user ? `${config.user}:${config.password}@` : '';
        const uri = `mongodb://${userString}${config.host}:${config.port}`;
        const client = new MongoClient(uri);
        this.transactions = [];
        this.collections = [ 'packets', 'chat', 'commands', 'population', 'logins' ];

		client.connect()
			.then(async () => {
				this.db = client.db(config.database);
		
				// Create collections if they don't exist
				let existingCollections = await this.db.listCollections().toArray(); // Await the Promise
				existingCollections = existingCollections.map(collection => collection.name); // Extract the collection names
				for (let collection of this.collections) {
					if (!existingCollections.includes(collection)) {
						await this.db.createCollection(collection); // Ensure you await the creation
					}
				}
		
				for (let transaction of this.transactions) {
					transaction();
				}
				this.transactions = [];
			})
			.catch(error => {
				console.error(`[MongoDB] Unable to connect to the database: ${error}`);
			});
    }

    async logPacket(packet) {
        if (!this.db) {
            this.transactions.push(() => this.logPacket(packet));
            return;
        }
        const collection = this.db.collection('packets');
        await collection.insertOne(packet);
    }

    async logChatMessage(user, nickname, server, room, message, filtered) {
        if (!this.db) {
            this.transactions.push(() => this.logChatMessage(user, message, room, filtered));
            return;
        }
        const collection = this.db.collection('chat');
        await collection.insertOne({ user, nickname, server, room, message, filtered, timestamp: new Date() });
    }

    async logCommand(user, command, args, succeeded) {
        if (!this.db) {
            this.transactions.push(() => this.logCommand(user, command, args, succeeded));
            return;
        }
        const collection = this.db.collection('commands');
        await collection.insertOne({ user, command, args, succeeded, timestamp: new Date() });
    }

    async logPopulation(server, population) {
        if (!this.db) {
            this.transactions.push(() => this.logPopulation(server, population));
            return;
        }
        const collection = this.db.collection('population');
        await collection.insertOne({ server, population, timestamp: new Date() });
    }

    async logLogin(user, ip) {
        if (!this.db) {
            this.transactions.push(() => this.logLogin(user, ip));
            return;
        }
        const collection = this.db.collection('logins');
        await collection.insertOne({ user, ip, timestamp: new Date() });
    }
}