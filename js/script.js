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
    
    let currentYear = new Date().getFullYear();
    let yearlyGoal = 50;  // Default Goal
    let booksRead = 0;
    let allBooks = JSON.parse(localStorage.getItem('books')) || [];
    let selectedMonth = new Date().getMonth(); // Default to current month (0-11)
    let currentMode = 'year'; // Track Year/Month mode
    let currentStatsView = 'graph'; // Track Graph/List view for stats
    
    let tempBookFromSearch = null;
    
    // Retrieve the sort order from localStorage, defaulting to 'desc'
    let finishedSortOrder = localStorage.getItem('finishedSortOrder') || 'desc';
    
    // Global chart instances for stats charts
    window.chartPagesTotal = null;
    window.chartPagesAverage = null;
    window.chartPagesLeast = null;
    window.chartPagesMost = null;
    
    window.chartTimeTotal = null;
    window.chartTimeAverage = null;
    window.chartTimeLeast = null;
    window.chartTimeMost = null;
    
    window.chartPPHTotal = null;
    window.chartPPHAverage = null;
    window.chartPPHLeast = null;
    window.chartPPHMost = null;
    
    const toggleViewBtn = document.getElementById('toggleView');
    const sections = [toBeReadSection, currentlyReadingSection, finishedBooksSection];
    
    let currentSortOrder = 'desc'; // Default sorting order
    let currentView = "grid"; // Default view for book sections

toggleViewBtn.addEventListener('click', () => {
    const sections = [toBeReadSection, currentlyReadingSection, finishedBooksSection];
    sections.forEach(section => section.classList.toggle('grid-view'));
    
    attachGridViewListeners();
    displayBooks();
});

const manualEntryModeBtn = document.getElementById('manualEntryModeBtn');
const searchOnlineModeBtn = document.getElementById('searchOnlineModeBtn');
const manualEntryContainer = document.getElementById('manualEntryContainer');
const searchOnlineContainer = document.getElementById('searchOnlineContainer');

if (manualEntryModeBtn && searchOnlineModeBtn && manualEntryContainer && searchOnlineContainer) {
    // When Manual Entry is clicked:
    manualEntryModeBtn.addEventListener('click', () => {
        manualEntryModeBtn.classList.add('active');
        searchOnlineModeBtn.classList.remove('active');
        manualEntryContainer.style.display = 'block';
        searchOnlineContainer.style.display = 'none';
    });
    // When Search Online is clicked:
    searchOnlineModeBtn.addEventListener('click', () => {
        searchOnlineModeBtn.classList.add('active');
        manualEntryModeBtn.classList.remove('active');
        searchOnlineContainer.style.display = 'block';
        manualEntryContainer.style.display = 'none';
    });
} else {
    console.warn("Mode switch elements not found; please check your modal markup.");
}

let addBookMode = 'search'; // default mode
manualEntryModeBtn.addEventListener('click', () => { addBookMode = 'manual'; });
searchOnlineModeBtn.addEventListener('click', () => { addBookMode = 'search'; });


function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    }
}  

function formatReadingTime(timeStr) {
    // Expect timeStr to be in "XX:XX" format.
    const parts = timeStr.split(":");
    if (parts.length !== 2) {
      return timeStr; // Return the original string if format is unexpected.
    }
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const hourText = hours + " hour" + (hours === 1 ? "" : "s");
    const minuteText = minutes + " minute" + (minutes === 1 ? "" : "s");
    return hourText + " and " + minuteText;
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
      entry.addEventListener('click', (e) => {
        // In both grid and list view, open the Book Details Modal instead of any old cover modal
        // (Assuming you have a way to get the corresponding book object for this entry.
        // For example, you might store the book ID as a data attribute on the entry.)
        const bookId = entry.getAttribute('data-book-id');
        // Find the book object from allBooks
        const book = allBooks.find(b => b.id === bookId);
        if (book) {
          openBookDetailsModal(book);
        }
      });
    });
} 

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

if (addBookButton) {
    addBookButton.addEventListener('click', () => {
        // Before opening, remove the card modal if it exists.
        let existingCard = document.getElementById("bookDetailsCardModal");
        if (existingCard) {
            existingCard.parentNode.removeChild(existingCard);
        }
        if (addBookModal) {    
            addBookModal.style.display = 'flex';
            addBookModal.classList.add('active');

            // Also, reset search fields and hide search results:
            const searchTitleInput = document.getElementById('searchTitle');
            const searchTitleResults = document.getElementById('titleSearchResults');
            if (searchTitleInput) {
                searchTitleInput.value = "";
            }
            if (searchTitleResults) {
                searchTitleResults.innerHTML = "";
                searchTitleResults.classList.add("hidden");
            }
            const searchAuthorInput = document.getElementById('searchAuthor');
            const searchAuthorResults = document.getElementById('authorSearchResults');
            if (searchAuthorInput) {
                searchAuthorInput.value = "";
            }
            if (searchAuthorResults) {
                searchAuthorResults.innerHTML = "";
                searchAuthorResults.classList.add("hidden");
            }
        } else {
            console.error("Add Book modal not found.");
        }
    });
} else {
    console.error("Add Book button not found.");
}

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

// In updateAppState
function updateAppState() {
    localStorage.setItem('books', JSON.stringify(allBooks));
    updateDashboard();
    displayBooks();
    attachStartReadingListeners();
    attachFinishButtonListeners();
    calculateStats(); // Already here, ensure it stays
}

// When stats button is clicked
document.getElementById('statsBtn').addEventListener('click', () => {
    document.getElementById('toBeReadSection').style.display = 'none';
    document.getElementById('currentlyReadingSection').style.display = 'none';
    document.getElementById('finishedBooksSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'block';
    calculateStats(); // Ensure stats update on view
});

// When year changes
document.getElementById('yearSelect').addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value, 10);
    updateAppState();
    loadGoal();
    calculateStats(); // Update stats for new year
});

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

function formatTimeHMS(ms) {
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    return (
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0')
    );
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
    const startReadingDate = form.querySelector('#startReadingDate').value.trim();
    if (!startReadingDate) {
      alert("Please enter a start date.");
      return;
    }
    let bookToUpdate;
    if (form.dataset.tempBook) {
      bookToUpdate = JSON.parse(form.dataset.tempBook);
      delete form.dataset.tempBook;
    } else {
      const bookId = form.dataset.bookId;
      bookToUpdate = allBooks.find(book => book.id === bookId);
    }
    if (bookToUpdate) {
      // Set the start date and mark the book as no longer TBR.
      bookToUpdate.startDate = startReadingDate;
      bookToUpdate.tbr = false;  // This line moves the book from TBR to Currently Reading.
      updateAppState();
      closeModal(document.getElementById('startReadingModal'));
      tempBookFromSearch = null;
    }
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

     // Get the corresponding book
    const book = allBooks.find(b => b.id === bookId);
    // Get the start date input element in the finish modal
    const finishStartDateInput = form.querySelector('#finishStartDate');
    // Auto-fill the start date from the book and hide the container
    if (book && book.startDate) {
        finishStartDateInput.value = book.startDate;
        // Hide the container that holds the start date label and input
        form.querySelector('.finish-start-container').style.display = 'none';
        // Remove the required attribute so it doesn't trigger validation
        finishStartDateInput.removeAttribute('required');
    } else {
        // If somehow no start date exists, show the field
        form.querySelector('.finish-start-container').style.display = 'block';
        finishStartDateInput.setAttribute('required', 'true');
    }

    modal.classList.add('active');
    modal.style.display = 'flex';

    form.removeEventListener('submit', handleFinishReadingSubmit);
    form.addEventListener('submit', handleFinishReadingSubmit);
}

function handleFinishReadingSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Retrieve the start date from the finished modal.
    const finishStartDate = form.querySelector('#finishStartDate').value.trim();
    if (!finishStartDate) {
        alert('Start date is required.');
        return;
    }
    
    const endDate = form.querySelector('#finishReadingDate').value.trim();
    if (!endDate) {
        alert('End date is required.');
        return;
    }
    
    const pagesPerHourStr = form.querySelector('#pagesPerHour').value.trim();
    const timeToReadStr = form.querySelector('#timeToRead').value.trim();
    const pagesPerHour = pagesPerHourStr ? parseFloat(pagesPerHourStr) : null;
    const timeToRead = timeToReadStr !== "" ? timeToReadStr : null;
    
    // Use the temporary book data if present
    let tempBook;
    if (form.dataset.tempBook) {
        tempBook = JSON.parse(form.dataset.tempBook);
        delete form.dataset.tempBook; // Clear it after reading
    } else {
        // Fallback: find by form.dataset.bookId
        const bookId = form.dataset.bookId;
        tempBook = allBooks.find(book => book.id === bookId);
    }
    if (tempBook) {
        // Update the temporary book with the dates and additional info.
        tempBook.startDate = finishStartDate;
        tempBook.endDate = endDate;
        tempBook.pagesPerHour = pagesPerHour;
        tempBook.timeToRead = timeToRead;
        const start = new Date(finishStartDate);
        const end = new Date(endDate);
        tempBook.totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        // Mark the book as finished.
        tempBook.finished = true;
        tempBook.tbr = false;

        // Now update allBooks
        if (!allBooks.find(b => b.id === tempBook.id)) {
            allBooks.push(tempBook);
        } else {
            allBooks = allBooks.map(b => b.id === tempBook.id ? tempBook : b);
        }

        // Automatically sort finished books based on current finishedSortOrder
        sortFinishedBooks();

        updateAppState();
        closeModal(document.getElementById('finishReadingModal'));
        tempBookFromSearch = null;
    }
} 

