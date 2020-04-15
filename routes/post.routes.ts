import { Router, Response, NextFunction } from 'express';
import { verificaToken } from '../middlewares/autenticacion';
import { Post } from '../models/post.model';
import { FileUpload } from '../interfaces/file-upload';
import FileSystem from '../classes/file-system';
import { Usuario } from '../models/usuario.model';

const fileSystem = new FileSystem();
const postRoutes = Router();

//Obtener post
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
        res.json(err)
    });
})

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

    if (!file.mimetype.includes('image')) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Lo que subio no es una imagen'
        });
    }

    await fileSystem.guardarImagenTemporal(file, req.usuario._id);

    res.json({
        ok: true,
        file: file
    })
});

postRoutes.get('/imagen/:userid/:img', (req: any, res: Response, next: NextFunction) => {
    const userID = req.params.userid;
    const img = req.params.img;

    if (!Usuario.findById(userID)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'id de usuario incorrecto'
        })
    }
    const pathImg = fileSystem.getImgUrl(userID, img)

    return res.sendFile(pathImg)

});

export default postRoutes;

