import fs from 'fs'
import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

import { Sandbox } from '../../src/Sandbox'
import { JavaScriptRuntimeError, JavaScriptCompilationError } from '../../src/Errors'
import type { Variables } from '../../src/Validator'

// NOTE: If these tests all pass, but there is an error message 'Error: ENOENT: no such file or directory', this is because
// of how the Sandbox works.  The Sandbox should delete everything in the os.tmpdir(), which causes an error with Jest.
// Just ignore this error.  If all tests pass, the Sandbox is working as expected.

describe("Sandbox", () => {
  it('Should execute code with external dependency (axios)', async () => {
    const input = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/1",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: "return myNum * myArray[2];"
    }
    expect(await Sandbox.evaluate(input.js, input.vars as Variables)).toBe(200)
  })

  it('Should execute async code with external dependency (axios)', async () => {
    const input = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/2",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum * myArray[1];"
    }
    expect(await Sandbox.evaluate(input.js, input.vars as Variables)).toBe(200)
  })

  it('Should not leave leftover files in the tmp directory', async () => {
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
    expect(await Sandbox.evaluate(input.js, input.vars as Variables)).toBe(2)
    expect(await fs.existsSync(path.join(os.tmpdir(), 'res.json'))).toBe(false)
  })
  
  it('Should throw an compilation error', async () => {
    const input = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/2",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: "const axios = require('axios'; const fs = require('fs'); const path = require('path'); const os = require('os');" +
          "const response = await axios.get(myString); fs.writeFileSync(path.join(os.tmpdir(), 'res.json'), JSON.stringify(response.data));" +
          "const data = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'res.json'), { encoding: 'utf-8' }));" +
          "id = data.id; return id * myObject.key * myArray[2];"
    }
    await expect(async () => { await Sandbox.evaluate(input.js, input.vars as Variables) }).rejects.toBeInstanceOf(JavaScriptCompilationError)
  })

  it('Should throw a runtime error', async () => {
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
          "id = data.id; return id * myObject.key.undef.undef * myArray[2];"
    }
    await expect(async () => { await Sandbox.evaluate(input.js, input.vars as Variables) }).rejects.toBeInstanceOf(JavaScriptRuntimeError)
  })
})

