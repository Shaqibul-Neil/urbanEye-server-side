const fs = require("fs");
const key = fs.readFileSync("./urbaneye-25bfb-firebase-adminsdk.json", "utf8");
const base64 = Buffer.from(key).toString("base64");
//console.log(base64);
