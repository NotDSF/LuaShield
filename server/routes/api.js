const database = require("../modules/database");
const webhooks = require("../modules/webhooks");
const crypto = require("../modules/crypto");
const macros = require("../macros/index");
const path = require("path");
const validator = require("email-validator");
const { Luraph } = require("luraph");
const { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync } = require("fs");

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
            script_id: { type: "string" },
            script_name: { type: "string", maxLength: 20, minLength: 3 },
            script: { type: "string" },
            success_webhook: { type: "string", maxLength: 150, minLength: 50 },
            blacklist_webhook: { type: "string", maxLength: 150, minLength: 50 },
            unauthorized_webhook: { type: "string", maxLength: 150, minLength: 50 },
            allowed_exploits: { 
                type: "object",
                properties: {
                    synapse_x: { type: "boolean" },
                    script_ware: { type: "boolean" },
                    synapse_v3: { type: "boolean" }
                },
                required: ["synapse_x", "script_ware", "synapse_v3"]
            }
        },
        required: ["script_name", "script", "success_webhook", "blacklist_webhook", "unauthorized_webhook", "allowed_exploits", "script_id"]
    }

    const WhiteistUserSchema = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            identifier: { type: "string", maxLength: 20, minLength: 5 },
            expire: { type: "number" },
            usage: { type: "number", minimum: 0 },
            whitelisted: { type: "boolean" },
            note: { type: "string", minLength: 3, maxLength: 20 }
        },
        required: ["script_id", "identifier", "whitelisted"]
    }

    const UpdateUserSchema = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            identifier: { type: "string" },
            whitelisted: { type: "boolean" },
            expire: { type: "number" },
            usage: { type: "number", minimum: 0 },
            note: { type: "string", minLength: 3, maxLength: 20 }
        },
        required: ["whitelisted", "script_id", "identifier"]
    }

    const DeleteUserSchema = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            identifier: { type: "string" }
        },
        required: ["script_id", "identifier"]
    }
    
    const SignupSchema = {
        type: "object",
        properties: {
            email: { type: "string" },
            password: { type: "string", minLength: 6, maxLength: 20 },
            username: { type: "string", minLength: 3, maxLength: 10 }
        },
        required: ["email", "password", "username"]
    }

    const LoginSchema = {
        type: "object",
        properties: {
            password: { type: "string", minLength: 6, maxLength: 20 },
            username: { type: "string", minLength: 3, maxLength: 10 }
        },
        required: ["password", "username"]
    }

    const UpdateScriptSchema = {
        type: "object",
        properties: {
            script_name: { type: "string", maxLength: 20, minLength: 3 },
            script: { type: "string" },
            success_webhook: { type: "string", maxLength: 150, minLength: 50 },
            blacklist_webhook: { type: "string", maxLength: 150, minLength: 50 },
            unauthorized_webhook: { type: "string", maxLength: 150, minLength: 50 },
            allowed_exploits: { 
                type: "object",
                properties: {
                    synapse_x: { type: "boolean" },
                    script_ware: { type: "boolean" },
                    synapse_v3: { type: "boolean" }
                },
                required: ["synapse_x", "script_ware", "synapse_v3"]
            }
        }
    }

    fastify.get("/status", { websocket: false }, (request, reply) => reply.send({ online: true }))

    fastify.post("/signup", { schema: { body: SignupSchema }, websocket: false }, async (request, reply) => {
        const Email = request.body.email;
        const Password = request.body.password;
        const Username = request.body.username;

        if (!validator.validate(Email)) {
            return reply.status(400).send({ error: "Email is invalid" });
        }

        if (!Password.match(/[A-Z]+/)) {
            return reply.status(400).send({ error: "Your password must include at least one uppercase letter" })
        }

        if (await Database.GetBuyerFromEmail(Email)) {
            return reply.status(400).send({ error: "This email is already registered to another user" });
        }

        if (await Database.GetBuyerFromUsername(Username)) {
            return reply.status(400).send({ error: "This username is already associated with another account" })
        }

        const APIKey = crypto.randomUUID();
        try {
            await Database.AddBuyer(Email, Username, crypto.sha512(Password), APIKey);
            return reply.send({ APIKey: APIKey });
        } catch (er) {
            return reply.status(500).send({ error: "There was an error with creating your account" });
        }
    });

    fastify.post("/login", { schema: { body: LoginSchema }, websocket: false }, async (request, reply) => {
        const Password = request.body.password;
        const Username = request.body.username;
        const Buyer = await Database.GetBuyer(Username, crypto.sha512(Password));

        if (!Buyer) {
            return reply.status(401).send({ error: "Incorrect username or password" });
        }

        reply.send(Buyer);
    });

    fastify.get("/valid_api_key", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, (request, reply) => reply.send({ success: true }));

    fastify.post("/make_script", { schema: { headers: HeadersSchema, body: MakeScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Name = request.body.script_name;
        const Exploits = request.body.allowed_exploits;

        let Script = request.body.script;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;
        
        SuccessWebhook = SuccessWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
        BlacklistWebhook = BlacklistWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
        UnauthorizedWebhook = UnauthorizedWebhook.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);

        if (!SuccessWebhook) {
            return reply.status(400).send({ error: "success_webhook is not a valid webhook" });
        }

        if (!BlacklistWebhook) {
            return reply.status(400).send({ error: "blacklist_webhook is not a valid webhook" });
        }

        if (!UnauthorizedWebhook) {
            return reply.status(400).send({ error: "unauthorized_webhook is not a valid webhook" });
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
            ScriptInfo = await Database.MakeScript(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, GeneratedVersion, Exploits);
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
    
    fastify.post("/update_script", { schema: { headers: HeadersSchema, body: UpdateScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        let Script = request.body.script;

        // values which could exist or not
        let Name = request.body.script_name;
        let Exploits = request.body.allowed_exploits;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;

        if (!Database.ScriptOwnedByBuyer(request.APIKey, ScriptID)) {
            return reply.status(400).send({ error: "You don't own this script" });
        }

        let ScriptInfo = await Database.GetScript(ScriptID);
        if (!ScriptInfo) {
            return reply.status(400).send({ error: "This script doesn't exist" });
        }
        
        SuccessWebhook = SuccessWebhook || ScriptInfo.SuccessWebhook;
        BlacklistWebhook = BlacklistWebhook || ScriptInfo.BlacklistWebhook;
        UnauthorizedWebhook = UnauthorizedWebhook || ScriptInfo.UnauthorizedWebhook;
        Name = Name || ScriptInfo.Name;
        Exploits = Exploits || { synapse_x: ScriptInfo.SynapseX, script_ware: ScriptInfo.ScriptWare, synapse_v3: ScriptInfo.SynapseV3 };

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

        const OldVersion = ScriptInfo.Version;
        const GeneratedVersion = `v${crypto.randomUUID().substr(0, 5)}`;
        try {
            ScriptInfo = await Database.UpdateScript(ScriptID, Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, GeneratedVersion, Exploits);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue with updating this script" });
        }

        // do not need to reobfuscate end here
        if (!Script) {
            if (existsSync(path.join(__dirname, `../scripts/${ScriptID}/${OldVersion}.lua`))) {
                renameSync(path.join(__dirname, `../scripts/${ScriptID}/${OldVersion}.lua`), path.join(__dirname, `../scripts/${ScriptID}/${GeneratedVersion}.lua`));
            }
            return reply.send(ScriptInfo);
        }

        Script = Buffer.from(Script, "base64").toString();
        try {
            Script = await macros(Script, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
        
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
            writeFileSync(path.join(__dirname, `../scripts/${ScriptID}/${GeneratedVersion}.lua`), data);
            
            reply.send(ScriptInfo);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });
    
    fastify.post("/add_user", { schema: { headers: HeadersSchema, body: WhiteistUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const Identifier = request.body.identifier;
        const Expiry = request.body.expire;
        const Usage = request.body.usage || 0;
        const Whitelisted = request.body.whitelisted;
        const Note = request.body.note;

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
            await Database.AddUser(Identifier, crypto.sha512(Key), ScriptID, Expiry, Usage, Whitelisted, Note);
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

    fastify.post("/update_user", { schema: { headers: HeadersSchema, body: UpdateUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const Identifier = request.body.identifier;

        if (!await Database.ScriptOwnedByBuyer(request.APIKey, ScriptID)) {
            return reply.status(400).send({ error: "You don't own this script" });
        }

        const User = await Database.GetUser(Identifier, ScriptID);
        if (!User) {
            return reply.status(400).send({ error: "This user doesn't exist" })
        }

        const Expiry = request.body.expire;
        const Usage = request.body.usage || User.MaxExecutions;
        const Whitelisted = request.body.whitelisted;
        const Note = request.body.note;

        if (Expiry && new Date(Expiry).toString() == "Invalid Date" || Date.now() > Expiry) {
            return reply.status(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        try {
            const Result = await Database.UpdateUser(User.id, Expiry, Usage, Whitelisted, Note);
            reply.send(Result);
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while updating this user" })
        }
    });

    fastify.post("/delete_user", { schema: { headers: HeadersSchema, body: DeleteUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const Identifier = request.body.identifier;

        if (!await Database.ScriptOwnedByBuyer(request.APIKey, ScriptID)) {
            return reply.status(400).send({ error: "You don't own this script" });
        }

        const Existing = await Database.GetUser(Identifier, ScriptID);
        if (!Existing) {
            return reply.status(400).send({ error: "This user doesn't exist" })
        }

        try {
            await Database.DeleteUser(Existing.id, ScriptID);
            reply.send({ success: true });
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while deleting this user" });
        }
    });


}

module.exports = routes;