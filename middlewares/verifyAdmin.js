const responseSend = require("../utilities/responseSend");

const verifyAdmin = (collections) => {
  const { userCollection } = collections;
  return async (req, res, next) => {
    try {
      //user email from firebase
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
