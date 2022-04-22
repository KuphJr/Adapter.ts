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
        let hexString;
        switch (typeof output) {
            case ('boolean'):
                if (requestedType !== 'bool')
                    throw Error(`A ${requestedType} value was requested but a boolean value was returned.`);
                return hexString = output ?
                    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' :
                    '0x0000000000000000000000000000000000000000000000000000000000000000';
            case ('number'):
                switch (requestedType) {
                    case ('int'):
                    case ('int256'):
                        console.log('OUTPUT: ');
                        console.log(output);
                        if (output > (2 ** 256 / 2 - 1) || output < -(2 ** 256 / 2))
                            throw Error('The returned number is outside the bounds of a 256 bit integer.');
                        if (output % 1 !== 0)
                            throw Error('The returned number must be an integer.');
                        return signedIntToBytes32HexString(output);
                    case ('uint'):
                    case ('uint256'):
                        if (output > 2 ** 256)
                            throw Error('The returned number is outside the bounds of a 256 bit unsigned integer.');
                        if (output % 1 !== 0 || output < 0)
                            throw Error('The returned number must be a positive integer.');
                        return ethers_1.utils.hexZeroPad('0x' + output.toString(16), 32);
                    default:
                        throw Error(`A ${requestedType} value was requested but a number value was returned.`);
                }
            case ('string'):
                switch (requestedType) {
                    case ('bool'):
                    case ('int'):
                    case ('int256'):
                    case ('uint'):
                    case ('uint256'):
                        if (Validator.isBytes32String(output))
                            return output;
                        throw Error('The returned string is not a valid 32 byte hex string.');
                    case ('bytes32'):
                        if (Validator.isBytes32String(output))
                            return output;
                        if (output.length < 32)
                            return ethers_1.utils.hexZeroPad('0x' + Buffer.from(output).toString('hex'), 32);
                        throw Error('The returned string is not a valid 32 byte hex string or a string of less than 32 characters.');
                    case ('bytes'):
                        if (ethers_1.utils.isHexString(output))
                            return output;
                        throw Error('The returned string is not a valid hex string.');
                    case ('string'):
                        if (output.length > 1024)
                            throw Error('The returned string must not have more than 1024 characters.');
                        return '0x' + Buffer.from(output).toString('hex');
                }
            default:
                throw Error(`The returned type ${typeof output} is invalid.`);
        }
    }
}
exports.Validator = Validator;
Validator.isValidOutput = (output) => {
    if (JSON.stringify(output).length > 1024)
        throw Error('The output returned by the JavaScript code is larger than 1 KB');
    switch (typeof output) {
        case 'boolean':
        case 'string':
        case 'number':
            return true;
        default:
            throw Error("The output returned by the JavaScript code is not of type 'boolean', 'number' or 'string'.");
    }
};
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
const signedIntToBytes32HexString = (int) => {
    if (int >= 0)
        return ethers_1.utils.hexZeroPad('0x' + int.toString(16), 32);
    const hexCode = {
        '0000': '0',
        '0001': '1',
        '0010': '2',
        '0011': '3',
        '0100': '4',
        '0101': '5',
        '0110': '6',
        '0111': '7',
        '1000': '8',
        '1001': '9',
        '1010': 'a',
        '1011': 'b',
        '1100': 'c',
        '1101': 'd',
        '1110': 'e',
        '1111': 'f'
    };
    const positiveBinaryString = (-int).toString(2).padStart(256, '0');
    const onesComplement = positiveBinaryString.replace(/0/g, '#').replace(/1/g, '0').replace(/#/g, '1');
    const twosComplementArr = onesComplement.split('');
    for (let i = 255; i >= 0; i--) {
        if (twosComplementArr[i] === '0') {
            twosComplementArr[i] = '1';
            for (let j = i + 1; j < 256; j++) {
                twosComplementArr[j] = '0';
            }
            break;
        }
    }
    let hexString = '0x';
    for (let i = 0; i + 3 < 256; i += 4)
        hexString += hexCode[twosComplementArr.slice(i, i + 4).join('')];
    return hexString;
};
