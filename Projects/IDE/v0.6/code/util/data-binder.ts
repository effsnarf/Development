
class DataBinder {
    static resolve(node: any, dataItems: any[], defaultValue: any) {
        let valueToUse = (dataItems[0]);
        if (!valueToUse) return defaultValue;

        try {
            let expr = node.dtb?.expr;

            expr = `(${expr})`;

            let func = eval(expr);

            // Call the data binding expression function with the data item,
            // and the parent data items (for nested data bindings)
            let result = func(valueToUse, dataItems.slice(1));

            return result;
        }
        catch (ex) {
            console.warn(ex);
            return defaultValue;
        }
    }
}

export { DataBinder }
