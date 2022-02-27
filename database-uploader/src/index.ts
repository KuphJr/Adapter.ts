import { Request, Response } from 'express'

import { log } from './logger'
import { CachedDataValidator } from './CachedDataValidator'
import type { ValidCachedData } from './CachedDataValidator'
import { Encryptor } from './Encryptor'
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
  let validInput: ValidCachedData
  try {
    if (CachedDataValidator.isValidCachedData(input)) {
      validInput = input
    } else {
      throw Error('Input is invalid.')
    }
  } catch (untypedError) {
    const error = untypedError as Error
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
  // of LINK required to store cached data in the external adapter's database.
  const encryptedObj = Encryptor.encrypt(process.env.PUBLICKEY, validInput)
  const storage = new DataStorage();
  try {
    await storage.storeData(validInput.contractAddress, validInput.ref, encryptedObj)
  } catch (untypedError) {
    const error = untypedError as Error
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
      console.log(error)
    }
  }
}
