var save;
var parameters = {};

function createAndAppendElement(parent, elementType, id, classes = [], position = 'end', sibling = null, hidden = false, href, rel, type) {
    const element = document.createElement(elementType);
    if (id) {
        element.id = id;
    }
    if (typeof classes === 'string' && classes !== '') {
        element.classList.add(classes);
    } else if (Array.isArray(classes) && classes.length > 0) {
        element.classList.add(...classes);
    }
    if (hidden) {
        element.hidden = true;
    }
    if (href) {
        element.href = href;
    }
    if (rel) {
        element.rel = rel;
    }
    if (type) {
        element.type = type;
    }
    if (position === 'start') {
    parent.insertBefore(element, parent.firstChild);
    } else if (position === 'after' && sibling) {
        sibling.insertAdjacentElement('afterend', element);
    } else {
        parent.appendChild(element);
    }
    return element;
}

async function generateMenu(jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        const data = await response.json();
        const tabList = document.getElementById("tabList");
        data.menuItems.forEach(item => {
            const button = document.createElement("button");
            button.classList.add("tablinks");
            if (item.icon) {
                const icon = document.createElement("i");
                icon.classList.add("mdi", item.icon);
                button.appendChild(icon);
            }
            const link = document.createElement("a");
            link.href = item.link;
            link.textContent = item.title;
            button.appendChild(link);
            tabList.appendChild(button);
        });
        let resetAll = createAndAppendElement(tabList, 'button', 'completeReset', 'tablinks', 'start', null, '')
        resetAll.setAttribute('onclick', 'resetAll()');
    } catch (error) {
        console.error("Error fetching or processing the JSON data:", error);
    }
}

function createAllHtmlElements(){
    createAndAppendElement(document.head, 'link', '', '', 'start', null, '','https://myros27.github.io/gooberer/favicon.ico','shortcut icon','image/x-icon')
    const saveInput = createAndAppendElement(document.body, 'input', 'mySaveFile', '', 'start', null, 'true', '', '', 'file')
    saveInput.setAttribute('oninput', 'uploadFile()');
    saveInput.style.color = '#FFFFFF';
    const tablist = createAndAppendElement(document.body, 'div', 'tabList', 'tab', 'after', saveInput, 'true')
    generateMenu("https://myros27.github.io/gooberer/1.5/menu/menu.json");
}

createAllHtmlElements()

function addStyles() {
    const style = document.createElement('style');
    style.type = 'text/css';
    const cssStyles = `
    body {
        background-color: #121212;
        color: white;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
    }
    
    a {
        color: white;
        text-decoration: underline;
    }
    
    p {
        margin-bottom: 10px;
    }
    
    .tab {
        overflow: hidden;
        border: 1px solid #222;
        color: #FFF
    }
    
    .tab button {
        background-color: inherit;
        float: left;
        border: none;
        outline: none;
        cursor: pointer;
        padding: 14px 16px;
        transition: 0.3s;
        color: #FFF
    }
    
    .tab button:hover {
        background-color: #333;
        color: #FFF
    }
    
    .tab button.active {
        background-color: #333;
        color: #FFF
    }
    
    .tabcontent {
        display: none;
        padding: 6px 12px;
        border: 1px solid #333;
        border-top: none;
    }
    `;
    style.appendChild(document.createTextNode(cssStyles));
    document.head.appendChild(style);
}

addStyles();

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
        sessionStorage.setItem('saveFromSession', JSON.stringify(save));
        document.getElementById("tabList").removeAttribute("hidden")
        document.getElementById("mySaveFile").hidden = true
        feature()
        }
    }
}

function resetAll(){
    sessionStorage.clear();
    window.location.reload(true);
}

window.addEventListener('load', function () {
    const urlParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlParams.entries()) {
        parameters[key] = value;
    }
    if (Object.keys(parameters).length > 0) {
        //themes?
    } else {
        const saveFromSession = sessionStorage.getItem('saveFromSession');
        if (saveFromSession === null){
            document.getElementById("mySaveFile").removeAttribute("hidden")
        } else {
            save = JSON.parse(saveFromSession)
            document.getElementById("tabList").removeAttribute("hidden")
            document.getElementById("mySaveFile").hidden = true
            feature()
        }
    }
})

window.addEventListener('message', function(event) {
    debugger;
    save = JSON.parse(atob(event.data));
    feature()
});



