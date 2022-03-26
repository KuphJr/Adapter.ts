import path from 'path'
import os from 'os'
import fs from 'fs'
import { SHA256 } from 'crypto-js'

import { log } from './logger'
import { Validator } from './Validator'
import { createRequest } from './index'
import type { Result } from './index'

export class ResponseCacher {
  ramStorageDir: string

  constructor(
    public persistantStorageDir = path.join(__dirname, 'cachedResponses'),
    ramStorageDir: string = 'cachedResponses'
  ) {
    this.ramStorageDir = path.join(os.tmpdir(), ramStorageDir)
    // create the required directories if they do not already exist
    if (!fs.existsSync(persistantStorageDir))
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    if (!fs.existsSync(this.ramStorageDir))
      fs.mkdirSync(this.ramStorageDir, { recursive: true })
  }

  getCachedResult(input: any): Result {
    log('GetCachedResult INPUT: ' + JSON.stringify(input))
    const validatedInput = Validator.validateInput(input)
    const timeToLive = validatedInput.ttl
    // don't include the ttl in the object hash
    delete validatedInput.ttl
    // Use the hash of the validated input from the request as the file name.
    const filename = SHA256(JSON.stringify(validatedInput)) + '.json'
    let cachedResultJSONstring: string
    try {
      if (fs.existsSync(path.join(this.ramStorageDir, filename))) {
        // If the cached result exists in RAM storage, use that.
        cachedResultJSONstring = fs.readFileSync(
          path.join(this.ramStorageDir, filename), {encoding: 'utf8'}
        )
      } else if (fs.existsSync(path.join(this.persistantStorageDir, filename))) {
        // If the cached result exists in persistant storage, use that.
        cachedResultJSONstring = fs.readFileSync(
          path.join(this.persistantStorageDir, filename), {encoding: 'utf8'}
        )
      } else {
        // If no cached result has been found, throw an error.
        throw Error('No current data for that request. The cache is now waiting to be filled.')
        // Instead of throwing an error, there should be some sort of 'Dummy response' that can be set by the user in the initial request or if ttl is exceeded
      }
      const cachedResult = JSON.parse(cachedResultJSONstring)
      if (Validator.isValidOutput(cachedResult.result)) {
        // If a time-to-live (ttl) is specified, only return
        // the cached data if it is younger than the ttl.
        if (!timeToLive ||
            (timeToLive && (Date.now() - cachedResult.POSIXtime) < timeToLive))
          return cachedResult.result
        else
          throw Error('The cached data is older than the ttl.')
      }
      throw Error('The cached result is invalid.')
    } finally {
      // Make a new Adapter.js request to refresh the cache.
      createRequest(input, (status: number, result: Result) => {
        if (status === 200) {
          const cachedResultString = JSON.stringify({
            // Record the time the cache was last filled
            POSIXtime: Date.now(),
            result
          })
          log('FILLING CACHE: ' + cachedResultString)
          try {
            fs.writeFileSync(path.join(this.ramStorageDir, filename), cachedResultString)
          } catch (_) {
            log('ERROR FILLING CACHE: COULD NOT WRITE TO RAM CACHE')
          }
          try {
            fs.writeFileSync(path.join(this.persistantStorageDir, filename), cachedResultString)
          } catch (_) {
            log('ERROR FILLING CACHE: COULD NOT WRITE TO DISK CACHE')
          }
        } else {
          log('ERROR FILLING CACHE: ' + JSON.stringify(result))
        }
      })
    }
  }
}