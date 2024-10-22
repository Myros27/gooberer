var save;
var settings;
var nextEvents;
var activeEvent = false
var parameters = new URLSearchParams(document.location.search)

let eventSymbols = {
    'casino': 'mdi-slot-machine',
    'bank': 'mdi-bank',
    'merchant': 'mdi-account-tie',
    'summerFestival': 'mdi-island',
    'nightHunt': 'mdi-weather-night',
    'snowdown': 'mdi-snowflake',
    'weatherChaos': 'mdi-weather-lightning-rainy',
    'bloom': 'mdi-flower-poppy',
    'cinders': 'mdi-lightbulb-on',
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

const jsonUrlsArray = [
    "https://myros27.github.io/gooberer/1.5/items.json",
    "https://craftyduck100.github.io/gooberer/1.5/items.json",
    "https://sashkara.github.io/gooberer/1.5/items.json",
];

async function generateEventMenu() {
    const eventItemsMap = await fetchEventItems(jsonUrlsArray);
    createEventMenu(eventItemsMap);
}

async function fetchEventItems(urls) {
    const eventItemsMap = new Map();
    const fetchPromises = urls.map(url => fetchEventData(url, eventItemsMap));
    await Promise.all(fetchPromises);
    if (eventItemsMap.size === 0) {
        console.warn("No event items were fetched from any of the provided URLs.");
    }
    return eventItemsMap;
}

async function fetchEventData(url, eventItemsMap) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.statusText}`);
            return;
        }
        const data = await response.json();
        processEventData(data, eventItemsMap, url);
    } catch (error) {
        console.error(`Error fetching or processing the JSON data from ${url}:`, error);
    }
}

function processEventData(data, eventItemsMap, originalUrl) {
    const baseUrl = originalUrl.substring(0, originalUrl.lastIndexOf('/'));
    const urlPriority = jsonUrlsArray.indexOf(originalUrl);
    data.eventItems.forEach(item => {
        let itemTitle = item.title;
        if (!item.released && settings.devMode) {
            itemTitle = `dev-${item.title}`;
        }
        if (!item.released && !settings.devMode) return;
        item.link = `${baseUrl}/${item.link}`;
        const existingItem = eventItemsMap.get(itemTitle);
        if (!existingItem) {
            item.priority = urlPriority;
            eventItemsMap.set(itemTitle, item);
        } else if (item.version > existingItem.version) {
            item.priority = urlPriority;
            eventItemsMap.set(itemTitle, item);
        } else if (item.version === existingItem.version && urlPriority < existingItem.priority) {
            item.priority = urlPriority;
            eventItemsMap.set(itemTitle, item);
        }
    });
}

function createEventMenu(eventItemsMap) {
    const tabList = document.getElementById("tabList");
    const iframe = document.getElementById("eventIframe");
    const eventList = document.getElementById("eventList");
    let activeButton = null;
    const nextEventsButton = document.createElement("button");
    nextEventsButton.classList.add("tablinks");
    nextEventsButton.textContent = "Next Events";
    nextEventsButton.style.backgroundColor = "#333";
    activeButton = nextEventsButton;
    nextEventsButton.addEventListener('click', () => {
        if (activeButton) activeButton.style.backgroundColor = "";
        nextEventsButton.style.backgroundColor = "#333";
        activeButton = nextEventsButton;
        iframe.style.display = "none";
        eventList.style.display = "block";
    });
    tabList.appendChild(nextEventsButton);
    eventItemsMap.forEach(item => {
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
            if (activeButton) activeButton.style.backgroundColor = "";
            button.style.backgroundColor = "#333";
            activeButton = button;
            eventList.style.display = "none";
            iframe.style.display = "block";
            iframe.src = item.link;
            document.title = `Gooberer Events - ${item.title}`;
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

generateEventMenu();

function feature() {
    let thisMonth = returnNextEvents(0);
    let nextMonth = returnNextEvents(1);
    let futureMonth = returnNextEvents(2);
    const now = new Date();
    nextEvents = thisMonth.concat(nextMonth, futureMonth)
        .filter((event, index, self) =>
            index === self.findIndex(e => e.name === event.name && e.start.getTime() === event.start.getTime())
        )
        .filter(event => event.end > now);
    nextEvents.sort((a, b) => a.start - b.start);
    if (nextEvents.length > 0) {
        if (nextEvents[0].start <= now && nextEvents[0].end >= now) {
            activeEvent = true;
        }
    }
    showNextEvents();
}

function showNextEvents() {
    const rootElement = document.getElementById('eventList');
    rootElement.innerHTML = '';
    for (let index = 0; index < nextEvents.length; index++) {
        let nextEvent = nextEvents[index];
        const div = document.createElement("div");
        div.style.margin = "1rem";
        div.style.border = "1px solid #555";
        div.style.borderRadius = "10px";
        div.style.padding = "1rem";
        div.style.backgroundColor = "#2c2c2c";
        div.style.display = "flex";
        div.style.flexDirection = "column";
        div.style.alignItems = "center";
        div.style.boxShadow = "2px 2px 8px rgba(0, 0, 0, 0.6)";
        div.style.transition = "background-color 0.3s ease";
        const nameContainer = document.createElement("p");
        const iconContainer = document.createElement("span");
        if (index === 0 && activeEvent) {
            const spanContainer = document.createElement("span");
            spanContainer.innerText = "ACTIVE";
            spanContainer.style.backgroundColor = "#ffdd57";
            spanContainer.style.padding = "0.2rem 0.5rem";
            spanContainer.style.borderRadius = "5px";
            spanContainer.style.fontWeight = "bold";
            spanContainer.style.color = "#333";
            div.appendChild(spanContainer);
        }
        iconContainer.style.fontSize = "2rem";
        iconContainer.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.6)";
        iconContainer.style.display = "flex";
        iconContainer.style.alignItems = "center";
        iconContainer.style.justifyContent = "center";
        iconContainer.classList.add("mdi", eventSymbols[nextEvent.name]);
        nameContainer.innerText = nextEvent.name.charAt(0).toUpperCase() + nextEvent.name.slice(1);
        nameContainer.style.padding = "0";
        nameContainer.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.6)";
        nameContainer.style.fontWeight = "bold";
        nameContainer.style.fontSize = "1.2rem";
        nameContainer.style.textAlign = "center";
        nameContainer.style.color = "#fff";
        const dateContainer = document.createElement("p");
        const startDate = new Date(nextEvent.start).toLocaleDateString();
        const endDate = new Date(nextEvent.end).toLocaleDateString();
        dateContainer.innerText = `From: ${startDate} To: ${endDate}`;
        dateContainer.style.color = "#bbb";
        dateContainer.style.fontSize = "0.9rem";
        dateContainer.style.margin = "0.5rem 0";
        const lowerCaseName = nextEvent.name.toLowerCase();
        const correspondingTab = [...document.getElementsByClassName('tablinks')].find(tab =>
            tab.textContent.trim().toLowerCase().includes(lowerCaseName)
        );
        if (correspondingTab) {
            div.style.cursor = "pointer";
            div.addEventListener('click', () => {
                correspondingTab.click();
            });
            div.addEventListener('mouseover', () => {
                div.style.backgroundColor = "#444";
            });
            div.addEventListener('mouseout', () => {
                div.style.backgroundColor = "#2c2c2c";
            });
        }
        div.appendChild(iconContainer);
        div.appendChild(nameContainer);
        div.appendChild(dateContainer);
        rootElement.appendChild(div);
    }
}



function returnNextEvents(nextMonth = 0) {
    let arr = [];
    let small = ["merchant", "casino", "bank"];
    const big = JSON.parse('{"cinders":{"start":"01-15","end":"02-03","color":"amber","currency":"wax","token":"cindersToken"},' +
        '"bloom":{"start":"03-09","end":"03-31","color":"light-green","currency":"humus","token":"bloomToken"},' +
        '"weatherChaos":{"start":"05-22","end":"06-08","color":"grey","currency":"cloud","token":"weatherChaosToken"},' +
        '"summerFestival":{"start":"07-26","end":"08-22","color":"orange-red","currency":"cocktail","token":"summerFestivalToken"},' +
        '"nightHunt":{"start":"10-04","end":"10-19","color":"deep-purple","currency":"magic","token":"nightHuntToken"},' +
        '"snowdown":{"start":"11-25","end":"12-15","color":"skyblue","currency":"snowball","token":"snowdownToken"}}')
    let now = new Date();
    now.setMonth(now.getMonth() + nextMonth);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const min = new Date(now.getFullYear(), now.getMonth(), 1);
    const max = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const firstDay = new Date(min.setDate(min.getDate() - (min.getDay() === 0 ? 6 : min.getDay() - 1)));
    const lastDay = new Date(max.setDate(max.getDate() - (max.getDay() === 0 ? 6 : max.getDay() - 1) + 6));
    for (const [key, elem] of Object.entries(big)) {
        if (month >= parseInt(elem.start.substring(0, 2)) && month <= parseInt(elem.end.substring(0, 2))) {
            arr.push({
                name: key,
                color: elem.color,
                start: new Date(`${year}-${elem.start}T00:00:00`),
                end: new Date(`${year}-${elem.end}T23:59:59`)
            });
        }
    }
    let timestamp = getDay(firstDay);
    let weeks = [];
    while (new Date(`${timestamp}T00:00:00`) <= lastDay) {
        weeks.push(timestamp);
        let newDate = new Date(`${timestamp}T00:00:00`);
        newDate.setDate(newDate.getDate() + 7);
        timestamp = getDay(newDate);
    }
    weeks.forEach(week => {
        let startCompare = new Date(`${week}T00:00:00`);
        startCompare.setDate(startCompare.getDate() + 4);
        let startDate = new Date(`${week}T00:00:00`);
        startDate.setDate(startDate.getDate() + 5);
        let endCompare = new Date(`${week}T23:59:59`);
        endCompare.setDate(endCompare.getDate() + 7);
        let endDate = new Date(`${week}T23:59:59`);
        endDate.setDate(endDate.getDate() + 6);
        if (arr.findIndex(el => el.start <= endCompare && el.end >= startCompare) === -1) {
            arr.push({
                name: small[getWeek(startDate) % small.length],
                start: startDate,
                end: endDate
            });
        }
    });
    return arr;
}