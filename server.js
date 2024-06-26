const express = require("express");
const http = require("http");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require('./config/config');

const urlencodeParser = bodyParser.urlencoded({ extended: false });
var pricesRouter = require("./routes/pricesRouter.js");

async function server() {
    
    app.use(bodyParser.json(), urlencodeParser);
    app.use(cors({
        origin: '*'
    }));

    app.use("/prices", pricesRouter);

    app.use((req, res, next) => { //doesn't send response just adjusts it
        res.header("Access-Control-Allow-Origin", "*") //* to give access to any origin
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept, Authorization" //to give access to all the headers provided
        );
        if (req.method === 'OPTIONS') {
            res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET'); //to give access to all the methods provided
            return res.status(200).json({});
        }
        next(); //so that other routes can take over
    })

    app.use((err, req, res, next) => {
        res.locals.error = err;
        if (err.status >= 100 && err.status < 600)
            res.status(err.status);
        else
            res.status(500);
        res.json({
            message: err.message,
            error: err
        });
    });

    app.get('/', (req, res) => {
        res.send('API is runninmg');
    });

    const httpServer = http.createServer(app);

    httpServer.listen(config.mainPort, () => {
        console.log(`Server is running on port ${config.mainPort}`);
    });
}

server();