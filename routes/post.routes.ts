import { Router, Response, NextFunction } from 'express';
import { verificaToken } from '../middlewares/autenticacion';
import { Post, IPost } from '../models/post.model';
import { FileUpload } from '../interfaces/file-upload';
import FileSystem from '../classes/file-system';
import { Usuario } from '../models/usuario.model';
import { text } from 'body-parser';
import userRoutes from './usuario.routes';

const fileSystem = new FileSystem();
const postRoutes = Router();

//Obtener posts
postRoutes.get('/', async (req: any, res: Response, next: NextFunction) => {
    try {
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const posts = await Post.find().limit(10).skip(saltar).sort({ _id: -1 }).populate('usuario', '-password').populate('comments.postedBy', '-password').populate('likes.likedBy', '-password').exec();
        res.json({
            ok: true,
            posts
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: 'pagina invalida'
        })
    }
})

//Obtener Post
postRoutes.get('/get/:idPost', async (req: any, res: Response, next: NextFunction) => {
    const idPost = req.params.idPost;
    let post = null
    try {
        post = await Post.findById(idPost).populate('usuario', '-password').populate('comments.postedBy', '-password').populate('likes.likedBy', '-password').exec();
    } catch (error) {

    }

    if (post) {
        return res.json({
            ok: true,
            post
        })
    } else {
        return res.status(404).json({
            ok: false,
            message: 'Id post invalido'
        })
    }
})

//Crear post
postRoutes.post('/', [verificaToken], (req: any, res: Response, next: NextFunction) => {
    const body = req.body;
    body.usuario = req.usuario._id
    const imagenes = fileSystem.moverImgsEnTempToPost(req.usuario._id);
    body.imgs = imagenes;
    Post.create(body).then(async postDB => {
        await postDB.populate('usuario', '-password').execPopulate()
        res.json({
            ok: true,
            post: postDB
        })
    }).catch(err => {
        res.status(400).json({
            ok: false,
            err
        })
    });
})

//EliminarPost
postRoutes.delete('/remove/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    const idPost = req.params.idPost;
    let post = null;
    try {
        post = await Post.findById(idPost).exec();
    } catch (error) {

    }
    if (post) {
        if (post.usuario == req.usuario._id) {
            Post.findByIdAndDelete(idPost).exec().then(postBorrado => {
                if (postBorrado) {
                    fileSystem.eliminarImagenesPost(req.usuario._id, postBorrado.imgs)
                    return res.json({
                        ok: true,
                        post: postBorrado
                    })
                }
            }).catch(err => {
                res.json({
                    ok: false,
                    err
                });
            });
        } else {
            res.status(401).json({
                ok: false,
                messgae: 'No eres el usuario que creo el post'
            })
        }
    } else {
        return res.status(404).json({
            ok: false,
            message: 'post not found'
        })
    }
});

// //Actualizar post
// postRoutes.post('/update/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
//     //TO-DO Por inmplementar
// });


//Subir fichero
postRoutes.post('/upload', [verificaToken], async (req: any, res: Response, next: NextFunction) => {

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selcciono ningun archivo'
        });
    }
    const file: FileUpload = req.files.image
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
    fileSystem.guardarImagenTemporal(file, req.usuario._id).then(async (nombreImagen: string) => {
        const usr = await Usuario.findById(req.usuario._id).exec();


        if (!usr) {
            return res.status(404).json({
                ok: false,
                message: 'No se obtubo el usuario'
            })
        }
        usr.imgsTemp.push(nombreImagen);
        await Usuario.findByIdAndUpdate(usr._id, usr).exec();
        return res.json({
            ok: true,
            nombreImagen: nombreImagen,
            usr
        })
    }).catch(err => {
        return res.status(400).json({
            ok: false,
            message: 'Error al guardar la imagen',
            err
        });
    });
});

//Eliminar fichero temporal
postRoutes.delete('/image/temp/:imageName', [verificaToken], async (req: any, res: Response, next: NextFunction) => {

    const nombreImagen = req.params.imageName;
    if (!nombreImagen) {
        return res.status(404).json({
            ok: false,
            message: 'nombre inavalido'
        })
    }
    const usr = await Usuario.findById(req.usuario._id).exec();
    if (!usr) {
        return res.json({
            ok: false,
            message: 'No se encontro el usuario'
        })
    }
    const index = usr.imgsTemp.indexOf(nombreImagen);
    if (index < 0) {
        return res.status(404).json({
            ok: false,
            message: 'El usuario no pose en su ese archivo array de archivos temporale',
            usr
        })
    }
    if (fileSystem.eliminarFicheroTemp(req.usuario._id, nombreImagen)) {
        usr.imgsTemp.splice(index, 1);
        await Usuario.findByIdAndUpdate(usr._id, usr).exec();
        res.json({
            ok: true,
            message: `${nombreImagen} eliminada`,
            usr
        })
    } else {
        res.status(400).json({
            ok: false,
            message: 'nombre inavalido'
        })
    }
});

