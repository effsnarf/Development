const sheakspearize = async (text) => {
    const url = `/95.183.1.41/shakespearize`;
    var response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text })
    });
    
    var data = await response.json();

    return data.shakespearized;
}