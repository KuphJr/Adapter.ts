import { KEYUTIL, KJUR, b64tohex } from 'jsrsasign'
import type { RSAKey } from 'jsrsasign'
import { Log } from './Log'

export class TimestampSignature {
  private privateKey?: RSAKey
  private publicKey?: RSAKey

  constructor(
    privateKey = '',
    publicKey = '',
  ) {
    if (privateKey)
      this.privateKey = KEYUTIL.getKey(
        '-----BEGIN RSA PRIVATE KEY-----\n' +
        privateKey +
        '\n-----END RSA PRIVATE KEY-----\n'
      ) as RSAKey
    if (publicKey)
      this.publicKey = getRsaFromPubKey(publicKey)
  }

  generateSignature = (stringToSign: string): string => {
    const sig = new KJUR.crypto.Signature({ alg: 'SHA256withRSA' })
    sig.init(this.privateKey as RSAKey)
    sig.updateString(stringToSign)
    const signature = sig.sign()
    Log.debug(`Signed Data: ${stringToSign}\nSignature ${signature}`)
    return signature
  }

  verifySignature = (signedString: string, signature: string): boolean => {
    const sig = new KJUR.crypto.Signature({"alg": "SHA256withRSA"})
    sig.init(this.publicKey as RSAKey)
    sig.updateString(signedString)
    return sig.verify(signature)
  }
}

const getRsaFromPubKey = (pubKeyB64: string): RSAKey => {
  const pubKeyDecoded = b64tohex(pubKeyB64);
  // jsrsasign cannot build key out of PEM or ASN.1 string, so we have to extract modulus and exponent
  // you can get some idea what happens from the link below (keep in mind that in JS every char is 2 bytes)
  // https://crypto.stackexchange.com/questions/18031/how-to-find-modulus-from-a-rsa-public-key/18034#18034
  const modulus = pubKeyDecoded.slice(16, pubKeyDecoded.length - 10)
  const exp = pubKeyDecoded.slice(pubKeyDecoded.length - 5);
  return KEYUTIL.getKey({n: modulus, e: exp}) as RSAKey;
}