var ccxt = require('ccxt');
var config = require('./config');
var ta = require('ta.js')
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

    var exchange = new ccxt.ftx({
        'apiKey': config.API_KEY,
        'secret': config.SECRET_KEY
    });

    /* DADOS */
    const mercado   = await exchange.load_markets ();
    const data      = (await exchange.fetchOHLCV ('BCHBEAR/USD', '15m'));
    const dataBULL  = (await exchange.fetchOHLCV ('BCHBULL/USD', '4h'));
    const dataBTC   = (await exchange.fetchOHLCV ('BTC/USD', '1w'));

    /* ACESSANDO CANDLES OHLC BCHBEAR/USD */
    const open  = (data.map(candleO => parseFloat(candleO[1]))).reverse();
    const high  = (data.map(candleH => parseFloat(candleH[2]))).reverse();
    const low   = (data.map(candleL => parseFloat(candleL[3]))).reverse();
    const close = (data.map(candleC => parseFloat(candleC[4]))).reverse();

    /* ACESSANDO CANDLES OHLC BCHBULL/USD */
    const openBULL  = (dataBULL.map(cO => parseFloat(cO[1]))).reverse();
    const highBULL  = (dataBULL.map(cH => parseFloat(cH[2]))).reverse();
    const lowBULL   = (dataBULL.map(cL => parseFloat(cL[3]))).reverse();
    const closeBULL = (dataBULL.map(cC => parseFloat(cC[4]))).reverse();


    /* ACESSANDO CANDLES OHLC BTC/USD */
    const openWBTC  = (dataBTC.map(VELAO => parseFloat(VELAO[1]))).reverse();
    const highWBTC  = (dataBTC.map(VELAH => parseFloat(VELAH[2]))).reverse();
    const lowWBTC   = (dataBTC.map(VELAL => parseFloat(VELAL[3]))).reverse();
    const closeWBTC = (dataBTC.map(VELAC => parseFloat(VELAC[4]))).reverse();



    /* MÉDIAS DE MÓVEIS */
    const fastMedian  = await ta.sma(low, 88);
    const slowMedian  = await ta.sma(high, 100);
    const threeMedian = await ta.sma(high, 3);

    /* MÉDIAS DE MÓVEIS 4h */
    const fastMBULL  = await ta.sma(lowBULL, 66);
    const slowMBULL  = await ta.sma(highBULL, 70);
    const threeMBULL = await ta.sma(highBULL, 2);

    /* MÉDIA MINÍMA DE 8 SEMANAL DO BTC */
    const eightMedianBTC = await ta.sma(lowWBTC, 8);
    
    /* RSI 15m BCHBEAR */

    const param = low;
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

    
    /* RSI BCHBULL 4h */

    const pBULL = lowBULL;
    const srcBULL = 30;    

    function bullRSI(pBULL) {
        let g= 0;
        let l = 0;
    
        for (let i = pBULL.length - srcBULL; i < pBULL.length; i++) {
            const d = pBULL[i] - pBULL[i - 1];
            if (d >= 0)
                g += d;
            else
                l -= d;
        }
    
        const str = g / l;
        return 100 - (100 / (1 + str))
    }

    const rsiBULL = bullRSI(pBULL);

    /* CONVERÇÃO DE MOEDAS */ 
    const saldo = await exchange.fetchBalance();
    const USDTotal     = (saldo.total['USD']);
    const USDFree      = (saldo.free['USD']);
    const BCHBEARTotal = (saldo.total['BCHBEAR']);
    const BCHBEARFree  = (saldo.free['BCHBEAR']);
    const BCHBULLTotal = (saldo.total['BCHBULL']);
    const BCHBULLFree  = (saldo.free['BCHBULL']);
    const BTCtotal     = ((saldo.total['BTC']));
    const BTCFree      = ((saldo.free['BTC']));


    const Soma = (USDTotal+(BTCtotal*closeWBTC[0])+(BCHBEARTotal*close[0])+(BCHBULLTotal*closeBULL[0]))
    

    /* ANALISE DE WALLET */
    let quantity = (USDFree/close[0]);
    let BULLqnt  = (USDFree/closeBULL[0]);


    /* CRIAÇÃO DE PROFITS */ 
    const trades = (await exchange.fetchOrders ('BCHBEAR/USD')).reverse(); 
    const trad   = (await exchange.fetchOrders ('BCHBULL/USD')).reverse(); 
    const ProfitBear  = parseFloat((trades[0].price)*config.BEAR_PROFITY);
    const StopBear    = parseFloat((trades[0].price)*config.BEAR_STOP);
    const Profithalf  = parseFloat((trad[0].price)*config.HALF_PROFITY);
    const Profitfull  = parseFloat((trad[0].price)*config.FULL_PROFITY);
    const Stophalf    = parseFloat((trad[0].price)*config.HALF_STOP);
    const Stopfull    = parseFloat((trad[0].price)*config.FULL_STOP);

    /* CRUZAMENTO DE MEDIAS */
    const crossover = (fastMedian[1]>slowMedian[1] && fastMedian[2]<slowMedian[2]);
    const crossunder = (fastMedian[1]<slowMedian[1] && fastMedian[2]>slowMedian[2]);

    let ClBuy  = trades[0].amount;
    let full   = (trad[0].amount)
    let half   = ((trad[0].amount)/2);

    /* MOMENTO DO TRADE */
    const tstamp    = parseFloat(trad[0].timestamp);
    const CandAtual = dataBULL.map(c=> parseFloat(c[0]));
    const timer     = (1000*60*240)

    /* REGISTRO DE MAREGM LIVRE */

    const lado   = trades[0].side;
    const lad    = trad[0].side;
    const lado1  = trades[1].side;
    const lad1   = trad[1].side;
    const ativo  = trades[0].symbol
    const ativ   = trad[0].symbol
    const ativo1 = trades[1].symbol
    const ativ1  = trad[1].symbol

    if(lado === "buy" && ativo === 'BCHBEAR/USD' && (0 < (BCHBEARTotal*close[0]))){
        vendido = true;
        console.log('Comprado em BCHBEAR')
        console.log(`Profit em ${ProfitBear}`)

    }else{
        vendido = false;
    }
