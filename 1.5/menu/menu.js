var save;
var devmode = false;

let jsonUrlsArray = [
    "https://myros27.github.io/gooberer/1.5/items.json",
    "https://craftyduck100.github.io/gooberer/1.5/items.json",
    "https://sashkara.github.io/gooberer/1.5/items.json",
];

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

function validateSave(){
    if (save === undefined || save === null || save === "")
    {
        alert("invalid save")
    }
    showMenu()
}

function showMenu(){
    document.getElementById("tabList").removeAttribute("hidden")
    document.getElementById("feature").removeAttribute("hidden")
    document.getElementById("saveInput").hidden = true
}

function resetAll(){
    sessionStorage.clear();
    window.location.reload(true);
}

function addResetButton() {
    document.getElementById("tabList")
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
        if (!item.released && !devMode) return;
        if (!item.released && devMode) item.title = `dev-${item.title}`;
        item.link = `${baseUrl}/${item.link}`;
        const existingItem = menuItemsMap.get(item.title);
        if (!existingItem) {
            item.priority = urlPriority;
            menuItemsMap.set(item.title, item);
        } else if (item.version > existingItem.version) {
            item.priority = urlPriority;
            menuItemsMap.set(item.title, item);
        } else if (item.version === existingItem.version && urlPriority < existingItem.priority) {
            item.priority = urlPriority;
            menuItemsMap.set(item.title, item);
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
            document.title = `Gooberer ${item.title}`;
            iframe.onload = null;
            iframe.onload = () => {
                iframe.contentWindow.postMessage(btoa(JSON.stringify(save)), '*');
            };
        });
        tabList.appendChild(button);
    });
}

generateMenu();

addResetButton();
