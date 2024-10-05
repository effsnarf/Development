var fonts = JSON.parse(document.body.innerText);

fonts.items
    .map(f => ({ family: f.family, subset: f.subsets[0] }))
    .filter(f => (f.subset == 'latin'))
    .map(f => f.family)
    .slice(0, 100)