// --- goal helpers ---
function toLocalMidnight(dateStr) {
  // expects YYYY-MM-DD (from <input type="date">)
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00`);
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function calcPagesPerDay(book) {
  // Only for currently reading
  if (book.tbr || book.finished) return { status: 'none' };

  const pagesTotal = Number(book.pages) || 0;
  const currentPage = Number(book.currentPage) || 0;
  const goal = book.goalEndDate ? toLocalMidnight(book.goalEndDate) : null;
  const today = todayLocal();

  if (!goal) return { status: 'no-goal' };

  const pagesLeft = Math.max(0, pagesTotal - currentPage);

  // Goal met
  if (pagesLeft === 0) return { status: 'met', pagesLeft };

  // Past goal
  if (goal < today) {
    return { status: 'missed', pagesLeft };
  }

  // Inclusive day count (today AND goal day)
  const oneDay = 24 * 60 * 60 * 1000;
  const days = Math.floor((goal - today) / oneDay) + 1;
  const perDay = Math.ceil(pagesLeft / Math.max(1, days));

  return { status: 'plan', perDay, pagesLeft, days };
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
            <div class="book-entry-split">
                <div class="cover-container">
                <img src="${book.cover}" alt="${book.title} Cover" class="book-cover">
                <button class="more-options-btn">...</button>
                <div class="dropdown hidden book-options">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn" data-book-id="${book.id}">Delete</button>
                    <button class="adjust-background-btn" data-book-id="${book.id}">Adjust Background</button>
                </div>
                </div>
                <div class="info-container">
                    <div class="info-wrapper">
                        <h3>${book.title}</h3>
                        <p>${book.author}</p>
                        <p>${book.year}</p>
                        <p>${book.pages} pages</p>
                    </div>
                    </div>
            </div>
        `;

        // Attach the click listener only to the cover image:
        const coverImage = bookElement.querySelector('.book-cover');
        if (coverImage) {
        coverImage.addEventListener('click', (e) => {
            // Prevent the click from propagating up
            e.stopPropagation();
            // Open the book details modal for this book.
            openBookDetailsModal(book);
        });
        }

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
        const bookDetailsDiv = bookElement.querySelector('.info-container');
        bookElement.prepend(pinButton);

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
    // --- Process Non-TBR Books ---
// Build ordered list so finished books render in the right order.
const nonTbr = filteredBooks.filter(b => !b.tbr);
const currentlyReadingBooks = nonTbr.filter(b => !b.finished);
const finishedBooksOrdered = nonTbr
  .filter(b => b.finished)
  .sort((a, b) => {
    // Use Date objects so comparisons are reliable
    const ta = a.endDate ? new Date(a.endDate).getTime() : -Infinity;
    const tb = b.endDate ? new Date(b.endDate).getTime() : -Infinity;
    // finishedSortOrder: 'desc' = newest on top, 'asc' = oldest on top
    return (finishedSortOrder === 'desc') ? (tb - ta) : (ta - tb);
  });

// We’ll loop reading first (to render into Currently Reading),
// then finished (sorted) which renders into Finished Books.
const renderOrder = [...currentlyReadingBooks, ...finishedBooksOrdered];

renderOrder.forEach(book => {
    // ======= paste the entire original rendering block body here =======
    // (Everything from your original forEach’s opening brace `{`
    //   down to its closing brace `});`
    //   KEEP IT AS-IS.)
    // The only change we made is the order of books we iterate over.
    
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
    <div class="book-entry-split">
        <div class="cover-container">
        <img src="${book.cover}" alt="${book.title} Cover" class="book-cover">
        <button class="more-options-btn">...</button>
        <div class="dropdown hidden book-options">
            <button class="edit-btn">Edit</button>
            <button class="delete-btn" data-book-id="${book.id}">Delete</button>
            <button class="adjust-background-btn" data-book-id="${book.id}">Adjust Background</button>
        </div>
        </div>
        <div class="info-container">
            <div class="info-wrapper">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <p>${book.year}</p>
                <p>${book.pages} pages</p>
                ${book.tbr ? '' : `<p><strong>Start Date:</strong> ${formatDate(book.startDate)}</p>`}
                ${book.finished ? `<p><strong>End Date:</strong> ${formatDate(book.endDate)}</p>` : ''}
                ${book.finished && book.pagesPerHour ? `<p><strong>Pages per Hour:</strong> ${book.pagesPerHour}</p>` : ''}
                ${book.finished && book.timeToRead ? `<p><strong>Total Reading Time:</strong> ${formatReadingTime(book.timeToRead)}</p>` : ''}
            </div>
            </div>
    </div>
    `;

    // (All your existing listeners and logic below remain unchanged)
    // cover click -> openBookDetailsModal, adjustBackgroundButton, progress bar,
    // currently-reading vs finished append targets, more-options dropdown,
    // delete/edit handlers, etc.

    // Attach the click listener only to the cover image:
    const coverImage = bookElement.querySelector('.book-cover');
    if (coverImage) {
      coverImage.addEventListener('click', (e) => {
        e.stopPropagation();
        openBookDetailsModal(book);
      });
    }

    const adjustBackgroundButton = bookElement.querySelector('.adjust-background-btn');
    if (adjustBackgroundButton) {
      adjustBackgroundButton.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!book.backgroundPosition || book.backgroundPosition === "") {
          book.backgroundPosition = 'center';
        }
        if (book.backgroundPosition === 'center') {
          book.backgroundPosition = 'bottom';
        } else if (book.backgroundPosition === 'bottom') {
          book.backgroundPosition = 'top';
        } else {
          book.backgroundPosition = 'center';
        }
        bookElement.style.backgroundPosition = book.backgroundPosition;
        allBooks = allBooks.map(b => (b.id === book.id ? { ...b, backgroundPosition: book.backgroundPosition } : b));
        localStorage.setItem('books', JSON.stringify(allBooks));
      });
    }

    if (!book.finished) {
      if (typeof book.currentPage !== 'number') book.currentPage = 0;
      const progressContainer = document.createElement('div');
      progressContainer.classList.add('progress-container');
      const progressText = document.createElement('p');
      progressText.classList.add('progress-text');
      const progressPercentage = Math.round((book.currentPage / book.pages) * 100);
      progressText.textContent = `${book.currentPage} / ${book.pages} (${progressPercentage}%)`;
      progressContainer.appendChild(progressText);
      const progressBarContainer = document.createElement('div');
      progressBarContainer.classList.add('progress-bar-container');
      const progressBar = document.createElement('div');
      progressBar.classList.add('progress-bar');
      progressBar.setAttribute('data-book-id', book.id);
      const initialProgress = (book.currentPage / book.pages) * 100;
      progressBar.style.width = `${initialProgress}%`;
      progressBarContainer.appendChild(progressBar);
      progressContainer.appendChild(progressBarContainer);

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
        allBooks = allBooks.map(b => (b.id === book.id ? { ...b, currentPage: updatedValue } : b));
        book.currentPage = updatedValue;
        progressText.textContent = `${book.currentPage} / ${book.pages} (${Math.round((book.currentPage / book.pages) * 100)}%)`;
        const newWidth = (book.currentPage / book.pages) * 100;
        progressBar.style.width = `${newWidth}%`;
        updateAppState();
      });

      progressContainer.appendChild(updateProgressButton);
      bookElement.appendChild(progressContainer);
      // ---- Goal end-date + pages/day row (tiny date picker + message) ----
        const goalRow = document.createElement('div');
        goalRow.classList.add('goal-row');
        goalRow.style.marginTop = '8px';
        goalRow.style.display = 'flex';
        goalRow.style.alignItems = 'center';
        goalRow.style.gap = '8px';

        const goalInput = document.createElement('input');
        goalInput.type = 'date';
        goalInput.value = book.goalEndDate || '';
        goalInput.title = 'Set goal end date';
        goalInput.style.fontSize = '0.9rem';
        goalInput.style.padding = '4px';

        const goalMsg = document.createElement('span');
        goalMsg.classList.add('goal-msg');
        goalMsg.style.fontSize = '0.9rem';
        goalMsg.style.opacity = '0.95';

        // helper to know if we’re in compact (grid) view for CR section
        function inCompactView() {
        return currentlyReadingSection.classList.contains('grid-view');
        }

        function renderGoalMessage() {
        const result = calcPagesPerDay(book);

        const compact = inCompactView();

        // Decide message text for both modes
        let text = '';
        if (result.status === 'no-goal') {
            text = compact ? 'No goal set' : 'Set a goal date to get pages/day.';
        } else if (result.status === 'met') {
            text = compact ? 'Goal met 🎉' : 'Goal met 🎉';
        } else if (result.status === 'missed') {
            text = compact ? `Missed • ${result.pagesLeft} left` : `Goal date passed; ${result.pagesLeft} pages left.`;
        } else if (result.status === 'plan') {
            if (compact) {
            // compact: just show the number
            text = `~${result.perDay}/day`;
            } else {
            // full: show date + pages/day
            const d = toLocalMidnight(book.goalEndDate);
            const goalLabel = d ? d.toLocaleDateString() : book.goalEndDate;
            text = `Goal: ${goalLabel} • Read ~${result.perDay} pages/day`;
            }
        }

        goalMsg.textContent = text;

        // Show/hide the date input based on compact view
        goalInput.style.display = compact ? 'none' : 'inline-block';
        }

        goalInput.addEventListener('change', (e) => {
        const val = e.target.value || null; // ISO from <input type="date">
        allBooks = allBooks.map(b => b.id === book.id ? { ...b, goalEndDate: val } : b);
        book.goalEndDate = val; // keep this object in sync for immediate render
        updateAppState(); // re-renders the card (and recalculates)
        });

        // initial render
        renderGoalMessage();

        goalRow.appendChild(goalInput);
        goalRow.appendChild(goalMsg);
        bookElement.appendChild(goalRow);
      currentlyReadingSection.appendChild(bookElement);
    } else {
      finishedBooksSection.appendChild(bookElement);
    }

    if (book.tbr) {
      const startReadingBtn = document.createElement('button');
      startReadingBtn.textContent = 'Start Reading';
      startReadingBtn.classList.add('start-reading-btn');
      startReadingBtn.dataset.bookId = book.id;
      startReadingBtn.addEventListener('click', () => openStartReadingModal(book.id));
      bookElement.querySelector('.info-container').appendChild(startReadingBtn);
    } else if (!book.finished) {
      const markFinishedBtn = document.createElement('button');
      markFinishedBtn.textContent = 'Mark as Finished';
      markFinishedBtn.classList.add('finish-btn');
      markFinishedBtn.dataset.bookId = book.id;
      markFinishedBtn.addEventListener('click', () => openFinishReadingModal(book.id));
      bookElement.querySelector('.info-container').appendChild(markFinishedBtn);
    }

    const moreOptionsBtn = bookElement.querySelector('.more-options-btn');
    const dropdown = bookElement.querySelector('.dropdown');
    function toggleDropdown(dd) {
      if (dd.classList.contains('hidden')) {
        dd.classList.remove('hidden'); dd.classList.add('dropdown-open');
      } else if (dd.classList.contains('dropdown-open')) {
        dd.classList.remove('dropdown-open'); dd.classList.add('hidden');
      } else {
        dd.classList.add('dropdown-open');
      }
    }
    if (moreOptionsBtn && dropdown) {
      if (!dropdown.classList.contains('hidden')) dropdown.classList.add('hidden');
      moreOptionsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(dropdown); });
    }

    const deleteButton = bookElement.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => {
      const bookId = deleteButton.dataset.bookId;
      deleteBook(bookId);
    });

    const editButton = bookElement.querySelector('.edit-btn');
    editButton.addEventListener('click', () => { openEditBookModal(book); });
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
    document.querySelector('.container').style.display = 'block';
    document.getElementById('statsSection').style.display = 'none';
    toBeReadSection.classList.add('active');
    currentlyReadingSection.classList.remove('active');
    finishedBooksSection.classList.remove('active');
    toBeReadSection.style.display = 'block';
    currentlyReadingSection.style.display = 'none';
    finishedBooksSection.style.display = 'none';
    toBeReadBtn.classList.add('active');
    currentlyReadingBtn.classList.remove('active');
    finishedBooksBtn.classList.remove('active');
});

currentlyReadingBtn.addEventListener('click', () => {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('statsSection').style.display = 'none';
    currentlyReadingSection.classList.add('active');
    toBeReadSection.classList.remove('active');
    finishedBooksSection.classList.remove('active');
    currentlyReadingSection.style.display = 'block';
    toBeReadSection.style.display = 'none';
    finishedBooksSection.style.display = 'none';
    currentlyReadingBtn.classList.add('active');
    toBeReadBtn.classList.remove('active');
    finishedBooksBtn.classList.remove('active');
});

finishedBooksBtn.addEventListener('click', () => {
    document.querySelector('.container').style.display = 'block';
    document.getElementById('statsSection').style.display = 'none';
    finishedBooksSection.classList.add('active');
    currentlyReadingSection.classList.remove('active');
    toBeReadSection.classList.remove('active');
    finishedBooksSection.style.display = 'block';
    currentlyReadingSection.style.display = 'none';
    toBeReadSection.style.display = 'none';
    finishedBooksBtn.classList.add('active');
    currentlyReadingBtn.classList.remove('active');
    toBeReadBtn.classList.remove('active');
});

document.getElementById('statsBtn').addEventListener('click', () => {
    document.getElementById('toBeReadSection').style.display = 'none';
    document.getElementById('currentlyReadingSection').style.display = 'none';
    document.getElementById('finishedBooksSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'block';
    document.querySelector('.container').style.display = 'none';
    populateMonthSelect();
    calculateStats();
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
    // Reset modal scroll to top
    addBookModal.scrollTop = 0;
    // Reset mode: default to Search Online
    searchOnlineModeBtn.classList.add('active');
    manualEntryModeBtn.classList.remove('active');
    searchOnlineContainer.style.display = 'block';
    manualEntryContainer.style.display = 'none';
    
    // Reset search fields:
    const searchTitleInput = document.getElementById('searchTitle');
    const searchTitleResults = document.getElementById('titleSearchResults');
    if (searchTitleInput) {
        searchTitleInput.value = "";
    }
    if (searchTitleResults) {
        searchTitleResults.innerHTML = "";
        searchTitleResults.classList.add("hidden");
    }
    const searchAuthorInput = document.getElementById('searchAuthor');
    const searchAuthorResults = document.getElementById('authorSearchResults');
    if (searchAuthorInput) {
        searchAuthorInput.value = "";
    }
    if (searchAuthorResults) {
        searchAuthorResults.innerHTML = "";
        searchAuthorResults.classList.add("hidden");
    }
    
    // Open modal
    addBookModal.style.display = 'flex';
    addBookModal.classList.add('active');
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
        endDate: finishedEndDate,
        pagesPerHour: pagesPerHour,
        timeToRead: readingTime,
        backgroundMode: 'cover',
        backgroundPosition: 'center',
        currentPage: selectedBookType === 'reading' ? 0 : undefined,
        goalEndDate: selectedBookType === 'reading' ? null : undefined
    };

    allBooks.push(newBook);
    updateAppState();
    closeModal(addBookModal);
    addBookForm.reset();
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
        const bookTitle = document.getElementById("bookTitle").value.trim();
        if (!bookTitle) {
          alert("Please enter a book title to search for a cover.");
          return;
        }
        const coverSearchModal = document.getElementById("coverSearchModal");
        const coverSearchResults = document.getElementById("coverSearchResults");
        
        coverSearchResults.innerHTML = `<p>Loading results for "${bookTitle}"...</p>`;
        coverSearchModal.style.display = "flex";
        coverSearchModal.classList.add("active");
        
        try {
          const covers = await searchCovers(bookTitle);
          console.log("Covers found:", covers);
          coverSearchResults.innerHTML = "";
          covers.forEach(cover => {
            const img = document.createElement("img");
            img.src = cover;
            img.alt = "Cover Image";
            img.className = "cover-search-result";
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
              document.getElementById("addBookCover").value = cover;
              document.getElementById("coverPreview").src = cover;
              coverSearchModal.style.display = "none";
              coverSearchModal.classList.remove("active");
            });
            coverSearchResults.appendChild(img);
          });
        } catch (error) {
          console.error("Error fetching cover images:", error);
          coverSearchResults.innerHTML = `<p>Error fetching cover images. Please try again.</p>`;
        }
    });    
} else {
  console.warn("searchCoverButton not found in the DOM");
}

document.addEventListener('click', (e) => {
    const listItem = e.target.closest('#titleSearchResults li, #authorSearchResults li');
    if (listItem) {
        const bookDetails = JSON.parse(listItem.dataset.book);
        renderBookDetailsCard(bookDetails);
        if (listItem.parentElement) {
            listItem.parentElement.classList.add("hidden");
        }
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

document.getElementById("searchCoverButton").addEventListener("click", async () => {
    const bookTitle = document.getElementById("bookTitle").value.trim();
    if (!bookTitle) {
        alert("Please enter a book title to search for a cover.");
        return;
    }
    
    const coverSearchModal = document.getElementById("coverSearchModal");
    const coverSearchResults = document.getElementById("coverSearchResults");
    
    // Remove the hidden class so it can show
    coverSearchModal.classList.remove("hidden");
    coverSearchResults.innerHTML = `<p>Loading results for "${bookTitle}"...</p>`;
    
    coverSearchModal.style.display = "flex";
    coverSearchModal.classList.add("active");
    
    try {
        const covers = await searchCovers(bookTitle);
        console.log("Covers found:", covers);
        coverSearchResults.innerHTML = "";
        covers.forEach(cover => {
            const img = document.createElement("img");
            img.src = cover;
            img.alt = "Cover Image";
            img.className = "cover-search-result";
            img.style.cursor = "pointer";
            img.addEventListener("click", () => {
                document.getElementById("addBookCover").value = cover;
                document.getElementById("coverPreview").src = cover;
                coverSearchModal.style.display = "none";
                coverSearchModal.classList.remove("active");
            });
            coverSearchResults.appendChild(img);
        });
    } catch (error) {
        console.error("Error fetching cover images:", error);
        coverSearchResults.innerHTML = `<p>Error fetching cover images. Please try again.</p>`;
    }
});

// Close the cover search modal
document.querySelector("#coverSearchModal .close-modal").addEventListener("click", () => {
    const coverSearchModal = document.getElementById("coverSearchModal");
    coverSearchModal.style.display = "none";
    coverSearchModal.classList.remove("active");
});

async function searchCovers(bookTitle) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(bookTitle)}`;
    console.log("Fetching covers from:", apiUrl);
    const response = await fetch(apiUrl);
    const data = await response.json();
    console.log("Search covers data:", data);
    return data.items
        ? data.items
              .filter(item => item.volumeInfo.imageLinks?.thumbnail)
              .map(item => item.volumeInfo.imageLinks.thumbnail)
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

        // Update heading based on selection.
        // For TBR, force the header text to "Add To Be Read"
        const modalHeading = document.querySelector('.modal-content h2');
        if (button.dataset.type === 'tbr') {
            modalHeading.textContent = "Add To Be Read";
        } else {
            modalHeading.textContent = `Add ${button.textContent}`;
        }
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

const reorderToggleButton = document.createElement('button');
reorderToggleButton.textContent = 'Reorder Mode';
reorderToggleButton.addEventListener('click', () => {
    finishedBooksSection.classList.toggle('reorder-mode');
    currentlyReadingSection.classList.toggle('reorder-mode');
    toBeReadSection.classList.toggle('reorder-mode');
});

setupSearchHandler("searchTitle", "titleSearchResults", populateToBeReadFields);
setupSearchHandler("searchAuthor", "authorSearchResults", populateToBeReadFields, "inauthor");
setupISBNSearchHandler("searchISBN", "isbnSearchResults", handleISBNSearchResult);


populateYearDropdown(); // Populate the dropdown with available years
loadGoal(); // Load the goal for the current year
updateDashboard(); // Ensure the dashboard is updated
displayBooks(); // Show books for the current year 



// --- Mobile Bottom Bar Functionality ---

// Get the mobile control elements
const fab = document.getElementById('fab');
const bottomBar = document.getElementById('bottomBar');
const bottomClose = document.getElementById('bottomClose');
const bottomSort = document.getElementById('bottomSort');
const bottomToggle = document.getElementById('bottomToggle');
const bottomSection = document.getElementById('bottomSection');
const bottomAdd = document.getElementById('bottomAdd');
const sectionDropdown = document.getElementById('sectionDropdown');

// --- FAB: Toggle the bottom bar ---
fab.addEventListener('click', () => {
  console.log("FAB clicked");
  bottomBar.classList.toggle('hidden');
});

// --- Dedicated Close Button in Bottom Bar ---
bottomClose.addEventListener('click', () => {
  console.log("Bottom Close clicked");
  bottomBar.classList.add('hidden');
});

// --- Sort Books Button ---
// Only applicable when Finished Books section is active.
function isFinishedSectionActive() {
  return document.getElementById('finishedBooksSection').classList.contains('active');
}
function updateSortButtonVisibility() {
  if (isFinishedSectionActive()) {
    bottomSort.style.display = 'inline-block';
  } else {
    bottomSort.style.display = 'none';
  }
}
updateSortButtonVisibility();

bottomSort.addEventListener('click', () => {
  if (!isFinishedSectionActive()) {
    console.log("Sort Books pressed outside Finished Books section. Ignored.");
    return;
  }
  console.log("Bottom Sort clicked in Finished Books section");
  // Toggle finishedSortOrder (assume finishedSortOrder is a global variable)
  finishedSortOrder = (finishedSortOrder === 'desc') ? 'asc' : 'desc';
  localStorage.setItem('finishedSortOrder', finishedSortOrder);
  // Call your sort function for finished books:
  sortFinishedBooks();
});

function sortFinishedBooks() {
    console.log("sortFinishedBooks called");
    // Filter finished books.
    let finishedBooks = allBooks.filter(book => book.finished);
  
    // Log the end date and its timestamp for each finished book.
    finishedBooks.forEach(book => {
      console.log(`Book ID: ${book.id} - End Date: ${book.endDate} - Timestamp: ${new Date(book.endDate).getTime()}`);
    });
  
    if (finishedSortOrder === 'desc') {
      finishedBooks.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    } else {
      finishedBooks.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
    }
  
    let nonFinishedBooks = allBooks.filter(book => !book.finished);
    allBooks = (finishedSortOrder === 'desc') 
               ? finishedBooks.concat(nonFinishedBooks)
               : nonFinishedBooks.concat(finishedBooks);
    updateAppState();
    console.log("Finished books sorted in", finishedSortOrder, "order.");
}  

function sortBooks() {
    if (currentSection === 'finished') {
        books.sort((a, b) => {
            // Parse dates — handle missing or invalid dates safely
            const dateA = a.finishedDate ? new Date(a.finishedDate) : new Date(0);
            const dateB = b.finishedDate ? new Date(b.finishedDate) : new Date(0);

            if (sortOrderAsc) {
                // Oldest finished first
                return dateA - dateB;
            } else {
                // Newest finished first
                return dateB - dateA;
            }
        });
    }
}

// --- Toggle View Button ---
// Toggle between grid and list view for the active section.
bottomToggle.addEventListener('click', () => {
  console.log("Bottom Toggle clicked");
  // Find the active section (assuming IDs: toBeReadSection, currentlyReadingSection, finishedBooksSection)
  const sections = ['toBeReadSection', 'currentlyReadingSection', 'finishedBooksSection'];
  let activeSection = null;
  sections.forEach(id => {
    const sec = document.getElementById(id);
    if (sec.classList.contains('active')) {
      activeSection = sec;
    }
  });
  if (activeSection) {
    activeSection.classList.toggle('grid-view');
    // Update the toggle icon
    if (activeSection.classList.contains('grid-view')) {
      currentView = "grid";
      bottomToggle.innerHTML = "🔲";  // grid icon
      console.log("Switched to Grid view");
    } else {
      currentView = "list";
      bottomToggle.innerHTML = "📃";  // list icon
      console.log("Switched to List view");
    }
  }
  displayBooks();
});

// --- Switch Section Button ---
// Toggle the section dropdown.
bottomSection.addEventListener('click', () => {
  console.log("Bottom Section clicked");
  sectionDropdown.classList.toggle('hidden');
});

// Attach event listeners for each section option in the dropdown.
document.querySelectorAll('.section-dropdown .section-option').forEach(option => {
  option.addEventListener('click', () => {
    const targetSection = option.getAttribute('data-section');

    // Hide dropdown after selection
    sectionDropdown.classList.add('hidden');

    if (targetSection === 'statsSection') {
      // Show Stats, hide the book container
      document.querySelector('.container').style.display = 'none';
      document.getElementById('statsSection').style.display = 'block';

      // (Re)build stats UI
      populateMonthSelect();
      calculateStats();

      // Update Sort button visibility (no sort in Stats)
      updateSortButtonVisibility();
      return;
    }

    // Otherwise, show the book sections container and hide Stats
    document.querySelector('.container').style.display = 'block';
    document.getElementById('statsSection').style.display = 'none';

    // Toggle which book section is active/visible
    const tbr = document.getElementById('toBeReadSection');
    const cr  = document.getElementById('currentlyReadingSection');
    const fin = document.getElementById('finishedBooksSection');

    tbr.classList.remove('active');
    cr.classList.remove('active');
    fin.classList.remove('active');

    // Hide all first
    tbr.style.display = 'none';
    cr.style.display = 'none';
    fin.style.display = 'none';

    // Show the chosen one
    const sectionEl = document.getElementById(targetSection);
    sectionEl.classList.add('active');
    sectionEl.style.display = 'block';

    // Update Sort button visibility (only for Finished)
    updateSortButtonVisibility();
  });
});

// --- Add Book Button ---
// Toggle the Add Book modal.
bottomAdd.addEventListener('click', () => {
  console.log("Bottom Add clicked");
  const addBookModal = document.getElementById('addBookModal');
  if (addBookModal.classList.contains('active')) {
    closeModal(addBookModal);
    console.log("Add Book modal closed via bottom bar");
  } else {
    addBookModal.style.display = 'flex';
    addBookModal.classList.add('active');
    console.log("Add Book modal opened via bottom bar");
  }
});

const selectCoverFileButton = document.getElementById('selectCoverFileButton');
const coverFileInput = document.getElementById('coverFileInput');

if (selectCoverFileButton && coverFileInput) {
  selectCoverFileButton.addEventListener('click', () => {
    coverFileInput.click();
  });

  coverFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const dataUrl = event.target.result;
        document.getElementById('addBookCover').value = dataUrl;
        document.getElementById('coverPreview').src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Helper function to convert "HH:MM" into "HH hours and MM minutes"
function convertTimeFormat(timeStr) {
    const parts = timeStr.split(':');
    const hrs = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    return `${hrs} hours and ${mins} minutes`;
}
  
function openBookDetailsModal(book) {
    const modal = document.getElementById('bookDetailsModal');
    const content = document.getElementById('bookDetailsContent');
  
    // Build extra details based on the book’s status:
    let extraDetails = "";
    if (!book.tbr && !book.finished && book.startDate) {
      // Currently Reading (assumes book is not finished and not TBR)
      extraDetails += `<p><strong>Start Date:</strong> ${formatDate(book.startDate)}</p>`;
    }
    if (book.finished) {
      extraDetails += `<p><strong>Start Date:</strong> ${book.startDate ? formatDate(book.startDate) : "N/A"}</p>`;
      extraDetails += `<p><strong>End Date:</strong> ${book.endDate ? formatDate(book.endDate) : "N/A"}</p>`;
      extraDetails += `<p><strong>Pages per Hour:</strong> ${book.pagesPerHour ? book.pagesPerHour : "N/A"}</p>`;
      extraDetails += `<p><strong>Total Reading Time:</strong> ${book.timeToRead ? convertTimeFormat(book.timeToRead) : "N/A"}</p>`;
    }
  
    // Build modal buttons based on book type:
    let buttonsHTML = "";
    if (book.tbr) {
      buttonsHTML = `<button id="modalStartReading" onclick="openStartReadingModalFromModal('${book.id}')">Start Reading</button>`;
    } else if (!book.finished) {
      buttonsHTML = `<button id="modalMarkFinished" onclick="openFinishReadingModalFromModal('${book.id}')">Mark as Finished</button>`;
    } else if (book.finished) {
      buttonsHTML = `<button id="modalEdit" onclick="openEditBookModalFromModal('${book.id}')">Edit</button>
                     <button id="modalDelete" onclick="deleteBookFromModal('${book.id}')">Delete</button>`;
    }
  
    // Rebuild the modal content markup:
    content.innerHTML = `
        <div class="info-container">
            <div class="modal-book-cover-container" style="text-align: center;">
            <img src="${book.cover || './images/placeholder.jpeg'}" alt="${book.title} Cover" class="book-cover-img">
            </div>
            <div class="modal-book-info" style="text-align: center; margin-top: 15px;">
            <div class="info-wrapper">
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <p>${book.year}</p>
                <p>${book.pages} pages</p>
                ${extraDetails}
            </div>
            </div>
            <div class="modal-buttons" style="text-align: center; margin-top: 20px;">
            ${buttonsHTML}
            </div>
        </div>
        `;
    
    // --- Build the modal buttons dynamically ---
    // (Assumes that your modal now contains a container with the class "modal-buttons")
    const modalButtonsContainer = document.querySelector('.modal-buttons');
    if (modalButtonsContainer) {
    // Clear any existing buttons
    modalButtonsContainer.innerHTML = '';

    // Always add the Edit button:
    const editBtn = document.createElement('button');
    editBtn.innerText = 'Edit';
    editBtn.addEventListener('click', () => {
        openEditBookModalFromModal(book.id);
    });
    modalButtonsContainer.appendChild(editBtn);

    // Always add the Delete button:
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.addEventListener('click', () => {
        deleteBook(book.id);
        closeBookDetailsModal();
    });
    modalButtonsContainer.appendChild(deleteBtn);

    // Add a third button based on book status:
    if (book.tbr) {
        // For TBR books, add "Start Reading"
        const startReadingBtn = document.createElement('button');
        startReadingBtn.innerText = 'Start Reading';
        startReadingBtn.addEventListener('click', () => {
        openStartReadingModalFromModal(book.id);
        });
        modalButtonsContainer.appendChild(startReadingBtn);
    } else if (!book.finished) {
        // For currently reading books, add "Mark as Finished"
        const markFinishedBtn = document.createElement('button');
        markFinishedBtn.innerText = 'Mark as Finished';
        markFinishedBtn.addEventListener('click', () => {
        openFinishReadingModalFromModal(book.id);
        });
        modalButtonsContainer.appendChild(markFinishedBtn);
    }
    // (For finished books, no extra button is added.)
    }

    // Add "See Recommendations" button to the modal.
    const recButton = document.createElement('button');
    recButton.innerText = 'See Recommendations';
    recButton.addEventListener('click', () => {
    showRecommendations(book);
    });
    if (modalButtonsContainer) {
    modalButtonsContainer.appendChild(recButton);
    }

    // Show the modal
    modal.classList.add('active');
    modal.style.display = 'flex';
}   

// Attach click event to the close button in the modal
document.getElementById('closeBookDetails').addEventListener('click', closeBookDetailsModal);

// Close the modal when clicking outside the modal content
window.addEventListener('click', (e) => {
  const modal = document.getElementById('bookDetailsModal');
  // If the modal is active and the click target is the modal itself (not its inner content)
  if (modal.classList.contains('active') && e.target === modal) {
    closeBookDetailsModal();
  }
});

// Close the modal when pressing the Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookDetailsModal();
  }
});

function closeBookDetailsModal() {
    const modal = document.getElementById('bookDetailsModal');
    modal.classList.remove('active');
    modal.style.display = 'none';
    document.getElementById('bookDetailsContent').innerHTML = "";
}  

function openEditBookModalFromModal(bookId) {
    const book = allBooks.find(b => b.id === bookId);
    if (book) {
      openEditBookModal(book);
    }
    closeBookDetailsModal();
}

// Also, to allow closing when clicking outside the modal content:
window.addEventListener('click', (e) => {
  const modal = document.getElementById('bookDetailsModal');
  if (modal.classList.contains('active') && e.target === modal) {
    closeBookDetailsModal();
  }
});

// And closing via the Escape key:
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeBookDetailsModal();
  }
});

