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
const Validator_1 = require("./Validator");
const Sandbox_1 = require("./Sandbox");
const logger_1 = require("./logger");
const createRequest = (input, callback) => __awaiter(void 0, void 0, void 0, function* () {
    (0, logger_1.log)('INPUT: ' + JSON.stringify(input));
    // Validate the request
    try {
        if (!Validator_1.Validator.isValidInput(input)) {
            // The validator will return true if the input is valid
            // or throw an error so this line will never be reached.
            // The line is kept solely for type checking.
            return;
        }
    }
    catch (untypedError) {
        const error = untypedError;
        (0, logger_1.log)(error);
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Input Validation Error: ',
                message: `${error.message}`
            }
        });
        return;
    }
    // 'output' contains the value returned from the user-provided code
    let output;
    // execute the user-provided code in the sandbox
    try {
        output = yield Sandbox_1.Sandbox.evaluate(input.js, input.vars);
    }
    catch (untypedError) {
        const javascriptError = untypedError;
        (0, logger_1.log)(javascriptError);
        callback(500, javascriptError.toJSONResponse());
        return;
    }
    (0, logger_1.log)(output);
    try {
        if (!Validator_1.Validator.isValidOutput(output)) {
            // The validator will return true if the output is valid
            // or throw an error so this line will never be reached.
            // The line is kept solely for type checking.
            return;
        }
    }
    catch (untypedError) {
        const error = untypedError;
        (0, logger_1.log)(error);
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Output Validation Error: ',
                message: `${error.message}`
            }
        });
        return;
    }
    // If everything is successful, reply with the validated result
    callback(200, {
        status: 'ok',
        statusCode: 200,
        result: output,
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
        catch (untypedError) {
            const error = untypedError;
            (0, logger_1.log)('ERROR: ' + error.toString());
        }
    }
});
