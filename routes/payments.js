const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const express = require("express");
const responseSend = require("../utilities/responseSend");

const { ObjectId } = require("mongodb");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection, issueCollection, paymentCollection } = collections;

  //create checkout session
  router.post("/create-checkout-session", async (req, res) => {
    const paymentInfo = req.body;
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: 100000,
            product_data: { name: paymentInfo.paymentName },
          },
          quantity: 1,
        },
      ],
      customer_email: paymentInfo.userEmail,
      mode: "payment",
      metadata: {
        paymentName: paymentInfo.paymentName,
      },
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-profile`,
    });
    console.log(session);
    return responseSend(res, 200, "success", { url: session.url });
  });

  return router;
};
