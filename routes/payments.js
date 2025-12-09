const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const express = require("express");
const responseSend = require("../utilities/responseSend");

const verifyFireBaseToken = require("../middlewares/verifyFirebaseToken");
const { ObjectId } = require("mongodb");
module.exports = (collections) => {
  const router = express.Router();
  const {
    userCollection,
    issueCollection,
    paymentCollection,
    upvoteCollection,
  } = collections;

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
        paymentMethod: "Card/Stripe",
      },
      success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/dashboard/my-profile`,
    });
    return responseSend(res, 200, "success", { url: session.url });
  });

  //subscription payment success
  router.post("/payment-success", async (req, res) => {
    try {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!sessionId) {
        return responseSend(res, 400, "Session ID is required");
      }
      //removing duplicate entry upon reload
      const transactionId = session.payment_intent;
      if (!transactionId) {
        return responseSend(
          res,
          400,
          "Transaction not completed yet, try again later"
        );
      }
      const query = { transactionId: transactionId };
      const isPaymentExist = await paymentCollection.findOne(query);
      if (isPaymentExist) {
        return responseSend(res, 200, "Already paid for this subscription", {
          transactionId: isPaymentExist.transactionId,
        });
      }

      //citizen premium status update
      if (session.payment_status === "paid") {
        const email = session.metadata.citizenEmail;
        const query = { email: email };
        const updatedUser = { $set: { isPremium: true } };
        const modifiedUser = await userCollection.updateOne(query, updatedUser);
        //payment collection for payment history
        const payment = {
          paymentType: "subscription",
          transactionId: transactionId,
          paymentMethod: session.metadata.paymentMethod,
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
          payment,
          modifiedUser,
          transactionId: session.payment_intent,
        });
      } else {
        return responseSend(res, 400, "Payment not completed", {});
      }
    } catch (error) {
      return responseSend(
        res,
        500,
        "Failed to Update user Info with Payment Information"
      );
    }
  });

  //get all payments by citizen
  router.get("/", verifyFireBaseToken, async (req, res) => {
    try {
      const email = req.decoded_email;
      const user = await userCollection.findOne({ email: email });
      if (!user) {
        return responseSend(res, 404, "User not found");
      }
      let query = {};
      if (user?.role === "admin") {
        query = {};
      } else if (user?.role === "citizen") {
        query = { citizenEmail: email };
      }
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

  //data aggregation
  router.get("/stats/total", async (req, res) => {
    try {
      const pipeline = [
        {
          $facet: {
            //Date-wise aggregation
            dateWise: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$paidAt",
                    },
                  },
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
      console.log(result);
      return responseSend(res, 200, "Successfully fetched data", {
        dateWise: result[0].dateWise,
        totalPayments: result[0].overall[0]?.totalPayments || 0,
        totalAmount: result[0].overall[0]?.totalAmount || 0,
      });
    } catch (error) {
      console.log(error);
      return responseSend(res, 400, "Failed fetched data");
    }
  });

  //upvote create checkout session
  router.post("/upvote-checkout-session", async (req, res) => {
    const { issueId, paymentName, citizenEmail } = req.body;
    // Check if already upvoted
    const existingUpvote = await upvoteCollection.findOne({
      issueId: new ObjectId(issueId),
      citizenEmail: citizenEmail, //one who pays
    });
    if (existingUpvote)
      return responseSend(res, 200, "Already paid for this issue", {
        transactionId: existingUpvote.transactionId,
      });
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "USD",
            unit_amount: 10000,
            product_data: { name: paymentName },
          },
          quantity: 1,
        },
      ],
      customer_email: citizenEmail, // one who paid
      mode: "payment",
      metadata: {
        issueId,
        citizenEmail, // one who paid
        paymentName,
        paymentMethod: "Card/Stripe",
      },
      success_url: `${process.env.SITE_DOMAIN}/upvote-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/all-issues`,
    });
    return responseSend(res, 200, "success", { url: session.url });
  });

  //upvote payment success
  router.post("/upvote-payment-success", async (req, res) => {
    try {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const { citizenEmail, issueId, paymentName } = session.metadata;
      //removing duplicate entry upon reload
      const transactionId = session.payment_intent;
      const query = { transactionId: transactionId };
      const isPaymentExist = await paymentCollection.findOne(query);
      if (isPaymentExist) {
        return responseSend(res, 200, "Already paid for this issue", {
          transactionId: isPaymentExist.transactionId,
        });
      }
      // upvote duplication check
      const alreadyUpvoted = await upvoteCollection.findOne({
        issueId: new ObjectId(issueId),
        citizenEmail,
      });
      if (alreadyUpvoted) {
        return responseSend(res, 200, "Already upvoted", {
          transactionId: alreadyUpvoted.transactionId,
        });
      }
      //citizen premium status update
      if (session.payment_status === "paid") {
        //insert into upvote collection with timestamp
        await upvoteCollection.insertOne({
          issueId: new ObjectId(issueId),
          citizenEmail: citizenEmail,
          paymentStatus: session.payment_status,
          transactionId,
          paymentMethod: session.metadata.paymentMethod,
          amount: session.amount_total / 100,
          createdAt: new Date(),
        });
        // Fetch issue to check priority
        const issueQuery = { _id: new ObjectId(issueId) };
        const issue = await issueCollection.findOne(issueQuery);
        if (!issue) {
          return responseSend(res, 404, "Issue not found");
        }
        // Increment upvote count and set priority if needed
        const updatedIssue = { $inc: { upvoteCount: 1 } };
        if (issue.priority !== "high") {
          updatedIssue.$set = { priority: "high" };
        }
        await issueCollection.updateOne(issueQuery, updatedIssue);

        //payment collection for payment history
        const payment = {
          paymentType: "upvote",
          transactionId: transactionId,
          paymentName,
          paymentStatus: session.payment_status,
          currency: session.currency,
          citizenEmail: session.customer_email,
          paidAt: new Date(),
          amount: session.amount_total / 100,
        };
        const paymentResult = await paymentCollection.insertOne(payment);
        return responseSend(res, 200, "Upvote added & payment recorded", {
          payment,
          paymentResult,
        });
      } else {
        return responseSend(res, 400, "Payment not completed", {});
      }
    } catch (error) {
      return responseSend(res, 400, "Failed to process upvote payment");
    }
  });

  //check upvote for a single issue for a user
  router.get("/check-upvote", async (req, res) => {
    try {
      const { issueId, userEmail } = req.query;
      const upvoted = await upvoteCollection.findOne({
        issueId: new ObjectId(issueId),
        userEmail,
      });
      return res.send({ alreadyUpvoted: !!upvoted });
    } catch (error) {
      return responseSend(res, 400, "Failed to Check information");
    }
  });
  return router;
};
