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
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const vm2_1 = require("vm2");
const Errors_1 = require("./Errors");
class Sandbox {
    static evaluate(javascriptString, vars) {
        return __awaiter(this, void 0, void 0, function* () {
            // Clear the tmp directory before running the untrusted code to ensure
            // it does not have access to any cached data from the previously run script
            // in the case that the previous script exited prematurely.
            this.clearTmpDirectory();
            const vm = new vm2_1.NodeVM({
                console: 'off',
                sandbox: vars,
                require: {
                    external: true,
                    builtin: ['*']
                }
            });
            let functionScript;
            // Try to compile the provided JavaScript code.
            try {
                functionScript = new vm2_1.VMScript('module.exports = async function () {\n' + javascriptString + '\n}').compile();
            }
            catch (untypedError) {
                const error = untypedError;
                throw new Errors_1.JavaScriptCompilationError({
                    name: error.name,
                    message: error.message,
                    details: error.stack
                });
            }
            // Try to run the provided JavaScript code.
            let sandboxedFunction;
            let result;
            try {
                sandboxedFunction = yield vm.run(functionScript);
                result = yield sandboxedFunction();
            }
            catch (untypedError) {
                const error = untypedError;
                throw new Errors_1.JavaScriptRuntimeError({
                    name: error.name,
                    message: error.message,
                    details: error.stack
                });
            }
            // Clear the tmp directory after running the code to ensure it does not
            // leave any cached data on the FaaS instance.
            this.clearTmpDirectory();
            return result;
        });
    }
    static clearTmpDirectory() {
        const dirents = fs_1.default.readdirSync(os_1.default.tmpdir());
        dirents.forEach(dirent => {
            try {
                if (fs_1.default.lstatSync(path_1.default.join(os_1.default.tmpdir(), dirent)).isDirectory()) {
                    fs_1.default.rmdirSync(path_1.default.join(os_1.default.tmpdir(), dirent), { recursive: true });
                }
                else {
                    fs_1.default.rmSync(path_1.default.join(os_1.default.tmpdir(), dirent));
                }
            }
            catch (error) { }
        });
    }
}
exports.Sandbox = Sandbox;
