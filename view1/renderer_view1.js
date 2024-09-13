let tableData = [];
let dataTable; // DataTable-Instanz

document.addEventListener('DOMContentLoaded', () => {
    // Event Listener für den Upload-Button
    document.getElementById('triggerUpload').addEventListener('click', function() {
        document.getElementById('uploadJson').click();
    });

    // Event Listener, um hochgeladene JSON-Dateien zu verarbeiten
    document.getElementById('uploadJson').addEventListener('change', function(event) {
        const files = event.target.files;
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const newData = JSON.parse(e.target.result);

                // Variable um Änderungen durch die Tag Funktionalität nicht auf die Orginaldaten zu übertragen
                const originalData = [...newData];

                // Temporäre Variable nur zur Anzeige in der Tabelle
                const formattedData = newData.map(item => ({
                    ...item,
                    addedAt: new Date(item.addedAt * 1000).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    // Tags als HTML-Elemente formatieren
                    tags: item.tags.split('/').map(tag => `<span class="tag">${tag}</span>`).join(' / '),
                }));

                // Speichern der Orginaldaten
                tableData = tableData.concat(originalData);

                // Formatierten Daten zur DataTable hinzufügen
                dataTable.rows.add(formattedData).draw();

                // Speichern der Daten inklusive Hinzugefügter in JSON-Datei
                saveJsonDataToFile(tableData);
            };
            reader.readAsText(file);
        });
    });

    // Funktion zum Speichern der JSON-Daten durch Aufruf der electronAPI(Kommunikation mit main.js um Daten auf PC zu speichern)
    function saveJsonDataToFile(data) {
        window.electronAPI.saveJsonFile(data)
            .then(() => {
                console.log('Daten erfolgreich gespeichert');
            })
            .catch(error => {
                console.error('Fehler beim Speichern:', error);
            });
    }

    //JSON-Daten aus einer Datei laden und die DataTable initialisieren
    fetch('bookmarks.json')
        .then(response => response.json())
        .then(data => {
            tableData = [...data];

            // Daten formatieren für die Anzeige (ändern des Datumsformat, Tags als HTML)
            const formattedData = data.map(item => ({
                ...item,
                addedAt: new Date(item.addedAt * 1000).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                tags: item.tags.split('/').map(tag => `<span class="tag">${tag}</span>`).join(' / '),
            }));

            // DataTable mit formatieren Daten initialisieren
            dataTable = $('#example').DataTable({
                data: formattedData,
                columns: [
                    { title: 'Category', data: 'category' },
                    { 
                        title: 'Tags', 
                        data: 'tags',
                        render: function(data) {
                            return data; // HTML für Tags wird direkt in die Zellen gerendert
                        }
                    },
                    { title: 'Title', data: 'title' },
                    { title: 'Author', data: 'author' },
                    { title: 'Added at', data: 'addedAt' },
                    { 
                        title: 'URL', 
                        data: 'url',
                        className: 'wrap',
                        render: function(data) {
                            // URLs als klickbare Links anzeigen
                            return `<a href="#" onclick="openExternalLink('${data}')">${data}</a>`;
                        }
                    },
                ],
                pageLength: -1, // Standardmäßig werden alle Einträge auf einer Seite angezeigt
                lengthMenu: [[-1], ['All']],
                dom: 'frti', // Anpassung des Tabllenlayout mit dom funktionalitäten
                initComplete: function () {
                    // Spaltensuche und Filterfunktion in der Tabellenkopfzeile
                    this.api().columns().every(function (index) {
                        let column = this;
                        let title = $(column.header()).text();

                        let container = document.createElement('div');
                        container.style.display = 'flex';
                        container.style.alignItems = 'center';

                        let input = document.createElement('input');
                        input.placeholder = title;
                        $(input).addClass('column-search');

                        let clearButton = document.createElement('span');
                        clearButton.innerHTML = '✖';
                        $(clearButton).addClass('clear-button');

                        container.appendChild(input);
                        container.appendChild(clearButton);

                        $(column.header()).empty().append(container);

                        // Filterfunktion für jede Spalte
                        $(input).on('keyup change', function () {
                            if (column.search() !== this.value) {
                                column.search(this.value).draw();
                            }
                        });

                        // Button zum Zurücksetzen der Filter
                        $(clearButton).on('click', function () {
                            $(input).val('');
                            column.search('').draw();
                        });
                    });

                    // Hinzufügen der Funktion: Klick auf einen Tag filtert nach diesem Tag
                    $('#example tbody').on('click', 'span.tag', function() {
                        let tagText = $(this).text();
                        let tagsColumnIndex = 1; 
                        let tagsSearchBox = $('thead tr th').eq(tagsColumnIndex).find('input');

                        let allTags = $(this).parent().find('span.tag').map(function() {
                            return $(this).text();
                        }).get();

                        let tagIndex = allTags.indexOf(tagText);
                        let searchValue = allTags.slice(0, tagIndex + 1).join(' / ');

                        tagsSearchBox.val(searchValue).keyup();
                    });

                    // Spalten per Drag-and-Drop vergrößerbar machen
                    $('#example thead th').each(function() {
                        $(this).resizable({
                            handles: 'e',
                            minWidth: 30,
                            stop: function(event, ui) {
                                let newWidth = ui.size.width;
                                let columnIndex = $(this).index();
                                dataTable.columns(columnIndex).every(function() {
                                    $(this.header()).css('width', newWidth);
                                });
                            }
                        });
                    });
                }
            });
        })
        .catch(error => console.error('Fehler beim Laden der JSON-Daten:', error));
});

// Funktion zum Öffnen externer Links über Electron
function openExternalLink(url) {
    window.electronAPI.openExternal(url);
}
