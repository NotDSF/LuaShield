const { randomBytes } = require("crypto");
module.exports = function() {
    return `
local _${randomBytes(3).toString("hex")}_ = "${randomBytes(20).toString("hex")}";
    `
}