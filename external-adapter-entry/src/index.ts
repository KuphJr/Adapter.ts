import { Request, Response } from 'express'

import { log } from './logger'
import type { ValidCachedData } from './CachedDataValidator'
import { Validator } from './Validator'
import type { ValidInput, ValidOutput, Variables } from './Validator'
import { DataStorage } from './GoogleCloudStorage'
import { IpfsFetcher } from './IpfsFetcher'
import { AdapterError } from './Errors'
import { Sandbox } from './Sandbox'

export interface Result {
  status: string
  statusCode: number
  jobRunId?: string
  result?: ValidOutput
  error?: {
    name: string
    message: string
  }
}

export interface Error {
  message: string
}

export const createRequest = async (
  input: any,
  callback: (status: number, result: Result) => void
) => {
  log("INPUT: " + JSON.stringify(input))
  if (process.env.NODEKEY && input?.data?.nodeKey !== process.env.NODEKEY) {
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Setup Error',
          message: 'Request does not contain a valid nodeKey.'
        }
      }
    )
    return
  }
  // ensure the PUBLICKEY environmental variable has been set
  if (typeof process.env.PRIVATEKEY !== 'string') {
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Setup Error',
          message: 'The PRIVATEKEY environmental variable has not been set'
        }
      }
    )
    return
  }
  let validatedInput: ValidInput
  try {
    validatedInput = Validator.validateInput(input)
  } catch (untypedError) {
    const error = untypedError as Error
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Validation Error',
          message: 'Error validating input: ' + error.message
        }
      }
    )
    return
  }
  // 'vars' contains the variables that will be passed to the sandbox
  let vars = {} as Variables
  // 'javascriptString' is the code which will be executed by the sandbox
  let javascriptString: string | undefined
  // check if any cached data should be fetched from the adapter's database
  try {
    const storage = new DataStorage({ privateKey: process.env.PRIVATEKEY })
    let validCachedData: ValidCachedData
    if (validatedInput.contractAddress && validatedInput.ref) {
      validCachedData = await storage.retrieveData(validatedInput.contractAddress, validatedInput.ref)
      if (validCachedData.js) javascriptString = validCachedData.js
      if (validCachedData.vars) vars = validCachedData.vars
    }
  } catch (untypedError) {
    const error = untypedError as Error
    callback(500,
      new AdapterError({
        jobRunID: validatedInput.id,
        message: `Storage Error: ${error.message}`
      }).toJSONResponse()
    )
  }
  // check if the JavaScript should be fetched from IPFS
  if (validatedInput.cid) {
    try {
      javascriptString = await IpfsFetcher
        .fetchJavaScriptString(validatedInput.cid)
    } catch (untypedError) {
      const error = untypedError as Error
      callback(500,
        new AdapterError({
          jobRunID: validatedInput.id,
          message: `IPFS Error: ${error.message}`
        }).toJSONResponse()
      )
      return
    }
  }
  // check if the JavaScript string was provided directly
  if (validatedInput.js) javascriptString = validatedInput.js
  // add any variables that were provided directly
  if (validatedInput.vars) {
    for (const variableName of Object.keys(validatedInput.vars)) {
      vars[variableName] = validatedInput.vars[variableName]
    }
  }
  if (!javascriptString) {
    callback(500,
      new AdapterError({
        jobRunID: validatedInput.id,
        message: `No JavaScript code could be found for the request.`
      }).toJSONResponse()
    )
    return
  }
  const result = await Sandbox.evaluate(validatedInput.type, javascriptString, vars)
  callback(200, {
    jobRunId: validatedInput.id,
    result: result,
    statusCode: 200,
    status: 'ok'
  })
}

// Export for GCP Functions deployment
exports.gcpservice = async (req: Request, res: Response ) => {
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
    try {
      await createRequest(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
      })
    } catch (error) {
      console.log(error)
    }
  }
}
