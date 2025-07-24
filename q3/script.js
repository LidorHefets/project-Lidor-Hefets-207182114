
let requests = [];
let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("spellForm");
  const messages = document.getElementById("formMessages");
  const knowledgeInput = document.getElementById("knowledge");
  const hasWandInput = document.getElementById("hasWand");

  loadItems();

  if (form) {
    const advancedField = document.createElement("div");
    advancedField.innerHTML = `
      <label for="advancedSpell">ציין סוג לחש מתקדם *</label>
      <input type="text" id="advancedSpell" name="advancedSpell" />
    `;
    advancedField.style.display = "none";
    form.insertBefore(advancedField, messages);

    function toggleAdvancedField() {
      const knowledge = parseInt(knowledgeInput.value);
      const hasWand = hasWandInput.value === "כן";
      advancedField.style.display = (!isNaN(knowledge) && knowledge >= 8 && hasWand) ? "block" : "none";
    }

    knowledgeInput.addEventListener("input", toggleAdvancedField);
    hasWandInput.addEventListener("change", toggleAdvancedField);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      messages.innerHTML = "";
      messages.style.color = "#d32f2f";

      const formData = getFormData();
      if (!formData) return;

      if (editingId) {
        updateItem(editingId, formData);
        editingId = null;
        localStorage.removeItem("editRequestId");
        messages.style.color = "#2e7d32";
        messages.textContent = "הבקשה עודכנה בהצלחה!";
        document.querySelector("button[type='submit']").textContent = "שלח בקשה";
      } else {
        formData.status = "ממתינה";
        saveItem(formData);
        messages.style.color = "#2e7d32";
        messages.textContent = "הבקשה נוספה בהצלחה!";
      }

      form.reset();
      toggleAdvancedField();
    });

    const editId = localStorage.getItem("editRequestId");
    if (editId) {
      editingId = parseInt(editId);
      const req = requests.find(r => r.id === editingId);
      if (req) {
        document.getElementById("fullName").value = req.fullName;
        document.getElementById("email").value = req.email;
        document.getElementById("spellType").value = req.spell;
        document.getElementById("knowledge").value = req.knowledge;
        document.getElementById("hasWand").value = req.hasWand;
        document.getElementById("attempts").value = req.attempts;
        document.getElementById("astroBirth").value = req.birth;

        toggleAdvancedField();
        if (req.advancedSpell) {
          document.getElementById("advancedSpell").value = req.advancedSpell;
        }

        document.querySelector("button[type='submit']").textContent = "שמור עדכון";
      }
    }
  }

  renderItems();
});

