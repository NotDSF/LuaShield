const { existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");

let options = {
    logger: true
}

if (process.platform !== "win32") {
    options.https = {
        key: readFileSync(path.join(__dirname, 'luashield.key'), "utf-8"),
        cert: readFileSync(path.join(__dirname, 'luashield.pem'), "utf-8")
    }
}

const fastify = require("fastify")(options);

if (!existsSync(path.join(__dirname, "../projects"))) {
    mkdirSync(path.join(__dirname, "../projects"));
}

global.Connected = new Map();

fastify.register(require("./routes/auth"), { prefix: "/auth" });
fastify.register(require("./routes/api"), { prefix: "/api" });

fastify.register(require("@fastify/websocket"), {
    options: {
        maxPayload: 1048576
    }
});

fastify.register(require("./routes/websocket"));

(async () => {
    try {
        await fastify.listen({ port: process.platform == "win32" ? 80 : 443, host: "0.0.0.0" });
        console.log("Server is now listening to port 80")
    } catch (er) {
        console.log(er);
    }
})();