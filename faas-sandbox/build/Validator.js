"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    static isValidInput(input) {
        if (typeof input.js !== 'string')
            throw Error("The parameter 'js' must be provided as a string.");
        if (input.vars &&
            (Array.isArray(input.vars)
                || !Validator.isVariables(input.vars)))
            throw Error("The parameter 'vars' must be provided as a JavaScript object and cannot be an array.");
        return true;
    }
}
exports.Validator = Validator;
Validator.isValidOutput = (output) => {
    if (JSON.stringify(output).length > 1000)
        throw Error('The output returned by the JavaScript code is larger than 1 KB');
    if (Buffer.isBuffer(output))
        return true;
    switch (typeof output) {
        case 'boolean':
        case 'string':
        case 'number':
        case 'bigint':
            return true;
        case 'object':
            if (Array.isArray(output)) {
                if (output.length === 0)
                    return true;
                let elemType = typeof output[0];
                switch (elemType) {
                    case 'boolean':
                    case 'string':
                    case 'number':
                    case 'bigint':
                        break;
                    default:
                        throw Error("The output returned by the JavaScript code is not of type 'boolean', 'string', 'number', 'bigint', 'boolean[]', 'string[]', 'number[]', 'bigint[]' or 'Buffer'");
                }
                // ensure every element in the array has the same type
                if (output.every(elem => typeof elem === elemType))
                    return true;
            }
        default:
            throw Error("The output returned by the JavaScript code is not of type 'boolean', 'string', 'number', 'bigint', 'boolean[]', 'string[]', 'number[]', 'bigint[]' or 'Buffer'");
    }
};
Validator.isVariables = (variables) => {
    if (typeof variables !== 'object')
        return false;
    for (const variable of Object.keys(variables)) {
        if (typeof variable !== 'string')
            return false;
    }
    return true;
};
