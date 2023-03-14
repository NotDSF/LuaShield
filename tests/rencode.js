const { jsontypes, jsonfingerprint } = require("../server/config.json");

module.exports = class REncode {
    constructor() {

    }

    DecodeString(str) {
        let Pos = 0;
        let Stream = [];
        while (Pos < str.length) {
            let Length = parseInt(str.charAt(Pos));
            Pos++;
            let Byte = str.substring(Pos, Pos + Length);
            Pos = Pos + Length;
            Stream.push(String.fromCharCode(Byte - 87))
        }
        return Stream.join("");
    }

    DecodeJSON(encoded) {
        let Bytecode = encoded.substr(3); // remove LS| header
        Bytecode = this.DecodeString(Bytecode);

        let Pos = 0;
    
        function gBits8() {
            let Byte = parseInt(Bytecode.charAt(Pos));
            Pos++;
            return Byte;
        }
        
        function gInt() {
            let Length = gBits8();
            let Number = Bytecode.substring(Pos, Pos + Length);
            Pos += Length;
            return parseInt(Number);
        }
    
        function gString() {
            let Length = gInt();
            let Stream = [];
            //console.log(Length)
            for (let i=0; i < Length; i++) {
                Stream.push(String.fromCharCode(gInt()));
            }
            return Stream.join("");
        }

        function gFloat() {
            let start = gInt();
            let floating = gInt();
            return +(`${start}.${floating}`);
        }
    
        function DecodeObject() {
            let DecodedObject = {};
    
            function HandleValue() {
                let Type = gInt();
                switch (Type) {
                    case jsontypes.string:
                        return gString();
                    case jsontypes.number:
                        return gInt();
                    case jsontypes.object:
                        return DecodeObject();
                    case jsontypes.boolean:
                        return gBits8() == 1;
                    case jsontypes.specialnumber:
                        return +gString();
                }
            }
    
            let Size = gInt();
            let RequestDate = parseInt(gString());
            if ((Math.floor(Date.now() / 1000) - RequestDate) > 50) {
                new Error("Failed to verify timestamp on json");
            }
        

            for (let i=0; i < Size; i++) {
                let index = HandleValue();
                let value = HandleValue();
                DecodedObject[index] = value;
            }

            return DecodedObject;
        }
    
        return DecodeObject();
    }
}
