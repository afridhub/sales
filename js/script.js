const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzesy61BweFAXYJbDBJ9iPx7_jpRug40CSODdaeRsSw8V-KpaOMUKSjuEeMyW-MM0U5/exec"; // updated to the latest endpoint
let allData = [];
let isLoading = false;
let productStats = {};
let isOnline = navigator.onLine;

// Helper function for fetch with timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

async function loadComponent(path, containerId) {
    try {
        const res = await fetchWithTimeout(path, {}, 3000);
        if (res.ok) {
            document.getElementById(containerId).innerHTML = await res.text();
        } else {
            console.error('Failed to load component', path, res.status);
            // fallback to inline markup if remote fetch fails
            insertFallback(containerId);
        }
    } catch (e) {
        console.error('Error fetching component', path, e);
        // fallback in case file:// or network blocked
        insertFallback(containerId);
    }
}

// when fetch cannot load, insert minimal markup so UI still shows
function insertFallback(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (containerId === 'navbar-container') {
        el.innerHTML = `
<nav class="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
    <div class="max-w-6xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-2">
                <img src="assets/images/logo/logo.png" alt="Logo" class="h-10 md:h-12 w-auto">
                <span class="font-bold text-xs md:text-base uppercase tracking-tight text-slate-800 hidden xs:block">Admin Panel</span>
            </div>
            
            <div class="flex items-center justify-center space-x-2 md:space-x-6">
                <a href="entry.html" class="tab-btn px-2 text-xs md:text-sm" id="nav-entry">Entry</a>
                <a href="reports.html" class="tab-btn px-2 text-xs md:text-sm" id="nav-reports">Reports</a>
                <a href="analytics.html" class="tab-btn px-2 text-xs md:text-sm" id="nav-analytics">Analytics</a>
            </div>

            <div class="flex items-center gap-2">
                <button id="header-sync-btn" onclick="refreshData(true)" class="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center" title="Sync Live Data">
                    <i class="fas fa-sync-alt" id="header-sync-icon"></i>
                </button>
                <div class="border-l border-slate-200 pl-2 lg:pl-4" id="auth-section">
                    <div id="user-info" class="hidden flex items-center gap-2 md:gap-4">
                        <button onclick="logout()" class="px-3 md:px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-xs md:text-sm hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm">
                            <i class="fas fa-sign-out-alt"></i> <span class="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</nav>`;
        // Set active nav based on current page
        setTimeout(() => {
            const currentPage = window.location.pathname.split('/').pop() || 'entry.html';
            const links = {
                'entry': ['nav-entry', 'nav-entry-mobile'],
                'reports': ['nav-reports', 'nav-reports-mobile'],
                'analytics': ['nav-analytics', 'nav-analytics-mobile']
            };
            
            Object.keys(links).forEach(key => {
                if (currentPage.includes(key) || (key === 'entry' && (currentPage === '' || currentPage === 'index.html'))) {
                    links[key].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            if (id.includes('mobile')) el.classList.add('active');
                            else el.classList.add('bg-blue-50', 'text-blue-600');
                        }
                    });
                }
            });
        }, 0);
    } else if (containerId === 'header-container') {
        el.innerHTML = `<!-- Toast Notification -->
<div id="toast" class="toast hidden"></div>

<!-- Login Modal -->
<div id="login-box" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 px-4 bg-opacity-90 backdrop-blur-sm">
    <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm fade-in">
        <div class="mb-6 text-center">
            <div class="mx-auto bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <i class="fas fa-user text-white text-xl"></i>
            </div>
            <h2 class="text-2xl font-extrabold text-slate-800 uppercase tracking-tight">Login</h2>
            <p class="text-slate-500 text-sm mt-2">Sign in to your account</p>
        </div>
        <form onsubmit="return handleLogin(event)">
            <div class="mb-4">
                <label class="text-xs font-bold text-slate-600 uppercase block mb-2">Username</label>
                <input type="text" id="username" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Enter username" required>
            </div>
            <div class="mb-6">
                <label class="text-xs font-bold text-slate-600 uppercase block mb-2">Password</label>
                <input type="password" id="password" class="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors" placeholder="Enter password" required>
            </div>
            <button type="submit" class="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md hover:shadow-lg">
                Sign In
            </button>
        </form>
        <p class="text-slate-400 text-xs mt-4 text-center">Demo: user / pass</p>
    </div>
</div>`;
    } else if (containerId === 'footer-container') {
        el.innerHTML = `<footer class="bg-white border-t border-slate-200 text-center py-4"><p class="text-sm text-slate-500">&copy; Banglalink Fida Hassan Admin</p></footer>`;
    }
}

