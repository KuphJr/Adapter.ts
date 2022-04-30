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
exports.Log = exports.createRequest = void 0;
const process_1 = __importDefault(require("process"));
const Validator_1 = require("./Validator");
const Sandbox_1 = require("./Sandbox");
// import { TimestampSignature } from './TimestampSignature'
// if (!process.env.PUBLICKEY)
//   throw Error('The public key must be set using the environment variable PUBLICKEY.')
// const timestampSignature = new TimestampSignature('', process.env.PUBLICKEY)
// const latencyToleranceMs = process.env.TOLERANCE ? parseInt(process.env.TOLERANCE) : 1000
// // Export for FaaS deployment
// exports.sandbox = async (req: Request, res: Response ) => {
//   // set JSON content type and CORS headers for the response
//   res.header('Content-Type', 'application/json')
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Headers', 'Content-Type')
//   // respond to CORS preflight requests
//   if (req.method === 'OPTIONS') {
//     res.set('Access-Control-Allow-Methods', 'GET')
//     res.set('Access-Control-Allow-Headers', 'Content-Type')
//     res.set('Access-Control-Max-Age', '3600')
//     res.status(204).send('')
//     return
//   }
//   Log.info('Input\n' + JSON.stringify(req.body))
//   // Check to make sure the request is authorized
//   if (typeof req.body.timestamp !== 'number' || typeof req.body.signature !== 'string') {
//     res.status(401).json({ error: 'The timestamp and/or signature are missing or invalid.' })
//     Log.error('The timestamp and/or signature are missing.')
//     return
//   }
//   const currentTime = Date.now()
//   if (Math.abs(currentTime - parseInt(req.body.timestamp)) > latencyToleranceMs) {
//     res.status(401).json({ error: 'The timestamp is beyond the latency threshold bounds.' })
//     Log.error('The timestamp is beyond the latency threshold bounds.')
//     return
//   }
//   if (!timestampSignature.verifySignature(req.body.timestamp.toString(), req.body.signature)) {
//     res.status(401).json({ error: 'The signature is invalid.' })
//     Log.error('The signature is invalid.')
//     return
//   }
//   try {
//     await createRequest(req.body, (status: number, result: Result): void => {
//       Log.info('Result\n' + JSON.stringify(result))
//       res.status(status).json(result)
//     })
//   } catch (untypedError) {
//     const error = untypedError as Error
//     Log.error(error.toString())
//     res.status(500).send(error.message)
//   }
// }
// Process request
const createRequest = (input, callback) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Validate the request
    try {
        if (!Validator_1.Validator.isValidInput(input))
            return;
    }
    catch (untypedError) {
        const error = untypedError;
        Log.error(error.toString());
        callback(400, {
            status: 'errored',
            statusCode: 400,
            error: {
                name: 'Invalid Input',
                message: `${error.message}`
            }
        });
        return;
    }
    // Execute the user-provided code in the sandbox
    let output;
    try {
        output = yield Sandbox_1.Sandbox.evaluate(input.js, input.vars);
    }
    catch (untypedError) {
        const javascriptError = untypedError;
        Log.error(javascriptError.toString());
        callback(406, javascriptError.toJSONResponse());
        return;
    }
    Log.debug('Sandbox Output\n');
    Log.debug(((_a = output) === null || _a === void 0 ? void 0 : _a.toString()) || '');
    // Validate the type of the returned value
    let validatedOutput;
    try {
        validatedOutput = Validator_1.Validator.validateOutput(output);
    }
    catch (untypedError) {
        const error = untypedError;
        Log.error(error.toString());
        callback(406, {
            status: 'errored',
            statusCode: 406,
            error: {
                name: 'Output Validation Error',
                message: `${error.message}`
            }
        });
        return;
    }
    callback(200, {
        status: 'ok',
        statusCode: 200,
        result: validatedOutput,
    });
});
exports.createRequest = createRequest;
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
