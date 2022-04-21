export interface Variables {
  [variableName: string]: any
}

export interface ValidRequest {
  js: string
  vars: Variables
}

export type ValidOutput = boolean | string | number | bigint | boolean[] | string[] | number[] | bigint[] | Buffer

export class Validator {
  static isValidInput (input: unknown): input is ValidRequest {
    if (typeof (input as ValidRequest).js !== 'string')
      throw Error("The parameter 'js' must be provided as a string.")
    if (
      (input as ValidRequest).vars &&
      (Array.isArray((input as ValidRequest).vars)
      || !Validator.isVariables((input as ValidRequest).vars))
    )
      throw Error("The parameter 'vars' must be provided as a JavaScript object and cannot be an array.")
    return true
  }

  static isValidOutput = (output: unknown): output is ValidOutput => {
    if (JSON.stringify(output).length > 1024)
      throw Error('The output returned by the JavaScript code is larger than 1 KB')
    if (Buffer.isBuffer(output))
      return true
    switch (typeof output) {
      case 'boolean':
      case 'string':
      case 'number':
      case 'bigint':
        return true
      default:
        throw Error(
          "The output returned by the JavaScript code is not of type 'boolean', 'number', 'bigint' or string"
        )
    }
  }

  private static isVariables = (variables: unknown): variables is Variables => {
    if (typeof variables !== 'object') return false
    for (const variable of Object.keys(variables as Variables)) {
      if (typeof variable !== 'string') return false
    }
    return true
  }
}
