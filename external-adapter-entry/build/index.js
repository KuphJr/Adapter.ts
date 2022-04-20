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
const Validator_1 = require("./Validator");
const Errors_1 = require("./Errors");
const Sandbox_1 = require("./Sandbox");
const createRequest = (input, ipfsFetcher, dataStorage, callback) => __awaiter(void 0, void 0, void 0, function* () {
    (0, logger_1.log)("INPUT: " + JSON.stringify(input));
    // ensure the PRIVATEKEY environmental variable has been set
    if (typeof process.env.PRIVATEKEY !== 'string') {
        (0, logger_1.log)('SETUP ERROR: The PRIVATEKEY environmental variable has not been set');
        callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
                name: 'Setup Error',
                message: 'The PRIVATEKEY environmental variable has not been set'
            }
        });
        return;
    }
    let validatedInput;
    try {
        validatedInput = Validator_1.Validator.validateInput(input);
    }
    catch (untypedError) {
        const error = untypedError;
        (0, logger_1.log)(error);
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
    // 'vars' contains the variables that will be passed to the sandbox
    let vars = {};
    // 'javascriptString' is the code which will be executed by the sandbox
    let javascriptString;
    // check if any cached data should be fetched from the adapter's database
    try {
        let validCachedData;
        if (validatedInput.contractAddress && validatedInput.ref) {
            validCachedData = yield dataStorage.retrieveData(validatedInput.contractAddress, validatedInput.ref);
            console.log(JSON.stringify(validCachedData.js));
            if (validCachedData.js)
                javascriptString = validCachedData.js;
            if (validCachedData.vars)
                vars = validCachedData.vars;
        }
    }
    catch (untypedError) {
        const error = untypedError;
        (0, logger_1.log)(error);
        callback(500, new Errors_1.AdapterError({
            jobRunID: validatedInput.id,
            message: `Storage Error: ${error.message}`
        }).toJSONResponse());
        return;
    }
    // check if the JavaScript should be fetched from IPFS
    if (validatedInput.cid) {
        try {
            javascriptString = yield ipfsFetcher.fetchJavaScriptString(validatedInput.cid);
        }
        catch (untypedError) {
            const error = untypedError;
            (0, logger_1.log)(error);
            callback(500, new Errors_1.AdapterError({
                jobRunID: validatedInput.id,
                message: `IPFS Error: ${error.message}`
            }).toJSONResponse());
            return;
        }
    }
    // check if the JavaScript string was provided directly
    if (validatedInput.js)
        javascriptString = validatedInput.js;
    // add any variables that were provided directly
    if (validatedInput.vars) {
        for (const variableName of Object.keys(validatedInput.vars)) {
            vars[variableName] = validatedInput.vars[variableName];
        }
    }
    if (!javascriptString) {
        (0, logger_1.log)(Error('No JavaScript code could be found for the request.'));
        callback(500, new Errors_1.AdapterError({
            jobRunID: validatedInput.id,
            message: `No JavaScript code could be found for the request.`
        }).toJSONResponse());
        return;
    }
    let result;
    try {
        result = yield Sandbox_1.Sandbox.evaluate(validatedInput.nodeKey, validatedInput.type, javascriptString, vars);
    }
    catch (untypedError) {
        if (untypedError.name === 'JavaScript Error') {
            const error = untypedError;
            (0, logger_1.log)(error);
            callback(500, new Errors_1.JavaScriptError({
                jobRunID: validatedInput.id,
                name: error.name,
                message: error.message,
                details: error.details
            }).toJSONResponse());
            return;
        }
        else {
            const error = untypedError;
            (0, logger_1.log)(error);
            callback(500, new Errors_1.AdapterError({
                jobRunID: validatedInput.id,
                message: error.message
            }).toJSONResponse());
        }
        return;
    }
    (0, logger_1.log)(`SUCCESS jobRunId: ${validatedInput.id} result: ${result}`);
    callback(200, {
        jobRunId: validatedInput.id,
        result: result,
        statusCode: 200,
        status: 'ok'
    });
    return;
});
exports.createRequest = createRequest;