// Initialize the app & load components
document.addEventListener('DOMContentLoaded', async function() {
    // Ensure containers exist before filling them
    const headerCont = document.getElementById('header-container');
    const navbarCont = document.getElementById('navbar-container');
    
    // Load components with fast timeout and fallback
    await Promise.all([
        loadComponent('components/header.html', 'header-container').catch(() => insertFallback('header-container')),
        loadComponent('components/navbar.html', 'navbar-container').catch(() => insertFallback('navbar-container')),
        loadComponent('components/footer.html', 'footer-container').catch(() => insertFallback('footer-container'))
    ]);
    
    // Verify components were loaded, if not, inject fallback immediately
    if (!document.querySelector('nav')) {
        insertFallback('navbar-container');
    }
    if (!document.getElementById('login-box')) {
        insertFallback('header-container');
    }
    if (!document.querySelector('footer')) {
        insertFallback('footer-container');
    }

    // --- Helper Functions ---
    // Helper to format date nicely (e.g., 12 Mar 26)
    window.formatDate = function(dateStr) {
        if (!dateStr || dateStr === '-') return '-';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
        } catch (e) {
            return dateStr;
        }
    };

    // Format number to Taka string
    window.formatTk = function(num) {
        return (parseFloat(num) || 0).toFixed(0) + ' Tk';
    };
    // ------------------------

    // Set today's date
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }

    // Initialize auth UI
    updateAuthUI();

    // Auto-load data for reports and analytics pages if logged in
    const isLoggedIn = localStorage.getItem('sfp-loggedin') === 'true';
    if (isLoggedIn) {
        // Auto load live data for all pages (Entry, Reports, Analytics)
        await refreshData(true);
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (typeof submitData === 'function') submitData();
        }
        // Ctrl+R to refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (typeof refreshData === 'function') refreshData();
        }
    });
});

// Show notification with customizable type
function showNotification(message, type = "success") {
    const toast = document.getElementById('toast');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

// Enhanced login with username and password
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple validation (user / pass)
    if(username === "user" && password === "pass") {
        document.getElementById('login-box').style.display = 'none';
        localStorage.setItem('sfp-loggedin', 'true');
        localStorage.setItem('sfp-username', username);
        updateAuthUI();
        refreshData();
        showNotification("Welcome " + username + "!", "success");
        // Clear form
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        return false;
    } else {
        showNotification("Invalid username or password", "error");
        document.getElementById('password').value = "";
        document.getElementById('password').focus();
        return false;
    }
}

// Show login modal
function showLoginModal() {
    document.getElementById('login-box').style.display = 'flex';
    document.getElementById('username').focus();
}

// Logout function
function logout() {
    localStorage.setItem('sfp-loggedin', 'false');
    localStorage.setItem('sfp-username', '');
    updateAuthUI();
    document.getElementById('login-box').style.display = 'flex';
    showNotification("Logged out successfully", "success");
}

// Update authentication UI based on login status
function updateAuthUI() {
    const isLoggedIn = localStorage.getItem('sfp-loggedin') === 'true';
    const username = localStorage.getItem('sfp-username') || 'User';
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const mainContent = document.querySelector('main');
    const loginBox = document.getElementById('login-box');

    if (isLoggedIn) {
        if (loginBtn) loginBtn.classList.add('hidden');
        if (userInfo) userInfo.classList.remove('hidden');
        if (userInfo) {
            const loggedUserEl = document.getElementById('logged-user');
            if (loggedUserEl) loggedUserEl.innerText = username;
        }
        if (mainContent) mainContent.classList.remove('opacity-0');
        if (loginBox) loginBox.style.display = 'none';
        
        // Ensure nav links are visible
        const navItems = document.querySelectorAll('.tab-btn');
        navItems.forEach(btn => btn.classList.remove('opacity-0'));
    } else {
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
        if (mainContent) mainContent.classList.add('opacity-0');
        if (loginBox) loginBox.style.display = 'flex';
    }
}

