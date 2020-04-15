import { Request, Response, NextFunction } from 'express'
import { Token } from '../classes/token';

export const verificaToken = (req: any, res: Response, next: NextFunction) => {
    const token = req.get('x-token');
    Token.comprobarToken(token).then((decode: any) => {
        console.log('Verificacion Token',decode)
        req.usuario = decode.usuario
        next();
    }).catch(err => {
        res.json({
            ok: false,
            mensaje: 'Error en la verificacion del token'
        })
    })
}