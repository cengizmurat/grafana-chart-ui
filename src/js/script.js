let defaultItems;
const periods = [
  'w', // week
  'm', // month
  'q', // quarter
  'y', // year
  'y10', // decade
];

async function run() {
  const kind = document.currentScript.getAttribute('data-kind');
  if (!kind) return;

  const divs = document.querySelectorAll('div.graph')
  updateDivs(divs, 'data-kind', kind);
  const query = new URLSearchParams(window.location.search);
  const dataName = query.get('dataName');
  if (dataName) {
    updateDivs(divs, 'data-name', dataName)
    const title = document.getElementById('itemName')
    if (kind === 'companies') {
      const company = (await loadCompanies()).filter(name => name === dataName)[0]
      if (company) {
        title.innerHTML = company;
      }
    } else if (kind === 'stacks') {
      const stack = await loadStack(dataName)
      if (stack) {
        title.innerHTML = stack.name
      }
    } else if (kind === 'components') {
      const component = (await loadComponents()).filter(component => component.short === dataName)[0]
      if (component) {
        title.innerHTML = component.name
        title.parentElement.innerHTML += component.svg
        document.getElementById('itemLink').href = component.href
      }
    }
  }
  if (query.get('components')) updateDivs(divs, 'data-components', query.get('components'));
  if (query.get('companies')) updateDivs(divs, 'data-companies', query.get('companies'));
  if (query.get('stack')) updateDivs(divs, 'data-stack', query.get('stack'));
  updateDivs(divs, 'data-periods', periods.join(','));

  createMultipleSelectionList(kind).then(function (dropdown) {
    // Set selected companies by default
    dropdown.setValue(defaultItems)

    const selectedItems = Array.from(dropdown.listElements).filter(element => element.className.indexOf('active') !== -1).map(element => element.getAttribute('data-value'))
    if (selectedItems.length > 0) updateGraphs(selectedItems)
  })
}

function updateDivs(divs, attribute, value) {
  for (const div of divs) {
    const data = div.getAttribute(attribute)
    if (!data) {
      div.setAttribute(attribute, value)
    }
  }
}

async function createMultipleSelectionList(kind) {
  const label = document.createElement('label')
  label.setAttribute('class', 'selectLabel')
  label.innerHTML = kind === 'companies' ? 'Components :' : 'Companies :'

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

  let items = [];
  if (kind === 'companies') items = await componentsCallback();
  else items = await companiesCallback();
  for (const item of items) {
    const option = document.createElement('option')
    option.setAttribute('value', item.short || item)
    option.innerHTML = item.name || item
    select.append(option)
  }

  multipleSelection.destroy()
  selectionOptions.placeHolder = 'Select item';
  multipleSelection = new vanillaSelectBox("#select", selectionOptions);

  button.onclick = function (event) {
    const selectedItems = Array.from(multipleSelection.listElements).filter(element => element.className.indexOf('active') !== -1).map(element => element.getAttribute('data-value'));
    const query = new URLSearchParams(window.location.search);
    query.set(kind === 'companies' ? 'components' : 'companies', selectedItems.join(','));
    window.history.pushState({}, '', window.location.href.split('?')[0] + '?' + query);
    if (selectedItems.length > 0) {
      updateGraphs(selectedItems)
    }
  }

  return multipleSelection
}

async function loadComponents() {
  const components = await callApi('GET', `https://grafana-chart-dev.apps.c1.ocp.dev.sgcip.com/components`)
  components.sort(sortByName) // Sort alphabetically

  return components
}

async function loadCompanies() {
  const companies = await callApi('GET', `https://grafana-chart-dev.apps.c1.ocp.dev.sgcip.com/companies`)
  companies.sort(sortByName) // Sort alphabetically

  return companies
}

async function loadStack(name) {
  return await callApi('GET', `https://grafana-chart-dev.apps.c1.ocp.dev.sgcip.com/stacks/${name}/details`)
}

async function componentsCallback() {
  const query = new URLSearchParams(window.location.search)
  const queryStack = query.get('stack');
  const queryComponents = query.get('components');
  if (queryStack) {
    try {
      const stackData = await loadStack(queryStack);
      defaultItems = stackData.components;
    } catch (e) {
      defaultItems = [];
    }
  } else if (queryComponents) {
    defaultItems = queryComponents.split(',');
  } else {
    defaultItems = [];
  }

  return await loadComponents();
}

async function companiesCallback() {
  const query = new URLSearchParams(window.location.search)
  const queryCompanies = query.get('companies');
  if (queryCompanies) {
    defaultItems = queryCompanies.split(',');
  } else {
    defaultItems = [];
  }

  return await loadCompanies();
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

function sortByName(a, b) {
  const aName = (a.name || a).toLowerCase();
  const bName = (b.name || b).toLowerCase();

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

run();