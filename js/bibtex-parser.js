
/**
 * Lightweight BibTeX Parser
 * Parses .bib files into JavaScript objects
 */
function parseBibtex(bibtexText) {
    const entries = [];
    const entryRegex = /@(\w+)\s*\{\s*([^,]+)\s*,\s*([\s\S]*?)\n\s*\}/g;
    const fieldRegex = /(\w+)\s*=\s*\{([\s\S]*?)\}(?=\s*,\s*\w+\s*=|\s*\n\s*\})/g;
    
    let match;
    while ((match = entryRegex.exec(bibtexText)) !== null) {
        const type = match[1].toLowerCase();
        const key = match[2].trim();
        const body = match[3];
        
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
            citations: '0',
            abstract: ''
        };
        
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(body)) !== null) {
            const field = fieldMatch[1].trim().toLowerCase();
            let value = fieldMatch[2].trim();
            // Clean up nested braces
            value = value.replace(/\{([^{}]*)\}/g, '$1');
            entry[field] = value;
        }
        
        entries.push(entry);
    }
    
    return entries;
}

function formatAuthors(authorString, highlightName = 'Pandey') {
    if (!authorString) return '';
    const authors = authorString.split(/\s+and\s+/i);
    
    return authors.map(author => {
        const isHighlighted = author.includes(highlightName);
        const cleanAuthor = author.trim().replace(/\s+/g, ' ');
        return isHighlighted 
            ? `<span class="highlight">${cleanAuthor}</span>` 
            : cleanAuthor;
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
    const venue = getVenue(entry);
    const citations = parseInt(entry.citations) || 0;
    const hasPdf = entry.pdf && entry.pdf.trim() !== '';
    const hasCode = entry.code && entry.code.trim() !== '';
    
    return `
        <article class="publication" data-category="${category}" data-title="${entry.title}">
            <div class="pub-header">
                <div class="pub-badges">
                    <span class="pub-badge ${category}">${category === 'journal' ? 'Journal' : category === 'conference' ? 'Conference' : category === 'book' ? 'Book Chapter' : 'Preprint'}</span>
                </div>
                <span class="pub-year">${entry.year}</span>
            </div>
            <h3 class="pub-title">${entry.title}</h3>
            <p class="pub-authors">${formatAuthors(entry.author)}</p>
            <p class="pub-venue">${venue}</p>
            ${entry.abstract ? `<p class="pub-abstract">${entry.abstract}</p>` : ''}
            <div class="pub-actions">
                ${hasPdf ? `<a href="${entry.pdf}" class="pub-btn primary" target="_blank">📄 PDF</a>` : `<span class="pub-btn primary" style="opacity:0.5;cursor:default">📄 PDF</span>`}
                ${entry.doi ? `<a href="https://doi.org/${entry.doi}" class="pub-btn" target="_blank">🔗 DOI</a>` : ''}
                ${hasCode ? `<a href="${entry.code}" class="pub-btn" target="_blank">💻 Code</a>` : ''}
                <button class="pub-btn" onclick="showBibtex('${entry.key}')">📋 BibTeX</button>
            </div>
            <div class="pub-metrics">
                <span>📈 ${citations} citation${citations !== 1 ? 's' : ''}</span>
            </div>
        </article>
    `;
}
