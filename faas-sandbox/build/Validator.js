"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    static isValidInput(input) {
        if (typeof input.js !== 'string') {
            throw new Error("The parameter 'js' must be provided as a string.");
        }
        if (input.vars &&
            (Array.isArray(input.vars)
                || !isVariables(input.vars))) {
            throw new Error("The parameter 'vars' must be provided as a JavaScript object and cannot be an array.");
        }
        return true;
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
const isVariables = (variables) => {
    for (const variable of Object.keys(variables)) {
        if (typeof variable !== 'string')
            return false;
    }
    return true;
};
