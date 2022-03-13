import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

import { Encryptor } from '../../src/Encryptor'
import type { ValidCachedData } from '../../src/CachedDataValidator'

describe("Encryptor", () => {
  const cachedData = {
    contractAddress: "0x514910771af9ca656af840dff83e8264ecf986ca",
    ref: "abc13",
    vars: {
      myNum: 100,
      myString: "https://jsonplaceholder.typicode.com/posts/1",
      myArray: [ 0, 1, 2 ],
      myObject: {
        key: 1
      },
      js: "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum;"
    }
  }

  const encrypted = Encryptor.encrypt(process.env.PUBLICKEY as string, cachedData as ValidCachedData)

  const decrypted = Encryptor.decrypt(process.env.PRIVATEKEY as string, "0x514910771af9ca656af840dff83e8264ecf986ca", "abc13", encrypted)

  it('Should encrypt and decrypt successfully', () => {
    expect(decrypted).toEqual(cachedData)
  })
})

