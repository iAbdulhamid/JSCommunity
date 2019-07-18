const { admin, db } = require('./admin');

// Authentication Middleware:
module.exports = (request, response, next) => {
    let idToken;
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
        idToken = request.headers.authorization.split('Bearer ')[1];
    } else {
        console.error('No token found');
        return response.status(403).json({error: 'Unauthorized'});
    }

    // We need to confirm that this token is issued by our applicatiion : (NOT somewere else!)
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
            return response.status(403).json(err);
        });
}