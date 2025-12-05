const express = require("express");
const responseSend = require("../utilities/responseSend");
const generateTrackingId = require("../utilities/generateTrackingId");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection, issueCollection } = collections;

  //save an issue to db
  router.post("/", async (req, res) => {
    try {
      const issueInfo = req.body;
      //finding the user
      const userEmail = issueInfo.userEmail;
      const user = await userCollection.findOne({ email: userEmail });
      if (!user) return responseSend(res, 404, "User not found");
      console.log("user", user);
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
  //get all issue from db
  router.get("/", async (req, res) => {
    try {
      const query = {};
      const { email } = req.query;
      if (email) query.userEmail = email;
      const result = await issueCollection.find(query).toArray();
      return responseSend(res, 200, "Successfully fetched issue data", {
        issue: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch issue data");
    }
  });
  return router;
};
