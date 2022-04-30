"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimestampSignature = void 0;
const jsrsasign_1 = require("jsrsasign");
const index_1 = require("./index");
class TimestampSignature {
    constructor(privateKey = '', publicKey = '') {
        this.generateSignature = (stringToSign) => {
            const sig = new jsrsasign_1.KJUR.crypto.Signature({ alg: 'SHA256withRSA' });
            sig.init(this.privateKey);
            sig.updateString(stringToSign);
            const signature = sig.sign();
            index_1.Log.debug(`Signed Data: ${stringToSign}\nSignature ${signature}`);
            return signature;
        };
        this.verifySignature = (signedString, signature) => {
            const sig = new jsrsasign_1.KJUR.crypto.Signature({ "alg": "SHA256withRSA" });
            sig.init(this.publicKey);
            sig.updateString(signedString);
            const verified = sig.verify(signature);
            index_1.Log.debug(`Data: ${signedString} Valid Signature: ${verified}`);
            return verified;
        };
        if (privateKey)
            this.privateKey = jsrsasign_1.KEYUTIL.getKey('-----BEGIN RSA PRIVATE KEY-----\n' +
                privateKey +
                '\n-----END RSA PRIVATE KEY-----\n');
        if (publicKey)
            this.publicKey = getRsaFromPubKey(publicKey);
    }
}
exports.TimestampSignature = TimestampSignature;
const getRsaFromPubKey = (pubKeyB64) => {
    const pubKeyDecoded = (0, jsrsasign_1.b64tohex)(pubKeyB64);
    console.log(pubKeyDecoded);
    console.log('LENGTH: ');
    console.log(pubKeyDecoded.length);
    // jsrsasign cannot build key out of PEM or ASN.1 string, so we have to extract modulus and exponent
    // you can get some idea what happens from the link below (keep in mind that in JS every char is 2 bytes)
    // https://crypto.stackexchange.com/questions/18031/how-to-find-modulus-from-a-rsa-public-key/18034#18034
    const modulus = pubKeyDecoded.slice(16, pubKeyDecoded.length - 10);
    console.log('MOD');
    console.log(modulus);
    const exp = pubKeyDecoded.slice(pubKeyDecoded.length - 5);
    console.log('EXP');
    console.log(parseInt(exp, 16));
    return jsrsasign_1.KEYUTIL.getKey({ n: modulus, e: exp });
};
