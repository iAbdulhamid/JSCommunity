const {db}               = require('../util/admin');
const { validateSignupData, validateLoginData } = require('../util/validator');


const firebaseConfig = require('../util/config');
const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);


exports.signUp = (request, response) => {
    const newUser = {
        email: request.body.email,
        password: request.body.password,
        confirmPassword: request.body.confirmPassword,
        handle: request.body.handle
    };

    // passing the data to validator module to validate it ...
    const {valid, errors} = validateSignupData(newUser);
    if(!valid) return response.status(400).json(errors);


    // else ......
    let token, userId;
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
        }).then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId //userID: userId
            };
            // add the new user to the ('/users) collection ...
            return db.doc(`/users/${newUser.handle}`).set(userCredentials);
        }).then(() => {
            return response.status(201).json({token});
        }).catch(err => {
            console.error(err);
            if(err.code === 'auth/email-already-in-use'){
                return response.status(400).json({error: `This email is already in use!`});
            } else {
                return response.status(500).json({error: err.code});
            }
        });
}

exports.login = (request, response) => {
    const user = {
        email: request.body.email,
        password: request.body.password
    };
    // passing the data to validator module to validate it ...
    const {valid, errors} = validateLoginData(user);
    if(!valid) return response.status(400).json(errors);



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

}