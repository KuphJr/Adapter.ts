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
const Validator_1 = require("./Validator");
class Sandbox {
    static evaluate(type, javascriptString, vars) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const sandboxUrl = process_1.default.env.SANDBOXURL;
            if (!sandboxUrl) {
                throw new Error('SANDBOXURL was not provided in environement variables.');
            }
            try {
                const { data } = yield axios_1.default.post(sandboxUrl, {
                    js: javascriptString,
                    vars: vars
                });
                const result = data.result;
                if (Validator_1.Validator.validateOutput(type, result))
                    return result;
                else
                    throw new Error('Invalid Output');
            }
            catch (error) {
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
