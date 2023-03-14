const { randomBytes } = require("crypto");
module.exports = function() {
    return `
        (function(a) 
            return a;
        end)("${randomBytes(10).toString("hex")}")
    `
}