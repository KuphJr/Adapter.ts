"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Encryptor = void 0;
const crypto_1 = require("crypto");
const crypto_js_1 = require("crypto-js");
const StoredDataValidator_1 = require("./StoredDataValidator");
class Encryptor {
    static encrypt(publicKey, validatedInput) {
        const pemPublicKey = '-----BEGIN RSA PUBLIC KEY-----\n' + publicKey + '\n-----END RSA PUBLIC KEY-----\n';
        const decryptionKey = (0, crypto_1.randomBytes)(64);
        const encryptedDecryptionKey = (0, crypto_1.publicEncrypt)(pemPublicKey, decryptionKey).toString('base64');
        const encryptedUserDataJsonString = crypto_js_1.AES.encrypt(JSON.stringify(validatedInput), decryptionKey.toString() + validatedInput.contractAddress + validatedInput.ref).toString();
        return {
            encryptedDecryptionKey: encryptedDecryptionKey,
            encryptedUserDataJsonString: encryptedUserDataJsonString
        };
    }
    static decrypt(privateKey, contractAddress, ref, encryptedObj) {
        console.log(encryptedObj);
        const pemPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + privateKey + '\n-----END RSA PRIVATE KEY-----\n';
        const decryptionKey = (0, crypto_1.privateDecrypt)(pemPrivateKey, Buffer.from(encryptedObj.encryptedDecryptionKey, 'base64'));
        const decryptedUserDataHexString = crypto_js_1.AES.decrypt(encryptedObj.encryptedUserDataJsonString, decryptionKey.toString() + contractAddress + ref).toString();
        const userDataJsonString = crypto_js_1.enc.Utf8.stringify(crypto_js_1.enc.Hex.parse(decryptedUserDataHexString));
        const userData = JSON.parse(userDataJsonString);
        try {
            if (StoredDataValidator_1.StoredDataValidator.isValidStoredData(userData))
                return userData;
            else
                throw Error('Decrypted data is not valid.');
        }
        catch (untypedError) {
            const error = untypedError;
            throw Error(error.message);
        }
    }
}
exports.Encryptor = Encryptor;
