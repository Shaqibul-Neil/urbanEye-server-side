const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const express = require("express");
const responseSend = require("../utilities/responseSend");

const { ObjectId } = require("mongodb");
const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
module.exports = (collections) => {
  const router = express.Router();
  const { userCollection, issueCollection, paymentCollection } = collections;

  //subscription create checkout session
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
        citizenEmail: paymentInfo.userEmail,
      },
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-profile`,
    });
    return responseSend(res, 200, "success", { url: session.url });
  });

  //subscription payment success
  router.patch("/payment-success", async (req, res) => {
    try {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      //removing duplicate entry upon reload
      const transactionId = session.payment_intent;
      const isPaymentExist = await paymentCollection.findOne({
        transactionId: transactionId,
      });
      if (isPaymentExist)
        return responseSend(res, 200, "Already paid", {
          transactionId: isPaymentExist.transactionId,
        });

      //citizen premium status update
      if (session.payment_status === "paid") {
        const email = session.metadata.citizenEmail;
        const query = { email: email };
        const updatedUser = { $set: { isPremium: true } };
        const modifiedUser = await userCollection.updateOne(query, updatedUser);
        //payment collection for payment history
        const payment = {
          transactionId: transactionId,
          paymentName: session.metadata.paymentName,
          paymentStatus: session.payment_status,
          currency: session.currency,
          citizenEmail: session.customer_email,
          paidAt: new Date(),
          amount: session.amount_total / 100,
        };
        const paymentResult = await paymentCollection.insertOne(payment);
        return responseSend(res, 200, "User updated with payment information", {
          paymentResult,
          modifiedUser,
          transactionId: session.payment_intent,
        });
      } else {
        return responseSend(res, 200, "Payment not completed", {});
      }
    } catch (error) {
      return responseSend(
        res,
        200,
        "Failed to Update Parcel Info with Payment Information"
      );
    }
  });

  //get all payments by user
  router.get("/:email", verifyFireBaseToken, async (req, res) => {
    try {
      const email = req.decoded_email;
      const query = { citizenEmail: email };

      const result = await paymentCollection
        .find(query)
        .sort({ paidAt: -1 })
        .toArray();

      return responseSend(res, 200, "Successfully fetched payment data", {
        payment: result,
      });
    } catch (error) {
      return responseSend(res, 400, "Failed to fetch data");
    }
  });

  return router;
};
