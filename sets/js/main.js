/**
 * main.js
 * Логіка інтерфейсу парсера формул алгебри множин.
 */

let varCount = 1;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTVWXYZ";
let direction       = "";
let mouseDownOffset = null;

function CopyToClipboard(id) {
  const tmp   = document.createElement("input");
  const focus = document.activeElement;
  tmp.value   = document.getElementById(id).value;
  document.body.appendChild(tmp);
  tmp.select();
  document.execCommand("copy");
  document.body.removeChild(tmp);
  focus.focus();
}

function EventPreventDefault(event) {
  event.preventDefault();
}

document.addEventListener("DOMContentLoaded", () => {
  const formula                  = document.getElementById("formula");
  const result                   = document.getElementById("result");
  const variables                = document.getElementById("variables");
  const buttonBackspace          = document.getElementById("buttonBackspace");
  const buttonClear              = document.getElementById("buttonClear");
  const buttonAddNewVariable     = document.getElementById("buttonAddNewVariable");
  const buttonRemoveLastVariable = document.getElementById("buttonRemoveLastVariable");
  const buttonCalculate          = document.getElementById("buttonCalculate");
  const buttonCopyFormula        = document.getElementById("buttonCopyFormula");

  renderSetInputs();
  formula.focus();

  // ── Копіювання формули ──────────────────────────────────────────────────────
  if (buttonCopyFormula) {
    buttonCopyFormula.addEventListener("click", () => {
      buttonCopyFormula.style.visibility = "hidden";
      CopyToClipboard("formula");
      setTimeout(() => { buttonCopyFormula.style.visibility = "visible"; }, 100);
    });
  }

  // ── Визначення напряму виділення мишею ─────────────────────────────────────
  function getDirection(e) {
    if (e.type === "mousedown") mouseDownOffset = e.clientX;
    else if (e.type === "mouseup") direction = e.clientX < mouseDownOffset ? "left" : "right";
  }

  // ── Фіксація позиції курсора на межі токена ─────────────────────────────────
  function fixPosition() {
    if (direction === "right") {
      formula.selectionStart = formula.selectionEnd;
      if (formula.selectionStart === 0) return;
      formula.removeEventListener("select", fixPosition);
      while (
        formula.value[formula.selectionStart - 1] !== " " &&
        formula.selectionStart < formula.value.length
      ) {
        formula.selectionEnd   = formula.selectionEnd + 1;
        formula.selectionStart = formula.selectionEnd;
      }
      formula.addEventListener("select", fixPosition);
    } else {
      formula.selectionEnd = formula.selectionStart;
      if (formula.selectionStart === 0) return;
      formula.removeEventListener("select", fixPosition);
      if (formula.value[formula.selectionStart] === " ") {
        formula.selectionStart = formula.selectionStart + 1;
        formula.selectionEnd   = formula.selectionStart;
        formula.addEventListener("select", fixPosition);
        return;
      }
      while (
        formula.selectionStart > 0 &&
        formula.value[formula.selectionStart - 1] !== " "
      ) {
        formula.selectionStart = formula.selectionStart - 1;
        formula.selectionEnd   = formula.selectionStart;
      }
      formula.addEventListener("select", fixPosition);
    }
  }

  formula.addEventListener("keydown", EventPreventDefault);
  formula.setAttribute("readonly", "true");
  formula.addEventListener("mousedown", (e) => getDirection(e));
  formula.addEventListener("mouseup",   (e) => getDirection(e));
  formula.addEventListener("click",     fixPosition);
  formula.addEventListener("select",    fixPosition);

  // ── Backspace ──────────────────────────────────────────────────────────────
  function Backspace() {
    result.innerHTML = "";
    formula.removeEventListener("select", fixPosition);
    do {
      if (formula.selectionStart !== 0) {
        formula.setRangeText("", formula.selectionStart - 1, formula.selectionEnd, "start");
      }
      formula.focus();
    } while (
      formula.selectionStart !== 0 &&
      formula.value[formula.selectionStart - 1] !== " "
    );
    setTimeout(() => { formula.addEventListener("select", fixPosition); }, 10);
    updateRemoveVarButton();
  }

  buttonBackspace.addEventListener("click", Backspace);

  // ── Очищення ───────────────────────────────────────────────────────────────
  function Clear() {
    result.innerHTML = "";
    formula.value    = "";
    formula.focus();
    updateRemoveVarButton();
  }

  buttonClear.addEventListener("click", Clear);

  // ── Кнопки операторів і дужок ──────────────────────────────────────────────
  document.querySelectorAll(".btn.normal").forEach((item) => {
    item.addEventListener("click", () => AddInput(item.value));
  });

  function AddInput(s) {
    result.innerHTML = "";
    const tmp = formula.selectionStart;
    formula.value =
      formula.value.substring(0, tmp) +
      s.trim() + " " +
      formula.value.substring(tmp, formula.value.length);
    formula.selectionStart = formula.selectionEnd = tmp + s.length + 1;
    formula.focus();
    updateRemoveVarButton();
  }

  // ── Керування кнопкою видалення змінної ────────────────────────────────────
  function isVarUsedInFormula(varName) {
    return formula.value.split(" ").some(t => t.trim() === varName);
  }

  function updateRemoveVarButton() {
    const lastVar = LETTERS[varCount - 1];
    const used    = isVarUsedInFormula(lastVar);
    const isOnly  = varCount === 1;

    if (isOnly) {
      buttonRemoveLastVariable.disabled = true;
      buttonRemoveLastVariable.title    = "Не можна видалити єдину змінну";
      buttonRemoveLastVariable.classList.add("btn-disabled");
    } else if (used) {
      buttonRemoveLastVariable.disabled = true;
      buttonRemoveLastVariable.title    = lastVar + " використовується у формулі";
      buttonRemoveLastVariable.classList.add("btn-disabled");
    } else {
      buttonRemoveLastVariable.disabled = false;
      buttonRemoveLastVariable.title    = "Видалити останню змінну";
      buttonRemoveLastVariable.classList.remove("btn-disabled");
    }
  }

  formula.addEventListener("input", updateRemoveVarButton);

  // ── Керування змінними ─────────────────────────────────────────────────────
  function AddNewVariable() {
    if (varCount >= LETTERS.length) return;
    const name = LETTERS[varCount];
    const btn  = document.createElement("button");
    btn.className   = "btn normal";
    btn.value       = name;
    btn.id          = "varBtn_" + name;
    btn.title       = name;
    btn.textContent = name;
    variables.appendChild(btn);
    btn.addEventListener("click", () => AddInput(btn.value));
    varCount++;
    renderSetInputs();
    formula.focus();
    updateRemoveVarButton();
  }

  function RemoveLastVariable() {
    const lastVar = LETTERS[varCount - 1];
    if (isVarUsedInFormula(lastVar)) {
      buttonRemoveLastVariable.classList.add("btn-error-flash");
      setTimeout(() => buttonRemoveLastVariable.classList.remove("btn-error-flash"), 600);
      return;
    }
    if (varCount === 1) return;
    const varBtn = document.getElementById("varBtn_" + lastVar);
    if (varBtn) variables.removeChild(varBtn);
    varCount--;
    renderSetInputs();
    formula.focus();
    updateRemoveVarButton();
  }

  buttonAddNewVariable.addEventListener("click",     AddNewVariable);
  buttonRemoveLastVariable.addEventListener("click", RemoveLastVariable);
  updateRemoveVarButton();

  // ── ОБЧИСЛЕННЯ ─────────────────────────────────────────────────────────────
  buttonCalculate.addEventListener("click", calculate);

  function calculate() {
    const infix = formula.value.trim();

    // 1. Порожня формула
    if (!infix) {
      showError("Формула відсутня");
      return;
    }

    // 2. Зчитуємо U (може бути порожньою)
    const rawU = document.getElementById("setU").value;
    let U;
    try {
      U = parseSet(rawU);
    } catch (e) {
      showError("Некоректний вміст U");
      return;
    }

    // 3. Зчитуємо змінні A, B, …
    const uSet = new Set(U);
    const env  = { "U": U, "∅": [] };
    const rows = document.querySelectorAll("#varSetInputs .set-row");

    for (let i = 0; i < rows.length; i++) {
      const name  = LETTERS[i];
      const input = rows[i].querySelector(".set-input");
      const raw   = input ? input.value.trim() : "";
      let s;
      try {
        s = parseSet(raw);
      } catch (e) {
        showError("Некоректний вміст множини " + name);
        return;
      }
      // Перевірка A ⊆ U — тільки якщо U непорожня
      if (U.length > 0) {
        const outsideU = s.filter(x => !uSet.has(x));
        if (outsideU.length > 0) {
          showError("Множина " + name + " не є підмножиною U");
          return;
        }
      }
      env[name] = s;
    }

    // 4. Shunting-Yard
    let rpn;
    try {
      rpn = shuntingYard(infix);
    } catch (e) {
      showError(e.message);
      return;
    }

    // 5. Побудова таблиці
    let html;
    try {
      html = buildResultTable(rpn, varCount, env);
    } catch (e) {
      showError(e.message);
      return;
    }

    result.innerHTML = html;
    console.log("Infix:", infix, "| RPN:", rpn);
  }

  function showError(msg) {
    result.innerHTML =
      "<p style='display:inline-block;margin-top:16px;padding:12px 20px;" +
      "background:#ffeaea;border:2px solid #e74c3c;border-radius:8px;" +
      "color:#c0392b;font-family:Arial,sans-serif;font-size:1em;text-align:left;max-width:420px'>" +
      "<b>Помилка:</b> " + msg + "</p>";
  }
});

/* ── Генерація полів вводу множин ─────────────────────────────────────────── */
function renderSetInputs() {
  const container = document.getElementById("varSetInputs");
  if (!container) return;

  const saved = {};
  container.querySelectorAll(".set-row").forEach((row, i) => {
    const inp = row.querySelector(".set-input");
    if (inp) saved[LETTERS[i]] = inp.value;
  });

  container.innerHTML = "";

  for (let i = 0; i < varCount; i++) {
    const name = LETTERS[i];
    const row  = document.createElement("div");
    row.className = "set-row";
    row.innerHTML =
      '<label class="set-label"><b>' + name + '</b> =</label>' +
      '<span class="set-brace">{</span>' +
      '<input type="text" class="set-input" id="setVar_' + name + '"' +
      '       value="' + (saved[name] !== undefined ? saved[name] : "") + '">' +
      '<span class="set-brace">}</span>';
    container.appendChild(row);
  }
}
