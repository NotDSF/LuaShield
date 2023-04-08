const luaparse = require("./luaparse");
const path = require("path")
const { existsSync } = require("fs");
const random = require("random");
const amg = require("./amg");

function GenerateRandomNumber(size) {
    return Math.floor(Math.random() * size)
}

let WhitelistVariables = ["TimeNow", "IDENTIFIERS", "Rot2", "Recursion", "MRandom", "Key", "gc", "tfind", "Info", "RandomWord", "RandomWord2", "EQ", "JMPCounter", "WLSuccess", "HttpGet", "whitelistVersion", "Pcall", "Type", "CURRENT_EXPLOIT", "fakeJMP", "fakeSet", "fakeReqId"]
let OptimizationReplaces = {
    "string.sub": "Sub",
    "string.char": "Char",
    "string.gmatch": "Gmatch",
    "math.sqrt": "sqrt",
    "string.format": "format",
    "game.HttpService": "HttpService",
    "debug.getupvalue": "Getupvalue",
    "debug.getconstants": "Getconstants",
    "debug.setupvalue": "Setupvalue",
    "debug.getupvalues": "Getupvalues",
    "debug.info": "Info",
    "debug.getinfo": "bgetinfo",
    "table.find": "tfind",
    "syn.request": "request"
}

module.exports = function(Script, isuserscript) {
    return new Promise(async (resolve, reject) => {
        function MacroArgCheck(node, index, type, required) {
            required = required || true;
            
            let Argument = node.arguments[index];
            if (!Argument && required) {
                return;
            }

            if (Argument.type !== type) {
                reject(`LuaShield:${node.loc.start.line}: invalid argument #${index + 1} to '${node.base.name}' (expected ${type} got ${Argument.type})`);
                return true;
            }
        }

        
        function AceError(node, error) {
            if (!node) {
                return reject(`LuaShield:?: ${error}`);
            }
            reject(`AceError: LuaShield:${node.loc.start.line}: ${error}`);
        }

    
        try {
            luaparse.parse(Script, {
                locations: true,
                luaVersion: "5.1",
                encodingMode: "pseudo-latin1",
                ranges: true
            });
        } catch (er) {
            return reject(er.toString());
        }



        let BackupScript = Script;

        let Info = luaparse.parse(Script, { 
            locations: true,
            luaVersion: "5.1",
            encodingMode: "pseudo-latin1",
            ranges: true,
            onCreateNode: (node) => {
                switch (node.type) {
                    case "IfClause":
                        if (!isuserscript || node.condition.operator !== "==") break;

                        let Left = BackupScript.slice(...node.condition.left.range);
                        let Right = BackupScript.slice(...node.condition.right.range);
                        
                        if (Left === Right) {
                            Script = Script.replace(BackupScript.slice(...node.condition.range), `${WhitelistVariables[random.int(0, WhitelistVariables.length - 1)]}`);
                            break;
                        }
                        break;
                    case "CallExpression":
                        if (!node.base) break;

                        if (node.base.type == "MemberExpression" && isuserscript) {
                            let Path = `${node.base.base.name}.${node.base.identifier.name}`;

                            if (!OptimizationReplaces[Path]) {
                                break;
                            }

                            Script = Script.replace(BackupScript.slice(node.base.base.range[0], node.base.identifier.range[1]) + "(", OptimizationReplaces[Path] + "(");
                            break;
                        }

                        if (node.base.name === "LS_OPCODESPAM") {
                            if (isuserscript) {
                                return AceError(node, "LS_OPCODESPAM cannot be used in this context");
                            }
                            
                            let Name = node.arguments[0];

                            if (MacroArgCheck(node, 0, "StringLiteral")) return;

                            if (Name.value.match(/[\W\d]+/)) {
                                return AceError(node, "attempt to escape path");
                            }

                            if (Name.value.match(/(?:PRN|AUX|CLOCK\$|NUL|COM\d|LPT\d)/)) {
                                return AceError(node, "invalid path (includes windows reserved file name)");
                            }

                            if (!existsSync(path.join(__dirname, `opflush/${Name.value.toUpperCase()}.js`))) {
                                return AceError(node, `unsupported opcode (${Name.value})`);
                            }

                            let OPInfo = require(`./opflush/${Name.value.toUpperCase()}`);
                            let Generated = "";
                            for (let i=0; i < GenerateRandomNumber(10) + 1; i++) {
                                Generated += OPInfo() + "\n";
                            }

                            Script = Script.replace(BackupScript.slice(...node.range), `do ${Generated} end`);
                            break;
                        }

                        if (node.base.name === "LS_NUMENC") {
                            let Number = node.arguments[0];
                            if (MacroArgCheck(node, 0, "NumericLiteral")) return;

                            Script = Script.replace(BackupScript.slice(...node.range), amg(Number.value));
                            break;
                        }

                        if (node.base.name === "LS_IMAFAILURE") {
                            let Err = node.arguments[0];
                            if (MacroArgCheck(node, 0, "StringLiteral")) return;

                            Script = Script.replace(BackupScript.slice(...node.range), `error("${Err.value}")`);
                            break;
                        }

                        if (node.base.name == "LS_SecureWebhook") {
                            if (MacroArgCheck(node, 0, "StringLiteral")) return;
                            if (MacroArgCheck(node, 0, "TableConstructorExpression")) return;

                            break;
                        }

                        if (random.int(0, 2) == 0 && isuserscript && node.base.name) {
                            let Name = node.base.name;
                            let Arguments = BackupScript.slice(node.range[0] + Name.length, node.range[1]);

                            Script = Script.replace(BackupScript.slice(...node.range), `(${WhitelistVariables[random.int(0, WhitelistVariables.length - 1)]} and ${Name})${Arguments}`)
                            break;
                        }

                        break;
                    default: 
                        break;
                }
            },
        });

        BackupScript = Script;

        if (isuserscript) {
            if (Info.body.length == 1) {
                let FirstAst = Info.body[0];
                if (FirstAst.type == "ReturnStatement" && FirstAst.arguments[0] && FirstAst.arguments[0].type == "CallExpression" && FirstAst.arguments[0].base.type == "FunctionDeclaration") {
                    return AceError(FirstAst, "For security purposes we don't recommened wrapping your script in a (function() end)");
                }

                if (FirstAst.type == "CallExpression" && FirstAst.base.type == "FunctionDeclaration") {
                    return AceError(FirstAst, "For security purposes we don't recommened wrapping your script in a (function() end)");
                }
            }
        }



        resolve(Script);
    });
}