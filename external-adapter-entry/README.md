# [Adapter.js](https://adapterjs.link/)

## Installation Instructions



## Adapter.js Entry

This is the entry point into Adapter.js and is the endpoint to which the Chainlink external adapter bridge should point.  It must be ran locally on the same machine which is running the core Chainlink node.  See examples of valid Adapter.js requests below.

```
{
  "data":{
    "js":"return \"true\";",
    "type":"bytes32"
  },
  "id":"32c633b7-958f-41c1-97a1-1621c2425ba5",
  "meta":{
    "oracleRequest":{
      "requester":"0x11D5C07a18E41A20559814708d5b0EaD893bA9A2"
    }
  }
}
```

```
{
  "data":{
    "type": "int256",
    "ref": "REFERENCE_ID_HERE",
    "js": "const axios = require('axios'); const response = await axios.get(privateURLvariable); return response.data.id"
  },
  "id": "32c633b7-958f-41c1-97a1-1621c2425ba5",
  "meta": {
    "oracleRequest": {
      "requester": "0x514910771af9ca656af840dff83e8264ecf986ca"
    }
  }
}
```

```
{
  "data":{
    "type": "bytes32",
    "ref": "REFERENCE_ID_HERE",
    "cid": "bafybeiazsjwhvu26p56hibhee72wyyg25jvqsgzrzvjskordb4ku4jrlq4"
  },
  "id":"32c633b7-958f-41c1-97a1-1621c2425ba5",
  "meta":{
    "oracleRequest":{
      "requester":"0x_CONTRACT_ADDRESS_HERE"
    }
  }
}
```

### Request Parameters

All the parameters in the `data` object are provided in the on-chain request and then passed through the Chainlink jobspec to the `external-adapter-entry` endpoint.

* **data.type** *(Required)*
    - This is the Solidity type that should be returned on-chain.  The options are `bool`, `uint`/`uint256`, `int`/`int256`, `bytes32`, `string` or `bytes`.

* **data.js** *(Optional)*
  - This the the JavaScript code which is executed and can be provided directly in a request as a string.  The returned value is what is returned on-chain.  This parameter cannot be provided if `cid` is already provided.

* **data.cid** *(Optional)*
    - This is the IPFS content ID for JavaScript code which has been uploaded to IPFS.  The external adapter will fetch and execute the uploaded .js file and provide it with any variables specified in the `vars` object or any cached variables stored in the external adapter's database.  This parameter cannot be provided if `js` is already provided.

* **data.vars** *(Optional)*
    - This is an object containg variables which can be used in the JavaScript code that is executed.  It can either be a JSON object or a JSON object string which will automatically be converted into a JSON object.  Variables provided directly in a request take precedence over cached variables stored in the external adapter's database.

* **data.cached** *(Optional)*
    - This is a boolean variable which allows fetching a cached response from the last identical Adapter.js request.  When a request is sent with `cached` set to `true`, it will send back an immediate response containing the cached data from the previous identical Adapter.js request and then will refresh the cache with a new Adapter.js request.  If there is no existing cached response (for example when it is the first time a unique request has been made), the request will fail, but subsequent identical requests will succeed as the cache will have been filled by the preceding request.

* **data.ref** *(Required in order to access cached variables or JavaScript stored in the external adapter's database)*
    - This is a reference ID which is a unique string of 32 alphanumerical characters or less that is used to look up the cached variables or JavaScript code in the external adapter's database and use them in a request.  Data stored with a particular reference ID is immutable, so once it is stored it cannot be changed.  To change the cached JavaScript code or variables used in a request, a new set of variables and JavaScript must be stored in the external adapter's database using a new reference ID.

* **id** *(Optional)*
    - This is the Chainlink job ID.  If it is not provided, it is set to 1 by default.

* **meta.oracleRequest.requester** *(Required in order to access cached variables or JavaScript stored in the external adapter's database)*
    - This is the address of the contract which initiated the on-chain request.  It is used to look up any cached variables or JavaScript to use when processing a request.  Only the contract which has been authorized can use a particular set of cached variable or JavaScript.

## Contact

For suggestions and support, please check out the [Adapter.js Discord community!](https://discord.com/invite/jpGx9tMRWa)

docker build -t adapterjs-entry:0.2.1 .

docker run -p 8032:8032 --env-file=../.env --restart=on-failure adapterjs-entry:0.2.1