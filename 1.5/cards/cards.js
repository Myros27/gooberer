var save;
var settings;
var parameters = {};

let cardStuff = getCardData();

function predictCards() {
    const div = document.getElementById("showCardsHere");
    let aggregate = document.getElementById("aggregateCardsHere");
    let amount = document.getElementById("cardAmount").value;
    if (amount < 1 && amount > 1000000) {amount = 10}
    while(div.firstChild) { div.removeChild(div.firstChild); }
    let selectedPack = document.getElementById("selectedPack").value;
    let pack = cardStuff.packs[selectedPack]
    let innerHtml = "<br><table><tr><th>" + selectedPack + "</th>";
    let info = []
    for (const [keyx, elemx] of Object.entries(pack.content)) {
        innerHtml += "<th>" + keyx + "<br>" + cardStuff.names[keyx] + "</th>"
        info.push([])
    }
    innerHtml += "</tr>";
    var prog = save.rng['cardPack_' + selectedPack] ?? 0;
    for (let i = 0; i < amount; i++) {
        outputTextCards("------  " + (i + 1) + "  ------")
        let rngGen = new Math.seedrandom(save.playerId + "cardPack_" + String(selectedPack) + "_" + (parseInt(prog) + i));
        let cacheWeight = [];
        let cacheContent = [];
        for (const [key, elem] of Object.entries(pack.content)) {
            cacheWeight.push(elem);
            cacheContent.push(key);
        }
        for (let j = 0, m = pack.amount; j < m; j++) { 
            let card = cacheContent[weightSelect(cacheWeight, rngGen())];
            let index = cacheContent.indexOf(card)
            info[index].push(i + 1)
            outputTextCards((save.card.card.hasOwnProperty(String(card)) ? "" : "(New!) ") + cardStuff.names[card]);
        }
    }
    let aggregateAmount = document.getElementById("aggregateAmount").value;
    if (aggregateAmount < 1 && aggregateAmount > 1000) {aggregateAmount = 4}
    for (let i = 0; i < aggregateAmount; i++) {
        let row = i + 1
        innerHtml += "<tr><td>" + row + "</td>";
        for (let j = 0; j < info.length; j++){
            if (info[j][i] !== undefined) {
                innerHtml += "<td>In " + info[j][i] + ", " + info[j][i]*pack.price + " ⬢</td>";
            } else {
                innerHtml += "<td>-</td>";
            }
        }
        innerHtml += "</tr>";
    } 
    
    innerHtml += "</table><br>";
    aggregate.innerHTML = innerHtml;
}

function outputTextCards(text, color = 0) {
    const para = document.createElement("p");
    para.style.color = "white";
    para.style.textShadow = "-1px -1px 2px black, 1px 1px 2px black, 1px -1px 2px black, -1px 1px 2px black, \
    -1px -1px 1px black, 1px 1px 1px black, 1px -1px 1px black, -1px 1px 1px black, \
    1px 0px 1px black, 0px 1px 1px black, -1px 0px 1px black, 0px -1px 1px black, \
    1px 0px 2px black, 0px 1px 2px black, -1px 0px 2px black, 0px -1px 2px black";
    para.style.margin = "0";
    para.style.fontSize = "19px";
    para.style.fontFamily = "Araboto";
    const node = document.createTextNode(text);
    para.appendChild(node);
    const element = document.getElementById("showCardsHere");
    element.appendChild(para);
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
    predictCards()
}

