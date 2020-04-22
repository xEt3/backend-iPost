import { Router, Request, Response, NextFunction } from "express";
import { Usuario, Iusuario } from '../models/usuario.model';
import bcrypt from 'bcrypt'
import { Token } from '../classes/token';
import { verificaToken } from '../middlewares/autenticacion';


const userRoutes = Router();

//Crear un usuario
userRoutes.post('/create', async (req: Request, res: Response) => {
    if (!req.body.nombre || !req.body.email || !req.body.avatar || !req.body.password) {
        return res.status(400).json({
            ok: false,
            error: 'Shold indicate name, email, avatar and password'
        })
    }
    const usuario = await Usuario.findOne({ email: req.body.email }).exec()
    if (usuario) {
        return res.status(400).json({
            ok: false,
            error: ' El usuario con ese email ya existe'
        })
    }
    const user = {
        nombre: req.body.nombre,
        email: req.body.email,
        avatar: req.body.avatar,
        password: bcrypt.hashSync(req.body.password, 10)
    }
    Usuario.create(user).then(userDB => {
        const userToken = Token.getJwtToken({
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
        })
    })
})

//Obtener users de forma paginada
userRoutes.get('/', async (req: any, res: Response, next: NextFunction) => {
    try {
        let pagina = Number(req.query.pagina - 1) || 0;
        let saltar = pagina * 10;
        const users = await Usuario.find().limit(10).skip(saltar).sort({ _id: -1 }).exec();
        res.json({
            ok: true,
            users
        })
    } catch (error) {
        res.status(400).json({
            ok: false,
            error: 'pagina invalida'
        })
    }
})

//Get user by id
userRoutes.get('/get/:idUser', async (req: any, res: Response, next: NextFunction) => {
    try {
        const idUser = req.params.idUser;
        const user = await Usuario.findById(idUser).exec();
        if (user) {
            return res.json({
                ok: true,
                user: user
            })
        } else {
            return res.status(404).json({
                ok: false,
                message: 'Id user invalido'
            })
        }
    } catch (err) {
        return res.status(404).json({
            ok: false,
            message: 'Id user invalido'
        })
    }
})

//Login
userRoutes.post('/login', (req: Request, res: Response) => {
    const body = req.body;
    Usuario.findOne({ email: body.email }, (err, userDB) => {
        if (err) {
            return res.status(404).json({
                ok: false,
                err
            })
        }
        if (!userDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos'
            });
        }
        if (userDB.compararPassword(body.password)) {
            const userToken = Token.getJwtToken({
                _id: userDB.id,
                nombre: userDB.nombre,
                email: userDB.email,
                avatar: userDB.avatar
            });
            res.json({
                ok: true,
                token: userToken
            })
        } else {
            return res.status(400).json({
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos'
            });
        }

    });
});

//Follow/Unfollow user
userRoutes.post('/follow/:idUser', [verificaToken], async (req: any, res: Response) => {
    let usuarioToFollow: any;
    let usuario: any;
    try {
        usuarioToFollow = await Usuario.findById(req.params.idUser).exec();
        usuario = await Usuario.findById(req.usuario._id).exec();
    } catch (error) { }
    if (!usuarioToFollow || !usuario) {
        return res.status(404).json({
            ok: false,
            message: 'No existe el usuario al que quieres seguir'
        })
    }
    const indexUserToFollowInUserFollowing = usuario.following.findIndex((usr: any) => usr._id == String(usuarioToFollow._id));
    if (indexUserToFollowInUserFollowing >= 0) {
        usuario.following.splice(indexUserToFollowInUserFollowing, 1);
        const indexUserInUserToFollowFollower = usuarioToFollow.followers.findIndex((usr: any) => usr._id == usuario._id);
        usuarioToFollow.followers.splice(indexUserInUserToFollowFollower, 1);
    } else {
        usuario.following.push(usuarioToFollow._id);
        usuarioToFollow.followers.push(usuario._id);
    }
    Usuario.findByIdAndUpdate(usuario._id, usuario).exec().then(() => {
        Usuario.findByIdAndUpdate(usuarioToFollow._id, usuarioToFollow).then(() => {
            res.json({
                ok: true,
                usuario,
                usuarioToFollow
            })
        })
    }).catch(err => {
        res.status(400).json({
            ok: false,
            err
        })
    })
});

// actualizar usuario
userRoutes.post('/update', verificaToken, (req: any, res: Response) => {
    const user = {
        nombre: req.body.nombre || req.usuario.nombre,
        email: req.body.email || req.usuario.email,
        avatar: req.body.avatar || req.usuario.avatar
    }
    try {
        Usuario.findByIdAndUpdate(req.usuario._id, user, { new: true }, (err, userDB) => {
            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                })
            };
            if (!userDB) {
                return res.status(404).json({
                    ok: false,
                    mensaje: 'No existe un usuario con ese id'
                });
            }
            const userToken = Token.getJwtToken({
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
    } catch (error) {
        return res.status(404).json({
            ok: false,
            mensaje: 'No existe un usuario con ese id'
        });
    }

});

//get usuario from token
userRoutes.get('/me', [verificaToken], async (req: any, res: Response) => {
    const usuario = await Usuario.findById(req.usuario._id).exec();
    if(usuario){
        res.json({
            ok: true,
            usuario
        });
    }else{
        res.status(400).json({
            ok: false,
            message:'usuario no encontrado'
        });
    }
 
});

export default userRoutes;