"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const process = require('process');
class Validator {
    constructor() { }
    static validateInput(input) {
        var _a, _b;
        // if a node key has been set in the environment variables, require
        // all requests to have a matching node key sent from the jobspec.
        const validatedInput = {};
        if (!(input === null || input === void 0 ? void 0 : input.data)) {
            throw Error('No data input provided.');
        }
        if (typeof (input === null || input === void 0 ? void 0 : input.data.type) !== 'string') {
            throw Error("The parameter 'type' must be provided as a string.");
        }
        switch (input.data.type) {
            case ('bool'):
                break;
            case ('uint'):
                break;
            case ('uint256'):
                break;
            case ('int'):
                break;
            case ('int256'):
                break;
            case ('bytes32'):
                break;
            case ('string'):
                break;
            case ('bytes'):
                break;
            default:
                throw Error("Invalid value for the parameter 'type' which must be either " +
                    "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.");
        }
        validatedInput.type = input.data.type;
        if (typeof input.id === 'undefined') {
            input.id = '1';
        }
        else if (typeof input.id !== 'string') {
            throw Error("Invalid value for the parameter 'id' which must be a string.");
        }
        validatedInput.id = input.id;
        if (typeof input.data.js !== 'undefined' && typeof input.data.js !== 'string') {
            throw Error("Invalid value for the parameter 'js' which must be a string.");
        }
        if (typeof input.data.js === 'string') {
            validatedInput.js = input.data.js;
        }
        if (typeof input.data.cid !== 'undefined' && typeof input.data.cid !== 'string') {
            throw Error("Invalid value for the parameter 'cid' which must be a string.");
        }
        if (typeof input.data.cid !== 'undefined' && typeof input.data.js !== 'undefined') {
            throw Error("Both of the parameter 'js' or 'cid' cannot be provided simultaneously.");
        }
        if (typeof input.data.cid === 'string') {
            validatedInput.cid = input.data.cid;
        }
        if (typeof input.data.vars === 'string') {
            try {
                input.data.vars = JSON.parse(input.data.vars);
            }
            catch (error) {
                throw Error("The parameter 'vars' was not a valid JSON object string.");
            }
        }
        if (typeof input.data.vars !== 'undefined' && typeof input.data.vars !== 'object') {
            throw Error("Invalid value for the parameter 'vars' which must be a JavaScript object or a string.");
        }
        if (input.data.vars) {
            validatedInput.vars = input.data.vars;
        }
        if (typeof input.data.ref !== 'undefined') {
            if (typeof input.data.ref !== 'string') {
                throw Error("Invalid value for the parameter 'ref' which must be a string");
            }
            validatedInput.ref = input.data.ref;
            if (typeof ((_b = (_a = input.meta) === null || _a === void 0 ? void 0 : _a.oracleRequest) === null || _b === void 0 ? void 0 : _b.requester) !== 'string') {
                throw Error("Invalid value for the parameter 'contractAddress' which must be a string.");
            }
            validatedInput.contractAddress = input.meta.oracleRequest.requester;
        }
        return validatedInput;
    }
    static validateOutput(type, output) {
        if (typeof output === 'undefined') {
            throw Error('The provided JavaScript did not return a value or returned an undefined value.');
        }
        switch (type) {
            case ('bool'):
                if (typeof output !== 'boolean') {
                    throw Error('The returned value must be a boolean. Returned: ' + output);
                }
                break;
            case ('uint'):
            case ('uint256'):
                if (typeof output !== 'number') {
                    throw Error('The returned value must be a number. Returned: ' + output);
                }
                if (output % 1 !== 0 || output < 0) {
                    throw Error('The returned value must be a positive whole number. Returned: ' + output);
                }
                break;
            case ('int'):
            case ('int256'):
                if (typeof output !== 'number') {
                    throw Error('The returned value must be a number. Returned: ' + output);
                }
                if (output % 1 !== 0) {
                    throw Error('The returned value must be a whole number. Returned: ' + output);
                }
                break;
            case ('bytes32'):
                if (typeof output !== 'string') {
                    throw Error('The returned value must be a string. Returned: ' + output);
                }
                if (output.length >= 32) {
                    throw Error('The returned string is greater than 31 bytes. Returned: ' + output);
                }
                break;
            case ('string'):
                if (typeof output !== 'string') {
                    throw Error('The returned value must be a string. Returned: ' + output);
                }
                break;
            case ('bytes'):
                break;
            default:
                throw Error("Invalid value for the parameter 'type' which must be either " +
                    "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.");
        }
        if (Validator.isValidOutput(output))
            return output;
        else
            throw Error('Invalid output.');
    }
}
exports.Validator = Validator;
Validator.isValidOutput = (output) => {
    if (JSON.stringify(output).length > 1000) {
        throw new Error('The output returned by the JavaScript code is larger than 1 KB');
    }
    switch (typeof output) {
        case 'boolean':
        case 'string':
        case 'number':
            return true;
        case 'object':
            if (Array.isArray(output)) {
                switch (typeof output[0]) {
                    case 'boolean':
                    case 'string':
                    case 'number':
                        return true;
                }
            }
            if (Buffer.isBuffer(output))
                return true;
        default: throw new Error("The output returned by the JavaScript code is not of type 'boolean', 'string', 'number', 'boolean[]', 'string[]', 'number[]' or 'Buffer'");
    }
};
Validator.isVariables = (variables) => {
    for (const variable of Object.keys(variables)) {
        if (typeof variable !== 'string')
            return false;
    }
    return true;
};
