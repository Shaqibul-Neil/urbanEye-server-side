const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyStaff = require("../middlewares/verifyStaff");
const issuesController = require("../controllers/issuesController");

module.exports = (collections) => {
  const router = express.Router();

  //----------------CITIZEN ACTIONS------------------
  router.post("/", verifyFireBaseToken, (req, res) => issuesController.createIssue(req, res, collections));
  router.get("/", verifyFireBaseToken, (req, res) => issuesController.getAllIssues(req, res, collections));
  router.get("/my-issues", verifyFireBaseToken, (req, res) => issuesController.getMyIssues(req, res, collections));
  router.patch("/:id", verifyFireBaseToken, (req, res) => issuesController.updateIssue(req, res, collections));
  router.delete("/:id", verifyFireBaseToken, (req, res) => issuesController.deleteIssue(req, res, collections));
  router.get("/:id", verifyFireBaseToken, (req, res) => issuesController.getIssueDetails(req, res, collections));
  router.post("/:id/upvote", verifyFireBaseToken, (req, res) => issuesController.upvoteIssue(req, res, collections));
  router.get("/:id/check-upvote", verifyFireBaseToken, (req, res) => issuesController.checkUpvote(req, res, collections));

  //----------------ADMIN ACTIONS------------------
  router.patch("/:id/assign/admin", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    issuesController.assignStaff(req, res, collections)
  );
  router.patch("/:id/reject/admin", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    issuesController.rejectIssue(req, res, collections)
  );
  router.get("/admin/stats/status", verifyFireBaseToken, (req, res) => issuesController.getStatusStats(req, res, collections));
  router.get("/latest/admin", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    issuesController.getLatestIssuesAdmin(req, res, collections)
  );

  //----------------STAFF ACTIONS------------------
  router.get("/staff/assigned-issues", verifyFireBaseToken, verifyStaff(collections), (req, res) => 
    issuesController.getAssignedIssuesStaff(req, res, collections)
  );
  router.patch("/:id/staff/change-status", verifyFireBaseToken, verifyStaff(collections), (req, res) => 
    issuesController.changeStatusStaff(req, res, collections)
  );
  router.get("/staff/issue-aggregate", verifyFireBaseToken, verifyStaff(collections), (req, res) => 
    issuesController.getIssueAggregateStaff(req, res, collections)
  );
  router.get("/staff/assigned/today/task", verifyFireBaseToken, verifyStaff(collections), (req, res) => 
    issuesController.getTodayTaskStaff(req, res, collections)
  );
  router.get("/resolved/staff/latest", verifyFireBaseToken, verifyStaff(collections), (req, res) => 
    issuesController.getLatestResolvedStaff(req, res, collections)
  );

  //----------------PUBLIC------------------
  router.get("/public/all-issues", (req, res) => issuesController.getPublicIssues(req, res, collections));
  router.get("/latest/resolved-issues", (req, res) => issuesController.getLatestResolvedIssues(req, res, collections));

  return router;
};

//***************************************************************************************************************** */
/*Need to understand later : priority high bt status close stays at the end, only issues pending and high status comes first, then etc......*/
/*
const query = { "assignedStaff.staffEmail": staffEmail };

// filter by status / priority query
if (status) query.status = status;
if (priority) query.priority = priority;

// Sort rules:
// 1. Closed issues last (status: "closed" first/false, open first/true)
// 2. Priority ascending (high priority = smaller number, e.g., 1 highest)
// 3. Optional: createdAt descending (recent first)
const issues = await issueCollection
  .find(query)
  .sort({
    status: 1, // open (e.g., 'open') comes first, closed ('closed') comes last
    priority: 1, // high priority first
    createdAt: -1 // newest first
  })
  .toArray();

const issues = await issueCollection
  .aggregate([
    { $match: query },
    { $addFields: { isOpen: { $cond: [{ $eq: ["$status", "closed"] }, 0, 1] } } },
    { $sort: { isOpen: -1, priority: 1, createdAt: -1 } }
  ])
  .toArray();
 */
//**************************************************************************************** */
/*
Need to understand and ask support
router.get(
  "/staff/latest/resolved",
  verifyFireBaseToken,
  verifyStaff(collections),
  async (req, res) => {
    try {
      const email = req.decoded_email;

      const result = await issueCollection.aggregate([
        // 1. শুধু এই staff এর resolved issue নিই
        {
          $match: {
            status: "resolved",
            "assignedStaff.staffEmail": email,
          },
        },

        // 2. timeline থেকে শুধু "resolved" action টা বের করি
        {
          $addFields: {
            resolvedTimeline: {
              $filter: {
                input: "$timeline",
                as: "t",
                cond: {
                  $eq: ["$$t.action", "Status changed to resolved"],
                },
              },
            },
          },
        },

        // 3. ওই resolved action এর সময়টা নেই
        {
          $addFields: {
            resolvedAt: {
              $arrayElemAt: ["$resolvedTimeline.at", 0],
            },
          },
        },

        // 4. কী কী পাঠাবো সেটুকু ঠিক করি
        {
          $project: {
            title: 1,
            trackingId: 1,
            resolvedAt: 1,
          },
        },

        // 5. সর্বশেষ resolved আগে
        { $sort: { resolvedAt: -1 } },

        // 6. চাইলে limit
        { $limit: 5 },
      ]).toArray();

      return responseSend(res, 200, "Resolved tasks fetched", {
        tasks: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch resolved tasks");
    }
  }
);

*/
