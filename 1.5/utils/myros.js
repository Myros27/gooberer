function getGl() {
    return Object.values(save.globalLevel).reduce((sum, value) => sum + value, 0);
}
