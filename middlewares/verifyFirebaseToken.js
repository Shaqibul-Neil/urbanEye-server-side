const responseSend = require("../utilities/responseSend");
const admin = require("../config/firebase");

const verifyFireBaseToken = async (req, res, next) => {
  const token = req.headers?.authorization?.split(" ")[1];
  if (!token) return responseSend(res, 401, "Unauthorized Access");
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.decoded_email = decoded.email;
    next();
  } catch (error) {
    return responseSend(res, 401, "Unauthorized Access");
  }
};
module.exports = verifyFireBaseToken;
