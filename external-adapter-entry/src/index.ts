import { Log } from './Log'
import { Validator } from './Validator'
import type { HexString, ValidInput, Variables } from './Validator'
import { DataStorage } from './GoogleCloudStorage'
import { IpfsFetcher } from './IpfsFetcher'
import { AdapterError, JavaScriptError } from './Errors'
import { Sandbox } from './Sandbox'

export interface Result {
  status: string
  statusCode: number
  jobRunId?: string
  result?: HexString
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
  let validatedInput: ValidInput
  try {
    validatedInput = Validator.validateInput(input)
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    callback(400, {
      status: 'errored',
      statusCode: 400,
      error: {
        name: 'Validation Error',
        message: 'Error validating input: ' + error.message
      }
    })
    return
  }

  // 'vars' contains the variables that will be passed to the sandbox
  let vars: Variables = {}
  // 'javascriptString' is the code which will be executed by the sandbox
  let javascriptString: string | undefined
  // check if any private data should be fetched from the adapter's database
  if (validatedInput.ref && validatedInput.contractAddress) {
    try {
      const privateData = await dataStorage.retrieveData(validatedInput.contractAddress, validatedInput.ref)
      Log.debug(JSON.stringify(privateData))
      vars = privateData.vars || {}
    } catch (untypedError) {
      const error = untypedError as Error
      Log.error(error.toString())
      callback(500, new AdapterError({
        jobRunID: validatedInput.id,
        message: `Storage Error! Please ensure the correct contract address and ref are used: ${error.message}`
      }).toJSONResponse())
      return
    }
  }
  // check if the JavaScript should be fetched from IPFS
  if (validatedInput.cid) {
    try {
      javascriptString = await ipfsFetcher.fetchJavaScriptString(validatedInput.cid)
    } catch (untypedError) {
      const error = untypedError as Error
      Log.error(error.toString())
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
    for (const variableName in validatedInput.vars)
      vars[variableName] = validatedInput.vars[variableName]
  }
  if (!javascriptString) {
    Log.error('No JavaScript code could be found for the request.')
    callback(406, new AdapterError({
        jobRunID: validatedInput.id,
        message: 'No JavaScript code could be found for the request.'
    }).toJSONResponse())
    return
  }
  try {
    const result = await Sandbox.evaluate(javascriptString, vars)
    callback(200, {
      jobRunId: validatedInput.id,
      result: result,
      statusCode: 200,
      status: 'ok'
    })
  } catch (untypedError) {
    if (
      (untypedError as JavaScriptError).name.includes('JavaScript Compilation Error') ||
      (untypedError as JavaScriptError).name.includes('JavaScript Runtime Error')
    ) {
      const error = untypedError as JavaScriptError
      callback(406, new JavaScriptError({
        jobRunID: validatedInput.id,
        name: error.name,
        message: error.message
      }).toJSONResponse())
    } else {
      const error = untypedError as Error
      callback(500, new AdapterError({
        jobRunID: validatedInput.id,
        message: error.message
      }).toJSONResponse())
    }
    Log.error((untypedError as Error).toString())
    return
  }
}
