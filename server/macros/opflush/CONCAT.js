const { randomBytes } = require("crypto");
module.exports = function() {
    return `
local _VarA = "${randomBytes(10).toString("hex")}";
local _VarB = "${randomBytes(10).toString("hex")}"; 
local _VARC = _VarA .. _VarA;
    `
}