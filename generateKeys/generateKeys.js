"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
const keys = (0, crypto_1.generateKeyPairSync)('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    },
    privateKeyEncoding: {
        type: "pkcs1",
        format: "pem",
    }
});
// const publicKey = keys.publicKey.export({type: 'pkcs1', format: 'pem'}).toString().replace(/\n/g, '')
// const privateKey = keys.privateKey.export({type: 'pkcs1', format: 'pem'}).toString().replace(/\n/g, '')
fs.writeFileSync(path.join(__dirname, '..', '.env'), `PUBLICKEY="${keys.publicKey}"\nPRIVATEKEY="${keys.privateKey}"`);
console.log(`${keys.publicKey}${keys.privateKey}Keys have been stored in the environment file: ${path.join(__dirname, '..', '.env')}`);
