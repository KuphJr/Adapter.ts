import { Request, Response } from 'express'

import { log } from './logger'
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

export const createRequest = async (
  input: any,
  callback: (status: number, result: Result) => void
) => {
  log("INPUT: " + JSON.stringify(input))
  // ensure the PUBLICKEY environmental variable has been set
  if (typeof process.env.PUBLICKEY !== 'string') {
    log('SETUP ERROR: The PUBLICKEY environmental variable has not been set')
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Setup Error',
          message: 'The PUBLICKEY environmental variable has not been set'
        }
      }
    )
    return
  }
  try {
    if (!StoredDataValidator.isValidStoredData(input))
      throw Error('Input is invalid.')
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Validation Error',
          message: 'Error validating input: ' + error.message
        }
      }
    )
    return
  }
  // Future Plans: Use a a smart contract to see if the requester paid a set amount
  // of LINK required to store stored data in the external adapter's database.
  const storage = new DataStorage({ publicKey: process.env.PUBLICKEY });
  try {
    await storage.storeData(input)
  } catch (untypedError) {
    const error = untypedError as Error
    log(error)
    callback(500,
      {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Data Storage Error',
          message: error.message
        }
      })
    return
  }
  log('SUCCESS')
  callback(200, {
    status: 'Success',
    statusCode: 200
  })
}

// Export for GCP Functions deployment
exports.gcpservice = async (req: Request, res: Response ) => {
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
  } else {
    for (const key in req.query) {
      req.body[key] = req.query[key]
    }
    try {
      await createRequest(req.body, (statusCode, data) => {
        res.status(statusCode).send(data)
      })
    } catch (error) {
      log('ERROR: ' + error)
    }
  }
}
