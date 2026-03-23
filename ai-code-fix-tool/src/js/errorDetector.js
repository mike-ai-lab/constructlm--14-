// Error detection with cascade prevention
import { log, escapeHtml } from './logger.js';

export function detectAllErrors(code) {
  const errors = [];
  const seenErrorSignatures = new Set();
  const errorCountByLine = new Map(); // Track errors per line
  let workingCode = code;
  let safetyCounter = 0;
  const MAX_ITERATIONS = 25;
  const MAX_ERRORS_PER_LINE = 2; // Stop if we see more than 2 errors on same line
  
  while (safetyCounter < MAX_ITERATIONS) {
    try {
      // Try with TypeScript preset first, fallback to React only
      try {
        Babel.transform(workingCode, { presets: ['typescript', 'react'] });
      } catch (tsError) {
        Babel.transform(workingCode, { presets: ['react'] });
      }
      break;
    } catch (e) {
      const errorMsg = e.message;
      const firstLine = errorMsg.split('\n')[0];
      const lineMatch = errorMsg.match(/\((\d+):(\d+)\)/);
      
      if (!lineMatch) {
        if (!seenErrorSignatures.has(firstLine)) {
          errors.push({ message: errorMsg, line: 0, column: 0 });
        }
        break;
      }
      
      const line = parseInt(lineMatch[1]);
      const col = parseInt(lineMatch[2]);
      const signature = `${line}:${col}:${firstLine}`;
      
      // If we've already seen this exact error, we're in a loop - stop
      if (seenErrorSignatures.has(signature)) {
        log(`Duplicate error detected at line ${line}:${col}, stopping to prevent infinite loop`, 'warning');
        break;
      }
      seenErrorSignatures.add(signature);
      
      // Track errors per line
      const lineErrorCount = errorCountByLine.get(line) || 0;
      errorCountByLine.set(line, lineErrorCount + 1);
      
      // CASCADE DETECTION: If we see more than 2 errors on the same line, it's a cascade
      if (lineErrorCount >= MAX_ERRORS_PER_LINE) {
        log(`CASCADE DETECTED: Line ${line} has ${lineErrorCount + 1} errors - this is a parser cascade`, 'warning');
        log('Stopping error detection to avoid reporting fake errors', 'info');
        break;
      }
      
      // Record this error
      errors.push({ message: errorMsg, line, column: col });
      
      const lines = workingCode.split('\n');
      const errorLine = lines[line - 1];
      if (!errorLine) break;
      
      let fixed = false;
      
      // Strategy: Try to minimally fix this error to find the next one
      
      // 1. Missing closing parenthesis - MOST COMMON
      if (errorMsg.includes('expected ")"') || (errorMsg.includes('expected ","') && errorLine.includes('('))) {
        // Find the position and add closing paren
        const openParens = (errorLine.substring(0, col).match(/\(/g) || []).length;
        const closeParens = (errorLine.substring(0, col).match(/\)/g) || []).length;
        if (openParens > closeParens) {
          lines[line - 1] = errorLine.substring(0, col) + ')' + errorLine.substring(col);
          fixed = true;
          log(`Fixed missing ) on line ${line}`, 'debug');
        }
      }
      
      // 2. JSX closing tag mismatch - COMMON CASCADE TRIGGER
      if (!fixed && (errorMsg.includes('Expected corresponding JSX closing tag') || errorMsg.includes('jsxTagEnd'))) {
        // This is likely a cascade - just comment out the line
        lines[line - 1] = '// ' + errorLine;
        fixed = true;
        log(`Commented out JSX error on line ${line} (likely cascade)`, 'debug');
      }
      
      // 3. Missing closing brace
      if (!fixed && errorMsg.includes('expected "}"')) {
        lines[line - 1] = errorLine.substring(0, col) + '}' + errorLine.substring(col);
        fixed = true;
        log(`Fixed missing } on line ${line}`, 'debug');
      }
      
      // 4. Missing closing bracket
      if (!fixed && errorMsg.includes('expected "]"')) {
        lines[line - 1] = errorLine.substring(0, col) + ']' + errorLine.substring(col);
        fixed = true;
        log(`Fixed missing ] on line ${line}`, 'debug');
      }
      
      // 5. Missing semicolon
      if (!fixed && errorMsg.includes('expected ";"')) {
        lines[line - 1] = errorLine + ';';
        fixed = true;
        log(`Fixed missing ; on line ${line}`, 'debug');
      }
      
      // 6. TypeScript type annotations
      if (!fixed && errorMsg.includes('expected ","') && errorLine.includes(':')) {
        lines[line - 1] = errorLine.replace(/:\s*[A-Za-z.<>[\]]+(?=\s*[)=,{])/g, '');
        fixed = true;
        log(`Removed type annotation on line ${line}`, 'debug');
      }
      
      // Last resort: comment out the problematic line to continue
      if (!fixed) {
        lines[line - 1] = '// ' + errorLine;
        log(`Commented out line ${line} as last resort`, 'debug');
      }
      
      workingCode = lines.join('\n');
      safetyCounter++;
    }
  }
  
  log(`Error detection complete: ${errors.length} error(s) found (including cascades)`, 'info');
  
  // Filter out obvious cascades (same line, same error type, multiple times)
  const uniqueErrors = [];
  const lineErrorTypes = new Map();
  
  for (const error of errors) {
    const errorType = error.message.split('\n')[0];
    const key = `${error.line}:${errorType}`;
    const count = lineErrorTypes.get(key) || 0;
    
    // Only keep first 2 errors of same type on same line
    if (count < 2) {
      uniqueErrors.push(error);
      lineErrorTypes.set(key, count + 1);
    }
  }
  
  if (uniqueErrors.length < errors.length) {
    log(`Filtered out ${errors.length - uniqueErrors.length} cascade errors`, 'info');
  }
  
  return uniqueErrors;
}

export function displayErrors(errors) {
  // Errors are now only shown in the console, not in an overlay
  // This function is kept for compatibility but does nothing
}