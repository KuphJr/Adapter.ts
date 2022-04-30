"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
const ethers_1 = require("ethers");
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
Validator.validateOutput = (output) => {
    if (typeof output === 'string') {
        if (output.length > 1024)
            throw Error('The output returned by the JavaScript code is larger than 1 KB.');
        return '0x' + Buffer.from(output).toString('hex');
    }
    if (typeof output === 'bigint') {
        if (output > maxUint256 || output < maxNegInt256)
            throw Error(`The output number ${output} cannot be represented in 32 bytes.`);
        if (output >= 0) {
            return ethers_1.utils.hexZeroPad('0x' + output.toString(16), 32);
        }
        return Validator.negativeIntToBytes32HexString(output);
    }
    if (Buffer.isBuffer(output)) {
        if (output.length > 1024)
            throw Error('The output returned by the JavaScript code is larger than 1 KB.');
        return output.toString('hex');
    }
    throw Error(`Invalid output type '${typeof output}' returned.`);
};
Validator.negativeIntToBytes32HexString = (int) => {
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
    let hexString = '0x';
    for (let i = 0; i + 3 < 256; i += 4)
        hexString += hexCode[twosComplementArr.slice(i, i + 4).join('')];
    return hexString;
};
Validator.isVariables = (variables) => {
    if (typeof variables === 'object')
        return true;
    return false;
};
const maxUint256 = BigInt('115792089237316195423570985008687907853269984665640564039457584007913129639935');
const maxNegInt256 = BigInt('-57896044618658097711785492504343953926634992332820282019728792003956564819968');
