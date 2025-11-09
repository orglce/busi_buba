// Supabase config (replace with your project URL and anon key)
const SUPABASE_URL = 'https://ohcclcnjqbizebnbling.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2NsY25qcWJpemVibmJsaW5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MzAzMzcsImV4cCI6MjA3NDQwNjMzN30.GHG-bik_-3I8VbTVIF7PbF_EGCY6JCmG0XmrNV6wJFU';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility: get today in YYYY-MM-DD
function getToday() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// Fetch all sickness entries
async function fetchEntries() {
  const { data, error } = await supabase
    .from('sickness')
    .select('*')
    .order('date', { ascending: true });
  if (error) {
    console.error('Fetch error:', error);
    return [];
  }
  return data || [];
}

// Insert new entry (allow multiple per date)
async function insertEntry(entry) {
  const { data, error } = await supabase
    .from('sickness')
    .insert([entry]);
  if (error) {
    alert('Error saving entry: ' + error.message);
  }
  return data;
}

// Update entry by id
async function updateEntry(id, entry) {
  const { data, error } = await supabase
    .from('sickness')
    .update(entry)
    .eq('id', id);
  if (error) {
    alert('Error updating entry: ' + error.message);
  }
  return data;
}

// Delete entry by id
async function deleteEntry(id) {
  const { error } = await supabase
    .from('sickness')
    .delete()
    .eq('id', id);
  if (error) {
    alert('Error deleting entry: ' + error.message);
  }
}

// Render status label (if any entry for today is sick)
function renderStatus(entries) {
  const today = getToday();
  const sickToday = entries.filter(e => e.date === today && e.sick);
  const label = document.getElementById('status-label');
  if (sickToday.length > 0) {
    const types = sickToday.map(e => e.sickness_type).join(', ');
    label.style.color = '#ff0000';
    label.textContent = `Ajdo dans neki buba. Ima: ${types}`;
  } else {
    // Najdi zadnji dan bolezni pred danes
    label.style.color = '#008000';
    const sickDays = entries.filter(e => e.sick && e.date < today);
    if (sickDays.length === 0) {
      label.textContent = 'Ajda še nikoli ni bila bolna.';
    } else {
      const lastSick = sickDays[sickDays.length - 1];
      const lastDate = new Date(lastSick.date);
      const now = new Date(today);
      const diff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      dayLabel = "";
      switch (diff) {
        case 1: dayLabel = "dan"; break;
        case 2: dayLabel = "dneva"; break;
        case 3: dayLabel = "dnevi"; break;
        case 4: dayLabel = "dnevi"; break;
        default: dayLabel = "dni";
      }
      label.textContent = `${diff} ${dayLabel} od kar je Ajdo kej bubalo.`;
    }
  }
}

