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
    feature();
});

function feature(){
    document.getElementById("playerId").innerText = save.playerId
    debugger;
}