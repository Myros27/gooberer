var save;
var settings;
var parameters = new URLSearchParams(document.location.search)

window.addEventListener('message', function(event) {
    let receivedData = JSON.parse(atob(event.data));
    if (receivedData.action !== 'initData' || receivedData.action === 'jsException') {
        return;
    }
    save = receivedData.save;
    settings = receivedData.settings;
    if (parameters.size > 0)
    {
        document.getElementById("amountInput").hidden = "hidden";
        document.getElementById("treasureAmount").hidden = "hidden";
        document.getElementById("amountText").hidden = "hidden";
        document.getElementById("treasureAmount").value = 17
    }
    calcTreasure()
});

function calcTreasure() {
    let myGlobalLevel = getGl()
    const div = document.getElementById("showTreasureHere");
    while(div.firstChild){
        div.removeChild(div.firstChild);
    }
    let amount = document.getElementById("treasureAmount").value;
    if (amount < 1 && amount > 10000) {amount = 20}
    for (let i = 0; i < amount; i++) {
        let seed = save.playerId + "treasureTier_regular_" + ((save.rng.treasureTier_regular ?? 0) + i)
        let rngGen = new Math.seedrandom(seed);
        const nextChance = rngGen();
        let tier = getTier(myGlobalLevel, nextChance)
        let nextGl      
        for (let currentGL = myGlobalLevel; currentGL < myGlobalLevel + 1000; currentGL++) {
            if (getTier(currentGL, nextChance) !== tier)
            {
                nextGl = currentGL;
                break;
            }
        }
        generateTreasure(tier, nextGl, i)
    }
}

function generateTreasure(tier, nextGl, i){
    tier++
    let seed = save.playerId + "treasure_regular_" + ((save.rng.treasure_regular ?? 0) + i)
    let rngGen = new Math.seedrandom(seed);
    let randomValue = rngGen()
    let chosenEffect = [];
    const effectList = generateEffectList()
    let chosenElem = randomElem(effectList, randomValue);
    //effectList = effectList.filter(el => el !== chosenElem); dual
    chosenEffect.push(chosenElem);
    let type = chosenEffect[0]
    
    let icon = mapTypeToIcon(type)
    let color = mapTierToColor(tier)
    let strength =  ((tier + 1) * mapTypeToStrength(type)) + 1
    let effectName = mapTypeToText(type)
    const showTreasureHere = document.getElementById("showTreasureHere");
    
    const div = document.createElement("div");
    const divIcon = document.createElement("div");
    const divTreasure = document.createElement("div");
    const divEffect = document.createElement("div");
    const iconContainer = document.createElement("i");
    const textContainer = document.createElement("p");
    const strengthContainer = document.createElement("p");
    const effectContainer = document.createElement("p");
    const nextGlContainer = document.createElement("p");
    
    div.classList.add("treasure-item");
    divIcon.classList.add("icon-container");
    divTreasure.classList.add("treasure-text");
    divEffect.classList.add("effect-text");
    
    iconContainer.style.fontSize = "40px";
    iconContainer.classList.add("mdi", icon);
    iconContainer.style.color = color;
    
    textContainer.innerText = effectName + ": ";
    strengthContainer.innerText = "x" + strength;
    effectContainer.innerText = "Tier " + tier + ", next";
    effectContainer.style.color = color;

    nextGlContainer.innerText = " tier @ " + nextGl + ": ";
    nextGlContainer.style.color = color;
    
    divIcon.appendChild(iconContainer);
    divTreasure.appendChild(textContainer);
    divTreasure.appendChild(strengthContainer);
    divEffect.appendChild(effectContainer);
    divEffect.appendChild(nextGlContainer);
    div.appendChild(divIcon);
    div.appendChild(divEffect);
    div.appendChild(divTreasure);
    showTreasureHere.appendChild(div);
}

function generateEffectList(){
    let unlocks = save.unlock;
    let effectList = [];
    effectList.push("miningDamage");
    effectList.push("currencyMiningScrapGain");
    effectList.push("miningOreGain");
    "miningSmeltery" in unlocks ? effectList.push("miningSmelterySpeed") : null;
    "miningSmoke" in unlocks ? effectList.push("currencyMiningSmokeGain") : null;
    effectList.push("queueSpeedVillageBuilding");
    effectList.push("villageMaterialGain");
    effectList.push("currencyVillageCoinGain");
    effectList.push("villageMentalGain");
    effectList.push("hordeAttack");
    effectList.push("currencyHordeBoneGain");
    effectList.push("currencyHordeMonsterPartGain");
    "hordeItemMastery" in unlocks ? effectList.push("hordeItemMasteryGain") : null;
    effectList.push("currencyFarmVegetableGain");
    effectList.push("currencyFarmBerryGain");
    effectList.push("currencyFarmGrainGain");
    effectList.push("currencyFarmFlowerGain");
    effectList.push("currencyGalleryBeautyGain");
    "galleryConversion" in unlocks ? effectList.push("currencyGalleryConverterGain") : null;
    "galleryDrums" in unlocks ? effectList.push("currencyGalleryPackageGain") : null;
    return effectList;
}

function getTier(gl = getGl(), nextChance){
    let tier = null
    let totalChance = 0;
    tierChancesRaw(gl).forEach(elem => {
        totalChance += elem.chance;
        if (tier === null && chance(totalChance, nextChance)) {
            tier = elem.tier;
        }
    })
    return tier        
}

function tierChancesRaw(gl = getGl()) {
    let arr = [];
    let tier = 0;
    let totalChance = 0;
    const upgradeChances = tierChances(gl);
    if (upgradeChances.length <= 0) {
        return [{tier: 0, chance: 1}];
    }
    upgradeChances.forEach((elem, key) => {
        if (elem < 1) {
            const chance = (1 - totalChance) * (1 - elem)
            arr.push({tier, chance});
            totalChance += chance;
        }
        tier++;
        if ((key + 1) >= upgradeChances.length) {
            arr.push({tier, chance: (1 - totalChance)});
        }
    });
    return arr;
}

function tierChances(gl) {
    let chances = [];
    let chanceValue = gl / 1000;
    while (chanceValue > 0) {
        chances.push(chanceValue);
        chanceValue *= 0.9;
        chanceValue -= 0.2;
    }
    return chances;
}
