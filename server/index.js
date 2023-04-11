const { existsSync, mkdirSync, readFileSync } = require("fs");
const fetch = require("node-fetch");
const path = require("path");
const cors = require("@fastify/cors");
const ratelimit = require("@fastify/rate-limit");
require("dotenv").config()

let options = {
    logger: process.platform === "win32"
}

if (process.platform !== "win32") {
    options.https = {
        key: readFileSync(path.join(__dirname, 'luashield.key'), "utf-8"),
        cert: readFileSync(path.join(__dirname, 'luashield.pem'), "utf-8")
    }
}

const fastify = require("fastify")(options);

if (!existsSync(path.join(__dirname, "../files"))) {
    mkdirSync(path.join(__dirname, "../files"));
}


if (!existsSync(path.join(__dirname, "../files/projects"))) {
    mkdirSync(path.join(__dirname, "../files/projects"));
}

if (!existsSync(path.join(__dirname, "../files/logs"))) {
    mkdirSync(path.join(__dirname, "../files/logs"));
}

global.WebhookTokens = new Set();
global.Connected = new Map();
global.AuthenticationStats = {
    SynapseX: {
        total: 0,
        times: 0
    },
    ScriptWare: {
        total: 0,
        times: 0,
    },
    SynapseV3: {
        total: 0,
        times: 0
    },
    total: 0,
    times: 0
}

fastify.register(cors);
fastify.register(ratelimit, {
    max: 60,
    timeWindow: "1 minute"
});

fastify.register(require("./routes/auth"), { prefix: "/auth" });
fastify.register(require("./routes/verify"), { prefix: "/verify" });
fastify.register(require("./routes/api"));

fastify.register(require("@fastify/websocket"), {
    options: {
        maxPayload: 1048576
    }
});

fastify.register(require("./routes/websocket"));
fastify.register(require("./routes/script"), { prefix: "/s" });
fastify.setErrorHandler((error, request, reply) => reply.send({ error: error.message }));

setInterval(async () => {
    await fetch("https://betteruptime.com/api/v1/heartbeat/NP8ozm4r7VGmMW7cgP7SvBP4");
}, 600000);

(async () => {
    try {
        await fastify.listen({ port: process.platform == "win32" ? 80 : 443, host: "0.0.0.0" });
        await fetch("https://betteruptime.com/api/v1/heartbeat/NP8ozm4r7VGmMW7cgP7SvBP4");
        console.log("Server is now listening to port 80")
    } catch (er) {
        console.log(er);
    }
})();