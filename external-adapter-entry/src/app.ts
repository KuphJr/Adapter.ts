// This file is for testing the external adapter locally.
// It will not be used in the final deployment to a FaaS platform

const { createRequest, AdapterResponse } = require('./index')

import express, { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { AdapterResponse } from '.'
var cors = require('cors')
const app = express()
const port = process.env.EA_PORT || 8080

app.use(cors())

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Methods', 'POST')
  res.send()
})

app.use(bodyParser.json())

app.post('/', async (req: Request, res: Response): Promise<void> => {
  for (const key in req.query) {
    req.body[key] = req.query[key]
  }
  try {
    await createRequest(req.body, (status: number, result: AdapterResponse) => {
      console.log('RESULT: ', result)
      res.status(status).json(result)
      return
    })
  } catch (error) {
    console.log(error)
  }
})

app.listen(port, () => console.log(`Listening on port ${port}!`))
