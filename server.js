const express = require('express')
const mongoose = require('mongoose')
const morgan = require('morgan')
const cors = require('cors')
const fs = require('fs')
const bodyParser = require('body-parser');
require('dotenv').config()

// app
const app = express()

// db
mongoose
    .connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Database Connected')
    })
    .catch((err) => { console.log(err) })

// middlewares
app.use(morgan('dev'));
app.use(bodyParser({ limit: '50mb' }));
app.use(cors());

// routes
fs.readdirSync('./routes').map(r => app.use("/api", require("./routes/" + r)))

const port = process.env.PORT || 8000
app.listen(port, () => console.log(`Server is running on ${port}`))