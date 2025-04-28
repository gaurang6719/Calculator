let input = "";
let result = 0;

const calculationElement = document.getElementById("calculation");
const resultElement = document.getElementById("result");
const errorElement = document.getElementById("error-message");

// Update input display only
function updateInputDisplay() {
  calculationElement.innerText = input === "" ? "0" : input;
  errorElement.innerText = "";
}

// Update full display including result
function updateFullDisplay() {
  calculationElement.innerText = input === "" ? "0" : input;
  resultElement.innerText = result;
  errorElement.innerText = "";
}

// Add value to input
function addToInput(value) {
  if (input.endsWith("=")) {
    if ("+-*/%".includes(value)) {
      input = result.toString();
    } else {
      input = "";
    }
  }

  const operators = "+-*/%";
  const lastChar = input.slice(-1);
  const secondLastChar = input.slice(-2, -1);

  if (operators.includes(value)) {
    if (input === "" && value !== "-") {
      showError("Expression cannot start with operator.");
      return;
    }

    if (operators.includes(lastChar)) {
      if (
        !(
          value === "-" &&
          !["-"].includes(lastChar) &&
          !operators.includes(secondLastChar)
        )
      ) {
        showError("Invalid consecutive operators.");
        return;
      }
    }

    if (input === "-" && value !== "-") {
      showError("Invalid operator position.");
      return;
    }
  }

  // Check for multiple decimal points
  if (value === ".") {
    let i = input.length - 1;
    while (i >= 0 && !operators.includes(input[i])) {
      if (input[i] === ".") {
        showError("Multiple decimal points not allowed in a number.");
        return;
      }
      i--;
    }
    if (lastChar === "") {
      input += "0";
    }
  }

  // Check for number length
  if ((value >= "0" && value <= "9") || value === ".") {
    let numberSegments = input.split(/[\+\-\*\/%\(\)]/);
    let lastNumber = numberSegments[numberSegments.length - 1];

    let digitCount = lastNumber.replace(/[^0-9]/g, "").length;

    if (digitCount >= 12) {
      showError("Each number is limited to 12 digits.");
      return;
    }
  }

  input += value;
  updateInputDisplay();
}

// Clear input
function clearAll() {
  input = "";
  result = 0;
  updateFullDisplay();
}

// Backspace
function backspace() {
  if (input.endsWith("=")) {
    input = "";
  } else {
    input = input.slice(0, -1);
  }
  updateInputDisplay();
}

// Show error
function showError(message) {
  errorElement.innerText = message;
  setTimeout(() => {
    errorElement.innerText = "";
  }, 3000);
}

function toggleSign() {
  if (input.endsWith("=")) {
    input = "";
    updateFullDisplay();
    return;
  }

  // Regex to find last number in input
  let match = input.match(/(-?\d*\.?\d+)(?!.*\d)/);

  if (match) {
    let number = match[0];
    let startIdx = match.index;
    let negatedNumber;

    if (number.startsWith("-")) {
      // If already negative, remove the minus
      negatedNumber = number.substring(1);
    } else {
      negatedNumber = "-" + number;
    }

    // Replace last number with negated number
    input = input.substring(0, startIdx) + negatedNumber;

    updateInputDisplay();
  } else {
    showError("No number to toggle sign.");
  }
}

// Operator precedence
function precedence(op) {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/" || op === "%") return 2;
  return 0;
}

// Apply operation
function applyOp(a, b, op) {
  a = parseFloat(a);
  b = parseFloat(b);
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      if (b === 0) throw new Error("Division by zero is not possible");
      return a / b;
  }
}

function isNumberChar(ch) {
  return (ch >= "0" && ch <= "9") || ch === ".";
}

// Main calculate function
function calculate() {
  try {
    if (!checkParenthesesBalance(input)) {
      throw new Error("Mismatched parentheses.");
    }

    let values = []; // Stack to hold numbers
    let ops = []; // Stack to hold operators
    let i = 0;

    while (i < input.length) {
      let ch = input[i];

      if (ch === " ") {
        i++;
        continue;
      }

      // Handle implicit multiplication
      if (
        (ch === "(" && (isNumberChar(input[i - 1]) || input[i - 1] === ")")) ||
        (isNumberChar(ch) && input[i - 1] === ")")
      ) {
        ops.push("*");
      }

      // Handle negative numbers
      if (ch === "-" && (i === 0 || "+-*/(".includes(input[i - 1]))) {
        let val = "-";
        i++;
        while (
          i < input.length &&
          ((input[i] >= "0" && input[i] <= "9") || input[i] === ".")
        ) {
          val += input[i++];
        }
        if (input[i] === "%") {
          val = (parseFloat(val) / 100).toString();
          i++;
        }
        values.push(parseFloat(val));
      }

      // Handle parenthesis
      else if (ch === "(") {
        ops.push(ch);
        i++;
      }

      // Handle numbers and decimal
      else if ((ch >= "0" && ch <= "9") || ch === ".") {
        let val = "";
        while (
          i < input.length &&
          ((input[i] >= "0" && input[i] <= "9") || input[i] === ".")
        ) {
          val += input[i++];
        }
        if (input[i] === "%") {
          val = (parseFloat(val) / 100).toString();
          i++;
        }
        values.push(parseFloat(val));
      }

      // Handle closing parenthesis
      else if (ch === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") {
          let b = values.pop();
          let a = values.pop();
          let op = ops.pop();
          values.push(applyOp(a, b, op));
        }
        ops.pop(); // Pop the '('
        i++;
      }

      // Handle operators
      else if ("+-*/".includes(ch)) {
        while (
          ops.length &&
          precedence(ops[ops.length - 1]) >= precedence(ch)
        ) {
          let b = values.pop();
          let a = values.pop();
          let op = ops.pop();
          values.push(applyOp(a, b, op));
        }
        ops.push(ch);
        i++;
      } else {
        throw new Error("Invalid character: " + ch);
      }
    }

    // Final calculation
    while (ops.length) {
      let b = values.pop();
      let a = values.pop();
      let op = ops.pop();
      values.push(applyOp(a, b, op));
    }

    // Final result
    result = values.pop();
    if (result % 1 !== 0) {
      result = parseFloat(result.toFixed(10));
    }
    input += "=";
    updateFullDisplay();
  } catch (error) {
    showError(error.message);
  }
}

// Function to check if parentheses are balanced
function checkParenthesesBalance(expression) {
  let balance = 0;
  for (let char of expression) {
    if (char === "(") balance++;
    else if (char === ")") balance--;
    if (balance < 0) return false; 
  }
  return balance === 0; 
}

// --- Keyboard Support --- //
document.addEventListener("keydown", function (event) {
  const key = event.key;

  if ((key >= "0" && key <= "9") || key === "." || key === "(" || key === ")") {
    addToInput(key);
  } else if (["+", "-", "*", "/", "%"].includes(key)) {
    addToInput(key);
  } else if (key === "Backspace") {
    backspace();
  } else if (key === "Enter" || key === "=") {
    calculate();
  } else if (key === "Escape") {
    clearAll();
  } else {
    showError("Invalid key! Only numbers and + - * / % ( ) are allowed.");
  }
});

updateFullDisplay();
