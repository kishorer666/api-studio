// Append a new entry to project-history.md with current system time in EST (AM/PM)
// Usage: npm run add-history -- "Title" "- Bullet 1" "- Bullet 2"

const fs = require('fs');
const path = require('path');

function toEstAmPm(now) {
  // Convert to EST (UTC-5) without DST handling (assumes system timezone already EST). For robustness, use Intl.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  const parts = fmt.formatToParts(now).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  // parts: month/day/year, hour:minute, dayPeriod
  const mm = parts.month; const dd = parts.day; const yyyy = parts.year;
  const hour = parts.hour; const minute = parts.minute; const ampm = (parts.dayPeriod || '').toUpperCase();
  // Convert to desired format: YYYY-MM-DD H:MM AM/PM EST
  const iso = `${yyyy}-${mm}-${dd}`;
  return `${iso} ${hour}:${minute} ${ampm} EST`;
}

function main() {
  const args = process.argv.slice(2);
  const title = args[0] || 'Update';
  const bullets = args.slice(1);
  const when = toEstAmPm(new Date());
  const file = path.join(process.cwd(), 'project-history.md');
  const entryLines = [];
  entryLines.push(`\n## ${when}`);
  entryLines.push(`- ${title}`);
  for (const b of bullets) {
    entryLines.push(`${b.startsWith('-') ? b : '- ' + b}`);
  }
  entryLines.push('');
  const content = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, content + entryLines.join('\n'), 'utf8');
  console.log(`Appended project history entry at ${when}`);
}

main();
