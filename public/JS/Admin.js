document.getElementById('GoalBtn').addEventListener('click', function() {
    fetch('/admin/scrape-topscorers', {
        method: 'POST',
    })
        .then(response => response.json())
        .then(data => {
            Swal.fire('Success', 'The database has been updated with the latest stats.', 'success');
        })
        .catch(error => {
            Swal.fire('Error', 'There was a problem updating the database.', 'error');
        });
});
document.getElementById('AssistBtn').addEventListener('click', function() {
    fetch('/admin/scrape-topassisters', {
        method: 'POST',
    })
    
        .then(response => response.json())
        .then(data => {
            Swal.fire('Success', 'The database has been updated with the latest stats.', 'success');
        })
        .catch(error => {
            Swal.fire('Error', 'There was a problem updating the database.', 'error');
        });
});

document.getElementById('DecisionBtn').addEventListener('click', function() {
    fetch('/admin/scrape-decision', {
        method: 'POST',
    })
        .then(response => response.json())
        .then(data => {
            Swal.fire('Success', 'The database has been updated with the latest data.', 'success');
        })
        .catch(error => {
            Swal.fire('Error', 'There was a problem updating the database.', 'error');
        });
});


document.getElementById('addFixtureForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const object = {};
    formData.forEach((value, key) => object[key] = value);
    const json = JSON.stringify(object);

    fetch('/api/fixtures/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: json
    })
    .then(response => response.json())
    .then(data => {
        alert('Fixture added successfully!');
        console.log(data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});

document.getElementById('PlayerBtn').addEventListener('click', function() {
    fetch('/admin/scrape-player', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire('Success', data.message, 'success');
    })
    .catch(error => {
        Swal.fire('Error', 'There was a problem scraping the team data.', 'error');
    });
});

document.getElementById('StandingBtn').addEventListener('click', function() {
    fetch('/admin/scrape-standings', {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        Swal.fire('Success', data.message, 'success');
    })
    .catch(error => {
        Swal.fire('Error', 'There was a problem scraping the standings data.', 'error');
    });
});

function populateMatchweeks() {
    fetch('/api/fixtures-data') 
    .then(response => response.json())
    .then(data => {
        const matchweekSelect = document.getElementById('matchweekSelect');
        let matchweeks = new Set(data.map(fixture => fixture.matchweek));
        matchweekSelect.innerHTML = `<option value="">Select Matchweek</option>`; 
        matchweeks.forEach(matchweek => {
            matchweekSelect.innerHTML += `<option value="${matchweek}">Matchweek ${matchweek}</option>`;
        });
    })
    .catch(error => {
        console.error('Error fetching matchweeks:', error);
    });
}

function populateFixtures(matchweek) {
    fetch(`/api/fixtures/matchweek/${matchweek}`) 
    .then(response => response.json())
    .then(data => {
        const fixtureSelect = document.getElementById('fixtureSelect');
        fixtureSelect.innerHTML = `<option value="">Select Fixture</option>`; 
        data.fixtures.forEach(fixture => {
            fixtureSelect.innerHTML += `<option value="${fixture.id}">${fixture.home_team} vs ${fixture.away_team}</option>`;
        });
    })
    .catch(error => {
        console.error('Error fetching fixtures:', error);
    });
}

document.getElementById('matchweekSelect').addEventListener('change', function() {
    const matchweek = this.value;
    const fixtureSelect = document.getElementById('fixtureSelect');
    const deleteButton = document.getElementById('deleteFixtureBtn');

    if (matchweek) {
        populateFixtures(matchweek);
        fixtureSelect.style.display = 'block'; 
        deleteButton.style.display = 'none'; 
    } else {
        fixtureSelect.style.display = 'none'; 
        deleteButton.style.display = 'none'; 
    }
});
document.getElementById('fixtureSelect').addEventListener('change', function() {
    const deleteButton = document.getElementById('deleteFixtureBtn');
    if (this.value) {
        deleteButton.style.display = 'block'; 
    } else {
        deleteButton.style.display = 'none'; 
    }
});

populateMatchweeks();

function populateDecisionPosts() {
    fetch('/api/decisions')
    .then(response => response.json())
    .then(data => {
        const decisionSelect = document.getElementById('decisionSelect');
        decisionSelect.innerHTML = '<option value="">Select Decision Post</option>';
        data.forEach(decision => {
            decisionSelect.innerHTML += `<option value="${decision.id}">${decision.text.substring(0, 50)}...</option>`;
        });
        document.getElementById('deleteDecisionBtn').style.display = 'none'; 
    })
    .catch(error => {
        console.error('Error fetching decision posts:', error);
    });
}


document.getElementById('decisionSelect').addEventListener('change', function() {
    const deleteButton = document.getElementById('deleteDecisionBtn');
    deleteButton.style.display = this.value ? 'block' : 'none';
});


populateDecisionPosts();

document.getElementById('deleteDecisionBtn').addEventListener('click', function() {
    const decisionId = document.getElementById('decisionSelect').value;
    if (decisionId) {
        Swal.fire({
            title: 'Are you sure?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/decision/${decisionId}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    Swal.fire('Deleted!', 'The decision post has been deleted.', 'success');
                    populateDecisionPosts();  
                    document.getElementById('deleteDecisionBtn').style.display = 'none'; 
                    document.getElementById('decisionSelect').value = ''; 
                })
                .catch(error => {
                    Swal.fire('Error', 'There was a problem deleting the decision post.', 'error');
                });
            }
        });
    }
});


document.getElementById('deleteFixtureBtn').addEventListener('click', function() {
    const matchweek = document.getElementById('matchweekSelect').value;
    const fixtureId = document.getElementById('fixtureSelect').value;

    if (matchweek && fixtureId) {
        Swal.fire({
            title: 'Are you sure?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/api/fixtures/${matchweek}/${fixtureId}`, {
                    method: 'DELETE',
                })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    Swal.fire(
                        'Deleted!',
                        'The fixture has been deleted.',
                        'success'
                        
                    );
                    document.getElementById('matchweekSelect').value = '';
                    document.getElementById('fixtureSelect').innerHTML = `<option value="">Select Fixture</option>`;
                    document.getElementById('fixtureSelect').style.display = 'none';
                    document.getElementById('deleteFixtureBtn').style.display = 'none';
                })
                .catch(error => {
                    Swal.fire('Error', 'There was a problem deleting the fixture.', 'error');
                });
            }
        })
    }
});