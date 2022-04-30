import * as fs from 'fs'
import * as path from 'path'

import { generateKeyPairSync } from 'crypto'

const keys = generateKeyPairSync('rsa',
  {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem",
    }
  }
)
const publicKey = keys.publicKey.replace('-----BEGIN RSA PUBLIC KEY-----\n', '').replace('\n-----END RSA PUBLIC KEY-----\n', '').replace(/\n/g, '')
const privateKey = keys.privateKey.replace('-----BEGIN RSA PRIVATE KEY-----\n', '').replace('\n-----END RSA PRIVATE KEY-----\n', '').replace(/\n/g, '')
fs.writeFileSync(
  path.join(__dirname, 'publicKey.txt'),
  publicKey
)
fs.writeFileSync(
  path.join(__dirname, 'privateKey.txt'),
  privateKey
)
console.log(`PUBLICKEY:\n${publicKey}\nPRIVATEKEY:\n${privateKey}\nKeys have been stored in the files:\n${path.join(__dirname, 'publicKey.txt')}, ${path.join(__dirname, 'privateKey.txt')}`)