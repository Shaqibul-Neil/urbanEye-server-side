const responseSend = require("../utilities/responseSend");
const generateTrackingId = require("../utilities/generateTrackingId");
const { ObjectId } = require("mongodb");

//----------------CITIZEN ACTIONS------------------

// Save an issue to db by a citizen
const createIssue = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const issueInfo = req.body;
    issueInfo.isAssignedStaff = false;
    //finding the user
    const userEmail = issueInfo.userEmail;
    if (userEmail !== req.decoded_email)
      return responseSend(res, 403, "Forbidden: You cannot edit this issue");
    const user = await userCollection.findOne({ email: userEmail });
    if (!user) return responseSend(res, 404, "User not found");
    //if user is blocked
    if (user.isBlocked) {
      return responseSend(
        res,
        400,
        "You are blocked. Please contact authorities"
      );
    }
    //if user is not premium then count the total issues max 3
    if (!user.isPremium) {
      const countIssues = await issueCollection.countDocuments({ userEmail });
      if (countIssues >= 3)
        return responseSend(
          res,
          400,
          "Upgrade to premium to report more issues"
        );
    }
    issueInfo.createdAt = new Date();
    issueInfo.status = "pending";
    issueInfo.priority = "normal";
    issueInfo.trackingId = generateTrackingId();
    // timeline with initial entry
    issueInfo.timeline = [{ action: "Issue created", at: new Date() }];

    const result = await issueCollection.insertOne(issueInfo);

    //increment user issue count
    await userCollection.updateOne(
      { email: userEmail },
      { $inc: { countIssues: 1 } }
    );
    return responseSend(res, 201, "Successfully Added Issue", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to create issue");
  }
};

// Get all issue from db via role
const getAllIssues = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const searchText = req.query.searchText;
    //find the user
    const user = await userCollection.findOne({ email });
    let query = {};
    if (user.role === "citizen") {
      query.userEmail = email;
    } else if (user.role === "admin") {
      query = {};
    }
    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }
    const result = await issueCollection
      .find(query)
      .sort({ priority: 1 })
      .toArray();
    return responseSend(res, 200, "Successfully fetched issue data", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issue data");
  }
};

// Get filter issue by status and priority and by limit for latest issue
const getMyIssues = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const limit = Number(req.query.limit) || 0;
    const { status, priority } = req.query;

    // find user
    const user = await userCollection.findOne({ email });
    if (!user) {
      return responseSend(res, 400, "User Not Found");
    }

    let query = {
      userEmail: email,
    };

    // status filter
    if (status) {
      query.status = { $in: status.split(",") };
    }

    // priority filter
    if (priority) {
      query.priority = { $in: priority.split(",") };
    }

    const issues = await issueCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    return responseSend(res, 200, "Successfully fetched my issues", {
      issue: issues,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issues");
  }
};

// Update an issue by citizen
const updateIssue = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const id = req.params.id;
    // check issue ownership
    const query = { _id: new ObjectId(id) };
    const fetchedIssue = await issueCollection.findOne(query);
    if (fetchedIssue.userEmail !== req.decoded_email)
      return responseSend(res, 403, "Forbidden: You cannot edit this issue");
    const issueInfo = req.body;
    const updatedIssue = {
      $set: {
        updatedAt: new Date(),
        title: issueInfo.title,
        description: issueInfo.description,
        category: issueInfo.category,
        location: issueInfo.location,
        photoURL: issueInfo.photoURL,
      },
      $inc: { totalUpdate: 1 },
      $push: {
        timeline: {
          action: "Issue details updated by user",
          at: new Date(),
        },
      },
    };
    const result = await issueCollection.updateOne(query, updatedIssue);
    responseSend(res, 201, "Successfully updated the issue", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to update issue");
  }
};

// Delete an issue by user
const deleteIssue = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    // check issue ownership
    const fetchedIssue = await issueCollection.findOne(query);
    if (fetchedIssue.userEmail !== req.decoded_email)
      return responseSend(res, 403, "Forbidden: You cannot delete this issue");
    const result = await issueCollection.deleteOne(query);
    responseSend(res, 200, "Successfully deleted the issue", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to delete issue");
  }
};

// Single issue details
const getIssueDetails = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await issueCollection.findOne(query);
    return responseSend(res, 200, "Successfully fetched issue details", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issue details");
  }
};

