const teamNameToId = {
    "Arsenal": 1,
    "Aston Villa": 2,
    "Bournemouth": 3,
    "Brentford": 4,
    "Brighton & Hove Albion": 5,
    "Burnley": 6,
    "Chelsea": 7,
    "Crystal Palace": 8,
    "Everton": 9,
    "Fulham": 10,
    "Liverpool": 11,
    "Luton Town": 12,
    "Manchester City": 13,
    "Manchester United": 14,
    "Newcastle United": 15,
    "Nottingham Forest": 16,
    "Sheffield United": 17,
    "Tottenham Hotspur": 18,
    "West Ham United": 19,
    "Wolverhampton Wanderers": 20
};


function loadSelectedStat() {
    const selectedStat = document.getElementById('statSelect').value;
    if (selectedStat === "none") {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please Select a Statistic',
            confirmButtonText: 'OK'
        });
        return; 
    }

    const teamSelectDiv = document.getElementById('teamSelectDiv');
    const playerStatsContainer = document.getElementById('playerStatsContainer');
    const fixturesTable = document.getElementById('fixturesTable');
    const dataDisplayContainer = document.getElementById('dataDisplayContainer');
    const playerStatsTableBody = document.getElementById('playerStatsTableBody');
    const fixturesTableBody = document.getElementById('fixturesTableBody');

    teamSelectDiv.style.display = 'none';
    playerStatsContainer.style.display = 'none';
    fixturesTable.style.display = 'none';
    dataDisplayContainer.innerHTML = '';
    playerStatsTableBody.innerHTML = '';
    fixturesTableBody.innerHTML = '';

    switch (selectedStat) {
        case 'playerStats':
            teamSelectDiv.style.display = 'block';
            break;
        case 'fixtures':
            teamSelectDiv.style.display = 'block';
            break;
        case 'topScorers':
            loadTopGoalScorers();
            break;
        case 'topAssisters':
            loadTopAssisters();
            break;
        default:
            break; 
    }
}



function loadStats() {
    const selectedStat = document.getElementById('statsSelect').value;
    switch (selectedStat) {
        case 'fixtures':
            loadTeamFixtures();
            break;
        case 'topScorers':
            loadTopGoalScorers();
            break;
    }
}

function loadTeamSpecificStats() {
    const selectedStat = document.getElementById('statSelect').value;
    const teamName = document.getElementById('teamSelect').value;

    if (selectedStat === 'playerStats') {
        loadplayerStats(teamName);
    } else if (selectedStat === 'fixtures') {
        loadTeamFixtures(teamName);
    }
}

function loadplayerStats(teamName) {
    const url = `/api/team-stats/${teamName}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if(data.error) {
                throw new Error(data.message);
            }
            displayplayerStats(data.data);
        })
        .catch(error => {
            console.error('Error loading Player Stats:', error);
        });
}
function loadTeamFixtures(teamName) {
    const url = `/api/fixtures/team/${teamName}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(fixtures => {
            displayFixtures(fixtures);
        })
        .catch(error => {
            console.error('Error loading fixtures:', error);
        });
}


function loadTopAssisters() {
    const url = `/api/topassisters`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch top assisters.');
            }
            return response.json();
        })
        .then(data => {
            displayTopScorersOrAssisters(data, 'assists');
        })
        .catch(error => {
            console.error('Error loading top assisters:', error);
            alert('Failed to load top assisters.');
        });
}

function loadTopGoalScorers() {
    const url = `/api/topscorers`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch top goal scorers.');
            }
            return response.json();
        })
        .then(data => {
            displayTopScorersOrAssisters(data, 'goals');
        })
        .catch(error => {
            console.error('Error loading top goal scorers:', error);
            alert('Failed to load top goal scorers.');
        });
}
function displayTopScorersOrAssisters(data, statType) {
    const container = document.getElementById('dataDisplayContainer'); 
    container.innerHTML = ''; 

  

    const table = document.createElement('table');
    table.className = 'table table-striped';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Rank', 'Player', 'Club', statType.charAt(0).toUpperCase() + statType.slice(1)];

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.forEach(item => {
        const tr = document.createElement('tr');
        headers.forEach(field => {
            const td = document.createElement('td');
            td.textContent = item[field.toLowerCase()]; 
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  

}

function displayFixtures(fixtures) {
    const tableBody = document.getElementById('fixturesTableBody');
    const fixturesTable = document.getElementById('fixturesTable');

    tableBody.innerHTML = ''; 
    fixtures.forEach(fixture => {
        const row = tableBody.insertRow();
        const dateCell = row.insertCell();
        const homeCell = row.insertCell();
        const awayCell = row.insertCell();
        const resultCell = row.insertCell();


        const date = new Date(fixture.Date);
        const formattedDate = date.toISOString().split('T')[0]; 

        dateCell.textContent = formattedDate;
        homeCell.textContent = fixture.Home;
        awayCell.textContent = fixture.Away;
        resultCell.textContent = fixture.Result || '-'; 


    });

    fixturesTable.style.display = 'table'; 
}

function Table() {
    const table = document.getElementById('playerStatsTable'); 
    const rows = table.getElementsByTagName('tr');
    const data = [];

    for (let i = 1; i < rows.length; i++) { 
        const cells = rows[i].getElementsByTagName('td');
        const rowData = {};


        for (let j = 1; j < cells.length; j++) {
            const headerName = table.rows[0].cells[j].innerText; 
            rowData[headerName] = cells[j].innerText;
        }
        
        data.push(rowData);
    }

    return data;
}

function displayplayerStats(playerStats) {
    const tableBody = document.getElementById('playerStatsTableBody');
    tableBody.innerHTML = ''; 

    playerStats.forEach(player => {
        const row = tableBody.insertRow();
        const playerData = Object.values(player).slice(1, -2); 
        
        playerData.forEach((text) => {
            const cell = row.insertCell();
            cell.textContent = text;
        });
    });

    document.getElementById('playerStatsContainer').style.display = 'block';
    const parsedData = Table(); 
    console.log(parsedData);
}


document.getElementById('teamSelectDiv').querySelector('button').addEventListener('click', loadTeamSpecificStats);
document.getElementById('statSelect').addEventListener('change', function() {
    const teamSelectDiv = document.getElementById('teamSelectDiv');
    const loadButton = teamSelectDiv.querySelector('button');
    const selectedStat = this.value;

    switch(selectedStat) {
        case 'playerStats':
            loadButton.textContent = 'Load Player Stats';
            loadButton.onclick = function() {
                const teamName = document.getElementById('teamSelect').value;
                loadplayerStats(teamName);
            };
            break;
        case 'fixtures':
            loadButton.textContent = 'Load Team Fixtures';
            loadButton.onclick = function() {
                const teamName = document.getElementById('teamSelect').value;
                loadTeamFixtures(teamName);
            };
            break;
    }
});



function goToPage(pageName) {
    window.location.href = pageName;
}
