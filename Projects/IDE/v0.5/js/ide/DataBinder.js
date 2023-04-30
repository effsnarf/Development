let DataBinder = function() {
    this.eval = async function(contexts, expression)
    {
        if ((!expression)) return null;
        
        if (!contexts) contexts = [];

        let script = [];

        for (context of contexts)
        {
            for (e of Object.entries(context.data))
            {
                script.push(`let ${e[0]} = ${JSON.stringify(e[1])};`);
            }
        }

        if (!expression.includes(`return`)) expression = (`return (${expression});`);
        
        script.push(expression);

        let func = eval(`(async () => { ${script.join(`\n`)} })`);

        let result = (await func());

        return result;
    };

    this.getCssStyle = function(styleNode) {
      let style = {};

      if (styleNode.type == `ui.style.shadow`)
      {
        style.boxShadow = `${styleNode.x}px ${styleNode.y}px ${styleNode.blur}px black`;
        style.filter = `drop-shadow(${style.boxShadow})`;
      }

      return style;
    }
}



var myExports = DataBinder;

if (typeof exports !== "undefined") {
  if (typeof module !== "undefined" && module.exports) {
    exports = module.exports = myExports;
  }
}

if (typeof window != `undefined`) {
  window.DataBinder = DataBinder;
}

