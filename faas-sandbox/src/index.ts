import process from 'process'

import { Request, Response } from 'express'
import { Validator } from './Validator'
import type { ValidOutput } from './Validator'
import type { JavaScriptError } from './Sandbox'
import { Sandbox } from './Sandbox'

if (!process.env.NODEKEY)
  throw Error('A unique node key must be set using the environment variable NODEKEY.')

export interface Result {
  status: string
  statusCode: number
  result?: ValidOutput
  error?: {
    name: string
    message: string
  }
}

export const log = (itemToLog: any): void => {
  if (process.env.LOGGING) {
    console.log(itemToLog)
  }
}

export const createRequest = async (
  input: any,
  callback: (status: number, result: Result) => void
) => {
  log('INPUT: ' + JSON.stringify(input))
  // Validate the request
  try {
    if (!Validator.isValidInput(input)) {
      // The validator will return true if the input is valid
      // or throw an error so this line will never be reached.
      // The line is kept solely for type checking.
      return
    }
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500, {
      status: 'errored',
      statusCode: 500,
      error: {
        name: 'Input Validation Error: ',
        message: `${error.message}`
      }
    })
    return
  }
  // 'output' contains the value returned from the user-provided code
  let output: unknown
  // execute the user-provided code in the sandbox
  try {
    output = await Sandbox.evaluate(input.js, input.vars)
  } catch (untypedError) {
    const javascriptError = untypedError as JavaScriptError
    log(javascriptError)
    callback(500, javascriptError.toJSONResponse())
    return
  }
  log(output)
  try {
    if (!Validator.isValidOutput(output)) {
      // The validator will return true if the output is valid
      // or throw an error so this line will never be reached.
      // The line is kept solely for type checking.
      return
    }
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500, {
      status: 'errored',
      statusCode: 500,
      error: {
        name: 'Output Validation Error: ',
        message: `${error.message}`
      }
    })
    return
  }
  // If everything is successful, reply with the validated result
  callback(200, {
    status: 'ok',
    statusCode: 200,
    result: output,
  })
}

// Export for GCP Functions deployment
exports.sandbox = async (req: Request, res: Response ) => {
  // set JSON content type and CORS headers for the response
  res.header('Content-Type', 'application/json')
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  // respond to CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
  } else {
    for (const key in req.query) {
      req.body[key] = req.query[key]
    }
    log('Input: ' + req.body)
    // Check to make sure the request is authorized
    if (req.body.nodeKey != process.env.NODEKEY) {
      res.status(401).json({ error: 'The nodeKey is invalid.' })
      log(`INVALID NODEKEY: ${req.body?.nodeKey}`)
      return
    }
    try {
      await createRequest(req.body, (status: number, result: Result): void => {
        log('Result: ' + JSON.stringify(result))
        res.status(status).json(result)
      })
    } catch (error) {
      log(error)
    }
  }
}
