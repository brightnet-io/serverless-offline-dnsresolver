import * as dns from "dns";
import * as _ from "lodash";
import * as nativeDns from "native-dns";

class ServerlessOfflineDnsResolver {

    public hooks: object;
    private port: number;
    private config: any;
    private serverless: any;
    private options: any;
    private server: any;
    private originalServers: string[];
    private resolveFile: string;
    private resolve: [];

    constructor(serverless: any, options: any) {
        this.options = options;
        this.serverless = serverless;

        this.hooks = {
            "before:offline:start:init": () => this.start(),
            "after:offline:start:end": () => this.stop(),
        };
    }

    public async start() {
        this.log('starting plugin');
        this.init();
        await this.listen();
    }

    public async stop() {
        this.log("stopping plugin");
        this.server.close();
    }


    public handleDnsRequest(request, response) {
        console.log('handle request');
        request.question.forEach(question => {
            const entry: any = this.resolve.filter((r: any) => new RegExp(r.domain, 'i').exec(question.name));
            // a local resolved host
            if (entry.length) {
                entry[0].records.forEach(record => {
                    record.name = question.name;
                    record.ttl = record.ttl || 60;
                    response.answer.push(nativeDns[record.type](record));
                });
            }


        });
        if (!response.answer.length) {
          response.header.rcode = nativeDns.consts.NAME_TO_RCODE.NOTZONE
        }
        response.send();

    }

    public log(msg, prefix = "INFO[serverless-offline-dnsresolver]: ") {
        this.serverless.cli.log.call(this.serverless.cli, prefix + msg);
    }

    public async listen() {
        return new Promise((resolve, reject) => {
            const server = nativeDns.createServer();
            server.on('listening', () => {
                this.log(`server listening on ${server.address().address}:${server.address().port}`);
                this.originalServers = dns.getServers();
                const servers = [`${server.address().address}:${server.address().port}`].concat(this.originalServers);
                dns.setServers(servers);
                resolve();
            });
            server.on('close', () => {
                dns.setServers(this.originalServers);
                this.log('server closed')
            });
            server.on('error', (err, buff, req, res) => {
                console.error(err.stack);
                reject(err);
            });
            server.on('socketError', (err, socket) => console.error(err));
            server.on('request', this.handleDnsRequest.bind(this));
            server.serve(this.port, 'localhost');
            this.server = server;
        });


    }

    private init() {
        process.env = _.extend({}, this.serverless.service.provider.environment, process.env);
        this.config = this.serverless.service.custom["serverless-offline-dnsresolver"] || {};
        this.port = this.config.port || 15536;
        this.resolveFile = process.cwd() + (this.config.resolveFile || '/dns-resolve.js');
        this.log('Use Resolve File: ' + this.resolveFile);
        this.resolve = require(this.resolveFile)();

    }



}

module.exports = ServerlessOfflineDnsResolver;