const responseSend = require("../utilities/responseSend");

const verifyStaff = (collections) => {
  const { staffCollection } = collections;
  return async (req, res, next) => {
    try {
      //user email from firebase
      const email = req.decoded_email;
      console.log("staff email", email);
      const query = { staffEmail: email };
      const user = await staffCollection.findOne(query);
      console.log("staff user", user);
      if (!user || user?.role !== "staff") {
        return responseSend(res, 200, "Forbidden Access");
      }
      next();
    } catch (error) {
      return responseSend(res, 500, "Server Error: Unable to verify admin");
    }
  };
};
module.exports = verifyStaff;
