import axios from 'axios'
import process from 'process'

import { Log } from './Log'
import { HexString, Validator, ValidOutput } from './Validator'
import type { Variables } from './Validator'

export class Sandbox {
  static async evaluate (
    nodeKey: string,
    type: string,
    javascriptString: string,
    vars: Variables
  ): Promise<HexString> {
    if (!process.env.SANDBOXURL)
    throw new Error('SANDBOXURL was not provided in environement variables.')
    const { data } = await axios.post(
      process.env.SANDBOXURL,
      {
        nodeKey,
        js: javascriptString,
        vars: vars
      },
      {
        timeout: process.env.SANDBOXTIMEOUT ? parseInt(process.env.SANDBOXTIMEOUT) : 14000
      }
    )
    return Validator.validateOutput(type, data.result)
  }
}