let defaultItems;
const periods = [
  'w', // week
  'm', // month
  'q', // quarter
  'y', // year
  'y10', // decade
];

async function run() {
  const currentScript = document.currentScript
  const kind = currentScript.getAttribute('data-kind');
  const readQuery = currentScript.getAttribute('data-read-query') === 'true';
  if (!kind) return;

  const divs = document.querySelectorAll('div.graph')
  updateDivs(divs, 'data-kind', kind, kind)
  const query = new URLSearchParams(window.location.search);
  const dataName = query.get('dataName') || currentScript.getAttribute('data-name');
  if (dataName) {
    updateDivs(divs, 'data-name', dataName, kind)
    const title = document.querySelectorAll('h1')[0]
    if (kind === 'companies') {
      const company = (await loadCompanies()).filter(name => name === dataName)[0]
      if (company) {
        title.innerHTML = `${title.innerHTML} ${company}`;
      }
    } else if (kind === 'stack') {
      const stack = await loadStack(dataName)
      if (stack) {
        title.innerHTML = `${title.innerHTML} ${stack.name}`
      }
    } else if (kind === 'components') {
      const component = (await loadComponents()).filter(component => component.short === dataName)[0]
      if (component) {
        title.innerHTML = `${title.innerHTML} ${component.name} ${component.svg}`
        document.getElementById('itemLink').href = component.href
      }
    }
  }
  if (readQuery) {
    if (query.get('components')) updateDivs(divs, 'data-components', query.get('components'), kind);
    if (query.get('companies')) updateDivs(divs, 'data-companies', query.get('companies'), kind);
    if (query.get('stack')) updateDivs(divs, 'data-stack', query.get('stack'), kind);
    if (!query.get('data-periods')) updateDivs(divs, 'data-periods', periods.join(','), kind);
  }

  createMultipleSelectionList(kind).then(function (dropdown) {
    // Set selected companies by default
    dropdown.setValue(defaultItems)

    if (readQuery) {
      const selectedItems = Array.from(dropdown.listElements).filter(element => element.className.indexOf('active') !== -1).map(element => element.getAttribute('data-value'))
      if ((kind === 'companies' && query.get('components') && query.get('components').split(',').indexOf('all') === 0)
        || (kind === 'components' && query.get('companies') && query.get('companies').split(',').indexOf('all') === 0)) {
        selectedItems.splice(0, selectedItems.length)
        selectedItems.push('all')
        dropdown.empty()
      }
      if (selectedItems.length > 0) updateDivs(divs, kind === 'companies' ? 'data-components' : 'data-companies', selectedItems.join(','), kind)
    }
    updateGraphs(true) // keep comments for first graphs loading
  })
}

function updateDivs(divs, attribute, value, kind) {
  for (const div of divs) {
    const dataKind = div.getAttribute('data-kind')
    if (!kind || !dataKind || dataKind === kind) {
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
    if (selectedItems.length > 0) {
      const query = new URLSearchParams(window.location.search);
      query.set(kind === 'companies' ? 'components' : 'companies', selectedItems.join(','));
      window.history.pushState({}, '', window.location.href.split('?')[0] + '?' + query);
      updateDivs(document.querySelectorAll('div.graph'), kind === 'companies' ? 'data-components' : 'data-companies', selectedItems.join(','), kind);
      updateGraphs();
    }
  }

  return multipleSelection
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

run();