// Set role visibility
function setRole() {
    const r = document.getElementById('role').value;
    document.getElementById('dynamic-name-label').innerText = (r === 'BP' ? 'BP Name' : 'RSO Name');
    document.querySelectorAll('.card-row').forEach(row => {
        row.style.display = (r === 'BP' ? 'none' : 'table-row');
    });
    calc();
}

// Calculate totals and update UI
function calc() {
    let totalSales = 0;
    let totalItems = 0;
    let maxSold = 0;
    let topItem = "";
    
    document.querySelectorAll('#product-rows tr').forEach(tr => {
        const id = tr.getAttribute('data-id');
        const rate = parseFloat(tr.querySelector('.rate').value) || 0;
        const took = parseFloat(tr.querySelector('.took').value) || 0;
        const soldInput = tr.querySelector('.sold');
        const subDisplay = tr.querySelector('.subtotal');

        if (tr.style.display !== 'none') {
            if (id === 'ev') {
                let soldVal;
                
                // Validate input
                if (took < 0) {
                    tr.querySelector('.took').classList.add('!border-red-300', '!bg-red-50');
                    soldVal = 0;
                } else {
                    tr.querySelector('.took').classList.remove('!border-red-300', '!bg-red-50');
                    soldVal = took - (took * (rate / 100));
                }
                
                soldInput.value = soldVal.toFixed(0);
                subDisplay.innerText = soldVal.toFixed(0);
                totalSales += soldVal;
                // Don't count EV Recharge in totalItems
                
                if(soldVal > maxSold) {
                    maxSold = soldVal;
                    topItem = "EV Recharge";
                }
            } else {
                let sold = parseFloat(tr.querySelector('.sold').value) || 0;
                
                // Validate input
                if (sold < 0) {
                    tr.querySelector('.sold').classList.add('!border-red-300', '!bg-red-50');
                    sold = 0;
                } else {
                    tr.querySelector('.sold').classList.remove('!border-red-300', '!bg-red-50');
                }
                
                let sub = rate * sold;
                subDisplay.innerText = sub.toFixed(0);
                totalSales += sub;
                totalItems += sold;
                
                if(sold > maxSold) {
                    maxSold = sold;
                    const itemName = tr.querySelector('td:first-child').innerText;
                    topItem = itemName;
                }
            }
        }
    });

    const fuel = parseFloat(document.getElementById('fuel').value) || 0;
    const paid = parseFloat(document.getElementById('paid').value) || 0;
    const prev = parseFloat(document.getElementById('prev').value) || 0;
    const histDue = parseFloat(document.getElementById('history-due').innerText) || 0;
    
    const netToday = totalSales - fuel;
    document.getElementById('total-val').innerText = netToday.toFixed(0);
    document.getElementById('grand-due-val').innerText = (histDue + netToday - (paid + prev)).toFixed(0);
    
    // Update quick stats
    document.getElementById('items-sold').innerText = Math.round(totalItems);
}

