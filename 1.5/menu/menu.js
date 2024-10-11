var save;

let jsonUrlsArray = [
  "https://myros27.github.io/gooberer/1.5/menu/menu.json",
  "https://craftyduck100.github.io/gooberer/1.5/menu/menu.json",
  "https://sashkara.github.io/gooberer/1.5/menu/menu.json",
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
        document.getElementById("tabList").removeAttribute("hidden")
        document.getElementById("feature").removeAttribute("hidden")
        document.getElementById("saveInput").hidden = true
        }
    }
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
    const menuItemsMap = new Map();

    for (const url of jsonUrlsArray) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Failed to fetch ${url}: ${response.statusText}`);
                continue;
            }

            const data = await response.json();

            data.menuItems.forEach(item => {
                if (!item.released) return;
                const existingItem = menuItemsMap.get(item.title);
                if (!existingItem || item.version > existingItem.version) {
                    menuItemsMap.set(item.title, item);
                }
            });
        } catch (error) {
            console.error(`Error fetching or processing the JSON data from ${url}:`, error);
            continue;
        }
    }
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
