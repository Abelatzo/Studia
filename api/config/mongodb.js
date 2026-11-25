import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = 'studia';

if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI');
}

let clientPromise;

if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(uri);
    globalThis._mongoClientPromise = client.connect();
}

clientPromise = globalThis._mongoClientPromise;

export async function getDb() {
    const client = await clientPromise;
    return client.db(dbName);
}