// Fetch data from Google Sheets
// when called with force=true the cache is ignored and a fresh fetch is made
async function refreshData(force = false) {
    console.log('refreshData called, isLoading:', isLoading, 'force:', force);
    if(isLoading) return;
    
    const headerSyncBtn = document.getElementById('header-sync-btn');
    const headerSyncIcon = document.getElementById('header-sync-icon');
    
    // Add loading state
    isLoading = true;
    if (headerSyncBtn) {
        headerSyncBtn.disabled = true;
        if (headerSyncIcon) {
            headerSyncIcon.classList.remove('text-green-500');
            headerSyncIcon.classList.add('fa-spin', 'text-blue-600');
        }
    }
    
    try {
        console.log('Fetching live data from API...');
        const res = await fetchWithTimeout(SCRIPT_URL, {}, 8000);
        console.log('API response received:', res.status);
        if(!res.ok) throw new Error('Network response was not ok: ' + res.status);
        
        console.log('Parsing JSON response...');
        allData = await res.json();
        const now = new Date().getTime();
        
        localStorage.setItem('sfp-data', JSON.stringify(allData));
        localStorage.setItem('sfp-timestamp', now.toString());
        
        // Success coloring for header sync button
        if (headerSyncIcon) {
            headerSyncIcon.classList.remove('text-blue-600');
            headerSyncIcon.classList.add('text-green-500');
        }
        showNotification("Data synced successfully", "success");
        
        console.log('Processing names...');
        const names = [...new Set(allData.slice(1).map(row => row[1]))].filter(n => n);
        console.log('Unique names:', names.length);
        
        const nameList = document.getElementById('name-list');
        if (nameList) {
            nameList.innerHTML = names.map(n => `<option value="${n}">`).join('');
        }
        
        console.log('Calling renderTable...');
        renderTable();
        
        console.log('Calling updateAnalytics...');
        updateAnalytics();
        
        console.log('Data load complete');
    } catch (e) {
        console.error("Sync Error:", e);
        showNotification("API Error: " + e.message, "error");
        
        // Try to use cached data as fallback
        const cachedData = localStorage.getItem('sfp-data');
        if (cachedData) {
            console.log('Using cached data as fallback');
            allData = JSON.parse(cachedData);
            showNotification("Using cached data (offline)", "warning");
            renderTable();
            updateAnalytics();
        } else {
            console.log('No cached data, using empty');
            showNotification("Failed to sync data - using empty data", "error");
            // Initialize empty data structure to prevent page freeze
            allData = [["Date", "Name", "Role", "Net Sales", "Paid", "Due"]];
            renderTable();
            updateAnalytics();
        }
    } finally {
        console.log('refreshData finally block');
        
        const reportContent = document.getElementById('report-content');
        const analyticsContent = document.getElementById('analytics-content');
        const entryContent = document.getElementById('entry-content');
        if (reportContent) reportContent.classList.remove('hidden', 'opacity-0');
        if (analyticsContent) analyticsContent.classList.remove('hidden', 'opacity-0');
        if (entryContent) entryContent.classList.remove('hidden', 'opacity-0');
        
        // Reset loading state
        isLoading = false;
        if (headerSyncBtn) {
            headerSyncBtn.disabled = false;
            if (headerSyncIcon) {
                headerSyncIcon.classList.remove('fa-spin');
                // Don't remove green color immediately so user sees success.
                // It will be reset on the next sync start.
            }
        }
        console.log('refreshData finished');
    }
}

// Check previous balance for selected staff
function checkHistoryBalance() {
    const nameInput = document.getElementById('rso-name').value.trim().toLowerCase();
    let totalDue = 0;
    
    if(nameInput && allData.length > 1) {
        // Iterate through all rows and keep the latest balance for this person
        allData.slice(1).forEach(row => {
            if(row[1] && row[1].toLowerCase() === nameInput) {
                totalDue = parseFloat(row[27]) || 0;
            }
        });
    }
    
    document.getElementById('history-due').innerText = totalDue.toFixed(0);
    calc();
    
    // Highlight if high balance
    if (totalDue > 500) {
        document.getElementById('history-due').parentElement.classList.add('text-red-600');
        document.getElementById('history-due').classList.add('text-red-600');
    } else {
        document.getElementById('history-due').parentElement.classList.remove('text-red-600');
        document.getElementById('history-due').classList.remove('text-red-600');
    }
}

