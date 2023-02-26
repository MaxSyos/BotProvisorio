var ccxt = require('ccxt');
var config = require('./config');
var ta = require('ta.js')
const pulBack =  require('./strategy/Kucoin')
const https = require('https');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
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

async function PortOpen() {

     
    console.log('');

    /* SYSTEM */
    var exchange = new ccxt.kucoin({
        'apiKey': config.API_KEY,
        'secret': config.SECRET_KEY,
        'password': config.PASSWORD,
        'uid': config.UID
    });

    let comprado = false;

    /* DADOS */
    const mercado = await exchange.load_markets();
    const data = (await exchange.fetchOHLCV(config.SYMBOL, '15m'));


    /* ACESSANDO CANDLES OHLC BCHBEAR/USD */
    const open = (data.map(candleO => (candleO[1]))).reverse();
    const high = (data.map(candleH => (candleH[2]))).reverse();
    const low = (data.map(candleL => (candleL[3]))).reverse();
    const close = (data.map(candleC => (candleC[4]))).reverse();

    /* MÉDIAS DE MÓVEIS */
    const fastMedian = await ta.sma(low, 88);
    const slowMedian = await ta.sma(high, 100);
    const threeMedian = await ta.sma(high, 3);

    /* CONVERÇÃO DE MOEDAS */
    const saldo = await exchange.fetchBalance();
    const USDTTotal = saldo.total['USDT'];
    const USDTFree = saldo.free['USDT'];
    const ADA3LTotal = saldo.total['ADA3L'];
    const BTCtotal = saldo.total['BTC'];
    const amountUSDT = 1.1

    /* CRIAÇÃO DE PROFITS */
    const trades = (await exchange.fetchMyTrades('ADA3L/USDT')).reverse();
    const groundZero = trades.find(trades => trades.side === 'sell').timestamp
    const point = trades.filter(trades => trades.side === 'buy')
    const amount = point.filter(trades => trades.timestamp > groundZero)
    const setPrice = amount.map(amount => amount.price)
    const n = setPrice.length;
    let sum = 0;

    for (var i = 0; i < setPrice.length; i++) {
        sum += setPrice[i];
    }

    const medianPrice = sum / n

    const Profit = (medianPrice * 1.02);


    /* CRUZAMENTO DE MEDIAS */
    const crossover = (fastMedian[1] > slowMedian[1] && fastMedian[2] < slowMedian[2]);
    const crossunder = (fastMedian[1] < slowMedian[1] && fastMedian[2] > slowMedian[2]);

    /* MOMENTO DO TRADE */
    const timer = (1000 * 60 * 15);
    const tstamp = ((trades[0].timestamp)+timer);
    const current = (data.map(candleO => (candleO[0]))).reverse();
    const currentCandle = current[0]

    /* REGISTRO DE MAREGM LIVRE */
    const lado = trades[0].side;
    const ativo = trades[0].symbol;
    const bodyTrade = {
        orderId: trades[0].order,
        symbol: trades[0].symbol,
        side: trades[0].side,
        quantity: trades[0].amount,
        priceUSD: trades[0].price,
        timestamp: trades[0].timestamp,
        moment: trades[0].datetime,
    }

    if (lado === "buy" && ativo === 'ADA3L/USDT' && (0.999999 < (ADA3LTotal * close[0]))) {
        comprado = true;
        console.log(`Comprado em ${config.SYMBOL}` );
        console.log(`Profit em ${Profit}`);

    } else {
        console.log(`Última venda em ${groundZero}`);
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS  */
    if (currentCandle>tstamp && close[3] < open[3] && close[2] < open[2] && close[1] > open[1] && ((close[1] - open[1]) > (open[1] - low[1]))) {
        console.log("Compra ADA3L")
        var buy = exchange.createMarketBuyOrder('ADA3L/USDT', amountUSDT);
    }

    if (comprado && ((close[0] >= Profit) && ativo === 'ADA3L/USDT' && lado === 'buy')) {
        console.log("Fechamento do trade")
        var sell = exchange.createMarketSellOrder('ADA3L/USDT', ADA3LTotal);
    }

    const ultimoCandle = `${currentCandle}`
    const ultimaVenda = `${groundZero}`
    const ultimoCompra = `${point[0].price}`
    const horaCompra = `${point[0].timestamp}`
    const estado = comprado ? `Está comprado em ADA3L e o profit em ${Profit}` : 'Está esperando oportunidade';

    app.get('/', async(req, res) => {
        return res.json({
            erro: false,
            datahome: {
                ultimoCandle,
                ultimaVenda,
                ultimoCompra,
                horaCompra,
                estado
            }
        });
    });
}


module.exports =  { PortOpen } ;


app.listen(port, () => {
    console.log(`Servidor iniciado na porta: ${port}`);
});

setInterval(PortOpen, config.CRAWLER_INTERVAL);