const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const usersController = require("../controllers/usersController");

module.exports = (collections) => {
  const router = express.Router();

  // User registration and profile
  router.post("/", (req, res) => usersController.createUser(req, res, collections));
  router.get("/:email", verifyFireBaseToken, (req, res) => usersController.getUserInfo(req, res, collections));
  router.put("/my-profile", verifyFireBaseToken, (req, res) => usersController.updateUserProfile(req, res, collections));
  router.get("/:email/role", verifyFireBaseToken, (req, res) => usersController.getUserRole(req, res, collections));

  //----------------ADMIN ACTIONS------------------
  router.get("/", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    usersController.getAllUsers(req, res, collections)
  );
  router.patch("/:id/status", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    usersController.updateUserStatus(req, res, collections)
  );
  router.get("/latest/registered-users", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    usersController.getLatestUsers(req, res, collections)
  );

  // Profile statistics
  router.get("/:email/stats", verifyFireBaseToken, (req, res) => 
    usersController.getUserStats(req, res, collections)
  );

  return router;
};
