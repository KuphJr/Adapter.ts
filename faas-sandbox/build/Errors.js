"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaScriptRuntimeError = exports.JavaScriptCompilationError = exports.JavaScriptError = void 0;
class JavaScriptError {
    constructor({ status = 'errored', statusCode = 500, name = 'JavaScript Error', message = 'An error occurred', details = '' }, errorName) {
        this.status = status;
        this.statusCode = statusCode;
        this.name = errorName + ': ' + name;
        this.message = message;
        this.details = details;
    }
    toJSONResponse() {
        return {
            status: this.status,
            statusCode: this.statusCode,
            error: { name: this.name, message: this.message, details: this.details }
        };
    }
}
exports.JavaScriptError = JavaScriptError;
class JavaScriptCompilationError extends JavaScriptError {
    constructor(errorParams) {
        super(errorParams, 'JavaScript Compilation Error');
    }
}
exports.JavaScriptCompilationError = JavaScriptCompilationError;
class JavaScriptRuntimeError extends JavaScriptError {
    constructor(errorParams) {
        super(errorParams, 'JavaScript Runtime Error');
    }
}
exports.JavaScriptRuntimeError = JavaScriptRuntimeError;
