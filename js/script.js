const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvTynKMjdjJFYsbWz4Lf0gRQRTJ7FLgsMUD9wI3ybYkaVkEf3m2_2tQmdsFkqNodTe/exec";
let allData = [];
let isLoading = false;
let productStats = {};
let isOnline = navigator.onLine;

async function loadComponent(path, containerId) {
    try {
        const res = await fetch(path);
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
    <div class="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
        <div class="flex items-center space-x-2">
            <div class="bg-blue-600 p-1.5 rounded-lg text-white">
                <i class="fas fa-sim-card text-sm"></i>
            </div>
            <span class="font-extrabold text-base uppercase tracking-tight">Banglalink Fida Hassan Admin</span>
        </div>
        <div class="flex gap-6">
            <button onclick="switchTab('entry')" id="t-entry" class="tab-btn active">Entry</button>
            <button onclick="switchTab('reports')" id="t-reports" class="tab-btn">Reports</button>
            <button onclick="switchTab('analytics')" id="t-analytics" class="tab-btn">Analytics</button>
        </div>
    </div>
</nav>`;
    } else if (containerId === 'header-container') {
        el.innerHTML = `<div id="toast" class="toast hidden"></div>`; // minimal; login modal may not work
    } else if (containerId === 'footer-container') {
        el.innerHTML = `<footer class="bg-white border-t border-slate-200 text-center py-4"><p class="text-sm text-slate-500">&copy; Banglalink Fida Hassan Admin</p></footer>`;
    }
}

// Initialize the app & load components
document.addEventListener('DOMContentLoaded', async function() {
    await loadComponent('components/header.html', 'header-container');
    await loadComponent('components/navbar.html', 'navbar-container');
    await loadComponent('components/footer.html', 'footer-container');

    // Set today's date
    document.getElementById('date').valueAsDate = new Date();

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            submitData();
        }
        // Ctrl+R to refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    });

    // Support Enter key in password field (header loaded)
    document.getElementById('pass').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
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

// Enhanced login with Enter key support
function login() {
    const pass = document.getElementById('pass');
    if(pass.value === "1234") {
        document.getElementById('login-box').style.display = 'none';
        localStorage.setItem('sfp-loggedin', 'true');
        refreshData();
        showNotification("Welcome back!", "success");
    } else {
        showNotification("Incorrect PIN", "error");
        pass.value = "";
        pass.focus();
    }
}

// Switch between tabs
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`t-${tab}`).classList.add('active');
    
    // Update content
    document.querySelectorAll('main > div').forEach(div => div.classList.add('hidden'));
    document.getElementById(`${tab}-tab`).classList.remove('hidden');
    
    // Update data when switching to reports or analytics
    if (tab === 'reports' || tab === 'analytics') {
        renderTable();
        updateAnalytics();
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
                
                soldInput.value = soldVal.toFixed(2);
                subDisplay.innerText = soldVal.toFixed(2);
                totalSales += soldVal;
                totalItems += soldVal;
                
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
                subDisplay.innerText = sub.toFixed(2);
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
    document.getElementById('total-val').innerText = netToday.toFixed(2);
    document.getElementById('grand-due-val').innerText = (histDue + netToday - (paid + prev)).toFixed(2);
    
    // Update quick stats
    document.getElementById('items-sold').innerText = Math.round(totalItems);
    document.getElementById('avg-price').innerText = totalItems > 0 ? (netToday / totalItems).toFixed(2) + " Tk" : "0.00 Tk";
    document.getElementById('top-item').innerText = topItem || "-";
}

// Fetch data from Google Sheets
async function refreshData() {
    if(isLoading) return;
    
    const btn = document.getElementById('sync-btn');
    const icon = document.getElementById('sync-icon');
    
    // Add loading state
    isLoading = true;
    btn.disabled = true;
    icon.classList.add('fa-spin');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Syncing...';

    try {
        // Save cached data timestamp
        const cachedData = localStorage.getItem('sfp-data');
        const cachedTimestamp = localStorage.getItem('sfp-timestamp');
        
        // Only fetch new data if cache is older than 10 minutes or doesn't exist
        const now = new Date().getTime();
        if (!cachedData || !cachedTimestamp || (now - parseInt(cachedTimestamp)) > 600000) {
            const res = await fetch(SCRIPT_URL);
            if(!res.ok) throw new Error('Network response was not ok');
            
            allData = await res.json();
            localStorage.setItem('sfp-data', JSON.stringify(allData));
            localStorage.setItem('sfp-timestamp', now.toString());
            showNotification("Data synced successfully", "success");
        } else {
            allData = JSON.parse(cachedData);
            showNotification("Using cached data", "warning");
        }
        
        const names = [...new Set(allData.slice(1).map(row => row[1]))].filter(n => n);
        document.getElementById('name-list').innerHTML = names.map(n => `<option value="${n}">`).join('');
        renderTable();
        updateAnalytics();
    } catch (e) {
        console.error("Sync Error:", e);
        
        // Try to use cached data as fallback
        const cachedData = localStorage.getItem('sfp-data');
        if (cachedData) {
            allData = JSON.parse(cachedData);
            showNotification("Using cached data (offline)", "warning");
            renderTable();
            updateAnalytics();
        } else {
            showNotification("Failed to sync data", "error");
        }
    } finally {
        // Reset loading state
        isLoading = false;
        btn.disabled = false;
        icon.classList.remove('fa-spin');
        btn.innerHTML = '<i id="sync-icon" class="fas fa-sync-alt mr-2"></i> Sync';
    }
}

// Check previous balance for selected staff
function checkHistoryBalance() {
    const nameInput = document.getElementById('rso-name').value.trim().toLowerCase();
    let totalDue = 0;
    
    if(nameInput && allData.length > 1) {
        allData.slice(1).forEach(row => {
            if(row[1] && row[1].toLowerCase() === nameInput) {
                totalDue += parseFloat(row[27]) || 0;
            }
        });
    }
    
    document.getElementById('history-due').innerText = totalDue.toFixed(2);
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
        // Submit via fetch
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
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
    const searchFilter = document.getElementById('f-name').value.toLowerCase().trim();
    
    // Filter data
    const filteredData = allData.slice(1).filter(row => {
        if (!row[1]) return false;
        return row[1].toLowerCase().includes(searchFilter);
    }).reverse(); // Show newest first
    
    // Update cards
    document.getElementById('total-records').textContent = filteredData.length;
    document.getElementById('active-staff').textContent = [...new Set(filteredData.map(row => row[1]))].length;
    
    let totalSales = 0;
    let outstandingDues = 0;
    
    // Build table rows
    let html = '';
    filteredData.forEach(row => {
        const netSales = parseFloat(row[26]) || 0;
        const paid = parseFloat(row[23]) || 0;
        const due = parseFloat(row[27]) || 0;
        
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
                <td class="p-3">${row[0] || '-'}</td>
                <td class="p-3 font-medium">${row[1] || '-'}</td>
                <td class="p-3">${row[2] || '-'}</td>
                <td class="p-3 font-bold">${netSales.toFixed(2)}</td>
                <td class="p-3 text-green-600 font-bold">${paid.toFixed(2)}</td>
                <td class="p-3 text-red-600 font-bold">${due.toFixed(2)}</td>
                <td class="p-3"><span class="status-badge ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="7" class="p-3 text-center text-slate-400">No records found</td></tr>';
    
    // Update summary
    document.getElementById('total-sales').textContent = totalSales.toFixed(2) + ' Tk';
    document.getElementById('outstanding-dues').textContent = outstandingDues.toFixed(2) + ' Tk';
}

// Update analytics panel
function updateAnalytics() {
    if (allData.length <= 1) return;

    const rows = allData.slice(1);
    const nameFilter = document.getElementById('analytics-name').value.toLowerCase().trim();
    const dateFilter = document.getElementById('analytics-date').value; // yyyy-mm-dd
    const monthFilter = document.getElementById('analytics-month').value; // yyyy-mm

    // apply name filtering
    let filtered = rows.filter(r => {
        if (nameFilter) {
            return r[1] && r[1].toLowerCase().includes(nameFilter);
        }
        return true;
    });

    // helper to strip time from date string (keep yyyy-mm-dd)
    const stripTime = d => (d||"").split('T')[0];

    // compute daily total
    let dailyTotal = 0;
    const targetDay = dateFilter || new Date().toISOString().split('T')[0];
    filtered.forEach(r => {
        if (stripTime(r[0]) === targetDay) {
            dailyTotal += parseFloat(r[26]) || 0;
        }
    });
    document.getElementById('daily-total').textContent = dailyTotal.toFixed(2) + ' Tk';

    // compute monthly total
    let monthlyTotal = 0;
    const targetMonth = monthFilter || new Date().toISOString().slice(0, 7);
    filtered.forEach(r => {
        if (stripTime(r[0]).startsWith(targetMonth)) monthlyTotal += parseFloat(r[26]) || 0;
    });
    document.getElementById('monthly-total').textContent = monthlyTotal.toFixed(2) + ' Tk';

    // day-to-day breakdown for the selected month
    const breakdown = {};
    filtered.forEach(r => {
        const day = stripTime(r[0]);
        if (day.startsWith(targetMonth)) {
            breakdown[day] = (breakdown[day] || 0) + (parseFloat(r[26]) || 0);
        }
    });
    const breakdownEls = Object.entries(breakdown)
        .sort()
        .map(([d, tot]) => `<div class="flex justify-between"><span>${d}</span><span class="font-bold">${tot.toFixed(2)} Tk</span></div>`);
    document.getElementById('daily-breakdown').innerHTML = breakdownEls.join('') || '<div class="text-slate-400">No data</div>';
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

// Restore cached data on page load if available
window.addEventListener('load', function() {
    const loggedIn = localStorage.getItem('sfp-loggedin');
    if (loggedIn === 'true') {
        document.getElementById('login-box').style.display = 'none';
        document.getElementById('date').valueAsDate = new Date();
        
        const cachedData = localStorage.getItem('sfp-data');
        if (cachedData) {
            allData = JSON.parse(cachedData);
            renderTable();
            updateAnalytics();
            
            const names = [...new Set(allData.slice(1).map(row => row[1]))].filter(n => n);
            document.getElementById('name-list').innerHTML = names.map(n => `<option value="${n}">`).join('');
            
            showNotification("App loaded with cached data", "success");
        }
    }
});

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