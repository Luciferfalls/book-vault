document.addEventListener('DOMContentLoaded', () => {
    
const addBookModal = document.getElementById('addBookModal');
const addBookForm = document.getElementById('addBookForm');
const bookTypeDropdown = document.getElementById('bookType');
const coverUrlField = document.getElementById("addBookCover");
const coverPreview = document.getElementById("coverPreview");
const toBeReadSection = document.getElementById('toBeReadSection');
const goalContainer = document.querySelector('.goal-container');
const goalDisplay = document.getElementById('goalCount');
const currentlyReadingBtn = document.getElementById('currentlyReadingBtn');
const finishedBooksBtn = document.getElementById('finishedBooksBtn');
const currentlyReadingSection = document.getElementById('currentlyReadingSection');
const finishedBooksSection = document.getElementById('finishedBooksSection');
const modal = document.getElementById('startReadingModal'); // Ensure modal is defined
const form = modal.querySelector('form'); // Get the form within the modal
const addBookButton = document.getElementById('openAddBookModal');
const coverElement = document.getElementById('addBookCover');
const cover = coverElement ? coverElement.value.trim() : './images/placeholder.jpeg';
const resultsContainer = document.getElementById('results-container');

// Select modal elements
const coverModal = document.getElementById('coverModal');
const coverModalImage = document.getElementById('coverModalImage');

let currentYear = new Date().getFullYear();
let yearlyGoal = 50;  // Default Goal
let booksRead = 0;
let allBooks = JSON.parse(localStorage.getItem('books')) || [];

// Retrieve the sort order from localStorage, defaulting to 'desc'
let finishedSortOrder = localStorage.getItem('finishedSortOrder') || 'desc';


const toggleViewBtn = document.getElementById('toggleView');
const sections = [toBeReadSection, currentlyReadingSection, finishedBooksSection];

let currentSortOrder = 'desc'; // Default sorting order

toggleViewBtn.addEventListener('click', () => {
    const sections = [toBeReadSection, currentlyReadingSection, finishedBooksSection];
    sections.forEach(section => section.classList.toggle('grid-view'));
    
    attachGridViewListeners();
});

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    }
  }  

const sortToggleBtn = document.getElementById('sortToggle');
if (sortToggleBtn) {
    sortToggleBtn.addEventListener('click', () => {
        // Toggle finishedSortOrder between 'desc' and 'asc'
        finishedSortOrder = (finishedSortOrder === 'desc') ? 'asc' : 'desc';
        // Persist the sort order in localStorage
        localStorage.setItem('finishedSortOrder', finishedSortOrder);

        // Filter finished books from allBooks
        let finishedBooks = allBooks.filter(book => book.finished);
        
        // Sort finished books according to finishedSortOrder
        if (finishedSortOrder === 'desc') {
            finishedBooks.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        } else {
            finishedBooks.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
        }
        
        // Now, remove finished books from allBooks and reinsert them in the new order.
        // We'll keep non-finished books in their current order.
        let nonFinishedBooks = allBooks.filter(book => !book.finished);
        
        // Decide where finished books go:
        // If sort order is 'desc', finished books should be at the top.
        // If 'asc', finished books should be at the bottom.
        if (finishedSortOrder === 'desc') {
            allBooks = finishedBooks.concat(nonFinishedBooks);
        } else {
            allBooks = nonFinishedBooks.concat(finishedBooks);
        }
        
        // Save the updated order and re-render
        updateAppState();
    });
}

function attachGridViewListeners() {
    const bookEntries = document.querySelectorAll('.book-entry');

    bookEntries.forEach(entry => {
        entry.addEventListener('click', () => {
            if (entry.closest('.grid-view')) {
                entry.classList.toggle('expanded');
            } else {
                const coverModal = document.getElementById('coverModal');
                const coverModalImage = document.getElementById('coverModalImage');
                coverModalImage.src = entry.style.backgroundImage.slice(5, -2);
                coverModal.style.display = 'flex';
                coverModal.classList.add('active');
            }
        });
    });
}

coverUrlField.addEventListener('input', () => {
    const url = coverUrlField.value.trim();
    coverPreview.src = url || './images/placeholder.jpeg';
});

if (!modal) console.error("Start Reading Modal not found!");

function updateCoverPreview() {
    const url = coverUrlField.value.trim();
    coverPreview.src = url || './images/placeholder.jpeg';
}

coverUrlField.addEventListener('input', updateCoverPreview);
coverUrlField.addEventListener('change', updateCoverPreview);

// Trigger update when autofill occurs
setInterval(updateCoverPreview, 500);

function closeModal(modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';

    const form = modal.querySelector('form');
    if (form) {
        form.reset(); // Clear form fields without replacing
    }
}

addBookButton.addEventListener('click', () => {
    if (addBookButton) {
        addBookButton.addEventListener('click', () => {
            if (addBookModal) {    
                addBookModal.style.display = 'flex';
                addBookModal.classList.add('active');
    
                console.log("After:", {
                    display: addBookModal.style.display,
                    classList: addBookModal.classList,
                });
            } else {
                console.error("Add Book modal not found.");
            }
        });
    } else {
        console.error("Add Book button not found.");
    }
});

// Add event listeners for closing modals via "X" button
const closeButtons = document.querySelectorAll('.close-modal');
if (closeButtons) {
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) closeModal(modal);
        });
    });
} else {
    console.warn("No elements with class 'close-modal' found.");
}

// Close modal when clicking outside the modal content
window.addEventListener('click', (e) => {
    const modals = document.querySelectorAll('.modal.active');
    if (modals.length > 0) {
        modals.forEach(modal => {
            if (e.target === modal) closeModal(modal);
        });
    } else {
    }
});

// Close modal when pressing the Escape key
window.addEventListener('keydown', (e) => {
    const activeModal = document.querySelector('.modal.active');
    if (e.key === 'Escape' && activeModal) {
        closeModal(activeModal);
    }
});

function updateAppState() {
    localStorage.setItem('books', JSON.stringify(allBooks)); // Save books to local storage
    updateDashboard();
    displayBooks();
    attachStartReadingListeners();
    attachFinishButtonListeners();
}

function loadGoal() {
    const savedGoal = localStorage.getItem(`goal-${currentYear}`);
    yearlyGoal = savedGoal ? parseInt(savedGoal, 10) : 50; // Default to 50 if no saved goal
}

