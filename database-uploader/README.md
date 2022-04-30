# [Adapter.js](https://adapterjs.link/)

## Storing Private JavaScript and Variables

This directory contains the API which enables private variables to be securely stored in the external adapter's database. The private variables are then fetched and used when an authorized contract sends a request to the external adapter.  They are injected into the supplied JavaScript code as global variables.

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
    }
  }
}
```

Please note that the `ref` parameter must be a unique string and once it is used the data stored using this reference ID cannot be overwritten.  The reference ID can only contain alphanumerical characters and must be 4 to 32 characters in length.

The `vars` parameter contains an object whose keys correspond the the variable names which can be referenced in the user-provided JavaScript code when it is executed.  If any matching variables are provided directly in an on-chain request, the values specified in the on-chain request will be used instead of the variable values provided here.

## Installation Instructions for Chainlink Node Operators

When installing the `database-uploader` and `faas-sandbox` components of Adapter.js, be sure they are installed on the same, newly created project on Google Cloud Platform.

1. The first step is to create a Google Cloud Storage bucket named `adapterjs-encrypted-user-data`.  This step is fairly simple, but if necessary, instructions for creating a Google Cloud Storage bucket can be found [here](https://cloud.google.com/storage/docs/creating-buckets).  All the default settings for the bucket are sufficient.

2. Next, create a Google Cloud service account by selecting 'IAM & Admin' from the Google Cloud Console navigation menu, then click 'Service Accounts' and create a service account with a name of your choosing.  Enter an account name and select 'Editor' for the role from the basic roles.  Once the account has been created, click it and select the 'keys' tab.  Create a new JSON key and download the key file.

3. Now it is time to generate the public and private keys which will be used to encrypt user's cached data.  Use the `generateKeys` tool located in the root directory of this GitHub repository.  [Make sure Node.js is installed on your local machine](https://nodejs.dev/learn/how-to-install-nodejs).  Download this GitHub repository, navigate to the `/generateKeys` directory via the command line and run `npm install` and `npm run generateKeys`.  The keys will be printed in the command line and will also be saved to files called `publicKey.txt` and `privateKey.txt` in the `/generateKeys` directory.  They will be used as environment variables when deploying to Google Cloud Functions and by the `external-adapter-entry`.

4. The final step of installing this component will be to deploy to Google Cloud Functions.  Select 'Cloud Functions' from the Google Cloud Console navigation menu and create a new 1st gen function.  Ensure that 'Allow unauthenticated invocations' and 'Require HTTPS' are selected since this API will be public-facing.  From the 'Runtime, build, connections and security settings' menu, select 128 MB for the memory allocated, 15 seconds for the timeout.  Also add the environment variable named PUBLICKEY, copy the entire contents of publicKey.txt that was generated in step 3, and paste it in for the value.  To enable logging, add the environment variable LOGGING and set it to 'true'.  
Save and click next.  If this is the first function deployed on the project, there will be a banner saying 'Cloud Build API is required to use Cloud Functions.'.  Click the button and enable the Cloud Build API.  Go back to the 'Create function' page and select Node.js version 16.  Create the files `CachedDataValidator.js`, `Encryptor.js`, `GoogleCloudStorage.js`, `logger.js` and `key.json` via the Inline Editor.  From the `/database-uploader` directory, copy the contents of `package.json` into the `package.json` file in the Inline Editor.  From the `/database-uploader/build` directory, copy the contents of `index.js`, `CachedDataValidator.js`, `Encryptor.js`, `GoogleCloudStorage.js` and `logger.js` into their respective files in the Inline Editor (the `app.js` file is ignored).  Also copy the contents of the JSON key file created during step 2 into `key.json`.  In the 'Entry point' box, replace the string 'helloWorld' with 'uploader' and deploy.

This API can now be used to securely upload private user data to the external adapter's database where it is stored using public key encryption such that it can only be decrypted by the Chainlink node when a valid Adapter.js request is received.

## Contact

For suggestions and support, please check out the [Adapter.js Discord community!](https://discord.com/invite/jpGx9tMRWa)
