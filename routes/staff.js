const express = require("express");
const responseSend = require("../utilities/responseSend");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");

module.exports = (collections) => {
  const router = express.Router();
  const { staffCollection } = collections;

  //save a staff to db
  router.post("/", async (req, res) => {});

  return router;
};
