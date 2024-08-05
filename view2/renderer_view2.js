$(function () {
  // Load JSON data
  $.getJSON('longForm_Articles.json', function(data) {
    // Process JSON data
    const categories = new Set();
    const treeData = [];
    const tableData = [];

    // Lunr.js index
    const lunrIndex = lunr(function () {
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
    });

    // Populate table
    $('table tbody').html(tableData.join(''));

    // Create category buttons
    const categoryButtons = Array.from(categories).map(category => `<button class="tablebutton">${category}</button></br>`);
    $('#category').html(categoryButtons.join(''));

    // Bind events to category buttons
    $('.tablebutton').on('click', function() {
      const selectedCategory = $(this).text();
      const filteredData = data.filter(item => item.category === selectedCategory);
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
    });

    // Reset button
    $('button:contains("Reset")').on('click', function() {
      $('table tbody').html(tableData.join(''));
      $('#jstree').jstree('check_all');
      $('#jstree').jstree('open_all');
    });

    // Update table visibility based on jsTree changes
    $('#jstree').on("changed.jstree", function (e, data) {
      const selectedNodes = data.selected.map(nodeId => $('#jstree').jstree(true).get_node(nodeId).text);
      $('table tbody tr').each(function() {
        const rowTag = $(this).data('tag').split('/');
        const isVisible = rowTag.some(tag => selectedNodes.includes(tag));
        $(this).toggle(isVisible);
      });
    });

    // Function to highlight the search term in the content
    /*function highlightTerm(html, term) {
      const regex = new RegExp(`(${term})`, 'gi');
      return html.replace(regex, '<span class="highlight">$1</span>');
    }*/

      // Function to highlight the search term in the content
    function highlightTerm(html, term) {
      const regex = new RegExp(`(${term})(?![^<>]*>)`, 'gi');

      // Create a temporary DOM element to hold the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Function to recursively highlight text nodes
      function recursiveHighlight(node) {
        if (node.nodeType === 3) { // Node is a text node
          if (!node.parentElement.closest('img') && ( !node.parentElement.hasAttribute('id') || !node.parentElement.hasAttribute('href') ) ) {
            // Only highlight if the parent is not an anchor, image or has an ID attribute
            const match = node.nodeValue.match(regex);
            if (match) {
              const span = document.createElement('span');
              span.innerHTML = node.nodeValue.replace(regex, '<span class="highlight">$1</span>');
              node.parentNode.replaceChild(span, node);
            }
          }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
          // Recurse for element nodes, but skip script and style tags
          for (let i = 0; i < node.childNodes.length; i++) {
            recursiveHighlight(node.childNodes[i]);
          }
        }
      }

      // Start the recursive highlighting from the temporary div's children
      for (let i = 0; i < tempDiv.childNodes.length; i++) {
        recursiveHighlight(tempDiv.childNodes[i]);
      }

      return tempDiv.innerHTML;
    }


    // Search functionality
    $('#search').on('input', function() {
      const searchTerm = $(this).val();
      if (searchTerm) {
        const results = lunrIndex.search(searchTerm);
        const filteredTableData = results.map(result => {
          const item = data[result.ref];
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
      } else {
        $('table tbody').html(tableData.join(''));
      }
    });
  });
});
