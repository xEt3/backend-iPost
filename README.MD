# BackendPhotoGram

puerto servidor : 3000 tcp
Base de datos: mongodb://localhost:27017/fotosgram

## Dependencias
[NodeJs 12](https://nodejs.org/es/)

[MongoDB](https://docs.mongodb.com/manual/administration/install-community/)




## Instalar dependencias Node

 Nodemon: <code>npm install -g nodemon</code>
 
  Express: <code>npm install express</code>
  
   Body-parser: <code>npm install body-parser</code>
  
  Cors: <code>npm install cors</code>
  
  Mongoose: <code>npm install mongoose</code>
  
  Express-fileupload: <code>npm install express-fileupload</code>
  
  JSON Web Token: <code>npm install jsonwebtoken</code>
  
  Bcryp: <code>npm install bcrypt</code>
  
  Comando para instalarlas todas: <code>npm install express body-parser cors mongoose express-fileupload jsonwebtoken bcrypt</code>


## Iniciar server
<code>nodemon dist/</code>


# Users
**Create User**
----
  Create a user in database.

* **URL**

  /user/create

* **Method:**

  `POST`
  
*  **URL Params**

   **Required:**
 
   `id=[integer]`

* **Data Params**

  **Body**

  **Required:**

  `nombre=[string] `
  `email=[string] `
  `avatar=[string] `
  `password=[string] `

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ ok:true, token: 't3k22kk3nk22nn'`
 
* **Error Response:**

  * **Code:** 400<br />
    **Content:** `ok:false, err: 'error'`


* **Sample Call:**

  ```javascript
    $.http.post(`${url}/user/create`, usuario)
  ```
<hr/>

**Login**
----

valid user and returns json data with user token.

* **URL**

  /login

* **Method:**

  `POST`
  
* **Data Params**

  **Required:**

   `email=[string] `
   `password=[string]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ ok:true, token: 't3k22kk3nk22nn'`
 
* **Error Response:**

  * **Code:** 400<br />
    **Content:** `{    ok: false, mensaje: 'Usuario/contraseña incorrectos' }`

  OR

  * **Code:** 404<br />
    **Content:** `{ ok: false, err: error  }`

* **Sample Call:**

  ```javascript
    $.http.post(`${url}/user/login`, { email, password })
  ```
<hr/>

**Follow/Unfollow User**
----
  Follow the user if you don't follow it yet or unfollow it if you already follow it

* **URL**

  /user/follow/:idUser

* **Method:**

  `POST`
  
*  **URL Params**

   **Required:**
 
   `idUser=[string]`

* **Data Params**

  **Header**

  **Required:**

  `x-token=[string]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ok: true, usuario: usuario, usuarioToFollow: usuario" }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{  ok: false, message: 'No existe el usuario al que quieres seguir'}`

  OR

  * **Code:** 400 <br />
    **Content:** `{ok: false, err }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ ok: false, mensaje: 'Error en la verificacion del token' }`

* **Sample Call:**

  ```javascript
    $.http.post(`${url}/user/follow/${idUsrToFollow}`,null,{'x-token': token};
  ```
<hr/>

**Update User**
----
  Update user with new values.

* **URL**

  /user/update

* **Method:**

  `POST`
  

* **Data Params**

  **Required:**

  **Header**

  `x-token=[string]`

  **Optional:**

  **Body**

  `nombre=[string] `
  `email=[string] `
  `avatar=[string] `

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ok: true, token: userToken, user: user }`
 
* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ ok: false, mensaje: 'No existe un usuario con ese id' }`

  OR

  * **Code:** 400 <br />
    **Content:** `{ ok: false, err: err }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ ok: false, mensaje: 'Error en la verificacion del token' }`

* **Sample Call:**

  ```javascript
    $.http.post(`${url}/user/update`, { nombre:string, email:string, avatar:string }, {'x-token': token})
  ```
<hr/>

**Get User**
----
  Returns json data about a single user.

* **URL**

  /users/:id

* **Method:**

  `GET`

* **Data Params**

  **Required:**

  **Header**

  `x-token=[string]`

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** 
    ```json
    {
      "ok": true,
      "usuario": {
        "_id": "5e99ee4f44ced568ef8a6622",
        "nombre": "test1",
        "email": "nacho",
        "avatar": "addv2.png"
        }
    }
    ```
 
* **Error Response:**

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ ok: false, mensaje: 'Error en la verificacion del token' }`

* **Sample Call:**

  ```javascript
    $.http.get(`${url}/user`,null,{'x-token': token};
  ```

# Posts


