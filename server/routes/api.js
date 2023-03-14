const database = require("../modules/database");
const webhooks = require("../modules/webhooks");
const crypto = require("../modules/crypto");
const macros = require("../macros/index");
const path = require("path");
const { Luraph } = require("luraph");
const { readFileSync, mkdirSync, writeFileSync } = require("fs");

const Database = new database();
const luraph = new Luraph("ad355e4585dfea0baf319d453ef3a728e60fe3a789e96fbd84609fc997b79a00");

function Regex(expression) {
    return new RegExp(expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");
}

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {

    /**
     * @param {import("fastify").FastifyRequest} request
     * @param {import("fastify").FastifyReply} reply 
     * @param {*} done 
     */
    async function AuthenticationHandler(request, reply) {
        const APIKey = request.headers["luashield-api-key"];
        const Buyer = await Database.GetBuyerFromAPIKey(APIKey);
        if (!Buyer) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        if (!Buyer.BypassPayment) {
            if (!Buyer.Subscription) {
                return reply.status(402).send({ error: "You need to purchase a subscription" });
            }

            // IMPLEMENT STRIPE
        }

        request.APIKey = APIKey;
    }

    const HeadersSchema = {
        type: "object",
        properties: {
            "luashield-api-key": { type: "string" }
        },
        required: ["luashield-api-key"]
    }

    const MakeScriptSchema = {
        type: "object",
        properties: {
            script_name: { type: "string", maxLength: 20, minLength: 3 },
            script: { type: "string" },
            success_webhook: { type: "string", maxLength: 150, minLength: 50 },
            blacklist_webhook: { type: "string", maxLength: 150, minLength: 50 },
            unauthorized_webhook: { type: "string", maxLength: 150, minLength: 50 }
        },
        required: ["script_name", "script", "success_webhook", "blacklist_webhook", "unauthorized_webhook"]
    }

    const WhiteistUserSchema = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            identifier: { type: "string", maxLength: 20, minLength: 5 },
            expire: { type: "string" }
        },
        required: ["script_id", "identifier"]
    }
    
    const UpdateScriptSchema = {
        type: "object",
        properties: {
            script_name: { type: "string", maxLength: 20, minLength: 3 },
            script_id: { type: "string" },
            script: { type: "string" },
            success_webhook: { type: "string", maxLength: 150, minLength: 50 },
            blacklist_webhook: { type: "string", maxLength: 150, minLength: 50 },
            unauthorized_webhook: { type: "string", maxLength: 150, minLength: 50 }
        },
        required: ["script_id", "script"]
    }

    fastify.get("/status", { websocket: false }, (request, reply) => reply.send({ online: true }))

    fastify.get("/valid_api_key", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, (request, reply) => reply.send({ success: true }));

    fastify.post("/make_script", { schema: { headers: HeadersSchema, body: MakeScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Name = request.body.script_name;
        
        let Script = request.body.script;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;

        SuccessWebhook = SuccessWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
        BlacklistWebhook = BlacklistWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
        UnauthorizedWebhook = UnauthorizedWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);

        if (!SuccessWebhook) {
            return reply.send({ error: "success_webhook is not a valid webhook" });
        }

        if (!BlacklistWebhook) {
            return reply.send({ error: "blacklist_webhook is not a valid webhook" });
        }

        if (!UnauthorizedWebhook) {
            return reply.send({ error: "unauthorized_webhook is not a valid webhook" });
        }

        SuccessWebhook = "https://" + SuccessWebhook.shift();
        BlacklistWebhook = "https://" + BlacklistWebhook.shift();
        UnauthorizedWebhook = "https://" + UnauthorizedWebhook.shift();
        
        try {
            await webhooks.SetupWebhook(SuccessWebhook, Name, "success");
            await webhooks.SetupWebhook(BlacklistWebhook, Name, "blacklist");
            await webhooks.SetupWebhook(UnauthorizedWebhook, Name, "unauthorized");
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        Script = Buffer.from(Script, "base64").toString();
        try {
            Script = await macros(Script, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        const GeneratedVersion = `v${crypto.randomUUID().substr(0, 5)}`;
        let ScriptInfo;
        try {
            ScriptInfo = await Database.MakeScript(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, GeneratedVersion);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while creating this script" });
        }
        
        const ScriptID = ScriptInfo.id;
        await Database.UpdateBuyerScripts(request.APIKey, ScriptID);

        let Whitelist = readFileSync(path.join(__dirname, "../../client/client.lua"), "utf-8")
            .replace(Regex("ws://localhost:8880", "wss://luashield.com"))
            .replace("local function LPH_CRASH() error(\"Blocked crash\"); end;", "")
            .replace("SCRIPT_ID", ScriptID)
            .replace("--_SCRIPT_--", Script);

        try {
            Whitelist = await macros(Whitelist);

            const { jobId } = await luraph.createNewJob("main", Whitelist, `${ScriptID}.lua`, {
                INTENSE_VM_STRUCTURE: true,
                TARGET_VERSION: "Luau Handicapped",
                VM_ENCRYPTION: true,
                ENABLE_GC_FIXES: false,
                DISABLE_LINE_INFORMATION: true,
                USE_DEBUG_LIBRARY: true
            });

            const { success, error } = await luraph.getJobStatus(jobId);
            if (!success) {
                return reply.status(500).send({ error: error });
            }

            const { data } = await luraph.downloadResult(jobId);
            mkdirSync(path.join(__dirname, `../scripts/${ScriptID}`));
            writeFileSync(path.join(__dirname, `../scripts/${ScriptID}/${GeneratedVersion}.lua`), data);
            
            reply.send({ script_id: ScriptID, version: GeneratedVersion });
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });

    /*
    fastify.post("/update_script", { schema: { headers: HeadersSchema, body: UpdateScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Name = request.body.script_name;
        const ScriptID = request.body.script_id;

        let Script = request.body.script;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;

        if (!Database.ScriptOwnedByBuyer(request.APIKey, ScriptID)) {
            return reply.status(400).send({ error: "You don't own this script" });
        }

        if (SuccessWebhook && BlacklistWebhook && UnauthorizedWebhook) {
            SuccessWebhook = SuccessWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
            BlacklistWebhook = BlacklistWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
            UnauthorizedWebhook = UnauthorizedWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
    
            if (!SuccessWebhook) {
                return reply.send({ error: "success_webhook is not a valid webhook" });
            }
    
            if (!BlacklistWebhook) {
                return reply.send({ error: "blacklist_webhook is not a valid webhook" });
            }
    
            if (!UnauthorizedWebhook) {
                return reply.send({ error: "unauthorized_webhook is not a valid webhook" });
            }
    
            SuccessWebhook = "https://" + SuccessWebhook.shift();
            BlacklistWebhook = "https://" + BlacklistWebhook.shift();
            UnauthorizedWebhook = "https://" + UnauthorizedWebhook.shift();

            try {
                await webhooks.SetupWebhook(SuccessWebhook, Name, "success");
                await webhooks.SetupWebhook(BlacklistWebhook, Name, "blacklist");
                await webhooks.SetupWebhook(UnauthorizedWebhook, Name, "unauthorized");
            } catch (er) {
                return reply.status(500).send({ error: er.toString() });
            }
        }

        Script = Buffer.from(Script, "base64").toString();
        try {
            Script = await macros(Script, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });
    */

    // TODO: UPDATE_SCRIPT

    fastify.post("/whitelist_user", { schema: { headers: HeadersSchema, body: WhiteistUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const Identifier = request.body.identifier;
        const Expiry = request.body.expire;

        if (Expiry && new Date(Expiry).toString() == "Invalid Date" || Date.now() > Expiry) {
            return reply.stauts(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        if (!await Database.ScriptOwnedByBuyer(request.APIKey, ScriptID)) {
            return reply.status(400).send({ error: "You don't own this script" });
        }

        const Existing = await Database.GetUser(Identifier, ScriptID);
        if (Existing) {
            return reply.status(400).send({ error: "A user with this identifier already exists" })
        }

        const Key = crypto.randomUUID();
        try {
            await Database.WhitelistUser(Identifier, crypto.sha512(Key), ScriptID, Expiry);
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue creating this user" });
        }

        reply.send({
            license_key: Key,
            generated_script: `getfenv(0).Key = '${Key}'; loadstring(game:HttpGet('https://luashield.com/script/${ScriptID}'))();`,
            script_id: ScriptID
        });
    });
}

module.exports = routes;