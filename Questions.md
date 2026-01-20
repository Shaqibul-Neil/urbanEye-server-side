# 🎯 UrbanEye Project - 150 Interview Questions with Detailed Answers

## Table of Contents

- [Section 1: Project Overview (Q1-15)](#section-1-project-overview)
- [Section 2: MVC Architecture & Backend (Q16-40)](#section-2-mvc-architecture--backend)
- [Section 3: Page Builder Feature (Q41-65)](#section-3-page-builder-feature)
- [Section 4: Authentication & Authorization (Q66-85)](#section-4-authentication--authorization)
- [Section 5: Framer Motion & Animations (Q86-100)](#section-5-framer-motion--animations)
- [Section 6: Frontend Features (Q101-125)](#section-6-frontend-features)
- [Section 7: Payment & Advanced Features (Q126-150)](#section-7-payment--advanced-features)

---

## Section 1: Project Overview

### Q1: Can you give a high-level overview of your UrbanEye project?

**Answer:**
UrbanEye is a full-stack civic issue reporting platform where citizens can report urban problems to local authorities.

**Tech Stack:**

- **Frontend:** React.js, TailwindCSS, TanStack Query, React Router, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB
- **Authentication:** Firebase Authentication
- **Payments:** Stripe

**Three User Roles:**

1. **Citizens** - Report issues, track status, upvote others' issues
2. **Staff** - Handle assigned issues, update statuses
3. **Admin** - Manage users, staff, view analytics, edit website content

---

### Q2: Explain your project's folder structure.

**Answer:**

**Server-side Structure:**

```
urbaneye-server-side/
├── config/
│   ├── db.js              # MongoDB connection
│   └── firebase.js        # Firebase Admin SDK
├── controllers/
│   ├── issuesController.js    # Issue CRUD operations
│   ├── usersController.js     # User management
│   ├── paymentsController.js  # Stripe payments
│   ├── staffController.js     # Staff operations
│   └── contentsController.js  # Page builder content
├── middlewares/
│   ├── verifyFirebaseToken.js # JWT verification
│   ├── verifyAdmin.js         # Admin role check
│   └── verifyStaff.js         # Staff role check
├── routes/
│   ├── issues.js
│   ├── users.js
│   ├── payments.js
│   ├── staff.js
│   └── contents.js
├── utilities/
│   ├── responseSend.js        # Standardized API responses
│   └── generateTrackingId.js  # Unique ID generator
└── index.js                   # Entry point
```

**Step-by-step thought process:**

1. প্রথমে `config/` folder এ database এবং Firebase setup রাখলাম - separation of concerns
2. তারপর MVC pattern follow করে `controllers/`, `routes/` আলাদা করলাম
3. `middlewares/` এ authentication/authorization logic রাখলাম - reusability এর জন্য
4. `utilities/` এ common helper functions রাখলাম

---

### Q3: How does your index.js work as the entry point?

**Answer:**

```javascript
// index.js - Your actual code
require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const { connectDB } = require("./config/db");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

async function run() {
  try {
    const collections = await connectDB();
    //Routes
    app.use("/users", require("./routes/users")(collections));
    app.use("/staff", require("./routes/staff")(collections));
    app.use("/issues", require("./routes/issues")(collections));
    app.use("/payments", require("./routes/payments")(collections));
    app.use("/contents", require("./routes/contents")(collections));
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("UrbanEye Server");
});

app.listen(port, () => {
  console.log(`UrbanEye Server listening on port ${port}`);
});
```

**Step-by-step explanation:**

1. **Environment Variables Load:** `require("dotenv").config()` - প্রথমেই .env file থেকে sensitive data load হয়
2. **Express App Create:** `const app = express()` - Express instance তৈরি
3. **Middlewares Setup:**
   - `cors()` - Cross-origin requests allow করে
   - `express.json()` - JSON body parse করে
4. **Database Connect:** `connectDB()` থেকে collections object পাই
5. **Routes Mount:** প্রতিটা route file কে collections pass করি function হিসেবে
6. **Server Start:** `app.listen()` দিয়ে server start

**কেন এভাবে করলাম:**

- Collections একবার connect করে সব routes এ pass করলাম - DRY principle
- Route files function হিসেবে export করে collections inject করলাম - dependency injection pattern

---

### Q4: Explain your database connection setup (db.js).

**Answer:**

```javascript
// config/db.js - Your actual code
const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(process.env.DATABASE_URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbName = "urbanEyeDB";
async function connectDB() {
  const db = client.db(dbName);
  return {
    userCollection: db.collection("users"),
    staffCollection: db.collection("staff"),
    issueCollection: db.collection("issues"),
    paymentCollection: db.collection("payments"),
    upvoteCollection: db.collection("upvotes"),
    contentCollection: db.collection("contents"),
  };
}

module.exports = { client, connectDB };
```

**Step-by-step thought process:**

1. **MongoClient Create:** Connection string environment variable থেকে নেই - security
2. **ServerApi Options:**
   - `strict: true` - strict mode errors handle করে
   - `deprecationErrors: true` - deprecated methods এ warning দেয়
3. **Collections Object Return:** সব collections একটা object এ return করি
4. **Export:** client এবং connectDB দুটোই export করলাম - flexibility

**কেন এভাবে:**

- Single point of database connection - easy to maintain
- Collections object return করে route files এ directly use করা যায়
- Connection pooling MongoDB driver নিজেই handle করে

---

### Q5: What collections do you have and why?

**Answer:**

| Collection | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| `users`    | Citizens এবং Admin store করে                            |
| `staff`    | Staff members আলাদা collection এ (Admin দ্বারা created) |
| `issues`   | All reported issues with timeline                       |
| `payments` | Subscription এবং Boost payment records                  |
| `upvotes`  | Issue upvote tracking (duplicate prevention)            |
| `contents` | Page builder content (banner, about, features sections) |

**কেন Staff আলাদা collection:**

- Admin Firebase থেকে staff create করে custom claims সহ
- Staff এর আলাদা fields আছে (workStatus, assignedIssues)
- Role check এ staff collection আগে check করি

---

### Q6: How does your route file structure work?

**Answer:**

```javascript
// routes/issues.js - Your actual code
const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const verifyStaff = require("../middlewares/verifyStaff");
const issuesController = require("../controllers/issuesController");

module.exports = (collections) => {
  const router = express.Router();

  //----------------CITIZEN ACTIONS------------------
  router.post("/", verifyFireBaseToken, (req, res) =>
    issuesController.createIssue(req, res, collections),
  );

  router.get("/", verifyFireBaseToken, (req, res) =>
    issuesController.getAllIssues(req, res, collections),
  );

  router.get("/my-issues", verifyFireBaseToken, (req, res) =>
    issuesController.getMyIssues(req, res, collections),
  );

  //----------------ADMIN ACTIONS------------------
  router.patch(
    "/:id/assign/admin",
    verifyFireBaseToken,
    verifyAdmin(collections),
    (req, res) => issuesController.assignStaff(req, res, collections),
  );

  //----------------STAFF ACTIONS------------------
  router.get(
    "/staff/assigned-issues",
    verifyFireBaseToken,
    verifyStaff(collections),
    (req, res) =>
      issuesController.getAssignedIssuesStaff(req, res, collections),
  );

  //----------------PUBLIC------------------
  router.get("/public/all-issues", (req, res) =>
    issuesController.getPublicIssues(req, res, collections),
  );

  return router;
};
```

**Step-by-step explanation:**

1. **Module Export Function:** `module.exports = (collections) => {...}` - collections inject করি
2. **Router Create:** `express.Router()` দিয়ে route group করি
3. **Middleware Chain:**
   - `verifyFireBaseToken` - JWT verify
   - `verifyAdmin(collections)` - Admin role check
4. **Controller Call:** Controller function কে (req, res, collections) pass করি
5. **Return Router:** configured router return করি

**কেন এভাবে:**

- Collections dependency injection করে testability বাড়লো
- Middlewares chain করে layered security
- Public routes এ কোন middleware নেই

---

### Q7: Explain the responseSend utility function.

**Answer:**

```javascript
// utilities/responseSend.js
const responseSend = (res, statusCode, message, data = null) => {
  const response = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...(data && { data }),
  };
  return res.status(statusCode).json(response);
};

module.exports = responseSend;
```

**Usage in controllers:**

```javascript
return responseSend(res, 200, "Successfully fetched data", { issues: result });
return responseSend(res, 404, "Issue not found");
return responseSend(res, 403, "Forbidden: Access denied");
```

**কেন এই utility:**

- Consistent API response format
- সব জায়গায় same structure
- Frontend এ error handling easy

---

### Q8: How does your tracking ID generation work?

**Answer:**

```javascript
// utilities/generateTrackingId.js
const generateTrackingId = () => {
  const prefix = "URB";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};
// Result: "URB-LXG2MF8-A3B7"
```

**Step-by-step:**

1. **Prefix:** "URB" - UrbanEye identifier
2. **Timestamp:** Base36 encoding করে shorter করলাম
3. **Random:** 4 character random string collision prevent করে

**কেন এভাবে:**

- Human readable (MongoDB ObjectId এর মতো না)
- Unique and short
- Verbal communication এ বলা যায়

---

## Section 2: MVC Architecture & Backend

### Q9: Explain your MVC architecture implementation.

**Answer:**

**MVC Structure:**

```
Routes (Entry Point) → Controllers (Business Logic) → Models/Collections (Data)
```

**Your Implementation:**

- **Routes:** HTTP endpoints define করে, middlewares chain করে
- **Controllers:** Business logic handle করে, database operations করে
- **Models:** MongoDB collections (schema-less)

**Example Flow - Create Issue:**

```
POST /issues
  → routes/issues.js (verifyToken middleware)
  → issuesController.createIssue()
  → issueCollection.insertOne()
  → Response
```

---

### Q10: How does verifyFirebaseToken middleware work?

**Answer:**

```javascript
// middlewares/verifyFirebaseToken.js - Your actual code
const responseSend = require("../utilities/responseSend");
const admin = require("../config/firebase");

const verifyFireBaseToken = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return responseSend(res, 401, "Unauthorized Access");
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return responseSend(res, 401, "Unauthorized Access");
  }
};
module.exports = verifyFireBaseToken;
```

**Step-by-step:**

1. **Token Extract:** `Authorization: Bearer <token>` header থেকে token নিই
2. **No Token Check:** Token না থাকলে 401 return
3. **Firebase Verify:** `admin.auth().verifyIdToken(token)` দিয়ে verify
4. **Attach Email:** `req.decoded_email` এ user email attach করি
5. **Next Call:** verification success হলে next middleware/controller এ যায়

**কেন req.decoded_email:**

- পরের middlewares এবং controllers এ user identify করতে পারি
- Database query তে email use করি

---

### Q11: How does verifyAdmin middleware work?

**Answer:**

```javascript
// middlewares/verifyAdmin.js - Your actual code
const responseSend = require("../utilities/responseSend");

const verifyAdmin = (collections) => {
  const { userCollection } = collections;
  return async (req, res, next) => {
    try {
      const email = req.decoded_email;
      const query = { email };
      const user = await userCollection.findOne(query);
      if (!user || user?.role !== "admin") {
        return responseSend(res, 403, "Forbidden Access");
      }
      next();
    } catch (error) {
      return responseSend(res, 500, "Server Error: Unable to verify admin");
    }
  };
};
module.exports = verifyAdmin;
```

**Step-by-step:**

1. **Collections Inject:** Higher-order function যেটা collections নেয়
2. **Return Middleware:** Actual middleware function return করে
3. **Get Email:** `req.decoded_email` থেকে email নিই (verifyToken আগে run হয়েছে)
4. **Database Check:** User collection এ role check করি
5. **Role Verify:** role !== "admin" হলে 403 Forbidden

**Middleware Chain:**

```
verifyFireBaseToken → verifyAdmin → Controller
     ↓                    ↓
  email attach       role check
```

---

### Q12: Explain the createIssue controller with step-by-step logic.

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const createIssue = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const issueInfo = req.body;
    issueInfo.isAssignedStaff = false;

    // Step 1: Find the user
    const userEmail = issueInfo.userEmail;
    if (userEmail !== req.decoded_email)
      return responseSend(res, 403, "Forbidden: You cannot edit this issue");

    const user = await userCollection.findOne({ email: userEmail });
    if (!user) return responseSend(res, 404, "User not found");

    // Step 2: Check if user is blocked
    if (user.isBlocked) {
      return responseSend(
        res,
        400,
        "You are blocked. Please contact authorities",
      );
    }

    // Step 3: Check premium limit (non-premium: max 3 issues)
    if (!user.isPremium) {
      const countIssues = await issueCollection.countDocuments({ userEmail });
      if (countIssues >= 3)
        return responseSend(
          res,
          400,
          "Upgrade to premium to report more issues",
        );
    }

    // Step 4: Add metadata
    issueInfo.createdAt = new Date();
    issueInfo.status = "pending";
    issueInfo.priority = "normal";
    issueInfo.trackingId = generateTrackingId();
    issueInfo.timeline = [{ action: "Issue created", at: new Date() }];

    // Step 5: Insert issue
    const result = await issueCollection.insertOne(issueInfo);

    // Step 6: Increment user issue count
    await userCollection.updateOne(
      { email: userEmail },
      { $inc: { countIssues: 1 } },
    );

    return responseSend(res, 201, "Successfully Added Issue", {
      issue: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to create issue");
  }
};
```

**Thought Process:**

1. **Ownership Verify:** Request body email === decoded email (security)
2. **User Existence:** Database এ user আছে কিনা
3. **Block Check:** Blocked user issue create করতে পারবে না
4. **Premium Limit:** Non-premium users max 3 issues
5. **Metadata Add:** Default values set করি
6. **Timeline Init:** Issue history tracking শুরু
7. **Insert & Update:** Issue insert + user count increment

---

### Q13: How do you implement pagination in getAllIssues?

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const getAllIssues = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const searchText = req.query.searchText || "";
    const limit = Number(req.query.limit) || 10;
    const skip = Number(req.query.skip) || 0;
    const status = req.query.status || "";
    const sortBy = req.query.sortBy || "date-desc";

    const user = await userCollection.findOne({ email });
    let query = {};

    // Role-based query
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
```

**Step-by-step:**

1. **Query Parameters Extract:** limit, skip, searchText, status, sortBy
2. **Role-based Query:** Citizen শুধু নিজের issues দেখে, Admin সব দেখে
3. **Search:** `$regex` দিয়ে case-insensitive search
4. **Multiple Status:** `$in` operator দিয়ে comma-separated status handle
5. **Sort:** Switch case দিয়ে dynamic sorting
6. **Count First:** Total count আলাদা query তে - pagination metadata এর জন্য
7. **Paginate:** `.skip().limit()` chain করে pagination
8. **Return Metadata:** hasNext, hasPrev frontend pagination এ help করে

---

### Q14: Explain the MongoDB aggregation for status statistics.

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const getStatusStats = async (req, res, collections) => {
  const { userCollection, issueCollection } = collections;
  try {
    const email = req.decoded_email;
    const user = await userCollection.findOne({ email });

    if (!user) {
      return responseSend(res, 404, "User not found");
    }

    // Role-wise match
    let matchStage = {};
    if (user.role === "citizen") {
      matchStage.userEmail = email;
    }
    // Admin sees all (empty match)

    const pipeline = [
      { $match: matchStage },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $project: { status: "$_id", count: 1 } },
    ];

    const result = await issueCollection.aggregate(pipeline).toArray();
    return responseSend(res, 200, "Successfully fetched data", { result });
  } catch (error) {
    return responseSend(res, 400, "Failed fetched data");
  }
};
```

**Pipeline Breakdown:**

| Stage      | Purpose                     | Example Output                    |
| ---------- | --------------------------- | --------------------------------- |
| `$match`   | Filter documents            | citizen: own issues, admin: all   |
| `$group`   | Group by status, count each | `{ _id: "pending", count: 5 }`    |
| `$project` | Rename fields               | `{ status: "pending", count: 5 }` |

**Output:**

```json
[
  { "status": "pending", "count": 15 },
  { "status": "in-progress", "count": 8 },
  { "status": "resolved", "count": 42 }
]
```

---

### Q15: How does the payment statistics aggregation work with $facet?

**Answer:**

```javascript
// controllers/paymentsController.js - Your actual code
const getPaymentStats = async (req, res, collections) => {
  const { userCollection, paymentCollection } = collections;
  try {
    const email = req.decoded_email;
    const user = await userCollection.findOne({ email });

    let matchStage = {};
    if (user.role === "citizen") {
      matchStage.citizenEmail = email;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          // Date-wise aggregation
          dateWise: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Grand total
          overall: [
            {
              $group: {
                _id: null,
                totalPayments: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ];

    const result = await paymentCollection.aggregate(pipeline).toArray();
    return responseSend(res, 200, "Successfully fetched data", {
      dateWise: result[0].dateWise,
      totalPayments: result[0].overall[0]?.totalPayments || 0,
      totalAmount: result[0].overall[0]?.totalAmount || 0,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed fetched data");
  }
};
```

**কেন $facet:**

- Single query তে multiple aggregations run করা যায়
- Date-wise breakdown এবং grand total একই query তে
- Performance better (একবার database hit)

---

\_---

### Q16: How does the upvote feature prevent duplicate votes?

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const upvoteIssue = async (req, res, collections) => {
  const { issueCollection, upvoteCollection } = collections;
  try {
    const issueId = req.params.id;
    const citizenEmail = req.decoded_email;

    // Step 1: Fetch issue
    const issue = await issueCollection.findOne({ _id: new ObjectId(issueId) });
    if (!issue) return responseSend(res, 404, "Issue not found");

    // Step 2: Prevent self-upvoting
    if (issue.userEmail === citizenEmail) {
      return responseSend(res, 403, "Cannot upvote your own issue");
    }

    // Step 3: Check if already upvoted (stored in issue document)
    if (issue.upvotes && issue.upvotes.includes(citizenEmail)) {
      return responseSend(res, 200, "Already upvoted");
    }

    // Step 4: Insert into upvote collection for tracking
    await upvoteCollection.insertOne({
      issueId: new ObjectId(issueId),
      citizenEmail,
      createdAt: new Date(),
    });

    // Step 5: Update issue - increment count and add email to array
    await issueCollection.updateOne(
      { _id: new ObjectId(issueId) },
      {
        $inc: { totalUpvoteCount: 1 },
        $push: { upvotes: citizenEmail },
      },
    );

    return responseSend(res, 200, "Upvote added successfully", {
      issueId,
      citizenEmail,
      totalUpvoteCount: (issue.totalUpvoteCount || 0) + 1,
    });
  } catch (err) {
    return responseSend(res, 400, "Failed to upvote issue");
  }
};
```

**Thought Process:**

1. **Self-upvote Prevention:** নিজের issue নিজে upvote করতে পারবে না
2. **Duplicate Check:** `upvotes` array তে email আছে কিনা check
3. **Two Collections Update:**
   - `upvoteCollection` - detailed tracking
   - `issueCollection` - quick lookup (upvotes array)
4. **Atomic Operators:** `$inc` এবং `$push` একসাথে ব্যবহার

---

### Q17: How does the issue timeline feature work?

**Answer:**

```javascript
// Timeline is an array that tracks all actions on an issue

// On issue creation:
issueInfo.timeline = [{ action: "Issue created", at: new Date() }];

// On status change (staff):
const updatedIssue = {
  $set: { status: status },
  $push: {
    timeline: { action: `Status changed to ${status}`, at: new Date() }
  }
};

// On staff assignment (admin):
$push: {
  timeline: {
    action: `Staff assigned: ${staffName} (${staffEmail})`,
    at: new Date()
  }
}

// On issue update by user:
$push: {
  timeline: {
    action: "Issue details updated by user",
    at: new Date()
  }
}

// On boost payment:
$push: {
  timeline: {
    action: `Boosted by ${citizenEmail}`,
    at: new Date()
  }
}
```

**কেন Timeline:**

- Complete issue history maintain
- Audit trail for transparency
- Average resolution time calculate করতে পারি

---

### Q18: Explain the admin platform statistics calculation.

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const getAdminPlatformStats = async (req, res, collections) => {
  const { issueCollection, userCollection, staffCollection } = collections;
  try {
    // Step 1: Get all issues
    const allIssues = await issueCollection.find({}).toArray();

    // Step 2: Basic calculations
    const totalIssuesManaged = allIssues.length;
    const totalResolved = allIssues.filter(
      (i) => i.status === "resolved",
    ).length;
    const activeStaffCount = await staffCollection.countDocuments({});
    const totalCitizens = await userCollection.countDocuments({
      role: "citizen",
    });

    // Step 3: Citizen participation rate
    const activeCitizens = await issueCollection
      .aggregate([{ $group: { _id: "$userEmail" } }])
      .toArray();

    const citizenParticipationRate =
      totalCitizens > 0
        ? Math.round((activeCitizens.length / totalCitizens) * 100)
        : 0;

    // Step 4: Platform activity trend (last 6 months)
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

    // Step 5: Calculate resolution rate
    const resolutionRate =
      totalIssuesManaged > 0
        ? Math.round((totalResolved / totalIssuesManaged) * 100)
        : 0;

    // Step 6: Average resolution time
    const resolvedIssuesWithTime = allIssues
      .filter(
        (issue) => issue.status === "resolved" && Array.isArray(issue.timeline),
      )
      .map((issue) => {
        const createdAt = issue.createdAt ? new Date(issue.createdAt) : null;
        const resolvedEvent = issue.timeline.find(
          (t) => t.action === "Status changed to resolved",
        );
        const resolvedAt = resolvedEvent?.at
          ? new Date(resolvedEvent.at)
          : null;
        if (!createdAt || !resolvedAt) return null;
        return { createdAt, resolvedAt };
      })
      .filter(Boolean);

    let avgResolutionTime = 0;
    if (resolvedIssuesWithTime.length > 0) {
      const totalResolutionTime = resolvedIssuesWithTime.reduce(
        (sum, issue) => sum + (issue.resolvedAt - issue.createdAt),
        0,
      );
      avgResolutionTime = Math.round(
        totalResolutionTime /
          resolvedIssuesWithTime.length /
          (1000 * 60 * 60 * 24),
      );
    }

    return responseSend(res, 200, "Admin platform stats fetched successfully", {
      stats: {
        totalIssuesManaged,
        totalResolved,
        activeStaffCount,
        citizenParticipationRate,
        platformActivityTrend,
        resolutionRate,
        avgResolutionTime,
      },
    });
  } catch (error) {
    return responseSend(res, 500, "Failed to fetch admin platform stats");
  }
};
```

**Calculation Logic:**

| Metric              | Formula                                    |
| ------------------- | ------------------------------------------ |
| Resolution Rate     | (resolved / total) × 100                   |
| Participation Rate  | (active citizens / total citizens) × 100   |
| Avg Resolution Time | sum(resolvedAt - createdAt) / count / days |

---

### Q19: How does staff assignment work?

**Answer:**

```javascript
// controllers/issuesController.js - Your actual code
const assignStaff = async (req, res, collections) => {
  const { issueCollection, staffCollection } = collections;
  try {
    const id = req.params.id;
    const { assignedStaff } = req.body;
    const { staffId, staffName, staffEmail, staffPhone } = assignedStaff;

    // Step 1: Update issue with staff details
    const issueQuery = { _id: new ObjectId(id) };
    const updatedIssue = {
      $set: {
        assignedStaff: { staffId, staffName, staffEmail, staffPhone },
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
      updatedIssue,
    );

    // Step 2: Update staff workStatus
    const staffQuery = { _id: new ObjectId(staffId) };
    const updatedStaff = { $set: { workStatus: "assigned" } };
    const staffResult = await staffCollection.updateOne(
      staffQuery,
      updatedStaff,
    );

    return responseSend(res, 201, "Successfully updated", {
      issueResult,
      staffResult,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to update information");
  }
};
```

**Two Collections Updated:**

1. `issueCollection` - assignedStaff object add, timeline update
2. `staffCollection` - workStatus change to "assigned"

---

### Q20: How does the Stripe payment integration work?

**Answer:**

```javascript
// controllers/paymentsController.js - Your actual code
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

// Step 1: Create checkout session
const createCheckoutSession = async (req, res, collections) => {
  try {
    const paymentInfo = req.body;
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: 100000, // $1000 in cents
            product_data: { name: paymentInfo.paymentName },
          },
          quantity: 1,
        },
      ],
      customer_email: paymentInfo.userEmail,
      mode: "payment",
      metadata: {
        paymentName: paymentInfo.paymentName,
        citizenEmail: paymentInfo.userEmail,
        paymentMethod: "Card/Stripe",
      },
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-profile`,
    });
    return responseSend(res, 200, "success", { url: session.url });
  } catch (error) {
    return responseSend(res, 400, "Failed to create checkout session");
  }
};

// Step 2: Handle payment success
const paymentSuccess = async (req, res, collections) => {
  const { userCollection, paymentCollection } = collections;
  try {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const transactionId = session.payment_intent;

    // Prevent duplicate entry
    const isPaymentExist = await paymentCollection.findOne({ transactionId });
    if (isPaymentExist) {
      return responseSend(res, 200, "Already paid for this subscription", {
        transactionId: isPaymentExist.transactionId,
      });
    }

    if (session.payment_status === "paid") {
      // Update user to premium
      const email = session.metadata.citizenEmail;
      await userCollection.updateOne({ email }, { $set: { isPremium: true } });

      // Save payment record
      const payment = {
        paymentType: "subscription",
        transactionId,
        paymentMethod: session.metadata.paymentMethod,
        paymentName: session.metadata.paymentName,
        paymentStatus: session.payment_status,
        currency: session.currency,
        citizenEmail: session.customer_email,
        paidAt: new Date(),
        amount: session.amount_total / 100,
      };
      await paymentCollection.insertOne(payment);

      return responseSend(res, 200, "User updated with payment information", {
        payment,
        transactionId,
      });
    }
  } catch (error) {
    return responseSend(res, 500, "Failed to Update user Info");
  }
};
```

**Payment Flow:**

1. Frontend calls `/payments/create-session` → Gets Stripe URL
2. User redirects to Stripe hosted checkout
3. After payment, Stripe redirects to success_url with session_id
4. Backend retrieves session, verifies payment, updates user

---

## Section 3: Page Builder Feature

### Q21: What is the Page Builder feature and why did you build it?

**Answer:**

Page Builder allows Admin to **edit homepage content without touching code**.

**Problem Solved:**

- Non-technical admins can update website content
- No deployment needed for content changes
- Real-time preview of changes

**Editable Sections:**

- Banner Section
- About Section
- Globe Section
- Features Section
- How It Works Section

---

### Q22: Explain the Page Builder file structure.

**Answer:**

```
src/
├── context/
│   ├── EditModeContext.jsx     # Context creation
│   └── EditModeProvider.jsx    # Context provider with state
├── hooks/
│   └── page builder/
│       └── useEditorMode.js    # Custom hook to consume context
├── components/
│   └── page builder/
│       ├── EditableWrapper.jsx    # Wraps editable sections
│       ├── EditorTopBar.jsx       # Toggle edit mode button
│       ├── SectionEditor.jsx      # Floating editor panel
│       ├── BannerEditor.jsx       # Banner specific form
│       ├── AboutSectionEditor.jsx
│       ├── GlobeSectionEditor.jsx
│       ├── FeaturesSectionEditor.jsx
│       └── HowItWorksSectionEditor.jsx
```

**Flow:**

```
EditModeProvider (context)
    ↓
Home.jsx (uses EditableWrapper)
    ↓
EditableWrapper (shows edit button in edit mode)
    ↓
SectionEditor (floating panel, renders specific editor)
    ↓
BannerEditor/AboutEditor etc. (form fields)
```

---

### Q23: How does EditModeContext and Provider work?

**Answer:**

```javascript
// context/EditModeContext.jsx - Your actual code
import { createContext } from "react";
export const EditModeContext = createContext(null);

// context/EditModeProvider.jsx - Your actual code
import { useState } from "react";
import { EditModeContext } from "./EditModeContext";

export const EditModeProvider = ({ children }) => {
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  const editorValue = {
    editMode,
    setEditMode,
    activeSection,
    setActiveSection,
  };

  return (
    <EditModeContext.Provider value={editorValue}>
      {children}
    </EditModeContext.Provider>
  );
};
```

**State Explanation:**

| State           | Type        | Purpose                                            |
| --------------- | ----------- | -------------------------------------------------- |
| `editMode`      | boolean     | Edit mode on/off                                   |
| `activeSection` | string/null | Currently editing section (e.g., "banner-section") |

---

### Q24: How does the useEditorMode custom hook work?

**Answer:**

```javascript
// hooks/page builder/useEditorMode.js - Your actual code
import { useContext } from "react";
import { EditModeContext } from "../../context/EditModeContext";

const useEditorMode = () => {
  const editorInfo = useContext(EditModeContext);
  return editorInfo;
};
export default useEditorMode;
```

**Usage:**

```javascript
const { editMode, setEditMode, activeSection, setActiveSection } =
  useEditorMode();
```

**কেন Custom Hook:**

- Context consume করা simplified
- Reusable across components
- একবার import করলেই সব state পাওয়া যায়

---

### Q25: How does EditableWrapper conditionally render?

**Answer:**

```javascript
// components/page builder/EditableWrapper.jsx - Your actual code
import { Edit } from "lucide-react";
import useEditorMode from "../../hooks/page builder/useEditorMode";

const EditableWrapper = ({ sectionKey, children }) => {
  const { editMode, setActiveSection } = useEditorMode();

  // If edit mode is off, render children WITHOUT any wrapper
  if (!editMode) return children;

  // Special handling for globe section
  const isGlobeSection = sectionKey === "globe-section";

  if (isGlobeSection) {
    // Use Fragment to avoid DOM interference
    return (
      <>
        <button
          onClick={() => setActiveSection(sectionKey)}
          className="absolute top-4 right-4 bg-primary text-white p-2 rounded-full"
          style={{ position: "absolute" }}
        >
          <Edit size={16} />
        </button>
        {children}
      </>
    );
  }

  // Regular sections get a dashed border wrapper
  return (
    <div className="relative border-2 border-dashed border-primary group">
      <button
        onClick={() => setActiveSection(sectionKey)}
        className="absolute -bottom-3 right-2 bg-primary text-white p-1 rounded-full"
      >
        <Edit />
      </button>
      {children}
    </div>
  );
};

export default EditableWrapper;
```

**Step-by-step:**

1. **Edit Mode Check:** `if (!editMode) return children` - No wrapper when edit mode off
2. **Globe Special Case:** Globe section has absolute positioning, so Fragment use করি
3. **Regular Sections:** Dashed border wrapper with edit button
4. **Edit Button Click:** `setActiveSection(sectionKey)` - opens editor panel

**কেন Globe আলাদা:**

- Globe section এ 3D effects আছে with absolute positioning
- Extra div wrapper layout break করে দেয়
- Fragment use করে DOM structure unchanged থাকে

---

### Q26: How does SectionEditor know which editor to render?

**Answer:**

```javascript
// components/page builder/SectionEditor.jsx - Your actual code
import useEditorMode from "../../hooks/page builder/useEditorMode";
import AboutSectionEditor from "./AboutSectionEditor";
import BannerEditor from "./BannerEditor";
import GlobeSectionEditor from "./GlobeSectionEditor";
import FeaturesSectionEditor from "./FeaturesSectionEditor";
import HowItWorksSectionEditor from "./HowItWorksSectionEditor";
import { CircleCheckBig, X } from "lucide-react";

const SectionEditor = () => {
  const { activeSection, setActiveSection } = useEditorMode();

  if (!activeSection) return null;

  const handleSave = () => {
    // Get the appropriate save function based on active section
    if (
      activeSection === "banner-section" &&
      window.bannerSectionData?.handleSave
    ) {
      window.bannerSectionData.handleSave();
    } else if (
      activeSection === "about-section" &&
      window.aboutSectionData?.handleSave
    ) {
      window.aboutSectionData.handleSave();
    } else if (
      activeSection === "globe-section" &&
      window.globeSectionData?.handleSave
    ) {
      window.globeSectionData.handleSave();
    } else if (
      activeSection === "features-section" &&
      window.featuresSectionData?.handleSave
    ) {
      window.featuresSectionData.handleSave();
    } else if (
      activeSection === "how-it-works-section" &&
      window.howItWorksSectionData?.handleSave
    ) {
      window.howItWorksSectionData.handleSave();
    }
  };

  return (
    <div className="fixed md:right-6 top-24 md:w-96 w-[80%] right-10 bg-white shadow-xl rounded-xl z-[9999] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-bold capitalize">Editing: {activeSection}</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="bg-green-500 text-white p-2 rounded-full"
          >
            <CircleCheckBig size={20} />
          </button>
          <button
            onClick={() => setActiveSection(null)}
            className="bg-red-500 text-white p-2 rounded-full"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeSection === "banner-section" && <BannerEditor />}
        {activeSection === "about-section" && <AboutSectionEditor />}
        {activeSection === "globe-section" && <GlobeSectionEditor />}
        {activeSection === "features-section" && <FeaturesSectionEditor />}
        {activeSection === "how-it-works-section" && (
          <HowItWorksSectionEditor />
        )}
      </div>
    </div>
  );
};
export default SectionEditor;
```

**Key Points:**

1. **Conditional Return:** `if (!activeSection) return null` - No panel when nothing selected
2. **Dynamic Rendering:** activeSection value অনুযায়ী specific editor render
3. **Window Object Pattern:** Save button window থেকে handleSave function call করে
4. **Z-index:** `z-[9999]` ensures panel stays above all content

---

### Q27: Why do you use window object for save handlers?

**Answer:**

**Challenge:**

- SectionEditor এ Save button আছে
- কিন্তু save logic প্রতিটা editor component এ different
- Props drilling বা complex state lifting এড়াতে চাই

**Solution - Window Object Pattern:**

```javascript
// In GlobeSection.jsx (the actual section component)
useEffect(() => {
  window.globeSectionData = {
    globeData,
    updateContent,
    updateStyle,
    handleSave,
  };
}, [globeData]);

// In SectionEditor.jsx
const handleSave = () => {
  if (
    activeSection === "globe-section" &&
    window.globeSectionData?.handleSave
  ) {
    window.globeSectionData.handleSave();
  }
};
```

**কেন এই Pattern:**

- Loose coupling between components
- No prop drilling needed
- Each section manages its own state and save logic
- SectionEditor just triggers the save

**Trade-off:**

- Not a "pure React" pattern
- Need to cleanup in useEffect return
- Works well for this specific use case

---

### Q28: How does BannerEditor get data from window object?

**Answer:**

```javascript
// components/page builder/BannerEditor.jsx - Your actual code
import { useState, useEffect } from "react";

const BannerEditor = () => {
  const [activeTab, setActiveTab] = useState("content");
  const [bannerData, setBannerData] = useState(null);
  const [updateContent, setUpdateContent] = useState(null);
  const [updateStyle, setUpdateStyle] = useState(null);
  const [handleSave, setHandleSave] = useState(null);

  useEffect(() => {
    const checkForBannerData = () => {
      if (window.bannerSectionData) {
        setBannerData(window.bannerSectionData.bannerData);
        setUpdateContent(() => window.bannerSectionData.updateContent);
        setUpdateStyle(() => window.bannerSectionData.updateStyle);
        setHandleSave(() => window.bannerSectionData.handleSave);
      }
    };

    checkForBannerData();
    // Poll for data (in case component mounts before data is available)
    const interval = setInterval(checkForBannerData, 100);
    return () => clearInterval(interval);
  }, []);

  if (!bannerData || !updateContent || !updateStyle || !handleSave) {
    return <div>Loading editor...</div>;
  }

  // Form fields use bannerData and updateContent/updateStyle
  return (
    <div className="space-y-4">
      <input
        value={bannerData.content.mainHeading}
        onChange={(e) => updateContent("mainHeading", e.target.value)}
      />
      {/* ... more fields */}
    </div>
  );
};
```

**Step-by-step:**

1. **Initial State:** null values for all data
2. **Polling Pattern:** `setInterval` দিয়ে window object check করি
3. **Why Polling:** Component mount হতে পারে data available হওয়ার আগে
4. **Loading State:** Data না থাকলে "Loading editor..." show করি
5. **Two-way Binding:** Input changes → updateContent() → Window data updates

---

### Q29: How is section content stored in MongoDB?

**Answer:**

```javascript
// controllers/contentsController.js - Your actual code
// Each section has this structure:
{
  _id: ObjectId("..."),
  type: "about-section",  // Unique identifier
  content: {
    mainHeading: "URBANi is a citizen-focused platform...",
    highlightText: "citizen-focused platform",
    paragraph1: "...",
    paragraph2: "..."
  },
  styles: {
    mainHeading: {
      fontSize: "text-4xl md:text-5xl",
      fontWeight: "font-extrabold",
      textAlign: "text-right",
      color: ""
    },
    highlightText: {
      color: "text-secondary"
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Why Separate Content and Styles:**

- Content changes frequently (text)
- Styles change less often
- Easier to build editor UI
- Future: could add more style options without changing content

---

### Q30: What happens if a section doesn't exist in database?

**Answer:**

```javascript
// controllers/contentsController.js - Your actual code
const getAboutSection = async (req, res, collections) => {
  const { contentCollection } = collections;
  try {
    const aboutSection = await contentCollection.findOne({
      type: "about-section",
    });

    if (!aboutSection) {
      // Create default section if it doesn't exist
      const defaultAboutSection = {
        type: "about-section",
        content: {
          mainHeading:
            "URBANi is a citizen-focused platform that lets residents",
          highlightText: "citizen-focused platform",
          paragraph1: "report public issues directly to local authorities...",
          paragraph2: "Our mission is simple: empower communities...",
          strongText: "empower communities",
        },
        styles: {
          mainHeading: {
            fontSize: "text-4xl md:text-5xl",
            fontWeight: "font-extrabold",
            textAlign: "text-right",
          },
          // ... more default styles
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await contentCollection.insertOne(defaultAboutSection);
      return responseSend(res, 200, defaultAboutSection);
    }

    responseSend(res, 200, aboutSection);
  } catch (error) {
    responseSend(res, 500, "Failed to fetch about section");
  }
};
```

**Self-healing Pattern:**

- First request creates default content
- App works out-of-the-box without manual DB setup
- Admin can then modify defaults

## Section 4: Authentication & Authorization

### Q31: How did you implement the stale token fix for staff login?

**Answer:**

```javascript
// context/AuthProvider.jsx - Your actual code
const refreshUserToken = async () => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    // Force token refresh (true parameter)
    await currentUser.getIdToken(true);
    // Force the user state update
    setUser({ ...currentUser });
  }
};

// pages/auth/SignIn.jsx - Your actual code
const handleSignIn = async (data) => {
  try {
    Swal.fire({
      title: "Logging your account...",
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const result = await signInUser(data.email, data.password);

    // CRITICAL: Force refresh to get new token with staff role
    await refreshUserToken();
    setUser(result?.user);

    // Refetch role with fresh token
    const roleResult = await refetchRole();

    // Navigate based on role
    if (roleResult?.data === "admin" || roleResult?.data === "staff") {
      navigate("/dashboard");
    } else {
      navigate(location?.state || "/");
    }
  } catch (err) {
    // Error handling...
  }
};
```

**Problem Explained:**

1. Admin creates staff account with Firebase custom claims
2. Staff logs in - but initial token doesn't have new claims yet
3. Backend rejects stale token → User gets logged out immediately

**Solution Flow:**

```
Login → refreshUserToken() → Fresh token with claims → refetchRole() → Navigate
```

---

### Q32: How does useAxiosSecure hook attach tokens to requests?

**Answer:**

```javascript
// hooks/auth & role/useAxiosSecure.js - Your actual code
import axios from "axios";
import { useEffect } from "react";
import useAuth from "./useAuth";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

const axiosSecure = axios.create({
  baseURL: `https://urbaneye-server-side.vercel.app`,
});

const useAxiosSecure = () => {
  const { user, signOutUser, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // REQUEST INTERCEPTOR - Attach token
    const requestInterceptors = axiosSecure.interceptors.request.use(
      (config) => {
        const token = user?.accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // RESPONSE INTERCEPTOR - Handle auth errors
    const responseInterceptors = axiosSecure.interceptors.response.use(
      (response) => response,
      (error) => {
        const statusCode = error.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          signOutUser().then(() => {
            setUser(null);
            navigate("/signin");
            toast.success("Successfully Logged Out");
          });
        }
        return Promise.reject(error);
      },
    );

    // Cleanup interceptors on unmount
    return () => {
      axiosSecure.interceptors.request.eject(requestInterceptors);
      axiosSecure.interceptors.response.eject(responseInterceptors);
    };
  }, [user, navigate, signOutUser, setUser]);

  return axiosSecure;
};

export default useAxiosSecure;
```

**Two Interceptors:**

| Type     | Purpose                                     |
| -------- | ------------------------------------------- |
| Request  | Attaches `Bearer ${token}` to every request |
| Response | Catches 401/403 and auto-logout             |

---

### Q33: How does useRole hook fetch and cache user role?

**Answer:**

```javascript
// hooks/auth & role/useRole.js - Your actual code
import { useQuery } from "@tanstack/react-query";
import useAuth from "./useAuth";
import useAxiosSecure from "./useAxiosSecure";

const useRole = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();

  const {
    data: role = "citizen",
    isLoading: roleLoading,
    isError: roleError,
    refetch: refetchRole,
  } = useQuery({
    queryKey: ["user-role", user?.email],
    enabled: !!user?.email, // Only fetch when user exists
    queryFn: async () => {
      const { data } = await axiosSecure.get(`/users/${user.email}/role`);
      return data?.role || "citizen";
    },
  });

  return { role, roleLoading, roleError, refetchRole };
};

export default useRole;
```

**Key Points:**

1. **Enabled Option:** `!!user?.email` - Query only runs when user is logged in
2. **Default Value:** `role = "citizen"` - Fallback if no data
3. **Query Key:** `["user-role", user?.email]` - Cache per user
4. **refetchRole:** Used after login to get fresh role

---

### Q34: How do protected routes work on the frontend?

**Answer:**

```javascript
// routes/Router.jsx - Your actual code (simplified)
const router = createBrowserRouter([
  // Public routes
  {
    path: "/all-issues",
    element: <AllIssues />,
  },

  // Private routes (logged in users)
  {
    path: "/issue/:id",
    element: (
      <PrivateRoutes>
        <IssueDetails />
      </PrivateRoutes>
    ),
  },

  // Dashboard with nested role-based routes
  {
    path: "dashboard",
    element: (
      <PrivateRoutes>
        <DashboardLayout />
      </PrivateRoutes>
    ),
    children: [
      // Admin only routes
      {
        path: "all-reported-issues",
        element: (
          <AdminRoutes>
            <AllReportedIssues />
          </AdminRoutes>
        ),
      },
      // Staff only routes
      {
        path: "assigned-issues",
        element: (
          <StaffRoutes>
            <AssignedIssues />
          </StaffRoutes>
        ),
      },
      // Citizen only routes
      {
        path: "my-reported-issues",
        element: (
          <CitizenRoutes>
            <ReportedIssues />
          </CitizenRoutes>
        ),
      },
    ],
  },
]);
```

**Route Guard Components:**

```javascript
// PrivateRoutes - Checks if logged in
const PrivateRoutes = ({ children }) => {
  const { user, userLoading } = useAuth();
  if (userLoading) return <Loading />;
  if (user) return children;
  return <Navigate to="/signin" />;
};

// AdminRoutes - Checks if admin role
const AdminRoutes = ({ children }) => {
  const { role, roleLoading } = useRole();
  if (roleLoading) return <Loading />;
  if (role === "admin") return children;
  return <Navigate to="/" />;
};
```

---

## Section 5: Framer Motion & Animations

### Q35: What Framer Motion animation variants did you use in AllIssues page?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code

// Container animation - Stagger children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Each child animates 0.1s after previous
    },
  },
};

// Individual card animation
const cardVariants = {
  hidden: { opacity: 0, y: 20 }, // Start invisible, 20px below
  visible: { opacity: 1, y: 0 }, // End visible, original position
};

// Sidebar animation - Slide from right
const sidebarVariants = {
  hidden: { opacity: 0, x: 50 }, // Start 50px to the right
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: 0.2 },
  },
};
```

**Usage:**

```jsx
<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
>
  {processedIssues.map((issue, index) => (
    <motion.div
      key={issue._id}
      variants={cardVariants}
      layout
      transition={{
        type: "spring",
        stiffness: 300,
        delay: index * 0.1,
      }}
    >
      <IssueCard issue={issue} />
    </motion.div>
  ))}
</motion.div>
```

---

### Q36: How does AnimatePresence work for list updates?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
<AnimatePresence mode="wait">
  <motion.div
    key={`${debouncedSearch}-${selectedStatus}-${sortBy}-${currentPage}`}
    variants={containerVariants}
    initial="hidden"
    animate="visible"
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  >
    {/* Issue cards */}
  </motion.div>
</AnimatePresence>
```

**Key Points:**

1. **AnimatePresence:** Enables exit animations when components unmount
2. **mode="wait":** Waits for exit animation before new content enters
3. **Unique Key:** Changes trigger remount and animation
   - Key includes: search, status, sort, page
   - Any filter change → Full grid re-animates

**Why This Key Pattern:**

```javascript
key={`${debouncedSearch}-${selectedStatus}-${sortBy}-${currentPage}`}
```

- Each filter combination = unique key
- Key change = component remounts
- Remount = entry animation plays again

---

### Q37: How did you implement scroll-triggered animations?

**Answer:**

```javascript
// components/home/globe/GlobeSection.jsx - Your actual code
<motion.h2
  initial={{ y: 40, opacity: 0 }}
  whileInView={{ y: 0, opacity: 1 }}  // Triggers when in viewport
  viewport={{ once: true, amount: 0.3 }}  // 30% visible = trigger
  transition={{ duration: 0.8, ease: "easeOut" }}
  className={getClassName("mainTitle")}
>
  {globeData.content.mainTitle}
</motion.h2>

<motion.p
  initial={{ y: 40, opacity: 0 }}
  whileInView={{ y: 0, opacity: 1 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}  // Slight delay
  className={getClassName("description")}
>
  {globeData.content.description}
</motion.p>
```

**Viewport Options:**

| Option   | Value | Purpose                        |
| -------- | ----- | ------------------------------ |
| `once`   | true  | Animate only first time        |
| `amount` | 0.3   | 30% of element must be visible |

**Staggered Delays:**

- Heading: delay 0
- Description: delay 0.1s
- CTA button: delay 0.2s
- Creates cascading effect

---

### Q38: How do you use motion.div for sequential animations?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Quick Stats Section
// Each stat has increasing delay

{/* Total Issues - delay 0.2 */}
<motion.div
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.2, duration: 0.6 }}
  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
>
  <span>Total Issues</span>
  <span>{quickStats.total}</span>
</motion.div>

{/* Pending - delay 0.4 */}
<motion.div
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.4, duration: 0.6 }}
  className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
>
  <span>Pending</span>
  <span>{quickStats.pending}</span>
</motion.div>

{/* In Progress - delay 0.6 */}
<motion.div
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ delay: 0.6, duration: 0.6 }}
  ...
>

{/* And so on with 0.8, 1.0, 1.2, 1.4, 1.6 delays */}
```

**Effect:** Stats slide in from right one after another.

---

### Q39: What is the layout prop in Framer Motion?

**Answer:**

```javascript
<motion.div
  key={issue._id}
  variants={cardVariants}
  layout // This prop
  transition={{ type: "spring", stiffness: 300 }}
>
  <IssueCard issue={issue} />
</motion.div>
```

**Purpose:**

- `layout` prop animates position changes automatically
- When items reorder (sort/filter), they smoothly move to new positions
- No manual position tracking needed

**Example Effect:**

1. User changes sort from "date-desc" to "priority-high"
2. Cards don't just pop to new positions
3. They smoothly slide/shuffle to new locations

---

## Section 6: Frontend Features (AllIssues Page)

### Q40: How does debounced search work?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const [searchText, setSearchText] = useState("");
const [debouncedSearch, setDebouncedSearch] = useState(searchText);

// Wait 500ms after user stops typing
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedSearch(searchText);
  }, 500);
  return () => clearTimeout(handler); // Cancel if user types again
}, [searchText]);

// API call uses debouncedSearch, not searchText
useEffect(() => {
  const issuesData = async () => {
    const { data } = await axiosInstance.get(
      `/issues/public/all-issues?searchText=${debouncedSearch}...`,
    );
    setIssues(data?.issue);
  };
  issuesData();
}, [debouncedSearch, currentPage, filters]);

// Reset page when search changes
useEffect(() => {
  setCurrentPage(0);
}, [debouncedSearch]);
```

**Flow:**

```
User types → searchText updates immediately → 500ms wait → debouncedSearch updates → API call
   ↓                                              ↓
Input shows typing                          Actual fetch happens
```

**Why Debounce:**

- Prevents API call on every keystroke
- Reduces server load
- Better UX (no flashing results)

---

### Q41: How does the Quick Stats calculate page-wise statistics?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const quickStats = useMemo(() => {
  // Total comes from API response (all issues count)
  const total = totalIssue;

  // These are calculated from CURRENT PAGE issues only
  const pending = issues.filter((issue) => issue.status === "pending").length;
  const inProgress = issues.filter(
    (issue) => issue.status === "in-progress",
  ).length;
  const working = issues.filter((issue) => issue.status === "working").length;
  const resolved = issues.filter((issue) => issue.status === "resolved").length;
  const rejected = issues.filter((issue) => issue.status === "rejected").length;
  const closed = issues.filter((issue) => issue.status === "closed").length;

  const completed = resolved + closed;

  return {
    total, // From API (all issues)
    pending, // Current page only
    inProgress, // Current page only
    working, // Current page only
    resolved, // Current page only
    rejected, // Current page only
    closed, // Current page only
    completed,
    resolutionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
  };
}, [issues, totalIssue]);
```

**Important Distinction:**

- `total` = All issues in database (from API)
- Other stats = Current page's 9 issues only
- `resolutionRate` uses total for accuracy

---

### Q42: How does frontend sorting work with useMemo?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const processedIssues = useMemo(() => {
  let sortedIssues = [...issues]; // Don't mutate original

  sortedIssues.sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "date-desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "priority-high": {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (
          (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
        );
      }
      case "priority-low": {
        const priorityOrderLow = { high: 3, medium: 2, low: 1 };
        return (
          (priorityOrderLow[a.priority] || 0) -
          (priorityOrderLow[b.priority] || 0)
        );
      }
      case "upvotes-desc":
        return (b.totalUpvoteCount || 0) - (a.totalUpvoteCount || 0);
      case "upvotes-asc":
        return (a.totalUpvoteCount || 0) - (b.totalUpvoteCount || 0);
      case "title-asc":
        return (a.title || "").localeCompare(b.title || "");
      case "title-desc":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  return sortedIssues;
}, [issues, sortBy]);
```

**Why useMemo:**

- Sorting is expensive operation
- Only recalculates when `issues` or `sortBy` changes
- Not on every render

**Priority Sorting Logic:**

```javascript
const priorityOrder = { high: 3, medium: 2, low: 1 };
// For high-to-low: b - a (descending)
// For low-to-high: a - b (ascending)
```

---

### Q43: How does the upvote UI update work?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const handleUpdateUI = (id) => {
  setIssues((prevIssues) => {
    return prevIssues.map((issue) => {
      if (issue._id !== id) {
        return issue;
      }
      const newIssue = {
        ...issue,
        totalUpvoteCount: (issue.totalUpvoteCount || 0) + 1,
      };
      return newIssue;
    });
  });
};

// Passed to IssueCard
<IssueCard issue={issue} onUpvoteSuccess={handleUpdateUI} />;
```

**Flow:**

1. User clicks upvote in IssueCard
2. IssueCard calls API to save upvote
3. On success, calls `onUpvoteSuccess(issueId)`
4. Parent updates state → UI reflects +1 immediately

**Why Optimistic Update:**

- Instant feedback to user
- No need to refetch entire list
- Better UX

---

### Q44: How does pagination work in AllIssues?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const [totalIssue, setTotalIssue] = useState(0);
const [totalPage, setTotalPage] = useState(0);
const [currentPage, setCurrentPage] = useState(0);
const limit = 9;

// API call with skip/limit
const { data } = await axiosInstance.get(
  `/issues/public/all-issues?limit=${limit}&skip=${currentPage * limit}...`,
);
setIssues(data?.issue);
setTotalIssue(data?.total);
const page = Math.ceil(data?.total / limit);
setTotalPage(page);

// Pagination UI
<div className="flex justify-center gap-2 mt-10">
  {/* Previous button - only if not first page */}
  {currentPage > 0 && (
    <button onClick={() => setCurrentPage(currentPage - 1)}>Prev</button>
  )}

  {/* Page numbers */}
  {[...Array(totalPage).keys()].map((_, i) => (
    <button
      onClick={() => setCurrentPage(i)}
      className={`btn ${i === currentPage ? "" : "btn-outline"}`}
      key={i}
    >
      {i + 1}
    </button>
  ))}

  {/* Next button - only if not last page */}
  {currentPage < totalPage - 1 && (
    <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>
  )}
</div>;
```

**Calculation:**

- `skip = currentPage * limit` (e.g., page 2 = skip 18)
- `totalPage = Math.ceil(totalIssue / limit)`

---

### Q45: How does status filter work?

**Answer:**

```javascript
// pages/all issues/AllIssues.jsx - Your actual code
const [filters, setFilters] = useState({
  status: [],
  priority: [],
});
const [selectedStatus, setSelectedStatus] = useState("all");

const handleStatusFilterChange = (status) => {
  setSelectedStatus(status);
  if (status === "all") {
    setFilters((prev) => ({ ...prev, status: [] }));
  } else {
    setFilters((prev) => ({ ...prev, status: [status] }));
  }
};

// API call builds query string
const statusQuery = filters.status.length ? filters.status.join(",") : "";

const { data } = await axiosInstance.get(
  `/issues/public/all-issues?status=${statusQuery}...`,
);
```

**Filter Dropdown:**

```jsx
<select
  value={selectedStatus}
  onChange={(e) => handleStatusFilterChange(e.target.value)}
>
  <option value="all">All Status</option>
  <option value="pending">Pending</option>
  <option value="in-progress">In Progress</option>
  <option value="working">Working</option>
  <option value="resolved">Resolved</option>
  <option value="rejected">Rejected</option>
  <option value="closed">Closed</option>
</select>
```

---

## Section 7: Lazy Loading & Performance

### Q46: How did you implement lazy loading in the router?

**Answer:**

```javascript
// routes/Router.jsx - Your actual code
import { lazy, Suspense } from "react";
import Loading from "../components/loading/Loading";

// Lazy load all pages
const Home = lazy(() => import("../pages/home/Home"));
const SignIn = lazy(() => import("../pages/auth/SignIn"));
const SignUp = lazy(() => import("../pages/auth/SignUp"));
const Dashboard = lazy(() => import("../pages/dashboard/dashboard/Dashboard"));
const AllIssues = lazy(() => import("../pages/all issues/AllIssues"));
// ... more lazy imports

// Usage with Suspense
{
  path: "/all-issues",
  element: (
    <Suspense fallback={<Loading />}>
      <RouteTitle title="All Issues">
        <AllIssues />
      </RouteTitle>
    </Suspense>
  ),
}
```

**Benefits:**

- Initial bundle size reduced
- Pages load on-demand
- Faster first paint

---

### Q47: How did you implement section-level lazy loading in Home page?

**Answer:**

```javascript
// pages/home/Home.jsx - Your actual code
import { lazy, Suspense } from "react";

// Lazy load heavy sections
const FeaturesSection = lazy(
  () => import("../../components/home/feature/FeatureSection"),
);
const CitizenFeedback = lazy(
  () => import("../../components/home/feedback/CitizenFeedback"),
);
const HowItWorks = lazy(
  () => import("../../components/home/how it works/HowItWorks"),
);
const GlobeSection = lazy(
  () => import("../../components/home/globe/GlobeSection"),
);
const CityPulseDashboard = lazy(
  () => import("../../components/home/city pulse/CityPulseDashboard"),
);

// Custom skeleton loader
const SectionLoader = ({ height = "h-96", className = "" }) => (
  <div
    className={`w-full ${height} bg-gray-100/50 animate-pulse rounded-3xl ${className}`}
  ></div>
);

const Home = () => {
  return (
    <div>
      {/* Heavy sections with Suspense */}
      <section>
        <Suspense fallback={<SectionLoader height="h-[800px]" />}>
          <CityPulseDashboard />
        </Suspense>
      </section>

      <section>
        <Suspense fallback={<SectionLoader height="h-[500px]" />}>
          <GlobeSection />
        </Suspense>
      </section>

      <section>
        <Suspense fallback={<SectionLoader height="h-[600px]" />}>
          <FeaturesSection />
        </Suspense>
      </section>
    </div>
  );
};
```

**Why Section-level:**

- Globe section is heavy (3D rendering)
- City Pulse has charts
- Load them only when user scrolls

---

### Q48: What is the SectionLoader component purpose?

**Answer:**

```javascript
// pages/home/Home.jsx - Your actual code
const SectionLoader = ({ height = "h-96", className = "" }) => (
  <div
    className={`w-full ${height} bg-gray-100/50 animate-pulse rounded-3xl ${className}`}
  ></div>
);

// Usage with different heights
<Suspense fallback={<SectionLoader height="h-[500px]" />}>
  <AboutSection />
</Suspense>

<Suspense fallback={<SectionLoader height="h-[800px]" />}>
  <CityPulseDashboard />
</Suspense>

<Suspense fallback={<SectionLoader height="h-full" className="bg-white/5" />}>
  <GlobeSection />
</Suspense>
```

**Purpose:**

- Skeleton placeholder while section loads
- `animate-pulse` gives loading effect
- Height matches actual section to prevent layout shift
- Custom className for dark backgrounds

---

## Section 8: Additional Theoretical Questions (Q49-65)

### Q49: Why did you choose TanStack Query over Redux for state management?

**Answer:**

| Feature            | TanStack Query  | Redux            |
| ------------------ | --------------- | ---------------- |
| Server State       | ✅ Built for it | ❌ Not focused   |
| Caching            | ✅ Automatic    | ⚠️ Manual setup  |
| Background Refetch | ✅ Built-in     | ❌ Manual        |
| Boilerplate        | ✅ Minimal      | ❌ Lots of setup |
| DevTools           | ✅ Excellent    | ✅ Good          |

**My Use Case:**

- Most state is server data (issues, users, payments)
- Need caching for role data
- Need background refetch for fresh data
- Redux would be overkill

---

### Q50: How would you improve the Page Builder if you had more time?

**Answer:**

1. **Undo/Redo System**
   - Store state history array
   - Ctrl+Z / Ctrl+Y shortcuts

2. **Rich Text Editor**
   - Replace textarea with WYSIWYG
   - Bold, italic, links support

3. **Image Upload**
   - Allow changing section images
   - Integrate with Cloudinary

4. **Preview Mode**
   - See changes without affecting live site
   - "Publish" button to go live

5. **Drag-and-Drop Sections**
   - Reorder homepage sections
   - Add/remove sections dynamically

---

### Q51: What security measures did you implement?

**Answer:**

| Layer             | Security Measure                        |
| ----------------- | --------------------------------------- |
| **Frontend**      | Protected routes, role-based UI         |
| **API**           | JWT verification on every request       |
| **Authorization** | verifyAdmin, verifyStaff middlewares    |
| **Ownership**     | Check issue.userEmail === decoded_email |
| **Blocked Users** | Prevent issue creation                  |
| **Payments**      | Stripe handles all sensitive data       |
| **Environment**   | .env for secrets, never committed       |

---

### Q52: Why check staff collection before user collection for role?

**Answer:**

```javascript
// Backend: getUserRole
const staff = await staffCollection.findOne({ staffEmail: email });
if (staff) {
  return { role: "staff" }; // Return immediately
}

// Only then check user collection
const user = await userCollection.findOne({ email });
return { role: user?.role || "citizen" };
```

**Reason:**

- Staff accounts are created separately by Admin
- Staff email might also exist in user collection (as citizen)
- Staff role should take precedence
- If we checked user first, staff would get "citizen" role

---

### Q53: How does the globe image rotate animation work?

**Answer:**

```css
/* In CSS */
.slow-rotate {
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

```jsx
// GlobeSection.jsx
<img src={globe} alt="" className="w-full slow-rotate" />
```

**Properties:**

- 30s duration - slow, smooth rotation
- `linear` - constant speed (no easing)
- `infinite` - never stops

---

### Q54: How does the getClassName helper function work in GlobeSection?

**Answer:**

```javascript
// components/home/globe/GlobeSection.jsx - Your actual code
const getClassName = (element) => {
  const style = globeData.styles[element];
  if (!style) return "";

  return [
    style.fontSize,
    style.fontWeight,
    style.textAlign,
    style.color,
    style.padding,
    style.margin,
  ]
    .filter(Boolean) // Remove undefined/empty values
    .join(" "); // Join with spaces
};

// Usage
<h2 className={getClassName("mainTitle")}>{globeData.content.mainTitle}</h2>;
```

**Example:**

```javascript
// If styles = { fontSize: "text-4xl", fontWeight: "font-bold", color: "text-white" }
// Result: "text-4xl font-bold text-white"
```

---

### Q55: How does the updateContent function work in section components?

**Answer:**

```javascript
// components/home/globe/GlobeSection.jsx - Your actual code
const updateContent = (field, value) => {
  setGlobeData((prev) => ({
    ...prev,
    content: {
      ...prev.content,
      [field]: value, // Dynamic key
    },
  }));
};

// Usage from editor
updateContent("mainTitle", "New Title");
updateContent("description", "New description text");
```

**Immutable Update Pattern:**

1. Spread previous state
2. Spread previous content
3. Override specific field with new value

---

### Q56: How does the updateStyle function handle nested objects?

**Answer:**

```javascript
// components/home/globe/GlobeSection.jsx - Your actual code
const updateStyle = (element, property, value) => {
  setGlobeData((prev) => ({
    ...prev,
    styles: {
      ...prev.styles,
      [element]: {
        ...prev.styles[element],
        [property]: value,
      },
    },
  }));
};

// Usage
updateStyle("mainTitle", "fontSize", "text-5xl");
updateStyle("mainTitle", "color", "text-white");
```

**Three Levels of Spreading:**

1. `...prev` - Keep other state
2. `...prev.styles` - Keep other style elements
3. `...prev.styles[element]` - Keep other properties of this element

---

### Q57: What happens when edit mode is toggled off while editing?

**Answer:**

When admin clicks close or toggles edit mode off:

```javascript
// SectionEditor.jsx
<button onClick={() => setActiveSection(null)}>Close</button>

// Or EditorTopBar.jsx
<button onClick={() => setEditMode(false)}>Exit Edit Mode</button>
```

**Effects:**

1. `activeSection` becomes null → SectionEditor returns null
2. `editMode` becomes false → EditableWrapper returns children only
3. Dashed borders disappear
4. Edit buttons disappear
5. **Unsaved changes are lost** (no auto-save implemented)

---

### Q58: How do you handle form state in BannerEditor?

**Answer:**

```javascript
// BannerEditor uses controlled components
// State comes from window object (parent section)

<input
  type="text"
  value={bannerData.content.mainHeading}
  onChange={(e) => updateContent("mainHeading", e.target.value)}
  className="w-full p-2 border rounded"
/>

<select
  value={bannerData.styles.mainHeading.fontSize}
  onChange={(e) => updateStyle('mainHeading', 'fontSize', e.target.value)}
>
  {fontSizeOptions.map(option => (
    <option key={option.value} value={option.value}>{option.label}</option>
  ))}
</select>
```

**Two-way Data Flow:**

```
BannerEditor Input → updateContent() → Window Object → BannerSection State → UI Updates
```

---

### Q59: Why use Swal (SweetAlert2) instead of native alerts?

**Answer:**

```javascript
// SignIn.jsx - Your actual code
Swal.fire({
  title: "Logging your account...",
  text: "Please wait",
  allowOutsideClick: false,
  showConfirmButton: false,
  didOpen: () => Swal.showLoading(),
});

// Success
await Swal.fire({
  position: "center",
  icon: "success",
  title: "Logged In Successfully. Welcome on board",
  showConfirmButton: false,
  timer: 1500,
});
```

**Benefits:**

- Beautiful, customizable design
- Loading spinner built-in
- Auto-close with timer
- Async/await support
- Consistent UX across app

---

### Q60: How does the demo login feature work?

**Answer:**

```javascript
// pages/auth/SignIn.jsx - Your actual code
const credentials = {
  admin: { email: "admin@urbani.com", password: "adMin123#" },
  staff: { email: "jon-staff@urbani.com", password: "stAff123#" },
  citizen: { email: "kamal@gmail.com", password: "Abc1230#" },
};

const [loginRole, setLoginRole] = useState(null);

// Fill credentials button
<button
  onClick={() => {
    if (loginRole && credentials[loginRole]) {
      setValue("email", credentials[loginRole].email);
      setValue("password", credentials[loginRole].password);
    }
  }}
>
  Fill Credentials
</button>;
```

**Flow:**

1. User selects role from dropdown
2. Clicks "Fill Credentials"
3. React Hook Form's `setValue` fills the inputs
4. User clicks "Sign In"

---

### Q61: What is RouteTitle component and why use it?

**Answer:**

```javascript
// routes/RouteTitle.jsx
const RouteTitle = ({ title, children }) => {
  useEffect(() => {
    document.title = `${title} | UrbanEye`;
  }, [title]);

  return children;
};

// Usage
<RouteTitle title="All Issues">
  <AllIssues />
</RouteTitle>;
```

**Purpose:**

- Dynamic page titles for SEO
- Better browser tab experience
- User knows which page they're on

---

### Q62: How does the CSS pattern work for section titles?

**Answer:**

```css
/* index.css */
.section-title {
  @apply flex items-center gap-2 text-sm font-semibold uppercase tracking-wider;
}
```

```jsx
// Usage
<p className="section-title text-primary">
  <LuNewspaper />
  Issues Dashboard
</p>
```

**Creates consistent styling:**

- Flexbox for icon + text alignment
- Uppercase letters
- Wider letter spacing
- Small font size

---

### Q63: What is the difference between useAxios and useAxiosSecure?

**Answer:**

| Hook             | Token         | Use Case            |
| ---------------- | ------------- | ------------------- |
| `useAxios`       | ❌ No token   | Public endpoints    |
| `useAxiosSecure` | ✅ With token | Protected endpoints |

```javascript
// Public data - no auth needed
const axiosInstance = useAxios();
await axiosInstance.get("/issues/public/all-issues");

// Protected data - needs auth
const axiosSecure = useAxiosSecure();
await axiosSecure.get("/issues/my-issues");
```

---

### Q64: How do you handle loading states consistently?

**Answer:**

```javascript
// Component level
if (loading) return <Loading />;

// TanStack Query level
const { isLoading } = useQuery(...);
if (isLoading) return <Loading />;

// Route level with Suspense
<Suspense fallback={<Loading />}>
  <Component />
</Suspense>

// Auth level
const { userLoading } = useAuth();
if (userLoading) return <Loading />;
```

**Loading component provides consistent UX across all scenarios.**

---

### Q65: What would you do differently if rebuilding this project?

**Answer:**

1. **TypeScript** - Better type safety, fewer runtime errors
2. **React Hook Form everywhere** - More consistent form handling
3. **Zod validation** - Schema-based validation
4. **Unit tests from start** - Jest + React Testing Library
5. **E2E tests** - Cypress for critical flows
6. **Better error boundaries** - Graceful error handling
7. **Proper logging** - Production error tracking
8. **Database indexes** - For better query performance
9. **WebSocket** - Real-time notifications
10. **PWA** - Offline capability

## Section 9: Behavioral Questions (Q66-85)

### Q66: What was the most challenging part of this project?

**Answer:**

The **Staff Login Stale Token Issue** was the most challenging:

**Problem:**

- Admin creates staff account via Firebase Custom Claims
- Staff logs in immediately after
- Token verification fails → User gets kicked out

**Debugging Process:**

1. Checked server logs - saw 401 errors
2. Checked Firebase token - claims were missing
3. Researched - found Firebase doesn't update claims immediately
4. Solution: Force token refresh after login

```javascript
// The fix
await refreshUserToken(); // Forces getIdToken(true)
```

**Lesson Learned:** Always test multi-role systems thoroughly.

---

### Q67: How did you handle the tight project deadline?

**Answer:**

1. **Prioritization**
   - Core features first (auth, CRUD operations)
   - Nice-to-have features later (page builder)

2. **Incremental Development**
   - Small commits
   - Test after each feature

3. **Reusable Components**
   - Created IssueCard once, used everywhere
   - Common styling in CSS classes

4. **Smart Shortcuts**
   - Used Tailwind for rapid styling
   - Used SweetAlert for consistent alerts

---

### Q68: Describe a bug you fixed and your debugging process.

**Answer:**

**Bug:** Pagination broke after search/filter

**Symptoms:**

- Page 3 shows no results
- Clicking page 1 still shows empty

**Debugging:**

```javascript
// Before (buggy)
useEffect(() => {
  fetchData();
}, [currentPage, filters]); // Missing debouncedSearch dependency

useEffect(() => {
  setCurrentPage(0); // This wasn't resetting, causing bug
}, [searchText]); // Wrong dependency
```

**Fix:**

```javascript
// After (fixed)
useEffect(() => {
  fetchData();
}, [currentPage, filters, debouncedSearch]); // Added debouncedSearch

useEffect(() => {
  setCurrentPage(0);
}, [debouncedSearch]); // Changed to debouncedSearch
```

**Root Cause:** Search changed, but page number didn't reset properly.

---

### Q69: How did you decide on the tech stack?

**Answer:**

| Choice             | Reason                                |
| ------------------ | ------------------------------------- |
| **React**          | Team familiarity, ecosystem           |
| **TailwindCSS**    | Rapid development, consistency        |
| **MongoDB**        | Flexible schema for timeline/metadata |
| **Firebase Auth**  | Easy social login, secure             |
| **Express.js**     | Simple, flexible backend              |
| **TanStack Query** | Server state management               |
| **Stripe**         | Industry standard payments            |

---

### Q70: How would you explain this project to a non-technical person?

**Answer:**

"Imagine you see a pothole in your neighborhood road. Instead of calling different offices, you open UrbanEye app, take a photo, mark the location, and report it.

The city staff receives your report, assigns it to a worker, and you can track when it gets fixed - like tracking a package delivery.

If many neighbors report the same pothole, it gets prioritized. You can also pay a small fee to boost important issues."

---

### Q71: What did you learn from this project?

**Answer:**

1. **Technical:**
   - MongoDB aggregation pipelines
   - Stripe payment integration
   - Firebase custom claims
   - React code splitting

2. **Soft Skills:**
   - Breaking down large features
   - Debugging systematically
   - Writing maintainable code

3. **Architecture:**
   - MVC pattern benefits
   - Context API vs Redux decisions
   - When to use custom hooks

---

### Q72: How did you handle team collaboration?

**Answer:**

(If team project)

- Git branching strategy (feature branches)
- PR reviews before merge
- Shared component library
- Regular sync meetings

(If solo project)

- Treated it like a team project
- Meaningful commit messages
- Clean code for future me
- Documentation in README

---

### Q73: What would you add if you had 2 more weeks?

**Answer:**

1. **Real-time Notifications**
   - Socket.io for instant updates
   - Push notifications for mobile

2. **Analytics Dashboard**
   - Charts for issue trends
   - Heat map of problem areas

3. **Mobile App**
   - React Native version
   - Offline support

4. **AI Features**
   - Auto-categorize issues from photos
   - Duplicate detection

---

### Q74: How do you handle feedback on your code?

**Answer:**

1. **Listen First** - Understand the feedback fully
2. **Ask Questions** - Clarify if needed
3. **Don't Take Personally** - Code is not me
4. **Implement & Learn** - Use it as learning opportunity
5. **Thank the Reviewer** - Feedback makes code better

**Example:** I initially used window object pattern. If someone suggested event emitters instead, I would research, understand trade-offs, and refactor if better.

---

### Q75: Describe a time you had to learn something quickly.

**Answer:**

**Situation:** Needed Stripe payment integration for first time

**Action:**

1. Read official Stripe documentation
2. Watched 2 YouTube tutorials
3. Tested in sandbox mode
4. Implemented step by step

**Result:**

- Working payment in 1 day
- Learned metadata usage
- Understood webhooks (didn't use, but know)

**Key:** Don't just copy code - understand WHY it works.

---

### Q76: How do you prioritize tasks when overwhelmed?

**Answer:**

1. **List Everything** - Write all tasks down
2. **Categorize:**
   - Critical (app broken without it)
   - Important (core feature)
   - Nice-to-have (enhancement)
3. **Estimate Time** - Rough hours for each
4. **Do Critical First** - Then important
5. **Communicate** - If can't finish, say early

---

### Q77: What's your strongest technical skill?

**Answer:**

**Frontend State Management & Data Flow**

I understand:

- When to lift state up vs use context
- How TanStack Query manages server state
- Re-render optimization with useMemo/useCallback
- Component composition for reusability

_Example:_ The page builder needed complex state sharing. I designed the context + window pattern to balance simplicity and functionality.

---

### Q78: What's your weakest area you're improving?

**Answer:**

**Testing**

Currently:

- I rely mostly on manual testing
- Some console.log debugging

Improving:

- Learning Jest for unit tests
- Learning React Testing Library
- Want to add Cypress for E2E

_Plan:_ Add tests to this project as learning exercise.

---

### Q79: How do you stay updated with web development?

**Answer:**

1. **Daily:**
   - Twitter/X (web dev accounts)
   - Dev.to articles

2. **Weekly:**
   - YouTube tutorials
   - Documentation for tools I use

3. **Projects:**
   - Try new tech in side projects first
   - Apply to main projects after comfort

---

### Q80: Why should we hire you?

**Answer:**

1. **I Ship** - This project proves I can complete features end-to-end
2. **I Learn Fast** - Learned Stripe, aggregation, page builder on my own
3. **I Care** - Clean code, good UX, documentation
4. **I Communicate** - Can explain technical concepts clearly
5. **I Grow** - Always looking to improve

---

## Section 10: Additional Technical Questions (Q81-110)

### Q81: How does the IssueCard component handle different states?

**Answer:**

```javascript
// components/common/card/issue card/IssueCard.jsx
const IssueCard = ({ issue, onUpvoteSuccess }) => {
  // Status badge color mapping
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      "in-progress": "bg-blue-100 text-blue-800",
      working: "bg-cyan-100 text-cyan-800",
      resolved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Priority indicator
  const getPriorityColor = (priority) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  return (
    <div className="card bg-white shadow-lg rounded-2xl overflow-hidden">
      {/* Image */}
      <img
        src={issue.imageUrl}
        alt={issue.title}
        className="h-48 w-full object-cover"
      />

      {/* Status Badge */}
      <span
        className={`${getStatusColor(issue.status)} px-2 py-1 rounded-full text-xs`}
      >
        {issue.status}
      </span>

      {/* Priority Dot */}
      <span
        className={`${getPriorityColor(issue.priority)} w-3 h-3 rounded-full`}
      ></span>

      {/* Upvote Button */}
      <button onClick={() => handleUpvote(issue._id)}>
        👍 {issue.totalUpvoteCount || 0}
      </button>
    </div>
  );
};
```

---

### Q82: How did you implement the boost payment feature?

**Answer:**

```javascript
// controllers/paymentsController.js
const createBoostCheckout = async (req, res, collections) => {
  const { issueId, citizenEmail, boostAmount } = req.body;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "USD",
          unit_amount: boostAmount * 100, // $5, $10, $20
          product_data: { name: `Boost Issue #${issueId}` },
        },
        quantity: 1,
      },
    ],
    metadata: {
      paymentType: "boost",
      issueId,
      citizenEmail,
      boostAmount,
    },
    success_url: `${process.env.SITE_DOMAIN}/boost-payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_DOMAIN}/issue/${issueId}`,
  });

  return responseSend(res, 200, "success", { url: session.url });
};

// On success - update issue priority
const boostPaymentSuccess = async (req, res, collections) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    await issueCollection.updateOne(
      { _id: new ObjectId(session.metadata.issueId) },
      {
        $set: {
          priority: "high",
          isBoosted: true,
          boostedAt: new Date(),
        },
        $push: {
          timeline: {
            action: `Issue boosted by ${session.metadata.citizenEmail}`,
            at: new Date(),
          },
        },
      },
    );
  }
};
```

---

### Q83: How does the staff performance stats work?

**Answer:**

```javascript
// controllers/issuesController.js
const getStaffPerformanceStats = async (req, res, collections) => {
  const staffEmail = req.params.email;
  const { issueCollection } = collections;

  // Get all issues assigned to this staff
  const assignedIssues = await issueCollection
    .find({
      "assignedStaff.staffEmail": staffEmail,
    })
    .toArray();

  // Calculate stats
  const totalAssigned = assignedIssues.length;
  const resolved = assignedIssues.filter((i) => i.status === "resolved").length;
  const inProgress = assignedIssues.filter(
    (i) => i.status === "in-progress",
  ).length;
  const pending = assignedIssues.filter((i) => i.status === "pending").length;

  // Resolution rate
  const resolutionRate =
    totalAssigned > 0 ? Math.round((resolved / totalAssigned) * 100) : 0;

  // Average resolution time
  let avgResolutionTime = 0;
  const resolvedWithTime = assignedIssues
    .filter((i) => i.status === "resolved" && i.timeline)
    .map((i) => {
      const created = new Date(i.staffAssignedAt);
      const resolvedAt = i.timeline.find((t) =>
        t.action.includes("resolved"),
      )?.at;
      return resolvedAt ? new Date(resolvedAt) - created : null;
    })
    .filter(Boolean);

  if (resolvedWithTime.length > 0) {
    avgResolutionTime = Math.round(
      resolvedWithTime.reduce((a, b) => a + b, 0) /
        resolvedWithTime.length /
        (1000 * 60 * 60 * 24), // Convert to days
    );
  }

  return responseSend(res, 200, "Success", {
    totalAssigned,
    resolved,
    inProgress,
    pending,
    resolutionRate,
    avgResolutionTime,
  });
};
```

---

### Q84: How does the citizen blocking feature work?

**Answer:**

```javascript
// When citizen is blocked (by admin):
await userCollection.updateOne(
  { email: citizenEmail },
  { $set: { isBlocked: true, blockedAt: new Date(), blockedReason: reason } },
);

// In createIssue controller - check if blocked:
const createIssue = async (req, res, collections) => {
  const user = await userCollection.findOne({ email: userEmail });

  if (user.isBlocked) {
    return responseSend(
      res,
      400,
      "You are blocked. Please contact authorities",
    );
  }

  // Continue with issue creation...
};

// Blocked users can still:
// - View public issues
// - View their own issues
// - But CANNOT create new issues
```

---

### Q85: How does the CityPulseDashboard fetch real-time analytics?

**Answer:**

```javascript
// Backend: /issues/api/analytics/city-pulse
const getPulseStats = async (req, res, collections) => {
  const { issueCollection } = collections;

  const stats = await issueCollection
    .aggregate([
      {
        $facet: {
          // Category breakdown
          byCategory: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
          // Daily trend (last 7 days)
          dailyTrend: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: 1 } },
          ],
          // Location hotspots
          hotspots: [
            { $group: { _id: "$location", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ])
    .toArray();

  return responseSend(res, 200, "Success", stats[0]);
};
```

---

### Q86: How did you handle form validation?

**Answer:**

```javascript
// Using React Hook Form with custom validation
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm();

<input
  {...register("email", {
    required: "Email is required",
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Invalid email address",
    },
  })}
/>;
{
  errors.email && <p className="text-red-500">{errors.email.message}</p>;
}

<input
  {...register("password", {
    required: "Password is required",
    minLength: {
      value: 8,
      message: "Password must be at least 8 characters",
    },
    pattern: {
      value:
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      message:
        "Must contain uppercase, lowercase, number, and special character",
    },
  })}
/>;
```

---

### Q87: How does the timeline visualization work?

**Answer:**

```jsx
// Timeline component
const Timeline = ({ timeline }) => {
  return (
    <div className="space-y-4">
      {timeline.map((event, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Dot */}
          <div className="w-3 h-3 bg-primary rounded-full mt-1.5" />

          {/* Content */}
          <div className="flex-1">
            <p className="font-medium">{event.action}</p>
            <p className="text-sm text-gray-500">
              {new Date(event.at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Example output:
// • Issue created
//   Jan 15, 2026, 10:30 AM
// • Staff assigned: John (john@example.com)
//   Jan 16, 2026, 2:15 PM
// • Status changed to in-progress
//   Jan 17, 2026, 9:00 AM
```

---

### Q88: How does the image upload work for issues?

**Answer:**

```javascript
// Using imgbb for image hosting
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await axios.post(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    formData,
  );

  setImageUrl(data.data.url);
};

// Store URL in MongoDB, not the actual image
const issueDoc = {
  title: "Pothole on Main St",
  imageUrl: "https://i.ibb.co/xxxxx/pothole.jpg", // From imgbb
  // ...other fields
};
```

---

### Q89: How does the Google login work?

**Answer:**

```javascript
// components/socialLogin/GoogleLogin.jsx
const GoogleLogin = () => {
  const { googleSignIn, setUser, setUserLoading } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      Swal.fire({
        title: "Signing in...",
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const result = await googleSignIn();
      setUser(result.user);

      // Check if user exists in DB, if not create
      await axios.post("/users", {
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        role: "citizen",
        createdAt: new Date(),
      });

      Swal.fire({
        icon: "success",
        title: "Welcome!",
        timer: 1500,
      });
      navigate("/");
    } catch (error) {
      Swal.fire({ icon: "error", title: error.message });
    }
  };

  return (
    <button onClick={handleGoogleSignIn} className="btn btn-outline w-full">
      <FcGoogle /> Continue with Google
    </button>
  );
};
```

---

### Q90: How do you prevent duplicate issue submissions?

**Answer:**

**Frontend Prevention:**

```javascript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return; // Prevent double-click
  setIsSubmitting(true);

  try {
    await createIssue(data);
    // Success handling
  } finally {
    setIsSubmitting(false);
  }
};

<button disabled={isSubmitting}>
  {isSubmitting ? "Submitting..." : "Submit Issue"}
</button>;
```

**Backend Prevention:**

```javascript
// Could add debounce/rate limiting
// Or check for similar recent issues
const recentDuplicate = await issueCollection.findOne({
  userEmail,
  title: { $regex: title, $options: "i" },
  createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
});

if (recentDuplicate) {
  return responseSend(res, 400, "Similar issue submitted recently");
}
```

---

### Q91: How does the Dark Mode toggle work in the page builder?

**Answer:**

```javascript
// BannerEditor.jsx - Style options
const colorOptions = [
  { value: "text-white", label: "White" },
  { value: "text-gray-100", label: "Light Gray" },
  { value: "text-gray-300", label: "Gray 300" },
  { value: "text-indigo-400", label: "Indigo" },
  { value: "text-purple-400", label: "Purple" },
  { value: "text-primary", label: "Primary Blue" },
  { value: "text-secondary", label: "Secondary Dark" },
];

// Admin selects colors - automatically applies via TailwindCSS classes
// No JS dark mode toggle - pure CSS approach
```

---

### Q92: How does ErrorComponent show user-friendly errors?

**Answer:**

```jsx
// components/error/error page/ErrorComponent.jsx
const ErrorComponent = ({ message = "Something went wrong", retry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <img src={errorImage} alt="Error" className="w-48 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-800">Oops!</h2>
        <p className="text-gray-600">{message}</p>
        {retry && (
          <button onClick={retry} className="btn btn-primary">
            Try Again
          </button>
        )}
        <Link to="/" className="block text-primary underline">
          Go back home
        </Link>
      </div>
    </div>
  );
};

// Usage
if (error)
  return <ErrorComponent message="Failed to load issues" retry={refetch} />;
```

---

### Q93: How did you implement the search bar with clear button?

**Answer:**

```jsx
// AllIssues.jsx - Search input
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
  <input
    type="text"
    placeholder="Search by issue name or location..."
    value={searchText}
    onChange={(e) => setSearchText(e.target.value)}
    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg"
  />
  {searchText && (
    <button
      onClick={() => setSearchText("")}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      ✕
    </button>
  )}
</div>
```

**UX Considerations:**

- Search icon on left (visual cue)
- Clear button only shows when text exists
- Hover effect on clear button

---

### Q94: How does SubHeading component ensure consistency?

**Answer:**

```jsx
// components/common/heading/SubHeading.jsx
const SubHeading = ({ label, className = "" }) => {
  return (
    <p className={`text-gray-600 text-base md:text-lg leading-relaxed ${className}`}>
      {label}
    </p>
  );
};

// Usage across pages
<SubHeading label="Browse issues reported by citizens." />
<SubHeading label="Track your reported issues." className="text-center" />
<SubHeading label="Manage staff and citizens." className="max-w-2xl" />
```

**Benefits:**

- Consistent styling everywhere
- Easy to change globally
- Allows per-instance customization

---

### Q95: How does the loading skeleton work for cards?

**Answer:**

```jsx
// components/loading/CardSkeleton.jsx
const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="h-48 bg-gray-200" />

      {/* Content placeholders */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded w-3/4" />

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
        </div>

        {/* Footer */}
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};

// Usage - Show 9 skeletons while loading
if (loading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
```

---

### Q96: How does the $in operator work in MongoDB filter?

**Answer:**

```javascript
// Backend: Filter by multiple statuses
const statusQuery = req.query.status; // "pending,in-progress,working"

if (statusQuery) {
  const statusArray = statusQuery.split(","); // ["pending", "in-progress", "working"]
  query.status = { $in: statusArray };
}

// MongoDB translates to:
// { status: { $in: ["pending", "in-progress", "working"] } }
// Returns issues where status is ANY of these values
```

**Use Case:** Checkbox filters where user selects multiple options.

---

### Q97: How does $regex search work?

**Answer:**

```javascript
// Backend: Case-insensitive search across multiple fields
if (searchText) {
  query.$or = [
    { title: { $regex: searchText, $options: "i" } },
    { location: { $regex: searchText, $options: "i" } },
    { category: { $regex: searchText, $options: "i" } },
    { description: { $regex: searchText, $options: "i" } },
  ];
}

// Options:
// "i" = case insensitive
// "m" = multiline
// "s" = dotall (. matches newlines)

// Example: searchText = "pothole"
// Matches: "Pothole on Main St", "Big POTHOLE", "There's a pothole here"
```

---

### Q98: How does localeCompare work for title sorting?

**Answer:**

```javascript
case "title-asc":
  return (a.title || "").localeCompare(b.title || "");
case "title-desc":
  return (b.title || "").localeCompare(a.title || "");
```

**Why localeCompare:**

- Handles international characters properly
- "Åland" sorts after "Z" in English, but after "A" in Swedish
- Case-insensitive by default
- Returns -1, 0, or 1 for sorting

**Fallback:** `|| ""` prevents error if title is undefined.

---

### Q99: What is the purpose of useMemo vs useCallback?

**Answer:**

```javascript
// useMemo - Memoize a COMPUTED VALUE
const processedIssues = useMemo(() => {
  return issues.sort(...); // Expensive computation
}, [issues, sortBy]);

// useCallback - Memoize a FUNCTION REFERENCE
const handleUpvote = useCallback((id) => {
  // Function logic
}, [dependencies]);
```

| Hook          | Returns  | Use Case                  |
| ------------- | -------- | ------------------------- |
| `useMemo`     | Value    | Expensive calculations    |
| `useCallback` | Function | Pass to memoized children |

---

### Q100: How does the checklist pattern work in issue update?

**Answer:**

```javascript
// When staff updates issue, they use a form with multiple fields
const handleStatusChange = async () => {
  const updates = {
    status: newStatus,
    // Add timeline entry automatically
  };

  // Optimistic update
  setLocalStatus(newStatus);

  try {
    await axiosSecure.patch(`/issues/${issueId}/staff/change-status`, updates);
    toast.success("Status updated!");
  } catch (error) {
    // Rollback on error
    setLocalStatus(previousStatus);
    toast.error("Failed to update");
  }
};
```

---

## Section 11: Final Questions (Q101-150)

### Q101-150: Quick Fire Round

| #   | Question                       | Brief Answer                                     |
| --- | ------------------------------ | ------------------------------------------------ |
| 101 | What's SSR?                    | Server-Side Rendering - HTML generated on server |
| 102 | What's CSR?                    | Client-Side Rendering - JS renders in browser    |
| 103 | What's hydration?              | Making server-rendered HTML interactive          |
| 104 | JWT vs Session?                | JWT: stateless, Session: server stored           |
| 105 | SQL vs NoSQL?                  | SQL: structured, NoSQL: flexible schema          |
| 106 | REST vs GraphQL?               | REST: multiple endpoints, GraphQL: one endpoint  |
| 107 | What's CORS?                   | Cross-Origin Resource Sharing policy             |
| 108 | What's middleware?             | Code that runs between request and response      |
| 109 | What's indexing?               | DB optimization for faster queries               |
| 110 | What's sharding?               | Distributing data across multiple servers        |
| 111 | useEffect cleanup?             | Return function that runs on unmount             |
| 112 | Why key in React?              | Helps React identify which items changed         |
| 113 | What's reconciliation?         | React's diffing algorithm for updates            |
| 114 | What's virtual DOM?            | In-memory representation of real DOM             |
| 115 | What's code splitting?         | Loading code on demand to reduce bundle          |
| 116 | What's tree shaking?           | Removing unused code from bundle                 |
| 117 | What's minification?           | Reducing code size by removing whitespace        |
| 118 | What's gzip?                   | Compression for network transfer                 |
| 119 | What's CDN?                    | Content Delivery Network - caches globally       |
| 120 | What's environment variable?   | Config outside code (API keys, etc.)             |
| 121 | .env vs .env.local?            | .env: committed, .env.local: git ignored         |
| 122 | npm vs yarn?                   | Both package managers, yarn has workspaces       |
| 123 | devDependencies?               | Only needed during development                   |
| 124 | What's package-lock.json?      | Locks dependency versions                        |
| 125 | What's semantic versioning?    | MAJOR.MINOR.PATCH (breaking.feature.fix)         |
| 126 | What's ESLint?                 | JavaScript linter for code quality               |
| 127 | What's Prettier?               | Code formatter for consistency                   |
| 128 | What's Husky?                  | Git hooks for pre-commit checks                  |
| 129 | What's CI/CD?                  | Continuous Integration/Deployment                |
| 130 | What's Docker?                 | Container platform for consistent environments   |
| 131 | What's Vercel?                 | Frontend deployment platform                     |
| 132 | What's Firebase?               | Google's BaaS (Auth, DB, Hosting)                |
| 133 | What's MongoDB Atlas?          | Cloud MongoDB hosting                            |
| 134 | What's Mongoose?               | MongoDB ODM for Node.js                          |
| 135 | Why not use Mongoose here?     | Used native driver for simplicity                |
| 136 | What's ObjectId?               | MongoDB's unique document identifier             |
| 137 | What's aggregation?            | MongoDB's data processing pipeline               |
| 138 | What's $lookup?                | MongoDB's join operation                         |
| 139 | What's $unwind?                | Deconstructs array into documents                |
| 140 | What's projection?             | Selecting specific fields to return              |
| 141 | What's React Router v7?        | Latest with data loading APIs                    |
| 142 | What's loader in React Router? | Fetches data before rendering                    |
| 143 | What's errorElement?           | Component for route errors                       |
| 144 | What's outlet?                 | Renders child routes                             |
| 145 | What's useNavigate?            | Programmatic navigation hook                     |
| 146 | What's useLocation?            | Access current location/state                    |
| 147 | What's useParams?              | Access URL parameters                            |
| 148 | What's useSearchParams?        | Access query string params                       |
| 149 | What's lazy loading?           | Load component when needed                       |
| 150 | What's Suspense?               | Shows fallback while loading                     |

---

## 📝 Quick Reference Cheat Sheet

### Key Technologies Used

- **Frontend:** React 18, TailwindCSS, TanStack Query v5, React Router v7, Framer Motion
- **Backend:** Node.js, Express.js, MongoDB Native Driver
- **Auth:** Firebase Authentication
- **Payments:** Stripe Checkout
- **Deployment:** Vercel (frontend & backend)

### Key Patterns Used

1. **MVC Pattern** - Routes → Controllers → Collections
2. **Custom Hooks** - useAuth, useRole, useAxiosSecure, useEditorMode
3. **Context API** - Auth state, Edit mode state
4. **Window Object Pattern** - Page builder cross-component communication
5. **Debouncing** - Search input delay
6. **Lazy Loading** - React.lazy + Suspense
7. **Optimistic Updates** - Upvote UI update

### Common Interview Topics to Review

- [ ] User authentication flow
- [ ] Role-based access control
- [ ] CRUD operations with MongoDB
- [ ] Stripe payment integration
- [ ] React component lifecycle
- [ ] State management decisions
- [ ] Performance optimization
- [ ] Error handling strategies

---

**🎉 Congratulations on completing all 150 questions!**

_This document covers your entire UrbanEye project. Review these answers before your interview and practice explaining them in your own words._
