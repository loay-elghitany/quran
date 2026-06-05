const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

async function connect() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function closeDatabase() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

async function clearDatabase() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.deleteMany();
    } catch (err) {
      // ignore
    }
  }
}

module.exports = { connect, closeDatabase, clearDatabase };
