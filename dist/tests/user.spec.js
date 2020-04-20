"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const usuario_model_1 = require("../models/usuario.model");
const bcrypt_1 = __importDefault(require("bcrypt"));
let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
chai.use(chaiHttp);
const url = 'http://localhost:3000';
let users = [];
let token;
describe('UserTest: ', () => {
    before((done) => {
        mongoose_1.default.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose_1.default.connection.db.dropDatabase(function () {
                for (let i = 0; i < 5; i++) {
                    const user = {
                        nombre: 'testing' + i,
                        email: 'testing' + i,
                        avatar: 'av-' + i + '.png',
                        password: bcrypt_1.default.hashSync('123456', 10)
                    };
                    users.push(user);
                }
                usuario_model_1.Usuario.create(users).then((usuarios) => {
                    users = usuarios;
                    done();
                });
            });
        });
    });
    describe('Users', () => {
        describe('Add user ', () => {
            it('should insert a user', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ nombre: 'user1', email: "user1@mail", avatar: 'av-1.png', password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.ok).to.equals(true);
                    expect(res.token).to.not.equals('');
                    done();
                });
            });
            it('should receive an error, empty email', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ nombre: 'user1', avatar: 'av-1.png', password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.ok).to.equals(false);
                    done();
                });
            });
            it('should receive  error 400 empty field', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ nombre: 'user1', email: "user2@mail", password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.ok).to.equals(false);
                    done();
                });
            });
            it('should receive  error 400 duplicated email', (done) => {
                chai.request(url)
                    .post('/user/create')
                    .send({ nombre: 'user1', email: users[0].email, password: '123456', avatar: 'av-1.png' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('Get all user', () => {
            it('Should return array with all user', (done) => {
                chai.request(url)
                    .get('/user')
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.users.length).to.be.at.least(3);
                    expect(res.body.users.length).to.be.at.most(11);
                    done();
                });
            });
            it('should receive an error, invalid page', (done) => {
                chai.request(url)
                    .get('/user/?pagina=0')
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('Get user', () => {
            it('Should return a single user', (done) => {
                chai.request(url)
                    .get(`/user/get/${users[0]._id}`)
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.user.nombre).to.equals(users[0].nombre);
                    done();
                });
            });
            it('should receive an error, invalid id user', (done) => {
                chai.request(url)
                    .get('/user/get/00012')
                    .end(function (err, res) {
                    expect(res).to.have.status(404);
                    expect(res.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('Login', () => {
            it('Shold verificate user and return token', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: users[0].email, password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.token).to.not.equals('');
                    done();
                });
            });
            it('Shold return erro 400 email invalid', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: 222, password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Shold return error 400 email empty', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ password: '123456' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Shold return error 400 password empty', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: 'email' })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Shold return error 400 no parameters', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Shold return error 400 no password invalid', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: 222, password: 123456 })
                    .end(function (err, res) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('Follow/Unfollow user', () => {
            before('Login user to do the operation', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: users[0].email, password: '123456' })
                    .end(function (err, res) {
                    token = res.body.token;
                    done();
                });
            });
            it('Should add testing0 to testing1 follower and testing1 to testing0 following', (done) => {
                chai.request(url)
                    .post(`/user/follow/${users[1]._id}`)
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    const idFollower0 = res.body.usuarioToFollow.followers[0]._id;
                    const idFollowing0 = res.body.usuario.following[0]._id;
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usuario.nombre).to.equals(users[0].nombre);
                    expect(res.body.usuarioToFollow.nombre).to.equals(users[1].nombre);
                    expect(idFollowing0).to.equals(String(users[1]._id));
                    expect(idFollower0).to.equals(String(users[0]._id));
                    done();
                });
            });
            it('Should remove testing0 from testing1 follower and testing1 from testing0 following', (done) => {
                chai.request(url)
                    .post(`/user/follow/${users[1]._id}`)
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    const follwers = res.body.usuarioToFollow.followers.length;
                    const following = res.body.usuario.following.length;
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usuario.nombre).to.equals(users[0].nombre);
                    expect(res.body.usuarioToFollow.nombre).to.equals(users[1].nombre);
                    expect(following).to.equals(0);
                    expect(follwers).to.equals(0);
                    done();
                });
            });
            it('Should return 404 err, user that want follow not exist', (done) => {
                chai.request(url)
                    .post(`/user/follow/${'josee'}`)
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
            it('Should return 401 err, incorrect token', (done) => {
                chai.request(url)
                    .post(`/user/follow/${'josee'}`)
                    .set({ 'x-token': 123 })
                    .end(function (err, res) {
                    expect(res).to.have.status(401);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
            });
        });
        describe('Update User', () => {
            before('Login user to do the operations', (done) => {
                chai.request(url)
                    .post(`/user/login`)
                    .send({ email: users[0].email, password: '123456' })
                    .end(function (err, res) {
                    token = res.body.token;
                    done();
                });
            });
            it('Should change the name and return new token', (done) => {
                chai.request(url)
                    .post(`/user/update`)
                    .send({ nombre: 'new name' })
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.token).to.not.equals('');
                    token = res.body.token;
                    done();
                });
            });
            it('Should change the email and return new token', (done) => {
                chai.request(url)
                    .post(`/user/update`)
                    .send({ email: 'new email' })
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.token).to.not.equals('');
                    token = res.body.token;
                    done();
                });
            });
            it('Should change the avatar and return new token', (done) => {
                chai.request(url)
                    .post(`/user/update`)
                    .send({ avatar: 'av-new.png' })
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res).to.have.status(200);
                    expect(res.body.token).to.not.equals('');
                    token = res.body.token;
                    done();
                });
            });
            it('Should return the same token', (done) => {
                chai.request(url)
                    .post(`/user/update`)
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    const newToken = res.body.token;
                    expect(res).to.have.status(200);
                    expect(newToken).to.equals(token);
                    done();
                });
            });
            it('Should the new avatar with new atributes', (done) => {
                chai.request(url)
                    .get(`/user/me`)
                    .set({ 'x-token': token })
                    .end(function (err, res) {
                    expect(res.body.usuario.email).to.equals('new email');
                    expect(res.body.usuario.nombre).to.equals('new name');
                    expect(res.body.usuario.avatar).to.equals('av-new.png');
                    done();
                });
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
