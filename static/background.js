/*
 * stuff to do:
 *
 * # listen to tab change event
 * # when tab is changed, get the number of requests and status of tabid and update browseraction
 *
 * # listen to webrequest onbeforerequestsent
 * # update tab db
 * # if tabid is activetabid, update browseraction
 *
 * eaaaasy!
 *
 * awal rocks
 */

const TAB_DB /*: { [tabId: number]: [number, number] } */ = new Map();

init();

function init() /*: void */ {
    const filter = { urls: ["<all_urls>"] };
    chrome.tabs.onActivated.addListener(onTabSwitch);
    chrome.webNavigation.onCommitted.addListener(resetTabState, filter);
    chrome.webRequest.onHeadersReceived.addListener(onHeaderReceived, filter, ["responseHeaders"]);
}

function onHeaderReceived(details) {
    var fileSize;
    details.responseHeaders.forEach(function(v, i, a) {
        if (v.name.toLowerCase() == 'content-length')
            fileSize = v.value;
    });
    if (!isNaN(fileSize) && +fileSize > 0) {
        incrementTabTimesAlreadyDone(details.tabId, +fileSize);
        conditionallyUpdateView(details.tabId);
    }
}


function onTabSwitch({ tabId /*: number */ }) /*: void */ {
    const tabData /*: [number, number] */ = getTabData(tabId);
    updateView(tabData);
}


function resetTabState({ tabId /*: number */ }) /*: void */ {
    const newTabState = [0, 0];
    TAB_DB.set(tabId, newTabState);
    conditionallyUpdateView(tabId);
}

function conditionallyUpdateView(tabId) {
    getCurrentlyViewedTabId()
        .then(function(activeTabId /*: number */ ) {
            if (activeTabId === tabId) {
                const tabData = getTabData(tabId);
                updateView(tabData);
            }
        });
}

function updateView([timesCurrentlyDoing /*: number */ , timesAlreadyDone /*: number */ ]) /*: void */ {
    let val = timesAlreadyDone;
    if (timesAlreadyDone < 1000000) {
        val = (timesAlreadyDone / 1000).toFixed(0) + 'K';
    } else if (timesAlreadyDone < 1000000000) {
        val = (timesAlreadyDone / 1000000).toFixed(0) + 'M';
    } else if (timesAlreadyDone < 1000000000000) {
        val = (timesAlreadyDone / 1000000000).toFixed(0) + 'G';
    } else {
        val = "TOO MUCH";
    }
    chrome.action.setBadgeText({
        text: val
    });
}

function getCurrentlyViewedTabId() /*: Promise<number> */ {
    return new Promise(function(resolve) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function([{ id /*: number */ }]) {
            resolve(id);
        });
    });
}

function getTabData(tabId /*: number */ ) /*: [number, number] */ {
    if (TAB_DB.has(tabId)) {
        return TAB_DB.get(tabId);
    }
    const tabData = [0, 0];
    TAB_DB.set(tabId, tabData);
    return tabData;
}


function incrementTabTimesAlreadyDone(tabId, fileSize) /*: void */ {
    const tabData /*: [number, number] */ = getTabData(tabId);
    tabData[1] += fileSize;
}