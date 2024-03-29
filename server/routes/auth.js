const sodium = require("libsodium-wrappers");
const EncodeJSON = require("../modules/json");
const endpoints = require("../modules/endpoint");
const config = require("../config.json");
const flag = require("../modules/flag");
const database = require("../modules/database");
const crypto = require("../modules/crypto");
const webhooks = require("../modules/webhooks");

let Blacklisted = new Set();
let WhitelistJSXToken = new Map();

const PublicKey = Buffer.from("qgq26x4+4FWdLzRpGZytZfEQJlOeusryQC8ppC2BEVA=", "base64");
const Database = new database();
let WhitelistTracepath = new Map();

function CheckTracepath(HWID, Name) {
	let Trace = WhitelistTracepath.get(HWID);
	if (!Trace || !Trace[Name]) return;
	return true;
}

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
	await sodium.ready;

	fastify.addHook("preHandler", (request, reply, done) => {
		request.IPAddress = request.headers["cf-connecting-ip"] || request.ip;
		
		const UserAgent = request.headers["user-agent"];
		if (UserAgent == "Roblox/WinInet") {
			return done();
		}

		if (Blacklisted.has(request.IPAddress)) {
			return reply.status(502);
		}

		const Exploit = UserAgent.includes("/") ? UserAgent.split("/").shift() : UserAgent.split(" ").shift();

		switch (Exploit) {
			case "sx": // v3
			case "synx": {  // v2
				const HWID = request.headers["syn-fingerprint"];
				const UD = request.headers["syn-user-identifier"];
				const RequestSignature = request.headers["syn-signature"];

				// Synapse Signature not included in synapse v3 request (fatal)
				if (Exploit === "sx") {
					try {
						const Signature = Buffer.from(RequestSignature, "base64");
						const Data = JSON.parse(sodium.crypto_sign_open(Signature, PublicKey, "text"));

						if (HWID !== Data.fingerprint || UD !== Data.userIdentifier) {
							Blacklisted.add(request.IPAddress);
							return reply.status(502);
						}

						request.Signature = Data;
						request.Exploit = "Synapse V3";
					} catch (er) {
						console.log(er);
						return reply.status(500);
					}
				} else {
					request.Exploit = "Synapse X";
				}

				request.HWID = HWID;
				request.UserID = UD;
				break;
			}

			case "ScriptWare": {
				request.HWID = request.headers["sw-fingerprint"];
				request.UserID = request.headers["sw-user-identifier"];
				request.Exploit = "Script Ware";
				break;
			}

			// Client should never reach this point due to CF rules.
			default:
				return reply.status(500).send({ status: false })
		}

		done();
	});

	fastify.get("/info", async (request, reply) => {
		if (!request.Exploit) return;

		if (!CheckTracepath(request.HWID, "version")) return reply.status(500);
		WhitelistTracepath.set(request.HWID, { info: true });

		const ProjectID = request.headers[config.headers_auth_info.projectid];
		const ScriptID = request.headers[config.headers_auth_info.scriptid];
		const Key = request.headers[config.headers_auth_info.key];

		if (!ScriptID && !Key && !ProjectID) {
			return reply.status(500);
		}

		const Project = await Database.GetProject(ProjectID);
		const Script = await Database.GetScript(ProjectID, ScriptID);

		if (!Project && !Script) return reply.status(500);

		const WhitelistHWID = await Database.GetWhitelistWithHWID(request.HWID);
		const WhitelistKey = await Database.GetWhitelist(crypto.sha512(Key));
		const JSXToken = WhitelistJSXToken.get(request.IPAddress);
		if (JSXToken) {
			WhitelistJSXToken.delete(request.IPAddress);
		}

		reply.send(EncodeJSON({
			a: WhitelistHWID ? 1 : 0,
			d: WhitelistKey ? 1 : 0,
			b: +(!Project.SynapseX && request.Exploit === "Synapse X" || !Project.ScriptWare && request.Exploit === "Script Ware" || !Project.SynapseV3 && request.Exploit === "Synapse V3"),
			c: Project.Online ? 1 : 0,
			e: Script.Version,
			f: JSXToken ? 1 : 0
		}))
	})

	fastify.get(`/${config.endpointsname}`, (request, reply) => {
		if (!request.Exploit) return;
		
		if (!CheckTracepath(request.HWID, "info")) return reply.status(500);
		WhitelistTracepath.set(request.HWID, { endpoints: true });

		reply.send(EncodeJSON({
			1: endpoints.Vendor,
			2: {
				1: request.HWID,
				2: request.UserID
			}
		}, request.HWID));
	});

	fastify.get(`/${endpoints.Info.Flags}`, (request, reply) => {
		if (!request.Exploit) return;

		if (!CheckTracepath(request.HWID, "endpoints")) return reply.status(500);
		WhitelistTracepath.set(request.HWID, { flags: true });

		const Flag = flag.generate();
		reply.send(EncodeJSON(Flag, request.HWID));
	});

	fastify.get(`/${endpoints.Info.WhitelistMain}`, async (request, reply) => {
		if (!request.Exploit) return reply.status(500);
		if (!CheckTracepath(request.HWID, "flags")) return reply.status(500);
		WhitelistTracepath.delete(request.HWID);

		const Fingerprint = request.headers[config.headers.fingerprint];
		const NumberID = request.headers[config.headers.numberid];
		const ServerID = request.headers[config.headers.serverid];
		const ProjectID = request.headers[config.headers.projectid];
		const RecievedWS = request.headers[config.headers.websocketid];
		const ScriptIdentifier = request.headers[config.headers.scriptid];
		let Duration = request.headers[config.headers.duration];
		const UserID = request.UserID;
		const HWID = request.HWID;
		const Query = Object.values(request.query);
		const Key = Query[1];
		const RequestHash = Query[2];
		const WebsocketKey = Connected.get(request.IPAddress === "::1" ? "127.0.0.1" : request.IPAddress);

		// check if all values were inputted
		if (!Fingerprint || !NumberID || !ServerID || !UserID || !HWID || !Key || !WebsocketKey || !Duration || !RequestHash || !ProjectID || !RecievedWS || !ScriptIdentifier) {
			return reply.status(502)
		}

		Duration = parseFloat(Duration);

		// check if serverid is correct and duration is a valid int
		if (ServerID !== config.serverid || !Duration || Duration > 99) {
			return reply.status(502)
		}

		const Whitelist = await Database.GetWhitelist(crypto.sha512(Key));
		const Project = await Database.GetProject(ProjectID);
		const Flag = flag.getFlag(Fingerprint, NumberID);

		if (!Project || !Project.Online) {
			return reply.status(502)
		}

		const Script = await Database.GetScript(ProjectID, ScriptIdentifier);

		if (!Script) {
			await webhooks.Unauthorized(Project.UnauthorizedWebhook, {
				IP: request.IPAddress,
				Reason: `This user tried running a LuaShield script with an unknown SID (Script ID)`
			});
			return reply.status(502)
		}

		if (!Project.SynapseX && request.Exploit === "Synapse X" || !Project.ScriptWare && request.Exploit === "Script Ware" || !Project.SynapseV3 && request.Exploit === "Synapse V3") {
			await webhooks.Unauthorized(Project.UnauthorizedWebhook, {
				IP: request.IPAddress,
				Reason: `This user tried running this script on a disallowed exploit (${request.Exploit}), username: ${Whitelist.Username}`
			});
			return reply.status(502)
		}

		if (Whitelist) {
			if (!Whitelist.Whitelisted) {
				return reply.status(502)
			}

			if (Whitelist.ProjectID !== ProjectID) {
				return reply.status(502)
			}

			if (Whitelist.HWID && HWID !== Whitelist.HWID) {
				return reply.status(502)
			}

			if (!Whitelist.HWID) {
				try {
					await Database.UpdateUserHWID(Whitelist, HWID);
					Whitelist.HWID = HWID;
				} catch (er) {
					console.log(er);
					return reply.status(502)
				}
			}

			if (Whitelist.Exploit !== request.Exploit) {
				try {
					await Database.UpdateUserExploit(Whitelist, request.Exploit);
					Whitelist.Exploit = request.Exploit;
				} catch (er) {
					console.log(er);
					return reply.status(502)
				}
			}

			if (Whitelist.ExpireAt && Date.now() <= Whitelist.ExpireAt) {
				await webhooks.Unauthorized(Project.UnauthorizedWebhook, {
					IP: request.IPAddress,
					Reason: `This user's whitelist has expired, username: \`${Whitelist.Username}\``
				});
				return reply.status(502)
			}

			if (Whitelist.MaxExecutions !== 0 && Whitelist.Executions >= Whitelist.MaxExecutions) {
				await webhooks.Unauthorized(Project.UnauthorizedWebhook, {
					IP: request.IPAddress,
					Reason: `This user has reached their maximum amount of executions (${Whitelist.MaxExecutions}), username: \`${Whitelist.Username}\``
				});
				return reply.status(502)
			}
		}

		if (WebsocketKey !== RecievedWS || !Flag) {
			if (Whitelist) {
				await webhooks.Blacklist(Project.BlacklistWebhook, {
					IP: request.IPAddress,
					Flag: `${Fingerprint} ${NumberID}`,
					WebsocketID: RecievedWS,
					Reason: `User supplied invalid authentication keys`,
					Whitelist: Whitelist
				});

				try {
					await Database.IncrementUserCracks(Whitelist, ProjectID);
				} catch (er) {
					console.log(er);
				}
			}

			return reply.status(502);
		}
		
		if (!Whitelist) {
			await webhooks.Unauthorized(Project.UnauthorizedWebhook, {
				IP: request.IPAddress,
				Reason: "User tried to run script without a whitelist"
			});
			return reply.status(502);
		}

		let JSXToken = crypto.randomstr(50);
		let WebhookToken = crypto.randomstr(50);

		Connected.delete(request.IPAddress === "::1" ? "127.0.0.1" : request.IPAddress);
		WhitelistJSXToken.set(request.IPAddress, {
			Timestamp: Date.now() / 1000,
			Token: JSXToken,
			ProjectID: ProjectID,
			ScriptID: ScriptIdentifier,
			WebhookToken: WebhookToken
		});

		global.WebhookTokens.add(WebhookToken);

		let Stats = global.AuthenticationStats[request.Exploit.replace(/ /g, "")];
		Stats.times++;
		Stats.total += Duration;

		let GlobalStats = global.AuthenticationStats;
		GlobalStats.times++;
		GlobalStats.total += Duration;

		reply.send(EncodeJSON({
			error: false,
			[crypto.randomstr(10)]: [
				`${HWID}${endpoints.Info.WhitelistSplice}${NumberID*2}${Fingerprint}${endpoints.Info.FlagsSlice}${ServerID.length}${UserID}`,
				Fingerprint,
				config.scriptid,
				Flag.reqId,
				crypto.hashstr(WebsocketKey),
				crypto.hashstr(ProjectID),
				RequestHash,
				JSXToken,
				Script.Name,
				Script.Version,
				Whitelist.Exploit,
				Whitelist.Executions,
				Whitelist.CrackAttempts,
				Whitelist.Username,
				WebhookToken
			]
		}, request.HWID));

		try {
			await Database.IncrememntUserExecutions(Whitelist, ProjectID);
		} catch (er) {
			console.log(er);
		}

		await webhooks.Success(Project.SuccessWebhook, {
			IP: request.IPAddress,
			UserAgent: request.headers["user-agent"],
			Whitelist: Whitelist,
			Duration: Duration,
			Project: Project.Name,
			Script: Script.Name
		})
	});

	fastify.get("/version", (request, reply) => {
		if (!request.Exploit) return;
		WhitelistTracepath.set(request.HWID, {
			version: true
		});

		reply.send(config.version)
	});

	fastify.get("/v/:id", async (request, reply) => {
		const Token = request.params.id;
		const HWID = request.HWID;

		if (!Token || !HWID) {
			return reply.status(400).send("");
		}

		const Data = WhitelistJSXToken.get(request.IPAddress);
		if (!Data || Data.Token !== Token) {
			return reply.status(400).send("");
		}

		const Project = await Database.GetProject(Data.ProjectID);
		if (!Project || !Project.Online) {
			return reply.status(400).send("");
		}

		const Script = await Database.GetScript(Data.ProjectID, Data.ScriptID);
		if (!Script) {
			return reply.status(400).send("");
		}

		const NewToken = crypto.randomstr(50);
		Data.Timestamp = Date.now() / 1000;
		Data.Token = NewToken;

		const Whitelist = await Database.GetWhitelistWithHWID(HWID);
		if (!Whitelist || !Whitelist.Whitelisted) {
			Data.Token = crypto.randomstr(50);
		}

		if (Blacklisted.has(request.IPAddress)) {
			Data.Token = crypto.randomstr(50);
		}

		WhitelistJSXToken.set(request.IPAddress, Data);
		reply.send(EncodeJSON({ Token: NewToken, Version: config.version }, HWID));
	});
}

setInterval(() => {
	WhitelistJSXToken.forEach((value, key) => {
		if ((Date.now() / 1000) - value.Timestamp > 15) {
			global.WebhookTokens.delete(value.WebhookToken);
			WhitelistJSXToken.delete(key);
		}
	});
}, 5000)

module.exports = routes;