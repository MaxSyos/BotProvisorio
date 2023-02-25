var ccxt = require('ccxt');
var config = require('../config');
var ta = require('ta.js')
const https = require('https');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { SYMBOL } = require('../config');
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

/*  */
let bought = false;
let comprado = false;
let comp = false;
let Katta = false;
let buyed = false;

let selled = false;
let sold = false;
let vendido = false;
let Ureta = false;
let vend = false;
const symbol = config.SYMBOL;



async function server4bot() {

    console.log('')
    /* SISTEMA AVAX/BTC */

    var exchange = new ccxt.kucoin({
        'apiKey': "63f2735ff2ac430001940065",
        'secret': "bfb1cff6-b2d0-457e-af6a-08cb4c49e7f6",
        'password': "#Andreevc3686",
        'uid': "113700999"
    });

    /* DADOS */
    const mercado   = await exchange.load_markets ();
    const data      = (await exchange.fetchOHLCV ('ADA3L/USDT', '15m'));

    /* ACESSANDO CANDLES OHLC BCHBEAR/USD */
    const open  = (data.map(candleO => parseFloat(candleO[1]))).reverse();
    const high  = (data.map(candleH => parseFloat(candleH[2]))).reverse();
    const low   = (data.map(candleL => parseFloat(candleL[3]))).reverse();
    const close = (data.map(candleC => parseFloat(candleC[4]))).reverse();

    /* MÉDIAS DE MÓVEIS */
    const fastMedian  = await ta.sma(low, 88);
    const slowMedian  = await ta.sma(high, 100);
    const threeMedian = await ta.sma(high, 3);

//     /* RSI 15m BCHBEAR */

//     const param = low;
//     const src = 30;    

//     function calcRSI(param) {
//         let gains = 0;
//         let losses = 0;
    
//         for (let i = param.length - src; i < param.length; i++) {
//             const diff = param[i] - param[i - 1];
//             if (diff >= 0)
//                 gains += diff;
//             else
//                 losses -= diff;
//         }
    
//         const strength = gains / losses;
//         return 100 - (100 / (1 + strength))
//     }

//     const rsi = calcRSI(param);

    
//     /* CONVERÇÃO DE MOEDAS */ 
    const saldo = await exchange.fetchBalance();
    const USDTTotal     = (saldo.total['USDT']);
    const USDTFree      = (saldo.free['USDT']);
    const ADA3LTotal    = (saldo.total['ADA3L']);
    const BTCtotal      = ((saldo.total['BTC']));


 

//     /* ANALISE DE WALLET */
//     let quantity = (USDTFree);

    // /* CRIAÇÃO DE PROFITS */ 
    // const trades = (await exchange.fetchOrders('ADA3L/USDT')).reverse(); 
    // const Profit  = parseFloat((trades[0].price)*1.02);
    // const Stop    = parseFloat((trades[0].price));


    /* CRUZAMENTO DE MEDIAS */
    const crossover = (fastMedian[1]>slowMedian[1] && fastMedian[2]<slowMedian[2]);
    const crossunder = (fastMedian[1]<slowMedian[1] && fastMedian[2]>slowMedian[2]);

    /* MOMENTO DO TRADE */
    //const tstamp    = parseFloat(trad[0].timestamp);
    const timer     = (1000*60*240) 

//     /* REGISTRO DE MAREGM LIVRE */
//     const lado   = trades[0].side;
//     const ativo  = trades[0].symbol


//     if(lado === "buy" && ativo === 'ADA3L/USDT' && (USDTFree < (ADA3LTotal*close[0]))){
//         comprado = true;
//         console.log('Comprado em ADA3L')
//         console.log(`Profit em ${Profit}`)

//     }else{
//         vendido = false;
//     }


//     /* ESTATÉGIAS , CONDIÇÕES E ORDENS  */
 
    if(close[3]<open[3]  && close[2]<open[2] && close[1]>open[1] && ((close[1]-open[1])>(open[1]-low[1]))){
        console.log("Compra ADA3L")
        var buy = exchange.createMarketBuyOrder('ADA3L/USDT', USDTFree);
    } 

    if(comprado && (((close[0])>=Profit) && ativo === 'ADA3L/USDT' && lado === 'buy')){
        console.log("Fechamento do trade")
        var sell = exchange.createMarketSellOrder('ADA3L/USD', ADA3LTotal);
    } 

    app.get('/', async(req, res) => {
        return res.json({
            erro: false,
            datahome: {
                data
            }
        });
    });

}


module.exports =  { server4bot } ;


app.listen(port, () => {
    console.log(`Servidor iniciado na porta: ${port}`);
});

setInterval(server4bot, config.CRAWLER_INTERVAL);
