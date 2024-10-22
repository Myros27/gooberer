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

let eventLinks = {
    'summerFestival': '',
    'nightHunt': '',
    'snowdown': '',
    'weatherChaos': '',
    'bloom': '',
    'cinders': '',
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

function showNextEvents(){
    const rootElement = document.getElementById('eventList');
    for (let index = 0; index < nextEvents.length; index++) {
        let nextEvent = nextEvents[index];
        const div = document.createElement("div");
        const nameContainer = document.createElement("p");
        const iconContainer = document.createElement("span");
        if (index === 0 && activeEvent){
            const spanContainer = document.createElement("span");
            spanContainer.innerText = "ACTIVE";
            spanContainer.style.alignItems = "center";
            spanContainer.style.justifyContent = "center";
            div.appendChild(spanContainer);
        }
        iconContainer.style.fontSize = "2rem";
        iconContainer.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 1)";
        iconContainer.style.display = "flex";
        iconContainer.style.alignItems = "center";
        iconContainer.style.justifyContent = "center";
        iconContainer.classList.add("mdi");
        iconContainer.classList.add(eventSymbols[nextEvent.name])
        nameContainer.innerText = nextEvent.name;
        nameContainer.style.padding = "0";
        nameContainer.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 1)";
        nameContainer.style.display = "flex";
        nameContainer.style.alignItems = "center";
        nameContainer.style.justifyContent = "center";
        div.appendChild(iconContainer);
        div.appendChild(nameContainer);
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