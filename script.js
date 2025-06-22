function getLastGeneratedDate() {
  return new Date("2025-06-20");
}

function getStoredMaxDate() {
  const stored = JSON.parse(localStorage.getItem("dailyTrackerData")) || [];
  const dates = stored.map(item => new Date(item.date.split('/').reverse().join('-')));
  return dates.length ? new Date(Math.max(...dates)) : new Date("2025-06-20");
}

// CLEAR TEST DATA
localStorage.removeItem("dailyTrackerData");

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("tracker-body");
  const storedData = JSON.parse(localStorage.getItem("dailyTrackerData")) || [];

  const header = document.querySelector("h1");

  // 📂 Previous Data Button
  const btn = document.createElement("button");
  btn.textContent = "📂 Previous Data";
  btn.style.position = "absolute";
  btn.style.top = "10px";
  btn.style.right = "5px";
  btn.style.padding = "6px 12px";
  btn.style.borderRadius = "8px";
  btn.style.border = "1px solid #888";
  btn.style.background = "rgb(255, 149, 0)";
  btn.style.cursor = "pointer";
  

  // 🔙 Back Button (initially hidden)
  const backBtn = document.createElement("button");
  backBtn.textContent = "🔙 Back";
  backBtn.style.position = "absolute";
  backBtn.style.top = "10px";
  backBtn.style.left = "20px";
  backBtn.style.padding = "6px 12px";
  backBtn.style.borderRadius = "8px";
  backBtn.style.border = "1px solid #888";
  backBtn.style.background = "orange";
  backBtn.style.cursor = "pointer";
  backBtn.style.display = "none";

  document.body.appendChild(btn);
  document.body.appendChild(backBtn);

  function getCompletedWeekDates() {
    const dates = storedData.map(d => d.date).sort((a, b) => {
      const d1 = new Date(a.split('/').reverse().join('-'));
      const d2 = new Date(b.split('/').reverse().join('-'));
      return d1 - d2;
    });

    const fullWeeks = Math.floor(dates.length / 7);
    const completed = dates.slice(0, fullWeeks * 7);
    return completed;
  }

  btn.onclick = () => {
    const validDates = getCompletedWeekDates();
    const allRows = document.querySelectorAll(".daily-row, .weekly-summary-row, .monthly-summary-row");
    if (validDates.length === 0) {
      alert("No completed history available yet.");
      return;
    }

    allRows.forEach(row => {
      const dateText = row.querySelector("td")?.textContent;
      if (row.classList.contains("daily-row")) {
        row.style.display = validDates.includes(dateText) ? "" : "none";
      } else {
        row.style.display = "";
      }
    });

    // Hide main entry rows
    document.querySelectorAll(".entry-row").forEach(r => {
      if (!r.classList.contains("daily-row")) r.style.display = "none";
    });

    header.textContent = "Previous Data";
    backBtn.style.display = "";
    btn.style.display = "none";
  };

  backBtn.onclick = () => {
    document.querySelectorAll("tr").forEach(row => row.style.display = "");
    header.textContent = "Daily Analysis Tracker";
    backBtn.style.display = "none";
    btn.style.display = "";
  };

  function saveData(entry) {
    const index = storedData.findIndex(item => item.date === entry.date);
    if (index !== -1) storedData[index] = entry;
    else storedData.push(entry);
    localStorage.setItem("dailyTrackerData", JSON.stringify(storedData));
  }

  function getDates(start, end) {
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function formatDate(date) {
    return date.toLocaleDateString("en-GB");
  }

  function getGrade(total) {
    if (total > 17) return "⭐⭐⭐";
    else if (total >= 12) return "⭐⭐";
    else if (total >= 7) return "⭐";
    else if (total >= 0) return "✅";
    else if (total >= -10) return "❌";
    else if (total >= -20) return "❌❌";
    else return "❌❌❌";
  }

  function createRow(dateVal = "") {
    const row = document.createElement("tr");
    row.classList.add("entry-row", "daily-row");
    row.innerHTML = `
      <td class="date-cell">${dateVal}</td>
      <td><input type="number" min="0" class="self" /></td>
      <td><input type="number" min="0" class="lecture" /></td>
      <td><input type="number" min="0" class="practice" /></td>
      <td><select class="wake">
        <option value="-">-</option><option value="4">4 AM</option><option value="5">5 AM</option>
        <option value="6">6 AM</option><option value="7">7 AM</option><option value="other">Other</option>
      </select></td>
      <td><select class="schedule">
        <option value="-">-</option><option value="yes">Yes</option><option value="no">No</option>
      </select></td>
      <td><input type="number" min="0" class="unused" /></td>
      <td><input type="number" min="0" class="medi" /></td>
      <td><input type="number" min="0" class="phone" /></td>
      <td><select class="ww">
        <option value="-">-</option><option value="yes">Yes</option><option value="no">No</option>
      </select></td>
      <td class="result">-</td><td class="grade">-</td><td><button class="calc-btn">Submit</button></td>
    `;
    container.appendChild(row);

    const button = row.querySelector(".calc-btn");
    const existing = storedData.find(d => d.date === dateVal);
    if (existing) {
      row.querySelector(".self").value = existing.self;
      row.querySelector(".lecture").value = existing.lecture;
      row.querySelector(".practice").value = existing.practice;
      row.querySelector(".wake").value = existing.wake;
      row.querySelector(".schedule").value = existing.schedule;
      row.querySelector(".unused").value = existing.unused;
      row.querySelector(".medi").value = existing.medi;
      row.querySelector(".phone").value = existing.phone;
      row.querySelector(".ww").value = existing.ww;
      row.querySelector(".result").textContent = existing.result;
      row.querySelector(".grade").textContent = existing.grade;
      row.querySelectorAll("input, select").forEach(el => el.disabled = true);
      button.disabled = true;
      button.textContent = "Done";
    } else {
      button.addEventListener("click", () => {
        calculate(row, dateVal);
        updateSummaries();
        row.querySelectorAll("input, select").forEach(el => el.disabled = true);
        button.disabled = true;
        button.textContent = "Done";
      });
    }
  }

  function calculate(row, dateVal) {
    const getVal = cls => row.querySelector("." + cls).value;
    const self = +getVal("self"), lecture = +getVal("lecture"), practice = +getVal("practice");
    const wake = getVal("wake"), schedule = getVal("schedule"), unused = +getVal("unused");
    const medi = +getVal("medi"), phone = +getVal("phone"), ww = getVal("ww");

    const selfPoints = self >= 6 ? 9 : self >= 3 ? 4 : self >= 1 ? 1 : 0;
    const lecturePoints = lecture * 1, practicePoints = practice * 1.5;
    const wakePoints = wake === "4" || wake === "5" ? 1 : wake === "6" || wake === "7" ? 0 : -1;
    const schedulePoints = schedule === "yes" ? 1 : -1;
    const unusedPoints = unused * -1.5, mediPoints = medi / 10, phonePoints = phone * -2;
    const wwPoints = ww === "yes" ? -5 : 0;

    const total = selfPoints + lecturePoints + practicePoints + wakePoints + schedulePoints + unusedPoints + mediPoints + phonePoints + wwPoints;

    row.querySelector(".result").textContent = total.toFixed(1);
    row.querySelector(".grade").textContent = getGrade(total);

    const entry = { date: dateVal, self, lecture, practice, wake, schedule, unused, medi, phone, ww, result: total.toFixed(1), grade: getGrade(total) };
    saveData(entry);
  }

  function updateSummaries() {
    document.querySelectorAll(".summary-row").forEach(el => el.remove());
    const rows = Array.from(document.querySelectorAll(".entry-row"));
    const summaries = [];

    for (let i = 0; i < rows.length; i += 7) {
      const weekRows = rows.slice(i, i + 7);
      const results = weekRows.map(r => parseFloat(r.querySelector(".result").textContent)).filter(v => !isNaN(v));
      if (results.length === 7) {
        const avg = results.reduce((a, b) => a + b, 0) / results.length;
        const row = document.createElement("tr");
        row.classList.add("summary-row", "weekly-summary-row");
        row.innerHTML = `<td colspan="10"><strong>Weekly Summary</strong></td><td><strong>${avg.toFixed(1)}</strong></td><td><strong>${getGrade(avg)}</strong></td><td></td>`;
        weekRows[weekRows.length - 1].after(row);
        summaries.push(avg);
      }
    }

    for (let i = 0; i < summaries.length; i += 4) {
      const monthAvgs = summaries.slice(i, i + 4);
      if (monthAvgs.length === 4) {
        const monthlyAvg = monthAvgs.reduce((a, b) => a + b, 0) / monthAvgs.length;
        const row = document.createElement("tr");
        row.classList.add("summary-row", "monthly-summary-row");
        row.innerHTML = `<td colspan="10"><strong>Monthly Summary</strong></td><td><strong>${monthlyAvg.toFixed(1)}</strong></td><td><strong>${getGrade(monthlyAvg)}</strong></td><td></td>`;
        const target = document.querySelectorAll(".summary-row")[i + 3] || container.lastElementChild;
        target.after(row);
      }
    }
  }

  const startDate = new Date("2025-04-28");
  const today = new Date();
  const lastStored = getStoredMaxDate();
  const finalDate = lastStored > today ? lastStored : today;
  const dates = getDates(startDate, finalDate);
  dates.forEach(date => createRow(formatDate(date)));

hideOldEntries(); // 👈 hides daily + weekly + monthly older than 28 days


  // Save summaries to localStorage
function storeSummaries(weekly, monthly) {
  localStorage.setItem("weeklySummaries", JSON.stringify(weekly));
  localStorage.setItem("monthlySummaries", JSON.stringify(monthly));
}

// Load and render saved summaries
function loadSummaries() {
  const weekly = JSON.parse(localStorage.getItem("weeklySummaries")) || [];
  const monthly = JSON.parse(localStorage.getItem("monthlySummaries")) || [];

  const allRows = document.querySelectorAll(".daily-row");
  const rowsArr = Array.from(allRows);

  weekly.forEach((week, i) => {
    const row = document.createElement("tr");
    row.classList.add("summary-row", "weekly-summary-row");
    row.innerHTML = `<td colspan="10"><strong>Weekly Summary</strong></td><td><strong>${week.avg}</strong></td><td><strong>${getGrade(parseFloat(week.avg))}</strong></td><td></td>`;
    const insertAfter = rowsArr[(i + 1) * 7 - 1];
    if (insertAfter) insertAfter.after(row);
  });

  monthly.forEach((month, i) => {
    const row = document.createElement("tr");
    row.classList.add("summary-row", "monthly-summary-row");
    row.innerHTML = `<td colspan="10"><strong>Monthly Summary</strong></td><td><strong>${month.avg}</strong></td><td><strong>${getGrade(parseFloat(month.avg))}</strong></td><td></td>`;
    const allWeekly = document.querySelectorAll(".weekly-summary-row");
    const insertAfter = allWeekly[(i + 1) * 4 - 1];
    if (insertAfter) insertAfter.after(row);
  });
}

// Replace your updateSummaries() function with this:
function updateSummaries() {
  document.querySelectorAll(".summary-row").forEach(el => el.remove());
  const rows = Array.from(document.querySelectorAll(".entry-row"));
  const weeklySummaries = [];

  for (let i = 0; i < rows.length; i += 7) {
    const weekRows = rows.slice(i, i + 7);
    const results = weekRows.map(r => parseFloat(r.querySelector(".result").textContent)).filter(v => !isNaN(v));
    if (results.length === 7) {
      const avg = results.reduce((a, b) => a + b, 0) / results.length;
      const row = document.createElement("tr");
      row.classList.add("summary-row", "weekly-summary-row");
      row.innerHTML = `<td colspan="10"><strong>Weekly Summary</strong></td><td><strong>${avg.toFixed(1)}</strong></td><td><strong>${getGrade(avg)}</strong></td><td></td>`;
      weekRows[weekRows.length - 1].after(row);
      weeklySummaries.push({ avg: avg.toFixed(1) });
    }
  }

  const monthlySummaries = [];
  for (let i = 0; i < weeklySummaries.length; i += 4) {
    const monthAvgs = weeklySummaries.slice(i, i + 4);
    if (monthAvgs.length === 4) {
      const monthlyAvg = monthAvgs.reduce((a, b) => a + parseFloat(b.avg), 0) / monthAvgs.length;
      const row = document.createElement("tr");
      row.classList.add("summary-row", "monthly-summary-row");
      row.innerHTML = `<td colspan="10"><strong>Monthly Summary</strong></td><td><strong>${monthlyAvg.toFixed(1)}</strong></td><td><strong>${getGrade(monthlyAvg)}</strong></td><td></td>`;
      const target = document.querySelectorAll(".weekly-summary-row")[(i + 1) * 4 - 1] || container.lastElementChild;
      target.after(row);
      monthlySummaries.push({ avg: monthlyAvg.toFixed(1) });
    }
  }
  

  storeSummaries(weeklySummaries, monthlySummaries); // 💾 Save summaries
}

// ✅ Call this just after `dates.forEach(...)`:
loadSummaries();

});

