export interface ValidatedInput {
  id: string
  type: string
  nodeKey?: string
  js?: string
  cid?: string
  vars?: Vars
  ref?: string
  contractAddress?: string
}

export interface UnvalidatedInput {
  id?: string
  nodeKey?: string
  data: {
    type: string
    js?: string
    cid?: string
    vars?: string | Vars
    ref?: string
  }
  meta: {
    oracleRequest: {
      requester?: string
    }
  }
}

export const isUnvalidatedInput = (input: unknown): input is UnvalidatedInput => {
  if ((input as UnvalidatedInput).data.type) {
    return true
  }
  return false
}

export interface Vars {
  [key: string]: any;
}

export class Validator {
  constructor (public input: UnvalidatedInput) {}

  validateInput (): ValidatedInput {
    const validatedInput: ValidatedInput = {
      id: '1',
      type: ''
    }
    if (typeof this.input.data.type !== 'string') {
      throw Error("The parameter 'type' must be provided as a string.")
    }
    switch (this.input.data.type) {
      case ('bool'):
      case ('uint'):
      case ('uint256'):
      case ('int'):
      case ('int256'):
      case ('bytes32'):
      case ('string'):
      case ('bytes'):
        break
      default:
        throw Error("Invalid value for the parameter 'type' which must be either " +
        "'bool', 'uint', 'uint256', 'int', 'int256', 'bytes32', 'string' or 'bytes'.")
    }
    validatedInput.type = this.input.data.type
    if (typeof this.input.id === 'string') {
      validatedInput.id = this.input.id
    } else if (this.input.id) {
      throw Error("Invalid value for the parameter 'id' which must be a string.")
    }
    if (this.input.data.js && typeof this.input.data.js !== 'string') {
      throw Error("Invalid value for the parameter 'js' which must be a string.")
    }
    if (typeof this.input.data.js === 'string') {
      validatedInput.js = this.input.data.js
    }
    if (this.input.data.cid && typeof this.input.data.cid !== 'string') {
      throw Error("Invalid value for the parameter 'cid' which must be a string.")
    }
    if (this.input.data.cid && this.input.data.js) {
      throw Error("Both of the parameter 'js' or 'cid' cannot be provided simultaneously.")
    }
    if (typeof this.input.data.cid === 'string') {
      validatedInput.cid = this.input.data.cid
    }
    if (typeof this.input.data.vars === 'string') {
      try {
        this.input.data.vars = JSON.parse(this.input.data.vars)
      } catch (error) {
        throw Error("The parameter 'vars' was not a valid JSON object string.")
      }
    }
    if (this.input.data.vars && typeof this.input.data.vars !== 'object') {
      throw Error("Invalid value for the parameter 'vars' which must be a JavaScript object or a string.")
    }
    if (this.input.data.vars) {
      validatedInput.vars = this.input.data.vars as Vars
    }
    if (this.input.data.ref) {
      if (typeof this.input.data.ref !== 'string') {
        throw Error("Invalid value for the parameter 'ref' which must be a string")
      }
      validatedInput.ref = this.input.data.ref
      if (!this.input.nodeKey || this.input.nodeKey !== process.env.NODEKEY) {
        throw Error('The node key is invalid.')
      }
      if (typeof this.input.meta.oracleRequest.requester !== 'string') {
        throw Error("Invalid value for the parameter 'contractAddress' which must be a string.")
      }
      validatedInput.contractAddress = this.input.meta.oracleRequest.requester
    }
    return validatedInput
  }
}