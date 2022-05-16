import { utils } from 'ethers'

interface UnvalidatedInput {
  id?: string
  data?: {
    type?: string
    js?: string
    cid?: string
    vars?: string
    ref?: string
    req?: string
    contractAddress?: string
  }
  meta?: {
    oracleRequest?: {
      requester?: string
    }
  }
}

export interface ValidInput {
  cached?: boolean
  id?: string
  js?: string
  cid?: string
  vars?: Variables
  ref?: string
  contractAddress?: string
}

export interface Variables {
  [variableName: string]: any
}

export type ValidOutput = HexString

export type HexString = string

export class Validator {
  constructor () {}

  static validateInput (input: UnvalidatedInput): ValidInput {
    if (!input.data)
      throw Error('No data input provided.')

    const validatedInput: ValidInput = {}

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
      if (typeof input.data.req !== 'string')
        throw Error("Invalid value for the 'req' parameter which must be a valid address.")
      validatedInput.contractAddress = input.data.req.toLowerCase()
    }

    // validate that js, cid or ref is present
    if (!validatedInput.js && !validatedInput.cid)
      throw Error("At least one of the parameters 'js' or 'cid' must be provided.")

    return validatedInput as ValidInput
  }

  static validateOutput(output: unknown): HexString {
    if (typeof output !== 'string')
      throw Error('The returned must be a valid hex string')
    if (output.length > 66 || !utils.isHexString(output))
      throw Error("The returned value must be a 32 byte hex string preceded with '0x'.")
    return utils.hexZeroPad(output, 32)
  }

  static isVariables = (variables: unknown): variables is Variables => {
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