function openStartReadingModalFromModal(bookId) {
    // Close the Book Details Modal first.
    closeBookDetailsModal();
    // Then open the Start Reading Modal using your existing function.
    openStartReadingModal(bookId);
  }
  
  function openFinishReadingModalFromModal(bookId) {
    // Close the Book Details Modal first.
    closeBookDetailsModal();
    // Then open the Finish Reading Modal using your existing function.
    openFinishReadingModal(bookId);
}
  
// (Optional) Attach these to the global window if you use inline onclick attributes:
window.openStartReadingModalFromModal = openStartReadingModalFromModal;
window.openFinishReadingModalFromModal = openFinishReadingModalFromModal;  

window.openEditBookModalFromModal = openEditBookModalFromModal;  // if not already global
window.deleteBook = deleteBook;

function renderBookDetailsCard(bookDetails) {
    // Create a modal element for the details card if it doesn't already exist.
    let cardModal = document.getElementById("bookDetailsCardModal");
    if (!cardModal) {
      cardModal = document.createElement("div");
      cardModal.id = "bookDetailsCardModal";
      cardModal.classList.add("modal");
      // Basic styles for centering – you can adjust these in your CSS.
      cardModal.style.display = "flex";
      cardModal.style.alignItems = "center";
      cardModal.style.justifyContent = "center";
      document.body.appendChild(cardModal);
    }
    
    // Fill the modal with a card containing the book details and two buttons.
    cardModal.innerHTML = `
      <div class="modal-content" style="max-width:400px; text-align:center; position:relative;">
        <button class="close-modal" style="position:absolute; top:5px; right:5px;">&times;</button>
        <div class="book-details-card">
          <img src="${bookDetails.imageLinks ? bookDetails.imageLinks.thumbnail : './images/placeholder.jpeg'}" 
               alt="${bookDetails.title} Cover" style="width:100px; height:auto; margin:0 auto 10px;">
          <h3>${bookDetails.title}</h3>
          <p>${bookDetails.authors ? bookDetails.authors.join(", ") : "Unknown Author"}</p>
          <p>${bookDetails.publishedDate ? bookDetails.publishedDate.split("-")[0] : "N/A"}</p>
          <div style="margin-top:15px;">
            <button id="addBookFromCardBtn" style="padding:8px 16px; margin-right:5px;">Add Book</button>
            <button id="editBookFromCardBtn" style="padding:8px 16px;">Edit</button>
          </div>
        </div>
      </div>
    `;
    
    // Attach listener to the close button.
    cardModal.querySelector(".close-modal").addEventListener("click", () => {
      cardModal.style.display = "none";
    });
    
    const addBtn = cardModal.querySelector("#addBookFromCardBtn");
    if (addBtn) {
                // When "Add Book" is clicked:
    addBtn.addEventListener("click", () => {
        if (selectedBookType === "tbr") {
            // For TBR, add immediately.
            addBookFromSearch(bookDetails);
            cardModal.style.display = "none";
        } else if (selectedBookType === "reading") {
            // For Currently Reading:
            // Store the search result temporarily.
            tempBookFromSearch = {
              ...bookDetails,
              id: Date.now().toString(),
              tbr: false,
              finished: false,
              cover: (bookDetails.imageLinks && bookDetails.imageLinks.thumbnail)
                          ? bookDetails.imageLinks.thumbnail
                          : './images/placeholder.jpeg'
            };
            closeModal(addBookModal);
            // Open the new modal for currently reading.
            openReadingFromSearchModal();
            cardModal.style.display = "none";
        } else if (selectedBookType === "finished") {
            // For Finished Books, open the new finished modal.
            tempBookFromSearch = {
                ...bookDetails,
                id: Date.now().toString(),
                tbr: false,
                finished: true,
                cover: (bookDetails.imageLinks && bookDetails.imageLinks.thumbnail)
                          ? bookDetails.imageLinks.thumbnail
                          : './images/placeholder.jpeg'
            };
            openNewFinishedModal();
            cardModal.style.display = "none";
        }
    });        
    } else {
    console.error("Add Book button in card not found.");
    }

    
    // When "Edit" is clicked, populate the manual entry fields and close the card.
    cardModal.querySelector("#editBookFromCardBtn").addEventListener("click", () => {
        // Simulate clicking the existing Manual Entry button.
        const manualBtn = document.getElementById('manualEntryModeBtn');
        if (manualBtn) {
          manualBtn.click();
        } else {
          console.warn("Manual Entry button not found.");
        }
        // Close the card modal.
        cardModal.style.display = "none";
      });      
}    

