var save;
var settings;
var parameters = new URLSearchParams(document.location.search)
var bingo = {
    jobPool: [],
    workerPool: [],
    bingoCards: [],
    pause: true,
    calculationsTotal: 0,
    chart: null,
    rollingAverage: 0
}

window.addEventListener('message', function(event) {
    let receivedData = JSON.parse(atob(event.data));
    if (receivedData.action !== 'initData' || receivedData.action === 'jsException') {
        return;
    }
    save = receivedData.save;
    settings = receivedData.settings;
    feature();
});

function feature(){
    const storedCards = localStorage.getItem("bingoCards");
    if (storedCards === null){
        const infoElement = document.getElementById("info")
        infoElement.style.display = "block";
        let name = "player"
        const playerName = save?.playerName;
        if (playerName !== undefined && playerName.length > 1){
            name = playerName;
        }
        const cloudIdentify = save?.settings?.mods_qol?.cloudIdentify;
        if (cloudIdentify !== undefined && cloudIdentify.length > 1){
            name = cloudIdentify;
        }
        const maxTopaz = save?.stat?.gem_topazMax[0]
        const topazGain = calculateGems(countNumbers(save?.achievement))
        const together = maxTopaz + topazGain
        const maxCards = Math.ceil(together / 75) + 1
        infoElement.innerHTML = `<h3 class="betterText">Hello, ${name}!</h3>
            <p class="betterText">At one point, you had a maximum of ${maxTopaz} Topaz. Adding your weekend gains, that's now a total of ${together} Topaz! In your next event, you might reach up to ${maxCards} cards. Use this page to calculate your upcoming Bingos in advance.</p>
            <p class="betterText">Select your preferred options below, then start generating the calculation tasks. Your progress is saved to local storage, so you can continue from where you left off next time.</p>
            <div class="settings">
                <label for="lookAheadCards" class="betterText">How many Cards to Calculate</label>
                <input class="betterText input" type="number" value=${maxCards} id="lookAheadCards">
            </div>
            <button class="betterText button" style="background-color: rgb(51, 51, 51);" onclick="calculate(this.value)"><i class="mdi mdi-flash"></i><span> Show bingo cards</span></button>`;
    } else {
        bingo.bingoCards = JSON.parse(storedCards)
        showCalculateGui()
        readyJobs()
    }
}

function startCrunch(){
    document.getElementById("showEngineHere").style.display = "none"
    document.getElementById("pause").style.display = "block"
    document.getElementById("instantPause").style.display = "block"
    document.getElementById("showGraph").style.display = "block"
    let mainTreads = Number(document.getElementById("mainThreads").value)
    if (mainTreads < 0 || mainTreads > 100){
        mainTreads = 1
    }
    let supportThreads = Number(document.getElementById("supportThreads").value)
    if (supportThreads < 0 || supportThreads > 100){
        supportThreads = 1
    }
    let threads = mainTreads + supportThreads
    if (threads <= 0 || threads > 100){
        mainTreads = 1
    }
    let count = 0
    for (let i = 0; i < mainTreads; i++){
        spawnThread(true, count)
        count ++
    }
    for (let i = 0; i < supportThreads; i++){
        spawnThread(false, count)
        count ++
    }
    setInterval(updateGui, 1000);
    generateChart()
}

function generateChart(){
    bingo.chart = {
        dataSets: [],
        chartElement: null,
        chartEnabled: true,
    }
    for (let i = 0; i < bingo.workerPool.length; i++){
        const insert = {
            label: "worker " + i,
            data: bingo.workerPool[i].lastMinute,
        }
        bingo.chart.dataSets.push(insert)
    }
    const labels = []
    for (let i = 0; i <= 60; i++) {
        labels.push(i);
    }
    bingo.chart.chartElement = new Chart(document.getElementById('curveChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: bingo.chart.dataSets.map(dataset => ({
                label: dataset.label,
                data: dataset.data,
                fill: false,
                tension: 0.3
            }))
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    reverse: true
                }
            },
            reverse: true
        }
    });
    bingo.chart.chartElement.options.transitions.active.animation.duration = 2000
}

