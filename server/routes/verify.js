const crypto = require("../modules/crypto");
let DiscordVerification = new Map();

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    const StageSchema = {
        type: "object",
        properties: {
            auth: { type: "string" }
        },
        required: ["auth"]
    }

    fastify.post("/create", { schema: { body: StageSchema }, websocket: false }, (request, reply) => {
        const Auth = request.body.auth;
        if (Auth !== process.env.ADMIN_KEY) {
            return reply.status(400).send({ error: "Unauthorized" });
        }

        const AccessToken = crypto.randomUUID();
        DiscordVerification.set(AccessToken, {
            Verified: false,
            Timestamp: Date.now() / 1000
        });
        
        reply.send({ token: AccessToken });
    });

    fastify.get("/check/:token", { websocket: false }, (request, reply) => {
        const Token = request.params.token
        const Info = DiscordVerification.get(Token);
        if (!Info) {
            return reply.send({ verified: false });
        }

        reply.send({ verified: Info.Verified });

        if (Info.Verified) {
            DiscordVerification.delete(Token);
        }
    });

    fastify.get("/:token", { websocket: false }, (request, reply) => {
        const Token = request.params.token;
        const Info = DiscordVerification.get(Token);
        if (!Info) {
            return reply.send("Failed to verify, try running the command again");
        }

        DiscordVerification.set(Token, {
            Verified: true,
            Timestamp: Date.now() / 1000
        });

        reply.send("Verified successfully!");
    });   
}

setInterval(() => {
    DiscordVerification.forEach((value, key) => {
        if ((Date.now() / 1000) - value.Timestamp > 30 && !value.Verified) {
            DiscordVerification.delete(key);
        }
    })
}, 5000);

module.exports = routes;