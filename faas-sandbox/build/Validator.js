"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    static isValidInput(input) {
        if (typeof input.js !== 'string')
            throw Error("The parameter 'js' must be provided as a string.");
        if (input.vars &&
            !Validator.isVariables(input.vars))
            throw Error("The parameter 'vars' must be provided as a JavaScript object and cannot be an array.");
        return true;
    }
}
exports.Validator = Validator;
Validator.isValidOutput = (output) => {
    if (Buffer.byteLength(JSON.stringify(output)) > 1024)
        throw Error('The output returned by the JavaScript code is larger than 1 KB');
    switch (typeof output) {
        case 'boolean':
        case 'number':
        case 'string':
            if (Buffer.byteLength(JSON.stringify(output)) > 1024)
                throw Error('The output returned by the JavaScript code is larger than 1 KB');
            return true;
        default:
            throw Error("The output returned by the JavaScript code is not of type 'boolean', 'number' or string");
    }
};
Validator.isVariables = (variables) => {
    if (typeof variables === 'object')
        return true;
    return false;
};
