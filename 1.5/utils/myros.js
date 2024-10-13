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
