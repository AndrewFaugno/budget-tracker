// create variable to hold db connection
let db;

// establish connection to indexdb database named 'budget_tracker' and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this will emit if the database version changes
request.onupgradeneeded = function(e) {
    const db = e.target.result;

    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon success
request.onsuccess = function(e) {
    db = e.target.result;

    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(e) {
    // log error here
    console.log(e.target.errorCode);
};

// this will be executed if an attempt to make a new transaction is made with no internet connection
function saveRecord(record) {
    // open transaction on db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    // access object store
    const transactionObjectStore = transaction.objectStore('new_transaction');

    // add record to store with add method
    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    const transactionObjectStore = transaction.objectStore('new_transaction');

    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        // if there was data in the indexdb then send it to api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                // open one last transaction to delete stored objects after they've been sent
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('new_transaction');
                transactionObjectStore.clear();

                alert('All transactions have been submitted!');
            })
            .catch(err => console.log(err));
        }
    };
}

window.addEventListener('Online', uploadTransaction);