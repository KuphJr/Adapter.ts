// This file is only used for testing purposes when running the external adapter locally.
// When this code is deployed to a FaaS provider, this file will no longer be used.
import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import { createRequest, Result } from './index'
import { log } from './logger'

// load environmental variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})

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
  log('Input: ' + req.body)
  try {
    await createRequest(req.body, (status: number, result: Result): void => {
      log('Result: ' + JSON.stringify(result))
      res.status(status).json(result)
    })
  } catch (error) {
    log(error)
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
