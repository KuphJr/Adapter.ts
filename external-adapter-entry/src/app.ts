import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import { createRequest, Result } from './index'
import { log } from './logger'
import { ResponseCacher } from './ResponseCacher'

// load environmental variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})

const responseCacher = new ResponseCacher(process.env.CACHING_DIR)

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
  } else {
    // Take any data provided in the URL as a query and put that data into the request body.
    for (const key in req.query) {
      req.body[key] = req.query[key]
    }
    if (req.body?.data?.cached) {
      // CachedResponse.getCachedResponse() will return the response to the
      // last identical Adapter.js request.  It will then create a new Adapter.js
      // request to refresh the cache.
      try {
        responseCacher.getCachedResult(req.body, (status: number, result: Result) => {
          res.status(status).json(result)
          log(`RESULT: ${JSON.stringify(result)}`)
        })
      } catch (untypedError) {
        const error = untypedError as Error
        res.status(500).json(JSON.stringify(error.toString()))
        log(`ERROR: ${error.toString()}`)
      }
    } else {
      try {
        await createRequest(req.body, (status: number, result: Result) => {
          res.status(status).json(result)
          log(`RESULT: ${JSON.stringify(result)}`)
        })
      } catch (untypedError) {
        const error = untypedError as Error
        res.status(500).json(error.toString())
        log(`ERROR: ${error.toString()}`)
      }
    }
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
