const jobPool = []
const jobFinish = []
let stopAfterNext = false
let globalResult = [];

const jobData = {
    from: 0,
    to: (55*(25**6))-1,
    generateJobs: function() {
        if (this.from < 0 || this.from > (55*(25**6))-1 || this.to < 0 || this.to > (55*(25**6))-1 ){
            console.log("Out of Range");
            return;
        }
        const fromNr = Math.min(this.from, this.to)
        const toNr = Math.max(this.from, this.to)
        const fromArray = to7DPosition(fromNr)
        const toArray = to7DPosition(toNr)
        for (let i = fromArray[0]; i <= toArray[0]; i++) {
            const firstNr = Math.max(fromNr, from7DPosition([i,0,0,0,0,0,0]));
            const lastNr = Math.min(toNr, from7DPosition([i,24,24,24,24,24,24]));
            const job = {
                finished: false,
                first: to7DPosition(firstNr),
                last: to7DPosition(lastNr),
                lastAsNr: lastNr,
                lastDepth: 0, //0-2
                lastTryIsValid: true,
                rollOver: false,
                drawsPerDepth: [],
                drawsPerDepthFlat: [],
                bingoCard: [],
                currentAsNr: 0,
                pickPerDraw: getPickMaxPerRound(to7DPosition(firstNr)[0]), //2,4,6
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
                bingo_generate: 77,
                bingo_draw: 288,
            }
            generatePickPerDraw(job)
            generateCard(job)
            calculateBaseDraws(job)
            jobPool.push(job);
        }
    },
};

async function executeJob(job){//start
    let lastCheckTime = Date.now();
    while (job.finished === false){
        if (job.calculations % 1000 === 0){
            if (Date.now() - lastCheckTime >= 100){ //check if is it time to sleep to keep the browser responsive
                await sleep(1);
                lastCheckTime = Date.now();
                console.log("sleeping after " + job.calculations + " calculations. Current Array: " + job.drawsPerDepth)
            }
        }
        calculateDrawsPerDepthFlat(job)
        checkForFinish(job)
        job.calculations ++
        validateNextDraws(job)
        if (job.lastTryIsValid === true) {
            calculateNextDraws(job)
            if (job.lastDepth === 2){
                calculateBingo(job)
            }
        }
        incrementNextDraw(job)
    }
}

function calculateBingo(job){
    const bingoDrawnCards = new Array(25).fill(0);
    const weights = job.drawsWeight[2]
    for (let i = 0 ; i < 75 ; i++){
        if (weights[i] === 0 && job.reversedMappedCard[i+1] !== undefined){
            bingoDrawnCards[(job.reversedMappedCard[i+1])] = 1
        }
    }
    let bingo = 0;
    [
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9],
        [10, 11, 12, 13, 14],
        [15, 16, 17, 18, 19],
        [20, 21, 22, 23, 24],
        [0, 5, 10, 15, 20],
        [1, 6, 11, 16, 21],
        [2, 7, 12, 17, 22],
        [3, 8, 13, 18, 23],
        [4, 9, 14, 19, 24],
        [0, 6, 12, 18, 24],
        [4, 8, 12, 16, 20]
    ].forEach(combination => {
        if (combination.every(index => bingoDrawnCards[index] === 1)) {
            bingo++;
        }
    });
    if (bingo >= job.maxBingo) {
        job.maxBingo = bingo
        let score = 100 * bingo + job.priceMappings.reduce((totalPoints, [index, singlePoint, doublePoint]) =>
            bingoDrawnCards[index] === 1 ? totalPoints + (singlePoint ? 1 : 0) + (doublePoint ? 2 : 0) : totalPoints, 0
        );
        if (job.result.every(result => result.score > score) ) {
        }
        const singleResult = {
            score: score,
            position: job.lastAsNr,
            field: bingoDrawnCards,
            picks: copyArray(job.drawsPerDepth)
        }
        if (job.result.length > 4) {
            job.result.sort((a, b) => b.score - a.score || a.position - b.position);
            const lowestResult = job.result[job.result.length - 1];
            if (singleResult.score > lowestResult.score || (singleResult.score === lowestResult.score && singleResult.position < lowestResult.position)) {
                job.result[job.result.length - 1] = singleResult;
                job.result.sort((a, b) => b.score - a.score || a.position - b.position);
            }
        } else {
            job.result.push(singleResult)
        }
    }
}

