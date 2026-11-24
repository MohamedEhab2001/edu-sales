import mongoose from "mongoose";

const globalForMongoose = globalThis as typeof globalThis & {
  mongooseCache?: {
    connection: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const cache = globalForMongoose.mongooseCache ?? {
  connection: null,
  promise: null,
};

globalForMongoose.mongooseCache = cache;

export async function connectToDatabase() {
  if (cache.connection) return cache.connection;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing. Copy .env.example to .env.local and add your Atlas connection string.");
  }

  cache.promise ??= mongoose.connect(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
  });

  cache.connection = await cache.promise;
  return cache.connection;
}