function updateDashboard() {
    // Update year in the dashboard header
    document.getElementById('currentYear').textContent = currentYear;

    // Filter books finished in the current year
    const booksThisYear = allBooks.filter(book =>
        book.finished && new Date(book.endDate).getFullYear() === currentYear
    );

    // Update book count
    const booksRead = booksThisYear.length;
    document.getElementById('booksReadCount').textContent = booksRead;

    // Load and display the goal for the current year
    const savedGoal = localStorage.getItem(`goal-${currentYear}`);
    document.getElementById('goalCount').textContent = savedGoal ? savedGoal : yearlyGoal;
}

goalDisplay.addEventListener('click', () => {
    let newGoal = prompt("Enter your new yearly goal:", goalDisplay.textContent);
    if (newGoal !== null && !isNaN(newGoal)) {
        yearlyGoal = parseInt(newGoal, 10);
        localStorage.setItem(`goal-${currentYear}`, yearlyGoal);
        updateDashboard();
    }
});

function formatDate(dateString) {
    const date = new Date(`${dateString}T00:00:00`);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
}

function formatTime(timeString) {
    if (!timeString.includes(':')) return timeString;

    const [hours, minutes] = timeString.split(':').map(Number);
    const hourText = hours > 0 ? `${hours} hour${hours !== 1 ? 's' : ''}` : '';
    const minuteText = minutes > 0 ? `${minutes} minute${minutes !== 1 ? 's' : ''}` : '';

    return `${hourText}${hourText && minuteText ? ' and ' : ''}${minuteText}`;
}

function getAvailableYears() {
    const books = JSON.parse(localStorage.getItem('books')) || [];
    let years = books
        .map(book => {
            if (book.endDate) return new Date(book.endDate).getFullYear();
            if (book.startDate) return new Date(book.startDate).getFullYear();
            return null;
        })
        .filter(year => year !== null)
        .filter((year, index, self) => self.indexOf(year) === index)
        .sort((a, b) => b - a);
    
    // Always include the current year
    if (!years.includes(currentYear)) {
        years.push(currentYear);
        years.sort((a, b) => b - a);
    }
    return years;
}      

function filterBooksByYear(selectedYear) {
    let books = JSON.parse(localStorage.getItem('books')) || [];

    return books.filter(book => {
        const endYear = book.endDate ? new Date(book.endDate).getFullYear() : null;
        return endYear === selectedYear || (!book.finished && selectedYear === currentYear);
    });
}       
    
// Attach Start Reading Listener Function
function attachStartReadingListeners() {
    const startReadingButtons = document.querySelectorAll('.start-reading-btn');

    startReadingButtons.forEach(button => {
        if (!button.dataset.listenerAttached) {
            button.addEventListener('click', () => {
                const bookId = button.dataset.bookId;
                console.log(`Opening Start Reading Modal for bookId: ${bookId}`);
                openStartReadingModal(bookId);
            });
            button.dataset.listenerAttached = true; // Prevent duplicate listeners
        }
    });
}

// Function to open edit modal
function openEditBookModal(book) {
    const modal = document.getElementById('editBookModal');
    const form = modal.querySelector('form');

    form.dataset.bookId = book.id; // Attach book ID to the form
    console.log(`Opening Edit Modal for bookId: ${book.id}`); // Log bookId

    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editPublicationYear').value = book.year;
    document.getElementById('editBookPages').value = book.pages;
    document.getElementById('editBookCover').value = book.cover;
    document.getElementById('editStartDate').value = book.startDate || '';

    modal.classList.add('active');
    modal.style.display = 'flex';

    // Clean up and reattach the event listener
    form.removeEventListener('submit', handleEditBookSubmit);
    form.addEventListener('submit', handleEditBookSubmit); // This must refer to a globally defined function
}

function handleEditBookSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const bookId = form.dataset.bookId;
    const updatedTitle = document.getElementById('editBookTitle').value.trim();
    const updatedAuthor = document.getElementById('editBookAuthor').value.trim();
    const updatedYear = parseInt(document.getElementById('editPublicationYear').value, 10);
    const updatedPages = parseInt(document.getElementById('editBookPages').value, 10);
    const updatedCover = document.getElementById('editBookCover').value.trim() || './images/placeholder.jpeg';
    // Get the start date from the edit form
    const updatedStartDate = document.getElementById('editStartDate').value.trim();

    allBooks = allBooks.map((book) => {
        if (book.id === bookId) {
            return {
                ...book,
                title: updatedTitle,
                author: updatedAuthor,
                year: updatedYear,
                pages: updatedPages,
                cover: updatedCover,
                startDate: updatedStartDate, // Update start date
            };
        }
        return book;
    });

    updateAppState();
    closeModal(document.getElementById('editBookModal'));
}

// Function to open the Start Reading modal
function openStartReadingModal(bookId) {
    const modal = document.getElementById('startReadingModal');
    const form = modal.querySelector('form');
    form.dataset.bookId = bookId;

    modal.classList.add('active');
    modal.style.display = 'flex';

    form.removeEventListener('submit', handleStartReadingSubmit);
    form.addEventListener('submit', handleStartReadingSubmit);
}

function handleStartReadingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const bookId = form.dataset.bookId;
    // Get the start date from the input field in the Start Reading Modal
    const startReadingDate = form.querySelector('#startReadingDate').value.trim();
    
    if (!startReadingDate) {
        alert("Please enter a start date.");
        return;
    }

    allBooks = allBooks.map(book => {
        if (book.id === bookId) {
            return { ...book, tbr: false, startDate: startReadingDate };
        }
        return book;
    });

    updateAppState();
    closeModal(document.getElementById('startReadingModal'));
}

function attachFinishButtonListeners() {
    const finishButtons = document.querySelectorAll('.finish-btn');

    finishButtons.forEach(button => {
        if (!button.dataset.listenerAttached) {
            button.addEventListener('click', () => {
                const bookId = button.dataset.bookId;
                console.log(`Opening Finish Reading Modal for bookId: ${bookId}`);
                openFinishReadingModal(bookId);
            });
            button.dataset.listenerAttached = true; // Prevent duplicate listeners
        }
    });
}

function openFinishReadingModal(bookId) {
    const modal = document.getElementById('finishReadingModal');
    const form = modal.querySelector('form');
    form.dataset.bookId = bookId;

    modal.classList.add('active');
    modal.style.display = 'flex';

    form.removeEventListener('submit', handleFinishReadingSubmit);
    form.addEventListener('submit', handleFinishReadingSubmit);
}

function handleFinishReadingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const bookId = form.dataset.bookId; // Retrieve the book ID attached to the form
    console.log(`Submitting Finish Reading for bookId: ${bookId}`); // Debug log

    const endDate = form.querySelector('#finishReadingDate').value.trim();
    const pagesPerHour = parseFloat(form.querySelector('#pagesPerHour').value.trim());
    const timeToRead = form.querySelector('#timeToRead').value.trim();

    console.log(`End Date: ${endDate}, Pages Per Hour: ${pagesPerHour}, Time to Read: ${timeToRead}`);

    if (!endDate || isNaN(pagesPerHour) || !timeToRead) {
        alert('All fields are required.');
        return;
    }

    allBooks = allBooks.map(book => {
        if (book.id === bookId) {
            const start = new Date(book.startDate);
            const end = new Date(endDate);
            return {
                ...book,
                endDate,
                pagesPerHour,
                timeToRead,
                totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
                finished: true,
                tbr: false,
            };
        }
        return book;
    });

    console.log('Updated allBooks array:', allBooks);

    updateAppState();
    closeModal(document.getElementById('finishReadingModal'));
}

function handleFinishReadingSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const bookId = form.dataset.bookId; // Retrieve the book ID attached to the form
    console.log(`Submitting Finish Reading for bookId: ${bookId}`); // Debug log

    const endDate = form.querySelector('#finishReadingDate').value.trim();
    const pagesPerHour = parseFloat(form.querySelector('#pagesPerHour').value.trim());
    const timeToRead = form.querySelector('#timeToRead').value.trim();

    console.log(`End Date: ${endDate}, Pages Per Hour: ${pagesPerHour}, Time to Read: ${timeToRead}`);

    if (!endDate || isNaN(pagesPerHour) || !timeToRead) {
        alert('All fields are required.');
        return;
    }

    allBooks = allBooks.map(book => {
        if (book.id === bookId) {
            const start = new Date(book.startDate);
            const end = new Date(endDate);
            const updatedBook = {
                ...book,
                endDate,
                pagesPerHour,
                timeToRead,
                totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1,
                finished: true,
            };
            console.log('Updated Book:', updatedBook);
            return updatedBook;
        }
        return book;
    });

    console.log('Updated allBooks array:', allBooks);

    updateAppState();
    closeModal(document.getElementById('finishReadingModal'));
}

