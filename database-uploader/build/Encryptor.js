"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encryptor = void 0;
const crypto_1 = require("crypto");
const crypto_js_1 = require("crypto-js");
const CachedDataValidator_1 = require("./CachedDataValidator");
class Encryptor {
    static encrypt(publicKey, validatedInput) {
        const userDataJsonString = Buffer.from(JSON.stringify(validatedInput));
        const decryptionKey = (0, crypto_1.randomBytes)(10);
        const encryptedDecryptionKey = (0, crypto_1.publicEncrypt)(publicKey, decryptionKey).toString('base64');
        console.log('LENGTH: ' + encryptedDecryptionKey.length);
        const encryptedUserDataJsonString = crypto_js_1.AES.encrypt(JSON.stringify(validatedInput), decryptionKey.toString() + validatedInput.contractAddress + validatedInput.ref).toString();
        return {
            encryptedDecryptionKey: encryptedDecryptionKey,
            encryptedUserDataJsonString: encryptedUserDataJsonString
        };
    }
    static decrypt(privateKey, contractAddress, ref, encryptedObj) {
        const decryptionKey = (0, crypto_1.privateDecrypt)(privateKey, Buffer.from(encryptedObj.encryptedDecryptionKey, 'base64'));
        const decryptedUserDataHexString = crypto_js_1.AES.decrypt(encryptedObj.encryptedUserDataJsonString, decryptionKey.toString() + contractAddress + ref).toString();
        const userDataJsonString = crypto_js_1.enc.Utf8.stringify(crypto_js_1.enc.Hex.parse(decryptedUserDataHexString));
        const userData = JSON.parse(userDataJsonString);
        try {
            if (CachedDataValidator_1.CachedDataValidator.isValidCachedData(userData)) {
                return userData;
            }
            else {
                throw Error('Decrypted data is not valid.');
            }
        }
        catch (untypedError) {
            const error = untypedError;
            throw Error(error.message);
        }
    }
}
exports.Encryptor = Encryptor;