function updateGui(){
    let current = bingo.calculationsTotal
    let pause = 0
    for (let i = 0; bingo.workerPool.length > i; i++){
        let times = bingo.workerPool[i].times
        current += bingo.workerPool[i].times[times.length - 1][1]
        if (bingo.workerPool[i].isIdle === false) {
            const firstEntry = times[times.length - 1];
            const lastEntry = times[0];
            const firstTime = new Date(firstEntry[0]);
            const lastTime = new Date(lastEntry[0]);
            const timeDifferenceMs = lastTime - firstTime;
            const firstNumber = firstEntry[1];
            const lastNumber = lastEntry[1];
            const numberDifference = lastNumber - firstNumber;
            const timeDifferenceSeconds = timeDifferenceMs / 1000;
            const ratePerSecond = Math.max((numberDifference / timeDifferenceSeconds), 0);
            bingo.rollingAverage = (bingo.rollingAverage * 0.95) + (ratePerSecond * 0.05)
            if (bingo.rollingAverage * 1.5 > ratePerSecond){
                bingo.workerPool[i].addStats(ratePerSecond)
            } else {
                bingo.workerPool[i].addStats(bingo.rollingAverage)
            }

            pause ++
        } else {
            bingo.workerPool[i].addStats(0)
        }
    }
    if (bingo.chart.chartEnabled){
        bingo.chart.chartElement.update('active');
    }
    if (bingo.pause && pause === 0){
        document.getElementById("pause").style.display = "none"
        document.getElementById("instantPause").style.display = "none"
        document.getElementById("resume").style.display = "block"
    }
    document.getElementById("stats").innerText = prettifyNumber(Number(current))
    document.getElementById("operationPerSec").innerText = prettifyNumber(Number(bingo.rollingAverage))
    document.getElementById("threadsActive").innerText = pause.toString()
}

function spawnThread(main, index){
    const workerEntry = {
        worker: new Worker("bingoSolver.js"),
        isMain: main,
        id: index,
        isIdle: false,
        times: [],
        addCurrentDate(calc) {
            this.times.unshift([new Date(), calc]);
            if (this.times.length > 10) {
                this.times.pop();
            }
        },
        lastMinute: [],
        addStats(ratePerSecond) {
            this.lastMinute.unshift(ratePerSecond);
            if (this.lastMinute.length > 61) {
                this.lastMinute.pop();
            }
        },
    }
    workerEntry.addCurrentDate(0)
    workerEntry.worker.addEventListener("message", (event) => {
        workerHandler(event)
    })
    workerEntry.worker.postMessage({
        action: 'init',
        data: {
            id: workerEntry.id,
            isMain: workerEntry.isMain,
        }

    });
    bingo.workerPool.push(workerEntry);
}

function workerHandler(event){
    const { action, data } = event.data;
    if (action === 'ready') {
        if (bingo.pause === false) {
            const job = bingo.jobPool.pop()
            bingo.workerPool[data.id].worker.postMessage({
                action: "compute",
                data: JSON.stringify(job),
            })
        } else {
            bingo.workerPool[data.id].isIdle = true
        }
    }
    if (action === 'finished') {
        const job = JSON.parse(data);
        const card = bingo.bingoCards.find(item => item.bingoId === job.bingo_generate);
        mergeResults(card, job)
        updateCard(card, job)
        generateSolutionText(card.bingoId)
    }
    if (action === 'calculating') {
        bingo.workerPool[data.id].addCurrentDate(data.calculations)
    }
}

function updateCard(card, job){
    card.finished[job.first[0]] = job.finished
    saveCards()
}

function mergeResults(card, job){
    card.bestResults = card.bestResults
        .concat(job.result)
        .sort((a, b) => {
            if (b.score === a.score) {
                return a.position - b.position;
            }
            return b.score - a.score;
        })
        .slice(0, 5);
    card.calculations += job.calculations;
    if (card.bestResults.length > 0){
        card.bingo = Math.floor(card.bestResults[0].score/100)
    }
}

function setPause(){
    bingo.pause = true
    document.getElementById("pause").style.backgroundColor = "#5e0000"
}

function setInstantPause(){
    location.reload()
}

function setResume(){
    bingo.pause = false
    document.getElementById("pause").style.display = "block"
    document.getElementById("pause").style.backgroundColor = ""
    document.getElementById("instantPause").style.display = "block"
    document.getElementById("resume").style.display = "none"
    for (let i = 0 ; i < bingo.workerPool.length; i++) {
        bingo.workerPool[i].isIdle = false;
        const job = bingo.jobPool.pop()
        bingo.workerPool[i].worker.postMessage({
            action: "compute",
            data: JSON.stringify(job),
        })
    }
}

