let defaultCompanies;
const times = [
  {
    short: 'w',
    long: 'week',
  },
  {
    short: 'm',
    long: 'month',
  },
  {
    short: 'q',
    long: 'quarter',
  },
  {
    short: 'y',
    long: 'year',
  },
  {
    short: 'y10',
    long: 'decade',
  },
]

function updateDivs() {
  const query = new URLSearchParams(window.location.search)
  const name = query.get('dataName');
  if (!name) return;

  const divs = document.querySelectorAll('div.graph')
  for (const div of divs) {
    const dataName = div.getAttribute('data-name')
    if (!dataName) {
      div.setAttribute('data-name', name)
    }
  }
}

updateDivs();

createMultipleSelectionList().then(function (dropdown) {
  // Set selected companies by default
  dropdown.setValue(defaultCompanies)

  const selectedCompanies = Array.from(dropdown.listElements).filter(element => element.className.indexOf('active') !== -1).map(element => element.getAttribute('data-value'))
  if (selectedCompanies.length > 0) updateGraphs(selectedCompanies)
})

async function createMultipleSelectionList() {
  const label = document.createElement('label')
  label.setAttribute('class', 'selectLabel')
  label.innerHTML = 'Companies :'

  const select = document.createElement('select')
  select.setAttribute('id', 'select')
  select.setAttribute('multiple', '')
  select.setAttribute('size', '1')

  const button = document.createElement('button')
  button.innerHTML = 'Update'

  const div = document.getElementById('selection')
  div.append(label)
  div.append(select)
  div.append(button)

  const selectionOptions = {
    search: true,
    maxHeight: 400,
    disableSelectAll: true,
    placeHolder: 'Loading...',
  }
  let multipleSelection = new vanillaSelectBox("#select", selectionOptions);

  const query = new URLSearchParams(window.location.search)
  const queryCompanies = query.get('companies');
  if (queryCompanies) {
    defaultCompanies = queryCompanies.split(',');
  } else {
    defaultCompanies = [];
  }

  const companies = await loadCompanies()
  for (const company of companies) {
    const option = document.createElement('option')
    option.setAttribute('value', company)
    option.innerHTML = company
    select.append(option)
  }

  multipleSelection.destroy()
  selectionOptions.placeHolder = 'Select item';
  multipleSelection = new vanillaSelectBox("#select", selectionOptions);

  button.onclick = function (event) {
    const selectedCompanies = Array.from(multipleSelection.listElements).filter(element => element.className.indexOf('active') !== -1).map(element => element.getAttribute('data-value'))
    const query = new URLSearchParams(window.location.search);
    query.set('companies', selectedCompanies.join(','));
    window.history.pushState({}, '', window.location.href.split('?')[0] + '?' + query);
    updateGraphs(selectedCompanies)
  }

  return multipleSelection
}

function sortByName(a, b) {
  const aName = a.toLowerCase();
  const bName = b.toLowerCase();

  if (aName === bName) return 0;

  const aLatin = isLatinLetter(aName[0]);
  const bLatin = isLatinLetter(bName[0]);

  if (aLatin && !bLatin) return -1;
  else if (!aLatin && bLatin) return 1;

  return aName < bName ? -1 : 1;
}

function isLatinLetter(letter) {
  return letter.toUpperCase() !== letter.toLowerCase()
}

async function loadCompanies() {
  const companies = await callApi('GET', `https://grafana-chart.apps.c1.ocp.dev.sgcip.com/companies`)
  companies.sort(sortByName) // Sort alphabetically

  return companies
}

async function callApi(method, url, data) {
  // Default options are marked with *
  const config = {
    method: method, // *GET, POST, PUT, DELETE, etc.
    /*
    mode: 'no-cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    */
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      //'Access-Control-Allow-Origin': '*',
      //'Connection': 'keep-alive',
      //'Host': 'k8s.devstats.cncf.io',
      //'Acept-Encoding': 'gzip, deflate, br',
      //'USer-Agent': 'PostmanRuntime/7.26.8',
    },
    /*
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'strict-origin-when-cross-origin', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    */
  };

  if (data) config.body = JSON.stringify(data);

  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error("HTTP status " + response.status);
  }

  return response.json(); // parses JSON response into native JavaScript objects
}