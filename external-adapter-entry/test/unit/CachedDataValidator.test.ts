import { CachedDataValidator } from '../../src/CachedDataValidator'

describe("CachedDataValidator", () => {
  it('Should validate valid data', async () => {
    const cachedData = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986ca",
      ref: 'abc123',
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
    expect(CachedDataValidator.isValidCachedData(cachedData)).toBe(true)
  })
  
  it('Should throw and error for a contract address with an invalid character', () => {
    const badAddr = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986cg",
      ref: 'abc123',
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
    expect(() => { CachedDataValidator.isValidCachedData(badAddr) }).toThrow()
  })

  it('Should throw an error for a contract address that does not start with 0x', () => {
    const badAddr = {
      contractAddress: "00514910771af9ca656af840dff83e8264ecf986c",
      ref: 'abc123',
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
    expect(() => { CachedDataValidator.isValidCachedData(badAddr) }).toThrow()
  })

  it('Should throw and error for an invalid ref', () => {
    const badRef = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986cg",
      ref: '',
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
    expect(() => { CachedDataValidator.isValidCachedData(badRef) }).toThrow()
  })

  it('Should throw and error for a ref with an invalid character', () => {
    const badRef = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986cg",
      ref: '*6/a!b1',
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
    expect(() => { CachedDataValidator.isValidCachedData(badRef) }).toThrow()
  })

  it('Should throw and error for invalid vars', () => {
    const badVars = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986cg",
      ref: 'abc123',
      vars: [ 1, 2, 3 ]
    }
    expect(() => { CachedDataValidator.isValidCachedData(badVars) }).toThrow()
  })

  it('Should throw and error for cached data that is too large', () => {
    const largeData = {
      contractAddress: "0x514910771af9ca656af840dff83e8264ecf986cg",
      ref: 'abc123',
      vars: [ 1, 2, 3 ],
      js: 'javascriptstring'.repeat(8000000)
    }
    expect(() => { CachedDataValidator.isValidCachedData(largeData) }).toThrow()
  })
})

