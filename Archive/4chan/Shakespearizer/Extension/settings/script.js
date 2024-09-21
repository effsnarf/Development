
const init = function() {
    // Get the saved apiKey
    chrome.storage.sync.get('apiKey', function(items) {
        document.getElementById('apiKey').value = (items.apiKey||'');
    });

    // When document.getElementById('apiKey') value changes, save it to chrome.storage
    document.getElementById('apiKey').addEventListener('change', function() {
        var apiKey = document.getElementById('apiKey').value;
        chrome.storage.sync.set({'apiKey': apiKey});
    });

    // When apiKey value changes (while typing)
    document.getElementById('apiKey').addEventListener('input', function() {
        document.getElementById('refreshMessage').classList.remove('hidden');
    });
};

// When the popup HTML has loaded
window.addEventListener('load', function(evt) {
    init();
});

