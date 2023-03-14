const { existsSync, mkdirSync } = require("fs");
const path = require("path");
const fastify = require("fastify")({ logger: true });

if (!existsSync(path.join(__dirname, "/scripts"))) {
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
        await fastify.listen({ port: 80 });
        console.log("Server is now listening to port 80")
    } catch (er) {
        console.log(er);
    }
})();