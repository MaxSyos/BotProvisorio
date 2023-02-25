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

async function bchCrossD() {

   
        var exchangeD = new ccxt.ftx({
            'apiKey': 'K_hbGUmbXhAoLsnH91_9YSCHd2Yn6umrgb4Z9pty',
            'secret': 'h9WnYUWmR2mn8Mfx-OQYSLt8tXRHMWPBGXwFBcMG',
            'headers' : {
                'FTX-SUBACCOUNT' : 'Prime'
        }
        });

        /* ACESSANDO CANDLES OHLCV 1D*/
        const mercadoD = await exchangeD.load_markets ();
        const dataD = (await exchangeD.fetchOHLCV (symbol, '1d')).reverse();
        const openD = dataD.map(candleOpe => parseFloat(candleOpe[1]));
        const highD = dataD.map(candleHig => parseFloat(candleHig[2]));
        const lowD = dataD.map(candleLow => parseFloat(candleLow[3]));
        const closeD = dataD.map(candleClo => parseFloat(candleClo[4]));
        const revlowD = lowD.reverse();

        /* MÉDIAS DE MÓVEIS */
        const fastMedianD  = await ta.sma(highD, 7);
        const slowMedianD  = await ta.sma(lowD, 140);
        const threeMedianD = await ta.sma(highD, 3);


        /* CONVERÇÃO DE MOEDAS DIARIO*/ 
        const regD = (await exchangeD.fetchOHLCV ('BTC/USD', '5m')).reverse();
        const cambioD = regD.map(candD => parseFloat(candD[4]));   
        const BTCD = cambioD[0];
        const saldoD = await exchangeD.fetchBalance(symbol);
        const USDD = ((saldoD.total['BTC'])*cambioD[0]);
        const freeD = (((saldoD.free['BTC'])*cambioD[0])/closeD[0]);
        const usedD = (((saldoD.used['BTC'])*cambioD[0])/closeD[0]);


        /* ANALISE DE WALLET */
        let quantityD  = (freeD);
        let qntNegociationD  = quantityD*1.85      

        /* CRIAÇÃO DE PROFITS DIARIO */
        const tradesD = (await exchangeD.fetchOrders (symbol)).reverse();        
        const buyProfitD = parseFloat((tradesD[0].price)*config.BUY_PROFITYD);
        const sellProfitD = parseFloat((tradesD[0].price)*config.SELL_PROFITYD); 

        /* CRUZAMENTO DE MEDIAS */
        const crossoverD = (fastMedianD[1]>slowMedianD[1] && fastMedianD[2]<slowMedianD[2]);
        const crossunderD = (fastMedianD[1]<slowMedianD[1] && fastMedianD[2]>slowMedianD[2]);

        let ClBuyD  = tradesD[0].amount;
        let ClSellD = tradesD[0].amount;

        /* MOMENTO DO TRADE */
        const tstampD    = parseFloat(tradesD[0].timestamp);
        const CandAtualD =  dataD.map(c=> parseFloat(c[0]));
        const timerD  = (1000*60*1440)

        /* REGISTRO DE MAREGM LIVRE */

        const ladoD   = tradesD[0].side;
        const ativoD  = tradesD[0].symbol;

        if(ladoD == "buy" && (freeD) < (usedD)){
            Katta = true;
        }else{
            Katta = false;
        }

        if(ladoD == "sell" && (freeD) < (usedD)){
            Ureta = true;
        }else{
            Ureta = false;
        } 

        /* ESTATÉGIAS , CONDIÇÕES E ORDENS DIARIO */

        if(crossoverD && !Katta && !Ureta && ((tstampD+timerD)<CandAtualD[0]) ){
            console.log("Compra do Dia")
            var buyD = exchangeD.createMarketBuyOrder(symbol, qntNegociationD);
        }

        if((crossunderD && Katta && !Ureta) || ((closeD[0])>=buyProfitD) && Katta && !Ureta){
            console.log("Fechando Compra do Dia")
            var sellD = exchangeD.createMarketSellOrder(symbol, ClSellD);
        }

        if(crossoverD && !Katta && !Ureta && ((tstampD+timerD)<CandAtualD[0]) ){
            console.log(`Venda do Dia`)
            var sellD = exchangeD.createMarketSellOrder(symbol, qntNegociationD);   
        }

        if((crossunderD && !Katta && Ureta) || ((closeD[0])<=sellProfitD) && !Katta && Ureta ){
            console.log(`Fechando Venda do Dia`)
            var buyD = exchangeD.createMarketBuyOrder(symbol, ClSellD); 
        } 
      

    console.log('FUNCIONANDO D')

}

setInterval(bchCrossD, config.CRAWLER_INTERVAL);

bchCrossD();

module.exports =  { bchCrossD } ;