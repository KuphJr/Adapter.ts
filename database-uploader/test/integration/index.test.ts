import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

import { createRequest } from '../../src/index'

describe("database-uploader", () => {
  const requestBody = {
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

  it('Should upload data successfully', async () => {
    await createRequest(requestBody, (statusCode, ) => {
      expect(statusCode).toBe(200)
    })
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

