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
        const { name, email, password, photoURL, phone } = req.body;

        //create user in firebase
        const newUser = await admin.auth().createUser({
          displayName: name,
          email,
          password,
          photoURL,
          phoneNumber: phone,
        });
        //assign staff role
        await admin.auth().setCustomUserClaims(newUser.uid, { role: "staff" });
        //save in database
        const staffInfo = {
          uid: newUser.uid,
          staffName: name,
          staffEmail: email,
          staffPhone: phone,
          staffPhotoURL: photoURL,
          role: "staff",
          createdAt: new Date(),
          workStatus: "available",
        };
        const result = await staffCollection.insertOne(staffInfo);
        return responseSend(res, 201, "Staff created successfully", result);
      } catch (error) {
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
        const query = { _id: new ObjectId(id) };
        const result = await staffCollection.deleteOne(query);
        responseSend(res, 200, "Successfully deleted the staff", {
          staff: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to delete staff");
      }
    }
  );

  //update a staff by admin
  router.patch(
    "/:id/admin",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const staffInfo = req.body;
        const updatedStaff = {
          $set: {
            staffName: staffInfo.staffName,
            staffEmail: staffInfo.staffEmail,
            staffPhone: staffInfo.staffPhone,
            lastUpdatedAt: new Date(),
          },
          $inc: { totalUpdate: 1 },
        };
        const result = await staffCollection.updateOne(query, updatedStaff);
        responseSend(res, 201, "Successfully updated staff information", {
          staff: result,
        });
      } catch (error) {
        return responseSend(res, 400, "Failed to update staff information");
      }
    }
  );
  return router;
};