function generateBingoCards(options){
    for (let i = 0 ; i < options.lookAhead ; i++){
        const card = {
            playerId: options.playerId,
            bingoId: options.bingoId + i,
            drawId: options.drawId + (i * 4),
            bingoCard: [],
            bestResults: [],
            calculations: 0,
            bingo: 0,
            finished: new Array(55).fill(false)
        }
        let seed = card.playerId + "bingo_generate_" + card.bingoId
        let rngGen = new Math.seedrandom(seed);
        const bingoCardTmp = []
        for (let i = 0; i < 5; i++) {
            bingoCardTmp.push(shuffleArray(buildArray(15).map(n => n + i * 15 + 1), rngGen).slice(0, 5).map(elem => {return {value: elem, prize: null, isRare: false};}));
        }
        shuffleArray([...buildArray(12), ...buildArray(12).map(i => i + 13)], rngGen).slice(0, 6).forEach(num => {
            bingoCardTmp[Math.floor(num / 5)][num % 5].prize = true;
            if (bingoCellIsRare(num)) {
                bingoCardTmp[Math.floor(num / 5)][num % 5].isRare = true;
            }
        });
        card.bingoCard = bingoCardTmp.flat().map(cell => [
            cell.value,
            !!cell.prize,
            cell.isRare
        ]);
        bingo.bingoCards.push(card)
    }
    saveCards()
    showCalculateGui()
    readyJobs()
}

function readyJobs(){
    for (let i = 0 ; i < bingo.bingoCards.length ; i++){
        const card = bingo.bingoCards[i]
        for (let j = 0 ; j < card.finished.length ; j++){
            const finish = bingo.bingoCards[i].finished[j]
            if (!finish){
                generateThis(card, j)
            }
        }
    }
    bingo.jobPool.reverse()
    bingo.pause = false
}

function generateThis(card, index){
    const firstNr = from7DPosition([index,0,0,0,0,0,0]);
    const lastNr = from7DPosition([index,24,24,24,24,24,24]);
    const job = {
        finished: false,
        first: to7DPosition(firstNr),
        last: to7DPosition(lastNr),
        lastAsNr: lastNr,
        lastDepth: 0,
        lastTryIsValid: true,
        rollOver: false,
        drawsPerDepth: [],
        drawsPerDepthFlat: [],
        bingoCard: [],
        currentAsNr: 0,
        pickPerDraw: getPickMaxPerRound(to7DPosition(firstNr)[0]),
        pickPerDrawWeights: [],
        calculations: 0,
        mappedCard: [],
        reversedMappedCard: [],
        priceMappings: [],
        baseDraws: [],
        baseWeights: [],
        drawsWeight: [],
        maxBingo: 0,
        result: [],
        playerId: "b2b5637851af3d53",
        bingo_generate: card.bingoId,
        bingo_draw: card.drawId,
    }
    generatePickPerDraw(job)
    generateCard(job)
    calculateBaseDraws(job)
    bingo.jobPool.push(job);
}

function showCalculateGui(){
    document.getElementById("info").style.display = "none"
    document.getElementById("showBingoCardsHere").style.display = ""
    document.getElementById("calcHeader").style.display = ""
    document.getElementById("mainThreads").value = Math.floor(navigator.hardwareConcurrency/2)
    document.getElementById("supportThreads").value = Math.floor(navigator.hardwareConcurrency/3)
    const showBingoCardsHere = document.getElementById("showBingoCardsHere")
    for (let i = 0 ; i < bingo.bingoCards.length; i++) {
        const card = bingo.bingoCards[i]
        bingo.calculationsTotal += card.calculations
        const bingoId = card.bingoId
        const outerDiv = document.createElement("div");
        outerDiv.classList.add(`outerDiv${bingoId}`);
        const mainDiv = document.createElement("div");
        mainDiv.classList.add(`mainDiv${bingoId}`, `gridContainer`, `solution0`);
        outerDiv.appendChild(mainDiv)
        generateGridItems(mainDiv, [`gridItem`, `card${bingoId}`, `solution0`], card, false)
        const solutionText = document.createElement("div");
        solutionText.classList.add('solutionText' , `solutionText${bingoId}`, `solution0`);
        outerDiv.appendChild(solutionText)
        const miniGridContainer = document.createElement("div");
        miniGridContainer.classList.add('miniGridContainer');
        for (let j = 1 ; j < 5; j++) {
            const miniGridCard = document.createElement("div");
            miniGridCard.classList.add('miniGridCard');
            generateGridItems(miniGridCard, [`miniGridItem`, `card${bingoId}`, `solution${j}`], card, true)
            miniGridContainer.appendChild(miniGridCard)
        }
        for (let j = 1 ; j < 5; j++) {
            const miniSolutionText = document.createElement("div");
            miniSolutionText.classList.add('smallText', 'solutionText', `solutionText${bingoId}`, `solution${j}` );
            miniGridContainer.appendChild(miniSolutionText)
        }
        outerDiv.appendChild(miniGridContainer)
        showBingoCardsHere.appendChild(outerDiv)
        generateSolutionText(bingoId)
    }
}

