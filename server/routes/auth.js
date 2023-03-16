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

/**
 * @param {import("fastify").FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
*/
async function routes(fastify, options) {	
	await sodium.ready;

	fastify.addHook("preHandler", (request, reply, done) => {
		const UserAgent = request.headers["user-agent"];
		if (UserAgent == "Roblox/WinInet") {
			return done();
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
							Blacklisted.add(request.ip);
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

	fastify.get(`/${config.endpointsname}`, (request, reply) => {
		if (!request.Exploit) return;
		
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

		const Flag = flag.generate();
		reply.send(EncodeJSON(Flag, request.HWID));
	});

	fastify.get(`/${endpoints.Info.WhitelistMain}`, async (request, reply) => {
		const Fingerprint = request.headers[config.headers.fingerprint];
		const NumberID = request.headers[config.headers.numberid];
		const ServerID = request.headers[config.headers.serverid];
		const ScriptID = request.headers["script"];
		const RecievedWS = request.headers[config.headers.websocketid];
		let Duration = request.headers[config.headers.duration];
		const UserID = request.UserID;
		const HWID = request.HWID;
		const Query = Object.values(request.query);
		const Key = Query[1];
		const RequestHash = Query[2];
		const WebsocketKey = Connected.get(request.ip === "::1" ? "127.0.0.1" : request.ip);

		// check if all values were inputted
		if (!Fingerprint || !NumberID || !ServerID || !UserID || !HWID || !Key || !WebsocketKey || !Duration || !RequestHash || !ScriptID || !RecievedWS) {
			return reply.status(502);
		}

		Duration = parseFloat(Duration);

		// check if serverid is correct and duration is a valid int
		if (ServerID !== config.serverid || !Duration || Duration > 99) {
			return reply.status(502);
		}

		const Whitelist = await Database.GetWhitelist(crypto.sha512(Key));
		const Script = await Database.GetScript(ScriptID);
		const Flag = flag.getFlag(Fingerprint, NumberID);

		if (!Script || !Script.Online) {
			return reply.status(502);
		}

		if (Whitelist) {
			if (!Whitelist.Whitelisted) {
				return reply.status(502);
			}

			if (Whitelist.ScriptID !== ScriptID) {
				return reply.status(502);
			}

			if (Whitelist.HWID && HWID !== Whitelist.HWID) {
				return reply.status(502);
			}

			if (!Whitelist.HWID) {
				try {
					await Database.UpdateUserHWID(Whitelist, HWID);
					Whitelist.HWID = HWID;
				} catch (er) {
					console.log(er);
					return reply.status(502);
				}
			}

			if (Whitelist.Exploit !== request.Exploit) {
				try {
					await Database.UpdateUserExploit(Whitelist, request.Exploit);
					Whitelist.Exploit = request.Exploit;
				} catch (er) {
					console.log(er);
					return reply.status(502);
				}
			}

			if (Whitelist.ExpireAt && Date.now() <= Whitelist.ExpireAt) {
				await webhooks.Unauthorized(Script.UnauthorizedWebhook, {
					IP: request.ip,
					Reason: `This user's whitelist has expired, identifier: \`${Whitelist.Identifier}\``
				});
				return reply.status(502);
			}

			if (Whitelist.MaxExecutions !== 0 && Whitelit.Executions >= Whitelist.MaxExecutions) {
				await webhooks.Unauthorized(Script.UnauthorizedWebhook, {
					IP: request.ip,
					Reason: `This user has reached their maximum amount of executions (${Whitelist.MaxExecutions}), identifier: \`${Whitelist.Identifier}\``
				});
				return reply.status(502);
			}
		}

		if (WebsocketKey !== RecievedWS || !Flag) {
			if (Whitelist) {
				await webhooks.Blacklist(Script.BlacklistWebhook, {
					IP: request.ip,
					Flag: `${Fingerprint} ${NumberID}`,
					WebsocketID: RecievedWS,
					Reason: `User supplied invalid authentication keys`,
					Whitelist: Whitelist
				});

				try {
					await Database.IncrementUserCracks(Whitelist, ScriptID);
				} catch (er) {
					console.log(er);
				}
			}

			return reply.status(502);
		}
		
		if (!Whitelist) {
			await webhooks.Unauthorized(Script.UnauthorizedWebhook, {
				IP: request.ip,
				Reason: "User tried to run script without a whitelist"
			});
			return reply.status(502);
		}

		let JSXToken = crypto.randomstr(50);
		Connected.delete(request.ip === "::1" ? "127.0.0.1" : request.ip);
		WhitelistJSXToken.set(request.ip, {
			Timestamp: Date.now() / 1000,
			Token: JSXToken,
			ScriptID: ScriptID
		});

		reply.send(EncodeJSON({
			error: false,
			[crypto.randomstr(10)]: [
				`${HWID}${endpoints.Info.WhitelistSplice}${NumberID*2}${Fingerprint}${endpoints.Info.FlagsSlice}${ServerID.length}${UserID}`,
				Fingerprint,
				config.scriptid,
				Flag.reqId,
				crypto.hashstr(WebsocketKey),
				crypto.hashstr(ScriptID),
				RequestHash,
				JSXToken,
				Script.Name,
				Script.Version,
				Whitelist.Exploit,
				Whitelist.Executions,
				Whitelist.CrackAttempts,
				Whitelist.Identifier
			]
		}, request.HWID));

		try {
			await Database.IncrememntUserExecutions(Whitelist, ScriptID);
		} catch (er) {
			console.log(er);
		}

		webhooks.Success(Script.SuccessWebhook, {
			IP: request.ip,
			UserAgent: request.headers["user-agent"],
			Whitelist: Whitelist,
			Duration: Duration
		})
	});

	fastify.get(`/version`, (request, reply) => reply.send(config.version));

	fastify.get("/v/:id", async (request, reply) => {
		const Token = request.params.id;
		const HWID = request.HWID;

		if (!Token || !HWID) {
			return reply.status(400);
		}

		const Data = WhitelistJSXToken.get(request.ip);
		if (!Data || Data.Token !== Token) {
			return reply.status(400);
		}

		const Script = await Database.GetScript(Data.ScriptID);
		if (!Script || !Script.Online) {
			return reply.status(400);
		}

		const NewToken = crypto.randomstr(50);
		Data.Timestamp = Date.now() / 1000;
		Data.Token = NewToken;

		const Whitelist = await Database.GetWhitelistWithHWID(HWID);
		if (!Whitelist || !Whitelist.Whitelisted) {
			Data.Token = crypto.randomstr(50);
		}

		WhitelistJSXToken.set(request.ip, Data);
		reply.send(EncodeJSON({ Token: NewToken }, HWID));
	});
}

setInterval(() => {
	WhitelistJSXToken.forEach((value, key) => {
		if ((Date.now() / 1000) - value.Timestamp > 10) {
			WhitelistJSXToken.delete(key);
		}
	});
}, 5000)

module.exports = routes;