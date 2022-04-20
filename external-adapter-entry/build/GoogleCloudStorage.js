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
const logger_1 = require("./logger");
class DataStorage {
    constructor(privateKey = '', bucketName = 'adapterjs-encrypted-user-data', persistantStorageDir = path_1.default.join(__dirname, '..', 'cache', 'database')) {
        this.privateKey = privateKey;
        this.persistantStorageDir = persistantStorageDir;
        if (!fs_1.default.existsSync(persistantStorageDir)) {
            (0, logger_1.log)('CREATING PERSISTANT database STORAGE DIRECTORY');
            fs_1.default.mkdirSync(persistantStorageDir, { recursive: true });
        }
        this.privateKey = privateKey;
        const gcsPrivateKey = process_1.default.env.GCS_PRIVATE_KEY;
        if (!gcsPrivateKey)
            throw Error("Setup Error: The 'GCS_PRIVATE_KEY' environment variable has not been set.");
        this.storage = new storage_1.Storage({
            projectId: process_1.default.env.GCS_PROJECT_ID,
            credentials: {
                client_email: process_1.default.env.GCS_CLIENT_EMAIL,
                private_key: gcsPrivateKey.replace(/\\n/g, '\n')
            }
        });
        this.bucket = this.storage.bucket(bucketName);
    }
    retrieveData(contractAddress, ref) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`CONTRACT ADDRESS: ${contractAddress}, REF: ${ref}`);
            const filename = (0, crypto_js_1.SHA256)(contractAddress + ref).toString() + '.json';
            console.log(filename);
            const filepath = path_1.default.join(this.persistantStorageDir, filename);
            // Check to see if file has been previously downloaded and stored in cache
            if (!fs_1.default.existsSync(filepath)) {
                try {
                    yield this.bucket.file(filename).download({ destination: filepath });
                }
                catch (untypedError) {
                    const error = untypedError;
                    throw new Error(`Unable to fetch stored data: ${error.message}`);
                }
            }
            const encryptedObj = JSON.parse(fs_1.default.readFileSync(filepath, { encoding: 'utf8' }));
            const storedData = Encryptor_1.Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj);
            return storedData;
        });
    }
}
exports.DataStorage = DataStorage;
