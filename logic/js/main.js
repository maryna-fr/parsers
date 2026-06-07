/**
 * main.js
 * Логіка інтерфейсу парсера формул функцій алгебри логіки.
 */

var direction = "";
var mouseDownOffset = null;

function CopyToClipboard(id) {
  var tmp   = document.createElement("input");
  var focus = document.activeElement;
  tmp.value = document.getElementById(id).value;
  document.body.appendChild(tmp);
  tmp.select();
  document.execCommand("copy");
  document.body.removeChild(tmp);
  focus.focus();
}

function EventPreventDefault() {
  event.preventDefault();
}

document.addEventListener("DOMContentLoaded", () => {
  const formula = document.getElementById("formula");
  const result  = document.getElementById("result");

  formula.focus();

  // ── Копіювання формули ──────────────────────────────────────────────────────
  buttonCopyFormula.addEventListener("click", () => {
    buttonCopyFormula.style.visibility = "hidden";
    CopyToClipboard("formula");
    setTimeout(() => { buttonCopyFormula.style.visibility = "visible"; }, 100);
  });

  // ── Визначення напряму виділення мишею ─────────────────────────────────────
  function getDirection(e) {
    if (e.type === "mousedown") mouseDownOffset = e.clientX;
    else if (e.type === "mouseup") direction = e.clientX < mouseDownOffset ? "left" : "right";
  }

  // ── Фіксація позиції курсора ────────────────────────────────────────────────
  function fixPosition() {
    if (direction === "right") {
      formula.selectionStart = formula.selectionEnd;
      if (formula.selectionStart === 0) return;
      formula.removeEventListener("select", fixPosition);
      while (formula.value[formula.selectionStart - 1] !== " ") {
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
      while (formula.selectionStart > 0 && formula.value[formula.selectionStart - 1] !== " ") {
        formula.selectionStart = formula.selectionStart - 1;
        formula.selectionEnd   = formula.selectionStart;
      }
      formula.addEventListener("select", fixPosition);
    }
  }

  formula.addEventListener("keydown",   EventPreventDefault);
  formula.addEventListener("mousedown", (e) => getDirection(e));
  formula.addEventListener("mouseup",   (e) => getDirection(e));
  formula.addEventListener("click",     fixPosition);
  formula.addEventListener("select",    fixPosition);

  // ── Backspace: видаляє токен зліва від курсора ─────────────────────────────
  function Backspace() {
    result.innerHTML = "";
    formula.removeEventListener("select", fixPosition);
    do {
      if (formula.selectionStart !== 0) {
        formula.setRangeText("", formula.selectionStart - 1, formula.selectionEnd, "start");
      }
      formula.focus();
    } while (formula.selectionStart !== 0 && formula.value[formula.selectionStart - 1] !== " ");
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
  document.querySelectorAll(".normal").forEach((item) => {
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

  // ── Запобіжник: перевірка використання змінної у формулі ───────────────────
  /**
   * Повертає true, якщо змінна varName (наприклад "X3") присутня у формулі.
   * Шукаємо як цілий токен, щоб X1 не знаходило X10.
   */
  function isVarUsedInFormula(varName) {
    const tokens = formula.value.split(" ");
    return tokens.some(t => t.trim() === varName);
  }

  /**
   * Оновлює стан кнопки видалення змінної:
   * — блокує, якщо остання змінна використовується у формулі
   * — показує підказку чому заблоковано
   */
  function updateRemoveVarButton() {
    const lastVar = "X" + kbz.value;
    const used    = isVarUsedInFormula(lastVar);
    const isOnly  = parseInt(kbz.value) === 1;

    if (isOnly) {
      buttonRemoveLastVariable.disabled = true;
      buttonRemoveLastVariable.title    = "Не можна видалити єдину змінну";
      buttonRemoveLastVariable.classList.add("btn-disabled");
    } else if (used) {
      buttonRemoveLastVariable.disabled = true;
      buttonRemoveLastVariable.title    = lastVar + " використовується у формулі — спочатку видаліть її звідти";
      buttonRemoveLastVariable.classList.add("btn-disabled");
      // Підсвічуємо кнопку змінної у рядку змінних
      const varBtn = document.getElementById(lastVar);
      if (varBtn) varBtn.classList.add("btn-in-use");
    } else {
      buttonRemoveLastVariable.disabled = false;
      buttonRemoveLastVariable.title    = "Видалити останню змінну";
      buttonRemoveLastVariable.classList.remove("btn-disabled");
      // Знімаємо підсвітку
      const varBtn = document.getElementById(lastVar);
      if (varBtn) varBtn.classList.remove("btn-in-use");
    }
  }

  // Оновлюємо стан кнопки при зміні формули вручну (хоч і заблокований keydown,
  // зміни можуть прийти через AddInput / Backspace — вже враховано вище)
  formula.addEventListener("input", updateRemoveVarButton);

  // ── Керування змінними ─────────────────────────────────────────────────────
  function AddNewVariable() {
    kbz.value++;
    const btn = document.createElement("button");
    btn.className         = "btn normal";
    btn.value             = "X" + kbz.value;
    btn.id                = "X" + kbz.value;
    btn.title             = "X" + kbz.value;
    btn.innerHTML         = "X" + kbz.value;
    btn.style.marginRight = "4px";
    variables.appendChild(btn);
    btn.addEventListener("click", () => AddInput(btn.value));
    formula.focus();
    updateRemoveVarButton();
  }

  function RemoveLastVariable() {
    const lastVar = "X" + kbz.value;
    if (isVarUsedInFormula(lastVar)) {
      // Другий рубіж захисту — не повинен спрацювати при правильній роботі UI,
      // але підстрахуємо: коротке flash-попередження на кнопці
      buttonRemoveLastVariable.classList.add("btn-error-flash");
      setTimeout(() => buttonRemoveLastVariable.classList.remove("btn-error-flash"), 600);
      return;
    }
    if (parseInt(kbz.value) === 1) return;

    const varBtn = document.getElementById(lastVar);
    if (varBtn) varBtn.classList.remove("btn-in-use");
    variables.removeChild(varBtn);
    kbz.value--;
    formula.focus();
    updateRemoveVarButton();
  }

  buttonAddNewVariable.addEventListener("click",     AddNewVariable);
  buttonRemoveLastVariable.addEventListener("click", RemoveLastVariable);

  // Початковий стан кнопки
  updateRemoveVarButton();

  // ── Обчислення ─────────────────────────────────────────────────────────────
  buttonCalculate.addEventListener("click", () => {
    const infix = formula.value.trim();
    if (!infix) {
      showError("Некоректна формула");
      return;
    }

    try {
      const rpn      = shuntingYard(infix);
      const varCount = parseInt(kbz.value, 10);

      console.log("Формула (infix):", infix);
      console.log("RPN (postfix):", rpn);
      result.innerHTML = buildTruthTable(rpn, varCount);
    } catch (e) {
      showError(e.message);
    }
  });

  function showError(msg) {
    result.innerHTML =
      "<p style='display:inline-block;margin-top:16px;padding:12px 20px;" +
      "background:#ffeaea;border:2px solid #e74c3c;border-radius:8px;" +
      "color:#c0392b;font-family:Arial,sans-serif;font-size:1em;text-align:left;max-width:420px'>" +
      "<b style='font-size:1.1em'>Помилка</b><br><span style='margin-top:4px;display:block'>"
      + msg + "</span></p>";
  }
});