function displayBooks() {
    // Clear all sections
    toBeReadSection.innerHTML = '';
    currentlyReadingSection.innerHTML = '';
    finishedBooksSection.innerHTML = '';

    // Create headers for Currently Reading and Finished Books
    const currentlyReadingHeader = document.createElement('h2');
    currentlyReadingHeader.textContent = 'Currently Reading';
    currentlyReadingSection.appendChild(currentlyReadingHeader);

    const finishedBooksHeader = document.createElement('h2');
    finishedBooksHeader.textContent = 'Finished Books';
    finishedBooksSection.appendChild(finishedBooksHeader);

    // Get filtered books for the current year
    let filteredBooks = filterBooksByYear(currentYear);

    // --- Process TBR Books Separately ---
    // Create and append header for TBR
    const toBeReadHeader = document.createElement('h2');
    toBeReadHeader.textContent = 'To Be Read';
    toBeReadSection.appendChild(toBeReadHeader);

    // Filter out TBR books
    const tbrBooks = filteredBooks.filter(book => book.tbr);

    // Sort TBR books so that pinned ones come first
    tbrBooks.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
    });

    // Render each TBR book
    tbrBooks.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.classList.add('book-entry');
       
        bookElement.style.backgroundImage = `url('${book.cover || './images/placeholder.jpeg'}')`;
        bookElement.style.backgroundSize = 'cover';
        bookElement.style.backgroundRepeat = 'no-repeat';
        bookElement.style.backgroundPosition = book.backgroundPosition || 'center';
        bookElement.style.opacity = '0.8';        

        // Set the inner HTML for book details
        bookElement.innerHTML = `
            <div class="book-container">
                <div class="cover-and-options">
                    <img src="${book.cover}" alt="${book.title} Cover" class="book-cover">
                    <button class="more-options-btn">...</button>
                    <div class="dropdown hidden book-options">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn" data-book-id="${book.id}">Delete</button>
                        <button class="adjust-background-btn" data-book-id="${book.id}">Adjust Background</button>
                    </div>
                </div>
                <div class="book-details">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <p>${book.year}</p>
                    <p>${book.pages} pages</p>
                </div>
            </div>
        `;

        // ----- More Options Toggle for TBR Books -----
        const moreOptionsBtn = bookElement.querySelector('.more-options-btn');
        const dropdown = bookElement.querySelector('.dropdown');
        if (moreOptionsBtn && dropdown) {
            moreOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('hidden');
            });
        }

        // ----- Attach Dropdown Button Listeners for TBR Books -----
        // Edit Button
        const editButton = bookElement.querySelector('.edit-btn');
        if (editButton) {
            editButton.addEventListener('click', () => {
                openEditBookModal(book);
            });
        }

        // Delete Button
        const deleteButton = bookElement.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                const bookId = deleteButton.dataset.bookId;
                deleteBook(bookId);
            });
        }

        const adjustBackgroundButton = bookElement.querySelector('.adjust-background-btn');
        if (adjustBackgroundButton) {
            adjustBackgroundButton.addEventListener('click', (e) => {
                // Prevent the click from bubbling up and interfering with the dropdown toggle
                e.stopPropagation();
                e.preventDefault();
                
                // Ensure the book has a defined backgroundPosition; default to 'center' if not.
                if (!book.backgroundPosition || book.backgroundPosition === "") {
                    book.backgroundPosition = 'center';
                }
                
                // Cycle through positions: center -> bottom -> top -> center
                if (book.backgroundPosition === 'center') {
                    book.backgroundPosition = 'bottom';
                } else if (book.backgroundPosition === 'bottom') {
                    book.backgroundPosition = 'top';
                } else {
                    book.backgroundPosition = 'center';
                }
                
                console.log("New background position for", book.title, ":", book.backgroundPosition);
                
                // Update the inline style of the book element to use the new background position
                bookElement.style.backgroundPosition = book.backgroundPosition;
                
                // Update the global allBooks array for this book
                allBooks = allBooks.map(b => {
                    if (b.id === book.id) {
                        return { ...b, backgroundPosition: book.backgroundPosition };
                    }
                    return b;
                });
                // Save the updated array to localStorage (without re-rendering the whole UI)
                localStorage.setItem('books', JSON.stringify(allBooks));
            });
        }

        // ----- Pin Button for TBR Books -----
        const pinButton = document.createElement('button');
        pinButton.classList.add('pin-btn');
        // Use an inline SVG (which we already replaced) so that it can be styled via CSS.
        pinButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0L6 4H2v4h4l2 4 2-4h4V4H10L8 0z"/>
        </svg>`;
        if (book.isPinned) {
            pinButton.classList.add('pinned');
        }
        pinButton.addEventListener('click', () => {
            allBooks = allBooks.map(b => {
                if (b.id === book.id) {
                    return { ...b, isPinned: !b.isPinned };
                }
                return b;
            });
            updateAppState();
        });
        const bookDetailsDiv = bookElement.querySelector('.book-details');
        bookDetailsDiv.prepend(pinButton);

        // ----- Start Reading Button for TBR Books -----
        const startReadingBtn = document.createElement('button');
        startReadingBtn.textContent = 'Start Reading';
        startReadingBtn.classList.add('start-reading-btn');
        startReadingBtn.dataset.bookId = book.id;
        startReadingBtn.addEventListener('click', () => openStartReadingModal(book.id));
        bookDetailsDiv.appendChild(startReadingBtn);

        // Append the TBR book element to the TBR section
        toBeReadSection.appendChild(bookElement);
    });


    // --- Process Non-TBR Books ---
    // These include "Currently Reading" and "Finished" books.
    filteredBooks.forEach(book => {
        if (book.tbr) {
            // TBR books are handled above
            return;
        }

        const bookElement = document.createElement('div');
        bookElement.classList.add('book-entry');
        bookElement.style.backgroundImage = `url('${book.cover || './images/placeholder.jpeg'}')`;
        bookElement.style.backgroundSize = 'cover';
        bookElement.style.backgroundRepeat = 'no-repeat';
        bookElement.style.backgroundPosition = book.backgroundPosition || 'center';
        bookElement.style.opacity = '0.8';        

        const formattedStartDate = formatDate(book.startDate);
        const formattedEndDate = book.endDate ? formatDate(book.endDate) : null;
        const formattedTime = book.timeToRead ? formatTime(book.timeToRead) : 'N/A';

        bookElement.innerHTML = `
            <div class="book-container">
                <div class="cover-and-options">
                    <img src="${book.cover}" alt="${book.title} Cover" class="book-cover">
                    <button class="more-options-btn">...</button>
                    <div class="dropdown hidden book-options">
                        <button class="edit-btn">Edit</button>
                        <button class="delete-btn" data-book-id="${book.id}">Delete</button>
                        <button class="adjust-background-btn" data-book-id="${book.id}">Adjust Background</button>
                    </div>
                </div>
                <div class="book-details">
                    <h3>${book.title}</h3>
                    <p>${book.author}</p>
                    <p>${book.year}</p>
                    <p>${book.pages} pages</p>
                    ${book.tbr ? '' : `<p><strong>Start Date:</strong> ${formatDate(book.startDate)}</p>`}
                    ${book.finished ? `<p><strong>End Date:</strong> ${formatDate(book.endDate)}</p>` : ''}
                    ${book.finished && book.pagesPerHour ? `<p><strong>Pages per Hour:</strong> ${book.pagesPerHour}</p>` : ''}
                    ${book.finished && book.timeToRead ? `<p><strong>Total Reading Time:</strong> ${book.timeToRead}</p>` : ''}
                </div>
            </div>
        `;

        const adjustBackgroundButton = bookElement.querySelector('.adjust-background-btn');
        if (adjustBackgroundButton) {
            adjustBackgroundButton.addEventListener('click', (e) => {
                // Prevent the click from bubbling up and interfering with the dropdown toggle
                e.stopPropagation();
                e.preventDefault();
                
                // Ensure the book has a defined backgroundPosition; default to 'center' if not.
                if (!book.backgroundPosition || book.backgroundPosition === "") {
                    book.backgroundPosition = 'center';
                }
                
                // Cycle through positions: center -> bottom -> top -> center
                if (book.backgroundPosition === 'center') {
                    book.backgroundPosition = 'bottom';
                } else if (book.backgroundPosition === 'bottom') {
                    book.backgroundPosition = 'top';
                } else {
                    book.backgroundPosition = 'center';
                }
                
                console.log("New background position for", book.title, ":", book.backgroundPosition);
                
                // Update the inline style of the book element to use the new background position
                bookElement.style.backgroundPosition = book.backgroundPosition;
                
                // Update the global allBooks array for this book
                allBooks = allBooks.map(b => {
                    if (b.id === book.id) {
                        return { ...b, backgroundPosition: book.backgroundPosition };
                    }
                    return b;
                });
                // Save the updated array to localStorage (without re-rendering the whole UI)
                localStorage.setItem('books', JSON.stringify(allBooks));
            });
        }

        // Process Currently Reading books (with progress bar)
        if (!book.finished) {
            // For "Currently Reading" books, ensure currentPage is defined
            if (typeof book.currentPage !== 'number') {
                book.currentPage = 0;
            }
            
            // Create Progress Bar Container
            const progressContainer = document.createElement('div');
            progressContainer.classList.add('progress-container');

            // Create a text element to show the progress (e.g. "77 / 372 (21%)")
            const progressText = document.createElement('p');
            progressText.classList.add('progress-text');
            const progressPercentage = Math.round((book.currentPage / book.pages) * 100);
            progressText.textContent = `${book.currentPage} / ${book.pages} (${progressPercentage}%)`;
            progressContainer.appendChild(progressText);

            // Create Progress Bar Container (the gray background)
            const progressBarContainer = document.createElement('div');
            progressBarContainer.classList.add('progress-bar-container');

            // Create the Progress Bar element (the green bar)
            const progressBar = document.createElement('div');
            progressBar.classList.add('progress-bar');
            progressBar.setAttribute('data-book-id', book.id);
            const initialProgress = (book.currentPage / book.pages) * 100;
            progressBar.style.width = `${initialProgress}%`;

            progressBarContainer.appendChild(progressBar);
            progressContainer.appendChild(progressBarContainer);

            // Create Update Progress Button
            const updateProgressButton = document.createElement('button');
            updateProgressButton.textContent = 'Update Progress';
            updateProgressButton.classList.add('update-progress-btn');

            updateProgressButton.addEventListener('click', () => {
                const newPage = prompt(`Enter your current page (out of ${book.pages}):`);
                if (!newPage || isNaN(newPage) || newPage < 1 || newPage > book.pages) {
                    alert('Invalid page number. Please enter a number within range.');
                    return;
                }
                
                const updatedValue = parseInt(newPage, 10);
                console.log("✅ New page value entered:", updatedValue);
                allBooks = allBooks.map(b => {
                    if (b.id === book.id) {
                        return { ...b, currentPage: updatedValue };
                    }
                    return b;
                });
                book.currentPage = updatedValue;
                progressText.textContent = `${book.currentPage} / ${book.pages} (${Math.round((book.currentPage / book.pages) * 100)}%)`;
                const newWidth = (book.currentPage / book.pages) * 100;
                console.log(`➡️ New Progress Width should be: ${newWidth}%`);
                progressBar.style.width = `${newWidth}%`;
                updateAppState();
            });

            progressContainer.appendChild(updateProgressButton);
            bookElement.appendChild(progressContainer);

            currentlyReadingSection.appendChild(bookElement);
        } else {
            // If finished, append to finishedBooksSection
            finishedBooksSection.appendChild(bookElement);
        }

        // Add Start Reading button for TBR books if desired (and Mark as Finished for currently reading)
        if (book.tbr) {
            const startReadingBtn = document.createElement('button');
            startReadingBtn.textContent = 'Start Reading';
            startReadingBtn.classList.add('start-reading-btn');
            startReadingBtn.dataset.bookId = book.id;
            startReadingBtn.addEventListener('click', () => openStartReadingModal(book.id));
            bookElement.querySelector('.book-details').appendChild(startReadingBtn);
        } else if (!book.finished) {
            const markFinishedBtn = document.createElement('button');
            markFinishedBtn.textContent = 'Mark as Finished';
            markFinishedBtn.classList.add('finish-btn');
            markFinishedBtn.dataset.bookId = book.id;
            markFinishedBtn.addEventListener('click', () => openFinishReadingModal(book.id));
            bookElement.querySelector('.book-details').appendChild(markFinishedBtn);
        }

        // More options button functionality
        const moreOptionsBtn = bookElement.querySelector('.more-options-btn');
        const dropdown = bookElement.querySelector('.dropdown');

        // Define a function to toggle the dropdown state:
        function toggleDropdown(dd) {
        // If dd currently has the "hidden" class, remove it and add "dropdown-open"
        if (dd.classList.contains('hidden')) {
            dd.classList.remove('hidden');
            dd.classList.add('dropdown-open');
        }
        // Else if it already is open, close it
        else if (dd.classList.contains('dropdown-open')) {
            dd.classList.remove('dropdown-open');
            dd.classList.add('hidden');
        }
        // Otherwise, default to open it
        else {
            dd.classList.add('dropdown-open');
        }
        }

        if (moreOptionsBtn && dropdown) {
        // Ensure the dropdown starts hidden (in case it isn't already)
        if (!dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
        // Attach the click event listener
        moreOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            toggleDropdown(dropdown);
        });
        }


        // Delete button functionality
        const deleteButton = bookElement.querySelector('.delete-btn');
        deleteButton.addEventListener('click', () => {
            const bookId = deleteButton.dataset.bookId;
            deleteBook(bookId);
        });

        // Edit button functionality
        const editButton = bookElement.querySelector('.edit-btn');
        editButton.addEventListener('click', () => {
            openEditBookModal(book);
        });
    });

    attachStartReadingListeners();
    attachFinishButtonListeners();
}   

function deleteBook(bookId) {
    if (confirm('Are you sure you want to delete this book?')) {
        allBooks = allBooks.filter(book => book.id !== bookId);
        localStorage.setItem('books', JSON.stringify(allBooks));
        updateAppState();
    }
}

    toBeReadBtn.addEventListener('click', () => {
        toBeReadSection.classList.add('active');
        currentlyReadingSection.classList.remove('active');
        finishedBooksSection.classList.remove('active');
    
        toBeReadBtn.classList.add('active');
        currentlyReadingBtn.classList.remove('active');
        finishedBooksBtn.classList.remove('active');
    });
    
    currentlyReadingBtn.addEventListener('click', () => {
        currentlyReadingSection.classList.add('active');
        toBeReadSection.classList.remove('active');
        finishedBooksSection.classList.remove('active');
    
        currentlyReadingBtn.classList.add('active');
        toBeReadBtn.classList.remove('active');
        finishedBooksBtn.classList.remove('active');
    });
    
    finishedBooksBtn.addEventListener('click', () => {
        finishedBooksSection.classList.add('active');
        currentlyReadingSection.classList.remove('active');
        toBeReadSection.classList.remove('active');
    
        finishedBooksBtn.classList.add('active');
        currentlyReadingBtn.classList.remove('active');
        toBeReadBtn.classList.remove('active');
    });
    

    finishedBooksBtn.addEventListener('click', () => {
        finishedBooksSection.classList.add('active');
        currentlyReadingSection.classList.remove('active');
    });

    updateAppState(); 
    
    populateYearDropdown();
loadGoal();

document.getElementById('yearSelect').addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value, 10);  // Update selected year
    updateAppState();
    loadGoal();  // Load goal for the selected year
});



function saveUpdatedBook(book) {
let books = JSON.parse(localStorage.getItem('books')) || [];
books = books.map(b => b.title === book.title ? book : b);
localStorage.setItem('books', JSON.stringify(books));
updateAppState();
}

document.getElementById('prevYear').addEventListener('click', () => {
    changeYear(1);
});

document.getElementById('nextYear').addEventListener('click', () => {
    changeYear(-1);
});


function changeYear(amount) {
    const availableYears = getAvailableYears();
    let currentIndex = availableYears.indexOf(currentYear);

    if (currentIndex === -1) {
        currentIndex = availableYears.length - 1; // Default to the most recent year
    }

    const newIndex = currentIndex + amount;
    if (newIndex >= 0 && newIndex < availableYears.length) {
        currentYear = availableYears[newIndex];
        document.getElementById('currentYear').textContent = currentYear; // Update the dashboard year
        document.getElementById('yearSelect').value = currentYear; // Sync dropdown
        loadGoal();
        updateAppState();
    }
}

// Populate dropdown with available years
function populateYearDropdown() {
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.innerHTML = ''; // Clear existing options

    const years = getAvailableYears();
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    yearSelect.value = currentYear; // Set current year as selected
}

// Close the modal when the close button is clicked
document.querySelectorAll('.modal .close-modal').forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        closeModal(modal);
    });
});

// Close the modal when clicking outside of it
window.addEventListener('click', (e) => {
    if (e.target === addBookModal) {
        closeModal(addBookModal);
    }
});

// Close the modal when pressing Escape
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addBookModal.classList.contains('active')) {
        closeModal(addBookModal);
    }
});

form.removeEventListener('submit', handleStartReadingSubmit); // Remove any previous listener
form.addEventListener('submit', handleStartReadingSubmit);

// Open the modal (attach to a single button now)
document.getElementById('openAddBookModal').addEventListener('click', () => {
    addBookModal.style.display = 'flex';
    addBookModal.classList.add('active');
    document.getElementById('readingFields').classList.add('hidden');
    document.getElementById('finishedFields').classList.add('hidden');

    // Reset the search fields:
    const searchTitleInput = document.getElementById('searchTitle');
    const searchTitleResults = document.getElementById('titleSearchResults');
    if (searchTitleInput) {
        searchTitleInput.value = "";
    }
    if (searchTitleResults) {
        searchTitleResults.innerHTML = "";
        searchTitleResults.classList.add("hidden");
    }
    
    // Similarly for searchAuthor:
    const searchAuthorInput = document.getElementById('searchAuthor');
    const searchAuthorResults = document.getElementById('authorSearchResults');
    if (searchAuthorInput) {
        searchAuthorInput.value = "";
    }
    if (searchAuthorResults) {
        searchAuthorResults.innerHTML = "";
        searchAuthorResults.classList.add("hidden");
    }
});

// Book types with radio buttons
const bookTypeOptions = document.querySelectorAll('input[name="bookType"]');

bookTypeOptions.forEach(option => {
    option.addEventListener('change', (e) => {
        const bookType = e.target.value;
        document.getElementById('readingFields').classList.toggle('hidden', bookType !== 'reading' && bookType !== 'finished');
        document.getElementById('finishedFields').classList.toggle('hidden', bookType !== 'finished');
    });
});


// Unified form submission
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const year = parseInt(document.getElementById('publicationYear').value, 10);
    const pages = parseInt(document.getElementById('bookPages').value, 10);

    if (!title || !author || isNaN(year) || isNaN(pages)) {
        console.error("Missing required fields.");
        return;
    }

    const startDate = document.getElementById('startDate').value || null;

    // Only for finished books, read additional fields
    let finishedEndDate = null;
    let pagesPerHour = null;
    let readingTime = null;
    if (selectedBookType === 'finished') {
        finishedEndDate = document.getElementById('endDate').value || null;
        pagesPerHour = parseFloat(document.getElementById('pagesPerHour').value) || null;
        readingTime = document.getElementById('readingTime').value.trim() || null;
    }

    const newBook = {
        id: Date.now().toString(),
        title,
        author,
        year,
        pages,
        cover: document.getElementById('addBookCover').value.trim() || './images/placeholder.jpeg',
        startDate,
        tbr: selectedBookType === 'tbr',
        finished: selectedBookType === 'finished',
        endDate: finishedEndDate,         // NEW: Set finished book's end date
        pagesPerHour: pagesPerHour,         // NEW: Set finished book's pages per hour
        timeToRead: readingTime,            // NEW: Set finished book's total reading time
        backgroundMode: 'cover', // Default
        backgroundPosition: 'center', // Default background position
        currentPage: selectedBookType === 'reading' ? 0 : undefined  // Only for "Currently Reading"
    };

    allBooks.push(newBook);
    updateAppState();
    closeModal(addBookModal);
    addBookForm.reset();
});

if (addBookForm) {
    addBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Form logic here
    });
} else {
    console.warn("Element with id 'addBookForm' not found.");
}


// Add event listener to book covers
document.addEventListener('click', (event) => {
    if (event.target.classList.contains('book-cover')) {
        const coverSrc = event.target.src;
        coverModalImage.src = coverSrc;
        coverModal.classList.add('active');
        coverModal.style.display = 'flex';
    }
});

// Close modal when clicking "X" or outside modal
coverModal.addEventListener('click', () => {
    coverModal.classList.remove('active');
    coverModal.style.display = 'none';
});

async function searchBooks(query, searchType = "intitle") {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchType}:${encodeURIComponent(query)}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const books = data.items || [];

        // Prioritize exact matches
        const exactMatches = books.filter(book => {
            const field = searchType === "intitle" ? book.volumeInfo.title : book.volumeInfo.authors?.join(", ");
            return field?.toLowerCase() === query.toLowerCase();
        });

        // Fallback: Find matches where the field includes the query anywhere
        const includesMatches = books.filter(book => {
            const field = searchType === "intitle" ? book.volumeInfo.title : book.volumeInfo.authors?.join(", ");
            return field?.toLowerCase().includes(query.toLowerCase());
        });

        // Remove duplicates: if a book is an exact match, don't include it twice.
        const finalMatches = [...exactMatches, ...includesMatches.filter(book => !exactMatches.includes(book))];
        return finalMatches;
    } catch (error) {
        console.error("Error fetching books:", error);
        return [];
    }
}

async function searchByISBN(isbn) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(isbn)}`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      // data.items will be an array of matching books (if any)
      return data.items || [];
    } catch (error) {
      console.error("Error fetching ISBN search results:", error);
      return [];
    }
  }  

