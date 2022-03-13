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
fs.writeFileSync(
  path.join(__dirname, 'publicKey.txt'),
  keys.publicKey.replace('-----BEGIN RSA PUBLIC KEY-----\n', '').replace('\n-----END RSA PUBLIC KEY-----\n', '')
)
fs.writeFileSync(
  path.join(__dirname, 'privateKey.txt'),
  keys.privateKey.replace('-----BEGIN RSA PRIVATE KEY-----\n', '').replace('\n-----END RSA PRIVATE KEY-----\n', '')
)
console.log(`${keys.publicKey}${keys.privateKey}Keys have been stored in the environment file: ${path.join(__dirname, '..', '.env')}`)