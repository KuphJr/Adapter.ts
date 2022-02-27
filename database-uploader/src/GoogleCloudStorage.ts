import { Storage, Bucket } from '@google-cloud/storage';
import { SHA256 } from 'crypto-js'

import type { EncryptedObject } from './Encryptor'

export class DataStorage {
  storage: Storage
  bucket: Bucket

  constructor(keyFileName = 'key.json', bucketName = 'adapterjs-database') {
      this.storage = new Storage({ keyFilename: keyFileName })
      this.bucket = this.storage.bucket(bucketName)
  }

  async storeData(contractAddress: string, ref: string, input: EncryptedObject) {
    const filename = SHA256(contractAddress + ref).toString() + '.json'
    const file = this.bucket.file(filename)
    const fileExists = await file.exists()
    if (fileExists[0]) {
      throw new Error(
        `Reference ID ${ref} is already in use for contract ${contractAddress}.`
      )
    }
    const objectString = JSON.stringify(input)
    await file.save(objectString)
  }
}
