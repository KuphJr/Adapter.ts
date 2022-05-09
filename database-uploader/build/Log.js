"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const process_1 = __importDefault(require("process"));
class Log {
}
exports.Log = Log;
Log.warn = (item) => console.log('⚠️ Warning: ' + item.toString());
Log.error = (item) => console.log('🛑 Error: ' + item.toString());
Log.info = (item) => {
    if (process_1.default.env.LOGGING)
        console.log('💬 Info: ' + item.toString());
};
Log.debug = (item) => {
    if (process_1.default.env.LOGGING === 'debug')
        console.log('🐞 Debug: ' + item.toString());
};
