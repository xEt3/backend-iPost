"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uniqid_1 = __importDefault(require("uniqid"));
class FileSystem {
    constructor() { }
    moverImgsEnTempToPost(userID) {
        const pathTmp = path_1.default.resolve(__dirname, '../uploads', userID, 'temp');
        const pathPost = path_1.default.resolve(__dirname, '../uploads', userID, 'post');
        if (!fs_1.default.existsSync(pathTmp)) {
            return [];
        }
        if (!fs_1.default.existsSync(pathPost)) {
            fs_1.default.mkdirSync(pathPost);
        }
        const imagenesTemp = this.obtenerImagenesEnTemp(userID);
        imagenesTemp.forEach(imagen => {
            fs_1.default.renameSync(`${pathTmp}/${imagen}`, `${pathPost}/${imagen}`);
        });
        return imagenesTemp;
    }
    obtenerImagenesEnTemp(userID) {
        const pathTmp = path_1.default.resolve(__dirname, '../uploads', userID, 'temp');
        return fs_1.default.readdirSync(pathTmp) || [];
    }
    eliminarImagenesPost(idUsuario, imgs) {
        imgs.forEach(img => {
            const pathFile = path_1.default.resolve(__dirname, `../uploads/${idUsuario}/post`, img);
            this.eliminarFichero(pathFile);
        });
    }
    eliminarFicheroTemp(idUsuario, nombreFichero) {
        const pathFile = path_1.default.resolve(__dirname, `../uploads/${idUsuario}/temp`, nombreFichero);
        return this.eliminarCarpeta(pathFile);
    }
    eliminarCarpetaTemp(idUsuario) {
        const pathFile = path_1.default.resolve(__dirname, `../uploads/${idUsuario}/temp`);
        return this.eliminarFichero(pathFile);
    }
    eliminarFichero(path) {
        if (fs_1.default.existsSync(path)) {
            fs_1.default.rmdirSync(path, { recursive: true });
            return true;
        }
        else {
            return false;
        }
    }
    eliminarCarpeta(path) {
        if (fs_1.default.existsSync(path)) {
            fs_1.default.unlinkSync(path);
            return true;
        }
        else {
            return false;
        }
    }
    guardarImagenTemporal(file, userID) {
        return new Promise((resolve, reject) => {
            const pathTmp = this.crearCarpetaUsuario(userID);
            const nombreArchivo = this.generarNombreArchivo(file.name);
            file.mv(`${pathTmp}/${nombreArchivo}`, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(nombreArchivo);
                }
            });
        });
    }
    crearCarpetaUsuario(userID) {
        const pathUser = path_1.default.resolve(__dirname, '../uploads', userID);
        const pathUserTemporal = pathUser + '/temp';
        const existeCarpetaUser = fs_1.default.existsSync(pathUser);
        const existeCarpetaTemporal = fs_1.default.existsSync(pathUserTemporal);
        if (!existeCarpetaUser) {
            fs_1.default.mkdirSync(pathUser);
        }
        if (!existeCarpetaTemporal) {
            fs_1.default.mkdirSync(pathUserTemporal);
        }
        return pathUserTemporal;
    }
    generarNombreArchivo(nombreFichero) {
        const nombreArr = nombreFichero.split('.');
        const extension = nombreArr[nombreArr.length - 1];
        const idUnico = uniqid_1.default();
        return `${idUnico}.${extension}`;
    }
    getImgUrl(userId, img) {
        const pathFoto = path_1.default.resolve(__dirname, '../uploads', userId, 'post', img);
        if (fs_1.default.existsSync(pathFoto)) {
            return pathFoto;
        }
        else {
            return path_1.default.resolve(__dirname, '../assets/defaultImagen.jpg');
        }
    }
}
exports.default = FileSystem;
