
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));


// eslint-disable-next-line no-extend-native
Array.prototype.distinct = function() {
    return this.filter((value, index, self) => {
        return self.indexOf(value) === index;
    });
}
