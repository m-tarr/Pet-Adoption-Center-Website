// Function to update the date and time
function updateDateTime() {
    const now = new Date();
    const formattedDateTime = now.toLocaleString(); // Format the date and time
    document.getElementById("dateTime").innerHTML = formattedDateTime;
}

// Update the time every second
setInterval(updateDateTime, 1000);

// Initial call to display immediately
updateDateTime();

function validateForm(event) {
    // Get the form that triggered the event (use event.target)
    const form = event.target;

    // Get all required fields for validation using getElementById
    const animal = document.getElementById('animal').value;
    const breed = document.getElementById('breed').value;
    const age = document.getElementById('age').value;
    const gender = document.getElementById('gender').value;

    // Clear previous error message
    document.getElementById('error-message').textContent = '';

    // Basic validation for required fields
    if (animal === '' || breed === '' || age === '' || gender === '') {
        document.getElementById('error-message').textContent = 'Please fill in all required fields!';
        return false;  // Prevent form submission if validation fails
    }

    // Check additional fields (owner name, email, comments)
    const ownerName = document.getElementById('owner-name').value;
    const ownerEmail = document.getElementById('owner-email').value;
    const comments = document.getElementById('comments').value;

    // Validate owner-name and comments (required)
    if (comments === '' || ownerName === '') {
        document.getElementById('error-message').textContent = 'Please fill in all required fields!';
        return false; // Prevent form submission if required fields are empty
    }

    // Validate email (required and in correct format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (ownerEmail === '') {
        document.getElementById('error-message').textContent = 'Please enter a valid email address!';
        return false;
    } else if (!emailRegex.test(ownerEmail)) {
        document.getElementById('error-message').textContent = 'Please enter a valid email address!';
        return false;
    }

    // If all validations pass, allow form submission
    return true;  // This will allow the form to submit
}


// Functions for the Account Creation form

function showPassword() {
    var x = document.getElementById("password");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  }

  function isValidUsername(username) {
    return /^[A-Za-z0-9]+$/.test(username);
  }

  function isValidPassword(password) {
    return /^[A-Za-z0-9]{4,}$/.test(password) && /[A-Za-z]/.test(password) && /\d/.test(password);
  }

  const forms = ['createaccount', 'loginform'];

  forms.forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;
  
    form.addEventListener('submit', function (e) {
      const username = form.querySelector('input[name="username"]')?.value.trim();
      const password = form.querySelector('input[name="password"]')?.value;
  
      if (!isValidUsername(username)) {
        alert('Username must contain only letters and digits.');
        e.preventDefault();
        return;
      }
  
      if (!isValidPassword(password)) {
        alert('Password must be at least 4 characters, contain at least one letter and one digit, and use only letters and digits.');
        e.preventDefault();
        return;
      }
    });
  });
  