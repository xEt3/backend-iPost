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
const autenticacion_1 = require("../middlewares/autenticacion");
const post_model_1 = require("../models/post.model");
const file_system_1 = __importDefault(require("../classes/file-system"));
const usuario_model_1 = require("../models/usuario.model");
const fileSystem = new file_system_1.default();
const postRoutes = express_1.Router();
//Obtener post
postRoutes.get('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        console.log(req.host);
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const posts = yield post_model_1.Post.find().limit(10).skip(saltar).sort({ _id: -1 }).populate('usuario', '-password').exec();
        res.json({
            ok: true,
            posts
        });
    }
    catch (error) {
        res.json({
            ok: false,
            error: 'pagina invalida'
        });
    }
}));
//Crear post
postRoutes.post('/', [autenticacion_1.verificaToken], (req, res, next) => {
    const body = req.body;
    body.usuario = req.usuario._id;
    const imagenes = fileSystem.moverImgsEnTempToPost(req.usuario._id);
    console.log(imagenes);
    body.imgs = imagenes;
    post_model_1.Post.create(body).then((postDB) => __awaiter(this, void 0, void 0, function* () {
        yield postDB.populate('usuario', '-password').execPopulate();
        res.json({
            ok: true,
            post: postDB
        });
    })).catch(err => {
        res.json(err);
    });
});
//Subir fichero
postRoutes.post('/upload', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selcciono ningun archivo'
        });
    }
    const file = req.files.imagen;
    if (!file) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selcciono ningun archivo'
        });
    }
    if (!file.mimetype.includes('image')) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Lo que subio no es una imagen'
        });
    }
    yield fileSystem.guardarImagenTemporal(file, req.usuario._id);
    res.json({
        ok: true,
        file: file
    });
}));
postRoutes.get('/imagen/:userid/:img', (req, res, next) => {
    const userID = req.params.userid;
    const img = req.params.img;
    if (!usuario_model_1.Usuario.findById(userID)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'id de usuario incorrecto'
        });
    }
    const pathImg = fileSystem.getImgUrl(userID, img);
    return res.sendFile(pathImg);
});
exports.default = postRoutes;
