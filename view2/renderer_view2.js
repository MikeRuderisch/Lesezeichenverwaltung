$(function () {
  // Load JSON data
  $.getJSON('longForm_Articles.json', function(data) {
    // Process JSON data
    const categories = new Set();
    const treeData = [];
    const tableData = [];
    let fuse;

    // Function to remove HTML tags
    function stripHTML(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || "";
    }

    // Prepare data for Fuse.js by stripping HTML from content
    const fuseData = data.map(item => {
      return {
        ...item,
        searchContent: stripHTML(item.contents || item.content || ''),
        originalContent: item.contents || item.content || ''
      };
    });

    data.forEach((item, index) => {
      // Build jsTree data structure
      const tagParts = item.tag.split('/');
      let currentLevel = treeData;
      tagParts.forEach((part, index) => {
        let existingNode = currentLevel.find(node => node.text === part);
        if (!existingNode) {
          existingNode = { text: part, children: [], state: { opened: true, selected: true } }; // Ensure nodes are expanded and checked
          currentLevel.push(existingNode);
        }
        currentLevel = existingNode.children;
      });

      // Collect categories
      categories.add(item.category);

      // Build table data
      const tableRow = `
        <tr data-tag="${item.tag}">
          <td>${fuseData[index].originalContent}</td>
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
        const originalContent = fuseData.find(fuseItem => fuseItem.tag === item.tag).originalContent;
        return `
          <tr data-tag="${item.tag}">
            <td>${originalContent}</td>
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

    // Initialize Fuse.js
    fuse = new Fuse(fuseData, {
      keys: ['searchContent'],
      threshold: 1.0 // Adjust threshold as needed
    });

    // Function to highlight the search term in the content
    function highlightTerm(html, term) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
      const regex = new RegExp(`(${term})`, 'gi');
      const nodes = [];

      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }

      nodes.forEach(node => {
        const parent = node.parentNode;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = node.nodeValue.replace(regex, '<span class="highlight">$1</span>');
        while (tempDiv.firstChild) {
          parent.insertBefore(tempDiv.firstChild, node);
        }
        parent.removeChild(node);
      });

      return doc.body.innerHTML;
    }

    // Search functionality
    $('#search').on('input', function() {
      const searchTerm = $(this).val();
      if (searchTerm) {
        const result = fuse.search(searchTerm);
        const filteredTableData = result.map(({ item }) => {
          const highlightedContent = highlightTerm(item.searchContent, searchTerm);
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
