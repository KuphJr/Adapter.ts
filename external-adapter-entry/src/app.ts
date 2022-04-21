import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import { createRequest, Result } from './index'
import { log } from './logger'
import { ResponseCacher } from './ResponseCacher'
import { IpfsFetcher } from './IpfsFetcher'
import { DataStorage } from './GoogleCloudStorage'

// load environmental variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})

const responseCacher = new ResponseCacher()
if (!process.env.PRIVATEKEY)
  throw Error("Setup Error: The 'PRIVATEKEY' environment variable has not been set.")
const dataStorage = new DataStorage(process.env.PRIVATEKEY, process.env.BUCKET)
const ipfsFetcher = new IpfsFetcher()

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
  // Take any data provided in the URL as a query and put that data into the request body.
  for (const key in req.query) {
    req.body[key] = req.query[key]
  }
  log('Input: ' + req.body)
  // Check to make sure the request is authorized
  if (req.body.nodeKey != process.env.NODEKEY) {
    res.status(401).json({ error: 'The nodeKey parameter is missing invalid.' })
    log(`INVALID NODEKEY: ${req.body?.nodeKey}`)
    return
  }
  if (req.body?.data?.cached) {
    // CachedResponse.getCachedResponse() will return the response to the
    // last identical Adapter.js request.  It will then create a new Adapter.js
    // request to refresh the cache.
    try {
      responseCacher.getCachedResult(req.body, ipfsFetcher, dataStorage,
        (status: number, result: Result) => {
          res.status(status).json(result)
          log(`RESULT: ${JSON.stringify(result)}`)
        }
      )
    } catch (untypedError) {
      const error = untypedError as Error
      res.status(500).json(JSON.stringify(error.toString()))
      log(`ERROR: ${error.toString()}`)
    }
    return
  }
  try {
    await createRequest(req.body, ipfsFetcher, dataStorage,
      (status: number, result: Result) => {
        res.status(status).json(result)
        log(`RESULT: ${JSON.stringify(result)}`)
      }
    )
  } catch (untypedError) {
    const error = untypedError as Error
    res.status(500).json(error.toString())
    log(`ERROR: ${error.toString()}`)
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
