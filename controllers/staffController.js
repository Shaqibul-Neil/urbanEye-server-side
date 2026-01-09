const admin = require("../config/firebase");
const responseSend = require("../utilities/responseSend");
const { ObjectId } = require("mongodb");

//----------------ADMIN ACTIONS------------------

// Save a staff to db
const createStaff = async (req, res, collections) => {
  const { staffCollection } = collections;
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
};

// Get all staff for admin and based on work status
const getAllStaff = async (req, res, collections) => {
  const { staffCollection } = collections;
  try {
    const { workStatus } = req.query;
    const query = {};
    if (workStatus) {
      query.workStatus = workStatus;
    }
    const result = await staffCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    return responseSend(res, 200, "Successfully fetched staff data", {
      staff: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch staff data");
  }
};

// Delete a staff by admin
const deleteStaff = async (req, res, collections) => {
  const { staffCollection } = collections;
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
};

// Update a staff by admin
const updateStaff = async (req, res, collections) => {
  const { staffCollection } = collections;
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
};

module.exports = {
  createStaff,
  getAllStaff,
  deleteStaff,
  updateStaff
};