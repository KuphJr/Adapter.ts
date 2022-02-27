export abstract class JavaScriptError {
  status: string
  statusCode: number
  name: string
  message: string
  details: string

  constructor ({
    status = 'errored',
    statusCode = 500,
    name = 'JavaScript Compilation Error',
    message = 'An error occurred',
    details = ''
  }, errorName: string) {
    this.status = status
    this.statusCode = statusCode
    this.name = errorName + ': ' + name
    this.message = message
    this.details = details
  }

  toJSONResponse () {
    return {
      status: this.status,
      statusCode: this.statusCode,
      error: { name: this.name, message: this.message, details: this.details }
    }
  }
}

export class JavaScriptCompilationError extends JavaScriptError  {
  constructor (errorParams: ErrorParams) {
    super(errorParams, 'JavaScript Compilation Error')
  }
}

export class JavaScriptRuntimeError extends JavaScriptError {
  constructor (errorParams: ErrorParams) {
    super(errorParams, 'JavaScript Runtime Error')
  }
}

interface ErrorParams {
  name: string
  message: string
  details?: string
  status?: string
  statusCode?: number
}