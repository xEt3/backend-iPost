import { FileUpload } from '../interfaces/file-upload';
import path from 'path';
import fs from 'fs';
import uniqid from 'uniqid';
import { Usuario } from '../models/usuario.model';

export default class FileSystem {

    constructor() { }

    moverImgsEnTempToPost(userID: string) {
        const pathTmp = path.resolve(__dirname, '../uploads', userID, 'temp');
        const pathPost = path.resolve(__dirname, '../uploads', userID, 'post');
        if (!fs.existsSync(pathTmp)) {
            return [];
        }
        if (!fs.existsSync(pathPost)) {
            fs.mkdirSync(pathPost);
        }
        const imagenesTemp = this.obtenerImagenesEnTemp(userID);
        imagenesTemp.forEach(imagen => {
            fs.renameSync(`${pathTmp}/${imagen}`, `${pathPost}/${imagen}`);
        })
        return imagenesTemp;
    }

    private obtenerImagenesEnTemp(userID: string) {
        const pathTmp = path.resolve(__dirname, '../uploads', userID, 'temp');
        return fs.readdirSync(pathTmp) || [];

    }

    guardarImagenTemporal(file: FileUpload, userID: string) {
        return new Promise((resolve, reject) => {
            const pathTmp = this.crearCarpetaUsuario(userID);
            const nombreArchivo = this.generarNombreArchivo(file.name);
            file.mv(`${pathTmp}/${nombreArchivo}`, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            })
        })
    }

    private crearCarpetaUsuario(userID: string) {
        const pathUser = path.resolve(__dirname, '../uploads', userID);
        const pathUserTemporal = pathUser + '/temp';
        const existe = fs.existsSync(pathUser);

        if (!existe) {
            fs.mkdirSync(pathUser);
            fs.mkdirSync(pathUserTemporal);
        }
        return pathUserTemporal;
    }

    private generarNombreArchivo(nombreFichero: string) {
        const nombreArr = nombreFichero.split('.');
        const extension = nombreArr[nombreArr.length - 1];
        const idUnico = uniqid();
        return `${idUnico}.${extension}`
    }

    getImgUrl(userId:string, img:string) {
        const pathFoto = path.resolve(__dirname, '../uploads', userId, 'post', img);
        if (fs.existsSync(pathFoto)) {
            return pathFoto;
        }else{
            return path.resolve(__dirname,'../assets/defaultImagen.jpg');
        }
    }
}