async function searchCovers(query) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items
        ? data.items
              .filter(item => item.volumeInfo.imageLinks?.thumbnail)
              .map(item => item.volumeInfo.imageLinks.thumbnail)
        : [];
}

// Open Cover Search Modal
const searchCoverButton = document.getElementById('searchCoverButton');
if (searchCoverButton) {
    searchCoverButton.addEventListener('click', async () => {
        const title = document.getElementById('bookTitle').value.trim();
        if (!title) {
            alert("Enter a title first!");
            return;
        }

        const modal = document.getElementById('coverSearchModal');
        const resultsContainer = document.getElementById('coverSearchResults');
        resultsContainer.innerHTML = "Loading...";
        modal.style.display = 'flex';
        modal.classList.add('active');

        const covers = await searchCovers(title);
        resultsContainer.innerHTML = "";
        covers.forEach(cover => {
            if (cover) {
                const img = document.createElement("img");
                img.src = cover;
                img.classList.add("cover-option");
                img.addEventListener('click', () => {
                    document.getElementById('addBookCover').value = cover; // Set selected cover
                    modal.style.display = 'none';
                    modal.classList.remove('active');
                });
                resultsContainer.appendChild(img);
            }
        });
    });
} else {
    console.warn("searchCoverButton not found in the DOM");
}

