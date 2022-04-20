import path from 'path'
import process from 'process';
import fs from 'fs'
import { Storage, Bucket } from '@google-cloud/storage';
import { SHA256 } from 'crypto-js'

import { Encryptor } from './Encryptor'
import type { EncryptedObject } from './Encryptor'
import type { ValidStoredData } from './StoredDataValidator';
import { log } from './logger';

export class DataStorage {
  storage: Storage
  bucket: Bucket

  constructor(
    private privateKey = '',
    bucketName = 'adapterjs-encrypted-user-data',
    public persistantStorageDir = path.join(__dirname, '..', 'cache', 'database')
  ) {
    if (!fs.existsSync(persistantStorageDir)){
      log('CREATING PERSISTANT database STORAGE DIRECTORY')
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    }
    this.privateKey = privateKey
    const gcsPrivateKey = process.env.GCS_PRIVATE_KEY
    if (!gcsPrivateKey)
      throw Error("Setup Error: The 'GCS_PRIVATE_KEY' environment variable has not been set.")
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: gcsPrivateKey.replace(/\\n/g, '\n')
      }
    })
    this.bucket = this.storage.bucket(bucketName)
  }

  async retrieveData(contractAddress: string, ref: string): Promise<ValidStoredData> {
    console.log(`CONTRACT ADDRESS: ${contractAddress}, REF: ${ref}`)
    const filename = SHA256(contractAddress + ref).toString() + '.json'
    console.log(filename)
    const filepath = path.join(this.persistantStorageDir, filename)
    // Check to see if file has been previously downloaded and stored in cache
    if (!fs.existsSync(filepath)) {
      try {
        await this.bucket.file(filename).download({ destination: filepath })
      } catch (untypedError) {
        const error = untypedError as Error
        throw new Error(`Unable to fetch stored data: ${error.message}`)
      }
    }
    const encryptedObj = JSON.parse(fs.readFileSync(filepath, {encoding: 'utf8'})) as EncryptedObject
    const storedData = Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj)
    return storedData
  }
}
