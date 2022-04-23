"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const ethers_1 = require("ethers");
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
            case ('bytes'):
                break;
            default:
                throw Error("Invalid value for the parameter 'type' which must be either " +
                    "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.");
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
    static validateOutput(requestedType, output) {
        if (typeof output !== 'string')
            throw Error('The returned must be a valid hex string');
        switch (requestedType) {
            case ('int'):
            case ('int256'):
            case ('uint'):
            case ('uint256'):
            case ('bytes32'):
                if (output.length > 66 || !ethers_1.utils.isHexString(output))
                    throw Error('The returned value must be a 32 byte hex string preceded with "0x".');
                return ethers_1.utils.hexZeroPad(output, 32);
            case ('bytes'):
            case ('string'):
                if (output.length > 2050 || !ethers_1.utils.isHexString(output))
                    throw Error('The returned value must be a lowercase hex string of 1024 bytes or less preceded with "0x".');
                return output;
            default:
                throw Error(`The returned type ${typeof output} is invalid.`);
        }
    }
}
exports.Validator = Validator;
Validator.isBytes32String = (input) => {
    if (typeof input !== 'string')
        return false;
    if (input.length === 66 && ethers_1.utils.isHexString(input))
        return true;
    return false;
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
