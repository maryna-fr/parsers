
Array.prototype.peek = function () {
  return this[this.length - 1];
};

// operators set
const operators = {
  "!": 1, "|": 1, "↓": 1,
  "∧": 1, "∨": 1, "⊕": 1,
  "⟶": 1, "~": 1
};

// associations (left / right) sets
const leftAssoc  = { "|": 1, "↓": 1, "∧": 1, "∨": 1, "⊕": 1, "⟶": 1, "~": 1 };
const rightAssoc = { "!": 1 };

/**
 * precedenceOf
 *
 * precedence   operators       associativity
 * 1            ∧               left to right  (найвищий пріоритет)
 * 2            ∨               left to right
 * 3            !               right to left  (унарне заперечення)
 * …            |  ↓  ⊕  ⟶  ~  left to right  (нижчий пріоритет)
 */
const precedenceOf = {
  "!": 3,
  "∧": 2,
  "|": 1,
  "↓": 1,
  "∨": 1,
  "⊕": 1,
  "⟶": 1,
  "~": 1
};

/**
 * shuntingYard
 * @param {string} string — вираз в інфіксній формі (токени розділені пробілами)
 * @returns {string} — вираз в постфіксній формі (RPN), токени розділені пробілами
 */
function shuntingYard(string) {
  if (!string || !string.trim()) {
    throw new Error("Некоректна формула");
  }

  // Перевірка: лише оператор без операндів
  const trimmed = string.trim();
  const onlyOps = trimmed.split(/\s+/).every(t => t in operators);
  if (onlyOps) {
    throw new Error("Некоректна формула");
  }

  let tokens = string.split(" ").filter(t => t !== "");

  // Нормалізація: постфіксне '!' (X1 !) → префіксне (! X1)
  // Якщо '!' стоїть після операнду або ')' — переставляємо його перед операндом/групою.
  // Обробляємо справа наліво, щоб коректно обробити ланцюжки: X1 ! !
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 1; k < tokens.length; k++) {
      const prev = tokens[k - 1];
      const prevIsOperand = !(prev in operators) && prev !== "(" && prev !== ")";
      if (tokens[k] === "!" && (prevIsOperand || prev === ")")) {
        // Знайти початок операнду або дужкової групи зліва
        if (prevIsOperand) {
          // Простий операнд: переставляємо ! перед ним
          tokens.splice(k, 1);       // видаляємо ! з позиції k
          tokens.splice(k - 1, 0, "!"); // вставляємо ! перед операндом
        } else {
          // prev === ')': знаходимо відповідну '(' і ставимо ! перед нею
          let depth = 0, start = k - 1;
          while (start >= 0) {
            if (tokens[start] === ")") depth++;
            else if (tokens[start] === "(") { depth--; if (depth === 0) break; }
            start--;
          }
          tokens.splice(k, 1);
          tokens.splice(start, 0, "!");
        }
        changed = true;
        break;
      }
    }
  }

  // Перевірка структури: операнд або ')' не може йти після операнду або ')'
  // без бінарного оператора між ними.
  for (let k = 0; k < tokens.length - 1; k++) {
    const cur  = tokens[k];
    const next = tokens[k + 1];
    const curIsOperand  = !(cur  in operators) && cur  !== "(" && cur  !== ")";
    const nextIsOperand = !(next in operators) && next !== "(" && next !== ")";
    const curIsClose    = cur  === ")";
    // Після операнду або ')' НЕ може іти: операнд, '(' — але може іти бінарний оператор
    if ((curIsOperand || curIsClose) && (nextIsOperand || next === "("))
      throw new Error("Некоректна формула");
    // Після операнду НЕ може іти '!' (після нормалізації це означає помилку типу X1 ! X2)
    if (curIsOperand && next === "!")
      throw new Error("Некоректна формула");
  }

  let output = [];
  let stack  = [];

  for (let k = 0; k < tokens.length; k++) {
    const ch = tokens[k];

    if (ch === "") continue;

    // якщо токен — змінна або константа (не оператор і не дужка)
    if (!(ch in operators) && ch !== "(" && ch !== ")") {
      output.push(ch);
      continue;
    }

    // якщо токен — оператор op1
    else if (ch in operators) {
      const op1 = ch;

      while (stack.length > 0) {
        const op2 = stack.peek();

        if (op2 in operators && (
          (op1 in leftAssoc  && precedenceOf[op1] <= precedenceOf[op2]) ||
          (op1 in rightAssoc && precedenceOf[op1] <  precedenceOf[op2])
        )) {
          output.push(stack.pop());
        } else {
          break;
        }
      }

      stack.push(op1);
    }

    // ліва дужка — кладемо в стек
    else if (ch === "(") {
      stack.push(ch);
    }

    // права дужка — вивантажуємо стек до лівої дужки
    else if (ch === ")") {
      let foundLeftParen = false;

      while (stack.length > 0) {
        const c = stack.pop();
        if (c === "(") { foundLeftParen = true; break; }
        else { output.push(c); }
      }

      if (!foundLeftParen) {
        throw new Error("Некоректна формула");
      }
    }

    else {
      throw new Error("Невідомий символ у формулі: «" + ch + "».");
    }
  }

  // виштовхуємо залишок стека у вихід
  while (stack.length > 0) {
    const c = stack.pop();
    if (c === "(" || c === ")") throw new Error("Некоректна формула");
    output.push(c);
  }

  if (output.length === 0) {
    throw new Error("Некоректна формула");
  }

  return output.join(" ");
}
