const express = require('express');
const mysql = require('mysql2');
const app = express();
const crypto = require('crypto');
const port = 3000;
const nodemailer = require('nodemailer');
const multer = require('multer');
const { exec } = require('child_process');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));


// Database connection setup
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'prem24',
  database: 'premier_league_analysis'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Function to hash passwords
function hashPassword(password) {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}


// Function to send a verification email
function sendVerificationEmail(email, code) {
    const mailOptions = {
        from: 'raikki03@gmail.com', 
        to: email,
        subject: 'Your Login Verification Code',
        text: `Your verification code is: ${code}. Please enter this code to complete your login.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Verification email sent:', info.response);
        }
    });
}

// Function to store or update a login code
function storeOrUpdateLoginCode(userId, loginCode, callback) {
    let expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 60);

    let query = `
        INSERT INTO login_codes (user_id, code, expiry_time)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
        code = VALUES(code),
        expiry_time = VALUES(expiry_time)
    `;

    db.query(query, [userId, loginCode, expiryTime], (err) => {
        if (err) {
            console.error('Error storing the login code:', err);
            callback(err);
        } else {
            callback(null);
        }
    });
}

// Function to generate a six-number code
function generateSixNumberCode() {
    let result = '';
    const characters = '1234567890';
    const charactersLength = characters.length;
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'raikki03@gmail.com',
        pass: 'ebkt dids vcji rimd'
    }
});

// User registration endpoint
app.post('/register', (req, res) => {
  const { username, password, email } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: 'Internal server error' });
    if (results.length > 0) return res.status(400).json({ message: 'Username already exists' });

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
      if (err) return res.status(500).json({ message: 'Internal server error' });
      if (emailResults.length > 0) return res.status(400).json({ message: 'Email already exists' });

      const hashedPassword = hashPassword(password);

      db.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email], (err, result) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        res.status(201).json({ message: 'Registration successful', userId: result.insertId });
      });
    });
  });
});


// Verification code verification endpoint
app.get('/verify-code', (req, res) => {
    const { userId, code } = req.query;

    db.query('SELECT code, username FROM login_codes JOIN users ON login_codes.user_id = users.id WHERE login_codes.user_id = ?', [userId], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userVerificationCode = results[0].code;
        const username = results[0].username;

        if (code === userVerificationCode) {
            db.query('UPDATE users SET last_successful_login = NOW(), is_verified = 1 WHERE id = ?', [userId], (updateErr, updateResults) => {
                if (updateErr) {
                    console.error('Database error on update:', updateErr);
                    return res.status(500).json({ message: 'Internal server error during update' });
                } else {
                    res.json({ message: 'Verification successful', verified: true, userId: userId, username: username });
                }
            });
        } else {
            res.status(401).json({ message: 'Invalid verification code' });
        }
    });
});


// Function to verify a login code
function verifyLoginCode(userId, code, callback) {
  const query = 'SELECT * FROM login_codes WHERE user_id = ? AND code = ?';

  db.query(query, [userId, code], (err, results) => {
    if (err) {
      callback(err, null);
    } else {
      const loginCode = results[0];
      if (!loginCode) {
        callback(null, false);
      } else {
        const now = new Date();
        if (now > new Date(loginCode.expiry_time)) {
          callback(null, false);
        } else {
          callback(null, true);
        }
      }
    }
  });
}

// Another endpoint to verify login code
app.post('/verify-code', (req, res) => {
    const { userId, code } = req.body;
  
    verifyLoginCode(userId, code, (err, isValid) => {
      if (err) {
        console.error('Error verifying login code:', err);
        return res.status(500).json({ message: 'Internal server error', verified: false });
      }
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid or expired code', verified: false });
      } else {
        db.query('UPDATE users SET is_verified = 1, last_successful_login = NOW() WHERE id = ?', [userId], (updateErr, updateResults) => {
          if (updateErr) {
            console.error('Database error on update:', updateErr);
            return res.status(500).json({ message: 'Internal server error during update' });
          }
          
          db.query('SELECT username FROM users WHERE id = ?', [userId], (err, results) => {
            if (err || results.length === 0) {
              console.error('Error fetching username:', err);
              return res.status(500).json({ message: 'Internal server error', verified: false });
            }
      
            const username = results[0].username;
            res.json({ message: 'Login code verified successfully', verified: true, userId: userId, username: username });
          });
        });
      }
    });
});

  

  
// Endpoint for user and admin login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin03') {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Error during database query:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            
            const adminUser = results[0];
            const hashedInputPassword = hashPassword(password); 

            if (hashedInputPassword !== adminUser.password) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            return res.json({ message: 'Login successful', userId: adminUser.id, isAdmin: true });
        });
    } else {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Error during database query:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            if (results.length === 0) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            
            const user = results[0];
            const hashedInputPassword = hashPassword(password); 

            if (hashedInputPassword !== user.password) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
      
            const needsAuthCode = !user.is_verified || new Date() - new Date(user.last_successful_login) > 7 * 24 * 60 * 60 * 1000;
      
            if (needsAuthCode) {
                const authCode = generateSixNumberCode();
                storeOrUpdateLoginCode(user.id, authCode, err => {
                    if (err) {
                        console.error('Error storing auth code:', err);
                        return res.status(500).json({ message: 'Error preparing auth code' });
                    }
                    sendVerificationEmail(user.email, authCode);
                    res.json({ message: 'Please enter the auth code sent to your email.', userId: user.id, needAuthCode: true });
                });
            } else {
                res.json({ message: 'Login successful', userId: user.id });
            }
        });
    }
});



// Endpoint for users to request a password reset code
app.post('/request-password-reset', (req, res) => {
    const { email } = req.body;
    const resetCode = generateSixNumberCode();

    db.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'No account found with the given email.' });
        }

        const userId = results[0].id;
        const expiryTime = new Date(new Date().getTime() + (60 * 60 * 1000)); 
        db.query('INSERT INTO reset_codes (user_id, email, code, expiry_time) VALUES (?, ?, ?, ?)', [userId, email, resetCode, expiryTime], (err, result) => {
            if (err) {
                console.error('Error storing reset code:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            const mailOptions = {
                from: 'raikki03@gmail.com',
                to: email,
                subject: 'Password Reset Code',
                text: `Your password reset code is: ${resetCode}`
            };

            transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ message: 'Email Failed to Send' });
                } else {
                    console.log('Email sent: ' + info.response);
                    res.json({ message: 'A Reset code has been sent to the associated email' });
                }
            });
        });
    });
});

// Endpoint to validate reset code
app.post('/validate-reset-code', (req, res) => {
    const { code } = req.body;

    db.query('SELECT user_id FROM reset_codes WHERE code = ? AND expiry_time > NOW()', [code], (err, results) => {
        if (err) {
            console.error('Error verifying reset code:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        res.json({ message: 'Code validated successfully.', userId: results[0].user_id });
    });
});

// Users password reset to new inputted one
app.post('/reset-password', (req, res) => {
    const { userId, newPassword } = req.body;

    const hashedNewPassword = hashPassword(newPassword);

    const query = 'UPDATE users SET password = ?, is_verified = 0 WHERE id = ?';  
    
    db.query(query, [hashedNewPassword, userId], (err, result) => {
        if (err) {
            console.error('Error updating password:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        db.query('DELETE FROM reset_codes WHERE user_id = ?', [userId], (err, result) => {
            if (err) {
                console.error('Error cleaning up reset code:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Password successfully reset, please verify your account.' });
        });
    });
})



// API endpoint for fetching league table
app.get('/api/league-table', (req, res) => {
    const query ='SELECT * FROM team_table ORDER BY Rk ASC';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching league table', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});
      
  


// Endpoints to sort most upvoted & downvoted decision posts
app.get('/api/decisions/most-upvoted', (req, res) => {
    const query = `
        SELECT d.*, u.username, CONCAT(f.home_team, ' vs ', f.away_team) AS fixture
        FROM decisions d
        JOIN users u ON d.user_id = u.id
        JOIN fixtures f ON d.fixture_id = f.id
        ORDER BY d.total_votes DESC LIMIT 1`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching most upvoted decision:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results[0]);
    });
});

app.get('/api/decisions/most-downvoted', (req, res) => {
    const query = `
        SELECT d.*, u.username, CONCAT(f.home_team, ' vs ', f.away_team) AS fixture
        FROM decisions d
        JOIN users u ON d.user_id = u.id
        JOIN fixtures f ON d.fixture_id = f.id
        ORDER BY d.total_votes ASC LIMIT 1`;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching most downvoted decision:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if(results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(204).send(); 
        }
    });
});




// Endpoints to sort referees with the most points and least points
app.get('/api/referees/most-points', (req, res) => {
    db.query('SELECT * FROM referees ORDER BY total_votes DESC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Error fetching referee with most points:', err);
            return res.status(500).send('Internal server error');
        }
        if (results.length > 0) {
            res.send(results[0]);
        } else {
            res.status(404).send('Referee not found');
        }
    });
});

app.get('/api/referees/least-points', (req, res) => {
    db.query('SELECT * FROM referees ORDER BY total_votes ASC LIMIT 1', (err, results) => {
        if (err) {
            console.error('Error fetching referee with least points:', err);
            return res.status(500).send('Internal server error');
        }
        if (results.length > 0) {
            res.send(results[0]);
        } else {
            res.status(404).send('Referee not found');
        }
    });
});


// API endpoint for fixtures of a specific team
app.get('/api/fixtures/team/:teamName', async (req, res) => {
    const { teamName } = req.params;

    const query = `
        SELECT match_date AS Date, home_team AS Home, away_team AS Away, score AS Result
        FROM fixtures
        WHERE home_team = ? OR away_team = ?
        ORDER BY match_date ASC;`;

    try {
        const results = await db.promise().query(query, [teamName, teamName]);
        res.json(results[0]);
    } catch (err) {
        console.error('Error fetching fixtures', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});





// Endpoint to obtain referees
app.get('/api/referees', (req, res) => {
    db.query('SELECT * FROM referees', (err, results) => {
        if (err) {
            console.error('Error fetching referees:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Endpoint to obtain referees by a specific name
app.get('/api/referees/name/:name', (req, res) => {
    const name = req.params.name;
    db.query('SELECT id FROM referees WHERE name = ?', [name], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Referee not found' });
        }
        res.json(results[0]);
    });
});


// Endpoint to obtain referees by a specific ID
app.get('/api/referees/:refereeId', (req, res) => {
    db.query('SELECT * FROM referees WHERE id = ?', [req.params.refereeId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Referee not found' });
        }
        res.json(results[0]);
    });
});


// Endpoint to obtain referees, from a fixture
app.get('/api/referees/fixture/:fixtureId', (req, res) => {
    const fixtureId = req.params.fixtureId;
    db.query('SELECT VAR, Onfield FROM fixtures WHERE id = ?', [fixtureId], (err, results) => {
        if (err) {
            console.error('Error fetching referees:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length > 0) {
            res.json(results[0]); 
        } else {
            res.status(404).json({ message: 'Fixture not found' });
        }
    });
});

// Endpoint to fetch fixtures
app.get('/api/fixtures-data', (req, res) => {
    db.query('SELECT * FROM fixtures', (err, results) => {
        if (err) {
            console.error('Error fetching fixture data:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Endpoint to find a specific ficture by ID
app.get('/api/fixtures/:fixtureId', (req, res) => {
    const fixtureId = req.params.fixtureId;
    db.query('SELECT * FROM fixtures WHERE id = ?', [fixtureId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ message: 'Fixture not found' });
        }
        res.json(results[0]);
    });
});


// Endpoint to fetch fixtures by a specific matchweek
app.get('/api/fixtures/matchweek/:matchweek', (req, res) => {
    const matchweek = req.params.matchweek;
    
    if (!matchweek) {
        res.status(400).json({ error: 'Matchweek is required' });
    } else {
        db.query('SELECT * FROM fixtures WHERE matchweek = ?', [matchweek], (err, results) => {
            if (err) {
                console.error('Error fetching fixtures:', err);
                res.status(500).json({ error: 'Internal server error' });
            } else {
                res.json({ fixtures: results });
            }
        });
    }
});

// Endpoint to fetch decision posts with filters
app.get('/api/decisions', (req, res) => {
    let { sort, matchweek } = req.query;
    let orderBy = 'd.created_at DESC'; 

    switch (sort) {
        case 'username_asc':
            orderBy = 'u.username ASC';
            break;
        case 'username_desc':
            orderBy = 'u.username DESC';
            break;
        case 'referee_asc':
            orderBy = 'r.name ASC';
            break;
        case 'referee_desc':
            orderBy = 'r.name DESC';
            break;
        case 'total_votes_asc':
            orderBy = 'd.total_votes ASC';
            break;
        case 'total_votes_desc':
            orderBy = 'd.total_votes DESC';
            break;
        case 'recently_uploaded':
            orderBy = 'd.created_at DESC';
            break;
        }
    let query = `
        SELECT d.*, r.name AS referee_name, u.username, 
            f.matchweek, CONCAT(f.home_team, ' vs ', f.away_team) AS fixture
        FROM decisions d
        JOIN referees r ON d.referee_id = r.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN fixtures f ON d.fixture_id = f.id
    `;

    let queryParams = [];

    if (matchweek) {
        query += ' WHERE f.matchweek = ?';
        queryParams.push(matchweek);
    }

    query += ` ORDER BY ${orderBy}`;

    db.query(query, queryParams, (err, decisions) => {
        if (err) {
            console.error('Error fetching decisions:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(decisions);
    });
});



// Logic and endpoint to set up storage for file uploads, and then update and add upload video files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); 
    },
    filename: (req, file, cb) => {
        const fileExt = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}.${fileExt}`);
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.post('/api/uploadVideo', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const updateQuery = 'UPDATE decisions SET videoURL = ? WHERE id = ?';

    db.query(updateQuery, [req.file.path, req.body.decisionId], (err, result) => {
        if (err) {
            console.error('Error saving video URL:', err);
            return res.status(500).send('Error saving video URL.');
        }
        return res.json({ message: 'Video uploaded successfully', filePath: req.file.path });
    });
});