// Render calendar for current month
function renderCalendar(entries) {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;
  calendarEl.innerHTML = '';

  const today = getToday();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay(); // 0=Sun

  // Group entries by date
  const entryMap = {};
  entries.forEach(e => {
    if (!entryMap[e.date]) entryMap[e.date] = [];
    entryMap[e.date].push(e);
  });

  // Render weekday headers (start with Monday)
  const weekdays = ['Pon','Tor','Sre','Čet','Pet','Sob','Ned'];
  weekdays.forEach(day => {
    const th = document.createElement('div');
    th.textContent = day;
    th.style.fontWeight = 'bold';
    th.style.background = '#e0e0e0';
    th.style.borderRadius = '8px';
    th.style.margin = '0 2px 6px 2px';
    th.style.padding = '4px 0';
    calendarEl.appendChild(th);
  });

  // Calculate offset for Monday as first day
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = 0; i < offset; i++) {
    const empty = document.createElement('div');
    calendarEl.appendChild(empty);
  }

  // Render days
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().slice(0,10);
    const entriesForDay = entryMap[dateStr] || [];
    const sickCount = entriesForDay.filter(e => e.sick).length;
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    cell.textContent = day;
    if (dateStr === today) cell.classList.add('today');
    let tooltip = null;
    if (sickCount > 0) {
      cell.classList.add('sick');
      cell.style.background = `rgb(255,${180-Math.min(sickCount*40,150)},${180-Math.min(sickCount*40,150)})`;
      tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      tooltip.tabIndex = 0;
      entriesForDay.forEach(e => {
        const entryDiv = document.createElement('div');
        entryDiv.innerHTML = `<strong>${e.sickness_type}</strong><br>${e.notes ? e.notes : ''}`;
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Uredi';
        editBtn.style.fontSize = '0.8em';
        editBtn.onclick = function(ev) {
          ev.stopPropagation();
          window.location.href = `add.html?id=${e.id}`;
        };
        entryDiv.appendChild(editBtn);
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Izbriši';
        deleteBtn.style.fontSize = '0.8em';
        deleteBtn.style.marginLeft = '0.5em';
        deleteBtn.onclick = async function(ev) {
          ev.stopPropagation();
          if (confirm('Izbrišem ta vnos bolezni?')) {
            await deleteEntry(e.id);
            fetchEntries().then(entries => {
              renderStatus(entries);
              renderCalendar(entries);
            });
          }
        };
        entryDiv.appendChild(deleteBtn);
        tooltip.appendChild(entryDiv);
        tooltip.appendChild(document.createElement('hr'));
      });
      // Remove last <hr>
      if (tooltip.lastChild) tooltip.removeChild(tooltip.lastChild);
      // Add button to add another sickness for this day
      const addBtn = document.createElement('button');
      addBtn.textContent = 'Dodaj bolezen';
      addBtn.style.display = 'block';
      addBtn.style.margin = '0.5em auto';
      addBtn.onclick = function(ev) {
        ev.stopPropagation();
        window.location.href = `add.html?date=${dateStr}`;
      };
      tooltip.appendChild(addBtn);
      cell.appendChild(tooltip);
      // Prevent tooltip from hiding when clicking inside
      tooltip.onclick = (ev) => { ev.stopPropagation(); };
      // Hide tooltip when clicking outside
      document.addEventListener('click', function hideTooltip(e) {
        if (!cell.contains(e.target) && !tooltip.contains(e.target)) {
          tooltip.style.display = 'none';
        }
      }, { capture: true, once: true });
    }
    cell.onclick = (ev) => {
      ev.stopPropagation();
      document.querySelectorAll('.tooltip').forEach(t => { t.style.display = 'none'; });
      if (sickCount > 0 && tooltip) {
        tooltip.style.display = 'block';
        tooltip.focus();
        // Add a one-time event listener to close tooltip when clicking outside
        setTimeout(() => {
          function outsideClick(e) {
            if (!cell.contains(e.target) && !tooltip.contains(e.target)) {
              tooltip.style.display = 'none';
              document.removeEventListener('click', outsideClick, true);
            }
          }
          document.addEventListener('click', outsideClick, true);
        }, 0);
      } else {
        window.location.href = `add.html?date=${dateStr}`;
      }
    };
    calendarEl.appendChild(cell);
  }
}

// Edit sickness handler (redirect to add.html with id)
window.editSickness = function(id) {
  window.location.href = `add.html?id=${id}`;
}

// On index.html: fetch and render
if (document.getElementById('calendar')) {
  fetchEntries().then(entries => {
    renderStatus(entries);
    renderCalendar(entries);
  });
}

// On add.html: handle form submit and editing
const form = document.getElementById('sickness-form');
if (form) {
  // If editing, load entry
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');
  if (editId) {
    supabase.from('sickness').select('*').eq('id', editId).single().then(({data}) => {
      if (data) {
        form.elements['date'].value = data.date;
        form.elements['sickness_type'].value = data.sickness_type;
        form.elements['notes'].value = data.notes || '';
      }
    });
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    let date = fd.get('date');
    if (!date) date = getToday();
    const entry = {
      date: date,
      sick: true, // Always set sick to true for every entry
      sickness_type: fd.get('sickness_type'),
      notes: fd.get('notes'),
      created_at: new Date().toISOString()
    };
    if (editId) {
      await updateEntry(editId, entry);
    } else {
      await insertEntry(entry);
    }
    window.location.href = 'index.html';
  });
}