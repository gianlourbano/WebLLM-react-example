const express = require('express');
const app = express();

// server files from ../dist

app.use(express.static(__dirname + '/../dist'));

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    }
);