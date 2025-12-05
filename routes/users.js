const express = require("express");
const responseSend = require("../utilities/responseSend");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection } = collections;

  //save an user to db
  router.post("/", async (req, res) => {
    try {
      const user = req.body;
      const email = user.email;
      const query = { email };
      //user exist in db
      const isUserExist = await userCollection.findOne(query);
      if (isUserExist) return responseSend(res, 200, "User Already Exists");
      //new user
      const newUser = {
        ...user,
        role: "citizen",
        createdAt: new Date(),
        isPremium: false,
        isBlocked: false,
      };
      const result = await userCollection.insertOne(newUser);
      return responseSend(res, 201, "User created successfully", {
        user: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to create user ");
    }
  });

  //get single user info
  router.get("/:email", async (req, res) => {
    try {
      const email = req.params.email;
      const query = { email: email };
      const result = await userCollection.findOne(query);
      return responseSend(res, 200, "Successfully fetched user data", {
        user: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch user data");
    }
  });
  return router;
};
