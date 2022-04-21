import { utils } from 'ethers'
import { buffer } from 'stream/consumers'

interface UnvalidatedInput {
  nodeKey: string
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
  nodeKey: string
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

export type ValidOutput = boolean | string | number | bigint

export type HexString = string

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
      case ('uint'):
      case ('uint256'):
      case ('int'):
      case ('int256'):
      case ('bytes32'):
      case ('string'):
      case('byte[]'):
      case ('bytes'):
        break
      default:
        throw Error("Invalid value for the parameter 'type' which must be either " +
        "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string', 'bytes' or 'byte[]'.")
    }
    const validatedInput: ValidInput = { nodeKey: input.nodeKey, type: input.data.type }

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
      validatedInput.contractAddress = input.meta.oracleRequest.requester.toLowerCase()
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

  static validateOutput(type: string, output: unknown): HexString {
    let hexString: HexString
    if (typeof output === 'undefined')
      throw Error('The provided JavaScript did not return a value or returned an undefined value.')
    switch (type) {
      case ('bool'):
        if (typeof output !== 'boolean')
          throw Error('The returned value must be a boolean. Returned: ' + output)
        hexString = output ?
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' :
        '0x0000000000000000000000000000000000000000000000000000000000000000'
        break
      case ('uint'): case ('uint256'):
        if (typeof output !== 'number' || typeof output)
          throw Error('The returned value must be a number. Returned: ' + output)
        if (output % 1 !== 0 || output < 0)
          throw Error('The returned value must be a positive integer. Returned: ' + output)
        hexString = utils.hexZeroPad(utils.hexlify(output), 32)
        break
      case ('int'): case ('int256'):
        if (typeof output !== 'number')
          throw Error('The returned value must be a number. Returned: ' + output)
        if (output % 1 !== 0)
          throw Error('The returned value must be an integer. Returned: ' + output)
        hexString = utils.hexZeroPad(utils.hexlify(output), 32)
        break
      case ('bytes32'):
        if (typeof output !== 'string' ||
          (output.length > 31 && output.length !== 66) ||
          (output.length === 66 && !utils.isHexString(output))
        )
          throw Error('The returned value must be a valid 32 byte hex string or a string of less than 32 characters. Returned: ' + output)
        hexString = output.length === 66 ?
          output :
          utils.hexZeroPad(Buffer.from(output).toString('hex'), 32)
        break
      case ('string'):
        if (typeof output !== 'string' || output.length > 1024)
          throw Error('The returned value must be a string containg less than 1024 characters. Returned: ' + output)
        hexString = Buffer.from(output).toString('hex')
        break
      case ('bytes'): case ('byte[]'):
        if (typeof output !== 'string' || output.length > 2050 || !utils.isHexString(output))
          throw Error('The returned value must be a valid hex string containing less than 1024 bytes. Returned: ' + output)
        hexString = output
        break
      default:
        throw Error("Invalid value for the parameter 'type' which must be either " +
        "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string', 'bytes' or 'byte[]'.")
    }
    return hexString
  }

  static isValidOutput = (output: unknown): output is ValidOutput => {
    if (JSON.stringify(output).length > 1024)
      throw new Error('The output returned by the JavaScript code is larger than 1 KB')
    switch (typeof output) {
      case 'boolean':
      case 'string':
      case 'number':
      case 'bigint':
        return true
      default:
        throw new Error("The output returned by the JavaScript code is not of type 'boolean', 'number', 'bigint' or 'string'.")
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
