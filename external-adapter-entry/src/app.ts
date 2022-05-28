import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { utils } from 'ethers'
import { randomInt } from 'crypto'
import dotenv from 'dotenv'
// Try to load environmental variables from .env file.
// This is only for testing while running outside of a Docker container.
try {
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})
} catch {}

import { createRequest, Result } from './index'
import { Log } from './Log'
import { IpfsFetcher } from './IpfsFetcher'
import { DataStorage } from './GoogleCloudStorage'

if (!process.env.PRIVATEKEY)
  throw Error('Setup Error: The PRIVATEKEY environment variable has not been set.')
if (!process.env.WEB3STORAGETOKEN)
  throw Error('Setup Error: The WEB3STORAGETOKEN environment variable has not been set.')
if (!process.env.AGGREGATOR_CONTRACT_ADDR)
  throw Error('Setup Error: The AGGREGATOR_CONTRACT_ADDR environment variable has not been set.')

const dataStorage = new DataStorage(process.env.PRIVATEKEY)
const ipfsFetcher = new IpfsFetcher(process.env.WEB3STORAGETOKEN)

type RequestId = string
type HexStringResponse = string
type Salt = bigint
const cachedResponses: Record<RequestId, [ HexStringResponse, Salt ]> = {}

const app = express()
const port = process.env.EA_PORT || 8032

app.use(cors())

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.send();
});

app.use(bodyParser.json())

app.post('/', async (req: express.Request, res: express.Response) => {
  // respond to CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return
  }
  Log.info('Input\n' + JSON.stringify(req.body))
  // Check to make sure the request is authorized
  if (req.body.nodeKey !== process.env.NODEKEY) {
    res.status(401).json({ error: 'The nodeKey parameter is missing or invalid.' })
    Log.error('The nodeKey parameter is missing invalid.')
    return
  }
  // validate if request is made by an authorized aggregator contract
  // if (req.body.meta?.oracleRequest?.requester?.toLowerCase() !== process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()) {
  //   Log.error(`Requester ${req.body.meta?.oracleRequest?.requester?.toLowerCase()} does not match AGGREATOR_CONTRACT_ADDR environment variable ${process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()}`)
  //   res.status(401).json({ error: `Requester ${req.body.meta?.oracleRequest?.requester?.toLowerCase()} does not match AGGREATOR_CONTRACT_ADDR environment variable ${process.env.AGGREGATOR_CONTRACT_ADDR?.toLowerCase()}` })
  //   return
  // }
  if (req.body.getUnhashedResponse) {
    if (typeof req.body.data.hash === 'string' && req.body.data.hash.length !== 64) {
      res.status(400).json({ error: "Invalid parameter for 'hashedResponse'" })
      return
    }  
    if (!cachedResponses['0x' + req.body.data.hash]) {
      Log.error(`No value found for the provided hash: ${'0x' + req.body.data.hash}`)
      res.status(400).json({ error: `No value found for the provided hash: ${'0x' + req.body.data.hash}` })
      return
    }
    Log.debug(`found cached response ${cachedResponses['0x' + req.body.data.hash]}`)
    const [ response, salt ] = cachedResponses['0x' + req.body.data.hash]
    delete cachedResponses['0x' + req.body.data.hash]
    const reply = {
      jobRunId: req.body.id,
      result: response,
      salt: utils.hexZeroPad('0x' + salt.toString(16), 32),
      statusCode: 200,
      status: 'ok'
    }
    res.status(200).json(reply)
    Log.info('Response: ' + JSON.stringify(reply))
    return
  }
  try {
    await createRequest(req.body, ipfsFetcher, dataStorage,
      (status: number, result: Result) => {
        const salt = BigInt(randomInt(0, 281474976710655))
        if (result.result) {
          Log.debug('Response / 2: ' + BigInt(result.result) / BigInt(2))
          Log.debug('Salt: ' + salt.toString(16))
          Log.debug('Response & Salt Before Hashing: ' + (BigInt(result.result) / BigInt(2) + salt).toString(16))
          const hashedResponse = utils.keccak256(
            utils.hexZeroPad('0x' + (BigInt(result.result) / BigInt(2) + salt).toString(16), 32)
          )
          cachedResponses[hashedResponse] = [ result.result, salt ]
          Log.debug('Hashed Response: ' + hashedResponse)
          result.result = hashedResponse
        }
        res.status(status).json(result)
        Log.info('Result: ' + JSON.stringify(result))
      }
    )
  } catch (untypedError) {
    const error = untypedError as Error
    res.status(500).json(error.toString())
    Log.error(error.toString())
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
