const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = class Database {
    constructor() {
        
    }

    async GetWhitelist(Key) {
        return new Promise(async (resolve, reject) => {
            try {
                const Whitelist = await prisma.user.findUnique({ where: { Key: Key } });
                resolve(Whitelist);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetWhitelistWithHWID(HWID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Whitelist = await prisma.user.findUnique({ where: { HWID: HWID } });
                resolve(Whitelist);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetScript(ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Script = await prisma.script.findUnique({ where: { id: ScriptID } });
                resolve(Script);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateUserHWID(Whitelist, HWID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: Whitelist.id },
                    data: { HWID: HWID }
                });
                resolve(Result)
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateUserExploit(Whitelist, Exploit) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: Whitelist.id },
                    data: { Exploit: Exploit }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async IncrememntUserExecutions(Whitelist, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const UpdateScriptExecutions = prisma.script.update({
                    where: { id: ScriptID },
                    data: { Executions: { increment: 1 } }
                });

                const UpdateUserExecutions = prisma.user.update({
                    where: { id: Whitelist.id },
                    data: { Executions: { increment: 1 } }
                });

                const Transaction = await prisma.$transaction([UpdateScriptExecutions, UpdateUserExecutions]);
                resolve(Transaction[1]);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async IncrementUserCracks(Whitelist, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const UpdateScriptExecutions = prisma.script.update({
                    where: { id: ScriptID },
                    data: { CrackAttempts: { increment: 1 } }
                });

                const UpdateUserExecutions = prisma.user.update({
                    where: { id: Whitelist.id },
                    data: { CrackAttempts: { increment: 1 } }
                });

                const Transaction = await prisma.$transaction([UpdateScriptExecutions, UpdateUserExecutions]);
                resolve(Transaction[1]);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async GetBuyerFromAPIKey(APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.findUnique({ where: { APIKey: APIKey } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async MakeScript(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Version) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.script.create({
                    data: {
                        Name: Name,
                        SuccessWebhook: SuccessWebhook,
                        BlacklistWebhook: BlacklistWebhook,
                        UnauthorizedWebhook: UnauthorizedWebhook,
                        Online: true,
                        Version: Version,
                        Versions: [Version]
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateBuyerScripts(APIKey, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.update({
                    where: { APIKey: APIKey },
                    data: {
                        OwnedScripts: {
                            push: ScriptID
                        }
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })        
    }

    async ScriptOwnedByBuyer(APIKey, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.findUnique({ where: { APIKey: APIKey  } });
                resolve(Result.OwnedScripts.find(script => script === ScriptID));
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetUser(Identifier, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.findFirst({ where: { Identifier: Identifier, ScriptID: ScriptID } });
                resolve(Result)
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async WhitelistUser(Identifier, HashedKey, ScriptID, Expiry, Usage) {
        return new Promise(async (resolve, reject) => {
            try {
                const CreateUser = prisma.user.create({
                    data: {
                        Key: HashedKey,
                        Identifier: Identifier,
                        ScriptID: ScriptID,
                        ExpireAt: Expiry,
                        MaxExecutions: Usage
                    }
                });

                const UpdateUsers = prisma.script.update({
                    where: { id: ScriptID },
                    data: { Users: { increment: 1 } }
                });

                const Transaction = await prisma.$transaction([CreateUser, UpdateUsers]);
                resolve(Transaction[0]);
            } catch (er) {
                console.log(er);
                reject()
            }
        }); 
    }
}

