// Load HTTP module
const http = require("http");

const hostname = "127.0.0.1";
const port = 8000;

// Create HTTP server
const server = http.createServer(function (req, res) {
    // Set the response HTTP header with HTTP status and Content type
    res.writeHead(200, { "Content-Type": "text/plain" });

    // Send the response body "Hello World"
    res.end("Hello World\n");
});

// Prints a log once the server starts listening
server.listen(port, hostname, function () {
    console.log(`Server running at http://${hostname}:${port}/`);
});

const express = require("express");
const app = express();
const port2 = 3000;

app.get("/test", function (req, res) {
    res.send("Hello World!");
});

app.listen(port, function () {
    console.log(`Example app listening on port ${port2}!`);
});

