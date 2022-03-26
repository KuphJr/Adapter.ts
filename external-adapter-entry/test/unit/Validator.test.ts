import { Validator } from '../../src/Validator'

describe('Validator', () => {

  describe('validateInput', () => {
    it('Throws error for empty input', () => {
      expect(() => { Validator.validateInput({}) }).toThrow()
    })

    it('Throws error for an invalid type', () => {
      const input = {data: {
        type: 'invalidType'
      }}
      expect(() => { Validator.validateInput(input) }).toThrow()
    })

    it("Sets id to '1' if no id is provided", () => {
      const input = { data: {
        js: 'return true',
        type: 'bool'
      }}
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.id).toBe('1')
    })

    it('Sets id to provided id', () => {
      const input = {
        id: '7',
        data: {
          type: 'bool',
          js: 'return true'
        }
      }
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.id).toBe('7')
    })

    it('Validates JavaScript string', () => {
      const input = { data: {
        type: 'bool',
        js: 'return true'
      }}
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.js).toBe('return true')
    })

    it('Validates content id string', () => {
      const input = { data: {
          type: 'bool',
          cid: 'abc123'
      }}
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.cid).toBe('abc123')
    })

    it('Validates variables JSON object string', () => {
      const input = { data: {
        type: 'bool',
        js: 'return true',
        vars: '{"myString":"abc123"}'
      }}
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.vars?.myString).toBe('abc123')
    })

    it('Validates stored data reference', () => {
      const input = {
        data: {
          type: 'bool',
          ref: 'abc123',
          js: 'return true'
        },
        meta: {
          oracleRequest: {
            requester: '0xContractAddressHere'
          }
        }
      }
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.ref).toBe('abc123')
      expect(validatedInput.contractAddress).toBe('0xContractAddressHere')
    })

    it('Validates request to cache response and time-to-live', () => {
      const input = { data: {
          type: 'bool',
          js: 'return true',
          cached: true,
          ttl: 30
      }}
      const validatedInput = Validator.validateInput(input)
      expect(validatedInput.cached).toBe(true)
      expect(validatedInput.ttl).toBe(30)
    })

    it('Throws error if no content id, JavaScript or reference is provided', () => {
      const input = { data: { type: 'bool' } }
      expect(() => { Validator.validateInput(input) }).toThrow()
    })
  })

  describe('validateOutput', () => {
    it('Returns true for valid output', () => {
      expect(Validator.validateOutput('int', 5)).toBe(5)
      expect(Validator.validateOutput('string', 'this is a string which will be converted to bytes'))
      .toBe('this is a string which will be converted to bytes')
    })

    it('Throws an error for invalid output', () => {
      expect(() => { Validator.validateOutput('bool', 'string') }).toThrow()
      expect(() => { Validator.validateOutput('int', 5.5) }).toThrow()
      expect(() => { Validator.validateOutput('uint', -5) }).toThrow()
      expect(() => { Validator.validateOutput('string', -5) }).toThrow()
      expect(() => { Validator.validateOutput('uint256', 'string') }).toThrow()
    })
  })
})