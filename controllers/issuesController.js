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
    const searchText = req.query.searchText || "";
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "date-desc";

    //find the user
    const user = await userCollection.findOne({ email });
    let query = {};

    if (user.role === "citizen") {
      query.userEmail = email;
    } else if (user.role === "admin") {
      query = {};
    }

    // Search filter
    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      query.status = { $in: status.split(",") };
    }

    // Sort configuration
    let sortConfig = {};
    switch (sortBy) {
      case "date-desc":
        sortConfig = { createdAt: -1 };
        break;
      case "date-asc":
        sortConfig = { createdAt: 1 };
        break;
      case "priority-high":
        sortConfig = { priority: 1, createdAt: -1 };
        break;
      case "priority-low":
        sortConfig = { priority: -1, createdAt: -1 };
        break;
      case "title-asc":
        sortConfig = { title: 1 };
        break;
      case "title-desc":
        sortConfig = { title: -1 };
        break;
      case "status":
        sortConfig = { status: 1, createdAt: -1 };
        break;
      default:
        sortConfig = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalIssues = await issueCollection.countDocuments(query);
    const totalPages = Math.ceil(totalIssues / limit);

    // Get paginated results
    const result = await issueCollection
      .find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .toArray();

    return responseSend(res, 200, "Successfully fetched issue data", {
      issue: result,
      pagination: {
        totalIssues,
        totalPages,
        currentPage: Math.floor(skip / limit),
        limit,
        hasNext: skip + limit < totalIssues,
        hasPrev: skip > 0,
      },
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
    const searchText = req.query.searchText || "";
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;
    const { status, priority, sortBy = "date-desc" } = req.query;

    // find user
    const user = await userCollection.findOne({ email });
    if (!user) {
      return responseSend(res, 400, "User Not Found");
    }

    let query = {
      userEmail: email,
    };

    // Search filter
    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    // status filter
    if (status && status !== "all") {
      query.status = { $in: status.split(",") };
    }

    // priority filter
    if (priority && priority !== "all") {
      query.priority = { $in: priority.split(",") };
    }

    // Sort configuration
    let sortConfig = {};
    switch (sortBy) {
      case "date-desc":
        sortConfig = { createdAt: -1 };
        break;
      case "date-asc":
        sortConfig = { createdAt: 1 };
        break;
      case "priority-high":
        sortConfig = { priority: 1, createdAt: -1 };
        break;
      case "priority-low":
        sortConfig = { priority: -1, createdAt: -1 };
        break;
      case "title-asc":
        sortConfig = { title: 1 };
        break;
      case "title-desc":
        sortConfig = { title: -1 };
        break;
      case "status":
        sortConfig = { status: 1, createdAt: -1 };
        break;
      default:
        sortConfig = { createdAt: -1 };
    }

    // Get total count for pagination
    const totalIssues = await issueCollection.countDocuments(query);
    const totalPages = Math.ceil(totalIssues / limit);

    // Get paginated results
    const issues = await issueCollection
      .find(query)
      .sort(sortConfig)
      .skip(skip)
      .limit(limit)
      .toArray();

    return responseSend(res, 200, "Successfully fetched my issues", {
      issue: issues,
      pagination: {
        totalIssues,
        totalPages,
        currentPage: Math.floor(skip / limit),
        limit,
        hasNext: skip + limit < totalIssues,
        hasPrev: skip > 0,
      },
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
    const {
      staffEmail,
      status,
      searchText = "",
      limit = 10,
      skip = 0,
      sortBy = "date-desc",
    } = req.query;

    if (!staffEmail) {
      return responseSend(res, 400, "Staff Email is required");
    }

    const query = { "assignedStaff.staffEmail": staffEmail };

    // Status filter
    if (status) query.status = status;

    // Search filter
    if (searchText) {
      query.$or = [
        { title: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { category: { $regex: searchText, $options: "i" } },
      ];
    }

    // Sort configuration
    let sortConfig = {};
    switch (sortBy) {
      case "date-desc":
        sortConfig = { createdAt: -1 };
        break;
      case "date-asc":
        sortConfig = { createdAt: 1 };
        break;
      case "priority-high":
        sortConfig = { priority: 1, createdAt: -1 };
        break;
      case "priority-low":
        sortConfig = { priority: -1, createdAt: -1 };
        break;
      case "title-asc":
        sortConfig = { title: 1 };
        break;
      case "title-desc":
        sortConfig = { title: -1 };
        break;
      default:
        sortConfig = { priority: 1, createdAt: -1 };
    }

    // Get total count for pagination
    const totalIssues = await issueCollection.countDocuments(query);
    const totalPages = Math.ceil(totalIssues / Number(limit));

    // Get paginated results
    const issues = await issueCollection
      .find(query)
      .sort(sortConfig)
      .skip(Number(skip))
      .limit(Number(limit))
      .toArray();

    return responseSend(res, 200, "Successfully fetched issue data", {
      issues: issues,
      pagination: {
        totalIssues,
        totalPages,
        currentPage: Math.floor(Number(skip) / Number(limit)),
        limit: Number(limit),
        hasNext: Number(skip) + Number(limit) < totalIssues,
        hasPrev: Number(skip) > 0,
      },
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

// Get admin platform statistics
const getAdminPlatformStats = async (req, res, collections) => {
  const { issueCollection, userCollection, staffCollection } = collections;
  try {
    // Get all issues for platform stats
    const allIssues = await issueCollection.find({}).toArray();

    // Calculate basic stats
    const totalIssuesManaged = allIssues.length;
    const totalResolved = allIssues.filter(
      (issue) => issue.status === "resolved"
    ).length;

    // Get active staff count
    const activeStaffCount = await staffCollection.countDocuments({});

    // Get total citizens
    const totalCitizens = await userCollection.countDocuments({
      role: "citizen",
    });

    // Calculate citizen participation rate (citizens who have posted issues)
    const activeCitizens = await issueCollection
      .aggregate([
        {
          $group: {
            _id: "$userEmail",
          },
        },
      ])
      .toArray();
    const citizenParticipationRate =
      totalCitizens > 0
        ? Math.round((activeCitizens.length / totalCitizens) * 100)
        : 0;

    // Generate platform activity trend (last 6 months)
    const platformActivityTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = allIssues.filter((issue) => {
        const issueDate = new Date(issue.createdAt);
        return issueDate >= monthStart && issueDate <= monthEnd;
      }).length;

      platformActivityTrend.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count,
      });
    }

    // Calculate resolution rate
    const resolutionRate =
      totalIssuesManaged > 0
        ? Math.round((totalResolved / totalIssuesManaged) * 100)
        : 0;

    // Calculate average resolution time
    const resolvedIssuesWithTime = allIssues
      .filter(
        (issue) => issue.status === "resolved" && Array.isArray(issue.timeline)
      )
      .map((issue) => {
        const createdAt = issue.createdAt ? new Date(issue.createdAt) : null;

        const resolvedEvent = issue.timeline.find(
          (t) => t.action === "Status changed to resolved"
        );

        const resolvedAt = resolvedEvent?.at
          ? new Date(resolvedEvent.at)
          : null;

        if (!createdAt || !resolvedAt) return null;

        return {
          createdAt,
          resolvedAt,
        };
      })
      .filter(Boolean);

    //console.log(resolvedIssuesWithTime);
    let avgResolutionTime = 0;
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce(
        (sum, issue) => sum + (issue.resolvedAt - issue.createdAt),
        0
      );

      avgResolutionTime = Math.round(
        totalResolutionTime /
          resolvedIssuesWithTime.length /
          (1000 * 60 * 60 * 24)
      );
    }

    const stats = {
      totalIssuesManaged,
      totalResolved,
      activeStaffCount,
      citizenParticipationRate,
      platformActivityTrend,
      resolutionRate,
      avgResolutionTime,
    };

    return responseSend(res, 200, "Admin platform stats fetched successfully", {
      stats,
    });
  } catch (error) {
    //console.error("Error fetching admin platform stats:", error);
    return responseSend(res, 500, "Failed to fetch admin platform stats");
  }
};

// Get staff performance statistics
const getStaffPerformanceStats = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const { email } = req.params;

    // Get staff's assigned issues
    const staffIssues = await issueCollection
      .find({
        "assignedStaff.staffEmail": email,
      })
      .toArray();

    // Calculate basic stats
    const assignedIssues = staffIssues.length;
    const resolvedIssues = staffIssues.filter(
      (issue) => issue.status === "resolved"
    ).length;
    const pendingIssues = staffIssues.filter(
      (issue) =>
        issue.status === "pending" ||
        issue.status === "in-progress" ||
        issue.status === "working"
    ).length;

    // Calculate average resolution time
    const resolvedIssuesWithTime = staffIssues
      .map((issue) => {
        const resolvedEvent = issue.timeline.find((t) =>
          t.action.toLowerCase().includes("resolved")
        );
        if (resolvedEvent) return { ...issue, resolvedAt: resolvedEvent.at };
        return null;
      })
      .filter(Boolean);

    let avgResolutionTime = 0;
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce(
        (sum, issue) => {
          const createdDate = new Date(issue.createdAt);
          const resolvedDate = new Date(issue.resolvedAt);
          return sum + (resolvedDate - createdDate);
        },
        0
      );

      avgResolutionTime = Math.round(
        totalResolutionTime /
          resolvedIssuesWithTime.length /
          (1000 * 60 * 60 * 24)
      );
    }

    // Generate resolution trend (last 6 months)
    const resolutionTrend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const count = resolvedIssuesWithTime.filter((issue) => {
        const resolvedDate = new Date(issue.resolvedAt);
        return resolvedDate >= monthStart && resolvedDate <= monthEnd;
      }).length;

      resolutionTrend.push({
        date: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count,
      });
    }

    // Find best performance day (day of week with most resolutions)
    const dayResolutions = {};
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    resolvedIssuesWithTime.forEach((issue) => {
      const dayOfWeek = new Date(issue.resolvedAt).getDay();
      const dayName = dayNames[dayOfWeek];
      dayResolutions[dayName] = (dayResolutions[dayName] || 0) + 1;
    });

    const bestPerformanceDay = Object.keys(dayResolutions).reduce(
      (a, b) => (dayResolutions[a] > dayResolutions[b] ? a : b),
      Object.keys(dayResolutions)[0] || "N/A"
    );
    //console.log(bestPerformanceDay);
    // Calculate resolution consistency (percentage of months with resolutions)
    const monthsWithResolutions = resolutionTrend.filter(
      (month) => month.count > 0
    ).length;
    const resolutionConsistency = Math.round((monthsWithResolutions / 6) * 100);
    //console.log(resolutionConsistency);
    const stats = {
      assignedIssues,
      resolvedIssues,
      pendingIssues,
      avgResolutionTime,
      resolutionTrend,
      bestPerformanceDay,
      resolutionConsistency,
    };

    return responseSend(
      res,
      200,
      "Staff performance stats fetched successfully",
      { stats }
    );
  } catch (error) {
    //console.error("Error fetching staff performance stats:", error);
    return responseSend(res, 500, "Failed to fetch staff performance stats");
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
      .limit(8)
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

//get pulse stats on all issues for home page
const getPulseStats = async (req, res, collections) => {
  const { issueCollection } = collections;

  try {
    const result = await issueCollection
      .aggregate([
        {
          $facet: {
            // Count issues by status
            statusCounts: [
              {
                $group: {
                  _id: "$status",
                  count: { $sum: 1 },
                },
              },
            ],

            // Average resolution time (closed issues)
            avgResolutionTime: [
              { $match: { status: "closed" } },
              {
                $project: {
                  createdAt: 1,
                  resolvedAt: {
                    $arrayElemAt: ["$timeline.at", -1],
                  },
                },
              },
              {
                $project: {
                  resolutionDays: {
                    $divide: [
                      { $subtract: ["$resolvedAt", "$createdAt"] },
                      1000 * 60 * 60 * 24,
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgDays: { $avg: "$resolutionDays" },
                },
              },
            ],

            //  Category analytics
            categories: [
              {
                $group: {
                  _id: "$category",
                  total: { $sum: 1 },
                },
              },
              { $sort: { total: -1 } },
            ],
          },
        },
      ])
      .toArray();

    const data = result[0];

    //  Normalize data for frontend
    const pulseStats = {
      open: data.statusCounts.find((s) => s._id === "pending")?.count || 0,
      inProgress:
        data.statusCounts.find((s) => s._id === "in-progress")?.count || 0,
      working: data.statusCounts.find((s) => s._id === "working")?.count || 0,
      resolved: data.statusCounts.find((s) => s._id === "resolved")?.count || 0,
      closed: data.statusCounts.find((s) => s._id === "closed")?.count || 0,
      rejected: data.statusCounts.find((s) => s._id === "rejected")?.count || 0,
      total: data.statusCounts.reduce((acc, curr) => acc + curr.count, 0),
      avgResolutionTime: data.avgResolutionTime[0]?.avgDays?.toFixed(1) || "0",

      categories:
        data.categories.map((c) => ({
          name: c._id,
          total: c.total,
        })) || [],
    };

    return responseSend(res, 200, "City pulse fetched", pulseStats);
  } catch (error) {
    //console.error(error);
    return responseSend(res, 500, "Failed to fetch city pulse");
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
  getAdminPlatformStats,
  getStaffPerformanceStats,
  getTodayTaskStaff,
  getLatestResolvedStaff,

  // Public
  getPublicIssues,
  getLatestResolvedIssues,
  getPulseStats,

  // Dashboard
  getTopUpvotedIssues,
};
