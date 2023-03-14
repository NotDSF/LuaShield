const { randomBytes } = require("crypto");
module.exports = function() {
    let Method = randomBytes(10).toString("hex");
    return `
    local _Var = {};
    _Var.a${Method}a = function() end;
    _Var:a${Method}a();
    `
}