// Endpoint to add decision post
app.post('/api/decisions', (req, res) => {
    const { userId, decisionText, refereeId, matchweek, fixtureId, incidentType, severityScore } = req.body;

    const matchweekInt = parseInt(matchweek, 10);
    if (isNaN(matchweekInt)) {
        return res.status(400).json({ message: 'Matchweek must be an integer' });
    }

    if (!incidentType) {
        return res.status(400).json({ message: 'Incident type is required' });
    }

    const rateLimitQuery = `
        SELECT COUNT(*) AS postCount
        FROM decisions
        WHERE user_id = ? AND created_at >= NOW() - INTERVAL 1 HOUR
        `;

    db.query(rateLimitQuery, [userId], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        if (results[0].postCount >= 3) { 
            return res.status(429).json({ message: 'Rate limit exceeded. Please wait before posting again.' });
        } else {
            const insertQuery = `
    INSERT INTO decisions (user_id, text, referee_id, matchweek, fixture_id, incident_type, severity_score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
`;

            db.query(insertQuery, [userId, decisionText, refereeId, matchweekInt, fixtureId, incidentType, severityScore], (insertErr, insertResults) => {
                if (insertErr) {
                    console.error('Error inserting new decision:', insertErr);
                    return res.status(500).json({ message: 'Internal server error', error: insertErr.message });
                }

                const newDecisionId = insertResults.insertId;
                const selectQuery = `
                    SELECT d.*, r.name AS referee_name, u.username, f.matchweek, 
                        CONCAT(f.home_team, ' vs ', f.away_team) AS fixture,
                        d.incident_type
                    FROM decisions d
                    JOIN referees r ON d.referee_id = r.id
                    JOIN users u ON d.user_id = u.id
                    LEFT JOIN fixtures f ON d.fixture_id = f.id
                    WHERE d.id = ?
                `;

                db.query(selectQuery, [newDecisionId], (selectErr, selectResults) => {
                    if (selectErr) {
                        console.error('Error fetching new decision:', selectErr);
                        return res.status(500).json({ message: 'Internal server error', error: selectErr.message });
                    }

                    if (selectResults.length > 0) {
                        const newDecision = selectResults[0];
                        return res.status(201).json({
                            message: 'Decision posted successfully',
                            decision: newDecision
                        });
                    } else {
                        return res.status(404).json({ message: 'Newly created decision not found' });
                    }
                });
            });
        }
    });
});