function addBookFromSearch(bookDetails) {
    // Build a new book object based on the search result
    const newBook = {
      id: Date.now().toString(),
      title: bookDetails.title || "No Title",
      author: bookDetails.authors ? bookDetails.authors.join(", ") : "Unknown Author",
      year: bookDetails.publishedDate ? parseInt(bookDetails.publishedDate.split("-")[0], 10) : 0,
      pages: bookDetails.pageCount ? parseInt(bookDetails.pageCount, 10) : 0,
      cover: (bookDetails.imageLinks && bookDetails.imageLinks.thumbnail) 
               ? bookDetails.imageLinks.thumbnail 
               : './images/placeholder.jpeg',
      startDate: null,
      tbr: true,
      finished: false,
      endDate: null,
      pagesPerHour: null,
      timeToRead: null,
      backgroundMode: 'cover',
      backgroundPosition: 'center',
      currentPage: undefined
    };
  
    // Add the new book and update the app state
    allBooks.push(newBook);
    updateAppState();
  
    // Close the add-book modal now:
    closeModal(addBookModal);
  
    // (Optionally, reset the addBookForm here if needed)
    addBookForm.reset();
}  

function openNewFinishedModal() {
    const newModal = document.getElementById('newFinishedModal');
    if (!newModal) {
        console.error("New Finished Modal not found.");
        return;
    }
    // Set up the form so that when submitted, it copies its fields into the manual entry fields,
    // then simulates a click on the addBookForm submit button.
    const newForm = newModal.querySelector('form');
    newForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Get the extra info from the new finished modal.
        const startDate = document.getElementById('newFinishStartDate').value.trim();
        const endDate = document.getElementById('newFinishEndDate').value.trim();
        const pagesPerHourStr = document.getElementById('newPagesPerHour').value.trim();
        const timeToReadStr = document.getElementById('newTimeToRead').value.trim();
        if (!startDate) {
            alert("Start date is required.");
            return;
        }
        if (!endDate) {
            alert("End date is required.");
            return;
        }
        const pagesPerHour = pagesPerHourStr ? parseFloat(pagesPerHourStr) : null;
        const timeToRead = timeToReadStr !== "" ? timeToReadStr : null;
        
        // Now, prefill the manual entry form with the extra finished book info.
        document.getElementById('startDate').value = startDate;
        document.getElementById('endDate').value = endDate;
        document.getElementById('pagesPerHour').value = pagesPerHourStr;
        document.getElementById('readingTime').value = timeToReadStr;
        
        // Now simulate a click on the manual entry form’s submit button.
        simulateManualEntrySubmit();
        
        // Close the new finished modal.
        closeModal(newModal);
    });
    
    // Open the modal.
    newModal.classList.remove('hidden');
    newModal.classList.add('active');
    newModal.style.display = 'flex';
}

