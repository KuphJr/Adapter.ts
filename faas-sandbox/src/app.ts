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
  // Take any data provided in the URL as a query and put that data into the request body.
  for (const key in req.query) {
    req.body[key] = req.query[key]
  }
  Log.info('Request\n' + JSON.stringify(req.body))
  // Check to make sure the request is authorized
  if (req.body.nodeKey != process.env.NODEKEY) {
    res.status(401).json({ error: 'The nodeKey parameter is missing or invalid.' })
    Log.error('The nodeKey parameter is missing or invalid.')
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
