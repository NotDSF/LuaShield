// this file was made to try and emulate a real synapse env from js

const fetch = require("node-fetch");
const config = require("../server/config.json");

module.exports = class RFetch {
    constructor() {

    }
    
    GET_ENDPOINTS = `http://localhost/auth/${config.endpointsname}`

    async syn_request(data) {
        return new Promise(async (resolve, reject) => {
            try {
                if (!data.headers) {
                    data.headers = {};
                }

                data.headers["User-Agent"] = "synx";
                data.headers["syn-fingerprint"] = "xFcGrYNB4k2Xl3Avnrtdrc6jaPPoq";
                data.headers["syn-user-identifier"] = "bLYel0B2pD0QGxZ87rOb66gzR8EEb";

                const Result = await fetch(data.url, {
                    method: data.method,
                    body: data.body,
                    headers: data.headers
                });

                resolve(Result);
            } catch (er) {
                reject(er);
            }
        });
    }

    async HttpGet(url) {
        return new Promise(async (resolve, reject) => {
            try {
                const Result = await fetch(url, {
                    method: "GET",
                    headers: {
                        ["User-Agent"]: "Roblox/WinInet",
                        ["Roblox-Game-Id"]: "1",
                        ["Roblox-Place-Id"]: "1",
                        ["Roblox-Session-Id"]: "1"
                    }
                });

                const Body = await Result.text();
                resolve(Body);
            } catch (er) {
                reject(er);
            }
        });
    }
}