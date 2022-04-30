import axios from 'axios'
import process from 'process'

import { Log } from './Log'
import { HexString, Validator, ValidOutput } from './Validator'
import type { Variables } from './Validator'
import { TimestampSignature } from './TimestampSigner'

if (!process.env.SANDBOXURL)
  throw Error('Setup Error: The SANDBOXURL environment variable has not been set.')
if (!process.env.PRIVATEKEY)
  throw Error('Setup Error: The SANDBOXURL environment variable has not been set.')

const timestampSignature = new TimestampSignature(process.env.PRIVATEKEY)

export class Sandbox {
  static async evaluate (
    nodeKey: string,
    type: string,
    javascriptString: string,
    vars: Variables
  ): Promise<HexString> {
    if (!process.env.SANDBOXURL)
      throw Error('SANDBOXURL was not provided in environement variables.')
    const timestamp = Date.now()
    try {
      const { data } = await axios.post(
        process.env.SANDBOXURL,
        {
          timestamp,
          signature: timestampSignature.generateSignature(timestamp.toString()),
          js: javascriptString,
          vars: vars
        },
        {
          timeout: process.env.SANDBOXTIMEOUT ? parseInt(process.env.SANDBOXTIMEOUT) : 14000
        }
      )
      return Validator.validateOutput(type, data.result)
    } catch (error: any) {
      Log.error(error)
      if (error?.response?.data?.error) {
        throw error.response.data.error
      } else {
        throw error
      }
    }
  }
}