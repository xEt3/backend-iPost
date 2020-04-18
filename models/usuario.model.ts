
import { Schema, model, Document } from "mongoose";
import bcrypt from 'bcrypt';

const usuarioSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    avatar: {
        type: String,
        default: 'av-1.png'
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'El correo es necesario']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es necesaria']
    }, imgsTemp: [{
        type: String
    }],
    followers: [{
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
        }
    }],
    following: [{
        usuario: {
            type: Schema.Types.ObjectId,
            ref: 'Usuario',
        }
    }],
    admin: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    }
});

usuarioSchema.method('compararPassword', function (password: string = ''): boolean {
    return bcrypt.compareSync(password, this.password);
});

export interface Iusuario extends Document {
    nombre: string,
    email: string,
    password: string,
    avatar: string,
    imgsTemp: string[],
    followers: any[],
    following: any[],
    admin: boolean,
    verified: boolean,
    compararPassword(password: string): boolean
}

export const Usuario = model<Iusuario>('Usuario', usuarioSchema)