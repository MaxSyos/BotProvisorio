var ccxt = require('ccxt');
var config = require('./config');
var ta = require('ta.js')
const pulBack =  require('./strategy/Kucoin')
const https = require('https');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { SYMBOL } = require('./config');
const serverless = require("serverless-http");



const app = express();
const port = process.env.PORT || 3001 ;

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    app.use(cors());
    next();
});

pulBack.pullBack();


app.listen(port, () => {
    console.log(`Servidor iniciado na porta: ${port}`);
});
