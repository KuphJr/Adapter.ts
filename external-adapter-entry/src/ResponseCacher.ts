import path from 'path'
import os from 'os'
import fs from 'fs'
import { md5 } from 'hash-wasm'

import { log } from './logger'
import { Validator } from './Validator'
import { createRequest } from './index'
import type { Result } from './index'

export class ResponseCacher {
  ramStorageDir: string

  constructor(
    public persistantStorageDir = path.join(__dirname, '..', '..', 'cachedResponses'),
    ramStorageDir: string = 'cachedResponses'
  ) {
    this.ramStorageDir = path.join(os.tmpdir(), ramStorageDir)
    // create the required directories if they do not already exist
    if (!fs.existsSync(persistantStorageDir)){
      fs.mkdirSync(persistantStorageDir, { recursive: true });
    }
    if (!fs.existsSync(this.ramStorageDir)){
      fs.mkdirSync(this.ramStorageDir, { recursive: true });
    }
  }

  getCachedResult(input: any): Result {
    log('GetCachedResult INPUT: ' + JSON.stringify(input))
    const validatedInput = Validator.validateInput(input)
    const filename = md5(JSON.stringify(validatedInput)) + '.json'
    try {
      if (fs.existsSync(path.join(this.ramStorageDir, filename))) {
        // If the cached result exists in RAM storage, use that.
        const cachedResult = JSON.parse(
          fs.readFileSync(path.join(this.ramStorageDir, filename), {encoding: 'utf8'})
        )
        if (Validator.isValidOutput(cachedResult.result)) return cachedResult.result
        throw new Error('The cached result is invalid.')
      } else if (fs.existsSync(path.join(this.persistantStorageDir, filename))) {
        // If the cached result exists in persistant storage, use that.
        const cachedResult = JSON.parse(
          fs.readFileSync(path.join(this.persistantStorageDir, filename), {encoding: 'utf8'})
        )
        if (Validator.isValidOutput(cachedResult.result)) return cachedResult.result
        throw new Error('The cached result is invalid.')
      } else {
        // If no cached result has been found, throw an error.
        throw new Error('No current data for that request.  The cache is now waiting to be filled.')
      }
    } finally {
      // Make a new Adapter.js request to refresh the cache.
      createRequest(input, (status: number, result: Result) => {
        if (status === 200) {
          const cachedResultString = JSON.stringify({
            // Record the time the cache was last filled
            UTCtime: new Date().toUTCString(),
            result
          })
          fs.writeFileSync(path.join(this.ramStorageDir, filename), cachedResultString)
          fs.writeFileSync(path.join(this.persistantStorageDir, filename), cachedResultString)
        }
      })
    }
  }
}