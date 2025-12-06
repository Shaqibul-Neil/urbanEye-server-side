const express = require("express");
const responseSend = require("../utilities/responseSend");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const { ObjectId } = require("mongodb");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection } = collections;

  //save an user to db on signup
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
  router.get("/:email", verifyFireBaseToken, async (req, res) => {
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

  //----------------ADMIN ACTIONS------------------
  //get all user for admin
  router.get(
    "/",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const result = await userCollection
          .find({ role: "citizen" })
          .sort({ createdAt: -1 })
          .toArray();
        return responseSend(res, 200, "Successfully fetched users data", {
          users: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to fetch user data");
      }
    }
  );

  //admin block unblock user
  router.patch(
    "/:id/status",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const id = req.params.id;
        const userInfo = req.body;
        const query = { _id: new ObjectId(id) };
        const updateUser = { $set: { isBlocked: userInfo.status } };
        const result = await userCollection.updateOne(query, updateUser);
        return responseSend(res, 201, "User updated successfully", {
          user: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to update user information");
      }
    }
  );

  //getting user role
  router.get(
    "/:email/role",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const email = req.params.email;
        const query = { email };
        const user = await userCollection.findOne(query);
        return responseSend(res, 200, "Successfully fetched user role data", {
          role: user?.role || "citizen",
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to fetch user role data");
      }
    }
  );

  return router;
};
