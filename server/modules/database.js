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

    async MakeScript(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Version, Exploits) {
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
                        Versions: [Version],
                        SynapseX: Exploits.synapse_x,
                        ScriptWare: Exploits.script_ware,
                        SynapseV3: Exploits.synapse_v3
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

    async AddUser(Identifier, HashedKey, ScriptID, Expiry, Usage, Whitelisted) {
        return new Promise(async (resolve, reject) => {
            try {
                const CreateUser = prisma.user.create({
                    data: {
                        Key: HashedKey,
                        Identifier: Identifier,
                        ScriptID: ScriptID,
                        ExpireAt: Expiry,
                        MaxExecutions: Usage,
                        Whitelisted: Whitelisted
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

    async GetBuyerFromEmail(Email) {
        return new Promise(async (resolve, reject) => {
            try {
                const Buyer = await prisma.buyer.findUnique({ where: { Email: Email } });
                resolve(Buyer)
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetBuyerFromUsername(Username) {
        return new Promise(async (resolve, reject) => {
            try {
                const Buyer = await prisma.buyer.findUnique({ where: { Username: Username } });
                resolve(Buyer)
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetBuyer(Username, Password) {
        return new Promise(async (resolve, reject) => {
            try {
                const Buyer = await prisma.buyer.findFirst({ where: { Username: Username, Password: Password } });
                resolve(Buyer)
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async AddBuyer(Email, Username, Password, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.create({
                    data: {
                        Email: Email,
                        Password: Password,
                        Username: Username,
                        APIKey: APIKey
                    }
                })
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async UpdateScript(ScriptID, Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Version, Exploits) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.script.update({
                    where: { id: ScriptID },
                    data: {
                        Version: Version,
                        Versions: {
                            push: Version
                        },
                        Name: Name,
                        SynapseX: Exploits.synapse_x,
                        ScriptWare: Exploits.script_ware,
                        SynapseV3: Exploits.synapse_v3,
                        SuccessWebhook: SuccessWebhook,
                        BlacklistWebhook: BlacklistWebhook,
                        UnauthorizedWebhook: UnauthorizedWebhook
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    // first argument is the actual ID of the user object.
    async UpdateUser(UserCollectionID, Expiry, Usage, Whitelisted) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: UserCollectionID },
                    data: {
                        ExpireAt: Expiry,
                        MaxExecutions: Usage,
                        Whitelisted: Whitelisted
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async DeleteUser(UserCollectionID, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const DeleteUser = prisma.user.delete({
                    where: { id: UserCollectionID }
                });

                const UpdateScriptUsers = prisma.script.update({
                    where: { id: ScriptID },
                    data: {
                        Users: { 
                            increment: -1
                        }
                    }
                });

                const Transaction = await prisma.$transaction([DeleteUser, UpdateScriptUsers]);
                resolve(Transaction[0]);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }
}