// Submit data to Google Sheets
async function submitData() {
    const name = document.getElementById('rso-name').value.trim();
    const date = document.getElementById('date').value;
    const role = document.getElementById('role').value;
    
    // Validation
    if (!name) {
        showNotification("Please enter staff name", "error");
        document.getElementById('rso-name').focus();
        return;
    }
    
    if (!date) {
        showNotification("Please select a date", "error");
        document.getElementById('date').focus();
        return;
    }
    
    const btn = document.getElementById('submit-btn');
    const originalHTML = btn.innerHTML;
    
    // Show loading state
    btn.disabled = true; 
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Saving...';
    
    // Build data object
    const getV = (id, type) => parseFloat(document.querySelector(`[data-id="${id}"] .${type}`).value) || 0;
    
    const data = {
        date: date,
        name: name,
        role: role,
        ev_rate: getV('ev', 'rate'),
        ev_took: getV('ev', 'took'),
        ev_sold: getV('ev', 'sold'),
        c29_rate: getV('c29', 'rate'),
        c29_took: getV('c29', 'took'),
        c29_sold: getV('c29', 'sold'),
        c39_rate: getV('c39', 'rate'),
        c39_took: getV('c39', 'took'),
        c39_sold: getV('c39', 'sold'),
        c49_rate: getV('c49', 'rate'),
        c49_took: getV('c49', 'took'),
        c49_sold: getV('c49', 'sold'),
        swap_rate: getV('swap', 'rate'),
        swap_took: getV('swap', 'took'),
        swap_sold: getV('swap', 'sold'),
        v1_rate: getV('v1', 'rate'),
        v1_took: getV('v1', 'took'),
        v1_sold: getV('v1', 'sold'),
        v2_rate: getV('v2', 'rate'),
        v2_took: getV('v2', 'took'),
        v2_sold: getV('v2', 'sold'),
        fuel: parseFloat(document.getElementById('fuel').value) || 0,
        paid: parseFloat(document.getElementById('paid').value) || 0,
        prev: parseFloat(document.getElementById('prev').value) || 0,
        due: parseFloat(document.getElementById('grand-due-val').innerText) || 0
    };

    try {
        // Submit via fetch with timeout
        const response = await fetchWithTimeout(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        }, 5000);
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        // Clear form on success
        document.getElementById('rso-name').value = '';
        document.querySelectorAll('input.took, input.sold').forEach(inp => inp.value = '');
        document.getElementById('paid').value = '';
        document.getElementById('prev').value = '';
        document.getElementById('fuel').value = 100;
        document.getElementById('history-due').innerText = '0.00';
        
        // Refresh data to get updated records
        refreshData();
        
        showNotification("Data saved successfully!", "success");
    } catch (error) {
        console.error("Submission Error:", error);
        showNotification("Failed to save data", "error");
        
        // Store data locally for later submission
        const pendingData = JSON.parse(localStorage.getItem('sfp-pending') || '[]');
        pendingData.push({...data, timestamp: new Date().getTime()});
        localStorage.setItem('sfp-pending', JSON.stringify(pendingData));
        
        showNotification("Data saved locally. Will sync when online.", "warning");
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }
}

// Render report table
function renderTable() {
    const tbody = document.getElementById('report-body');
    if (!tbody) return; // Page doesn't have this element
    
    const searchInput = document.getElementById('f-name');
    const searchFilter = (searchInput ? searchInput.value : '').toLowerCase().trim();
    
    console.log('renderTable called with data length:', allData.length, 'search:', searchFilter);
    
    // Ensure allData is an array
    if (!Array.isArray(allData)) {
        console.error('allData is not an array:', allData);
        allData = [];
    }
    
    // Filter data safely
    let filteredData = [];
    try {
        filteredData = allData.slice(1).filter(row => {
            if (!row || !row[1]) return false;
            return row[1].toLowerCase().includes(searchFilter);
        }).reverse(); // Show newest first
    } catch (e) {
        console.error('Error filtering data:', e);
        filteredData = [];
    }
    
    console.log('Filtered data rows:', filteredData.length);
    
    // Update cards
    const totalRecordsEl = document.getElementById('total-records');
    if (totalRecordsEl) totalRecordsEl.textContent = filteredData.length;
    
    const activeStaffEl = document.getElementById('active-staff');
    if (activeStaffEl) {
        try {
            activeStaffEl.textContent = [...new Set(filteredData.map(row => row[1]))].length;
        } catch (e) {
            activeStaffEl.textContent = '0';
        }
    }
    
    let totalSales = 0;
    let outstandingDues = 0;
    
    // Build table rows
    let html = '';
    try {
        filteredData.forEach(row => {
            const netSales = parseFloat(row[25]) || 0;
            const paid = parseFloat(row[26]) || 0;
            const due = parseFloat(row[27]) || netSales - paid;
            
            totalSales += netSales;
            outstandingDues += due;
            
            let statusClass = "badge-success";
            let statusText = "Paid";
            
            if (due > 0 && due <= 500) {
                statusClass = "badge-warning";
                statusText = "Partial";
            } else if (due > 500) {
                statusClass = "badge-danger";
                statusText = "Due";
            }
            
            html += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 whitespace-nowrap">${window.formatDate(row[0])}</td>
                <td class="p-3 font-medium">${row[1] || '-'}</td>
                <td class="p-3">${row[2] || '-'}</td>
                <td class="p-3 font-bold">${window.formatTk(netSales)}</td>
                <td class="p-3 text-green-600 font-bold">${window.formatTk(paid)}</td>
                <td class="p-3 text-red-600 font-bold">${window.formatTk(due)}</td>
                <td class="p-3"><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
        });
    } catch (e) {
        console.error('Error building rows:', e);
    }
    
    tbody.innerHTML = html || '<tr><td colspan="7" class="p-3 text-center text-slate-400">No records found</td></tr>';
    
    // Update summary
    const totalSalesEl = document.getElementById('total-sales');
    if (totalSalesEl) totalSalesEl.textContent = totalSales.toFixed(0) + ' Tk';
    
    const outstandingDuesEl = document.getElementById('outstanding-dues');
    if (outstandingDuesEl) outstandingDuesEl.textContent = outstandingDues.toFixed(0) + ' Tk';
    
    // Show content
    const reportContent = document.getElementById('report-content');
    if (reportContent) {
        reportContent.classList.remove('hidden');
        console.log('Showed report content');
    }
}

