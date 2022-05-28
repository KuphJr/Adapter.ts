"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const ethers_1 = require("ethers");
class Validator {
    constructor() { }
    static validateInput(input) {
        if (!input.data)
            throw Error('No data input provided.');
        const validatedInput = {};
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
            if (input.data.ref.indexOf('\u0000') !== -1)
                validatedInput.ref = input.data.ref.slice(0, input.data.ref.indexOf('\u0000'));
            else
                validatedInput.ref = input.data.ref;
            if (typeof input.data.req !== 'string')
                throw Error("Invalid value for the 'req' parameter which must be a valid address.");
            validatedInput.contractAddress = input.data.req.toLowerCase();
        }
        // validate that js, cid or ref is present
        if (!validatedInput.js && !validatedInput.cid)
            throw Error("At least one of the parameters 'js' or 'cid' must be provided.");
        return validatedInput;
    }
    static validateOutput(output) {
        if (typeof output !== 'string')
            throw Error('The returned must be a valid hex string');
        if (output.length > 66 || !ethers_1.utils.isHexString(output))
            throw Error("The returned value must be a 32 byte hex string preceded with '0x'.");
        return ethers_1.utils.hexZeroPad(output, 32);
    }
}
exports.Validator = Validator;
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
