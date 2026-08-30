/**
 * Lightweight BibTeX Parser
 * Parses .bib files into JavaScript objects
 */
function parseBibtex(bibtexText) {
    const entries = [];
    // Entry regex: find @type{key, body}
    const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)\n?\s*\}/g;
    // Field regex: supports both { ... } and "..." values
    const fieldRegex = /(\w+)\s*=\s*(?:\{([\s\S]*?)\}|"([\s\S]*?)")(?:\s*,\s*|\s*$)/g;

    let match;
    while ((match = entryRegex.exec(bibtexText)) !== null) {
        const type = (match[1] || '').toLowerCase();
        const key = (match[2] || '').trim();
        const body = match[3] || '';

        const entry = {
            type: type,
            key: key,
            title: '',
            author: '',
            journal: '',
            booktitle: '',
            year: '',
            volume: '',
            number: '',
            pages: '',
            publisher: '',
            doi: '',
            citations: 0,
            abstract: ''
        };

        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(body)) !== null) {
            const field = (fieldMatch[1] || '').trim().toLowerCase();
            // value is in group 2 (braces) or group 3 (quotes)
            let value = (fieldMatch[2] !== undefined && fieldMatch[2] !== null) ? fieldMatch[2] : fieldMatch[3] || '';
            value = value.trim();
            // Remove only outermost matching braces or quotes, keep inner braces intact
            if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('"') && value.endsWith('"'))) {
                value = value.substring(1, value.length - 1).trim();
            }

            // Normalize citations to number
            if (field === 'citations') {
                entry.citations = parseInt(value, 10) || 0;
            } else {
                entry[field] = value;
            }
        }

        entries.push(entry);
    }

    return entries;
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatAuthors(authorString, highlightName = 'Pandey') {
    if (!authorString) return '';
    const authors = authorString.split(/\s+and\s+/i);

    return authors.map(author => {
        const cleanAuthor = author.trim().replace(/\s+/g, ' ');
        const safeAuthor = escapeHtml(cleanAuthor);
        const isHighlighted = cleanAuthor.includes(highlightName);
        return isHighlighted
            ? `<span class="highlight">${safeAuthor}</span>`
            : safeAuthor;
    }).join(', ');
}

function getCategory(entry) {
    const type = entry.type.toLowerCase();
    if (type === 'article') return 'journal';
    if (type === 'inproceedings' || type === 'conference') return 'conference';
    if (type === 'book' || type === 'incollection') return 'book';
    if (type === 'unpublished' || type === 'misc') return 'preprint';
    return 'journal';
}

function getVenue(entry) {
    if (entry.journal) {
        let venue = entry.journal;
        if (entry.volume) venue += `, Vol. ${entry.volume}`;
        if (entry.number) venue += `, No. ${entry.number}`;
        if (entry.pages) venue += `, pp. ${entry.pages}`;
        return venue;
    }
    if (entry.booktitle) {
        let venue = entry.booktitle;
        if (entry.pages) venue += `, pp. ${entry.pages}`;
        return venue;
    }
    return '';
}

function renderPublication(entry) {
    const category = getCategory(entry);
    const venue = escapeHtml(getVenue(entry));
    const citations = Number(entry.citations) || 0;

    const safeTitle = escapeHtml(entry.title);
    const safeAuthorsHtml = formatAuthors(entry.author);
    const safeAbstract = escapeHtml(entry.abstract);
    const safeKey = escapeHtml(entry.key);

    return `
        <article class="publication" data-category="${escapeHtml(category)}" data-title="${safeTitle}">
            <div class="pub-header">
                <div class="pub-badges">
                    <span class="pub-badge ${escapeHtml(category)}">${escapeHtml(category === 'journal' ? 'Journal' : category === 'conference' ? 'Conference' : category === 'book' ? 'Book Chapter' : 'Preprint')}</span>
                </div>
                <span class="pub-year">${escapeHtml(entry.year)}</span>
            </div>
            <h3 class="pub-title">${safeTitle}</h3>
            <p class="pub-authors">${safeAuthorsHtml}</p>
            <p class="pub-venue">${venue}</p>
            ${entry.abstract ? `<p class="pub-abstract">${safeAbstract}</p>` : ''}
            <div class="pub-actions">
                ${entry.doi ? `<a href="https://doi.org/${escapeHtml(entry.doi)}" class="pub-btn" target="_blank" rel="noopener noreferrer">🔗 DOI</a>` : ''}
                <button class="pub-btn" onclick="(window.showBibtex || function(){alert('BibTeX not available')})('${safeKey}')">📋 BibTeX</button>
            </div>
            <div class="pub-metrics">
                <span>📈 ${citations} citation${citations !== 1 ? 's' : ''}</span>
            </div>
        </article>
    `;
}