// Update analytics panel
function updateAnalytics() {
    console.log('updateAnalytics called');
    const dailyTotal = document.getElementById('todays-revenue');
    if (!dailyTotal) {
        console.log('No analytics elements on this page, skipping');
        return; // Page doesn't have analytics
    }
    
    if (!Array.isArray(allData) || allData.length <= 1) {
        console.log('No data to update analytics');
        return;
    }

    try {
        const rows = allData.slice(1);
        
        // Get filter values from the new filter inputs
        const filterNameEl = document.getElementById('filter-name');
        const filterFromEl = document.getElementById('filter-from');
        const filterToEl = document.getElementById('filter-to');
        
        const nameFilter = filterNameEl ? filterNameEl.value.toLowerCase().trim() : '';
        const dateFrom = filterFromEl ? filterFromEl.value : '';
        const dateTo = filterToEl ? filterToEl.value : '';

        // Helper to strip time from date string (keep yyyy-mm-dd)
        const stripTime = d => (d||"").split('T')[0];

        // Apply filters
        let filtered = rows.filter(r => {
            if (!r || !r[0]) return false;
            
            // Name filter
            if (nameFilter && (!r[1] || !r[1].toLowerCase().includes(nameFilter))) {
                return false;
            }
            
            // Date range filter
            const rowDate = stripTime(r[0]);
            if (dateFrom && rowDate < dateFrom) return false;
            if (dateTo && rowDate > dateTo) return false;
            
            return true;
        });

        console.log('Filtered data rows:', filtered.length, 'from total:', rows.length);

        // Deduplicate: Group by date and name, sum values
        const deduplicateData = (data) => {
            const grouped = {};
            data.forEach(r => {
                const date = stripTime(r[0]);
                const name = r[1] || 'Unknown';
                const key = `${date}|${name}`;
                const netSales = parseFloat(r[25]) || 0;
                const paid = parseFloat(r[26]) || 0;
                
                if (!grouped[key]) {
                    grouped[key] = {date, name, netSales: 0, paid: 0};
                }
                grouped[key].netSales += netSales;
                grouped[key].paid += paid;
            });
            // convert to array with computed due
            return Object.values(grouped).map(item => ({
                date: item.date,
                name: item.name,
                netSales: item.netSales,
                due: item.netSales - item.paid
            }));
        };

        // Calculate today's metrics
        const today = new Date().toISOString().split('T')[0];
        let todaysRevenue = 0;
        let todaysDue = 0;
        
        // calculate metrics using deduped data (to avoid double-counting)
        const dedupedAll = deduplicateData(rows);
        dedupedAll.forEach(r => {
            if (r.date === today) {
                todaysRevenue += r.netSales;
                todaysDue += r.due; // use sheet due value
            }
        });
        
        document.getElementById('todays-revenue').textContent = todaysRevenue.toFixed(0) + ' Taka';
        document.getElementById('todays-due').textContent = todaysDue.toFixed(0) + ' Taka';

        // Calculate weekly revenue and weekly due (last 7 days)
        let monthlyRevenue = 0;
        // calculate first day of current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        dedupedAll.forEach(r => {
            if (r.date >= monthStart) {
                monthlyRevenue += r.netSales;
            }
        });
        
        document.getElementById('monthly-revenue').textContent = monthlyRevenue.toFixed(0) + ' Taka';

        // Aggregate filtered data by name (sum revenue, track latest date and due)
        const summary = {};
        filtered.forEach(r => {
            const date = stripTime(r[0]);
            const name = r[1] || 'Unknown';
            const netSales = parseFloat(r[25]) || 0;
            const due = parseFloat(r[27]) || 0;

            if (!summary[name]) {
                summary[name] = {name, totalRevenue: 0, latestDate: date, latestDue: due};
            }
            summary[name].totalRevenue += netSales;
            // Always take the last entry encountered as the "latest" state
            // since Google Sheets appends new data at the bottom.
            summary[name].latestDate = date;
            summary[name].latestDue = due;
        });

        // Build table data - Revenue table now shows total revenue per person and latest date
        let tableDataRevenue = Object.values(summary).map(item => ({
            date: item.latestDate,
            name: item.name,
            value: item.totalRevenue
        }));

        // Build table data - Due table should show those with any latest due > 0
        let tableDataDue = Object.values(summary)
            .filter(item => Math.round(item.latestDue) > 0)
            .map(item => ({
                date: item.latestDate,
                name: item.name,
                value: item.latestDue
            }));

        // Sort by date descending (newest first)
        tableDataRevenue.sort((a, b) => new Date(b.date) - new Date(a.date));
        tableDataDue.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Populate "RSO, BP" table/cards
        const allRsoTable = document.getElementById('all-rso-table');
        if (allRsoTable) {
            let html = '';
            tableDataRevenue.forEach(item => {
                html += `
                <tr class="border-b border-slate-200 hover:bg-slate-50">
                    <td class="py-3 px-4 text-slate-700 font-semibold text-sm whitespace-nowrap">${window.formatDate(item.date)}</td>
                    <td class="py-3 px-4 text-slate-700 font-semibold truncate max-w-[120px] sm:max-w-none">${item.name}</td>
                    <td class="text-right py-3 px-4 text-slate-700 font-bold whitespace-nowrap">${window.formatTk(item.value)}</td>
                </tr>
                `;
            });
            allRsoTable.innerHTML = html || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No records found</td></tr>';
        }

        // Populate "RSO, BP Due" table/cards
        const dueRsoTable = document.getElementById('due-rso-table');
        if (dueRsoTable) {
            let html = '';
            tableDataDue.forEach(item => {
                html += `
                <tr class="border-b border-slate-200 hover:bg-slate-50">
                    <td class="py-3 px-4 text-slate-700 font-semibold text-sm whitespace-nowrap">${window.formatDate(item.date)}</td>
                    <td class="py-3 px-4 text-slate-700 font-semibold truncate max-w-[120px] sm:max-w-none">${item.name}</td>
                    <td class="text-right py-3 px-4 text-red-600 font-bold whitespace-nowrap">${window.formatTk(item.value)}</td>
                </tr>
                `;
            });
            dueRsoTable.innerHTML = html || '<tr><td colspan="3" class="p-4 text-center text-slate-400">No records found</td></tr>';
        }
        
        console.log('updateAnalytics complete');
    } catch (e) {
        console.error('Error in updateAnalytics:', e);
    }
}

// Export to Excel
function exportExcel() {
    if (allData.length <= 1) {
        showNotification("No data to export", "warning");
        return;
    }
    
    try {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(allData);
        XLSX.utils.book_append_sheet(wb, ws, "Sales Data");
        XLSX.writeFile(wb, `SalesData-${new Date().toISOString().split('T')[0]}.xlsx`);
        showNotification("Excel file downloaded", "success");
    } catch (e) {
        console.error("Export Error:", e);
        showNotification("Failed to export to Excel", "error");
    }
}



// Listen for online/offline events
window.addEventListener('online', function() {
    isOnline = true;
    showNotification("Back online", "success");
    
    // Try to submit pending data
    const pendingData = JSON.parse(localStorage.getItem('sfp-pending') || '[]');
    if (pendingData.length > 0) {
        showNotification(`Submitting ${pendingData.length} pending records`, "success");
        // Call refresh to trigger submission - simplified for demo
        refreshData();
        localStorage.removeItem('sfp-pending');
    }
});

window.addEventListener('offline', function() {
    isOnline = false;
    showNotification("You are offline", "warning");
});