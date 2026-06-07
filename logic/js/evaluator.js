/**
 * evaluator.js
 */

const boolOperators = {
  "!":  (x)    => 1 - x,
  "∧":  (x, y) => Math.min(x, y),
  "∨":  (x, y) => Math.max(x, y),
  "⊕":  (x, y) => Math.abs(x - y),
  "~":  (x, y) => 1 - Math.abs(x - y),
  "|":  (x, y) => 1 - Math.min(x, y),
  "↓":  (x, y) => 1 - Math.max(x, y),
  "⟶":  (x, y) => Math.max(1 - x, y)
};

const opNames = {
  "!": "!", "∧": "∧", "∨": "∨", "⊕": "⊕",
  "~": "~", "|": "|", "↓": "↓", "⟶": "⟶"
};

function evaluateSteps(numTokens) {
  let stack = [];
  let steps = [];

  numTokens.forEach((token) => {
    if (token === "") return;

    if (token in boolOperators) {
      if (token === "!") {
        const a = stack.pop();
        if (a === undefined) throw new Error("Некоректна формула");
        const res = boolOperators[token](a.val);
        const label = "!" + a.label;
        steps.push({ expr: label, result: res });
        stack.push({ val: res, label: String(res) });
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (a === undefined || b === undefined) throw new Error("Некоректна формула");
        const res = boolOperators[token](a.val, b.val);
        const label = a.label + " " + opNames[token] + " " + b.label;
        steps.push({ expr: label, result: res });
        stack.push({ val: res, label: String(res) });
      }
    } else {
      const val = parseFloat(token);
      stack.push({ val, label: token });
    }
  });

  const finalVal = stack.pop();
  return { steps, result: finalVal?.val ?? NaN };
}

/**
 * colLabel — генерує A, B, C, ... пропускаючи F
 */
function colLabel(index) {
  // Генеруємо послідовність A,B,C,D,E,G,H,... (без F)
  const letters = "ABCDEGHIJKLMNOPQRSTUVWXYZ"; // 25 літер без F
  let label = "";
  let n = index;
  do {
    label = letters[n % letters.length] + label;
    n = Math.floor(n / letters.length) - 1;
  } while (n >= 0);
  return label;
}

/**
 * getSubExpressions — повертає { full, short, label } для кожного підвиразу.
 * full  — з оригінальними іменами змінних
 * short — з літерами попередніх підвиразів
 */
function getSubExpressions(rpnTokens) {
  let fullStack  = [];
  let shortStack = [];
  let subExprs   = [];

  rpnTokens.forEach((token) => {
    if (token === "") return;

    if (token in boolOperators) {
      if (token === "!") {
        const aFull  = fullStack.pop();
        const aShort = shortStack.pop();
        if (aFull === undefined) throw new Error("Некоректна формула");
        const full  = "!" + aFull;
        const short = "!" + aShort;
        const lbl   = colLabel(subExprs.length);
        subExprs.push({ full, short, label: lbl });
        fullStack.push(full);
        shortStack.push(lbl);
      } else {
        const bFull  = fullStack.pop();
        const aFull  = fullStack.pop();
        const bShort = shortStack.pop();
        const aShort = shortStack.pop();
        if (aFull === undefined || bFull === undefined) throw new Error("Некоректна формула");
        const full  = aFull  + " " + opNames[token] + " " + bFull;
        const short = aShort + " " + opNames[token] + " " + bShort;
        const lbl   = colLabel(subExprs.length);
        subExprs.push({ full, short, label: lbl });
        fullStack.push(full);
        shortStack.push(lbl);
      }
    } else {
      fullStack.push(token);
      shortStack.push(token);
    }
  });

  // Лише один операнд без операторів
  if (subExprs.length === 0 && fullStack.length > 0) {
    subExprs.push({ full: fullStack[0], short: fullStack[0], label: null });
  }

  return subExprs;
}

function* binaryGenerator(n) {
  const total = 1 << n;
  for (let i = 0; i < total; i++) {
    yield i.toString(2).padStart(n, "0").split("").map(Number);
  }
}

/**
 * buildTruthTable
 * Стовпці: X1..Xn | X1 X2 ... Xn (окремо) | A= | B= | ... | F (жовтий)
 * Передостанній стовпець — дублікат фінального F кольору проміжних,
 * останній — жовтий F.
 */
function buildTruthTable(rpn, varCount) {
  const rpnTokens = rpn.split(" ").filter(t => t !== "");
  const subExprs  = getSubExpressions(rpnTokens);

  const last = subExprs[subExprs.length - 1];

  // Заголовок фінального виразу (скорочений або повний якщо один)
  const finalShort = last
    ? (subExprs.length === 1 ? last.full : last.short)
    : "F";

  let html = '<table class="truth-table"><thead><tr>';

  // Стовпці змінних
  for (let i = 1; i <= varCount; i++) {
    html += "<th>X" + i + "</th>";
  }

  // Проміжні стовпці (без останнього)
  for (let i = 0; i < subExprs.length - 1; i++) {
    const { short, label } = subExprs[i];
    html += "<th>" + label + " = " + short + "</th>";
  }

  // F з формулою — бірюзовий (як проміжні)
  const finalLabel = colLabel(subExprs.length - 1);
  html += "<th>" + finalLabel + " = " + finalShort + "</th>";
  
  // Жовтий F(X1, X2, ...) — дублікат
  const varList = Array.from({ length: varCount }, (_, i) => "X" + (i + 1)).join(",");
  html += '<th class="col-final">F(' + varList + ')</th>';

  html += "</tr></thead><tbody>";

  for (const set of binaryGenerator(varCount)) {
    const varMap = {};
    for (let i = 1; i <= varCount; i++) varMap["X" + i] = set[i - 1];

    const numTokens = rpnTokens.map(t => (t in varMap) ? String(varMap[t]) : t);
    const { steps, result } = evaluateSteps(numTokens);

    html += "<tr>";

    // Значення змінних
    for (let i = 1; i <= varCount; i++) {
      html += '<td class="col-var">' + varMap["X" + i] + "</td>";
    }

    // Проміжні значення (нежирні)
    for (let i = 0; i < steps.length - 1; i++) {
      const cls = steps[i].result === 1 ? "val-1" : "val-0";
      html += '<td class="' + cls + '">' + steps[i].result + "</td>";
    }

    const finalVal = steps.length > 0 ? steps[steps.length - 1].result : result;

    // F з формулою — бірюзовий (нежирний)
    const pcls = finalVal === 1 ? "val-1 col-f-plain" : "val-0 col-f-plain";
    html += '<td class="' + pcls + '">' + finalVal + "</td>";

    // F(X1,...) — жовтий, жирний
    const fcls = finalVal === 1 ? "val-1 col-final" : "val-0 col-final";
    html += '<td class="' + fcls + '"><b>' + finalVal + "</b></td>";

    html += "</tr>";
  }

  html += "</tbody></table>";
  return html;
}
