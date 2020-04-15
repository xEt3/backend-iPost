"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("../classes/token");
exports.verificaToken = (req, res, next) => {
    const token = req.get('x-token');
    token_1.Token.comprobarToken(token).then((decode) => {
        console.log('Verificacion Token', decode);
        req.usuario = decode.usuario;
        next();
    }).catch(err => {
        res.json({
            ok: false,
            mensaje: 'Error en la verificacion del token'
        });
    });
};
