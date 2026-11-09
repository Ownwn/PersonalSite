type TableAlignment = 'left' | 'center' | 'right';

// Split only unescaped pipes; a literal pipe in Markdown is written as \|.
export function splitTableRow(line: string): string[] | null {
    const cells: string[] = [];
    let cell = '';
    let hasPipe = false;
    const row = line.trim();
    for (let i = 0; i < row.length; i++) {
        if (row[i] === '\\' && i + 1 < row.length) {
            const next = row[++i];
            cell += next === '|' ? '|' : `\\${next}`;
        } else if (row[i] === '|') {
            hasPipe = true;
            cells.push(cell.trim());
            cell = '';
        } else {
            cell += row[i];
        }
    }
    cells.push(cell.trim());
    if (!hasPipe) return null;
    if (row.startsWith('|')) cells.shift();
    // A trailing escaped pipe belongs to its cell, rather than the border.
    if (cell === '' && row.endsWith('|')) cells.pop();
    return cells;
}

export function readMarkdownTable(lines: string[], start: number) {
    const headers = splitTableRow(lines[start]);
    const separator = splitTableRow(lines[start + 1] ?? '');
    if (!headers?.length || !separator || headers.length !== separator.length ||
        !separator.every(cell => /^:?-{3,}:?$/.test(cell))) return null;

    const alignments: TableAlignment[] = separator.map(cell => cell.endsWith(':')
        ? cell.startsWith(':') ? 'center' : 'right'
        : 'left');
    const rows: string[][] = [];
    let nextIndex = start + 2;
    while (nextIndex < lines.length) {
        if (lines[nextIndex].trimStart().startsWith('```')) break;
        const cells = splitTableRow(lines[nextIndex]);
        if (!cells) break;
        rows.push(headers.map((_, index) => cells[index] ?? ''));
        nextIndex++;
    }
    return {headers, alignments, rows, nextIndex};
}


export function getHeaderLine(line: string, headerCount: number, key: number) {
    let newLine;
    switch (headerCount) {
        case 1:
            newLine = <h2 key={key}>{line}</h2>;
            break;
        case 2:
            newLine = <h3 key={key}>{line}</h3>;
            break;
        case 3:
            newLine = <h4 key={key}>{line}</h4>;
            break;
        default:
            newLine = <p key={key}>{line}</p>;
            break;
    }
    return newLine;
}


export function formatHistoryTime(timestamp: number): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const time = `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}${hours < 12 ? 'am' : 'pm'}`;
    return `${time} ${date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}`;
}

export function getBoldLine(line: string) {
    const lineChunks = line.split("**");

    const formattedChunks = [];
    for (let i = 0; i < lineChunks.length; i++) {
        if (i % 2 == 0) {
            formattedChunks.push(<span key={i}>{lineChunks[i]}</span>);
        } else {
            formattedChunks.push(<strong key={i}>{lineChunks[i]}</strong>);
        }
    }

    return <>{formattedChunks}</>;
}