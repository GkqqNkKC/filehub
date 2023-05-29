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
app.use(require('body-parser').json());
app.use(require('express-fileupload')());

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
    console.log(`- upload-file: trying for ${JSON.stringify(req.body)}`);

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
            console.log(`- upload-file: error: when checking user`);
            res.status(400).send('Error uploading file');
        } else if (row === undefined) {
            console.log(`- upload-file: fail: user not authorized`);
            res.status(401).send('Unauthorized user');
        } else {
            const sql = `INSERT INTO files (path, name, size) VALUES ("${db_path}", "${req.files.file.name}", ${req.files.file.size})`;
            db.run(sql, function (err) {
                if (err) {
                    console.log(err);
                    res.status(400).send('Error uploading file');
                } else {
                    const file = req.files.file;
                    let file_id = this.lastID;
                    file.mv(local_path, function (err) {
                        if (err) {
                            console.log(`- upload-file: error: when moving file`);
                            res.status(400).send('Error uploading file');
                        } else {
                            const get_user_id = `SELECT id FROM users WHERE email = "${email}"`;

                            // get the id of the user and store it in the variable user_id
                            db.get(get_user_id, (err, row) => {
                                if (err) {
                                    console.log(err);
                                    res.status(400).send('Error uploading file');
                                } else {
                                    const user_id = row.id;

                                    const permissionSql = `INSERT INTO file_permissions (file, user, permission) VALUES (${file_id}, ${user_id}, "rw")`;
                                    db.run(permissionSql, function (err) {
                                        if (err) {
                                            console.log(err);
                                            res.status(400).send('Error uploading file');
                                        } else {
                                            console.log(`- upload-file: success: file uploaded and permissions added`);
                                            res.status(200).send('File uploaded successfully');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// function to get all files for a user
app.post('/get-files', (req, res) => {
    const { user } = req.body;

    const getUserIdSql = `select id from users where email = "${user}"`;
    // const getFilePermissionsSql = `select (select path from files b where b.id = a.file) path from file_permissions a where a.user = ?`;
    const getFilePermissionsSql = `select a.path, a.name, a.description, a.size from files a where exists (select * from file_permissions b where b.user = ? and b.file = a.id)`;

    db.get(getUserIdSql, (err, row) => {
        if(err) {console.log(err); res.status(400).send('Error'); return;}
        console.log(`- getting files for user id: ${row.id}`);
        
        db.all(getFilePermissionsSql, [row.id], (err, rows) => {
            if(err) {console.log(err); res.status(400).send('Error'); return;}
            res.status(200).send(rows);
        });
    });
});


// function to delete a file
app.post('/delete-file', (req, res) => {
    const {
        username,
        path
    } = req.body;
    db.get(`select * from users where email = "${username}"`, (err, row) => {
        if(err) {console.log(err); res.status(400).send(`Error`);}

        db.get(`select * from files where path = "${path}"`, (err, row_2) => {
            if(err) {console.log(err); res.status(400).send(`Error`);}

            const dbSql = 'SELECT * FROM file_permissions WHERE user = ? AND file = ?';
            db.get(dbSql, [row.id, row_2.id], function (err, row) {
                if (err) {
                    console.log(err);
                    res.status(400).send('Error deleting file');
                } else if (row === undefined) {
                    res.status(401).send('Unauthorized user or file not found');
                } else {
                    const local_path = `../${path}`;
                    fs.unlink(local_path, function (err) {
                        if (err) {
                            res.status(400).send('Error deleting file');
                        } else {
                            const deleteSql = 'DELETE FROM files WHERE path = ?';
                            db.run(deleteSql, [path], function (err) {
                                if (err) {
                                    res.status(400).send('Error deleting file');
                                } else {
                                    res.status(200).send('File deleted successfully');
                                }
                            });
                        }
                    });
                }
            });
        });
    })
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

// function to share a file with another user
app.post('/share-file', (req, res) => {
    const {
        email,
        password,
        timestamp,
        recipientEmail,
        permissions
    } = req.body;
    const db_path = `db/files/${timestamp}`;
    const userSql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.get(userSql, [email, password], function (err, row) {
        if (err) {
            res.status(400).send('Error sharing file');
        } else if (row === undefined) {
            res.status(401).send('Unauthorized user');
        } else {
            const recipientSql = 'SELECT * FROM users WHERE email = ?';
            db.get(recipientSql, [recipientEmail], function (err, recipientRow) {
                if (err) {
                    res.status(402).send('Error sharing file');
                } else if (recipientRow === undefined) {
                    res.status(403).send('Recipient not found');
                } else {
                    const fileSql = `SELECT id FROM files WHERE path = ?`;
                    db.get(fileSql, [db_path], function (err, fileRow) {
                        if (err) {
                            res.status(404).send('Error sharing file');
                        } else if (fileRow === undefined) {
                            res.status(405).send('File not found');
                        } else {
                            const sel_file = parseInt(fileSql);
                            const sel_user = parseInt(userSql);

                            const permissionSql = `INSERT INTO file_permissions(${sel_file}, ${sel_user}, ${permissions}) VALUES ('?', '?', '?')`;
                            db.run(permissionSql, [fileRow.id, recipientRow.id, permissions], function (err) {
                                if (err) {
                                    res.status(406).send('Error sharing file');
                                } else {
                                    res.status(200).send('File shared successfully');
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});


// start the server
app.listen(port, hostname, function () {
    console.log(`App listening on http://${hostname}:${port}`);
});