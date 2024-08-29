$(document).ready(function() {
    $('#login-form').submit(function(event) {
        event.preventDefault();
        const username = $('#username').val();
        const password = $('#password').val();

        $.post('/login', { username, password })
            .done(function(data) {
                if (data.isAdmin) {
                    window.location.href = 'admin.html';
                } else if (data.needAuthCode) {
                    Swal.fire({
                        title: 'Enter Authentication Code',
                        input: 'text',
                        showCancelButton: true,
                        confirmButtonText: 'Verify',
                        showLoaderOnConfirm: true,
                        preConfirm: (code) => {
                            return fetch(`/verify-code?userId=${data.userId}&code=${code}`, {
                                method: 'GET',
                            })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Verification failed');
                                }
                                return response.json();
                            })
                            .then(data => {
                                if (data.verified) {
                                    sessionStorage.setItem('userId', data.userId);
                                    sessionStorage.setItem('username', data.username);
                                    Swal.fire('Verified!', 'You are successfully logged in.', 'success');
                                    window.location.href = 'main.html';
                                } else {
                                    throw new Error(data.message);
                                }
                            })
                            .catch(error => {
                                Swal.showValidationMessage(`Request failed: ${error}`);
                            });
                        },
                        allowOutsideClick: () => !Swal.isLoading()
                    });
                } else {
                    sessionStorage.setItem('userId', data.userId);
                    sessionStorage.setItem('username', username);
                    Swal.fire('Login Successful!', 'You are successfully logged in.', 'success')
                        .then(() => window.location.href = 'main.html');
                }
            })
            .fail(function(xhr, status, error) {
                Swal.fire('Error!', 'Invalid Username or Password', 'error');
            });
    });

    $('#forgot-password-link').click(function() {
        Swal.fire({
            title: 'Reset Password',
            text: 'Enter your email to receive a password reset code.',
            input: 'email',
            inputPlaceholder: 'Enter your email',
            showCancelButton: true,
            confirmButtonText: 'Send',
            showLoaderOnConfirm: true,
            preConfirm: (email) => {
                return fetch('/request-password-reset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                })
                .then(response => {
                    return response.json().then(data => {
                        if (!response.ok) {
                            throw new Error(data.message || 'No account found with the given email');
                        }
                        return data;
                    });
                });
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                askForVerificationCode();
            }
        }).catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'An error occurred. Please try again.'
            });
        });
    });
    
    
});

function askForVerificationCode() {
    Swal.fire({
        title: 'Verification Code',
        text: 'Please enter the verification code sent to your email',
        input: 'text',
        showCancelButton: true,
        confirmButtonText: 'Validate',
        showLoaderOnConfirm: true,
        preConfirm: (code) => {
            return fetch('/validate-reset-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Verification failed');
                }
                return response.json();
            })
            .then(data => {
                askForNewPassword(data.userId);
            })
            .catch(error => {
                Swal.showValidationMessage(`Verification failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    });
}

function askForNewPassword(userId) {
    Swal.fire({
        title: 'Set New Password',
        html:
            '<input id="swal-input1" class="swal2-input" placeholder="New Password" type="password">' +
            '<input id="swal-input2" class="swal2-input" placeholder="Confirm Password" type="password">',
        focusConfirm: false,
        preConfirm: () => {
            const newPassword = document.getElementById('swal-input1').value;
            const confirmPassword = document.getElementById('swal-input2').value;

            if (newPassword !== confirmPassword) {
                Swal.showValidationMessage('Passwords do not match');
                return false;
            }

            return fetch('/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    newPassword: newPassword
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Password reset failed');
                }
                return response.json();
            })
            .then(data => {
                Swal.fire('Success!', 'Your password has been reset.', 'success');
            })
            .catch(error => {
                Swal.fire('Error!', error.message, 'error');
            });
        }
    });
}
