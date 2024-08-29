$(document).ready(function() {

    $('#refereeSelect').select2({
        placeholder: "Select Referees",
        allowClear: true
    });
    $('#teamSelect').select2({
        placeholder: "Select Teams",
        allowClear: true
    });
    $('#filterButton').click(function() {
        $('#analysisResultsContainer').empty();

        const selectedReferees = $('#refereeSelect').val() || [];
        const selectedTeams = $('#teamSelect').val() || [];

        if (selectedTeams.length === 0 && selectedReferees.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please select at least one team or one referee.'
            });
            return;
        }

        if (selectedTeams.length === 1 && selectedReferees.length === 1) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please select at least one more team or referee.'
            });
            return;
        }

        if (selectedTeams.length > 1 && selectedReferees.length > 1) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please select only one team or one referee.'
            });
            return;
        }
        if (selectedTeams.length == 0 || selectedReferees.length == 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Please make sure a team or referee is selected.'
            });
            return;
        }

        if (selectedTeams.length > 0) {
            selectedTeams.forEach(teamName => {
                const encodedTeamName = encodeURIComponent(teamName);
                TeamAnalysis(encodedTeamName);
            });
        }

        if (selectedReferees.length > 0) {
            selectedReferees.forEach(refereeName => {
                const encodedRefereeName = encodeURIComponent(refereeName);
                RefereeAnalysis(encodedRefereeName);
            });
        }
            if (selectedTeams.length > 1 && selectedReferees.length === 1) {
                DisplayTeamVotes(selectedTeams, selectedReferees[0]);

            } else if (selectedTeams.length === 1 && selectedReferees.length > 1) {
                DisplayRefereeVotes(selectedTeams[0], selectedReferees);
            }

        
    });

    function RefereeAnalysis(refereeName) {
        fetch(`/api/referee-analysis/${refereeName}`)
            .then(response => response.json())
            .then(data => {
                displayAnalysisData(data, 'referee', refereeName);
            })
            .catch(error => console.error('Error fetching referee analysis:', error));
    }

    function TeamAnalysis(teamName) {
        fetch(`/api/team-analysis/${teamName}`)
            .then(response => response.json())
            .then(data => {
                displayAnalysisData(data, 'team', teamName);
            })
            .catch(error => console.error('Error fetching team analysis:', error));
    }

    function displayAnalysisData(data, type, name) {
        name = decodeURIComponent(name);
    
        let mostCorrect = (type === 'referee' ? data.mostCorrectTeams : data.mostCorrectReferees).map(item => item.team || item.referee).join(', ') || 'N/A';
        let mostIncorrect = (type === 'referee' ? data.mostIncorrectTeams : data.mostIncorrectReferees).map(item => item.team || item.referee).join(', ') || 'N/A';
        let bestDecisionTypes = data.bestDecisionTypes.map(item => item.incident_type).join(', ') || 'N/A';
        let worstDecisionTypes = data.worstDecisionTypes.map(item => item.incident_type).join(', ') || 'N/A';
    
        let analysisHTML = `
        <div class="col-lg-4 col-md-6 mb-4">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${name} Analysis</h5>
                    <p class="card-text">Most Correct (Referee) Decisions: ${mostCorrect}</p>
                    <p class="card-text">Most Incorrect (Referee) Decisions: ${mostIncorrect}</p>
                    <p class="card-text">Best at Decision Types: ${bestDecisionTypes}</p>
                    <p class="card-text">Worst at Decision Types: ${worstDecisionTypes}</p>
                </div>
            </div>
        </div>`;
    
        $('#analysisResultsContainer').append(analysisHTML);
    }
    function DisplayTeamVotes(teams, referee) {

        fetch(`/api/team-total-votes?teams=${encodeURIComponent(teams.join(','))}&referee=${encodeURIComponent(referee)}`)
            .then(response => response.json())
            .then(data => {
                const teamVotes = teams.map(team => data[team] || 0);
                displayVotesOnChart(teamVotes, teams);
            })
            .catch(error => console.error('Error:', error));
    }
    
    
    

    function DisplayRefereeVotes(team, referees) {

        fetch(`/api/referee-team-total-votes?team=${encodeURIComponent(team)}&referees=${encodeURIComponent(referees.join(','))}`)
            .then(response => response.json())
            .then(data => {
                const refereeVotes = referees.map(referee => {
                    const refereeData = data.find(entry => entry.referee === referee);
                    return refereeData ? refereeData.net_votes : 0;
                });
                displayVotesOnChart(refereeVotes, referees);
            })
            .catch(error => console.error('Error:', error));
    }
    

    function displayVotesOnChart(votes, labels) {
        const ctx = document.getElementById('analysisChart').getContext('2d');
        if (window.analysisChartInstance) {
            window.analysisChartInstance.destroy();
        }

        window.analysisChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Net Votes',
                    data: votes,
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)'
                    ],
                    borderColor: [
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
});

 



    

