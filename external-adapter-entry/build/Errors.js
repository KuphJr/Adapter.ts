"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JavaScriptError = exports.AdapterError = void 0;
class AdapterError extends Error {
    constructor({ jobRunID = '1', status = 'errored', statusCode = 500, name = 'AdapterError', message = 'An error occurred.' }) {
        super(message);
        Error.captureStackTrace(this, AdapterError);
        this.jobRunID = jobRunID;
        this.status = status;
        this.statusCode = statusCode;
        this.name = name;
        this.message = message;
    }
    toJSONResponse() {
        return {
            jobRunID: this.jobRunID,
            status: this.status,
            statusCode: this.statusCode,
            error: { name: this.name, message: this.message }
        };
    }
}
exports.AdapterError = AdapterError;
class JavaScriptError {
    constructor({ jobRunID = '1', status = 'errored', statusCode = 500, name = 'JavaScript Error', message = 'An error occurred', details = '' }) {
        this.jobRunID = jobRunID;
        this.status = status;
        this.statusCode = statusCode;
        this.name = name;
        this.message = message;
        this.details = details;
    }
    toJSONResponse() {
        return {
            jobRunID: this.jobRunID,
            status: this.status,
            statusCode: this.statusCode,
            error: { name: this.name, message: this.message, details: this.details }
        };
    }
}
exports.JavaScriptError = JavaScriptError;
