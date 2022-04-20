"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    constructor() { }
    static validateInput(input) {
        var _a, _b;
        if (!input.data)
            throw Error('No data input provided.');
        // validate type
        if (typeof input.data.type !== 'string')
            throw Error("The parameter 'type' must be provided as a string.");
        switch (input.data.type) {
            case ('bool'):
            case ('uint'):
            case ('uint256'):
            case ('int'):
            case ('int256'):
            case ('bytes32'):
            case ('string'):
            case ('byte[]'):
            case ('bytes'):
                break;
            default:
                throw Error("Invalid value for the parameter 'type' which must be either " +
                    "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string', 'bytes' or 'byte[]'.");
        }
        const validatedInput = { nodeKey: input.nodeKey, type: input.data.type };
        // validate id
        if (!input.id)
            input.id = '1';
        else if (typeof input.id !== 'string')
            throw Error("Invalid value for the parameter 'id' which must be a string.");
        validatedInput.id = input.id;
        // validate js
        if (input.data.js && typeof input.data.js !== 'string')
            throw Error("Invalid value for the parameter 'js' which must be a string.");
        if (input.data.js)
            validatedInput.js = input.data.js;
        // validate cid
        if (input.data.cid && typeof input.data.cid !== 'string')
            throw Error("Invalid value for the parameter 'cid' which must be a string.");
        if (input.data.cid)
            validatedInput.cid = input.data.cid;
        // validate vars
        if (input.data.vars && typeof input.data.vars !== 'string')
            throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string.");
        if (input.data.vars) {
            try {
                input.data.vars = JSON.parse(input.data.vars);
            }
            catch (error) {
                throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string.");
            }
            if (!Validator.isVariables(input.data.vars))
                throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string that is not an array.");
            validatedInput.vars = input.data.vars;
        }
        // validate ref
        if (input.data.ref) {
            if (typeof input.data.ref !== 'string')
                throw Error("Invalid value for the parameter 'ref' which must be a string");
            validatedInput.ref = input.data.ref;
            if (typeof ((_b = (_a = input.meta) === null || _a === void 0 ? void 0 : _a.oracleRequest) === null || _b === void 0 ? void 0 : _b.requester) !== 'string')
                throw Error("Invalid jobspec setup.  Parameter 'meta.oracleRequest.requester' is required when referencing stored data.");
            validatedInput.contractAddress = input.meta.oracleRequest.requester.toLowerCase();
        }
        // validate cached & ttl
        if (input.data.cached) {
            if (typeof input.data.cached !== 'boolean')
                throw Error("Invalid value for the parameter 'cached' which must be a boolean.");
            validatedInput.cached = input.data.cached;
        }
        else if (input.data.ttl) {
            throw Error("The 'ttl' parameter should not be provided if the 'cached' parameter is not provided.");
        }
        if (input.data.ttl && typeof input.data.ttl !== 'number')
            throw Error("Invalid value for the parameter 'ttl' which must be a number in seconds.");
        if (input.data.ttl)
            validatedInput.ttl = input.data.ttl;
        // validate that js, cid or ref is present
        if (!validatedInput.js && !validatedInput.cid && !validatedInput.ref)
            throw Error("At least one of the parameters 'js', 'cid' or 'ref' must be provided.");
        return validatedInput;
    }
    static validateOutput(type, output) {
        if (typeof output === 'undefined')
            throw Error('The provided JavaScript did not return a value or returned an undefined value.');
        switch (type) {
            case ('bool'):
                if (typeof output !== 'boolean')
                    throw Error('The returned value must be a boolean. Returned: ' + output);
                break;
            case ('uint'):
            case ('uint256'):
                if (typeof output !== 'number')
                    throw Error('The returned value must be a number. Returned: ' + output);
                if (output % 1 !== 0 || output < 0)
                    throw Error('The returned value must be a positive integer. Returned: ' + output);
                break;
            case ('int'):
            case ('int256'):
                if (typeof output !== 'number')
                    throw Error('The returned value must be a number. Returned: ' + output);
                if (output % 1 !== 0)
                    throw Error('The returned value must be an integer. Returned: ' + output);
                break;
            case ('string'):
                if (typeof output !== 'string')
                    throw Error('The returned value must be a string. Returned: ' + output);
                break;
            case ('bytes32'):
            case ('bytes'):
            case ('byte[]'):
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
    if (JSON.stringify(output).length > 1000)
        throw new Error('The output returned by the JavaScript code is larger than 1 KB');
    switch (typeof output) {
        case 'boolean':
            return true;
        case 'string':
        case 'number':
            return true;
        case 'object':
            if (Buffer.isBuffer(output))
                return true;
        default:
            throw new Error("The output returned by the JavaScript code is not of type 'boolean', 'number', 'string', or 'Buffer'.");
    }
};
Validator.isVariables = (variables) => {
    if (typeof variables !== 'object')
        return false;
    if (Array.isArray(variables))
        return false;
    if (Buffer.isBuffer(variables))
        return false;
    for (const variable of Object.keys(variables)) {
        if (typeof variable !== 'string')
            return false;
    }
    return true;
};
