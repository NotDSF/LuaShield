const fetch = require("node-fetch");

async function Success(url, data) {
    return new Promise(async (resolve) => {
        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    content: null,
                    enbeds: [
                        {
                            description: "User successfully authenticated",
                            color: 3886815,
                            fields: [
                                {
                                    name: "User IP",
                                    value: `\`${data.IP}\``,
                                    inline: true
                                },
                                {
                                    name: "User-Agent",
                                    value: `\`${data.UserAgent}\``,
                                    inline: true
                                },
                                {
                                    name: "Authentication Speed",
                                    value: `\`${data.Duration}s\``
                                },
                                {
                                    name: "Whitelist Data",
                                    value: `\`\`\`json\n${JSON.stringify(data.Whitelist)}\n\`\`\``
                                }
                            ],
                            author: { name: "LuaShield" },
                            thumbnail: { url: "https://i.imgur.com/6xyJbAg.png" }
                        }
                    ],
                    attachments: []
                })
            });
        } catch (er) {
            console.log(er);
        }

        resolve();
    });
}

async function Blacklist(url, data) {
    return new Promise(async (resolve) => {
        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    content: null,
                    enbeds: [
                        {
                            description: "This user has been flagged for a possible blacklist",
                            color: 3886815,
                            fields: [
                                {
                                    name: "User IP",
                                    value: `\`${data.IP}\``
                                },
                                {
                                    name: "Reason",
                                    value: `\`${data.Reason}\``
                                },
                                { 
                                    name: "Debugging Data",
                                    value: `\`\`\`json\n${JSON.stringify({ a: data.Flag, b: data.WebsocketID })}\n\`\`\``
                                },
                                {
                                    name: "Whitelist Data",
                                    value: `\`\`\`json\n${JSON.stringify(data.Whitelist)}\n\`\`\``
                                }
                            ],
                            author: { name: "LuaShield" },
                            footer: { text: "*This could simply be a mistake usually caused by lag or another factor, use the information supplied to make a decision fairly." },
                            thumbnail: { url: "https://i.imgur.com/6xyJbAg.png" }
                        }
                    ],
                    attachments: []
                })
            });
        } catch (er) {
            console.log(er);
        }

        resolve();
    });
}

async function Unauthorized(url, data) {
    return new Promise(async (resolve) => {
        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    content: null,
                    enbeds: [
                        {
                            description: "This user has tried to run your script while unauthorized",
                            color: 3886815,
                            fields: [
                                {
                                    name: "User IP",
                                    value: `\`${data.IP}\``
                                },
                                {
                                    name: "Reason",
                                    value: `\`${data.Reason}\``
                                }
                            ],
                            author: { name: "LuaShield" },
                            thumbnail: { url: "https://i.imgur.com/6xyJbAg.png" }
                        }
                    ],
                    attachments: []
                })
            });
        } catch (er) {
            console.log(er);
        }

        resolve();
    });
}

async function SetupWebhook(webhook, name) {
    return new Promise(async (resolve, reject) => {
        let Response = await fetch(webhook, { method: "GET" });
        if (Response.status !== 200) {
            reject(`${webhook} doesn't exist`);
        }

        await fetch(webhook, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                content: `This channel has been setup for LuaShield script \`${name}\``
            })
        });

        resolve();
    })
}

module.exports = { Success, Blacklist, Unauthorized, SetupWebhook }