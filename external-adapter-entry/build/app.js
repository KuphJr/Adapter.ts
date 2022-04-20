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
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = require("./index");
const logger_1 = require("./logger");
const ResponseCacher_1 = require("./ResponseCacher");
const IpfsFetcher_1 = require("./IpfsFetcher");
const GoogleCloudStorage_1 = require("./GoogleCloudStorage");
// load environmental variables from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '.env') });
const responseCacher = new ResponseCacher_1.ResponseCacher();
if (!process_1.default.env.PRIVATEKEY)
    throw Error("Setup Error: The 'PRIVATEKEY' environment variable has not been set.");
const dataStorage = new GoogleCloudStorage_1.DataStorage(process_1.default.env.PRIVATEKEY, process_1.default.env.BUCKET);
const ipfsFetcher = new IpfsFetcher_1.IpfsFetcher();
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
    var _a, _b, _c;
    // respond to CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
        return;
    }
    // Take any data provided in the URL as a query and put that data into the request body.
    for (const key in req.query) {
        req.body[key] = req.query[key];
    }
    (0, logger_1.log)('Input: ' + req.body);
    // Check to make sure the request is authorized
    if (req.body.nodeKey != process_1.default.env.NODEKEY) {
        res.status(401).json({ error: 'The nodeKey is invalid.' });
        (0, logger_1.log)(`INVALID NODEKEY: ${(_a = req.body) === null || _a === void 0 ? void 0 : _a.nodeKey}`);
        return;
    }
    if ((_c = (_b = req.body) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.cached) {
        // CachedResponse.getCachedResponse() will return the response to the
        // last identical Adapter.js request.  It will then create a new Adapter.js
        // request to refresh the cache.
        try {
            responseCacher.getCachedResult(req.body, ipfsFetcher, dataStorage, (status, result) => {
                res.status(status).json(result);
                (0, logger_1.log)(`RESULT: ${JSON.stringify(result)}`);
            });
        }
        catch (untypedError) {
            const error = untypedError;
            res.status(500).json(JSON.stringify(error.toString()));
            (0, logger_1.log)(`ERROR: ${error.toString()}`);
        }
        return;
    }
    try {
        yield (0, index_1.createRequest)(req.body, ipfsFetcher, dataStorage, (status, result) => {
            res.status(status).json(result);
            (0, logger_1.log)(`RESULT: ${JSON.stringify(result)}`);
        });
    }
    catch (untypedError) {
        const error = untypedError;
        res.status(500).json(error.toString());
        (0, logger_1.log)(`ERROR: ${error.toString()}`);
    }
}));
app.listen(port, () => console.log(`Listening on port ${port}!`));