document.addEventListener('click', (e) => {
    const listItem = e.target.closest('#titleSearchResults li, #authorSearchResults li');
    if (listItem) {
        const bookDetails = JSON.parse(listItem.dataset.book);
        populateToBeReadFields(bookDetails); // Adjust this to the appropriate populate function
        listItem.closest('.results-container').classList.add('hidden');
        resultsContainer.classList.add("hidden");
    }
});

function setupSearchHandler(inputId, resultsId, populateFields, searchType = "intitle") {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);

    if (!input || !resultsContainer) {
        console.warn(`Elements with id '${inputId}' or '${resultsId}' not found.`);
        return;
    }

    // Debounced function to handle input events.
    const handleInput = debounce(async (e) => {
        const query = e.target.value.trim();
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");

        if (query.length > 2) {
            const books = await searchBooks(query, searchType);
            books.forEach((book) => {
                const li = document.createElement("li");
                const bookInfo = book.volumeInfo;

                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${bookInfo.imageLinks?.thumbnail || './images/placeholder.jpeg'}" alt="Cover" style="width: 40px; height: auto; border-radius: 4px;">
                        <div>
                            <strong>${bookInfo.title || "Unknown Title"}</strong>
                            <p>${bookInfo.authors?.join(", ") || "Unknown Author"}</p>
                        </div>
                    </div>`;
                li.dataset.book = JSON.stringify(bookInfo);
                li.addEventListener("click", () => {
                    const bookDetails = JSON.parse(li.dataset.book);
                    populateFields(bookDetails);
                    // Hide the results container after selection
                    resultsContainer.classList.add("hidden");
                    // Clear the input value if desired:
                    input.value = "";
                });
                resultsContainer.appendChild(li);
            });

            if (resultsContainer.children.length > 0) {
                resultsContainer.classList.remove("hidden");
            }
        }
    }, 130); // 130ms delay

    input.addEventListener("input", handleInput);

    // Optionally, remove any global document click listener that clears these fields.
}

function setupISBNSearchHandler(inputId, resultsId, populateFields) {
    const input = document.getElementById(inputId);
    const resultsContainer = document.getElementById(resultsId);

    if (!input || !resultsContainer) {
        console.warn(`Elements with id '${inputId}' or '${resultsId}' not found.`);
        return;
    }

    // Debounce function as before (you can reuse your debounce helper)
    const handleInput = debounce(async (e) => {
        const query = e.target.value.trim();
        resultsContainer.innerHTML = "";
        resultsContainer.classList.add("hidden");

        if (query.length > 3) {  // ISBNs are usually 10 or 13 digits, so wait until at least 4 characters
            const books = await searchByISBN(query);
            books.forEach((book) => {
                const li = document.createElement("li");
                const bookInfo = book.volumeInfo;
                li.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${bookInfo.imageLinks?.thumbnail || './images/placeholder.jpeg'}" alt="Cover" style="width: 40px; height: auto; border-radius: 4px;">
                        <div>
                            <strong>${bookInfo.title || "Unknown Title"}</strong>
                            <p>${bookInfo.authors?.join(", ") || "Unknown Author"}</p>
                        </div>
                    </div>`;
                li.dataset.book = JSON.stringify(bookInfo);
                li.addEventListener("click", () => {
                    const bookDetails = JSON.parse(li.dataset.book);
                    populateFields(bookDetails);
                    resultsContainer.classList.add("hidden");
                    input.value = "";
                });
                resultsContainer.appendChild(li);
            });

            if (resultsContainer.children.length > 0) {
                resultsContainer.classList.remove("hidden");
            }
        }
    }, 300); // You can adjust this delay as needed (300ms, for example)

    input.addEventListener("input", handleInput);
}