function getFormData() {
  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const spell = document.getElementById("spellType").value;
  const knowledge = parseInt(document.getElementById("knowledge").value);
  const hasWand = document.getElementById("hasWand").value;
  const attempts = parseInt(document.getElementById("attempts").value || 0);
  const birth = document.getElementById("astroBirth").value;
  const advancedSpell = document.getElementById("advancedSpell")?.value.trim();

  const errors = [];
  if (!fullName) errors.push("יש להזין שם מלא.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("אימייל אינו תקין.");
  if (!spell) errors.push("יש לבחור סוג לחש.");
  if (isNaN(knowledge) || knowledge < 1 || knowledge > 10) errors.push("רמת ידע חייבת להיות בין 1 ל-10.");
  if (!hasWand) errors.push("יש לציין אם יש שרביט.");
  if (attempts < 0) errors.push("מספר ניסיונות לא יכול להיות שלילי.");
  if (!birth) errors.push("יש לבחור יום לידה.");
  if (knowledge >= 8 && hasWand === "כן" && !advancedSpell) {
    errors.push("יש להזין סוג לחש מתקדם.");
  }

  if (errors.length > 0) {
    const messages = document.getElementById("formMessages");
    const ul = document.createElement("ul");
    errors.forEach(err => {
      const li = document.createElement("li");
      li.textContent = err;
      ul.appendChild(li);
    });
    messages.innerHTML = "";
    messages.appendChild(ul);
    return null;
  }

  return {
    id: Date.now(),
    fullName,
    email,
    spell,
    knowledge,
    hasWand,
    attempts,
    birth,
    advancedSpell: (knowledge >= 8 && hasWand === "כן") ? advancedSpell : null
  };
}

function saveItem(item) {
  requests.push(item);
  localStorage.setItem("requests", JSON.stringify(requests));
  renderItems();
}

function loadItems() {
  const saved = localStorage.getItem("requests");
  if (saved) {
    requests = JSON.parse(saved);
  }
}


function renderItems() {
  const container = document.getElementById("requestList");
  if (!container) return;
  container.innerHTML = "";

  requests.forEach(req => {
    const card = document.createElement("div");
    card.className = "request-card";

    // יצירת תוכן בסיסי
    card.innerHTML = `
      <h3>${req.fullName}</h3>
      <p><strong>לחש:</strong> ${req.spell}</p>
      <p><strong>רמת ידע:</strong> ${req.knowledge}</p>
      <p><strong>שרביט:</strong> ${req.hasWand}</p>
      <p><strong>ניסיונות:</strong> ${req.attempts}</p>
      ${req.advancedSpell ? `<p><strong>לחש מתקדם:</strong> ${req.advancedSpell}</p>` : ""}
      <p><strong>יום לידה:</strong> ${req.birth}</p>
      <p><strong>סטטוס:</strong> <span class="status ${req.status}">${req.status}</span></p>
    `;

    const approveBtn = document.createElement("button");
    approveBtn.textContent = " אשר";
    approveBtn.className = "btn-approve";
    approveBtn.addEventListener("click", () => setStatus(req.id, "מאושרת"));

    const rejectBtn = document.createElement("button");
    rejectBtn.textContent = " דחה";
    rejectBtn.className = "btn-reject";
    rejectBtn.addEventListener("click", () => setStatus(req.id, "נדחתה"));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = " מחק";
    deleteBtn.className = "btn-delete";
    deleteBtn.addEventListener("click", () => deleteItem(req.id));

    const editBtn = document.createElement("button");
    editBtn.textContent = "עדכן";
    editBtn.className = "btn-edit";
    editBtn.addEventListener("click", () => goToEdit(req.id));

    card.appendChild(approveBtn);
    card.appendChild(rejectBtn);
    card.appendChild(deleteBtn);
    card.appendChild(editBtn);

    container.appendChild(card);
  });

  updateStats();
}


function deleteItem(id) {
  requests = requests.filter(r => r.id !== id);
  localStorage.setItem("requests", JSON.stringify(requests));
  renderItems();
}

function goToEdit(id) {
  localStorage.setItem("editRequestId", id);
  window.location.href = "index.html";
}

function updateItem(id, updatedData) {
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    updatedData.id = id;
    updatedData.status = requests[index].status;
    requests[index] = updatedData;
    localStorage.setItem("requests", JSON.stringify(requests));
    renderItems();
  }
  
}

function setStatus(id, newStatus) {
  const req = requests.find(r => r.id === id);
  if (!req) return;
  req.status = newStatus;
  localStorage.setItem("requests", JSON.stringify(requests));
  renderItems();
}

function updateStats() {
  const total = requests.length;
  const statsElement = document.getElementById("successRate");
  const list = document.getElementById("spellCounts");

  if (!statsElement || !list) return;

  if (total === 0) {
    statsElement.textContent = "אין בקשות להצגה.";
    list.innerHTML = "";
    return;
  }

  const approved = requests.filter(r => r.status === "מאושרת").length;
  const pending = requests.filter(r => r.status === "ממתינה").length; 
  const rejected = requests.filter(r => r.status === "נדחתה").length;
  const percent = ((approved / total) * 100).toFixed(1);

  statsElement.textContent = `אחוז אישור בקשות : ${percent}% (${approved} מתוך ${total} בקשות אושרו)`;

  const pendingLine = document.createElement("p");
  pendingLine.textContent = `בקשות שממתינות לתשובה: ${pending}`;
  statsElement.appendChild(pendingLine);

  const rejectedLine = document.createElement("p");
  rejectedLine.textContent = `בקשות שנדחו: ${rejected}`;
  statsElement.appendChild(rejectedLine);

  const counts = { התקפי: 0, הגנתי: 0, חיזוק: 0 };
  requests.forEach(r => {
    if (counts[r.spell] !== undefined) counts[r.spell]++;
  });



  list.innerHTML = "";
  for (const [type, count] of Object.entries(counts)) {
    const li = document.createElement("li");
    li.textContent = `סוג לחש ${type}: ${count}  סה''כ בקשות`;
    list.appendChild(li);
  }
}


document.getElementById("LinkView")?.addEventListener("click", () => {
  window.location.href = "view.html";
});

document.getElementById("LinkIndex")?.addEventListener("click", () => {
  window.location.href = "index.html";
});