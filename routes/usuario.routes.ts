import { Router, Request, Response } from "express";
import { Usuario, Iusuario } from '../models/usuario.model';
import bcrypt from 'bcrypt'
import { Token } from '../classes/token';
import { verificaToken } from '../middlewares/autenticacion';


const userRoutes = Router();

//Crear un usuario
userRoutes.post('/create', (req: Request, res: Response) => {
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

//Login
userRoutes.post('/login', (req: Request, res: Response) => {
    const body = req.body;
    console.log(body)
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
            return res.json({
             
            })
        }

    });
});

//Follow/Unfollow user
userRoutes.post('/follow/:idUser', [verificaToken], async (req: any, res: Response) => {
    const usuarioToFollow = await Usuario.findById(req.params.idUser).exec();
    const usuario = await Usuario.findById(req.usuario._id).exec();
    if (!usuarioToFollow || !usuario) {
        return res.status(404).json({
            ok: false,
            message: 'No existe el usuario al que quieres seguir'
        })
    }
    console.log(usuario)
    let isFollowing = false;
    usuario.following.forEach(usr => {
        console.log('iiiid', usr.id)
        console.log('oo', usuarioToFollow._id)
        if (usr.id == usuarioToFollow._id) {
            isFollowing = true;
        }
    })
    console.log(isFollowing)
    if (isFollowing) {
        usuario.following.splice(usuario.following.indexOf(usuarioToFollow._id), 1);
        usuarioToFollow.followers.splice(usuario.followers.indexOf(usuario._id), 1);
    } else {
        usuario.following.push(usuarioToFollow.id);
        usuarioToFollow.followers.push(usuario._id);
    }
    Usuario.findByIdAndUpdate(usuario._id, usuario).exec().then(() => {
        res.json({
            ok: true,
            usuario,
            usuarioToFollow
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
});

//get usuario from token
userRoutes.get('/', [verificaToken], (req: any, res: Response) => {
    const usuario = req.usuario;
    res.json({
        ok: true,
        usuario
    });
});

export default userRoutes;