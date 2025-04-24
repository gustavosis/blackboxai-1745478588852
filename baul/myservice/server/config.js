module.exports = {
    port: 8000,  // Using port 8000 as required for web environment
    uploadDir: './uploads',
    database: {
        path: './server/db/myservice.db'
    },
    session: {
        secret: 'myservice-secret-key',
        resave: false,
        saveUninitialized: false
    },
    auth: {
        google: {
            clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret'
        },
        facebook: {
            clientID: process.env.FACEBOOK_CLIENT_ID || 'your-facebook-client-id',
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'your-facebook-client-secret'
        }
    }
};
