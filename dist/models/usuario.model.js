"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const usuarioSchema = new mongoose_1.Schema({
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
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Usuario',
            }
        }],
    following: [{
            usuario: {
                type: mongoose_1.Schema.Types.ObjectId,
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
usuarioSchema.method('compararPassword', function (password = '') {
    return bcrypt_1.default.compareSync(password, this.password);
});
exports.Usuario = mongoose_1.model('Usuario', usuarioSchema);
