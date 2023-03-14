const crypto = require("./crypto");
const config = require("./../config.json");
const utf8 = require("utf8");

// stolen from stackoverflow cause im lazy :scream:
function IsFloat(n) {
    return Number(n) === n && n % 1 !== 0;
}

function compress(a) {
    let out = [];
    let buffer = a.split("");
    for (let i=0; i < buffer.length; i+=2) {
        if (!buffer[i + 1]) { // overflow
            out.push(String.fromCharCode(buffer[i]));
            continue
        }
        out.push(utf8.encode(String.fromCharCode(+(buffer[i] + buffer[i + 1]))));
    }
    return out.join("");
}

function Encode(object, hwid) {
    object.JSONHWID = hwid || "null";
    let Stream = [];

    function writeInt(int) {
        Stream.push(int.toString().length, int);
    }

    function writeGbits8(byte) {
        Stream.push(byte);
    }

    function writeString(string) {
        writeInt(string.length);
        string.split("").forEach(char => writeInt(char.charCodeAt()));
    }

    function writeNumber(number) {
        writeInt(number);
    }
    
    function writeChunk(object) {
        writeInt(Object.values(object).length);
        writeString(Math.floor(Date.now() / 1000).toString());
        for (let [i,v] of Object.entries(object)) {
            switch (typeof(i)) {
                case "string":
                    writeInt(config.jsontypes.string); // string header
                    writeString(i);
                    break
                case "number":
                    if (IsFloat(i) || i < 0) {
                        writeInt(config.jsontypes.specialnumber);
                        writeString(i.toString());
                        break;
                    }

                    writeInt(config.jsontypes.number); // number header
                    writeNumber(i)
            }
    
            switch (typeof(v)) {
                case "string":
                    writeInt(config.jsontypes.string); // string header
                    writeString(v);
                    break;
                case "number":
                    if (IsFloat(v) || v < 0) {
                        writeInt(config.jsontypes.specialnumber);
                        writeString(v.toString());
                        break;
                    }

                    writeInt(config.jsontypes.number); // number header
                    writeNumber(v);
                    break;
                case "object":
                    writeInt(config.jsontypes.object) // object header
                    writeChunk(v);
                    break;
                case "boolean":
                    writeInt(config.jsontypes.boolean);
                    writeGbits8(v == true ? 1 : 0);
            }
        }
    }

    writeChunk(object);
    return `LS|${crypto.Encode(Stream.join(""))}`;
}

module.exports = Encode;