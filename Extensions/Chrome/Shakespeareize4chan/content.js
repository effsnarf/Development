
const shakespeareize = (html, text) => {
    // Just to test, reverse the text
    return text.split('').reverse().join('');
}



const blockquotes = document.querySelectorAll('blockquote')
    .filter((blockquote) => !blockquote.classList.contains('shakespeareized'));

const quoteItems = blockquotes
    .map((bq) => bq.innerHTML);

for (const blockquote of blockquotes) {
    blockquote.classList.add('shakespeareized');
    const html = blockquote.innerHTML;
    const text = blockquote.textContent;
    const shakespeareizedHtml = shakespeareize(html, text);
    blockquote.innerHTML = shakespeareizedHtml;
}
