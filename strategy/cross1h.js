var ccxt = require('ccxt');
var config = require('../config');
var ta = require('ta.js')
const https = require('https');

const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001 ;



let bought = false;
let comprado = false;
let comp = false;
let Katta = false;

let sold = false;
let vendido = false;
let Ureta = false;
let vend = false;
const symbol = config.SYMBOL;
const bBCH  = config.BCH3x;
const sBCH  = config.BCH2x

async function bchCross1H() {

    var exchange60 = new ccxt.ftx({
        'apiKey': 'YwQ2E2gsuhV_EoaBRyACSRKkftrxPQ34aX_vbMaR',
        'secret': 'q8-jUYb-oACbFrZGyCyvimIHkRKLilDPqRB5BUrq',
        'headers' : {
            'FTX-SUBACCOUNT' : 'Optimus'
    }
    });

    /* ACESSANDO CANDLES OHLCV 1h*/
    const mercado60 = await exchange60.load_markets ();
    const data60  = (await exchange60.fetchOHLCV (symbol, '1h')).reverse();
    const open60  = data60.map(candleOpen => parseFloat(candleOpen[1]));
    const high60  = data60.map(candleHigh => parseFloat(candleHigh[2]));
    const low60   = data60.map(candleLoow => parseFloat(candleLoow[3]));
    const close60 = data60.map(candleClose => parseFloat(candleClose[4]));

    /* MÉDIAS DE MÓVEIS 1h*/
    const fastMedian60 = await ta.sma(high60, 20);
    const slowMedian60 = await ta.sma(close60, 300);

    /* CONVERÇÃO DE MOEDAS 1h*/ 
    const reg60 = (await exchange60.fetchOHLCV ('BTC/USD', '5m')).reverse();
    const cambio60 = reg60.map(cand60 => parseFloat(cand60[4]));   
    const BTC60 = cambio60[0];
    const saldo60 = await exchange60.fetchBalance(symbol);
    const USD60 = ((saldo60.total['BTC'])*cambio60[0]);
    const free60 = (((saldo60.free['BTC'])*cambio60[0])/close60[0]);  
    const used60 = (((saldo60.used['BTC'])*cambio60[0])/close60[0]);

    /* ANALISE DE WALLET */
    let quantity60 = (free60);
    let qntNegociation60 = quantity60*1.85

    /* CRIAÇÃO DE PROFITS 1h */
    const trades60 = (await exchange60.fetchOrders (symbol)).reverse();        
    const buyProfit60 = parseFloat((trades60[0].price)*config.BUY_PROFITY60);
    const sellProfit60 = parseFloat((trades60[0].price)*config.SELL_PROFITY60);

    /* CRUZAMENTO DE MEDIAS60m*/
    const crossover60 = (fastMedian60[1]>slowMedian60[1] && fastMedian60[2]<slowMedian60[2]);
    const crossunder60 = (fastMedian60[1]<slowMedian60[1] && fastMedian60[2]>slowMedian60[2]);

    let ClBuy60  = trades60[0].amount;
    let ClSell60 = trades60[0].amount;

    /* MOMENTO DO TRADE */
    const tstamp60 = parseFloat(trades60[0].timestamp);
    const CandAtual60 =  data60.map(c60=> parseFloat(c60[0]));
    const timer60 = (1000*60*60)

    /* REGISTRO DE MAREGM LIVRE */
    const lado60 = trades60[0].side;

    if(lado60 == "buy" && (free60) < (used60)){
        comp = true;
    }else{
        comp = false;
    }

    if(lado60 == "sell" && (free60) < (used60)){
        vend = true;
    }else{
        vend = false;
    }


    /* ESTATÉGIAS , CONDIÇÕES E ORDENS 1h */

    if(crossover60 && !comp && !vend && ((tstamp60+timer60)<CandAtual60[0]) ){
        console.log("Compra 1h")
        var buy60 = exchange60.createMarketBuyOrder(symbol, qntNegociation60);
        //buyOrders.push(buyProfit);          
    }

    if((crossunder60  && comp && !vend) || ((close60[0])>=buyProfit60) && comp && !vend){
        console.log("Fechando Compra 1h")
        var sell60 = exchange60.createMarketSellOrder(symbol, ClBuy60);
    }

    if(crossunder60 && !comp && !vend && ((tstamp60+timer60)<CandAtual60[0])){
        console.log(`Venda 1h`)
        var sell60 = exchange60.createMarketSellOrder(symbol, qntNegociation60);
        //sellOrders.push(sellProfit);
    }

    if((crossover60 && !comp && vend) || ((close60[0])<=sellProfit60) && !comp && vend){
        console.log(`Fechando Venda 1h`)
        var buy60 = exchange60.createMarketBuyOrder(symbol, ClSell60); 
    }


    console.log('FUNCIONANDO 1h')
}

setInterval(bchCross1H, config.CRAWLER_INTERVAL);

bchCross1H();

module.exports =  { bchCross1H } ;