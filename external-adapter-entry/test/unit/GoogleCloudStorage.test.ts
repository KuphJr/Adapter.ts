import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

import { DataStorage } from '../../src/GoogleCloudStorage'
import type { ValidStoredData } from '../../src/StoredDataValidator'

describe("GoogleCloudStorage", () => {
  const storedData = {
    contractAddress: "0x514910771af9ca656af840dff83e8264ecf986ca",
    ref: makeRef(16),
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
  const dataStorage = new DataStorage({ publicKey: process.env.PUBLICKEY, privateKey: process.env.PRIVATEKEY })

  it('Should upload and download successfully', async () => {
    await dataStorage.storeData(storedData as ValidStoredData)
    const retrievedData = await dataStorage.retrieveData(storedData.contractAddress, storedData.ref)
    expect(retrievedData).toEqual(storedData)
  })

  it('Should error if the ref is duplicated', async () => {
    await expect(async () => { await dataStorage.storeData(storedData as ValidStoredData) }).rejects.toBeInstanceOf(Error)
  })
})

function makeRef(length: number): string {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

