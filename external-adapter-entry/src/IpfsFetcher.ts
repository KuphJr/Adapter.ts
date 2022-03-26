import { Web3Storage } from 'web3.storage'
import process from 'process'

export class IpfsFetcher {
  static async fetchJavaScriptString (cid: string) {
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
    return await files[0].text()
  }
}
