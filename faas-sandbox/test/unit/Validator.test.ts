import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env')})

import { Validator } from '../../src/Validator'

describe("Validator", () => {
  it('Should validate valid data', async () => {
    const input = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/1",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum * myArray[1];"
    }
    expect(Validator.isValidInput(input)).toBe(true)
  })
  
  it('Should throw and error for invalid js parameter', () => {
    const badInput = {
      vars: {
        myNum: 100,
        myString: "https://jsonplaceholder.typicode.com/posts/1",
        myArray: [ 0, 1, 2 ],
        myObject: {
          key: 1
        }
      },
      js: { js: "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum * myArray[1];" }
    }
    expect(() => { Validator.isValidInput(badInput) }).toThrow()
  })

  it('Should throw and error for invalid vars parameter', () => {
    const badInput = {
      vars: "bad vars",
      js: "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum * myArray[1];" 
    }
    expect(() => { Validator.isValidInput(badInput) }).toThrow()
  })

  it('Should validate valid output', () => {
    expect(Validator.isValidOutput(true)).toBe(true)
    expect(Validator.isValidOutput(false)).toBe(true)
    expect(Validator.isValidOutput(-10)).toBe(true)
    expect(Validator.isValidOutput(10)).toBe(true)
    expect(Validator.isValidOutput('string')).toBe(true)
  })

  it('Should throw and error for invalid output type', () => {
    expect(() => { Validator.isValidInput({}) }).toThrow()
    expect(() => { Validator.isValidOutput([1, 'string']) }).toThrow()
  })
})

