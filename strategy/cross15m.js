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

async function btcCross15m() {

    var exchange15 = new ccxt.ftx({
        'apiKey': 'fDhvBqPiAMLxlQZgjKdksdRKO3y9y1P07Ebtf6Fd',
        'secret': 'Ru0DmmYIVmxiQZ4nZ75z_P6tAdDoV351Q2qYMq78',
        'headers' : {
            'FTX-SUBACCOUNT' : 'SUBVENDAS'
        }
    });

    /* ACESSANDO CANDLES OHLC */
    const mercado = await exchange15.load_markets ();
    const data15 = (await exchange15.fetchOHLCV ('BTC/USD', '15m')).reverse();
    const open15 = data15.map(candleO => parseFloat(candleO[1]));
    const high15 = data15.map(candleH => parseFloat(candleH[2]));
    const low15  = data15.map(candleL => parseFloat(candleL[3]));
    const close15 = data15.map(candleC => parseFloat(candleC[4]));
    const revlow15 = low15.reverse();

    /* MÉDIAS DE MÓVEIS */
    const fastMedian15  = await ta.sma(high15, 7);
    const slowMedian15  = await ta.sma(low15, 140);
    const threeMedian15 = await ta.sma(high15, 3);


    /* CONVERÇÃO DE MOEDAS 15m*/ 
    const reg15 = (await exchange15.fetchOHLCV ('BTC/USD', '5m')).reverse();
    const cambio15 = reg15.map(cand15 => parseFloat(cand15[4]));   
    const BTC15 = cambio15[0];
    const saldo15 = await exchange15.fetchBalance(symbol);
    const USD15 = (saldo15.total['USD']);
    const free15 = (saldo15.free['USD']);
    const SalBTC = (saldo15.total['BTC']);


    /* ANALISE DE WALLET */
    let quantity15 = (free15/cambio15[0]);
    let qntNegociation15   = quantity15/close15[0];

    /* CRIAÇÃO DE PROFITS 15m */
    const trades15 = (await exchange15.fetchOrders ('BTC/USD')).reverse();        
    const buyProfit15 = parseFloat((trades15[0].price)*config.BUY_PROFITY15);
    const sellProfit15 = parseFloat((trades15[0].price)*config.SELL_PROFITY15);

    /* CRUZAMENTO DE MEDIAS */
    const crossover15 = (fastMedian15[1]>slowMedian15[1] && fastMedian15[2]<slowMedian15[2]);
    const crossunder15 = (fastMedian15[1]<slowMedian15[1] && fastMedian15[2]>slowMedian15[2]);

    let ClBuy15  = trades15[0].amount;
    let ClSell15 = trades15[0].amount;

    /* MOMENTO DO TRADE */
    const tstamp15    = parseFloat(trades15[0].timestamp);
    const CandAtual15 =  data15.map(c=> parseFloat(c[0]));
    const timer15     = (1000*60*15)

    /* REGISTRO DE MAREGM LIVRE */

    const lado15   = trades15[0].side;
    const ativo15 = trades15[0].symbol

    if(SalBTC > 0.00001){
        bought = true;
        sold   = false;
    }else{
        bought = false;
        sold   = false;
    }


    /* ESTATÉGIAS , CONDIÇÕES E ORDENS 15 MIN */

    if( crossunder15 && !bought && sold && ((tstamp+timer)<CandAtual[0])){
        console.log("Compra 15min")
        var buy15 = exchange15.createMarketBuyOrder('BTC/USD', quantity15);      
    }

    if( bought && !sold && ((close[0])>=buyProfit15) || bought && !sold && crossover){
        console.log("Fechando Compra 15min")
        var sell15 = exchange15.createMarketSellOrder('BTC/USD', ClBuy);
    }

    if( lado15 == "sell" && !bought && close15[0]<=sellProfit15){
        console.log("Compra 15min")
        var buy15 = exchange15.createMarketBuyOrder('BTC/USD', quantity15);      
    }

    console.log('FUNCIONANDO 15m')


}

setInterval(btcCross15m, config.CRAWLER_INTERVAL);

btcCross15m();

module.exports =  { btcCross15m } ;