const http = require("http");
const cors = require("cors");
const express = require("express");
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const hostname = "127.0.0.1";
const port = 7523;
const app = express();

app.use(express.json());
app.use(cors());

// open the database
let db = new sqlite3.Database('../db/db.db');

// register function to add a new user
app.post('/register', (req, res) => {
    const {
        email,
        password
    } = req.body;
    const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    db.run(sql, [email, password], function (err) {
        if (err) {
            res.status(400).send('Error registering user');
        } else {
            res.status(200).send('User registered successfully');
        }
    });
});

// login function to verify the user credentials
app.post('/login', (req, res) => {
    const {
        email,
        password
    } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(sql, [email, password], function (err, row) {
        if (err) {
            res.status(400).send('Error logging in');
        } else if (row === undefined) {
            res.status(401).send('Invalid email or password');
        } else {
            res.status(200).send('Logged in successfully');
        }
    });
});

// function to add a comment to a file
app.post('/add-comment', (req, res) => {
    const {
        file,
        user,
        str
    } = req.body;
    const sql = 'INSERT INTO file_comments (file, user, str) VALUES (?, ?, ?)';
    db.run(sql, [file, user, str], function (err) {
        if (err) {
            res.status(400).send('Error adding comment to file');
        } else {
            res.status(200).send('Comment added to file successfully');
        }
    });
});

// function to upload a file
app.post('/upload-file', (req, res) => {
    const {
        email,
        password
    } = req.body;
    const timestamp = Date.now();
    const db_path = `db/files/${timestamp}`;
    const local_path = `../${db_path}`;
    const userSql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(userSql, [email, password], function (err, row) {
        if (err) {
            res.status(400).send('Error uploading file');
        } else if (row === undefined) {
            res.status(401).send('Unauthorized user');
        } else {
            const sql = 'INSERT INTO files (owner, path) VALUES (?, ?)';
            db.run(sql, [row.id, db_path], function (err) {
                if (err) {
                    res.status(400).send('Error uploading file');
                } else {
                    const file = req.files.file;
                    file.mv(local_path, function (err) {
                        if (err) {
                            res.status(400).send('Error uploading file');
                        } else {
                            res.status(200).send('File uploaded successfully');
                        }
                    });
                }
            });
        }
    });
});

// function to download a file
app.get('/files/:timestamp', (req, res) => {
    const timestamp = req.params.timestamp;
    const db_path = `db/files/${timestamp}`;
    const local_path = `../${db_path}`;
    fs.access(local_path, fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('File not found');
        } else {
            res.download(local_path, (err) => {
                if (err) {
                    res.status(400).send('Error downloading file');
                }
            });
        }
    });
});

// start the server
app.listen(port, hostname, function () {
    console.log(`App listening on http://${hostname}:${port}`);
});