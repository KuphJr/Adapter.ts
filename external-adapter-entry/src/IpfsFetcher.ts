import process from 'process'
import path from 'path'
import fs from 'fs'
import { Web3Storage } from 'web3.storage'
import { Log } from './Log'

export class IpfsFetcher {
  constructor(
    private token: string,
    public persistantStorageDir = path.join(__dirname, '..', 'cache', 'IPFS')
  ) {
    if (!fs.existsSync(persistantStorageDir)){
      Log.debug('Creating local IPFS caching directory: ' + persistantStorageDir)
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    }
  }

  async fetchJavaScriptString (cid: string): Promise<string> {
    // first, check local storage to see if the IPFS file has previously been fetched and stored
    const filepath = path.join(this.persistantStorageDir, `${cid}.json`)
    Log.debug('Checking for local IPFS file: ' + filepath)
    if (fs.existsSync(filepath))
      return fs.readFileSync(filepath, { encoding: 'utf8' })
    if (typeof process.env.WEB3STORAGETOKEN !== 'string')
      throw new Error(`WEB3STORAGETOKEN was not provided in the environment variables.`)
    const client = new Web3Storage({ token: this.token })
    const archive = await client.get(cid)
    if (!archive)
      throw new Error(`Failed to fetch IPFS file with content ID ${cid}.`)
    const files = await archive.files()
    if (files.length !== 1)
      throw new Error(`Invalid IPFS archive retrieved. It must be a single JavaScript file.`)
    const javascriptString = await files[0].text()
    fs.writeFileSync(filepath, javascriptString, { encoding: 'utf8' })
    return javascriptString
  }
}
