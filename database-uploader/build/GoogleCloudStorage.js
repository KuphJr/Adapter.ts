"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStorage = void 0;
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const storage_1 = require("@google-cloud/storage");
const crypto_js_1 = require("crypto-js");
const Encryptor_1 = require("./Encryptor");
class DataStorage {
    constructor({ publicKey = '', privateKey = '', keyFileName = 'key.json', bucketName = 'adapterjs-playground' }) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.storage = new storage_1.Storage({ keyFilename: keyFileName });
        this.bucket = this.storage.bucket(process_1.default.env.BUCKET || bucketName);
    }
    storeData(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.publicKey === '')
                throw new Error('Public key has not been provided.');
            const encryptedObj = Encryptor_1.Encryptor.encrypt(this.publicKey, input);
            const filename = (0, crypto_js_1.SHA256)(input.contractAddress + input.ref).toString() + '.json';
            const file = this.bucket.file(filename);
            const fileExists = yield file.exists();
            if (fileExists[0])
                throw new Error(`Reference ID ${input.ref} is already in use for contract ${input.contractAddress}.`);
            yield file.save(JSON.stringify(encryptedObj));
        });
    }
    retrieveData(contractAddress, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.privateKey === '')
                throw new Error('Private key has not been provided');
            const filename = (0, crypto_js_1.SHA256)(contractAddress + ref).toString() + '.json';
            const localfile = path_1.default.join(os_1.default.tmpdir(), filename);
            try {
                try {
                    yield this.bucket.file(filename).download({ destination: localfile });
                }
                catch (untypedError) {
                    const error = untypedError;
                    throw new Error(`Unable to fetch stored data: ${error.message}`);
                }
                const encryptedObj = JSON.parse(fs_1.default.readFileSync(localfile, { encoding: 'utf8' }));
                const storedData = Encryptor_1.Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj);
                return storedData;
            }
            finally {
                // In the event of a failure, ensure the localfile has been deleted
                try {
                    fs_1.default.unlinkSync(localfile);
                }
                catch (_a) { }
            }
        });
    }
}
exports.DataStorage = DataStorage;
