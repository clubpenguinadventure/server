import { MongoClient } from 'mongodb'

export default class NoSQLDatabase {
    constructor(config) {
        this.config = config;
        const userString = config.user ? `${config.user}:${config.password}@` : '';
        const uri = `mongodb://${userString}${config.host}:${config.port}`;
        const client = new MongoClient(uri);

        client.connect()
            .then(() => {
                this.db = client.db(config.database);

                // Create collections if they don't exist
                this.db.createCollection('packets');
                this.db.createCollection('chat');
                this.db.createCollection('commands');
            })
            .catch(error => {
                console.error(`[MongoDB] Unable to connect to the database: ${error}`);
            });
    }

    async logPacket(packet) {
        const collection = this.db.collection('packets');
        await collection.insertOne(packet);
    }

    async logChatMessage(user, message, room, filtered) {
        const collection = this.db.collection('chat');
        await collection.insertOne({ user, message, room, filtered, timestamp: new Date() });
    }

    async logCommand(user, command, args, succeeded) {
        const collection = this.db.collection('commands');
        await collection.insertOne({ user, command, args, succeeded, timestamp: new Date() });
    }
}