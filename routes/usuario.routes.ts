import { Router, Request, Response } from "express";
import { Usuario } from '../models/usuario.model';
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
        res.json({
            ok: false,
            err: error
        })
    })
})

//Login
userRoutes.post('/login', (req: Request, res: Response) => {
    const body = req.body;
    console.log( body)
    Usuario.findOne({ email: body.email }, (err, userDB) => {
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
                ok: false,
                mensaje: 'Usuario/contraseña incorrectos***'
            })
        }

    });
})

userRoutes.post('/update', verificaToken, (req: any, res: Response) => {

    const user = {
        nombre: req.body.nombre || req.usuario.nombre,
        email: req.body.email || req.usuario.email,
        avatar: req.body.avatar || req.usuario.avatar
    }

    Usuario.findByIdAndUpdate(req.usuario._id, user, { new: true }, (err, userDB) => {

        if (err) throw err;
        if (!userDB) {
            return res.json({
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
            user:userDB
        });
    })
});

userRoutes.get('/',[verificaToken], (req: any, res: Response) => {
    const usuario = req.usuario;
    res.json({
        ok:true,
        usuario
    });
});

export default userRoutes;