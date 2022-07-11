import path from 'path'
import process from 'process';
import fs from 'fs'
import { Storage, Bucket } from '@google-cloud/storage';
import { SHA256 } from 'crypto-js'

import { Encryptor } from './Encryptor'
import type { EncryptedObject } from './Encryptor'
import type { ValidStoredData } from './StoredDataValidator';
import { Log } from './Log';

export class DataStorage {
  storage: Storage
  bucket: Bucket

  constructor(
    private privateKey: string,
    bucketName = process.env.BUCKET || 'adapterjs-encrypted-user-data',
    public persistantStorageDir = path.join(__dirname, '..', 'cache', 'database')
  ) {
    if (!fs.existsSync(persistantStorageDir)){
      Log.debug('Creating local data storage caching directory: ' + persistantStorageDir)
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    }
    if (!process.env.GCS_PROJECT_ID)
      throw Error("Setup Error: The 'GCS_PROJECT_ID' environment variable has not been set.")
    if (!process.env.GCS_CLIENT_EMAIL)
      throw Error("Setup Error: The 'GCS_CLIENT_EMAIL' environment variable has not been set.")
    if (!process.env.GCS_PRIVATE_KEY)
      throw Error("Setup Error: The 'GCS_PRIVATE_KEY' environment variable has not been set.")
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: '-----BEGIN PRIVATE KEY-----\n' + process.env.GCS_PRIVATE_KEY.replace(/\\n/g, '\n') + '\n-----END PRIVATE KEY-----\n'
      }
    })
    this.bucket = this.storage.bucket(bucketName)
  }

  async retrieveData(contractAddress: string, ref: string): Promise<ValidStoredData> {
    Log.debug('Contract address for generating private vars hash: ' + contractAddress)
    Log.debug('Ref for generating private vars hash: ' + ref)
    Log.debug('Filehash: ' + SHA256(contractAddress + ref).toString())
    const filename = SHA256(contractAddress + ref).toString() + '.json'
    const filepath = path.join(this.persistantStorageDir, filename)
    Log.debug('Attemping to fetch from local data storage caching directory: ' + filepath)
    // Check to see if file has been previously downloaded and stored in cache
    if (!fs.existsSync(filepath)) {
      try {
        await this.bucket.file(filename).download({ destination: filepath })
      } catch (untypedError) {
        const error = untypedError as Error
        throw Error(`Unable to fetch stored data: ${error.message}`)
      }
    }
    const encryptedObj = JSON.parse(fs.readFileSync(filepath, {encoding: 'utf8'})) as EncryptedObject
    const storedData = Encryptor.decrypt(this.privateKey, contractAddress, ref, encryptedObj)
    return storedData
  }
}