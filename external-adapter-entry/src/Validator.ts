const process = require('process')

interface UnvalidatedInput {
  id?: string
  data?: {
    type?: string
    js?: string
    cid?: string
    vars?: string
    ref?: string
    contractAddress?: string
    cached?: boolean
    ttl?: number
  }
  meta?: {
    oracleRequest?: {
      requester?: string
    }
  }
}

export interface ValidInput {
  type: string
  id?: string
  js?: string
  cid?: string
  vars?: Variables
  ref?: string
  contractAddress?: string
  cached?: boolean
  ttl?: number
}

export interface Variables {
  [variableName: string]: any
}

export type ValidOutput = boolean | string | number | boolean[] | string[] | number[] | Buffer

export class Validator {
  constructor () {}

  static validateInput (input: UnvalidatedInput): ValidInput {
    if (!input.data)
      throw Error('No data input provided.')
    
    // validate type
    if (typeof input.data.type !== 'string')
      throw Error("The parameter 'type' must be provided as a string.")
    switch (input.data.type) {
      case ('bool'):
        break
      case ('uint'):
        break
      case ('uint256'):
        break
      case ('int'):
        break
      case ('int256'):
        break
      case ('bytes32'):
        break
      case ('string'):
        break
      case ('bytes'):
        break
      default:
        throw Error("Invalid value for the parameter 'type' which must be either " +
        "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.")
    }
    const validatedInput: ValidInput = { type: input.data.type }

    // validate id
    if (!input.id)
      input.id = '1'
    else if (typeof input.id !== 'string')
      throw Error("Invalid value for the parameter 'id' which must be a string.")
    validatedInput.id = input.id

    // validate js
    if (input.data.js && typeof input.data.js !== 'string')
      throw Error("Invalid value for the parameter 'js' which must be a string.")
    if (input.data.js)
      validatedInput.js = input.data.js
    
    // validate cid
    if (input.data.cid && typeof input.data.cid !== 'string')
      throw Error("Invalid value for the parameter 'cid' which must be a string.")
    if (input.data.cid)
      validatedInput.cid = input.data.cid

    // validate vars
    if (input.data.vars && typeof input.data.vars !== 'string')
      throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string.")
    if (input.data.vars) {
      try {
        input.data.vars = JSON.parse(input.data.vars)
      } catch (error) {
        throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string.")
      }
      if (!Validator.isVariables(input.data.vars))
        throw Error("Invalid value for the parameter 'vars' which must be a valid JSON object string that is not an array.")
      validatedInput.vars = input.data.vars
    }

    // validate ref
    if (input.data.ref) {
      if (typeof input.data.ref !== 'string')
        throw Error("Invalid value for the parameter 'ref' which must be a string")
      validatedInput.ref = input.data.ref
      if (typeof input.meta?.oracleRequest?.requester !== 'string')
        throw Error("Invalid jobspec setup.  Parameter 'meta.oracleRequest.requester' is required when referencing stored data.")
      validatedInput.contractAddress = input.meta.oracleRequest.requester
    }

    // validate cached & ttl
    if (input.data.cached) {
      if (typeof input.data.cached !== 'boolean')
        throw Error("Invalid value for the parameter 'cached' which must be a boolean.")
      validatedInput.cached = input.data.cached
    } else if (input.data.ttl) {
        throw Error("The 'ttl' parameter should not be provided if the 'cached' parameter is not provided.")
    }
    if (input.data.ttl && typeof input.data.ttl !== 'number')
      throw Error("Invalid value for the parameter 'ttl' which must be a number in seconds.")
    if (input.data.ttl)
      validatedInput.ttl = input.data.ttl

    // validate that js, cid or ref is present
    if (!validatedInput.js && !validatedInput.cid && !validatedInput.ref)
      throw Error("At least one of the parameters 'js', 'cid' or 'ref' must be provided.")

    return validatedInput as ValidInput
  }

  static validateOutput(type: string, output: unknown): ValidOutput {
    if (!output)
      throw Error('The provided JavaScript did not return a value or returned an undefined value.')
    switch (type) {
      case ('bool'):
        if (typeof output !== 'boolean')
          throw Error('The returned value must be a boolean. Returned: ' + output)
        break
      case ('uint'): case ('uint256'):
        if (typeof output !== 'number')
          throw Error('The returned value must be a number. Returned: ' + output)
        if (output % 1 !== 0 || output < 0)
          throw Error('The returned value must be a positive integer. Returned: ' + output)
        break
      case ('int'): case ('int256'):
        if (typeof output !== 'number')
          throw Error('The returned value must be a number. Returned: ' + output)
        if (output % 1 !== 0)
          throw Error('The returned value must be an integer. Returned: ' + output)
        break
      case ('string'):
        if (typeof output !== 'string')
          throw Error('The returned value must be a string. Returned: ' + output)
        break
      case ('bytes32'): case ('bytes'):
        break
      default:
        throw Error("Invalid value for the parameter 'type' which must be either " +
        "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.")
    }
    if (Validator.isValidOutput(output))
      return output
    else
      throw Error('Invalid output.')
  }

  private static isValidOutput = (output: unknown): output is ValidOutput => {
    if (JSON.stringify(output).length > 1000)
      throw new Error('The output returned by the JavaScript code is larger than 1 KB')
    switch (typeof output) {
      case 'boolean':
      case 'string':
      case 'number':
        return true
      case 'object':
        if (Buffer.isBuffer(output))
          return true
      default:
        throw new Error("The output returned by the JavaScript code is not of type 'boolean', 'number', 'string', or 'Buffer'.")
    }
  }

  private static isVariables = (variables: unknown): variables is Variables => {
    if (typeof variables !== 'object')
      return false
    if (Array.isArray(variables))
      return false
    if (Buffer.isBuffer(variables))
      return false
    for (const variable of Object.keys(variables as Variables)) {
      if (typeof variable !== 'string')
        return false
    }
    return true
  }
}
