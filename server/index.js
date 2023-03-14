const { existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");

let options = {
    logger: true
}

if (process.platform !== "win32") {
    options.https = {
        key: readFileSync(path.join(__dirname, 'luashield.key')),
        cert: readFileSync(path.join(__dirname, 'luashield.pem'))
    }
}

const fastify = require("fastify")(options);

if (!existsSync(path.join(__dirname, "../scripts"))) {
    mkdirSync(path.join(__dirname, "../scripts"));
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
        await fastify.listen({ port: process.platform == "win32" ? 80 : 443 });
        console.log("Server is now listening to port 80")
    } catch (er) {
        console.log(er);
    }
})();