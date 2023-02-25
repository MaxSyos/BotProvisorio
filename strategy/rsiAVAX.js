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

async function avaxRSI5m() {

    var exchange = new ccxt.ftx({
        'apiKey': 'tyv6hUyY5QoMqx0Zg8coaMqDO5nsLeBK-CKYobcJ',
        'secret': 'DjT6L28adBi-7IiL1sVeVjt2TL_QcuOpKC3kmYOE'
    });

    /* ACESSANDO CANDLES OHLC */
    const mercado = await exchange.load_markets ();
    const data = (await exchange.fetchOHLCV ('AVAX/BTC', '15m')).reverse();
    const open = data.map(candleO => parseFloat(candleO[1]));
    const high = data.map(candleH => parseFloat(candleH[2]));
    const low = data.map(candleL => parseFloat(candleL[3]));
    const close = data.map(candleC => parseFloat(candleC[4]));
    const revlow = low.reverse();

    /* MÉDIAS DE MÓVEIS */
    const fastMedian  = await ta.sma(low, 88);
    const slowMedian  = await ta.sma(high, 100);
    const threeMedian = await ta.sma(high, 3);


    /* RSI 5m */

    const param = revlow;
    const src = 30;    

    function calcRSI(param) {
        let gains = 0;
        let losses = 0;
    
        for (let i = param.length - src; i < param.length; i++) {
            const diff = param[i] - param[i - 1];
            if (diff >= 0)
                gains += diff;
            else
                losses -= diff;
        }
    
        const strength = gains / losses;
        return 100 - (100 / (1 + strength))
    }

    const rsi = calcRSI(param);

    /* CONVERÇÃO DE MOEDAS */ 
    const reg = (await exchange.fetchOHLCV ('BTC/USD', '5m')).reverse();
    const regax = (await exchange.fetchOHLCV ('AVAX/USD', '5m')).reverse();
    const cambio = reg.map(cand => parseFloat(cand[4]));   
    const xavasc = regax.map(cand => parseFloat(cand[4]));
    const USD = cambio[0];
    const saldo = await exchange.fetchBalance();
    const BTC = ((saldo.total['BTC'])*USD);
    const free = ((saldo.free['BTC'])*USD);
    const used = ((saldo.used['BTC'])*USD);
    const AVAX = ((saldo.total['AVAX'])*(xavasc[0]));


    /* ANALISE DE WALLET */
    let quantity = (free/cambio[0]);
    let qntNegociation   = quantity/close[0];


    /* CRIAÇÃO DE PROFITS */ 
    const trades = (await exchange.fetchOrders ('AVAX/BTC')).reverse(); 
    const Savax = parseFloat((trades[0].price)*config.SELL_PROFITY);


    /* CRUZAMENTO DE MEDIAS */
    const crossover = (fastMedian[1]>slowMedian[1] && fastMedian[2]<slowMedian[2]);
    const crossunder = (fastMedian[1]<slowMedian[1] && fastMedian[2]>slowMedian[2]);

    let ClBuy  = trades[0].amount;
    let ClSell = trades[0].amount;

    /* MOMENTO DO TRADE */
    const tstamp    = parseFloat(trades[0].timestamp);
    const CandAtual = data.map(c=> parseFloat(c[0]));
    const timer     = (1000*60*15)

    /* REGISTRO DE MAREGM LIVRE */

    const lado   = trades[0].side;
    const ativo  = trades[0].symbol

    if(lado == "buy" && (free) < (AVAX)){
        comprado = true;
    }else{
        comprado = false;
    }

    if(lado == "sell" && (free) > (AVAX)){
        vendido = true;
    }else{
        vendido = false;
    }


    /* ESTATÉGIAS , CONDIÇÕES E ORDENS AVAX  15MIN */

    if( rsi<45 && close[1]>open[1] && threeMedian[1]<close[1] && close[1]<fastMedian[1] && close[1]<slowMedian[1] && vendido && ((tstamp+timer)<CandAtual[0])){
        console.log("Comprando Bitcoin")
        var buy15 = exchange.createMarketSellOrder('AVAX/BTC', qntNegociation);      
    }

    if( comprado && !vendido && ((close[0]) <= Savax) ){
        console.log("Comprando AVAX")
        var sell15 = exchange.createMarketBuyOrder('AVAX/BTC', ClSell);
    }

    console.log('FUNCIONANDO AVAX')

}

setInterval(avaxRSI5m, config.CRAWLER_INTERVAL);

avaxRSI5m();

module.exports =  { avaxRSI5m } ;