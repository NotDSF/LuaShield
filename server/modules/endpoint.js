// Generares random endpoint names.

const { Encode, randomstr } = require("./crypto.js");
let Endpoints = {
    WhitelistMain: randomstr(20),
    Flags: randomstr(20)
}

Endpoints.WhitelistSplice = Endpoints.WhitelistMain.slice(0, 2);
Endpoints.FlagsSlice = Endpoints.Flags.slice(3, 5);

module.exports = {
    Info: Endpoints,
    Vendor: {
        1: Encode(Endpoints.Flags),
        2: Encode(Endpoints.WhitelistMain)
    }
}