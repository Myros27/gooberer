let id = -1;
let main = false;
let ready = false;
const every = 1000;

self.onmessage = function(event) {
    const { action, data } = event.data;
    if (action === 'init') {
        id = data.id;
        main = data.isMain
        ready = true
        start()
    }
    if (action === 'compute') {
        executeJob(JSON.parse(data))
    }
};

function start(){
    self.postMessage({ action: 'ready', data: {id: id, isMain: main, ready: ready }});
}

async function executeJob(job){
    while (job.finished === false){
        if (job.calculations % every === 0){
            self.postMessage({
                action: 'calculating',
                data: {
                    id: id,
                    every: every,
                    calculations: job.calculations,
                }
            });
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
    finishJob(job)
}

function finishJob(job){
    self.postMessage({ action: 'finished', data: JSON.stringify(job)});
    start()
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
            picks: []
        }
        for (let i = 0; i < 3; i++)        {
            singleResult.picks.push([...job.drawsPerDepth[i]])
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
        job.drawsWeight[job.lastDepth] = [...(job.baseWeights)]
    } else {
        job.drawsWeight[job.lastDepth] = [...(job.drawsWeight[job.lastDepth - 1])]
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

function from7DPosition(position) {
    let num = position[0] * Math.pow(25, 6);
    for (let i = 1; i < 7; i++) {
        num += position[i] * Math.pow(25, 6 - i);
    }
    return num;
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