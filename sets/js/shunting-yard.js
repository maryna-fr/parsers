/**
 * shunting-yard.js
 * Перетворює інфіксний вираз алгебри множин у постфіксну форму (RPN).
 *
 * Оператори:
 *   !   — доповнення (унарний префіксний, правоасоціативний)
 *   ∩   — перетин
 *   \   — різниця
 *   ∪   — об'єднання
 *   △   — симетрична різниця
 *
 * Пріоритети (вищий = виконується першим):
 *   !  → 5   (правоасоціативний)
 *   ∩  → 4
 *   \  → 3
 *   △  → 2
 *   ∪  → 1
 */

Array.prototype.peek = function () {
  return this[this.length - 1];
};


const setOperators = { "!": 5, "∩": 4, "\\": 3, "△": 2, "∪": 1 };

const setLeftAssoc  = { "∩": 4, "\\": 3, "△": 2, "∪": 1 };
const setRightAssoc = { "!": 5 };

const setPrecedence = {
  "!":  5,
  "∩":  4,
  "\\": 3,
  "△":  2,
  "∪":  1
};

/**
 * shuntingYard
 * @param {string} expr — інфіксний вираз (токени розділені пробілами)
 * @returns {string}    — постфіксний вираз (токени розділені пробілами)
 */
function shuntingYard(expr) {
  if (!expr || !expr.trim()) throw new Error("Формула відсутня");

  let tokens = expr.trim().split(/\s+/).filter(t => t !== "");

  // ── Нормалізація постфіксного '!' у префіксне ──────────────────────────────
  // Якщо '!' стоїть після операнду або ')' — переставляємо перед ним/групою.
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 1; k < tokens.length; k++) {
      const prev          = tokens[k - 1];
      const prevIsOperand = !(prev in setOperators) && prev !== "(" && prev !== ")";
      if (tokens[k] === "!" && (prevIsOperand || prev === ")")) {
        if (prevIsOperand) {
          tokens.splice(k, 1);
          tokens.splice(k - 1, 0, "!");
        } else {
          // знаходимо відповідну "("
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

  // ── Базова перевірка структури ─────────────────────────────────────────────
  for (let k = 0; k < tokens.length - 1; k++) {
    const cur  = tokens[k];
    const next = tokens[k + 1];
    const curIsOperand  = !(cur  in setOperators) && cur  !== "(" && cur  !== ")";
    const nextIsOperand = !(next in setOperators) && next !== "(" && next !== ")";
    if ((curIsOperand || cur === ")") && (nextIsOperand || next === "("))
      throw new Error("Некоректна формула: пропущено оператор");
    if (curIsOperand && next === "!")
      throw new Error("Некоректна формула");
  }

  // ── Алгоритм сортувальної станції ─────────────────────────────────────────
  const output = [];
  const stack  = [];

  for (const ch of tokens) {
    if (ch === "") continue;

    if (!(ch in setOperators) && ch !== "(" && ch !== ")") {
      // операнд: змінна (A,B,…), U або ∅
      output.push(ch);
      continue;
    }

    if (ch in setOperators) {
      while (stack.length > 0) {
        const top = stack.peek();
        if (
          top in setOperators && (
            (ch in setLeftAssoc  && setPrecedence[ch] <= setPrecedence[top]) ||
            (ch in setRightAssoc && setPrecedence[ch] <  setPrecedence[top])
          )
        ) {
          output.push(stack.pop());
        } else { break; }
      }
      stack.push(ch);
      continue;
    }

    if (ch === "(") { stack.push(ch); continue; }

    if (ch === ")") {
      let found = false;
      while (stack.length > 0) {
        const c = stack.pop();
        if (c === "(") { found = true; break; }
        output.push(c);
      }
      if (!found) throw new Error("Некоректна формула");
      continue;
    }

    throw new Error("Невідомий символ: «" + ch + "»");
  }

  while (stack.length > 0) {
    const c = stack.pop();
    if (c === "(" || c === ")") throw new Error("Некоректна формула");
    output.push(c);
  }

  if (output.length === 0) throw new Error("Некоректна формула");

  return output.join(" ");
}
