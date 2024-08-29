function createDecisionsElement(decision) {
    const decisionEl = document.createElement('div');
    decisionEl.className = 'decision-item';
    decisionEl.innerHTML = `
        <h3></h3>
        <strong>Posted by:</strong> ${decision.username} - <strong>Matchweek:</strong> ${decision.matchweek}, <strong>Fixture:</strong> ${decision.fixture}
        <br>
        <p><strong>Description: </strong>${decision.text}</p>
        <p><strong>Total Votes:</strong> ${decision.total_votes}</p>
    `;
    return decisionEl;
}

function displayDecisionStats() {
    fetch('/api/decisions/most-upvoted')
        .then(response => response.json())
        .then(decision => {
            const mostUpvotedContainer = document.getElementById('most-upvoted-container');
            const decisionEl = createDecisionsElement(decision);
            decisionEl.querySelector('h3').textContent = 'Most Upvoted Post';
            mostUpvotedContainer.appendChild(decisionEl);
        })
        .catch(error => {
            console.error('Error loading the most upvoted decision:', error);
        });

    fetch('/api/decisions/most-downvoted')
        .then(response => response.json())
         .then(decision => {
            const mostDownvotedContainer = document.getElementById('most-downvoted-container');
            const decisionEl = createDecisionsElement(decision);
            decisionEl.querySelector('h3').textContent = 'Most Downvoted Post';
            mostDownvotedContainer.appendChild(decisionEl);
        })
        .catch(error => {
            console.error('Error loading the most downvoted decision:', error);
        });
}

function displayRefereeStats() {
    fetch('/api/referees/most-points')
        .then(response => response.json())
        .then(referee => {
            const topRefereeContainer = document.getElementById('top-referee-container');
            if (referee.name) {
                topRefereeContainer.innerHTML = `
                    <h3>Referee with Most Points</h3>
                    <p><strong>Name:</strong> ${referee.name}</p>
                    <p><strong>Total Votes:</strong> ${referee.total_votes}</p>
                `;
            } else {
                topRefereeContainer.innerHTML = `<p>Referee data not found.</p>`;
            }
        })
        .catch(error => {
            console.error('Error loading the top referee:', error);
        });

    fetch('/api/referees/least-points')
        .then(response => response.json())
        .then(referee => {
            const bottomRefereeContainer = document.getElementById('bottom-referee-container');
            if (referee.name) {
                bottomRefereeContainer.innerHTML = `
                    <h3>Referee with Least Points</h3>
                    <p><strong>Name:</strong> ${referee.name}</p>
                    <p><strong>Total Votes:</strong> ${referee.total_votes}</p>
                `;
            } else {
                bottomRefereeContainer.innerHTML = `<p>Referee data not found.</p>`;
            }
        })
        .catch(error => {
            console.error('Error loading the bottom referee:', error);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    
    loadLeagueTable();
    displayDecisionStats();
    displayRefereeStats();
});

function loadLeagueTable() {
    const leagueTable = document.getElementById('leagueTable');

    fetch('/api/league-table')
        .then(response => response.json())
        .then(data => {
            leagueTable.style.display = 'table';
            if (Array.isArray(data)) {
                const tableBody = leagueTable.getElementsByTagName('tbody')[0];
                tableBody.innerHTML = ''; 
                data.forEach((row, index) => {
                    const tr = document.createElement('tr');
                    if (index === 0) {
                        tr.className = 'first-place'; 
                    }
                    if (index >= data.length - 3) {
                        tr.className = 'last-places'; 
                    }
                    tr.innerHTML = `
                        <td>${row.Rk}</td>
                        <td>${row.Squad}</td>
                        <td>${row.MP}</td>
                        <td>${row.W}</td>
                        <td>${row.D}</td>
                        <td>${row.L}</td>
                        <td>${row.GD}</td>
                        <td>${row.Pts}</td>`;
                    tableBody.appendChild(tr);
                });
            } else {
                throw new TypeError('Received data, not an array');
            }
        })
        .catch(error => {
            console.error('Error loading league table:', error);
            leagueTable.style.display = 'none';
        });
}

