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
userRoutes.post('/create', (req, res) => __awaiter(this, void 0, void 0, function* () {
    if (!req.body.nombre || !req.body.email || !req.body.avatar || !req.body.password) {
        return res.status(400).json({
            ok: false,
            error: 'Shold indicate name, email, avatar and password'
        });
    }
    const usuario = yield usuario_model_1.Usuario.findOne({ email: req.body.email }).exec();
    if (usuario) {
        return res.status(400).json({
            ok: false,
            error: ' El usuario con ese email ya existe'
        });
    }
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
}));
//Obtener user de forma paginada
userRoutes.get('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const users = yield usuario_model_1.Usuario.find().limit(10).skip(saltar).sort({ _id: -1 }).exec();
        res.json({
            ok: true,
            users
        });
    }
    catch (error) {
        res.status(400).json({
            ok: false,
            error: 'pagina invalida'
        });
    }
}));
//Get user by id
userRoutes.get('/get/:idUser', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        const idUser = req.params.idUser;
        const user = yield usuario_model_1.Usuario.findById(idUser).exec();
        if (user) {
            return res.json({
                ok: true,
                user: user
            });
        }
        else {
            return res.status(404).json({
                ok: false,
                message: 'Id user invalido'
            });
        }
    }
    catch (err) {
        return res.status(404).json({
            ok: false,
            message: 'Id user invalido'
        });
    }
}));
//Login
userRoutes.post('/login', (req, res) => {
    const body = req.body;
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
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos'
            });
        }
    });
});
//Follow/Unfollow user
userRoutes.post('/follow/:idUser', [autenticacion_1.verificaToken], (req, res) => __awaiter(this, void 0, void 0, function* () {
    let usuarioToFollow;
    let usuario;
    try {
        usuarioToFollow = yield usuario_model_1.Usuario.findById(req.params.idUser).exec();
        usuario = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
    }
    catch (error) { }
    if (!usuarioToFollow || !usuario) {
        return res.status(404).json({
            ok: false,
            message: 'No existe el usuario al que quieres seguir'
        });
    }
    const indexUserToFollowInUserFollowing = usuario.following.findIndex((usr) => usr._id == String(usuarioToFollow._id));
    if (indexUserToFollowInUserFollowing >= 0) {
        usuario.following.splice(indexUserToFollowInUserFollowing, 1);
        const indexUserInUserToFollowFollower = usuarioToFollow.followers.findIndex((usr) => usr._id == usuario._id);
        usuarioToFollow.followers.splice(indexUserInUserToFollowFollower, 1);
    }
    else {
        usuario.following.push(usuarioToFollow._id);
        usuarioToFollow.followers.push(usuario._id);
    }
    usuario_model_1.Usuario.findByIdAndUpdate(usuario._id, usuario).exec().then(() => {
        usuario_model_1.Usuario.findByIdAndUpdate(usuarioToFollow._id, usuarioToFollow).then(() => {
            res.json({
                ok: true,
                usuario,
                usuarioToFollow
            });
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
userRoutes.get('/me', [autenticacion_1.verificaToken], (req, res) => __awaiter(this, void 0, void 0, function* () {
    const usuario = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
    res.json({
        ok: true,
        usuario
    });
}));
exports.default = userRoutes;
