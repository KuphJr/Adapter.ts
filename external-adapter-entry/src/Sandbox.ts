import axios from 'axios'
import process from 'process'

import { log } from './logger'
import { Validator, ValidOutput } from './Validator'
import type { Variables } from './Validator'

export class Sandbox {
  static async evaluate (
    type: string,
    javascriptString: string,
    vars: Variables
  ): Promise<ValidOutput> {
    const sandboxUrl = process.env.SANDBOXURL
    if (!sandboxUrl) {
      throw new Error('SANDBOXURL was not provided in environement variables.')
    }
    try {
      const { data } = await axios.post(sandboxUrl, {
        js: javascriptString,
        vars: vars
      })
      const result = data.result
      if (Validator.validateOutput(type, result))
        return result
      else
        throw new Error('Invalid Output')
    } catch (error: any) {
      log(error)
      if (error?.response?.data?.error) {
        throw error.response.data.error
      } else {
        throw error
      }
    }
  }
}