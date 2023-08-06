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

    async GetProject(ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Project = await prisma.project.findUnique({ where: { id: ProjectID } });
                resolve(Project);
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
                const UpdateScriptExecutions = prisma.project.update({
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
                const UpdateScriptExecutions = prisma.project.update({
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

    async MakeProject(Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Exploits, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = prisma.project.create({
                    data: {
                        Name: Name,
                        SuccessWebhook: SuccessWebhook,
                        BlacklistWebhook: BlacklistWebhook,
                        UnauthorizedWebhook: UnauthorizedWebhook,
                        Online: true,
                        SynapseX: Exploits.synapse_x,
                        ScriptWare: Exploits.script_ware,
                        SynapseV3: Exploits.synapse_v3,
                        Owner: APIKey
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateBuyerProjects(APIKey, ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.update({
                    where: { APIKey: APIKey },
                    data: {
                        Projects: {
                            push: ProjectID
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

    async ProjectOwnedByBuyer(APIKey, ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.findUnique({ where: { APIKey: APIKey  } });
                resolve(Result.Projects.find(script => script === ProjectID));
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetUser(Username, ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.findFirst({ where: { Username, ProjectID } });
                resolve(Result)
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async AddUser(Username, HashedKey, ProjectID, Expiry, Usage, Whitelisted, Note, DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const CreateUser = prisma.user.create({
                    data: {
                        Key: HashedKey,
                        Username: Username,
                        ProjectID: ProjectID,
                        ExpireAt: Expiry,
                        MaxExecutions: Usage,
                        Whitelisted: Whitelisted,
                        Note: Note,
                        DiscordID: DiscordID
                    }
                });

                const UpdateUsers = prisma.project.update({
                    where: { id: ProjectID },
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

    async AddBuyer(Email, Username, Password, APIKey, SubscriptionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const CreateBuyer = prisma.buyer.create({
                    data: {
                        Email: Email,
                        Password: Password,
                        Username: Username,
                        APIKey: APIKey,
                        SubscriptionID: SubscriptionID,
                        RegisteredAt: Date.now()
                    }
                })

                const LinkSubscription = prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Email,
                        Obfuscations: 0,
                        Projects: 0,
                        Scripts: 0
                    }
                });

                const Transaction = await prisma.$transaction([CreateBuyer, LinkSubscription]);
                resolve();
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async UpdateScript(ScriptID, Version, Name) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.script.update({
                    where: { id: ScriptID },
                    data: {
                        Name: Name,
                        Version: Version,
                        Versions: {
                            push: Version
                        }
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
    async UpdateUser(UserCollectionID, Expiry, Usage, Whitelisted, Note, DiscordID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: UserCollectionID },
                    data: {
                        ExpireAt: Expiry,
                        MaxExecutions: Usage,
                        Whitelisted: Whitelisted,
                        Note: Note,
                        DiscordID: DiscordID
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async MakeScript(ProjectID, Name, Version) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = prisma.script.create({
                    data: {
                        ProjectID: ProjectID,
                        Name: Name,
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

    async GetScript(ProjectID, ScriptID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = prisma.script.findFirst({ where: { id: ScriptID, ProjectID: ProjectID } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetProjects(APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = prisma.project.findMany({ where: { Owner: APIKey } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetScripts(ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = prisma.script.findMany({ where: { ProjectID: ProjectID } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async DeleteUser(ProjectID, Username) {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.findFirst({ where: { ProjectID, Username } });

                const DeleteUser = prisma.user.delete({ where: { id: User.id } });
                const UpdateProjectCount = prisma.project.update({
                    where: { id: ProjectID },
                    data: {
                        Users: {
                            increment: -1
                        }
                    }
                });

                const Transaction = await prisma.$transaction([DeleteUser, UpdateProjectCount]);
                resolve(Transaction[0]);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetUsers(ProjectID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.findMany({ where: { ProjectID: ProjectID } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async UpdateProject(ProjectID, Name, SuccessWebhook, BlacklistWebhook, UnauthorizedWebhook, Exploits, Online) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.project.update({
                    where: { id: ProjectID },
                    data: {
                        Name,
                        SuccessWebhook,
                        BlacklistWebhook,
                        UnauthorizedWebhook,
                        SynapseX: Exploits ? Exploits.synapse_x : undefined,
                        ScriptWare: Exploits ? Exploits.script_ware : undefined,
                        SynapseV3: Exploits ? Exploits.synapse_v3 : undefined,
                        Online
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateKey(UserCollectionID, Key) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({ 
                    where: { id: UserCollectionID },
                    data: {
                        Key
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async ResetHWID(UserCollectionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: UserCollectionID },
                    data: {
                        HWID: null
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateScriptVersion(ScriptID, Version) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.script.update({
                    where: { id: ScriptID },
                    data: {
                        Version
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async DeleteScriptVersion(ScriptID, Version) {
        return new Promise(async (resolve, reject) => {
            try {
                const Current = await prisma.script.findUnique({ where: { id: ScriptID } });
                const Result = await prisma.script.update({
                    where: { id: ScriptID },
                    data: {
                        Versions: Current.Versions.filter(a => a !== Version)
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async DeleteProject(ProjectID, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const DeleteScripts = prisma.script.deleteMany({ where: { ProjectID } });
                const DeleteUsers = prisma.user.deleteMany({ where: { ProjectID } });
                const DeleteProject = prisma.project.delete({ where: { id: ProjectID } });
                
                const Transaction = await prisma.$transaction([DeleteScripts, DeleteUsers, DeleteProject]);
                const Buyer = await prisma.buyer.findUnique({ where: { APIKey } });
    
                await prisma.buyer.update({
                    where: { APIKey },
                    data: {
                        Projects: Buyer.Projects.filter(a => a !== ProjectID)
                    }
                });
                resolve();
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async DeleteScript(ScriptID, SubscriptionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const UpdateSubscription = prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Scripts: {
                            increment: -1
                        }
                    }
                });

                const DeleteScript = prisma.script.delete({
                    where: { id: ScriptID }
                });

                await prisma.$transaction([UpdateSubscription, DeleteScript]);
                resolve();
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async CreateSubscription(Expire, Reset) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.create({
                    data: {
                        Expire,
                        Reset
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        }); 
    }

    async GetSubscription(SubscriptionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.findUnique({ where: { SubscriptionID } });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async ResetSubscriptionObfuscations(SubscriptionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Obfuscations: 0
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async SubscriptionIncrementProjectCount(SubscriptionID, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Projects: { increment: Amount }
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async SubscriptionIncrementScriptCount(SubscriptionID, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Scripts: { increment: Amount }
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async SubscriptionIncrementObfuscationsCount(SubscriptionID, Amount) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Obfuscations: { increment: Amount }
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateSubscription(SubscriptionID, Expire, Reset) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Expire,
                        Reset
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async DeleteAccount(Email) {
        return new Promise(async (resolve, reject) => {
            try {
                const DeleteBuyer = prisma.buyer.delete({
                    where: { Email }
                });

                const DeleteSubscription = prisma.subscription.delete({
                    where: { Email }
                });

                const Transaction = await prisma.$transaction([DeleteBuyer, DeleteSubscription]);
                resolve();
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async ResetPassword(APIKey, Password) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.update({
                    where: { APIKey },
                    data: {
                        Password: Password
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetBuyers() {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.findMany();
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetSubscriptions() {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.subscription.findMany();
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async CreateAdminBuyer(Email, Username, Password, APIKey, SubscriptionID) {
        return new Promise(async (resolve, reject) => {
            try {
                const CreateBuyer = prisma.buyer.create({
                    data: {
                        Email: Email,
                        Password: Password,
                        Username: Username,
                        APIKey: APIKey,
                        SubscriptionID: SubscriptionID,
                        Admin: true,
                        RegisteredAt: Date.now()
                    }
                })

                const LinkSubscription = prisma.subscription.update({
                    where: { SubscriptionID },
                    data: {
                        Email,
                        Obfuscations: 0,
                        Projects: 0,
                        Scripts: 0
                    }
                });

                const Transaction = await prisma.$transaction([CreateBuyer, LinkSubscription]);
                resolve(Transaction[0]);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async GetAdminStats() {
        return new Promise(async (resolve, reject) => {
            resolve({
                Projects: await prisma.project.count(),
                Scripts: await prisma.script.count(),
                Users: await prisma.user.count(),
                Buyers: await prisma.buyer.count()
            });
        });
    }

    async CreateWebhook(Url, Token, Name, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.webhook.create({
                    data: {
                        Name,
                        Owner: APIKey,
                        Token,
                        Url
                    }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async GetWebhooks(APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.webhook.findMany({
                    where: { Owner: APIKey }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        })
    }

    async GetWebhook(Token) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.webhook.findUnique({
                    where: { Token }
                });
                resolve(Result);
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async DeleteWebhook(Token, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const DeleteWebhook = await prisma.webhook.delete({
                    where: { Token }
                });

                const Buyer = await prisma.buyer.findUnique({
                    where: { APIKey }
                });

                await prisma.buyer.update({
                    where: { APIKey },
                    data: {
                        Webhooks: Buyer.Webhooks.filter(a => a !== Token)
                    }
                });
                resolve();
            } catch (er) {
                console.log(er);
                reject();
            }
        });
    }

    async UpdateBuyerWebhooks(Token, APIKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.buyer.update({
                    where: { APIKey },
                    data: {
                        Webhooks: {
                            push: Token
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
}

