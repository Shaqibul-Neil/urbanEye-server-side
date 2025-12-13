const express = require("express");
const responseSend = require("../utilities/responseSend");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const { ObjectId } = require("mongodb");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection, staffCollection } = collections;

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
      // check staff collection first
      const staff = await staffCollection.findOne({ staffEmail: email });
      if (staff) {
        return responseSend(res, 200, "Staff data fetched", { user: staff });
      }
      // check user collection
      const result = await userCollection.findOne({ email: email });
      return responseSend(res, 200, "Successfully fetched user data", {
        user: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch user data");
    }
  });

  //update user profile
  router.put("/my-profile", verifyFireBaseToken, async (req, res) => {
    try {
      const email = req.decoded_email;
      const { name, photoURL, role } = req.body;
      let result;
      if (role === "staff") {
        result = await staffCollection.updateOne(
          { staffEmail: email },
          {
            $set: {
              staffName: name,
              staffPhotoURL: photoURL,
              updatedAt: new Date(),
            },
          }
        );
      } else {
        result = await userCollection.updateOne(
          { email },
          {
            $set: {
              displayName: name,
              photoURL: photoURL,
              updatedAt: new Date(),
            },
          }
        );
      }
      return responseSend(res, 200, "Profile updated", { profile: result });
    } catch (error) {
      return responseSend(res, 400, "Profile update failed");
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
  router.get("/:email/role", verifyFireBaseToken, async (req, res) => {
    try {
      const email = req.params.email;
      //check in staff collection to get the role first so that staff can easily login without by default getting the citizen role
      const staff = await staffCollection.findOne({ staffEmail: email });
      if (staff) {
        return responseSend(res, 200, "Staff role found", { role: "staff" });
      }
      //if no staff found then citizen
      const user = await userCollection.findOne({ email: email });
      return responseSend(res, 200, "Successfully fetched user role data", {
        role: user?.role || "citizen",
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch user role data");
    }
  });

  //get latest registered users
  router.get(
    "/latest/registered-users",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const result = await userCollection
          .find()
          .sort({ createdAt: -1 })
          .limit(3)
          .project({ displayName: 1, email: 1, photoURL: 1 })
          .toArray();
        return responseSend(res, 200, "Successfully fetched latest user data", {
          user: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to fetch user data");
      }
    }
  );

  return router;
};
