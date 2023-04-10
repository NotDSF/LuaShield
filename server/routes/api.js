const database = require("../modules/database");
const webhooks = require("../modules/webhooks");
const crypto = require("../modules/crypto");
const macros = require("../macros/index");
const path = require("path");
const validator = require("email-validator");
const { Luraph } = require("luraph");
const { readFileSync, mkdirSync, writeFileSync, existsSync, rmSync } = require("fs");
const { subscription_data } = require("../config.json");
const { UserWebhook, CheckWebhook } = require("../modules/webhooks");

const Database = new database();
const luraph = new Luraph(process.env.LURAPH_KEY);

function Regex(expression) {
    return new RegExp(expression.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g");
}

function IncrementScriptVersion(version) {
    let Collums = version.slice(1).split(".").map(s => parseInt(s));
    Collums[2]++;

    if (Collums[2] >= 10) {
        Collums[2] = 0;
        Collums[1]++;
    }

    if (Collums[1] >= 10) {
        Collums[1] = 0;
        Collums[0]++;
    }

    return `v${Collums.join(".")}`;
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
            return reply.status(401).send({ error: "Invalid API Key" });
        }

        const Subscription = await Database.GetSubscription(Buyer.SubscriptionID);
        if (Date.now() > Subscription.Expire) {
            return reply.status(402).send({ error: "Your subscription has expired" });
        }

        // reset subscription obfuscations
        if (Date.now() > Subscription.Reset) {
            await Database.ResetSubscriptionObfuscations(Buyer.SubscriptionID);
        }

        request.Subscription = Subscription;
        request.APIKey = APIKey;
        request.Admin = Buyer.Admin;
    }

    const HeadersSchema = {
        type: "object",
        properties: {
            "luashield-api-key": { type: "string" }
        },
        required: ["luashield-api-key"]
    }

    const MakeProjectSchem = {
        type: "object",
        properties: {
            name: { type: "string", maxLength: 30, minLength: 3 },
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
        required: ["name", "success_webhook", "blacklist_webhook", "unauthorized_webhook", "allowed_exploits"]
    }

    const UpdateProjectSchema = {
        type: "object",
        properties: {
            name: { type: "string", maxLength: 30, minLength: 3 },
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
            },
            online: { type: "boolean" }
        }
    }

    const WhiteistUserSchema = {
        type: "object",
        properties: {
            username: { type: "string", maxLength: 20, minLength: 5 },
            expire: { type: "number" },
            max_executions: { type: "number", minimum: 0 },
            whitelisted: { type: "boolean" },
            note: { type: "string", minLength: 3, maxLength: 20 },
            discord_id: { type: "string", minLength: 10, maxLength: 20 }
        },
        required: ["username", "whitelisted"]
    }

    const UpdateUserSchema = {
        type: "object",
        properties: {
            username: { type: "string", maxLength: 20, minLength: 5 },
            whitelisted: { type: "boolean" },
            expire: { type: "number" },
            max_executions: { type: "number", minimum: 0 },
            note: { type: "string", minLength: 3, maxLength: 20 },
            discord_id: { type: "string", minLength: 10, maxLength: 20 }
        },
        required: ["whitelisted", "username"]
    }
    
    const SignupSchema = {
        type: "object",
        properties: {
            email: { type: "string" },
            password: { type: "string", minLength: 6, maxLength: 20 },
            username: { type: "string", minLength: 3, maxLength: 15 },
            subscription_id: { type: "string" }
        },
        required: ["email", "password", "username", "subscription_id"]
    }

    const LoginSchema = {
        type: "object",
        properties: {
            password: { type: "string", minLength: 6, maxLength: 20 },
            username: { type: "string", minLength: 3, maxLength: 15 }
        },
        required: ["password", "username"]
    }

    const UpdateScriptSchema = {
        type: "object",
        properties: {
            script: { type: "string" }, // base 64 encoded,
            script_id: { type: "string" },
            name: { type: "string", maxLength: 30, minLength: 3 }
        },
        required: ["script", "script_id"]
    }

    const AddScriptSchema = {
        type: "object",
        properties: {
            name: { type: "string", maxLength: 30, minLength: 3 },
            script: { type: "string" }, // base 64 encoded,
        },
        required: ["name", "script"]
    }

    const DeleteUserSchema = {
        type: "object",
        properties: {
            username: { type: "string" },
        },
        required: ["username"]
    }

    const ResetKey = {
        type: "object",
        properties: {
            username: { type: "string" }
        },
        required: ["username"]
    }

    const UpdateVersion = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            version: { type: "string" }
        },
        required: ["script_id", "version"]
    }

    const DeleteScript = {
        type: "object",
        properties: {
            script_id: { type: "string" },
        },
        required: ["script_id"]
    }

    const DeleteAccount = {
        type: "object",
        properties: {
            password: { type: "string", minLength: 6, maxLength: 20 },
            username: { type: "string", minLength: 3, maxLength: 15 }
        },
        required: ["password", "username"]
    }

    const ResetPassword = {
        type: "object",
        properties: {
            password: { type: "string", minLength: 6, maxLength: 20 }
        },
        required: ["password"]
    }

    const MakeWebhook = {
        type: "object",
        properties: {
            url: { type: "string", maxLength: 150, minLength: 50 },
            name: { type: "string", maxLength: 30, minLength: 3 }
        },
        required: ["url", "name"]
    }

    const ResponseScema = {
        400: {
            type: "object",
            properties: {
                error: { type: "string" }
            }
        },
        401: {
            type: "object",
            properties: {
                error: { type: "string" }
            }
        },
        500: {
            type: "object",
            properties: {
                error: { type: "string" }
            }
        }
    }

    const StatsResponse = {
        200: {
            type: "object",
            properties: {
                online: { type: "boolean" },
                authentication_speeds: {
                    type: "object",
                    properties: {
                        synapse_x: {
                            type: "object",
                            properties: {
                                average: { type: "number" }
                            }
                        },
                        script_ware: {
                            type: "object",
                            properties: {
                                average: { type: "number" }
                            }
                        },
                        synapse_v3: {
                            type: "object",
                            properties: {
                                average: { type: "number" }
                            }
                        }
                    }
                },
                average_authentication: { type: "number" }
            }
        }
    }

    fastify.get("/stats", { websocket: false, schema: { response: StatsResponse } }, (request, reply) => {
        let Stats = global.AuthenticationStats;
        reply.send({
            online: true,
            authentication_speeds: {
                synapse_x: {
                    average: (Stats.SynapseX.total / Stats.SynapseX.times) || 0
                },
                script_ware: {
                    average: (Stats.ScriptWare.total / Stats.ScriptWare.times) || 0
                },
                synapse_v3: {
                    average: (Stats.SynapseV3.total / Stats.SynapseV3.times) || 0
                }
            },
            average_authentication: (Stats.total / Stats.times) || 0
        })
    })

    fastify.post("/signup", { schema: { body: SignupSchema, response: ResponseScema }, websocket: false }, async (request, reply) => {
        const Email = request.body.email;
        const Password = request.body.password;
        const Username = request.body.username;
        const SubscriptionID = request.body.subscription_id;

        const Subscription = await Database.GetSubscription(SubscriptionID);
        if (!Subscription) {
            return reply.status(400).send({ error: "Invalid subscription id" });
        }

        if (Subscription.Email) {
            return reply.status(400).send({ error: "This subscription is already being used by another user" });
        }

        if (!validator.validate(Email)) {
            return reply.status(400).send({ error: "Email is invalid" });
        }

        if (Username.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your username cannot include special characters" });
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
            await Database.AddBuyer(Email, Username, crypto.sha512(Password), APIKey, SubscriptionID);
            return reply.send({ APIKey: APIKey });
        } catch (er) {
            return reply.status(500).send({ error: "There was an error with creating your account" });
        }
    });

    fastify.post("/login", { schema: { body: LoginSchema, response: ResponseScema }, websocket: false }, async (request, reply) => {
        const Password = request.body.password;
        const Username = request.body.username;
        const Buyer = await Database.GetBuyer(Username, crypto.sha512(Password));

        if (!Buyer) {
            return reply.status(401).send({ error: "Incorrect username or password" });
        }

        const Subscription = await Database.GetSubscription(Buyer.SubscriptionID);
        Buyer.Subscription = Subscription;
        delete Buyer.Password;
        reply.send(Buyer);
    });

    fastify.post("/delete_account", { schema: { body: DeleteAccount, response: ResponseScema }, websocket: false }, async (request, reply) => {
        const Password = request.body.password;
        const Username = request.body.username;
        const Buyer = await Database.GetBuyer(Username, crypto.sha512(Password));

        if (!Buyer) {
            return reply.status(401).send({ error: "Incorrect username or password" });
        }

        try {
            for (let project of Buyer.Projects) {
                if (existsSync(path.join(__dirname, `../../projects/${project}`))) {
                    rmSync(path.join(__dirname, `../../projects/${project}`), { force: true, recursive: true });
                }
                await Database.DeleteProject(project, Buyer.APIKey);
            }

            await Database.DeleteAccount(Buyer.Email);
            reply.send({ success: true })
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "There was an issue while trying to delete your account" });
        }
    });

    fastify.post("/change_password", { schema: { headers: HeadersSchema, body: ResetPassword, response: ResponseScema }, websocket: false }, async (request, reply) => {
        const Buyer = await Database.GetBuyerFromAPIKey(request.headers["luashield-api-key"]);
        const Password = request.body.password;
        
        if (!Buyer) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        if (!Password.match(/[A-Z]+/)) {
            return reply.status(400).send({ error: "Your password must include at least one uppercase letter" })
        }

        try {
            await Database.ResetPassword(Buyer.APIKey, crypto.sha512(Password));
            reply.send({ success: true })
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while trying to reset your password" })
        }
    });

    fastify.get("/account", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        let Info = await Database.GetBuyerFromAPIKey(request.APIKey);
        reply.send(Info);
    });

    // Make Project
    fastify.post("/projects", { schema: { headers: HeadersSchema, body: MakeProjectSchem, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (request.Subscription.Projects >= subscription_data.max_projects) {
            return reply.status(403).send({ error: "You have reached your maximum amount of projects for your account" })
        }
        
        const Name = request.body.name;
        if (Name.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your project name cannot include special characters" });
        }

        const Exploits = request.body.allowed_exploits;

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

        let Information;
        try {
            await Database.SubscriptionIncrementProjectCount(request.Subscription.SubscriptionID, 1);
            Information = await Database.MakeProject(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Exploits, request.APIKey);
            await Database.UpdateBuyerProjects(request.APIKey, Information.id);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while creating this project" });
        }
        
        mkdirSync(path.join(__dirname, `../../projects/${Information.id}`)); // make folder in projects for project
        reply.send(Information);
    });

    // Create Script
    fastify.post("/projects/:id/scripts", { schema: { headers: HeadersSchema, body: AddScriptSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (request.Subscription.Scripts >= subscription_data.max_scripts) {
            return reply.status(403).send({ error: "You have reached your maximum amount of scripts for your account" })
        }

        const ScriptName = request.body.name;
        const ProjectID = request.params.id;
        let Script = request.body.script;

        if (ScriptName.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your script name cannot include special characters" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "This project isn't owned by you" })
        }

        let Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(404).send({ error: "This project doesn't exist" });
        }

        Script = Buffer.from(Script, "base64").toString();
        try {
            Script = await macros(Script, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        const GeneratedVersion = "v1.0.0";
        let Info;
        try {
            await Database.SubscriptionIncrementScriptCount(request.Subscription.SubscriptionID, 1);
            Info = await Database.MakeScript(ProjectID, ScriptName, "v1.0.0");
        } catch (er) {   
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while creating this script" });
        }

        let Whitelist = readFileSync(path.join(__dirname, "../../client/client.lua"), "utf-8")
            .replace(Regex("ws://localhost:8880"), "wss://api.luashield.com")
            .replace(Regex("http://localhost"), "https://api.luashield.com")
            .replace("local function LPH_CRASH() error(\"Blocked crash\"); end;", "")
            .replace("PROJECT_ID", ProjectID)
            .replace("SCRIPT_ID", Info.id)
            .replace("SCRIPT_VERSION", GeneratedVersion)
            .replace("--_SCRIPT_--", Script);

        try {
            Whitelist = await macros(Whitelist);

            const { jobId } = await luraph.createNewJob("main", Whitelist, `${Info.id}.lua`, {
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

            await Database.SubscriptionIncrementObfuscationsCount(request.Subscription.SubscriptionID, 1);
            mkdirSync(path.join(__dirname, `../../projects/${ProjectID}/${Info.id}`));
            writeFileSync(path.join(__dirname, `../../projects/${ProjectID}/${Info.id}/${GeneratedVersion}.lua`), data);

            Info.Loader = `https://luashield.com/s/${ProjectID}/${Info.id}`;
            reply.send(Info);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });

    // Update Existing User 
    fastify.patch("/projects/:id/users", { schema: { headers: HeadersSchema, body: UpdateUserSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Username = request.body.username;
        const Whitelisted = request.body.whitelisted;
        const Expiry = request.body.expire;
        const MaxExecutions = request.body.max_executions;
        const Note = request.body.note;
        const DiscordID = request.body.discord_id;

        if (Expiry && new Date(Expiry * 1000).toString() == "Invalid Date" || Date.now() > (Expiry * 1000)) {
            return reply.status(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(404).send({ error: "This user doesn't exist" });
        }

        if (!Expiry && !MaxExecutions && !Note && !DiscordID && Whitelisted === Existing.Whitelisted) {
            return reply.send(Existing);
        }

        try {
            let Info = await Database.UpdateUser(Existing.id, Expiry ? Expiry * 1000 : Expiry, MaxExecutions, Whitelisted, Note, DiscordID);
            return reply.send(Info);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while updating this user" });
        }
    });

    fastify.post("/projects/:id/users/reset_key", { schema: { headers: Headers, body: ResetKey, response: ResponseScema }, websocket: false,  preHandler: AuthenticationHandler }, async (request, reply) => {
        const Username = request.body.username;
        const ProjectID = request.params.id;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(404).send({ error: "This user doesn't exist" });
        }

        const Key = crypto.randomUUID();
        try {
            await Database.UpdateKey(Existing.id, crypto.sha512(Key));
            reply.send({ Key: Key });
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while resetting this users key" });
        }
    });

    fastify.post("/projects/:id/users/reset_hwid", { schema: { headers: Headers, body: ResetKey, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Username = request.body.username;
        const ProjectID = request.params.id;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(404).send({ error: "This user doesn't exist" });
        }

        if (!Existing.HWID) {
            return reply.status(400).send({ error: "User doesn't have an HWID linked" });
        }

        try {
            let Info = await Database.ResetHWID(Existing.id);
            reply.send({ success: true });
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while resetting this users HWID" });
        }
    });

    // Create User
    fastify.post("/projects/:id/users", { schema: { headers: HeadersSchema, body: WhiteistUserSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Username = request.body.username;
        const Expiry = request.body.expire;
        const MaxExecutions = request.body.max_executions || 0;
        const Whitelisted = request.body.whitelisted;
        const Note = request.body.note;
        const DiscordID = request.body.discord_id;

        if (Username.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "The username cannot contain special characters" });
        }

        if (Expiry && new Date(Expiry * 1000).toString() == "Invalid Date" || Date.now() > (Expiry * 1000)) {
            return reply.stauts(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (Existing) {
            return reply.status(400).send({ error: "A user with this username already exists" })
        }

        const Key = crypto.randomUUID();
        try {
            let Info = await Database.AddUser(Username, crypto.sha512(Key), ProjectID, Expiry ? Expiry * 1000 : undefined, MaxExecutions, Whitelisted, Note, DiscordID);
            Info.Key = Key;
            reply.send(Info);
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue creating this user" });
        }
    });

    // Delete User
    fastify.delete("/projects/:id/users", { schema: { headers: HeadersSchema, body: DeleteUserSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Username = request.body.username;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const User = await Database.GetUser(Username, ProjectID);
        if (!User) {
            return reply.status(404).send({ error: "This user doesn't exist" });
        }

        try {
            await Database.DeleteUser(ProjectID, Username);
            reply.send({ success: true });
        } catch (er) {
            reply.status(500).send({ error: "Something went wrong trying to delete this user" });
        }
    });

    // Update Script
    fastify.patch("/projects/:id/scripts", { schema: { headers: HeadersSchema, body: UpdateScriptSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ScriptName = request.body.name;
        const ProjectID = request.params.id;
        let RawScript = request.body.script;

        if (ScriptName && ScriptName.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your script name cannot include special characters" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(404).send({ error: "This script doesn't exist" });
        }

        RawScript = Buffer.from(RawScript, "base64").toString();
        try {
            RawScript = await macros(RawScript, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        const GeneratedVersion = IncrementScriptVersion(Script.Version);
        let ScriptInfo;
        try {
            ScriptInfo = await Database.UpdateScript(ScriptID, GeneratedVersion, ScriptName);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue with updating this script" });
        }
        
        let Whitelist = readFileSync(path.join(__dirname, "../../client/client.lua"), "utf-8")
            .replace(Regex("ws://localhost:8880"), "wss://api.luashield.com")
            .replace(Regex("http://localhost"), "https://api.luashield.com")
            .replace("local function LPH_CRASH() error(\"Blocked crash\"); end;", "")
            .replace("PROJECT_ID", ProjectID)
            .replace("SCRIPT_ID", ScriptInfo.id)
            .replace("SCRIPT_VERSION", GeneratedVersion)
            .replace("--_SCRIPT_--", RawScript);

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

            await Database.SubscriptionIncrementObfuscationsCount(request.Subscription.SubscriptionID, 1);
            writeFileSync(path.join(__dirname, `../../projects/${ProjectID}/${ScriptInfo.id}/${GeneratedVersion}.lua`), data);
            
            reply.send(ScriptInfo);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });

    // Update Script Version
    fastify.patch("/projects/:id/scripts/version", { schema: { headers: HeadersSchema, body: UpdateVersion, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.params.id;
        const Version = request.body.version;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(404).send({ error: "This script doesn't exist" });
        }

        if (!Script.Versions.find(x => x === Version)) {
            return reply.status(404).send({ error: "This version doesn't exist" });
        }

        try {
            let Info = await Database.UpdateScriptVersion(Script.id, Version);
            reply.send(Info);
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while updating the script version" });
        }
    });

    // Delete Script Version
    fastify.delete("/projects/:id/scripts/version", { schema: { headers: HeadersSchema, body: UpdateVersion, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.params.id;
        const Version = request.body.version;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(404).send({ error: "This script doesn't exist" });
        }

        if (!Script.Versions.find(x => x === Version)) {
            return reply.status(404).send({ error: "This version doesn't exist" });
        }
        
        if (Script.Version === Version) {
            return reply.status(400).send({ error: "You cannot delete the current version" });
        }

        try {
            let Info = await Database.DeleteScriptVersion(ScriptID, Version);
            if (existsSync(path.join(__dirname, `../../projects/${ProjectID}/${Script.id}/${Version}.lua`))) {
                rmSync(path.join(__dirname, `../../projects/${ProjectID}/${Script.id}/${Version}.lua`))
            }
            reply.send(Info);
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "There was an issue trying to delete the script version" });
        }
    });

    // Update Project
    fastify.patch("/projects/:id", { schema: { headers: HeadersSchema, body: UpdateProjectSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Name = request.body.name;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;
        const Exploits = request.body.allowed_exploits;
        const Online = request.body.online;

        if (Name.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your project name cannot include special characters" });
        }

        const Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(404).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "This project isn't owned by you" });
        }

        SuccessWebhook = SuccessWebhook || Project.SuccessWebhook;
        BlacklistWebhook = BlacklistWebhook || Project.BlacklistWebhook;
        UnauthorizedWebhook = UnauthorizedWebhook || Project.UnauthorizedWebhook;

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
            await webhooks.SetupWebhook(SuccessWebhook, Name || Project.Name, "success");
            await webhooks.SetupWebhook(BlacklistWebhook, Name || Project.Name, "blacklist");
            await webhooks.SetupWebhook(UnauthorizedWebhook, Name || Project.Name, "unauthorized");
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        try {
            let Info = await Database.UpdateProject(ProjectID, Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Exploits, Online);
            reply.send(Info);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while updating this project" });
        }
    });
    
    // Get Projects
    fastify.get("/projects", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Projects = await Database.GetProjects(request.APIKey);

        for (Project of Projects) {
            const Scripts = await Database.GetScripts(Project.id);
            Project.Scripts = Scripts;
        }

        reply.send(Projects);
    });

    // Get Project Users
    fastify.get("/projects/:id/users", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Project = await Database.GetProject(ProjectID);

        if (!Project) {
            return reply.status(404).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Users = await Database.GetUsers(ProjectID);
        reply.send(Users);
    });

    // Get Project By Id
    fastify.get("/projects/:id", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Project = await Database.GetProject(ProjectID);

        if (!Project) {
            return reply.status(404).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Scripts = await Database.GetScripts(Project.id);
        Project.Scripts = Scripts;
        reply.send(Project);
    });

    // Delete Project
    fastify.delete("/projects/:id", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;

        const Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(404).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "This project isn't owned by you" });
        }

        try {
            if (existsSync(path.join(__dirname, `../../projects/${ProjectID}/`))) {
                rmSync(path.join(__dirname, `../../projects/${ProjectID}/`), { force: true, recursive: true });
            }

            await Database.SubscriptionIncrementProjectCount(request.Subscription.SubscriptionID, -1);
            await Database.DeleteProject(ProjectID, request.APIKey);
            reply.send({ success: true });
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while trying to delete this project" })
        }
    });

    // Delete Script
    fastify.delete("/projects/:id/scripts", { schema: { headers: HeadersSchema, body: DeleteScript, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.params.id;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(403).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(404).send({ error: "This script doesn't exist" });
        }

        try {
            if (existsSync(path.join(__dirname, `../../projects/${ProjectID}/${ScriptID}`))) {
                rmSync(path.join(__dirname, `../../projects/${ProjectID}/${ScriptID}`), { force: true, recursive: true });
            }

            await Database.SubscriptionIncrementScriptCount(request.Subscription.SubscriptionID, -1);
            await Database.DeleteScript(ScriptID);
            reply.send({ success: true });
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue trying to delete this script" });
        }
    });

    // Create Webhook
    fastify.post("/webhooks", { schema: { headers: HeadersSchema, body: MakeWebhook, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const WebhookName = request.body.name;
        let Url = request.body.url;

        if (WebhookName.match(/[^A-z 0-9]/)) {
            return reply.status(400).send({ error: "Your webhook name cannot include special characters" });
        }

        Url = Url.match(/discord\.com\/api\/webhooks\/\d+\/[\S]+$/);
        if (!Url) {
            return reply.status(400).send({ error: "url is not a valid webhook" });
        }

        Url = "https://" + Url.shift();
        
        try {
            await CheckWebhook(Url);
        } catch (er) {
            return reply.status(400).send({ error: er.toString() });
        }

        let Token = crypto.randomUUID();
        try {
            await Database.CreateWebhook(Url, Token, WebhookName, request.APIKey);
            await Database.UpdateBuyerWebhooks(Token, request.APIKey);

            reply.send({ url: `https://api.luashield.com/webhooks/${Token}`, token: Token });
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "Failed to create webhook" });
        }
    });

    fastify.delete("/webhooks/:id", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Token = request.params.id;
        const Webhook = await Database.GetWebhook(Token);

        if (!Webhook) {
            return reply.status(400).send({ error: "This webhook doesn't exist" });
        }

        if (Webhook.Owner !== request.APIKey) {
            return reply.status(404).send({ error: "You don't own this webhook" });
        }

        try {
            await Database.DeleteWebhook(Token, request.APIKey);
            reply.send({ success: true });
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "Failed to delete webhook" })
        }
    });

    // Get Webhooks
    fastify.get("/webhooks", { schema: { headers: HeadersSchema, response: ResponseScema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Webhooks = await Database.GetWebhooks(request.APIKey);
        reply.send(Webhooks);
    });

    const WebhookSchema = {
        type: "object",
        properties: {
            ["LuaShield-Access-Token"]: { type: "string" }
        },
        required: ["LuaShield-Access-Token"]
    }

    // Webhook Request
    fastify.post("/webhooks/:token", { schema: { headers: WebhookSchema, response: ResponseScema }, websocket: false }, async (request, reply) => {
        const Token = request.params.token;
        const AccessToken = request.headers["luashield-access-token"];

        const Webhook = await Database.GetWebhook(Token);
        if (!Webhook) {
            return reply.status(400).send({ error: "This webhook doesn't exist" });
        }

        if (!global.WebhookTokens.has(AccessToken)) {
            return reply.status(400).send({ error: "Invalid access token" })
        }

        if (!request.body) {
            return reply.status(400).send({ error: "Must have body" });
        }

        try {
            await UserWebhook(Webhook.Url, request.body);
        } catch (er) {
            console.log(er);
        }
        
        reply.send({ success: true });
    });


    // admin shit

    const CreateSubscription = {
        type: "object",
        properties: {
            months: { type: "number" },
            auth: { type: "string" }
        },
        required: ["months"]
    }

    const SetAdmin = {
        type: "object",
        properties: {
            username: { type: "string" },
            auth: { type: "string" },
            email: { type: "string" },
            password: { type: "string" }
        },
        required: ["username", "auth", "email", "password"]
    }

    const DeleteBuyer = {
        type: "object",
        properties: {
            email: { type: "string" }
        },
        required: ["email"]
    }

    fastify.get("/admin/stats", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        let Info = await Database.GetAdminStats();
        reply.send(Info);
    })

    fastify.get("/admin/subscriptions", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        let Info = await Database.GetSubscriptions();
        reply.send(Info);
    });

    fastify.get("/admin/buyers", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        let Info = await Database.GetBuyers();
        reply.send(Info);
    });

    fastify.delete("/admin/buyers", { schema: { headers: HeadersSchema, body: DeleteBuyer }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        const Email = request.body.email;
        const Buyer = await Database.GetBuyerFromEmail(Email);

        if (!Buyer) {
            return reply.status(400).send({ error: "This buyer doesn't exist" });
        }

        if (Buyer.Admin) {
            return reply.status(400).send({ error: "You cannot delete an admin account" });
        }

        try {
            for (let project of Buyer.Projects) {
                if (existsSync(path.join(__dirname, `../../projects/${project}`))) {
                    rmSync(path.join(__dirname, `../../projects/${project}`), { force: true, recursive: true });
                }
                await Database.DeleteProject(project, Buyer.APIKey);
            }

            await Database.DeleteAccount(Email);
            reply.send({ success: true });
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while trying to delete this buyer" });
        }
    });

    // Create Subscription
    fastify.post("/admin/subscriptions", { schema: { headers: HeadersSchema, body: CreateSubscription }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        const Months = request.body.months;

        const Expire = new Date();
        Expire.setMonth(Expire.getMonth() + Months);

        const Reset = new Date();
        Reset.setMonth(Reset.getMonth() + 1);

        try {
            let Info = await Database.CreateSubscription(Expire.getTime(), Reset.getTime());
            reply.send(Info);
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "There was an issue while creating this subscription" });
        }
    });

    // Update Subscriotion
    fastify.patch("/admin/subscriptions/:id", { schema: { headers: HeadersSchema, body: CreateSubscription }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        if (!request.Admin) {
            return reply.status(401).send({ error: "Your account needs admin privileges" });
        }

        const SubscriptionID = request.params.id;
        const Months = request.body.months;

        const Subscription = await Database.GetSubscription(SubscriptionID);
        if (!Subscription) {
            return reply.status(401).send({ error: "This subscription doesn't exist" })
        }

        const Expire = new Date();
        Expire.setMonth(Expire.getMonth() + Months);

        const Reset = new Date();
        Reset.setMonth(Reset.getMonth() + 1);

        try {
            let Info = await Database.UpdateSubscription(Subscription.SubscriptionID, Expire.getTime(), Reset.getTime());
            reply.send(Info);
        } catch (er) {
            console.log(er);
            reply.status(500).send({ error: "There was an issue while updating this subscription" });
        }
    });

    // internal endpoint

    fastify.post("/create_admin", { schema: { body: SetAdmin }, websocket: false }, async (request, reply) => {
        const Username = request.body.username;
        const Email = request.body.email;
        const Password = request.body.password;
        const Auth = request.body.auth;

        if (Auth !== process.env.ADMIN_KEY) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        if (await Database.GetBuyerFromEmail(Email)) {
            return reply.status(400).send({ error: "This email is already registered to another user" });
        }

        if (await Database.GetBuyerFromUsername(Username)) {
            return reply.status(400).send({ error: "This username is already associated with another account" })
        }

        const Expire = new Date();
        Expire.setMonth(Expire.getMonth() + 200);

        const Reset = new Date();
        Reset.setMonth(Reset.getMonth() + 1);

        const APIKey = crypto.randomUUID();
        try {
            let Info = await Database.CreateSubscription(Expire.getTime(), Reset.getTime());
            let Buyer = await Database.CreateAdminBuyer(Email, Username, crypto.sha512(Password), APIKey, Info.SubscriptionID);
            reply.send(Buyer);
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was a problem while updating this user" })
        }
    });
}

module.exports = routes;