# [Adapter.js](https://adapterjs.link/)

## Installation Instructions

Be sure that the `database-uploader` and `faas-sandbox` components of Adapter.js are installed on the same, newly created project on Google Cloud Platform.

The first step is to create a Google Cloud Storage bucket named `cached-data`.  Instructions for creating a Google Cloud Storage bucket can be found [here](https://cloud.google.com/storage/docs/creating-buckets).

Next, create a Google Cloud service account by selecting 'IAM & Admin' from the Google Cloud Console navigation menu, then click 'create service account'.  Enter an account name and select 'Editor' for the role from the 'Basic' menu.  Once the account has been created, click it and select the 'keys' tab.  Create a new JSON key and download the key file.

Now it is time to generate the public and private keys which will be used to encrypt user's cached data.  This can be accomplished by using the `generateKeys` tool located in the root directory of this GitHub repository.  Make sure `node` is installed on your local machine [follow the instructions here](https://nodejs.dev/learn/how-to-install-nodejs), clone this repository, navigate to the `/generateKeys` directory in the command line and run `npm install` and `npm run generateKeys`.  The keys will be printed in the command line and will also be saved to files called `publicKey.txt` and `privateKey.txt` in the `/generateKeys` directory.

## Storing Private JavaScript and Variables

This folder contains the API which enables JavaScript code and variables to be securely stored in the external adapter's database. The JavaScript code and private variables are then fetched and used when an authorized contract sends a request to the external adapter.

To interact with this API, send a POST request with data in the following format.   

```
{
  "contractAddress": "0xAUTHORIZED_CONTRACT_ADDRESS_HERE",
  "ref": "UniqueReferenceStringHere",
  "vars": {
    "myNum": 100,
    "myString": "https://jsonplaceholder.typicode.com/posts/1",
    "myArray": [ 0, 1, 2 ],
    "myObject": {
      "key": 1
    },
    "js": "const axios = require('axios'); const res = await axios.get(myString); const id = res.data.id; return id * myNum;"
  }
}
```

Please note that the `ref` parameter must be a unique string and once it is used the data stored using this reference ID cannot be overwritten.  The reference ID can only contain alphanumerical characters and must be less than or equal to 32 characters in length.

The `vars` parameter is optional and contains an object whose keys correspond the the variable names which can be referenced in the user-provided JavaScript code when it is executed.  If any matching variables are provided directly in an on-chain request, the values specified in the on-chain request will be used instead of the variable values provided here.

The `js` parameter is optional and contains the JavaScript code which will be executed.  If JavaScript code or an IPFS CID is provided directly in an on-chain request, the JavaScript code specified in the on-chain request will be used instead of the JavaScript code provided here.

## Contact

For suggestions and support, please check out the [Adapter.js Discord community!](https://discord.com/invite/jpGx9tMRWa)
