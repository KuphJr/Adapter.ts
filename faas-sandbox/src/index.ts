import process from 'process'

import { Request, Response } from 'express'
import { Validator } from './Validator'
import type { ValidOutput } from './Validator'
import type { JavaScriptError } from './Sandbox'
import { Sandbox } from './Sandbox'
// import { TimestampSignature } from './TimestampSignature'

// if (!process.env.PUBLICKEY)
//   throw Error('The public key must be set using the environment variable PUBLICKEY.')
// const timestampSignature = new TimestampSignature('', process.env.PUBLICKEY)

// const latencyToleranceMs = process.env.TOLERANCE ? parseInt(process.env.TOLERANCE) : 1000

// // Export for FaaS deployment
// exports.sandbox = async (req: Request, res: Response ) => {
//   // set JSON content type and CORS headers for the response
//   res.header('Content-Type', 'application/json')
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Headers', 'Content-Type')
//   // respond to CORS preflight requests
//   if (req.method === 'OPTIONS') {
//     res.set('Access-Control-Allow-Methods', 'GET')
//     res.set('Access-Control-Allow-Headers', 'Content-Type')
//     res.set('Access-Control-Max-Age', '3600')
//     res.status(204).send('')
//     return
//   }
//   Log.info('Input\n' + JSON.stringify(req.body))
//   // Check to make sure the request is authorized
//   if (typeof req.body.timestamp !== 'number' || typeof req.body.signature !== 'string') {
//     res.status(401).json({ error: 'The timestamp and/or signature are missing or invalid.' })
//     Log.error('The timestamp and/or signature are missing.')
//     return
//   }
//   const currentTime = Date.now()
//   if (Math.abs(currentTime - parseInt(req.body.timestamp)) > latencyToleranceMs) {
//     res.status(401).json({ error: 'The timestamp is beyond the latency threshold bounds.' })
//     Log.error('The timestamp is beyond the latency threshold bounds.')
//     return
//   }
//   if (!timestampSignature.verifySignature(req.body.timestamp.toString(), req.body.signature)) {
//     res.status(401).json({ error: 'The signature is invalid.' })
//     Log.error('The signature is invalid.')
//     return
//   }
//   try {
//     await createRequest(req.body, (status: number, result: Result): void => {
//       Log.info('Result\n' + JSON.stringify(result))
//       res.status(status).json(result)
//     })
//   } catch (untypedError) {
//     const error = untypedError as Error
//     Log.error(error.toString())
//     res.status(500).send(error.message)
//   }
// }

// Process request
export const createRequest = async (
  input: any,
  callback: (status: number, result: Result) => void
) => {
  // Validate the request
  try {
    if (!Validator.isValidInput(input))
      return
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    callback(400, {
      status: 'errored',
      statusCode: 400,
      error: {
        name: 'Invalid Input',
        message: `${error.message}`
      }
    })
    return
  }
  // Execute the user-provided code in the sandbox
  let output: unknown
  try {
    output = await Sandbox.evaluate(input.js, input.vars)
  } catch (untypedError) {
    const javascriptError = untypedError as JavaScriptError
    Log.error(javascriptError.toString())
    callback(406, javascriptError.toJSONResponse())
    return
  }
  Log.debug('Sandbox Output\n')
  Log.debug((output as any)?.toString() || '')
  // Validate the type of the returned value
  let validatedOutput: ValidOutput
  try {
    validatedOutput = Validator.validateOutput(output)
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    callback(406, {
      status: 'errored',
      statusCode: 406,
      error: {
        name: 'Output Validation Error',
        message: `${error.message}`
      }
    })
    return
  }
  callback(200, {
    status: 'ok',
    statusCode: 200,
    result: validatedOutput,
  })
}

export interface Result {
  status: string
  statusCode: number
  result?: ValidOutput
  error?: {
    name: string
    message: string
  }
}

type LogFunction = (message: string) => void

export class Log {
  static warn: LogFunction = (item) =>
    console.log('⚠️ Warning: ' + item.toString())

  static error: LogFunction = (item) =>
    console.log('🛑 Error: ' + item.toString())

  static info: LogFunction = (item) => {
    if (process.env.LOGGING)
      console.log('💬 Info: ' + item.toString())
  }

  static debug: LogFunction = (item) => {
    if (process.env.LOGGING === 'debug')
      console.log('🐞 Debug: ' + item.toString())
  }
}