function generateSolutionText(bingoId){
    for (let i = 0 ; i < 5; i++) {
        const solutionText = document.getElementsByClassName(`solutionText solutionText${bingoId} solution${i}`)[0]
        while(solutionText.firstChild){
            solutionText.removeChild(solutionText.firstChild);
        }
        const card = bingo.bingoCards.find(item => item.bingoId === bingoId);
        if (i === 0) {
            const bingoIdLabel = document.createElement("div");
            bingoIdLabel.innerText = "BingoId: "
            solutionText.appendChild(bingoIdLabel);
            const bingoIdText = document.createElement("div");
            bingoIdText.innerText = bingoId
            solutionText.appendChild(bingoIdText);
            const drawIdLabel = document.createElement("div");
            drawIdLabel.innerText = "DrawId: "
            solutionText.appendChild(drawIdLabel);
            const drawIdText = document.createElement("div");
            drawIdText.innerText = card.drawId
            solutionText.appendChild(drawIdText);
            const bingoLabel = document.createElement("div");
            bingoLabel.innerText = "Bingos: "
            solutionText.appendChild(bingoLabel);
            const bingoText = document.createElement("div");
            bingoText.innerText = card.bingo
            solutionText.appendChild(bingoText);
            const calculationsLabel = document.createElement("div");
            calculationsLabel.innerText = "Calc: "
            solutionText.appendChild(calculationsLabel);
            const calculationsText = document.createElement("div");
            calculationsText.innerText = prettifyNumber(card.calculations)
            solutionText.appendChild(calculationsText);
            const progressLabel = document.createElement("div");
            progressLabel.innerText = "Progress:"
            solutionText.appendChild(progressLabel);
            const cardStatus = document.createElement("div");
            cardStatus.className = 'card-status';
            const gradientColors = card.finished.map(status => (status ? 'green' : 'red')).join(', ');
            cardStatus.style.backgroundImage = `linear-gradient(to right, ${gradientColors})`;
            cardStatus.style.width = '165px';
            cardStatus.style.height = '10px';
            solutionText.appendChild(cardStatus);
            const line = document.createElement("p");
            solutionText.appendChild(line);
            const line2 = document.createElement("p");
            solutionText.appendChild(line2);
        }
        if (card.bestResults.length > i){
            const thisResult = card.bestResults[i]
            const solutionDraw0Label = document.createElement("div");
            solutionDraw0Label.innerText = "Score: "
            solutionText.appendChild(solutionDraw0Label);
            const solutionDraw0Text = document.createElement("div");
            solutionDraw0Text.innerText = thisResult.score
            solutionText.appendChild(solutionDraw0Text);
            const solutionDraw1Label = document.createElement("div");
            solutionDraw1Label.innerText = "Draw 1: "
            solutionText.appendChild(solutionDraw1Label);
            const solutionDraw1Text = document.createElement("div");
            solutionDraw1Text.innerText = sanitizeDraws(card, thisResult.picks[0])
            solutionText.appendChild(solutionDraw1Text);
            const solutionDraw2Label = document.createElement("div");
            solutionDraw2Label.innerText = "Draw 2: "
            solutionText.appendChild(solutionDraw2Label);
            const solutionDraw2Text = document.createElement("div");
            solutionDraw2Text.innerText = sanitizeDraws(card, thisResult.picks[1])
            solutionText.appendChild(solutionDraw2Text);
            const solutionDraw3Label = document.createElement("div");
            solutionDraw3Label.innerText = "Draw 3: "
            solutionText.appendChild(solutionDraw3Label);
            const solutionDraw3Text = document.createElement("div");
            solutionDraw3Text.innerText = sanitizeDraws(card, thisResult.picks[2])
            solutionText.appendChild(solutionDraw3Text);
            drawBingoCard(card, i)
        } else {
            const solutionDraw0Label = document.createElement("div");
            solutionDraw0Label.innerText = "Score: "
            solutionText.appendChild(solutionDraw0Label);
            const solutionDraw0Text = document.createElement("div");
            solutionDraw0Text.innerText = "Nothing Found"
            solutionText.appendChild(solutionDraw0Text);
        }
    }
}