//Eliminar carpeta temporal
postRoutes.delete('/image/temp', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    const usr = await Usuario.findById(req.usuario._id).exec();
    if (!usr) {
        return res.status(404).json({
            ok: false,
            message: 'No se encontro el usuario'
        })
    }
    usr.imgsTemp = [];
    await Usuario.findByIdAndUpdate(usr._id, usr);
    if (fileSystem.eliminarCarpetaTemp(req.usuario._id)) {
        res.json({
            ok: true,
            usr,
            message: `Eliminada carpeta temp de ${req.usuario._id}`
        })
    } else {
        res.status(404).json({
            ok: false,
            message: 'No hay carpeta temp del usuario ' + req.usuario._id
        })
    }
});

//Obtener imagen post
postRoutes.get('/imagen/:userid/:img', async (req: any, res: Response, next: NextFunction) => {
    const userID = req.params.userid;
    const img = req.params.img;
    const usuario = await Usuario.findById(userID).exec()
    if (!usuario) {
        return res.status(400).json({
            ok: false,
            usuario,
            message: 'usuario not found'
        })
    }
    const pathImg = fileSystem.getImgUrl(userID, img)  // Si no es correcta la imagen devulve imagen por defecto
    return res.sendFile(pathImg)
});

// Poner/Quitar like en post
postRoutes.post('/like/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    const idUsuario = req.usuario._id
    const idPost = req.params.idPost
    let post: any;
    try {
        post = await Post.findById(idPost).exec();
    } catch (error) {

    }
    if (post) {
        let existeLike = false;
        post.likes.forEach(like => {
            if (like.likedBy == idUsuario) {
                existeLike = true;
            }
        })
        if (existeLike) {
            post.likes.splice(post.likes.indexOf(idUsuario), 1);
        } else {
            post.likes.push({ likedBy: idUsuario });
        }
        Post.findByIdAndUpdate(idPost, post, { new: true }, async (err, postDB) => {
            if (postDB) {
                await postDB.populate('usuario', '-password').execPopulate()
                return res.json({
                    ok: true,
                    post
                })
            }
        })
    } else {
        return res.status(404).json({
            ok: false,
            error: 'Id post incorrecta'
        })
    }
});

//Add comentario
postRoutes.post('/comment/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    let idPost: any;
    let idUsuario: any
    let post: any;
    let text: any;
    try {
        idPost = req.params.idPost;
        idUsuario = req.usuario._id
        post = await Post.findById(idPost).exec();
        text = req.body.text;
    } catch (error) {

    }
    if (!post) {
        return res.status(404).json({
            ok: false,
            message: 'no se encontro el post'
        })
    }
    if (!text) {
        return res.status(400).json({
            ok: false,
            message: 'Texto comentario vacio'
        })
    }
    post.comments.push({
        text,
        postedBy: idUsuario
    })
    Post.findByIdAndUpdate(idPost, post).exec().then(postDesactualizado => {
        if (postDesactualizado) {
            return res.json({
                ok: true,
                post
            })
        } else {
            return res.status(404).json({
                ok: false,
                message: 'no se encontro el post'
            })
        }
    }).catch((err) => {
        return res.status(400).json({
            ok: false,
            err
        })
    })
})

//delete comentario
postRoutes.delete('/comment/:idPost/:idComment', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    let idPost: any;
    let idUsuario: any;
    let idComment: any;
    let comment: any;
    let post: any;

    try {
        idPost = req.params.idPost;
        idUsuario = req.usuario._id
        idComment = req.params.idComment;
        post = await Post.findById(idPost).exec();
        comment = post.comments.find((commentario: any) => commentario._id == idComment);
    } catch (error) { }
    if (!idPost) {
        return res.status(404).json({
            ok: false,
            message: 'no se el post'
        })
    }


    if (!post) {
        return res.status(404).json({
            ok: false,
            message: 'no se encontro el post'
        })
    }
    if (!idComment) {
        return res.status(404).json({
            ok: false,
            message: 'no se encontro el comentario en ese post'
        })
    }
    if (!comment) {
        return res.json({
            ok: false,
            message: 'no se encontro el id del comentario en este post',
            post
        })
    }
    if (comment.postedBy != idUsuario && post.usuario != idUsuario) {
        return res.json({
            ok: false,
            message: 'no puedes borrar este comentario',
        })
    } else {
        post.comments.splice(post.comments.indexOf(comment), 1);
        Post.findByIdAndUpdate(idPost, post).exec().then(postDesactualizado => {
            if (postDesactualizado) {
                return res.json({
                    ok: true,
                    post
                })
            } else {
                return res.status(404).json({
                    ok: false,
                    message: 'no se encontro el post'
                })
            }
        }).catch((err) => {
            return res.status(400).json({
                ok: false,
                err
            })
        })
    }
})


export default postRoutes;

