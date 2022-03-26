import { Validator } from './Validator'
import type { ValidOutput } from './Validator'
import { JavaScriptError } from './Errors'
import { Sandbox } from './Sandbox'
import { log } from './logger'

export interface Result {
  status: string
  statusCode: number
  result?: ValidOutput
  error?: {
    name: string
    message: string
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