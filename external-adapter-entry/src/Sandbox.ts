import axios from 'axios'
import process from 'process'

import { Validator, ValidOutput } from './Validator'
import type { Variables } from './Validator'

// @TODO: Change the variable below to match the URL of the 'faas-sandbox' deployment
const sandboxUrl = process.env.SANDBOXURL

export class Sandbox {
  static async evaluate (
    type: string,
    javascriptString: string,
    vars: Variables
  ): Promise<ValidOutput> {
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
      if (error?.response?.data?.error) {
        throw error.response.data.error
      } else {
        throw error
      }
    }
  }
}