import Server from './classes/server';
import userRoutes from './routes/usuario.routes';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import postRoutes from './routes/post.routes';
import fileUpload from 'express-fileupload';
import cors from 'cors';

const server = new Server();


// Body parser
 server.app.use(bodyParser.urlencoded({extended:true}));
 server.app.use(bodyParser.json());

 //FileUpload
 server.app.use(fileUpload());

 // Configurar cors
server.app.use(cors({origin:true,credentials:true}))

//Routas de mi app 
server.app.use('/user', userRoutes);
server.app.use('/post', postRoutes);

//Conectar db
mongoose.connect('mongodb://localhost:27017/fotosgram',
    { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true,useFindAndModify: false }, (err) => {
        if (err) {
            console.error('Imposible conectar con la base de datos')
        }else{
            console.log('Base de datos online')
        }
    });


server.start(() => {
    console.log('Servidor corriendo en el puerto ' + server.port)
});