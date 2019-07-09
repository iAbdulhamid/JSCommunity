const functions = require('firebase-functions');

const admin = require('firebase-admin'); // to access to the firebase DB
admin.initializeApp();

const express = require('express');
const app = express();

var firebaseConfig = {
    apiKey: "AIzaSyCAa_q_eIb7j-KQzFynFJf8I4KBc7_HMBY",
    authDomain: "jscommunity-7b70e.firebaseapp.com",
    databaseURL: "https://jscommunity-7b70e.firebaseio.com",
    projectId: "jscommunity-7b70e",
    storageBucket: "jscommunity-7b70e.appspot.com",
    messagingSenderId: "609857709075",
    appId: "1:609857709075:web:1117ea0dd563dcb9"
};
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from JSCommunity!");
// });


app.get('/posts', (request, response) => {
    db
    .collection('posts')
    .orderBy('createdAt', 'desc')
    .get()
        .then(data => {
            let posts = [];
            data.forEach(doc => {
                posts.push({
                    postId: doc.id, // i need the post ID, with the rest of the {...post object}...
                    ...doc.data() 
                });
            })
            return response.json(posts);
        })
        .catch(err => console.error(err));
})
// before Express:
// exports.getPosts = functions.https.onRequest((request, response) => {
//     admin.firestore().collection('posts').get()
//         .then(data => {
//             let posts = [];
//             data.forEach(doc => {
//                 posts.push(doc.data());
//             })
//             return response.json(posts);
//         })
//         .catch(err => console.error(err));
// });

app.post('/post', (request, response) => {
    const newPost = {
        body: request.body.body,
        userHandle: request.body.userHandle,
        createdAt: new Date().toISOString()
    };
    db
    .collection('posts')
    .add(newPost)
        .then(doc => {
            response.json({message: `document ${doc.id} created successfully`});
        })
        .catch(err => {
            response.status(500).json({error: `something went wrong!`});
            console.error(err);
        });
})
// before Express:
// exports.createPost = functions.https.onRequest((request, response) => {
//     if(request.method !== 'POST') {
//         response.status(400).json({error: `Method not allowed!`});
//     }
//     const newPost = {
//         body: request.body.body,
//         userHandle: request.body.userHandle,
//         createdAt: admin.firestore.Timestamp.fromDate(new Date())
//     };
//     admin.firestore().collection('posts').add(newPost)
//         .then(doc => {
//             response.json({message: `document ${doc.id} created successfully`});
//         })
//         .catch(err => {
//             response.status(500).json({error: `something went wrong!`});
//             console.error(err);
//         });
// });

// Registration Route
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    };
    //TODO: validate the data:
    let ttoken, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                response.status(400).json({handel: `This handle is already taken!`});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        }).then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        }).then(token => {
            ttoken = token;
            const userCredentials = {
                handel: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userID: userId
            }
            // add the new user to the ('/users) collection ...
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        }).then(() => {
            return response.status(201).json({ttoken});
        }).catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return response.status(400).json({error: `This email is already in use!`});
            } else {
                return response.status(500).json({error: err.code});
            }
        });
})



// We need to tell firebase that (app) .. is the now the container for all our Routes ..
// https://baseurl.com/api/...
exports.api = functions.https.onRequest(app);