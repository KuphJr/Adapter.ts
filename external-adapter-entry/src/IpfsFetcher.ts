const { Web3Storage } = require('web3.storage')

export class IpfsFetcher {
  static async fetchJavaScriptString (cid: string) {
    const client = new Web3Storage({ token: process.env.WEB3STORAGETOKEN })
    const archive = await client.get(cid)
    const files = await archive.files()
    if (!files.length) {
      throw Error(`Failed to fetch IPFS file with content ID ${cid}.`)
    }
    return await files[0].text()
  }
}
