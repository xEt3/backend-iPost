"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usuario_model_1 = require("../models/usuario.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const token_1 = require("../classes/token");
const autenticacion_1 = require("../middlewares/autenticacion");
const userRoutes = express_1.Router();
//Crear un usuario
userRoutes.post('/create', (req, res) => {
    const user = {
        nombre: req.body.nombre,
        email: req.body.email,
        avatar: req.body.avatar,
        password: bcrypt_1.default.hashSync(req.body.password, 10)
    };
    usuario_model_1.Usuario.create(user).then(userDB => {
        const userToken = token_1.Token.getJwtToken({
            _id: userDB.id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar
        });
        res.json({
            ok: true,
            token: userToken
        });
    }).catch(error => {
        res.json({
            ok: false,
            err: error
        });
    });
});
//Login
userRoutes.post('/login', (req, res) => {
    const body = req.body;
    console.log(req.host, body);
    usuario_model_1.Usuario.findOne({ email: body.email }, (err, userDB) => {
        if (err) {
            throw err;
        }
        if (!userDB) {
            return res.json({
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos'
            });
        }
        if (userDB.compararPassword(body.password)) {
            const userToken = token_1.Token.getJwtToken({
                _id: userDB.id,
                nombre: userDB.nombre,
                email: userDB.email,
                avatar: userDB.avatar
            });
            res.json({
                ok: true,
                token: userToken
            });
        }
        else {
            return res.json({
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos***'
            });
        }
    });
});
userRoutes.post('/update', autenticacion_1.verificaToken, (req, res) => {
    const user = {
        nombre: req.body.nombre || req.usuario.nombre,
        email: req.body.email || req.usuario.email,
        avatar: req.body.avatar || req.usuario.avatar
    };
    usuario_model_1.Usuario.findByIdAndUpdate(req.usuario._id, user, { new: true }, (err, userDB) => {
        if (err)
            throw err;
        if (!userDB) {
            return res.json({
                ok: false,
                mensaje: 'No existe un usuario con ese id'
            });
        }
        const userToken = token_1.Token.getJwtToken({
            _id: userDB.id,
            nombre: userDB.nombre,
            email: userDB.email,
            avatar: userDB.avatar
        });
        res.json({
            ok: true,
            token: userToken,
            user: userDB
        });
    });
});
userRoutes.get('/', [autenticacion_1.verificaToken], (req, res) => {
    const usuario = req.usuario;
    res.json({
        ok: true,
        usuario
    });
});
exports.default = userRoutes;
