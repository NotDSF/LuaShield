const database = require("../modules/database");
const webhooks = require("../modules/webhooks");
const crypto = require("../modules/crypto");
const macros = require("../macros/index");
const path = require("path");
const validator = require("email-validator");
const { Luraph } = require("luraph");
const { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync, rmSync } = require("fs");

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

    const MakeProjectSchem = {
        type: "object",
        properties: {
            name: { type: "string", maxLength: 20, minLength: 3 },
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
            project_id: { type: "string" },
            name: { type: "string", maxLength: 20, minLength: 3 },
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
        },
        required: ["project_id"]
    }

    const WhiteistUserSchema = {
        type: "object",
        properties: {
            project_id: { type: "string" },
            username: { type: "string", maxLength: 20, minLength: 5 },
            expire: { type: "number" },
            max_executions: { type: "number", minimum: 0 },
            whitelisted: { type: "boolean" },
            note: { type: "string", minLength: 3, maxLength: 20 }
        },
        required: ["project_id", "username", "whitelisted"]
    }

    const UpdateUserSchema = {
        type: "object",
        properties: {
            project_id: { type: "string" },
            username: { type: "string" },
            whitelisted: { type: "boolean" },
            expire: { type: "number" },
            max_executions: { type: "number", minimum: 0 },
            note: { type: "string", minLength: 3, maxLength: 20 }
        },
        required: ["whitelisted", "project_id", "username"]
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
            script: { type: "string" }, // base 64 encoded,
            script_id: { type: "string" },
            project_id: { type: "string" }
        },
        required: ["script", "script_id", "project_id"]
    }

    const AddScriptSchema = {
        type: "object",
        properties: {
            name: { type: "string", maxLength: 20, minLength: 3 },
            script: { type: "string" }, // base 64 encoded,
            project_id: { type: "string" }
        },
        required: ["name", "script", "project_id"]
    }

    const DeleteUserSchema = {
        type: "object",
        properties: {
            username: { type: "string" },
            project_id: { type: "string" }
        },
        required: ["project_id", "username"]
    }

    const ResetKey = {
        type: "object",
        properties: {
            username: { type: "string" },
            project_id: { type: "string" }
        },
        required: ["project_id", "username"]
    }

    const UpdateVersion = {
        type: "object",
        properties: {
            script_id: { type: "string" },
            project_id: { type: "string" },
            version: { type: "string" }
        },
        required: ["script_id", "project_id", "version"]
    }

    const DeleteProject = {
        type: "object",
        properties: {
            project_id: { type: "string" }
        },
        required: ["project_id"]
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

        delete Buyer.Password;
        reply.send(Buyer);
    });

    fastify.get("/valid_api_key", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, (request, reply) => reply.send({ success: true }));

    fastify.post("/make_project", { schema: { headers: HeadersSchema, body: MakeProjectSchem }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Name = request.body.name;
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
            Information = await Database.MakeProject(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Exploits, request.APIKey);
            await Database.UpdateBuyerProjects(request.APIKey, Information.id);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while creating this project" });
        }
        
        mkdirSync(path.join(__dirname, `../../projects/${Information.id}`)); // make folder in projects for project
        reply.send(Information);
    });

    fastify.post("/add_script", { schema: { headers: HeadersSchema, body: AddScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptName = request.body.name;
        const ProjectID = request.body.project_id;
        let Script = request.body.script;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "This project isn't owned by you" })
        }

        let Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(400).send({ error: "This project doesn't exist" });
        }

        Script = Buffer.from(Script, "base64").toString();
        try {
            Script = await macros(Script, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }

        const GeneratedVersion = `v${crypto.randomUUID().substr(0, 5)}`;
        let Info;
        try {
            Info = await Database.MakeScript(ProjectID, ScriptName, GeneratedVersion);
        } catch (er) {   
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while creating this script" });
        }

        let Whitelist = readFileSync(path.join(__dirname, "../../client/client.lua"), "utf-8")
            .replace(Regex("ws://localhost:8880", "wss://luashield.com"))
            .replace("local function LPH_CRASH() error(\"Blocked crash\"); end;", "")
            .replace("PROJECT_ID", ProjectID)
            .replace("SCRIPT_ID", Info.id)
            .replace("--_SCRIPT_--", Script);

        try {
            Whitelist = await macros(Whitelist);

            /*
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
            */

            mkdirSync(path.join(__dirname, `../../projects/${ProjectID}/${Info.id}`));
            writeFileSync(path.join(__dirname, `../../projects/${ProjectID}/${Info.id}/${GeneratedVersion}.lua`), Whitelist);
            Info.Loader = `https://luashield.com/s/${ProjectID}/${Info.id}`;
            reply.send(Info);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });

    fastify.post("/update_user", { schema: { headers: HeadersSchema, body: UpdateUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.body.project_id;
        const Username = request.body.username;
        const Whitelisted = request.body.whitelisted;
        const Expiry = request.body.expire;
        const MaxExecutions = request.body.max_executions;
        const Note = request.body.note;

        if (Expiry && new Date(Expiry * 1000).toString() == "Invalid Date" || Date.now() > (Expiry * 1000)) {
            return reply.status(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(400).send({ error: "This user doesn't exist" });
        }

        if (!Expiry && !MaxExecutions && !Note && Whitelisted === Existing.Whitelisted) {
            return reply.send(Existing);
        }

        try {
            let Info = await Database.UpdateUser(Existing.id, Expiry ? Expiry * 1000 : Expiry, MaxExecutions, Whitelisted, Note);
            return reply.send(Info);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue while updating this user" });
        }
    });

    fastify.post("/reset_key", { schema: { headers: Headers, body: ResetKey }, websocket: false,  preHandler: AuthenticationHandler }, async (request, reply) => {
        const Username = request.body.username;
        const ProjectID = request.body.project_id;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(400).send({ error: "This user doesn't exist" });
        }

        const Key = crypto.randomUUID();
        try {
            await Database.UpdateKey(Existing.id, crypto.sha512(Key));
            reply.send({ Key: Key });
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while resetting this users key" });
        }
    });

    fastify.post("/reset_hwid", { schema: { headers: Headers, body: ResetKey }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Username = request.body.username;
        const ProjectID = request.body.project_id;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (!Existing) {
            return reply.status(400).send({ error: "This user doesn't exist" });
        }

        if (!Existing.HWID) {
            return reply.status(400).send({ error: "User doesn't have an HWID linked" });
        }

        try {
            let Info = await Database.ResetHWID(Existing.id);
            reply.send(Info);
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while resetting this users HWID" });
        }
    });

    fastify.post("/add_user", { schema: { headers: HeadersSchema, body: WhiteistUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.body.project_id;
        const Username = request.body.username;
        const Expiry = request.body.expire;
        const MaxExecutions = request.body.max_executions || 0;
        const Whitelisted = request.body.whitelisted;
        const Note = request.body.note;

        if (Expiry && new Date(Expiry * 1000).toString() == "Invalid Date" || Date.now() > (Expiry * 1000)) {
            return reply.stauts(400).send({ error: "Expire must be a valid unix epoch timestamp" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Existing = await Database.GetUser(Username, ProjectID);
        if (Existing) {
            return reply.status(400).send({ error: "A user with this username already exists" })
        }

        const Key = crypto.randomUUID();
        try {
            let Info = await Database.AddUser(Username, crypto.sha512(Key), ProjectID, Expiry ? Expiry * 1000 : undefined, MaxExecutions, Whitelisted, Note);
            Info.Key = Key;
            reply.send(Info);
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue creating this user" });
        }
    });

    fastify.post("/delete_user", { schema: { headers: HeadersSchema, body: DeleteUserSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.body.project_id;
        const Username = request.body.username;

        try {
            await Database.DeleteUser(ProjectID, Username);
            reply.send({ success: true });
        } catch (er) {
            reply.status(500).send({ error: "Something went wrong trying to delete this user" });
        }
    });

    fastify.post("/update_script", { schema: { headers: HeadersSchema, body: UpdateScriptSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.body.project_id;
        let RawScript = request.body.script;
        const Version = request.body.version;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(400).send({ error: "This script doesn't exist" });
        }

        const GeneratedVersion = `v${crypto.randomUUID().substr(0, 5)}`;
        let ScriptInfo;

        try {
            ScriptInfo = await Database.UpdateScript(ScriptID, GeneratedVersion);
        } catch (er) {
            return reply.status(500).send({ error: "There was an issue with updating this script" });
        }

        RawScript = Buffer.from(RawScript, "base64").toString();
        try {
            RawScript = await macros(RawScript, true);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
        
        let Whitelist = readFileSync(path.join(__dirname, "../../client/client.lua"), "utf-8")
            .replace(Regex("ws://localhost:8880", "wss://luashield.com"))
            .replace("local function LPH_CRASH() error(\"Blocked crash\"); end;", "")
            .replace("PROJECT_ID", ProjectID)
            .replace("SCRIPT_ID", ScriptInfo.id)
            .replace("--_SCRIPT_--", RawScript);

        try {
            Whitelist = await macros(Whitelist);

            /*
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
            */

            writeFileSync(path.join(__dirname, `../../projects/${ProjectID}/${ScriptInfo.id}/${GeneratedVersion}.lua`), Whitelist);
            reply.send(ScriptInfo);
        } catch (er) {
            return reply.status(500).send({ error: er.toString() });
        }
    });

    fastify.post("/update_version", { schema: { headers: HeadersSchema, body: UpdateVersion }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.body.project_id;
        const Version = request.body.version;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(400).send({ error: "This script doesn't exist" });
        }

        if (!Script.Versions.find(x => x === Version)) {
            return reply.status(400).send({ error: "This version doesn't exist" });
        }

        try {
            let Info = await Database.UpdateScriptVersion(Script.id, Version);
            reply.send(Info);
        } catch (er) {
            reply.status(500).send({ error: "There was an issue while updating the script version" });
        }
    });

    fastify.post("/delete_version", { schema: { headers: HeadersSchema, body: UpdateVersion }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ScriptID = request.body.script_id;
        const ProjectID = request.body.project_id;
        const Version = request.body.version;

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Script = await Database.GetScript(ProjectID, ScriptID);
        if (!Script) {
            return reply.status(400).send({ error: "This script doesn't exist" });
        }

        if (!Script.Versions.find(x => x === Version)) {
            return reply.status(400).send({ error: "This version doesn't exist" });
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

    fastify.post("/update_project", { schema: { headers: HeadersSchema, body: UpdateProjectSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.body.project_id;
        const Name = request.body.name;
        let SuccessWebhook = request.body.success_webhook;
        let BlacklistWebhook = request.body.blacklist_webhook;
        let UnauthorizedWebhook = request.body.unauthorized_webhook;
        const Exploits = request.body.allowed_exploits;
        const Online = request.body.online;

        const Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(400).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "This project isn't owned by you" });
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
    
    fastify.get("/projects", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const Projects = await Database.GetProjects(request.APIKey);

        for (Project of Projects) {
            const Scripts = await Database.GetScripts(Project.id);
            Project.Scripts = Scripts;
        }

        reply.send(Projects);
    });

    fastify.get("/:id/users", { schema: { headers: HeadersSchema }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.params.id;
        const Project = await Database.GetProject(ProjectID);

        if (!Project) {
            return reply.status(400).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "You don't own this project" });
        }

        const Users = await Database.GetUsers(ProjectID);
        reply.send(Users);
    });

    fastify.post("/delete_project", { schema: { headers: HeadersSchema, body: DeleteProject }, websocket: false, preHandler: AuthenticationHandler }, async (request, reply) => {
        const ProjectID = request.body.project_id;

        const Project = await Database.GetProject(ProjectID);
        if (!Project) {
            return reply.status(400).send({ error: "This project doesn't exist" });
        }

        if (!await Database.ProjectOwnedByBuyer(request.APIKey, ProjectID)) {
            return reply.status(400).send({ error: "This project isn't owned by you" });
        }

        try {
            await Database.DeleteProject(ProjectID, request.APIKey);
            reply.send({ success: true });
        } catch (er) {
            console.log(er);
            return reply.status(500).send({ error: "There was an issue while trying to delete this project" })
        }
    });

    
}

module.exports = routes;