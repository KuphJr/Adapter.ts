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
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const ethers_1 = require("ethers");
const crypto_1 = require("crypto");
const dotenv_1 = __importDefault(require("dotenv"));
// Try to load environmental variables from .env file.
// This is only for testing while running outside of a Docker container.
try {
    dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '.env') });
}
catch (_a) { }
const index_1 = require("./index");
const Log_1 = require("./Log");
const IpfsFetcher_1 = require("./IpfsFetcher");
const GoogleCloudStorage_1 = require("./GoogleCloudStorage");
if (!process_1.default.env.PRIVATEKEY)
    throw Error('Setup Error: The PRIVATEKEY environment variable has not been set.');
if (!process_1.default.env.WEB3STORAGETOKEN)
    throw Error('Setup Error: The WEB3STORAGETOKEN environment variable has not been set.');
if (!process_1.default.env.AGGREGATOR_CONTRACT_ADDR)
    throw Error('Setup Error: The AGGREGATOR_CONTRACT_ADDR environment variable has not been set.');
const dataStorage = new GoogleCloudStorage_1.DataStorage(process_1.default.env.PRIVATEKEY);
const ipfsFetcher = new IpfsFetcher_1.IpfsFetcher(process_1.default.env.WEB3STORAGETOKEN);
const cachedResponses = {};
const app = (0, express_1.default)();
const port = process_1.default.env.EA_PORT || 8032;
app.use((0, cors_1.default)());
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.send();
});
app.use(body_parser_1.default.json());
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // respond to CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    Log_1.Log.info('Input\n' + JSON.stringify(req.body));
    // Check to make sure the request is authorized
    if (req.body.nodeKey !== process_1.default.env.NODEKEY) {
        res.status(401).json({ error: 'The nodeKey parameter is missing invalid.' });
        Log_1.Log.error('The nodeKey parameter is missing invalid.');
        return;
    }
    // validate if request is made by an authorized aggregator contract
    // if (req.body.meta?.oracleRequest?.requester?.toLowerCase() !== process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()) {
    //   Log.error(`Requester ${req.body.meta?.oracleRequest?.requester?.toLowerCase()} does not match AGGREATOR_CONTRACT_ADDR environment variable ${process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()}`)
    //   res.status(401).json({ error: `Requester ${req.body.meta?.oracleRequest?.requester?.toLowerCase()} does not match AGGREATOR_CONTRACT_ADDR environment variable ${process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()}` })
    //   return
    // }
    if (req.body.getUnhashedResponse) {
        if (typeof req.body.data.hash === 'string' && req.body.data.hash.length !== 64) {
            res.status(400).json({ error: "Invalid parameter for 'hashedResponse'" });
            return;
        }
        if (!cachedResponses['0x' + req.body.data.hash]) {
            Log_1.Log.error(`No value found for the provided hash: ${'0x' + req.body.data.hash}`);
            res.status(400).json({ error: `No value found for the provided hash: ${'0x' + req.body.data.hash}` });
            return;
        }
        Log_1.Log.debug(`found cached response ${cachedResponses['0x' + req.body.data.hash]}`);
        const [response, salt] = cachedResponses['0x' + req.body.data.hash];
        delete cachedResponses['0x' + req.body.data.hash];
        const reply = {
            jobRunId: req.body.id,
            result: response,
            salt: ethers_1.utils.hexZeroPad('0x' + salt.toString(16), 32),
            statusCode: 200,
            status: 'ok'
        };
        res.status(200).json(reply);
        Log_1.Log.info('Response: ' + JSON.stringify(reply));
        return;
    }
    try {
        yield (0, index_1.createRequest)(req.body, ipfsFetcher, dataStorage, (status, result) => {
            const salt = BigInt((0, crypto_1.randomInt)(0, 281474976710655));
            if (result.result) {
                Log_1.Log.debug('Response / 2: ' + BigInt(result.result) / BigInt(2));
                Log_1.Log.debug('Salt: ' + salt.toString(16));
                Log_1.Log.debug('Response & Salt Before Hashing: ' + (BigInt(result.result) / BigInt(2) + salt).toString(16));
                const hashedResponse = ethers_1.utils.keccak256(ethers_1.utils.hexZeroPad('0x' + (BigInt(result.result) / BigInt(2) + salt).toString(16), 32));
                cachedResponses[hashedResponse] = [result.result, salt];
                Log_1.Log.debug('Hashed Response: ' + hashedResponse);
                result.result = hashedResponse;
            }
            res.status(status).json(result);
            Log_1.Log.info('Result: ' + JSON.stringify(result));
        });
    }
    catch (untypedError) {
        const error = untypedError;
        res.status(500).json(error.toString());
        Log_1.Log.error(error.toString());
    }
}));
app.listen(port, () => console.log(`Listening on port ${port}!`));
