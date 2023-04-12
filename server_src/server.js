// Load HTTP module
const http = require("http");
const cors = require("cors");


const hostname = "127.0.0.1";
const port = 7523;

const express = require("express");
const app = express();

app.use(cors());

const sqlite3 = require('sqlite3').verbose();

// open the database
let db = new sqlite3.Database('../db/db.db');

let sql_shared = `SELECT id "id", content "content" FROM test
           WHERE shared = 1
           ORDER BY 1`;

app.get("/shared", function (req, res) {

    db.all(sql_shared, [], (err, rows) => {
        if (err) {
            throw err;
        }

        console.log(rows);
        res.send(rows);
    });

    console.log("Received a GET request at http://127.0.0.1:7523/shared");
});

app.listen(port, hostname, function () {
    console.log(`App listening on http://${hostname}:${port}/shared`);
});

