// This file is only used for testing purposes when running the external adapter locally.
// When this code is deployed to a FaaS provider, this file will no longer be used.
import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
// load environmental variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import { TimestampSignature } from './TimestampSignature'

import { createRequest, Result, Log } from './index'

const app = express()
const port = process.env.EA_PORT || 8030

app.use(cors())

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.send();
});

app.use(bodyParser.json())

app.post('/', async (req: express.Request, res: express.Response) => {
  if (!process.env.PUBLICKEY)
    throw Error('The public key must be set using the environment variable PUBLICKEY.')
  const timestampSignature = new TimestampSignature('', process.env.PUBLICKEY)

  const latencyToleranceMs = process.env.TOLERANCE ? parseInt(process.env.TOLERANCE) : 1000
  Log.info('Request\n' + JSON.stringify(req.body))
  // Check to make sure the request is authorized
  if (typeof req.body.timestamp !== 'number' || typeof req.body.signature !== 'string') {
    res.status(401).json({ error: 'The timestamp and/or signature are missing or invalid.' })
    Log.error('The timestamp and/or signature are missing.')
    return
  }
  const currentTime = Date.now()
  if (Math.abs(currentTime - parseInt(req.body.timestamp)) > latencyToleranceMs) {
    res.status(401).json({ error: 'The timestamp is beyond the latency threshold bounds.' })
    Log.error('The timestamp is beyond the latency threshold bounds.')
    return
  }
  if (!timestampSignature.verifySignature(req.body.timestamp.toString(), req.body.signature)) {
    res.status(401).json({ error: 'The signature is invalid.' })
    Log.error('The signature is invalid.')
    return
  }
  try {
    await createRequest(req.body, (status: number, result: Result): void => {
      Log.info('Result\n' + JSON.stringify(result))
      res.status(status).json(result)
    })
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    res.status(500).send(error.message)
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
