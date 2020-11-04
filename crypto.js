//On Upload:
const url1 = 'https://api.coingecko.com/api/v3/coins';
let allCoins = [];
let liveArr = [];
let second = 1000;
let currentTab = "home"; // ["home", "chart", "about"]

$('#main').html(`<div id="load" class="col-12 d-flex justify-content-center">
    <div class="spinner-border" role="status" />
</div>`)
$.when(
    $.get(url1),
).then(function(data){
    allCoins = data;
    $('#main').empty();
    generateCoins(allCoins);
    navHandler(allCoins, liveArr);
    modalBackgroundGenerator();
})

//Generating coin info:
function getCoin(coinId, cb){
    $.get(`https://api.coingecko.com/api/v3/coins/${coinId}`).then((coin) => cb(coin));
}

function saveCoinInLocalStorage(coinsArray) {
    window.localStorage.setItem('info', JSON.stringify(coinsArray));
}

function roundCoinValue(coinValue){
    if(coinValue < 1){
        return (Math.round(coinValue * 1000) / 1000).toFixed(3);
    } else {
        return coinValue;
    }
}

function infoDiv(data){
    let coinPrice = data.market_data.current_price;
    $(`#i${data.symbol}`).empty();
    $(`#i${data.symbol}`).append(`
        <p> ILS: ${roundCoinValue(coinPrice.ils)} &#8362</p>
        <p> EUR: ${roundCoinValue(coinPrice.eur)}  &#128 </p>
        <p> USD: ${roundCoinValue(coinPrice.usd)} &#36</p>
        <img class="img1" src='${data.image.thumb}' />
    `);
}

function filterCoinsArray(array, coin) {
    let filteredArr = array.filter(function(newCoin){
        if(newCoin.symbol !== coin.symbol){
            return newCoin;
        }
    });
    return filteredArr;
}

function newInfo(coin){
    $(`#i${coin.symbol}`).empty()
    $(`#i${coin.symbol}`).append(`<div id="${coin.symbol}prog" class="lds-circle"><div></div></div>`);
    const localCatch = window.localStorage.getItem('info');
    const updateCatch = JSON.parse(localCatch);
    let filterCache = filterCoinsArray(updateCatch, coin);
    getCoin(coin.id, function(newCoin){
        infoDiv(newCoin);
        filterCache.push(newCoin);
        saveCoinInLocalStorage(filterCache);
    });
}

function infoButtonHandler(coin) {
    let infoClick = true;
    $(`#${coin.symbol}btn`).click(() => {
        if(infoClick){
            $(`#i${coin.symbol}`).append(`<div id="${coin.symbol}prog" class="lds-circle"><div></div></div>`);
            const localCatch = window.localStorage.getItem('info');
            if(!localCatch){
                getCoin(coin.id, function(coin){
                    infoDiv(coin);
                    saveCoinInLocalStorage([coin]);
                })
            } else {
                const updateCatch = JSON.parse(localCatch);
                let filterCache = filterCoinsArray(updateCatch, coin);
                filterCache.push(coin);
                filterCache.map((localCoin) => {
                    infoDiv(localCoin);
                });
                saveCoinInLocalStorage(filterCache)
            }
            setInterval(() => {
                newInfo(coin);
            }, 120*second)
            infoClick = !infoClick;
        } else {
            infoClick = true;
        }
    });
}

//Generating coin divs:
function generateCoins(data){
    $('#main').empty();
    data.map((coin) => {
        $('#main').append(`<div id="${coin.symbol}" class="coin col-xl-3 col-md-4 col-6 border"> ${coin.symbol.toUpperCase()} 
            <div class="toggle custom-control custom-switch">
                <input type="checkbox" class="switch custom-control-input" id="${coin.symbol}switch" />
                <label class="lab custom-control-label" for="${coin.symbol}switch" />
            </div>
            <br>
            ${coin.name}
            <br>
            <br>
            <br>
            <br>
            <p>
            <button id="${coin.symbol}btn" type="button" class="more btn btn-warning" data-toggle="collapse" data-target="#${coin.symbol}info" aria-expanded="false" aria-controls="${coin.symbol}info"> More Info </button>
            </p>
            <div class="collapse" id="${coin.symbol}info">
                <div id="i${coin.symbol}" class="info" >
                  
                </div>
            </div>
        </div>`);
        infoButtonHandler(coin);
    });
}