// Upvote
const upvoteIssue = async (req, res, collections) => {
  const { issueCollection, upvoteCollection } = collections;
  try {
    const issueId = req.params.id;
    const citizenEmail = req.decoded_email;

    // fetch issue
    const issue = await issueCollection.findOne({
      _id: new ObjectId(issueId),
    });
    //console.log("issue", issue);
    if (!issue) return responseSend(res, 404, "Issue not found");

    // prevent upvote on own issue
    if (issue.userEmail === citizenEmail) {
      //console.log("matched");
      return responseSend(res, 403, "Cannot upvote your own issue");
    }

    // check if already upvoted
    if (issue.upvotes && issue.upvotes.includes(citizenEmail)) {
      //console.log("already exist");
      return responseSend(res, 200, "Already upvoted");
    }

    // insert into upvote collection
    await upvoteCollection.insertOne({
      issueId: new ObjectId(issueId),
      citizenEmail,
      createdAt: new Date(),
    });

    // update issue: totalUpvoteCount and upvotes array
    await issueCollection.updateOne(
      { _id: new ObjectId(issueId) },
      {
        $inc: { totalUpvoteCount: 1 },
        $push: { upvotes: citizenEmail },
      }
    );

    return responseSend(res, 200, "Upvote added successfully", {
      issueId,
      citizenEmail,
      totalUpvoteCount: (issue.totalUpvoteCount || 0) + 1,
    });
  } catch (err) {
    //console.error(err);
    return responseSend(res, 400, "Failed to upvote issue");
  }
};

// Check if current user already upvoted an issue
const checkUpvote = async (req, res, collections) => {
  const { upvoteCollection } = collections;
  try {
    const issueId = req.params.id;
    const citizenEmail = req.decoded_email;

    const alreadyUpvoted = await upvoteCollection.findOne({
      issueId: new ObjectId(issueId),
      citizenEmail,
    });

    return responseSend(res, 200, "Upvote status fetched", {
      alreadyUpvoted: !!alreadyUpvoted,
    });
  } catch (err) {
    //console.error(err);
    return responseSend(res, 400, "Failed to fetch upvote status");
  }
};

//----------------ADMIN ACTIONS------------------

// Assign staff to an issue
const assignStaff = async (req, res, collections) => {
  const { issueCollection, staffCollection } = collections;
  try {
    const id = req.params.id;
    const { assignedStaff } = req.body;
    const { staffId, staffName, staffEmail, staffPhone } = assignedStaff;
    //find and update Issue
    const issueQuery = { _id: new ObjectId(id) };

    const updatedIssue = {
      $set: {
        assignedStaff: {
          staffId: staffId,
          staffName: staffName,
          staffEmail: staffEmail,
          staffPhone: staffPhone,
        },
        staffAssignedAt: new Date(),
        isAssignedStaff: true,
      },
      $push: {
        timeline: {
          action: `Staff assigned: ${staffName} (${staffEmail})`,
          at: new Date(),
        },
      },
    };
    const issueResult = await issueCollection.updateOne(
      issueQuery,
      updatedIssue
    );
    //find and update staff
    const staffQuery = { _id: new ObjectId(staffId) };
    const updatedStaff = { $set: { workStatus: "assigned" } };
    const staffResult = await staffCollection.updateOne(
      staffQuery,
      updatedStaff
    );
    return responseSend(res, 201, "Successfully updated", {
      issueResult,
      staffResult,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to update information");
  }
};

// Reject issue by admin
const rejectIssue = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const id = req.params.id;
    const { status } = req.body;
    const query = { _id: new ObjectId(id) };
    //update the issue
    const updatedIssue = {
      $set: { status: status },
      $push: {
        timeline: { action: `Status changed to ${status}`, at: new Date() },
      },
    };
    const result = await issueCollection.updateOne(query, updatedIssue);
    return responseSend(res, 200, "Status updated successfully", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to update status");
  }
};

// Data aggregation
const getStatusStats = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const email = req.decoded_email;
    //finding the user
    const user = await userCollection.findOne({ email });
    if (!user) {
      return responseSend(res, 404, "User not found");
    }
    //role wise match
    let matchStage = {};
    if (user.role === "citizen") {
      matchStage.userEmail = email;
    }
    const pipeline = [
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1 } },
    ];
    const result = await issueCollection.aggregate(pipeline).toArray();
    return responseSend(res, 200, "Successfully fetched data", {
      result: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed fetched data");
  }
};

// Latest 3 issues for admin dashboard
const getLatestIssuesAdmin = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const result = await issueCollection
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .project({ title: 1, userEmail: 1, photoURL: 1 })
      .toArray();
    return responseSend(res, 200, "Successfully fetched issue data", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issue data");
  }
};

//----------------STAFF ACTIONS------------------

const getAssignedIssuesStaff = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const { staffEmail, status, priority } = req.query;
    if (!staffEmail) {
      return responseSend(res, 400, "Staff Email is required");
    }
    const query = { "assignedStaff.staffEmail": staffEmail };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    const issues = await issueCollection
      .find(query)
      .sort({ priority: 1 })
      .toArray();
    return responseSend(res, 200, "Successfully fetched issue data", {
      issues: issues,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issue data");
  }
};

// Update issue status for a particular issue
const changeStatusStaff = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return responseSend(res, 400, "Status is required");
    const query = { _id: new ObjectId(id) };
    // find existing issue
    const existingIssue = await issueCollection.findOne(query);

    if (!existingIssue) {
      return responseSend(res, 404, "Issue not found");
    }
    //prevent duplicate status
    if (existingIssue.status === status) {
      return responseSend(res, 200, "Issue already has this status", {
        issue: { modifiedCount: 0 },
      });
    }
    //update if status is different
    const updatedIssue = {
      $set: { status: status },
      $push: {
        timeline: { action: `Status changed to ${status}`, at: new Date() },
      },
    };
    const result = await issueCollection.updateOne(query, updatedIssue);
    return responseSend(res, 200, "Status updated successfully", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to update status");
  }
};

