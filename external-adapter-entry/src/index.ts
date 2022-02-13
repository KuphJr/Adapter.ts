import { Request, Response } from 'express'
import { AdapterError, JavaScriptError } from './Errors'
import { Validator, ValidatedInput, isUnvalidatedInput, UnvalidatedInput, Vars } from './Validator'
import { IpfsFetcher } from './IpfsFetcher'
import { CachedDataFetcher } from './CachedDataFetcher'
import { Sandbox } from './Sandbox'
import { config } from 'dotenv'
config()

export interface AdapterResponse {
    jobRunID: string
    status: string
    statusCode: number
    result?: result
    error?: {
      name: string
      message: string
    }
}

type result = string | number | boolean;

export const createRequest =
  async (input: unknown,
  callback: (n: number, r: AdapterResponse) => void
): Promise<void> => {
  console.log('INPUT', JSON.stringify(input))
  let validatedInput
  let validator
  if (isUnvalidatedInput(input)) {
    validator = new Validator(input)
  } else {
    callback(500,
      new AdapterError({
        jobRunID: (input as UnvalidatedInput).id || '1',
        message: 'Input could not be validated.'
      }).toJSONResponse())
    return
  }
  try {
    validatedInput = validator.validateInput()
  } catch (error: unknown) {
    callback(500,
      new AdapterError({
        jobRunID: input.id || '1',
        message: `Input Validation Error: ${(error as Error).message}`
      }).toJSONResponse())
    return
  }
  // @TODO: Insert IPFS fetch here
  // @TODO: Insert cached data fetch here
  let output: result
  try {
    output = await Sandbox.evaluate(javascriptString, )
  }
}