function drawBingoCard(card, index){
    for (let i = 0 ; i < 25 ; i++){
        const element = document.getElementsByClassName(`card${card.bingoId} solution${index} item${i}`)[0]
        const getsDrawn = card.bestResults[index].field[i] === 1
        const getsPicked = card.bestResults[index].picks.some(element => element.includes(i))
        if (getsDrawn) {
            element.classList.add('drawnResult');
        } else {
            element.classList.remove('drawnResult');
        }
        if (getsPicked) {
            element.classList.add('selectToWin');
        } else {
            element.classList.remove('selectToWin');
        }
    }
}

function sanitizeDraws(card, draw){
    if (draw.length === 0){
        return "nothing"
    }
    let result = ""
    for (let i = 0; draw.length > i; i++){
        if (result !== ""){
            result += ", "
        }
        result += card.bingoCard[draw[i]][0]
    }
    return result
}

function generateGridItems(rootNode, classes, card, small){
    const columns = 5;
    const totalNumbers = 24;
    for (let col = 0; col < columns; col++) {
        for (let row = 0; row <= Math.floor(totalNumbers / columns); row++) {
            const index = row * columns + col;
            if (index <= totalNumbers) {
                const gridItem = document.createElement("div");
                gridItem.classList.add(...classes, `item${index}`);
                gridItem.innerText = card.bingoCard[index][0];
                if (card.bingoCard[index][1]){
                    const badge = document.createElement("div");
                    badge.innerText = "◉"
                    if (small){
                        badge.style.display = "none";
                    } else {
                        badge.style.fontSize = '1px';
                        badge.style.transform = "translateX(5px) translateY(-20px) scale(20)";
                    }
                    badge.style.color = card.bingoCard[index][2] ? '#ff0008' : '#828282'
                    badge.classList.add("badge");
                    gridItem.appendChild(badge)
                }
                rootNode.appendChild(gridItem)
            }
        }
    }
}

function calculate(){
    const bought = save?.event?.casino_bingo_bought
    const currentCard = save?.event?.casino_bingo_card
    let bingoId = save.rng.bingo_generate
    let drawId = save.rng.bingo_draw
    if (currentCard !== undefined && currentCard.length > 1)
    {
        bingoId = bingoId - 1;
    }
    if (bought === true){
        const cardWithDraws = save?.event?.casino_bingo_draws
        if (cardWithDraws !== undefined) {
            switch (cardWithDraws.length) {
                case 25:
                    drawId = drawId - 4;
                    break;
                case 22:
                    drawId = drawId - 3;
                    break;
                case 17:
                    drawId = drawId - 2;
                    break;
                case 12:
                    drawId = drawId - 1;
                    break;
                case 0:
                default:
                    break;
            }
        }
    }
    console.log("PlayerId: " + save.playerId + ", Base BingoId: " + bingoId + ", Base DrawId: " + drawId)
    const options = {
        playerId: save.playerId,
        bingoId: bingoId,
        drawId: drawId,
        lookAhead: Number(document.getElementById("lookAheadCards").value),
    }
    generateBingoCards(options)
}

function calculateGems(achievement) {
    const minutesPerGem = 60 / (1 + achievement * 0.01);
    return Math.floor((24 * 60 * 2) / minutesPerGem);
}

function countNumbers(obj) {
    let total = 0;
    for (const key in obj) {
        if (typeof obj[key] === 'number') {
            total += obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            total += countNumbers(obj[key]);
        }
    }
    return total;
}

function saveCards(){
    const bingoCardString = JSON.stringify(bingo.bingoCards);
    localStorage.setItem("bingoCards", bingoCardString);
}

