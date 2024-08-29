document.addEventListener("DOMContentLoaded", function () {
    const leagueTable = document.getElementById('leagueTable');

    fetch('/api/referee-league-table')
        .then(response => response.json())
        .then(data => {
            const tableBody = leagueTable.getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach((row, index) => {
                const tr = tableBody.insertRow();
                tr.innerHTML =
				`<td>${index + 1}</td>
				<td>${row.name}</td>
				<td>${row.correct_votes}</td>
				<td>${row.incorrect_votes}</td>
				<td>${row.total_votes}</td>`;
            });
        })
        .catch(error => {
            console.error('Error loading referee table:', error);
            leagueTable.style.display = 'none';
        });
});