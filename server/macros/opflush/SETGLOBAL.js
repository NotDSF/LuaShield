const { randomBytes } = require("crypto");
module.exports = function() {
    return `
a${randomBytes(50).toString("hex")}a = "${randomBytes(50).toString("hex")}";
    `
}