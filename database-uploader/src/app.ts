// This file is only used for testing purposes when running the external adapter locally.
// When this code is deployed to a FaaS provider, this file will no longer be used.
import process from 'process'
import path from 'path'

import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'

import { createRequest, Result } from './index'
import { Log } from './Log'

// load environmental variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '..', '.env')})

const app = express()
const port = process.env.EA_PORT || 8031

app.use(cors())

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.send();
});

app.use(bodyParser.json())

app.post('/', async (req: express.Request, res: express.Response) => {
  Log.info('Input\n' + JSON.stringify(req.body))
  try {
    await createRequest(req.body, (status: number, result: Result) => {
      Log.info('Result\n' + JSON.stringify(result))
      res.status(status).json(result)
    })
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
