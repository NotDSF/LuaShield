const random = require("random");

function generateMath(int) {
    let [Enum, New, rightHand] = [random.int(1, 2), int, random.int(1, 999)]; //
    let Extra = random.int(1, 999);
    New += Extra;

    switch (Enum) {
        case 1: { // Addition 
            return (`((${(New+rightHand)}-${rightHand})-${Extra}/${"LuaShield"})`);
        }
        case 2: { // Subtraction
            return (`((${New-rightHand}+${rightHand})-${Extra}/${"LuaShield"})`);
        }
    }
}



module.exports = generateMath;