// Endpoint to delete a decision post by ID
app.delete('/api/decisions/:decisionId', (req, res) => {
    const decisionId = req.params.decisionId;
    const userIdFromRequest = req.body.userId;

    db.query('SELECT user_id FROM decisions WHERE id = ?', [decisionId], (err, results) => {
        if (err) {
            console.error('Error fetching decision:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Decision not found' });
        }

        const decisionOwnerId = results[0].user_id;
        if (decisionOwnerId.toString() !== userIdFromRequest.toString()) {
            return res.status(403).json({ message: 'Unauthorized to delete this decision' });
        }

        db.query('DELETE FROM comments WHERE decision_id = ?', [decisionId], (err, result) => {
            if (err) {
                console.error('Error deleting comments for decision:', err);
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }

            db.query('DELETE FROM decisions WHERE id = ?', [decisionId], (err, result) => {
                if (err) {
                    console.error('Error deleting decision:', err);
                    return res.status(500).json({ message: 'Internal server error', error: err.message });
                }
                res.json({ message: 'Decision and associated comments deleted successfully' });
            });
        });
    });
});

// Updates decision post by userID
app.put('/api/decisions/:decisionId', (req, res) => {
    const { userId, text } = req.body;
    const { decisionId } = req.params;

    db.query('SELECT user_id FROM decisions WHERE id = ?', [decisionId], (err, results) => {
        if (err) {
            console.error('Error fetching decision:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Decision not found' });
        }

        const decisionOwnerId = results[0].user_id;
        if (decisionOwnerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized to edit this decision' });
        }

        const updateQuery = 'UPDATE decisions SET text = ? WHERE id = ?';
        db.query(updateQuery, [text, decisionId], (err, result) => {
            if (err) {
                console.error('Error updating decision:', err);
                return res.status(500).json({ message: 'Internal server error', error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Decision not found' });
            }
            res.json({ message: 'Decision updated successfully' });
        });
    });
});

// Endpoint to obtain a comment posted on a decision post
app.get('/api/comments/:decisionId', (req, res) => {
    const decisionId = req.params.decisionId;
    const query = `
    SELECT comments.*, users.username, users.id as user_id
    FROM comments 
    JOIN users ON comments.user_id = users.id 
    WHERE comments.decision_id = ?
`;

    db.query(query, [decisionId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json(results);
    });
});

// Endpoint to create a comment on a decision post
app.post('/api/comments', (req, res) => {
    const { decisionId, userId, commentText } = req.body;
    const query = 'INSERT INTO comments (decision_id, user_id, text) VALUES (?, ?, ?)';
    db.query(query, [decisionId, userId, commentText], (err, results) => {
        if (err) {
            console.error('Error posting comment:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        
        db.query('SELECT username FROM users WHERE id = ?', [userId], (userErr, userResults) => {
            if (userErr) {
                console.error('Error fetching username:', userErr);
                return res.status(500).json({ message: 'Internal server error', error: userErr.message });
            }
            res.status(201).json({
                message: 'Comment posted successfully',
                commentId: results.insertId,
                username: userResults[0].username 
            });
        });
    });
});

// Endpoint to delete a comment
app.delete('/api/comments/:commentId', (req, res) => {
    const commentId = req.params.commentId;
    const userIdFromRequest = req.body.userId;

    db.query('SELECT user_id FROM comments WHERE id = ?', [commentId], (err, results) => {
        if (err) {
            console.error('Error fetching comment:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }


        if (results[0].user_id.toString() !== userIdFromRequest) {
            return res.status(403).json({ message: 'Unauthorized to delete this comment' });
        }

        db.query('DELETE FROM comments WHERE id = ?', [commentId], (err, result) => {
            if (err) {
                console.error('Error deleting comment:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.json({ message: 'Comment deleted successfully' });
        });
    });
});



// Endpoint to fetch a specific fixture by fixture ID and matchweek
app.get('/api/fixtures/matchweek/:matchweek/:fixtureId', (req, res) => {
    const { matchweek, fixtureId } = req.params;
    const query = `
        SELECT 
            f.*,
            r1.id AS VAR_id,
            r2.id AS Onfield_id
        FROM 
            fixtures f
        LEFT JOIN referees r1 ON f.VAR = r1.name
        LEFT JOIN referees r2 ON f.Onfield = r2.name
        WHERE 
            f.matchweek = ? AND f.id = ?;
    `;

    db.query(query, [matchweek, fixtureId], (err, fixtureResults) => {
        if (err) {
            console.error('Error fetching fixture with referee IDs:', err);
            return res.status(500).json({ message: 'Internal server error', details: err.message });
        }

        if (fixtureResults.length === 0) {
            return res.status(404).json({ message: 'Fixture not found' });
        }

        const fixture = fixtureResults[0];
        res.json({
            id: fixture.id,
            matchweek: fixture.matchweek,
            home_team: fixture.home_team,
            away_team: fixture.away_team,
            score: fixture.score,
            VAR: fixture.VAR,
            VAR_id: fixture.VAR_id,
            Onfield: fixture.Onfield,
            Onfield_id: fixture.Onfield_id,
        });
    });
});

// Endpoint to fetch all decisions, features referee's name, associated with the decision
app.get('/api/decisions', (req, res) => {
    db.query('SELECT decisions.*, referees.name AS referee_name FROM decisions LEFT JOIN referees ON decisions.referee_id = referees.id ORDER BY decisions.created_at DESC', (err, results) => {
        if (err) {
            console.error('Error fetching decisions:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Endpoint to submit and update, vote counts
app.post('/api/vote', (req, res) => {
    const { decisionId, userId, voteType } = req.body;

    const severityScoreQuery = 'SELECT severity_score FROM decisions WHERE id = ?';
    db.query(severityScoreQuery, [decisionId], (severityErr, severityResults) => {
        if (severityErr || severityResults.length === 0) {
            console.error('Error fetching severity score:', severityErr);
            return res.status(500).json({ message: 'Internal server error' });
        }

        const severityScore = severityResults[0].severity_score;
        const voteImpact = voteType === 'up' ? 1 * severityScore : -1 * severityScore;

        const checkVoteQuery = 'SELECT vote_type FROM votes WHERE user_id = ? AND decision_id = ?';
        db.query(checkVoteQuery, [userId, decisionId], (err, result) => {
            if (err) {
                console.error('Error fetching existing vote:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (result.length > 0 && result[0].vote_type === voteType) {
                const deleteVoteQuery = 'DELETE FROM votes WHERE user_id = ? AND decision_id = ?';
                db.query(deleteVoteQuery, [userId, decisionId], (deleteErr, deleteResult) => {
                    if (deleteErr) {
                        console.error('Error removing vote:', deleteErr);
                        return res.status(500).json({ message: 'Internal server error' });
                    }
                    updateTotalVotes(decisionId, severityScore);
                    updateRefereeVotes(decisionId);
                    res.json({ message: 'Vote removed and referee votes updated successfully' });
                });
            } else {
                const upsertVoteQuery = `
                    INSERT INTO votes (user_id, decision_id, vote_type, vote_impact)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                        vote_type = VALUES(vote_type),
                        vote_impact = VALUES(vote_impact);
                `;
                db.query(upsertVoteQuery, [userId, decisionId, voteType, voteImpact], (upsertErr, upsertResult) => {
                    if (upsertErr) {
                        console.error('Error handling vote:', upsertErr);
                        return res.status(500).json({ message: 'Internal server error' });
                    }
                    updateTotalVotes(decisionId, severityScore);
                    updateRefereeVotes(decisionId);
                    res.json({ message: 'Vote updated and referee votes updated successfully' });
                });
            }
        });
    });
});


// Functions to update decision and referee total votes
function updateTotalVotes(decisionId) {
    const updateVotesQuery = `
    UPDATE decisions d
LEFT JOIN (
    SELECT 
        decision_id, 
        SUM(CASE WHEN vote_type = 'up' THEN severity_score ELSE 0 END) AS correct_votes,
        SUM(CASE WHEN vote_type = 'down' THEN severity_score ELSE 0 END) AS incorrect_votes
    FROM votes
    JOIN decisions ON votes.decision_id = decisions.id
    WHERE votes.decision_id = ?
    GROUP BY votes.decision_id
) v ON d.id = v.decision_id
SET 
    d.total_votes = COALESCE(v.correct_votes - v.incorrect_votes, 0),
    d.correct_votes = COALESCE(v.correct_votes, 0),
    d.incorrect_votes = COALESCE(v.incorrect_votes, 0)
WHERE d.id = ?;

    `;
    db.query(updateVotesQuery, [decisionId, decisionId], (updateErr) => {
        if (updateErr) {
            console.error('Error updating total votes:', updateErr);
        }
    });
}

function updateRefereeVotes(decisionId) {
    db.query('SELECT referee_id FROM decisions WHERE id = ?', [decisionId], (err, result) => {
        if (err) {
            console.error('Error fetching referee id:', err);
            return;
        }
        const refereeId = result[0].referee_id;

        const updateRefereeVotesQuery = `
            UPDATE referees r
            JOIN (
                SELECT 
                    referee_id,
                    SUM(total_votes) AS total_votes,
                    SUM(correct_votes) AS correct_votes,
                    SUM(incorrect_votes) AS incorrect_votes
                FROM decisions
                WHERE referee_id = ?
                GROUP BY referee_id
            ) d ON r.id = d.referee_id
            SET 
                r.total_votes = COALESCE(d.total_votes, 0),
                r.correct_votes = COALESCE(d.correct_votes, 0),
                r.incorrect_votes = COALESCE(d.incorrect_votes, 0)
            WHERE r.id = ?;
        `;
        db.query(updateRefereeVotesQuery, [refereeId, refereeId], (updateRefErr, updateRefResult) => {
            if (updateRefErr) {
                console.error('Error updating referee votes:', updateRefErr);
            }
        });
    });
}



// Endpoint to fetch all votes made by a user
app.get('/api/votes/user/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `
        SELECT decision_id, vote_type
        FROM votes
        WHERE user_id = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching votes:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});


// Endpoint to fetch the referee league table, and sort it by total votes descending
app.get('/api/referee-league-table', (req, res) => {
    db.query('SELECT * FROM referees ORDER BY total_votes DESC', (err, results) => {
        if (err) {
            console.error('Error fetching referee league table: ', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(results);
    });
});

// Endpoint to perform a referee analysis, with optional filtering for team and/or referee
app.get('/api/referee-analysis', (req, res) => {
    const { team, referee } = req.query;

    let whereClauses = [];
    let queryParams = [];

    if (team) { 
        whereClauses.push('(f.home_team = ? OR f.away_team = ?)');
        queryParams.push(team, team);
    }
    if (referee) {
        whereClauses.push('r.name = ?');
        queryParams.push(referee);
    }

    let whereClause = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
        SELECT 
            r.name AS referee,
            SUM(CASE WHEN v.vote_type = 'up' THEN 1 ELSE -1 END) AS net_votes
        FROM 
            votes v
        JOIN 
            decisions d ON v.decision_id = d.id
        JOIN 
            fixtures f ON d.fixture_id = f.id
        JOIN 
            referees r ON d.referee_id = r.id
        ${whereClause}
        GROUP BY 
            r.name
        ORDER BY 
            net_votes DESC;`;

    db.query(query, queryParams, (err, results) => {
        if (err) {
            console.error('Error fetching referee analysis: ', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
        res.json(results);
    });
});


// Endpoint to perform a referee analysis, related to a specific team and referee
app.get('/api/referee-team-analysis', (req, res) => {
    const { team, referee } = req.query;

    if (!team || !referee) {
        return res.status(400).json({ error: 'Missing team or referee query parameter' });
    }

    const query = `
        SELECT 
            r.name AS referee,
            SUM(CASE WHEN v.vote_type = 'up' THEN 1 WHEN v.vote_type = 'down' THEN -1 ELSE 0 END) AS net_votes
        FROM 
            decisions d
        JOIN 
            votes v ON d.id = v.decision_id
        JOIN 
            fixtures f ON d.fixture_id = f.id
        JOIN 
            referees r ON d.referee_id = r.id
        WHERE 
            r.name = ? AND (f.home_team = ? OR f.away_team = ?)
        GROUP BY 
            r.name;
    `;

    db.query(query, [referee, team, team], (err, results) => {
        if (err) {
            console.error('Error fetching referee-team analysis data:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'No decisions found for the specified team and referee' });
        }

        res.json(results);
    });
});


// Endpoints to select and rank top goalscorers and assisters from respective tables
app.get('/api/topassisters', (req, res) => {
    db.query('SELECT * FROM top_assisters ORDER BY `rank` ASC', (err, results) => {
        if (err) {
            console.error('Error fetching top assisters:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(results);
    });
});

app.get('/api/topscorers', (req, res) => {
    db.query('SELECT * FROM top_scorers ORDER BY `rank` ASC', (err, results) => {
        if (err) {
            console.error('Error fetching top scorers:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(results);
    });
});


// Endpoints to execute python scripts
app.post('/admin/scrape-player', (req, res) => {
    exec('python Api/Player.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            if (error.code === 429) {
                return res.status(429).json({ error: true, message: 'Rate limit reached.' });
            }
            return res.status(500).json({ error: true, message: 'Error executing Player script.', details: stderr || error.message });
        }
        res.json({ message: 'Team & Player data updated successfully', output: stdout });
    });
});

app.post('/admin/scrape-standings', (req, res) => {
    exec('python Api/Standing.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            if (error.code === 429) {
                return res.status(429).json({ error: true, message: 'Rate limit reached.' });
            }
            return res.status(500).json({ error: true, message: 'Error executing Standings script.', details: stderr || error.message });
        }
        res.json({ message: 'Standing data updated successfully', output: stdout });
    });
});

app.post('/admin/scrape-topassisters', (req, res) => {
    exec('python Api/Assists.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error on exec: ${error}`);
            if (error.code === 429) {
                return res.status(429).json({ error: true, message: 'Rate limit reached.' });
            }
            return res.status(500).json({ error: true, message: 'Error executing Assists script.', details: stderr || error.message });
        }
        res.json({ message: 'Top assisters data updated successfully', output: stdout });
    });
});

app.post('/admin/scrape-topscorers', (req, res) => {
    exec('python Api/Goalscorer.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error on exec: ${error} | ${stderr}`);
            if (error.code === 429) {
                return res.status(429).json({ error: true, message: 'Rate limit reached.' });
            }
            return res.status(500).json({ error: true, message: 'Error executing Goalscorer script.', details: stderr || error.message });
        }
        res.json({ message: 'Top goal scorers data updated successfully', output: stdout });
    });
});

app.post('/admin/scrape-decision', (req, res) => {
    exec('python /Api/Decision.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            if (error.code === 429) {
                return res.status(429).json({ error: true, message: 'Rate limit reached.' });
            }
            return res.status(500).json({ error: true, message: 'Error executing Decision script.', details: stderr || error.message });
        }
        res.json({ message: 'Decision related data updated successfully', output: stdout });
    });
});






// Endpoint to get correct and incorrect analysis for a specific referee
app.get('/api/referee-analysis/:refereeName', async (req, res) => {
    const refereeName = req.params.refereeName;
  
    const teamsQuery = `
    SELECT 
    IF(f.home_team = ?, f.away_team, f.home_team) AS team,
    SUM(d.total_votes) AS net_votes
  FROM 
    decisions d
    JOIN fixtures f ON d.fixture_id = f.id
    JOIN referees r ON d.referee_id = r.id
  WHERE 
    r.name = ?
  GROUP BY 
    team
  ORDER BY 
    net_votes DESC;
  
    `;
  
    const decisionTypesQuery = `
    SELECT 
    d.incident_type, 
    SUM(d.total_votes) AS net_votes
  FROM 
    decisions d
    JOIN referees r ON d.referee_id = r.id
  WHERE 
    r.name = ?
  GROUP BY 
    d.incident_type
  ORDER BY 
    net_votes DESC;
  
    `;
  
    try {
      const [teamsData] = await db.promise().query(teamsQuery, [refereeName, refereeName]);
      const [decisionTypesData] = await db.promise().query(decisionTypesQuery, [refereeName]);
      
      res.json({
        mostCorrectTeams: teamsData.slice(0, 1),
        mostIncorrectTeams: teamsData.slice(-1),
        bestDecisionTypes: decisionTypesData.slice(0, 1),
        worstDecisionTypes: decisionTypesData.slice(-1)
      });
    } catch (err) {
      console.error('Error fetching analysis data for referee:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
});
  

// Endpoint to get Correct and unCorrect analysis for a specific team
app.get('/api/team-analysis/:teamName', async (req, res) => {
    const teamName = req.params.teamName;
  
    const refereesQuery = `
    SELECT 
    r.name AS referee,
    SUM(d.total_votes) AS net_votes
  FROM 
    decisions d
    JOIN fixtures f ON d.fixture_id = f.id
    JOIN referees r ON d.referee_id = r.id
  WHERE 
    f.home_team = ? OR f.away_team = ?
  GROUP BY 
    referee
  ORDER BY 
    net_votes DESC;
  
    `;
  
    const decisionTypesQuery = `
    SELECT 
  d.incident_type, 
  SUM(d.total_votes) AS net_votes
FROM 
  decisions d
  JOIN fixtures f ON d.fixture_id = f.id
WHERE 
  f.home_team = ? OR f.away_team = ?
GROUP BY 
  d.incident_type
ORDER BY 
  net_votes DESC;

  
    `;
  
    try {
      const [refereesData] = await db.promise().query(refereesQuery, [teamName, teamName]);
      const [decisionTypesData] = await db.promise().query(decisionTypesQuery, [teamName, teamName]);
      
      res.json({
        mostCorrectReferees: refereesData.slice(0, 1),
        mostIncorrectReferees: refereesData.slice(-1),
        bestDecisionTypes: decisionTypesData.slice(0, 1),
        worstDecisionTypes: decisionTypesData.slice(-1)
      });
    } catch (err) {
      console.error('Error fetching analysis data for team:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
});
  

// Fetches total votes for a selected referee, related to a selected team
app.get('/api/referee-team-total-votes', async (req, res) => {
    const { team, referees } = req.query;

    if (!referees) {
        return res.status(400).json({ message: 'Referee parameter is required' });
    }
    const refereeArray = referees.split(',');

    const query = `
        SELECT 
            r.name AS referee,
            SUM(d.total_votes) AS net_votes
        FROM 
            decisions d
            INNER JOIN fixtures f ON d.fixture_id = f.id 
            INNER JOIN referees r ON r.id = d.referee_id
        WHERE 
            (f.home_team = ? OR f.away_team = ?) AND r.name IN (?, ?)
        GROUP BY 
            r.name
    `;

    try {
        const [votesData] = await db.promise().query(query, [team, team, ...refereeArray]);

        res.json(votesData);
    } catch (err) {
        console.error('SQL Error:', err);
        res.status(500).send('Server Error');
    }
});

// Fetches total votes for a team selected, related to a selected referee
app.get('/api/team-total-votes', async (req, res) => {
    const { teams, referee } = req.query;

    if (!teams) {
        return res.status(400).json({ message: 'Team parameter is required' });
    }
    const teamsArray = teams.split(',');

    const query = `
    SELECT 
    team,
    SUM(total_votes) AS net_votes
FROM (
    SELECT 
        f.home_team AS team,
        d.total_votes
    FROM 
        decisions d
        JOIN fixtures f ON d.fixture_id = f.id 
        JOIN referees r ON r.id = d.referee_id
    WHERE 
        f.home_team IN (?, ?) AND r.name = ?
    UNION ALL
    SELECT 
        f.away_team,
        d.total_votes
    FROM 
        decisions d
        JOIN fixtures f ON d.fixture_id = f.id 
        JOIN referees r ON r.id = d.referee_id
    WHERE 
        f.away_team IN (?, ?) AND r.name = ?
) AS subquery
GROUP BY 
    team;

    `;

    const params = [...teamsArray, referee, ...teamsArray, referee];

try {
    const [votesData] = await db.promise().query(query, params);

    const response = {};
    votesData.forEach(row => {
        response[row.team] = row.net_votes;
    });
    res.json(response);
} catch (err) {
    console.error('SQL Error:', err);
    res.status(500).send('Server Error');
}

});

// Add a new fixture
app.post('/api/fixtures/add', (req, res) => {
    const { matchweek, match_date, home_team, away_team, score, VAR, Onfield} = req.body;

    const query = `
        INSERT INTO fixtures (matchweek, match_date, home_team, away_team, score, VAR, Onfield)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [matchweek, match_date, home_team, away_team, score, VAR, Onfield ], (err, result) => {
        if (err) {
            console.error('Error adding new fixture:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        res.status(201).json({ message: 'New fixture added successfully', fixtureId: result.insertId });
    });
});

// Retrieve player stats for a specific team
app.get('/api/team-stats/:teamName', (req, res) => {
    const teamName = req.params.teamName;

    const query = `
        SELECT * FROM player_stats
        JOIN teams ON player_stats.team_id = teams.team_id
        WHERE teams.team_name = ?
    `;


    db.query(query, [teamName], (err, results) => {
        if (err) {
            console.error('Error fetching team stats:', err);
            return res.status(500).json({ error: true, message: 'Internal server error', details: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: true, message: 'No player stats found for the specified team' });
        }

        res.json({ error: false, message: 'Team stats fetched successfully', data: results });
    });
});




// Delete a decision via ID from database
app.delete('/api/decision/:decisionId', (req, res) => {
    const { decisionId } = req.params;

    const query = 'DELETE FROM decisions WHERE id = ?';
    db.query(query, [decisionId], (err, result) => {
        if (err) {
            console.error('Error deleting decision:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Decision not found' });
        }
        res.json({ message: 'Decision deleted successfully' });
    });
});

// Delete a fixture via ID from database
app.delete('/api/fixtures/:matchweek/:fixtureId', (req, res) => {
    const { fixtureId } = req.params;

    const query = 'DELETE FROM fixtures WHERE id = ?';
    db.query(query, [fixtureId], (err, result) => {
        if (err) {
            console.error('Error deleting fixture:', err);
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Fixture not found' });
        }
        res.json({ message: 'Fixture deleted successfully' });
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
