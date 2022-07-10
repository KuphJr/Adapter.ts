import { Request, Response } from 'express'

import { Log } from './Log'
import { StoredDataValidator } from './StoredDataValidator'
import { DataStorage } from './GoogleCloudStorage'

export interface Result {
  status: string
  statusCode: number
  error?: {
    name: string
    message: string
  }
}

if (typeof process.env.PUBLICKEY !== 'string')
  throw Error('The PUBLICKEY environment variable has not been set.')
const storage = new DataStorage({ publicKey: process.env.PUBLICKEY })

export const createRequest = async (
  input: any,
  callback: (status: number, result: Result) => void
) => {
  try {
    if (!StoredDataValidator.isValidStoredData(input))
      throw Error('Input is invalid.')
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    callback(400,
      {
        status: 'errored',
        statusCode: 400,
        error: {
          name: 'Validation Error',
          message: 'Error validating input: ' + error.message
        }
      }
    )
    return
  }
  // TODO: Use a a smart contract to see if the requester paid a set amount
  // of LINK required to store stored data in the external adapter's database.
  // This will discourage spam as well as provide an additional revenue stream for node operators.
  try {
    await storage.storeData(input)
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
    callback(405,
      {
        status: 'errored',
        statusCode: 405,
        error: {
          name: 'Data Storage Error',
          message: error.message
        }
      })
    return
  }
  callback(200, {
    status: 'Success',
    statusCode: 200
  })
}

// Export for GCP Functions deployment
exports.uploader = async (req: Request, res: Response ) => {
  // set JSON content type and CORS headers for the response
  res.header('Content-Type', 'application/json')
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  // respond to CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET')
    res.set('Access-Control-Allow-Headers', 'Content-Type')
    res.set('Access-Control-Max-Age', '3600')
    res.status(204).send('')
    return
  }
  Log.info('Input: ' + JSON.stringify(req.body))
  try {
    await createRequest(req.body, (statusCode, data) => {
      Log.info('Result: ' + statusCode.toString())
      res.status(statusCode).send(data)
    })
  } catch (untypedError) {
    const error = untypedError as Error
    Log.error(error.toString())
  }
}
