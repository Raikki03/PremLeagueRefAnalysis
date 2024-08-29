const elements = {
    createDecisionBtn: document.getElementById('createDecisionBtn'),
    timerContainer: document.getElementById('timerContainer'),
    decisionPopup: document.getElementById('decisionPopup'),
    newDecisionText: document.getElementById('newDecisionText'),
    matchdaySelect: document.getElementById('matchdaySelect'),
    fixtureSelect: document.getElementById('fixtureSelect'),
    refereeSelect: document.getElementById('refereeSelect'),
    incidentTypeSelect: document.getElementById('incidentTypeSelect'),
    severityScoreSelect: document.getElementById('severityScoreSelect'),
    videoUpload: document.getElementById('videoUpload'),
    fixtureSelectContainer: document.getElementById('fixtureSelectContainer'),
    refereeSelectContainer: document.getElementById('refereeSelectContainer'),
    decisionsContainer: document.getElementById('decisionsContainer'),
    sortSelect: document.getElementById('sortSelect'),
    matchweekFilter: document.getElementById('matchweekFilter')
};

function getElement(id) {
    return elements[id] || document.getElementById(id);
}

function getPostsData() {
    return JSON.parse(localStorage.getItem('userPostsInfo')) || { count: 0, firstPostTime: new Date().toISOString() };
}

function setPostsData(postsData) {
    localStorage.setItem('userPostsInfo', JSON.stringify(postsData));
}

function initializePostLimitCheck() {
    const postsData = getPostsData();
    if (!postsData || postsData.count < 3) return;

    const now = new Date();
    const firstPostTime = new Date(postsData.firstPostTime);
    const timeSinceFirstPost = now.getTime() - firstPostTime.getTime(); 
    const oneHour = 3600 * 1000; 
    const timeLeft = oneHour - timeSinceFirstPost;

    if (timeLeft > 0) {
        getElement('createDecisionBtn').disabled = true;
        getElement('timerContainer').style.display = 'block';
        startCountdown(timeLeft);
    } else {
        resetPostLimit();
    }
}

