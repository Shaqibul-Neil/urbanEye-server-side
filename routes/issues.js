const express = require("express");
const responseSend = require("../utilities/responseSend");
const generateTrackingId = require("../utilities/generateTrackingId");
const { ObjectId } = require("mongodb");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyStaff = require("../middlewares/verifyStaff");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection, issueCollection, staffCollection } = collections;

  //----------------CITIZEN ACTIONS------------------

  //save an issue to db by a citizen
  router.post("/", verifyFireBaseToken, async (req, res) => {
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
  });

  //get all issue from db via role
  router.get("/", verifyFireBaseToken, async (req, res) => {
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
  });

  //update an issue by citizen
  router.patch("/:id", verifyFireBaseToken, async (req, res) => {
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
      };
      const result = await issueCollection.updateOne(query, updatedIssue);
      responseSend(res, 201, "Successfully updated the issue", {
        issue: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to update issue");
    }
  });

  //delete an issue by user
  router.delete("/:id", verifyFireBaseToken, async (req, res) => {
    try {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      // check issue ownership
      const fetchedIssue = await issueCollection.findOne(query);
      if (fetchedIssue.userEmail !== req.decoded_email)
        return responseSend(
          res,
          403,
          "Forbidden: You cannot delete this issue"
        );
      const result = await issueCollection.deleteOne(query);
      responseSend(res, 200, "Successfully deleted the issue", {
        issue: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to delete issue");
    }
  });

  //----------------ADMIN ACTIONS------------------

  //assign staff to an issue
  router.patch(
    "/:id/assign/admin",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
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
    }
  );

  //reject issue by admin
  router.patch(
    "/:id/reject/admin",
    verifyFireBaseToken,
    verifyAdmin(collections),
    async (req, res) => {
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
        console.log(error);
        return responseSend(res, 400, "Failed to update status");
      }
    }
  );

  //data aggregation
  router.get("/admin/stats/status", async (req, res) => {
    try {
      const pipeline = [
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1 } },
      ];
      const result = await issueCollection.aggregate(pipeline).toArray();
      console.log(result);
      return responseSend(res, 200, "Successfully fetched data", {
        result: result,
      });
    } catch (error) {
      console.log(error);
      return responseSend(res, 400, "Failed fetched data");
    }
  });

  //----------------STAFF ACTIONS------------------
  router.get(
    "/staff/assigned-issues",
    verifyFireBaseToken,
    verifyStaff(collections),
    async (req, res) => {
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
        console.log(error);
        return responseSend(res, 400, "Failed to fetch issue data");
      }
    }
  );
  //update issue status for a particular issue
  router.patch(
    "/:id/staff/change-status",
    verifyFireBaseToken,
    verifyStaff(collections),
    async (req, res) => {
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
        console.log(error);
        return responseSend(res, 400, "Failed to update status");
      }
    }
  );

  //----------------PUBLIC------------------
  // Public issues
  router.get("/public/all-issues", async (req, res) => {
    try {
      const searchText = req.query.searchText;
      const { limit, skip } = req.query;

      let query = {};

      if (searchText) {
        query.$or = [
          { title: { $regex: searchText, $options: "i" } },
          { location: { $regex: searchText, $options: "i" } },
          { category: { $regex: searchText, $options: "i" } },
        ];
      }

      const result = await issueCollection
        .find(query)
        .limit(Number(limit))
        .skip(Number(skip))
        .project({
          description: 0,
          isAssignedStaff: 0,
          assignedStaff: 0,
          staffAssignedAt: 0,
          timeline: 0,
          trackingId: 0,
        })
        .sort({ priority: 1 })
        .toArray();
      const count = await issueCollection.countDocuments(query);
      return responseSend(res, 200, "Successfully fetched public issues", {
        issue: result,
        total: count,
      });
    } catch (error) {
      console.log(error);
      return responseSend(res, 400, "Failed to fetch public issues");
    }
  });

  return router;
};
