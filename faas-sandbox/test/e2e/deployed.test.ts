// This is used to test the database-uploader component once it is deployed to Google Cloud Functions
import process, { hasUncaughtExceptionCaptureCallback } from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})
import axios, { AxiosError } from 'axios'

const deployedUrl = process.env.SANDBOXURL

if (typeof deployedUrl !== 'string')
  throw Error('Set environment variable DEPLOYED_FAAS_SANDBOX_URL before testing')

describe('deployed faas-sandbox', () => {
  it('Should execute async code with an external dependency (axios) and writing to os.tmpdir()', async () => {
    const input = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/2",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: "const axios = require('axios'); const fs = require('fs'); const path = require('path'); const os = require('os');" +
          "const response = await axios.get(myString); fs.writeFileSync(path.join(os.tmpdir(), 'res.json'), JSON.stringify(response.data));" +
          "const data = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'res.json'), { encoding: 'utf-8' }));" +
          "id = data.id; return id * myObject.key * myArray[1];"
    }
    const result = await axios.post(deployedUrl, input)
    expect(result.data.statusCode).toBe(200)
    expect(result.data.result).toBe(2)
  })
})

it('Should upload data successfully', async () => {

})

