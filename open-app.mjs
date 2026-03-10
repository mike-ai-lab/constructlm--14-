import { spawn } from 'child_process';
import { platform } from 'os';

const url = 'http://localhost:5000';

let command;
let args = [];

if (platform() === 'win32') {
  command = 'start';
  args = [url];
} else if (platform() === 'darwin') {
  command = 'open';
  args = [url];
} else {
  command = 'xdg-open';
  args = [url];
}

console.log(`Opening ${url} in default browser...`);
spawn(command, args);
console.log('✓ Browser opened');
