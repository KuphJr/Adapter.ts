"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const process_1 = __importDefault(require("process"));
const log = (itemToLog) => {
    if (process_1.default.env.LOGGING) {
        console.log(itemToLog);
    }
};
exports.log = log;
