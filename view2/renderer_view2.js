$(function () {
  let allData = [];
  let lunrIndex;

  // Load JSON data
  $.getJSON('longForm_Articles.json', function (data) {
    allData = data;
    lunrIndex = createLunrIndex(allData);  // Initialisiere den Lunr.js Index
    initializeData(allData);
  });

  // Funktion zum Speichern der JSON-Daten über Electron
  function saveJsonDataToFile(data) {
    window.electronAPI.saveJsonFile2(data);
  }

  // Event Listener für den Trigger-Button in View 2
  $('#triggerUpload').on('click', function () {
    $('#uploadJson').click();  // Simuliere Klick auf das versteckte Input-Feld
  });

  // Event Listener für den eigentlichen Upload in View 2
  $('#uploadJson').on('change', function () {
    const fileInput = this;
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const newData = JSON.parse(e.target.result);
          // Merge the new data with the existing data
          allData = allData.concat(newData);

          // Reinitialize Lunr Index with new data
          lunrIndex = createLunrIndex(allData);

          // Reinitialize the display with the merged data
          initializeData(allData);

          saveJsonDataToFile(allData);
        } catch (err) {
          alert('Error parsing JSON:\n' + err.message);
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please select a file.');
    }
  });


  function createLunrIndex(data) {
    return lunr(function () {
      this.ref('id');
      this.field('title');
      this.field('content');
      this.field('category');

      data.forEach(function (doc, idx) {
        this.add({
          id: idx,
          title: doc.title,
          content: doc.content,
          category: doc.category
        });
      }, this);
    });
  }

  function initializeData(data) {
    // Clear previous data
    $('#jstree').jstree("destroy").empty();
    $('table tbody').empty();
    $('#category').empty();

    // Rebuild tree, table, and category buttons
    const categories = new Set();
    const treeData = [];
    const tableData = [];

    data.forEach((item, index) => {
      // Build jsTree data structure
      const tagParts = item.tag.split('/');
      let currentLevel = treeData;
      tagParts.forEach((part, index) => {
        let existingNode = currentLevel.find(node => node.text === part);
        if (!existingNode) {
          existingNode = { text: part, children: [], state: { opened: true, selected: true } };
          currentLevel.push(existingNode);
        }
        currentLevel = existingNode.children;
      });

      // Collect categories
      categories.add(item.category);

      // Build table data
      const tableRow = `
        <tr data-tag="${item.tag}">
          <td>${item.content}</td>
          <td style="display:none;">${item.title || ''}</td>
          <td style="display:none;">${item.url || ''}</td>
          <td style="display:none;">${item.created_at || item.date || ''}</td>
        </tr>`;
      tableData.push(tableRow);
    });

    // Initialize jsTree
    $('#jstree').jstree({
      'core': {
        'data': treeData
      },
      "plugins": ["checkbox"]
    }).on('ready.jstree', function () {
      $(this).jstree('open_all');
    });

    // Populate table
    $('table tbody').html(tableData.join(''));

    // Create category buttons
    const categoryButtons = Array.from(categories).map(category => `<button class="tablebutton">${category}</button></br>`);
    $('#category').html(categoryButtons.join(''));

    // Bind events to category buttons
    $('.tablebutton').on('click', function () {
      const selectedCategory = $(this).text();
      const filteredData = allData.filter(item => item.category === selectedCategory); // use allData instead of data
      const filteredTableData = filteredData.map(item => {
        return `
          <tr data-tag="${item.tag}">
            <td>${item.content}</td>
            <td style="display:none;">${item.title || ''}</td>
            <td style="display:none;">${item.url || ''}</td>
            <td style="display:none;">${item.created_at || item.date || ''}</td>
          </tr>`;
      });
      $('table tbody').html(filteredTableData.join(''));
      updateJsTree(filteredData);
      initializeObserver();
    });

    // Reset button
    $('button:contains("Reset")').on('click', function () {
      $('table tbody').html(tableData.join(''));
      $('#jstree').jstree('check_all');
      $('#jstree').jstree('open_all');
      initializeObserver();
    });

    // Update table visibility based on jsTree changes
    $('#jstree').on("changed.jstree", function (e, data) {
      const selectedNodes = data.selected.map(nodeId => $('#jstree').jstree(true).get_node(nodeId).text);
      $('table tbody tr').each(function () {
        const rowTag = $(this).data('tag').split('/');
        const isVisible = rowTag.some(tag => selectedNodes.includes(tag));
        $(this).toggle(isVisible);
      });
      initializeObserver();
    });

    // Initialize observer for the first time
    initializeObserver();
  }

  // IntersectionObserver initialization
  function initializeObserver() {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const visibleTag = entry.target.dataset.tag;
          const jstreePath = visibleTag.split('/').join('_');
          const nodeId = findNodeIdByPath(jstreePath);

          if (nodeId) {
            const nodeElement = $('#' + nodeId + '_anchor');

            if (nodeElement.length) {
              // Reset all other nodes to normal font-weight
              $('#jstree').find('.jstree-anchor').css("font-weight", "normal");
              nodeElement.css("font-weight", "bold");
            }
          } else {
            console.warn("Node ID not found for path:", jstreePath);
          }
        }
      });
    }, {
      threshold: 0.03 // 3% of the row must be visible
    });

    // Unobserve all existing elements before re-observing
    $('table tbody tr').each(function() {
      observer.observe(this);
    });
  }

  // Find NodeId by Path (used in Observer)
  function findNodeIdByPath(path) {
    const tree = $('#jstree').jstree(true);
    let foundNodeId = null;

    tree.get_json('#', { flat: true }).forEach(node => {
      const nodePath = tree.get_path(node.id, '_');

      if (nodePath === path) {
        foundNodeId = node.id;
      }
    });

    return foundNodeId;
  }

  // Initialize observer for the first time
  initializeObserver();

  // Search functionality
  $('#search').on('input', function() {
    const searchTerm = $(this).val();

    if (searchTerm) {
      const results = lunrIndex.search(searchTerm);
      const filteredTableData = results.map(result => {
        const item = allData[result.ref];
        const highlightedContent = highlightTerm(item.content, searchTerm);

        return `
          <tr data-tag="${item.tag}">
            <td>${highlightedContent}</td>
            <td style="display:none;">${item.title || ''}</td>
            <td style="display:none;">${item.url || ''}</td>
            <td style="display:none;">${item.created_at || item.date || ''}</td>
          </tr>`;
      });
      $('table tbody').html(filteredTableData.join(''));
      updateJsTree(results.map(result => allData[result.ref]));
      initializeObserver(); 
    } else {
      $('table tbody').html(tableData.join(''));
      $('#jstree').jstree('check_all');
      $('#jstree').jstree('open_all');
      initializeObserver(); 
    }
  });

  // Function to highlight the search term in the content
  function highlightTerm(html, term) {
    const regex = new RegExp(`(${term})(?![^<>]*>)`, 'gi');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    function recursiveHighlight(node) {
      if (node.nodeType === 3) {
        if (!node.parentElement.closest('img') && (!node.parentElement.hasAttribute('id') || !node.parentElement.hasAttribute('href'))) {
          const match = node.nodeValue.match(regex);
          if (match) {
            const span = document.createElement('span');
            span.innerHTML = node.nodeValue.replace(regex, '<span class="highlight">$1</span>');
            node.parentNode.replaceChild(span, node);
          }
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        for (let i = 0; i < node.childNodes.length; i++) {
          recursiveHighlight(node.childNodes[i]);
        }
      }
    }

    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      recursiveHighlight(tempDiv.childNodes[i]);
    }

    return tempDiv.innerHTML;
  }

  // Function to update jsTree based on filtered data
  function updateJsTree(filteredData) {
    const tags = filteredData.map(item => item.tag);
    $('#jstree').jstree('uncheck_all');

    tags.forEach(tag => {
      const tagParts = tag.split('/');
      let nodeId = '#';
      tagParts.forEach(part => {
        const node = $('#jstree').jstree('get_node', nodeId).children.find(childId => {
          return $('#jstree').jstree('get_node', childId).text === part;
        });
        if (node) {
          nodeId = node;
        }
      });
      $('#jstree').jstree('check_node', nodeId);
    });
    $('#jstree').jstree('open_all', nodeId);
  }
});
