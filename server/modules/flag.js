// copied from old whitelist (cba to rewrite)

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

function GenerateRandomNumber(size) {
    return Math.floor(Math.random() * size)
}

const Flags = new Map();

function generateReqId() {
    let reqId = makeid(10);
    let key = GenerateRandomNumber(999);
    let reqIdArray = [];
    let Pos = 1;

    reqId.split("").forEach(char => {
        reqIdArray.push(char.charCodeAt()+key+reqId.length+Pos);
        Pos++;
    });

    return {
        "reqId": reqId,
        "Res": [
            key,
            reqIdArray
        ]
    }
}

function generate() {
    const Fingerprint = makeid(10);
    const assignedNumber = GenerateRandomNumber(999999999).toString();
    const Assigned = [];

    assignedNumber.split("").forEach(char => {
        let Number = parseInt(char);
        let randomNumber = GenerateRandomNumber(999999);

        switch(Math.floor(Math.random() * 6) + 1) {
            case 1:
                Assigned.push([Number + randomNumber + randomNumber, randomNumber, 8]);
                break;
            case 2:
                Assigned.push([Number - randomNumber, randomNumber, 10]);
                break;
            case 3:
                Assigned.push([Number, randomNumber, 1]);
                break;
            case 4:
                Assigned.push([Number + 3.1415926535898, randomNumber, 3]);
                break;
            case 5:
                Assigned.push([Number + Math.sqrt(randomNumber), randomNumber, 6]);
                break;
            case 6:
                Assigned.push([Number * 2, randomNumber, 7]);
                break;
        };
    });

    const reqId = generateReqId();
    Flags.set(Fingerprint + assignedNumber, {
        reqId: reqId.reqId
    });
    
    return {
        [1]: Fingerprint,
        [2]: Assigned, // Set
        [3]: reqId.Res
    }
}

function getFlag(Fingerprint, NumberId) {
    return Flags.get(Fingerprint + NumberId);
}

function deleteFlag(Fingerprint, NumberId) {
    return Flags.delete(Fingerprint + NumberId);
}

module.exports = {generate, getFlag, deleteFlag};