// Issue aggregation for stats
const getIssueAggregateStaff = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const email = req.decoded_email;
    let matchStage = { "assignedStaff.staffEmail": email };
    const pipeline = [
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ];
    const result = await issueCollection.aggregate(pipeline).toArray();
    return responseSend(
      res,
      200,
      "Successfully staff issue aggregation data fetched",
      {
        dataAggregate: result,
      }
    );
  } catch (error) {
    return responseSend(
      res,
      400,
      "Staff issue aggregation data fetched failed",
      {
        dataAggregate: result,
      }
    );
  }
};

// Staff today's assigned task
const getTodayTaskStaff = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const query = { "assignedStaff.staffEmail": email };
    const result = await issueCollection
      .find(query)
      .sort({ staffAssignedAt: -1 })
      .limit(3)
      .project({
        title: 1,
        photoURL: 1,
        staffAssignedAt: 1,
        createdAt: 1,
        status: 1,
        category: 1,
        location: 1,
        userEmail: 1,
        priority: 1,
      })
      .toArray();
    return responseSend(res, 200, "Successfully fetched today task", {
      tasks: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch today task");
  }
};

// Staff latest resolved task
const getLatestResolvedStaff = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const result = await issueCollection
      .aggregate([
        {
          $match: { "assignedStaff.staffEmail": email, status: "resolved" },
        },
        {
          $project: {
            title: 1,
            trackingId: 1,
            photoURL: 1,
            createdAt: 1,
            category: 1,
            location: 1,
            userEmail: 1,
            priority: 1,
            lastTimeline: { $arrayElemAt: ["$timeline", -1] },
          },
        },
        { $match: { "lastTimeline.action": "Status changed to resolved" } },
        { $sort: { "lastTimeline.at": -1 } },
        { $limit: 3 },
      ])
      .toArray();
    return responseSend(
      res,
      200,
      "Latest resolved issue fetched successfully",
      {
        tasks: result,
      }
    );
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch latest resolved issue");
  }
};

//----------------PUBLIC------------------

// Get Public issues
const getPublicIssues = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const searchText = req.query.searchText;
    const { limit, skip, status, priority } = req.query;

    let query = {};

    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    //multiple checkbox = $in
    //single select = normal equality
    if (status) {
      query.status = { $in: status.split(",") };
    }

    if (priority) {
      query.priority = { $in: priority.split(",") };
    }
    const result = await issueCollection
      .find(query)
      .sort({ priority: 1 }) // Low → High priority
      .skip(Number(skip)) // pagination start
      .limit(Number(limit)) // page size
      .project({
        description: 0,
        isAssignedStaff: 0,
        assignedStaff: 0,
        staffAssignedAt: 0,
        timeline: 0,
        trackingId: 0,
      })
      .toArray();
    const count = await issueCollection.countDocuments(query);
    return responseSend(res, 200, "Successfully fetched public issues", {
      issue: result,
      total: count,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch public issues");
  }
};

// Get latest resolved issues
const getLatestResolvedIssues = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const query = { status: "resolved" };
    const result = await issueCollection
      .find(query)
      .sort({ updatedAt: -1 }) //latest resolved
      .limit(6)
      .project({
        description: 0,
        isAssignedStaff: 0,
        assignedStaff: 0,
        staffAssignedAt: 0,
        trackingId: 0,
      })
      .toArray();
    return responseSend(res, 200, "Successfully fetched issue data", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch issue data");
  }
};

// Get top upvoted issues
const getTopUpvotedIssues = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const limit = parseInt(req.query.limit) || 5;

    const result = await issueCollection
      .find({ totalUpvoteCount: { $gt: 0 } })
      .sort({ totalUpvoteCount: -1 })
      .limit(limit)
      .project({
        title: 1,
        totalUpvoteCount: 1,
        category: 1,
        location: 1,
        status: 1,
      })
      .toArray();

    return responseSend(res, 200, "Successfully fetched top upvoted issues", {
      issues: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch top upvoted issues");
  }
};

module.exports = {
  // Citizen actions
  createIssue,
  getAllIssues,
  getMyIssues,
  updateIssue,
  deleteIssue,
  getIssueDetails,
  upvoteIssue,
  checkUpvote,

  // Admin actions
  assignStaff,
  rejectIssue,
  getStatusStats,
  getLatestIssuesAdmin,

  // Staff actions
  getAssignedIssuesStaff,
  changeStatusStaff,
  getIssueAggregateStaff,
  getTodayTaskStaff,
  getLatestResolvedStaff,

  // Public
  getPublicIssues,
  getLatestResolvedIssues,

  // Dashboard
  getTopUpvotedIssues,
};
