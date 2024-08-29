$(document).ready(function() {
	$('#register-form').submit(function(event) {
		event.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();
        const confirmPass = $('#confirmPass').val();
        const email = $('#email').val();

        if (password !== confirmPass) {
            Swal.fire('Error!', 'Passwords do not match', 'error');
        } else {

            $.post('/register', { username, password, email }, function(data) {
                Swal.fire('Success!', 'Registration Successful', 'success')
                .then((result) => {
                    if (result.isConfirmed || result.isDismissed) {
                        $('#register-form').find('input').val('');

                        window.location.href = 'login.html';
                    }
                });
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 400) {
                    var response = JSON.parse(jqXHR.responseText);
                    if (response.message === 'Email already exists') {
                        Swal.fire('Error!', 'Email already exists', 'error');
                    } else if (response.message === 'Username already exists') {
                        Swal.fire('Error!', 'Username already exists', 'error');
                    } else {
                        Swal.fire('Error!', response.message, 'error');
                    }
                }
            });
        }
    });
});