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
//Obtener posts
postRoutes.get('/', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    try {
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const posts = yield post_model_1.Post.find().limit(10).skip(saltar).sort({ _id: -1 }).populate('usuario', '-password').populate('comments.postedBy', '-password').populate('likes.likedBy', '-password').exec();
        res.json({
            ok: true,
            posts
        });
    }
    catch (error) {
        res.status(400).json({
            ok: false,
            error: 'pagina invalida'
        });
    }
}));
//Obtener Post
postRoutes.get('/:idPost', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const idPost = req.params.idPost;
    const post = yield post_model_1.Post.findById(idPost).populate('usuario', '-password').populate('comments.postedBy', '-password').populate('likes.likedBy', '-password').exec();
    if (post) {
        return res.json({
            ok: true,
            post
        });
    }
    else {
        return res.status(404).json({
            ok: false,
            message: 'Id post invalido'
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
        res.status(400).json({
            ok: false,
            err
        });
    });
});
//EliminarPost
postRoutes.delete('/:idPost', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const idPost = req.params.idPost;
    const post = yield post_model_1.Post.findById(idPost).exec();
    if (post) {
        if (post.usuario == req.usuario._id) {
            post_model_1.Post.findByIdAndDelete(idPost).exec().then(postBorrado => {
                if (postBorrado) {
                    fileSystem.eliminarImagenesPost(req.usuario._id, postBorrado.imgs);
                    return res.json({
                        ok: true,
                        post: postBorrado
                    });
                }
            }).catch(err => {
                res.json({
                    ok: false,
                    err
                });
            });
        }
        else {
            res.status(401).json({
                ok: false,
                messgae: 'No eres el usuario que creo el post'
            });
        }
    }
    else {
        return res.status(404).json({
            ok: false,
            message: 'post not found'
        });
    }
}));
// //Actualizar post
// postRoutes.post('/update/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
//     //TO-DO Por inmplementar
// });
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
    //Restriccion solo imagen
    if (!file.mimetype.includes('image')) {
        return res.status(409).json({
            ok: false,
            mensaje: 'Lo que subio no es una imagen'
        });
    }
    fileSystem.guardarImagenTemporal(file, req.usuario._id).then((nombreImagen) => __awaiter(this, void 0, void 0, function* () {
        const usr = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
        if (!usr) {
            return res.status(404).json({
                ok: false,
                message: 'No se obtubo el usuario'
            });
        }
        usr.imgsTemp.push(nombreImagen);
        yield usuario_model_1.Usuario.findByIdAndUpdate(usr._id, usr).exec();
        return res.json({
            ok: true,
            nombreImagen: nombreImagen,
            usr
        });
    })).catch(err => {
        return res.status(400).json({
            ok: false,
            message: 'Error al guardar la imagen',
            err
        });
    });
}));
//Eliminar fichero temporal
postRoutes.delete('/image/temp/:imageName', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const nombreImagen = req.params.imageName;
    if (!nombreImagen) {
        return res.status(404).json({
            ok: false,
            message: 'nombre inavalido'
        });
    }
    const usr = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
    if (!usr) {
        return res.json({
            ok: false,
            message: 'No se encontro el usuario'
        });
    }
    const index = usr.imgsTemp.indexOf(nombreImagen);
    if (index < 0) {
        return res.status(404).json({
            ok: false,
            message: 'El usuario no pose en su ese archivo array de archivos temporale',
            usr
        });
    }
    if (fileSystem.eliminarFicheroTemp(req.usuario._id, nombreImagen)) {
        usr.imgsTemp.splice(index, 1);
        yield usuario_model_1.Usuario.findByIdAndUpdate(usr._id, usr).exec();
        res.json({
            ok: true,
            message: `${nombreImagen} eliminada`,
            usr
        });
    }
    else {
        res.status(400).json({
            ok: false,
            message: 'nombre inavalido'
        });
    }
}));
//Eliminar carpeta temporal
postRoutes.delete('/image/temp', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const usr = yield usuario_model_1.Usuario.findById(req.usuario._id).exec();
    if (!usr) {
        return res.status(404).json({
            ok: false,
            message: 'No se encontro el usuario'
        });
    }
    usr.imgsTemp = [];
    yield usuario_model_1.Usuario.findByIdAndUpdate(usr._id, usr);
    if (fileSystem.eliminarCarpetaTemp(req.usuario._id)) {
        res.json({
            ok: true,
            message: `Eliminada carpeta temp de ${req.usuario._id}`
        });
    }
    else {
        res.status(404).json({
            ok: false,
            message: 'No hay carpeta temp del usuario ' + req.usuario._id
        });
    }
}));
//Obtener imagen post
postRoutes.get('/imagen/:userid/:img', (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const userID = req.params.userid;
    const img = req.params.img;
    const usuario = yield usuario_model_1.Usuario.findById(userID).exec();
    if (!usuario) {
        return res.status(400).json({});
    }
    const pathImg = fileSystem.getImgUrl(userID, img); // Si no es correcta la imagen devulve imagen por defecto
    return res.sendFile(pathImg);
}));
// Poner/Quitar like en post
postRoutes.post('/like/:idPost', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const idUsuario = req.usuario._id;
    const idPost = req.params.idPost;
    const post = yield post_model_1.Post.findById(idPost).exec();
    if (post) {
        let existeLike = false;
        post.likes.forEach(like => {
            if (like.likedBy == idUsuario) {
                existeLike = true;
            }
        });
        if (existeLike) {
            post.likes.splice(post.likes.indexOf(idUsuario), 1);
        }
        else {
            post.likes.push({ likedBy: idUsuario });
        }
        post_model_1.Post.findByIdAndUpdate(idPost, post, { new: true }, (err, postDB) => __awaiter(this, void 0, void 0, function* () {
            if (postDB) {
                yield postDB.populate('usuario', '-password').execPopulate();
                return res.json({
                    ok: true,
                    postDB
                });
            }
        }));
    }
    else {
        return res.status(404).json({
            ok: false,
            error: 'Id post incorrecta'
        });
    }
}));
//Add comentario
postRoutes.post('/comment/:idPost', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const idPost = req.params.idPost;
    const idUsuario = req.usuario._id;
    const post = yield post_model_1.Post.findById(idPost).exec();
    const text = req.body.text;
    if (!post) {
        return res.status(404).json({
            ok: false,
            message: 'no se encontro el post'
        });
    }
    if (!text) {
        return res.status(400).json({
            ok: false,
            message: 'Texto comentario vacio'
        });
    }
    post.comments.push({
        text,
        postedBy: idUsuario
    });
    console.log(idUsuario);
    post_model_1.Post.findByIdAndUpdate(idPost, post).exec().then(postDesactualizado => {
        if (postDesactualizado) {
            return res.json({
                ok: true,
                post
            });
        }
        else {
            return res.json({
                ok: false,
                message: 'no se encontro el post'
            });
        }
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            err
        });
    });
}));
//delete comentario
postRoutes.delete('/comment/:idPost/:idComment', [autenticacion_1.verificaToken], (req, res, next) => __awaiter(this, void 0, void 0, function* () {
    const idPost = req.params.idPost;
    const idUsuario = req.usuario._id;
    const idComment = req.params.idComment;
    const post = yield post_model_1.Post.findById(idPost).exec();
    if (!post) {
        return res.status(404).json({
            ok: false,
            message: 'no se encontro el post'
        });
    }
    const comment = post.comments.find(commentario => commentario._id == idComment);
    if (!comment) {
        return res.json({
            ok: false,
            message: 'no se encontro el id del comentario en este post',
            post
        });
    }
    if (comment.postedBy != idUsuario && post.usuario != idUsuario) {
        return res.json({
            ok: false,
            message: 'no puedes borrar este comentario',
        });
    }
    else {
        post.comments.splice(post.comments.indexOf(comment), 1);
        post_model_1.Post.findByIdAndUpdate(idPost, post).exec().then(postDesactualizado => {
            if (postDesactualizado) {
                return res.json({
                    ok: true,
                    post
                });
            }
            else {
                return res.status(400).json({
                    ok: false,
                    message: 'no se encontro el post'
                });
            }
        }).catch((err) => {
            return res.status(400).json({
                ok: false,
                err
            });
        });
    }
}));
exports.default = postRoutes;
