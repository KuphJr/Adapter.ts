# [Adapter.js](https://adapterjs.link/)

## JavaScript Sandbox Running on a Function as a Service Platform

This API creates a sandbox for executing JavaScript code on a function-as-a-service (FaaS) platform like Google Cloud Functions, AWS Lambda or Azure Functions.  It takes two parameters which are a string containing JavaScript code and a variables object which contains additional variables that can be accessed within the provided JavaScript code.  The API will then send back a reply containing value that was returned by the provided JavaScript code.

An example POST request to `faas-sandbox` is shown below.

**POST Data**
```
{
  "js": "const axios = require('axios'); const res = await axios.get(url); return res.data.id * myNum;",
  "vars": {
    "url": "https://jsonplaceholder.typicode.com/posts/2",
    "myNum": 2
  }
}
```
**Response**
```
{
  "result": 4,
  "statusCode": 200
}
```
If an error occurs when compiling or executing the provided JavaScript, the response will contain an `error` object with the error name, message and details containing the stack trace of the error.  An example error is shown below.
```
{
    "status": "errored",
    "statusCode": 200,
    "error": {
        "name": "ReferenceError",
        "message": "myNum is not defined",
        "details": "ReferenceError: myNum is not defined\n
        at module.exports (vm.js:2:1)\n
        at Object.base.apply (C:\\Users\\kuphjr\\Documents\\CL-EA-NodeJS-Template\\external-adapter\\faas-sandbox\\node_modules\\vm2\\lib/contextify.js:246:34)\n
        at Function.evaluate (C:\\Users\\kuphjr\\Documents\\CL-EA-NodeJS-Template\\external-adapter\\faas-sandbox\\Sandbox.js:21:20)\n
        at processTicksAndRejections (internal/process/task_queues.js:95:5)\n
        at async createRequest (C:\\Users\\kuphjr\\Documents\\CL-EA-NodeJS-Template\\external-adapter\\faas-sandbox\\index.js:25:14)\n
        at async C:\\Users\\kuphjr\\Documents\\CL-EA-NodeJS-Template\\external-adapter\\faas-sandbox\\app.js:27:5"
    }
}
```

## Installation Instructions for Chainlink Node Operators

When installing the `faas-sandbox` and `database-uploader` components of Adapter.js, be sure they are installed on the same, newly created project on Google Cloud Platform.

1. Select 'Cloud Functions' from the Google Cloud Console navigation menu and create a new 1st gen function with a randomly generated name such that the API endpoint cannot be guessed and attacked via DDOS.  Ensure that 'Allow unauthenticated invocations' and 'Require HTTPS' are selected.  From the 'Runtime, build, connections and security settings' menu, select 1 GB for the memory allocated, 29 seconds for the timeout.  To enable logging, add the environment variable LOGGING and set it to 'true'.  Save and click next.

2. If this is the first function deployed on the project, there will be a banner saying 'Cloud Build API is required to use Cloud Functions.'.  Click the button and enable the Cloud Build API.  Go back to the 'Create function' page and select Node.js version 16.  Create the files `CachedDataValidator.js`, `Encryptor.js`, `GoogleCloudStorage.js`, `logger.js` and `key.json` via the Inline Editor.  From the `/faas-sandbox` directory, copy the contents of `package.json` into the `package.json` file in the Inline Editor.  From the `/faas-sandbox/build` directory, copy the contents of `index.js`, `Errors.js`, `Validator.js`, `Sandbox.js` and `logger.js` into their respective files in the Inline Editor (the `app.js` file is ignored).  In the 'Entry point' box, replace the string 'helloWorld' with 'gcpservice' and deploy.

This API can now be used to securely execute Node.js code in a sandboxed environment.

## Contact

For suggestions and support, please check out the [Adapter.js Discord community!](https://discord.com/invite/jpGx9tMRWa)
