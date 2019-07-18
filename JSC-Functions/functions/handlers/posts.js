const {db} = require('../util/admin');

exports.getAllPosts = (request, response) => {
    db.collection('posts')
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
            });
            return response.json(posts);
        })
        .catch(err => {
            console.error(err);
            response.status(500).json({error: err.code});
        });
}
// before Express:
// exports.getPosts = functions.https.onRequest((request, response) => {
//     admin.firestore().collection('posts').get()
//         .then(data => {
//             let posts = [];
//             data.forEach(doc => {
//                 posts.push (doc.data());
//             })
//             return response.json(posts);
//         })
//         .catch(err => console.error(err));
// });

exports.postOne = (request, response) => {
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
}
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
