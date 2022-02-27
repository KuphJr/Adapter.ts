import path from 'path'
import fs from 'fs'
import os from 'os'
import { Storage, Bucket } from '@google-cloud/storage';
import { SHA1, SHA256 } from 'crypto-js'

import { Encryptor } from './Encryptor'
import type { EncryptedObject } from './Encryptor'
import type { ValidCachedData } from './CachedDataValidator';

export class DataStorage {
  storage: Storage
  bucket: Bucket
  private publicKey: string
  private privateKey: string

  constructor({
    publicKey = '',
    privateKey = '',
    keyFileName = 'key.json',
    bucketName = 'cached-data'
  }) {
      this.publicKey = publicKey
      this.privateKey = privateKey
      this.storage = new Storage({ keyFilename: keyFileName })
      this.bucket = this.storage.bucket(bucketName)
  }

  async storeData(input: ValidCachedData): Promise<void> {
    if (this.publicKey === '') {
      throw new Error('Public key has not been provided.')
    }
    const encryptedObj = Encryptor.encrypt(this.publicKey, input)
    const filename = SHA1(input.contractAddress + input.ref).toString() + '.json'
    const file = this.bucket.file(filename)
    const fileExists = await file.exists()
    if (fileExists[0]) {
      throw new Error(
        `Reference ID ${input.ref} is already in use for contract ${input.contractAddress}.`
      )
    }
    await file.save(JSON.stringify(encryptedObj))
  }

  async retrieveData(contractAddress: string, ref: string): Promise<ValidCachedData> {
    if (this.privateKey === '') {
      throw new Error('Private key has not been provided')
    }
    const filename = SHA1(contractAddress + ref).toString() + '.json'
    const localfile = path.join(os.tmpdir(), filename)
    try {
      try {
        await this.bucket.file(filename).download({ destination: localfile })
      } catch (untypedError) {
        const error = untypedError as Error
        throw new Error(`Unable to fetch cached data: ${error.message}`)
      }
      const encryptedObj = JSON.parse(
        fs.readFileSync(localfile, {encoding: 'utf8'})
      ) as EncryptedObject
      const cachedData = Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj)
      return cachedData
    } finally {
      // In the event of a failure, ensure the localfile has been deleted
      try {
        fs.unlinkSync(localfile)
      } catch {}
    }
  }
}