function getCardData() {
  return {
    packs: {
        intoDarkness: {amount: 3, price: 15, content: {
            'MI-0001': 2.75, 'MI-0002': 0.3, 'MI-0003': 0.58, 'MI-0004': 1.1, 'MI-0005': 1.22, 'MI-0006': 0.9,
            'MI-0007': 0.65, 'MI-0008': 1.11, 'MI-0009': 1.56, 'MI-0010': 0.28, 'MI-0011': 0.73, 'MI-0012': 0.86,
            'MI-0013': 1.05, 'MI-0014': 1.45, 'MI-0015': 0.49, 'MI-0016': 0.55, 'MI-0017': 0.52, 'MI-0018': 1.16,
            'MI-0023': 0.18, 'MI-0024': 0.05,
        }},
        drillsAndDepths: {unlock: 'miningDepthDweller', amount: 4, price: 35, content: {
            'MI-0001': 1.8, 'MI-0002': 0.4, 'MI-0003': 0.65, 'MI-0004': 1.1, 'MI-0005': 1.22, 'MI-0006': 0.9,
            'MI-0013': 1.05, 'MI-0014': 1.45, 'MI-0015': 0.69, 'MI-0016': 0.55, 'MI-0017': 0.52, 'MI-0018': 1.16,
            'MI-0019': 1.55, 'MI-0020': 2.3, 'MI-0021': 1.91, 'MI-0022': 2.12,
            'MI-0023': 0.36, 'MI-0024': 0.12, 'MI-0025': 0.46, 'MI-0026': 0.62, 'MI-0027': 1.35,
        }},
        hotStuff: {unlock: 'miningSmeltery', amount: 5, price: 70, content: {
            'MI-0007': 1.3, 'MI-0008': 1.77, 'MI-0009': 1.56, 'MI-0010': 0.28, 'MI-0011': 0.58, 'MI-0012': 0.51,
            'MI-0023': 0.72, 'MI-0024': 0.24, 'MI-0025': 0.46, 'MI-0026': 0.62, 'MI-0027': 1.35,
            'MI-0028': 0.8, 'MI-0029': 0.66, 'MI-0030': 2.8, 'MI-0031': 1.35,
            'MI-0032': 0.5,
        }},
        dangerZone: {unlock: 'miningResin', amount: 4, price: 105, content: {
            'MI-0032': 1.6, 'MI-0033': 1.45, 'MI-0034': 1.35, 'MI-0035': 2.1, 'MI-0036': 1.95, 'MI-0037': 3.35, 'MI-0038': 2.1,
        }},
        meetingNewPeople: {unlock: 'villageBuildings3', amount: 3, price: 18, content: {
            'VI-0001': 1.11, 'VI-0003': 0.9, 'VI-0004': 1.04, 'VI-0005': 1.11,
            'VI-0006': 2.4, 'VI-0007': 0.63, 'VI-0008': 2.8, 'VI-0010': 2.55, 'VI-0011': 1.85, 'VI-0012': 1.6, 'VI-0014': 0.7,
            'VI-0015': 0.1, 'VI-0016': 1.11, 'VI-0017': 0.35, 'VI-0018': 0.1, 'VI-0019': 1.44,
            'VI-0024': 0.97, 'VI-0025': 1.03, 'VI-0027': 0.7,
        }},
        darkCult: {unlock: 'villageBuildings4', amount: 5, price: 65, content: {
            'VI-0002': 0.84, 'VI-0009': 1.75,
            'VI-0015': 0.22, 'VI-0017': 0.82, 'VI-0018': 0.22, 'VI-0019': 1.33,
            'VI-0020': 0.84, 'VI-0021': 1.25, 'VI-0022': 1.4,
            'VI-0024': 1.07, 'VI-0025': 1.23, 'VI-0026': 2.55, 'VI-0027': 0.7,
            'VI-0028': 2.3, 'VI-0029': 0.38, 'VI-0030': 1.6, 'VI-0031': 1.15,
        }},
        technologicalAdvancement: {unlock: 'villageBuildings5', amount: 4, price: 115, content: {
            'VI-0013': 0.5, 'VI-0023': 1.1,
            'VI-0030': 2.6, 'VI-0031': 1.65, 'VI-0032': 0.38, 'VI-0033': 0.7,
            'VI-0034': 1.32, 'VI-0035': 1.05, 'VI-0036': 0.82, 'VI-0037': 1.02, 'VI-0038': 1.4, 'VI-0039': 0.9,
        }},
        rookieOnTheBattlefield: {unlock: 'hordeItems', amount: 3, price: 20, content: {
            'HO-0001': 2.6, 'HO-0002': 0.45, 'HO-0003': 1.25, 'HO-0004': 0.92, 'HO-0005': 1.55, 'HO-0006': 1.36,
            'HO-0007': 0.6, 'HO-0008': 0.8, 'HO-0009': 0.88, 'HO-0010': 0.4, 'HO-0011': 0.48,
            'HO-0012': 2.1, 'HO-0013': 1.6, 'HO-0014': 0.77,
        }},
        spiritualSuccess: {unlock: 'hordePrestige', amount: 4, price: 65, content: {
            'HO-0003': 1.25, 'HO-0004': 0.92, 'HO-0005': 1.55, 'HO-0006': 1.36,
            'HO-0009': 0.88, 'HO-0010': 0.8, 'HO-0011': 0.96,
            'HO-0012': 2.1, 'HO-0013': 1.6, 'HO-0014': 0.77, 'HO-0015': 1.2, 'HO-0016': 1.3, 'HO-0017': 1.8,
            'HO-0018': 1.6, 'HO-0019': 0.75, 'HO-0020': 0.84, 'HO-0021': 1.05, 'HO-0022': 1.5, 'HO-0023': 0.43,
            'HO-0024': 0.7, 'HO-0026': 0.9,
        }},
        oldMemories: {unlock: 'hordeHeirlooms', amount: 2, price: 50, content: {
            'HO-0007': 1.2, 'HO-0010': 0.8, 'HO-0011': 0.96,
            'HO-0019': 1.5, 'HO-0020': 1.68, 'HO-0021': 2.1, 'HO-0022': 3.75,
            'HO-0024': 1.4, 'HO-0026': 1.8, 'HO-0027': 1.15, 'HO-0028': 2, 'HO-0030': 2.3,
        }},
        taintedWorld: {unlock: 'hordeItemMastery', amount: 6, price: 225, content: {
            'HO-0023': 0.72,
            'HO-0024': 1.2, 'HO-0025': 1.3, 'HO-0026': 1.55, 'HO-0027': 1.15, 'HO-0028': 2, 'HO-0029': 1.1, 'HO-0030': 2.3,
            'HO-0031': 3.5, 'HO-0032': 2.1, 'HO-0033': 0.9, 'HO-0034': 1.22, 'HO-0035': 1.58, 'HO-0036': 1.18,
            'HO-0037': 1.4, 'HO-0038': 0.5, 'HO-0039': 0.77, 'HO-0040': 1.36, 'HO-0041': 0.22,
        }},
        bountifulHarvest: {unlock: 'farmCropExp', amount: 3, price: 30, content: {
            'FA-0001': 1.5, 'FA-0002': 1.5, 'FA-0003': 0.9, 'FA-0004': 1.5, 'FA-0005': 1.5,
            'FA-0006': 0.6, 'FA-0007': 0.6, 'FA-0008': 0.6, 'FA-0009': 0.6,
            'FA-0010': 0.5, 'FA-0011': 0.2,
        }},
        juicyYields: {unlock: 'farmFertilizer', amount: 4, price: 80, content: {
            'FA-0006': 1.2, 'FA-0007': 1.2, 'FA-0008': 1.2, 'FA-0009': 1.2,
            'FA-0010': 1.5, 'FA-0011': 1,
            'FA-0012': 0.9, 'FA-0013': 0.6, 'FA-0014': 0.4, 'FA-0015': 0.4, 'FA-0016': 0.4,
        }},
        insectWorld: {unlock: 'farmAdvancedCardPack', amount: 2, price: 90, content: {
            'FA-0010': 2, 'FA-0011': 1.8,
            'FA-0017': 1.4, 'FA-0019': 1.4, 'FA-0020': 1.4, 'FA-0021': 1.2, 'FA-0025': 0.8,
        }},
        beesAndFlowers: {unlock: 'farmLuxuryCardPack', amount: 3, price: 200, content: {
            'FA-0012': 0.7, 'FA-0013': 0.6, 'FA-0014': 0.4, 'FA-0015': 0.4, 'FA-0016': 0.4,
            'FA-0017': 1, 'FA-0018': 0.1,
            'FA-0019': 1, 'FA-0020': 1, 'FA-0021': 0.9,
            'FA-0022': 0.8, 'FA-0023': 0.8, 'FA-0024': 0.5, 'FA-0025': 0.6,
            'FA-0026': 0.4, 'FA-0027': 0.4,
        }},
        newArtist: {unlock: 'galleryAuction', amount: 3, price: 55, content: {
            'GA-0001': 1.2, 'GA-0002': 1, 'GA-0003': 0.8, 'GA-0004': 0.6,
            'GA-0005': 3.2, 'GA-0006': 1.45, 'GA-0007': 2.5, 'GA-0008': 1.55, 'GA-0009': 1.8, 'GA-0010': 0.8, 'GA-0011': 0.66,
            'GA-0012': 1.24, 'GA-0013': 1.5, 'GA-0014': 1.18,
            'GA-0015': 1.4, 'GA-0016': 1.32, 'GA-0017': 1.12, 'GA-0018': 1.03,
        }},
        inspiringCreations: {unlock: 'galleryAuction', amount: 3, price: 120, content: {
            'GA-0012': 1.24, 'GA-0013': 2.25, 'GA-0014': 1.18,
            'GA-0015': 1.4, 'GA-0016': 1.32, 'GA-0017': 1.12, 'GA-0018': 1.03,
            'GA-0019': 1.6, 'GA-0020': 0.77, 'GA-0021': 0.92, 'GA-0022': 0.85, 'GA-0023': 1.08,
        }},
    },
    names: {
        'MI-0001': 'Basic equipment',
        'MI-0002': 'Unused pickaxe',
        'MI-0003': 'Pickaxe crate',
        'MI-0004': 'Light the fuse!',
        'MI-0005': 'Into the depths',
        'MI-0006': 'Helmet shelf',
        'MI-0007': 'Take cover!',
        'MI-0008': 'Working hard',
        'MI-0009': 'Pick or shovel?',
        'MI-0010': 'Too small',
        'MI-0011': 'Motivated worker',
        'MI-0012': 'Workplace accident',
        'MI-0013': 'Temporary storage',
        'MI-0014': 'Filled crate',
        'MI-0015': 'To the surface',
        'MI-0016': 'Extraction',
        'MI-0017': 'Transport',
        'MI-0018': 'Quality control',
        'MI-0019': 'Recycling factory',
        'MI-0020': 'Hydraulic press',
        'MI-0021': 'Refining experiment',
        'MI-0022': 'Robot assembly',
        'MI-0023': 'Stuck pickaxe',
        'MI-0024': 'Mine entrance',
        'MI-0025': 'Detonate rock pile',
        'MI-0026': 'Mineshaft',
        'MI-0027': 'Surface rock',
        'MI-0028': 'Disturbing the bats',
        'MI-0029': 'Creepy crawly',
        'MI-0030': 'Rare find',
        'MI-0031': 'Underground lake',
        'MI-0032': 'Flammable liquid',
        'MI-0033': 'Underground cemetery',
        'MI-0034': 'Lurking spider',
        'MI-0035': 'No way out',
        'MI-0036': 'Earthquake',
        'MI-0037': 'Toxic gas',
        'MI-0038': 'Crystal spikes',
    
        'VI-0001': 'Massive boulders',
        'VI-0002': 'Hidden gem',
        'VI-0003': 'Dripstone cave',
        'VI-0004': 'Two paths',
        'VI-0005': 'Cave flowers',
        'VI-0006': 'Outside camping',
        'VI-0007': 'Playground',
        'VI-0008': 'Quiet area',
        'VI-0009': 'Angry neighbor',
        'VI-0010': 'House with garden',
        'VI-0011': 'Build a home',
        'VI-0012': 'Camping trip',
        'VI-0013': 'Living room',
        'VI-0014': 'Dog house',
        'VI-0015': 'Roof garden',
        'VI-0016': 'Century tree',
        'VI-0017': 'Tree theft',
        'VI-0018': 'Community garden',
        'VI-0019': 'Reforesting',
        'VI-0020': 'Deforesting',
        'VI-0021': 'Log truck',
        'VI-0022': 'Research lab',
        'VI-0023': 'Experiment',
        'VI-0024': 'Disease analysis',
        'VI-0025': 'Forming bars',
        'VI-0026': 'Nail factory',
        'VI-0027': 'Old library',
        'VI-0028': 'Clockwork',
        'VI-0029': 'Cooking robot',
        'VI-0030': 'Remote garage',
        'VI-0031': 'Generator',
        'VI-0032': 'Solar panels',
        'VI-0033': 'Self-driving car',
        'VI-0034': 'Firefighters',
        'VI-0035': 'Police station',
        'VI-0036': 'Lighting the way',
        'VI-0037': 'Saving a dog',
        'VI-0038': 'Ambulance',
        'VI-0039': 'Lifeguard',
    
        'HO-0001': 'Lurking snake',
        'HO-0002': 'Deep hole',
        'HO-0003': 'Erupting volcano',
        'HO-0004': 'Lost',
        'HO-0005': 'Frozen forever',
        'HO-0006': 'Magma chamber',
        'HO-0007': 'Backpack check',
        'HO-0008': 'Wall construction',
        'HO-0009': 'Surveillance camera',
        'HO-0010': 'Mushroom guide',
        'HO-0011': 'Electric fence',
        'HO-0012': 'Megabomb',
        'HO-0013': 'Rocket launcher',
        'HO-0014': 'Sworderang',
        'HO-0015': 'Poisoned arrow',
        'HO-0016': 'Guided missile',
        'HO-0017': 'Axe thrower',
        'HO-0018': 'Mighty pen',
        'HO-0019': 'Catapult',
        'HO-0020': 'Gunblade',
        'HO-0021': 'Sun rays',
        'HO-0022': 'Sawblade launcher',
        'HO-0023': 'Supercorrosive',
        'HO-0024': 'Natural cover',
        'HO-0025': 'Forest meditation',
        'HO-0026': 'Metal detector',
        'HO-0027': 'Projectile shield',
        'HO-0028': 'Force field',
        'HO-0029': 'Radar',
        'HO-0030': 'Spy',
        'HO-0031': 'Corruption not allowed',
        'HO-0032': 'Liquid filter',
        'HO-0033': 'Washing machine',
        'HO-0034': 'Kill it with fire',
        'HO-0035': 'Purification beam',
        'HO-0036': 'Stomp the corruption',
        'HO-0037': 'Into the trash!',
        'HO-0038': 'Strange ritual',
        'HO-0039': 'Vacuum cleaner',
        'HO-0040': 'Power of science',
        'HO-0041': 'Just microwave it',
    
        'FA-0001': 'Picking apples',
        'FA-0002': 'Pumpkin contest',
        'FA-0003': 'Flower shop',
        'FA-0004': 'Office plant',
        'FA-0005': 'Scarecrow',
        'FA-0006': 'Artificial rain',
        'FA-0007': 'Supply train',
        'FA-0008': 'Food transport',
        'FA-0009': 'Warm greenhouse',
        'FA-0010': 'Fruit smoothie',
        'FA-0011': 'Bakery sale',
        'FA-0012': 'Ice cream truck',
        'FA-0013': 'Fast food order',
        'FA-0014': 'Feast',
        'FA-0015': 'Candyland',
        'FA-0016': 'Tea time',
        'FA-0017': 'Making wine',
        'FA-0018': 'Cookie and coffee',
        'FA-0019': 'Orange veggies',
        'FA-0020': 'Spicy-fruity red',
        'FA-0021': 'Daisy yellow',
        'FA-0022': 'Plant green',
        'FA-0023': 'Blueberry bush',
        'FA-0024': 'Purple mushrooms',
        'FA-0025': 'Bug powder',
        'FA-0026': 'Fresh lime',
        'FA-0027': 'Butterfly wings',
    
        'GA-0001': 'Ladybugs',
        'GA-0002': 'Colorful feathers',
        'GA-0003': 'Making lemonade',
        'GA-0004': 'Algae',
        'GA-0005': 'Art museum',
        'GA-0006': 'Pencil drawing',
        'GA-0007': 'Pen collection',
        'GA-0008': 'Spray painting',
        'GA-0009': 'Color palette',
        'GA-0010': 'Wall painting',
        'GA-0011': 'Artist signature',
        'GA-0012': 'Mixing paint',
        'GA-0013': 'Modern art auction',
        'GA-0014': 'Portrait',
        'GA-0015': 'Recycling bin',
        'GA-0016': 'Pizza delivery',
        'GA-0017': 'Package delivery',
        'GA-0018': 'School bus',
        'GA-0019': 'Drum factory',
        'GA-0020': 'Cargo ship',
        'GA-0021': 'Moving company',
        'GA-0022': 'Drone delivery',
        'GA-0023': 'Tow truck',
    
        'GE-0001': 'Ruby railway',
        'GE-0002': 'Emerald mine',
        'GE-0003': 'Sunken treasure',
        'GE-0004': 'Luxury watch',
        'GE-0005': 'Dangerous triangles',
        'GE-0006': 'Diamond tools',
        'GE-0007': 'Security measures',
    
        'EV-0001': 'Fair',
        'EV-0002': 'Building competition',
        'EV-0003': 'Grill',
        'EV-0004': 'Birthday party',
        'EV-0005': 'Yard sale',
        'EV-0006': 'Gas station',
        'EV-0007': 'Local merchant',
        'EV-0008': 'Bingo on TV',
        'EV-0009': 'Casino',
        'EV-0010': '???',
        'EV-0011': 'Bank safe',
        'EV-0012': 'Profit!',
        'EV-0013': 'Credit card',
        'EV-0014': 'Desert',
        'EV-0015': 'Paragliding',
        'EV-0016': 'Jungle mystery',
        'EV-0017': 'Stranded turtle',
        'EV-0018': 'Flower breeding',
        'EV-0019': 'Plant sample',
        'EV-0020': 'Spearfishing',
        'EV-0021': 'Snail race',
        'EV-0022': 'Lonely island',
        'EV-0023': 'Summer song',
        'EV-0024': 'Cozy couch',
        'EV-0025': 'Nasty mountain',
        'EV-0026': 'Nighttime city',
        'EV-0027': 'Hot apple juice',
        'EV-0028': 'Mysterious soup',
        'EV-0029': 'Secret spring',
        'EV-0030': 'Build a snowman',
        'EV-0031': 'Winter sports',
        'EV-0032': 'Castle lights',
        'EV-0033': 'Lightbulb store',
    
        'XD-1337': 'Testing card'
        }
    }
}
