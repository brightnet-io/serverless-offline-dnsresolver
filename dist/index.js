"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dns = require("dns");
var lodash_1 = require("lodash");
var nativeDns = require("native-dns");
var ServerlessOfflineDnsResolver = /** @class */ (function () {
    function ServerlessOfflineDnsResolver(serverless, options) {
        var _this = this;
        this.options = options;
        this.serverless = serverless;
        this.hooks = {
            "before:offline:start:init": function () { return _this.start(); },
            "after:offline:start:end": function () { return _this.stop(); },
        };
    }
    ServerlessOfflineDnsResolver.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('starting plugin');
                        this.init();
                        return [4 /*yield*/, this.listen()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ServerlessOfflineDnsResolver.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.log("stopping plugin");
                this.server.close();
                return [2 /*return*/];
            });
        });
    };
    ServerlessOfflineDnsResolver.prototype.handleDnsRequest = function (request, response) {
        var _this = this;
        request.question.forEach(function (question) {
            var entry = _this.resolve.filter(function (r) { return new RegExp(r.domain, 'i').exec(question.name); });
            // a local resolved host
            if (entry.length) {
                entry[0].records.forEach(function (record) {
                    record.name = question.name;
                    record.ttl = record.ttl || 60;
                    response.answer.push(nativeDns[record.type](record));
                });
            }
        });
        if (!response.answer.length) {
            response.header.rcode = nativeDns.consts.NAME_TO_RCODE.NOTZONE;
        }
        response.send();
    };
    ServerlessOfflineDnsResolver.prototype.log = function (msg, prefix) {
        if (prefix === void 0) { prefix = "INFO[serverless-offline-dnsresolver]: "; }
        this.serverless.cli.log.call(this.serverless.cli, prefix + msg);
    };
    ServerlessOfflineDnsResolver.prototype.listen = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var server = nativeDns.createServer();
                        server.on('listening', function () {
                            _this.log("server listening on " + server.address().address + ":" + server.address().port);
                            _this.originalServers = dns.getServers();
                            var servers = [server.address().address + ":" + server.address().port].concat(_this.originalServers);
                            dns.setServers(servers);
                            resolve();
                        });
                        server.on('close', function () {
                            dns.setServers(_this.originalServers);
                            _this.log('server closed');
                        });
                        server.on('error', function (err, buff, req, res) {
                            console.error(err.stack);
                            reject(err);
                        });
                        server.on('socketError', function (err, socket) { return console.error(err); });
                        server.on('request', _this.handleDnsRequest.bind(_this));
                        server.serve(_this.port, 'localhost');
                        _this.server = server;
                    })];
            });
        });
    };
    ServerlessOfflineDnsResolver.prototype.init = function () {
        process.env = lodash_1.extend({}, this.serverless.service.provider.environment, process.env);
        this.config = this.serverless.service.custom["serverless-offline-dnsresolver"] || {};
        this.port = this.config.port || 15536;
        this.resolveFile = process.cwd() + (this.config.resolveFile || '/dns-resolve.js');
        this.log('Use Resolve File: ' + this.resolveFile);
        this.resolve = require(this.resolveFile)();
    };
    return ServerlessOfflineDnsResolver;
}());
module.exports = ServerlessOfflineDnsResolver;
