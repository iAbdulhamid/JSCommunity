const { admin, db }               = require('../util/admin');
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

    // Setting unisex profile picture:
    const unisexImage = 'profilepic_unisex.png';

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
                imgUrl: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${unisexImage}?alt=media`,
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

exports.uploadImage = (request, response) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
  
    const busboy = new BusBoy({ headers: request.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname);        
        console.log(filename);
        console.log(mimetype);

        if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' });
        }

        // my.profile.image.png
        const imgExtension = filename.split('.')[filename.split('.').length -1]; 
        // 678578878.png
        imgFileName  = `${Math.round(Math.random() * 1000000000000).toString()}.${imgExtension}`;

        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = { filepath, mimetype };

        file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                metadata: {
                    contentType: imageToBeUploaded.mimetype
                }
            }
        }).then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${imageFileName}?alt=media`;
            return db.doc(`/users/${request.user.handle}`).update({ imageUrl });
        }).then(() => {
            return response.json({message: `Image uploaded successfully`});
        }).catch(err => {
            console.log(err);
            response.status(500).json({error: 'something went wrong'});
        })
    });
    busboy.end(request.rawBody);
}