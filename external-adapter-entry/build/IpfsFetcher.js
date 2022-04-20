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
exports.IpfsFetcher = void 0;
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const web3_storage_1 = require("web3.storage");
const logger_1 = require("./logger");
class IpfsFetcher {
    constructor(persistantStorageDir = path_1.default.join(__dirname, '..', 'cache', 'IPFS')) {
        this.persistantStorageDir = persistantStorageDir;
        // create the required directory if it doesn't exist
        if (!fs_1.default.existsSync(persistantStorageDir)) {
            (0, logger_1.log)('CREATING PERSISTANT IPFS STORAGE DIRECTORY');
            fs_1.default.mkdirSync(persistantStorageDir, { recursive: true });
        }
    }
    fetchJavaScriptString(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            // first, check local storage to see if the IPFS file has previously been fetched and stored
            const filepath = path_1.default.join(this.persistantStorageDir, `${cid}.json`);
            let javascriptString;
            if (fs_1.default.existsSync(filepath)) {
                // If the cached result exists in persistant storage, use that.
                javascriptString = fs_1.default.readFileSync(filepath, { encoding: 'utf8' });
            }
            else {
                if (typeof process_1.default.env.WEB3STORAGETOKEN !== 'string') {
                    throw new Error(`WEB3STORAGETOKEN was not provided in the environment variables.`);
                }
                const client = new web3_storage_1.Web3Storage({ token: process_1.default.env.WEB3STORAGETOKEN });
                const archive = yield client.get(cid);
                if (!archive) {
                    throw new Error(`Failed to fetch IPFS file with content ID ${cid}.`);
                }
                const files = yield archive.files();
                if (files.length !== 1) {
                    throw new Error(`Invalid IPFS archive retrieved. It must be a single JavaScript file.`);
                }
                javascriptString = yield files[0].text();
                fs_1.default.writeFileSync(filepath, javascriptString, { encoding: 'utf8' });
            }
            return javascriptString;
        });
    }
}
exports.IpfsFetcher = IpfsFetcher;