function resetEverything(){
    const iAmSure = confirm("Delete all Calculations?");
    if (iAmSure){
        localStorage.removeItem("bingoCards");
        location.reload();
    }
}

function buildArray(length = 0) {
    return Array(length).fill().map((x, i) => i);
}

function bingoCellIsRare(index){
    return [1, 3, 5, 9, 15, 19, 21, 23].includes(index);
}

function shuffleArray(array, rngGen = null) {
    if (rngGen === null) {
        rngGen = () => Math.random()
    }
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rngGen() * (i + 1));
        const temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

function to7DPosition(num) {
    let position = [];
    for (let i = 0; i < 6; i++) {
        position.unshift(num % 25);
        num = Math.floor(num / 25);
    }
    position.unshift(num % 55);
    return position;
}

function from7DPosition(position) {
    let num = position[0] * Math.pow(25, 6);
    for (let i = 1; i < 7; i++) {
        num += position[i] * Math.pow(25, 6 - i);
    }
    return num;
}

function getPickMaxPerRound(n) {
    let count = 0;
    for (let round1 = 0; round1 <= 2; round1++) {
        for (let round2 = round1; round2 <= 4; round2++) {
            for (let round3 = round2; round3 <= 6; round3++) {
                if (count === n) {
                    return [round1,round2,round3]
                }
                count++;
            }
        }
    }
}

function generatePickPerDraw(job){
    const weightsPerDraw = [3,3,4,4,5,5]
    let firstToPick = 0
    let counter = 0
    for (let j = 0; j < 3; j++) {
        const currentPickPerDraw = job.pickPerDraw[j]
        const weights = []
        const result = []
        while (currentPickPerDraw !== firstToPick){
            result.push(job.first[j+1])
            firstToPick++
            weights.push(weightsPerDraw[counter])
            counter ++
        }
        job.drawsPerDepth.push(result)
        job.pickPerDrawWeights.push(weights)
    }
}

function generateCard(job){
    let seed = job.playerId + "bingo_generate_" + job.bingo_generate
    let rngGen = new Math.seedrandom(seed);
    for (let i = 0; i < 5; i++) {
        job.bingoCard.push(shuffleArray(buildArray(15).map(n => n + i * 15 + 1), rngGen).slice(0, 5).map(elem => {return {value: elem, prize: null, isRare: false};}));
    }
    job.mappedCard = job.bingoCard.flat().map(cell => cell.value);
    job.reversedMappedCard = job.mappedCard.reduce((acc, value, index) => {
        acc[value] = index;
        return acc;
    }, {});
    shuffleArray([...buildArray(12), ...buildArray(12).map(i => i + 13)], rngGen).slice(0, 6).forEach(num => {
        job.bingoCard[Math.floor(num / 5)][num % 5].prize = true;
        if (bingoCellIsRare(num)) {
            job.bingoCard[Math.floor(num / 5)][num % 5].isRare = true;
        }
    });
    job.priceMappings = job.bingoCard.flat().map(cell => [
        cell.value,
        !!cell.prize,
        cell.isRare
    ]);
}

function calculateBaseDraws(job){
    job.baseWeights = Array(75).fill(1);
    let seed = job.playerId + "bingo_draw_" + job.bingo_draw
    let rngGen = new Math.seedrandom(seed);
    while (job.baseDraws.length < 12) {
        const drawnNum = weightSelect(job.baseWeights, rngGen());
        job.baseWeights[drawnNum] = 0;
        job.baseDraws.push(drawnNum + 1);
    }
}

function weightSelect(weights, rng = Math.random()) {
    if (rng >= 1) {
        rng = 0.99999999;
    }
    let totalWeight = weights.reduce((a, b) => a + b, 0);
    let currentWeight = 0;
    let chosenValue = rng * totalWeight;
    return weights.findIndex((elem) => {
        if (currentWeight + elem > chosenValue) {
            return true;
        }
        currentWeight += elem;
        return false;
    })
}

function prettifyNumber(number) {
    if (number < 1000) return number.toString();
    const units = ["K", "M", "B", "T", "Qa", "Qi"];
    const exponent = Math.floor(Math.log10(number) / 3);
    const shortNumber = number / Math.pow(1000, exponent);
    return parseFloat(shortNumber.toFixed(2)) + units[exponent - 1];
}