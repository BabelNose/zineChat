import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer:MongoMemoryServer;

export const connect = async () => {
  // NOTE: before establishing a new connection close previous
  await mongoose.disconnect();

  mongoServer = await MongoMemoryServer.create();

  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri, {}, err => {
    if (err) {
      console.error(err);
    }
  });
};

// Remove and close the database and server.
export const closeConnection = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Remove all data from collections
export const clearData = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};