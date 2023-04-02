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

    async AddUser(Username, HashedKey, ProjectID, Expiry, Usage, Whitelisted, Note) {
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
                        Note: Note
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

    async UpdateScript(ScriptID, Version) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.script.update({
                    where: { id: ScriptID },
                    data: {
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
    async UpdateUser(UserCollectionID, Expiry, Usage, Whitelisted, Note) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await prisma.user.update({
                    where: { id: UserCollectionID },
                    data: {
                        ExpireAt: Expiry,
                        MaxExecutions: Usage,
                        Whitelisted: Whitelisted,
                        Note: Note
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
}