function populateToBeReadFields(bookInfo) {
    document.getElementById("bookTitle").value = bookInfo.title || "";
    document.getElementById("bookAuthor").value = bookInfo.authors?.join(", ") || "";
    document.getElementById("publicationYear").value = bookInfo.publishedDate?.split("-")[0] || "";
    document.getElementById("bookPages").value = bookInfo.pageCount || "";
    document.getElementById("addBookCover").value = bookInfo.imageLinks?.thumbnail || "";
}

function populateCurrentlyReadingFields(bookInfo) {
    document.getElementById("addBookTitle").value = bookInfo.title || "";
    document.getElementById("addBookAuthor").value = bookInfo.authors?.join(", ") || "";
    document.getElementById("addPublicationYear").value = bookInfo.publishedDate?.split("-")[0] || "";
    document.getElementById("addBookPages").value = bookInfo.pageCount || "";
    document.getElementById("addBookCover").value = bookInfo.imageLinks?.thumbnail || "";
}

function populateFinishedBookFields(bookInfo) {
    document.getElementById("finishedBookTitle").value = bookInfo.title || "";
    document.getElementById("finishedBookAuthor").value = bookInfo.authors?.join(", ") || "";
    document.getElementById("finishedPublicationYear").value = bookInfo.publishedDate?.split("-")[0] || "";
    document.getElementById("finishedBookPages").value = bookInfo.pageCount || "";
    document.getElementById("finishedBookCover").value = bookInfo.imageLinks?.thumbnail || "";
}

document.getElementById("coverSearchModal").addEventListener("click", (e) => {
    if (e.target.classList.contains("close-modal") || e.target === coverSearchModal) {
        coverSearchModal.style.display = "none";
        coverSearchModal.classList.remove("active");
    }
});