//Chart calling:
function generateGraph(arr){
    $('#main').html(`<div id=${'graph'} class="col-xl-12 col-sm-12"> </div>`);
    createChart(arr);
}

//Handaling toggles:
function toggleSwitches(isChecked) {
    liveArr.map((coin) => {
        $(`#${coin.symbol}switch`).prop('checked', isChecked);
    });
}

function toggleHandler(coin, state){
    $(`#${coin.symbol}check`).prop('checked', true);
    $(`#${coin.symbol}check`).change(function() {
        state = $(this).is(':checked');
        $(`#${coin.symbol}switch`).prop('checked',false);
        let filterCoins = filterCoinsArray(liveArr, coin);
        liveArr = filterCoins;
        if(state) {
            state = $(this).is(':checked');
            $(`#${coin.symbol}switch`).prop('checked',true);
            liveArr.push(coin);
        }
     });
}

function findCoinBySymbol(coinSymbol) {
    return allCoins.find(coin => coin.symbol === coinSymbol);
}

function generateModalDiv(coin){
    $(`.modal-body`).append(`<div class="border modCoin" id="mod${coin.symbol}"> <span class="name"> ${coin.symbol.toUpperCase()} 
        <img class="img2" src='${coin.image.thumb}' /> </span>
        <div class="mod-tog custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="${coin.symbol}check" />
            <label class="custom-control-label" for="${coin.symbol}check" />
        </div>
    </div>`);
}

//Modal generatoer:
function modalHandler(){
    currentTab = 'home';
    $('#exit').click(() => {
        $('.modal-body').empty();
    })
    $('#clear').click(() => {
        $('.modal-body').empty();
        toggleSwitches(false);
        liveArr = [];
    });
    $('#show').click(() => {
        if(liveArr[0]){
            currentTab = 'chart';
            $('#modal').modal('hide');
            generateGraph(liveArr);
        } else {
            alert('No chosen coins to show 👾');
        }  
    })
}

function modalBackgroundGenerator() {
    $('#main').on('change', `.switch` ,function(e) {
        const coinSymbol = e.target.id.replace('switch','');
        const coin = findCoinBySymbol(coinSymbol);
        let modalToggle = true;
        let switchState;
        if ($(this).is(':checked')) {
            switchState = $(this).is(':checked');
            liveArr.push(coin);
        } else {
            switchState = $(this).is(':checked');
            $(`#mod${coinSymbol}`).remove();
            let filterCoins = filterCoinsArray(liveArr, coin);
            liveArr = filterCoins;
        }
        if(liveArr.length === 6){
            $(`#${coin.symbol}switch`).prop('checked', false);
            liveArr.pop();
            liveArr.map((coin) => {
                generateModalDiv(coin);
                toggleHandler(coin, modalToggle);
            });
            $('#modal').modal('show');
            modalHandler();
        }
    }); 
}

//Search coins handler:
function searchFilter(data, input){
    const lowerInput = input.toLowerCase();
    return data.filter(coin => 
        coin.name.toLowerCase().startsWith(lowerInput) || coin.symbol.toLowerCase().startsWith(lowerInput)
    )
};

function searchCoins(data) {
    toggleSwitches(false);
    let filtered = searchFilter(data, $('#search').val());
    if(!filtered[0]){
        $('#search').val('');
        generateCoins(data);
        alert(`Woops! Looks like there's no such coin 👾`);
    }else{
        $('.modal-body').empty()
        generateCoins(filtered);
    }
}

