import process from 'process'
import path from 'path'
import fs from 'fs'
import { Web3Storage } from 'web3.storage'
import { log } from './logger'

export class IpfsFetcher {
  constructor(public persistantStorageDir = path.join(__dirname, '..', 'cache', 'IPFS')) {
    // create the required directory if it doesn't exist
    if (!fs.existsSync(persistantStorageDir)){
      log('CREATING PERSISTANT IPFS STORAGE DIRECTORY')
      fs.mkdirSync(persistantStorageDir, { recursive: true })
    }
  }

  async fetchJavaScriptString (cid: string): Promise<string> {
    // first, check local storage to see if the IPFS file has previously been fetched and stored
    const filepath = path.join(this.persistantStorageDir, `${cid}.json`)
    let javascriptString: string
    if (fs.existsSync(filepath)) {
      // If the cached result exists in persistant storage, use that.
      javascriptString = fs.readFileSync(filepath, { encoding: 'utf8' })
    } else {
      if (typeof process.env.WEB3STORAGETOKEN !== 'string') {
        throw new Error(`WEB3STORAGETOKEN was not provided in the environment variables.`)
      }
      const client = new Web3Storage({ token: process.env.WEB3STORAGETOKEN })
      const archive = await client.get(cid)
      if (!archive) {
        throw new Error(`Failed to fetch IPFS file with content ID ${cid}.`)
      }
      const files = await archive.files()
      if (files.length !== 1) {
        throw new Error(`Invalid IPFS archive retrieved. It must be a single JavaScript file.`)
      }
      javascriptString = await files[0].text()
      fs.writeFileSync(filepath, javascriptString, { encoding: 'utf8' })
    }
    return javascriptString
  }
}
