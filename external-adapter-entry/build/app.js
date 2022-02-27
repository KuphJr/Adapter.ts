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
// This file is only used for testing purposes when running the external adapter locally.
// When this code is deployed to a FaaS provider, this file will no longer be used.
const process_1 = __importDefault(require("process"));
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = require("./index");
const logger_1 = require("./logger");
// load environmental variables from .env file
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '..', '.env') });
const app = (0, express_1.default)();
const port = process_1.default.env.EA_PORT || 8032;
app.use((0, cors_1.default)());
app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.send();
});
app.use(body_parser_1.default.json());
app.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Take any data provided in the URL as a query and put that data into the request body.
    for (const key in req.query) {
        req.body[key] = req.query[key];
    }
    try {
        yield (0, index_1.createRequest)(req.body, (status, result) => {
            (0, logger_1.log)('RESULT: ' + JSON.stringify(result));
            res.status(status).json(result);
        });
    }
    catch (error) {
        (0, logger_1.log)(error);
    }
}));
app.listen(port, () => console.log(`Listening on port ${port}!`));
