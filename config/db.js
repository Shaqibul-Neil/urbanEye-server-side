const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.DATABASE_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbName = "urbanEyeDB";
async function connectDB() {
  console.log("MongoDB connected successfully");
  const db = client.db(dbName);
  return {
    userCollection: db.collection("users"),
    issueCollection: db.collection("issues"),
    paymentCollection: db.collection("payments"),
  };
}

module.exports = { client, connectDB };
