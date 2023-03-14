const a = require("../index");
const { readFileSync, writeFileSync, write } = require("fs");
const path = require("path");

(async () => {
    try {
        console.time("Macro");
        let Client = await a(readFileSync(path.join(__dirname, "../../../../client/client.lua"), "utf-8"));
        let US = await a(readFileSync("user-script.lua", "utf-8"), true);
        writeFileSync("output.lua", Client.replace("--_SCRIPT_--", US))
        writeFileSync("user-script-output.lua", US);
        console.timeEnd("Macro");
    } catch (er) {
        console.log(er)
    }

})();