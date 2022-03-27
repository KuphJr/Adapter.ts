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
    public persistantStorageDir = path.join(__dirname, '..', 'cachedResponses'),
    public ramCaching = false,
    ramStorageDir: string = 'cachedResponses'
  ) {
    this.ramStorageDir = path.join(os.tmpdir(), ramStorageDir)
    // create the required directories if they do not already exist
    console.log(this.persistantStorageDir)
    if (!fs.existsSync(persistantStorageDir)){
      log('CREATING PERSISTANT STORAGE DIRECTORY')
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    }
    if (this.ramCaching && !fs.existsSync(this.ramStorageDir))
      fs.mkdirSync(this.ramStorageDir, { recursive: true })
  }

  getCachedResult(
    input: any,
    callback: (status: number, result: Result) => void
  ): void {
    log('GETCACHEDRESULT INPUT: ' + JSON.stringify(input))
    const validatedInput = Validator.validateInput(input)
    const timeToLive = validatedInput.ttl
    // don't include the ttl in the object hash
    delete validatedInput.ttl
    // Use the hash of the validated input from the request as the file name.
    const filename = SHA256(JSON.stringify(validatedInput)) + '.json'
    let cachedResultJSONstring: string
    try {
      if (this.ramCaching && fs.existsSync(path.join(this.ramStorageDir, filename))) {
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
        // If no cached result has been found, send back an error.
        /** @TODO Instead of throwing an error, should there be some sort of 'Dummy response'
         * that can be set by the user in the initial request or if ttl is exceeded? */
        callback(500, {
          status: 'errored',
          statusCode: 500,
          error: {
            name: 'Cold cache',
            message: 'No current data for that request. The cache is being filled.'
          }
        })
        return
      }
      const cachedResult = JSON.parse(cachedResultJSONstring)
      if (Validator.isValidOutput(cachedResult.response.result)) {
        // If a time-to-live (ttl) is specified, only return
        // the cached data if it is younger than the ttl.
        if (!timeToLive || (Date.now() - cachedResult.timeLastFulfilled) < timeToLive * 1000) {
          log(`RETURNING CACHED RESULT: ${cachedResult.response}`)
          callback(200, {
            jobRunId: validatedInput.id,
            result: cachedResult.response.result,
            statusCode: 200,
            status: 'ok'
          })
          return
        } else {
          callback(500, {
            status: 'errored',
            statusCode: 500,
            error: {
              name: 'Time to live exceeded',
              message: 'The cached data is older than the ttl. The cache is being filled with fresh data.'
            }
          })
          return
        }
      }
      callback(500, {
        status: 'errored',
        statusCode: 500,
        error: {
          name: 'Invalid result',
          message: 'The cached result is invalid.'
        }
      })
      return
    } finally {
      // Make a new Adapter.js request to refresh the cache.
      createRequest(input, (status: number, response: Result) => {
        if (status === 200) {
          const cachedResultString = JSON.stringify({
            // Record the time the cache was last filled
            timeLastFulfilled: Date.now(),
            response
          })
          log('FILLING CACHE: ' + cachedResultString)
          try {
            if (this.ramCaching)
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
          log('ERROR FILLING CACHE: ' + JSON.stringify(response))
        }
      })
    }
  }
}