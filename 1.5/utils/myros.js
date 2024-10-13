function getGl() {
    return Object.values(save.globalLevel).reduce((sum, value) => sum + value, 0);
}

function mapTypeToIcon(type){
    const iconList = {
        miningDamage: 'mdi-bomb',
        currencyMiningScrapGain: 'mdi-dots-triangle',
        miningOreGain: 'mdi-chart-bubble',
        miningSmelterySpeed: 'mdi-fire',
        currencyMiningSmokeGain: 'mdi-smoke',
        currencyMiningCrystalGreenGain: 'mdi-star-three-points',
        currencyMiningCrystalYellowGain: 'mdi-star-four-points',
        queueSpeedVillageBuilding: 'mdi-hammer',
        villageMaterialGain: 'mdi-tree',
        currencyVillageCoinGain: 'mdi-circle-multiple',
        villageMentalGain: 'mdi-brain',
        currencyVillageFaithGain: 'mdi-hands-pray',
        currencyVillageSharesGain: 'mdi-certificate',
        hordeAttack: 'mdi-sword',
        currencyHordeBoneGain: 'mdi-bone',
        currencyHordeMonsterPartGain: 'mdi-stomach',
        hordeItemMasteryGain: 'mdi-seal',
        currencyHordeSoulCorruptedGain: 'mdi-ghost',
        currencyFarmVegetableGain: 'mdi-carrot',
        currencyFarmBerryGain: 'mdi-fruit-grapes',
        currencyFarmGrainGain: 'mdi-barley',
        currencyFarmFlowerGain: 'mdi-flower',
        farmExperience: 'mdi-star',
        currencyGalleryBeautyGain: 'mdi-image-filter-vintage',
        currencyGalleryConverterGain: 'mdi-recycle',
        currencyGalleryPackageGain: 'mdi-package-variant',
        currencyGalleryCashGain: 'mdi-cash',
    }
    return iconList[type]
}

function mapTierToColor(tier){
    const colors = ['white', 'yellow', 'orange', 'red', 'pink', 'purple', 'indigo', 'blue', 'teal', 'green', 'light-green', 'lime', 'amber', 'orange-red', 'red-pink', 'pink-purple', 'dark-blue', 'light-blue', 'cyan']
    return colors[tier]
}

function mapTypeTostrength(type){
    const valueList = {
        miningDamage: 0.25,
        currencyMiningScrapGain: 0.3,
        miningOreGain: 0.2,
        miningSmelterySpeed: 0.2,
        currencyMiningSmokeGain: 0.04,
        currencyMiningCrystalGreenGain: 0.1,
        currencyMiningCrystalYellowGain: 0.05,
        queueSpeedVillageBuilding: 0.3,
        villageMaterialGain: 0.1,
        currencyVillageCoinGain: 0.25,
        villageMentalGain: 0.1,
        currencyVillageFaithGain: 0.1,
        currencyVillageSharesGain: 0.05,
        hordeAttack: 0.2,
        currencyHordeBoneGain: 0.3,
        currencyHordeMonsterPartGain: 0.15,
        hordeItemMasteryGain: 0.1,
        currencyHordeSoulCorruptedGain: 0.1,
        currencyFarmVegetableGain: 0.35,
        currencyFarmBerryGain: 0.35,
        currencyFarmGrainGain: 0.35,
        currencyFarmFlowerGain: 0.35,
        farmExperience: 0.1,
        currencyGalleryBeautyGain: 0.4,
        currencyGalleryConverterGain: 0.15,
        currencyGalleryPackageGain: 0.15,
        currencyGalleryCashGain: 0.1,
    };
    return valueList[type]
}

function mapTypeToText(type){
    const translationList = {
        miningDamage: 'Damage',
        currencyMiningScrapGain: 'Scrap gain',
        miningOreGain: 'Ore gain',
        miningSmelterySpeed: 'Smeltery speed',
        currencyMiningSmokeGain: 'Smoke gain',
        queueSpeedVillageBuilding: 'Building speed',
        villageMaterialGain: 'Material gain',
        currencyVillageCoinGain: 'Gold coin gain',
        villageMentalGain: 'Mental resource gain',
        currencyVillageCoinGain: 'Coin gain',
        currencyVillageFaithGain: 'Faith gain',
        currencyVillageSharesGain: 'Shares gain',
        hordeAttack: 'Attack',
        currencyHordeBoneGain: 'Bone gain',
        currencyHordeMonsterPartGain: 'Monster part gain',
        hordeItemMasteryGain: 'Mastery point gain',
        currencyHordeSoulCorruptedGain: 'Corrupted soul gain',
        currencyFarmVegetableGain: 'Vegetable gain',
        currencyFarmBerryGain: 'Berry gain',
        currencyFarmGrainGain: 'Grain gain',
        currencyFarmFlowerGain: 'Flower gain',
        farmExperience: 'Crop experience',
        currencyGalleryBeautyGain: 'Beauty gain',
        currencyGalleryConverterGain: 'Converter gain',
        currencyGalleryPackageGain: 'Package gain',
        currencyGalleryCashGain: 'Cash gain',
    };
    return translationList[type]
}
