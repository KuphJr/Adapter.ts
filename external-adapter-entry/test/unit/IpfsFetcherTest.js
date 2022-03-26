/*
 * Due to some TypeScript import error when using the web3.storage library, these unit tests are 
 * performed without TypeScript, Jest or an import.  The code from '../../build/IpfsFetcher.js' has been
 * manually pasted below for testing.
*/

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
exports.IpfsFetcher = void 0;
const web3_storage_1 = require("web3.storage");
const process_1 = __importDefault(require("process"));
class IpfsFetcher {
    static fetchJavaScriptString(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof process_1.default.env.WEB3STORAGETOKEN !== 'string') {
                throw new Error(`WEB3STORAGETOKEN was not provided in the environment variables.`);
            }
            const client = new web3_storage_1.Web3Storage({ token: process_1.default.env.WEB3STORAGETOKEN });
            const archive = yield client.get(cid);
            if (!archive) {
                throw new Error(`Failed to fetch IPFS file with content ID ${cid}.`);
            }
            const files = yield archive.files();
            if (files.length !== 1) {
                throw new Error(`Invalid IPFS archive retrieved. It must be a single JavaScript file.`);
            }
            return yield files[0].text();
        });
    }
}
exports.IpfsFetcher = IpfsFetcher;

// The function below runs the actual tests
(async () => {
  const path = require('path')
  const dotenv = require('dotenv')
  dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

  const javascriptString = await IpfsFetcher.fetchJavaScriptString(
  'bafybeibit3bm2z54s2imjiiflz332ei5yrud27mgzhh4jlhq6ersfvehce'
  )

  if (javascriptString !== 
    "const fs = require('fs'); const os = require('os'); const path = require('path'); const axios = require('axios'); " +
    "const response = await axios.get(myString); console.log(response.data); " +
    "fs.writeFileSync(path.join(os.tmpdir(), 'test.txt'), JSON.stringify(response.data)); " +
    "const result = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'test.txt'), { encoding: 'utf8' })); " +
    "return parseInt(result.id);"
  )
    throw Error('IpfsFetcher did not fetch correct string.')
  console.log('Successfully fetched JavaScript string from IPFS.')

  let errorThrown = false
  try {
    await IpfsFetcher.fetchJavaScriptString('invalidCIDstring')
  } catch (error) {
    errorThrown = true
  }
  if (!errorThrown)
    throw Error('IpfsFetcher did not error when fetching an invalid content id.')
  console.log('Successfully threw an error for an invalid content id.')

  errorThrown = false
  try {
    await IpfsFetcher.fetchJavaScriptString('bafybeie63xz4dkavijvj2peukkqpb7xbi3rmevp5k3i7jslhmijvmuy75m')
  } catch (error) {
    errorThrown = true
  }
  if (!errorThrown)
    throw Error('IpfsFetcher did not error when fetching an invalid file.')
  console.log('Successfully threw an error for an invalid file.')
})()