function simulateManualEntrySubmit() {
    // You can either dispatch a 'submit' event on the addBookForm or simply call its handler.
    // Here we dispatch the event.
    if (addBookForm) {
        // Create a new event and dispatch it.
        const event = new Event('submit', { bubbles: true, cancelable: true });
        addBookForm.dispatchEvent(event);
    } else {
        console.error("addBookForm not found.");
    }
}

function openReadingFromSearchModal() {
    const modal = document.getElementById('readingFromSearchModal');
    if (!modal) {
      console.error("Reading From Search Modal not found.");
      return;
    }
    // Pre-fill the modal with the details from tempBookFromSearch.
    // tempBookFromSearch is assumed to have been set earlier when a search result was selected.
    if (!tempBookFromSearch) {
      console.error("No temporary book data available.");
      return;
    }
    
    // Fill in the fields in the modal.
    document.getElementById('rfsCover').src = tempBookFromSearch.imageLinks && tempBookFromSearch.imageLinks.thumbnail ? tempBookFromSearch.imageLinks.thumbnail : './images/placeholder.jpeg';
    document.getElementById('rfsTitle').textContent = tempBookFromSearch.title || "No Title";
    document.getElementById('rfsAuthor').textContent = tempBookFromSearch.authors ? tempBookFromSearch.authors.join(", ") : "Unknown Author";
    document.getElementById('rfsYear').textContent = tempBookFromSearch.publishedDate ? tempBookFromSearch.publishedDate.split("-")[0] : "N/A";
    document.getElementById('rfsPages').textContent = tempBookFromSearch.pageCount ? `${tempBookFromSearch.pageCount} pages` : "";
    
    // Clear any previously entered start date.
    document.getElementById('rfsStartDate').value = "";
    
    // Attach a click listener to the "Add Book" button (remove any previous listener first).
    const addBtn = document.getElementById('rfsAddBookBtn');
    addBtn.replaceWith(addBtn.cloneNode(true)); // remove previous listeners
    const newAddBtn = document.getElementById('rfsAddBookBtn');
    newAddBtn.addEventListener('click', () => {
      const startDate = document.getElementById('rfsStartDate').value.trim();
      if (!startDate) {
        alert("Please enter a start date.");
        return;
      }
      // Build the new book object using tempBookFromSearch and the start date.
      const newBook = {
        id: Date.now().toString(),
        title: tempBookFromSearch.title || "No Title",
        author: tempBookFromSearch.authors ? tempBookFromSearch.authors.join(", ") : "Unknown Author",
        year: tempBookFromSearch.publishedDate ? parseInt(tempBookFromSearch.publishedDate.split("-")[0], 10) : 0,
        pages: tempBookFromSearch.pageCount ? parseInt(tempBookFromSearch.pageCount, 10) : 0,
        cover: (tempBookFromSearch.imageLinks && tempBookFromSearch.imageLinks.thumbnail) ? tempBookFromSearch.imageLinks.thumbnail : './images/placeholder.jpeg',
        startDate: startDate,
        tbr: false,
        finished: false,
        endDate: null,
        pagesPerHour: null,
        timeToRead: null,
        backgroundMode: 'cover',
        backgroundPosition: 'center',
        currentPage: 0,
        goalEndDate: null
        };

      allBooks.push(newBook);
      updateAppState();
      closeModal(modal);
      // Clear the temporary book.
      tempBookFromSearch = null;
    });
    
    // Finally, show the modal.
    modal.classList.remove('hidden');
    modal.classList.add('active');
    modal.style.display = 'flex';
}  