/* 
    if(lado === "buy" && ativo === 'AVAX/BTC' && (AVAXFree) < (AVAXtotal*closeAVAX[0])){
        comprado = true;
        console.log('AVAX/BTC')
        console.log('Comprado em AVAX')
        console.log(`Profit em ${ProfitAVAX}`)
    }else {
        comprado = false;
    }
*/
    if(lad === "buy" && ativ === 'BCHBULL/USD' && (USDFree) < (BCHBULLTotal*closeBULL[0])){
        comprado = true;
        console.log('Comprado 100% em BCHBULL')
        console.log(`Profit em ${Profithalf}`)

    }else if(lad1 === "buy" && lad === "sell" && ativ === 'BCHBULL/USD' && (0 < (BCHBULLTotal*closeBULL[0]))){
        comprado = true;
        console.log('Comprado 100% em BCHBULL')
        console.log(`Profit em ${Profithalf}`)
    }else {
        comprado = false;
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS BCHBEAR/USD 15min */

    if( (USDFree > 10000*close[0]) && eightMedianBTC[1]>closeWBTC[1] && close[1]<fastMedian[1] && close[1]<slowMedian[1] && close[1]>threeMedian[1] && close[1]>open[1] && !vendido){  
        console.log("Compra BCHBEAR 15m")
        var buy = exchange.createMarketBuyOrder('BCHBEAR/USD', quantity);      
    }

    if( vendido && (((close[0]) >= ProfitBear) || ((close[0]) <= StopBear))){
        console.log("Fechando Compra BCHBEAR 15min")
        var sell = exchange.createMarketSellOrder('BCHBEAR/USD', BCHBEARTotal);
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS BCHBULL/USD 4h */

    if( eightMedianBTC[1]<closeWBTC[1] && (timer+tstamp<CandAtual[0]) && (USDFree > 10000*closeBULL[0]) && closeBULL[1]>fastMBULL[1] && closeBULL[1]>slowMBULL[1] && closeBULL[1]<threeMBULL[1] && closeBULL[1]<openBULL[1] && !comprado){  
        console.log("Compra BCHBULL 4h")
        var buy = exchange.createMarketBuyOrder('BCHBULL/USD', BULLqnt);      
    }

    if( ( (timer+tstamp<CandAtual[0]) && comprado && (((closeBULL[0]) >= Profithalf) || ((closeBULL[0]) <= Stophalf)) && ativ === 'BCHBULL/USD' ) ){
        console.log("Fechamento Parcial BCHBULL 4h")
        var sell = exchange.createMarketSellOrder('BCHBULL/USD', BCHBULLTotal);
    }

/*     if( comprado && (((closeBULL[0])>=Profitfull) || ((closeBULL[0]) <= Stopfull))  && ativ === 'BCHBULL/USD' && lad === 'sell'){
        console.log("Fechamento total BCHBULL 4h")
        var sell = exchange.createMarketSellOrder('BCHBULL/USD', BCHBULLTotal);
    } */


    /* SISTEMA DE BTC/USD */

    var exchange15 = new ccxt.ftx({
        'apiKey': config.API_KEY15,
        'secret': config.SECRET_KEY15,
        'headers' : {
            'FTX-SUBACCOUNT' : 'SUBVENDAS'
        }
    });

    /* ACESSANDO CANDLES OHLC */ 
    const mercado15 = await exchange15.load_markets ();
    const data15 = (await exchange15.fetchOHLCV ('BTC/USD', '15m'));
    const open15 = (data15.map(candleO => parseFloat(candleO[1]))).reverse();
    const high15 = (data15.map(candleH => parseFloat(candleH[2]))).reverse();
    const low15  = (data15.map(candleL => parseFloat(candleL[3]))).reverse();
    const close15 = (data15.map(candleC => parseFloat(candleC[4]))).reverse();

    /* MÉDIAS DE MÓVEIS 
    const fastMedian15  = await ta.sma(low15, 88);
    const slowMedian15  = await ta.sma(high15, 200);
    const threeMedian15 = await ta.sma(high15, 3);


        /* RSI 15m 

        const param15 = low15;
        const src15 = 30;    
    
        function calcRSI15(param15) {
            let gains15 = 0;
            let losses15 = 0;
        
            for (let i = param15.length - src; i < param15.length; i++) {
                const diff15 = param15[i] - param15[i - 1];
                if (diff15 >= 0)
                    gains15 += diff15;
                else
                    losses15 -= diff15;
            }
        
            const strength15 = gains15 / losses15;
            return 100 - (100 / (1 + strength15))
        }
    
        const rsi15 = calcRSI15(param15);

    /* CONVERÇÃO DE MOEDAS 15m */
    const reg15 = (await exchange15.fetchOHLCV ('BTC/USD', '15m')).reverse();
    const BULLEX = (await exchange15.fetchOHLCV ('BULL/USD', '15m')).reverse();
    const BCHBULLEX = (await exchange15.fetchOHLCV ('BCHBULL/USD', '15m')).reverse();

    const cambio15 = reg15.map(cand15 => parseFloat(cand15[4]));   
    const cambBULL15 = BULLEX.map(cd => parseFloat(cd[4]));   
    const cambBCHBULL15 = BCHBULLEX.map(cand => parseFloat(cand[4]));   
    const BTC15 = cambio15[0];
    const BULL15 = cambBULL15[0];
    const BCHBULL15 = cambBCHBULL15[0];
    const saldo15 = await exchange15.fetchBalance(symbol);
    const USD15 = (saldo15.total['USD']);
    const SalBULL15 = (saldo15.total['BULL']);
    const SalBCHBULL15  = (saldo15.total['BCHBULL']);
    const free15 = (saldo15.free['USD']);
    const SalBTC = (saldo15.total['BTC']);
    
    const Soma15 = ((SalBTC*BTC15)+USD15+(SalBULL15*BULL15)+(SalBCHBULL15*BCHBULL15))
    

    /* ANALISE DE WALLET 
    let quantity15 = (free15/cambio15[0]);
    let qntNegociation15   = quantity15/close15[0];

    /* CRIAÇÃO DE PROFITS 15m 
    const trades15 = (await exchange15.fetchOrders ('BTC/USD')).reverse();        
    const buyProfit15 = parseFloat((trades15[0].price)*config.BUY_PROFITY15);
    const sellProfit15 = parseFloat((trades15[0].price)*config.SELL_PROFITY15);

    /* CRUZAMENTO DE MEDIAS 
    const crossover15 = (fastMedian15[1]>slowMedian15[1] && fastMedian15[2]<slowMedian15[2]);
    const crossunder15 = (fastMedian15[1]<slowMedian15[1] && fastMedian15[2]>slowMedian15[2]);

    let ClBuy15  = trades15[0].amount;
    let ClSell15 = trades15[0].amount;

    /* MOMENTO DO TRADE 
    const tstamp15    = parseFloat(trades15[0].timestamp);
    const CandAtual15 =  data15.map(c=> parseFloat(c[0]));
    const timer15     = (1000*60*15)

    /* REGISTRO DE MAREGM LIVRE 

    const lado15   = trades15[0].side;
    const ativo15 = trades15[0].symbol

    if(SalBTC > 0.00001){
        console.log('BTC/USD')
        console.log('Comprado em Bitcoin')
        console.log(`Profit em ${buyProfit15}`)
        bought = true;
        sold   = false;
    }else{
        console.log('BTC/USD')
        console.log('Vendido em Bitcoin')
        console.log(`Profit em ${sellProfit15}`)
        bought = false;
        sold   = false;
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS 15 MIN 

    if( close[0]<fastMedian15 && close[0]<slowMedian15 && close[0]>threeMedian15 && close[0]>open[0] && rsi15<41 && !bought ){
        console.log("Compra 15min")
        var buy15 = exchange15.createMarketBuyOrder('BTC/USD', quantity15);      
    }

    if( bought && ((close[0])>=buyProfit15)){
        console.log("Fechando Compra 15min")
        var sell15 = exchange15.createMarketSellOrder('BTC/USD', ClBuy15);
    }


    /* SISTEMA DE BCH FUTURES 1H */

    var exchange60 = new ccxt.ftx({
        'apiKey': config.API_KEY60,
        'secret': config.SECRET_KEY60,
        'headers' : {
            'FTX-SUBACCOUNT' : 'Optimus'
        }
    });


    /* ACESSANDO CANDLES OHLCV 1h*/
    const mercado60 = await exchange60.load_markets ();
    const data60  = ((await exchange60.fetchOHLCV (symbol, '1h'))).reverse();
    const dataAVAX  = (await exchange60.fetchOHLCV ('AVAX/BTC', '15m'));

    const open60  = data60.map(candleOpen => parseFloat(candleOpen[1]));
    const high60  = data60.map(candleHigh => parseFloat(candleHigh[2]));
    const low60   = data60.map(candleLoow => parseFloat(candleLoow[3]));
    const close60 = data60.map(candleClose => parseFloat(candleClose[4]));

    /* ACESSANDO CANDLES OHLC AVAX/USD */
    const openAVAX  = (dataAVAX.map(canO => parseFloat(canO[1]))).reverse();
    const highAVAX  = (dataAVAX.map(canH => parseFloat(canH[2]))).reverse();
    const lowAVAX   = (dataAVAX.map(canL => parseFloat(canL[3]))).reverse();
    const closeAVAX = (dataAVAX.map(canC => parseFloat(canC[4]))).reverse();

    /* MÉDIAS DE MÓVEIS  AVAX*/
    const fastMedianAVAX  = await ta.sma(highAVAX, 19);
    const slowMedianAVAX  = await ta.sma(lowAVAX, 54);
    const threeMedianAVAX = await ta.sma(highAVAX, 19);

    /* MÉDIAS DE MÓVEIS 1h*/
    const fastMedian60 = await ta.sma(high60, 20);
    const slowMedian60 = await ta.sma(close60, 300);

    /* CONVERÇÃO DE MOEDAS 1h*/ 
    const reg60 = (await exchange60.fetchOHLCV ('BTC/USD', '5m')).reverse();
    const cambio60 = reg60.map(cand60 => parseFloat(cand60[4]));   
    const BTC60 = cambio60[0];
    const saldo60 = await exchange60.fetchBalance(symbol);
    const USD60 = ((saldo60.total['BTC'])*cambio60[0]);
    const free60 = (((saldo60.free['BTC'])*cambio60[0]));  
    const used60 = (((saldo60.used['BTC'])*cambio60[0]));
    const usedUSD = (((saldo60.used['USD'])*cambio60[0]));
    const BTCAVAX = (((saldo60.total['AVAX'])*closeAVAX[0])*cambio60[0])
    const AVAXtotal  = ((saldo60.total['AVAX']));
    const AVAXFree   = ((saldo60.free['AVAX']));
    
    const Soma60 = (USD60+(saldo60.total['USD'])+((AVAXtotal*closeAVAX[0])*cambio60[0]))

    /* ANALISE DE WALLET */
    let quantity60 = (free60/close60[0]);
    let qntNegociation60 = (quantity60+(BTCAVAX/close60[0]))*1.85
    let qntAVAX = (((saldo60.free['BTC'])/closeAVAX[0]))
    

    /* CRIAÇÃO DE PROFITS 1h */
    const trades60     = (await exchange60.fetchMyTrades ('BCH-PERP')).reverse();
    const tradesAVAX     = (await exchange60.fetchMyTrades('AVAX/BTC')).reverse()        
    const buyProfit60  = parseFloat((trades60[0].price)*config.BUY_PROFITY60);
    const sellProfit60 = parseFloat((trades60[0].price)*config.SELL_PROFITY60);
    const ProfitAVAX   = parseFloat((tradesAVAX[0].price)*config.AVAX_PROFITY);
    const StopAVAX     = parseFloat((tradesAVAX[0].price)*config.AVAX_STOP);

    /* CRUZAMENTO DE MEDIAS60m*/
    const crossover60 = (fastMedian60[1]>slowMedian60[1] && fastMedian60[2]<slowMedian60[2]);
    const crossunder60 = (fastMedian60[1]<slowMedian60[1] && fastMedian60[2]>slowMedian60[2]);

    /* CRUZAMENTO DE MEDIAS60m*/
    const crossoverAVAX = (fastMedianAVAX[1]>slowMedianAVAX[1] && fastMedianAVAX[2]<slowMedianAVAX[2]);
    const crossunderAVAX = (fastMedianAVAX[1]<slowMedianAVAX[1] && fastMedianAVAX[2]>slowMedianAVAX[2]);

    let ClBuy60  = trades60[0].amount;
    let ClSell60 = trades60[0].amount;
    let ClBuyAVAX  = tradesAVAX[0].amount;
    let ClSellAVAX = tradesAVAX[0].amount;

    /* MOMENTO DO TRADE */
    const tstamp60 = parseFloat(trades60[0].timestamp);
    const CandAtual60 =  data60.map(c60=> parseFloat(c60[0]));
    const timer60 = (1000*60*60)

    /* REGISTRO DE MAREGM LIVRE */
    const lado60   = trades60[0].side;
    const ativo60  = trades60[0].symbol
    const ladoAVAX   = tradesAVAX[0].side;
    const ativoAVAX  = tradesAVAX[0].symbol


    if(ladoAVAX === "buy" && ativoAVAX === 'AVAX/BTC' && AVAXtotal > 0.1) {
        buyed = true;
        console.log('AVAX/BTC')
        console.log('Comprado em AVAX')
        console.log(`Profit em ${ProfitAVAX}`)
    }else {
        buyed = false;
    }
    
    if(lado60 === "buy" && ativo60 === 'BCH/USD:USD' && (free60+BTCAVAX) < (used60)){
        console.log('BCHPERP 1H')
        console.log('Comprado em BCH')
        console.log(`Profit em ${buyProfit60.toFixed(2)}`)
        comp = true;
    }else{
        comp = false;
    }
    
    if(lado60 === "sell" && ativo60 === 'BCH/USD:USD' && (free60+BTCAVAX) < (used60)){
        console.log('BCHPERP 1H')
        console.log('Vendido em BCH')
        console.log(`Profit em ${sellProfit60.toFixed(2)}`)
        vend = true;
    }else{
        vend = false;
    }




    /* ESTATÉGIAS , CONDIÇÕES E ORDENS AVAX  15MIN 
    if(crossoverAVAX && !buyed ){
        console.log("Compra AVAX")
        var buy6 = exchange60.createMarketBuyOrder('AVAX/BTC', qntAVAX);
        //buyOrders.push(buyProfit);          
    }

    if((((closeAVAX[0])>=ProfitAVAX) && buyed)){
        console.log("Fechando Compra AVAX")
        var sell60 = exchange60.createMarketSellOrder('AVAX/BTC', AVAXtotal);
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS 1h */

    if(crossover60 && !comp && !vend ){
        console.log("Compra 1h")
        var buy60 = exchange60.createMarketBuyOrder(symbol, qntNegociation60);
        //buyOrders.push(buyProfit);          
    }

    if((crossunder60  && comp && !vend) || (((close60[0])>=buyProfit60) && comp && !vend)){
        console.log("Fechando Compra 1h")
        var sell60 = exchange60.createMarketSellOrder(symbol, ClBuy60);
    }

    if(crossunder60 && !comp && !vend){
        console.log(`Venda 1h`)
        var sell60 = exchange60.createMarketSellOrder(symbol, qntNegociation60);
        //sellOrders.push(sellProfit);
    }

    if((crossover60 && !comp && vend) || (((close60[0])<=sellProfit60) && !comp && vend)){
        console.log(`Fechando Venda 1h`)
        var buy60 = exchange60.createMarketBuyOrder(symbol, ClSell60); 
    }    


    /* SISTEMA BCH FUTURES DIARIO */

    var exchangeD = new ccxt.ftx({
        'apiKey': config.API_KEYd,
        'secret': config.SECRET_KEYd,
        'headers' : {
            'FTX-SUBACCOUNT' : 'Prime'
    }
    });

    /* ACESSANDO CANDLES OHLCV 1D*/
    const mercadoD = await exchangeD.load_markets ();
    const brz   = (await exchangeD.fetchOHLCV ('BRZ/USD', '15m'));
    const closebrz = (brz.map(candlebrz => parseFloat(candlebrz[4]))).reverse();
    const real = closebrz[0]

    const dataD = (await exchangeD.fetchOHLCV ('BULL/USD', '15m'));
    const dataW = (await exchangeD.fetchOHLCV ('BULL/USD', '1w')).reverse();
    const openD = (dataD.map(candleOpe => parseFloat(candleOpe[1]))).reverse();
    const highD = (dataD.map(candleHig => parseFloat(candleHig[2]))).reverse();
    const lowD  = (dataD.map(candleLow => parseFloat(candleLow[3]))).reverse();
    const closeD = (dataD.map(candleClo => parseFloat(candleClo[4]))).reverse();

    /* MÉDIAS DE MÓVEIS */
    const fastMedianD  = await ta.sma(highD, 7);
    const slowMedianD  = await ta.sma(lowD, 140);
    const threeMedianD = await ta.sma(highD, 3);


    /* CONVERÇÃO DE MOEDAS DIARIO*/ 
    const regD = (await exchangeD.fetchOHLCV ('BTC/USD', '5m')).reverse();
    const cambioD = regD.map(candD => parseFloat(candD[4]));   
    const BTCD = cambioD[0];
    const saldoD = await exchangeD.fetchBalance('BULL/USD');
    const USDD = ((saldoD.total['USD']));
    const freeD = ((saldoD.free['USD']));
    const usedD = ((saldoD.total['BULL'])*closeD[0]);
 
    const SomaD = (usedD+USDD)

    /* ANALISE DE WALLET */
    let quantityD  = (freeD/closeD[0]);     

    /* CRIAÇÃO DE PROFITS DIARIO */
    const tradesD = (await exchangeD.fetchOrders ('BULL/USD')).reverse();        
    const buyProfitD = parseFloat((tradesD[0].price)*config.BUY_PROFITYD);
    const sellProfitD = parseFloat((tradesD[0].price)*config.SELL_PROFITYD); 

    /* CRUZAMENTO DE MEDIAS */
    const crossoverD = (fastMedianD[1]>slowMedianD[1] && fastMedianD[2]<slowMedianD[2]);
    const crossunderD = (fastMedianD[1]<slowMedianD[1] && fastMedianD[2]>slowMedianD[2]);

    let ClBuyD  = tradesD[0].amount;
    let ClSellD = tradesD[0].amount;

    /* MOMENTO DO TRADE */
    const tstampD    = parseFloat(tradesD[0].timestamp);
    const tstampD1   = parseFloat(tradesD[1].timestamp);
    const ultcomp    = (tradesD.find (d => d.side === 'buy').timestamp);
    const CandAtualD = (dataD.map(c=> parseFloat(c[0]))).reverse();
    const timerD     = (1000*60*58)

    /* REGISTRO DE MAREGM LIVRE */ 

    const ladoD   = tradesD[0].side;
    const ativoD  = tradesD[0].symbol;

    if(ladoD === "buy" && (USDD) < (usedD)){
        console.log('Comprado em BULL')
        console.log(`Profit em ${buyProfitD}`)
        Katta = true;
    }else{
        Katta = false;
    }

    /* ESTATÉGIAS , CONDIÇÕES E ORDENS DIARIO */
    
    const enterLong = (closeD[3]<openD[3] && closeD[2]<openD[2] && closeD[1]>openD[1] && ((closeD[1]-openD[1])>(openD[1]-lowD[1]))) 
    const qntD = (closeD[0]*1.02);

    if( enterLong && (freeD >= (0.001*closeD[0])) && ((tstampD+timerD)<CandAtualD[0])){
        console.log("Compra do BULL 15m")
        var buyD   = exchangeD.createMarketBuyOrder('BULL/USD', quantityD);
    }
    if((((closeD[0])>=buyProfitD) && Katta )){
        console.log("Fechando Compra do BULL 15m")
        var sellD = exchangeD.createMarketSellOrder('BULL/USD', ClSellD);
    }

    
    

    console.log('')
    console.log('SALDO MAIN')
    console.log(`livre: ${USDFree.toFixed(2)} de Dolares, Comprado em BCHBULL: ${(BCHBULLTotal*closeBULL[0]).toFixed(2)} e Comprado em BCHBEAR: ${(BCHBEARTotal*close[0]).toFixed(2)}`)
    //console.log('SALDO BTC')
    //console.log(`livre: ${free15.toFixed(2)} de Dolares e Comprado de BTC: ${SalBTC.toFixed(4)}`)
    console.log('SALDO OPTIMUS')
    console.log(`livre Bitcoin: ${(free60).toFixed(2)} de Dolares e Operando em BCHPERP: ${used60.toFixed(6)}`)
    console.log('SALDO PRIME')
    console.log(`livre: ${(USDD).toFixed(2)} de Dolares e Comprado de BULL: ${usedD.toFixed(6)}`)
    /*console.log('')
    console.log(`Média rápida AVAX: ${(fastMedian[1].toFixed(6))}, anterior AVAX: ${(fastMedian[2].toFixed(6))}`)
    console.log('')
    console.log(`Média lenta AVAX: ${(slowMedian[1].toFixed(6))}, anterior AVAX: ${(slowMedian[2].toFixed(6))}`)
    console.log('')
    console.log(`Média rápida 1h : ${(fastMedian60[1].toFixed(2))}, anterior 1h: ${(fastMedian60[2].toFixed(2))}`)
    console.log('')
    console.log(`Média lenta 1h : ${(slowMedian60[1].toFixed(2))}, anterior 1h: ${(slowMedian60[2].toFixed(2))}`)
    */

    console.log('')
    console.log('Saldo')
    const total = (Soma+Soma15+Soma60+SomaD)
    console.log((Soma+Soma60+SomaD).toFixed(2))

    app.get('/', async(req, res) => {
        return res.json({
            erro: false,
            datahome: {
               Soma,
               Soma60, 
               SomaD,
               Soma15,
               real,
               USD15,
               total
            }
        });
    });

}





module.exports =  { server4bot } ;


app.listen(port, () => {
    console.log(`Servidor iniciado na porta: ${port}`);
});

setInterval(server4bot, config.CRAWLER_INTERVAL);