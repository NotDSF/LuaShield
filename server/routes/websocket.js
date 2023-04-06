const config = require("../config.json");
const crypto = require("../modules/crypto");

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/ws", { websocket: true }, (connection, request) => {
        request.IPAddress = request.headers["cf-connecting-ip"] || request.ip;
		
        if (Connected.get(request.IPAddress)) return connection.socket.terminate();

        connection.socket.on("message", message => {
            const Type = message.toString();
            switch (Type) {
                case config.websocketid:
                    const Key = crypto.randomstr(50);
                    Connected.set(request.IPAddress, Key);
                    connection.socket.send(Key);
                    break;
                default:
                    connection.socket.close();
                    break;
            }
        });

        // kill after 5 seconds
        setTimeout(() => {
            if (connection.socket.readyState === connection.socket.OPEN) {
                connection.socket.close();
            }
        }, 5000);
    });
}

module.exports = routes;