function calculateNextDraws(job){
    const draw = job.lastDepth < 2 ? 5 : 3;
    const rngGen = new Math.seedrandom( job.playerId + "bingo_draw_" +(job.bingo_draw + job.lastDepth + 1));
    const weightBias = job.drawsPerDepth[job.lastDepth]
    const weightBiasLength = weightBias.length
    if (job.lastDepth <= 0){
        job.drawsWeight[job.lastDepth] = copyArray(job.baseWeights)
    } else {
        job.drawsWeight[job.lastDepth] = copyArray(job.drawsWeight[job.lastDepth - 1])
    }
    const weights = job.drawsWeight[job.lastDepth]
    const thisWeights = job.pickPerDrawWeights[job.lastDepth]
    let counter = 0
    for (let i = 0; weightBiasLength > i; i++){
        const currentIndexIntoWeights = job.mappedCard[weightBias[i]]-1
        const currentWeight = weights[currentIndexIntoWeights]
        if (currentWeight === 0){
            job.lastTryIsValid = false
            break;
        }
        weights[currentIndexIntoWeights] = thisWeights[counter++]
    }
    for (let i = 0; draw > i; i++){
        const drawnNum = weightSelect(weights, rngGen());
        weights[drawnNum] = 0;
    }
}

function validateNextDraws(job){
    const limit = job.pickPerDraw[job.lastDepth];
    const limitedArray = job.drawsPerDepthFlat.slice(0, limit);
    const uniqueElements = new Set(limitedArray);
    job.lastTryIsValid = uniqueElements.size === limitedArray.length;
    if (!job.lastTryIsValid) { //fast version
        if (job.lastDepth === -1){
            job.lastTryIsValid = true;
            return;
        }
        let duplicate
        const seen = new Set();
        for (let i = 0; i < limitedArray.length; i++) {
            if (seen.has(limitedArray[i])) {
                duplicate = limitedArray[i];
                break;
            }
            seen.add(limitedArray[i]);
        }
        let lastIndex = job.drawsPerDepth[job.lastDepth].lastIndexOf(duplicate) + 1;
        for (lastIndex; lastIndex < job.drawsPerDepth[job.lastDepth].length; lastIndex++) {
            job.drawsPerDepth[job.lastDepth][lastIndex] = 24;
        }
        job.lastTryIsValid = true;
    }
}

function calculateBaseDraws(job){
    job.baseWeights = Array(75).fill(1);
    let seed = job.playerId + "bingo_draw_" + ((job.bingo_draw ?? 0))
    let rngGen = new Math.seedrandom(seed);
    while (job.baseDraws.length < 12) {
        const drawnNum = weightSelect(job.baseWeights, rngGen());
        job.baseWeights[drawnNum] = 0;
        job.baseDraws.push(drawnNum + 1);
    }
}

