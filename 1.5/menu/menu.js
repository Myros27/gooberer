var save;
var settings = localStorage.getItem("settings");

if (settings === null || !isValidSettings(settings)) {
    settings = {
        devMode: false
    };
    localStorage.setItem("settings", JSON.stringify(settings));
} else {
    settings = JSON.parse(settings);
}

window.addEventListener('message', function(event) {
    try {
        let receivedData = JSON.parse(atob(event.data));
        if (receivedData.action === 'settingsUpdate' && receivedData.settings) {
            let updatedSettings = receivedData.settings;
            processUpdatedSettings(updatedSettings);
        }
    } catch (error) {
        console.error('Fehler beim Verarbeiten der Nachricht:', error);
    }
});

let jsonUrlsArray = [
    "https://myros27.github.io/gooberer/1.5/items.json",
    "https://craftyduck100.github.io/gooberer/1.5/items.json",
    "https://sashkara.github.io/gooberer/1.5/items.json",
];

function isValidSettings(storedSettings) {
    try {
        const parsedSettings = JSON.parse(storedSettings);
        return typeof parsedSettings.devMode === "boolean";
    } catch (e) {
        return false;
    }
}

function uploadFile() {
const file = document.getElementById("mySaveFile").files[0];
if (file) {
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function (evt) {
        var rawSave = evt.target.result;
        if (!evt.target.result.startsWith("{")) {
            save = JSON.parse(atob(rawSave))
        } else {
            save = JSON.parse(rawSave)
        }
        validateSave()
        }
    }
}

function useLocalSaveFile(){
    let localSaveFile = localStorage.getItem("lastSave")
    if (localSaveFile && localSaveFile.length > 0){
        save = JSON.parse(atob(localSaveFile))
        validateSave()
    }
}

function validateSave(){
    if (save === undefined || save === null || save === "")
    {
        alert("invalid save")
    }
    if (save.playerId.length !== 16){
        alert("invalid save attr playerId")
    }
    localStorage.setItem('playerId', save.playerId);
    showMenu()
}

function showMenu(){
    localStorage.setItem("lastSave", btoa(JSON.stringify(save)));
    document.getElementById("tabList").removeAttribute("hidden");
    document.getElementById("feature").removeAttribute("hidden");
    document.getElementById("saveInput").style.display = "none";
}

function resetAll(){
    window.location.reload(true);
}

function addResetButton() {
    const tabList = document.getElementById("tabList")
    const resetButton = document.createElement("button");
    resetButton.classList.add("tablinks");
    const resetIcon = document.createElement("i");
    resetIcon.classList.add("mdi", "mdi-refresh");
    resetButton.appendChild(resetIcon);
    const resetLink = document.createElement("span");
    resetLink.textContent = " Reset";
    resetButton.appendChild(resetLink);
    resetButton.addEventListener('click', resetAll);
    tabList.prepend(resetButton);
}

async function generateMenu() {
    const menuItemsMap = await fetchMenuItems(jsonUrlsArray);
    createMenu(menuItemsMap);
}

async function fetchMenuItems(urls) {
    const menuItemsMap = new Map();
    const fetchPromises = urls.map(url => fetchData(url, menuItemsMap));
    await Promise.all(fetchPromises);
    if (menuItemsMap.size === 0) {
        console.warn("No menu items were fetched from any of the provided URLs.");
    }
    return menuItemsMap;
}

async function fetchData(url, menuItemsMap) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        processMenuData(data, menuItemsMap, url);
    } catch (error) {
        console.error(`Error fetching or processing the JSON data from ${url}:`, error);
    }
}

function processMenuData(data, menuItemsMap, originalUrl) {
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/'));
    const urlPriority = jsonUrlsArray.indexOf(originalUrl);
    data.menuItems.forEach(item => {
        let itemTitle = item.title;
        if (!item.released && settings.devMode) {
            itemTitle = `dev-${item.title}`;
        }
        if (!item.released && !settings.devMode) return;
        item.link = `${baseUrl}/${item.link}`;
        const existingItem = menuItemsMap.get(itemTitle);
        if (!existingItem) {
            item.priority = urlPriority;
            menuItemsMap.set(itemTitle, item);
        } else if (item.version > existingItem.version) {
            item.priority = urlPriority;
            menuItemsMap.set(itemTitle, item);
        } else if (item.version === existingItem.version && urlPriority < existingItem.priority) {
            item.priority = urlPriority;
            menuItemsMap.set(itemTitle, item);
        }
    });
}

function createMenu(menuItemsMap) {
    const tabList = document.getElementById("tabList");
    const iframe = document.getElementById("gooberIframe");
    menuItemsMap.forEach(item => {
        const button = document.createElement("button");
        button.classList.add("tablinks");
        if (item.icon) {
            const icon = document.createElement("i");
            icon.classList.add("mdi", item.icon);
            button.appendChild(icon);
        }
        const link = document.createElement("span");
        link.textContent = " " + item.title;
        button.appendChild(link);
        button.addEventListener('click', () => {
            iframe.src = item.link;
            iframe.removeAttribute('hidden');
            document.title = `Gooberer ${item.title}`;
            iframe.onload = null;
            iframe.onload = () => {
                let sendData = {
                    action: 'initData',
                    save: save,
                    settings: settings                    
                }
                iframe.contentWindow.postMessage(btoa(JSON.stringify(sendData)), '*');
            };
        });
        tabList.appendChild(button);
    });
}

function useLocalStorage(){
    let localSaveFile = localStorage.getItem("lastSave")
    if (localSaveFile.length > 0){
        document.getElementById("myLocalSaveFile").parentElement.style.display = "flex";
        document.getElementById("localSaveFileOr").style.display = "flex";
    }
}

function setupCloudSaveFile(){
    let modal = document.getElementById("cloudModal");
    let btn = document.getElementById("setupCloudSaveFile");
    let span = document.getElementsByClassName("close")[0];
    
    btn.onclick = function() {
        modal.style.display = "block";
    }
    
    span.onclick = function() {
        modal.style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
    
    const ident = localStorage.getItem('ident');
    const playerId = localStorage.getItem('playerId');

    if (ident) {
        document.getElementById('ident').value = ident;
    }
    if (playerId) {
        document.getElementById('playerId').value = playerId;
    }
    
    const inputs = document.querySelectorAll('.sync-input');
    inputs.forEach(input => {
        input.addEventListener('input', saveToLocalStorage);
    });
}

function saveToLocalStorage() {
    const ident = document.getElementById('ident').value;
    const playerId = document.getElementById('playerId').value;

    localStorage.setItem('ident', ident);
    localStorage.setItem('playerId', playerId);
}

function processUpdatedSettings(updatedSettings) {
    if (isValidSettings(JSON.stringify(updatedSettings))) {
        localStorage.setItem("settings", JSON.stringify(updatedSettings));
        settings = updatedSettings;
    }
}

generateMenu();
addResetButton();
useLocalStorage();
setupCloudSaveFile();
