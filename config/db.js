const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.DATABASE_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbName = "urbanEyeDB";
async function connectDB() {
  await client.connect();
  console.log("MongoDB connected successfully");
  const db = client.db(dbName);
  return {
    userCollection: db.collection("users"),
    staffCollection: db.collection("staff"),
    issueCollection: db.collection("issues"),
    paymentCollection: db.collection("payments"),
    upvoteCollection: db.collection("upvotes"),
  };
}

module.exports = { client, connectDB };
