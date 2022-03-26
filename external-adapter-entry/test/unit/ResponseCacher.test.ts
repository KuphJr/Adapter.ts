import { ResponseCacher } from '../../src/ResponseCacher'
import { tmpdir }from 'os'
import * as fs from 'fs'
import * as path from 'path'

describe('ResponseCacher', () => {
  const responseCacher = new ResponseCacher()

  it('Errors the first time a request is made', () => {

  })

  it('Gets cached result the second time an identical request is made with caching enabled', () => {

  })

  afterAll(() => {
    fs.rmdirSync(path.join(__dirname, 'cachedResponses'), { recursive: true })
    fs.rmdirSync(path.join(tmpdir(), 'cachedResponses'), { recursive: true })
  })
})