// ===== Stats Calculation and Chart Rendering =====
function updateStats() {
    // Filter finished books
    const finishedBooks = allBooks.filter(book => book.finished);

    // Initialize accumulators
    let totalTimeMinutes = 0;  // We'll convert readingTime to minutes if possible
    let totalPages = 0;
    let pagesPerHourSum = 0;
    let countPagesPerHour = 0;

    // We'll also group finished books by month (e.g., "2023-01") for the bar charts.
    let pagesByMonth = {};

    finishedBooks.forEach(book => {
        // Assume book.timeToRead is in "HH:MM" format.
        if (book.timeToRead && book.timeToRead.includes(':')) {
            const [hrs, mins] = book.timeToRead.split(':').map(Number);
            totalTimeMinutes += hrs * 60 + mins;
        }
        totalPages += book.pages;  // Sum pages read (assuming pages is total pages of the book)
        if (book.pagesPerHour && !isNaN(book.pagesPerHour)) {
            pagesPerHourSum += Number(book.pagesPerHour);
            countPagesPerHour++;
        }
        // Group pages by month from book.endDate
        if (book.endDate) {
            const d = new Date(book.endDate);
            const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if (!pagesByMonth[monthKey]) {
                pagesByMonth[monthKey] = 0;
            }
            pagesByMonth[monthKey] += book.pages;
        }
    });

    // Calculate averages
    const avgPagesPerHour = countPagesPerHour > 0 ? (pagesPerHourSum / countPagesPerHour).toFixed(1) : 0;

    // Update DOM numerical values
    document.getElementById('totalReadingTimeValue').textContent = totalTimeMinutes + " minutes";
    document.getElementById('totalPagesReadValue').textContent = totalPages;
    document.getElementById('avgPagesPerHourValue').textContent = avgPagesPerHour;

    // Prepare data for the bar chart (for Total Pages Read per Month)
    const months = Object.keys(pagesByMonth).sort();
    const pagesData = months.map(month => pagesByMonth[month]);

    // Render bar chart using Chart.js in the stat box for pages read
    // First, get the canvas element:
    const ctx = document.getElementById('pagesReadChart').getContext('2d');
    // If a chart already exists, destroy it:
    if (window.pagesReadChartInstance) {
        window.pagesReadChartInstance.destroy();
    }
    window.pagesReadChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Pages Read',
                data: pagesData,
                backgroundColor: '#4b8ed7',
                borderColor: '#3a6ea5',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // (Optional) You can also add similar charts for other stats if desired.
}

document.querySelectorAll('.stats-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all, add active to clicked one.
        document.querySelectorAll('.stats-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // (Here you would add your filtering logic. For now, we’ll just log.)
        console.log("Stats filter selected:", btn.dataset.filter);
        // You might recalculate stats based on filter criteria here.
    });
});

function createBarChart(canvasId, dataArray, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                label: label,
                data: dataArray,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function populateMonthSelect() {
    const monthSelect = document.getElementById('monthSelect');
    if (!monthSelect) return;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthSelect.innerHTML = '';
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    monthSelect.value = selectedMonth;
}

function calculateStats() {
    const finishedBooks = allBooks.filter(book => 
        book.finished && new Date(book.endDate).getFullYear() === currentYear
    );
    const readingBooks = allBooks.filter(book => 
        !book.tbr && !book.finished && (book.startDate && new Date(book.startDate).getFullYear() === currentYear)
    );

    if (finishedBooks.length === 0 && readingBooks.length === 0) {
        resetStats();
        return;
    }

    document.getElementById('statsYear').textContent = currentYear;

    ['pages', 'time', 'pph'].forEach(category => {
        let filteredFinished = finishedBooks;
        let filteredReading = readingBooks;

        if (currentMode === 'month') {
            filteredFinished = finishedBooks.filter(book => new Date(book.endDate).getMonth() === selectedMonth);
            filteredReading = readingBooks.filter(book => new Date(book.startDate).getMonth() === selectedMonth);
        }

        if (category === 'pages') calculatePagesStats(filteredFinished, filteredReading);
        else if (category === 'time') calculateTimeStats(filteredFinished);
        else if (category === 'pph') calculatePPHStats(filteredFinished);
    });
}

function calculatePagesStats(finishedBooks, readingBooks) {
    let totalPages = finishedBooks.reduce((sum, book) => sum + book.pages, 0);
    totalPages += readingBooks.reduce((sum, book) => sum + (book.currentPage || 0), 0);
    let pagesByMonth = Array(12).fill(0);
    finishedBooks.forEach(book => pagesByMonth[new Date(book.endDate).getMonth()] += book.pages);
    readingBooks.forEach(book => pagesByMonth[new Date(book.startDate).getMonth()] += book.currentPage || 0);

    const avgPages = finishedBooks.length ? (finishedBooks.reduce((sum, book) => sum + book.pages, 0) / finishedBooks.length).toFixed(1) : 0;

    let leastPagesBook = null;
    let mostPagesBook = null;
    finishedBooks.forEach(book => {
        if (!leastPagesBook || book.pages < leastPagesBook.pages) leastPagesBook = book;
        if (!mostPagesBook || book.pages > mostPagesBook.pages) mostPagesBook = book;
    });

    const totalPagesElement = document.querySelector('#stat-pages-total .stat-value');
    const avgPagesElement = document.querySelector('#stat-pages-average .stat-value');
    const totalPagesBox = document.querySelector('#stat-pages-total');
    const avgPagesBox = document.querySelector('#stat-pages-average');
    const totalPagesHeader = document.querySelector('#stat-pages-total h3');
    const avgPagesHeader = document.querySelector('#stat-pages-average h3');
    const leastItemPages = document.querySelector('#stat-pages-least-most .least-most-item:first-child');
    const mostItemPages = document.querySelector('#stat-pages-least-most .least-most-item:last-child');

    if (totalPagesElement) totalPagesElement.textContent = totalPages;
    if (avgPagesElement) avgPagesElement.textContent = avgPages;
    if (leastItemPages) {
        leastItemPages.querySelector('.stat-value').textContent = leastPagesBook ? leastPagesBook.pages : '0';
        leastItemPages.querySelector('.least-cover').src = leastPagesBook ? leastPagesBook.cover || './images/placeholder.jpeg' : './images/placeholder.jpeg';
        leastItemPages.dataset.tooltip = leastPagesBook ? `${leastPagesBook.title}\n${leastPagesBook.author}\n${leastPagesBook.pages} pages` : 'N/A';
    }
    if (mostItemPages) {
        mostItemPages.querySelector('.stat-value').textContent = mostPagesBook ? mostPagesBook.pages : '0';
        mostItemPages.querySelector('.most-cover').src = mostPagesBook ? mostPagesBook.cover || './images/placeholder.jpeg' : './images/placeholder.jpeg';
        mostItemPages.dataset.tooltip = mostPagesBook ? `${mostPagesBook.title}\n${mostPagesBook.author}\n${mostPagesBook.pages} pages` : 'N/A';
    }

    if (currentMode === 'year') {
        if (totalPagesBox) totalPagesBox.classList.remove('month-mode');
        if (avgPagesBox) avgPagesBox.classList.remove('month-mode');
        if (totalPagesHeader) totalPagesHeader.textContent = 'Pages Read';
        if (avgPagesHeader) avgPagesHeader.textContent = 'Pages Read';
        const totalChart = document.querySelector('#stat-pages-total .stat-chart');
        const avgChart = document.querySelector('#stat-pages-average .stat-chart');
        if (currentStatsView === 'graph') {
            if (totalChart) totalChart.style.display = 'block';
            if (avgChart) avgChart.style.display = 'block';
            updateCharts('chart-pages-total', pagesByMonth, 'Pages Read');
            updateCharts('chart-pages-average', pagesByMonth.map(val => finishedBooks.length ? (val / finishedBooks.length).toFixed(1) : 0), 'Avg Pages');
            totalPagesBox.querySelector('.stat-list')?.remove();
            avgPagesBox.querySelector('.stat-list')?.remove();
        } else {
            if (totalChart) totalChart.style.display = 'none';
            if (avgChart) avgChart.style.display = 'none';
            updateYearListInBox(totalPagesBox, pagesByMonth, 'pages');
            updateYearListInBox(avgPagesBox, pagesByMonth.map(val => finishedBooks.length ? (val / finishedBooks.length).toFixed(1) : 0), 'pages');
        }
    } else { 
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        // Add a CSS class so the stat boxes get the fixed height
        if (totalPagesBox) totalPagesBox.classList.add('month-mode');
        if (avgPagesBox) avgPagesBox.classList.add('month-mode');
        
        // Create or update the month label for total pages
        let monthLabelTotal = totalPagesBox.querySelector('.month-label');
        if (!monthLabelTotal) {
            monthLabelTotal = document.createElement('div');
            monthLabelTotal.classList.add('month-label');
            // Insert it at the top of the box
            totalPagesBox.insertBefore(monthLabelTotal, totalPagesBox.firstChild);
        }
        monthLabelTotal.textContent = monthNames[selectedMonth];
        
        // Do the same for the average pages box
        let monthLabelAverage = avgPagesBox.querySelector('.month-label');
        if (!monthLabelAverage) {
            monthLabelAverage = document.createElement('div');
            monthLabelAverage.classList.add('month-label');
            avgPagesBox.insertBefore(monthLabelAverage, avgPagesBox.firstChild);
        }
        monthLabelAverage.textContent = monthNames[selectedMonth];
        
        // Update the stat values
        if (totalPagesElement) totalPagesElement.textContent = `${pagesByMonth[selectedMonth]}`;
        if (avgPagesElement) avgPagesElement.textContent = `${(pagesByMonth[selectedMonth] / (finishedBooks.length || 1)).toFixed(1)}`;
        
        // Hide the canvas charts if in list view mode:
        document.querySelector('#stat-pages-total .stat-chart').style.display = 'none';
        document.querySelector('#stat-pages-average .stat-chart').style.display = 'none';
        
        // Optionally remove any year-list if present:
        totalPagesBox.querySelector('.stat-list')?.remove();
        avgPagesBox.querySelector('.stat-list')?.remove();
    }    
}

function calculateTimeStats(finishedBooks) {
    let totalTime = 0;
    let timeByMonth = Array(12).fill(0);
    finishedBooks.forEach(book => {
        if (book.timeToRead && book.timeToRead.includes(':')) {
            const [hrs, mins] = book.timeToRead.split(':').map(Number);
            const minutes = hrs * 60 + mins;
            totalTime += minutes;
            timeByMonth[new Date(book.endDate).getMonth()] += minutes;
        }
    });

    const avgTime = finishedBooks.length ? Math.round(totalTime / finishedBooks.length) : 0;
    const totalHours = Math.floor(totalTime / 60);
    const totalMins = totalTime % 60;
    const totalDisplay = totalHours > 0 ? `${totalHours} hours and ${totalMins} minutes` : `${totalMins} minutes`;
    const avgHours = Math.floor(avgTime / 60);
    const avgMins = avgTime % 60;
    const avgDisplay = avgHours > 0 ? `${avgHours} hours and ${avgMins} minutes` : `${avgMins} minutes`;

    let leastTimeBook = null;
    let mostTimeBook = null;
    finishedBooks.forEach(book => {
        if (book.timeToRead && book.timeToRead.includes(':')) {
            const minutes = parseInt(book.timeToRead.split(':')[0]) * 60 + parseInt(book.timeToRead.split(':')[1]);
            if (!leastTimeBook || minutes < (leastTimeBook.timeToRead ? parseInt(leastTimeBook.timeToRead.split(':')[0]) * 60 + parseInt(leastTimeBook.timeToRead.split(':')[1]) : Infinity)) leastTimeBook = book;
            if (!mostTimeBook || minutes > (mostTimeBook.timeToRead ? parseInt(mostTimeBook.timeToRead.split(':')[0]) * 60 + parseInt(mostTimeBook.timeToRead.split(':')[1]) : -Infinity)) mostTimeBook = book;
        }
    });

    const totalTimeElement = document.querySelector('#stat-time-total .stat-value');
    const avgTimeElement = document.querySelector('#stat-time-average .stat-value');
    const totalTimeBox = document.querySelector('#stat-time-total');
    const avgTimeBox = document.querySelector('#stat-time-average');
    const totalTimeHeader = document.querySelector('#stat-time-total small');
    const avgTimeHeader = document.querySelector('#stat-time-average h3');
    const leastItemTime = document.querySelector('#stat-time-least-most .least-most-item:first-child');
    const mostItemTime = document.querySelector('#stat-time-least-most .least-most-item:last-child');

    if (totalTimeElement) totalTimeElement.textContent = totalDisplay;
    if (avgTimeElement) avgTimeElement.textContent = avgDisplay;
    if (leastItemTime && leastTimeBook) {
        const leastMins = parseInt(leastTimeBook.timeToRead.split(':')[0]) * 60 + parseInt(leastTimeBook.timeToRead.split(':')[1]);
        const leastHours = Math.floor(leastMins / 60);
        const leastRemainder = leastMins % 60;
        leastItemTime.querySelector('.stat-value').textContent = leastHours > 0 ? `${leastHours} hours and ${leastRemainder} minutes` : `${leastRemainder} minutes`;
        leastItemTime.querySelector('.least-cover').src = leastTimeBook.cover || './images/placeholder.jpeg';
        leastItemTime.dataset.tooltip = `${leastTimeBook.title}\n${leastTimeBook.author}\n${leastTimeBook.pages} pages`;
    } else if (leastItemTime) {
        leastItemTime.querySelector('.stat-value').textContent = '0';
        leastItemTime.querySelector('.least-cover').src = './images/placeholder.jpeg';
        leastItemTime.dataset.tooltip = 'N/A';
    }
    if (mostItemTime && mostTimeBook) {
        const mostMins = parseInt(mostTimeBook.timeToRead.split(':')[0]) * 60 + parseInt(mostTimeBook.timeToRead.split(':')[1]);
        const mostHours = Math.floor(mostMins / 60);
        const mostRemainder = mostMins % 60;
        mostItemTime.querySelector('.stat-value').textContent = mostHours > 0 ? `${mostHours} hours and ${mostRemainder} minutes` : `${mostRemainder} minutes`;
        mostItemTime.querySelector('.most-cover').src = mostTimeBook.cover || './images/placeholder.jpeg';
        mostItemTime.dataset.tooltip = `${mostTimeBook.title}\n${mostTimeBook.author}\n${mostTimeBook.pages} pages`;
    } else if (mostItemTime) {
        mostItemTime.querySelector('.stat-value').textContent = '0';
        mostItemTime.querySelector('.most-cover').src = './images/placeholder.jpeg';
        mostItemTime.dataset.tooltip = 'N/A';
    }

    if (currentMode === 'year') {
        if (totalTimeBox) totalTimeBox.classList.remove('month-mode');
        if (avgTimeBox) avgTimeBox.classList.remove('month-mode');
        if (totalTimeHeader) totalTimeHeader.textContent = 'Reading Time';
        if (avgTimeHeader) avgTimeHeader.textContent = 'Reading Time';
        const totalChart = document.querySelector('#stat-time-total .stat-chart');
        const avgChart = document.querySelector('#stat-time-average .stat-chart');
        if (currentStatsView === 'graph') {
            if (totalChart) totalChart.style.display = 'block';
            if (avgChart) avgChart.style.display = 'block';
            updateCharts('chart-time-total', timeByMonth, 'Reading Time (min)');
            updateCharts('chart-time-average', timeByMonth.map(val => finishedBooks.length ? (val / finishedBooks.length).toFixed(1) : 0), 'Avg Time (min)');
            totalTimeBox.querySelector('.stat-list')?.remove();
            avgTimeBox.querySelector('.stat-list')?.remove();
        } else {
            if (totalChart) totalChart.style.display = 'none';
            if (avgChart) avgChart.style.display = 'none';
            updateYearListInBox(totalTimeBox, timeByMonth, 'min');
            updateYearListInBox(avgTimeBox, timeByMonth.map(val => finishedBooks.length ? (val / finishedBooks.length).toFixed(1) : 0), 'min');
        }
    } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        // Add a CSS class to enforce fixed height (if not already)
        if (totalTimeBox) totalTimeBox.classList.add('month-mode');
        if (avgTimeBox) avgTimeBox.classList.add('month-mode');
      
        // Set the header text to the month name for both total and average boxes
        if (totalTimeHeader) totalTimeHeader.textContent = monthNames[selectedMonth];
        if (avgTimeHeader) avgTimeHeader.textContent = monthNames[selectedMonth];
      
        // Set the value to the month's value
        if (totalTimeElement) totalTimeElement.textContent = `${timeByMonth[selectedMonth]} min`;
        if (avgTimeElement) avgTimeElement.textContent = `${(timeByMonth[selectedMonth] / (finishedBooks.length || 1)).toFixed(0)} min`;
      
        // Hide the charts when in list mode
        const totalChart = document.querySelector('#stat-time-total .stat-chart');
        const avgChart = document.querySelector('#stat-time-average .stat-chart');
        if (totalChart) totalChart.style.display = 'none';
        if (avgChart) avgChart.style.display = 'none';
      
        // Remove any year-list (if present)
        totalTimeBox.querySelector('.stat-list')?.remove();
        avgTimeBox.querySelector('.stat-list')?.remove();
      }
}

