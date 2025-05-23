const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = 5058;

const session = require('express-session');

app.use(session({
    secret: '40309685',
    resave: false,
    saveUninitialized: true,
}));


app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, "public")));

// Load header and footer once
const header = fs.readFileSync(path.join(__dirname, "templates", "header.html"), "utf-8");
const footer = fs.readFileSync(path.join(__dirname, "templates", "footer.html"), "utf-8");

function renderPage(res, pageFile, title, stylesheet, messageHtml = "", extraHtml = {}) {
    let pageContent = fs.readFileSync(path.join(__dirname, "pages", pageFile), "utf-8");

    // Replace known placeholders
    pageContent = pageContent.replace("<!--MESSAGE-->", `<div class="message">${messageHtml}</div>`);
    if (extraHtml.petCards) {
        pageContent = pageContent.replace("<!--PET_CARDS-->", extraHtml.petCards);
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>${title}</title>
            <link rel="stylesheet" href="/stylesheets/Default.css">
            <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css">
            ${stylesheet ? `<link rel="stylesheet" href="${stylesheet}">` : ''}
        </head>
        <body>
            ${header}
            <div class="w3-row">
                <div class="Navigation">
                    <ul>
                        <li><a href="/CreateAccount">Create Account</a></li>
                        <li><a href="/Home">Home Page</a></li>
                        <li><a href="/FindDogCat">Find a Dog/Cat</a></li>
                        <li><a href="/DogCare">Dog Care</a></li>
                        <li><a href="/CatCare">Cat Care</a></li>
                        <li><a href="/PetGiveaway">Have a Pet to Give Away</a></li>
                        <li><a href="/ContactUs">Contact Us</a></li>
                        <li><a href="/Logout">Logout</a></li>
                    </ul>
                </div>
                <div class="Content">
                    ${pageContent}
                </div>
            </div>
            ${footer}
            <script src="/scripts.js"></script>
        </body>
        </html>
    `);
}

// Routes
app.get("/", (_, res) => renderPage(res, "Home.html", "Home"));
app.get("/CreateAccount", (_, res) => renderPage(res, "CreateAccount.html", "Sign Up", "/stylesheets/CreateAccount.css"));
app.get("/Home", (_, res) => renderPage(res, "Home.html", "Home"));
app.get("/FindDogCat", (_, res) => renderPage(res, "FindDogCat.html", "Find Dog/Cat", "/stylesheets/FindDogCat.css"));
app.get("/DogCare", (_, res) => renderPage(res, "DogCare.html", "Dog Care"));
app.get("/CatCare", (_, res) => renderPage(res, "CatCare.html", "Cat Care"));
app.get("/PetGiveaway", (req, res) => {
    if (!req.session.username) {
        renderPage(res, "Login.html", "Login to Give Away a Pet", "/stylesheets/CreateAccount.css");
    } else {
        renderPage(res, "PetGiveaway.html", "Give Away a Pet", "/stylesheets/PetGiveaway.css");
    }
});
app.get("/ContactUs", (_, res) => renderPage(res, "ContactUs.html", "Contact Us"));
app.get("/PrivacyDisclaimer", (_, res) => renderPage(res, "PrivacyDisclaimer.html", "Privacy/Disclaimer"));


app.post('/searchPets', (req, res) => {
    const { animal, breed, age, gender, compatibility } = req.body;
    const selectedCompatibilities = Array.isArray(compatibility) ? compatibility : ["None"];
    const petsFilePath = path.join(__dirname, 'pets.txt');

    fs.readFile(petsFilePath, 'utf8', (readErr, data) => {
        if (readErr) {
            return renderPage(res, 'Browse.html', 'Browse Pets', '',
                '<p style="color:red;">Error reading pet data.</p>'
            );
        }

        const pets = data.split('\n').map(line => {
            const parts = line.split(':');
            if (parts.length < 7) return null; // Skip malformed or empty lines

            const compat = parts[6] !== "None" ? parts[6].split(',').map(c => c.trim()) : ["None"];
            
            // Check if the line has an image URL after the email part
            let imageField = null;
            if (parts.length > 9) {
                // If there is more than 9 parts, we assume the last part is the image URL
                imageField = parts.slice(10).join(':');  // Join back any potential split by semicolons
            }

            const petImage = imageField || "https://cdni.iconscout.com/illustration/premium/thumb/pet-adopt-illustration-download-in-svg-png-gif-file-formats--cat-adopting-animal-dog-a-pack-people-illustrations-5829770.png?f=webp";

            return {
                id: parts[0],
                username: parts[1],
                animal: parts[2],
                breed: parts[3],
                age: parts[4],
                gender: parts[5],
                compatibility: compat.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()), // Capitalize compatibility values
                comments: parts[7],
                image: petImage
            };
        }).filter(Boolean); // Remove null entries

        // Filter pets based on search criteria
        const filteredPets = pets.filter(pet => {
            // Check if the animal type matches
            const matchesAnimal = pet.animal === animal;
            // Check if the breed matches or is 'any'
            const matchesBreed = breed === 'any' || pet.breed === breed;
            // Check if the age matches or is 'any'
            const matchesAge = age === 'any' || pet.age === age;
            // Check if the gender matches or is 'any'
            const matchesGender = gender === 'any' || pet.gender === gender;
            // Check if compatibility is not important, or if the pet matches all selected compatibilities
            const matchesCompatibility = selectedCompatibilities[0] === "None" || selectedCompatibilities.every(comp => pet.compatibility.includes(comp));
        
            return matchesAnimal && matchesBreed && matchesAge && matchesGender && matchesCompatibility;
        });

        // If no pets match the search criteria, show an error message
        if (filteredPets.length === 0) {
            return renderPage(res, 'Browse.html', 'Browse Pets', '', 
                '<p style="color:red;">No pets match your search criteria.</p>'
            );
        }

        // Generate pet cards HTML for the filtered pets
        const petCardsHtml = filteredPets.map(pet => {
            const compatibilityList = ['Dogs', 'Cats', 'Children', 'Birds'].map(comp => {
                const isCompatible = pet.compatibility.includes(comp);
                return `<li class="${isCompatible ? 'compatible' : 'not-compatible'}">${comp}</li>`;
            }).join('');

            return `
                <div class="pet-card">
                    <img src="${pet.image}" alt="${pet.id}">
                    <div class="pet-info">
                        <h2><i>"${pet.comments}"</i></h2>
                        <p>Listing by: ${pet.username}</p>
                        <p>Breed: ${pet.breed}</p>
                        <p>Age: ${pet.age}</p>
                        <p>Compatibility:</p>
                        <ul class="compatibility-list">
                            ${compatibilityList}
                        </ul>
                        <button>Interested</button>
                    </div>
                </div>
            `;
        }).join('');

        // Render the page with pet cards
        renderPage(res, "Browse.html", "Browse Pets", "", "", { petCards: petCardsHtml });
    });
});

const LOGIN_FILE = path.join(__dirname, 'logins.txt');

app.post('/CreateAccount', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(LOGIN_FILE, 'utf8', (err, data) => {
        if (err) {
            return renderPage(res, "CreateAccount.html", "Create Account", "/stylesheets/CreateAccount.css",
                '<p style="color:red;">Server error. Please try again later.</p>'
            )
        }

        const lines = data?.split('\n') || [];
        const exists = lines.some(line => line.split(' ')[0] === username);

        if (exists) {
            return renderPage(res, "CreateAccount.html", "Create Account", "/stylesheets/CreateAccount.css",
                '<p style="color:red;">Username already exists. Please choose another.</p>'
            )
        }

        const newLine = `${username} ${password}\n`;
        fs.appendFile(LOGIN_FILE, newLine, (err) => {
            if (err) {
                return renderPage(res, "CreateAccount.html", "Create Account", "/stylesheets/CreateAccount.css",
                    '<p style="color:red;">Failed to create account. Try again later.</p>'
                )
            }

            return renderPage(res, "CreateAccount.html", "Create Account", "/stylesheets/CreateAccount.css",
                '<p style="color:green;">Account created Successfully! You may now log in.</p>'
            )
        });
    });
});


app.post('/Login', (req, res) => {
    const { username, password } = req.body;

    fs.readFile(LOGIN_FILE, 'utf8', (err, data) => {
        if (err) 
            return renderPage(res, "Login.html", "Login to Give Away a Pet","/stylesheets/CreateAccount.css",
        `<p style="color:red;">Error reading login file. Please try again later.</p>`);

        const lines = data.split('\n');
        const valid = lines.some(line => {
            const [user, pass] = line.split(' ');
            return user === username && pass === password;
        });

        if (valid) {
            req.session.username = username;
            return res.redirect('/PetGiveaway');
        } else {
            // Show error message on the same page
            return renderPage(res, "Login.html", "Login to Give Away a Pet", "/stylesheets/CreateAccount.css",
                `<p style="color:red;">Invalid username or password. Please try again.</p>`);
        }
    });

});


  // Route to handle petGiveawayForm submission
const PETS_FILE = path.join(__dirname, 'pets.txt');

app.post('/submitPetGiveaway', (req, res) => {
    const { animal, breed, age, gender, compatibility, comments, ownerName, ownerEmail } = req.body;
    const username = req.session.username;

    // Convert compatibility array to a string (if not provided, default to "None")
    const compatibilityString = compatibility && compatibility.length > 0 ? compatibility.join(', ') : 'None';

        // Check if the pet submission data is valid, and append to file
        fs.readFile(PETS_FILE, 'utf8', (err, data) => {
            if (err && err.code !== 'ENOENT') {
                return sendWithMessage(`<p style="color:red;">Server error. Please try again later.</p>`);
            }

            const lines = data ? data.split('\n') : [];
            const nextId = lines.length + 1;

            // Create the new pet entry
            const newPetEntry = `${nextId}:${username}:${animal}:${breed}:${age}:${gender}:${compatibilityString}:${comments}:${ownerName}:${ownerEmail}\n`;

            // Append the new pet entry to the file
            fs.appendFile(PETS_FILE, newPetEntry, (err) => {
                if (err) {
                    return renderPage(res, "PetGiveaway.html", "Pet Giveaway", "/stylesheets/PetGiveaway.css",
                        '<p style="color:red;">Failed to submit pet. Please try again later.</p>'
                    )
                }

                // Show success message after successful submission
                return renderPage(res, "PetGiveaway.html", "Pet Giveaway", "/stylesheets/PetGiveaway.css",
                    '<p style="color:green;">Your pet has been successfully submited for adoption!</p>'
                )
        });
    });
});

app.get('/Logout', (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout Error:', err);
            return res.send('Error logging out.');
        }

        // Redirect to a confirmation page or render it directly
        renderPage(res, "LogoutConfirmation.html", "Logout Successful!");
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

