"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        res.status(400).json({
            ok: false,
            err: error
        });
    });
});
//Login
userRoutes.post('/login', (req, res) => {
    const body = req.body;
    console.log(body);
    usuario_model_1.Usuario.findOne({ email: body.email }, (err, userDB) => {
        if (err) {
            return res.status(404).json({
                ok: false,
                err
            });
        }
        if (!userDB) {
            return res.status(400).json({
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
            return res.json({});
        }
    });
});
//Follow/Unfollow user
userRoutes.post('/follow/:idUser', [autenticacion_1.verificaToken], (req, res) => __awaiter(this, void 0, void 0, function* () {
    const usuarioToFollow = yield usuario_model_1.Usuario.findById(req.params.idUser).exec();
    const usuario = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
    if (!usuarioToFollow || !usuario) {
        return res.status(404).json({
            ok: false,
            message: 'No existe el usuario al que quieres seguir'
        });
    }
    console.log(usuario);
    let isFollowing = false;
    usuario.following.forEach(usr => {
        console.log('iiiid', usr.id);
        console.log('oo', usuarioToFollow._id);
        if (usr.id == usuarioToFollow._id) {
            isFollowing = true;
        }
    });
    console.log(isFollowing);
    if (isFollowing) {
        usuario.following.splice(usuario.following.indexOf(usuarioToFollow._id), 1);
        usuarioToFollow.followers.splice(usuario.followers.indexOf(usuario._id), 1);
    }
    else {
        usuario.following.push(usuarioToFollow.id);
        usuarioToFollow.followers.push(usuario._id);
    }
    usuario_model_1.Usuario.findByIdAndUpdate(usuario._id, usuario).exec().then(() => {
        res.json({
            ok: true,
            usuario,
            usuarioToFollow
        });
    }).catch(err => {
        res.status(400).json({
            ok: false,
            err
        });
    });
}));
// actualizar usuario
userRoutes.post('/update', autenticacion_1.verificaToken, (req, res) => {
    const user = {
        nombre: req.body.nombre || req.usuario.nombre,
        email: req.body.email || req.usuario.email,
        avatar: req.body.avatar || req.usuario.avatar
    };
    usuario_model_1.Usuario.findByIdAndUpdate(req.usuario._id, user, { new: true }, (err, userDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }
        ;
        if (!userDB) {
            return res.status(404).json({
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
//get usuario from token
userRoutes.get('/', [autenticacion_1.verificaToken], (req, res) => {
    const usuario = req.usuario;
    res.json({
        ok: true,
        usuario
    });
});
exports.default = userRoutes;
