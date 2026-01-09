const responseSend = require("../utilities/responseSend");
const { ObjectId } = require("mongodb");

// Save an user to db on signup
const createUser = async (req, res, collections) => {
  const { userCollection } = collections;
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
};

// Get single user info
const getUserInfo = async (req, res, collections) => {
  const { userCollection, staffCollection } = collections;
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
};

// Update user profile
const updateUserProfile = async (req, res, collections) => {
  const { userCollection, staffCollection } = collections;
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
};

//----------------ADMIN ACTIONS------------------

// Get all user for admin
const getAllUsers = async (req, res, collections) => {
  const { userCollection } = collections;
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
};

// Admin block unblock user
const updateUserStatus = async (req, res, collections) => {
  const { userCollection } = collections;
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
};

// Getting user role
const getUserRole = async (req, res, collections) => {
  const { userCollection, staffCollection } = collections;
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
};

// Get latest registered users
const getLatestUsers = async (req, res, collections) => {
  const { userCollection } = collections;
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
};

module.exports = {
  createUser,
  getUserInfo,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserRole,
  getLatestUsers
};