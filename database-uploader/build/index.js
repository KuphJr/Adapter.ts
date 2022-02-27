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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequest = void 0;
const logger_1 = require("./logger");
const CachedDataValidator_1 = require("./CachedDataValidator");
const GoogleCloudStorage_1 = require("./GoogleCloudStorage");
const createRequest = (input, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    (0, logger_1.log)("INPUT: " + JSON.stringify(input));
    if (process.env.NODEKEY && ((_a = input === null || input === void 0 ? void 0 : input.data) === null || _a === void 0 ? void 0 : _a.nodeKey) !== process.env.NODEKEY) {
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Setup Error',
                message: 'Request does not contain a valid nodeKey.'
            }
        });
        return;
    }
    // ensure the PUBLICKEY environmental variable has been set
    if (typeof process.env.PUBLICKEY !== 'string') {
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Setup Error',
                message: 'The PUBLICKEY environmental variable has not been set'
            }
        });
        return;
    }
    try {
        if (!CachedDataValidator_1.CachedDataValidator.isValidCachedData(input)) {
            throw Error('Input is invalid.');
        }
    }
    catch (untypedError) {
        const error = untypedError;
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Validation Error',
                message: 'Error validating input: ' + error.message
            }
        });
        return;
    }
    // Future Plans: Use a a smart contract to see if the requester paid a set amount
    // of LINK required to store cached data in the external adapter's database.
    const storage = new GoogleCloudStorage_1.DataStorage({ publicKey: process.env.PUBLICKEY });
    try {
        yield storage.storeData(input);
    }
    catch (untypedError) {
        const error = untypedError;
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Data Storage Error',
                message: error.message
            }
        });
        return;
    }
    callback(200, {
        status: 'Success',
        statusCode: 200
    });
});
exports.createRequest = createRequest;
// Export for GCP Functions deployment
exports.gcpservice = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // set JSON content type and CORS headers for the response
    res.header('Content-Type', 'application/json');
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // respond to CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send('');
    }
    else {
        for (const key in req.query) {
            req.body[key] = req.query[key];
        }
        try {
            yield (0, exports.createRequest)(req.body, (statusCode, data) => {
                res.status(statusCode).send(data);
            });
        }
        catch (error) {
            console.log(error);
        }
    }
});
