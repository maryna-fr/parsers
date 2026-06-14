/**
 * evaluator.js — парсер алгебри множин
 */

function parseSet(str) {
  if (!str || str.trim() === "") return [];
  const items = str.split(",").map(s => s.trim()).filter(s => s !== "");
  return [...new Set(items)].sort(compareEl);
}

function compareEl(a, b) {
  const na = Number(a), nb = Number(b);
  if (!isNaN(na) && !isNaN(nb)) return na - nb;
  return String(a).localeCompare(String(b));
}

function setToStr(arr) {
  return arr.length === 0 ? "∅" : "{" + arr.join(", ") + "}";
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const setOps = {
  "!":  (a, U) => U.filter(x => !a.includes(x)).sort(compareEl),
  "∩":  (a, b) => a.filter(x =>  b.includes(x)).sort(compareEl),
  "\\": (a, b) => a.filter(x => !b.includes(x)).sort(compareEl),
  "∪":  (a, b) => [...new Set([...a, ...b])].sort(compareEl),
  "△":  (a, b) => [
    ...a.filter(x => !b.includes(x)),
    ...b.filter(x => !a.includes(x))
  ].sort(compareEl)
};

const opSymbol = { "!": "!", "∩": "∩", "\\": "\\", "∪": "∪", "△": "△" };
const ALL_OPS  = Object.keys(setOps);

function stepLabel(index) {
  return "A<sub>" + (index + 1) + "</sub>";
}

function evaluateRPN(rpnTokens, env) {
  const U     = env["U"] || [];
  const stack = [];
  const steps = [];

  for (const tok of rpnTokens) {
    if (tok === "") continue;

    if (ALL_OPS.includes(tok)) {
      if (tok === "!") {
        const a = stack.pop();
        if (a === undefined) throw new Error("Бракує операнда для «!»");
        const res       = setOps["!"](a.val, U);
        const shortExpr = "! " + a.shortLabel;
        const lbl       = stepLabel(steps.length);
        // Якщо операнд ∅ — результат відображаємо як 𝒰
        const displayResult = a.shortLabel === "∅" ? "𝒰" : null;
        steps.push({ shortExpr, result: res, displayResult });
        stack.push({ val: res, shortLabel: lbl });
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined)
          throw new Error("Бракує операнда для «" + opSymbol[tok] + "»");
        const res       = setOps[tok](a.val, b.val);
        const shortExpr = a.shortLabel + " " + opSymbol[tok] + " " + b.shortLabel;
        const lbl       = stepLabel(steps.length);
        steps.push({ shortExpr, result: res });
        stack.push({ val: res, shortLabel: lbl });
      }
    } else {
      const val = env[tok];
      if (val === undefined)
        throw new Error("Невизначена змінна: «" + tok + "»");
        stack.push({ val, shortLabel: tok === "U" ? "𝒰" : tok });
    }
  }

  if (stack.length !== 1) throw new Error("Некоректна формула");
  return { steps, finalSet: stack[0].val };
}

function buildResultTable(rpn, varCount, setEnv) {
  const rpnTokens = rpn.split(" ").filter(t => t !== "");
  const { steps, finalSet } = evaluateRPN(rpnTokens, setEnv);

  let html = '<table class="truth-table"><thead><tr>' +
             '<th>Підформула</th><th>Результат</th>' +
             '</tr></thead><tbody>';

  if (steps.length === 0) {
    html += '<tr>' +
            '<td class="col-final">' + escHtml(rpnTokens[0]) + '</td>' +
            '<td class="col-final"><b>' + escHtml(setToStr(finalSet)) + '</b></td>' +
            '</tr></tbody></table>';
    return html;
  }

  for (let i = 0; i < steps.length - 1; i++) {
    html += "<tr>" +
            "<td>" + stepLabel(i) + " = " + steps[i].shortExpr + "</td>" +
"<td>" + (steps[i].displayResult || escHtml(setToStr(steps[i].result))) + "</td>" +
            "</tr>";
  }

  const last = steps[steps.length - 1];
  html += "<tr>" +
          '<td class="col-final">' + last.shortExpr + '</td>' +
          '<td class="col-final"><b>' + (last.displayResult || escHtml(setToStr(finalSet))) + '</b></td>' +
          "</tr></tbody></table>";
  return html;
}
