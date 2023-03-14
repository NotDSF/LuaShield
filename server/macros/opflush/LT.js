const { randomBytes } = require("crypto");
module.exports = function() {
    let c = randomBytes(10).toString("hex");
    let d = randomBytes(10).toString("hex");
    return `
        ${`
        local _c = 1;
        local _d = 2;
        `.split(";").sort(() => Math.random() - 0.5).join("")}

        if _c > _d then
            _pos = 0;
        end;

        if _d > _c then
            if _d < _c then
                _pos = 0;
            end;
        end;
    `
}