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
const Log_1 = require("./Log");
const Validator_1 = require("./Validator");
const Errors_1 = require("./Errors");
const Sandbox_1 = require("./Sandbox");
const createRequest = (input, ipfsFetcher, dataStorage, callback) => __awaiter(void 0, void 0, void 0, function* () {
    let validatedInput;
    try {
        validatedInput = Validator_1.Validator.validateInput(input);
    }
    catch (untypedError) {
        const error = untypedError;
        Log_1.Log.error(error.toString());
        callback(400, {
            status: 'errored',
            statusCode: 400,
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
    // check if any private data should be fetched from the adapter's database
    if (validatedInput.ref && validatedInput.contractAddress) {
        try {
            const privateData = yield dataStorage.retrieveData(validatedInput.contractAddress, validatedInput.ref);
            Log_1.Log.debug(JSON.stringify(privateData));
            javascriptString = privateData.js;
            vars = privateData.vars || {};
        }
        catch (untypedError) {
            const error = untypedError;
            Log_1.Log.error(error.toString());
            callback(500, new Errors_1.AdapterError({
                jobRunID: validatedInput.id,
                message: `Storage Error: ${error.message}`
            }).toJSONResponse());
            return;
        }
    }
    // check if the JavaScript should be fetched from IPFS
    if (validatedInput.cid) {
        try {
            javascriptString = yield ipfsFetcher.fetchJavaScriptString(validatedInput.cid);
        }
        catch (untypedError) {
            const error = untypedError;
            Log_1.Log.error(error.toString());
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
        for (const variableName in validatedInput.vars)
            vars[variableName] = validatedInput.vars[variableName];
    }
    if (!javascriptString) {
        Log_1.Log.error('No JavaScript code could be found for the request.');
        callback(406, new Errors_1.AdapterError({
            jobRunID: validatedInput.id,
            message: 'No JavaScript code could be found for the request.'
        }).toJSONResponse());
        return;
    }
    try {
        const result = yield Sandbox_1.Sandbox.evaluate(validatedInput.nodeKey, validatedInput.type, javascriptString, vars);
        callback(200, {
            jobRunId: validatedInput.id,
            result: result,
            statusCode: 200,
            status: 'ok'
        });
    }
    catch (untypedError) {
        if (untypedError.name === 'JavaScript Error') {
            const error = untypedError;
            callback(406, new Errors_1.JavaScriptError({
                jobRunID: validatedInput.id,
                name: error.name,
                message: error.message,
                details: error.details
            }).toJSONResponse());
        }
        else {
            const error = untypedError;
            callback(500, new Errors_1.AdapterError({
                jobRunID: validatedInput.id,
                message: error.message
            }).toJSONResponse());
        }
        Log_1.Log.error(untypedError.toString());
        return;
    }
});
exports.createRequest = createRequest;
