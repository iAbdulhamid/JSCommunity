// My Modules:
const { admin, db }              = require('./util/admin');
const { getAllPosts, postOne }   = require('./handlers/posts');
const { signUp, login, uploadImage }          = require('./handlers/users');
const fbAuth                     = require('./util/fbAuth');


const functions = require('firebase-functions');
const express   = require('express');
const app       = express();


// var firebaseConfig = {
//     apiKey: "AIzaSyCAa_q_eIb7j-KQzFynFJf8I4KBc7_HMBY",
//     authDomain: "jscommunity-7b70e.firebaseapp.com",
//     databaseURL: "https://jscommunity-7b70e.firebaseio.com",
//     projectId: "jscommunity-7b70e",
//     storageBucket: "jscommunity-7b70e.appspot.com",
//     messagingSenderId: "609857709075",
//     appId: "1:609857709075:web:1117ea0dd563dcb9"
// };
// const firebase = require('firebase');
// firebase.initializeApp(firebaseConfig);





// POSTS Routes:
// 1. get all posts:
app.get('/posts', getAllPosts);
// 2. post one:
app.post('/post', fbAuth, postOne)



// USERS Routes:
// 1. Registration Route
app.post('/signup', signUp);
// 2. Login Route 
app.post('/login', login);
// 3. Upload Image
app.post('/user/image', fbAuth, uploadImage); 



// We need to tell firebase that (app) .. is the now the container for all our Routes ..
// https://baseurl.com/api/...
exports.api = functions.https.onRequest(app);