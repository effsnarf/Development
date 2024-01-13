const sheakspearize = async (text) => {
    
    const data = await (await fetch("https://db.memegenerator.net/shakespearize", {
        "body": JSON.stringify({ text }),
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
    })).json();

    return data.shakespearized;
}