function calculatePPHStats(finishedBooks) {
    let totalPPH = 0;
    let pphByMonth = Array(12).fill(0);
    let pphCount = 0;
    finishedBooks.forEach(book => {
        if (book.pagesPerHour) {
            totalPPH += book.pagesPerHour;
            pphCount++;
            pphByMonth[new Date(book.endDate).getMonth()] += book.pagesPerHour;
        }
    });

    const avgPPH = pphCount ? (totalPPH / pphCount).toFixed(1) : 0;

    let leastPPHBook = null;
    let mostPPHBook = null;
    finishedBooks.forEach(book => {
        if (book.pagesPerHour) {
            if (!leastPPHBook || book.pagesPerHour < leastPPHBook.pagesPerHour) leastPPHBook = book;
            if (!mostPPHBook || book.pagesPerHour > mostPPHBook.pagesPerHour) mostPPHBook = book;
        }
    });

    const avgPPHElement = document.querySelector('#stat-pph-average .stat-value');
    const avgPPHBox = document.querySelector('#stat-pph-average');
    const avgPPHHeader = document.querySelector('#stat-pph-average h3');
    const leastItemPPH = document.querySelector('#stat-pph-least-most .least-most-item:first-child');
    const mostItemPPH = document.querySelector('#stat-pph-least-most .least-most-item:last-child');

    if (avgPPHElement) avgPPHElement.textContent = avgPPH;
    if (leastItemPPH) {
        leastItemPPH.querySelector('.stat-value').textContent = leastPPHBook ? leastPPHBook.pagesPerHour : '0';
        leastItemPPH.querySelector('.least-cover').src = leastPPHBook ? leastPPHBook.cover || './images/placeholder.jpeg' : './images/placeholder.jpeg';
        leastItemPPH.dataset.tooltip = leastPPHBook ? `${leastPPHBook.title}\n${leastPPHBook.author}\n${leastPPHBook.pages} pages` : 'N/A';
    }
    if (mostItemPPH) {
        mostItemPPH.querySelector('.stat-value').textContent = mostPPHBook ? mostPPHBook.pagesPerHour : '0';
        mostItemPPH.querySelector('.most-cover').src = mostPPHBook ? mostPPHBook.cover || './images/placeholder.jpeg' : './images/placeholder.jpeg';
        mostItemPPH.dataset.tooltip = mostPPHBook ? `${mostPPHBook.title}\n${mostPPHBook.author}\n${mostPPHBook.pages} pages` : 'N/A';
    }

    if (currentMode === 'year') {
        if (avgPPHBox) avgPPHBox.classList.remove('month-mode');
        if (avgPPHHeader) avgPPHHeader.textContent = 'Pages per Hour';
        const avgChart = document.querySelector('#stat-pph-average .stat-chart');
        if (currentStatsView === 'graph') {
            if (avgChart) avgChart.style.display = 'block';
            updateCharts('chart-pph-average', pphByMonth.map(val => pphCount ? (val / pphCount).toFixed(1) : 0), 'Avg PPH');
            avgPPHBox.querySelector('.stat-list')?.remove();
        } else {
            if (avgChart) avgChart.style.display = 'none';
            updateYearListInBox(avgPPHBox, pphByMonth.map(val => pphCount ? (val / pphCount).toFixed(1) : 0), '');
        }
    } else {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        if (avgPPHBox) avgPPHBox.classList.add('month-mode');
      
        // Set headers to the month name
       if (avgPPHHeader) avgPPHHeader.textContent = monthNames[selectedMonth];
      
        if (avgPPHElement) avgPPHElement.textContent = `${(pphByMonth[selectedMonth] / (pphCount || 1)).toFixed(1)}`;
      
        // Hide the chart canvases
        const avgChart = document.querySelector('#stat-pph-average .stat-chart');
        if (avgChart) avgChart.style.display = 'none';
      
        // Remove any existing year list
        avgPPHBox.querySelector('.stat-list')?.remove();
      }
}

