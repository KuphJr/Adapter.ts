import fs from 'fs'
import os from 'os'
import path from 'path'
import { NodeVM, VMScript } from 'vm2'
import type { Variables } from './Validator'

export class Sandbox {
  static async evaluate (javascriptString: string, vars: Variables): Promise<unknown> {
    // Clear the tmp directory before running the untrusted code to ensure
    // it does not have access to any cached data from the previously run script
    // in the case that the previous script exited prematurely.
    this.clearTmpDirectory()
    const vm = new NodeVM({
      console: 'off',
      sandbox: vars,
      require: {
        external: ['axios'],
        builtin: ['assert', 'buffer', 'crypto', 'dgram', 'dns', 'events', 'http', 'https', 'net', 'querystring', 'readline', 'stream', 'string_decoder', 'timers', 'tls', 'tty', 'url', 'util']
      }
    })
    let functionScript: VMScript
    // Try to compile the provided JavaScript code.
    try {
      functionScript = new VMScript(
        'module.exports = async function () {\n' + javascriptString + '\n}'
      ).compile()
    } catch (untypedError) {
      const error = untypedError as Error
      throw new JavaScriptCompilationError({
        name: error.name,
        message: error.message,
        details: error.stack
      })
    }
    // Try to run the provided JavaScript code.
    let sandboxedFunction: any
    let result: unknown
    try {
      sandboxedFunction = await vm.run(functionScript)
      result = await sandboxedFunction()
    } catch (untypedError) {
      const error = untypedError as Error
      throw new JavaScriptRuntimeError({
        name: error.name,
        message: error.message,
        details: error.stack
      })
    }
    // Clear the tmp directory after running the code to ensure it does not
    // leave any cached data on the FaaS instance.
    this.clearTmpDirectory()
    return result
  }

  private static clearTmpDirectory (): void {
    const dirents = fs.readdirSync(os.tmpdir())
    dirents.forEach(dirent => {
      try {
        fs.rmSync(path.join(os.tmpdir(), dirent), { recursive: true })
      } catch (error) {}
    })
  }
}

export abstract class JavaScriptError {
  status: string
  statusCode: number
  name: string
  message: string
  details: string

  constructor ({
    status = 'errored',
    statusCode = 500,
    name = 'JavaScript Error',
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
  constructor (errorParams: JavaScriptErrorParams) {
    super(errorParams, 'JavaScript Compilation Error')
  }
}

export class JavaScriptRuntimeError extends JavaScriptError {
  constructor (errorParams: JavaScriptErrorParams) {
    super(errorParams, 'JavaScript Runtime Error')
  }
}

interface JavaScriptErrorParams {
  name: string
  message: string
  details?: string
  status?: string
  statusCode?: number
}