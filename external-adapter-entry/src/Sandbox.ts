import axios from 'axios'
import process from 'process'

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
      console.log('Making axios request')
      console.log(sandboxUrl)
      const { data } = await axios.post(sandboxUrl, {
        js: javascriptString,
        vars: vars
      })
      console.log('axios response')
      console.log(data)
      const result = data.result
      if (Validator.validateOutput(type, result))
        return result
      else
        throw new Error('Invalid Output')
    } catch (error: any) {
      console.log(error)
      if (error?.response?.data?.error) {
        throw error.response.data.error
      } else {
        throw error
      }
    }
  }
}