function resetStats() {
    const categories = ['pages', 'time', 'pph'];
    categories.forEach(cat => {
        const totalElement = document.querySelector(`#stat-${cat}-total .stat-value`);
        const avgElement = document.querySelector(`#stat-${cat}-average .stat-value`);
        const totalBox = document.querySelector(`#stat-${cat}-total`);
        const avgBox = document.querySelector(`#stat-${cat}-average`);
        const totalHeader = document.querySelector(`#stat-${cat}-total h3`);
        const avgHeader = document.querySelector(`#stat-${cat}-average h3`);
        const leastItem = document.querySelector(`#stat-${cat}-least-most .least-most-item:first-child`);
        const mostItem = document.querySelector(`#stat-${cat}-least-most .least-most-item:last-child`);
        const totalChart = document.querySelector(`#stat-${cat}-total .stat-chart`);
        const avgChart = document.querySelector(`#stat-${cat}-average .stat-chart`);

        if (totalElement) totalElement.textContent = cat === 'time' ? '0 min' : '0';
        if (avgElement)   avgElement.textContent   = cat === 'time' ? '0 min' : '0';
        if (totalBox)     totalBox.classList.remove('month-mode');
        if (avgBox)       avgBox.classList.remove('month-mode');
        if (totalHeader)  totalHeader.textContent  = cat === 'pages' ? 'Pages Read' : cat === 'time' ? 'Reading Time' : 'Pages per Hour';
        if (avgHeader)    avgHeader.textContent    = cat === 'pages' ? 'Pages Read' : cat === 'time' ? 'Reading Time' : 'Pages per Hour';

        if (totalChart) totalChart.style.display = currentStatsView === 'graph' ? 'block' : 'none';
        if (avgChart)   avgChart.style.display   = currentStatsView === 'graph' ? 'block' : 'none';

        // Remove any existing lists (guard null boxes)
        if (totalBox) totalBox.querySelector('.stat-list')?.remove();
        if (avgBox)   avgBox.querySelector('.stat-list')?.remove();

        if (currentStatsView === 'graph') {
        updateCharts(`chart-${cat}-total`,   Array(12).fill(0), cat === 'pages' ? 'Pages Read'       : cat === 'time' ? 'Reading Time (min)' : 'Pages Per Hour');
        updateCharts(`chart-${cat}-average`, Array(12).fill(0), cat === 'pages' ? 'Avg Pages'        : cat === 'time' ? 'Avg Time (min)'    : 'Avg PPH');
        } else {
        if (totalBox) updateYearListInBox(totalBox, Array(12).fill(0), cat === 'pages' ? 'pages' : cat === 'time' ? 'min' : '');
        if (avgBox)   updateYearListInBox(avgBox,   Array(12).fill(0), cat === 'pages' ? 'pages' : cat === 'time' ? 'min' : '');
        }
    });
    const statsYear = document.getElementById('statsYear');
    if (statsYear) statsYear.textContent = currentYear;
}

function updateCharts(canvasId, data, label) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (window[`chart${canvasId}`]) window[`chart${canvasId}`].destroy();

    window[`chart${canvasId}`] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: label,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#fff' } },
                x: { ticks: { color: '#fff' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateYearListInBox(box, data, unit) {
    if (!box) return;
    const existingList = box.querySelector('.stat-list');
    if (existingList) existingList.remove();
    const listContainer = document.createElement('div');
    listContainer.classList.add('stat-list');
    listContainer.style.height = '150px'; /* Match chart height */
    listContainer.style.overflowY = 'auto';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    data.forEach((value, index) => {
        if (value > 0) {
            const listItem = document.createElement('div');
            listItem.classList.add('year-list-item');
            listItem.innerHTML = `<span>${months[index]}</span><span>${value} ${unit}</span>`;
            listContainer.appendChild(listItem);
        }
    });
    box.appendChild(listContainer);
}

// Slider Listeners
document.querySelectorAll('#modeSlider .slider-option').forEach(option => {
    option.addEventListener('click', () => {
        currentMode = option.dataset.mode;
        document.getElementById('modeIndicator').style.left = currentMode === 'year' ? '0' : '50%';
        document.getElementById('monthSelect').style.display = currentMode === 'month' ? 'inline-block' : 'none';
        calculateStats();
    });
});

document.querySelectorAll('#viewSlider .slider-option').forEach(option => {
    option.addEventListener('click', () => {
        currentStatsView = option.dataset.view;
        document.getElementById('viewIndicator').style.left = currentStatsView === 'graph' ? '0' : '50%';
        calculateStats();
    });
});

document.getElementById('monthSelect').addEventListener('change', (e) => {
    selectedMonth = parseInt(e.target.value, 10);
    calculateStats();
});

// Ensure stats update on key events
function updateAppState() {
    localStorage.setItem('books', JSON.stringify(allBooks));
    updateDashboard();
    displayBooks();
    attachStartReadingListeners();
    attachFinishButtonListeners();
    calculateStats();
}

function handleISBNSearchResult(bookInfo) {
    // First, auto–populate the manual entry fields
    populateToBeReadFields(bookInfo);
    // Then, open the card for further options:
    renderBookDetailsCard(bookInfo);
}  

document.getElementById('statsBtn').addEventListener('click', () => {
    document.getElementById('toBeReadSection').style.display = 'none';
    document.getElementById('currentlyReadingSection').style.display = 'none';
    document.getElementById('finishedBooksSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'block';
    document.querySelector('.container').style.display = 'none';
    populateMonthSelect();
    calculateStats();
});

document.getElementById('yearSelect').addEventListener('change', (e) => {
    currentYear = parseInt(e.target.value, 10);
    updateAppState();
    loadGoal();
    calculateStats();
});

// Update filter button listeners (remove if redundant)
document.querySelectorAll('.stats-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.stats-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        calculateStats(filter);
    });
});

const modeSlider = document.getElementById('modeSlider');
const modeIndicator = document.getElementById('modeIndicator');
modeSlider.addEventListener('click', () => {
  // Toggle currentMode between 'year' and 'month'
  currentMode = currentMode === 'year' ? 'month' : 'year';
  modeIndicator.style.left = currentMode === 'year' ? '0%' : '50%';
  // Show month select only if in month mode
  document.getElementById('monthSelect').style.display = currentMode === 'month' ? 'inline-block' : 'none';
  calculateStats();
});

const viewSlider = document.getElementById('viewSlider');
const viewIndicator = document.getElementById('viewIndicator');
viewSlider.addEventListener('click', () => {
  // Toggle currentStatsView between 'graph' and 'list'
  currentStatsView = currentStatsView === 'graph' ? 'list' : 'graph';
  viewIndicator.style.left = currentStatsView === 'graph' ? '0%' : '50%';
  calculateStats();
});

// Fetch recommended books from Google Books API based on the given book.
async function fetchRecommendedBooks(book) {
    // Construct a query that combines the title and author.
    const query = `${book.title} ${book.author}`;
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error fetching recommended books:", error);
      return [];
    }
  }
  
  // Display recommendations in a modal.
  function showRecommendations(book) {
    fetchRecommendedBooks(book).then(recommendedBooks => {
      // Create the recommendations modal if it doesn't exist.
      let recModal = document.getElementById("recommendationsModal");
      if (!recModal) {
        recModal = document.createElement("div");
        recModal.id = "recommendationsModal";
        recModal.classList.add("modal");
        recModal.innerHTML = `
          <div class="modal-content">
            <button class="close-modal">&times;</button>
            <h2>Recommended Books</h2>
            <div id="recommendationsContainer" class="rec-grid"></div>
          </div>
        `;
        document.body.appendChild(recModal);
        recModal.querySelector(".close-modal").addEventListener("click", () => {
          recModal.style.display = "none";
          recModal.classList.remove("active");
        });
      }
      // Populate recommendations.
      const recContainer = recModal.querySelector("#recommendationsContainer");
      recContainer.innerHTML = "";
      recommendedBooks.forEach(recBook => {
        const recInfo = recBook.volumeInfo;
        // (Optionally, add filtering logic here to skip books that seem to be in the same series.)
        const recCard = document.createElement("div");
        recCard.classList.add("rec-card");
        recCard.innerHTML = `
          <img src="${recInfo.imageLinks?.thumbnail || './images/placeholder.jpeg'}" alt="${recInfo.title} Cover" />
          <h3>${recInfo.title || "No Title"}</h3>
          <p>${recInfo.authors ? recInfo.authors.join(", ") : "Unknown Author"}</p>
          <p class="rec-description">${recInfo.description ? recInfo.description.slice(0,150) + '...' : "No description available."}</p>
          <button class="add-to-tbr-btn">Add to TBR</button>
        `;
        recCard.querySelector(".add-to-tbr-btn").addEventListener("click", () => {
          // Create a new book object for TBR.
          const newBook = {
            id: Date.now().toString(),
            title: recInfo.title || "No Title",
            author: recInfo.authors ? recInfo.authors.join(", ") : "Unknown Author",
            year: recInfo.publishedDate ? parseInt(recInfo.publishedDate.split("-")[0], 10) : 0,
            pages: recInfo.pageCount ? parseInt(recInfo.pageCount, 10) : 0,
            cover: recInfo.imageLinks?.thumbnail || './images/placeholder.jpeg',
            startDate: null,
            tbr: true,
            finished: false,
            endDate: null,
            pagesPerHour: null,
            timeToRead: null,
            backgroundMode: 'cover',
            backgroundPosition: 'center',
            currentPage: undefined
          };
          allBooks.push(newBook);
          updateAppState();
          alert("Book added to To Be Read!");
        });
        recContainer.appendChild(recCard);
      });
      recModal.style.display = "flex";
      recModal.classList.add("active");
    });
  }
  
  // In your openBookDetailsModal(book) function, add a "See Recommendations" button:
  function addRecommendationsButton(book) {
    const recButton = document.createElement('button');
    recButton.innerText = 'See Recommendations';
    recButton.addEventListener('click', () => {
      showRecommendations(book);
    });
    const modalButtonsContainer = document.querySelector('.modal-buttons');
    if (modalButtonsContainer) {
      modalButtonsContainer.appendChild(recButton);
    }
}
  
});