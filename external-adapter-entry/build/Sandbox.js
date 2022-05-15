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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandbox = void 0;
const axios_1 = __importDefault(require("axios"));
const process_1 = __importDefault(require("process"));
const Log_1 = require("./Log");
const Validator_1 = require("./Validator");
const crypto_js_1 = require("crypto-js");
const TimestampSigner_1 = require("./TimestampSigner");
if (!process_1.default.env.SANDBOXURL)
    throw Error('Setup Error: The SANDBOXURL environment variable has not been set.');
if (!process_1.default.env.PRIVATEKEY)
    throw Error('Setup Error: The SANDBOXURL environment variable has not been set.');
const timestampSignature = new TimestampSigner_1.TimestampSignature(process_1.default.env.PRIVATEKEY, process_1.default.env.PUBLICKEY);
class Sandbox {
    static evaluate(javascriptString, vars) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!process_1.default.env.SANDBOXURL)
                throw Error('SANDBOXURL was not provided in environement variables.');
            const timestamp = Date.now();
            try {
                const requestHash = (0, crypto_js_1.SHA256)(timestamp.toString() +
                    javascriptString +
                    vars ? JSON.stringify(vars) : '').toString();
                const signature = timestampSignature.generateSignature(requestHash);
                const { data } = yield axios_1.default.post(process_1.default.env.SANDBOXURL, {
                    timestamp,
                    signature,
                    js: javascriptString,
                    vars: vars
                }, {
                    timeout: process_1.default.env.SANDBOXTIMEOUT ? parseInt(process_1.default.env.SANDBOXTIMEOUT) : 14000
                });
                return Validator_1.Validator.validateOutput(data.result);
            }
            catch (error) {
                Log_1.Log.error(error);
                if ((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) {
                    throw error.response.data.error;
                }
                else {
                    throw error;
                }
            }
        });
    }
}
exports.Sandbox = Sandbox;