function startCountdown(duration) {
    let timer = duration;
    const createDecisionBtn = getElement('createDecisionBtn');
    const timerContainer = getElement('timerContainer');

    timerContainer.style.display = 'block';
    createDecisionBtn.classList.add('locked');

    const interval = setInterval(function () {
        const minutes = Math.floor(timer / 60000); 
        const seconds = Math.floor((timer % 60000) / 1000); 

        getElement('timeLeft').textContent = `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

        timer -= 1000; 
        if (timer < 0) {
            clearInterval(interval);
            timerContainer.style.display = 'none';
            createDecisionBtn.classList.remove('locked');
            createDecisionBtn.disabled = false;
            resetPostLimit();
        }
    }, 1000);
}

function resetPostLimit() {
    setPostsData({count: 0, firstPostTime: new Date().toJSON()});
}

function updatePostCountAndTime() {
    const now = new Date();
    let postsData = getPostsData();

    const diff = now - new Date(postsData.firstPostTime);

    if (diff >= 3600000 || postsData.count >= 3) { 
        postsData = { count: 1, firstPostTime: now.toISOString() };
    } else {
        postsData.count++;
    }

    setPostsData(postsData);

    if (postsData.count >= 3) {
        initializePostLimitCheck(); 
    }
}

function openDecision() {
    const postsData = getPostsData();
    const now = new Date();
    const firstPostTime = new Date(postsData.firstPostTime);
    const diff = now - firstPostTime;
    const oneHour = 3600000; 

    if (postsData.count >= 3 && diff < oneHour) {
        alert('Post limit reached. Please wait before posting again.');
        return;
    }
    
    getElement('decisionPopup').style.display = 'flex';
}

function closeDecisionPopup() {
    getElement('decisionPopup').style.display = 'none';
}


function handleUpvote() {
    const hasUpvoted = localStorage.getItem('hasUpvoted');
    if (!hasUpvoted) {
        upvoteButton.classList.add('upvoted');
        localStorage.setItem('hasUpvoted', 'true');
    }
}

function handleDownvote() {
    const hasDownvoted = localStorage.getItem('hasDownvoted');
    if (!hasDownvoted) {
        downvoteButton.classList.add('downvoted');
        localStorage.setItem('hasDownvoted', 'true');
    }
}


function postDecision() {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        Swal.fire('Error', 'You must be logged in to post a decision.', 'error');
        return;
    }

    const decisionText = document.getElementById('newDecisionText').value.trim();
    if (!decisionText) {
        Swal.fire('Error', 'Please enter some text for the decision.', 'error');
        return;
    }

    const matchdaySelect = document.getElementById('matchdaySelect');
    if (matchdaySelect.selectedIndex === 0) {
        Swal.fire('Error', 'Please select a matchday.', 'error');
        return;
    }

    const fixtureSelect = document.getElementById('fixtureSelect');
    if (fixtureSelect.selectedIndex === 0) {
        Swal.fire('Error', 'Please select a fixture.', 'error');
        return;
    }

    const refereeSelect = document.getElementById('refereeSelect');
    if (refereeSelect.selectedIndex === 0) {
        Swal.fire('Error', 'Please select a referee.', 'error');
        return;
    }

    const incidentTypeSelect = document.getElementById('incidentTypeSelect');
    const incidentType = incidentTypeSelect.value;
    if (!incidentType) {
        Swal.fire('Error', 'Please select an incident type.', 'error');
        return;
    }


    const refereeId = refereeSelect.value;
    const matchweekNumber = matchdaySelect.options[matchdaySelect.selectedIndex].text.match(/\d+/)[0];
    const fixtureId = fixtureSelect.value;

    const severityScoreSelect = document.getElementById('severityScoreSelect');
    const severityScore = severityScoreSelect.value;
    
    


    const now = new Date();
    const postsData = JSON.parse(localStorage.getItem('userPostsInfo')) || { count: 0, firstPostTime: now };
    
    if (postsData.count >= 3) {
        const firstPostTime = new Date(postsData.firstPostTime);
        const diff = now - firstPostTime;
        if (diff < 3600000) { 
            alert('Post limit reached. Please wait before posting again.');
            return;
        } else {
            postsData.count = 0;
            postsData.firstPostTime = now;
        }
    }

    const postData = {
        userId,
        decisionText,
        refereeId,
        matchweek: matchweekNumber,
        fixtureId,
        incidentType,
        severityScore: severityScore,

    };

    fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(data => {
        postsData.count++;
        postsData.firstPostTime = postsData.count === 1 ? now.toISOString() : postsData.firstPostTime;
        localStorage.setItem('userPostsInfo', JSON.stringify(postsData));

        addDecisionToPage(
            data.decision.text,
            data.decision.id,
            data.decision.referee_name,
            data.decision.username,
            data.decision.user_id,
            data.decision.matchweek,
            data.decision.fixture,
            data.decision.total_votes,
            data.decision.incident_type,
        );
        uploadVideo(data.decision.id);
        updatePostCountAndTime(); 
        resetFormFields();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error posting the decision.');
    });
}

function resetFormFields() {
    document.getElementById('matchdaySelect').selectedIndex = 0;
    document.getElementById('fixtureSelect').selectedIndex = 0;
    document.getElementById('refereeSelect').selectedIndex = 0;
    
    document.getElementById('fixtureSelectContainer').style.display = 'none';
    document.getElementById('refereeSelectContainer').style.display = 'none';
    
    document.getElementById('newDecisionText').value = '';
    
    document.getElementById('severityScoreSelect').selectedIndex = 0;
    document.getElementById('incidentTypeSelect').selectedIndex = 0;
    
    const videoUpload = document.getElementById('videoUpload');
    videoUpload.value = '';
    if(videoUpload.nextElementSibling) {
        videoUpload.nextElementSibling.textContent = 'No file chosen'; 
    }

    closeDecisionPopup();
}

function uploadVideo(decisionId) {
    const videoFile = document.getElementById('videoUpload').files[0];

    if (!videoFile) {
        console.log('No video file provided.');
        return;
    }

    const formData = new FormData();
    formData.append('videoFile', videoFile);
    formData.append('decisionId', decisionId);

    fetch('/api/uploadVideo', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
    console.log('Video uploaded:', data);
    const decisionEl = document.getElementById(`decision-${decisionId}`);
    const videoPlayerHTML = `
        <video width="320" height="240" controls>
            <source src="/${data.filePath.replace(/\\/g, '/')}" type="video/mp4">
        </video>
    `;
    decisionEl.insertAdjacentHTML('beforeend', videoPlayerHTML); 
})
    .catch(error => {
        console.error('Error uploading video:', error);
    });
}

function editDecision(decisionId) {
    const editButton = document.querySelector(`#decision-${decisionId} .edit-button`);
    editButton.disabled = true;

    const decisionEl = document.getElementById(`decision-${decisionId}`);
    const decisionTextBox = decisionEl.querySelector('.decision-text-box');
    const currentText = decisionTextBox.textContent;

    decisionTextBox.innerHTML = '';
    decisionTextBox.innerHTML = `
    <textarea id="edit-decision-text-${decisionId}" class="input">${currentText.trim()}</textarea>
    <div class="edit-buttons-container">
        <button onclick="submitEdit(${decisionId})" class="edit-submit-button button">Submit</button>
        <button onclick="cancelEdit(${decisionId}, \`${currentText.trim()}\`)" class="edit-cancel-button button">Cancel</button>
    </div>
    `;
    
}


function cancelEdit(decisionId, originalText) {
    const decisionEl = document.getElementById(`decision-${decisionId}`);
    const decisionTextBox = decisionEl.querySelector('.decision-text-box');
    decisionTextBox.textContent = originalText;
}

document.querySelectorAll('.edit-decision-button').forEach(button => {
    button.addEventListener('click', function() {
        editDecision(this.dataset.decisionId);
    });
});
function submitEdit(decisionId) {
    const editTextarea = document.getElementById(`edit-decision-text-${decisionId}`);
    const updatedText = editTextarea.value;
    const userId = sessionStorage.getItem('userId');

    fetch(`/api/decisions/${decisionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({ userId, text: updatedText 
        })
        
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const decisionTextBox = document.querySelector(`#decision-${decisionId} .decision-text-box`);
        decisionTextBox.textContent = updatedText;
    })
    .catch(error => {
        console.error('Error updating decision:', error);
    });
}


function addDecisionToPage(decisionText, decisionId, refereeName, username, decisionUserId, matchweek, fixture, totalVotes, incidentType, videoUrl) {
    const loggedInUserId = sessionStorage.getItem('userId');
    const isUserDecision = loggedInUserId && loggedInUserId.toString() === decisionUserId.toString();
    const container = document.getElementById('decisionsContainer');
    let decisionEl = document.createElement('div');
    decisionEl.className = 'decision-item';
    decisionEl.id = `decision-${decisionId}`;

    let videoContent = '';
    if (videoUrl) {
        videoContent = `
            <video width="320" height="240" controls>
                <source src="${videoUrl}" type="video/mp4">
            </video>
        `;
    }

    let userControlsHTML = '';
    if (isUserDecision) {
        userControlsHTML = `
        <div class="edit-delete-buttons">
            <button class="icon-button edit-button" onclick="editDecision(${decisionId})">
                <i class="fas fa-pencil-alt" aria-hidden="true"></i>
            </button>
            <button class="icon-button delete-button" onclick="deleteDecision(${decisionId})">
                <i class="fas fa-trash-alt" aria-hidden="true"></i>
            </button>
        </div>
        `;
    }

    let decisionHTML = `
    
    ${userControlsHTML}
    <div class="decision-header">
      <span class="user-name">Posted by: ${username}</span>
    </div>
    <div class="referee-details">
      <div>Referee: ${refereeName}</div>
      <div>Matchweek: ${matchweek}, Fixture: ${fixture}</div>
      <div>Incident: ${incidentType}</div>
    </div>
    <br>
    <div class="decision-text-box">${decisionText}</div>
    ${videoContent}
    <div class="vote-buttons">
        <button class="upvote-button" id="thumbs-up-${decisionId}" onclick="vote(${decisionId}, 'up')"><i class="fas fa-thumbs-up"></i></button>
        <span class="total-votes" id="totalVotes-${decisionId}">${totalVotes || 0}</span>
        <button class="downvote-button" id="thumbs-down-${decisionId}" onclick="vote(${decisionId}, 'down')"><i class="fas fa-thumbs-down"></i></button>
    </div>
    <div class="comment-toggle" onclick="toggleCommentInput(${decisionId})">...</div>
    <div class="comment-section" id="commentSection-${decisionId}" style="display:none;">
        <input type="text" id="commentInput-${decisionId}" placeholder="Add a comment..." />
        <button onclick="postComment(${decisionId}, document.getElementById('commentInput-${decisionId}').value)">Comment</button>
    </div>
    <div class="comments-container"></div>
    `;

    decisionEl.innerHTML = decisionHTML;
    container.prepend(decisionEl);

    applyVote(decisionId);
}





function applyVote(decisionId) {
    const voteState = localStorage.getItem(`voteState-${decisionId}`);
    const upvoteButton = document.getElementById(`thumbs-up-${decisionId}`);
    const downvoteButton = document.getElementById(`thumbs-down-${decisionId}`);
    if (upvoteButton && downvoteButton) {
        if (voteState === 'up') {
            upvoteButton.classList.add('upvoted');
            downvoteButton.classList.remove('downvoted');
        } else if (voteState === 'down') {
            downvoteButton.classList.add('downvoted');
            upvoteButton.classList.remove('upvoted');
        }
    }
}



function fetchDecisions(callback) {
    fetch('/api/decisions')
        .then(response => response.json())
        .then(decisions => callback(decisions))
        .catch(error => {
            console.error('Error fetching decisions:', error);
        });
}

function displayDecisions(decisions) {
    const sort = document.getElementById('sortSelect').value;
    const matchweek = document.getElementById('matchweekFilter').value;
    
    decisions = sortDecisions(decisions, sort);

    if (matchweek) {
        decisions = decisions.filter(decision => decision.matchweek == matchweek);
    }

    const container = document.getElementById('decisionsContainer');
    container.innerHTML = '';

    decisions.forEach(decision => {
        const videoUrl = decision.videoURL ? `/${decision.videoURL.replace(/\\/g, '/')}` : '';
        addDecisionToPage(
            decision.text,
            decision.id,
            decision.referee_name,
            decision.username,
            decision.user_id,
            decision.matchweek,
            decision.fixture,
            decision.total_votes,
            decision.incident_type,
            videoUrl
        );
        fetchDecisionComments(decision.id);
    });
}

function sortDecisions(decisions, sortBy) {
    switch (sortBy) {
        case "username_asc":
            return decisions.sort((a, b) => a.username.localeCompare(b.username));
        case "username_desc":
            return decisions.sort((a, b) => b.username.localeCompare(a.username));
        case "referee_asc":
            return decisions.sort((a, b) => a.referee_name.localeCompare(b.referee_name));
        case "referee_desc":
            return decisions.sort((a, b) => b.referee_name.localeCompare(a.referee_name));
        case "total_votes_asc":
            return decisions.sort((a, b) => a.total_votes - b.total_votes);
        case "total_votes_desc":
            return decisions.sort((a, b) => b.total_votes - a.total_votes);
        case "recently_uploaded":
            return decisions.sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
        default:
            return decisions; 
    }
}
function initializeDecisions() {
    fetchDecisions(displayDecisions);
}
function applyFilteringAndSorting() {
    const sort = document.getElementById('sortSelect').value;
    const matchweek = document.getElementById('matchweekFilter').value;

    if (!sort && !matchweek) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please select a sort option or a matchweek before applying filters.',
            confirmButtonText: 'OK'
        });
    } else {
        fetchDecisions(decisions => displayDecisions(decisions, true));
    }
}


