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
const storage_1 = require("@google-cloud/storage");
const crypto_js_1 = require("crypto-js");
const Encryptor_1 = require("./Encryptor");
const Log_1 = require("./Log");
class DataStorage {
    constructor(privateKey, bucketName = process_1.default.env.BUCKET || 'adapterjs-encrypted-user-data', persistantStorageDir = path_1.default.join(__dirname, '..', 'cache', 'database')) {
        this.privateKey = privateKey;
        this.persistantStorageDir = persistantStorageDir;
        if (!fs_1.default.existsSync(persistantStorageDir)) {
            Log_1.Log.debug('Creating local data storage caching directory: ' + persistantStorageDir);
            fs_1.default.mkdirSync(persistantStorageDir, { recursive: true });
        }
        if (!process_1.default.env.GCS_PROJECT_ID)
            throw Error("Setup Error: The 'GCS_PROJECT_ID' environment variable has not been set.");
        if (!process_1.default.env.GCS_CLIENT_EMAIL)
            throw Error("Setup Error: The 'GCS_CLIENT_EMAIL' environment variable has not been set.");
        if (!process_1.default.env.GCS_PRIVATE_KEY)
            throw Error("Setup Error: The 'GCS_PRIVATE_KEY' environment variable has not been set.");
        this.storage = new storage_1.Storage({
            projectId: process_1.default.env.GCS_PROJECT_ID,
            credentials: {
                client_email: process_1.default.env.GCS_CLIENT_EMAIL,
                private_key: '-----BEGIN PRIVATE KEY-----\n' + process_1.default.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n') + '\n-----END PRIVATE KEY-----\n'
            }
        });
        this.bucket = this.storage.bucket(bucketName);
    }
    retrieveData(contractAddress, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            Log_1.Log.debug('Contract address for generating private vars hash: ' + contractAddress);
            Log_1.Log.debug('Ref for generating private vars hash: ' + ref);
            Log_1.Log.debug('Filehash: ' + (0, crypto_js_1.SHA256)(contractAddress + ref).toString());
            const filename = (0, crypto_js_1.SHA256)(contractAddress + ref).toString() + '.json';
            const filepath = path_1.default.join(this.persistantStorageDir, filename);
            Log_1.Log.debug('Attemping to fetch from local data storage caching directory: ' + filepath);
            // Check to see if file has been previously downloaded and stored in cache
            if (!fs_1.default.existsSync(filepath)) {
                try {
                    yield this.bucket.file(filename).download({ destination: filepath });
                }
                catch (untypedError) {
                    const error = untypedError;
                    throw Error(`Unable to fetch stored data: ${error.message}`);
                }
            }
            const encryptedObj = JSON.parse(fs_1.default.readFileSync(filepath, { encoding: 'utf8' }));
            const storedData = Encryptor_1.Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj);
            return storedData;
        });
    }
}
exports.DataStorage = DataStorage;
