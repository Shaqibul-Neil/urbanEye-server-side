const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const responseSend = require("../utilities/responseSend");
const { ObjectId } = require("mongodb");

// Subscription create checkout session
const createCheckoutSession = async (req, res, collections) => {
  try {
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
  } catch (error) {
    return responseSend(res, 400, "Failed to create checkout session");
  }
};

// Subscription payment success
const paymentSuccess = async (req, res, collections) => {
  const { userCollection, paymentCollection } = collections;
  try {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    //removing duplicate entry upon reload
    const transactionId = session.payment_intent;
    const query = { transactionId: transactionId };
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
    const isPaymentExist = await paymentCollection.findOne(query);

    if (isPaymentExist) {
      return responseSend(res, 200, "Already paid for this subscription", {
        transactionId: isPaymentExist.transactionId,
        payment,
      });
    }
    //citizen premium status update
    if (session.payment_status === "paid") {
      const email = session.metadata.citizenEmail;
      const query = { email: email };
      const updatedUser = { $set: { isPremium: true } };
      const modifiedUser = await userCollection.updateOne(query, updatedUser);

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
};

// Get all and latest payments by citizen
const getPayments = async (req, res, collections) => {
  const { userCollection, paymentCollection } = collections;
  try {
    const email = req.decoded_email;
    const user = await userCollection.findOne({ email: email });
    if (!user) {
      return responseSend(res, 404, "User not found");
    }
    const limit = Number(req.query.limit) || 0;
    const filterType = req.query.paymentType || "";
    let query = {};
    if (user?.role === "admin") {
      if (filterType) query.paymentType = filterType;
      else query = {};
    } else if (user?.role === "citizen") {
      query = { citizenEmail: email };
    }
    const result = await paymentCollection
      .find(query)
      .sort({ paidAt: -1 })
      .limit(limit)
      .toArray();

    return responseSend(res, 200, "Successfully fetched payment data", {
      payment: result,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed to fetch data");
  }
};

// Data aggregation
const getPaymentStats = async (req, res, collections) => {
  const { userCollection, paymentCollection } = collections;
  try {
    const email = req.decoded_email;
    //finding the user
    const user = await userCollection.findOne({ email });
    if (!user) {
      return responseSend(res, 404, "User not found");
    }
    //role wise match
    let matchStage = {};
    if (user.role === "citizen") {
      matchStage.citizenEmail = email;
    }
    const pipeline = [
      { $match: matchStage },
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
    return responseSend(res, 200, "Successfully fetched data", {
      dateWise: result[0].dateWise,
      totalPayments: result[0].overall[0]?.totalPayments || 0,
      totalAmount: result[0].overall[0]?.totalAmount || 0,
    });
  } catch (error) {
    return responseSend(res, 400, "Failed fetched data");
  }
};

// Boost create checkout session
const createBoostCheckoutSession = async (req, res, collections) => {
  const { issueCollection } = collections;
  try {
    const { issueId, citizenEmail } = req.body;
    //console.log("chk", issueId, citizenEmail);
    // fetch issue
    const issue = await issueCollection.findOne({
      _id: new ObjectId(issueId),
    });
    if (!issue) return responseSend(res, 404, "Issue not found");

    // check already high priority
    if (issue.priority === "high") {
      return responseSend(res, 200, "Issue already boosted");
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "BDT",
            unit_amount: 10000, // 100tk
            product_data: { name: `Boost Issue: ${issue.title}` },
          },
          quantity: 1,
        },
      ],
      customer_email: citizenEmail,
      mode: "payment",
      metadata: {
        issueId,
        citizenEmail,
        paymentName: `Boost Issue: ${issue.title}`,
        paymentMethod: "Card/Stripe",
      },
      success_url: `${process.env.SITE_DOMAIN}/boost-payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_DOMAIN}/issue/${issue._id}`,
    });

    //console.log(session);
    return responseSend(res, 200, "Boost session created", {
      url: session.url,
    });
  } catch (err) {
    //console.error(err);
    return responseSend(res, 400, "Failed to create boost session");
  }
};

// Boost payment success
const boostPaymentSuccess = async (req, res, collections) => {
  const { issueCollection, paymentCollection } = collections;
  try {
    const sessionId = req.query.session_id;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const { issueId, citizenEmail, paymentName } = session.metadata;
    const transactionId = session.payment_intent;
    const payment = {
      paymentType: "boost",
      transactionId,
      paymentName,
      paymentStatus: session.payment_status,
      currency: session.currency,
      citizenEmail: session.customer_email,
      amount: session.amount_total / 100,
      paymentMethod: session.metadata.paymentMethod,
      paidAt: new Date(),
      issueId,
    };
    // check duplicate payment entry
    const isPaymentExist = await paymentCollection.findOne({
      transactionId,
    });
    if (isPaymentExist) {
      return responseSend(res, 200, "Already paid for this boost", {
        transactionId: isPaymentExist.transactionId,
        payment,
      });
    }

    // if paid, update issue priority & insert payment
    if (session.payment_status === "paid") {
      // update issue priority
      await issueCollection.updateOne(
        { _id: new ObjectId(issueId) },
        {
          $set: { priority: "high" },
          $push: {
            timeline: {
              action: `Boosted by ${citizenEmail}`,
              at: new Date(),
            },
          },
        }
      );

      // insert payment info

      //console.log("success", payment);
      await paymentCollection.insertOne(payment);

      return responseSend(res, 200, "Issue boosted & payment recorded", {
        payment,
      });
    } else {
      return responseSend(res, 400, "Payment not completed");
    }
  } catch (err) {
    //console.error(err);
    return responseSend(res, 400, "Failed to process boost payment");
  }
};

module.exports = {
  createCheckoutSession,
  paymentSuccess,
  getPayments,
  getPaymentStats,
  createBoostCheckoutSession,
  boostPaymentSuccess
};