// This is used to test the database-uploader component once it is deployed to Google Cloud Functions
import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})
import axios, { AxiosError } from 'axios'

const deployedUrl = process.env.UPLOADERURL

if (typeof deployedUrl !== 'string')
  throw Error('Set environment variable DEPLOYED_DATABASE_UPLOADER_URL before testing')

describe('deployed database-uploader', () => {
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
    const result = await axios.post(deployedUrl, requestBody)
    expect(result.data.statusCode).toBe(200)
  })

  it('Should cause an error if a duplicate ref is used', async () => {
    try {
      await axios.post(deployedUrl, requestBody)
    } catch (untypedError) {
      const axiosError = untypedError as AxiosError
      expect(axiosError?.response?.status).toBe(500)
    }
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

