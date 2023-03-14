const REncode = require("./rencode");
const RFetch = require("./remulator");
const config = require("../server/config.json");
const { WebSocket } = require("ws");

const Emulator = new RFetch();
const Encode = new REncode();

(async () => {
    const Response = await Emulator.syn_request({
        url: `http://localhost:8080/auth/${config.endpointsname}`
    });
    const Body = await Response.text();
    const JSON = Encode.DecodeJSON(Body);
    let Endpoints = Object.values(JSON[1]).map(v => Encode.DecodeString(v));
    console.log(Endpoints)

    let Fingerprints = Encode.DecodeJSON(await Emulator.syn_request({
        url: `http://localhost:8080/auth/${Endpoints[0]}`
    }).then(res => res.text()));

    let WSKey = await new Promise((resolve, reject) => {
        const ws = new WebSocket("ws://localhost:8080/ws");
        ws.on("open", () => {
            ws.send("PibNiKCVCHuabRUvUfFqlcJMizJpuyOUJqeubRKduLWNQOCDjILzOwYpHXrMQSVlPLjRjgGuJVgRassCBcHtVcxYWwrsdLLxPJde");
        })
        
        ws.on("message", (message) => {
            console.log(message.toString());
            resolve(message.toString())
        })
    });

    

    console.log(Fingerprints, WSKey)
})();