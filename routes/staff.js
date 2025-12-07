const express = require("express");
const admin = require("../config/firebase");

const responseSend = require("../utilities/responseSend");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const { ObjectId } = require("mongodb");

module.exports = (collections) => {
  const router = express.Router();
  const { staffCollection } = collections;

  //----------------ADMIN ACTIONS------------------
  //save a staff to db
  router.post(
    "/",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const { name, email, password, photoURL } = req.body;

        //create user in firebase
        const newUser = await admin
          .auth()
          .createUser({ displayName: name, email, password, photoURL });
        //assign staff role
        await admin.auth().setCustomUserClaims(newUser.uid, { role: "staff" });
        //save in database
        const staffInfo = {
          uid: newUser.uid,
          staffName: name,
          staffEmail: email,
          staffPhotoURL: photoURL,
          role: "staff",
          createdAt: new Date(),
          workStatus: "available",
        };
        const result = await staffCollection.insertOne(staffInfo);
        return responseSend(res, 201, "Staff created successfully", result);
      } catch (error) {
        console.log(error);
        return responseSend(res, 500, error.message);
      }
    }
  );

  //get all staff for admin
  router.get(
    "/",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const result = await staffCollection
          .find()
          .sort({ createdAt: -1 })
          .toArray();
        return responseSend(res, 200, "Successfully fetched staff data", {
          staff: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to fetch staff data");
      }
    }
  );

  //delete a staff by admin
  router.delete(
    "/:id/admin",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const id = req.params.id;
        console.log(id);
        const query = { _id: new ObjectId(id) };
        console.log(query);
        const result = await staffCollection.deleteOne(query);
        console.log(result);
        responseSend(res, 200, "Successfully deleted the staff", {
          staff: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to delete staff");
      }
    }
  );

  return router;
};
