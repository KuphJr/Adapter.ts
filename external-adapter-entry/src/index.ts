import { Request, Response } from 'express'

import { log } from './logger'
import type { ValidStoredData } from './StoredDataValidator'
import { Validator } from './Validator'
import type { ValidInput, ValidOutput, Variables } from './Validator'
import { DataStorage } from './GoogleCloudStorage'
import { IpfsFetcher } from './IpfsFetcher'
import { AdapterError, JavaScriptError } from './Errors'
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
  ipfsFetcher: IpfsFetcher,
  dataStorage: DataStorage,
  callback: (status: number, result: Result) => void
): Promise<void> => {
  log("INPUT: " + JSON.stringify(input))
  // ensure the PRIVATEKEY environmental variable has been set
  if (typeof process.env.PRIVATEKEY !== 'string') {
    log('SETUP ERROR: The PRIVATEKEY environmental variable has not been set')
    callback(500, {
      status: 'errored',
      statusCode: 500,
      error: {
        name: 'Setup Error',
        message: 'The PRIVATEKEY environmental variable has not been set'
      }
    })
    return
  }
  let validatedInput: ValidInput
  try {
    validatedInput = Validator.validateInput(input)
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500, {
      status: 'errored',
      statusCode: 500,
      error: {
        name: 'Validation Error',
        message: 'Error validating input: ' + error.message
      }
    })
    return
  }
  // 'vars' contains the variables that will be passed to the sandbox
  let vars = {} as Variables
  // 'javascriptString' is the code which will be executed by the sandbox
  let javascriptString: string | undefined
  // check if any cached data should be fetched from the adapter's database
  try {
    let validCachedData: ValidStoredData
    if (validatedInput.contractAddress && validatedInput.ref) {
      validCachedData = await dataStorage.retrieveData(validatedInput.contractAddress, validatedInput.ref)
      console.log(JSON.stringify(validCachedData.js))
      if (validCachedData.js)
        javascriptString = validCachedData.js
      if (validCachedData.vars)
        vars = validCachedData.vars
    }
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500, new AdapterError({
      jobRunID: validatedInput.id,
      message: `Storage Error: ${error.message}`
    }).toJSONResponse())
    return
  }
  // check if the JavaScript should be fetched from IPFS
  if (validatedInput.cid) {
    try {
      javascriptString = await ipfsFetcher.fetchJavaScriptString(validatedInput.cid)
    } catch (untypedError) {
      const error = untypedError as Error
      log(error)
      callback(500, new AdapterError({
          jobRunID: validatedInput.id,
          message: `IPFS Error: ${error.message}`
      }).toJSONResponse())
      return
    }
  }
  // check if the JavaScript string was provided directly
  if (validatedInput.js)
    javascriptString = validatedInput.js
  // add any variables that were provided directly
  if (validatedInput.vars) {
    for (const variableName of Object.keys(validatedInput.vars)) {
      vars[variableName] = validatedInput.vars[variableName]
    }
  }
  if (!javascriptString) {
    log(Error('No JavaScript code could be found for the request.'))
    callback(500, new AdapterError({
        jobRunID: validatedInput.id,
        message: `No JavaScript code could be found for the request.`
    }).toJSONResponse())
    return
  }
  let result: ValidOutput
  try {
    result = await Sandbox.evaluate(validatedInput.nodeKey, validatedInput.type, javascriptString, vars)
  } catch (untypedError) {
    if ((untypedError as JavaScriptError).name === 'JavaScript Error') {
      const error = untypedError as JavaScriptError
      log(error)
      callback(500, new JavaScriptError({
        jobRunID: validatedInput.id,
        name: error.name,
        message: error.message,
        details: error.details
      }).toJSONResponse())
      return
    } else {
      const error = untypedError as Error
      log(error)
      callback(500, new AdapterError({
        jobRunID: validatedInput.id,
        message: error.message
      }).toJSONResponse())
    }
    return
  }
  log(`SUCCESS jobRunId: ${validatedInput.id} result: ${result}`)
  callback(200, {
    jobRunId: validatedInput.id,
    result: result,
    statusCode: 200,
    status: 'ok'
  })
  return
}