function generateCard(job){
    let seed = job.playerId + "bingo_generate_" + ((job.bingo_generate ?? 0))
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

function copyArray(x){
    return structuredClone(x)
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

function buildArray(length = 0) {
    return Array(length).fill().map((x, i) => i);
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

function calculateDrawsPerDepthFlat(job){
    job.drawsPerDepthFlat = job.drawsPerDepth.flat();
    while (job.drawsPerDepthFlat.length < 6){
        job.drawsPerDepthFlat.push(0)
    }
    job.currentAsNr = from7DPosition([job.first[0], ...job.drawsPerDepthFlat.slice(0, 6)]);
}

function checkForFinish(job){
    if (job.currentAsNr > job.lastAsNr){
        job.finished = true
    }
}

function incrementNextDraw(job){
    if (job.lastTryIsValid){
        if (job.lastDepth < 2){
            job.lastDepth ++
        } else {
            incrementAtLastDepth(job)
        }
    } else {
        incrementAtLastDepth(job)
        resetValuesAfterInvalidSlot(job)
    }
}

function incrementAtLastDepth(job){
    incrementArrayWithRollover(job)
    while (job.rollOver){
        job.lastDepth--
        if (job.lastDepth !== -1){
            incrementArrayWithRollover(job)
        } else {
            job.finished = true;
            return;
        }
    }
}

function resetValuesAfterInvalidSlot(job){
    for (let i = job.lastDepth; i > 2; i++){
        job.drawsPerDepth[i].fill(0)
    }
}

function incrementArrayWithRollover(job){
    job.rollOver = false;
    let i = job.drawsPerDepth[job.lastDepth].length -1
    if (i === -1) {
        job.rollOver = true;
        return;
    }
    while (i >= 0 && job.drawsPerDepth[job.lastDepth][i] === 24) job.drawsPerDepth[job.lastDepth][i--] = 0;
    if (i >= 0) job.drawsPerDepth[job.lastDepth][i]++;
    else job.rollOver = true;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

/*async function start(){
    jobData.generateJobs()
    for (let i = 0; i < jobPool.length; i++){
        console.log("from: " + jobPool[i].first + ", to: " + jobPool[i].last + ", mode: " + jobPool[i].pickPerDraw);
        await executeJob(jobPool[i]);
        console.log("finished: " + jobPool[i].calculations)
    }
}*/

function start(){
    stopAfterNext = false
    for (let i = 0; i < 1 ; i++){
        startThread()
    }
}

async function startThread(){
    while (!stopAfterNext && jobPool.length > 0){
        const myJob = jobPool.pop()
        await executeJob(myJob);
        jobFinish.push(myJob)
        mergeResults(myJob)
    }
}

function mergeResults(job){
    const combinedArray = [...globalResult, ...job.result];
    globalResult = combinedArray
        .sort((a, b) => {
            if (b.score === a.score) {
                return a.position - b.position;
            }
            return b.score - a.score;
        }).slice(0, 5);
    updateGui()
    generateNewCard(12)
}

function updateGui(){
    const copy = document.getElementById("copy")
    const showBingoCardsHere = document.getElementById("showBingoCardsHere")
    while(showBingoCardsHere.firstChild){
        showBingoCardsHere.removeChild(showBingoCardsHere.firstChild);
    }
    const clonedElement = copy.cloneNode(true);
    clonedElement.style.display = "";
    showBingoCardsHere.appendChild(clonedElement);
}

function generateNewCard(bingoId){
    const showBingoCardsHere = document.getElementById("showBingoCardsHere")
    const outerDiv = document.createElement("div");
    outerDiv.classList.add(`outerDiv${bingoId}`);
    const mainDiv = document.createElement("div");
    mainDiv.classList.add(`mainDiv${bingoId}`, `gridContainer`, `solution0`);
    outerDiv.appendChild(mainDiv)
    generateGridItems(mainDiv, [`gridItem`, `card${bingoId}`, `solution0`])
    showBingoCardsHere.appendChild(outerDiv)
}

function generateGridItems(rootNode, classes){
    const columns = 5;
    const totalNumbers = 24;
    for (let col = 0; col < columns; col++) {
        for (let row = 0; row <= Math.floor(totalNumbers / columns); row++) {
            const index = row * columns + col;
            if (index <= totalNumbers) {
                const gridItem = document.createElement("div");
                gridItem.classList.add(...classes, `item${index}`);
                gridItem.innerText = 0;
                rootNode.appendChild(gridItem)
            }
        }
    }
}

function init(){
    jobData.generateJobs()
    jobPool.reverse()
}

function stop(){
    stopAfterNext = true
}




/*
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

(function (global, pool, math) {
//
// The following constants are related to IEEE 754 limits.
//

    var width = 256,        // each RC4 output is 0 <= x < 256
        chunks = 6,         // at least six RC4 outputs for each double
        digits = 52,        // there are 52 significant digits in a double
        rngname = 'random', // rngname: name for Math.random and Math.seedrandom
        startdenom = math.pow(width, chunks),
        significance = math.pow(2, digits),
        overflow = significance * 2,
        mask = width - 1,
        nodecrypto;         // node.js crypto module, initialized at the bottom.

//
// seedrandom()
// This is the seedrandom function described above.
//
    function seedrandom(seed, options, callback) {
        var key = [];
        options = (options == true) ? { entropy: true } : (options || {});

        // Flatten the seed string or build one from local entropy if needed.
        var shortseed = mixkey(flatten(
            options.entropy ? [seed, tostring(pool)] :
                (seed == null) ? autoseed() : seed, 3), key);

        // Use the seed to initialize an ARC4 generator.
        var arc4 = new ARC4(key);

        // This function returns a random double in [0, 1) that contains
        // randomness in every bit of the mantissa of the IEEE 754 value.
        var prng = function() {
            var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
                d = startdenom,                 //   and denominator d = 2 ^ 48.
                x = 0;                          //   and no 'extra last byte'.
            while (n < significance) {          // Fill up all significant digits by
                n = (n + x) * width;              //   shifting numerator and
                d *= width;                       //   denominator and generating a
                x = arc4.g(1);                    //   new least-significant-byte.
            }
            while (n >= overflow) {             // To avoid rounding up, before adding
                n /= 2;                           //   last byte, shift everything
                d /= 2;                           //   right using integer math until
                x >>>= 1;                         //   we have exactly the desired bits.
            }
            return (n + x) / d;                 // Form the number within [0, 1).
        };

        prng.int32 = function() { return arc4.g(4) | 0; }
        prng.quick = function() { return arc4.g(4) / 0x100000000; }
        prng.double = prng;

        // Mix the randomness into accumulated entropy.
        mixkey(tostring(arc4.S), pool);

        // Calling convention: what to return as a function of prng, seed, is_math.
        return (options.pass || callback ||
            function(prng, seed, is_math_call, state) {
                if (state) {
                    // Load the arc4 state from the given state if it has an S array.
                    if (state.S) { copy(state, arc4); }
                    // Only provide the .state method if requested via options.state.
                    prng.state = function() { return copy(arc4, {}); }
                }

                // If called as a method of Math (Math.seedrandom()), mutate
                // Math.random because that is how seedrandom.js has worked since v1.0.
                if (is_math_call) { math[rngname] = prng; return seed; }

                    // Otherwise, it is a newer calling convention, so return the
                // prng directly.
                else return prng;
            })(
            prng,
            shortseed,
            'global' in options ? options.global : (this == math),
            options.state);
    }

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
    function ARC4(key) {
        var t, keylen = key.length,
            me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

        // The empty key [] is treated as [0].
        if (!keylen) { key = [keylen++]; }

        // Set up S using the standard key scheduling algorithm.
        while (i < width) {
            s[i] = i++;
        }
        for (i = 0; i < width; i++) {
            s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
            s[j] = t;
        }

        // The "g" method returns the next (count) outputs as one number.
        (me.g = function(count) {
            // Using instance members instead of closure state nearly doubles speed.
            var t, r = 0,
                i = me.i, j = me.j, s = me.S;
            while (count--) {
                t = s[i = mask & (i + 1)];
                r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
            }
            me.i = i; me.j = j;
            return r;
            // For robust unpredictability, the function call below automatically
            // discards an initial batch of values.  This is called RC4-drop[256].
            // See http://google.com/search?q=rsa+fluhrer+response&btnI
        })(width);
    }

//
// copy()
// Copies internal state of ARC4 to or from a plain object.
//
    function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
    };

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
    function flatten(obj, depth) {
        var result = [], typ = (typeof obj), prop;
        if (depth && typ == 'object') {
            for (prop in obj) {
                try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
            }
        }
        return (result.length ? result : typ == 'string' ? obj : obj + '\0');
    }

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
    function mixkey(seed, key) {
        var stringseed = seed + '', smear, j = 0;
        while (j < stringseed.length) {
            key[mask & j] =
                mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
        }
        return tostring(key);
    }

//
// autoseed()
// Returns an object for autoseeding, using window.crypto and Node crypto
// module if available.
//
    function autoseed() {
        try {
            var out;
            if (nodecrypto && (out = nodecrypto.randomBytes)) {
                // The use of 'out' to remember randomBytes makes tight minified code.
                out = out(width);
            } else {
                out = new Uint8Array(width);
                (global.crypto || global.msCrypto).getRandomValues(out);
            }
            return tostring(out);
        } catch (e) {
            var browser = global.navigator,
                plugins = browser && browser.plugins;
            return [+new Date, global, plugins, global.screen, tostring(pool)];
        }
    }

//
// tostring()
// Converts an array of charcodes to a string
//
    function tostring(a) {
        return String.fromCharCode.apply(0, a);
    }

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to interfere with deterministic PRNG state later,
// seedrandom will not call math.random on its own again after
// initialization.
//
    mixkey(math.random(), pool);

//
// Nodejs and AMD support: export the implementation as a module using
// either convention.
//
    if ((typeof module) == 'object' && module.exports) {
        module.exports = seedrandom;
        // When in node.js, try using crypto package for autoseeding.
        try {
            nodecrypto = require('crypto');
        } catch (ex) {}
    } else if ((typeof define) == 'function' && define.amd) {
        define(function() { return seedrandom; });
    } else {
        // When included as a plain script, set up Math.seedrandom global.
        math['seed' + rngname] = seedrandom;
    }


// End anonymous scope, and pass initial values.
})(
    // global: `self` in browsers (including strict mode and web workers),
    // otherwise `this` in Node and other environments
    (typeof self !== 'undefined') ? self : this,
    [],     // pool: entropy pool starts empty
    Math    // math: package containing random, pow, and seedrandom
);

init()
start()