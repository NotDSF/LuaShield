
const database = require("../modules/database");
const Database = new database();
const path = require("path");
const { readFileSync } = require("fs");


/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
    fastify.get("/:project/:id", { websocket: false }, async (request, reply) => {
        const ProjectID = request.params.project;
        const ScriptID = request.params.id;

        const Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.send("error('LuaShield: This project doesn't exist.')");
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.send("error('LuaShield: This script doesn't exist.')");
        }

        reply.send(readFileSync(path.join(__dirname, `../../projects/${ProjectID}/${ScriptID}/${Script.Version}.lua`)))
    });
}

module.exports = routes;