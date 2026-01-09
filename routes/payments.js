const express = require("express");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const paymentsController = require("../controllers/paymentsController");

module.exports = (collections) => {
  const router = express.Router();

  // Subscription payments
  router.post("/create-checkout-session", (req, res) => 
    paymentsController.createCheckoutSession(req, res, collections)
  );
  router.post("/payment-success", (req, res) => 
    paymentsController.paymentSuccess(req, res, collections)
  );

  // Payment history and stats
  router.get("/", verifyFireBaseToken, (req, res) => 
    paymentsController.getPayments(req, res, collections)
  );
  router.get("/stats/total", verifyFireBaseToken, (req, res) => 
    paymentsController.getPaymentStats(req, res, collections)
  );

  // Boost payments
  router.post("/boost-checkout-session", (req, res) => 
    paymentsController.createBoostCheckoutSession(req, res, collections)
  );
  router.post("/boost-payment-success", (req, res) => 
    paymentsController.boostPaymentSuccess(req, res, collections)
  );

  return router;
};