document.getElementById('applyFiltersBtn').addEventListener('click', applyFilteringAndSorting);


function toggleCommentInput(decisionId) {
    const commentSection = document.getElementById(`commentSection-${decisionId}`);
    commentSection.style.display = commentSection.style.display === 'none' ? 'block' : 'none';
}

function deleteDecision(decisionId) {
    const userId = sessionStorage.getItem('userId');
    
    Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to delete this decision?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/api/decisions/${decisionId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            })
            .then(response => response.json())
            .then(data => {
                const decisionEl = document.getElementById(`decision-${decisionId}`);
                if (decisionEl) decisionEl.remove();
                Swal.fire(
                    'Deleted!',
                    'Your decision has been deleted.',
                    'success'
                )
            })
            .catch(error => {
                console.error('Error deleting decision:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    footer: 'Error deleting decision: ' + error
                });
            });
        }
    });
}

function deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    const userId = sessionStorage.getItem('userId');
    fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        document.getElementById(`comment-${commentId}`).remove();
    })
    .catch(error => {
        console.error('Error deleting comment:', error);
    });
}

function vote(decisionId, voteType) {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
        alert('You must be logged in to vote.');
        return;
    }
    fetch('/api/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, decisionId, voteType })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        localStorage.setItem(`voteState-${decisionId}`, voteType);
        updateVote(decisionId, voteType);
        fetchAndDisplayUserVotes(userId);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function fetchAndDisplayUserVotes(userId) {
    fetch(`/api/votes/user/${userId}`)
        .then(response => response.json())
        .then(votes => {
            votes.forEach(vote => {
                updateVote(vote.decision_id, vote.vote_type);
            });
        })
        .catch(error => {
            console.error('Error fetching user votes:', error);
        });
}

function updateVote(decisionId, voteType) {
    const upvoteButton = document.getElementById(`thumbs-up-${decisionId}`);
    const downvoteButton = document.getElementById(`thumbs-down-${decisionId}`);
    if (upvoteButton && downvoteButton) {
        upvoteButton.classList.remove('upvoted');
        downvoteButton.classList.remove('downvoted');
        if (voteType === 'up') {
            upvoteButton.classList.add('upvoted');
        } else if (voteType === 'down') {
            downvoteButton.classList.add('downvoted');
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const userId = sessionStorage.getItem('userId');
    if (userId) {
        initializeDecisions(); 
        fetchAndDisplayUserVotes(userId);
    }
});


function postComment(decisionId, commentText) {
    const userId = sessionStorage.getItem('userId');
    if (!commentText) {
        alert('Please enter a comment.');
        return;
    }
    if (!userId) {
        alert('You must be logged in to post comments.');
        return;
    }
    fetch('/api/comments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decisionId, userId, commentText })
    })
    .then(response => response.json())
    .then(data => {
        const newComment = {
            id: data.commentId,
            text: commentText, 
            username: data.username, 
            user_id: sessionStorage.getItem('userId') 
        };
        appendComment(newComment, decisionId);
        const commentInput = document.getElementById(`commentInput-${decisionId}`);
        if (commentInput) {
            commentInput.value = '';
        }
        const commentSection = document.getElementById(`commentSection-${decisionId}`);
        if (commentSection) {
            commentSection.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error posting comment:', error);
    });
}

function fetchDecisionComments(decisionId) {
    fetch(`/api/comments/${decisionId}`)
        .then(response => response.json())
        .then(comments => {
            comments.forEach(comment => {
                appendComment(comment, decisionId);
            });
        })
        .catch(error => console.error('Error fetching comments:', error));
}

function appendComment(comment, decisionId) {
    const loggedInUserId = sessionStorage.getItem('userId');
    const commentEl = document.createElement('div');
    commentEl.className = 'comment';
    commentEl.id = `comment-${comment.id}`;
    commentEl.innerHTML = `
        <div class="comment-user">Posted by: ${comment.username}</div>
        <div class="comment-content">${comment.text}</div>
    `;
    
    if (loggedInUserId === String(comment.user_id)) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-comment-btn';
        deleteBtn.setAttribute('aria-label', 'Delete comment');
        deleteBtn.style.border = 'none'; 
        deleteBtn.style.background = 'transparent'; 
        deleteBtn.style.cursor = 'pointer'; 
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.firstChild.style.color = 'inherit'; 

        deleteBtn.onclick = function() { deleteComment(comment.id); };
        commentEl.appendChild(deleteBtn);
    }
    
    const commentsContainer = document.querySelector(`#decision-${decisionId} .comments-container`);
    commentsContainer.appendChild(commentEl);
}


function recordVote(commentId, vote) {
    fetch('/api/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentId, vote })
    })
    .then(response => response.text())
    .then(data => {
        console.log('Vote recorded:', data);
    })
    .catch(error => {
        console.error('Error recording vote:', error);
    });
}

