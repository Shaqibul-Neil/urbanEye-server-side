const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const verifyAdmin = require("../middlewares/verifyAdmin");
const staffController = require("../controllers/staffController");

module.exports = (collections) => {
  const router = express.Router();

  //----------------ADMIN ACTIONS------------------
  router.post("/", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    staffController.createStaff(req, res, collections)
  );
  router.get("/", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    staffController.getAllStaff(req, res, collections)
  );
  router.delete("/:id/admin", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    staffController.deleteStaff(req, res, collections)
  );
  router.patch("/:id/admin", verifyFireBaseToken, verifyAdmin(collections), (req, res) => 
    staffController.updateStaff(req, res, collections)
  );

  return router;
};
