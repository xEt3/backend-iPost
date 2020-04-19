"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const usuario_model_1 = require("../models/usuario.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
const post_model_1 = require("../models/post.model");
const fs_1 = __importDefault(require("fs"));
let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
chai.use(chaiHttp);
const url = 'http://localhost:3000';
let users = [];
let posts = [];
let token = '';
let postAux;
describe('UserTest: ', () => {
    before((done) => {
        mongoose_1.default.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose_1.default.connection.db.dropDatabase(function () {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < 5; i++) {
                        const user = {
                            nombre: 'testing' + i,
                            email: 'testing' + i,
                            avatar: 'av-' + i + '.png',
                            password: bcrypt_1.default.hashSync('123456', 10)
                        };
                        users.push(user);
                    }
                    yield usuario_model_1.Usuario.create(users).then((usuarios) => {
                        users = usuarios;
                    });
                    for (let i = 0; i < 21; i++) {
                        const post = {
                            menssaje: 'mensaje' + i,
                            usuario: String(users[0]._id)
                        };
                        posts.push(post);
                    }
                    yield post_model_1.Post.create(posts).then(postsDb => {
                        posts = postsDb;
                    });
                    done();
                });
            });
        });
    });
    it('should generate token', (done) => {
        chai.request(url)
            .post(`/user/login`)
            .send({ email: users[0].email, password: '123456' })
            .end(function (err, res) {
            token = res.body.token;
            expect(res).to.have.status(200);
            done();
        });
    });
    describe('create posts', () => {
        it('should insert a post', (done) => {
            chai.request(url)
                .post('/post')
                .send({ mensaje: 'post1' })
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.ok).to.equals(true);
                done();
            });
        });
        it('should receive an error, invalid token', (done) => {
            chai.request(url)
                .post('/post')
                .end(function (err, res) {
                expect(res).to.have.status(401);
                expect(res.ok).to.equals(false);
                done();
            });
        });
    });
    describe('get posts', () => {
        it('should return 10 first post', (done) => {
            chai.request(url)
                .get('/post')
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.posts.length).to.equals(10);
                expect(res.body.posts[1].mensaje).to.equals(posts[posts.length - 1].mensaje);
                done();
            });
        });
        it('should return an empty array', (done) => {
            chai.request(url)
                .get('/post?pagina=4')
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.posts.length).to.equals(0);
                done();
            });
        });
        it('should return an error invalid page', (done) => {
            chai.request(url)
                .get('/post?pagina=-1')
                .end(function (err, res) {
                expect(res).to.have.status(400);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('get post', () => {
        it('should get a post ', (done) => {
            chai.request(url)
                .get(`/post/get/${posts[0]._id}`)
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.post._id).to.equals(String(posts[0]._id));
                expect(res.body.post.mensaje).to.equals(posts[0].mensaje);
                done();
            });
        });
        it('should return an error 404 incorrect id', (done) => {
            chai.request(url)
                .get('/post/get/123')
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('get post', () => {
        it('should return ok and delete post', (done) => {
            chai.request(url)
                .delete(`/post/remove/${posts[0]._id}`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.post.mensaje).to.equals(posts[0].mensaje);
                expect(res.body.ok).to.equals(true);
                done();
            });
        });
        it('should return error 404 post was delete', (done) => {
            chai.request(url)
                .get(`/post/get/${posts[0]._id}`)
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
        it('should return error 401 token user is not post owner', (done) => {
            chai.request(url)
                .post(`/user/login`)
                .send({ email: users[1].email, password: '123456' })
                .end(function (err, res) {
                let token2 = res.body.token;
                expect(res).to.have.status(200);
                chai.request(url)
                    .delete(`/post/remove/${posts[1]._id}`)
                    .set({ 'x-token': token2 })
                    .end(function (err, res) {
                    expect(res).to.have.status(401);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('upload file', () => {
            it('Should upload image file', (done) => {
                chai.request(url)
                    .post('/post/upload')
                    .set({ 'x-token': token })
                    .attach('image', fs_1.default.readFileSync('/home/nacho/Desktop/qricon.png'), 'test.png')
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usr.imgsTemp.length).to.equals(1);
                    users[0] = res.body.usr;
                    done();
                });
            });
            it('Should return 400 error no  file', (done) => {
                chai.request(url)
                    .post('/post/upload')
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Should 409 error no image file', (done) => {
                chai.request(url)
                    .post('/post/upload')
                    .set({ 'x-token': token })
                    .attach('image', fs_1.default.readFileSync('README.MD'), 'read.me')
                    .end(function (err, res) {
                    expect(res).to.have.status(409);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
        });
    });
    describe('Delete temp file', () => {
        it('should delete the first user0 image', (done) => {
            chai.request(url)
                .delete(`/post/image/temp/${users[0].imgsTemp[0]}`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.usr.imgsTemp.length).to.equals(0);
                users[0] = res.body.usr;
                done();
            });
        });
        it('should return error incorrect file name', (done) => {
            chai.request(url)
                .delete(`/post/image/temp/dfd`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('delete temp folder', () => {
        it('Should upload image file', (done) => {
            chai.request(url)
                .post('/post/upload')
                .set({ 'x-token': token })
                .attach('image', fs_1.default.readFileSync('qricon.png'), 'test.png')
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.usr.imgsTemp.length).to.equals(1);
                users[0] = res.body.usr;
                done();
            });
        });
        it('shoul delete user0 temp folder', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.usr.imgsTemp.length).to.equals(0);
                users[0] = res.body.usr;
                done();
            });
        });
        it('shoul return error cause user0 does not have temp folder', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
        it('shoul return error cause token isnt correct', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .end(function (err, res) {
                expect(res).to.have.status(401);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('obtener imagen post', () => {
        it('Should upload image file', (done) => {
            chai.request(url)
                .post('/post/upload')
                .set({ 'x-token': token })
                .attach('image', fs_1.default.readFileSync('qricon.png'), 'test.png')
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.usr.imgsTemp.length).to.equals(1);
                users[0] = res.body.usr;
                done();
            });
        });
        it('should insert a post', (done) => {
            chai.request(url)
                .post('/post')
                .send({ mensaje: 'post with image' })
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                users[0] = res.body.post.usuario;
                postAux = res.body.post;
                done();
            });
        });
        it('should receive image post usrers[0]', (done) => {
            chai.request(url)
                .get(`/post/imagen/${postAux.usuario._id}/${postAux.imgs[0]}`)
                .end(function (err, res) {
                expect(res).to.have.status(200);
                done();
            });
        });
    });
    describe('Like/dislike post', () => {
        it('should put like on post', (done) => {
            chai.request(url)
                .post(`/post/like/${postAux._id}`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.post).to.not.equals(undefined);
                expect(res.body.post.usuario).to.not.equals(undefined);
                expect(res.body.post.likes.length).to.equals(1);
                users[0] = res.body.post.usuario;
                postAux = res.body.post;
                done();
            });
        });
        it('should dislike  post', (done) => {
            chai.request(url)
                .post(`/post/like/${postAux._id}`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.post).to.not.equals(undefined);
                expect(res.body.post.usuario).to.not.equals(undefined);
                expect(res.body.post.likes.length).to.equals(0);
                postAux = res.body.post;
                done();
            });
        });
        it('should return error 404 incorrect id', (done) => {
            chai.request(url)
                .post(`/post/like/231`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('Add comment', () => {
        it('Should insert coment in post with id postAux', (done) => {
            chai.request(url)
                .post(`/post/comment/${postAux._id}`)
                .send({ text: 'coment test on "Add coment" test' })
                .set({ 'x-token': token })
                .end(function (err, res) {
                const postedBy = res.body.post.comments[0].postedBy;
                expect(res).to.have.status(200);
                expect(res.body.post).to.not.equals(undefined);
                expect(String(postedBy)).to.equals(String(users[0]));
                postAux = res.body.post;
                done();
            });
        });
        it('Should return error 404 post not found ', (done) => {
            chai.request(url)
                .post(`/post/comment/1234`)
                .send({ text: 'coment test on "Add coment" test' })
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    describe('Delete comment', () => {
        it('Should delete the last comemnt inserted by the last test', (done) => {
            chai.request(url)
                .delete(`/post/comment/${postAux._id}/${postAux.comments[0]._id}`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(200);
                expect(res.body.ok).to.equals(true);
                expect(res.body.post).to.not.equals(undefined);
                expect(res.body.post.comments.length).to.equals(0);
                done();
            });
        });
        it('Should return error 404 post not found ', (done) => {
            chai.request(url)
                .delete(`/post/comment/123/324`)
                .set({ 'x-token': token })
                .end(function (err, res) {
                expect(res).to.have.status(404);
                expect(res.body.ok).to.equals(false);
                done();
            });
        });
    });
    after((done) => {
        mongoose_1.default.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose_1.default.connection.db.dropDatabase(function () {
                done();
            });
        });
    });
});