function populateMatchdayDropdown() {
    fetch('/api/fixtures-data')
        .then(response => response.json())
        .then(fixtures => {
            const select = document.getElementById('matchdaySelect');
            select.innerHTML = '<option value="">Select Matchday</option>';
            const uniqueMatchweeks = [...new Set(fixtures.map(fixture => fixture.matchweek))];
            uniqueMatchweeks.forEach(matchweek => {
                const option = document.createElement('option');
                option.value = matchweek;
                option.textContent = `Matchday ${matchweek}`;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching matchdays:', error));
}

function fetchFixtures(matchweek) {
  if (!matchweek) {
    console.error('No matchweek provided');
    return;
  }
  fetch(`/api/fixtures/matchweek/${matchweek}`)
    .then(response => response.json())
    .then(data => {
      populateFixtureDropdown(data.fixtures);
    })
    .catch(error => {
      console.error('Error fetching fixture data:', error);
    });
}

function populateFixtureDropdown() {
    const matchdaySelect = document.getElementById('matchdaySelect');
    const matchweek = matchdaySelect.value;
    if (matchweek) {
        fetch(`/api/fixtures/matchweek/${matchweek}`)
            .then(response => response.json())
            .then(data => {
                const fixtureSelect = document.getElementById('fixtureSelect');
                fixtureSelect.innerHTML = '<option value="">Select Fixture</option>';
                data.fixtures.forEach(fixture => {
                    const option = document.createElement('option');
                    option.value = fixture.id;
                    option.textContent = `Matchday ${matchweek}: ${fixture.home_team} vs ${fixture.away_team}`;
                    fixtureSelect.appendChild(option);
                });
                document.getElementById('fixtureSelectContainer').style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching fixture data:', error);
            });
    }
}

var fixtureSelect = document.getElementById('fixtureSelect');
fixtureSelect.onchange = function() {
    var matchdaySelect = document.getElementById('matchdaySelect');
    var matchweek = matchdaySelect.value;
    var fixtureId = this.value;
};

function setupRefereeSelectListener() {
    var fixtureSelect = document.getElementById('fixtureSelect');
    fixtureSelect.addEventListener('change', function() {
        var matchdaySelect = document.getElementById('matchdaySelect');
        var matchweek = matchdaySelect.value;
        var fixtureId = this.value;
        if (matchweek && fixtureId) {
            populateRefereeDropdown(matchweek, fixtureId);
        }
    });
}

function populateRefereeDropdown(matchweek, fixtureId) {
   const refereeSelect = document.getElementById('refereeSelect');
    refereeSelect.innerHTML = '';
    refereeSelect.appendChild(new Option('Select Referee', ''));
    if (matchweek && fixtureId) {
        fetch(`/api/fixtures/matchweek/${matchweek}/${fixtureId}`)
        .then(response => response.json())
        .then(fixture => {
            if (fixture.VAR_id) {
                const varOption = document.createElement('option');
                varOption.value = fixture.VAR_id;
                varOption.textContent = `VAR: ${fixture.VAR}`;
                refereeSelect.appendChild(varOption);
            }
            if (fixture.Onfield_id) {
                const onFieldOption = document.createElement('option');
                onFieldOption.value = fixture.Onfield_id;
                onFieldOption.textContent = `On-field: ${fixture.Onfield}`;
                refereeSelect.appendChild(onFieldOption);
            }
            document.getElementById('refereeSelectContainer').style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching referee data:', error);
            document.getElementById('refereeSelectContainer').style.display = 'none';
        });
    } else {
        console.error('populateRefereeDropdown called without required parameters');
        document.getElementById('refereeSelectContainer').style.display = 'none';
    }
}

function fetchRefereeIdByName(name) {
    return fetch(`/api/referees/name/${encodeURIComponent(name)}`)
        .then(response => response.json())
        .then(refereeData => {
            const option = document.createElement('option');
            option.value = refereeData.id;
            option.textContent = name;
            document.getElementById('refereeSelect').appendChild(option);
        });
}

document.getElementById('matchdaySelect').addEventListener('change', function() {
    const matchweek = this.value;
    const fixtureSelect = document.getElementById('fixtureSelect');
    const refereeSelectContainer = document.getElementById('refereeSelectContainer');
    
    fixtureSelect.innerHTML = '<option value="">Select Fixture</option>';
    document.getElementById('refereeSelect').innerHTML = '<option value="">Select Referee</option>';

    if (matchweek) {
        fetchFixtures(matchweek);
        document.getElementById('fixtureSelectContainer').style.display = 'block';
        refereeSelectContainer.style.display = 'none'; 
    } else {
        document.getElementById('fixtureSelectContainer').style.display = 'none';
        refereeSelectContainer.style.display = 'none';
    }
});


document.getElementById('fixtureSelect').addEventListener('change', function(e) {
    const fixtureId = e.target.value;
    const matchdaySelect = document.getElementById('matchdaySelect');
    const matchweek = matchdaySelect.value;
    if (matchweek && fixtureId) {
        populateRefereeDropdown(matchweek, fixtureId);
    } else {
        console.log('Matchweek or Fixture ID is missing.');
        document.getElementById('refereeSelect').innerHTML = '<option value="">Select Referee</option>';
        document.getElementById('refereeSelectContainer').style.display = 'none';
    }
});

document.getElementById('videoUpload').addEventListener('change', function() {
    var fileName = this.files && this.files.length > 0 ? this.files[0].name : "No file chosen";
    this.nextElementSibling.textContent = fileName;
  });
  

  function setupEventListeners() {
    getElement('matchdaySelect').addEventListener('change', function() {
        fetchFixtures(this.value);
    });
    const postDecisionBtn = getElement('postDecisionBtn');
    if (!postDecisionBtn.hasAttribute('listenerAttached')) {
        postDecisionBtn.addEventListener('click', postDecision);
        postDecisionBtn.setAttribute('listenerAttached', 'true');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializePostLimitCheck();
    populateMatchdayDropdown();
    setupEventListeners();
});


