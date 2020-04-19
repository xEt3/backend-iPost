"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./classes/server"));
const usuario_routes_1 = __importDefault(require("./routes/usuario.routes"));
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const cors_1 = __importDefault(require("cors"));
const server = new server_1.default();
// Body parser
server.app.use(body_parser_1.default.urlencoded({ extended: true }));
server.app.use(body_parser_1.default.json());
//FileUpload
server.app.use(express_fileupload_1.default());
// Configurar cors
server.app.use(cors_1.default({ origin: true, credentials: true }));
//Routas de mi app 
server.app.use('/user', usuario_routes_1.default);
server.app.use('/post', post_routes_1.default);
//Conectar db
mongoose_1.default.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, (err) => {
    if (err) {
        console.error('Error: Cant connect with data base');
    }
    else {
        console.log('DB online');
    }
});
server.start(() => {
    var os = require('os');
    let ifaces = os.networkInterfaces();
    let address = '127.0.0.1';
    Object.keys(ifaces).forEach(function (ifname) {
        let alias = 0;
        ifaces[ifname].forEach(function (iface) {
            if ('IPv4' !== iface.family || iface.internal !== false) {
                // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
                return;
            }
            if (alias >= 1) {
                // this single interface has multiple ipv4 addresses
            }
            else {
                // this interface has only one ipv4 adress
                address = iface.address;
            }
            ++alias;
        });
    });
    console.log(`Server running on ${address}:${server.port}`);
});
