const { randomBytes } = require("crypto");
module.exports = function() {
    return `
local _Var = "${randomBytes(50).toString("hex")}";
    `
}