import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
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

const dataStorage = new DataStorage(process.env.PRIVATEKEY)
const ipfsFetcher = new IpfsFetcher(process.env.WEB3STORAGETOKEN)

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
  if (req.body.nodeKey != process.env.NODEKEY) {
    res.status(401).json({ error: 'The nodeKey parameter is missing invalid.' })
    Log.error('The nodeKey parameter is missing invalid.')
    return
  }
  try {
    await createRequest(req.body, ipfsFetcher, dataStorage,
      (status: number, result: Result) => {
        res.status(status).json(result)
        Log.info('Result\n' + JSON.stringify(result))
      }
    )
  } catch (untypedError) {
    const error = untypedError as Error
    res.status(500).json(error.toString())
    Log.error(error.toString())
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
