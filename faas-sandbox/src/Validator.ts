export interface Variables {
  [variableName: string]: any
}

export interface ValidRequest {
  js: string
  vars: Variables
}

export type ValidOutput = boolean | string | number | boolean[] | string[] | number[] | Buffer

export class Validator {
  static isValidInput (input: unknown): input is ValidRequest {
    if (typeof (input as ValidRequest).js !== 'string') {
      throw new Error("The parameter 'js' must be provided as a string.")
    }
    if (
      Array.isArray((input as ValidRequest).vars)
      || !isVariables((input as ValidRequest).vars)
    ) {
      throw new Error("The parameter 'vars' must be provided as a JavaScript object and cannot be an array.")
    }
    return true
  }

  static isValidOutput = (output: unknown): output is ValidOutput => {
    if (JSON.stringify(output).length > 1000) {
      throw new Error('The output returned by the JavaScript code is larger than 1 KB')
    }
    switch (typeof output) {
      case 'boolean':
      case 'string':
      case 'number':
        return true
      case 'object':
        if (Array.isArray(output)) {
          switch (typeof output[0]) {
            case 'boolean':
            case 'string':
            case 'number':
              return true
          }
        }
        if (Buffer.isBuffer(output)) return true
      default: throw new Error("The output returned by the JavaScript code is not of type 'boolean', 'string', 'number', 'boolean[]', 'string[]', 'number[]' or 'Buffer'")
    }
  }
}

const isVariables = (variables: unknown): variables is Variables => {
  if (!variables) {
    return false
  }
  for (const variable of Object.keys(variables as Variables)) {
    if (typeof variable !== 'string') return false
  }
  return true
}
