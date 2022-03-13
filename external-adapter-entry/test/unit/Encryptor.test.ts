import { publicEncrypt, privateDecrypt, randomBytes } from 'crypto'
import { AES, enc } from 'crypto-js'

import { CachedDataValidator } from './CachedDataValidator'
import type { ValidCachedData } from './CachedDataValidator'

export interface EncryptedObject {
  // The encryptedDecryptionKey is encrypted using a public key.
  // The matching private decryption key is only stored on the Chainlink node.
  encryptedDecryptionKey: string
  // The encryptedUserDataJsonString is encrypted using AES where
  // the decryption key is the encryptedDecryptionKey which can only be
  // decrypted using the private key stored on the Chainlink node.
  encryptedUserDataJsonString: string
}

export interface Error {
  message: string
}

export class Encryptor {
  static encrypt(
    publicKey: string,
    validatedInput: ValidCachedData
  ): EncryptedObject {
    const pemPublicKey = '-----BEGIN RSA PUBLIC KEY-----\n' + publicKey + '\n-----END RSA PUBLIC KEY-----\n'
    const decryptionKey = randomBytes(64)
    const encryptedDecryptionKey = publicEncrypt(pemPublicKey, decryptionKey).toString('base64')
    const encryptedUserDataJsonString = AES.encrypt(
      JSON.stringify(validatedInput),
      decryptionKey.toString() + validatedInput.contractAddress + validatedInput.ref
    ).toString()
    return {
      encryptedDecryptionKey: encryptedDecryptionKey,
      encryptedUserDataJsonString: encryptedUserDataJsonString
    }
  }

  static decrypt(
    privateKey: string,
    contractAddress: string,
    ref: string,
    encryptedObj: EncryptedObject
  ): ValidCachedData {
    const pemPrivateKey = '-----BEGIN RSA PRIVATE KEY-----\n' + privateKey + '\n-----END RSA PRIVATE KEY-----\n'
    const decryptionKey = privateDecrypt(
      pemPrivateKey,
      Buffer.from(encryptedObj.encryptedDecryptionKey, 'base64')
    )
    const decryptedUserDataHexString = AES.decrypt(
      encryptedObj.encryptedUserDataJsonString,
      decryptionKey.toString() + contractAddress + ref
    ).toString()
    const userDataJsonString = enc.Utf8.stringify(enc.Hex.parse(decryptedUserDataHexString))
    const userData = JSON.parse(userDataJsonString)
    try {
      if (CachedDataValidator.isValidCachedData(userData)) {
        return userData
      } else {
        throw Error('Decrypted data is not valid.')
      }
    } catch (untypedError) {
      const error = untypedError as Error
      throw Error(error.message)
    }
  }
}