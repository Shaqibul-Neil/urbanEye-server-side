const crypto = require("crypto");
module.exports = function generateTrackingId() {
  const prefix = "UE";
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
};
