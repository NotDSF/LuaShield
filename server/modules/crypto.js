const { createHmac, randomUUID } = require("crypto");
const config = require("../config.json");

function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}


function sha512(data) { return createHmac("sha512", config.salt).update(data).digest("hex") };
function randomstr(len) { return makeid(len) };

function hashstr(str) {
    let Res = 0;
    str.split("").forEach((a, i) => Res += a.charCodeAt(0) + i);
    return Res;
}

function formatpacket(...args) {
    return args.join("☺");
}

function Encode(str) {
    return str.split("").map(c => {
        let CharCode = c.charCodeAt() + 87;
        return `${CharCode.toString().length}${CharCode}`
    }).join("")
}

function DecodeRot(str) {
    return str.split("").map(k => String.fromCharCode(k.charCodeAt()-2)).join("");
}

module.exports = { sha512, randomstr, hashstr, formatpacket, Encode, DecodeRot, randomUUID }