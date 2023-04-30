// Icon decorator
//
// Marks a class or a method with an icon for easy identification in the UI.
// Saves the icon in the class's prototype for future reference.
// In case of a decorator on a method, the icon is saved in the method's prototype.
//
// Usage: @icon('📦')

function icon(char: string) {
    return function (target: any, key?: string) {
        // If the decorator is on a class
        if (!key) {
            // Save the icon in the class's prototype
            target.prototype.icon = char;
        }
        // If the decorator is on a method
        else {
            // Save the icon in the method's prototype
            target[key].prototype.icon = char;
        }
    }
}