document.getElementById("searchCoverButton").addEventListener("click", () => {
    const bookTitle = document.getElementById("addBookTitle").value.trim();
    if (!bookTitle) {
        alert("Please enter a book title to search for a cover.");
        return;
    }

    const coverSearchModal = document.getElementById("coverSearchModal");
    const coverSearchResults = document.getElementById("coverSearchResults");

    coverSearchResults.innerHTML = `<p>Loading results for "${bookTitle}"...</p>`;
    coverSearchModal.style.display = "flex";
    coverSearchModal.classList.add("active");

    // Fetch cover images
    searchCovers(bookTitle)
        .then((covers) => {
            coverSearchResults.innerHTML = "";
            covers.forEach((cover) => {
                const img = document.createElement("img");
                img.src = cover;
                img.alt = "Cover Image";
                img.className = "cover-search-result";
                img.style.cursor = "pointer";

                img.addEventListener("click", () => {
                    coverUrlField.value = cover;
                    coverPreview.src = cover;
                    coverSearchModal.style.display = "none";
                    coverSearchModal.classList.remove("active");
                });

                coverSearchResults.appendChild(img);
            });
        })
        .catch((error) => {
            console.error("Error fetching cover images:", error);
            coverSearchResults.innerHTML = `<p>Error fetching cover images. Please try again.</p>`;
        });
});

// Close the cover search modal
document.querySelector("#coverSearchModal .close-modal").addEventListener("click", () => {
    const coverSearchModal = document.getElementById("coverSearchModal");
    coverSearchModal.style.display = "none";
    coverSearchModal.classList.remove("active");
});

async function searchCovers(bookTitle) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.items
        ? data.items
              .filter((item) => item.volumeInfo.imageLinks?.thumbnail)
              .map((item) => item.volumeInfo.imageLinks.thumbnail)
        : [];
}

async function fetchGoodreadsPublicationDate(bookTitle) {
    const apiUrl = `https://www.goodreads.com/book/auto_complete?format=json&q=${encodeURIComponent(bookTitle)}`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const book = data[0]; // Assume the first result is the best match
        return book.original_publication_year || "Unknown";
    } catch (error) {
        console.error("Error fetching Goodreads data:", error);
        return "Unknown";
    }
}

const bookTypeToggleButtons = document.querySelectorAll('.book-type-toggle button');
let selectedBookType = 'tbr'; // Default to "To Be Read"

bookTypeToggleButtons.forEach((button) => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent validation errors

        bookTypeToggleButtons.forEach((btn) => btn.classList.remove('active'));
        button.classList.add('active');

        const bookType = button.dataset.type;
        selectedBookType = bookType;
        
        document.getElementById('readingFields').classList.toggle('hidden', bookType !== 'reading' && bookType !== 'finished');
        document.getElementById('finishedFields').classList.toggle('hidden', bookType !== 'finished');

        // Update heading based on selection
        const modalHeading = document.querySelector('.modal-content h2');
        modalHeading.textContent = `Add ${button.textContent}`;
    });
});

const modalHeading = document.querySelector('.modal-content h2');
    if (modalHeading) {
        modalHeading.textContent = "Add To Be Read"; // Default heading
    }

async function updatePublicationYear(bookTitle) {
    const year = await fetchGoodreadsPublicationDate(bookTitle);
    document.getElementById("publicationYear").value = year;
}

document.getElementById('addBookCover').addEventListener('input', (e) => {
    const url = e.target.value.trim();
    document.getElementById('coverPreview').src = url || './images/placeholder.jpeg';
});

document.getElementById('addBookCover').addEventListener('change', (e) => {
    const url = e.target.value.trim();
    document.getElementById('coverPreview').src = url || './images/placeholder.jpeg';
});

const reorderButton = document.createElement('button');
reorderButton.textContent = 'Reorder Books';
reorderButton.addEventListener('click', () => {
    finishedBooksSection.classList.toggle('reorder-mode');
});
document.body.appendChild(reorderButton);

const reorderToggleButton = document.createElement('button');
reorderToggleButton.textContent = 'Reorder Mode';
reorderToggleButton.addEventListener('click', () => {
    finishedBooksSection.classList.toggle('reorder-mode');
    currentlyReadingSection.classList.toggle('reorder-mode');
    toBeReadSection.classList.toggle('reorder-mode');
});

setupSearchHandler("searchTitle", "titleSearchResults", populateToBeReadFields);
setupSearchHandler("searchAuthor", "authorSearchResults", populateToBeReadFields, "inauthor");
setupISBNSearchHandler("searchISBN", "isbnSearchResults", populateToBeReadFields);

populateYearDropdown(); // Populate the dropdown with available years
loadGoal(); // Load the goal for the current year
updateDashboard(); // Ensure the dashboard is updated
displayBooks(); // Show books for the current year 



// --- Mobile Bottom Bar Code ---
// (Assuming your scripts.js is already inside a DOMContentLoaded callback)

const fab = document.getElementById('fab');
const bottomBar = document.getElementById('bottomBar');

// Toggle the bottom bar when the FAB is clicked
fab.addEventListener('click', () => {
  console.log("FAB clicked");
  bottomBar.classList.toggle('hidden');
});

// Now attach event listeners to the bottom bar buttons

// Sort Books button for the current section
document.getElementById('bottomSort').addEventListener('click', () => {
  console.log("Bottom Sort clicked");
  // Call your sort function for the currently visible section.
  // For example:
  // sortBooksForCurrentSection();
});

// Toggle View button for the current section
document.getElementById('bottomToggle').addEventListener('click', () => {
  console.log("Bottom Toggle clicked");
  // Call your toggle view function for the currently visible section.
  // For example:
  // toggleViewForCurrentSection();
});

// Switch Section button (for example, cycle through sections)
document.getElementById('bottomSection').addEventListener('click', () => {
  console.log("Bottom Section clicked");
  // Implement section switching logic here.
  // For example, cycle through 'To Be Read', 'Currently Reading', 'Finished Books'.
});

// Add Book button: toggle the Add Book modal
document.getElementById('bottomAdd').addEventListener('click', () => {
  console.log("Bottom Add clicked");
  const addBookModal = document.getElementById('addBookModal');
  // Toggle the modal: if it is active, close it; if it is closed, open it.
  if (addBookModal.classList.contains('active')) {
    // Close the modal
    closeModal(addBookModal);
  } else {
    // Open the modal
    addBookModal.style.display = 'flex';
    addBookModal.classList.add('active');
  }
});

});  
