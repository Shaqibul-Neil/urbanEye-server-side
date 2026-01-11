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
      .toArray();
    return responseSend(res, 200, "Successfully fetched latest user data", {
      user: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch user data");
  }
};

// Get user statistics for profile
const getUserStats = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const { email } = req.params;

    // Verify user exists
    const user = await userCollection.findOne({ email });
    if (!user) {
      return responseSend(res, 404, "User not found");
    }

    // Get user's issues
    const userIssues = await issueCollection
      .find({ userEmail: email })
      .toArray();

    // Basic stats
    const totalIssues = userIssues.length;
    const resolvedIssues = userIssues.filter(
      (issue) => issue.status === "resolved"
    ).length;
    const pendingIssues = userIssues.filter(
      (issue) => issue.status === "pending"
    ).length;

    // Map resolved issues safely with resolved date
    const resolvedIssuesWithTime = userIssues
      .map((issue) => {
        const resolvedEvent = issue.timeline?.find(
          (t) => t.action === "Status changed to resolved"
        );

        //console.log("resolvedEvent", resolvedEvent);
        if (resolvedEvent && issue.createdAt) {
          const createdDate = new Date(issue.createdAt);
          //console.log("createdDate", createdDate);
          const resolvedDate = new Date(resolvedEvent.at);
          //console.log("resolvedDate", resolvedDate);
          if (!isNaN(createdDate) && !isNaN(resolvedDate)) {
            return { ...issue, createdDate, resolvedDate };
          }
        }
        return null;
      })
      .filter(Boolean);
    //console.log("resolvedIssuesWithTime", resolvedIssuesWithTime);
    // Average resolution time
    // Average resolution time with smart formatting
    let avgResolutionTime = 0;
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce(
        (sum, issue) => sum + (issue.resolvedDate - issue.createdDate),
        0
      );

      // Calculate exact days (with decimals)
      const exactDays =
        totalResolutionTime /
        resolvedIssuesWithTime.length /
        (1000 * 60 * 60 * 24);

      //console.log("exactDays:", exactDays);

      // If less than 1 day, show with 1 decimal place
      // If 1 day or more, show as whole number
      if (exactDays < 1) {
        avgResolutionTime = Math.round(exactDays * 10) / 10; // 1 decimal place
      } else {
        avgResolutionTime = Math.round(exactDays); // whole number
      }

      //console.log("avgResolutionTime:", avgResolutionTime);
    }

    // Most active month
    const monthCounts = {};
    userIssues.forEach((issue) => {
      const month = new Date(issue.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });
      monthCounts[month] = (monthCounts[month] || 0) + 1;
    });
    const mostActiveMonth = Object.keys(monthCounts).reduce(
      (a, b) => (monthCounts[a] > monthCounts[b] ? a : b),
      Object.keys(monthCounts)[0] || "N/A"
    );

    // Most common category
    const categoryCounts = {};
    userIssues.forEach((issue) => {
      categoryCounts[issue.category] =
        (categoryCounts[issue.category] || 0) + 1;
    });
    const mostCommonCategory = Object.keys(categoryCounts).reduce(
      (a, b) => (categoryCounts[a] > categoryCounts[b] ? a : b),
      Object.keys(categoryCounts)[0] || "N/A"
    );

    // Activity trend last 6 months
    const activityTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = userIssues.filter((issue) => {
        const issueDate = new Date(issue.createdAt);
        return issueDate >= monthStart && issueDate <= monthEnd;
      }).length;

      activityTrend.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count,
      });
    }

    const stats = {
      totalIssues,
      resolvedIssues,
      pendingIssues,
      avgResolutionTime,
      mostActiveMonth,
      mostCommonCategory,
      activityTrend,
    };

    return responseSend(res, 200, "User stats fetched successfully", { stats });
  } catch (error) {
    //console.error("Error fetching user stats:", error);
    return responseSend(res, 500, "Failed to fetch user stats");
  }
};

module.exports = {
  createUser,
  getUserInfo,
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  getUserRole,
  getLatestUsers,
  getUserStats,
};
