export class AdapterError extends Error {
  public jobRunID
  public status
  public statusCode
  public name
  public message
  details?: string | undefined

  constructor ({
    jobRunID = '1',
    status = 'errored',
    statusCode = 500,
    name = 'AdapterError',
    message = 'An error occurred.'
  }) {
    super(message)
    Error.captureStackTrace(this, AdapterError)

    this.jobRunID = jobRunID
    this.status = status
    this.statusCode = statusCode
    this.name = name
    this.message = message
  }

  toJSONResponse () {
    return {
      jobRunID: this.jobRunID,
      status: this.status,
      statusCode: this.statusCode,
      error: { name: this.name, message: this.message }
    }
  }
}

export class JavaScriptError {
  jobRunID: string
  status: string
  statusCode: number
  name: string
  message: string
  details: string

  constructor ({
    jobRunID = '1',
    status = 'errored',
    statusCode = 500,
    name = 'JavaScript Error',
    message = 'An error occurred',
    details = ''
  }) {
    this.jobRunID = jobRunID
    this.status = status
    this.statusCode = statusCode
    this.name = name
    this.message = message
    this.details = details
  }

  toJSONResponse () {
    return {
      jobRunID: this.jobRunID,
      status: this.status,
      statusCode: this.statusCode,
      error: { name: this.name, message: this.message, details: this.details }
    }
  }
}