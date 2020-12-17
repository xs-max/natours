const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
    // console.log('Uncaught Exception');
    // console.log(err.name, err.message);
        process.exit(1);
});

dotenv.config({
    path: './config.env'
});
const app = require('./app');



const DB = process.env.DATABASE.replace('PASSWORD', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
   useNewUrlParser: true,
   useCreateIndex: true,
   useFindAndModify: false,
   useUnifiedTopology: true
}).then(con => {
    console.log('Db connection successful!');
}).catch(err => console.log(err.message));


// start server    
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`app running on port ${port}...`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('Unhandled Rejection');
    server.close(() => {
        process.exit(1);
    });
    
});

process.on('SIGTERM', () => {
    console.log('SIGTERM RECEIVED, SHUTTING down gracefully');
    server.close(() => {
        console.log('PROCESS TERMINATED');
    })
})
