import { Router, Response, NextFunction } from 'express';
import { verificaToken } from '../middlewares/autenticacion';
import { Post, IPost } from '../models/post.model';
import { FileUpload } from '../interfaces/file-upload';
import FileSystem from '../classes/file-system';
import { Usuario } from '../models/usuario.model';

const fileSystem = new FileSystem();
const postRoutes = Router();

//Obtener posts
postRoutes.get('/', async (req: any, res: Response, next: NextFunction) => {
    try {
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const posts = await Post.find().limit(10).skip(saltar).sort({ _id: -1 }).populate('usuario', '-password').exec();
        res.json({
            ok: true,
            posts
        })
    } catch (error) {
        res.json({
            ok: false,
            error: 'pagina invalida'
        })
    }
})

//Obtener Post
postRoutes.get('/:idPost', async (req: any, res: Response, next: NextFunction) => {
    const idPost = req.params.idPost;
    const post = await Post.findById(idPost).populate('usuario', '-password').exec();
    if (post) {
        return res.json({
            ok: true,
            post
        })
    } else {
        return res.json({
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
    console.log(imagenes)
    body.imgs = imagenes;
    Post.create(body).then(async postDB => {
        await postDB.populate('usuario', '-password').execPopulate()
        res.json({
            ok: true,
            post: postDB
        })
    }).catch(err => {
        res.json({
            ok: false,
            err
        })
    });
})

//EliminarPost
postRoutes.delete('/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    const idPost = req.params.idPost;
    const post = await Post.findById(idPost).exec();
    if (post) {
        if (post.usuario == req.usuario._id) {
            Post.findByIdAndDelete(idPost).exec().then(postBorrado => {
                if (postBorrado) {
                    return res.json({
                        ok: true,
                        post: postBorrado
                    })
                }
            }).catch(err => {
                res.json({
                    ok: false,
                    message: 'Error durante el borrado',
                    err
                });
            });
        } else {
            res.json({
                ok: true,
                messgae: 'No eres el usuario que creo el post'
            })
        }
    } else {
        return res.json({
            ok: false,
            message: 'post no encontrado',
        })
    }
});

//Actualizar post
postRoutes.post('/update/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    //TO-DO Por inmplementar
});


//Subir fichero
postRoutes.post('/upload', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selcciono ningun archivo'
        });
    }
    const file: FileUpload = req.files.imagen
    if (!file) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se selcciono ningun archivo'
        });
    }
    //Restriccion solo imagen
    if (!file.mimetype.includes('image')) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Lo que subio no es una imagen'
        });
    }
    fileSystem.guardarImagenTemporal(file, req.usuario._id).then(() => {
        return res.json({
            ok: true,
            file: file
        })
    }).catch(err => {
        return res.json({
            ok: false,
            message: 'Error al guardar la imagen',
            err
        });
    });
});

//Obtener imagen post
postRoutes.get('/imagen/:userid/:img', async (req: any, res: Response, next: NextFunction) => {
    const userID = req.params.userid;
    const img = req.params.img;
    const usuario = await Usuario.findById(userID).exec()
    if (!usuario) {
        return res.status(400).json({
            ok: false,
            mensaje: 'id de usuario incorrecto'
        })
    }
    const pathImg = fileSystem.getImgUrl(userID, img)  // Si no es correcta la imagen devulve imagen por defecto
    return res.sendFile(pathImg)
});

// Poner/Quitar like en post
postRoutes.post('/like/:idPost', [verificaToken], async (req: any, res: Response, next: NextFunction) => {
    const idUsuario = req.usuario._id
    const idPost = req.params.idPost
    const post = await Post.findById(idPost).exec();
    if (post) {
        let existeLike = false;
        post.likes.forEach(like => {
            if (like._id == idUsuario) {
                existeLike = true;
            }
        })
        if (existeLike) {
            post.likes.splice(post.likes.indexOf(idUsuario), 1);
        } else {
            post.likes.push(idUsuario);
        }
        Post.findByIdAndUpdate(idPost, post, { new: true }, async (err, postDB) => {
            if (postDB) {
                await postDB.populate('usuario', '-password').execPopulate()
                return res.json({
                    ok: true,
                    postDB
                })
            }
        })
    } else {
        return res.json({
            ok: false,
            error: 'Id post incorrecta'
        })
    }
})

export default postRoutes;

