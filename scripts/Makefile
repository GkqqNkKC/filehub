all: ../client_src/filehub.css ../db/files ../server_src/node_modules

../client_src/filehub.css: ../client_src/filehub.scss
	scss ../client_src/filehub.scss ../client_src/filehub.css

../db/files:
	cd ../db && mkdir files

../server_src/node_modules:
	cd ../server_src && npm install express.js sqlite3@5.0.0 cors body-parser express-fileupload