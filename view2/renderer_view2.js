$(function () {
  let allData = [];
  let lunrIndex;

  // JSON-Datei einlesen
  $.getJSON('longForm_Articles.json', function (data) {
    allData = data;
    lunrIndex = createLunrIndex(allData); 
    initializeData(allData);
  });

  // Funktion zur Integration einer neuen JSON-Datei
  function saveJsonDataToFile(data) {
    window.electronAPI.saveJsonFile2(data);
  }

  // Event Listener für Upload neuer JSON-Datei
  $('#triggerUpload').on('click', function () {
    $('#uploadJson').click();  // Simuliere Klick auf verstecktes Input-Feld
  });

  // Upload einer neuen JSON-Datei
  $('#uploadJson').on('change', function () {
    const fileInput = this;
    const file = fileInput.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const newData = JSON.parse(e.target.result);
          // Neue Daten mit alten Daten mergen
          allData = allData.concat(newData);

          // Lunr Tabelleneinträge indexieren (neue/alle Daten)
          lunrIndex = createLunrIndex(allData);

          // Alle Daten anzeigen
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

  // Lunr Tabelleneinträge indexieren (Token Generierung)
  function createLunrIndex(data) {
    return lunr(function () {
      this.ref('id');
      this.field('content');

      data.forEach(function (doc, idx) {
        this.add({
          id: idx,
          content: doc.content,
        });
      }, this);
    });
  }

  // JSTree, Tabelle, Buttons aufbauen
  function initializeData(data) {
    // Bisherige Daten löschen
    $('#jstree').jstree("destroy").empty();
    $('table tbody').empty();
    $('#category').empty();

    const categories = new Set();
    const treeData = [];
    const tableData = [];

    // Neuaufbau JSTree, Tabelle und Buttons
    data.forEach((item, index) => {
      // JSTree
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

      // Buttons (Category)
      categories.add(item.category);

      // Tabelle
      const tableRow = `
        <tr data-tag="${item.tag}">
          <td>${item.content}</td>
          <td style="display:none;">${item.title || ''}</td>
          <td style="display:none;">${item.url || ''}</td>
          <td style="display:none;">${item.created_at || item.date || ''}</td>
        </tr>`;
      tableData.push(tableRow);
    });

    // JSTree initialisieren
    $('#jstree').jstree({
      'core': {
        'data': treeData
      },
      // Aktiviert Plugin "Checkbox"
      "plugins": ["checkbox"]
    }).on('ready.jstree', function () {
      // Klappt im default alle Knoten aus
      $(this).jstree('open_all');
    });

    // Tabelle erzeugen
    $('table tbody').html(tableData.join(''));

    // Category-Buttons erzeugen
    const categoryButtons = Array.from(categories).map(category => `<button class="tablebutton">${category}</button></br>`);
    $('#category').html(categoryButtons.join(''));

    // Logik hinter Category-Buttons
    $('.tablebutton').on('click', function () {
      const selectedCategory = $(this).text();
      // Tabelle entsprechend filtern
      const filteredData = allData.filter(item => item.category === selectedCategory); 
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
      // JSTree Haken entfernen
      updateJsTree(filteredData);
      initializeObserver();
    });

    // Reset-Button
    $('button:contains("Reset")').on('click', function () {
      $('table tbody').html(tableData.join(''));
      $('#jstree').jstree('check_all');
      $('#jstree').jstree('open_all');
      initializeObserver();
    });

    // JSTree-Checkboxen: Tabelleinträge ein- und ausblenden
    $('#jstree').on("changed.jstree", function (e, data) {
      const selectedNodes = data.selected.map(nodeId => $('#jstree').jstree(true).get_node(nodeId).text);
      $('table tbody tr').each(function () {
        const rowTag = $(this).data('tag').split('/');
        const isVisible = rowTag.some(tag => selectedNodes.includes(tag));
        $(this).toggle(isVisible);
      });
      initializeObserver();
    });

    // IntersectionObserver zum ersten mal aufrufen
    initializeObserver();
  }

  // IntersectionObserver
  function initializeObserver() {
    //wird ausgeführt wenn ein neues Element sichtbar wird
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        // Wenn im Sichtfeld
        if (entry.isIntersecting) {
          // Zugehöriges JSTree-Element ermitteln
          const visibleTag = entry.target.dataset.tag;
          const jstreePath = visibleTag.split('/').join('_');
          const nodeId = findNodeIdByPath(jstreePath);

          if (nodeId) {
            const nodeElement = $('#' + nodeId + '_anchor');

            if (nodeElement.length) {
              // Alle JSTree-Elemente werden auf zurückgesetzt
              $('#jstree').find('.jstree-anchor').css("font-weight", "normal");
              // Aktuelles JSTree-Element wird fett gedruckt
              nodeElement.css("font-weight", "bold");
            }
          } 
        }
      });
    }, {
      // Es müssen 3% der Zeile sichtbar sein für einen Callback
      threshold: 0.03 
    });

    // Observer soll Tabellenzeilen überwachen
    $('table tbody tr').each(function() {
      observer.observe(this);
    });
  }

  // Finde NodeId auf Basis eines Pfads (wird für IntersectionObserver gebraucht)
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

// Lunr Suchfunktionalität
$('#search').on('input', function() {
  const searchTerm = $(this).val();

  // Stelle sicher, dass mindestens 2 Zeichen eingegeben wurden
  if (searchTerm.length >= 2) {
    // Suche ausführen
    const results = lunrIndex.search(searchTerm);
    // Über Ergebnisse iterieren & Tabellendaten filtern
    const filteredTableData = results.map(result => {
      const item = allData[result.ref];
      // Suchwort gelb markieren (via. html)
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
    // JSTree entsprechend anpassen 
    updateJsTree(results.map(result => allData[result.ref]));
    // Observer auf neue Tabelleninhalte einstellen
    initializeObserver(); 
  }
});

  // Funktion um Suchwort in der Ausgabe entsprechend zu markieren
  function highlightTerm(html, term) {
    
    // Suche nach Term (nicht innerhalb von HTML-Tags)
    const regex = new RegExp(`(${term})(?![^<>]*>)`, 'gi');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    // Rekursion notwendig wegen verschachtelten Tags (bspw.: <p><span>TEST</span></p>)
    function recursiveHighlight(node) {
      // Muss Text sein und kein HTML und nicht in IMG, ID oder HREF
      if (node.nodeType === 3) {
        if (!node.parentElement.closest('img') && (!node.parentElement.hasAttribute('id') || !node.parentElement.hasAttribute('href'))) {
          const match = node.nodeValue.match(regex);
          if (match) {
            // Falls ein Match gefunden -> highlighten
            const span = document.createElement('span');
            span.innerHTML = node.nodeValue.replace(regex, '<span class="highlight">$1</span>');
            node.parentNode.replaceChild(span, node);
          }
        }
      } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        for (let i = 0; i < node.childNodes.length; i++) {
          // Rekursiver Aufruf
          recursiveHighlight(node.childNodes[i]);
        }
      }
    }

    // Gesamter HTML-Inhalt über alle verschachtelungen durchsuchen (bspw.: <p><span>TEST</span></p>)
    for (let i = 0; i < tempDiv.childNodes.length; i++) {
      recursiveHighlight(tempDiv.childNodes[i]);
    }

    return tempDiv.innerHTML;
  }

  // JSTree an neue Datenbasis anpassen (Haken setzen/entfernen)
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
