import { utils } from 'ethers'

export interface ValidStoredData {
  contractAddress: string
  ref: string
  vars: {
    [key: string]: any
  }
}

export class StoredDataValidator {
  static isValidStoredData(input: any): input is ValidStoredData {
    // Check if the contract address is valid
    if (!input.contractAddress)
      throw new Error(`The authorized contract address was not provided.`)
    try {
      utils.getAddress(input.contractAddress)
    } catch {
      throw new Error(`The given contract address ${input.contractAddress} is not valid.`)
    }
    // Check if the reference ID is valid
    if (typeof input.ref !== 'string')
      throw new Error(`The reference ID was not provided as a string.`)
    if (input.ref.length > 31 || input.ref.length < 4)
      throw new Error('The reference ID must contain at least 4 and at most 31 characters')
    for (const char of input.ref) {
      if ((char < '0' || char > '9') && (char < 'a' || char > 'z' ) && (char < 'A' || char > 'Z'))
        throw new Error('The reference ID can only contain alphabetical characters and numbers.')
    }
    // Check if variables are a valid JavaScript object
    if (typeof input.vars !== 'object')
      throw new Error('The stored variables must be provided as a JavaScript object.')
    if (JSON.stringify(input).length > 8000000)
      throw new Error('The data object must be less than 8 MB.')
    return true
  }
}
