import process from 'process'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})
import { createRequest } from '../../src/index'

describe('faas-sandbox', () => {
  it('Should execute async code with an external dependency (axios) and writing to os.tmpdir()', async () => {
    const input = {
      nodeKey: process.env.NODEKEY,
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
    await createRequest(
      input,
      (statusCode, result) => {
        expect(statusCode).toBe(200)
        expect(result.result).toBe(2)
      }
    )
  })
})