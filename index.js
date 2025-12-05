require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { connectDB } = require("./config/db");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    const collections = await connectDB();
    //Routes
    app.use("/users", require("./routes/users")(collections));
  } catch (err) {
    console.error("Database connection failed:", err.message);
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("UrbanEye Server");
});

app.listen(port, () => {
  console.log(`UrbanEye Server listening on port ${port}`);
});
