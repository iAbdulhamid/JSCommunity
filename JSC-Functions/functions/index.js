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

// Authentication Middleware:
const fbAuth = (request, response, next) => {
    let idToken;
    if(request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        idToken = request.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return response.status(403).json({error: 'Unauthorized'});
    }

    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            request.user = decodedToken;
            console.log(decodedToken);
            return db.collection('users')
                .where('userID', '==', request.user.uid).limit(1).get();
        })
        .then(data => {
            request.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch(err => {
            console.error('Error while verifying token', err);
            return res.status(403).json(err);
        })
}

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
                    // ...doc.data()
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt,
                    commentCount: doc.data().commentCount, 
                    likeCount: doc.data().likeCount,
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

app.post('/post', fbAuth, (request, response) => {
    const newPost = {
        body: request.body.body,
        userHandle: request.user.handle,
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


const isEmpty = (string) => {
    if(string.trim() === '') return true;
        else return false;
}
const isEmail = (email) => {
    const RegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(RegEx)) return true;
        else return false;
}

// Registration Route
app.post('/signup', (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    };

    let errors = {};
    if(isEmpty(newUser.email)) {
        errors.email = 'Email is required'
    } else if (!isEmail(newUser.email)) {
        errors.email = 'Not vaild Email!'
    }
    if(isEmpty(newUser.password)) errors.password = 'Password is required'
    if(newUser.confirmPassword !== newUser.password) errors.confirmPassword = 'Passwords must match!'
    if(isEmpty(newUser.handle)) errors.handle = 'Handle is required'

    // If the errors object is NOT empty (NOT All the data are vaild and we have ERRORS!) ...
    // return the {errors} object and end the function ...
    if(Object.keys(errors).length > 0) {
        return response.status(400).json(errors);
    }

    // else ......
    // TODO: validate the data:
    let ttoken, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                response.status(400).json({handle: `This handle is already taken!`});
            } else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
            }
        }).then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        }).then(token => {
            ttoken = token;
            const userCredentials = {
                handle: newUser.handle,
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

// Login Route 
app.post('/login', (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };

    let errors = {};
    if(isEmpty(user.email)) {
        errors.email = 'Email is required'
    } else if (!isEmail(user.email)) {
        errors.email = 'Not vaild Email!'
    }
    if(isEmpty(user.password)) errors.password = 'Password is required';

    // If the errors object is NOT empty (NOT All the data are vaild and we have ERRORS!) ...
    // return the {errors} object and end the function ...
    if(Object.keys(errors).length > 0) {
        return response.status(400).json(errors);
    }

    // else ......
    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        }).then(token => {
            return response.json({token});
        }).catch(err => {
            console.error(err);
            if(err.code === "auth/wrong-password") {
                return response.status(403).json({error: `Wrong Password, please try again`});
            } else {
                return response.status(500).json({error: err.code});
            }
        });

})


// We need to tell firebase that (app) .. is the now the container for all our Routes ..
// https://baseurl.com/api/...
exports.api = functions.https.onRequest(app);