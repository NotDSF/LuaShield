const { randomBytes } = require("crypto");
module.exports = function() {
    let c = randomBytes(10).toString("hex")
    return `
    local function a${c}a() end;
    a${c}a();
    `
}