//About div generator:
function aboutDiv() {
    $('#main').html(`<div id="aboutMe" class="col-12 justify-content-center"> 
        <p> <h4> Served to you by: Tomer Arad </h4> </p>
        <p> <h4> 👇👇 Contact 👇👇</h4></p>
        <p> <h4>
        <a target="_blank" href="https://mail.google.com/mail/u/tomer.arad@gmail.com"><img class="about-img" src="mail.png" /></a>
        &nbsp
        <a target="_blank" href="https://www.instagram.com/pointnshoot.tlv/"><img class="about-img" src="insta.png" /></a>
        &nbsp
        <a target="_blank" href="https://www.facebook.com/tomer.arad/"><img class="about-img" src="face.png" /></a>
        &nbsp
        <a target="_blank" href="https://www.linkedin.com/in/artomer/"><img class="about-img" src="linkd.png" /></a>
        </h4></p>
    </div>`);
}

//Navigation Buttons Handler:
function navHandler(data){
    $('#live').click(() => {
        currentTab = 'chart';
        if(liveArr[0]){
            generateGraph(liveArr);
        } else {
            alert('No chosen coins to show 👾');
        }
    });
    $('#home').click(() => {
        currentTab = 'home';
        $('.modal-body').empty()
        if($('#search').val()){
            let searchArr = searchFilter(data, $('#search').val());
            generateCoins(searchArr);
        } else {
            generateCoins(data);
        }
        toggleSwitches(true);
    });
    $('#about').click(() => {
        currentTab = 'about';
        aboutDiv()
    });
    $('#search').keyup(() =>{
        searchCoins(data);
        toggleSwitches(true);
    });
}

//Chart generator:
function getNewPoints(data, series) {
    let newPoints = data.map((symbol, idx) => {
        let newSeries = series[idx];
        let pointUpdate = setInterval(function() {
            $.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbol}&tsyms=USD`).then((coin) => {
                let nextPoint = Object.values(coin)[0].USD;
                let x = (new Date()).getTime();
                let y = nextPoint;
                newSeries.addPoint([x, y], true, true);

                if(currentTab !== "chart") {
                    clearInterval(pointUpdate);
                }
            })
            return newPoints;
        }, 2 * second);
    });
}

function chartSeries(data){
    let dataObj = data.map((symbol) => {
        return {
            name: `${symbol}`,
            data: (function () {
                let yPoint = {};
                let dataArr = []; 
                let time = (new Date()).getTime();
                $.get(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbol}&tsyms=USD`).then((coin) => {
                    yPoint = Object.values(coin)[0].USD;
                });
                for (let i = -19; i <= 0; i++) {
                    dataArr.push({
                        x: time + i * 1000,
                        y: yPoint
                    });
                }
                return dataArr;
            }())
        }
    });
    return dataObj
}

function createChart(data){
    let symbols = data.map((coin) => {
        return coin.symbol.toUpperCase();
    });
    let style = {
        color: 'white',
        fontSize: 'large'
    };
    let header = {
        color: 'white',
        fontSize: 'x-large'
    }
    Highcharts.chart('graph', {
        chart: {
            type: 'spline',
            animation: Highcharts.svg,
            marginRight: 10,
            events: { 
                load: function() {
                    getNewPoints(symbols, this.series);
                }
            }
        },
    
        time: {
            useUTC: false
        },
    
        title: {
            text: `Comparing: ${symbols}`,
            style: header
        },
    
        accessibility: {
            announceNewData: {
                enabled: true,
                minAnnounceInterval: 15000,
                announcementFormatter: function (allSeries, newSeries, newPoint) {
                    if (newPoint) {
                        return 'New point added. Value: ' + newPoint.y;
                    }
                    return false;
                }
            }
        },

        legend: {
            enabled: true,
        },
    
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150,
        },
    
        yAxis: {
            title: {
                text: 'Value in USD',
                style: style,
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
    
        tooltip: {
            headerFormat: '<b>{series.name}</b><br/>',
            pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}'
        },
    
        exporting: {
            enabled: false
        },
    
        series: chartSeries(symbols),
    });
}