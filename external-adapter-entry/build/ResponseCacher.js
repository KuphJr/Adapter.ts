"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCacher = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const crypto_js_1 = require("crypto-js");
const logger_1 = require("./logger");
const Validator_1 = require("./Validator");
const index_1 = require("./index");
class ResponseCacher {
    constructor(persistantStorageDir = path_1.default.join(__dirname, 'cachedResponses'), ramCaching = false, ramStorageDir = 'cachedResponses') {
        this.persistantStorageDir = persistantStorageDir;
        this.ramCaching = ramCaching;
        this.ramStorageDir = path_1.default.join(os_1.default.tmpdir(), ramStorageDir);
        // create the required directories if they do not already exist
        if (!fs_1.default.existsSync(persistantStorageDir))
            fs_1.default.mkdirSync(persistantStorageDir, { recursive: true });
        if (this.ramCaching && !fs_1.default.existsSync(this.ramStorageDir))
            fs_1.default.mkdirSync(this.ramStorageDir, { recursive: true });
    }
    getCachedResult(input, callback) {
        (0, logger_1.log)('GETCACHEDRESULT INPUT: ' + JSON.stringify(input));
        const validatedInput = Validator_1.Validator.validateInput(input);
        const timeToLive = validatedInput.ttl;
        // don't include the ttl in the object hash
        delete validatedInput.ttl;
        // Use the hash of the validated input from the request as the file name.
        const filename = (0, crypto_js_1.SHA256)(JSON.stringify(validatedInput)) + '.json';
        let cachedResultJSONstring;
        try {
            if (this.ramCaching && fs_1.default.existsSync(path_1.default.join(this.ramStorageDir, filename))) {
                // If the cached result exists in RAM storage, use that.
                cachedResultJSONstring = fs_1.default.readFileSync(path_1.default.join(this.ramStorageDir, filename), { encoding: 'utf8' });
            }
            else if (fs_1.default.existsSync(path_1.default.join(this.persistantStorageDir, filename))) {
                // If the cached result exists in persistant storage, use that.
                cachedResultJSONstring = fs_1.default.readFileSync(path_1.default.join(this.persistantStorageDir, filename), { encoding: 'utf8' });
            }
            else {
                // If no cached result has been found, send back an error.
                /** @TODO Instead of throwing an error, should there be some sort of 'Dummy response'
                 * that can be set by the user in the initial request or if ttl is exceeded? */
                callback(500, {
                    status: 'errored',
                    statusCode: 500,
                    error: {
                        name: 'Cold cache',
                        message: 'No current data for that request. The cache is being filled.'
                    }
                });
                return;
            }
            const cachedResult = JSON.parse(cachedResultJSONstring);
            if (Validator_1.Validator.isValidOutput(cachedResult.response.result)) {
                // If a time-to-live (ttl) is specified, only return
                // the cached data if it is younger than the ttl.
                if (!timeToLive || (Date.now() - cachedResult.timeLastFulfilled) < timeToLive * 1000) {
                    (0, logger_1.log)(`RETURNING CACHED RESULT: ${cachedResult.response}`);
                    callback(200, {
                        jobRunId: validatedInput.id,
                        result: cachedResult.response.result,
                        statusCode: 200,
                        status: 'ok'
                    });
                    return;
                }
                else {
                    callback(500, {
                        status: 'errored',
                        statusCode: 500,
                        error: {
                            name: 'Time to live exceeded',
                            message: 'The cached data is older than the ttl. The cache is being filled with fresh data.'
                        }
                    });
                    return;
                }
            }
            callback(500, {
                status: 'errored',
                statusCode: 500,
                error: {
                    name: 'Invalid result',
                    message: 'The cached result is invalid.'
                }
            });
            return;
        }
        finally {
            // Make a new Adapter.js request to refresh the cache.
            (0, index_1.createRequest)(input, (status, response) => {
                if (status === 200) {
                    const cachedResultString = JSON.stringify({
                        // Record the time the cache was last filled
                        timeLastFulfilled: Date.now(),
                        response
                    });
                    (0, logger_1.log)('FILLING CACHE: ' + cachedResultString);
                    try {
                        if (this.ramCaching)
                            fs_1.default.writeFileSync(path_1.default.join(this.ramStorageDir, filename), cachedResultString);
                    }
                    catch (_) {
                        (0, logger_1.log)('ERROR FILLING CACHE: COULD NOT WRITE TO RAM CACHE');
                    }
                    try {
                        fs_1.default.writeFileSync(path_1.default.join(this.persistantStorageDir, filename), cachedResultString);
                    }
                    catch (_) {
                        (0, logger_1.log)('ERROR FILLING CACHE: COULD NOT WRITE TO DISK CACHE');
                    }
                }
                else {
                    (0, logger_1.log)('ERROR FILLING CACHE: ' + JSON.stringify(response));
                }
            });
        }
    }
}
exports.ResponseCacher = ResponseCacher;
