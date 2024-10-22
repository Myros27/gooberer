var save; //This contains the whole save, ready to use
var settings; //This can be used to get some global settings
var parameters = new URLSearchParams(document.location.search) //This is used when opened with ? Parameters

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
    document.getElementById("playerId").innerText = save.playerId
    debugger;
    alert("a perfect place for some snowdown predictor code: " + save.rng.snowdown_item)
}