This plugin was written to support local/offline development of `serverless-paymail`. 
It has not been extensively tested or used for any other purpose.


If you add this plugin to your serverless.yml, it will listen for serverless-offline plugin to start.
When it does, it will insert it's own DNS server  based on 
 [native-dns]( https://www.npmjs.com/package/native-dns) at the top of the list of dns servers.
 
 You can then provide a dns-resolve.js file at the root of your servless project, with records you wish the plugin to resolve. If the 
 plugins dns server cannot resolve the request, DNS resolution will continue on to your normal dns servers.
 

The dns-resolve file is a simple javascript file with a single function to return dns record sets you wish the plugin to resolve.

Below is an example pulled form `serverless-paymail` for SRV records of domains used for development and testing.


```javascript
module.exports = function dnsResolve() {
  return [
    {
      domain: '^_bsvalias\._tcp\.*',
      records: [
        {type: 'SRV', priority: 10,weight: 10, port:3000,target:'localhost.', ttl:1}
      ]
    }
  ]
}

```
 
 
