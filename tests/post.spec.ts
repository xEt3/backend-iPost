import mongoose from 'mongoose';
import { Usuario, Iusuario } from '../models/usuario.model';
import bcrypt from 'bcrypt';
import bodyParser from 'body-parser';
import { Post } from '../models/post.model';
import fs from 'fs';

let chai = require('chai');
let chaiHttp = require('chai-http');
const expect = require('chai').expect;
chai.use(chaiHttp);
const url = 'http://localhost:3000';
let users: any[] = []
let posts: any[] = [];
let token = '';
let postAux: any;


describe('UserTest: ', () => {
    before((done) => {
        mongoose.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
            mongoose.connection.db.dropDatabase(async function () {
                for (let i = 0; i < 5; i++) {
                    const user = {
                        nombre: 'testing' + i,
                        email: 'testing' + i,
                        avatar: 'av-' + i + '.png',
                        password: bcrypt.hashSync('123456', 10)
                    }
                    users.push(user);
                }
                await Usuario.create(users).then((usuarios) => {
                    users = usuarios;
                });
                for (let i = 0; i < 21; i++) {
                    const post = {
                        menssaje: 'mensaje' + i + ' - testing0',
                        usuario: String(users[0]._id)
                    }
                    posts.push(post);
                }
                for (let i = 0; i < 21; i++) {
                    const post = {
                        menssaje: 'mensaje' + i + ' - testing1',
                        usuario: String(users[1]._id)
                    }
                    posts.push(post);
                }
                await Post.create(posts).then(postsDb => {
                    posts = postsDb;
                })
                done()
            });
        });
    });

    it('should generate token', (done) => {
        chai.request(url)
            .post(`/user/login`)
            .send({ email: users[0].email, password: '123456' })
            .end(function (err: any, res: any) {
                token = res.body.token;
                expect(res).to.have.status(200);
                done()
            });
    });

    describe('create posts', () => {

        it('should insert a post', (done) => {
            chai.request(url)
                .post('/post')
                .send({ mensaje: 'post1' })
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.ok).to.equals(true);
                    done();
                });
        });

        it('should receive an error, invalid token', (done) => {
            chai.request(url)
                .post('/post')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(401);
                    expect(res.ok).to.equals(false)
                    done();
                });
        });

    });

    describe('get posts', () => {

        it('should return 10 first post', (done) => {
            chai.request(url)
                .get('/post')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.posts.length).to.equals(10);
                    expect(res.body.posts[1].mensaje).to.equals(posts[posts.length - 1].mensaje);
                    done();
                });
        });

        it('should return an empty array', (done) => {
            chai.request(url)
                .get('/post?pagina=10')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true)
                    expect(res.body.posts.length).to.equals(0);
                    done();
                });
        });

        it('should return an error invalid page', (done) => {
            chai.request(url)
                .get('/post?pagina=-1')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false)
                    done();
                });
        });

    });


    describe('get post', () => {

        it('should get a post ', (done) => {
            chai.request(url)
                .get(`/post/get/${posts[0]._id}`)
                .end(function (err: any, res: any) {
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
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false)
                    done();
                });
        });

    });


    describe('delete post', () => {

        it('should return ok and delete post', (done) => {
            chai.request(url)
                .delete(`/post/remove/${posts[0]._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.post.mensaje).to.equals(posts[0].mensaje);
                    expect(res.body.ok).to.equals(true);
                    done();
                });
        });

        it('should return error 404 post was delete', (done) => {
            chai.request(url)
                .get(`/post/get/${posts[0]._id}`)
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
        });

        it('should return error 401 token user is not post owner', (done) => {
            chai.request(url)
                .post(`/user/login`)
                .send({ email: users[1].email, password: '123456' })
                .end(function (err: any, res: any) {
                    let token2 = res.body.token;
                    expect(res).to.have.status(200);
                    chai.request(url)
                        .delete(`/post/remove/${posts[1]._id}`)
                        .set({ 'x-token': token2 })
                        .end(function (err: any, res: any) {
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
                    .attach('image', fs.readFileSync('qricon.png'), 'test.png')
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(200);
                        expect(res.body.ok).to.equals(true);
                        expect(res.body.usr.imgsTemp.length).to.equals(1);
                        users[0] = res.body.usr
                        done();
                    });
            });


            it('Should return 400 error no  file', (done) => {
                chai.request(url)
                    .post('/post/upload')
                    .set({ 'x-token': token })
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(400);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })

            it('Should 409 error no image file', (done) => {
                chai.request(url)
                    .post('/post/upload')
                    .set({ 'x-token': token })
                    .attach('image', fs.readFileSync('README.MD'), 'read.me')
                    .end(function (err: any, res: any) {
                        expect(res).to.have.status(409);
                        expect(res.body.ok).to.equals(false);
                        done();
                    });
            })
        })
    })


    describe('Delete temp file', () => {

        it('should delete the first user0 image', (done) => {
            chai.request(url)
                .delete(`/post/image/temp/${users[0].imgsTemp[0]}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usr.imgsTemp.length).to.equals(0);
                    users[0] = res.body.usr
                    done();
                });
        })

        it('should return error incorrect file name', (done) => {
            chai.request(url)
                .delete(`/post/image/temp/dfd`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
        })
    })


    describe('delete temp folder', () => {


        it('Should upload image file', (done) => {
            chai.request(url)
                .post('/post/upload')
                .set({ 'x-token': token })
                .attach('image', fs.readFileSync('qricon.png'), 'test.png')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usr.imgsTemp.length).to.equals(1);
                    users[0] = res.body.usr
                    done();
                });
        });

        it('shoul delete user0 temp folder', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usr.imgsTemp.length).to.equals(0);
                    users[0] = res.body.usr
                    done();
                });
        });

        it('shoul return error cause user0 does not have temp folder', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
        });

        it('shoul return error cause token isnt correct', (done) => {
            chai.request(url)
                .delete(`/post/image/temp`)
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(401);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
        });
    })

    describe('obtener imagen post', () => {
        it('Should upload image file', (done) => {
            chai.request(url)
                .post('/post/upload')
                .set({ 'x-token': token })
                .attach('image', fs.readFileSync('qricon.png'), 'test.png')
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usr.imgsTemp.length).to.equals(1);
                    users[0] = res.body.usr
                    done();
                });
        });


        it('should insert a post', (done) => {
            chai.request(url)
                .post('/post')
                .send({ mensaje: 'post with image' })
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
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
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    done();
                });
        });

    })

    describe('Like/dislike post', () => {
        it('should put like on post', (done) => {
            chai.request(url)
                .post(`/post/like/${postAux._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.post).to.not.equals(undefined);
                    expect(res.body.post.usuario).to.not.equals(undefined);
                    expect(res.body.post.likes.length).to.equals(1);
                    postAux = res.body.post;
                    done();
                });
        })

        it('should dislike  post', (done) => {
            chai.request(url)
                .post(`/post/like/${postAux._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.post).to.not.equals(undefined);
                    expect(res.body.post.usuario).to.not.equals(undefined);
                    expect(res.body.post.likes.length).to.equals(0);
                    postAux = res.body.post;
                    done();
                });
        })

        it('should return error 404 incorrect id', (done) => {
            chai.request(url)
                .post(`/post/like/231`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });
        })
    });

    describe('Add comment', () => {
        it('Should insert coment in post with id postAux', (done) => {
            chai.request(url)
                .post(`/post/comment/${postAux._id}`)
                .send({ text: 'coment test on "Add coment" test' })
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    const postedBy: any = res.body.post.comments[0].postedBy;
                    expect(res).to.have.status(200);
                    expect(res.body.post).to.not.equals(undefined);
                    expect(String(postedBy)).to.equals(String(users[0]._id))
                    postAux = res.body.post;
                    done();
                })
        });

        it('Should return error 404 post not found ', (done) => {
            chai.request(url)
                .post(`/post/comment/1234`)
                .send({ text: 'coment test on "Add coment" test' })
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });

        });

    })


    describe('Delete comment', () => {
        it('Should delete the last comemnt inserted by the last test', (done) => {
            chai.request(url)
                .delete(`/post/comment/${postAux._id}/${postAux.comments[0]._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
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
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(404);
                    expect(res.body.ok).to.equals(false);
                    done();
                });

        });
    });

    describe('get posts User', () => {
        it('should return 10 first post', (done) => {
            chai.request(url)
                .get(`/post/postUser/${users[0]._id}`)
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.posts.length).to.equals(10);
                    done();
                });
        });

        it('should return an empty array', (done) => {
            chai.request(url)
                .get(`/post/postUser/${users[0]._id}?pagina=10`)
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true)
                    expect(res.body.posts.length).to.equals(0);
                    done();
                });
        });

        it('should return an error invalid page', (done) => {
            chai.request(url)
                .get(`/post/postUser/${users[0]._id}?pagina=-1`)
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false)
                    done();
                });
        });

    });

    describe('get posts Users Following', () => {
        it('Should add testing1 to testing0 following', (done) => {
            chai.request(url)
                .post(`/user/follow/${users[1]._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    const idFollower0 = res.body.usuarioToFollow.followers[0]._id;
                    const idFollowing0 = res.body.usuario.following[0]._id
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(idFollowing0).to.equals(String(users[1]._id))
                    expect(idFollower0).to.equals(String(users[0]._id))
                    done()
                });
        })

        it('should return 10 last post from user1', (done) => {
            chai.request(url)
                .get(`/post/postFollowing`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.posts.length).to.equals(10);
                    done();
                });
        });

        it('Should remove testing1 to testing0 following', (done) => {
            chai.request(url)
                .post(`/user/follow/${users[1]._id}`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.usuario.following.length).to.equals(0)
                    expect(res.body.usuarioToFollow.followers.length).to.equals(0)
                    done()
                });
        })

        it('should return 10 last post from user0', (done) => {
            chai.request(url)
                .get(`/post/postFollowing`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true);
                    expect(res.body.posts.length).to.equals(10);
                    res.body.posts.forEach((post: any) => {
                        expect(post.usuario._id).to.equals(String(users[0]._id));
                    });
                    done();
                });
        });

        it('should return an empty array', (done) => {
            chai.request(url)
                .get(`/post/postFollowing?pagina=10`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(200);
                    expect(res.body.ok).to.equals(true)
                    expect(res.body.posts.length).to.equals(0);
                    done();
                });
        });

        it('should return an error invalid page', (done) => {
            chai.request(url)
                .get(`/post/postFollowing?pagina=-1`)
                .set({ 'x-token': token })
                .end(function (err: any, res: any) {
                    expect(res).to.have.status(400);
                    expect(res.body.ok).to.equals(false)
                    done();
                });
        });

    });

    // after((done) => {
    //     mongoose.connect('mongodb://localhost:27017/testiPost', { useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }, function () {
    //         mongoose.connection.db.dropDatabase(function () {
    //             done()
    //         });
    //     })
    // });
});


