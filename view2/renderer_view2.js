
$(function () {
    // Load JSON data
    $.getJSON('longForm_Articles.json', function(data) {
      // Process JSON data
      const categories = new Set();
      const treeData = [];
      const tableData = [];

      data.forEach((item) => {
        // Build jsTree data structure
        const tagParts = item.tag.split('/');
        let currentLevel = treeData;
        tagParts.forEach((part, index) => {
          let existingNode = currentLevel.find(node => node.text === part);
          if (!existingNode) {
            existingNode = { text: part, children: [] };
            currentLevel.push(existingNode);
          }
          currentLevel = existingNode.children;
        });

        // Collect unique categories
        categories.add(item.category);

        // Build table data
        const tableRow = `
          <tr>
            <td>${item.contents || item.content || ''}</td>
            <td>${item.title || ''}</td>
            <td>${item.url || ''}</td>
            <td>${item.created_at || item.date || ''}</td>
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
            <tr>
              <td>${item.contents || item.content || ''}</td>
              <td>${item.title || ''}</td>
              <td>${item.url || ''}</td>
              <td>${item.created_at || item.date || ''}</td>
            </tr>`;
        });
        $('table tbody').html(filteredTableData.join(''));
      });

      // Reset button
      $('button:contains("Reset")').on('click', function() {
        $('table tbody').html(tableData.join(''));
      });
    });
  });

/*$(function () {
    // Load JSON data
    $.getJSON('longForm_Articles.json', function(data) {
      // Process JSON data
      const categories = new Set();
      const treeData = [];
      const tableData = [];

      data.forEach((item) => {
        // Build jsTree data structure
        const tagParts = item.tag.split('/');
        let currentLevel = treeData;
        tagParts.forEach((part, index) => {
          let existingNode = currentLevel.find(node => node.text === part);
          if (!existingNode) {
            existingNode = { text: part, children: [] };
            currentLevel.push(existingNode);
          }
          currentLevel = existingNode.children;
        });

        // Collect unique categories
        categories.add(item.category);

        // Build table data
        const tableRow = `
          <tr>
            <td>${item.contents}</td>
            <td>${item.title}</td>
            <td>${item.url}</td>
            <td>${item.created_at}</td>
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
            <tr>
              <td>${item.contents}</td>
              <td>${item.title}</td>
              <td>${item.url}</td>
              <td>${item.created_at}</td>
            </tr>`;
        });
        $('table tbody').html(filteredTableData.join(''));
      });

      // Reset button
      $('button:contains("Reset")').on('click', function() {
        $('table tbody').html(tableData.join(''));
      });
    });
  });*/

/*$(function () {
    // Load JSON data
    $.getJSON('longForm_Articles.json', function(data) {
      // Process JSON data
      const categories = new Set();
      const treeData = [];
      const tableHeaders = [];
      const tableData = [];

      data.forEach((item) => {
        // Build jsTree data structure
        const tagParts = item.tag.split('/');
        let currentLevel = treeData;
        tagParts.forEach((part, index) => {
          let existingNode = currentLevel.find(node => node.text === part);
          if (!existingNode) {
            existingNode = { text: part, children: [] };
            currentLevel.push(existingNode);
          }
          currentLevel = existingNode.children;
        });

        // Collect unique categories
        categories.add(item.category);

        // Build table data
        const tableRow = [];
        for (const [key, value] of Object.entries(item)) {
          if (key !== 'tag' && key !== 'category') {
            if (!tableHeaders.includes(key)) {
              tableHeaders.push(key);
            }
            tableRow.push(`<td>${value}</td>`);
          }
        }
        tableData.push(`<tr>${tableRow.join('')}</tr>`);
      });

      // Initialize jsTree
      $('#jstree').jstree({
        'core': {
          'data': treeData
        },
        "plugins": ["checkbox"]
      });

      // Populate table
      const tableHeadRow = tableHeaders.map(header => `<th>${header}</th>`).join('');
      $('table thead tr').html(tableHeadRow);
      $('table tbody').html(tableData.join(''));

      // Create category buttons
      const categoryButtons = Array.from(categories).map(category => `<button class="tablebutton">${category}</button></br>`);
      $('#category').html(categoryButtons.join(''));

      // Bind events to category buttons
      $('.tablebutton').on('click', function() {
        const selectedCategory = $(this).text();
        const filteredData = data.filter(item => item.category === selectedCategory);
        const filteredTableData = filteredData.map(item => {
          const tableRow = [];
          for (const [key, value] of Object.entries(item)) {
            if (key !== 'tag' && key !== 'category') {
              tableRow.push(`<td>${value}</td>`);
            }
          }
          return `<tr>${tableRow.join('')}</tr>`;
        });
        $('table tbody').html(filteredTableData.join(''));
      });

      // Reset button
      $('button:contains("Reset")').on('click', function() {
        $('table tbody').html(tableData.join(''));
      });
    });
  });*/